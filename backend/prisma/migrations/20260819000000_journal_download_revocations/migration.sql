-- Thu hồi link tải shared của file journal (download_key = journal:{learnerId}:{uploadId})
CREATE TABLE IF NOT EXISTS journal_download_revocations (
    revocation_id BIGSERIAL PRIMARY KEY,
    download_key VARCHAR(200) NOT NULL UNIQUE,
    reason VARCHAR(500) NOT NULL DEFAULT '',
    revoked_by VARCHAR(10) REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journal_download_revocations_key
    ON journal_download_revocations (download_key);