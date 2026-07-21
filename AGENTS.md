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
│       ├── api.js      # API client — communicates with Python backend (127.0.0.1:8765)
│       └── apps.js     # OS apps — Terminal, Files, AI Chat, Browser, Settings, Clock, Games
└── server/             # Python backend
    ├── main.py         # Flask server — terminal exec, file system, AI proxy (QWEN)
    └── requirements.txt
```

## Architecture

**Frontend (browser):** Vanilla HTML/CSS/JS. Single-file components. No frameworks, no npm, no build step. The OS shell (`os/index.html`) provides a `BOS` global window manager. Apps register via `BOS.registerApp()` and create windows via `BOS.createWindow()`.

**Backend:** Python Flask bound to `127.0.0.1:8765`. CORS is restricted to the GitHub Pages origin and approved local development origins. Endpoints:
- `POST /api/terminal/exec` — execute shell commands (blocked: rm, dd, shutdown, etc.)
- `GET /api/files/list?path=` — list directory contents (restricted to allowed dirs)
- `POST /api/files/read` — read file contents (1MB limit)
- `POST /api/ai/chat` — proxy to QWEN API (requires `QWEN_API_KEY` env var)
- `GET /api/health` — minimal server status and service identity

**Deployment:** GitHub Pages (`chenboda01.github.io/B-OS`) serves static frontend. Backend runs locally on user's machine.

## Design System

**Aesthetic:** Retro-futuristic cyberpunk. Dark theme with neon accents. Not Windows-like.
**Colors:** `--void #050510`, `--cyan #00f0ff`, `--magenta #ff00ff`, `--green #00ff88`, `--amber #ffaa00`, `--red #ff3355`
**Fonts:** `'Consolas', 'SF Mono', 'Fira Code', 'Courier New', monospace` (display/mono). No Inter, Roboto, Arial, Space Grotesk.
**No external CDNs or frameworks.** The landing page is self-contained; the OS shell uses local files under `os/css/` and `os/js/`.

## Key Conventions

- **No build tools.** Everything is vanilla, runnable directly in browser.
- **No package.json, no node_modules.** This is not a Node project.
- **Frontend assets are local.** The landing page keeps CSS/JS inline; the OS shell loads only repository-local CSS/JS.
- **Backend is separate.** Create `server/.venv`, install with `python -m pip install -r server/requirements.txt`, and run `server/.venv/bin/python server/main.py`.
- **Git branch:** `main`. Push to `https://github.com/Chenboda01/B-OS.git`.
- **Landing page "Launch B-OS" link** navigates to `os/index.html`.
- **OS Exit button** navigates back to `../index.html` (landing page).

## Running the OS

1. Run `./install.sh` once to create the virtual environment and desktop entry.
2. Set QWEN API key (optional): `export QWEN_API_KEY=your_key`.
3. Run `./launch.sh`; it starts loopback-only static and backend servers before opening app mode.
4. For manual development, serve the repository on `http://127.0.0.1:8000` or `http://localhost:8000`; direct `file://` access is intentionally not allowed by backend CORS.
