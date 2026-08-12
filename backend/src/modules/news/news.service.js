import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';

// ---------- Helpers ----------

const toSlug = (value) => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')   // bỏ dấu tiếng Việt
  .replace(/[đĐ]/g, 'd')   // đ / Đ không nằm trong dải trên
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'bai-viet';

// excludeId: khi sửa, bài viết không được coi chính nó là trùng slug.
async function ensureUniqueSlug(base, excludeId = null) {
  let slug = base;
  let suffix = 2;
  for (;;) {
    const res = await db.query(
      'SELECT 1 FROM news WHERE slug = $1 AND ($2::int IS NULL OR id <> $2)',
      [slug, excludeId],
    );
    if (!res.rows.length) return slug;
    slug = `${base}-${suffix++}`;
  }
}

const pad = (n) => String(n).padStart(2, '0');

// publish_date là DATE — truyền/nhận chuỗi 'yyyy-mm-dd' để không lệch ngày do múi giờ.
function parseDateInput(value) {
  if (!value) return null;
  const dmy = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${pad(Number(m))}-${pad(Number(d))}`;
  }
  const iso = String(value).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const [, y, m, d] = iso;
    return `${y}-${pad(Number(m))}-${pad(Number(d))}`;
  }
  return null;
}

function isoDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const todayIso = () => isoDate(new Date());

// Nội dung lưu dạng văn bản thuần: gỡ hết thẻ HTML để frontend render mà không
// cần dangerouslySetInnerHTML. Chuẩn hoá CRLF về LF vì frontend tách đoạn bằng
// /\n{2,}/ — dán từ Word mà lọt \r\n\r\n thì cả bài dồn thành một khối.
const normalizeContent = (text) => String(text)
  .replace(/\r\n?/g, '\n')
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]*>/g, '')
  .trim();

// Chuỗi rỗng từ form dashboard = "không có giá trị".
const emptyToNull = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
};

function mapRow(row, { withContent = true } = {}) {
  const article = {
    id:       row.id,
    title:    row.title,
    slug:     row.slug,
    img:      row.img,
    excerpt:  row.excerpt,
    author:   row.author,
    category: row.category_id
      ? { id: row.category_id, name: row.category_name, slug: row.category_slug }
      : null,
    status:      row.status,
    publishDate: isoDate(row.publish_date),
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
  if (withContent) article.content = row.content;
  return article;
}

const SELECT_BASE = `
  SELECT n.*, c.name AS category_name, c.slug AS category_slug
  FROM news n
  LEFT JOIN news_categories c ON c.id = n.category_id
`;

const SORT_SQL = {
  newest: 'n.publish_date DESC, n.id DESC',
  oldest: 'n.publish_date ASC, n.id ASC',
};

function buildFilters({ status, search, category }) {
  const params = [];
  const where = [];

  if (status) {
    params.push(status);
    where.push(`n.status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(n.title ILIKE $${params.length} OR n.excerpt ILIKE $${params.length})`);
  }
  if (category) {
    params.push(category);
    where.push(`c.slug = $${params.length}`);
  }

  return { params, whereSql: where.length ? ` WHERE ${where.join(' AND ')}` : '' };
}

async function queryList({ filters, sort, page, limit }) {
  const { params, whereSql } = buildFilters(filters);

  const countRes = await db.query(
    `SELECT COUNT(*) FROM news n LEFT JOIN news_categories c ON c.id = n.category_id${whereSql}`,
    params,
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const listParams = [...params, limit, (page - 1) * limit];
  const res = await db.query(
    `${SELECT_BASE}${whereSql}
     ORDER BY ${SORT_SQL[sort] || SORT_SQL.newest}
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams,
  );

  return {
    // Danh sách không cần nội dung đầy đủ
    data: res.rows.map(row => mapRow(row, { withContent: false })),
    pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

// ---------- Công khai ----------

export async function listPublishedNews(query) {
  const { page, limit, sort, ...filters } = query;
  return queryList({ filters: { ...filters, status: 'published' }, sort, page, limit });
}

// Hỗ trợ cả /news/12 lẫn /news/xu-huong-2026 (thân thiện SEO).
export async function getPublishedNews(idOrSlug) {
  const numericId = /^\d+$/.test(String(idOrSlug)) ? Number(idOrSlug) : null;
  const res = await db.query(
    `${SELECT_BASE} WHERE n.status = 'published' AND (n.id = $1 OR n.slug = $2) LIMIT 1`,
    [numericId, String(idOrSlug)],
  );
  if (!res.rows.length) throw new AppError('Không tìm thấy bài viết', 404);
  return mapRow(res.rows[0]);
}

export async function listNewsCategories() {
  const res = await db.query(`
    SELECT c.id, c.name, c.slug, c.sort_order,
           COUNT(n.id) FILTER (WHERE n.status = 'published')::int AS "articleCount"
    FROM news_categories c
    LEFT JOIN news n ON n.category_id = c.id
    GROUP BY c.id
    ORDER BY c.sort_order, c.id
  `);
  return res.rows.map(r => ({
    id:           r.id,
    name:         r.name,
    slug:         r.slug,
    sortOrder:    r.sort_order,
    articleCount: r.articleCount,
  }));
}

// ---------- Admin ----------

export async function listNewsAdmin(query) {
  const { page, limit, sort, ...filters } = query;
  return queryList({ filters, sort, page, limit });
}

export async function getNewsById(id) {
  const res = await db.query(`${SELECT_BASE} WHERE n.id = $1`, [Number(id)]);
  if (!res.rows.length) throw new AppError('Không tìm thấy bài viết', 404);
  return mapRow(res.rows[0]);
}

async function ensureCategoryExists(categoryId) {
  if (categoryId === null || categoryId === undefined) return;
  const res = await db.query('SELECT 1 FROM news_categories WHERE id = $1', [categoryId]);
  if (!res.rows.length) throw new AppError('Danh mục bài viết không tồn tại', 400);
}

export async function createNews(data) {
  await ensureCategoryExists(data.categoryId);

  const content = normalizeContent(data.content);
  if (!content) throw new AppError('Nội dung là bắt buộc', 422);

  const slug = await ensureUniqueSlug(toSlug(data.slug || data.title));

  const res = await db.query(
    `INSERT INTO news (title, slug, img, excerpt, content, author, category_id, status, publish_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      data.title,
      slug,
      data.img ?? '',
      data.excerpt ?? '',
      content,
      emptyToNull(data.author) || 'IKA Fashion',
      data.categoryId ?? null,
      data.status || 'draft',
      parseDateInput(data.date) || todayIso(),
    ],
  );

  return getNewsById(res.rows[0].id);
}

export async function updateNews(id, data) {
  const existing = await db.query('SELECT id FROM news WHERE id = $1', [Number(id)]);
  if (!existing.rows.length) throw new AppError('Không tìm thấy bài viết', 404);

  if (data.categoryId !== undefined) await ensureCategoryExists(data.categoryId);

  const updates = [];
  const push = (column, value) => updates.push([column, value]);

  if (data.title !== undefined)   push('title', data.title);
  if (data.img !== undefined)     push('img', data.img);
  if (data.excerpt !== undefined) push('excerpt', data.excerpt);

  if (data.content !== undefined) {
    const content = normalizeContent(data.content);
    if (!content) throw new AppError('Nội dung là bắt buộc', 422);
    push('content', content);
  }

  // Slug chỉ đổi khi admin sửa tay — đổi tiêu đề không phá URL đã công khai.
  if (data.slug !== undefined) {
    push('slug', await ensureUniqueSlug(toSlug(data.slug), Number(id)));
  }

  if (data.author !== undefined)     push('author', emptyToNull(data.author) || 'IKA Fashion');
  if (data.categoryId !== undefined) push('category_id', data.categoryId ?? null);
  if (data.status !== undefined)     push('status', data.status);
  if (data.date !== undefined)       push('publish_date', parseDateInput(data.date) || todayIso());

  if (!updates.length) return getNewsById(id);

  const values = updates.map(([, value]) => value);
  const assignments = updates.map(([column], index) => `${column} = $${index + 1}`);
  assignments.push('updated_at = NOW()');

  await db.query(
    `UPDATE news SET ${assignments.join(', ')} WHERE id = $${values.length + 1}`,
    [...values, Number(id)],
  );

  return getNewsById(id);
}

export async function updateNewsStatus(id, status) {
  const res = await db.query(
    'UPDATE news SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
    [status, Number(id)],
  );
  if (!res.rows.length) throw new AppError('Không tìm thấy bài viết', 404);
  return getNewsById(id);
}

export async function deleteNews(id) {
  const res = await db.query('DELETE FROM news WHERE id = $1 RETURNING id', [Number(id)]);
  if (!res.rows.length) throw new AppError('Không tìm thấy bài viết', 404);
}
