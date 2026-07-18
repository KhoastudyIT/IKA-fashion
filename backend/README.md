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

## Endpoints chính

| Method | Endpoint                          | Quyền     | Mô tả |
|--------|-----------------------------------|-----------|-------|
| POST   | `/api/v1/auth/register`           | public    | Đăng ký |
| POST   | `/api/v1/auth/login`              | public    | Đăng nhập → token |
| GET    | `/api/v1/auth/me`                 | user      | Thông tin tài khoản |
| PUT    | `/api/v1/auth/me`                 | user      | Cập nhật hồ sơ |
| GET    | `/api/v1/products`                | public    | Danh sách (lọc/sắp xếp/phân trang) |
| GET    | `/api/v1/products/:id`            | public    | Chi tiết theo id |
| GET    | `/api/v1/products/handle/:handle` | public    | Chi tiết theo handle |
| POST   | `/api/v1/products`                | admin     | Tạo sản phẩm |
| PUT    | `/api/v1/products/:id`            | admin     | Cập nhật |
| DELETE | `/api/v1/products/:id`            | admin     | Xóa |
| GET    | `/api/v1/collections`             | public    | Danh mục + số lượng |
| GET    | `/api/v1/collections/:slug`       | public    | Danh mục + sản phẩm |
| GET    | `/api/v1/cart`                    | user      | Xem giỏ |
| POST   | `/api/v1/cart/items`              | user      | Thêm vào giỏ |
| PUT    | `/api/v1/cart/items/:key`         | user      | Cập nhật số lượng |
| DELETE | `/api/v1/cart/items/:key`         | user      | Xóa 1 dòng |
| DELETE | `/api/v1/cart`                    | user      | Xóa toàn bộ giỏ |
| POST   | `/api/v1/orders`                  | user      | Đặt hàng (từ giỏ) |
| GET    | `/api/v1/orders`                  | user      | Đơn của tôi |
| GET    | `/api/v1/orders/:id`              | user      | Chi tiết đơn |
| GET    | `/api/v1/orders/all`              | admin     | Tất cả đơn |
| PUT    | `/api/v1/orders/:id/status`       | admin     | Cập nhật trạng thái |
| GET    | `/api/v1/wishlist`                | user      | Yêu thích |
| POST   | `/api/v1/wishlist`                | user      | Thêm yêu thích |
| DELETE | `/api/v1/wishlist/:productId`     | user      | Xóa yêu thích |
| GET    | `/api/v1/messages/my`             | user      | Hội thoại của tôi |
| POST   | `/api/v1/messages`                | user      | Gửi tin nhắn |
| GET    | `/api/v1/messages/:conversationId/messages` | user | Tin nhắn trong hội thoại |
| PUT    | `/api/v1/messages/:conversationId/read` | user | Đánh dấu đã đọc |
| GET    | `/api/v1/messages/conversations`  | admin     | Tất cả hội thoại |
| GET    | `/api/v1/messages/unread-count`   | admin     | Tổng số chưa đọc |
| DELETE | `/api/v1/messages/:id`            | admin     | Xóa tin nhắn |

`key` của dòng giỏ hàng có dạng `productId|size|color`, cần `encodeURIComponent`
khi đưa vào URL. Ví dụ: `1|M|Trắng` → `1%7CM%7CTr%E1%BA%AFng`.

## Kết nối với Frontend (Next.js)

Frontend chạy ở `http://localhost:3000`, gọi API qua `http://localhost:4000/api/v1`.
`CORS_ORIGIN` trong `.env` đã mở sẵn cho origin này. Phía FE lưu token
(localStorage) và gắn header `Authorization: Bearer <token>`.
