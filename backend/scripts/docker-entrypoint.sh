#!/bin/sh
set -e
# DB đã có schema từ init SQL: áp dụng ALTER idempotent + baseline migration (bỏ qua lỗi nếu đã làm).
npx prisma db execute --schema prisma/schema.prisma \
  --file prisma/migrations/20250326120000_prisma_orm_timestamps/migration.sql
npx prisma migrate resolve --applied 20250326120000_prisma_orm_timestamps 2>/dev/null || true
npx prisma migrate deploy
exec node src/index.js
