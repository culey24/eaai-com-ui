-- Nhắc việc do agent/tool lưu (tích hợp Python). Ứng dụng có thể đọc sau qua cùng DB hoặc mở route admin sau.
CREATE TABLE agent_user_reminders (
    reminder_id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(10) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reminder_at TIMESTAMPTZ NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_user_reminders_user_time ON agent_user_reminders (user_id, reminder_at);
