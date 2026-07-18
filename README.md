# IKA Fashion

Website thương mại điện tử thời trang, gồm **2 phần tách biệt** + **1 database**:

| Phần | Công nghệ | Thư mục | Cổng |
|------|-----------|---------|------|
| **Frontend** | Next.js 16 (App Router) + React 19 + Tailwind | `frontend/` | `3000` |
| **Backend (API)** | Node.js + Express (kiến trúc module) | `backend/` | `4000` |
| **Database** | PostgreSQL 16 | (Docker / local) | `5432` (host `5434` khi chạy Docker) |

Frontend gọi Backend qua HTTP tại `http://localhost:4000/api/v1`; Backend lưu dữ liệu trong **PostgreSQL**.

---

## 1. Chạy nhanh bằng Docker (khuyến nghị)

Cần **Docker Desktop**. Tại thư mục gốc:

```bash
docker compose up -d --build
```

Lệnh này bật cả 3 service; Postgres **tự nạp** `backend/database/ika_database.sql` (tạo bảng + seed 4 danh mục, 36 sản phẩm) ở lần đầu.

- Web: http://localhost:3000
- API: http://localhost:4000 · Docs (Scalar): http://localhost:4000/api-docs
- Admin seed sẵn: **`admin@ika.vn`** / **`admin123`**

Chi tiết Docker (lệnh hằng ngày, đổi cấu hình, xử lý sự cố): xem **[DOCKER.md](DOCKER.md)**.

---

## 2. Chạy không dùng Docker (local thuần)

Cần **Node.js 20+** và một **PostgreSQL** đang chạy.

### Terminal 1 — Backend API

```bash
cd backend
npm install
cp .env.example .env       # sửa DATABASE_URL cho khớp Postgres của bạn
npm run db:setup           # tạo DB ika_fashion + nạp schema/seed (chạy 1 lần)
npm run dev                # http://localhost:4000  (node --watch)
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev                # http://localhost:3000
```

> `frontend/.env.local` đã cấu hình sẵn `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`.
> Từ thư mục gốc cũng có `npm run install:all`, rồi `npm run dev:be` / `npm run dev:fe`.

---

## 3. Luồng dùng thử

1. Mở http://localhost:3000
2. **Đăng ký** tài khoản mới (hoặc đăng nhập admin `admin@ika.vn` / `admin123`)
3. Xem **Sản Phẩm** → vào chi tiết → **Thêm vào giỏ**
4. Vào **Giỏ hàng** → **Đặt hàng** (nhập địa chỉ, SĐT)
5. Xem đơn ở **Tài khoản → Lịch sử đơn hàng**
6. Đăng nhập **admin** → `/dashboard/admin/products` để **thêm / sửa / xóa** sản phẩm

---

## 4. Lệnh có sẵn

**Backend** (`cd backend`)
| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Chạy dev có auto-reload (`node --watch`) |
| `npm start` | Chạy production |
| `npm run db:setup` | Tạo DB + nạp `database/ika_database.sql` (local) |

**Frontend** (`cd frontend`)
| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Chạy dev |
| `npm run build` | Build production |
| `npm start` | Chạy bản đã build |
| `npm run lint` | Kiểm tra lint |

**Gốc dự án** (orchestrator)
| Lệnh | Mô tả |
|------|-------|
| `npm run install:all` | Cài dependencies cho cả frontend & backend |
| `npm run dev:fe` / `npm run dev:be` | Chạy frontend / backend |

---

## 5. Cấu trúc thư mục

```
IKA-fashion/
├── docker-compose.yml     # 3 service: postgres + backend + frontend
├── DOCKER.md              # hướng dẫn chạy bằng Docker
├── package.json           # Orchestrator (dev:fe, dev:be, install:all)
├── frontend/              # ====== FRONTEND (Next.js) ======
│   ├── app/               #   các trang (auth, products, cart, wishlist, search, dashboard)
│   ├── components/        #   UI components
│   ├── shared/            #   kiểu dữ liệu dùng chung
│   ├── api.ts             #   client gọi Express API
│   ├── auth-client.ts     #   quản lý phiên đăng nhập (JWT + localStorage)
│   ├── Dockerfile         #   build Next.js standalone
│   └── package.json
└── backend/               # ====== BACKEND (Express) ======
    ├── src/
    │   ├── app.js · server.js · config/
    │   ├── middleware/    #   auth (JWT), phân quyền, validate (zod), lỗi
    │   ├── db/            #   index.js (pg Pool) · seed.js (admin) · setup.js (local)
    │   ├── modules/       #   auth · products · collections · cart · orders · wishlist · messages
    │   └── docs/          #   OpenAPI (Scalar)
    ├── database/
    │   └── ika_database.sql  # schema + seed PostgreSQL (Postgres tự nạp lúc init)
    ├── Dockerfile
    └── package.json
```

Chi tiết API xem `backend/README.md`.

---

## 6. Ghi chú

- **Dữ liệu lưu trong PostgreSQL** → bền qua khởi động lại. Chạy Docker: dữ liệu nằm trong volume `ika_pgdata` (xoá bằng `docker compose down -v`).
- Schema + seed nằm ở `backend/database/ika_database.sql`; Postgres tự nạp lần đầu (Docker), hoặc `npm run db:setup` (local). 4 danh mục + 36 sản phẩm (áo thun, áo polo, quần, ưu đãi).
- Xác thực dùng **JWT**: token lưu ở `localStorage` phía trình duyệt, gửi kèm header `Authorization: Bearer <token>`.
