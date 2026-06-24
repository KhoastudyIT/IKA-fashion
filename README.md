# IKA Fashion

Website thương mại điện tử thời trang, gồm **2 phần tách biệt**:

| Phần | Công nghệ | Thư mục | Cổng |
|------|-----------|---------|------|
| **Frontend** | Next.js 16 (App Router) + React 19 + Tailwind | `frontend/` | `3000` |
| **Backend (API)** | Node.js + Express (kiến trúc module) | `backend/` | `4000` |

Frontend gọi Backend qua HTTP tại `http://localhost:4000/api/v1`.
Backend dùng **in-memory store** (chạy ngay, không cần cài database).

---

## 1. Yêu cầu

- **Node.js** ≥ 18 (khuyến nghị 20+)
- **npm** (đi kèm Node — dùng cho cả frontend & backend)

---

## 2. Chạy dự án (cần 2 cửa sổ terminal)

### Terminal 1 — Backend API

```bash
cd backend
npm install
npm run dev
```

→ Chạy tại **http://localhost:4000**
- Tài liệu API (Scalar): http://localhost:4000/api-docs
- Health check: http://localhost:4000/api/health
- Tài khoản admin tạo sẵn: **`admin@ika.vn`** / **`admin123`**

> Backend chạy được ngay với cấu hình mặc định, **không cần** file `.env`.
> Muốn tùy chỉnh (PORT, JWT_SECRET, admin...), xem `backend/.env.example`.

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

→ Chạy tại **http://localhost:3000**

> File `frontend/.env.local` đã cấu hình sẵn `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`.
> Nếu backend chạy cổng khác, sửa giá trị này.

> **Tiện lợi:** từ thư mục gốc có thể dùng `npm run install:all` (cài cả 2),
> rồi `npm run dev:be` và `npm run dev:fe` (mỗi lệnh một terminal).

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
| `npm run dev:fe` | Chạy frontend |
| `npm run dev:be` | Chạy backend |

---

## 5. Cấu trúc thư mục

```
IKA-fashion/
├── package.json          # Orchestrator (dev:fe, dev:be, install:all)
├── frontend/             # ====== FRONTEND (Next.js) ======
│   ├── app/              #   các trang (auth, products, cart, wishlist, search, dashboard)
│   ├── components/       #   UI components
│   ├── shared/           #   kiểu dữ liệu dùng chung
│   ├── api.ts            #   client gọi Express API
│   ├── auth-client.ts    #   quản lý phiên đăng nhập (JWT + localStorage)
│   ├── .env.local        #   NEXT_PUBLIC_API_URL
│   └── package.json
└── backend/              # ====== BACKEND (Express) ======
    ├── src/
    │   ├── app.js · server.js · config/
    │   ├── middleware/   #   auth (JWT), phân quyền, validate (zod), lỗi
    │   ├── db/           #   in-memory store + seed
    │   ├── modules/      #   auth · products · collections · cart · orders · wishlist
    │   └── docs/         #   OpenAPI (Scalar)
    ├── database/
    │   └── migration.sql #   schema PostgreSQL (để triển khai DB thật về sau)
    └── package.json
```

Chi tiết API xem `backend/README.md`.

---

## 6. Ghi chú

- **Dữ liệu là in-memory**: sản phẩm/đơn hàng/người dùng được tạo lúc chạy sẽ **mất khi khởi động lại backend**. Đây là thiết kế để chạy nhanh không cần cài database. Khi cần lưu thật, dùng `backend/database/migration.sql` để dựng PostgreSQL.
- 12 sản phẩm thời trang (áo thun, áo polo, quần) được seed sẵn mỗi lần khởi động.
- Xác thực dùng **JWT**: token lưu ở `localStorage` phía trình duyệt, gửi kèm header `Authorization: Bearer <token>`.
