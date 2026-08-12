import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';

const COUPON_COLS = `
  id, code, type, value,
  min_order AS "minOrder", quantity, used, active,
  to_char(expiry_date, 'YYYY-MM-DD') AS "expiryDate"
`;

// Số tiền giảm cho 1 coupon + subtotal (không vượt quá subtotal)
export function computeDiscount(coupon, subtotal) {
  const raw = coupon.type === 'percentage'
    ? Math.floor((subtotal * coupon.value) / 100)
    : coupon.value;
  return Math.min(raw, subtotal);
}

// Kiểm tra coupon hợp lệ với subtotal; ném lỗi nếu không. Trả về row coupon.
export function assertUsable(c, subtotal) {
  if (!c) throw new AppError('Mã giảm giá không tồn tại', 404);
  if (!c.active) throw new AppError('Mã giảm giá đang tạm dừng', 400);
  if (new Date(c.expiry_date ?? c.expiryDate) < new Date(new Date().toDateString())) {
    throw new AppError('Mã giảm giá đã hết hạn', 400);
  }
  if (c.used >= c.quantity) throw new AppError('Mã giảm giá đã hết lượt sử dụng', 400);
  if (subtotal < c.min_order) {
    throw new AppError(`Đơn tối thiểu ${c.min_order.toLocaleString('vi-VN')}đ để dùng mã này`, 400);
  }
  return c;
}

// ─── Áp mã (checkout xem trước) ─────────────────────────────────────────────
export async function applyCoupon(code, subtotal) {
  const res = await db.query('SELECT * FROM coupons WHERE UPPER(code) = UPPER($1)', [code]);
  const c = res.rows[0];
  assertUsable(c, subtotal);
  const discount = computeDiscount(c, subtotal);
  return { code: c.code, type: c.type, value: c.value, minOrder: c.min_order, discount };
}

// ─── Admin CRUD ─────────────────────────────────────────────────────────────
export async function listCoupons(query = {}) {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;

  const countRes = await db.query("SELECT COUNT(*)::int AS total FROM coupons");
  const total = countRes.rows[0].total;

  const res = await db.query(
    `SELECT ${COUPON_COLS} FROM coupons ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, (page - 1) * limit]
  );
  
  return {
    data: res.rows,
    pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) }
  };
}

export async function createCoupon(data) {
  const code = data.code.toUpperCase().replace(/\s+/g, '');
  const dup = await db.query('SELECT id FROM coupons WHERE code = $1', [code]);
  if (dup.rows.length) throw new AppError('Mã giảm giá này đã tồn tại', 409);
  if (data.type === 'percentage' && data.value > 100) {
    throw new AppError('Mức giảm phần trăm không thể vượt quá 100%', 400);
  }
  const res = await db.query(
    `INSERT INTO coupons (code, type, value, min_order, quantity, active, expiry_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ${COUPON_COLS}`,
    [code, data.type, data.value, data.minOrder ?? 0, data.quantity ?? 100,
     data.active ?? true, data.expiryDate],
  );
  return res.rows[0];
}

export async function updateCoupon(id, data) {
  if (data.type === 'percentage' && data.value != null && data.value > 100) {
    throw new AppError('Mức giảm phần trăm không thể vượt quá 100%', 400);
  }
  const code = data.code ? data.code.toUpperCase().replace(/\s+/g, '') : null;
  const res = await db.query(
    `UPDATE coupons SET
       code        = COALESCE($2, code),
       type        = COALESCE($3, type),
       value       = COALESCE($4, value),
       min_order   = COALESCE($5, min_order),
       quantity    = COALESCE($6, quantity),
       active      = COALESCE($7, active),
       expiry_date = COALESCE($8, expiry_date)
     WHERE id = $1 RETURNING ${COUPON_COLS}`,
    [Number(id), code, data.type ?? null, data.value ?? null, data.minOrder ?? null,
     data.quantity ?? null, data.active ?? null, data.expiryDate ?? null],
  );
  if (!res.rows.length) throw new AppError('Không tìm thấy mã giảm giá', 404);
  return res.rows[0];
}

export async function toggleCoupon(id) {
  const res = await db.query(
    `UPDATE coupons SET active = NOT active WHERE id = $1 RETURNING ${COUPON_COLS}`,
    [Number(id)],
  );
  if (!res.rows.length) throw new AppError('Không tìm thấy mã giảm giá', 404);
  return res.rows[0];
}

export async function deleteCoupon(id) {
  const res = await db.query('DELETE FROM coupons WHERE id = $1 RETURNING id', [Number(id)]);
  if (!res.rows.length) throw new AppError('Không tìm thấy mã giảm giá', 404);
}
