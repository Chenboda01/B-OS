// ═══════════════════════════════════════════════════════════════
// B-OS Desktop Applications — apps.js
// All 7 apps registered with the BOS shell
// ═══════════════════════════════════════════════════════════════

// ─── Shared styles injected once ───────────────────────────────
(function injectSharedStyles() {
  if (document.getElementById('bos-app-styles')) return;
  var s = document.createElement('style');
  s.id = 'bos-app-styles';
  s.textContent = `
    /* ── App-level base reset (scoped to window content) ── */
    .bos-app * { box-sizing: border-box; }
    .bos-app input, .bos-app button, .bos-app textarea {
      font-family: var(--font-mono, 'Consolas','SF Mono','Fira Code','Courier New',monospace);
    }
    .bos-app ::-webkit-scrollbar { width: 6px; height: 6px; }
    .bos-app ::-webkit-scrollbar-track { background: var(--void, #050510); }
    .bos-app ::-webkit-scrollbar-thumb {
      background: var(--surface, #111130);
      border-radius: 3px;
    }
    .bos-app ::-webkit-scrollbar-thumb:hover {
      background: var(--elevated, #181848);
    }

    /* ── Breadcrumb ── */
    .bos-breadcrumb { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
    .bos-breadcrumb span {
      cursor: pointer;
      color: var(--cyan, #00f0ff);
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 2px;
      transition: background 0.2s;
    }
    .bos-breadcrumb span:hover { background: rgba(0,240,255,0.1); }
    .bos-breadcrumb .sep { color: var(--text-dim, #555580); cursor: default; padding: 0 2px; }
    .bos-breadcrumb .sep:hover { background: none; }
  `;
  document.head.appendChild(s);
})();


// ═══════════════════════════════════════════════════════════════
// APP 1 — TERMINAL
// ═══════════════════════════════════════════════════════════════
(function() {
  var history = [];
  var historyIdx = -1;
  var currentDir = '~';

  var KNOWN_COMMANDS = [
    'ls','cd','pwd','cat','echo','clear','whoami','date','uname',
    'uname -a','man','neofetch','pacman','help','exit','grep','mkdir',
    'touch','rm','cp','mv','sudo','history','env','export','alias',
    'df','du','ps','top','kill','chmod','chown','nano','vim','man'
  ];

  var NEOFETCH_BANNER =
    '       _____ _____ ____  __  __ ____  _     ___\n' +
    '      / ____|__  /|___ \\|  \\/  | __ )| |   / _ \\\n' +
    '     | |      / /  / __ \\| |\\/| |  _ \\| |  | | | |\n' +
    '     | |___ / /_ / ___) | |  | | |_) | |__| |_| |\n' +
    '      \\____/____/|____/|_|  |_|____/|_____\\___/\n';

  var PACMAN_MSGS = [
    'B-OS package manager v1.0',
    ':: There is nothing to do. All packages are up to date.',
    'warning: database file for [bos-core] is up to date',
    ':: Starting full system upgrade...',
    ' there is nothing to do',
    ':: B-OS repository configured at bos://local'
  ];

  function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function createUI() {
    return '<div class="bos-app" style="display:flex;flex-direction:column;height:100%;background:#050510;overflow:hidden;">' +
      '<div id="term-output" style="flex:1;overflow-y:auto;padding:12px 16px;font-family:var(--font-mono,monospace);font-size:13px;line-height:1.7;color:#00ff88;white-space:pre-wrap;word-break:break-all;"></div>' +
      '<div style="display:flex;align-items:center;padding:0 16px 12px;background:#050510;">' +
        '<span style="color:#00f0ff;font-family:var(--font-mono,monospace);font-size:13px;white-space:nowrap;user-select:none;">' + esc('b-os') + '@<span style="color:#9999cc;">local</span> <span style="color:#00ff88;">' + esc(currentDir) + '</span> $ </span>' +
        '<input id="term-input" type="text" autocomplete="off" spellcheck="false" ' +
          'style="flex:1;background:transparent;border:none;outline:none;color:#e8eaff;font-family:var(--font-mono,monospace);font-size:13px;line-height:1.7;padding:0 0 0 4px;" />' +
      '</div>' +
    '</div>';
  }

  function appendOutput(el, text, color) {
    var div = document.createElement('div');
    div.style.color = color || '#00ff88';
    div.textContent = text;
    el.appendChild(div);
  }

  function appendHTML(el, html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    el.appendChild(div);
  }

  function scrollBottom(el) {
    el.scrollTop = el.scrollHeight;
  }

  function handleCommand(cmd, outputEl) {
    var trimmed = cmd.trim();
    if (!trimmed) return;
    history.push(trimmed);
    historyIdx = history.length;

    // Show the command line
    appendHTML(outputEl,
      '<span style="color:#00f0ff;">' + esc('b-os') + '@<span style="color:#9999cc;">local</span> <span style="color:#00ff88;">' + esc(currentDir) + '</span> $ </span>' +
      '<span style="color:#e8eaff;">' + esc(trimmed) + '</span>'
    );

    var parts = trimmed.split(/\s+/);
    var cmd0 = parts[0].toLowerCase();
    var args = parts.slice(1);

    if (cmd0 === 'clear') {
      outputEl.innerHTML = '';
      return;
    }

    if (cmd0 === 'help') {
      appendOutput(outputEl,
        'B-OS Terminal — Available Commands:\n' +
        '─────────────────────────────────────\n' +
        '  ls [path]        List directory contents\n' +
        '  cd <path>        Change directory\n' +
        '  pwd              Print working directory\n' +
        '  cat <file>       Read file contents\n' +
        '  echo <text>      Print text\n' +
        '  clear            Clear terminal\n' +
        '  whoami           Current user\n' +
        '  date             Show date/time\n' +
        '  uname -a         System information\n' +
        '  neofetch         B-OS system info\n' +
        '  pacman <args>    B-OS package manager\n' +
        '  help             Show this help\n' +
        '  history          Command history\n' +
        '  exit             Close terminal\n' +
        '─────────────────────────────────────\n' +
        '  ↑/↓  Navigate history  |  Tab  Autocomplete  |  Ctrl+L  Clear',
        '#9999cc'
      );
      scrollBottom(outputEl);
      return;
    }

    if (cmd0 === 'neofetch') {
      var info =
        NEOFETCH_BANNER + '\n' +
        '\x1b[1muser\x1b[0m@\x1b[1mb-os\x1b[0m\n' +
        '──────────────\n' +
        'OS:        B-OS v0.1\n' +
        'Shell:     bsh 1.0\n' +
        'Desktop:   BDE (Browser Desktop Environment)\n' +
        'Terminal:  b-term\n' +
        'CPU:       Web Runtime Engine\n' +
        'Memory:    ' + (performance && performance.memory ? Math.round(performance.memory.usedJSHeapSize/1048576) + 'MB / ' + Math.round(performance.memory.jsHeapSizeLimit/1048576) + 'MB' : 'N/A') + '\n' +
        'Packages:  1337 (bos-pm)\n' +
        'Uptime:    ' + Math.floor(performance.now()/1000) + 's\n' +
        '\n' +
        '  ██ ██ ██ ██ ██ ██';

      appendHTML(outputEl,
        '<div style="display:flex;gap:16px;align-items:flex-start;">' +
          '<pre style="margin:0;color:#00f0ff;font-size:12px;line-height:1.4;">' + esc(NEOFETCH_BANNER) + '</pre>' +
          '<div style="font-size:12px;line-height:1.7;color:#9999cc;">' +
            '<span style="color:#e8eaff;font-weight:bold;">b-os@local</span><br>' +
            '──────────────<br>' +
            '<span style="color:#555580;">OS:</span>        B-OS v0.1<br>' +
            '<span style="color:#555580;">Shell:</span>     bsh 1.0<br>' +
            '<span style="color:#555580;">Desktop:</span>   BDE<br>' +
            '<span style="color:#555580;">Terminal:</span>  b-term<br>' +
            '<span style="color:#555580;">CPU:</span>       Web Runtime<br>' +
            '<span style="color:#555580;">Packages:</span>  1337 (bos-pm)<br>' +
            '<span style="color:#555580;">Uptime:</span>    ' + Math.floor(performance.now()/1000) + 's<br><br>' +
            '<span style="color:#00f0ff;">██</span> <span style="color:#ff00ff;">██</span> <span style="color:#00ff88;">██</span> <span style="color:#ffaa00;">██</span> <span style="color:#ff3355;">██</span> <span style="color:#e8eaff;">██</span>' +
          '</div>' +
        '</div>'
      );
      scrollBottom(outputEl);
      return;
    }

    if (cmd0 === 'pacman') {
      var idx = Math.floor(Math.random() * PACMAN_MSGS.length);
      var msg = PACMAN_MSGS[idx];
      if (args.length > 0 && args[0] === '-S') {
        msg = 'B-OS package manager v1.0\n:: Resolving dependencies...\n:: Looking for conflicting packages...\n:: There is nothing to do. All packages are up to date.';
      } else if (args.length > 0 && args[0] === '-Syu') {
        msg = 'B-OS package manager v1.0\n:: Synchronizing package databases...\n bos-core is up to date\n:: Starting full system upgrade...\n there is nothing to do';
      } else if (args.length > 0 && args[0] === '-Q') {
        msg = 'bos-core 0.1.0-1\nbos-terminal 0.1.0-1\nbos-desktop 0.1.0-1';
      } else if (args.length === 0) {
        msg = 'B-OS package manager v1.0\nUsage: pacman <operation> [...]\nOperations:\n  -S   Sync packages\n  -Syu Full upgrade\n  -Q   List installed packages';
      }
      appendOutput(outputEl, msg, '#00f0ff');
      scrollBottom(outputEl);
      return;
    }

    if (cmd0 === 'history') {
      var h = history.map(function(c, i) { return '  ' + (i+1) + '  ' + c; }).join('\n');
      appendOutput(outputEl, h || '(empty)', '#9999cc');
      scrollBottom(outputEl);
      return;
    }

    if (cmd0 === 'exit') {
      var closeBtn = outputEl.closest('.bos-window');
      if (closeBtn && closeBtn.querySelector('.win-close')) {
        closeBtn.querySelector('.win-close').click();
      }
      return;
    }

    if (cmd0 === 'whoami') {
      appendOutput(outputEl, 'b-os', '#9999cc');
      scrollBottom(outputEl);
      return;
    }
    if (cmd0 === 'date') {
      appendOutput(outputEl, new Date().toString(), '#9999cc');
      scrollBottom(outputEl);
      return;
    }
    if (cmd0 === 'pwd') {
      appendOutput(outputEl, currentDir === '~' ? '/home/b-os' : currentDir, '#9999cc');
      scrollBottom(outputEl);
      return;
    }
    if (cmd0 === 'uname') {
      if (args.indexOf('-a') !== -1) {
        appendOutput(outputEl, 'B-OS b-os 0.1.0 #1 SMP PREEMPT_DYNAMIC Web x86_64 GNU/B-OS', '#9999cc');
      } else {
        appendOutput(outputEl, 'B-OS', '#9999cc');
      }
      scrollBottom(outputEl);
      return;
    }
    if (cmd0 === 'echo') {
      appendOutput(outputEl, args.join(' '), '#9999cc');
      scrollBottom(outputEl);
      return;
    }

    if (cmd0 === 'ls' || cmd0 === 'cd' || cmd0 === 'cat' || cmd0 === 'mkdir' || cmd0 === 'touch' || cmd0 === 'rm' || cmd0 === 'cp' || cmd0 === 'mv' || cmd0 === 'grep' || cmd0 === 'chmod' || cmd0 === 'chown' || cmd0 === 'ps' || cmd0 === 'df' || cmd0 === 'du' || cmd0 === 'top' || cmd0 === 'kill' || cmd0 === 'env' || cmd0 === 'export' || cmd0 === 'alias' || cmd0 === 'sudo') {
      var apiCmd = trimmed;
      if (cmd0 === 'cd') {
        appendOutput(outputEl, '', '#9999cc');
        scrollBottom(outputEl);
        if (args.length === 0 || args[0] === '~') {
          currentDir = '~';
        } else {
          var newPath = args[0];
          if (!newPath.startsWith('/') && newPath !== '~') {
            newPath = (currentDir === '~' ? '/home' : currentDir) + '/' + newPath;
          }
          var parts = newPath.split('/').filter(function(p) { return p && p !== '.'; });
          var resolved = [];
          for (var i = 0; i < parts.length; i++) {
            if (parts[i] === '..') { resolved.pop(); }
            else { resolved.push(parts[i]); }
          }
          currentDir = '/' + resolved.join('/');
          if (currentDir === '/home') currentDir = '~';
        }
        var promptSpan = outputEl.closest('.bos-app').querySelector('div:last-child span');
        if (promptSpan) {
          promptSpan.innerHTML = esc('b-os') + '@<span style="color:#9999cc;">local</span> <span style="color:#00ff88;">' + esc(currentDir) + '</span> $ ';
        }
        return;
      }
      API.exec(apiCmd).then(function(res) {
        if (res.stdout) appendOutput(outputEl, res.stdout, '#e8eaff');
        if (res.stderr) appendOutput(outputEl, res.stderr, '#ff3355');
        if (res.exit_code && res.exit_code !== 0 && !res.stdout && !res.stderr) {
          appendOutput(outputEl, 'Command exited with code ' + res.exit_code, '#ff3355');
        }
        scrollBottom(outputEl);
      }).catch(function(err) {
        appendOutput(outputEl, 'Error: ' + (err.message || 'Could not connect to backend'), '#ff3355');
        scrollBottom(outputEl);
      });
      return;
    }

    appendOutput(outputEl, "b-OS: command not found: " + cmd0 + "\nType 'help' for available commands.", '#ff3355');
    scrollBottom(outputEl);
  }

  function setupEvents(win) {
    var outputEl = win.querySelector('#term-output');
    var inputEl = win.querySelector('#term-input');
    if (!outputEl || !inputEl) return;

    appendHTML(outputEl,
      '<div style="color:#00f0ff;margin-bottom:4px;">╔══════════════════════════════════════════╗</div>' +
      '<div style="color:#00f0ff;">║      <span style="color:#e8eaff;font-weight:bold;">B-OS Terminal v1.0</span>                   ║</div>' +
      '<div style="color:#00f0ff;">║      Connected to B-OS Terminal          ║</div>' +
      '<div style="color:#00f0ff;">║      Type <span style="color:#00ff88;">help</span> for commands              ║</div>' +
      '<div style="color:#00f0ff;">╚══════════════════════════════════════════╝</div>' +
      '<div style="margin-top:8px;color:#555580;">Welcome. Terminal session initialized.</div>'
    );

    inputEl.focus();

    inputEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        var cmd = inputEl.value;
        inputEl.value = '';
        handleCommand(cmd, outputEl);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIdx > 0) {
          historyIdx--;
          inputEl.value = history[historyIdx] || '';
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIdx < history.length - 1) {
          historyIdx++;
          inputEl.value = history[historyIdx] || '';
        } else {
          historyIdx = history.length;
          inputEl.value = '';
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        var partial = inputEl.value.trim().toLowerCase();
        if (partial) {
          var matches = KNOWN_COMMANDS.filter(function(c) { return c.indexOf(partial) === 0; });
          if (matches.length === 1) {
            inputEl.value = matches[0] + ' ';
          } else if (matches.length > 1) {
            appendOutput(outputEl, matches.join('  '), '#555580');
            scrollBottom(outputEl);
          }
        }
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        outputEl.innerHTML = '';
      }
    });

    win.addEventListener('click', function() {
      inputEl.focus();
    });
  }

  function launch() {
    var win = BOS.createWindow({
      title: 'Terminal',
      icon: '>_',
      width: 700,
      height: 450,
      content: createUI(),
      onClose: function() { history = []; historyIdx = -1; }
    });
    setupEvents(win);
  }

  BOS.registerApp({
    id: 'terminal',
    name: 'Terminal',
    icon: '>_',
    category: 'system',
    launch: launch
  });
})();


// ═══════════════════════════════════════════════════════════════
// APP 2 — FILE MANAGER
// ═══════════════════════════════════════════════════════════════
(function() {
  var currentPath = '/home';
  var pathHistory = ['/home'];
  var historyIndex = 0;
  var sortBy = 'name';
  var sortAsc = true;

  var FAVORITES = [
    { name: 'Home', path: '/home' },
    { name: 'Desktop', path: '/home/b-os/Desktop' },
    { name: 'Documents', path: '/home/b-os/Documents' },
    { name: 'Downloads', path: '/home/b-os/Downloads' },
    { name: '/etc', path: '/etc' },
    { name: '/tmp', path: '/tmp' }
  ];

  function fileIcon(name, type) {
    if (type === 'dir') return '<span style="color:#00f0ff;">📁</span>';
    var ext = name.split('.').pop().toLowerCase();
    if (['txt','md','log','csv'].indexOf(ext) !== -1) return '<span style="color:#ffaa00;">📄</span>';
    if (['js','html','css','json','py','rb','go','rs','ts','jsx','tsx'].indexOf(ext) !== -1) return '<span style="color:#00ff88;">⟨/⟩</span>';
    if (['png','jpg','jpeg','gif','svg','webp','bmp'].indexOf(ext) !== -1) return '<span style="color:#ff00ff;">🖼</span>';
    if (['mp3','wav','ogg','flac'].indexOf(ext) !== -1) return '<span style="color:#ffaa00;">🎵</span>';
    if (['mp4','mkv','avi','mov'].indexOf(ext) !== -1) return '<span style="color:#ff00ff;">🎬</span>';
    if (['zip','tar','gz','7z','rar'].indexOf(ext) !== -1) return '<span style="color:#ffaa00;">📦</span>';
    return '<span style="color:#555580;">■</span>';
  }

  function formatSize(bytes) {
    if (bytes === undefined || bytes === null) return '-';
    if (bytes === 0) return '0 B';
    var units = ['B','KB','MB','GB','TB'];
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
  }

  function formatDate(d) {
    if (!d) return '-';
    var dt = new Date(d);
    if (isNaN(dt)) return d;
    var mon = String(dt.getMonth()+1).padStart(2,'0');
    var day = String(dt.getDate()).padStart(2,'0');
    var yr = dt.getFullYear();
    var hr = String(dt.getHours()).padStart(2,'0');
    var mn = String(dt.getMinutes()).padStart(2,'0');
    return yr + '-' + mon + '-' + day + ' ' + hr + ':' + mn;
  }

  function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function createUI() {
    return '<div class="bos-app" style="display:flex;flex-direction:column;height:100%;background:#050510;color:#e8eaff;font-family:var(--font-mono,monospace);font-size:12px;overflow:hidden;">' +
      /* Toolbar */
      '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#0a0a1a;border-bottom:1px solid rgba(0,240,255,0.1);">' +
        '<button id="fm-back" title="Back" style="background:none;border:1px solid #181848;color:#9999cc;padding:4px 8px;border-radius:2px;cursor:pointer;font-size:12px;">◀</button>' +
        '<button id="fm-forward" title="Forward" style="background:none;border:1px solid #181848;color:#9999cc;padding:4px 8px;border-radius:2px;cursor:pointer;font-size:12px;">▶</button>' +
        '<button id="fm-up" title="Up" style="background:none;border:1px solid #181848;color:#9999cc;padding:4px 8px;border-radius:2px;cursor:pointer;font-size:12px;">▲</button>' +
        '<button id="fm-refresh" title="Refresh" style="background:none;border:1px solid #181848;color:#9999cc;padding:4px 8px;border-radius:2px;cursor:pointer;font-size:12px;">↻</button>' +
        '<div style="flex:1;display:flex;align-items:center;gap:0;">' +
          '<input id="fm-address" type="text" value="' + esc(currentPath) + '" ' +
            'style="flex:1;background:#050510;border:1px solid #181848;color:#00f0ff;padding:4px 8px;border-radius:2px;font-family:var(--font-mono,monospace);font-size:12px;outline:none;" />' +
        '</div>' +
      '</div>' +
      /* Breadcrumb */
      '<div id="fm-breadcrumb" style="padding:6px 12px;background:#050510;border-bottom:1px solid rgba(0,240,255,0.05);"></div>' +
      /* Main content */
      '<div style="flex:1;display:flex;overflow:hidden;">' +
        /* Sidebar */
        '<div id="fm-sidebar" style="width:180px;min-width:180px;background:#0a0a1a;border-right:1px solid rgba(0,240,255,0.1);padding:8px 0;overflow-y:auto;">' +
          '<div style="padding:4px 12px;color:#555580;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:4px;">Favorites</div>' +
          FAVORITES.map(function(f) {
            return '<div class="fm-fav" data-path="' + esc(f.path) + '" ' +
              'style="padding:6px 12px;cursor:pointer;transition:background 0.15s;color:#9999cc;font-size:12px;">' +
              f.name + '</div>';
          }).join('') +
        '</div>' +
        /* File list */
        '<div style="flex:1;overflow-y:auto;">' +
          '<div id="fm-filelist" style="padding:0;"></div>' +
        '</div>' +
      '</div>' +
      /* Status bar */
      '<div id="fm-status" style="padding:4px 12px;background:#0a0a1a;border-top:1px solid rgba(0,240,255,0.1);color:#555580;font-size:11px;"></div>' +
    '</div>';
  }

  function renderBreadcrumb(el, path) {
    var parts = path.split('/').filter(Boolean);
    var html = '<span class="bos-breadcrumb" style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">';
    html += '<span data-path="/" style="cursor:pointer;color:#00f0ff;font-size:12px;padding:2px 6px;border-radius:2px;">/</span>';
    var accumulated = '';
    parts.forEach(function(p, i) {
      accumulated += '/' + p;
      html += '<span class="sep" style="color:#555580;padding:0 2px;">/</span>';
      html += '<span data-path="' + esc(accumulated) + '" style="cursor:pointer;color:#00f0ff;font-size:12px;padding:2px 6px;border-radius:2px;' +
        (i === parts.length - 1 ? 'color:#e8eaff;' : '') + '">' + esc(p) + '</span>';
    });
    html += '</span>';
    el.innerHTML = html;
  }

  function renderFileList(container, entries, statusEl) {
    var sorted = entries.slice().sort(function(a, b) {
if (a.type === 'dir' && b.type !== 'dir') return -1;
if (a.type !== 'dir' && b.type === 'dir') return 1;
      var cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'size') cmp = (a.size||0) - (b.size||0);
      else if (sortBy === 'type') cmp = (a.type||'').localeCompare(b.type||'');
      else if (sortBy === 'modified') cmp = (a.modified||'').localeCompare(b.modified||'');
      return sortAsc ? cmp : -cmp;
    });

    var html = '<table style="width:100%;border-collapse:collapse;font-size:12px;">';
    html += '<thead><tr style="background:#0a0a1a;border-bottom:1px solid rgba(0,240,255,0.1);">';
    var cols = [
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'size', label: 'Size' },
      { key: 'modified', label: 'Modified' }
    ];
    cols.forEach(function(c) {
      var arrow = sortBy === c.key ? (sortAsc ? ' ▲' : ' ▼') : '';
      html += '<th class="fm-col-header" data-sort="' + c.key + '" ' +
        'style="text-align:left;padding:8px 12px;color:#555580;font-weight:normal;cursor:pointer;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;user-select:none;white-space:nowrap;">' +
        c.label + arrow + '</th>';
    });
    html += '</tr></thead><tbody>';

    if (entries.length === 0) {
      html += '<tr><td colspan="4" style="padding:24px;text-align:center;color:#555580;">Empty directory</td></tr>';
    }

    sorted.forEach(function(entry) {
      html += '<tr class="fm-file-row" data-name="' + esc(entry.name) + '" data-type="' + esc(entry.type) + '" ' +
        'style="cursor:pointer;transition:background 0.15s;border-bottom:1px solid rgba(0,240,255,0.03);">' +
        '<td style="padding:6px 12px;color:#e8eaff;white-space:nowrap;">' + fileIcon(entry.name, entry.type) + ' ' + esc(entry.name) + '</td>' +
        '<td style="padding:6px 12px;color:#9999cc;">' + esc(entry.type || '-') + '</td>' +
        '<td style="padding:6px 12px;color:#9999cc;">' + formatSize(entry.size) + '</td>' +
        '<td style="padding:6px 12px;color:#555580;">' + formatDate(entry.modified) + '</td>' +
      '</tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;
    if (statusEl) {
      var dirs = entries.filter(function(e) { return e.type === 'dir'; }).length;
      var files = entries.length - dirs;
      statusEl.textContent = dirs + ' folder' + (dirs !== 1 ? 's' : '') + ', ' + files + ' file' + (files !== 1 ? 's' : '');
    }
  }

  function navigate(path, win, skipHistory) {
    if (!skipHistory) {
      pathHistory = pathHistory.slice(0, historyIndex + 1);
      pathHistory.push(path);
      historyIndex = pathHistory.length - 1;
    }
    currentPath = path;

    var addressInput = win.querySelector('#fm-address');
    var breadcrumbEl = win.querySelector('#fm-breadcrumb');
    var fileListEl = win.querySelector('#fm-filelist');
    var statusEl = win.querySelector('#fm-status');

    if (addressInput) addressInput.value = path;
    renderBreadcrumb(breadcrumbEl, path);

    var favs = win.querySelectorAll('.fm-fav');
    favs.forEach(function(f) {
      f.style.background = f.dataset.path === path ? 'rgba(0,240,255,0.08)' : 'transparent';
      f.style.color = f.dataset.path === path ? '#00f0ff' : '#9999cc';
    });

    fileListEl.innerHTML = '<div style="padding:24px;text-align:center;color:#555580;">Loading...</div>';

    API.listFiles(path).then(function(data) {
      if (data.error) {
        fileListEl.innerHTML = '<div style="padding:24px;text-align:center;color:#ff3355;">' + esc(data.error) + '</div>';
        if (statusEl) statusEl.textContent = 'Error';
        return;
      }
      renderFileList(fileListEl, data.entries || [], statusEl);
    }).catch(function(err) {
      fileListEl.innerHTML = '<div style="padding:24px;text-align:center;color:#ff3355;">Connection error: ' + esc(err.message || 'Backend offline') + '</div>';
      if (statusEl) statusEl.textContent = 'Error';
    });
  }

  function showFileContent(win, filePath) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;inset:0;background:rgba(5,5,16,0.92);z-index:10;display:flex;flex-direction:column;overflow:hidden;';

    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#0a0a1a;border-bottom:1px solid rgba(0,240,255,0.1);';
    bar.innerHTML = '<span style="color:#00f0ff;font-size:12px;">' + esc(filePath.split('/').pop()) + '</span>' +
      '<button id="fm-close-viewer" style="background:none;border:1px solid #181848;color:#ff3355;padding:4px 8px;border-radius:2px;cursor:pointer;font-size:12px;">✕ Close</button>';

    var body = document.createElement('div');
    body.style.cssText = 'flex:1;overflow:auto;padding:12px 16px;font-family:var(--font-mono,monospace);font-size:12px;line-height:1.7;color:#e8eaff;white-space:pre-wrap;word-break:break-all;';
    body.textContent = 'Loading...';

    overlay.appendChild(bar);
    overlay.appendChild(body);
    win.style.position = 'relative';
    win.appendChild(overlay);

    overlay.querySelector('#fm-close-viewer').addEventListener('click', function() {
      overlay.remove();
    });

    API.readFile(filePath).then(function(data) {
      if (data.error) {
        body.textContent = data.error;
        body.style.color = '#ff3355';
      } else {
        body.textContent = data.content || '(empty file)';
      }
    }).catch(function(err) {
      body.textContent = 'Error reading file: ' + (err.message || 'Unknown error');
      body.style.color = '#ff3355';
    });
  }

  function setupEvents(win) {
    navigate(currentPath, win);

    win.querySelector('#fm-back').addEventListener('click', function() {
      if (historyIndex > 0) {
        historyIndex--;
        navigate(pathHistory[historyIndex], win, true);
      }
    });

    win.querySelector('#fm-forward').addEventListener('click', function() {
      if (historyIndex < pathHistory.length - 1) {
        historyIndex++;
        currentPath = pathHistory[historyIndex];
        navigate(currentPath, win);
      }
    });

    win.querySelector('#fm-up').addEventListener('click', function() {
      var parts = currentPath.split('/').filter(Boolean);
      if (parts.length > 0) {
        parts.pop();
        navigate('/' + parts.join('/') || '/', win);
      }
    });

    win.querySelector('#fm-refresh').addEventListener('click', function() {
      navigate(currentPath, win);
    });

    win.querySelector('#fm-address').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        navigate(this.value.trim(), win);
      }
    });

    win.querySelector('#fm-breadcrumb').addEventListener('click', function(e) {
      var target = e.target;
      if (target.dataset && target.dataset.path) {
        navigate(target.dataset.path, win);
      }
    });

    win.querySelector('#fm-sidebar').addEventListener('click', function(e) {
      var fav = e.target.closest('.fm-fav');
      if (fav && fav.dataset.path) {
        navigate(fav.dataset.path, win);
      }
    });

    win.querySelector('#fm-filelist').addEventListener('click', function(e) {
      var header = e.target.closest('.fm-col-header');
      if (header) {
        var sort = header.dataset.sort;
        if (sortBy === sort) { sortAsc = !sortAsc; } else { sortBy = sort; sortAsc = true; }
        navigate(currentPath, win);
        return;
      }
      var row = e.target.closest('.fm-file-row');
      if (row) {
        var name = row.dataset.name;
        var type = row.dataset.type;
        if (type === 'dir') {
          var newPath = currentPath === '/' ? '/' + name : currentPath + '/' + name;
          navigate(newPath, win);
        } else {
          var filePath = currentPath === '/' ? '/' + name : currentPath + '/' + name;
          showFileContent(win, filePath);
        }
      }
    });

    win.querySelector('#fm-filelist').addEventListener('mouseover', function(e) {
      var row = e.target.closest('.fm-file-row');
      if (row) row.style.background = 'rgba(0,240,255,0.04)';
    });
    win.querySelector('#fm-filelist').addEventListener('mouseout', function(e) {
      var row = e.target.closest('.fm-file-row');
      if (row) row.style.background = '';
    });
  }

  function launch() {
    var win = BOS.createWindow({
      title: 'File Manager',
      icon: '📁',
      width: 750,
      height: 480,
      content: createUI(),
      onClose: function() { pathHistory = ['/home']; historyIndex = 0; currentPath = '/home'; }
    });
    setupEvents(win);
  }

  BOS.registerApp({
    id: 'files',
    name: 'File Manager',
    icon: '📁',
    category: 'system',
    launch: launch
  });
})();


// ═══════════════════════════════════════════════════════════════
// APP 3 — AI CHAT
// ═══════════════════════════════════════════════════════════════
(function() {
  var chatHistory = [];
  var isThinking = false;

  function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  }

  function timestamp() {
    var d = new Date();
    var h = String(d.getHours()).padStart(2, '0');
    var m = String(d.getMinutes()).padStart(2, '0');
    return h + ':' + m;
  }

  function createUI() {
    return '<div class="bos-app" style="display:flex;flex-direction:column;height:100%;background:#050510;color:#e8eaff;font-family:var(--font-mono,monospace);font-size:13px;overflow:hidden;">' +
      /* Header */
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 16px;background:#0a0a1a;border-bottom:1px solid rgba(0,240,255,0.1);">' +
        '<span style="color:#ff00ff;font-size:13px;">🤖 B-OS AI Chat</span>' +
        '<button id="ai-new" style="background:none;border:1px solid #181848;color:#9999cc;padding:4px 10px;border-radius:2px;cursor:pointer;font-size:11px;font-family:var(--font-mono,monospace);">New Chat</button>' +
      '</div>' +
      /* Messages */
      '<div id="ai-messages" style="flex:1;overflow-y:auto;padding:16px;"></div>' +
      /* Input */
      '<div style="padding:12px 16px;background:#0a0a1a;border-top:1px solid rgba(0,240,255,0.1);display:flex;gap:8px;">' +
        '<input id="ai-input" type="text" placeholder="Type a message..." ' +
          'style="flex:1;background:#050510;border:1px solid #181848;color:#e8eaff;padding:8px 12px;border-radius:2px;font-family:var(--font-mono,monospace);font-size:13px;outline:none;" />' +
        '<button id="ai-send" style="background:#00f0ff;color:#050510;border:none;padding:8px 16px;border-radius:2px;cursor:pointer;font-family:var(--font-mono,monospace);font-size:12px;font-weight:bold;transition:box-shadow 0.2s;">SEND</button>' +
      '</div>' +
    '</div>';
  }

  function addMessage(container, role, text) {
    var isUser = role === 'user';
    var div = document.createElement('div');
    div.style.cssText = 'margin-bottom:12px;display:flex;flex-direction:column;' + (isUser ? 'align-items:flex-end;' : 'align-items:flex-start;');

    var bubble = document.createElement('div');
    bubble.style.cssText = 'max-width:85%;padding:10px 14px;border-radius:4px;font-size:13px;line-height:1.6;' +
      (isUser
        ? 'background:rgba(0,240,255,0.08);color:#e8eaff;border:1px solid rgba(0,240,255,0.15);'
        : 'background:rgba(255,0,255,0.06);color:#e8eaff;border:1px solid rgba(255,0,255,0.12);');
    bubble.innerHTML = esc(text);

    var ts = document.createElement('div');
    ts.style.cssText = 'font-size:10px;color:#555580;margin-top:4px;padding:0 4px;';
    ts.textContent = (isUser ? 'You' : 'B-OS AI') + ' · ' + timestamp();

    div.appendChild(bubble);
    div.appendChild(ts);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function addThinking(container) {
    var div = document.createElement('div');
    div.id = 'ai-thinking';
    div.style.cssText = 'margin-bottom:12px;display:flex;align-items:flex-start;';
    div.innerHTML =
      '<div style="max-width:85%;padding:10px 14px;border-radius:4px;background:rgba(255,0,255,0.06);border:1px solid rgba(255,0,255,0.12);color:#ff00ff;font-size:13px;">' +
        '<span style="display:inline-block;width:8px;height:8px;background:#ff00ff;border-radius:50%;margin-right:6px;animation:aiPulse 1s ease-in-out infinite;vertical-align:middle;"></span>' +
        'Thinking...' +
      '</div>';

    if (!document.getElementById('ai-pulse-style')) {
      var s = document.createElement('style');
      s.id = 'ai-pulse-style';
      s.textContent = '@keyframes aiPulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.4;transform:scale(0.8);}}';
      document.head.appendChild(s);
    }

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function removeThinking() {
    var el = document.getElementById('ai-thinking');
    if (el) el.remove();
  }

  function sendMessage(container) {
    var input = container.closest('.bos-app').querySelector('#ai-input');
    var text = input.value.trim();
    if (!text || isThinking) return;

    input.value = '';
    addMessage(container, 'user', text);
    chatHistory.push({ role: 'user', content: text });

    isThinking = true;
    addThinking(container);

    API.chat(text, chatHistory).then(function(data) {
      removeThinking();
      isThinking = false;
      if (data.error) {
        addMessage(container, 'assistant', 'Error: ' + data.error);
if (data.error.indexOf('QWEN_API_KEY') !== -1 || data.error.indexOf('key') !== -1) {
            addMessage(container, 'assistant', '💡 QWEN API key not set. Get a free key at dashscope.console.aliyun.com, then run: export QWEN_API_KEY=your_key_on_server');
        }
      } else {
        addMessage(container, 'assistant', data.reply || '(no response)');
        chatHistory.push({ role: 'assistant', content: data.reply || '' });
      }
    }).catch(function(err) {
      removeThinking();
      isThinking = false;
      addMessage(container, 'assistant', '⚠ Could not reach the AI backend. Is the server running on localhost:8765?');
    });
  }

  function setupEvents(win) {
    var messagesEl = win.querySelector('#ai-messages');
    var inputEl = win.querySelector('#ai-input');
    var sendBtn = win.querySelector('#ai-send');

    addMessage(messagesEl, 'assistant', 'Hello! I\'m B-OS AI, powered by QWEN. How can I help you today?');

    sendBtn.addEventListener('click', function() { sendMessage(messagesEl); });
    inputEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(messagesEl);
      }
    });
    sendBtn.addEventListener('mouseover', function() {
      this.style.boxShadow = '0 0 16px rgba(0,240,255,0.4)';
    });
    sendBtn.addEventListener('mouseout', function() {
      this.style.boxShadow = 'none';
    });

    win.querySelector('#ai-new').addEventListener('click', function() {
      chatHistory = [];
      messagesEl.innerHTML = '';
      addMessage(messagesEl, 'assistant', 'Chat cleared. How can I help you?');
    });
  }

  function launch() {
    var win = BOS.createWindow({
      title: 'AI Chat',
      icon: '🤖',
      width: 600,
      height: 500,
      content: createUI(),
      onClose: function() { chatHistory = []; isThinking = false; }
    });
    setupEvents(win);
  }

  BOS.registerApp({
    id: 'aichat',
    name: 'AI Chat',
    icon: '🤖',
    category: 'ai',
    launch: launch
  });
})();


// ═══════════════════════════════════════════════════════════════
// APP 4 — BROWSER
// ═══════════════════════════════════════════════════════════════
(function() {
  function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function createUI() {
    return '<div class="bos-app" style="display:flex;flex-direction:column;height:100%;background:#050510;color:#e8eaff;font-family:var(--font-mono,monospace);font-size:12px;overflow:hidden;">' +
      '<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:#0a0a1a;border-bottom:1px solid rgba(0,240,255,0.1);flex-wrap:wrap;">' +
        '<input id="br-url" type="text" placeholder="Enter URL or search..." ' +
          'style="flex:1;min-width:200px;background:#050510;border:1px solid #181848;color:#00f0ff;padding:4px 10px;border-radius:2px;font-family:var(--font-mono,monospace);font-size:12px;outline:none;" />' +
        '<button id="br-go" style="background:#00f0ff;color:#050510;border:none;padding:4px 12px;border-radius:2px;cursor:pointer;font-weight:bold;font-size:12px;">Open</button>' +
      '</div>' +
      '<div style="display:flex;gap:6px;padding:6px 10px;background:#050510;border-bottom:1px solid rgba(0,240,255,0.05);flex-wrap:wrap;">' +
        '<span class="br-quick" data-url="https://www.google.com" style="cursor:pointer;color:#9999cc;font-size:11px;padding:4px 12px;border:1px solid #181848;border-radius:2px;transition:all 0.2s;">Google</span>' +
        '<span class="br-quick" data-url="https://www.bing.com" style="cursor:pointer;color:#9999cc;font-size:11px;padding:4px 12px;border:1px solid #181848;border-radius:2px;transition:all 0.2s;">Bing</span>' +
        '<span class="br-quick" data-url="https://duckduckgo.com" style="cursor:pointer;color:#9999cc;font-size:11px;padding:4px 12px;border:1px solid #181848;border-radius:2px;transition:all 0.2s;">DuckDuckGo</span>' +
        '<span class="br-quick" data-url="https://github.com" style="cursor:pointer;color:#9999cc;font-size:11px;padding:4px 12px;border:1px solid #181848;border-radius:2px;transition:all 0.2s;">GitHub</span>' +
      '</div>' +
      '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;text-align:center;">' +
        '<div style="font-size:48px;margin-bottom:16px;opacity:0.3;">🌎</div>' +
        '<div style="color:#9999cc;font-size:13px;margin-bottom:8px;">B-OS Browser</div>' +
        '<div style="color:#555580;font-size:11px;max-width:400px;line-height:1.6;">' +
          'Type a URL or search query above and press Enter.<br>' +
          'Sites open in your real browser for full compatibility.<br><br>' +
          '<span style="color:#00f0ff;">Quick links</span> above open popular sites instantly.' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function openURL(url) {
    if (!url) return;
    if (!/^https?:\/\//.test(url)) {
      if (url.includes('.') && !url.includes(' ')) url = 'https://' + url;
      else url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
    }
    window.open(url, '_blank');
  }

  function setupEvents(win) {
    win.querySelector('#br-go').addEventListener('click', function() {
      openURL(win.querySelector('#br-url').value.trim());
    });
    win.querySelector('#br-url').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') openURL(this.value.trim());
    });
    win.querySelectorAll('.br-quick').forEach(function(link) {
      link.addEventListener('click', function() { openURL(this.dataset.url); });
      link.addEventListener('mouseover', function() { this.style.color = '#00f0ff'; this.style.borderColor = '#00f0ff'; });
      link.addEventListener('mouseout', function() { this.style.color = '#9999cc'; this.style.borderColor = '#181848'; });
    });
  }

  function launch() {
    var win = BOS.createWindow({
      title: 'Browser',
      icon: '🌎',
      width: 800,
      height: 550,
      content: createUI(),
      onClose: function() {}
    });
    setupEvents(win);
  }

  BOS.registerApp({
    id: 'browser',
    name: 'Browser',
    icon: '🌎',
    category: 'network',
    launch: launch
  });
})();


// ═══════════════════════════════════════════════════════════════
// APP 5 — SETTINGS
// ═══════════════════════════════════════════════════════════════
(function() {
  var THEMES = {
    windows:   { accent: '#0078d4', secondary: '#005a9e' },
    cyberpunk: { accent: '#00f0ff', secondary: '#ff00ff' },
    aurora:    { accent: '#00ff88', secondary: '#ffaa00' },
    dark:      { accent: '#9999cc', secondary: '#555580' }
  };

  function loadSettings() {
    try {
      var raw = localStorage.getItem('bos-settings');
      return raw ? JSON.parse(raw) : { theme: 'windows', fontSize: 13, wallpaper: 'particles', serverUrl: 'http://localhost:8765' };
    } catch(e) {
      return { theme: 'windows', fontSize: 13, wallpaper: 'particles', serverUrl: 'http://localhost:8765' };
    }
  }

  function saveSettings(s) {
    try { localStorage.setItem('bos-settings', JSON.stringify(s)); } catch(e) {}
  }

  function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function createUI() {
    var s = loadSettings();
    return '<div class="bos-app" style="display:flex;height:100%;background:#050510;color:#e8eaff;font-family:var(--font-mono,monospace);font-size:12px;overflow:hidden;">' +
      /* Sidebar tabs */
      '<div style="width:140px;min-width:140px;background:#0a0a1a;border-right:1px solid rgba(0,240,255,0.1);padding:12px 0;">' +
        '<div style="padding:8px 16px;color:#555580;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:8px;">Settings</div>' +
        '<div class="set-tab" data-tab="appearance" style="padding:8px 16px;cursor:pointer;color:#00f0ff;background:rgba(0,240,255,0.05);border-left:2px solid #00f0ff;">Appearance</div>' +
        '<div class="set-tab" data-tab="system" style="padding:8px 16px;cursor:pointer;color:#9999cc;border-left:2px solid transparent;">System</div>' +
        '<div class="set-tab" data-tab="ai" style="padding:8px 16px;cursor:pointer;color:#9999cc;border-left:2px solid transparent;">AI</div>' +
        '<div class="set-tab" data-tab="about" style="padding:8px 16px;cursor:pointer;color:#9999cc;border-left:2px solid transparent;">About</div>' +
      '</div>' +
      /* Content area */
      '<div id="set-content" style="flex:1;overflow-y:auto;padding:16px 20px;">' +
        buildAppearancePanel(s) +
      '</div>' +
    '</div>';
  }

  function buildAppearancePanel(s) {
    return '<div id="panel-appearance">' +
      '<div style="color:#e8eaff;font-size:14px;font-weight:bold;margin-bottom:16px;">Appearance</div>' +
      /* Theme */
      '<div style="margin-bottom:16px;">' +
        '<div style="color:#555580;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;">Theme</div>' +
        '<div style="display:flex;gap:8px;">' +
          Object.keys(THEMES).map(function(key) {
            var t = THEMES[key];
            var active = s.theme === key;
            return '<div class="set-theme-opt" data-theme="' + key + '" ' +
              'style="padding:10px 16px;border:1px solid ' + (active ? t.accent : '#181848') + ';border-radius:4px;cursor:pointer;text-align:center;transition:all 0.2s;' +
              (active ? 'background:rgba(' + hexToRgb(t.accent) + ',0.1);' : '') + '">' +
              '<div style="width:24px;height:24px;border-radius:50%;background:' + t.accent + ';margin:0 auto 6px;box-shadow:0 0 12px ' + t.accent + ';"></div>' +
              '<div style="color:' + (active ? t.accent : '#9999cc') + ';text-transform:capitalize;">' + key + '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>' +
      /* Font size */
      '<div style="margin-bottom:16px;">' +
        '<div style="color:#555580;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;">Font Size: <span id="set-fontsize-val">' + s.fontSize + 'px</span></div>' +
        '<input id="set-fontsize" type="range" min="10" max="20" value="' + s.fontSize + '" ' +
          'style="width:100%;accent-color:#00f0ff;" />' +
      '</div>' +
      /* Wallpaper */
      '<div style="margin-bottom:16px;">' +
        '<div style="color:#555580;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;">Desktop Background</div>' +
        '<div style="display:flex;gap:8px;">' +
          ['particles','grid','none'].map(function(w) {
            var active = s.wallpaper === w;
            return '<div class="set-wallpaper-opt" data-wallpaper="' + w + '" ' +
              'style="padding:8px 14px;border:1px solid ' + (active ? '#00f0ff' : '#181848') + ';border-radius:4px;cursor:pointer;color:' + (active ? '#00f0ff' : '#9999cc') + ';text-transform:capitalize;transition:all 0.2s;">' + w + '</div>';
          }).join('') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function buildSystemPanel() {
    return '<div id="panel-system">' +
      '<div style="color:#e8eaff;font-size:14px;font-weight:bold;margin-bottom:16px;">System</div>' +
      '<div id="set-health" style="margin-bottom:16px;padding:12px;border:1px solid #181848;border-radius:4px;background:#0a0a1a;">' +
        '<div style="color:#555580;margin-bottom:8px;">Checking backend status...</div>' +
      '</div>' +
      '<div style="margin-bottom:16px;">' +
        '<div style="color:#555580;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;">Server URL</div>' +
        '<input id="set-server" type="text" value="http://localhost:8765" ' +
          'style="width:100%;background:#050510;border:1px solid #181848;color:#00f0ff;padding:8px 12px;border-radius:2px;font-family:var(--font-mono,monospace);font-size:12px;outline:none;" />' +
      '</div>' +
      '<div style="color:#555580;font-size:11px;">Platform: ' + navigator.platform + '</div>' +
      '<div style="color:#555580;font-size:11px;">User Agent: ' + navigator.userAgent.substring(0, 80) + '...</div>' +
    '</div>';
  }

  function checkSystemHealth(win) {
    var el = win.querySelector('#set-health');
    if (!el) return;
    API.health().then(function(data) {
      if (!win.querySelector('#set-health')) return;
      var target = win.querySelector('#set-health');
      if (data.status === 'ok') {
        target.innerHTML =
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
            '<div style="width:8px;height:8px;border-radius:50%;background:#00ff88;box-shadow:0 0 8px #00ff88;"></div>' +
            '<span style="color:#00ff88;font-size:12px;font-weight:bold;">Backend Online</span>' +
          '</div>' +
          (data.hostname ? '<div style="color:#9999cc;font-size:11px;">Host: ' + esc(String(data.hostname)) + '</div>' : '') +
          (data.os ? '<div style="color:#9999cc;font-size:11px;">Platform: ' + esc(String(data.os)) + '</div>' : '');
      } else {
        target.innerHTML = '<div style="display:flex;align-items:center;gap:8px;">' +
          '<div style="width:8px;height:8px;border-radius:50%;background:#ff3355;box-shadow:0 0 8px #ff3355;"></div>' +
          '<span style="color:#ff3355;font-size:12px;">Backend Offline</span></div>' +
          '<div style="color:#555580;font-size:11px;margin-top:4px;">Start with: python server/main.py</div>';
      }
    }).catch(function() {
      var target = win.querySelector('#set-health');
      if (target) target.innerHTML = '<div style="display:flex;align-items:center;gap:8px;">' +
        '<div style="width:8px;height:8px;border-radius:50%;background:#ff3355;box-shadow:0 0 8px #ff3355;"></div>' +
        '<span style="color:#ff3355;font-size:12px;">Backend Offline</span></div>';
    });
  }

  function buildAIPanel() {
    var hasKey = true;
    return '<div id="panel-ai">' +
      '<div style="color:#e8eaff;font-size:14px;font-weight:bold;margin-bottom:16px;">AI Configuration</div>' +
      '<div style="margin-bottom:16px;padding:12px;border:1px solid #181848;border-radius:4px;background:#0a0a1a;">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
          '<div style="width:8px;height:8px;border-radius:50%;background:#ffaa00;box-shadow:0 0 8px #ffaa00;"></div>' +
          '<span style="color:#ffaa00;font-size:12px;">QWEN API Key: Configured server-side</span>' +
        '</div>' +
        '<div style="color:#555580;font-size:11px;line-height:1.6;">' +
          'The API key is set via the <span style="color:#00f0ff;">QWEN_API_KEY</span> environment variable on the server.<br>' +
          'Get a free key: <span style="color:#00ff88;">dashscope.console.aliyun.com</span> (2M tokens/month free)<br>' +
          'To configure: <span style="color:#00ff88;">export QWEN_API_KEY=your_key</span><br>' +
          'Then restart the backend server.' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:16px;">' +
        '<div style="color:#555580;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;">API Endpoint</div>' +
        '<div style="color:#9999cc;padding:8px 12px;border:1px solid #181848;border-radius:2px;background:#050510;">http://localhost:8765/api/ai/chat</div>' +
      '</div>' +
      '<div style="color:#555580;font-size:11px;line-height:1.6;">' +
        'Model: QWEN (via compatible API)<br>' +
        'The AI assistant sends your messages and conversation history to the backend for processing.' +
      '</div>' +
    '</div>';
  }

  function buildAboutPanel() {
    return '<div id="panel-about">' +
      '<div style="color:#e8eaff;font-size:14px;font-weight:bold;margin-bottom:16px;">About B-OS</div>' +
      '<div style="text-align:center;padding:24px 0;margin-bottom:16px;">' +
        '<div style="font-size:32px;font-weight:bold;color:#00f0ff;text-shadow:0 0 20px rgba(0,240,255,0.3);margin-bottom:4px;">B-<span style="color:#ff00ff;">OS</span></div>' +
        '<div style="color:#555580;font-size:12px;">Version 0.1.0 — Alpha</div>' +
      '</div>' +
      '<div style="color:#9999cc;font-size:12px;line-height:1.8;margin-bottom:16px;">' +
        'B-OS is a browser-based operating system simulation that reimagines what a desktop environment can be.<br><br>' +
        'Built with vanilla HTML, CSS, and JavaScript on the frontend.<br>' +
        'Python Flask backend for system commands, file access, and AI integration.' +
      '</div>' +
      '<div style="padding:12px;border:1px solid #181848;border-radius:4px;background:#0a0a1a;margin-bottom:12px;">' +
        '<div style="color:#555580;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">Links</div>' +
        '<div style="color:#00f0ff;cursor:pointer;font-size:12px;margin-bottom:4px;" onclick="window.location.href=\'../index.html\'">→ Landing Page</div>' +
        '<div style="color:#00f0ff;cursor:pointer;font-size:12px;" onclick="window.open(\'https://github.com/Chenboda01/B-OS\',\'_blank\')">→ GitHub Repository</div>' +
      '</div>' +
      '<div style="color:#555580;font-size:10px;text-align:center;margin-top:16px;">Made with passion by the B-OS team</div>' +
    '</div>';
  }

  function hexToRgb(hex) {
    hex = hex.replace('#','');
    return parseInt(hex.substring(0,2),16) + ',' + parseInt(hex.substring(2,4),16) + ',' + parseInt(hex.substring(4,6),16);
  }

  function setupEvents(win) {
    var contentEl = win.querySelector('#set-content');
    var settings = loadSettings();

    win.querySelectorAll('.set-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        var tabName = this.dataset.tab;
        win.querySelectorAll('.set-tab').forEach(function(t) {
          t.style.color = t.dataset.tab === tabName ? '#00f0ff' : '#9999cc';
          t.style.background = t.dataset.tab === tabName ? 'rgba(0,240,255,0.05)' : 'transparent';
          t.style.borderLeftColor = t.dataset.tab === tabName ? '#00f0ff' : 'transparent';
        });
        if (tabName === 'appearance') { contentEl.innerHTML = buildAppearancePanel(settings); bindAppearanceEvents(win, contentEl, settings); }
        else if (tabName === 'system') { contentEl.innerHTML = buildSystemPanel(); checkSystemHealth(win); bindSystemEvents(win, contentEl, settings); }
        else if (tabName === 'ai') contentEl.innerHTML = buildAIPanel();
        else if (tabName === 'about') contentEl.innerHTML = buildAboutPanel();
      });
    });

    bindAppearanceEvents(win, contentEl, settings);
  }

  function bindAppearanceEvents(win, contentEl, settings) {
    contentEl.querySelectorAll('.set-theme-opt').forEach(function(opt) {
      opt.addEventListener('click', function() {
        settings.theme = this.dataset.theme;
        saveSettings(settings);
        window.applyTheme(settings.theme);
        contentEl.querySelectorAll('.set-theme-opt').forEach(function(o) {
          o.style.borderColor = o.dataset.theme === settings.theme ? '#00f0ff' : '#181848';
          o.style.color = o.dataset.theme === settings.theme ? '#00f0ff' : '#9999cc';
        });
      });
    });

    var slider = contentEl.querySelector('#set-fontsize');
    if (slider) {
      slider.addEventListener('input', function() {
        settings.fontSize = parseInt(this.value);
        saveSettings(settings);
        var label = contentEl.querySelector('#set-fontsize-val');
        if (label) label.textContent = settings.fontSize + 'px';
        if (window.applyFontSize) window.applyFontSize(settings.fontSize);
        else document.documentElement.style.setProperty('--text-base', settings.fontSize + 'px');
      });
    }

    contentEl.querySelectorAll('.set-wallpaper-opt').forEach(function(opt) {
      opt.addEventListener('click', function() {
        settings.wallpaper = this.dataset.wallpaper;
        saveSettings(settings);
        applyWallpaper(settings.wallpaper);
        contentEl.querySelectorAll('.set-wallpaper-opt').forEach(function(o) {
          o.style.borderColor = o.dataset.wallpaper === settings.wallpaper ? '#00f0ff' : '#181848';
          o.style.color = o.dataset.wallpaper === settings.wallpaper ? '#00f0ff' : '#9999cc';
        });
      });
      });
    });
  }

  function bindSystemEvents(win, contentEl, settings) {
    var serverInput = contentEl.querySelector('#set-server');
    if (serverInput) {
      serverInput.value = settings.serverUrl || 'http://localhost:8765';
      serverInput.addEventListener('change', function() {
        settings.serverUrl = this.value.trim();
        saveSettings(settings);
      });
    }
  }

  function launch() {
    var win = BOS.createWindow({
      title: 'Settings',
      icon: '⚙',
      width: 600,
      height: 420,
      content: createUI(),
      onClose: function() {}
    });
    setupEvents(win);
  }

  BOS.registerApp({
    id: 'settings',
    name: 'Settings',
    icon: '⚙',
    category: 'system',
    launch: launch
  });
})();


// ═══════════════════════════════════════════════════════════════
// APP 6 — CLOCK
// ═══════════════════════════════════════════════════════════════
(function() {
  var interval = null;
  var is24h = true;

  function formatTime(d, h24) {
    var h = d.getHours();
    var m = String(d.getMinutes()).padStart(2, '0');
    var s = String(d.getSeconds()).padStart(2, '0');
    if (!h24) {
      var ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return String(h).padStart(2, '0') + ':' + m + ':' + s + ' ' + ampm;
    }
    return String(h).padStart(2, '0') + ':' + m + ':' + s;
  }

  function formatDate(d) {
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  function createUI() {
    return '<div class="bos-app" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:#050510;color:#e8eaff;font-family:var(--font-mono,monospace);overflow:hidden;position:relative;">' +
      /* Analog clock SVG */
      '<svg id="clock-analog" width="160" height="160" viewBox="0 0 160 160" style="margin-bottom:20px;">' +
        '<circle cx="80" cy="80" r="75" fill="none" stroke="#181848" stroke-width="2" />' +
        '<circle cx="80" cy="80" r="72" fill="none" stroke="#111130" stroke-width="1" />' +
        /* Hour markers */
        Array.from({length:12}, function(_, i) {
          var angle = (i * 30 - 90) * Math.PI / 180;
          var x1 = 80 + 64 * Math.cos(angle);
          var y1 = 80 + 64 * Math.sin(angle);
          var x2 = 80 + 70 * Math.cos(angle);
          var y2 = 80 + 70 * Math.sin(angle);
          return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#555580" stroke-width="2" />';
        }).join('') +
        /* Minute markers */
        Array.from({length:60}, function(_, i) {
          if (i % 5 === 0) return '';
          var angle = (i * 6 - 90) * Math.PI / 180;
          var x1 = 80 + 67 * Math.cos(angle);
          var y1 = 80 + 67 * Math.sin(angle);
          var x2 = 80 + 70 * Math.cos(angle);
          var y2 = 80 + 70 * Math.sin(angle);
          return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#181848" stroke-width="1" />';
        }).join('') +
        /* Hands */
        '<line id="clock-hour" x1="80" y1="80" x2="80" y2="40" stroke="#e8eaff" stroke-width="3" stroke-linecap="round" />' +
        '<line id="clock-min" x1="80" y1="80" x2="80" y2="25" stroke="#00f0ff" stroke-width="2" stroke-linecap="round" />' +
        '<line id="clock-sec" x1="80" y1="80" x2="80" y2="18" stroke="#ff00ff" stroke-width="1" stroke-linecap="round" />' +
        '<circle cx="80" cy="80" r="4" fill="#00f0ff" />' +
      '</svg>' +
      /* Digital time */
      '<div id="clock-digital" style="font-size:48px;font-weight:bold;letter-spacing:4px;color:#e8eaff;margin-bottom:4px;text-shadow:0 0 30px rgba(0,240,255,0.15);">' +
        '<span id="clock-hhmm">00:00</span>' +
        '<span id="clock-sec-display" style="color:#00f0ff;">:00</span>' +
        '<span id="clock-ampm" style="font-size:16px;color:#555580;margin-left:4px;"></span>' +
      '</div>' +
      /* Date */
      '<div id="clock-date" style="font-size:14px;color:#9999cc;margin-bottom:8px;"></div>' +
      /* Timezone */
      '<div id="clock-tz" style="font-size:11px;color:#555580;margin-bottom:16px;"></div>' +
      /* Toggle button */
      '<button id="clock-toggle" style="background:none;border:1px solid #181848;color:#9999cc;padding:6px 16px;border-radius:2px;cursor:pointer;font-family:var(--font-mono,monospace);font-size:11px;transition:all 0.2s;">Switch to 12h</button>' +
    '</div>';
  }

  function updateClock() {
    var now = new Date();
    var hhmmEl = document.getElementById('clock-hhmm');
    var secEl = document.getElementById('clock-sec-display');
    var ampmEl = document.getElementById('clock-ampm');
    var dateEl = document.getElementById('clock-date');
    var tzEl = document.getElementById('clock-tz');

    var h = now.getHours();
    var m = String(now.getMinutes()).padStart(2, '0');
    var s = String(now.getSeconds()).padStart(2, '0');

    if (!is24h) {
      var ampm = h >= 12 ? ' PM' : ' AM';
      var h12 = h % 12 || 12;
      if (hhmmEl) hhmmEl.textContent = String(h12).padStart(2, '0') + ':' + m;
      if (ampmEl) ampmEl.textContent = ampm;
    } else {
      if (hhmmEl) hhmmEl.textContent = String(h).padStart(2, '0') + ':' + m;
      if (ampmEl) ampmEl.textContent = '';
    }
    if (secEl) {
      secEl.textContent = ':' + s;
      secEl.style.opacity = parseInt(s) % 2 === 0 ? '1' : '0.5';
    }
    if (dateEl) dateEl.textContent = formatDate(now);
    if (tzEl) tzEl.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;

    var hourHand = document.getElementById('clock-hour');
    var minHand = document.getElementById('clock-min');
    var secHand = document.getElementById('clock-sec');
    if (hourHand && minHand && secHand) {
      var hDeg = ((h % 12) + now.getMinutes() / 60) * 30;
      var mDeg = (now.getMinutes() + now.getSeconds() / 60) * 6;
      var sDeg = now.getSeconds() * 6;
      hourHand.setAttribute('transform', 'rotate(' + hDeg + ' 80 80)');
      minHand.setAttribute('transform', 'rotate(' + mDeg + ' 80 80)');
      secHand.setAttribute('transform', 'rotate(' + sDeg + ' 80 80)');
    }
  }

  function setupEvents(win) {
    var toggleBtn = win.querySelector('#clock-toggle');
    toggleBtn.addEventListener('click', function() {
      is24h = !is24h;
      this.textContent = is24h ? 'Switch to 12h' : 'Switch to 24h';
      updateClock();
    });
    toggleBtn.addEventListener('mouseover', function() {
      this.style.borderColor = '#00f0ff';
      this.style.color = '#00f0ff';
    });
    toggleBtn.addEventListener('mouseout', function() {
      this.style.borderColor = '#181848';
      this.style.color = '#9999cc';
    });

    updateClock();
    interval = setInterval(updateClock, 1000);
  }

  function launch() {
    if (interval) clearInterval(interval);
    var win = BOS.createWindow({
      title: 'Clock',
      icon: '🕐',
      width: 400,
      height: 420,
      content: createUI(),
      onClose: function() { if (interval) { clearInterval(interval); interval = null; } }
    });
    setupEvents(win);
  }

  BOS.registerApp({
    id: 'clock',
    name: 'Clock',
    icon: '🕐',
    category: 'utility',
    launch: launch
  });
})();


// ═══════════════════════════════════════════════════════════════
// APP 7 — GAMES
// ═══════════════════════════════════════════════════════════════
(function() {
  var GAMES = [
    { name: 'Space Invaders B-OS', icon: '👾', color: '#00f0ff', desc: 'Defend the planet from alien invaders' },
    { name: 'Terminal Quest', icon: '⚔', color: '#ff00ff', desc: 'A text-based adventure through the system' },
    { name: 'Pixel Racer', icon: '🏎', color: '#00ff88', desc: 'High-speed racing in the neon grid' },
    { name: 'Code Breaker', icon: '🔐', color: '#ffaa00', desc: 'Crack the code before time runs out' }
  ];

  function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function createUI() {
    return '<div class="bos-app" style="display:flex;flex-direction:column;align-items:center;height:100%;background:#050510;color:#e8eaff;font-family:var(--font-mono,monospace);overflow-y:auto;padding:20px;">' +
      /* Header */
      '<div style="text-align:center;margin-bottom:24px;">' +
        '<div style="font-size:24px;margin-bottom:4px;">🎮</div>' +
        '<div style="font-size:16px;font-weight:bold;color:#e8eaff;margin-bottom:4px;">B-OS Games</div>' +
        '<div style="font-size:12px;color:#555580;">Games are under development. Check back soon!</div>' +
      '</div>' +
      /* Game grid */
      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;width:100%;max-width:420px;">' +
        GAMES.map(function(game, i) {
          return '<div class="game-card" ' +
            'style="background:#0a0a1a;border:1px solid #181848;border-radius:4px;padding:20px 16px;text-align:center;position:relative;overflow:hidden;cursor:not-allowed;transition:all 0.3s;opacity:0.7;">' +
            /* Abstract background glow */
            '<div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:' + game.color + ';filter:blur(40px);opacity:0.08;"></div>' +
            /* Icon */
            '<div style="font-size:32px;margin-bottom:8px;filter:blur(0.5px);">' + game.icon + '</div>' +
            /* Name */
            '<div style="font-size:13px;font-weight:bold;color:#e8eaff;margin-bottom:4px;">' + esc(game.name) + '</div>' +
            /* Description */
            '<div style="font-size:10px;color:#555580;margin-bottom:8px;line-height:1.4;">' + esc(game.desc) + '</div>' +
            /* Badge */
            '<div style="display:inline-block;padding:2px 8px;border:1px solid ' + game.color + ';border-radius:2px;color:' + game.color + ';font-size:9px;letter-spacing:0.1em;text-transform:uppercase;">Coming Q4 2026</div>' +
          '</div>';
        }).join('') +
      '</div>' +
      /* Footer note */
      '<div style="margin-top:24px;text-align:center;color:#555580;font-size:11px;">' +
        'More games coming in future updates.<br>' +
        'Suggest a game on <span style="color:#00f0ff;">GitHub</span>!' +
      '</div>' +
    '</div>';
  }

  function setupEvents(win) {
    var cards = win.querySelectorAll('.game-card');
    cards.forEach(function(card, i) {
      var color = GAMES[i].color;
      card.addEventListener('mouseover', function() {
        this.style.borderColor = color;
        this.style.opacity = '1';
        this.style.boxShadow = '0 0 20px ' + color.replace(')', ',0.15)').replace('rgb', 'rgba');
      });
      card.addEventListener('mouseout', function() {
        this.style.borderColor = '#181848';
        this.style.opacity = '0.7';
        this.style.boxShadow = 'none';
      });
    });
  }

  function launch() {
    var win = BOS.createWindow({
      title: 'Games',
      icon: '🎮',
      width: 480,
      height: 420,
      content: createUI(),
      onClose: function() {}
    });
    setupEvents(win);
  }

  BOS.registerApp({
    id: 'games',
    name: 'Games',
    icon: '🎮',
    category: 'entertainment',
    launch: launch
  });
})();
