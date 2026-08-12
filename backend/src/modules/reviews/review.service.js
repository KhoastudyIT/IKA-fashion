import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';

// Đánh giá kèm tên sản phẩm (cho admin)
const ADMIN_COLS = `
  r.id, r.product_id AS "productId", r.user_name AS "userName",
  p.name AS "productName", r.rating, r.comment, r.approved, r.reply,
  to_char(r.created_at, 'YYYY-MM-DD') AS "createdAt"
`;

// Đánh giá công khai (trang sản phẩm) — chỉ cái đã duyệt
const PUBLIC_COLS = `
  id, user_name AS "userName", rating, comment, reply,
  to_char(created_at, 'YYYY-MM-DD') AS "createdAt"
`;

// ─── Công khai ──────────────────────────────────────────────────────────────
export async function listProductReviews(productId) {
  const res = await db.query(
    `SELECT ${PUBLIC_COLS} FROM reviews
     WHERE product_id = $1 AND approved = true
     ORDER BY created_at DESC`,
    [Number(productId)],
  );
  return res.rows;
}

// Tính lại rating trung bình của sản phẩm = AVG(đánh giá ĐÃ DUYỆT), 5.0 nếu chưa có
async function recomputeProductRating(productId) {
  await db.query(
    `UPDATE products SET rating = COALESCE(
       (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE product_id = $1 AND approved),
       5.0)
     WHERE id = $1`,
    [Number(productId)],
  );
}

// Khách chỉ được đánh giá nếu đã có đơn HOÀN THÀNH chứa sản phẩm này
export async function hasCompletedPurchase(userId, productId) {
  const res = await db.query(
    `SELECT 1 FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status = 'completed'
     LIMIT 1`,
    [userId, Number(productId)],
  );
  return res.rows.length > 0;
}

// ─── Khách đã đăng nhập: gửi đánh giá ───────────────────────────────────────
export async function createReview({ productId, userId, userName, rating, comment }) {
  const p = await db.query('SELECT id FROM products WHERE id = $1', [Number(productId)]);
  if (!p.rows.length) throw new AppError('Không tìm thấy sản phẩm', 404);

  if (!(await hasCompletedPurchase(userId, productId))) {
    throw new AppError('Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua và nhận hàng thành công', 403);
  }

  const res = await db.query(
    `INSERT INTO reviews (product_id, user_id, user_name, rating, comment)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, product_id AS "productId", user_name AS "userName",
               rating, comment, approved, reply,
               to_char(created_at, 'YYYY-MM-DD') AS "createdAt"`,
    [Number(productId), userId, userName, rating, comment ?? ''],
  );
  return res.rows[0];
}

// ─── Admin ──────────────────────────────────────────────────────────────────
export async function listAllReviews(query = {}) {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;

  const countRes = await db.query("SELECT COUNT(*)::int AS total FROM reviews");
  const total = countRes.rows[0].total;

  const res = await db.query(
    `SELECT ${ADMIN_COLS} FROM reviews r JOIN products p ON p.id = r.product_id
     ORDER BY r.created_at DESC LIMIT $1 OFFSET $2`,
     [limit, (page - 1) * limit]
  );
  
  return {
    data: res.rows,
    pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) }
  };
}

export async function toggleApprove(id) {
  const res = await db.query(
    `UPDATE reviews SET approved = NOT approved WHERE id = $1 RETURNING id, approved, product_id`,
    [Number(id)],
  );
  if (!res.rows.length) throw new AppError('Không tìm thấy đánh giá', 404);
  await recomputeProductRating(res.rows[0].product_id);  // duyệt/ẩn -> cập nhật rating trung bình
  return { id: res.rows[0].id, approved: res.rows[0].approved };
}

export async function setReply(id, reply) {
  const res = await db.query(
    `UPDATE reviews SET reply = $2 WHERE id = $1
     RETURNING id, reply`,
    [Number(id), reply && reply.trim() ? reply : null],
  );
  if (!res.rows.length) throw new AppError('Không tìm thấy đánh giá', 404);
  return res.rows[0];
}

export async function deleteReview(id) {
  const res = await db.query('DELETE FROM reviews WHERE id = $1 RETURNING product_id', [Number(id)]);
  if (!res.rows.length) throw new AppError('Không tìm thấy đánh giá', 404);
  await recomputeProductRating(res.rows[0].product_id);  // xóa -> cập nhật rating trung bình
}
