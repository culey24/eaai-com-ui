# Cơ sở dữ liệu — theo dõi & vận hành

Tài liệu này mô tả **PostgreSQL** dùng cho dự án: cách chạy local, thứ tự script, bảng, seed, và mapping sang **`frontend/`**.

Toàn bộ Docker và script SQL nằm trong **`backend/`** (chạy riêng với **`frontend/`** — UI: `cd frontend && npm run dev`).

## Nhanh: chạy DB local

```bash
# Từ thư mục gốc repo
npm run db:up
```

Hoặc chỉ dùng workspace backend:

```bash
cd backend
npm run db:up
# hoặc: docker compose --env-file .env.example up -d
# hoặc: cp .env.example .env && docker compose up -d
```

- **Host:** `localhost`
- **Cổng:** `5432` (đổi bằng `POSTGRES_PORT` trong `backend/.env` nếu trùng máy khác)
- **Database:** `eaai_com`
- **User:** `eaai`
- **Mật khẩu:** mặc định `eaai_dev_change_me` (đổi trong `backend/.env` hoặc biến `POSTGRES_PASSWORD`)

Kết nối psql:

```bash
docker exec -it eaai-postgres psql -U eaai -d eaai_com
```

Script khởi tạo chỉ chạy **lần đầu** khi volume Postgres trống. Để chạy lại từ đầu:

```bash
cd backend && docker compose down -v && docker compose up -d
```

## Prisma ORM & API Express

- **Schema:** [backend/prisma/schema.prisma](../backend/prisma/schema.prisma) — map tới bảng Postgres do `backend/init/*.sql` tạo.
- **Biến môi trường:** `DATABASE_URL` trong `backend/.env` (mẫu: [backend/.env.example](../backend/.env.example)).
- **Sau khi container Postgres init xong:** trong `backend/` chạy `npm run prisma:migrate` để áp migration bổ sung cột `created_at` / `updated_at` (file `prisma/migrations/*_prisma_orm_timestamps`).
- **Journal (Railway / DB chỉ Prisma):** migration `*_journal_periods_and_uploads` tạo `journal_periods` + `journal_uploads` và seed đợt `default` — không cần chạy `backend/init` đầy đủ. Docker local đã có bảng từ `04_app_schema.sql` thì lệnh `CREATE IF NOT EXISTS` + `INSERT … ON CONFLICT DO NOTHING` không phá dữ liệu cũ.
- **Chạy server thử:** `cd backend && npm install && npm run dev` — `GET /health` gọi `prisma.$queryRaw` kiểm tra kết nối.

Mapping nhanh Prisma ↔ mock cũ:

| Mock (localStorage) | Bảng / model Prisma |
|---------------------|---------------------|
| `eeai_chatbot_messages` (`channelId::userId`) | `Conversation` + `Message` |
| `eeai_chatbot_reports` | `ContentReport` |
| Admin assignments | `LearnerSupporterAssignment` |
| Admin support requests | `SupportRequest` |
| Admin settings (`auto_mode`, `deadlines`, …) | `AppSetting` |

## Cấu trúc thư mục

| Đường dẫn | Vai trò |
|-----------|---------|
| [backend/docker-compose.yml](../backend/docker-compose.yml) | Postgres 16, mount `init/` |
| [backend/init/01_extensions.sql](../backend/init/01_extensions.sql) | `pgcrypto` (bcrypt cho cột `pwd`) |
| [backend/init/02_core_schema.sql](../backend/init/02_core_schema.sql) | Schema học vụ + `Users` (ENUM có `admin`) |
| [backend/init/03_core_seed.sql](../backend/init/03_core_seed.sql) | Seed học vụ + user mẫu (hash mật khẩu) |
| [backend/init/04_app_schema.sql](../backend/init/04_app_schema.sql) | Chat, journal, admin (supporter, báo cáo, settings) |
| [backend/init/05_app_seed.sql](../backend/init/05_app_seed.sql) | Kênh chat, phạm vi supporter, journal mặc định |
| [backend/prisma/schema.prisma](../backend/prisma/schema.prisma) | Prisma — chat, báo cáo, admin (assignments, support_requests, settings) |
| [docs/recommended_table.sql](./recommended_table.sql) | Bản tham chiếu gốc (có thể lệch ENUM); **nguồn triển khai thực tế là `backend/init/`** |

## Bảng cốt lõi (học vụ)

Giữ đúng tinh thần [recommended_table.sql](./recommended_table.sql): `Education_Levels`, `Training_Program_Types`, `Majors`, `Users`, `Subjects`, `Major_subject`, `Semesters`, `Classes`, `Class_Students`, `Class_Teachers`.

**Khác biệt so với file SQL tham chiếu cũ:**

- `user_role_enum`: thêm giá trị **`admin`** (đồng bộ role ADMIN trên UI).
- Cột `pwd` trong DB: lưu **chuỗi bcrypt** (`crypt(..., gen_salt('bf'))`), không lưu plain text.

## Bảng ứng dụng (chatbot / quản trị)

| Bảng | Mục đích |
|------|-----------|
| `assistant_managed_classes` | Supporter/assistant nào xem lớp chat IS-* nào ↔ `managedClasses` (Assistant). |
| `chat_channels` | `ai-chat` / `human-chat` / `internal-chat` ↔ `IS-1` … `IS-3`. |
| `conversations` | Một thread / learner / kênh (tương đương key `channelId::userId` trong mock). |
| `messages` | Tin nhắn; `sender_role` = `user` \| `assistant` \| `system`. |
| `content_reports` | Báo cáo nội dung từ người học. |
| `journal_periods` | Đợt nộp bài (submission window). |
| `journal_uploads` | Bản ghi file đã nộp (`storage_key` trỏ object storage sau này). |
| `learner_supporter_assignments` | Gán supporter cho learner + `teaching_mode` (`AGENT` / `LLM` / `MANUAL`). |
| `support_requests` | Yêu cầu hỗ trợ chờ admin duyệt. |
| `app_settings` | Key–value JSON, ví dụ `auto_mode`, `deadlines`. |
| `faq_entries` | FAQ cho **FAQ Agent** (Python): `question`, `answer`, `keywords` (JSON), `sort_order`, `is_active`, **`embedding`** (`vector(1536)` pgvector), `embedding_model`; đọc qua `GET /faq` (agent integration), CRUD admin `/api/admin/faq`. Cần extension **`vector`** (image Postgres `pgvector/pgvector`). |
| `agent_sessions` | Phiên chatbot ADK (UUID); trạng thái `active` / `deactive`. |
| `agent_session_messages` | Tin trong phiên agent (`chat_role` `user` / `model` / `TA`, `file_ids`, …). |
| `agent_user_reminders` | Nhắc việc đăng ký qua tool Reminder + API integration (`reminder_at`, `message`, FK `user_id`). |

Migration Prisma: **`20260331120000_agent_integration_sessions`**, **`20260403140000_agent_user_reminders`**, **`20260410120000_faq_entries`**, **`20260410140000_faq_pgvector`**.

Xem thêm: [AGENT_ASSISTANT.md](./AGENT_ASSISTANT.md).

## Mapping frontend (UI) ↔ DB

| UI (`frontend/`) | DB |
|----------|-----|
| `ROLES.LEARNER` | `Users.user_role = 'student'` |
| `ROLES.ASSISTANT` (UI) | `Users.user_role = 'support'` (supporter do admin gán; legacy `assistant`) + tuỳ chọn `assistant_managed_classes` |
| `ROLES.ADMIN` | `Users.user_role = 'admin'` |
| `VALID_CLASS_CODES` / `CLASS_TO_CHANNEL` | `user_class_enum`, `chat_channels` |
| `useMessages` | `conversations` + `messages` |
| `ReportsContext` | `content_reports` |
| `JournalContext` submissions | `journal_periods` |
| `JournalContext` uploads | `journal_uploads` |
| `AdminContext` assignments | `learner_supporter_assignments` |
| `AdminContext` supportRequests | `support_requests` |
| `CLASS_TO_MODE` | `teaching_mode_enum` |

## Tài khoản seed (plain password → kiểm tra qua backend)

| username | Plain password | user_role (DB) | Ghi chú |
|----------|----------------|----------------|---------|
| `admin` | `admin123` | admin | Trùng demo UI |
| `assistant1` | `assistant123` | support | IS-1, IS-2 trong `assistant_managed_classes` |
| `assistant2` | `assistant123` | support | IS-2, IS-3 |
| `demo` | `demo123` | student | `user_class = IS-1` |
| `gv_a` | `123456` | support | Mẫu học vụ gốc |
| `sv_x` | `123456` | student | Mẫu học vụ gốc |

Xác thực mật khẩu trong SQL (sau khi đăng nhập bằng app, có thể dùng để debug):

```sql
SELECT username, pwd = crypt('admin123', pwd) AS ok FROM users WHERE username = 'admin';
```

## Lộ trình tiếp theo (gợi ý)

1. **API backend** đọc/ghi các bảng trên; JWT/session map `user_id` / `username`.
2. **Object storage** cho file chat & journal; DB chỉ giữ `storage_key`, `original_file_name`.
3. **Migration tool** (Flyway, sqitch, Atlas…) nếu cần phiên bản hóa thay vì chỉ `init/` một lần.
4. Đồng bộ lại [recommended_table.sql](./recommended_table.sql) nếu muốn một file “snapshot” DDL khớp 100% với `backend/init/` (hiện init là nguồn đúng cho triển khai).

## Nhật ký thay đổi (cập nhật tay khi schema đổi)

| Ngày | Thay đổi |
|------|-----------|
| 2025-03-25 | PostgreSQL trong `backend/` (Docker + `init/*`), ENUM `admin`, bảng app; tách workspace với `frontend/`. Trước đó từng nằm dưới `database/`; UI từng ở `Frontend/`. |
| 2025-03-26 | Thêm Express + Prisma (`schema.prisma`, migration timestamp, `src/index.js`). |
| 2026-04-03 | Bảng `agent_user_reminders` (nhắc việc từ agent Python); additive, FK `users`. Chi tiết [AGENT_ASSISTANT.md](./AGENT_ASSISTANT.md). |
