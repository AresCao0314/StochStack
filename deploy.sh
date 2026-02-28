#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-$HOME/stochstack-site}"
BRANCH="${BRANCH:-main}"

if [ ! -d "$PROJECT_DIR/.git" ]; then
  echo "[ERROR] PROJECT_DIR is not a git repo: $PROJECT_DIR"
  exit 1
fi

cd "$PROJECT_DIR"

echo "[INFO] Pull latest code from branch: $BRANCH"
git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "[INFO] Rebuild and restart containers"
docker compose up -d --build

echo "[INFO] Done. Current containers:"
docker compose ps
