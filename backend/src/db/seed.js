import bcrypt from 'bcryptjs';
import db from './index.js';

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
