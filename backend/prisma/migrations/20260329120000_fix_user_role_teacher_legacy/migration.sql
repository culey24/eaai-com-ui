-- DB cũ còn nhãn enum 'teacher' trong khi Prisma chỉ nhận 'assistant'.
-- Idempotent: bỏ qua nếu đã không còn 'teacher'.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role_enum' AND e.enumlabel = 'teacher'
  ) THEN
    ALTER TYPE user_role_enum RENAME VALUE 'teacher' TO 'assistant';
  END IF;
END $$;
