# AGENTS.md — B-OS

## Project Stage

**Active development.** Browser-based desktop OS simulation. Multi-component project with a marketing landing page, OS frontend, and Python backend.

## Project Structure

```
B-OS/
├── index.html          # Marketing landing page (self-contained HTML/CSS/JS)
├── README.md           # Project vision and requirements (source of truth)
├── AGENTS.md           # This file
├── os/                 # Browser-based desktop OS (frontend)
│   ├── index.html      # OS shell — desktop, window manager, taskbar, boot animation
│   └── js/
│       ├── api.js      # API client — communicates with Python backend (localhost:8765)
│       └── apps.js     # OS apps — Terminal, Files, AI Chat, Browser, Settings, Clock, Games
└── server/             # Python backend
    ├── main.py         # Flask server — terminal exec, file system, AI proxy (QWEN)
    └── requirements.txt
```

## Architecture

**Frontend (browser):** Vanilla HTML/CSS/JS. Single-file components. No frameworks, no npm, no build step. The OS shell (`os/index.html`) provides a `BOS` global window manager. Apps register via `BOS.registerApp()` and create windows via `BOS.createWindow()`.

**Backend:** Python Flask on port 8765. CORS-enabled for browser access. Endpoints:
- `POST /api/terminal/exec` — execute shell commands (blocked: rm, dd, shutdown, etc.)
- `GET /api/files/list?path=` — list directory contents (restricted to allowed dirs)
- `POST /api/files/read` — read file contents (1MB limit)
- `POST /api/ai/chat` — proxy to QWEN API (requires `QWEN_API_KEY` env var)
- `GET /api/health` — server status + host info

**Deployment:** GitHub Pages (`chenboda01.github.io/B-OS`) serves static frontend. Backend runs locally on user's machine.

## Design System

**Aesthetic:** Retro-futuristic cyberpunk. Dark theme with neon accents. Not Windows-like.
**Colors:** `--void #050510`, `--cyan #00f0ff`, `--magenta #ff00ff`, `--green #00ff88`, `--amber #ffaa00`, `--red #ff3355`
**Fonts:** `'Consolas', 'SF Mono', 'Fira Code', 'Courier New', monospace` (display/mono). No Inter, Roboto, Arial, Space Grotesk.
**All CSS/JS inline in single HTML files.** No external CDNs or frameworks.

## Key Conventions

- **No build tools.** Everything is vanilla, runnable directly in browser.
- **No package.json, no node_modules.** This is not a Node project.
- **Frontend files are self-contained.** Each HTML file has its CSS in `<style>` and JS in `<script>`.
- **Backend is separate.** Install deps via `pip install -r server/requirements.txt`, run with `python server/main.py`.
- **Git branch:** `main`. Push to `https://github.com/Chenboda01/B-OS.git`.
- **Landing page "Get B-OS" button** navigates to `os/index.html`.
- **OS Exit button** navigates back to `../index.html` (landing page).

## Running the OS

1. Start backend: `cd server && pip install -r requirements.txt && python main.py`
2. Set QWEN API key (optional): `export QWEN_API_KEY=your_key`
3. Open `os/index.html` in browser (or serve via any static server)
4. Backend status indicator (green/red dot) in OS taskbar shows connection state
