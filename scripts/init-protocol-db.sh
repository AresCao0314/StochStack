#!/bin/sh
set -eu

DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@db:5432/stochstack?schema=public}"
SEED_ON_STARTUP="${SEED_ON_STARTUP:-true}"

echo "[init-db] using DATABASE_URL=${DB_URL}"

echo "[init-db] running prisma migrate deploy"
if ! npx prisma migrate deploy; then
  echo "[init-db] migrate deploy failed, fallback to prisma db push"
  npx prisma db push || true
fi

if [ "$SEED_ON_STARTUP" = "true" ]; then
  echo "[init-db] seeding demo data"
  if ! node /app/scripts/seed.js; then
    echo "[init-db] warning: seed failed, continue startup without demo seed data"
  fi
else
  echo "[init-db] skip seed because SEED_ON_STARTUP=${SEED_ON_STARTUP}"
fi
