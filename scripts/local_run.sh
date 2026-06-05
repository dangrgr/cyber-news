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
  # shellcheck disable=SC1090
  source "$ENV_FILE"
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
    if [[ -z "${ANTHROPIC_AUTH_TOKEN:-}" ]]; then
      echo "ANTHROPIC_AUTH_TOKEN is required for local oauth process runtime" >&2
      exit 78
    fi
  fi
fi

if [[ ! -d "$REPO" ]]; then
  echo "cyber-news repo not found: $REPO" >&2
  exit 72
fi

log_file="$WRAPPER_LOG_DIR/${stage}-$(date -u +%Y%m%dT%H%M%SZ).log"

(
  flock -n 9 || { echo "another cyber-news local pipeline is already running" >&2; exit 75; }
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
