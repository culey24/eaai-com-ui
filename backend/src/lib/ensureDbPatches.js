/**
 * Bản vá schema nhẹ, idempotent — volume Postgres cũ có thể thiếu cột thêm sau này
 * (init SQL gốc không có; migration Prisma chưa chạy trên môi trường đó).
 */
const USER_PROFILE_ALTER = [
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS student_school_id VARCHAR(32)',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS faculty VARCHAR(200)',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS major_display VARCHAR(200)',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS subject_note VARCHAR(255)',
]

const MESSAGES_FILE_STORAGE_KEY = `
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'messages'
  ) THEN
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_storage_key VARCHAR(512);
  END IF;
END $$;
`

const JOURNAL_EXTRACTED_TEXT_PATCH = `
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'journal_uploads'
  ) THEN
    ALTER TABLE journal_uploads ADD COLUMN IF NOT EXISTS extracted_text TEXT;
  END IF;
END $$;
`

/**
 * Railway / DB chỉ chạy prisma migrate: thường thiếu seed từ backend/init → POST /api/messages 400 "Kênh không tồn tại".
 */
const CHAT_CHANNELS_SEED = `
INSERT INTO chat_channels (channel_id, user_class, display_order) VALUES
  ('ai-chat', 'IS-1', 1),
  ('human-chat', 'IS-3', 2),
  ('internal-chat', 'IS-2', 3)
ON CONFLICT (channel_id) DO NOTHING
`

/** Admin «direct agent test» — enum ADMIN_TEST + hàng test-agent (DB cũ / migrate từng phần). */
const TEST_AGENT_ENUM_ADMIN_TEST = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_class_enum' AND e.enumlabel = 'ADMIN_TEST'
  ) THEN
    ALTER TYPE "user_class_enum" ADD VALUE 'ADMIN_TEST';
  END IF;
END $$
`
const TEST_AGENT_CHANNEL_ROW = `
INSERT INTO chat_channels (channel_id, user_class, display_order)
VALUES ('test-agent', 'ADMIN_TEST', 99)
ON CONFLICT (channel_id) DO NOTHING
`

/** Mỗi chuỗi một lệnh — Prisma/Postgres không cho nhiều lệnh trong một prepared statement. */
const PRETEST_RESPONSES_TABLE = `
CREATE TABLE IF NOT EXISTS pretest_responses (
  pretest_id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(10) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  survey_kind VARCHAR(32) NOT NULL DEFAULT 'PRETEST',
  section_a JSONB NOT NULL DEFAULT '{}',
  section_b JSONB NOT NULL DEFAULT '{}',
  section_c JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
`

/** DB cũ từ patch trước (unique chỉ user_id): đồng bộ với migration survey_kind. */
const PRETEST_SURVEY_KIND_PATCHES = [
  `ALTER TABLE pretest_responses ADD COLUMN IF NOT EXISTS survey_kind VARCHAR(32) NOT NULL DEFAULT 'PRETEST'`,
  'ALTER TABLE pretest_responses DROP CONSTRAINT IF EXISTS pretest_responses_user_id_key',
  'ALTER TABLE pretest_responses DROP CONSTRAINT IF EXISTS "PretestResponse_userId_key"',
  'CREATE UNIQUE INDEX IF NOT EXISTS pretest_responses_user_id_survey_kind_key ON pretest_responses(user_id, survey_kind)',
]

const PRETEST_SURVEY_KIND_SECONDARY_INDEX =
  'CREATE INDEX IF NOT EXISTS idx_pretest_responses_survey_kind ON pretest_responses(survey_kind)'

export async function applyLightweightSchemaPatches(prisma) {
  try {
    await prisma.$executeRawUnsafe(CHAT_CHANNELS_SEED)
  } catch (err) {
    console.warn(
      '[db-patches] chat_channels seed:',
      err instanceof Error ? err.message : String(err)
    )
  }
  try {
    await prisma.$executeRawUnsafe(TEST_AGENT_ENUM_ADMIN_TEST)
  } catch (err) {
    console.warn(
      '[db-patches] user_class_enum ADMIN_TEST:',
      err instanceof Error ? err.message : String(err)
    )
  }
  try {
    await prisma.$executeRawUnsafe(TEST_AGENT_CHANNEL_ROW)
  } catch (err) {
    console.warn(
      '[db-patches] chat_channels test-agent:',
      err instanceof Error ? err.message : String(err)
    )
  }
  try {
    await prisma.$executeRawUnsafe(PRETEST_RESPONSES_TABLE)
  } catch (err) {
    console.warn(
      '[db-patches] pretest_responses create:',
      err instanceof Error ? err.message : String(err)
    )
  }
  for (const sql of PRETEST_SURVEY_KIND_PATCHES) {
    try {
      await prisma.$executeRawUnsafe(sql)
    } catch (err) {
      console.warn(
        '[db-patches] pretest_responses survey_kind:',
        err instanceof Error ? err.message : String(err)
      )
    }
  }
  try {
    await prisma.$executeRawUnsafe(PRETEST_SURVEY_KIND_SECONDARY_INDEX)
  } catch (err) {
    console.warn(
      '[db-patches] pretest_responses survey_kind index:',
      err instanceof Error ? err.message : String(err)
    )
  }
  try {
    await prisma.$executeRawUnsafe(MESSAGES_FILE_STORAGE_KEY)
  } catch (err) {
    console.warn(
      '[db-patches] messages.file_storage_key:',
      err instanceof Error ? err.message : String(err)
    )
  }
  try {
    await prisma.$executeRawUnsafe(JOURNAL_EXTRACTED_TEXT_PATCH)
  } catch (err) {
    console.warn(
      '[db-patches] journal_uploads.extracted_text:',
      err instanceof Error ? err.message : String(err)
    )
  }
  for (const sql of USER_PROFILE_ALTER) {
    try {
      await prisma.$executeRawUnsafe(sql)
    } catch (err) {
      console.warn('[db-patches] users profile cols:', err instanceof Error ? err.message : String(err))
    }
  }
  const STATS_ANALYTICS_EXCLUSIONS_TABLE = `
CREATE TABLE IF NOT EXISTS stats_analytics_exclusions (
    exclusion_id BIGSERIAL PRIMARY KEY,
    username_normalized VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by VARCHAR(10) REFERENCES users(user_id) ON DELETE SET NULL
)`
  try {
    await prisma.$executeRawUnsafe(STATS_ANALYTICS_EXCLUSIONS_TABLE)
  } catch (err) {
    console.warn(
      '[db-patches] stats_analytics_exclusions:',
      err instanceof Error ? err.message : String(err)
    )
  }
}
