-- Journal: bảng đủ cho production khi chỉ dùng Prisma (không chạy backend/init SQL).
-- Không FK tới Classes — class_id chỉ là tùy chọn, tránh phụ thuộc schema học vụ.

CREATE TABLE IF NOT EXISTS journal_periods (
    period_id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    class_id VARCHAR(50),
    created_by VARCHAR(10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_journal_periods_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS journal_uploads (
    upload_id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(10) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    period_id VARCHAR(64) NOT NULL REFERENCES journal_periods(period_id) ON DELETE CASCADE,
    storage_key VARCHAR(512) NOT NULL,
    original_file_name VARCHAR(512),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status VARCHAR(32) NOT NULL DEFAULT 'submitted',
    extracted_text TEXT
);

CREATE INDEX IF NOT EXISTS idx_journal_uploads_user_period ON journal_uploads (user_id, period_id);

-- Đợt mặc định (periodId=default) cho UI / upload; created_by NULL để không cần user admin tồn tại.
INSERT INTO journal_periods (period_id, title, description, starts_at, ends_at, class_id, created_by, created_at)
VALUES (
    'default',
    'Submission 1',
    '',
    now() - interval '1 day',
    now() + interval '30 days',
    NULL,
    NULL,
    now()
)
ON CONFLICT (period_id) DO NOTHING;
