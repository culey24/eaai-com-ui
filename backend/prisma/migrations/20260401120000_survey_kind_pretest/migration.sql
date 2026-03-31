-- Mở rộng pretest_responses: nhiều loại khảo sát / học viên (PRETEST, sau này POSTTEST).

ALTER TABLE pretest_responses ADD COLUMN IF NOT EXISTS survey_kind VARCHAR(32) NOT NULL DEFAULT 'PRETEST';

-- Bỏ unique cũ chỉ trên user_id (tên constraint có thể khác tùy bản Prisma cũ)
ALTER TABLE pretest_responses DROP CONSTRAINT IF EXISTS pretest_responses_user_id_key;

ALTER TABLE pretest_responses DROP CONSTRAINT IF EXISTS "PretestResponse_userId_key";

CREATE UNIQUE INDEX IF NOT EXISTS pretest_responses_user_id_survey_kind_key ON pretest_responses(user_id, survey_kind);
