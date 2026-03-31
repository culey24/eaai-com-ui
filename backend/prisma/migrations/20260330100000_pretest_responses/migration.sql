CREATE TABLE IF NOT EXISTS pretest_responses (
  pretest_id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(10) NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  section_a JSONB NOT NULL DEFAULT '{}',
  section_b JSONB NOT NULL DEFAULT '{}',
  section_c JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pretest_responses_user_id ON pretest_responses(user_id);
