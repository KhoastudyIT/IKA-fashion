-- =============================================================
-- IKA Fashion — Database schema + seed (PostgreSQL 14+)
--
-- File này được Postgres tự nạp khi KHỞI TẠO DB lần đầu
-- (mount vào /docker-entrypoint-initdb.d trong docker-compose).
-- Chạy tay:  psql -U <user> -d <database> -f ika_database.sql
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
  city        VARCHAR(255) NOT NULL DEFAULT '',
  is_locked   BOOLEAN      NOT NULL DEFAULT false,
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
  id             SERIAL        PRIMARY KEY,
  name           VARCHAR(200)  NOT NULL,
  handle         VARCHAR(200)  NOT NULL UNIQUE,
  collection     VARCHAR(100)  NOT NULL REFERENCES collections(slug),
  type           VARCHAR(100)  NOT NULL,
  price          INTEGER       NOT NULL CHECK (price > 0),           -- VND (giá bán cuối)
  original_price INTEGER       CHECK (original_price > 0),           -- VND (giá gốc trước giảm, NULL = không giảm)
  discount       INTEGER       NOT NULL DEFAULT 0
                 CHECK (discount >= 0 AND discount <= 100),          -- % giảm giá (0 = không giảm)
  img            VARCHAR(500)  NOT NULL DEFAULT '/products/placeholder.png',
  images         JSONB         NOT NULL DEFAULT '[]',
  colors         JSONB         NOT NULL DEFAULT '[]',
  sizes          JSONB         NOT NULL DEFAULT '[]',
  features       JSONB         NOT NULL DEFAULT '[]',
  rating         NUMERIC(3,1)  NOT NULL DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  sold           INTEGER       NOT NULL DEFAULT 0,
  stock          INTEGER       NOT NULL DEFAULT 0,
  description    TEXT          NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
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
  discount         INTEGER      NOT NULL DEFAULT 0 CHECK (discount >= 0),
  coupon_code      VARCHAR(50)  NOT NULL DEFAULT '',
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
  img         VARCHAR(500) NOT NULL DEFAULT '',
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

CREATE TABLE IF NOT EXISTS conversations (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id        UUID          NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  ai_enabled         BOOLEAN       NOT NULL DEFAULT true,
  last_product_id    INTEGER       REFERENCES products(id) ON DELETE SET NULL,
  last_message       VARCHAR(1000) NOT NULL DEFAULT '',
  last_message_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  unread_by_admin    INTEGER       NOT NULL DEFAULT 0,
  unread_by_customer INTEGER       NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Tin nhắn (sender_id NULL = tin của bot)
CREATE TABLE IF NOT EXISTS messages (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID          NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID          REFERENCES users(id) ON DELETE CASCADE,
  sender_role     VARCHAR(20)   NOT NULL CHECK (sender_role IN ('customer', 'admin', 'ai')),
  sender_name     VARCHAR(100)  NOT NULL DEFAULT '',
  content         VARCHAR(2000) NOT NULL,
  product_id      INTEGER       REFERENCES products(id) ON DELETE SET NULL,
  suggestions     JSONB         NOT NULL DEFAULT '[]'::jsonb,
  intent          VARCHAR(40)   NOT NULL DEFAULT '',
  is_read         BOOLEAN       NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Index thường dùng
CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection);
CREATE INDEX IF NOT EXISTS idx_products_discount   ON products(discount);
CREATE INDEX IF NOT EXISTS idx_orders_user         ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_user           ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user       ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv       ON messages(conversation_id);

-- =============================================================
-- SEED DỮ LIỆU (tài khoản admin được backend seed lúc khởi động)
-- =============================================================

-- Danh mục — chỉ 3 danh mục thật, không còn 'sale'
INSERT INTO collections (id, slug, name, img) VALUES
  (1, 'ao-thun', 'Áo Thun', '/products/ao-thun-trang.png'),
  (2, 'ao-polo', 'Áo Polo', '/products/ao-polo-white.png'),
  (3, 'quan',    'Quần',    '/products/quan-den.png')
ON CONFLICT (slug) DO NOTHING;
SELECT setval('collections_id_seq', (SELECT MAX(id) FROM collections));

-- =============================================================
-- Sản phẩm
-- Cột thứ tự: id, name, handle, collection, type, price,
--             original_price, discount,
--             img, images, colors, sizes, features,
--             rating, sold, stock, description
-- Ghi chú giá:
--   price          = giá bán cuối (cột Cart & Order dùng)
--   original_price = giá gốc trước khi giảm (NULL nếu không giảm)
--   discount       = % giảm giá (0 nếu không giảm)
--   Công thức: price = ROUND(original_price * (1 - discount/100))
-- =============================================================
INSERT INTO products
  (id, name, handle, collection, type,
   price, original_price, discount,
   img, images, colors, sizes, features,
   rating, sold, stock, description)
VALUES

-- ── Áo Thun (không giảm giá, gốc) ──────────────────────────
  (1,  'Áo Thun Trắng Premium',  'ao-thun-trang', 'ao-thun', 'Áo Thun',
   299000, NULL, 0,
   '/products/ao-thun-trang.png', '["/products/ao-thun-trang.png"]'::jsonb,
   '["Trắng"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Premium","Nhanh Khô","Thoáng Khí","Không Phai"]'::jsonb,
   4.8, 152, 120,
   'Áo thun trắng tinh khôi, vải 100% cotton, thoáng khí, nhanh khô với công nghệ AirDry™'),

  (2,  'Áo Thun Đen Premium',    'ao-thun-den',   'ao-thun', 'Áo Thun',
   299000, NULL, 0,
   '/products/ao-thun-den.png', '["/products/ao-thun-den.png"]'::jsonb,
   '["Đen"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Premium","Nhanh Khô","Thoáng Khí","Không Phai"]'::jsonb,
   4.9, 203, 100,
   'Áo thun đen đẹp, vải 100% cotton, thoáng khí, nhanh khô với công nghệ AirDry™'),

  (3,  'Áo Thun Xanh Navy',      'ao-thun-xanh',  'ao-thun', 'Áo Thun',
   299000, NULL, 0,
   '/products/ao-thun-xanh.png', '["/products/ao-thun-xanh.png"]'::jsonb,
   '["Xanh Navy"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Premium","Nhanh Khô","Thoáng Khí","Không Phai"]'::jsonb,
   4.7, 98, 80,
   'Áo thun xanh navy lịch sự, vải 100% cotton, thoáng khí, nhanh khô'),

  (4,  'Áo Thun Xám',            'ao-thun-xam',   'ao-thun', 'Áo Thun',
   299000, NULL, 0,
   '/products/ao-thun-xam.png', '["/products/ao-thun-xam.png"]'::jsonb,
   '["Xám"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Premium","Nhanh Khô","Thoáng Khí","Không Phai"]'::jsonb,
   4.6, 74, 90,
   'Áo thun xám trung tính, vải 100% cotton, thoáng khí, nhanh khô'),

-- ── Áo Polo (không giảm giá, gốc) ───────────────────────────
  (5,  'Áo Polo Trắng',          'ao-polo-trang', 'ao-polo', 'Áo Polo',
   399000, NULL, 0,
   '/products/ao-polo-white.png', '["/products/ao-polo-white.png"]'::jsonb,
   '["Trắng"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Piqué","Kháng Nhăn","Khí Chất","Bền Lâu"]'::jsonb,
   4.8, 110, 70,
   'Áo polo trắng sang trọng, vải piqué cao cấp, phù hợp mặc đi làm'),

  (6,  'Áo Polo Xanh Navy',      'ao-polo-xanh',  'ao-polo', 'Áo Polo',
   399000, NULL, 0,
   '/products/ao-polo-blue.png', '["/products/ao-polo-blue.png"]'::jsonb,
   '["Xanh Navy"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Piqué","Kháng Nhăn","Khí Chất","Bền Lâu"]'::jsonb,
   4.7, 87, 65,
   'Áo polo xanh navy lịch sự, vải piqué cao cấp, phù hợp mặc đi làm'),

  (7,  'Áo Polo Đỏ',             'ao-polo-do',    'ao-polo', 'Áo Polo',
   399000, NULL, 0,
   '/products/ao-polo-red.png', '["/products/ao-polo-red.png"]'::jsonb,
   '["Đỏ"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Piqué","Kháng Nhăn","Khí Chất","Bền Lâu"]'::jsonb,
   4.6, 63, 55,
   'Áo polo đỏ nổi bật, vải piqué cao cấp, phù hợp mặc dạo phố'),

  (8,  'Áo Polo Đen',            'ao-polo-den',   'ao-polo', 'Áo Polo',
   399000, NULL, 0,
   '/products/ao-polo-black.png', '["/products/ao-polo-black.png"]'::jsonb,
   '["Đen"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Piqué","Kháng Nhăn","Khí Chất","Bền Lâu"]'::jsonb,
   4.9, 134, 60,
   'Áo polo đen thanh lịch, vải piqué cao cấp, phù hợp mặc đi làm'),

-- ── Quần (không giảm giá, gốc) ───────────────────────────────
  (9,  'Quần Đen Slim Fit',      'quan-den',      'quan',    'Quần',
   499000, NULL, 0,
   '/products/quan-den.png', '["/products/quan-den.png"]'::jsonb,
   '["Đen"]'::jsonb, '["28","30","32","34","36","38"]'::jsonb,
   '["Slim Fit","Co Giãn","Tôn Dáng","Bền Lâu"]'::jsonb,
   4.8, 91, 50,
   'Quần đen slim fit hiện đại, tôn dáng, công nghệ co giãn FlexFit™'),

  (10, 'Quần Jean Xanh Navy',    'quan-xanh',     'quan',    'Quần',
   599000, NULL, 0,
   '/products/quan-xanh.png', '["/products/quan-xanh.png"]'::jsonb,
   '["Xanh Navy"]'::jsonb, '["28","30","32","34","36","38"]'::jsonb,
   '["Jean Premium","Co Giãn","Thoải Mái","Bền Lâu"]'::jsonb,
   4.7, 68, 45,
   'Quần jean xanh navy chất lượng cao, co giãn thoải mái'),

  (11, 'Quần Kaki Casual',       'quan-kaki',     'quan',    'Quần',
   449000, NULL, 0,
   '/products/quan-kaki.png', '["/products/quan-kaki.png"]'::jsonb,
   '["Kaki"]'::jsonb, '["28","30","32","34","36","38"]'::jsonb,
   '["Casual","Thoải Mái","Dễ Chăm Sóc","Bền Lâu"]'::jsonb,
   4.6, 57, 60,
   'Quần kaki casual thoải mái, phù hợp mặc hàng ngày'),

  (12, 'Quần Xám Formal',        'quan-xam',      'quan',    'Quần',
   549000, NULL, 0,
   '/products/quan-xam.png', '["/products/quan-xam.png"]'::jsonb,
   '["Xám"]'::jsonb, '["28","30","32","34","36","38"]'::jsonb,
   '["Formal","Sang Trọng","Chất Vải Tốt","Bền Lâu"]'::jsonb,
   4.7, 44, 40,
   'Quần xám formal sang trọng, phù hợp mặc đi làm và dự tiệc'),

-- ── Áo Polo — Ưu Đãi (collection = ao-polo, discount > 0) ───
-- price  = giá bán cuối; original_price = giá gốc trước giảm
-- Công thức kiểm tra: price = ROUND(original_price * (1 - discount/100))

  (13, 'Áo Polo Bo Sọc Form Regular PO136 Màu Trắng', 'sale-polo-1', 'ao-polo', 'Áo Polo',
   270000, 450000, 40,
   '/Giam-Gia/Ao/Ao-Polo/Polo-1.jpg', '["/Giam-Gia/Ao/Ao-Polo/Polo-1.jpg"]'::jsonb,
   '["Trắng","Đen"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Piqué","Kháng Nhăn","Khí Chất","Bền Lâu"]'::jsonb,
   4.8, 312, 80,
   'Áo polo bo sọc form regular, vải piqué cao cấp thoáng mát, kháng nhăn xuất sắc.'),

  (14, 'Áo Thun Lạnh Thể Thao Thoáng Mát Navy BS3234', 'sale-polo-2', 'ao-polo', 'Áo Polo',
   429000, 650000, 34,
   '/Giam-Gia/Ao/Ao-Polo/Polo-2.jpg', '["/Giam-Gia/Ao/Ao-Polo/Polo-2.jpg"]'::jsonb,
   '["Đen","Navy"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Piqué","Kháng Nhăn","Khí Chất","Bền Lâu"]'::jsonb,
   4.9, 189, 65,
   'Áo thun lạnh thể thao BS3234, công nghệ làm mát AirCool™ giữ thoáng mát suốt ngày.'),

  (15, 'Áo Polo Màu Trơn Nam Ngắn Tay', 'sale-polo-3', 'ao-polo', 'Áo Polo',
   354000, 590000, 40,
   '/Giam-Gia/Ao/Ao-Polo/Polo-3.jpg', '["/Giam-Gia/Ao/Ao-Polo/Polo-3.jpg"]'::jsonb,
   '["Xanh","Trắng","Đen"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Piqué","Kháng Nhăn","Khí Chất","Bền Lâu"]'::jsonb,
   4.7, 254, 90,
   'Áo polo màu trơn ngắn tay nam, vải piqué mềm mịn kháng nhăn.'),

  (16, 'Áo Polo Nam Màu Xanh Lá - North Sails', 'sale-polo-4', 'ao-polo', 'Áo Polo',
   168000, 280000, 40,
   '/Giam-Gia/Ao/Ao-Polo/Polo-4.webp', '["/Giam-Gia/Ao/Ao-Polo/Polo-4.webp"]'::jsonb,
   '["Xanh Lá"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Piqué","Kháng Nhăn","Khí Chất","Bền Lâu"]'::jsonb,
   4.6, 421, 55,
   'Áo polo North Sails màu xanh lá tươi, chất vải cotton piqué thấm hút mồ hôi.'),

  (17, 'Áo Polo Nam Regular Fit Màu Trắng', 'sale-polo-5', 'ao-polo', 'Áo Polo',
   499000, 780000, 36,
   '/Giam-Gia/Ao/Ao-Polo/Polo-5.webp', '["/Giam-Gia/Ao/Ao-Polo/Polo-5.webp"]'::jsonb,
   '["Trắng"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Piqué","Kháng Nhăn","Khí Chất","Bền Lâu"]'::jsonb,
   4.8, 143, 70,
   'Áo polo regular fit màu trắng tinh tế, vải cao cấp không nhàu.'),

  (18, 'Áo Polo Saint Laurent', 'sale-polo-6', 'ao-polo', 'Áo Polo',
   234000, 390000, 40,
   '/Giam-Gia/Ao/Ao-Polo/Polo-6.webp', '["/Giam-Gia/Ao/Ao-Polo/Polo-6.webp"]'::jsonb,
   '["Trắng","Đen"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Piqué","Kháng Nhăn","Khí Chất","Bền Lâu"]'::jsonb,
   4.5, 367, 45,
   'Áo polo Saint Laurent thiết kế thanh lịch, chất liệu piqué cao cấp.'),

  (19, 'Áo Polo Ralph Lauren', 'sale-polo-7', 'ao-polo', 'Áo Polo',
   312000, 520000, 40,
   '/Giam-Gia/Ao/Ao-Polo/Polo-7.webp', '["/Giam-Gia/Ao/Ao-Polo/Polo-7.webp"]'::jsonb,
   '["Nhiều màu"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Piqué","Kháng Nhăn","Khí Chất","Bền Lâu"]'::jsonb,
   4.9, 98, 60,
   'Áo polo Ralph Lauren đẳng cấp, biểu tượng thời trang phổ biến toàn cầu.'),

  (20, 'Áo Polo Unisex Cổ Bẻ Tay Ngắn', 'sale-polo-8', 'ao-polo', 'Áo Polo',
   609000, 870000, 30,
   '/Giam-Gia/Ao/Ao-Polo/Polo-8.webp', '["/Giam-Gia/Ao/Ao-Polo/Polo-8.webp"]'::jsonb,
   '["Trắng","Đen","Xanh"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Piqué","Kháng Nhăn","Khí Chất","Bền Lâu"]'::jsonb,
   4.7, 211, 75,
   'Áo polo unisex cổ bẻ tay ngắn, form dáng unisex phù hợp mọi vóc dáng.'),

-- ── Áo Thun — Ưu Đãi (collection = ao-thun, discount > 0) ───

  (21, 'Áo Thun Trắng Premium Classic', 'sale-thun-1', 'ao-thun', 'Áo Thun',
   270000, 450000, 40,
   '/Giam-Gia/Ao/Ao-SoMi/SoMi-1.jpg', '["/Giam-Gia/Ao/Ao-SoMi/SoMi-1.jpg"]'::jsonb,
   '["Trắng"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Premium","Nhanh Khô","Thoáng Khí","Không Phai"]'::jsonb,
   4.8, 312, 100,
   'Áo thun trắng Premium Classic, 100% cotton combed mềm mịn, thoáng khí.'),

  (22, 'Áo Thun Kẻ Sọc Premium', 'sale-thun-2', 'ao-thun', 'Áo Thun',
   364000, 520000, 30,
   '/Giam-Gia/Ao/Ao-SoMi/SoMi-2.jpg', '["/Giam-Gia/Ao/Ao-SoMi/SoMi-2.jpg"]'::jsonb,
   '["Trắng Sọc"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Premium","Nhanh Khô","Thoáng Khí","Không Phai"]'::jsonb,
   4.9, 189, 80,
   'Áo thun kẻ sọc Premium, thiết kế classic không bao giờ lỗi mốt.'),

  (23, 'Áo Thun Nam Slim Fit Xanh Navy', 'sale-thun-3', 'ao-thun', 'Áo Thun',
   354000, 590000, 40,
   '/Giam-Gia/Ao/Ao-SoMi/SoMi-3.jpg', '["/Giam-Gia/Ao/Ao-SoMi/SoMi-3.jpg"]'::jsonb,
   '["Xanh Navy"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Premium","Nhanh Khô","Thoáng Khí","Không Phai"]'::jsonb,
   4.7, 254, 90,
   'Áo thun slim fit xanh navy tôn dáng, vải cotton co giãn nhẹ.'),

  (24, 'Áo Thun Xám EasyCare', 'sale-thun-4', 'ao-thun', 'Áo Thun',
   288000, 480000, 40,
   '/Giam-Gia/Ao/Ao-SoMi/SoMi-4.jpg', '["/Giam-Gia/Ao/Ao-SoMi/SoMi-4.jpg"]'::jsonb,
   '["Xám"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Premium","Nhanh Khô","Thoáng Khí","Không Phai"]'::jsonb,
   4.6, 421, 110,
   'Áo thun xám EasyCare kháng nhăn, dễ chăm sóc, mặc đi làm đi chơi đều đẹp.'),

  (25, 'Áo Thun Nam AirLight Trắng', 'sale-thun-5', 'ao-thun', 'Áo Thun',
   330000, 550000, 40,
   '/Giam-Gia/Ao/Ao-SoMi/SoMi-5.jpg', '["/Giam-Gia/Ao/Ao-SoMi/SoMi-5.jpg"]'::jsonb,
   '["Trắng"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Premium","Nhanh Khô","Thoáng Khí","Không Phai"]'::jsonb,
   4.8, 143, 75,
   'Áo thun AirLight siêu nhẹ, thoáng mát ngay cả những ngày nóng bức.'),

  (26, 'Áo Thun Đen Dài Tay FormFit', 'sale-thun-6', 'ao-thun', 'Áo Thun',
   372000, 620000, 40,
   '/Giam-Gia/Ao/Ao-SoMi/SoMi-6.jpg', '["/Giam-Gia/Ao/Ao-SoMi/SoMi-6.jpg"]'::jsonb,
   '["Đen"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Premium","Nhanh Khô","Thoáng Khí","Không Phai"]'::jsonb,
   4.5, 367, 60,
   'Áo thun đen dài tay FormFit ôm dáng, vải cotton mỏng nhẹ mặc rất thoải mái.'),

  (27, 'Áo Thun Classic Fit Màu Đen - Calvin Klein', 'sale-thun-7', 'ao-thun', 'Áo Thun',
   468000, 780000, 40,
   '/Giam-Gia/Ao/Ao-SoMi/SoMi-7.webp', '["/Giam-Gia/Ao/Ao-SoMi/SoMi-7.webp"]'::jsonb,
   '["Đen"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Premium","Nhanh Khô","Thoáng Khí","Không Phai"]'::jsonb,
   4.9, 98, 50,
   'Áo thun Calvin Klein classic fit màu đen huyền thoại, chất vải cao cấp bền đẹp.'),

  (28, 'Áo Thun Unisex Basic', 'sale-thun-8', 'ao-thun', 'Áo Thun',
   294000, 420000, 30,
   '/Giam-Gia/Ao/Ao-SoMi/SoMi-8.jpg', '["/Giam-Gia/Ao/Ao-SoMi/SoMi-8.jpg"]'::jsonb,
   '["Nhiều màu"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb,
   '["Vải Premium","Nhanh Khô","Thoáng Khí","Không Phai"]'::jsonb,
   4.7, 211, 120,
   'Áo thun unisex basic dành cho mọi người, dễ phối đồ với bất kỳ trang phục nào.'),

-- ── Quần — Ưu Đãi (collection = quan, discount > 0) ─────────

  (29, 'Quần Trouser Trắng Trơn', 'sale-quan-1', 'quan', 'Quần',
   312000, 520000, 40,
   '/Giam-Gia/Quan/Quan-Tay/QuanTay-1.jpg', '["/Giam-Gia/Quan/Quan-Tay/QuanTay-1.jpg"]'::jsonb,
   '["Trắng"]'::jsonb, '["28","30","32","34","36","38"]'::jsonb,
   '["Slim Fit","Co Giãn","Tôn Dáng","Bền Lâu"]'::jsonb,
   4.8, 312, 70,
   'Quần trouser trắng trơn thanh lịch, form suôn đứng tôn dáng.'),

  (30, 'Quần Âu Be Trơn', 'sale-quan-2', 'quan', 'Quần',
   288000, 480000, 40,
   '/Giam-Gia/Quan/Quan-Tay/QuanTay-2.jpg', '["/Giam-Gia/Quan/Quan-Tay/QuanTay-2.jpg"]'::jsonb,
   '["Be"]'::jsonb, '["28","30","32","34","36","38"]'::jsonb,
   '["Slim Fit","Co Giãn","Tôn Dáng","Bền Lâu"]'::jsonb,
   4.7, 205, 65,
   'Quần âu be trơn công sở, vải cao cấp mặc thoải mái cả ngày dài.'),

  (31, 'Quần Tây Nam Thanh Lịch Tôn Dáng Form Slim', 'sale-quan-3', 'quan', 'Quần',
   330000, 550000, 40,
   '/Giam-Gia/Quan/Quan-Tay/QuanTay-3.webp', '["/Giam-Gia/Quan/Quan-Tay/QuanTay-3.webp"]'::jsonb,
   '["Đen","Xám"]'::jsonb, '["28","30","32","34","36","38"]'::jsonb,
   '["Slim Fit","Co Giãn","Tôn Dáng","Bền Lâu"]'::jsonb,
   4.6, 178, 55,
   'Quần tây slim fit thanh lịch tôn dáng, phù hợp văn phòng và sự kiện.'),

  (32, 'Quần Dài Công Sở Thẳng Nam Cao Cấp', 'sale-quan-4', 'quan', 'Quần',
   372000, 620000, 40,
   '/Giam-Gia/Quan/Quan-Tay/QuanTay-4.webp', '["/Giam-Gia/Quan/Quan-Tay/QuanTay-4.webp"]'::jsonb,
   '["Đen","Navy"]'::jsonb, '["28","30","32","34","36","38"]'::jsonb,
   '["Slim Fit","Co Giãn","Tôn Dáng","Bền Lâu"]'::jsonb,
   4.9, 143, 40,
   'Quần dài công sở thẳng cao cấp, dáng đứng không nhàu, chuyên nghiệp.'),

  (33, 'Quần Jean Xanh Ôm Dáng Kiểu Anh', 'sale-quan-5', 'quan', 'Quần',
   408000, 680000, 40,
   '/Giam-Gia/Quan/Quan-Tay/QuanTay-5.jpg', '["/Giam-Gia/Quan/Quan-Tay/QuanTay-5.jpg"]'::jsonb,
   '["Xanh Navy"]'::jsonb, '["28","30","32","34","36","38"]'::jsonb,
   '["Jean Premium","Ôm Dáng","Thoải Mái","Co Giãn"]'::jsonb,
   4.8, 312, 60,
   'Quần jean xanh ôm dáng kiểu Anh, cut chuẩn tôn dáng cả ngày.'),

  (34, 'Quần Tây Nam Xám Trơn Công Sở', 'sale-quan-6', 'quan', 'Quần',
   354000, 590000, 40,
   '/Giam-Gia/Quan/Quan-Tay/QuanTay-6.jpg', '["/Giam-Gia/Quan/Quan-Tay/QuanTay-6.jpg"]'::jsonb,
   '["Xám"]'::jsonb, '["28","30","32","34","36","38"]'::jsonb,
   '["Slim Fit","Co Giãn","Tôn Dáng","Bền Lâu"]'::jsonb,
   4.6, 189, 50,
   'Quần tây xám trơn công sở, vải chống nhăn cao cấp giữ phong độ suốt ngày.'),

  (35, 'Quần Kaki Nam Casual', 'sale-quan-7', 'quan', 'Quần',
   450000, 750000, 40,
   '/Giam-Gia/Quan/Quan-Tay/QuanTay-7.webp', '["/Giam-Gia/Quan/Quan-Tay/QuanTay-7.webp"]'::jsonb,
   '["Kaki","Be"]'::jsonb, '["28","30","32","34","36","38"]'::jsonb,
   '["Casual","Thoải Mái","Dễ Chăm Sóc","Co Giãn"]'::jsonb,
   4.9, 254, 80,
   'Quần kaki nam casual phong cách trẻ trung, phù hợp đi chơi cuối tuần.'),

  (36, 'Quần Âu Đen Trơn Slim Fit', 'sale-quan-8', 'quan', 'Quần',
   384000, 640000, 40,
   '/Giam-Gia/Quan/Quan-Tay/QuanTay-8.webp', '["/Giam-Gia/Quan/Quan-Tay/QuanTay-8.webp"]'::jsonb,
   '["Đen"]'::jsonb, '["28","30","32","34","36","38"]'::jsonb,
   '["Slim Fit","Co Giãn","Tôn Dáng","Bền Lâu"]'::jsonb,
   4.7, 421, 45,
   'Quần âu đen slim fit thanh lịch, vải cao cấp kháng nhăn suốt ngày.')

ON CONFLICT (handle) DO NOTHING;
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- =============================================================
-- KHUYẾN MÃI (coupons)
-- =============================================================
CREATE TABLE IF NOT EXISTS coupons (
  id          SERIAL       PRIMARY KEY,
  code        VARCHAR(50)  NOT NULL UNIQUE,
  type        VARCHAR(20)  NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value       INTEGER      NOT NULL CHECK (value > 0),           -- % hoặc VND
  min_order   INTEGER      NOT NULL DEFAULT 0 CHECK (min_order >= 0),
  quantity    INTEGER      NOT NULL DEFAULT 100 CHECK (quantity >= 0),
  used        INTEGER      NOT NULL DEFAULT 0 CHECK (used >= 0),
  active      BOOLEAN      NOT NULL DEFAULT true,
  expiry_date DATE         NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO coupons (code, type, value, min_order, quantity, used, active, expiry_date) VALUES
  ('IKANEW10',  'percentage', 10,  200000,  100, 12, true,  '2026-12-31'),
  ('IKALUXURY', 'fixed',      100000, 1000000, 50,  5,  true,  '2026-10-15'),
  ('FREESHIP',  'fixed',      30000,  500000,  200, 89, true,  '2026-08-30'),
  ('MIDYEAR30', 'percentage', 30,  400000,  30,  30, false, '2026-06-30')
ON CONFLICT (code) DO NOTHING;

-- =============================================================
-- ĐÁNH GIÁ (reviews)
-- =============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id          SERIAL        PRIMARY KEY,
  product_id  INTEGER       NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     UUID          REFERENCES users(id) ON DELETE SET NULL,
  user_name   VARCHAR(100)  NOT NULL,
  rating      INTEGER       NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     VARCHAR(2000) NOT NULL DEFAULT '',
  approved    BOOLEAN       NOT NULL DEFAULT false,
  reply       VARCHAR(2000),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

INSERT INTO reviews (product_id, user_name, rating, comment, approved, reply) VALUES
  (1, 'Trần Thị Mai',       5, 'Chất vải siêu mát luôn, rất đáng tiền nha mọi người!', true,  'Cảm ơn bạn đã tin tưởng ủng hộ IKA Fashion!'),
  (9, 'Nguyễn Văn Hùng',    4, 'Quần vừa vặn, co giãn tốt, tuy nhiên giao hàng hơi lâu chút.', true,  NULL),
  (6, 'Khách hàng ẩn danh', 2, 'Màu sắc ngoài đời hơi tối so với ảnh, chất liệu cũng hơi dày.', true,  NULL),
  (2, 'Hoàng Minh',         5, 'Giao hàng nhanh, áo thun đen mặc tôn dáng cực kì.', false, NULL)
ON CONFLICT DO NOTHING;

-- rating của sản phẩm = trung bình đánh giá ĐÃ DUYỆT (5.0 nếu chưa có đánh giá nào)
UPDATE products p SET rating = COALESCE(
  (SELECT ROUND(AVG(r.rating)::numeric, 1) FROM reviews r WHERE r.product_id = p.id AND r.approved),
  5.0
);

-- =============================================================
-- TIN TỨC (news_categories, news)
-- =============================================================
CREATE TABLE IF NOT EXISTS news_categories (
  id         SERIAL       PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  slug       VARCHAR(140) NOT NULL UNIQUE,
  sort_order INTEGER      NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news (
  id           SERIAL        PRIMARY KEY,
  title        VARCHAR(300)  NOT NULL,
  slug         VARCHAR(350)  NOT NULL UNIQUE,
  img          VARCHAR(500)  NOT NULL DEFAULT '',
  excerpt      VARCHAR(500)  NOT NULL DEFAULT '',
  content      TEXT          NOT NULL DEFAULT '',
  author       VARCHAR(100)  NOT NULL DEFAULT 'IKA Fashion',
  -- Xoá danh mục thì bài viết vẫn còn, chỉ mất phân loại
  category_id  INTEGER       REFERENCES news_categories(id) ON DELETE SET NULL,
  status       VARCHAR(20)   NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  publish_date DATE          NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Danh sách công khai lọc theo status rồi sắp theo ngày đăng
CREATE INDEX IF NOT EXISTS idx_news_status_publish ON news (status, publish_date DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_news_category       ON news (category_id);

INSERT INTO news_categories (id, name, slug, sort_order) VALUES
  (1, 'Xu Hướng',   'xu-huong',   1),
  (2, 'Phối Đồ',    'phoi-do',    2),
  (3, 'Bảo Quản',   'bao-quan',   3),
  (4, 'Tin Cửa Hàng', 'tin-cua-hang', 4)
ON CONFLICT (slug) DO NOTHING;
SELECT setval('news_categories_id_seq', (SELECT MAX(id) FROM news_categories));

-- Bài viết mẫu seed ở src/db/seed-data/news.js (nạp bởi seed.js).



-- =============================================================
-- CẤU HÌNH CỬA HÀNG (store_settings)
-- =============================================================

CREATE TABLE IF NOT EXISTS store_settings (
  id             INTEGER      PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name     VARCHAR(150) NOT NULL DEFAULT 'IKA Fashion',
  logo           VARCHAR(500) NOT NULL DEFAULT '',
  hotline        VARCHAR(30)  NOT NULL DEFAULT '',
  email          VARCHAR(150) NOT NULL DEFAULT '',
  address        VARCHAR(255) NOT NULL DEFAULT '',
  working_hours  VARCHAR(255) NOT NULL DEFAULT '',
  facebook_url   VARCHAR(300) NOT NULL DEFAULT '',
  instagram_url  VARCHAR(300) NOT NULL DEFAULT '',
  tiktok_url     VARCHAR(300) NOT NULL DEFAULT '',
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Dòng mặc định.
INSERT INTO store_settings (
  id, store_name, logo, hotline, email, address,
  working_hours, facebook_url, instagram_url, tiktok_url
) VALUES (
  1,
  'IKA Fashion',
  '',
  '0987 654 321',
  'support@ika-fashion.vn',
  'Số 123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh',
  'T2–T6: 9:00 – 18:00 · T7: 10:00 – 16:00',
  'https://facebook.com/ikafashion',
  'https://instagram.com/ikafashion',
  'https://tiktok.com/@ikafashion'
)
ON CONFLICT (id) DO NOTHING;
