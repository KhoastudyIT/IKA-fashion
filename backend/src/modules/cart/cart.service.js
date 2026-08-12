import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';
import { activeFlashJoin, effectivePriceSQL } from '../../utils/price.js';

// Khóa định danh 1 dòng giỏ hàng = product + size + color (giữ nguyên format cho FE)
const parseKey = (key) => {
  const [productId, size, color] = String(key).split('|');
  return { productId: Number(productId), size, color };
};

async function present(userId) {
  // Giá flash lấy bằng LATERAL join trong chính truy vấn này. Trước đây mỗi dòng
  // giỏ hàng gọi thêm một query kiểm tra flash sale — giỏ 10 món là 11 lượt đi DB.
  const res = await db.query(
    `SELECT ci.product_id AS "productId",
            p.name, p.handle, p.img,
            p.price                   AS "listPrice",
            ${effectivePriceSQL('p')} AS price,
            active_flash.id           AS "flashSaleId",
            active_flash.remaining    AS "flashRemaining",
            ci.size, ci.color, ci.quantity
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     ${activeFlashJoin('p')}
     WHERE ci.user_id = $1
     ORDER BY ci.created_at`,
    [userId],
  );

  const items = res.rows.map((r) => {
    const price = Number(r.price);
    const listPrice = Number(r.listPrice);
    return {
      productId: r.productId,
      name: r.name,
      handle: r.handle,
      img: r.img,
      size: r.size,
      color: r.color,
      quantity: r.quantity,
      price,
      // Giữ tên cũ cho giao diện: originalPrice = giá gạch ngang.
      originalPrice: listPrice,
      lineTotal: price * r.quantity,
      originalLineTotal: listPrice * r.quantity,
      isFlashSale: r.flashSaleId != null,
      flashRemaining: r.flashRemaining ?? null,
    };
  });

  const subtotal         = items.reduce((s, it) => s + it.lineTotal,         0);
  const originalSubtotal = items.reduce((s, it) => s + it.originalLineTotal, 0);
  const totalItems       = items.reduce((s, it) => s + it.quantity,          0);
  return { items, subtotal, originalSubtotal, totalItems };
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
