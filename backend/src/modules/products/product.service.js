import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';

// "M,L" -> ['M','L']; rỗng/undefined -> []
const csv = (s) => (s ? s.split(',').map(v => v.trim()).filter(Boolean) : []);

// rating là NUMERIC → pg trả về string, cast ::float để client nhận number
const PRODUCT_COLS =
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
    where.push(`collection = $${params.length}`);
  }
  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where.push(`(LOWER(name) LIKE $${params.length} OR LOWER(type) LIKE $${params.length})`);
  }
  if (priceMin != null) {
    params.push(priceMin);
    where.push(`price >= $${params.length}`);
  }
  if (priceMax != null) {
    params.push(priceMax);
    where.push(`price <= $${params.length}`);
  }
  // Lọc Ưu Đãi: discount > 0
  if (isSale === 'true') {
    where.push(`discount > 0`);
  }
  // Facet đa lựa chọn trên JSONB: '?|' = mảng chứa BẤT KỲ phần tử nào
  const fColors = csv(colors);
  if (fColors.length) {
    params.push(fColors);
    where.push(`colors ?| $${params.length}`);
  }
  const fSizes = csv(sizes);
  if (fSizes.length) {
    params.push(fSizes);
    where.push(`sizes ?| $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sortMap = {
    price_asc:  'price ASC',
    price_desc: 'price DESC',
    rating:     'rating DESC',
    sold:       'sold DESC',
    newest:     'id ASC',
  };
  const orderSql = `ORDER BY ${sortMap[sort] ?? sortMap.newest}`;

  const countRes = await db.query(`SELECT COUNT(*)::int AS total FROM products ${whereSql}`, params);
  const total = countRes.rows[0].total;
  const totalPages = Math.ceil(total / limit) || 1;

  params.push(limit);
  const limitIdx = params.length;
  params.push((page - 1) * limit);
  const offsetIdx = params.length;

  const res = await db.query(
    `SELECT ${PRODUCT_COLS} FROM products ${whereSql} ${orderSql} LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params,
  );

  return { data: res.rows, pagination: { page, limit, total, totalPages } };
}

export async function getProductById(id) {
  const res = await db.query(`SELECT ${PRODUCT_COLS} FROM products WHERE id = $1`, [Number(id)]);
  if (!res.rows.length) throw new AppError('Không tìm thấy sản phẩm', 404);
  return res.rows[0];
}

export async function getProductByHandle(handle) {
  const res = await db.query(`SELECT ${PRODUCT_COLS} FROM products WHERE handle = $1`, [handle]);
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
     RETURNING ${PRODUCT_COLS}`,
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
    `UPDATE products SET ${sets.join(', ')} WHERE id = $1 RETURNING ${PRODUCT_COLS}`,
    params,
  );
  if (!res.rows.length) throw new AppError('Không tìm thấy sản phẩm', 404);
  return res.rows[0];
}

export async function deleteProduct(id) {
  const res = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [Number(id)]);
  if (!res.rows.length) throw new AppError('Không tìm thấy sản phẩm', 404);
}
