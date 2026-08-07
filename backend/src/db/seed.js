import bcrypt from 'bcryptjs';
import db from './index.js';
import { NEWS_SEED } from './seed-data/news.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@ika.vn';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123';

/**
 * Seed tài khoản admin mặc định để vào được khu quản trị.
 * Đăng ký công khai chỉ tạo tài khoản `customer`, nên nếu không seed
 * sẽ không có cách nào lấy được token admin.
 */
export async function seedAdmin() {
  const check = await db.query('SELECT id FROM users WHERE email = $1', [ADMIN_EMAIL]);
  if (check.rows.length > 0) {
    console.log(`  Admin    : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    return;
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await db.query(
    `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'admin')`,
    ['Quản trị viên', ADMIN_EMAIL, hashed],
  );

  console.log(`  Admin    : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

/**
 * Seed bài viết tin tức mẫu để người mới clone repo về có nội dung xem ngay.
 *
 * CHỈ chạy khi bảng `news` hoàn toàn trống. Không dùng ON CONFLICT DO NOTHING
 * theo từng bài — làm vậy thì bài admin xoá sẽ mọc lại sau mỗi lần khởi động.
 */
export async function seedNews() {
  const count = await db.query('SELECT COUNT(*)::int AS n FROM news');
  if (count.rows[0].n > 0) {
    console.log(`  Tin tức  : đã có ${count.rows[0].n} bài, bỏ qua seed`);
    return;
  }

  // Tra id danh mục theo slug — không hardcode vì thứ tự SERIAL có thể khác máy
  const cats = await db.query('SELECT id, slug FROM news_categories');
  const idBySlug = Object.fromEntries(cats.rows.map(r => [r.slug, r.id]));

  let inserted = 0;
  for (const a of NEWS_SEED) {
    await db.query(
      `INSERT INTO news (title, slug, img, excerpt, content, author, category_id, status, publish_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (slug) DO NOTHING`,
      [
        a.title, a.slug, a.img, a.excerpt, a.content, a.author,
        a.categorySlug ? idBySlug[a.categorySlug] ?? null : null,
        a.status, a.date,
      ],
    );
    inserted++;
  }

  console.log(`  Tin tức  : đã nạp ${inserted} bài viết mẫu`);
}
