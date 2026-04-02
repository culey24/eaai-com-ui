#!/bin/sh
# Không dùng set -e cho cả file: một lệnh prisma lỗi sẽ khiến exec node không bao giờ chạy → Railway không có log sau generate.
echo "[entrypoint] start"

# Railway / Docker: dán nguyên nội dung file service account JSON vào biến secret GCP_SERVICE_ACCOUNT_JSON.
# SDK chỉ đọc từ đường dẫn file → ghi ra /tmp trước khi chạy node.
if [ -n "$GCP_SERVICE_ACCOUNT_JSON" ]; then
  _gcp_key_path=/tmp/gcp-service-account.json
  echo "[entrypoint] GCP_SERVICE_ACCOUNT_JSON set — write ${_gcp_key_path}"
  printf '%s' "$GCP_SERVICE_ACCOUNT_JSON" > "$_gcp_key_path"
  chmod 600 "$_gcp_key_path" 2>/dev/null || true
  export GOOGLE_APPLICATION_CREDENTIALS="$_gcp_key_path"
fi

if [ "$SKIP_DB_MIGRATE" = "1" ]; then
  echo "[entrypoint] SKIP_DB_MIGRATE=1 — bỏ qua migrate"
else
  echo "[entrypoint] prisma db execute (bỏ qua lỗi)"
  npx prisma db execute --schema prisma/schema.prisma \
    --file prisma/migrations/20250326120000_prisma_orm_timestamps/migration.sql || true
  npx prisma migrate resolve --applied 20250326120000_prisma_orm_timestamps 2>/dev/null || true
  # Railway: migration journal có thể failed (P3009) khi chưa có bảng journal_uploads — bỏ cờ failed để deploy chạy lại SQL đã sửa.
  echo "[entrypoint] prisma migrate resolve rolled-back journal_extracted_text (bỏ qua lỗi)"
  npx prisma migrate resolve --rolled-back 20260325180000_journal_extracted_text 2>/dev/null || true
  echo "[entrypoint] prisma migrate deploy (bỏ qua lỗi)"
  npx prisma migrate deploy || echo "[entrypoint] migrate deploy thất bại — vẫn chạy app; kiểm tra DATABASE_URL"
fi

echo "[entrypoint] launching: node src/index.js"
exec node src/index.js
