-- Tạo hoặc cập nhật tài khoản admin (đăng nhập API: username / mật khẩu plain text).
-- Chạy trong Railway → Postgres → Query, hoặc: psql $DATABASE_URL -f init/ensure_admin_user.sql
--
-- Đăng nhập sau khi chạy:
--   username: admin
--   password: admin123
-- (Đổi mật khẩu: sửa chuỗi trong crypt('...') bên dưới rồi chạy lại.)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO Users (
    user_id,
    username,
    pwd,
    fullname,
    user_role,
    date_of_birth,
    gender,
    major,
    training_program_type,
    citizen_identification,
    date_of_issue,
    place_of_issue,
    ethnicity,
    religion,
    permanent_address,
    contact_address,
    phone_number,
    email,
    user_class
) VALUES (
    'A00001',
    'admin',
    crypt('admin123', gen_salt('bf')),
    'Quản trị hệ thống',
    'admin',
    '1990-01-01',
    'Other',
    '0000000',
    'Chính quy',
    '009000000001',
    '2015-01-01',
    'TP.HCM',
    'Kinh',
    'Không',
    'HCMUT',
    'HCMUT',
    '0900000001',
    'admin@example.local',
    NULL
)
ON CONFLICT (username) DO UPDATE SET
    pwd = EXCLUDED.pwd,
    fullname = EXCLUDED.fullname,
    user_role = 'admin'::user_role_enum;
