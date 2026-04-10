# Agent-assistant & Ingestor — tích hợp chatbot Python

Tài liệu mô tả **`agent-assistant/`**: stack FastAPI + Google ADK (manager + sub-agents), đồng bộ với **backend Node** qua route **`agentIntegration`**, tuỳ chọn **ingestor** để đẩy dữ liệu chương trình/đề cương vào PostgreSQL.

## Kiến trúc nhanh

| Thành phần | Vai trò |
|------------|---------|
| **`chatbot_server/`** (uvicorn, cổng mặc định 8003) | Proxy: tạo phiên agent, gọi ADK `/run`, lưu tin qua API Node; `POST /upload` lưu file user. |
| **`agents/`** | Định nghĩa graph ADK; `ADK_APP_NAME` mặc định `agents` (khớp `adk web … agents`). |
| **Backend Express** | `DATABASE_URL`, JWT cho app; route gốc **`/users/...`**, **`/sessions/...`** (file `backend/src/routes/agentIntegration.js`) — header tuỳ chọn **`x-agent-integration-secret`**. |
| **`ingestor/`** | Service FastAPI riêng (cổng mặc định 8001): crawl / upload Excel-PDF → CSV → bảng `majors`, `subjects`, `major_subject` khi bật đồng bộ DB. |

Docker một image: xem **`agent-assistant/Dockerfile`** + **`docker-entrypoint.sh`** (ADK + uvicorn chatbot). Ingestor **tuỳ chọn** trong cùng container: đặt **`INGESTOR_ENABLED=1`**, **`DATABASE_URL`**, publish cổng **`INGESTOR_PORT`** (mặc định 8001). Mặc định không bật để image agent-only không cần DB.

## Biến môi trường (chatbot + agents)

Tham chiếu: **`agent-assistant/.env.example`**.

- **`BE_SERVER_BASE_URL`** — URL gốc API Node (ví dụ `http://localhost:3000`), **không** có `/api` cho các route integration (mount tại root app).
- **`AGENT_INTEGRATION_SECRET`** — Trùng với **`AGENT_INTEGRATION_SECRET`** trên backend khi middleware bật; nếu backend để trống secret thì không cần gửi header.
- **`ADK_APP_NAME`** — Mặc định `agents`; phải khớp app ADK và payload `/run`.
- **LLM:** `GOOGLE_API_KEY` + `MODEL_ID`, hoặc **`OPENROUTER_API_KEY`** (xem `utils/llm_provider.py`).
- **`AGENT_SERVER_*` / `AGENT_SERVER_BASE_URL`** — Mục tiêu process ADK (trong Docker thường loopback).

## API chatbot (proxy)

Các endpoint chính (đặt sau **`AGENTIC_CHATBOT_BASE_URL`** khi backend Node gọi Cloud Run / VM):

- `GET /health`
- `POST /users/{user_id}/sessions` — tạo `agent_sessions` + session trên ADK.
- `GET /users/{user_id}/sessions/{session_id}` — ưu tiên đọc lịch sử từ DB (`GET …/sessions/…/conversations` trên Node), fallback ADK.
- `DELETE /users/.../sessions/...`
- `POST /chat-with-agent`, `POST /chat-with-llm`, `POST /chat-with-ta`
- **`POST /upload`** — `multipart`: `file`, `user_id`, `session_id`; lưu `data/uploaded_data/{session_id}_{stem}{ext}`; trả **`file_name`** cho tool agent.

**`POST /chat-with-agent`** — **FAQ Agent** (chạy trước tiên): ưu tiên **pgvector** — embedding passage lưu cột **`embedding`** (`vector(1536)`) trên PostgreSQL, truy vấn `ORDER BY embedding <=> query` (cosine distance); cần **`DATABASE_URL`** + **`OPENROUTER_API_KEY`** trên chatbot. Đồng bộ: các dòng `embedding IS NULL` được embed qua OpenRouter khi có request. Khi tắt pgvector (`FAQ_USE_PGVECTOR=0`) hoặc thiếu DB/key: fallback đọc **`GET /faq`** + embed trong RAM (OpenRouter/fastembed) hoặc **`data/faq.json`**. Ngưỡng: **`FAQ_EMBEDDING_THRESHOLD`**. Phản hồi: `source: "faq_agent"`. Sau đó ADK (`source: "adk"`). Tắt hẳn: **`FAQ_AGENT_ENABLED=0`**.

Quản trị FAQ (CRUD + CSV): **`/api/admin/faq`** — sửa nội dung sẽ **xóa embedding** (cột NULL) để chatbot embed lại.

**Postgres dev/prod:** dùng image có sẵn extension, ví dụ **`pgvector/pgvector:pg16`** (đã đặt trong `backend/docker-compose.yml` và `docker-compose.prod.yml`).

Tool **`read_uploaded_data_file`** (manager) nhận đúng `file_name` đó và trích text (PDF/DOCX/CSV/Excel).

## Route tích hợp trên backend Node

File: **`backend/src/routes/agentIntegration.js`** (middleware **`agentIntegrationAuth`**).

Ngoài session/conversation/role/learning_history/schedule, đã bổ sung:

- **`GET /sessions/:sessionId/conversations`** — đọc `agent_session_messages`.
- **`POST /users/:userId/reminders`** — lưu nhắc việc (`agent_user_reminders`).
- **`GET /users/:userId/reminders`** — liệt kê nhắc việc.

Nhắc việc được gọi từ tool Reminder agent (`set_reminder`, `list_user_reminders`).

## Ingestor

Chạy độc lập (cùng **`DATABASE_URL`** với Prisma):

```bash
cd agent-assistant
export DATABASE_URL='postgresql://...'   # giống backend/.env
export PYTHONPATH=.
python -m uvicorn ingestor.server:app --host 0.0.0.0 --port 8001
```

- **`INGESTOR_SYNC_DB`** — `1` (mặc định): sau khi xử lý file chương trình/đề cương, đẩy CSV mới nhất vào `majors` / `subjects` / `major_subject` (UPSERT / tránh trùng liên kết).
- Crawl web (**Selenium + Chrome**) cần môi trường có trình duyệt/driver; trên image tối giản có thể chỉ dùng **`POST /ingest/file/program`** và **`POST /ingest/file/outline`**.

Chi tiết endpoint: lấy cảm hứng từ repo **`agentic_assistant`** (`INGESTOR_APIS.md`); hành vi tương đương nhưng import/package là **`ingestor.*`**.

## Deploy cơ sở dữ liệu — có lỗi không?

Migration **`20260403140000_agent_user_reminders`** chỉ **tạo bảng mới** `agent_user_reminders` + index + FK tới **`users`**.

- **Không** sửa / xoá cột bảng cũ → **không phá dữ liệu hiện có**.
- **Bắt buộc** chạy **`npx prisma migrate deploy`** (hoặc quy trình migrate của bạn) **trước** khi có traffic dùng nhắc việc qua agent. Nếu **bỏ qua migrate**:
  - App Node/Prisma vẫn khởi động bình thường.
  - Các luồng **không** gọi `AgentUserReminder` vẫn chạy.
  - **`POST/GET …/reminders`** và tool reminder sẽ lỗi kiểu *relation/table does not exist* khi thực thi truy vấn.
- Ingestor ghi **`majors` / `subjects` / `major_subject`** đã có từ `backend/init`; dùng UPSERT nên ít xung đột; vẫn cần **`education_levels`** có mã **`DH`**, **`CH`** (seed init).

Tóm lại: **deploy an toàn nếu luôn chạy migrate sau khi pull**; rủi ro chủ yếu là **quên migrate** khi đã bật tính năng nhắc việc.

## Tài liệu liên quan

- [DATABASE.md](./DATABASE.md) — bổ sung bảng agent / reminders trong mục ứng dụng.
- [DEPLOY.md](./DEPLOY.md) — nhắc migrate và biến agent-stack.
