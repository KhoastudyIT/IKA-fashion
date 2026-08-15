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

   // Flash sale — mỗi dòng là một sản phẩm.
   //
   // Bản đầu tiên của tính năng dùng hai bảng (chiến dịch + sản phẩm trong chiến
   // dịch). Mô hình đó bị thay bằng một bảng phẳng nên phải dọn bảng cũ; tính
   // năng chưa phát hành nên không có dữ liệu thật để giữ.
   `DROP TABLE IF EXISTS flash_sale_products CASCADE`,
   `ALTER TABLE order_items DROP COLUMN IF EXISTS flash_sale_product_id`,
   `DROP TABLE IF EXISTS flash_sales CASCADE`,

   `CREATE EXTENSION IF NOT EXISTS "btree_gist"`,
   `CREATE TABLE IF NOT EXISTS flash_sales (
     id             SERIAL      PRIMARY KEY,
     product_id     INTEGER     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
     price          INTEGER     NOT NULL CHECK (price > 0),
     original_price INTEGER     NOT NULL CHECK (original_price > 0),
     stock          INTEGER     NOT NULL DEFAULT 0 CHECK (stock >= 0),
     sold           INTEGER     NOT NULL DEFAULT 0 CHECK (sold >= 0),
     starts_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     ends_at        TIMESTAMPTZ,
     active         BOOLEAN     NOT NULL DEFAULT true,
     created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     CONSTRAINT flash_sales_no_overlap EXCLUDE USING gist (
       product_id WITH =,
       tstzrange(starts_at, ends_at) WITH &&
     ) WHERE (active)
   )`,
   `CREATE INDEX IF NOT EXISTS idx_flash_sales_product ON flash_sales (product_id)`,
   `CREATE INDEX IF NOT EXISTS idx_flash_sales_active_time ON flash_sales (active, starts_at, ends_at)`,

   // Dòng đơn hàng ghi lại giá niêm yết và chương trình flash đã dùng, để tra
   // cứu mức giảm và để hoàn suất khi hủy đơn.
   `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS list_price INTEGER CHECK (list_price >= 0)`,
   `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS flash_sale_id INTEGER
     REFERENCES flash_sales(id) ON DELETE SET NULL`,
   `CREATE INDEX IF NOT EXISTS idx_order_items_flash ON order_items (flash_sale_id)`,

   // Trả hàng / đổi mới — thêm sau nên DB cũ chưa có bảng và chưa có hai giá trị
   // trạng thái mới.
   `ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check`,
   `ALTER TABLE orders ADD CONSTRAINT orders_status_check
     CHECK (status IN ('pending', 'confirmed', 'shipped', 'completed', 'cancelled', 'returned'))`,
   `ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check`,
   `ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check
     CHECK (payment_status IN ('unpaid', 'paid', 'refunded'))`,

   `CREATE TABLE IF NOT EXISTS order_returns (
     id           SERIAL       PRIMARY KEY,
     order_id     UUID         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
     type         VARCHAR(20)  NOT NULL CHECK (type IN ('return', 'exchange')),
     reason       VARCHAR(500) NOT NULL,
     status       VARCHAR(20)  NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
     admin_note   VARCHAR(500) NOT NULL DEFAULT '',
     resolved_at  TIMESTAMPTZ,
     created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
     updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
   )`,
   `ALTER TABLE order_returns ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb`,
   `CREATE UNIQUE INDEX IF NOT EXISTS idx_order_returns_one_open
     ON order_returns (order_id) WHERE status IN ('pending', 'approved')`,
   `CREATE INDEX IF NOT EXISTS idx_order_returns_order ON order_returns (order_id)`,
   `CREATE INDEX IF NOT EXISTS idx_order_returns_status ON order_returns (status, created_at DESC)`,

   `ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason VARCHAR(500) NOT NULL DEFAULT ''`,
   `ALTER TABLE order_returns DROP CONSTRAINT IF EXISTS order_returns_status_check`,
   `ALTER TABLE order_returns ADD CONSTRAINT order_returns_status_check
     CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled'))`,

   // Cửa hàng thu tiền khi giao, nên đơn đã hoàn thành phải là đã thanh toán.
   // Dọn các đơn cũ còn mắc kẹt ở trạng thái mâu thuẫn này.
   `UPDATE orders SET payment_status = 'paid'
   WHERE status = 'completed' AND payment_status = 'unpaid'`,
];

export async function runMigrations() {
   for (const sql of STATEMENTS) {
      await db.query(sql);
   }
}
