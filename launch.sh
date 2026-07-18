#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
OS_FILE="$DIR/os/index.html"

# Try Chrome/Chromium app mode (no browser chrome — feels like a real app)
if command -v chromium &>/dev/null; then
    chromium --app="file://$OS_FILE" --window-size=1280,720 &
elif command -v google-chrome &>/dev/null; then
    google-chrome --app="file://$OS_FILE" --window-size=1280,720 &
elif command -v google-chrome-stable &>/dev/null; then
    google-chrome-stable --app="file://$OS_FILE" --window-size=1280,720 &
elif command -v microsoft-edge &>/dev/null; then
    microsoft-edge --app="file://$OS_FILE" --window-size=1280,720 &
elif command -v firefox &>/dev/null; then
    firefox --new-window "file://$OS_FILE" &
else
    xdg-open "file://$OS_FILE" &
fi

# Start the backend server
sleep 2
cd "$DIR/server" && python3 main.py &
