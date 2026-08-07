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

  // Tin tức — thêm sau nên DB cũ chưa có bảng.
  `CREATE TABLE IF NOT EXISTS news_categories (
     id         SERIAL       PRIMARY KEY,
     name       VARCHAR(120) NOT NULL,
     slug       VARCHAR(140) NOT NULL UNIQUE,
     sort_order INTEGER      NOT NULL DEFAULT 0,
     created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
   )`,
  `CREATE TABLE IF NOT EXISTS news (
     id           SERIAL       PRIMARY KEY,
     title        VARCHAR(300) NOT NULL,
     slug         VARCHAR(350) NOT NULL UNIQUE,
     img          VARCHAR(500) NOT NULL DEFAULT '',
     excerpt      VARCHAR(500) NOT NULL DEFAULT '',
     content      TEXT         NOT NULL DEFAULT '',
     author       VARCHAR(100) NOT NULL DEFAULT 'IKA Fashion',
     category_id  INTEGER      REFERENCES news_categories(id) ON DELETE SET NULL,
     status       VARCHAR(20)  NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
     publish_date DATE         NOT NULL DEFAULT CURRENT_DATE,
     created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
     updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_news_status_publish ON news (status, publish_date DESC, id DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_news_category ON news (category_id)`,

  // Danh mục mặc định để admin có sẵn lựa chọn trong form.
  `INSERT INTO news_categories (name, slug, sort_order) VALUES
     ('Xu Hướng', 'xu-huong', 1),
     ('Phối Đồ', 'phoi-do', 2),
     ('Bảo Quản', 'bao-quan', 3),
     ('Tin Cửa Hàng', 'tin-cua-hang', 4)
   ON CONFLICT (slug) DO NOTHING`,
];

export async function runMigrations() {
  for (const sql of STATEMENTS) {
    await db.query(sql);
  }
}
