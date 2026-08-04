import db from './index.js';

/**
 * Migration chạy lúc khởi động server.
 *
 * File `database/ika_database.sql` chỉ được Postgres nạp khi KHỞI TẠO database
 * lần đầu, nên máy nào đã có sẵn volume dữ liệu sẽ không bao giờ thấy các cột
 * mới. Những câu lệnh dưới đây đều idempotent (IF NOT EXISTS / DROP rồi ADD),
 * chạy lại bao nhiêu lần cũng không hỏng dữ liệu.
 */
const STATEMENTS = [
  `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT true`,
  `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_product_id INTEGER REFERENCES products(id) ON DELETE SET NULL`,

  // Tin của bot không có người gửi.
  `ALTER TABLE messages ALTER COLUMN sender_id DROP NOT NULL`,
  `ALTER TABLE messages ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL`,
  `ALTER TABLE messages ADD COLUMN IF NOT EXISTS suggestions JSONB NOT NULL DEFAULT '[]'::jsonb`,
  `ALTER TABLE messages ADD COLUMN IF NOT EXISTS intent VARCHAR(40) NOT NULL DEFAULT ''`,

  // Postgres không có ADD CONSTRAINT IF NOT EXISTS nên phải DROP trước —
  // vì vậy cặp lệnh này mới idempotent.
  `ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_role_check`,
  `ALTER TABLE messages ADD CONSTRAINT messages_sender_role_check
     CHECK (sender_role IN ('customer', 'admin', 'ai'))`,
];

export async function runMigrations() {
  for (const sql of STATEMENTS) {
    await db.query(sql);
  }
}
