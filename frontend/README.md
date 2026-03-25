# frontend — Chatbot đa nhiệm (HCMUT)

Giao diện web cho ứng dụng chatbot đa nhiệm phục vụ sinh viên, xây dựng bằng **React**, **Vite** và **Tailwind CSS**, phong cách chat hiện đại kèm nhận diện thương hiệu Đại học Bách khoa.

## Yêu cầu

- **Node.js** 20+ (khuyến nghị; Vite 7 cần phiên bản Node tương thích)
- **npm** (hoặc `pnpm` / `yarn` nếu bạn tự đồng bộ lockfile)

## Cài đặt và chạy

```bash
cd frontend
npm install
npm run dev
```

Mặc định Vite phục vụ tại **http://localhost:5173**. PostgreSQL (Docker) nằm ở workspace **[`backend/`](../backend/)** — chạy riêng, xem [docs/DATABASE.md](../docs/DATABASE.md).

**Chat tối giản (polling):** sao chép [`.env.example`](./.env.example) → `.env` và chỉnh `VITE_API_URL` trỏ tới backend (mặc định `http://localhost:3000`). Dashboard gọi `GET/POST /api/messages`.

### Các lệnh npm

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Chế độ phát triển, HMR |
| `npm run build` | Build production vào `dist/` |
| `npm run preview` | Xem bản build production cục bộ |
| `npm run lint` | Chạy ESLint trên toàn project |

## Công nghệ

- **React 19** — UI
- **Vite 7** — bundler & dev server
- **React Router DOM 7** — định tuyến
- **Tailwind CSS 3** + PostCSS — styling
- **Lucide React** — icon

## Vai trò (RBAC)

- **LEARNER (Người học):** đăng ký, chat theo lớp, báo cáo, cài đặt cá nhân.
- **ASSISTANT (Quản lý lớp):** tài khoản được cấp, không đăng ký qua form; dashboard và lớp được gán.
- **ADMIN:** trang quản trị (`/admin/*`) — lớp, tài khoản, chat, yêu cầu hỗ trợ, bài nộp, v.v.

Luồng sau đăng nhập: Admin → `/admin`; Assistant → dashboard supporter; Learner → dashboard chat chính.

## Dữ liệu demo (MOCK)

Ứng dụng **không gọi API backend** trong phiên bản hiện tại: đăng nhập, người dùng đăng ký và một phần trạng thái được lưu trong **localStorage** (xem `src/context/AuthContext.jsx` và các context liên quan).

### Tài khoản thử nghiệm

| Vai trò | Tài khoản | Mật khẩu |
|---------|-----------|----------|
| Admin | `admin` | `admin123` |
| Assistant | `assistant1` | `assistant123` |
| Assistant | `assistant2` | `assistant123` |
| Learner | `demo` | `demo123` |

**Đăng ký (chỉ Learner):** mã lớp hợp lệ: `IS-1`, `IS-2`, `IS-3` (định nghĩa trong `src/constants/roles.js`).

## Cấu trúc thư mục (`src/`)

```
src/
├── main.jsx, App.jsx, index.css   # Điểm vào, router, style toàn cục
├── components/
│   ├── auth/                      # Login, Register, layout đăng nhập
│   ├── chat/                      # ChatWindow, MessageItem, input, báo cáo
│   ├── layout/                    # Sidebar, AdminLayout
│   ├── supporter/                 # Widget dashboard assistant
│   └── *.jsx                      # ProtectedRoute, GuestRoute, RoleRoute, ...
├── context/                       # Auth, Admin, Theme, Language, Journal, Reports, SupporterChat
├── pages/                         # Dashboard, Settings, Reports, Classes, Journal, admin/*, supporter/*
├── hooks/                         # useMessages, useAllUsers, useSupporterStats
├── constants/                     # roles, admin
├── locales/                       # en.json, vi.json (i18n)
└── assets/                        # Logo, static
```

Tài sản tĩnh toàn cục nằm trong `public/`; build output: `dist/`.

## Giao diện và i18n

- **Tailwind:** màu chủ đạo gồm primary `#1488D8`, secondary `#030391` (cấu hình trong `tailwind.config.js`).
- **Đa ngôn ngữ:** `LanguageContext` + file trong `locales/` (ví dụ tiếng Việt / tiếng Anh).
- **Chế độ sáng/tối:** `ThemeContext`.

## Build production

```bash
npm run build
```

Kết quả trong `dist/`. Triển khai bằng bất kỳ static host hoặc reverse proxy nào; đảm bảo server trả về `index.html` cho các route SPA (fallback).

---

Phần tổng quan repo và hướng dẫn từ thư mục gốc: xem [README.md](../README.md) ở root project. Schema PostgreSQL và Docker: [docs/DATABASE.md](../docs/DATABASE.md).
