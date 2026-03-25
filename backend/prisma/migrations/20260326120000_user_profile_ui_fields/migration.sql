-- Hồ sơ learner bổ sung (Cài đặt UI) — bảng thực tế: users
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_school_id VARCHAR(32);
ALTER TABLE users ADD COLUMN IF NOT EXISTS faculty VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS major_display VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subject_note VARCHAR(255);
