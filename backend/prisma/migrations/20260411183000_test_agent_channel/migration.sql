-- Kênh admin thử AGENT (không gắn học viên): test-agent ↔ user_class ADMIN_TEST

ALTER TYPE "user_class_enum" ADD VALUE 'ADMIN_TEST';

INSERT INTO "chat_channels" ("channel_id", "user_class", "display_order")
VALUES ('test-agent', 'ADMIN_TEST', 99)
ON CONFLICT ("channel_id") DO NOTHING;
