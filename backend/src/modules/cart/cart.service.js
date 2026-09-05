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

/**
 * Tồn kho từng biến thể của nhiều sản phẩm cùng lúc, dạng
 * { [productId]: { "S|Trắng": 6 } }.
 *
 * Gom trong MỘT truy vấn thay vì mỗi dòng giỏ hàng một lượt: giỏ 10 món vẫn chỉ
 * tốn một lần đi DB.
 */
async function variantStockOf(productIds) {
  if (!productIds.length) return new Map();
  const res = await db.query(
    'SELECT product_id, size, color, stock FROM product_variants WHERE product_id = ANY($1)',
    [productIds],
  );
  const bang = new Map();
  for (const v of res.rows) {
    if (!bang.has(v.product_id)) bang.set(v.product_id, {});
    bang.get(v.product_id)[`${v.size}|${v.color}`] = v.stock;
  }
  return bang;
}

async function present(userId) {
  // Giá flash lấy bằng LATERAL join trong chính truy vấn này. Trước đây mỗi dòng
  // giỏ hàng gọi thêm một query kiểm tra flash sale — giỏ 10 món là 11 lượt đi DB.
  const res = await db.query(
    `SELECT ci.product_id AS "productId",
            p.name, p.handle, p.img,
            p.price                   AS "listPrice",
            ${effectivePriceSQL('p')} AS price,
            p.sizes, p.colors,
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

  // Giỏ hàng cho phép đổi size ngay tại chỗ, nên mỗi dòng phải mang theo danh
  // sách size/màu của sản phẩm và tồn kho từng biến thể — không có thì giao
  // diện chỉ còn cách đoán, hoặc bắt khách bấm thử rồi nhận lỗi.
  const khoBienThe = await variantStockOf([...new Set(res.rows.map((r) => r.productId))]);

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
      sizes: r.sizes ?? [],
      colors: r.colors ?? [],
      variantStock: khoBienThe.get(r.productId) ?? {},
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

/**
 * Sửa một dòng giỏ hàng: số lượng, size, màu — hoặc kết hợp.
 *
 * Trường nào không gửi thì giữ nguyên. Đổi size/màu là ĐỔI BIẾN THỂ, tức là dòng
 * này chuyển sang ăn kho của biến thể mới; nếu biến thể mới đã có sẵn trong giỏ
 * thì hai dòng nhập làm một chứ không để giỏ có hai dòng trùng nhau.
 */
export async function updateItem(userId, key, { quantity, size, color }) {
  const cu = parseKey(key);

  const dongHienTai = await db.query(
    `SELECT quantity FROM cart_items
     WHERE user_id = $1 AND product_id = $2 AND size = $3 AND color = $4`,
    [userId, cu.productId, cu.size, cu.color],
  );
  if (!dongHienTai.rows.length) throw new AppError('Không tìm thấy sản phẩm trong giỏ', 404);

  const soLuong = quantity ?? dongHienTai.rows[0].quantity;
  const sizeMoi = size ?? cu.size;
  const mauMoi = color ?? cu.color;
  const doiBienThe = sizeMoi !== cu.size || mauMoi !== cu.color;

  const p = await stockAndCart(userId, cu.productId, sizeMoi, mauMoi);
  if (!p.sizes.includes(sizeMoi)) throw new AppError('Size không hợp lệ', 400);
  if (!p.colors.includes(mauMoi)) throw new AppError('Màu không hợp lệ', 400);

  // Giữ nguyên biến thể: sửa số lượng là THAY THẾ, nên số cần kiểm chính là số
  // lượng mới. Đổi biến thể: phải cộng thêm phần đang có sẵn của biến thể đích,
  // vì hai dòng sắp gộp lại thành một.
  assertEnoughStock(p, doiBienThe ? p.in_cart + soLuong : soLuong, { size: sizeMoi, color: mauMoi });

  if (!doiBienThe) {
    await db.query(
      `UPDATE cart_items SET quantity = $5
       WHERE user_id = $1 AND product_id = $2 AND size = $3 AND color = $4`,
      [userId, cu.productId, cu.size, cu.color, soLuong],
    );
    return present(userId);
  }

  // Biến thể đích chưa có trong giỏ → đổi tại chỗ, dòng giữ nguyên vị trí
  // (present() sắp theo created_at) nên khách không thấy món vừa sửa nhảy xuống cuối.
  if (p.in_cart === 0) {
    await db.query(
      `UPDATE cart_items SET size = $5, color = $6, quantity = $7
       WHERE user_id = $1 AND product_id = $2 AND size = $3 AND color = $4`,
      [userId, cu.productId, cu.size, cu.color, sizeMoi, mauMoi, soLuong],
    );
    return present(userId);
  }

  // Phải gộp hai dòng: xóa dòng cũ rồi cộng dồn vào dòng đích. Bọc transaction để
  // giỏ không bao giờ dừng lại ở trạng thái đã xóa mà chưa cộng.
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `DELETE FROM cart_items
       WHERE user_id = $1 AND product_id = $2 AND size = $3 AND color = $4`,
      [userId, cu.productId, cu.size, cu.color],
    );
    await client.query(
      `UPDATE cart_items SET quantity = quantity + $5
       WHERE user_id = $1 AND product_id = $2 AND size = $3 AND color = $4`,
      [userId, cu.productId, sizeMoi, mauMoi, soLuong],
    );
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
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
