-- Chatbot/agent integration (parallel to /api): sessions + per-session messages.
CREATE TYPE agent_session_status_enum AS ENUM ('active', 'deactive');
CREATE TYPE agent_chat_role_enum AS ENUM ('user', 'model', 'TA');

CREATE TABLE agent_sessions (
    session_id UUID PRIMARY KEY,
    user_id VARCHAR(10) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
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
