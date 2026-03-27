-- Nội dung văn bản trích từ file journal (txt/md/pdf/docx).
-- An toàn nếu DB chưa có bảng journal_uploads (Prisma-only, không chạy init SQL).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'journal_uploads'
  ) THEN
    ALTER TABLE journal_uploads ADD COLUMN IF NOT EXISTS extracted_text TEXT;
  END IF;
END $$;
