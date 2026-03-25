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

## Cài đặt & Chạy

Mã nguồn giao diện nằm trong thư mục **`frontend/`**.

```bash
cd frontend
npm install
npm run dev
```

Hoặc từ thư mục gốc repo (sau khi đã `npm install` trong `frontend/`):

```bash
npm run dev
```

Ứng dụng chạy tại http://localhost:5173

## Cơ sở dữ liệu (PostgreSQL)

Schema và Docker nằm trong **`backend/`** (chạy riêng với frontend). Tài liệu: **[docs/DATABASE.md](docs/DATABASE.md)**.

```bash
npm run db:up      # Postgres + script trong backend/init/ (hoặc: cd backend && npm run db:up)
npm run db:logs    # xem log container
npm run db:down    # tắt container (giữ volume)
npm run db:reset   # xóa volume và tạo lại DB từ đầu
```

**API (Express + Prisma):** trong `backend/` — `cp backend/.env.example backend/.env`, `cd backend && npm install && npm run prisma:migrate && npm run dev`, hoặc từ root: `npm run backend:dev` (sau khi đã có `.env` trong `backend/`).

## Tính năng

- **RBAC:** LEARNER (đăng ký), ASSISTANT (cấp riêng), ADMIN
- **Đăng nhập/Đăng ký:** Form có validation cơ bản
- **Dashboard:** Sidebar với danh sách kênh chat theo quyền, khu vực chat dạng bubble, input gửi tin nhắn
- **Lưu trữ:** Sử dụng localStorage để mock trạng thái đăng nhập và tin nhắn

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
