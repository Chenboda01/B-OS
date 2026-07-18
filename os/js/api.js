// B-OS API Client — Communicates with the Python backend at localhost:8765
const API_BASE = 'http://localhost:8765';

const API = {
  async exec(cmd) {
    const r = await fetch(`${API_BASE}/api/terminal/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd })
    });
    return r.json(); // { stdout, stderr, exit_code }
  },

  async listFiles(path = '/home') {
    const r = await fetch(`${API_BASE}/api/files/list?path=${encodeURIComponent(path)}`);
    return r.json(); // { path, entries: [{name, type, size, modified}] }
  },

  async readFile(path) {
    const r = await fetch(`${API_BASE}/api/files/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });
    return r.json(); // { content, error }
  },

  async chat(message, history = []) {
    const r = await fetch(`${API_BASE}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history })
    });
    return r.json(); // { reply, error }
  },

  async health() {
    try {
      const r = await fetch(`${API_BASE}/api/health`);
      return r.json();
    } catch {
      return { status: 'offline' };
    }
  },

  async fetchCommands() {
    try {
      const r = await fetch(`${API_BASE}/api/terminal/commands`);
      return r.json();
    } catch {
      return { count: 0, commands: [] };
    }
  }
};
