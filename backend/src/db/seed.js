import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { users } from './store.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@ika.vn';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123';

/**
 * Seed tài khoản admin mặc định để vào được khu quản trị.
 * Đăng ký công khai chỉ tạo tài khoản `customer`, nên nếu không seed
 * sẽ không có cách nào lấy được token admin.
 */
export async function seedAdmin() {
  const exists = [...users.values()].some(u => u.email === ADMIN_EMAIL);
  if (exists) return;

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = {
    id: randomUUID(),
    name: 'Quản trị viên',
    email: ADMIN_EMAIL,
    password: hashed,
    role: 'admin',
    phone: '',
    address: '',
    createdAt: new Date().toISOString(),
  };
  users.set(admin.id, admin);

  console.log(`  Admin    : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}
