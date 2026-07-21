// B-OS API Client — matches the backend's loopback-only bind address.
const API_BASE = 'http://127.0.0.1:8765';

const API = {
  baseUrl: API_BASE,

  async exec(cmd, cwd) {
    const r = await fetch(`${API_BASE}/api/terminal/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd, cwd: cwd || '~' })
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

  async writeFile(path, content) {
    const r = await fetch(`${API_BASE}/api/files/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content })
    });
    const type = r.headers.get('content-type') || '';
    if (!type.includes('application/json')) {
      return { success: false, error: `Backend returned HTTP ${r.status}` };
    }
    return r.json(); // { success, path, error }
  },

  async chat(message, history = [], mode = 'chat') {
    const r = await fetch(`${API_BASE}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, mode })
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
  },

  async whichCmd(cmd) {
    try {
      const r = await fetch(`${API_BASE}/api/terminal/which?cmd=${encodeURIComponent(cmd)}`);
      return r.json();
    } catch {
      return { path: '', exists: false, error: 'Backend offline' };
    }
  }
};
