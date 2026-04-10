-- pgvector: lưu embedding FAQ (OpenRouter 1536 chiều) để truy vấn nhanh bằng cosine distance.

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "faq_entries" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);
ALTER TABLE "faq_entries" ADD COLUMN IF NOT EXISTS "embedding_model" VARCHAR(128);

-- Tuỳ chọn (khi đã có nhiều FAQ): CREATE INDEX ON faq_entries USING hnsw (embedding vector_cosine_ops);

COMMENT ON COLUMN "faq_entries"."embedding" IS 'OpenRouter embedding (1536), model trong embedding_model';
COMMENT ON COLUMN "faq_entries"."embedding_model" IS 'Ví dụ openai/text-embedding-3-small';
