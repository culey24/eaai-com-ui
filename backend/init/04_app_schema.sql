-- Bảng ứng dụng chatbot / admin — bổ sung cho frontend/ (AuthContext, useMessages, Journal, Admin).

CREATE TYPE message_sender_enum AS ENUM ('user', 'assistant', 'system');
CREATE TYPE report_status_enum AS ENUM ('open', 'reviewed', 'dismissed');
CREATE TYPE support_request_status_enum AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE teaching_mode_enum AS ENUM ('AGENT', 'LLM', 'MANUAL');

-- Phạm vi lớp chat (IS-*) mà supporter/assistant được xem — tương ứng managedClasses trong UI.
CREATE TABLE assistant_managed_classes (
    id SERIAL PRIMARY KEY,
    supporter_id VARCHAR(10) NOT NULL,
    user_class user_class_enum NOT NULL,
    CONSTRAINT fk_amc_supporter FOREIGN KEY (supporter_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT uq_amc_supporter_class UNIQUE (supporter_id, user_class)
);

-- Kênh chat cố định theo lớp (CLASS_TO_CHANNEL).
CREATE TABLE chat_channels (
    channel_id VARCHAR(64) PRIMARY KEY,
    user_class user_class_enum NOT NULL UNIQUE,
    display_order INT NOT NULL DEFAULT 0
);

CREATE TABLE conversations (
    conversation_id BIGSERIAL PRIMARY KEY,
    channel_id VARCHAR(64) NOT NULL REFERENCES chat_channels(channel_id) ON DELETE CASCADE,
    learner_id VARCHAR(10) NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_conversations_channel_learner UNIQUE (channel_id, learner_id)
);

CREATE TABLE messages (
    message_id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    sender_role message_sender_enum NOT NULL,
    sender_user_id VARCHAR(10) REFERENCES Users(user_id) ON DELETE SET NULL,
    content TEXT NOT NULL DEFAULT '',
    file_name VARCHAR(512),
    file_storage_key VARCHAR(512),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation_created ON messages (conversation_id, created_at);

CREATE TABLE content_reports (
    report_id BIGSERIAL PRIMARY KEY,
    reporter_id VARCHAR(10) NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    channel_id VARCHAR(64) REFERENCES chat_channels(channel_id) ON DELETE SET NULL,
    message_id BIGINT REFERENCES messages(message_id) ON DELETE SET NULL,
    report_type VARCHAR(64) NOT NULL,
    detail TEXT,
    status report_status_enum NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Đợt nộp journal (submission windows trong JournalContext).
CREATE TABLE journal_periods (
    period_id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    class_id VARCHAR(50) REFERENCES Classes(class_id) ON DELETE SET NULL,
    created_by VARCHAR(10) REFERENCES Users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE journal_uploads (
    upload_id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(10) NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    period_id VARCHAR(64) NOT NULL REFERENCES journal_periods(period_id) ON DELETE CASCADE,
    storage_key VARCHAR(512) NOT NULL,
    original_file_name VARCHAR(512),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status VARCHAR(32) NOT NULL DEFAULT 'submitted',
    extracted_text TEXT
);

CREATE INDEX idx_journal_uploads_user_period ON journal_uploads (user_id, period_id);

-- Phân công supporter ↔ learner (AdminContext.assignments).
CREATE TABLE learner_supporter_assignments (
    learner_id VARCHAR(10) PRIMARY KEY REFERENCES Users(user_id) ON DELETE CASCADE,
    supporter_id VARCHAR(10) NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    teaching_mode teaching_mode_enum NOT NULL DEFAULT 'MANUAL',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE support_requests (
    request_id BIGSERIAL PRIMARY KEY,
    supporter_id VARCHAR(10) NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    learner_id VARCHAR(10) NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    class_code user_class_enum NOT NULL,
    status support_request_status_enum NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_support_requests_status ON support_requests (status, created_at);

-- Cấu hình key–value (auto_mode, deadlines, …).
CREATE TABLE app_settings (
    setting_key VARCHAR(128) PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tích hợp agentic_assistant / chatbot (route root, song song /api).
CREATE TYPE agent_session_status_enum AS ENUM ('active', 'deactive');
CREATE TYPE agent_chat_role_enum AS ENUM ('user', 'model', 'TA');

CREATE TABLE agent_sessions (
    session_id UUID PRIMARY KEY,
    user_id VARCHAR(10) NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    session_status agent_session_status_enum NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_sessions_user ON agent_sessions (user_id);

CREATE TABLE agent_session_messages (
    message_id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES agent_sessions(session_id) ON DELETE CASCADE,
    chat_role agent_chat_role_enum NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    file_ids JSONB,
    dynamic_profile TEXT,
    tokens_count INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_session_messages_session_created ON agent_session_messages (session_id, created_at);
