-- Cột bổ sung để Prisma dùng @updatedAt / createdAt (init SQL gốc chưa có đủ).
-- Chạy sau khi Docker đã apply backend/init/*.sql: `npx prisma migrate deploy`

ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
UPDATE messages SET updated_at = created_at;

ALTER TABLE content_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
UPDATE content_reports SET updated_at = created_at;

ALTER TABLE learner_supporter_assignments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE learner_supporter_assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
UPDATE learner_supporter_assignments SET created_at = assigned_at;

ALTER TABLE support_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
UPDATE support_requests SET updated_at = created_at;

ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
UPDATE app_settings SET created_at = updated_at;
