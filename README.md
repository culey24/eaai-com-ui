# Chatbot Đa nhiệm - ĐH Bách Khoa (HCMUT)

Ứng dụng Web UI Chatbot đa nhiệm dành cho sinh viên, sử dụng React + Vite + Tailwind CSS, mang phong cách ChatGPT với bộ nhận diện thương hiệu Đại học Bách Khoa.

## RBAC: 2 vai trò chính

- **Learner (Người học):** Đăng ký, chat theo lớp, báo cáo
- **Assistant (Quản lý lớp):** Cấp tài khoản riêng, không đăng ký. Xem báo cáo, quản lý người học theo lớp

## Tài khoản Demo (MOCKUP)

| Vai trò    | Tài khoản    | Mật khẩu      |
|------------|--------------|---------------|
| Admin      | `admin`      | `admin123`    |
| Assistant  | `assistant1` | `assistant123` |
| Assistant  | `assistant2` | `assistant123` |
| Learner    | `demo`       | `demo123`     |

**Đăng ký (chỉ Learner):** Mã lớp hợp lệ: `IS-1`, `IS-2`, `IS-3`

## Công nghệ

- **React 19** + **Vite 7**
- **Tailwind CSS 3**
- **React Router DOM**
- **Lucide React** (icons)

## Biến môi trường (`.env`)

### `backend/.env` (bắt buộc khi chạy API + Prisma)

Sao chép từ [backend/.env.example](backend/.env.example):

| Biến | Ghi chú |
|------|---------|
| **`DATABASE_URL`** | Chuỗi PostgreSQL. Mặc định Docker: `postgresql://eaai:eaai_dev_change_me@localhost:5432/eaai_com?schema=public`. Nếu đổi mật khẩu DB trong Docker, sửa user/password cho khớp. |
| **`PORT`** | Cổng Express (mặc định `3000`). |
| **`JWT_SECRET`** | Chuỗi bí mật ký JWT (nên ≥ 32 ký tự, ngẫu nhiên trên production). **Bắt buộc** cho `POST /api/auth/login`, `register`, v.v. |
| **`JWT_EXPIRES_IN`** | Tuỳ chọn, ví dụ `7d`. |
| **`POSTGRES_PASSWORD`**, **`POSTGRES_PORT`** | Tuỳ chọn — chỉ khi chạy `docker compose` trong `backend/` và muốn ghi đè mặc định (xem file example). |

### `frontend/.env` (tuỳ chọn)

Sao chép từ [frontend/.env.example](frontend/.env.example):

| Biến | Ghi chú |
|------|---------|
| **`VITE_API_URL`** | URL gốc của backend **không** có dấu `/` cuối, ví dụ `http://localhost:3000`. Dùng cho **đăng nhập/đăng ký API** và **chat kênh (polling DB)**. Không khai báo thì fallback `http://localhost:3000`. |

Vite chỉ đọc biến bắt đầu bằng `VITE_`. Sau khi sửa `.env`, cần restart `npm run dev` của frontend.

---

## Chạy full stack (DB + backend + frontend)

Thứ tự gợi ý (mở **3 terminal** hoặc tách bước):

1. **PostgreSQL (Docker)** — từ root repo:

   ```bash
   npm run db:up
   ```

   Lần đầu: container chạy script trong `backend/init/`. Chi tiết: [docs/DATABASE.md](docs/DATABASE.md).

2. **Cấu hình & migration Prisma** — một lần (hoặc sau khi đổi schema):

   ```bash
   cp backend/.env.example backend/.env
   # Sửa JWT_SECRET (và DATABASE_URL nếu cần)
   cd backend && npm install && npm run prisma:migrate
   ```

3. **API Express** — terminal 2:

   ```bash
   cd backend && npm run dev
   ```

   Hoặc từ root: `npm run backend:dev` (cần đã `npm install` trong `backend/`).

4. **Giao diện Vite** — terminal 3:

   ```bash
   cp frontend/.env.example frontend/.env   # tuỳ chọn
   cd frontend && npm install && npm run dev
   ```

   Hoặc từ root (sau `npm install` trong `frontend/`): `npm run dev`.

- UI: **http://localhost:5173**  
- API: **http://localhost:3000** (kiểm tra **http://localhost:3000/health**)

**Lưu ý:** Nếu backend chạy và đăng nhập qua API thành công, **người học** dùng chat kênh qua **polling** (`GET /api/messages/:conversationId`, `POST /api/messages` + JWT). Nếu API lỗi hoặc chỉ đăng nhập mock, chat vẫn dùng **localStorage** như trước.

## Deploy (Docker / hosting)

Hướng dẫn chi tiết: [docs/DEPLOY.md](docs/DEPLOY.md).

Tóm tắt Compose (sau `cp prod.compose.env.example .env.deploy` và chỉnh biến):

```bash
npm run deploy:up
```

---

## Cơ sở dữ liệu (PostgreSQL) — lệnh nhanh

```bash
npm run db:up      # Postgres + script trong backend/init/
npm run db:logs    # xem log container
npm run db:down    # tắt container (giữ volume)
npm run db:reset   # xóa volume và tạo lại DB từ đầu
```

## Tính năng

- **RBAC:** LEARNER (đăng ký), ASSISTANT (cấp riêng), ADMIN
- **Đăng nhập/Đăng ký:** Form có validation cơ bản
- **Dashboard:** Sidebar với danh sách kênh chat theo quyền, khu vực chat dạng bubble, input gửi tin nhắn
- **Lưu trữ:** Đăng nhập + chat có thể qua **API + Postgres** (JWT); fallback mock dùng localStorage

## Cấu trúc thư mục

```
frontend/              # React + Vite app
├── public/
├── src/
│   ├── components/  # Sidebar, ChatWindow, MessageItem, AuthLayout, ...
│   ├── context/     # Auth, theme, journal, ...
│   ├── constants/
│   ├── hooks/
│   └── pages/
├── index.html
├── package.json
└── vite.config.js
backend/               # Docker Postgres + init SQL (workspace backend)
docs/                  # DATABASE.md, recommended_table.sql, …
```

## Màu sắc (Tailwind)

- **primary:** #1488D8 (nút, icon active)
- **secondary:** #030391 (sidebar, header)
