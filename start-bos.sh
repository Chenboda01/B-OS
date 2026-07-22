#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_BIN="$PROJECT_DIR/server/.venv/bin/python"
STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/b-os"
FRONTEND_PORT="${BOS_FRONTEND_PORT:-8000}"
BACKEND_PORT="${BOS_BACKEND_PORT:-8765}"
FRONTEND_ORIGIN="http://127.0.0.1:$FRONTEND_PORT"
FRONTEND_URL="$FRONTEND_ORIGIN/os/index.html"
BACKEND_URL="http://127.0.0.1:$BACKEND_PORT"
BACKEND_PID=""
FRONTEND_PID=""

if [[ ! -x "$PYTHON_BIN" ]]; then
    PYTHON_BIN="python3"
fi

mkdir -p "$STATE_DIR"

shutdown() {
    local status="${1:-0}"
    trap - EXIT INT TERM
    for pid in "$BACKEND_PID" "$FRONTEND_PID"; do
        if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
    done
    for pid in "$BACKEND_PID" "$FRONTEND_PID"; do
        if [[ -n "$pid" ]]; then
            wait "$pid" 2>/dev/null || true
        fi
    done
    exit "$status"
}

trap 'shutdown $?' EXIT
trap 'shutdown 130' INT TERM

BOS_BACKEND_PORT="$BACKEND_PORT" BOS_FRONTEND_ORIGIN="$FRONTEND_ORIGIN" \
    "$PYTHON_BIN" "$PROJECT_DIR/server/main.py" >"$STATE_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
python3 -m http.server "$FRONTEND_PORT" --bind 127.0.0.1 --directory "$PROJECT_DIR" >"$STATE_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

for _ in {1..30}; do
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        printf 'B-OS backend failed to start. See %s\n' "$STATE_DIR/backend.log" >&2
        exit 1
    fi
    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        printf 'B-OS frontend failed to start. See %s\n' "$STATE_DIR/frontend.log" >&2
        exit 1
    fi
    if curl --silent --fail "$BACKEND_URL/api/health" >/dev/null 2>&1; then
        break
    fi
    sleep 0.1
done

if ! curl --silent --fail "$BACKEND_URL/api/health" >/dev/null 2>&1; then
    printf 'B-OS backend did not become healthy. See %s\n' "$STATE_DIR/backend.log" >&2
    exit 1
fi

printf 'B-OS started\nFrontend: %s\nBackend:  %s\n' "$FRONTEND_URL" "$BACKEND_URL"
printf 'Logs:     %s\nPress Ctrl+C to stop both services.\n' "$STATE_DIR"

if [[ "${BOS_NO_BROWSER:-0}" != "1" ]]; then
    if command -v chromium >/dev/null 2>&1; then
        chromium --app="$FRONTEND_URL" --window-size=1280,720 >/dev/null 2>&1 &
    elif command -v google-chrome >/dev/null 2>&1; then
        google-chrome --app="$FRONTEND_URL" --window-size=1280,720 >/dev/null 2>&1 &
    elif command -v google-chrome-stable >/dev/null 2>&1; then
        google-chrome-stable --app="$FRONTEND_URL" --window-size=1280,720 >/dev/null 2>&1 &
    elif command -v microsoft-edge >/dev/null 2>&1; then
        microsoft-edge --app="$FRONTEND_URL" --window-size=1280,720 >/dev/null 2>&1 &
    elif command -v firefox >/dev/null 2>&1; then
        firefox --new-window "$FRONTEND_URL" >/dev/null 2>&1 &
    else
        xdg-open "$FRONTEND_URL" >/dev/null 2>&1 &
    fi
fi

wait -n "$BACKEND_PID" "$FRONTEND_PID"
