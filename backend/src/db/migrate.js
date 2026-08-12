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
  // Vai trò 'staff' (nhân viên) thêm sau nên DB cũ vẫn còn CHECK hai giá trị.
  `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`,
  `ALTER TABLE users ADD CONSTRAINT users_role_check
     CHECK (role IN ('customer', 'staff', 'admin'))`,

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

  `CREATE TABLE IF NOT EXISTS flash_sales (
     id         SERIAL       PRIMARY KEY,
     name       VARCHAR(200) NOT NULL,
     start_time TIMESTAMPTZ  NOT NULL,
     end_time   TIMESTAMPTZ  NOT NULL,
     is_active  BOOLEAN      NOT NULL DEFAULT false,
     created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
     CONSTRAINT flash_sales_time_check CHECK (end_time > start_time)
   )`,
  `CREATE TABLE IF NOT EXISTS flash_sale_products (
     id               SERIAL  PRIMARY KEY,
     flash_sale_id    INTEGER NOT NULL REFERENCES flash_sales(id) ON DELETE CASCADE,
     product_id       INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
     discounted_price INTEGER NOT NULL CHECK (discounted_price >= 0),
     stock_limit      INTEGER NOT NULL CHECK (stock_limit > 0),
     sold_count       INTEGER NOT NULL DEFAULT 0 CHECK (sold_count >= 0),
     UNIQUE (flash_sale_id, product_id)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_flash_sales_active_time ON flash_sales (is_active, start_time, end_time)`,
  `CREATE INDEX IF NOT EXISTS idx_fsp_flash_sale_id ON flash_sale_products (flash_sale_id)`,
  `CREATE INDEX IF NOT EXISTS idx_fsp_product_id ON flash_sale_products (product_id)`,
];

export async function runMigrations() {
  for (const sql of STATEMENTS) {
    await db.query(sql);
  }
}
