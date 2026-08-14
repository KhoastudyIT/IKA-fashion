# Kiến trúc — IKA Fashion

Dự án gồm **2 phần tách biệt** + **1 database**, giao tiếp qua HTTP / SQL:

```
┌─────────────────────────┐         HTTP /api/v1          ┌──────────────────────────┐        ┌──────────────────┐
│  FRONTEND (Next.js)      │  ───────────────────────────▶ │  BACKEND (Express)        │  SQL   │  PostgreSQL       │
│  http://localhost:3000   │   Authorization: Bearer JWT   │  http://localhost:4000    │ ─────▶ │  ika_fashion      │
│  frontend/               │ ◀───────────────────────────  │  backend/  (pg Pool)      │ ◀───── │  (Docker/local)   │
└─────────────────────────┘        JSON { success,... }    └──────────────────────────┘        └──────────────────┘
```

> Hướng dẫn cài đặt & chạy: xem [README.md](README.md). Chi tiết endpoint: [backend/README.md](backend/README.md).

## Frontend (Next.js) — thư mục `frontend/`

```
frontend/
  app/                # Các trang (pages) — giao diện
  api.ts              # Client fetch tới Express (gắn token, base NEXT_PUBLIC_API_URL)
  auth-client.ts      # Phiên đăng nhập: useSession / signIn / signUp / signOut (JWT + localStorage)
  components/         # UI components (Navigation, ProductCard, ui/)
  shared/types.ts     # Kiểu dữ liệu dùng chung
```

Path alias `@/*` trỏ tới gốc `frontend/` (vd `@/api`, `@/components/...`, `@/shared/types`).

Mọi dữ liệu đều lấy từ API — frontend **không** chứa dữ liệu mock.

## Backend (Express, kiến trúc module)

```
backend/src/
  server.js           # chờ DB sẵn sàng + seed admin + khởi động
  app.js              # ráp router, middleware
  config/             # đọc biến môi trường (có DATABASE_URL)
  middleware/         # authenticate(JWT) · authorize(role) · validate(zod) · errorHandler
  db/                 # index.js (pg Pool) · seed.js (admin) · setup.js (tạo DB local)
  modules/<feature>/  # mỗi feature: routes → controller → service + schema
    auth · products · collections · cart · orders · wishlist · messages · stats
  services/pdf/       # hóa đơn PDF (pdfkit + font Be Vietnam Pro cho tiếng Việt)
  services/excel/     # báo cáo thống kê nhiều sheet (exceljs)
  assets/fonts/       # font nhúng vào PDF
  docs/openapi.js     # OpenAPI 3 (Scalar UI tại /api-docs)
backend/database/ika_database.sql  # schema + seed PostgreSQL (Postgres tự nạp lúc init)
```

Chuẩn response: `{ success, message, data }` (và `meta` cho danh sách phân trang).

## Luồng dữ liệu (ví dụ: thêm vào giỏ)

1. Người dùng bấm "Thêm vào giỏ" → `frontend/api.ts` gọi `POST /api/v1/cart/items` kèm `Bearer <token>`.
2. `cart.routes` → `authenticate` (giải mã JWT) → `validate` (zod) → `cart.controller` → `cart.service` chạy SQL (INSERT ... ON CONFLICT) trên PostgreSQL.
3. Trả `{ success, data: cart }` → frontend cập nhật giao diện.

## Lưu ý

- Dữ liệu lưu trong **PostgreSQL** → bền qua khởi động lại (Docker: volume `ika_pgdata`). Schema + seed: `backend/database/ika_database.sql`.
- Đặt hàng dùng **transaction** (trừ kho + tạo order_items + xoá giỏ, đảm bảo toàn vẹn).
- Xác thực bằng **JWT**; token lưu ở `localStorage`, gửi qua header `Authorization`.
