#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/root/stochstack-site}"
LOG_FILE="${LOG_FILE:-/var/log/stochstack_market_refresh.log}"

LEGACY_DIR="$PROJECT_DIR/legacy/MarketIntelligenceForHighscore"
FETCH_SCRIPT="$LEGACY_DIR/scripts/fetch_news.py"
LEGACY_DATA_DIR="$LEGACY_DIR/data"
TARGET_DATA_DIR="$PROJECT_DIR/src/content/market-intelligence"

mkdir -p "$(dirname "$LOG_FILE")"

{
  echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] start refresh"

  if [ ! -f "$FETCH_SCRIPT" ]; then
    echo "[ERROR] fetch script not found: $FETCH_SCRIPT"
    exit 1
  fi

  cd "$PROJECT_DIR"

  echo "[INFO] fetching latest signals via RSS..."
  /usr/bin/python3 "$FETCH_SCRIPT" \
    --timeout 10 \
    --providers google,bing \
    --limit-per-topic 2

  echo "[INFO] syncing generated data into site content..."
  mkdir -p "$TARGET_DATA_DIR"
  cp "$LEGACY_DATA_DIR/projects.json" "$TARGET_DATA_DIR/projects.json"
  cp "$LEGACY_DATA_DIR/latest_signals.json" "$TARGET_DATA_DIR/signals.json"
  cp "$LEGACY_DATA_DIR/daily_digest.json" "$TARGET_DATA_DIR/digest.json"

  echo "[INFO] rebuilding and restarting site containers..."
  docker compose up -d --build

  echo "[OK] refresh completed"
} >> "$LOG_FILE" 2>&1
