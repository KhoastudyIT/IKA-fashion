import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';

const PRODUCT_COLS =
  `p.id, p.name, p.handle, p.collection, p.type, p.price, p.img, p.images, p.colors,
   p.sizes, p.features, p.rating::float AS rating, p.sold, p.stock, p.description`;

export async function listWishlist(userId) {
  const res = await db.query(
    `SELECT ${PRODUCT_COLS}
     FROM wishlist w JOIN products p ON p.id = w.product_id
     WHERE w.user_id = $1
     ORDER BY w.created_at DESC`,
    [userId],
  );
  return res.rows;
}

export async function addToWishlist(userId, productId) {
  const pid = Number(productId);
  const p = await db.query('SELECT id FROM products WHERE id = $1', [pid]);
  if (!p.rows.length) throw new AppError('Không tìm thấy sản phẩm', 404);

  await db.query(
    `INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2)
     ON CONFLICT (user_id, product_id) DO NOTHING`,
    [userId, pid],
  );
  return listWishlist(userId);
}

export async function removeFromWishlist(userId, productId) {
  await db.query(
    'DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2',
    [userId, Number(productId)],
  );
  return listWishlist(userId);
}
