import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';
import { activeFlashWhere, discountPercent } from '../../utils/price.js';

// Mỗi dòng flash_sales là MỘT sản phẩm với giá ưu đãi, số suất và khung giờ riêng.
const SALE_COLS = `
  fs.id,
  fs.product_id     AS "productId",
  fs.price,
  fs.original_price AS "originalPrice",
  fs.stock,
  fs.sold,
  fs.starts_at      AS "startsAt",
  fs.ends_at        AS "endsAt",
  fs.active,
  fs.created_at     AS "createdAt"
`;

// Thông tin sản phẩm đi kèm để giao diện khỏi phải gọi thêm API.
const PRODUCT_COLS = `
  p.name,
  p.handle,
  p.img,
  p.price AS "productPrice",
  p.stock AS "productStock"
`;

function mapRow(r) {
  const price = Number(r.price);
  // Mức giảm neo vào giá niêm yết HIỆN TẠI, không dùng original_price đã chụp
  // lúc tạo: admin sửa giá sản phẩm sau đó là con số cũ lệch ngay.
  const listPrice = Number(r.productPrice ?? r.originalPrice);
  return {
    ...r,
    price,
    originalPrice: Number(r.originalPrice),
    remaining: Math.max(0, Number(r.stock) - Number(r.sold)),
    discountPercent: discountPercent(listPrice, price),
  };
}

// ─── Public ──────────────────────────────────────────────────────────────────

/** Các suất flash sale đang chạy — dùng cho khối Flash Sale ngoài trang khách. */
export async function getActiveFlashSales() {
  const res = await db.query(
    `SELECT ${SALE_COLS}, ${PRODUCT_COLS}
     FROM flash_sales fs
     JOIN products p ON p.id = fs.product_id
     WHERE ${activeFlashWhere('fs')}
     ORDER BY fs.price ASC`,
  );
  return res.rows.map(mapRow);
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function listFlashSales() {
  const res = await db.query(
    `SELECT ${SALE_COLS}, ${PRODUCT_COLS},
            (SELECT COUNT(*)::int FROM order_items oi WHERE oi.flash_sale_id = fs.id) AS "orderItemCount"
     FROM flash_sales fs
     JOIN products p ON p.id = fs.product_id
     ORDER BY fs.created_at DESC`,
  );
  return res.rows.map(mapRow);
}

export async function getFlashSaleById(id) {
  const res = await db.query(
    `SELECT ${SALE_COLS}, ${PRODUCT_COLS}
     FROM flash_sales fs
     JOIN products p ON p.id = fs.product_id
     WHERE fs.id = $1`,
    [Number(id)],
  );
  if (!res.rows.length) throw new AppError('Không tìm thấy flash sale', 404);
  return mapRow(res.rows[0]);
}

/** Giá flash phải thật sự thấp hơn giá đang bán, không thì chương trình vô nghĩa. */
async function assertPriceBelowList(productId, price) {
  const res = await db.query('SELECT name, price FROM products WHERE id = $1', [Number(productId)]);
  if (!res.rows.length) throw new AppError('Không tìm thấy sản phẩm', 404);
  if (Number(price) >= Number(res.rows[0].price)) {
    throw new AppError(
      `Giá flash sale phải thấp hơn giá đang bán của "${res.rows[0].name}" `
      + `(${Number(res.rows[0].price).toLocaleString('vi-VN')} đ)`,
      400,
    );
  }
  return res.rows[0];
}

/**
 * Ràng buộc EXCLUDE trong DB mới là nơi chặn thật sự việc hai chương trình cùng
 * sản phẩm chạy chồng khung giờ. Postgres ném mã 23P01 khá khó hiểu nên đổi
 * thành thông báo nói rõ đang vướng chương trình nào.
 */
async function withOverlapMessage(productId, fn) {
  try {
    return await fn();
  } catch (err) {
    if (err.code !== '23P01') throw err;
    const clash = await db.query(
      `SELECT id, starts_at, ends_at FROM flash_sales
       WHERE product_id = $1 AND active = TRUE
       ORDER BY starts_at LIMIT 1`,
      [Number(productId)],
    );
    const c = clash.rows[0];
    const until = c?.ends_at ? new Date(c.ends_at).toLocaleString('vi-VN') : 'không giới hạn';
    throw new AppError(
      `Sản phẩm này đã có chương trình flash sale${c ? ` #${c.id}` : ''} đang bật`
      + (c ? ` (từ ${new Date(c.starts_at).toLocaleString('vi-VN')} đến ${until})` : '')
      + ` trùng khung giờ. Hãy tạm ngưng chương trình đó trước.`,
      409,
    );
  }
}

export async function createFlashSale({ productId, price, stock, startsAt, endsAt, active }) {
  const product = await assertPriceBelowList(productId, price);

  return withOverlapMessage(productId, async () => {
    const res = await db.query(
      `INSERT INTO flash_sales (product_id, price, original_price, stock, starts_at, ends_at, active)
       VALUES ($1, $2, $3, $4, COALESCE($5, NOW()), $6, $7)
       RETURNING id`,
      [Number(productId), price, product.price, stock, startsAt ?? null, endsAt ?? null, active ?? true],
    );
    return getFlashSaleById(res.rows[0].id);
  });
}

/**
 * Chương trình đã qua thời điểm kết thúc thì đóng băng.
 *
 * Đơn hàng cũ trỏ về nó để giải thích đơn giá; sửa giá hay khung giờ của một
 * chương trình đã chạy xong sẽ làm lịch sử đó nói sai. Muốn chạy lại thì tạo
 * chương trình mới.
 */
function assertEditable(row) {
  if (row.ends_at && new Date(row.ends_at) <= new Date()) {
    throw new AppError(
      `Chương trình đã kết thúc lúc ${new Date(row.ends_at).toLocaleString('vi-VN')} nên không sửa được nữa. `
      + `Hãy tạo chương trình mới.`,
      400,
    );
  }
}

export async function updateFlashSale(id, data) {
  const cur = await db.query('SELECT * FROM flash_sales WHERE id = $1', [Number(id)]);
  if (!cur.rows.length) throw new AppError('Không tìm thấy flash sale', 404);
  const row = cur.rows[0];
  assertEditable(row);

  const productId = data.productId ?? row.product_id;
  if (data.price != null || data.productId != null) {
    await assertPriceBelowList(productId, data.price ?? row.price);
  }
  // Không cho hạ số suất xuống dưới số đã bán — cột sold sẽ vượt stock và suất
  // "còn lại" thành số âm.
  if (data.stock != null && Number(data.stock) < Number(row.sold)) {
    throw new AppError(`Đã bán ${row.sold} suất, không thể đặt số suất thấp hơn`, 400);
  }

  return withOverlapMessage(productId, async () => {
    const res = await db.query(
      `UPDATE flash_sales SET
         product_id = COALESCE($2, product_id),
         price      = COALESCE($3, price),
         stock      = COALESCE($4, stock),
         starts_at  = COALESCE($5, starts_at),
         ends_at    = CASE WHEN $7::bool THEN $6::timestamptz ELSE ends_at END,
         active     = COALESCE($8, active),
         updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [
        Number(id),
        data.productId ?? null,
        data.price ?? null,
        data.stock ?? null,
        data.startsAt ?? null,
        data.endsAt ?? null,
        // endsAt được phép đặt về null (không giới hạn) nên phải phân biệt
        // "không truyền" với "truyền null".
        Object.prototype.hasOwnProperty.call(data, 'endsAt'),
        data.active ?? null,
      ],
    );
    return getFlashSaleById(res.rows[0].id);
  });
}

export async function toggleFlashSale(id) {
  const cur = await db.query(
    'SELECT product_id, active, ends_at FROM flash_sales WHERE id = $1', [Number(id)],
  );
  if (!cur.rows.length) throw new AppError('Không tìm thấy flash sale', 404);
  // Bật lại một chương trình đã hết hạn cũng không làm nó chạy (engine giá vẫn
  // loại theo ends_at), nên chặn luôn cho khỏi hiểu nhầm.
  assertEditable(cur.rows[0]);

  return withOverlapMessage(cur.rows[0].product_id, async () => {
    await db.query(
      'UPDATE flash_sales SET active = NOT active, updated_at = NOW() WHERE id = $1',
      [Number(id)],
    );
    return getFlashSaleById(id);
  });
}

/**
 * Kết thúc ngay lập tức — admin dừng hẳn một chương trình bất cứ lúc nào.
 *
 * Khác `toggleFlashSale`: tạm ngưng là tắt tạm, bật lại được; kết thúc là chốt
 * `ends_at` nên chương trình vào trạng thái đã kết thúc và không sửa được nữa.
 *
 * Với chương trình chưa tới giờ chạy thì kéo luôn starts_at về hiện tại. Nếu
 * chỉ đặt ends_at = NOW() mà giữ starts_at ở tương lai, tstzrange sẽ có cận
 * dưới lớn hơn cận trên và Postgres báo lỗi; còn nếu đặt ends_at = starts_at
 * (tương lai) thì chương trình vẫn tính là chưa kết thúc nên sửa được tiếp.
 */
export async function endFlashSale(id) {
  const cur = await db.query('SELECT ends_at FROM flash_sales WHERE id = $1', [Number(id)]);
  if (!cur.rows.length) throw new AppError('Không tìm thấy flash sale', 404);
  if (cur.rows[0].ends_at && new Date(cur.rows[0].ends_at) <= new Date()) {
    throw new AppError('Chương trình này đã kết thúc rồi', 400);
  }

  await db.query(
    `UPDATE flash_sales
     SET starts_at = LEAST(starts_at, NOW()),
         ends_at   = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [Number(id)],
  );
  return getFlashSaleById(id);
}

// Không có hàm xóa flash sale — chỉ tạm ngưng hoặc kết thúc.
//
// order_items.flash_sale_id trỏ về đây để giải thích vì sao đơn cũ có đơn giá
// thấp hơn giá niêm yết. Xóa dòng là khóa ngoại bị set null và mất luôn dấu vết
// đó, tra soát đơn cũ sẽ không biết vì sao khách được giá rẻ. Tạm ngưng đạt
// đúng mục đích (dừng bán giá flash) mà vẫn giữ lịch sử.
