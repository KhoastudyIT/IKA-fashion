import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';
import { activeFlashJoin, effectivePriceSQL } from '../../utils/price.js';

// Khóa định danh 1 dòng giỏ hàng = product + size + color (giữ nguyên format cho FE)
//
// Khoá sai định dạng thì productId thành NaN và câu truy vấn vỡ ở tầng Postgres,
// trả về 500 dù đây rõ ràng là lỗi dữ liệu người gọi gửi lên. Chặn ngay tại đây.
const parseKey = (key) => {
  const [productId, size, color] = String(key).split('|');
  const pid = Number(productId);
  if (!Number.isInteger(pid) || pid <= 0 || !size || !color) {
    throw new AppError('Khóa sản phẩm trong giỏ không hợp lệ', 400);
  }
  return { productId: pid, size, color };
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

/**
 * Tồn kho của ĐÚNG biến thể (size + màu), kèm số lượng đang có trong giỏ.
 *
 * Từ khi có bảng product_variants, mỗi cặp size–màu có kho riêng, nên không còn
 * phải cộng mọi dòng của cùng sản phẩm nữa: dòng nào ăn kho của biến thể đó.
 *
 * variant_stock = NULL nghĩa là sản phẩm chưa khai biến thể này (sản phẩm không
 * có size/màu, hoặc admin vừa thêm size mới) — khi đó lùi về tồn kho tổng ở
 * products để không chặn oan.
 */
async function stockAndCart(userId, productId, size, color) {
  const res = await db.query(
    `SELECT p.name, p.stock AS product_stock, p.sizes, p.colors,
            v.stock AS variant_stock,
            COALESCE((SELECT SUM(ci.quantity) FROM cart_items ci
                      WHERE ci.user_id = $2 AND ci.product_id = p.id
                        AND ci.size = $3 AND ci.color = $4), 0)::int AS in_cart
     FROM products p
     LEFT JOIN product_variants v
            ON v.product_id = p.id AND v.size = $3 AND v.color = $4
     WHERE p.id = $1`,
    [productId, userId, size, color],
  );
  if (!res.rows.length) throw new AppError('Không tìm thấy sản phẩm', 404);

  const row = res.rows[0];
  row.stock = row.variant_stock ?? row.product_stock;
  row.theo_bien_the = row.variant_stock != null;
  return row;
}

/**
 * Chặn sớm khi số lượng vượt tồn kho của biến thể.
 *
 * Đây CHỈ là lớp báo sớm cho khách. Lớp chặn thật vẫn nằm ở createOrder, vì tồn
 * kho có thể đổi trong khoảng thời gian giữa lúc bỏ vào giỏ và lúc bấm đặt hàng.
 */
function assertEnoughStock(p, wanted, { size, color }) {
  if (wanted <= p.stock) return;

  const ten = p.theo_bien_the
    ? `Sản phẩm "${p.name}" size ${size} màu ${color}`
    : `Sản phẩm "${p.name}"`;
  throw new AppError(
    p.stock > 0
      ? `${ten} chỉ còn ${p.stock} sản phẩm, không đủ cho ${wanted} bạn đang chọn.`
      : `${ten} đã hết hàng.`,
    400,
  );
}

export async function addItem(userId, { productId, size, color, quantity }) {
  const pid = Number(productId);
  const p = await stockAndCart(userId, pid, size, color);
  if (!p.sizes.includes(size)) throw new AppError('Size không hợp lệ', 400);
  if (!p.colors.includes(color)) throw new AppError('Màu không hợp lệ', 400);

  // Câu INSERT dưới đây CỘNG DỒN vào dòng cũ (ON CONFLICT DO UPDATE), nên số
  // phải kiểm là phần đang có của chính biến thể này cộng thêm phần vừa bấm.
  assertEnoughStock(p, p.in_cart + quantity, { size, color });

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

  // Sửa số lượng là THAY THẾ dòng hiện tại. Vì mỗi biến thể chỉ có đúng một
  // dòng giỏ hàng nên số cần kiểm chính là số lượng mới.
  const p = await stockAndCart(userId, productId, size, color);
  assertEnoughStock(p, quantity, { size, color });

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
