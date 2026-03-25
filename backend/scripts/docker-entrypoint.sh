#!/bin/sh
# Không dùng set -e cho cả file: một lệnh prisma lỗi sẽ khiến exec node không bao giờ chạy → Railway không có log sau generate.
echo "[entrypoint] start"

if [ "$SKIP_DB_MIGRATE" = "1" ]; then
  echo "[entrypoint] SKIP_DB_MIGRATE=1 — bỏ qua migrate"
else
  echo "[entrypoint] prisma db execute (bỏ qua lỗi)"
  npx prisma db execute --schema prisma/schema.prisma \
    --file prisma/migrations/20250326120000_prisma_orm_timestamps/migration.sql || true
  npx prisma migrate resolve --applied 20250326120000_prisma_orm_timestamps 2>/dev/null || true
  echo "[entrypoint] prisma migrate deploy (bỏ qua lỗi)"
  npx prisma migrate deploy || echo "[entrypoint] migrate deploy thất bại — vẫn chạy app; kiểm tra DATABASE_URL"
fi

echo "[entrypoint] launching: node src/index.js"
exec node src/index.js
