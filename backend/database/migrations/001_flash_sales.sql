-- =============================================================
-- Migration 001 — Flash Sales
-- Run manually:
--   psql -U <user> -d <database> -f 001_flash_sales.sql
-- Or apply into the running Docker container:
--   docker exec -i ika_postgres psql -U postgres -d ika_fashion \
--     < backend/database/migrations/001_flash_sales.sql
-- =============================================================

-- flash_sales: moi chuong trinh flash sale co ten, khoang thoi gian va trang thai.
CREATE TABLE IF NOT EXISTS flash_sales (
  id         SERIAL        PRIMARY KEY,
  name       VARCHAR(200)  NOT NULL,
  start_time TIMESTAMPTZ   NOT NULL,
  end_time   TIMESTAMPTZ   NOT NULL,
  is_active  BOOLEAN       NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT flash_sales_time_check CHECK (end_time > start_time)
);

-- flash_sale_products: moi dong lien ket 1 san pham voi 1 flash sale, kem gia uu dai va ton kho.
CREATE TABLE IF NOT EXISTS flash_sale_products (
  id               SERIAL   PRIMARY KEY,
  flash_sale_id    INTEGER  NOT NULL REFERENCES flash_sales(id) ON DELETE CASCADE,
  product_id       INTEGER  NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  discounted_price INTEGER  NOT NULL CHECK (discounted_price >= 0),
  stock_limit      INTEGER  NOT NULL CHECK (stock_limit > 0),
  sold_count       INTEGER  NOT NULL DEFAULT 0 CHECK (sold_count >= 0),
  UNIQUE (flash_sale_id, product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_flash_sales_active_time ON flash_sales (is_active, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_fsp_flash_sale_id ON flash_sale_products (flash_sale_id);
CREATE INDEX IF NOT EXISTS idx_fsp_product_id ON flash_sale_products (product_id);
