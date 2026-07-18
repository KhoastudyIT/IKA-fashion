import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../../config/index.js';
import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';

// Cột user trả cho client (bỏ password), alias sang camelCase
const USER_COLS =
  `id, name, email, role, phone, address, is_locked AS "isLocked", created_at AS "createdAt"`;

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
  if (row.isLocked) throw new AppError('Tài khoản của bạn đã bị khóa bởi quản trị viên', 403);

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

export async function updateProfile(userId, { name, phone, address }) {
  const res = await db.query(
    `UPDATE users SET
       name    = COALESCE($2, name),
       phone   = COALESCE($3, phone),
       address = COALESCE($4, address),
       updated_at = NOW()
     WHERE id = $1
     RETURNING ${USER_COLS}`,
    [userId, name ?? null, phone ?? null, address ?? null],
  );
  if (!res.rows.length) throw new AppError('Không tìm thấy người dùng', 404);
  return res.rows[0];
}

// ─── Admin: quản lý người dùng ──────────────────────────────────────────────

export async function listUsers() {
  const res = await db.query(`SELECT ${USER_COLS} FROM users ORDER BY created_at DESC`);
  return res.rows;
}

export async function deleteUser(id) {
  await db.query('DELETE FROM users WHERE id = $1', [id]);
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
