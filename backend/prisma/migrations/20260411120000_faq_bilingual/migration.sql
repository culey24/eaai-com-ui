-- FAQ song ngữ: cột tiếng Việt (đổi tên từ question/answer/keywords) + cột tiếng Anh.

ALTER TABLE "faq_entries" RENAME COLUMN "question" TO "question_vi";
ALTER TABLE "faq_entries" RENAME COLUMN "answer" TO "answer_vi";
ALTER TABLE "faq_entries" RENAME COLUMN "keywords" TO "keywords_vi";

ALTER TABLE "faq_entries" ADD COLUMN "question_en" TEXT NOT NULL DEFAULT '';
ALTER TABLE "faq_entries" ADD COLUMN "answer_en" TEXT NOT NULL DEFAULT '';
ALTER TABLE "faq_entries" ADD COLUMN "keywords_en" JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Nội dung passage embedding thay đổi → embed lại
UPDATE "faq_entries" SET "embedding" = NULL, "embedding_model" = NULL WHERE "embedding" IS NOT NULL;
