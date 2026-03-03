#!/bin/sh
set -eu

DB_URL="${DATABASE_URL:-file:/data/protocol-workflow.db}"
DB_PATH="${DB_URL#file:}"

mkdir -p "$(dirname "$DB_PATH")"

echo "[init-db] using DATABASE_URL=$DB_URL"

table_exists="$(sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' AND name='Study';" || true)"

if [ "$table_exists" != "Study" ]; then
  echo "[init-db] applying schema migration"
  sqlite3 "$DB_PATH" < /app/prisma/migrations/20260302120000_init/migration.sql
fi

study_count="$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM Study;" 2>/dev/null || echo 0)"

if [ "$study_count" = "0" ]; then
  echo "[init-db] seeding demo data"
  node /app/scripts/seed.js
else
  echo "[init-db] existing Study rows=$study_count, skip seed"
fi
