-- Tạo hoặc cập nhật tài khoản admin (đăng nhập API: username / mật khẩu plain text).
-- Lưu ý: file này KHÔNG chạy tự động lúc Docker/Railway deploy (entrypoint chỉ migrate).
-- Tự động khi deploy: đặt ENSURE_DEFAULT_ADMIN=1 + ADMIN_BOOTSTRAP_PASSWORD trên backend (xem .env.example).
-- Chạy tay: Railway → Postgres → Query, hoặc: psql $DATABASE_URL -f init/ensure_admin_user.sql
--
-- Đăng nhập sau khi chạy (khớp .env bootstrap nếu dùng cùng cặp):
--   username: admin2452141
--   password: papereaai123
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
    'admin2452141',
    crypt('papereaai123', gen_salt('bf')),
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
