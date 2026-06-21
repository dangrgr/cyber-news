#!/usr/bin/env bash
set -euo pipefail

stage="${1:-}"
if [[ "$stage" != "ingest" && "$stage" != "process" && "$stage" != "backup" ]]; then
  echo "usage: $0 ingest|process|backup" >&2
  exit 64
fi

APP_HOME="${CYBER_NEWS_APP_HOME:-/home/dan/apps/cyber-news}"
REPO="${CYBER_NEWS_REPO:-/home/dan/github/cyber-news}"
ENV_FILE="${CYBER_NEWS_ENV_FILE:-$APP_HOME/etc/cyber-news.env}"
LOCK_FILE="$APP_HOME/locks/pipeline.lock"
WRAPPER_LOG_DIR="$APP_HOME/logs/wrapper"

mkdir -p "$APP_HOME" "$APP_HOME/etc" "$APP_HOME/state" "$APP_HOME/logs" "$APP_HOME/locks" "$APP_HOME/backups" "$APP_HOME/run" "$WRAPPER_LOG_DIR"
chmod 700 "$APP_HOME" "$APP_HOME/etc" "$APP_HOME/state" "$APP_HOME/logs" "$APP_HOME/locks" "$APP_HOME/backups" "$APP_HOME/run" "$WRAPPER_LOG_DIR"

if [[ -f "$ENV_FILE" ]]; then
  # Export app-local env-file assignments so npm/node children see them.
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

export CYBER_NEWS_APP_HOME="$APP_HOME"
export TURSO_DATABASE_URL="${TURSO_DATABASE_URL:-file:$APP_HOME/state/cyber-news.db}"
export TURSO_AUTH_TOKEN="${TURSO_AUTH_TOKEN:-}"
export RUN_LOG_DIR="${RUN_LOG_DIR:-$APP_HOME/logs}"
export NODE_ENV="${NODE_ENV:-production}"

if [[ "$stage" == "process" ]]; then
  export LLM_AUTH_MODE="${LLM_AUTH_MODE:-oauth}"
  if [[ "$LLM_AUTH_MODE" == "oauth" ]]; then
    if [[ -n "${ANTHROPIC_API_KEY:-}" ]]; then
      echo "ANTHROPIC_API_KEY must be unset for local oauth process runtime" >&2
      exit 78
    fi
    if [[ -z "${ANTHROPIC_AUTH_TOKEN:-}" && -z "${CLAUDE_CONFIG_DIR:-}" ]]; then
      echo "ANTHROPIC_AUTH_TOKEN or CLAUDE_CONFIG_DIR is required for local oauth process runtime" >&2
      exit 78
    fi
  fi
fi

if [[ ! -d "$REPO" ]]; then
  echo "cyber-news repo not found: $REPO" >&2
  exit 72
fi

log_file="$WRAPPER_LOG_DIR/${stage}-$(date -u +%Y%m%dT%H%M%SZ).log"

claude_token_needs_refresh() {
  python3 - "$CLAUDE_CONFIG_DIR" <<'PY'
import json
import sys
import time
from pathlib import Path

config_dir = Path(sys.argv[1])
credentials = config_dir / ".credentials.json"
try:
    oauth = json.loads(credentials.read_text(encoding="utf-8")).get("claudeAiOauth") or {}
except Exception:
    raise SystemExit(0)

access_token = oauth.get("accessToken")
expires_at = oauth.get("expiresAt")
if not access_token or not isinstance(expires_at, (int, float)):
    raise SystemExit(0)

refresh_buffer_ms = 10 * 60 * 1000
now_ms = int(time.time() * 1000)
raise SystemExit(0 if expires_at <= now_ms + refresh_buffer_ms else 1)
PY
}

refresh_claude_oauth_if_needed() {
  if [[ -n "${ANTHROPIC_AUTH_TOKEN:-}" || -z "${CLAUDE_CONFIG_DIR:-}" ]]; then
    return 0
  fi
  if ! command -v claude >/dev/null 2>&1; then
    return 0
  fi
  if claude_token_needs_refresh; then
    printf '%s refreshing Claude Code OAuth token before local process runtime\n' "$(date -Is)"
    printf 'Return OK only.\n' | timeout "${CLAUDE_OAUTH_REFRESH_TIMEOUT_SECONDS:-120}" \
      claude -p --max-turns 1 \
      --disallowedTools Read,Grep,Glob,LS,Bash,Edit,Write,MultiEdit,Task,WebFetch,WebSearch \
      >/dev/null
  fi
}

if [[ "$stage" == "process" && "${LLM_AUTH_MODE:-}" == "oauth" ]]; then
  refresh_claude_oauth_if_needed
fi

(
  # Overlap is a healthy no-op for Hermes no-agent crons; the next tick retries.
  flock -n 9 || exit 0
  cd "$REPO"
  case "$stage" in
    ingest)
      npm run migrate
      npm run ingest
      ;;
    process)
      npm run migrate
      npm run process
      ;;
    backup)
      npm run local:backup
      ;;
  esac
) 9>"$LOCK_FILE" >"$log_file" 2>&1 || {
  rc=$?
  echo "cyber-news local $stage failed with exit $rc; log: $log_file" >&2
  tail -n 80 "$log_file" >&2 || true
  exit "$rc"
}

# Silent success for Hermes no_agent cron watchdog pattern.
