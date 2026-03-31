-- Đích: human-chat = IS-3 (Gemini), internal-chat = IS-2 (supporter). DB cũ có thể đang ngược.
-- Idempotent nếu đã đúng mapping.
UPDATE chat_channels SET user_class = CASE channel_id
  WHEN 'human-chat' THEN 'IS-3'::user_class_enum
  WHEN 'internal-chat' THEN 'IS-2'::user_class_enum
  ELSE user_class
END
WHERE channel_id IN ('human-chat', 'internal-chat');
