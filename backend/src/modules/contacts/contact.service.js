import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';

// Alias camelCase cho FE, giống các module khác.
const COLS = `
  id, name, email, phone, subject, message, status,
  admin_note AS "adminNote",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

const SORT_SQL = {
  newest: 'created_at DESC',
  oldest: 'created_at ASC',
};

// Endpoint này công khai nên ai cũng gọi được. Chặn gửi lại liên tục từ cùng
// một email để một cú bấm nút nhiều lần (hoặc script) không làm ngập hàng đợi
// của admin. Không phải chống spam thực thụ — chỉ là hàng rào tối thiểu.
const RESUBMIT_COOLDOWN = '60 seconds';

// ── Công khai ───────────────────────────────────────────────────────────────

export async function createContact(data) {
  const recent = await db.query(
    `SELECT 1 FROM contact_requests
     WHERE lower(email) = lower($1) AND created_at > NOW() - INTERVAL '${RESUBMIT_COOLDOWN}'
     LIMIT 1`,
    [data.email],
  );
  if (recent.rows.length) {
    throw new AppError(
      'Yêu cầu của bạn đã được ghi nhận. Vui lòng chờ chúng tôi phản hồi trước khi gửi tiếp.',
      429,
    );
  }

  const res = await db.query(
    `INSERT INTO contact_requests (name, email, phone, subject, message)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLS}`,
    [data.name, data.email, data.phone ?? '', data.subject, data.message],
  );
  return res.rows[0];
}

// ── Admin ───────────────────────────────────────────────────────────────────

export async function listContacts({ page, limit, status, search, sort }) {
  const params = [];
  const where = [];

  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(
      lower(name)    LIKE lower($${params.length})
      OR lower(email) LIKE lower($${params.length})
      OR phone        LIKE $${params.length}
      OR lower(subject) LIKE lower($${params.length})
    )`);
  }

  const whereSql = where.length ? ` WHERE ${where.join(' AND ')}` : '';

  const countRes = await db.query(
    `SELECT COUNT(*)::int AS total FROM contact_requests${whereSql}`,
    params,
  );
  const total = countRes.rows[0].total;

  const listParams = [...params, limit, (page - 1) * limit];
  const res = await db.query(
    `SELECT ${COLS} FROM contact_requests${whereSql}
     ORDER BY ${SORT_SQL[sort] ?? SORT_SQL.newest}
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams,
  );

  return {
    data: res.rows,
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/** Đếm theo trạng thái để hiện badge "chưa xử lý" trên menu admin. */
export async function countContactsByStatus() {
  const res = await db.query(
    'SELECT status, COUNT(*)::int AS count FROM contact_requests GROUP BY status',
  );
  const counts = { total: 0, new: 0, processing: 0, resolved: 0 };
  for (const row of res.rows) {
    counts[row.status] = row.count;
    counts.total += row.count;
  }
  return counts;
}

export async function getContact(id) {
  const res = await db.query(`SELECT ${COLS} FROM contact_requests WHERE id = $1`, [id]);
  if (!res.rows.length) throw new AppError('Không tìm thấy yêu cầu liên hệ', 404);
  return res.rows[0];
}

export async function updateContact(id, { status, adminNote }) {
  // Chỉ ghi field được gửi lên; giống updateSettings, tránh việc sửa trạng thái
  // lại vô tình xóa mất ghi chú đang có.
  const res = await db.query(
    `UPDATE contact_requests SET
       status     = COALESCE($2, status),
       admin_note = COALESCE($3, admin_note),
       updated_at = NOW()
     WHERE id = $1
     RETURNING ${COLS}`,
    [id, status ?? null, adminNote ?? null],
  );
  if (!res.rows.length) throw new AppError('Không tìm thấy yêu cầu liên hệ', 404);
  return res.rows[0];
}

export async function deleteContact(id) {
  const res = await db.query('DELETE FROM contact_requests WHERE id = $1 RETURNING id', [id]);
  if (!res.rows.length) throw new AppError('Không tìm thấy yêu cầu liên hệ', 404);
}
