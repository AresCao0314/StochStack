#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/root/stochstack-site}"
LOG_FILE="${LOG_FILE:-/var/log/stochstack_market_refresh.log}"

LEGACY_DIR="$PROJECT_DIR/legacy/MarketIntelligenceForHighscore"
FETCH_SCRIPT="$LEGACY_DIR/scripts/fetch_news.py"
CTGOV_SYNC_SCRIPT="$PROJECT_DIR/scripts/fetch_ctgov_site_feasibility.py"
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

  echo "[INFO] syncing ClinicalTrials.gov site feasibility data..."
  if [ -f "$CTGOV_SYNC_SCRIPT" ]; then
    /usr/bin/python3 "$CTGOV_SYNC_SCRIPT" --page-size 100 --max-pages 4 --limit-per-profile 220 --timeout 20 || \
      echo "[WARN] ctgov sync failed, keep previous site-feasibility dataset."
  else
    echo "[WARN] ctgov sync script not found: $CTGOV_SYNC_SCRIPT"
  fi

  echo "[INFO] rebuilding and restarting site containers..."
  docker compose up -d --build

  echo "[OK] refresh completed"
} >> "$LOG_FILE" 2>&1
