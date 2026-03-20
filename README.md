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

```bash
npm install
npm run dev
```

Ứng dụng chạy tại http://localhost:5173

## Tính năng

- **RBAC:** LEARNER (đăng ký), ASSISTANT (cấp riêng), ADMIN
- **Đăng nhập/Đăng ký:** Form có validation cơ bản
- **Dashboard:** Sidebar với danh sách kênh chat theo quyền, khu vực chat dạng bubble, input gửi tin nhắn
- **Lưu trữ:** Sử dụng localStorage để mock trạng thái đăng nhập và tin nhắn

## Cấu trúc thư mục

```
src/
├── components/     # Sidebar, ChatWindow, MessageItem, AuthLayout, ...
├── context/       # AuthContext (đăng nhập/đăng xuất)
├── constants/     # roles.js (định nghĩa quyền & kênh chat)
├── hooks/         # useMessages (quản lý tin nhắn + localStorage)
└── pages/         # DashboardPage
```

## Màu sắc (Tailwind)

- **primary:** #1488D8 (nút, icon active)
- **secondary:** #030391 (sidebar, header)
