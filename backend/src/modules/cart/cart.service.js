import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';

// Khóa định danh 1 dòng giỏ hàng = product + size + color (giữ nguyên format cho FE)
const parseKey = (key) => {
  const [productId, size, color] = String(key).split('|');
  return { productId: Number(productId), size, color };
};

async function present(userId) {
  const res = await db.query(
    `SELECT ci.product_id AS "productId",
            p.name, p.handle, p.img, p.price,
            ci.size, ci.color, ci.quantity,
            (p.price * ci.quantity) AS "lineTotal"
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = $1
     ORDER BY ci.created_at`,
    [userId],
  );
  const items = res.rows.map(r => ({ ...r, price: Number(r.price), lineTotal: Number(r.lineTotal) }));
  const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
  const totalItems = items.reduce((s, it) => s + it.quantity, 0);
  return { items, subtotal, totalItems };
}

export async function getCart(userId) {
  return present(userId);
}

export async function addItem(userId, { productId, size, color, quantity }) {
  const pid = Number(productId);
  const p = await db.query('SELECT sizes, colors FROM products WHERE id = $1', [pid]);
  if (!p.rows.length) throw new AppError('Không tìm thấy sản phẩm', 404);
  if (!p.rows[0].sizes.includes(size)) throw new AppError('Size không hợp lệ', 400);
  if (!p.rows[0].colors.includes(color)) throw new AppError('Màu không hợp lệ', 400);

  await db.query(
    `INSERT INTO cart_items (user_id, product_id, size, color, quantity)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, product_id, size, color)
     DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
    [userId, pid, size, color, quantity],
  );
  return present(userId);
}

export async function updateItem(userId, key, quantity) {
  const { productId, size, color } = parseKey(key);
  const res = await db.query(
    `UPDATE cart_items SET quantity = $5
     WHERE user_id = $1 AND product_id = $2 AND size = $3 AND color = $4
     RETURNING id`,
    [userId, productId, size, color, quantity],
  );
  if (!res.rows.length) throw new AppError('Không tìm thấy sản phẩm trong giỏ', 404);
  return present(userId);
}

export async function removeItem(userId, key) {
  const { productId, size, color } = parseKey(key);
  const res = await db.query(
    `DELETE FROM cart_items
     WHERE user_id = $1 AND product_id = $2 AND size = $3 AND color = $4
     RETURNING id`,
    [userId, productId, size, color],
  );
  if (!res.rows.length) throw new AppError('Không tìm thấy sản phẩm trong giỏ', 404);
  return present(userId);
}

export async function clearCart(userId) {
  await db.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
  return present(userId);
}
