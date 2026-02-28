#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/opt/highscore/HighscoreMarketIntelligence"
LOG_FILE="/var/log/highscore_update.log"

cd "$PROJECT_DIR"
/usr/bin/python3 scripts/fetch_news.py --timeout 10 --providers google,bing --verbose >> "$LOG_FILE" 2>&1
