-- Ghi nhận nhắc việc đã được đẩy vào chat (tránh gửi trùng). Idempotent nếu ensureDbPatches đã thêm cột.
ALTER TABLE agent_user_reminders ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_agent_user_reminders_reminder_notified ON agent_user_reminders (reminder_at, notified_at);
