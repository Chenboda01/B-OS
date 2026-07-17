# AGENTS.md — B-OS

## Project Stage

**Pre-code / planning.** This repository has no source code, no build system, no package manager, and no dependencies. The only file is `README.md`, which is the authoritative source for project vision and requirements.

## Architecture (from README)

B-OS is a browser-based desktop OS simulation. The README lists CSS, Java, and Python as the tech stack, but no implementation exists yet — these are aspirational. The project is a desktop-only product (phone later).

**Intended features (browser-based desktop):**
- Desktop UI with Windows-like layout but different styling
- File manager (bridges to host OS files)
- Terminal (Manjaro Linux command compatibility)
- Browser (Google, Bing, etc.)
- AI chat (QWEN API key)
- Games (placeholder layout only)
- Settings panel
- Clock (time from host OS or location services)
- Exit button (top-right, returns to host OS)

**Production timeline** (from README):
1. Marketing/install website (hours)
2. Core OS build (months)
3. Feature additions (1–3 months)

## What Doesn't Exist Yet

No conventions, no lint rules, no test framework, no CI, no docker, no dependency manifests. Every tool and convention will need to be chosen from scratch. **Do not assume any stack decisions** — confirm with the user before introducing new tooling.

## Agent Guidelines

- The README is the only source of truth. Read it first.
- Nothing is wired together. There are no entrypoints, no package boundaries, no imports.
- When proposing architecture, start simple and match the README's stated scope.
- The project vision is ambitious relative to current state — scope discussions should reference the README timeline.
