import { createHash } from 'crypto';
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
   // dịch). Mô hình đó bị thay bằng một bảng phẳng nên phải dọn bảng cũ.
   //
   // BẮT BUỘC có guard: ba câu dọn dẹp này từng chạy vô điều kiện mỗi lần khởi
   // động, nên xoá sạch flash sale admin vừa tạo — và DROP ... CASCADE gỡ luôn
   // khoá ngoại của order_items.flash_sale_id mà câu ADD COLUMN IF NOT EXISTS
   // phía dưới không tạo lại được (cột đã tồn tại nên câu đó bị bỏ qua).
   // Chỉ dọn khi máy còn dấu vết của mô hình hai bảng cũ.
   `DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables
                 WHERE table_schema = 'public'
                   AND table_name = 'flash_sale_products') THEN
        DROP TABLE IF EXISTS flash_sale_products CASCADE;
        ALTER TABLE order_items DROP COLUMN IF EXISTS flash_sale_product_id;
        DROP TABLE IF EXISTS flash_sales CASCADE;
      END IF;
    END $$`,

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

   // Dọn hậu quả của những lần DROP ... CASCADE trước đây: SERIAL đếm lại từ 1
   // nên flash_sale_id của đơn cũ có thể trỏ sang một chương trình hoàn toàn
   // khác — hủy đơn đó sẽ hoàn suất cho nhầm chương trình.
   `UPDATE order_items SET flash_sale_id = NULL
     WHERE flash_sale_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM flash_sales f WHERE f.id = order_items.flash_sale_id)`,

   // Gắn lại khoá ngoại đã mất theo CASCADE. Không dùng ADD CONSTRAINT trần vì
   // câu đó lỗi khi ràng buộc đã có.
   `DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint
                     WHERE conname = 'order_items_flash_sale_id_fkey'
                       AND conrelid = 'order_items'::regclass) THEN
        ALTER TABLE order_items
          ADD CONSTRAINT order_items_flash_sale_id_fkey
          FOREIGN KEY (flash_sale_id) REFERENCES flash_sales(id) ON DELETE SET NULL;
      END IF;
    END $$`,

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

   // Phí vận chuyển: giao diện đã cộng vào ô "Tổng cộng" từ lâu nhưng đơn không
   // có chỗ nào lưu, nên tổng tiền trong CSDL luôn thiếu đúng bằng phí ship và
   // nhân viên giao hàng không biết phải thu bao nhiêu.
   `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee INTEGER NOT NULL DEFAULT 0`,
   `ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_shipping_fee_check`,
   `ALTER TABLE orders ADD CONSTRAINT orders_shipping_fee_check CHECK (shipping_fee >= 0)`,

   // Phương thức thanh toán và vận chuyển: trước đây bị nhét vào ô ghi chú của
   // khách dưới dạng chuỗi không dấu ("Van chuyen: fast | Thanh toan: cod"),
   // vừa không lọc được vừa ăn mất giới hạn 500 ký tự của ghi chú thật.
   `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) NOT NULL DEFAULT 'cod'`,
   `ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check`,
   `ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
     CHECK (payment_method IN ('cod', 'momo', 'vnpay'))`,
   `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(20) NOT NULL DEFAULT 'standard'`,
   `ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_shipping_method_check`,
   `ALTER TABLE orders ADD CONSTRAINT orders_shipping_method_check
     CHECK (shipping_method IN ('standard', 'fast', 'express'))`,

   // Vớt lại dữ liệu của các đơn cũ đang kẹt trong ô ghi chú. Chỉ nhận giá trị
   // nằm trong CHECK vừa thêm để không làm hỏng ràng buộc.
   `UPDATE orders SET
      shipping_method = substring(notes from 'Van chuyen: ([a-z]+)'),
      payment_method  = substring(notes from 'Thanh toan: ([a-z]+)')
    WHERE notes LIKE 'Van chuyen:%'
      AND substring(notes from 'Van chuyen: ([a-z]+)') IN ('standard', 'fast', 'express')
      AND substring(notes from 'Thanh toan: ([a-z]+)') IN ('cod', 'momo', 'vnpay')`,

   // Trả ô ghi chú lại cho khách, bỏ phần metadata hệ thống chèn vào.
   `UPDATE orders SET notes = COALESCE(substring(notes from 'Ghi chu: (.*)$'), '')
    WHERE notes LIKE 'Van chuyen:%'`,

   // shipping_fee của đơn CŨ cố ý để nguyên 0: tổng tiền của chúng chưa bao giờ
   // cộng phí ship, nên gán phí bây giờ sẽ làm doanh thu (total_price trừ phí)
   // bị tính thiếu. Chỉ đơn đặt từ sau bản sửa này mới có phí thật.
   `ALTER TABLE order_returns DROP CONSTRAINT IF EXISTS order_returns_status_check`,
   `ALTER TABLE order_returns ADD CONSTRAINT order_returns_status_check
     CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled'))`,

   // Khung chat poll lại toàn bộ tin của một hội thoại mỗi 12 giây, và bot
   // đọc ngược vài tin gần nhất để biết nó vừa "chưa hiểu" mấy lần. Cả hai đều
   // là (conversation_id, created_at) — index một cột như cũ vẫn phải sort.
   `CREATE INDEX IF NOT EXISTS idx_messages_conv_created
     ON messages (conversation_id, created_at)`,

   // Cửa hàng thu tiền khi giao, nên đơn đã hoàn thành phải là đã thanh toán.
   // Dọn các đơn cũ còn mắc kẹt ở trạng thái mâu thuẫn này.
   `UPDATE orders SET payment_status = 'paid'
   WHERE status = 'completed' AND payment_status = 'unpaid'`,

   // Mỗi khách chỉ được đánh giá một sản phẩm một lần. Trước đây chỉ kiểm tra
   // "đã mua hàng chưa" nên mua một lần rồi gửi 20 đánh giá 5 sao vẫn được,
   // admin duyệt nhầm là điểm trung bình lệch hẳn.
   //
   // Dọn bản trùng trước, giữ lại bản MỚI NHẤT (id lớn nhất) vì đó là ý kiến
   // sau cùng của khách.
   `DELETE FROM reviews a USING reviews b
     WHERE a.id < b.id
       AND a.user_id = b.user_id
       AND a.product_id = b.product_id
       AND a.user_id IS NOT NULL`,

   // Chỉ số MỘT PHẦN: đánh giá cũ không gắn tài khoản (user_id NULL) vẫn giữ
   // được, và nhiều dòng NULL không đụng nhau.
   `CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_one_per_user
     ON reviews (user_id, product_id) WHERE user_id IS NOT NULL`,

   // ── Tồn kho theo biến thể (size + màu) ──────────────────────────────────
   //
   // Trước đây mỗi sản phẩm chỉ có MỘT con số tồn kho, trong khi giỏ hàng và
   // đơn hàng đều ghi nhận size + màu — nên bán được size M dù thực tế chỉ còn
   // size XL.
   //
   // products.stock KHÔNG bị bỏ đi: nó trở thành TỔNG của các biến thể, được
   // đồng bộ mỗi lần kho thay đổi. Nhờ vậy mọi truy vấn đang đọc products.stock
   // (danh sách sản phẩm, chatbot, cảnh báo sắp hết hàng, thống kê) chạy y
   // nguyên, không phải sửa một dòng nào.
   `CREATE TABLE IF NOT EXISTS product_variants (
     id         SERIAL      PRIMARY KEY,
     product_id INTEGER     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
     size       VARCHAR(20) NOT NULL,
     color      VARCHAR(50) NOT NULL,
     stock      INTEGER     NOT NULL DEFAULT 0 CHECK (stock >= 0),
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     UNIQUE (product_id, size, color)
   )`,
   `CREATE INDEX IF NOT EXISTS idx_product_variants_product
     ON product_variants (product_id)`,

   // Sinh biến thể cho sản phẩm đã có: nhân chéo sizes × colors rồi CHIA ĐỀU
   // tồn kho hiện tại. Phần dư dồn vào biến thể đầu tiên để tổng khớp đúng
   // products.stock, không tự dưng mất hay mọc thêm hàng.
   `INSERT INTO product_variants (product_id, size, color, stock)
    SELECT p.id, s.size, c.color,
           FLOOR(p.stock::numeric / (jsonb_array_length(p.sizes) * jsonb_array_length(p.colors)))
           + CASE WHEN row_number() OVER (PARTITION BY p.id ORDER BY s.ord, c.ord) = 1
                  THEN p.stock % (jsonb_array_length(p.sizes) * jsonb_array_length(p.colors))
                  ELSE 0 END
    FROM products p
    CROSS JOIN LATERAL jsonb_array_elements_text(p.sizes)  WITH ORDINALITY AS s(size, ord)
    CROSS JOIN LATERAL jsonb_array_elements_text(p.colors) WITH ORDINALITY AS c(color, ord)
    WHERE jsonb_array_length(p.sizes) > 0
      AND jsonb_array_length(p.colors) > 0
    ON CONFLICT (product_id, size, color) DO NOTHING`,
];

/**
 * Bảng theo dõi câu lệnh đã áp dụng.
 *
 * Trước đây toàn bộ mảng STATEMENTS chạy lại mỗi lần khởi động. Các câu đều
 * idempotent nên không hỏng dữ liệu, nhưng thời gian khởi động dài dần theo số
 * câu và không ai biết câu nào đã chạy, chạy lúc nào.
 *
 * Theo dõi bằng CHECKSUM của chính câu lệnh chứ không đánh số phiên bản tay:
 *   - thêm câu mới thì chỉ câu đó chạy, 52 câu cũ bỏ qua;
 *   - sửa một câu cũ thì checksum đổi nên nó chạy lại — đúng ý muốn;
 *   - database đang có sẵn thì lần đầu chạy hết một lượt (vô hại vì idempotent)
 *     rồi ghi nhận, từ lần sau bỏ qua.
 */
const TRACKING_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id         SERIAL      PRIMARY KEY,
    checksum   CHAR(64)    NOT NULL UNIQUE,
    statement  TEXT        NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

const checksumOf = (sql) => createHash('sha256').update(sql).digest('hex');

export async function runMigrations() {
   await db.query(TRACKING_TABLE);

   const res = await db.query('SELECT checksum FROM schema_migrations');
   const daChay = new Set(res.rows.map(r => r.checksum));

   let soCauMoi = 0;
   for (const sql of STATEMENTS) {
      const sum = checksumOf(sql);
      if (daChay.has(sum)) continue;

      await db.query(sql);
      // Ghi nhận sau khi chạy xong. Nếu câu lệnh lỗi thì không ghi, lần khởi
      // động sau sẽ thử lại đúng câu đó.
      await db.query(
         `INSERT INTO schema_migrations (checksum, statement) VALUES ($1, $2)
          ON CONFLICT (checksum) DO NOTHING`,
         [sum, sql],
      );
      soCauMoi += 1;
   }

   if (soCauMoi > 0) {
      console.log(`  Migration: đã áp dụng ${soCauMoi}/${STATEMENTS.length} câu lệnh mới`);
   }
}
