#!/bin/bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
OS_URL="http://127.0.0.1:8000/index.html"
PYTHON_BIN="$DIR/server/.venv/bin/python"
STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/b-os"

if [ ! -x "$PYTHON_BIN" ]; then
    PYTHON_BIN="python3"
fi

# Serve B-OS from an allowed local origin and start the loopback backend.
mkdir -p "$STATE_DIR"
"$PYTHON_BIN" "$DIR/server/main.py" >"$STATE_DIR/backend.log" 2>&1 &
python3 -m http.server 8000 --bind 127.0.0.1 --directory "$DIR/os" >"$STATE_DIR/static.log" 2>&1 &
sleep 2

# Try Chrome/Chromium app mode (no browser chrome — feels like a real app)
if command -v chromium &>/dev/null; then
    chromium --app="$OS_URL" --window-size=1280,720 &
elif command -v google-chrome &>/dev/null; then
    google-chrome --app="$OS_URL" --window-size=1280,720 &
elif command -v google-chrome-stable &>/dev/null; then
    google-chrome-stable --app="$OS_URL" --window-size=1280,720 &
elif command -v microsoft-edge &>/dev/null; then
    microsoft-edge --app="$OS_URL" --window-size=1280,720 &
elif command -v firefox &>/dev/null; then
    firefox --new-window "$OS_URL" &
else
    xdg-open "$OS_URL" &
fi
