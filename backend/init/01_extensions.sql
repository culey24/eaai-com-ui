-- Mật khẩu demo: dùng crypt() / gen_salt('bf') (bcrypt) — so khớp với pgcrypto.verify() hoặc app backend.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
