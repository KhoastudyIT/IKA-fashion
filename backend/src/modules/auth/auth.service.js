import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../../config/index.js';
import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';

// Cột user trả cho client (bỏ password), alias sang camelCase
const USER_COLS =
  `id, name, email, role, phone, address, city, is_locked AS "isLocked", created_at AS "createdAt"`;

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
}

export async function register({ name, email, password }) {
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length) throw new AppError('Email đã được đăng ký', 409);

  const hashed = await bcrypt.hash(password, 10);
  const res = await db.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, 'customer')
     RETURNING ${USER_COLS}`,
    [name, email, hashed],
  );
  const user = res.rows[0];
  return { user, token: signToken(user) };
}

export async function login({ email, password }) {
  const res = await db.query(
    `SELECT ${USER_COLS}, password FROM users WHERE email = $1`,
    [email],
  );
  const row = res.rows[0];
  if (!row) throw new AppError('Email hoặc mật khẩu không đúng', 401);
  if (row.isLocked) throw new AppError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin để được hỗ trợ.', 403);

  const valid = await bcrypt.compare(password, row.password);
  if (!valid) throw new AppError('Email hoặc mật khẩu không đúng', 401);

  const { password: _p, ...user } = row;
  return { user, token: signToken(user) };
}

export async function getMe(userId) {
  const res = await db.query(`SELECT ${USER_COLS} FROM users WHERE id = $1`, [userId]);
  if (!res.rows.length) throw new AppError('Không tìm thấy người dùng', 404);
  return res.rows[0];
}

export async function updateProfile(userId, { name, phone, address, city }) {
  const res = await db.query(
    `UPDATE users SET
       name    = COALESCE($2, name),
       phone   = COALESCE($3, phone),
       address = COALESCE($4, address),
       city    = COALESCE($5, city),
       updated_at = NOW()
     WHERE id = $1
     RETURNING ${USER_COLS}`,
    [userId, name ?? null, phone ?? null, address ?? null, city ?? null],
  );
  if (!res.rows.length) throw new AppError('Không tìm thấy người dùng', 404);
  return res.rows[0];
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const res = await db.query('SELECT password FROM users WHERE id = $1', [userId]);
  const row = res.rows[0];
  if (!row) throw new AppError('Không tìm thấy người dùng', 404);

  const valid = await bcrypt.compare(currentPassword, row.password);
  if (!valid) throw new AppError('Mật khẩu hiện tại không đúng', 400);

  if (currentPassword === newPassword) {
    throw new AppError('Mật khẩu mới phải khác mật khẩu hiện tại', 400);
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await db.query(
    'UPDATE users SET password = $2, updated_at = NOW() WHERE id = $1',
    [userId, hashed],
  );
}

// ─── Admin: quản lý người dùng ──────────────────────────────────────────────

/**
 * `role` nhận nhiều vai trò cùng lúc (schema đã tách chuỗi "staff,admin" thành
 * mảng) vì trang Nhân Viên cần cả staff lẫn admin trong một danh sách, còn
 * trang Khách Hàng chỉ lấy customer.
 */
export async function listUsers({ role: roles, page = 1, limit = 10 } = {}) {
  const params = [];
  let whereSql = '';

  if (roles?.length) {
    params.push(roles);
    whereSql = ` WHERE role = ANY($${params.length})`;
  }

  const countRes = await db.query(`SELECT COUNT(*)::int AS total FROM users${whereSql}`, params);
  const total = countRes.rows[0].total;

  const listParams = [...params, limit, (page - 1) * limit];
  const res = await db.query(
    `SELECT ${USER_COLS} FROM users${whereSql}
     ORDER BY created_at DESC
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams,
  );

  return {
    data: res.rows,
    pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function createUser({ name, email, password, role }) {
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length) throw new AppError('Email đã được đăng ký', 409);

  const hashed = await bcrypt.hash(password, 10);
  const res = await db.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING ${USER_COLS}`,
    [name, email, hashed, role],
  );
  return res.rows[0];
}

export async function deleteUser(id) {
  // ── 1. Guard: block deletion if the user has any order history ────────────
  // orders.user_id has no ON DELETE rule, so Postgres would throw 23503.
  // Business rule: lock the account instead of deleting it.
  const orderCheck = await db.query(
    'SELECT 1 FROM orders WHERE user_id = $1 LIMIT 1',
    [id],
  );
  if (orderCheck.rows.length) {
    throw new AppError(
      'Không thể xóa khách hàng đã có lịch sử mua hàng. Vui lòng sử dụng chức năng Khóa tài khoản.',
      400,
    );
  }

  // ── 2. Delete inside a transaction ───────────────────────────────────────
  // cart_items, wishlist, conversations, messages → ON DELETE CASCADE (Postgres handles them).
  // reviews.user_id                               → ON DELETE SET NULL  (Postgres handles it).
  // No manual pre-deletion needed; just delete the user and let the DB cascade.
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM users WHERE id = $1', [id]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');

    // ── 3. Fallback: catch any remaining FK violation (23503) ────────────
    if (err.code === '23503') {
      throw new AppError(
        'Không thể xóa người dùng do dữ liệu đang được liên kết với hệ thống.',
        400,
      );
    }
    throw err; // re-throw unexpected errors as 500
  } finally {
    client.release();
  }
}

export async function toggleLockUser(id) {
  const cur = await db.query('SELECT role, is_locked FROM users WHERE id = $1', [id]);
  const row = cur.rows[0];
  if (!row) throw new AppError('Không tìm thấy người dùng', 404);
  if (row.role === 'admin') throw new AppError('Không thể khóa tài khoản Admin', 400);

  const res = await db.query(
    `UPDATE users SET is_locked = NOT is_locked, updated_at = NOW()
     WHERE id = $1 RETURNING ${USER_COLS}`,
    [id],
  );
  return res.rows[0];
}

export async function updateUserRole(id, role, currentUserId) {
  if (id === currentUserId) throw new AppError('Không thể tự thay đổi vai trò của mình', 400);
  const res = await db.query(
    `UPDATE users SET role = $2, updated_at = NOW()
     WHERE id = $1 RETURNING ${USER_COLS}`,
    [id, role],
  );
  if (!res.rows.length) throw new AppError('Không tìm thấy người dùng', 404);
  return res.rows[0];
}
