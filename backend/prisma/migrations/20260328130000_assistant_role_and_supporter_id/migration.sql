-- Đổi teacher → assistant (enum) và teacher_id → supporter_id / assistant_id (cột).
-- An toàn khi DB mới đã tạo bằng init SQL mới (bỏ qua bước không áp dụng).

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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'assistant_managed_classes' AND column_name = 'teacher_id'
  ) THEN
    ALTER TABLE assistant_managed_classes RENAME COLUMN teacher_id TO supporter_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_amc_teacher') THEN
    ALTER TABLE assistant_managed_classes RENAME CONSTRAINT fk_amc_teacher TO fk_amc_supporter;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_amc_teacher_class') THEN
    ALTER TABLE assistant_managed_classes RENAME CONSTRAINT uq_amc_teacher_class TO uq_amc_supporter_class;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'class_teachers' AND column_name = 'teacher_id'
  ) THEN
    ALTER TABLE class_teachers RENAME COLUMN teacher_id TO assistant_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ct_teacher') THEN
    ALTER TABLE class_teachers RENAME CONSTRAINT fk_ct_teacher TO fk_ct_assistant;
  END IF;
END $$;
