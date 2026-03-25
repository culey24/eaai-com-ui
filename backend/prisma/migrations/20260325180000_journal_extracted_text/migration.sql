-- Nội dung văn bản trích từ file journal (txt/md/pdf/docx) để đưa vào prompt AI.
ALTER TABLE journal_uploads ADD COLUMN IF NOT EXISTS extracted_text TEXT;
