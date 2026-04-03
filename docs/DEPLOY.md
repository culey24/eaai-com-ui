# Triển khai (deploy)

## Cách 1: Docker Compose (một máy chủ / VPS)

Phù hợp khi bạn có một server chạy Docker và muốn chạy cả PostgreSQL, API và giao diện web.

### 1. Chuẩn bị file môi trường

Từ thư mục gốc repo:

```bash
cp prod.compose.env.example .env.deploy
```

Sửa `.env.deploy`:

- **`POSTGRES_PASSWORD`**, **`JWT_SECRET`**: bắt buộc, dùng giá trị mạnh trên production.
- **`VITE_API_URL`**: URL công khai của API (trình duyệt phải truy cập được). Ví dụ `https://api.example.com` hoặc nếu chỉ thử trên máy: `http://localhost:3000` (khớp `API_PORT`).
- **`CORS_ORIGINS`**: URL gốc của SPA, ví dụ `https://app.example.com` hoặc `http://localhost:8080`. Nhiều gốc thì cách nhau bằng dấu phẩy.
- **OpenRouter (tuỳ chọn):** `OPENROUTER_API_KEY` để bật **Gemini** qua OpenRouter cho học viên **IS-3** trên kênh **`human-chat`** (mặc định `google/gemini-2.0-flash-001`). System prompt cố định là **AGENT tư vấn**; chỉ lịch sử tin trong DB (không nhúng journal/file). Có thể thêm `OPENROUTER_HTTP_REFERER` theo khuyến nghị OpenRouter. Không set key thì phản hồi báo “chưa được bật”.
- **Journal / upload file:** API lưu file dưới thư mục `uploads/` (mặc định `uploads/journals`). Với Docker Compose prod, volume `eaai_uploads` gắn vào `/app/uploads` để không mất file khi restart container. Sau khi pull code mới, chạy `npx prisma migrate deploy` trong backend để có cột `extracted_text` (trích văn bản cho chatbot).

### 2. Build và chạy

```bash
docker compose -f docker-compose.prod.yml --env-file .env.deploy up -d --build
```

- Web (nginx + static build): cổng mặc định **8080** → `http://<host>:8080`
- API: cổng mặc định **3000** → `http://<host>:3000/health`

Lần đầu, Postgres chạy script trong `backend/init/`. Container API chạy `prisma db execute` + `migrate deploy` rồi mới khởi động Express.

**Sau khi pull bản có nhắc việc agent:** migration `20260403140000_agent_user_reminders` tạo bảng mới — không đổi bảng cũ. Nếu entrypoint/production **đã** chạy `prisma migrate deploy` thì không cần thao tác thêm; nếu **không** migrate, các API `…/reminders` và tool Reminder trên chatbot Python sẽ lỗi khi ghi/đọc DB (các phần còn lại của app vẫn chạy). Chi tiết: [AGENT_ASSISTANT.md](./AGENT_ASSISTANT.md).

### 3. HTTPS và tên miền (khuyến nghị production)

Đặt reverse proxy (Caddy, Nginx, Traefik) phía trước:

- `https://app.example.com` → cổng web (8080 hoặc socket nội bộ).
- `https://api.example.com` → cổng API (3000).

Cập nhật lại `.env.deploy` (`VITE_API_URL`, `CORS_ORIGINS`), **build lại image web** (`docker compose ... up -d --build`) vì `VITE_*` được nhúng lúc build.

Trên API, đặt `TRUST_PROXY=1` nếu TLS kết thúc tại proxy.

---

## Cách 2: Hosting tách (Render, Railway, Fly.io, VPS + managed Postgres)

### Backend

- **Runtime**: Node 22+.
- **Lệnh khởi động** (sau khi `npm ci`):

  ```bash
  npx prisma migrate deploy && node src/index.js
  ```

  Nếu database đã có schema từ script SQL giống `backend/init` (không rỗng) và gặp lỗi migrate, xem [README](../README.md) phần baseline: `prisma db execute` + `migrate resolve` một lần.

- **Biến môi trường**: `DATABASE_URL`, `JWT_SECRET`, `PORT`, tuỳ chọn `JWT_EXPIRES_IN`, `CORS_ORIGINS`, `TRUST_PROXY`, và `OPENROUTER_*` nếu bật Gemini cho IS-3 / `human-chat` (xem mục OpenRouter ở trên). Tuỳ chọn **`AGENT_INTEGRATION_SECRET`**: nếu đặt, mọi request từ **`agent-assistant`** (Python) tới route `agentIntegration` phải gửi header `x-agent-integration-secret` trùng giá trị.

### Agent-assistant / Ingestor (tuỳ chọn, service riêng)

- Stack trong **`agent-assistant/`**: xem [AGENT_ASSISTANT.md](./AGENT_ASSISTANT.md). Backend cần **`AGENTIC_CHATBOT_BASE_URL`** (và tuỳ chọn token Cloud Run) nếu dùng chat IS-1 qua chatbot này.
- **Ingestor** dùng cùng **`DATABASE_URL`**; triển khai thêm process/container nếu cần nhập liệu `majors`/`subjects` bằng file/crawl — không bắt buộc cho SPA mặc định.

- **Railway / DB rỗng (P3009):** Entrypoint đã `migrate resolve --rolled-back` cho migration `journal_extracted_text` lỗi cũ; migration đó chỉ thêm cột khi bảng đã tồn tại. Migration **`journal_periods_and_uploads`** tạo đủ `journal_periods` + `journal_uploads` và seed đợt `default` — không bắt buộc chạy `backend/init` trên hosting. Nếu vẫn kẹt: `npx prisma migrate resolve --rolled-back 20260325180000_journal_extracted_text` rồi `npx prisma migrate deploy`.

### Frontend

- **Build**: `cd frontend && npm ci && npm run build`
- **Biến build**: `VITE_API_URL` trỏ tới URL API công khai (set trước khi `npm run build`).
- **Phục vụ**: upload thư mục `frontend/dist` lên static hosting (S3+CloudFront, Netlify, Vercel, Nginx, …). SPA cần fallback `index.html` cho mọi route (giống `frontend/nginx.conf`).

---

## Kiểm tra sau deploy

1. `GET /health` trên API — `ok: true`, `db: connected`.
2. Mở SPA, đăng ký learner (mã lớp `IS-1` / `IS-2` / `IS-3`) hoặc đăng nhập.
3. Trong DevTools → Network, xác nhận request auth/chat tới đúng `VITE_API_URL`.

---

## Ghi chú bảo mật

- Không commit `.env.deploy` hay `.env` chứa bí mật.
- Đổi mật khẩu Postgres mặc định trong Docker trước khi public.
- `JWT_SECRET` phải dài và ngẫu nhiên trên môi trường thật.
