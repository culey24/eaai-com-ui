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

/** Mỗi chuỗi một lệnh — Prisma/Postgres không cho nhiều lệnh trong một prepared statement. */
const PRETEST_RESPONSES_TABLE = `
CREATE TABLE IF NOT EXISTS pretest_responses (
  pretest_id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(10) NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  section_a JSONB NOT NULL DEFAULT '{}',
  section_b JSONB NOT NULL DEFAULT '{}',
  section_c JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
`

const PRETEST_RESPONSES_INDEX =
  'CREATE INDEX IF NOT EXISTS idx_pretest_responses_user_id ON pretest_responses(user_id)'

export async function applyLightweightSchemaPatches(prisma) {
  try {
    await prisma.$executeRawUnsafe(PRETEST_RESPONSES_TABLE)
    await prisma.$executeRawUnsafe(PRETEST_RESPONSES_INDEX)
  } catch (err) {
    console.warn(
      '[db-patches] pretest_responses:',
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
}
