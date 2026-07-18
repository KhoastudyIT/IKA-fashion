// Tạo database + nạp schema/seed cho môi trường LOCAL (không dùng Docker).
// Trong Docker, Postgres tự nạp file .sql qua /docker-entrypoint-initdb.d,
// nên script này chỉ dùng khi chạy Postgres cài sẵn trên máy.
//
// Chạy:  node src/db/setup.js
import 'dotenv/config';
import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connectionUrl = process.env.DATABASE_URL
  ?? 'postgresql://postgres:postgres@localhost:5432/ika_fashion';

// Tên DB nằm ở cuối connection string
const dbName = connectionUrl.replace(/\/+$/, '').split('/').pop().split('?')[0];

async function setup() {
  // 1) Kết nối vào DB 'postgres' mặc định để tạo DB đích nếu chưa có
  const defaultUrl = connectionUrl.replace(/\/[^/]+(\?.*)?$/, '/postgres');
  const admin = new Client({ connectionString: defaultUrl });
  try {
    await admin.connect();
    const res = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (res.rowCount === 0) {
      console.log(`Tạo database '${dbName}'...`);
      await admin.query(`CREATE DATABASE ${dbName}`);
    } else {
      console.log(`Database '${dbName}' đã tồn tại.`);
    }
  } catch (err) {
    console.error('Không kết nối được Postgres. Postgres đã chạy chưa? Mật khẩu đúng chưa?');
    console.error(err.message);
    process.exit(1);
  } finally {
    await admin.end();
  }

  // 2) Kết nối vào DB đích và chạy file .sql
  const client = new Client({ connectionString: connectionUrl });
  try {
    await client.connect();
    const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'database', 'ika_database.sql'), 'utf8');
    console.log('Đang nạp schema + seed...');
    await client.query(sql);
    console.log('Xong! Dữ liệu đã sẵn sàng.');
  } catch (err) {
    console.error('Lỗi khi nạp file SQL:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setup();
