import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';
import { activeFlashJoin, effectivePriceSQL } from '../../utils/price.js';

// "M,L" -> ['M','L']; rỗng/undefined -> []
const csv = (s) => (s ? s.split(',').map(v => v.trim()).filter(Boolean) : []);

// rating là NUMERIC → pg trả về string, cast ::float để client nhận number
//
// `price` giữ nguyên giá niêm yết trong bảng products — form sửa sản phẩm của
// admin đọc đúng cột này, đổi nó thành giá flash là admin lưu nhầm giá khuyến
// mãi thành giá gốc. Giá khách phải trả nằm ở `effective_price`.
const PRODUCT_COLS =
  `p.id, p.name, p.handle, p.collection, p.type, p.price, p.original_price, p.discount,
   p.img, p.images, p.colors, p.sizes, p.features,
   p.rating::float AS rating, p.sold, p.stock, p.description,
   active_flash.price     AS flash_price,
   active_flash.remaining AS flash_remaining,
   ${effectivePriceSQL('p')} AS effective_price`;

const PRODUCT_FROM = `FROM products p ${activeFlashJoin('p')}`;

// Bản không có bí danh, dùng cho RETURNING của INSERT/UPDATE — ở đó không có
// LATERAL join nên không tham chiếu được active_flash.
const PRODUCT_COLS_RAW =
  `id, name, handle, collection, type, price, original_price, discount,
   img, images, colors, sizes, features,
   rating::float AS rating, sold, stock, description`;

// Cột JSONB — khi ghi phải stringify
const JSON_FIELDS = new Set(['images', 'colors', 'sizes', 'features']);

export async function listProducts({
  collection, search, sort = 'newest', page = 1, limit = 12,
  priceMin, priceMax, colors, sizes, isSale,
}) {
  page = Number(page) || 1;
  limit = Number(limit) || 12;

  const params = [];
  const where = [];

  if (collection) {
    params.push(collection);
    where.push(`p.collection = $${params.length}`);
  }
  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where.push(`(LOWER(p.name) LIKE $${params.length} OR LOWER(p.type) LIKE $${params.length})`);
  }
  // Lọc theo GIÁ HIỆU LỰC, không phải giá niêm yết.
  //
  // Trước đây lọc chạy trên p.price còn sắp xếp chạy trên effective_price: áo
  // niêm yết 500k đang flash sale còn 200k KHÔNG hiện ra khi khách lọc "dưới
  // 300k" — đúng những món rẻ nhất lại bị giấu đi.
  if (priceMin != null) {
    params.push(priceMin);
    where.push(`${effectivePriceSQL('p')} >= $${params.length}`);
  }
  if (priceMax != null) {
    params.push(priceMax);
    where.push(`${effectivePriceSQL('p')} <= $${params.length}`);
  }
  // Lọc Ưu Đãi: đang giảm giá theo sản phẩm HOẶC đang có suất flash sale.
  // Chỉ xét p.discount thì sản phẩm đang flash sale mà giá gốc không giảm sẽ
  // vắng mặt khỏi đúng mục Ưu Đãi.
  if (isSale === 'true') {
    where.push(`(p.discount > 0 OR active_flash.id IS NOT NULL)`);
  }
  // Facet đa lựa chọn trên JSONB: '?|' = mảng chứa BẤT KỲ phần tử nào
  const fColors = csv(colors);
  if (fColors.length) {
    params.push(fColors);
    where.push(`p.colors ?| $${params.length}`);
  }
  const fSizes = csv(sizes);
  if (fSizes.length) {
    params.push(fSizes);
    where.push(`p.sizes ?| $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // Sắp theo giá thì phải theo giá khách thật sự trả, không thì sản phẩm đang
  // flash sale nằm sai chỗ trong danh sách "giá thấp đến cao".
  const sortMap = {
    price_asc:  'effective_price ASC',
    price_desc: 'effective_price DESC',
    rating:     'p.rating DESC',
    sold:       'p.sold DESC',
    newest:     'p.id ASC',
  };
  const orderSql = `ORDER BY ${sortMap[sort] ?? sortMap.newest}`;

  // Đếm PHẢI dùng cùng FROM với truy vấn lấy dữ liệu: bộ lọc giá và bộ lọc Ưu
  // Đãi đều tham chiếu active_flash, bỏ join là câu đếm lỗi ngay — và nếu đếm
  // theo điều kiện khác thì số trang sẽ không khớp số sản phẩm thật.
  const countRes = await db.query(`SELECT COUNT(*)::int AS total ${PRODUCT_FROM} ${whereSql}`, params);
  const total = countRes.rows[0].total;
  const totalPages = Math.ceil(total / limit) || 1;

  params.push(limit);
  const limitIdx = params.length;
  params.push((page - 1) * limit);
  const offsetIdx = params.length;

  const res = await db.query(
    `SELECT ${PRODUCT_COLS} ${PRODUCT_FROM} ${whereSql} ${orderSql} LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params,
  );

  return { data: res.rows, pagination: { page, limit, total, totalPages } };
}

/**
 * Tồn kho từng biến thể của một sản phẩm, dạng { "S|Trắng": 6, ... }.
 *
 * Chỉ gắn vào TRANG CHI TIẾT, không gắn vào danh sách: danh sách hiển thị 12–24
 * sản phẩm một trang, kéo theo cả bảng biến thể sẽ nặng mà giao diện không dùng.
 */
async function variantStockOf(productId) {
  const res = await db.query(
    'SELECT size, color, stock FROM product_variants WHERE product_id = $1',
    [productId],
  );
  return Object.fromEntries(res.rows.map(r => [`${r.size}|${r.color}`, r.stock]));
}

export async function getProductById(id) {
  const res = await db.query(`SELECT ${PRODUCT_COLS} ${PRODUCT_FROM} WHERE p.id = $1`, [Number(id)]);
  if (!res.rows.length) throw new AppError('Không tìm thấy sản phẩm', 404);
  const row = res.rows[0];
  row.variantStock = await variantStockOf(row.id);
  return row;
}

export async function getProductByHandle(handle) {
  const res = await db.query(`SELECT ${PRODUCT_COLS} ${PRODUCT_FROM} WHERE p.handle = $1`, [handle]);
  if (!res.rows.length) throw new AppError('Không tìm thấy sản phẩm', 404);
  const row = res.rows[0];
  row.variantStock = await variantStockOf(row.id);
  return row;
}

/**
 * Đồng bộ bảng biến thể sau khi admin thêm hoặc sửa sản phẩm.
 *
 * Quy tắc:
 *   - size/màu mới xuất hiện  → thêm biến thể, tồn kho 0 (admin tự nhập sau);
 *   - size/màu bị bỏ đi       → xoá biến thể tương ứng;
 *   - biến thể đang có        → GIỮ NGUYÊN tồn kho, không đụng vào.
 *
 * Rồi cập nhật products.stock = tổng các biến thể, để mọi truy vấn cũ đang đọc
 * cột đó vẫn ra số đúng.
 *
 * Sản phẩm không khai size hoặc màu thì không sinh biến thể nào — tồn kho của
 * nó tiếp tục nằm ở products.stock như trước.
 */
async function syncVariants(productId, { sizes, colors }) {
  const list = (sizes ?? []).flatMap(s => (colors ?? []).map(c => ({ size: s, color: c })));

  if (!list.length) {
    await db.query('DELETE FROM product_variants WHERE product_id = $1', [productId]);
    return;
  }

  await db.query(
    `DELETE FROM product_variants
     WHERE product_id = $1
       AND (size, color) NOT IN (SELECT * FROM UNNEST($2::text[], $3::text[]))`,
    [productId, list.map(v => v.size), list.map(v => v.color)],
  );

  await db.query(
    `INSERT INTO product_variants (product_id, size, color, stock)
     SELECT $1, s, c, 0 FROM UNNEST($2::text[], $3::text[]) AS t(s, c)
     ON CONFLICT (product_id, size, color) DO NOTHING`,
    [productId, list.map(v => v.size), list.map(v => v.color)],
  );

  await db.query(
    `UPDATE products p
     SET stock = COALESCE((SELECT SUM(v.stock) FROM product_variants v
                           WHERE v.product_id = p.id), 0)
     WHERE p.id = $1`,
    [productId],
  );
}

/**
 * Chia đều một tổng tồn kho cho các biến thể, phần dư dồn vào biến thể đầu.
 *
 * Dùng khi TẠO sản phẩm mới: admin gõ một con số tổng ở form, chưa có màn hình
 * nhập từng size. Không có bước này thì syncVariants tạo mọi biến thể với tồn
 * kho 0 rồi tính lại tổng = 0, tức con số admin vừa gõ biến mất.
 *
 * Cùng công thức với lần sinh biến thể đầu tiên trong migrate.js.
 */
async function distributeStock(productId, total) {
  const n = Number(total) || 0;
  if (n <= 0) return;

  const vs = await db.query(
    'SELECT id FROM product_variants WHERE product_id = $1 ORDER BY id',
    [productId],
  );
  if (!vs.rows.length) return;

  const moi = Math.floor(n / vs.rows.length);
  const du = n % vs.rows.length;
  for (const [i, v] of vs.rows.entries()) {
    await db.query('UPDATE product_variants SET stock = $2 WHERE id = $1',
      [v.id, moi + (i === 0 ? du : 0)]);
  }
  await db.query(
    `UPDATE products p SET stock = COALESCE(
       (SELECT SUM(v.stock) FROM product_variants v WHERE v.product_id = p.id), 0)
     WHERE p.id = $1`,
    [productId],
  );
}

/**
 * Admin đặt tồn kho cho từng biến thể.
 *
 * Nhận { "S|Trắng": 12, ... } — đúng khuôn mà getProductById trả ra, để form
 * quản trị đọc sao thì ghi lại y vậy.
 */
export async function setVariantStock(id, variantStock) {
  const productId = Number(id);
  const entries = Object.entries(variantStock ?? {});

  for (const [key, stock] of entries) {
    const [size, color] = String(key).split('|');
    if (!size || !color) throw new AppError(`Khóa biến thể không hợp lệ: ${key}`, 400);
    const n = Number(stock);
    if (!Number.isInteger(n) || n < 0) {
      throw new AppError(`Tồn kho của "${key}" phải là số nguyên không âm`, 400);
    }
    const res = await db.query(
      `UPDATE product_variants SET stock = $4, updated_at = NOW()
       WHERE product_id = $1 AND size = $2 AND color = $3 RETURNING id`,
      [productId, size, color, n],
    );
    if (!res.rows.length) {
      throw new AppError(`Sản phẩm không có biến thể size ${size} màu ${color}`, 404);
    }
  }

  await db.query(
    `UPDATE products p
     SET stock = COALESCE((SELECT SUM(v.stock) FROM product_variants v
                           WHERE v.product_id = p.id), 0),
         updated_at = NOW()
     WHERE p.id = $1`,
    [productId],
  );
  return getProductById(productId);
}

export async function createProduct(data) {
  const dup = await db.query('SELECT id FROM products WHERE handle = $1', [data.handle]);
  if (dup.rows.length) throw new AppError('Handle đã tồn tại', 409);

  const res = await db.query(
    `INSERT INTO products
       (name, handle, collection, type, price, original_price, discount,
        img, images, colors, sizes, features, stock, description)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12::jsonb,$13,$14)
     RETURNING ${PRODUCT_COLS_RAW}`,
    [
      data.name, data.handle, data.collection, data.type, data.price,
      data.original_price ?? null,
      data.discount ?? 0,
      data.img ?? '/products/placeholder.png',
      JSON.stringify(data.images ?? []),
      JSON.stringify(data.colors ?? []),
      JSON.stringify(data.sizes ?? []),
      JSON.stringify(data.features ?? []),
      data.stock ?? 0, data.description ?? '',
    ],
  );
  const row = res.rows[0];

  // Sản phẩm mới: sinh biến thể theo bảng size x màu vừa khai, rồi chia đều
  // tổng tồn kho admin gõ cho các biến thể đó. Admin chỉnh lại từng size sau
  // bằng màn hình sửa tồn kho theo biến thể.
  await syncVariants(row.id, { sizes: data.sizes ?? [], colors: data.colors ?? [] });
  await distributeStock(row.id, data.stock ?? 0);
  return getProductById(row.id);
}

export async function updateProduct(id, data) {
  const allowed = ['name', 'handle', 'collection', 'type', 'price', 'original_price', 'discount',
    'img', 'images', 'colors', 'sizes', 'features', 'rating', 'sold', 'stock', 'description'];

  const sets = [];
  const params = [Number(id)];
  for (const key of allowed) {
    if (data[key] === undefined) continue;
    if (JSON_FIELDS.has(key)) {
      params.push(JSON.stringify(data[key]));
      sets.push(`${key} = $${params.length}::jsonb`);
    } else {
      params.push(data[key]);
      sets.push(`${key} = $${params.length}`);
    }
  }
  if (!sets.length) return getProductById(id);
  sets.push('updated_at = NOW()');

  const res = await db.query(
    `UPDATE products SET ${sets.join(', ')} WHERE id = $1 RETURNING ${PRODUCT_COLS_RAW}`,
    params,
  );
  if (!res.rows.length) throw new AppError('Không tìm thấy sản phẩm', 404);

  // Chỉ đồng bộ khi admin thực sự đổi bảng size hoặc màu. Sửa tên hay giá thì
  // không đụng tới kho.
  if (data.sizes !== undefined || data.colors !== undefined) {
    const cur = res.rows[0];
    await syncVariants(cur.id, { sizes: cur.sizes, colors: cur.colors });
    return getProductById(cur.id);
  }
  return res.rows[0];
}

export async function deleteProduct(id) {
  const res = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [Number(id)]);
  if (!res.rows.length) throw new AppError('Không tìm thấy sản phẩm', 404);
}
