#!/bin/bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
echo "╔══════════════════════════════════════════╗"
echo "║        B-OS Installation                 ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Make launch script executable
chmod +x "$DIR/launch.sh"
echo "✓ Launch script ready"

# Install desktop entry
mkdir -p ~/.local/share/applications
cp "$DIR/b-os.desktop" ~/.local/share/applications/b-os.desktop
echo "✓ Desktop entry installed (find B-OS in your app launcher)"

# Install Python dependencies
echo ""
echo "Creating an isolated Python environment..."
python3 -m venv "$DIR/server/.venv"
"$DIR/server/.venv/bin/python" -m pip install -r "$DIR/server/requirements.txt"
echo "✓ Python dependencies installed"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  B-OS installed successfully!            ║"
echo "║                                          ║"
echo "║  Launch from app menu or run:            ║"
echo "║  $DIR/launch.sh                          ║"
echo "║                                          ║"
echo "║  For AI Chat:                            ║"
echo "║  export QWEN_API_KEY=your_key            ║"
echo "║  (Get a free key at:                     ║"
echo "║   dashscope.console.aliyun.com)          ║"
echo "╚══════════════════════════════════════════╝"
