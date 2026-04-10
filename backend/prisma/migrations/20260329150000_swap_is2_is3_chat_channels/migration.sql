-- Đích: human-chat = IS-3 (Gemini), internal-chat = IS-2 (supporter). DB cũ có thể đang ngược.
-- Idempotent nếu đã đúng mapping.
-- Cần tạm DROP UNIQUE (user_class): trong lúc UPDATE, hai dòng có thể cùng chiếm một giá trị enum
-- tạm thời nếu engine kiểm tra từng dòng (lỗi 23505 duplicate key (user_class)=(IS-3)).

ALTER TABLE "chat_channels" DROP CONSTRAINT IF EXISTS "chat_channels_user_class_key";

UPDATE "chat_channels" SET "user_class" = CASE "channel_id"
  WHEN 'human-chat' THEN 'IS-3'::user_class_enum
  WHEN 'internal-chat' THEN 'IS-2'::user_class_enum
  ELSE "user_class"
END
WHERE "channel_id" IN ('human-chat', 'internal-chat');

ALTER TABLE "chat_channels" ADD CONSTRAINT "chat_channels_user_class_key" UNIQUE ("user_class");
