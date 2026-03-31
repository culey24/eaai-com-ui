-- Vai trò supporter do admin gán: support (cùng nhóm quyền hội thoại với assistant legacy).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role_enum' AND e.enumlabel = 'support'
  ) THEN
    ALTER TYPE user_role_enum ADD VALUE 'support';
  END IF;
END $$;
