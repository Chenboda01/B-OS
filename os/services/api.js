// B-OS API Client — matches the backend's loopback-only bind address.
const API_BASE = 'http://127.0.0.1:8765';
const API_TIMEOUT_MS = 5000;

const API = {
  baseUrl: API_BASE,
  online: false,

  async request(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    try {
      const response = await fetch(`${API_BASE}${path}`, { ...options, signal: controller.signal });
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Backend returned HTTP ${response.status}`);
      }
      const data = await response.json();
      if (!response.ok && !data.error && !data.stderr) {
        throw new Error(`Backend returned HTTP ${response.status}`);
      }
      this.online = true;
      return data;
    } catch (error) {
      this.online = false;
      if (error && error.name === 'AbortError') {
        throw new Error('Backend request timed out. Start B-OS with ./start-bos.sh.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  },

  async exec(cmd, cwd) {
    return this.request('/api/terminal/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd, cwd: cwd || '~' })
    });
  },

  async listFiles(path = '/home') {
    return this.request(`/api/files/list?path=${encodeURIComponent(path)}`);
  },

  async readFile(path) {
    return this.request('/api/files/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });
  },

  async writeFile(path, content) {
    return this.request('/api/files/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content })
    });
  },

  async fileOperation(action, path, newPath = '') {
    return this.request('/api/files/operation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, path, newPath })
    });
  },

  async chat(message, history = [], mode = 'chat') {
    return this.request('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, mode })
    });
  },

  async health() {
    try {
      const data = await this.request('/api/health');
      this.online = data.status === 'ok';
      return data;
    } catch (error) {
      this.online = false;
      return { status: 'offline', error: error && error.message ? error.message : 'Backend unavailable' };
    }
  },

  async fetchCommands() {
    try {
      return await this.request('/api/terminal/commands');
    } catch (error) {
      return { count: 0, commands: [], error: error && error.message ? error.message : 'Backend unavailable' };
    }
  },

  async whichCmd(cmd) {
    try {
      return await this.request(`/api/terminal/which?cmd=${encodeURIComponent(cmd)}`);
    } catch (error) {
      return { path: '', exists: false, error: error && error.message ? error.message : 'Backend offline' };
    }
  }
};
