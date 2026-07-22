// ═══════════════════════════════════════════════════════════════
// APP 1 — TERMINAL
// ═══════════════════════════════════════════════════════════════
(function() {
  var history = [];
  var historyIdx = -1;
  var currentDir = '~';
  var hostname = 'b-os';
  var username = 'b-os';
  var systemCommands = [];
  var commandCount = 0;
  var KNOWN_COMMANDS = [];

  var NEOFETCH_BANNER =
    '       _____ _____ ____  __  __ ____  _     ___\n' +
    '      / ____|__  /|___ \\|  \\/  | __ )| |   / _ \\\n' +
    '     | |      / /  / __ \\| |\\/| |  _ \\| |  | | | |\n' +
    '     | |___ / /_ / ___) | |  | | |_) | |__| |_| |\n' +
    '      \\____/____/|____/|_|  |_|____/|_____\\___/\n';

  var FAKE_ENV = {
    'HOME': '/home/b-os',
    'USER': 'b-os',
    'SHELL': '/bin/bash',
    'TERM': 'xterm-256color',
    'LANG': 'en_US.UTF-8',
    'PATH': '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
    'EDITOR': 'nano',
    'BROWSER': 'firefox',
    'DISPLAY': ':0',
    'XDG_SESSION_TYPE': 'x11',
    'HOSTNAME': 'b-os',
    'PS1': '\\u@\\h:\\w\\$ ',
    'TMPDIR': '/tmp',
    'LOGNAME': 'b-os',
    'MAIL': '/var/mail/b-os'
  };

  var MAN_PAGES = {
    'ls': 'LS(1)                     User Commands                     LS(1)\n\nNAME\n       ls - list directory contents\n\nSYNOPSIS\n       ls [OPTION]... [FILE]...\n\nDESCRIPTION\n       List information about the FILEs.\n\n       -a     do not ignore entries starting with .\n       -l     use a long listing format\n       -h     with -l, print sizes in human readable format\n       -R     list subdirectories recursively\n       -t     sort by modification time',
    'cd': 'CD(1)                     Shell Builtin                     CD(1)\n\nNAME\n       cd - change working directory\n\nSYNOPSIS\n       cd [dir]\n\nDESCRIPTION\n       Change the shell working directory to dir.\n       If dir is not supplied, HOME is used.\n       ".." moves to parent directory.',
    'cat': 'CAT(1)                    User Commands                    CAT(1)\n\nNAME\n       cat - concatenate files and print\n\nSYNOPSIS\n       cat [FILE]...\n\nDESCRIPTION\n       Concatenate FILE(s) to standard output.',
    'grep': 'GREP(1)                   User Commands                   GREP(1)\n\nNAME\n       grep - print lines that match patterns\n\nSYNOPSIS\n       grep [OPTION]... PATTERN [FILE]...\n\nDESCRIPTION\n       Search for PATTERNs in each FILE.',
    'mkdir': 'MKDIR(1)                   User Commands                   MKDIR(1)\n\nNAME\n       mkdir - make directories\n\nSYNOPSIS\n       mkdir [OPTION]... DIRECTORY...\n\nDESCRIPTION\n       Create DIRECTORY(ies), if they do not already exist.',
    'echo': 'ECHO(1)                    Shell Builtin                    ECHO(1)\n\nNAME\n       echo - display a line of text\n\nSYNOPSIS\n       echo [STRING]...\n\nDESCRIPTION\n       Echo the STRING(s) to standard output.',
    'sudo': 'SUDO(8)                   System Administration            SUDO(8)\n\nNAME\n       sudo - execute a command as another user\n\nSYNOPSIS\n       sudo [OPTION]... [COMMAND]\n\nDESCRIPTION\n       sudo allows a permitted user to execute a command\n       as the superuser or another user.',
    'man': 'MAN(1)                     User Commands                    MAN(1)\n\nNAME\n       man - an interface to the system reference manuals\n\nSYNOPSIS\n       man [OPTION]... [SECTION] PAGE...\n\nDESCRIPTION\n       man formats and displays the manual pages.',
    'which': 'WHICH(1)                   User Commands                   WHICH(1)\n\nNAME\n       which - locate a command\n\nSYNOPSIS\n       which [COMMAND]...\n\nDESCRIPTION\n       Print the full path of COMMAND(s).'
  };

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function makePromptHTML() {
    return '<span style="color:#00f0ff;">' + esc(username) + '@<span style="color:#ff00ff;">' + esc(hostname) + '</span></span>' +
      '<span style="color:#e8eaff;">:</span>' +
      '<span style="color:#00ff88;">' + esc(currentDir) + '</span>' +
      '<span style="color:#e8eaff;">$ </span>';
  }

  function makePromptText() {
    return username + '@' + hostname + ':' + currentDir + '$ ';
  }

  function createUI() {
    return '<div class="bos-app" style="display:flex;flex-direction:column;height:100%;background:#050510;overflow:hidden;">' +
      '<div id="term-output" style="flex:1;overflow-y:auto;padding:12px 16px;font-family:var(--font-mono,monospace);font-size:13px;line-height:1.7;color:#00ff88;white-space:pre-wrap;word-break:break-all;"></div>' +
      '<div style="display:flex;align-items:center;padding:0 16px 12px;background:#050510;">' +
        '<span id="term-prompt" style="font-family:var(--font-mono,monospace);font-size:13px;white-space:nowrap;user-select:none;">' + makePromptHTML() + '</span>' +
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

  function updatePrompt(outputEl) {
    var promptEl = outputEl.closest('.bos-app').querySelector('#term-prompt');
    if (promptEl) promptEl.innerHTML = makePromptHTML();
  }

  function showCommandLine(outputEl, cmd) {
    appendHTML(outputEl,
      makePromptHTML() +
      '<span style="color:#e8eaff;">' + esc(cmd) + '</span>'
    );
  }

  function sendToBackend(cmd, outputEl, cwd) {
    var realCwd = cwd || (currentDir === '~' ? '/home' : currentDir);
    API.exec(cmd, realCwd).then(function(res) {
      if (res.stdout) appendOutput(outputEl, res.stdout.replace(/\n$/, ''), '#e8eaff');
      if (res.stderr) appendOutput(outputEl, res.stderr.replace(/\n$/, ''), '#ff3355');
      if (res.exit_code && res.exit_code !== 0 && !res.stdout && !res.stderr) {
        appendOutput(outputEl, 'Exit code: ' + res.exit_code, '#ff3355');
      }
      scrollBottom(outputEl);
    }).catch(function(error) {
      appendOutput(outputEl, 'Backend offline. Built-in commands still work. Start local services with ./start-bos.sh.', '#ff3355');
      if (error && error.message) console.warn('Terminal backend request failed:', error.message);
      scrollBottom(outputEl);
    });
  }

  function handleCommand(cmd, outputEl) {
    var trimmed = cmd.trim();
    if (!trimmed) return;

    if (trimmed === '!!') {
      if (history.length === 0) {
        appendOutput(outputEl, 'bash: no previous command', '#ff3355');
        return;
      }
      trimmed = history[history.length - 1];
      appendHTML(outputEl, makePromptHTML() + '<span style="color:#e8eaff;">' + esc(trimmed) + '</span>');
    } else if (/^!(\d+)$/.test(trimmed)) {
      var n = parseInt(RegExp.$1, 10);
      if (n < 1 || n > history.length) {
        appendOutput(outputEl, 'bash: ' + n + ': event not found', '#ff3355');
        return;
      }
      trimmed = history[n - 1];
      appendHTML(outputEl, makePromptHTML() + '<span style="color:#e8eaff;">' + esc(trimmed) + '</span>');
    } else {
      showCommandLine(outputEl, trimmed);
    }

    history.push(trimmed);
    historyIdx = history.length;

    var sudoMode = false;
    var effectiveCmd = trimmed;
    if (trimmed.indexOf('sudo ') === 0) {
      sudoMode = true;
      effectiveCmd = trimmed.substring(5);
    }

    if (sudoMode) {
      appendOutput(outputEl, '[sudo] password for ' + username + ': ', '#ffaa00');
      appendOutput(outputEl, 'Nice try :) Running command anyway...', '#00ff88');
    }

    var parts = effectiveCmd.split(/\s+/);
    var cmd0 = parts[0].toLowerCase();
    var args = parts.slice(1);

    if (cmd0 === 'clear') {
      outputEl.innerHTML = '';
      return;
    }

    if (cmd0 === 'exit') {
      var win = outputEl.closest('.bos-window');
      if (win && win.querySelector('.win-close')) {
        win.querySelector('.win-close').click();
      }
      return;
    }

    if (cmd0 === 'history') {
      var h = history.map(function(c, i) { return '  ' + (i+1) + '  ' + c; }).join('\n');
      appendOutput(outputEl, h || '(empty)', '#9999cc');
      scrollBottom(outputEl);
      return;
    }

    if (cmd0 === 'help') {
      appendOutput(outputEl,
        'B-OS Terminal v2.0 — Available Commands\n' +
        '══════════════════════════════════════════════\n' +
        '  Built-in (instant):\n' +
        '    exit              Close terminal\n' +
        '    clear             Clear screen\n' +
        '    help              Show this help\n' +
        '    whoami            Current user\n' +
        '    hostname          System hostname\n' +
        '    date              Show date/time\n' +
        '    pwd               Print working directory\n' +
        '    echo <text>       Print text\n' +
        '    uname [-a]        System information\n' +
        '    uptime            System uptime\n' +
        '    neofetch          B-OS system info\n' +
        '    history           Command history\n' +
        '    !!                Repeat last command\n' +
        '    !n                Repeat command n\n' +
        '    env               Show environment\n' +
        '    which <cmd>       Find command path\n' +
        '    type <cmd>        Show command type\n' +
        '    man <cmd>         Show manual page\n' +
        '    free              Memory information\n' +
        '    df                Disk usage\n' +
        '    ps                Process list\n' +
        '    sudo <cmd>        Run as superuser (sim)\n' +
        '    pacman <args>     Package manager\n' +
        '    compgen -c        List all commands\n' +
        '  Restricted local backend:\n' +
        '    Read-only commands such as ls, cat, grep, df, free, and ps\n' +
        '    Shell operators, interpreters, redirects, and destructive commands are blocked\n' +
        '    ' + commandCount + ' backend commands currently available\n' +
        '══════════════════════════════════════════════\n' +
        '  ↑/↓ History  |  Tab Autocomplete  |  Ctrl+L Clear',
        '#9999cc'
      );
      scrollBottom(outputEl);
      return;
    }

    if (cmd0 === 'whoami') {
      appendOutput(outputEl, username, '#9999cc');
      scrollBottom(outputEl);
      return;
    }

    if (cmd0 === 'hostname') {
      appendOutput(outputEl, hostname, '#9999cc');
      scrollBottom(outputEl);
      return;
    }

    if (cmd0 === 'date') {
      appendOutput(outputEl, new Date().toString(), '#9999cc');
      scrollBottom(outputEl);
      return;
    }

    if (cmd0 === 'pwd') {
      appendOutput(outputEl, currentDir === '~' ? '/home/' + username : currentDir, '#9999cc');
      scrollBottom(outputEl);
      return;
    }

    if (cmd0 === 'echo') {
      appendOutput(outputEl, args.join(' '), '#9999cc');
      scrollBottom(outputEl);
      return;
    }

    if (cmd0 === 'uname') {
      if (args.indexOf('-a') !== -1) {
        appendOutput(outputEl, 'B-OS ' + hostname + ' 0.1.0 #1 SMP PREEMPT_DYNAMIC Web x86_64 GNU/Linux', '#9999cc');
      } else if (args.indexOf('-s') !== -1) {
        appendOutput(outputEl, 'B-OS', '#9999cc');
      } else if (args.indexOf('-r') !== -1) {
        appendOutput(outputEl, '0.1.0', '#9999cc');
      } else if (args.indexOf('-m') !== -1) {
        appendOutput(outputEl, 'x86_64', '#9999cc');
      } else {
        appendOutput(outputEl, 'B-OS', '#9999cc');
      }
      scrollBottom(outputEl);
      return;
    }

    if (cmd0 === 'uptime') {
      var upSec = Math.floor(performance.now() / 1000);
      var hrs = Math.floor(upSec / 3600);
      var mins = Math.floor((upSec % 3600) / 60);
      var upStr = ' ' + hrs + ':' + String(mins).padStart(2, '0');
      appendOutput(outputEl, ' ' + new Date().toTimeString().substring(0,5) + ' up' + upStr + ',  1 user,  load average: 0.00, 0.01, 0.05', '#9999cc');
      scrollBottom(outputEl);
      return;
    }

    if (cmd0 === 'env') {
      var envLines = Object.keys(FAKE_ENV).map(function(k) { return k + '=' + FAKE_ENV[k]; }).join('\n');
      appendOutput(outputEl, envLines, '#9999cc');
      scrollBottom(outputEl);
      return;
    }

    if (cmd0 === 'which') {
      if (args.length === 0) {
        appendOutput(outputEl, 'which: missing argument', '#ff3355');
        scrollBottom(outputEl);
        return;
      }
      var builtinCmds = ['exit','clear','help','whoami','hostname','date','pwd','echo','uname','uptime','neofetch','history','env','which','type','man','free','df','ps','sudo','pacman','compgen','cd'];
      if (builtinCmds.indexOf(args[0]) !== -1) {
        appendOutput(outputEl, args[0] + ': shell built-in command', '#00ff88');
        scrollBottom(outputEl);
        return;
      }
      API.whichCmd(args[0]).then(function(data) {
        if (data.exists && data.path) {
          appendOutput(outputEl, data.path, '#9999cc');
        } else {
          appendOutput(outputEl, args[0] + ' not found', '#ff3355');
        }
        scrollBottom(outputEl);
      });
      return;
    }

    if (cmd0 === 'type') {
      if (args.length === 0) {
        appendOutput(outputEl, 'type: missing argument', '#ff3355');
        scrollBottom(outputEl);
        return;
      }
      var builtins = ['exit','clear','help','whoami','hostname','date','pwd','echo','uname','uptime','neofetch','history','env','which','type','man','free','df','ps','sudo','pacman','compgen','cd'];
      if (builtins.indexOf(args[0]) !== -1) {
        appendOutput(outputEl, args[0] + ' is a shell builtin', '#00ff88');
      } else {
        appendOutput(outputEl, args[0] + ' is /usr/bin/' + args[0], '#9999cc');
      }
      scrollBottom(outputEl);
      return;
    }

    if (cmd0 === 'man') {
      if (args.length === 0) {
        appendOutput(outputEl, 'What manual page do you want?\nFor example, try \'man man\'.', '#9999cc');
        scrollBottom(outputEl);
        return;
      }
      var page = MAN_PAGES[args[0]];
      if (page) {
        appendOutput(outputEl, page, '#9999cc');
      } else {
        appendOutput(outputEl, 'No manual entry for ' + args[0], '#ff3355');
      }
      scrollBottom(outputEl);
      return;
    }

    if (cmd0 === 'free') {
      API.exec('free -h', currentDir === '~' ? '/home' : currentDir).then(function(res) {
        if (res.stdout) {
          appendOutput(outputEl, res.stdout.replace(/\n$/, ''), '#e8eaff');
        } else {
          appendOutput(outputEl, '              total        used        free      shared  buff/cache   available', '#9999cc');
          appendOutput(outputEl, 'Mem:          16Gi       4.2Gi       8.1Gi       256Mi       3.7Gi      11.2Gi', '#e8eaff');
          appendOutput(outputEl, 'Swap:         2.0Gi          0B       2.0Gi', '#e8eaff');
        }
        scrollBottom(outputEl);
      });
      return;
    }

    if (cmd0 === 'df') {
      API.exec('df -h', currentDir === '~' ? '/home' : currentDir).then(function(res) {
        if (res.stdout) {
          appendOutput(outputEl, res.stdout.replace(/\n$/, ''), '#e8eaff');
        } else {
          appendOutput(outputEl, 'Filesystem      Size  Used Avail Use% Mounted on', '#9999cc');
          appendOutput(outputEl, '/dev/sda1       500G  120G  380G  24% /', '#e8eaff');
        }
        scrollBottom(outputEl);
      });
      return;
    }

    if (cmd0 === 'ps') {
      API.exec('ps aux', currentDir === '~' ? '/home' : currentDir).then(function(res) {
        if (res.stdout) {
          appendOutput(outputEl, res.stdout.replace(/\n$/, ''), '#e8eaff');
        } else {
          appendOutput(outputEl, 'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND', '#9999cc');
          appendOutput(outputEl, username + '       1  0.0  0.1  16892  3920 ?        Ss   00:00   0:02 /bin/bash', '#e8eaff');
        }
        scrollBottom(outputEl);
      });
      return;
    }

    if (cmd0 === 'top' || cmd0 === 'htop') {
      sendToBackend(trimmed, outputEl);
      return;
    }

    if (cmd0 === 'cd') {
      var realCwd = currentDir === '~' ? '/home' : currentDir;
      API.exec(trimmed, realCwd).then(function(res) {
        if (res.exit_code === 0) {
          if (args.length === 0 || args[0] === '~') {
            currentDir = '~';
          } else {
            var newPath = args[0];
            if (!newPath.startsWith('/') && newPath !== '~') {
              newPath = (currentDir === '~' ? '/home' : currentDir) + '/' + newPath;
            }
            var pathParts = newPath.split('/').filter(function(p) { return p && p !== '.'; });
            var resolved = [];
            for (var i = 0; i < pathParts.length; i++) {
              if (pathParts[i] === '..') { resolved.pop(); }
              else { resolved.push(pathParts[i]); }
            }
            currentDir = '/' + resolved.join('/');
            if (currentDir === '/home') currentDir = '~';
          }
          updatePrompt(outputEl);
        } else {
          appendOutput(outputEl, 'cd: ' + (res.stderr || 'No such directory'), '#ff3355');
        }
        scrollBottom(outputEl);
      }).catch(function() {
        appendOutput(outputEl, 'cd: backend offline', '#ff3355');
      });
      return;
    }

    if (cmd0 === 'neofetch') {
      var upSec2 = Math.floor(performance.now() / 1000);
      var memStr = (performance && performance.memory)
        ? Math.round(performance.memory.usedJSHeapSize/1048576) + 'MB / ' + Math.round(performance.memory.jsHeapSizeLimit/1048576) + 'MB'
        : 'N/A';

      appendHTML(outputEl,
        '<div style="display:flex;gap:16px;align-items:flex-start;">' +
          '<pre style="margin:0;color:#00f0ff;font-size:12px;line-height:1.4;">' + esc(NEOFETCH_BANNER) + '</pre>' +
          '<div style="font-size:12px;line-height:1.7;color:#9999cc;">' +
            '<span style="color:#e8eaff;font-weight:bold;">' + esc(username) + '@' + esc(hostname) + '</span><br>' +
            '──────────────<br>' +
            '<span style="color:#555580;">OS:</span>        B-OS v0.1.0<br>' +
            '<span style="color:#555580;">Shell:</span>     bsh 2.0<br>' +
            '<span style="color:#555580;">Desktop:</span>   BDE (Browser Desktop Environment)<br>' +
            '<span style="color:#555580;">Terminal:</span>  b-term v2.0<br>' +
            '<span style="color:#555580;">CPU:</span>       Web Runtime Engine<br>' +
            '<span style="color:#555580;">Memory:</span>    ' + memStr + '<br>' +
            '<span style="color:#555580;">Commands:</span>  ' + commandCount + ' (system)<br>' +
            '<span style="color:#555580;">Uptime:</span>    ' + upSec2 + 's<br><br>' +
            '<span style="color:#00f0ff;">██</span> <span style="color:#ff00ff;">██</span> <span style="color:#00ff88;">██</span> <span style="color:#ffaa00;">██</span> <span style="color:#ff3355;">██</span> <span style="color:#e8eaff;">██</span>' +
          '</div>' +
        '</div>'
      );
      scrollBottom(outputEl);
      return;
    }

    if (cmd0 === 'pacman') {
      var msg;
      if (args.length > 0 && args[0] === '-S') {
        msg = 'B-OS package manager v1.0\n:: Resolving dependencies...\n:: Looking for conflicting packages...\n:: There is nothing to do. All packages are up to date.';
      } else if (args.length > 0 && args[0] === '-Syu') {
        msg = 'B-OS package manager v1.0\n:: Synchronizing package databases...\n bos-core is up to date\n:: Starting full system upgrade...\n there is nothing to do';
      } else if (args.length > 0 && args[0] === '-Q') {
        msg = 'bos-core 0.1.0-1\nbos-terminal 0.2.0-1\nbos-desktop 0.1.0-1';
      } else if (args.length === 0) {
        msg = 'B-OS package manager v1.0\nUsage: pacman <operation> [...]\nOperations:\n  -S     Sync packages\n  -Syu   Full upgrade\n  -Q     List installed packages';
      } else {
        msg = 'B-OS package manager v1.0\n:: There is nothing to do.';
      }
      appendOutput(outputEl, msg, '#00f0ff');
      scrollBottom(outputEl);
      return;
    }

    if (cmd0 === 'compgen') {
      if (args.indexOf('-c') !== -1) {
        if (systemCommands.length > 0) {
          appendOutput(outputEl, systemCommands.join('\n'), '#9999cc');
        } else {
          appendOutput(outputEl, 'Backend offline. Command discovery is unavailable; built-in commands still work.', '#ff3355');
        }
      } else {
        sendToBackend(trimmed, outputEl);
      }
      scrollBottom(outputEl);
      return;
    }

    sendToBackend(effectiveCmd, outputEl);
  }

  function setupEvents(win) {
    var outputEl = win.querySelector('#term-output');
    var inputEl = win.querySelector('#term-input');
    if (!outputEl || !inputEl) return;

    appendHTML(outputEl,
      '<div style="color:#00f0ff;margin-bottom:4px;">╔════════════════════════════════════════════╗</div>' +
      '<div style="color:#00f0ff;">║      <span style="color:#e8eaff;font-weight:bold;">B-OS Terminal v2.0</span>                        ║</div>' +
      '<div style="color:#00f0ff;">║      Type <span style="color:#00ff88;">help</span> for commands                   ║</div>' +
      '<div style="color:#00f0ff;">╚════════════════════════════════════════════╝</div>' +
      '<div style="margin-top:8px;color:#555580;">Initializing...</div>'
    );

    API.health().then(function(data) {
      if (data.status === 'ok') {
        updatePrompt(outputEl);
      }
    });

    API.fetchCommands().then(function(data) {
      if (data.commands && data.commands.length > 0) {
        systemCommands = data.commands;
        commandCount = data.count;
        KNOWN_COMMANDS = data.commands;
        var loadDiv = outputEl.querySelector('div:last-child');
        if (loadDiv) loadDiv.remove();
        appendOutput(outputEl, '✓ ' + data.count + ' system commands loaded.', '#00ff88');
        appendOutput(outputEl, '  Welcome, ' + username + '@' + hostname + '. Type help for commands.', '#555580');
      } else {
        var loadDiv2 = outputEl.querySelector('div:last-child');
        if (loadDiv2) loadDiv2.textContent = 'Backend offline. Built-in commands remain available. Run ./start-bos.sh to reconnect.';
      }
      scrollBottom(outputEl);
    }).catch(function(error) {
      var loadDiv3 = outputEl.querySelector('div:last-child');
      if (loadDiv3) loadDiv3.textContent = 'Backend offline. Built-in commands remain available. Run ./start-bos.sh to reconnect.';
      if (error && error.message) console.warn('Unable to load terminal command list:', error.message);
      scrollBottom(outputEl);
    });

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
          var allCmds = KNOWN_COMMANDS.length > 0 ? KNOWN_COMMANDS : systemCommands;
          var matches = allCmds.filter(function(c) { return c.toLowerCase().indexOf(partial) === 0; });
          if (matches.length === 1) {
            inputEl.value = matches[0] + ' ';
          } else if (matches.length > 1) {
            var display = matches.slice(0, 30).join('  ');
            if (matches.length > 30) display += '  ... (' + (matches.length - 30) + ' more)';
            appendOutput(outputEl, display, '#555580');
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
      width: 750,
      height: 480,
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
