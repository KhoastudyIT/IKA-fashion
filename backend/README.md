# IKA Fashion — Backend API

API thương mại điện tử thời trang, xây dựng bằng **Node.js + Express** theo
kiến trúc module (controller / routes / service / schema). Dữ liệu lưu trong
**PostgreSQL** (truy cập qua `pg` — `src/db/index.js`). Schema + seed nằm ở
`database/ika_database.sql`.

## Cài đặt & chạy (local, cần PostgreSQL)

```bash
cd backend
npm install
cp .env.example .env      # sửa DATABASE_URL cho khớp Postgres của bạn
npm run db:setup          # tạo DB ika_fashion + nạp schema/seed (chạy 1 lần)
npm run dev               # http://localhost:4000  (node --watch)
```

> Chạy bằng Docker thì không cần bước trên — Postgres tự nạp `database/ika_database.sql`.
> Xem `../DOCKER.md`.

- API docs (Scalar): http://localhost:4000/api-docs
- Health check:       http://localhost:4000/api/health
- Tài khoản admin seed sẵn: `admin@ika.vn` / `admin123`

## Kiến trúc

```
backend/
├── database/ika_database.sql     # schema PostgreSQL + seed (4 danh mục, 36 sản phẩm)
└── src/
    ├── server.js                 # chờ DB sẵn sàng, seed admin, khởi động server
    ├── app.js                    # tạo Express app, ráp router
    ├── config/index.js           # đọc biến môi trường (có DATABASE_URL)
    ├── utils/response.js          # chuẩn response { success, message, data }
    ├── middleware/
    │   ├── authenticate.js        # xác thực JWT -> req.user
    │   ├── authorize.js           # phân quyền theo role
    │   ├── validate.js            # validate body/query bằng zod
    │   └── errorHandler.js        # AppError + xử lý lỗi tập trung
    ├── db/
    │   ├── index.js               # pg Pool + query()
    │   ├── seed.js                # seed tài khoản admin (SQL)
    │   └── setup.js               # tạo DB + nạp file .sql (local, `npm run db:setup`)
    ├── docs/openapi.js            # đặc tả OpenAPI 3 cho Scalar
    └── modules/
        ├── auth/                  # đăng ký, đăng nhập, hồ sơ, quản lý user (admin)
        ├── products/              # sản phẩm + lọc/sắp xếp/phân trang, CRUD admin
        ├── collections/           # danh mục (áo thun, áo polo, quần, ưu đãi)
        ├── cart/                  # giỏ hàng theo user
        ├── orders/                # đặt hàng (transaction trừ kho), quản lý đơn (admin)
        ├── wishlist/              # danh sách yêu thích
        └── messages/             # chat khách hàng ↔ admin (hội thoại + tin nhắn)
```

Mỗi module gồm: `*.routes.js` (định nghĩa endpoint) → `*.controller.js`
(nhận req/res) → `*.service.js` (logic nghiệp vụ + truy vấn SQL) và
`*.schema.js` (zod validation).

## Chuẩn response

```jsonc
// thành công
{ "success": true, "message": "...", "data": { } }
// danh sách có phân trang
{ "success": true, "data": [ ], "meta": { "total": 12, "page": 1, "limit": 12, "totalPages": 1 } }
// lỗi
{ "success": false, "message": "..." }
```

## Endpoints — tách theo vai trò

API chia 3 nhóm namespace: **Public** `/api/v1/...`, **Customer** `/api/v1/customer/...`, **Admin** `/api/v1/admin/...`.

### Public (không cần đăng nhập)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST   | `/api/v1/auth/register` | Đăng ký |
| POST   | `/api/v1/auth/login` | Đăng nhập → token |
| GET/PUT| `/api/v1/auth/me` | Xem / cập nhật hồ sơ (cần token) |
| POST   | `/api/v1/auth/logout` | Đăng xuất |
| GET    | `/api/v1/products` | Danh sách (lọc/sắp xếp/phân trang) |
| GET    | `/api/v1/products/:id` · `/products/handle/:handle` | Chi tiết |
| GET    | `/api/v1/collections` · `/collections/:slug` | Danh mục |
| GET    | `/api/v1/reviews/product/:productId` | Đánh giá đã duyệt của sản phẩm |

### Customer (`/api/v1/customer/...` — cần đăng nhập)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET/DELETE | `/customer/cart` | Xem / xóa toàn bộ giỏ |
| POST   | `/customer/cart/items` | Thêm vào giỏ |
| PUT/DELETE | `/customer/cart/items/:key` | Cập nhật / xóa 1 dòng |
| POST   | `/customer/orders` | Đặt hàng (từ giỏ, có `couponCode`) |
| GET    | `/customer/orders` · `/customer/orders/:id` | Đơn của tôi |
| GET/POST | `/customer/wishlist` | Yêu thích |
| DELETE | `/customer/wishlist/:productId` | Xóa yêu thích |
| POST   | `/customer/coupons/apply` | Áp mã lúc checkout |
| GET    | `/customer/reviews/eligibility/:productId` | Có được đánh giá không |
| POST   | `/customer/reviews` | Gửi đánh giá (đã mua + nhận hàng) |
| GET    | `/customer/messages/my` | Hội thoại của tôi |
| POST   | `/customer/messages` | Gửi tin nhắn |
| GET    | `/customer/messages/:conversationId/messages` | Tin nhắn trong hội thoại |
| PUT    | `/customer/messages/:conversationId/read` | Đánh dấu đã đọc |

### Admin (`/api/v1/admin/...` — cần role admin)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST/PUT/DELETE | `/admin/products` · `/admin/products/:id` | CRUD sản phẩm |
| POST/PUT/DELETE | `/admin/collections` · `/admin/collections/:id` | CRUD danh mục |
| GET    | `/admin/orders` (?status=) · `/admin/orders/:id` | Tất cả đơn |
| PUT    | `/admin/orders/:id/status` | Cập nhật trạng thái đơn |
| GET/DELETE | `/admin/users` · `/admin/users/:id` | Danh sách / xóa user |
| PUT    | `/admin/users/:id/toggle-lock` · `/admin/users/:id/role` | Khóa / đổi vai trò |
| GET/POST/PUT/DELETE | `/admin/coupons` · `/admin/coupons/:id` | CRUD mã giảm giá |
| PUT    | `/admin/coupons/:id/toggle` | Bật/tắt mã |
| GET    | `/admin/reviews` | Tất cả đánh giá |
| PUT    | `/admin/reviews/:id/approve` · `/admin/reviews/:id/reply` | Duyệt / phản hồi |
| DELETE | `/admin/reviews/:id` | Xóa đánh giá |
| GET    | `/admin/messages/conversations` · `/admin/messages/unread-count` | Hội thoại / badge |
| POST   | `/admin/messages` | Trả lời khách (cần conversationId) |
| GET/PUT| `/admin/messages/:conversationId/messages` · `/read` | Tin nhắn / đánh dấu đọc |
| DELETE | `/admin/messages/:id` | Xóa tin nhắn |

`key` của dòng giỏ hàng có dạng `productId|size|color`, cần `encodeURIComponent`
khi đưa vào URL. Ví dụ: `1|M|Trắng` → `1%7CM%7CTr%E1%BA%AFng`.

## Kết nối với Frontend (Next.js)

Frontend chạy ở `http://localhost:3000`, gọi API qua `http://localhost:4000/api/v1`.
`CORS_ORIGIN` trong `.env` đã mở sẵn cho origin này. Phía FE lưu token
(localStorage) và gắn header `Authorization: Bearer <token>`.
