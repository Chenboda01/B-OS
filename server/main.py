"""
B-OS Backend Server
Provides terminal execution, file system access, and AI chat proxy.
Setup: python -m venv .venv && .venv/bin/python -m pip install -r requirements.txt
Run: .venv/bin/python main.py
"""
import os
import subprocess
import shlex
import json
from pathlib import Path

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
BACKEND_PORT = int(os.environ.get("BOS_BACKEND_PORT", "8765"))

ALLOWED_ORIGINS = [
    "https://chenboda01.github.io",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
if os.environ.get("BOS_FRONTEND_ORIGIN"):
    ALLOWED_ORIGINS.append(os.environ["BOS_FRONTEND_ORIGIN"])

CORS(app, resources={
    r"/api/.*": {
        "origins": ALLOWED_ORIGINS,
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Accept", "Content-Type"],
        "supports_credentials": False,
        "vary_header": True,
        "allow_private_network": True,
    },
})

ALLOWED_DIRS = [
    os.path.expanduser("~"),
    "/home",
    "/tmp",
    "/etc",
    "/var",
]

WRITABLE_DIRS = [
    os.path.expanduser("~"),
    "/home",
    "/tmp",
]

ALLOWED_TERMINAL_COMMANDS = {
    "basename", "cat", "cut", "df", "dirname", "du", "echo", "file",
    "free", "grep", "head", "id", "ls", "printenv", "printf", "ps",
    "readlink", "realpath", "stat", "tail", "tr", "uname", "uptime",
    "wc", "which", "whoami", "whereis",
}
SHELL_METACHARACTERS = frozenset(";&|`$<>\n\r")
MAX_TERMINAL_OUTPUT = 1024 * 1024


def is_path_allowed(path: str, allowed_dirs=None) -> bool:
    """Check if a path is within allowed directories."""
    real = os.path.realpath(os.path.expanduser(path))
    for d in allowed_dirs or ALLOWED_DIRS:
        d_real = os.path.realpath(os.path.expanduser(d))
        try:
            if os.path.commonpath([real, d_real]) == d_real:
                return True
        except ValueError:
            continue
    return False


def sanitize_path(path: str) -> str:
    """Expand and sanitize a path."""
    return os.path.expanduser(str(path))


def parse_terminal_command(command: str) -> list[str]:
    """Parse one allowlisted command without invoking a shell."""
    if any(char in command for char in SHELL_METACHARACTERS):
        raise ValueError("Shell operators, redirects, and substitutions are not supported.")
    try:
        tokens = shlex.split(command, posix=True)
    except ValueError as exc:
        raise ValueError(f"Invalid command syntax: {exc}") from exc
    if not tokens:
        return []
    executable = tokens[0]
    if "/" in executable or executable not in ALLOWED_TERMINAL_COMMANDS:
        raise PermissionError(
            f"Command '{executable}' is unavailable in the restricted B-OS terminal."
        )
    return tokens


def limit_terminal_output(value: str) -> str:
    """Bound terminal responses so one command cannot exhaust browser memory."""
    encoded = value.encode("utf-8", errors="replace")
    if len(encoded) <= MAX_TERMINAL_OUTPUT:
        return value
    return encoded[:MAX_TERMINAL_OUTPUT].decode("utf-8", errors="replace") + "\n[output truncated]"


# ─── Terminal ────────────────────────────────────────────────────

@app.route("/api/terminal/exec", methods=["POST"])
def terminal_exec():
    data = request.get_json(silent=True) or {}
    cmd = data.get("command", "").strip()
    cwd = data.get("cwd", os.path.expanduser("~"))

    if not cmd:
        return jsonify({"stdout": "", "stderr": "", "exit_code": 0})

    # Restrict execution to the local filesystem areas exposed by B-OS.
    cwd = os.path.expanduser(str(cwd))
    if not os.path.isdir(cwd) or not is_path_allowed(cwd):
        cwd = os.path.expanduser("~")

    try:
        tokens = shlex.split(cmd, posix=True)
    except ValueError as exc:
        return jsonify({"stdout": "", "stderr": f"Invalid command syntax: {exc}", "exit_code": 2})

    if tokens and tokens[0] == "cd":
        if len(tokens) > 2:
            return jsonify({"stdout": "", "stderr": "cd: too many arguments", "exit_code": 2})
        target = os.path.realpath(os.path.join(cwd, os.path.expanduser(tokens[1] if len(tokens) == 2 else "~")))
        if not os.path.isdir(target) or not is_path_allowed(target):
            return jsonify({"stdout": "", "stderr": "cd: directory unavailable", "exit_code": 1})
        return jsonify({"stdout": "", "stderr": "", "exit_code": 0, "cwd": target})

    try:
        tokens = parse_terminal_command(cmd)
    except (PermissionError, ValueError) as exc:
        return jsonify({
            "stdout": "",
            "stderr": f"B-OS: {exc}",
            "exit_code": 1
        })

    try:
        result = subprocess.run(
            tokens,
            shell=False,
            capture_output=True,
            text=True,
            timeout=10,
            cwd=cwd
        )
        return jsonify({
            "stdout": limit_terminal_output(result.stdout),
            "stderr": limit_terminal_output(result.stderr),
            "exit_code": result.returncode
        })
    except subprocess.TimeoutExpired:
        return jsonify({
            "stdout": "",
            "stderr": "Command timed out (10s limit).",
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
    """Return commands exposed by the restricted terminal API."""
    commands = sorted(ALLOWED_TERMINAL_COMMANDS)
    return jsonify({"count": len(commands), "commands": commands, "restricted": True})


@app.route("/api/terminal/which", methods=["GET"])
def terminal_which():
    cmd = request.args.get("cmd", "").strip()
    if not cmd:
        return jsonify({"path": "", "error": "No command specified"})
    if cmd not in ALLOWED_TERMINAL_COMMANDS:
        return jsonify({"path": "", "exists": False, "error": "Command is not available in the restricted terminal"})
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


@app.route("/api/files/write", methods=["POST"])
def files_write():
    data = request.get_json(silent=True) or {}
    path = sanitize_path(data.get("path", ""))
    content = data.get("content", "")
    abspath = os.path.expanduser(path)

    if not path:
        return jsonify({"success": False, "error": "No path provided"}), 400
    if not isinstance(content, str):
        return jsonify({"success": False, "error": "Content must be text"}), 400
    if len(content.encode("utf-8")) > 1024 * 1024:
        return jsonify({"success": False, "error": "File too large (>1MB)"}), 413
    if not is_path_allowed(abspath, WRITABLE_DIRS) or not is_path_allowed(os.path.dirname(abspath) or ".", WRITABLE_DIRS):
        return jsonify({"success": False, "error": "Access denied"}), 403
    if os.path.isdir(abspath):
        return jsonify({"success": False, "error": "Path is a directory"}), 400

    try:
        Path(abspath).parent.mkdir(parents=True, exist_ok=True)
        with open(abspath, "w", encoding="utf-8") as f:
            f.write(content)
        return jsonify({"success": True, "path": path})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/files/operation", methods=["POST"])
def files_operation():
    data = request.get_json(silent=True) or {}
    action = data.get("action", "")
    path = sanitize_path(data.get("path", ""))
    new_path = sanitize_path(data.get("newPath", ""))
    abspath = os.path.expanduser(path)

    if not path or not action:
        return jsonify({"error": "Missing path or action"})
    if not is_path_allowed(abspath, WRITABLE_DIRS):
        return jsonify({"error": "Access denied"})
    protected_roots = {os.path.realpath(os.path.expanduser(root)) for root in WRITABLE_DIRS}
    if action == "delete" and os.path.realpath(abspath) in protected_roots:
        return jsonify({"error": "Protected directory cannot be deleted"}), 403

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
            if not is_path_allowed(abs_new, WRITABLE_DIRS):
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
    mode = data.get("mode", "chat")

    if not message:
        return jsonify({"reply": "", "error": "No message provided"})

    system_prompts = {
        "chat": "You are a helpful assistant running inside B-OS, a custom desktop operating system. Keep responses concise and helpful.",
        "file-edit": "You edit text files inside B-OS. Return only the complete revised file content, without Markdown fences or commentary.",
        "terminal": "You are a Manjaro Linux terminal assistant. Return one safe shell command first, followed by one short explanation on a new line. Never suggest destructive commands.",
        "coding": "You are the B-OS coding assistant. Provide concise, production-quality code and explain important tradeoffs.",
        "workflow": "You are a B-OS planning agent. Produce a short actionable workflow with numbered steps, verification, and safety checks.",
    }
    messages = [{"role": "system", "content": system_prompts.get(mode, system_prompts["chat"])}]
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
    return jsonify({"status": "ok", "service": "b-os-backend"})


# ─── Main ────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("╔══════════════════════════════════════════════╗")
    print("║           B-OS Backend Server v1.0           ║")
    print(f"║        http://127.0.0.1:{BACKEND_PORT:<21}║")
    print("╠══════════════════════════════════════════════╣")
    print("║  Endpoints:                                  ║")
    print("║  POST /api/terminal/exec  - Run commands     ║")
    print("║  GET  /api/files/list     - List directory   ║")
    print("║  POST /api/files/read     - Read file        ║")
    print("║  POST /api/files/write    - Write text file  ║")
    print("║  POST /api/ai/chat        - AI chat          ║")
    print("║  GET  /api/health         - Server status    ║")
    print("╚══════════════════════════════════════════════╝")
    app.run(host="127.0.0.1", port=BACKEND_PORT, debug=False)
