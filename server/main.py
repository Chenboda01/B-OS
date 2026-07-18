"""
B-OS Backend Server
Provides terminal execution, file system access, and AI chat proxy.
Run: pip install -r requirements.txt && python main.py
"""
import os
import subprocess
import shlex
import json
from pathlib import Path

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

ALLOWED_DIRS = [
    os.path.expanduser("~"),
    "/home",
    "/tmp",
    "/etc",
    "/var",
]

BLOCKED_COMMANDS = [
    "rm", "dd", "mkfs", "shutdown", "reboot", "halt",
    "poweroff", "init", "systemctl", "chmod", "chown",
    "fdisk", "parted", "mount", "umount",
]


def is_path_allowed(path: str) -> bool:
    """Check if a path is within allowed directories."""
    real = os.path.realpath(os.path.expanduser(path))
    for d in ALLOWED_DIRS:
        d_real = os.path.realpath(os.path.expanduser(d))
        if real.startswith(d_real):
            return True
    return False


def sanitize_path(path: str) -> str:
    """Expand and sanitize a path."""
    path = os.path.expanduser(path)
    # Prevent directory traversal
    if ".." in path:
        path = path.replace("..", "")
    return path


# ─── Terminal ────────────────────────────────────────────────────

@app.route("/api/terminal/exec", methods=["POST"])
def terminal_exec():
    data = request.get_json(silent=True) or {}
    cmd = data.get("command", "").strip()
    cwd = data.get("cwd", os.path.expanduser("~"))

    if not cmd:
        return jsonify({"stdout": "", "stderr": "", "exit_code": 0})

    # Validate cwd
    cwd = os.path.expanduser(str(cwd))
    if not os.path.isdir(cwd):
        cwd = os.path.expanduser("~")

    # Security: block dangerous commands
    tokens = shlex.split(cmd)
    if tokens and tokens[0] in BLOCKED_COMMANDS:
        return jsonify({
            "stdout": "",
            "stderr": f"B-OS: Command '{tokens[0]}' is blocked for safety.",
            "exit_code": 1
        })

    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30,
            cwd=cwd
        )
        return jsonify({
            "stdout": result.stdout,
            "stderr": result.stderr,
            "exit_code": result.returncode
        })
    except subprocess.TimeoutExpired:
        return jsonify({
            "stdout": "",
            "stderr": "Command timed out (30s limit).",
            "exit_code": 124
        })
    except Exception as e:
        return jsonify({
            "stdout": "",
            "stderr": str(e),
            "exit_code": 1
        })


@app.route("/api/terminal/commands", methods=["GET"])
def terminal_commands():
    """Return all available system commands."""
    try:
        result = subprocess.run(
            "compgen -c | sort | uniq",
            shell=True, capture_output=True, text=True, timeout=10
        )
        commands = [c.strip() for c in result.stdout.strip().split("\n") if c.strip()]
        return jsonify({"count": len(commands), "commands": commands})
    except Exception as e:
        return jsonify({"count": 0, "commands": [], "error": str(e)})


@app.route("/api/terminal/which", methods=["GET"])
def terminal_which():
    cmd = request.args.get("cmd", "").strip()
    if not cmd:
        return jsonify({"path": "", "error": "No command specified"})
    try:
        result = subprocess.run(
            ["which", cmd],
            capture_output=True, text=True, timeout=5
        )
        path = result.stdout.strip()
        if result.returncode == 0 and path:
            return jsonify({"path": path, "exists": True})
        else:
            return jsonify({"path": "", "exists": False, "error": result.stderr.strip() or f"{cmd}: not found"})
    except FileNotFoundError:
        return jsonify({"path": "", "exists": False, "error": "which command not available"})
    except Exception as e:
        return jsonify({"path": "", "exists": False, "error": str(e)})


# ─── Files ───────────────────────────────────────────────────────

@app.route("/api/files/list", methods=["GET"])
def files_list():
    path = sanitize_path(request.args.get("path", "~"))
    abspath = os.path.expanduser(path)

    if not os.path.exists(abspath):
        return jsonify({"path": path, "entries": [], "error": "Path not found"})

    if not is_path_allowed(abspath):
        return jsonify({"path": path, "entries": [], "error": "Access denied"})

    entries = []
    try:
        for name in sorted(os.listdir(abspath)):
            full = os.path.join(abspath, name)
            try:
                stat = os.stat(full)
                entries.append({
                    "name": name,
                    "type": "dir" if os.path.isdir(full) else "file",
                    "size": stat.st_size,
                    "modified": stat.st_mtime
                })
            except OSError:
                entries.append({"name": name, "type": "unknown", "size": 0, "modified": 0})
    except PermissionError:
        return jsonify({"path": path, "entries": [], "error": "Permission denied"})

    return jsonify({"path": path, "entries": entries})


@app.route("/api/files/read", methods=["POST"])
def files_read():
    data = request.get_json(silent=True) or {}
    path = sanitize_path(data.get("path", ""))
    abspath = os.path.expanduser(path)

    if not path:
        return jsonify({"content": "", "error": "No path provided"})

    if not os.path.exists(abspath):
        return jsonify({"content": "", "error": "File not found"})

    if not is_path_allowed(abspath):
        return jsonify({"content": "", "error": "Access denied"})

    # Don't read binary files
    if os.path.getsize(abspath) > 1024 * 1024:  # 1MB limit
        return jsonify({"content": "", "error": "File too large (>1MB)"})

    try:
        with open(abspath, "r", errors="replace") as f:
            content = f.read()
        return jsonify({"content": content})
    except Exception as e:
            return jsonify({"content": "", "error": str(e)})


@app.route("/api/files/operation", methods=["POST"])
def files_operation():
    data = request.get_json(silent=True) or {}
    action = data.get("action", "")
    path = sanitize_path(data.get("path", ""))
    new_path = sanitize_path(data.get("newPath", ""))
    abspath = os.path.expanduser(path)

    if not path or not action:
        return jsonify({"error": "Missing path or action"})
    if not is_path_allowed(abspath):
        return jsonify({"error": "Access denied"})

    try:
        if action == "delete":
            if os.path.isdir(abspath):
                import shutil
                shutil.rmtree(abspath)
            else:
                os.remove(abspath)
            return jsonify({"success": True})
        elif action == "rename":
            abs_new = os.path.expanduser(new_path)
            if not is_path_allowed(abs_new):
                return jsonify({"error": "Access denied for target"})
            os.rename(abspath, abs_new)
            return jsonify({"success": True})
        elif action == "mkdir":
            os.makedirs(abspath, exist_ok=True)
            return jsonify({"success": True})
        else:
            return jsonify({"error": "Unknown action: " + action})
    except Exception as e:
        return jsonify({"error": str(e)})


# ─── AI Chat (QWEN Proxy) ────────────────────────────────────────

QWEN_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")


def get_qwen_key():
    """Get QWEN API key from env or config file."""
    key = os.environ.get("QWEN_API_KEY", "")
    if key:
        return key
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE) as f:
                cfg = json.load(f)
                return cfg.get("qwen_api_key", "")
    except Exception:
        pass
    return ""


@app.route("/api/ai/config", methods=["POST"])
def ai_config():
    """Save QWEN API key to config file."""
    data = request.get_json(silent=True) or {}
    key = data.get("key", "").strip()
    cfg = {}
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE) as f:
                cfg = json.load(f)
    except Exception:
        pass
    cfg["qwen_api_key"] = key
    try:
        with open(CONFIG_FILE, "w") as f:
            json.dump(cfg, f)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route("/api/ai/config", methods=["GET"])
def ai_config_get():
    """Check if API key is configured."""
    key = get_qwen_key()
    return jsonify({"configured": bool(key)})


@app.route("/api/ai/chat", methods=["POST"])
def ai_chat():
    api_key = get_qwen_key()
    if not api_key:
        return jsonify({"reply": "B-OS AI requires a QWEN API key. Get a free key at dashscope.console.aliyun.com. Enter it in Settings > AI."})

    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()
    history = data.get("history", [])

    if not message:
        return jsonify({"reply": "", "error": "No message provided"})

    messages = [{"role": "system", "content": "You are a helpful assistant running inside B-OS, a custom desktop operating system. Keep responses concise and helpful."}]
    for h in history:
        messages.append(h)
    messages.append({"role": "user", "content": message})

    try:
        import requests
        r = requests.post(
            QWEN_API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "qwen-turbo",
                "messages": messages,
                "max_tokens": 1024
            },
            timeout=30
        )
        if r.status_code == 200:
            body = r.json()
            reply = body["choices"][0]["message"]["content"]
            return jsonify({"reply": reply})
        else:
            return jsonify({"reply": f"QWEN API error: {r.status_code}", "error": str(r.status_code)})
    except Exception as e:
        return jsonify({"reply": f"Connection error: {str(e)}", "error": "connection_error"})


# ─── Health ──────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "os": os.uname().sysname, "hostname": os.uname().nodename})


# ─── Main ────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("╔══════════════════════════════════════════════╗")
    print("║           B-OS Backend Server v1.0           ║")
    print("║        http://localhost:8765                 ║")
    print("╠══════════════════════════════════════════════╣")
    print("║  Endpoints:                                  ║")
    print("║  POST /api/terminal/exec  - Run commands     ║")
    print("║  GET  /api/files/list     - List directory   ║")
    print("║  POST /api/files/read     - Read file        ║")
    print("║  POST /api/ai/chat        - AI chat          ║")
    print("║  GET  /api/health         - Server status    ║")
    print("╚══════════════════════════════════════════════╝")
    app.run(host="0.0.0.0", port=8765, debug=True)
