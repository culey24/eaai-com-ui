-- Kênh chat mặc định; phạm vi supporter; journal period mẫu; settings mặc định.

INSERT INTO chat_channels (channel_id, user_class, display_order) VALUES
('ai-chat', 'IS-1', 1),
('human-chat', 'IS-3', 2),
('internal-chat', 'IS-2', 3);

INSERT INTO assistant_managed_classes (supporter_id, user_class) VALUES
('T24002', 'IS-1'),
('T24002', 'IS-2'),
('T24003', 'IS-2'),
('T24003', 'IS-3');

INSERT INTO journal_periods (period_id, title, description, starts_at, ends_at, class_id, created_by, created_at)
VALUES (
    'default',
    'Submission 1',
    '',
    now() - interval '1 day',
    now() + interval '30 days',
    NULL,
    'A00001',
    now()
);

INSERT INTO app_settings (setting_key, value) VALUES
('auto_mode', to_jsonb(false)),
('deadlines', '{"default": {"label": "Deadline 1", "dueDate": null}}'::jsonb);

-- Cập nhật dueDate mẫu = now + 7 ngày (epoch ms như mock frontend — backend có thể đọc ISO hoặc số).
UPDATE app_settings
SET value = jsonb_set(
    value,
    '{default,dueDate}',
    to_jsonb((extract(epoch from now() + interval '7 days') * 1000)::bigint),
    true
)
WHERE setting_key = 'deadlines';
