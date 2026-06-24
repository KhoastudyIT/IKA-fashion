-- =============================================================
-- IKA Fashion — Database Migration
-- PostgreSQL 14+
-- Chạy: psql -U <user> -d <database> -f migration.sql
--
-- Lưu ý: backend hiện chạy bằng in-memory store (src/db/store.js).
-- File này là schema tham khảo để triển khai PostgreSQL thật về sau.
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- =============================================================
-- BẢNG
-- =============================================================

-- Người dùng
CREATE TABLE IF NOT EXISTS users (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(20)  NOT NULL DEFAULT 'customer'
              CHECK (role IN ('customer', 'admin')),
  phone       VARCHAR(20)  NOT NULL DEFAULT '',
  address     VARCHAR(255) NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Danh mục (Áo Thun, Áo Polo, Quần)
CREATE TABLE IF NOT EXISTS collections (
  id    SERIAL       PRIMARY KEY,
  slug  VARCHAR(100) NOT NULL UNIQUE,
  name  VARCHAR(100) NOT NULL,
  img   VARCHAR(500) NOT NULL DEFAULT ''
);

-- Sản phẩm
CREATE TABLE IF NOT EXISTS products (
  id           SERIAL        PRIMARY KEY,
  name         VARCHAR(200)  NOT NULL,
  handle       VARCHAR(200)  NOT NULL UNIQUE,
  collection   VARCHAR(100)  NOT NULL REFERENCES collections(slug),
  type         VARCHAR(100)  NOT NULL,
  price        INTEGER       NOT NULL CHECK (price > 0),          -- VND
  img          VARCHAR(500)  NOT NULL DEFAULT '/products/placeholder.png',
  images       JSONB         NOT NULL DEFAULT '[]',
  colors       JSONB         NOT NULL DEFAULT '[]',
  sizes        JSONB         NOT NULL DEFAULT '[]',
  features     JSONB         NOT NULL DEFAULT '[]',
  rating       NUMERIC(3,1)  NOT NULL DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  sold         INTEGER       NOT NULL DEFAULT 0,
  stock        INTEGER       NOT NULL DEFAULT 0,
  description  TEXT          NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Giỏ hàng (mỗi dòng = sản phẩm + size + màu của 1 user)
CREATE TABLE IF NOT EXISTS cart_items (
  id          SERIAL      PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  INTEGER     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size        VARCHAR(20) NOT NULL,
  color       VARCHAR(50) NOT NULL,
  quantity    INTEGER     NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id, size, color)
);

-- Đơn hàng
CREATE TABLE IF NOT EXISTS orders (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID         NOT NULL REFERENCES users(id),
  total_price      INTEGER      NOT NULL CHECK (total_price >= 0),
  status           VARCHAR(20)  NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'confirmed', 'shipped', 'completed', 'cancelled')),
  payment_status   VARCHAR(20)  NOT NULL DEFAULT 'unpaid'
                   CHECK (payment_status IN ('unpaid', 'paid')),
  shipping_address VARCHAR(255) NOT NULL,
  phone            VARCHAR(20)  NOT NULL,
  notes            VARCHAR(500) NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Chi tiết đơn hàng (snapshot giá & tên lúc đặt)
CREATE TABLE IF NOT EXISTS order_items (
  id          SERIAL      PRIMARY KEY,
  order_id    UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER     NOT NULL REFERENCES products(id),
  name        VARCHAR(200) NOT NULL,
  price       INTEGER     NOT NULL CHECK (price >= 0),
  size        VARCHAR(20) NOT NULL,
  color       VARCHAR(50) NOT NULL,
  quantity    INTEGER     NOT NULL CHECK (quantity > 0)
);

-- Danh sách yêu thích
CREATE TABLE IF NOT EXISTS wishlist (
  id          SERIAL      PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  INTEGER     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

-- Index thường dùng
CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection);
CREATE INDEX IF NOT EXISTS idx_orders_user         ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_user           ON cart_items(user_id);

-- =============================================================
-- SEED DỮ LIỆU
-- =============================================================

INSERT INTO collections (slug, name, img) VALUES
  ('ao-thun', 'Áo Thun', '/products/ao-thun-trang.png'),
  ('ao-polo', 'Áo Polo', '/products/ao-polo-white.png'),
  ('quan',    'Quần',    '/products/quan-den.png')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, handle, collection, type, price, img, images, colors, sizes, features, rating, sold, stock, description) VALUES
  ('Áo Thun Trắng Premium', 'ao-thun-trang', 'ao-thun', 'Áo Thun', 299000, '/products/ao-thun-trang.png', '["/products/ao-thun-trang.png"]', '["Trắng"]',     '["S","M","L","XL","XXL"]', '["Vải Premium","Nhanh Khô","Thoáng Khí","Không Phai"]', 4.8, 152, 120, 'Áo thun trắng tinh khôi, vải 100% cotton, thoáng khí, nhanh khô với công nghệ AirDry™'),
  ('Áo Thun Đen Premium',   'ao-thun-den',   'ao-thun', 'Áo Thun', 299000, '/products/ao-thun-den.png',   '["/products/ao-thun-den.png"]',   '["Đen"]',       '["S","M","L","XL","XXL"]', '["Vải Premium","Nhanh Khô","Thoáng Khí","Không Phai"]', 4.9, 203, 100, 'Áo thun đen đẹp, vải 100% cotton, thoáng khí, nhanh khô với công nghệ AirDry™'),
  ('Áo Thun Xanh Navy',     'ao-thun-xanh',  'ao-thun', 'Áo Thun', 299000, '/products/ao-thun-xanh.png',  '["/products/ao-thun-xanh.png"]',  '["Xanh Navy"]', '["S","M","L","XL","XXL"]', '["Vải Premium","Nhanh Khô","Thoáng Khí","Không Phai"]', 4.7, 98,  80,  'Áo thun xanh navy lịch sự, vải 100% cotton, thoáng khí, nhanh khô'),
  ('Áo Thun Xám',           'ao-thun-xam',   'ao-thun', 'Áo Thun', 299000, '/products/ao-thun-xam.png',   '["/products/ao-thun-xam.png"]',   '["Xám"]',       '["S","M","L","XL","XXL"]', '["Vải Premium","Nhanh Khô","Thoáng Khí","Không Phai"]', 4.6, 74,  90,  'Áo thun xám trung tính, vải 100% cotton, thoáng khí, nhanh khô'),
  ('Áo Polo Trắng',     'ao-polo-trang', 'ao-polo', 'Áo Polo', 399000, '/products/ao-polo-white.png', '["/products/ao-polo-white.png"]', '["Trắng"]',     '["S","M","L","XL","XXL"]', '["Vải Piqué","Kháng Nhăn","Khí Chất","Bền Lâu"]', 4.8, 110, 70, 'Áo polo trắng sang trọng, vải piqué cao cấp, phù hợp mặc đi làm'),
  ('Áo Polo Xanh Navy', 'ao-polo-xanh',  'ao-polo', 'Áo Polo', 399000, '/products/ao-polo-blue.png',  '["/products/ao-polo-blue.png"]',  '["Xanh Navy"]', '["S","M","L","XL","XXL"]', '["Vải Piqué","Kháng Nhăn","Khí Chất","Bền Lâu"]', 4.7, 87,  65, 'Áo polo xanh navy lịch sự, vải piqué cao cấp, phù hợp mặc đi làm'),
  ('Áo Polo Đỏ',        'ao-polo-do',    'ao-polo', 'Áo Polo', 399000, '/products/ao-polo-red.png',   '["/products/ao-polo-red.png"]',   '["Đỏ"]',        '["S","M","L","XL","XXL"]', '["Vải Piqué","Kháng Nhăn","Khí Chất","Bền Lâu"]', 4.6, 63,  55, 'Áo polo đỏ nổi bật, vải piqué cao cấp, phù hợp mặc dạo phố'),
  ('Áo Polo Đen',       'ao-polo-den',   'ao-polo', 'Áo Polo', 399000, '/products/ao-polo-black.png', '["/products/ao-polo-black.png"]', '["Đen"]',       '["S","M","L","XL","XXL"]', '["Vải Piqué","Kháng Nhăn","Khí Chất","Bền Lâu"]', 4.9, 134, 60, 'Áo polo đen thanh lịch, vải piqué cao cấp, phù hợp mặc đi làm'),
  ('Quần Đen Slim Fit',   'quan-den',  'quan', 'Quần', 499000, '/products/quan-den.png',  '["/products/quan-den.png"]',  '["Đen"]',       '["28","30","32","34","36","38"]', '["Slim Fit","Co Giãn","Tôn Dáng","Bền Lâu"]',       4.8, 91, 50, 'Quần đen slim fit hiện đại, tôn dáng, công nghệ co giãn FlexFit™'),
  ('Quần Jean Xanh Navy', 'quan-xanh', 'quan', 'Quần', 599000, '/products/quan-xanh.png', '["/products/quan-xanh.png"]', '["Xanh Navy"]', '["28","30","32","34","36","38"]', '["Jean Premium","Co Giãn","Thoải Mái","Bền Lâu"]',  4.7, 68, 45, 'Quần jean xanh navy chất lượng cao, co giãn thoải mái'),
  ('Quần Kaki Casual',    'quan-kaki', 'quan', 'Quần', 449000, '/products/quan-kaki.png', '["/products/quan-kaki.png"]', '["Kaki"]',      '["28","30","32","34","36","38"]', '["Casual","Thoải Mái","Dễ Chăm Sóc","Bền Lâu"]',    4.6, 57, 60, 'Quần kaki casual thoải mái, phù hợp mặc hàng ngày'),
  ('Quần Xám Formal',     'quan-xam',  'quan', 'Quần', 549000, '/products/quan-xam.png',  '["/products/quan-xam.png"]',  '["Xám"]',       '["28","30","32","34","36","38"]', '["Formal","Sang Trọng","Chất Vải Tốt","Bền Lâu"]',  4.7, 44, 40, 'Quần xám formal sang trọng, phù hợp mặc đi làm và dự tiệc')
ON CONFLICT (handle) DO NOTHING;
