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
  if (priceMin != null) {
    params.push(priceMin);
    where.push(`p.price >= $${params.length}`);
  }
  if (priceMax != null) {
    params.push(priceMax);
    where.push(`p.price <= $${params.length}`);
  }
  // Lọc Ưu Đãi: discount > 0
  if (isSale === 'true') {
    where.push(`p.discount > 0`);
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

  // Đếm không cần join flash: bộ lọc chỉ đụng tới cột của products.
  const countRes = await db.query(`SELECT COUNT(*)::int AS total FROM products p ${whereSql}`, params);
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

export async function getProductById(id) {
  const res = await db.query(`SELECT ${PRODUCT_COLS} ${PRODUCT_FROM} WHERE p.id = $1`, [Number(id)]);
  if (!res.rows.length) throw new AppError('Không tìm thấy sản phẩm', 404);
  return res.rows[0];
}

export async function getProductByHandle(handle) {
  const res = await db.query(`SELECT ${PRODUCT_COLS} ${PRODUCT_FROM} WHERE p.handle = $1`, [handle]);
  if (!res.rows.length) throw new AppError('Không tìm thấy sản phẩm', 404);
  return res.rows[0];
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
  return res.rows[0];
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
  return res.rows[0];
}

export async function deleteProduct(id) {
  const res = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [Number(id)]);
  if (!res.rows.length) throw new AppError('Không tìm thấy sản phẩm', 404);
}
