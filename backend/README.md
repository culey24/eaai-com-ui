# Backend (Node.js + Express + Prisma)

Nằm ngang hàng với thư mục **`frontend/`** (React + Vite). Chạy **riêng** so với UI.

## Chuẩn bị

1. **PostgreSQL** — từ thư mục này:

   ```bash
   npm run db:up
   ```

2. **Biến môi trường** — sao chép `.env.example` → `.env` và chỉnh `DATABASE_URL` / `PORT` nếu cần.

3. **Đồng bộ cột ORM** (sau lần init Docker đầu tiên):

   ```bash
   npm run prisma:migrate
   ```

   Migration `prisma/migrations/*_prisma_orm_timestamps` thêm `updated_at` / `created_at` cho các bảng mà `backend/init/*.sql` chưa có đủ so với Prisma.

4. **Cài dependency & generate client**

   ```bash
   npm install
   ```

## Chạy API

```bash
npm run dev
```

- API: `http://localhost:3000` (hoặc `PORT` trong `.env`)
- Kiểm tra DB: `GET http://localhost:3000/health`
- Cần `JWT_SECRET` trong `.env` (xem `.env.example`).

### REST (tóm tắt)

| Method | Path | Auth | Mô tả |
|--------|------|------|--------|
| POST | `/api/auth/register` | Không | Đăng ký learner (bcrypt) |
| POST | `/api/auth/login` | Không | Đăng nhập → JWT |
| GET | `/api/me` | Bearer | Thông tin user từ token |
| GET | `/api/conversations` | Bearer | Hội thoại (learner: của mình; teacher: theo lớp; admin: tất cả) |
| GET | `/api/messages` | Không | Chat tối giản: 50 tin mới nhất (thời gian tăng dần) |
| GET | `/api/messages/:conversationId` | Bearer | Lịch sử tin (`?limit=&beforeId=`) |
| POST | `/api/messages` | Tuỳ | `{ senderName, content }` không `channelId` → tối giản, không JWT; có `channelId` → JWT như cũ |
| POST | `/api/sync/local-storage` | Bearer | Đồng bộ object `eeai_chatbot_messages` |
| POST | `/api/reports` | Bearer | Lưu báo cáo (payload giống `eeai_chatbot_reports`) |

Header: `Authorization: Bearer <token>`

## Prisma

| Lệnh | Mô tả |
|------|--------|
| `npm run prisma:generate` | Tạo lại `@prisma/client` |
| `npm run prisma:migrate` | `prisma migrate deploy` — áp migration lên DB đã có schema từ Docker init |
| `npm run prisma:push` | `prisma db push` — chỉ dùng khi muốn ép schema (dev), cẩn thận với dữ liệu |

Chi tiết bảng & mapping: [docs/DATABASE.md](../docs/DATABASE.md).

## Cấu trúc

```
backend/
├── docker-compose.yml
├── init/                 # SQL khởi tạo Postgres (Docker)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   └── index.js
├── .env.example
└── package.json
```
