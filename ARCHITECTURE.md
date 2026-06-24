# Kiến trúc — IKA Fashion

Dự án gồm **2 phần tách biệt**, giao tiếp qua HTTP:

```
┌─────────────────────────┐         HTTP /api/v1          ┌──────────────────────────┐
│  FRONTEND (Next.js)      │  ───────────────────────────▶ │  BACKEND (Express)        │
│  http://localhost:3000   │   Authorization: Bearer JWT   │  http://localhost:4000    │
│  frontend/               │ ◀───────────────────────────  │  backend/                 │
└─────────────────────────┘        JSON { success,... }    └──────────────────────────┘
                                                                      │ in-memory store
                                                                      ▼ (Map) + migration.sql
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
  server.js           # khởi động + seed admin
  app.js              # ráp router, middleware
  config/             # đọc biến môi trường (có giá trị mặc định)
  middleware/         # authenticate(JWT) · authorize(role) · validate(zod) · errorHandler
  db/                 # store.js (in-memory Map + seed sản phẩm) · seed.js (admin)
  modules/<feature>/  # mỗi feature: routes → controller → service + schema
    auth · products · collections · cart · orders · wishlist
  docs/openapi.js     # OpenAPI 3 (Scalar UI tại /api-docs)
backend/database/migration.sql   # schema PostgreSQL (triển khai DB thật khi cần)
```

Chuẩn response: `{ success, message, data }` (và `meta` cho danh sách phân trang).

## Luồng dữ liệu (ví dụ: thêm vào giỏ)

1. Người dùng bấm "Thêm vào giỏ" → `frontend/api.ts` gọi `POST /api/v1/cart/items` kèm `Bearer <token>`.
2. `cart.routes` → `authenticate` (giải mã JWT) → `validate` (zod) → `cart.controller` → `cart.service` cập nhật Map.
3. Trả `{ success, data: cart }` → frontend cập nhật giao diện.

## Lưu ý

- Store là **in-memory**: dữ liệu tạo lúc chạy sẽ reset khi khởi động lại backend.
- Xác thực bằng **JWT**; token lưu ở `localStorage`, gửi qua header `Authorization`.
