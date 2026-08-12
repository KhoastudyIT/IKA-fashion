import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';

const PRODUCT_COLS =
  `id, name, handle, collection, type, price, original_price, discount,
   img, images, colors, sizes, features,
   rating::float AS rating, sold, stock, description`;

export async function listCollections(query = {}) {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;

  const countRes = await db.query("SELECT COUNT(*)::int AS total FROM collections WHERE slug != 'sale'");
  const total = countRes.rows[0].total;

  const res = await db.query(`
    SELECT c.id, c.slug, c.name, c.img,
           COUNT(p.id)::int AS "productCount"
    FROM collections c
    LEFT JOIN products p ON p.collection = c.slug
    WHERE c.slug != 'sale'
    GROUP BY c.id, c.slug, c.name, c.img
    ORDER BY c.id
    LIMIT $1 OFFSET $2
  `, [limit, (page - 1) * limit]);
  
  return {
    data: res.rows,
    pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) }
  };
}

export async function getCollectionBySlug(slug) {
  const col = await db.query('SELECT id, slug, name, img FROM collections WHERE slug = $1', [slug]);
  if (!col.rows.length) throw new AppError('Không tìm thấy danh mục', 404);

  const items = await db.query(
    `SELECT ${PRODUCT_COLS} FROM products WHERE collection = $1 ORDER BY id`,
    [slug],
  );
  return { ...col.rows[0], products: items.rows };
}

export async function createCollection({ name, slug, img }) {
  const dup = await db.query('SELECT id FROM collections WHERE slug = $1', [slug]);
  if (dup.rows.length) throw new AppError('Slug danh mục đã tồn tại', 409);

  const res = await db.query(
    `INSERT INTO collections (name, slug, img) VALUES ($1, $2, $3)
     RETURNING id, slug, name, img`,
    [name, slug, img || '/products/ao-thun-trang.png'],
  );
  return res.rows[0];
}

export async function updateCollection(id, data) {
  const res = await db.query(
    `UPDATE collections SET
       name = COALESCE($2, name),
       slug = COALESCE($3, slug),
       img  = COALESCE($4, img)
     WHERE id = $1
     RETURNING id, slug, name, img`,
    [Number(id), data.name ?? null, data.slug ?? null, data.img ?? null],
  );
  if (!res.rows.length) throw new AppError('Không tìm thấy danh mục', 404);
  return res.rows[0];
}

export async function deleteCollection(id) {
  const res = await db.query('DELETE FROM collections WHERE id = $1 RETURNING id', [Number(id)]);
  if (!res.rows.length) throw new AppError('Không tìm thấy danh mục', 404);
}
