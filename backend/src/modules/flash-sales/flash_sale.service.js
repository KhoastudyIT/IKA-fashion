import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SALE_COLS = `
  id, name,
  start_time AS "startTime",
  end_time   AS "endTime",
  is_active  AS "isActive",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

function mapSale(row) {
  return {
    ...row,
    isActive: Boolean(row.isActive),
  };
}

// ─── Public ───────────────────────────────────────────────────────────────────

/**
 * Trả về tất cả flash sale đang hoạt động (is_active = true và trong khoảng thời gian)
 * kèm danh sách sản phẩm + thông tin sản phẩm gốc.
 */
export async function getActiveFlashSales() {
  const salesRes = await db.query(
    `SELECT ${SALE_COLS}
     FROM flash_sales
     WHERE is_active = true
       AND start_time <= NOW()
       AND end_time   >= NOW()
     ORDER BY start_time ASC`,
  );

  if (!salesRes.rows.length) return [];

  const saleIds = salesRes.rows.map(r => r.id);

  // Single round-trip: lấy tất cả sản phẩm của tất cả flash sale đang hoạt động
  const productsRes = await db.query(
    `SELECT
       fsp.flash_sale_id    AS "flashSaleId",
       fsp.id               AS "flashSaleProductId",
       fsp.discounted_price AS "discountedPrice",
       fsp.stock_limit      AS "stockLimit",
       fsp.sold_count       AS "soldCount",
       p.id                 AS "productId",
       p.name,
       p.handle,
       p.img,
       p.price              AS "originalPrice",
       p.discount,
       p.colors,
       p.sizes,
       p.rating,
       p.stock
     FROM flash_sale_products fsp
     JOIN products p ON p.id = fsp.product_id
     WHERE fsp.flash_sale_id = ANY($1)
     ORDER BY fsp.flash_sale_id, p.name`,
    [saleIds],
  );

  // Group products by flash_sale_id
  const productsBySale = {};
  for (const row of productsRes.rows) {
    const sid = row.flashSaleId;
    if (!productsBySale[sid]) productsBySale[sid] = [];
    productsBySale[sid].push({
      flashSaleProductId: row.flashSaleProductId,
      discountedPrice:    Number(row.discountedPrice),
      stockLimit:         row.stockLimit,
      soldCount:          row.soldCount,
      remaining:          Math.max(0, row.stockLimit - row.soldCount),
      productId:          row.productId,
      name:               row.name,
      handle:             row.handle,
      img:                row.img,
      originalPrice:      Number(row.originalPrice),
      discount:           row.discount,
      colors:             row.colors,
      sizes:              row.sizes,
      rating:             Number(row.rating),
      stock:              row.stock,
    });
  }

  return salesRes.rows.map(sale => ({
    ...mapSale(sale),
    products: productsBySale[sale.id] ?? [],
  }));
}

// ─── Admin — Flash Sales CRUD ─────────────────────────────────────────────────

export async function listFlashSales() {
  const res = await db.query(
    `SELECT ${SALE_COLS} FROM flash_sales ORDER BY start_time DESC`,
  );
  return res.rows.map(mapSale);
}

export async function getFlashSaleById(id) {
  const saleRes = await db.query(
    `SELECT ${SALE_COLS} FROM flash_sales WHERE id = $1`,
    [Number(id)],
  );
  if (!saleRes.rows.length) throw new AppError('Không tìm thấy flash sale', 404);

  const productsRes = await db.query(
    `SELECT
       fsp.id               AS "flashSaleProductId",
       fsp.discounted_price AS "discountedPrice",
       fsp.stock_limit      AS "stockLimit",
       fsp.sold_count       AS "soldCount",
       p.id                 AS "productId",
       p.name, p.handle, p.img,
       p.price              AS "originalPrice",
       p.discount, p.colors, p.sizes, p.rating, p.stock
     FROM flash_sale_products fsp
     JOIN products p ON p.id = fsp.product_id
     WHERE fsp.flash_sale_id = $1
     ORDER BY p.name`,
    [Number(id)],
  );

  return {
    ...mapSale(saleRes.rows[0]),
    products: productsRes.rows.map(r => ({
      ...r,
      discountedPrice: Number(r.discountedPrice),
      originalPrice:   Number(r.originalPrice),
      rating:          Number(r.rating),
      remaining:       Math.max(0, r.stockLimit - r.soldCount),
    })),
  };
}

export async function createFlashSale({ name, startTime, endTime, isActive }) {
  const res = await db.query(
    `INSERT INTO flash_sales (name, start_time, end_time, is_active)
     VALUES ($1, $2, $3, $4)
     RETURNING ${SALE_COLS}`,
    [name, startTime, endTime, isActive ?? false],
  );
  return mapSale(res.rows[0]);
}

export async function updateFlashSale(id, { name, startTime, endTime, isActive }) {
  const res = await db.query(
    `UPDATE flash_sales SET
       name       = COALESCE($2, name),
       start_time = COALESCE($3, start_time),
       end_time   = COALESCE($4, end_time),
       is_active  = COALESCE($5, is_active),
       updated_at = NOW()
     WHERE id = $1
     RETURNING ${SALE_COLS}`,
    [Number(id), name ?? null, startTime ?? null, endTime ?? null, isActive ?? null],
  );
  if (!res.rows.length) throw new AppError('Không tìm thấy flash sale', 404);
  return mapSale(res.rows[0]);
}

export async function toggleFlashSale(id) {
  const res = await db.query(
    `UPDATE flash_sales
     SET is_active = NOT is_active, updated_at = NOW()
     WHERE id = $1
     RETURNING ${SALE_COLS}`,
    [Number(id)],
  );
  if (!res.rows.length) throw new AppError('Không tìm thấy flash sale', 404);
  return mapSale(res.rows[0]);
}

export async function deleteFlashSale(id) {
  const res = await db.query(
    'DELETE FROM flash_sales WHERE id = $1 RETURNING id',
    [Number(id)],
  );
  if (!res.rows.length) throw new AppError('Không tìm thấy flash sale', 404);
}

// ─── Admin — Flash Sale Products CRUD ────────────────────────────────────────

export async function addProductToFlashSale(flashSaleId, { productId, discountedPrice, stockLimit }) {
  const sid = Number(flashSaleId);
  const pid = Number(productId);

  // Kiểm tra flash sale tồn tại
  const saleCheck = await db.query('SELECT id FROM flash_sales WHERE id = $1', [sid]);
  if (!saleCheck.rows.length) throw new AppError('Không tìm thấy flash sale', 404);

  // Kiểm tra sản phẩm tồn tại + giá hợp lệ
  const productCheck = await db.query('SELECT id, price FROM products WHERE id = $1', [pid]);
  if (!productCheck.rows.length) throw new AppError('Không tìm thấy sản phẩm', 404);
  if (discountedPrice >= productCheck.rows[0].price) {
    throw new AppError('Giá flash sale phải thấp hơn giá gốc của sản phẩm', 400);
  }

  const res = await db.query(
    `INSERT INTO flash_sale_products (flash_sale_id, product_id, discounted_price, stock_limit)
     VALUES ($1, $2, $3, $4)
     RETURNING id AS "flashSaleProductId",
               flash_sale_id AS "flashSaleId",
               product_id    AS "productId",
               discounted_price AS "discountedPrice",
               stock_limit   AS "stockLimit",
               sold_count    AS "soldCount"`,
    [sid, pid, discountedPrice, stockLimit],
  );
  return {
    ...res.rows[0],
    discountedPrice: Number(res.rows[0].discountedPrice),
  };
}

export async function updateFlashSaleProduct(flashSaleId, productId, { discountedPrice, stockLimit }) {
  const sid = Number(flashSaleId);
  const pid = Number(productId);

  if (discountedPrice != null) {
    const productCheck = await db.query('SELECT price FROM products WHERE id = $1', [pid]);
    if (!productCheck.rows.length) throw new AppError('Không tìm thấy sản phẩm', 404);
    if (discountedPrice >= productCheck.rows[0].price) {
      throw new AppError('Giá flash sale phải thấp hơn giá gốc của sản phẩm', 400);
    }
  }

  const res = await db.query(
    `UPDATE flash_sale_products
     SET discounted_price = COALESCE($3, discounted_price),
         stock_limit      = COALESCE($4, stock_limit)
     WHERE flash_sale_id = $1 AND product_id = $2
     RETURNING id AS "flashSaleProductId",
               flash_sale_id AS "flashSaleId",
               product_id    AS "productId",
               discounted_price AS "discountedPrice",
               stock_limit   AS "stockLimit",
               sold_count    AS "soldCount"`,
    [sid, pid, discountedPrice ?? null, stockLimit ?? null],
  );
  if (!res.rows.length) throw new AppError('Sản phẩm không có trong flash sale này', 404);
  return {
    ...res.rows[0],
    discountedPrice: Number(res.rows[0].discountedPrice),
  };
}

export async function removeProductFromFlashSale(flashSaleId, productId) {
  const res = await db.query(
    `DELETE FROM flash_sale_products
     WHERE flash_sale_id = $1 AND product_id = $2
     RETURNING id`,
    [Number(flashSaleId), Number(productId)],
  );
  if (!res.rows.length) throw new AppError('Sản phẩm không có trong flash sale này', 404);
}

// ─── Cart validation helper ───────────────────────────────────────────────────

/**
 * Kiểm tra xem sản phẩm có đang trong một flash sale đang hoạt động không.
 * Được gọi từ cart.service.js trước khi thêm vào giỏ.
 *
 * @returns {object|null} flash_sale_products row nếu có, null nếu không.
 */
export async function checkFlashSaleForProduct(productId) {
  const res = await db.query(
    `SELECT
       fsp.id               AS "flashSaleProductId",
       fsp.flash_sale_id    AS "flashSaleId",
       fsp.discounted_price AS "discountedPrice",
       fsp.stock_limit      AS "stockLimit",
       fsp.sold_count       AS "soldCount"
     FROM flash_sale_products fsp
     JOIN flash_sales fs ON fs.id = fsp.flash_sale_id
     WHERE fsp.product_id = $1
       AND fs.is_active = true
       AND fs.start_time <= NOW()
       AND fs.end_time   >= NOW()
     LIMIT 1`,
    [Number(productId)],
  );
  if (!res.rows.length) return null;
  return {
    ...res.rows[0],
    discountedPrice: Number(res.rows[0].discountedPrice),
  };
}
