-- Hoán đổi user_class giữa human-chat và internal-chat (mã lớp IS-2/IS-3 đã đảo vai trò).
-- Chạy một lần, idempotent nếu DB đã ở trạng thái mới.
UPDATE chat_channels SET user_class = CASE channel_id
  WHEN 'human-chat' THEN 'IS-3'::user_class_enum
  WHEN 'internal-chat' THEN 'IS-2'::user_class_enum
  ELSE user_class
END
WHERE channel_id IN ('human-chat', 'internal-chat');
