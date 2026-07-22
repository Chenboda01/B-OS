(function() {
  'use strict';

  var desktopState = window.BOS_DesktopState.state;
  var saveDesktopState = window.BOS_DesktopState.save;

  Object.assign(window.BOS, {
    /* ── Internal: Render desktop icons from registered apps ── */
    _renderDesktopIcons: function() {
      var container = document.getElementById('desktopIcons');
      container.innerHTML = '';
      var self = this;
      var order = desktopState.iconOrder;
      var orderedApps = this._apps.slice().sort(function(a, b) {
        var ai = order.indexOf(a.id);
        var bi = order.indexOf(b.id);
        if (ai === -1) ai = Number.MAX_SAFE_INTEGER;
        if (bi === -1) bi = Number.MAX_SAFE_INTEGER;
        return ai - bi;
      });
      orderedApps.forEach(function(app) {
        var icon = document.createElement('div');
        icon.className = 'desktop-icon';
        icon.draggable = true;
        icon.dataset.appId = app.id;
        icon.innerHTML =
          '<div class="icon-glyph">' + (app.icon || '&#9632;') + '</div>' +
          '<div class="icon-label">' + self._escHtml(app.name) + '</div>';
        icon.addEventListener('click', function() {
          if (app.launch) app.launch();
        });
        icon.addEventListener('dragstart', function(e) {
          e.dataTransfer.setData('text/plain', app.id);
          e.dataTransfer.effectAllowed = 'move';
        });
        icon.addEventListener('dragover', function(e) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        });
        icon.addEventListener('drop', function(e) {
          e.preventDefault();
          var sourceId = e.dataTransfer.getData('text/plain');
          var targetId = app.id;
          if (!sourceId || sourceId === targetId) return;
          var ids = orderedApps.map(function(item) { return item.id; });
          var sourceIndex = ids.indexOf(sourceId);
          var targetIndex = ids.indexOf(targetId);
          if (sourceIndex === -1 || targetIndex === -1) return;
          ids.splice(sourceIndex, 1);
          ids.splice(targetIndex, 0, sourceId);
          desktopState.iconOrder = ids;
          saveDesktopState();
          self._renderDesktopIcons();
        });
        container.appendChild(icon);
      });
    },

    /* ── Internal: Render start menu apps ── */
    _renderStartMenu: function() {
      var container = document.getElementById('startMenuApps');
      container.innerHTML = '';
      var self = this;
      this._apps.forEach(function(app) {
        var item = document.createElement('div');
        item.className = 'start-menu-app';
        item.innerHTML =
          '<div class="sma-icon">' + (app.icon || '&#9632;') + '</div>' +
          '<div class="sma-name">' + self._escHtml(app.name) + '</div>' +
          (app.category ? '<div class="sma-cat">' + self._escHtml(app.category) + '</div>' : '');
        item.addEventListener('click', function() {
          self.closeStartMenu();
          if (app.launch) app.launch();
        });
        container.appendChild(item);
      });
    },

    /* ── Internal: Update taskbar buttons ── */
    _updateTaskbar: function() {
      var container = document.getElementById('taskbarWindows');
      container.innerHTML = '';
      var self = this;
      Object.keys(this._windows).forEach(function(id) {
        var win = self._windows[id];
        var btn = document.createElement('div');
        btn.className = 'taskbar-win-btn' + (self._focusedId === id && !win.minimized ? ' focused' : '');
        btn.innerHTML =
          '<span class="tb-icon">' + win.icon + '</span>' +
          '<span class="tb-title">' + self._escHtml(win.title) + '</span>';
        btn.addEventListener('click', function() {
          if (win.minimized) {
            self.restoreWindow(id);
          } else if (self._focusedId === id) {
            self.minimizeWindow(id);
          } else {
            self.focusWindow(id);
          }
        });
        container.appendChild(btn);
      });
    },

    /* ── Internal: Start menu toggle ── */
    toggleStartMenu: function() {
      if (this._startMenuOpen) {
        this.closeStartMenu();
      } else {
        this.openStartMenu();
      }
    },

    openStartMenu: function() {
      this._startMenuOpen = true;
      document.getElementById('startMenu').classList.add('open');
      document.getElementById('startBtn').classList.add('active');
    },

    closeStartMenu: function() {
      this._startMenuOpen = false;
      document.getElementById('startMenu').classList.remove('open');
      document.getElementById('startBtn').classList.remove('active');
    }
  });

  /* ─────────────────────────────────────────────────
     BOOT SEQUENCE
     ───────────────────────────────────────────────── */
  var bootLines = [
    { text: '', cls: '' },
    { text: '██████╗  ███████╗ ███████╗ ██████╗  ██████╗  ', cls: 'logo' },
    { text: '██╔═══╝  ██╔════╝ ██╔════╝ ██╔══██╗ ██╔════╝  ', cls: 'logo' },
    { text: '███████╗ █████╗   ███████╗ ██║  ██║ ██║  ███╗ ', cls: 'logo' },
    { text: '╚════██║ ██╔══╝   ╚════██║ ██║  ██║ ██║   ██║ ', cls: 'logo' },
    { text: '███████║ ███████╗ ███████║ ██████╔╝ ╚██████╔╝ ', cls: 'logo' },
    { text: '╚══════╝ ╚══════╝ ╚══════╝ ╚═════╝   ╚═════╝  ', cls: 'logo' },
    { text: '', cls: '' },
    { text: 'B-OS BIOS v0.1.0', cls: '' },
    { text: '─────────────────────────────────────────────', cls: 'dim' },
    { text: '', cls: '' },
    { text: 'Detecting hardware...', cls: '' },
    { text: '  CPU:     Web Runtime Engine', cls: 'dim' },
    { text: '  RAM:     ' + (navigator.deviceMemory || '?') + ' GB allocated', cls: 'dim' },
    { text: '  Display: ' + window.innerWidth + 'x' + window.innerHeight, cls: 'dim' },
    { text: '  Browser: ' + navigator.userAgent.split(') ').pop(), cls: 'dim' },
    { text: '', cls: '' },
    { text: 'Loading kernel modules..........', cls: '' },
    { text: '  [OK] Window Manager (bwm)', cls: 'ok' },
    { text: '  [OK] Virtual File System (vfs)', cls: 'ok' },
    { text: '  [OK] Terminal (bsh)', cls: 'ok' },
    { text: '  [OK] Desktop Environment (bde)', cls: 'ok' },
    { text: '', cls: '' },
      { text: 'Connecting to backend...........', cls: '' },
      { text: '  [....] API gateway check pending', cls: 'dim', id: 'bootBackendStatus' },
      { text: '', cls: '' },
    { text: 'Initializing applications.......', cls: '' },
    { text: '  [OK] App registry loaded', cls: 'ok' },
    { text: '', cls: '' },
    { text: 'All systems nominal. Welcome.', cls: '' },
    { text: '', cls: '' },
    { text: 'Launching desktop...', cls: '' },
    { text: '', cls: '' },
    { text: '> _', cls: '' }
  ];

  var bootText = document.getElementById('bootText');
  var bootProgress = document.getElementById('bootProgress');
  var bootOverlay = document.getElementById('bootOverlay');
  var bootIndex = 0;
  var totalBootTime = 2800;
  var lineInterval = totalBootTime / bootLines.length;

  function typeBootLine() {
    if (bootIndex < bootLines.length) {
      var line = bootLines[bootIndex];
      var span = document.createElement('span');
      if (line.cls) { span.className = line.cls; }
      if (line.id) { span.id = line.id; }
      span.textContent = line.text + '\n';
      bootText.appendChild(span);

      /* Keep scrolled to bottom */
      bootText.scrollTop = bootText.scrollHeight;

      bootProgress.style.width = Math.round(((bootIndex + 1) / bootLines.length) * 100) + '%';
      bootIndex++;
      setTimeout(typeBootLine, lineInterval);
    } else {
      setTimeout(function() {
        bootOverlay.classList.add('hidden');
        document.getElementById('desktop').classList.add('visible');
        document.getElementById('taskbar').classList.add('visible');
        document.getElementById('exitButton').classList.add('visible');
        try {
          initParticles();
        } catch(e) {
          console.error('Unable to initialize desktop particles:', e);
        }
        restoreSettings();
        if (typeof API !== 'undefined' && API.health) {
          API.health().then(function(r) {
            var line = document.getElementById('bootBackendStatus');
            if (!line) return;
            if (r.status === 'ok') {
              line.textContent = '  [OK] API gateway reachable';
              line.className = 'ok';
            } else {
              line.textContent = '  [WARN] Backend offline';
              line.className = 'warn';
            }
          }).catch(function() {
            var line2 = document.getElementById('bootBackendStatus');
            if (line2) { line2.textContent = '  [WARN] Backend unreachable'; line2.className = 'warn'; }
          });
        }
      }, 500);
    }
  }

  setTimeout(typeBootLine, 200);

  /* ─────────────────────────────────────────────────
     THEME / WALLPAPER / FONT — Applied from Settings
     ───────────────────────────────────────────────── */

  /* Theme definitions — used by both index.html and Settings app */
  var THEME_MAP = {
    cyberpunk: { accent: '#00f0ff', secondary: '#ff00ff' },
    aurora:    { accent: '#00ff88', secondary: '#ffaa00' },
    synthwave: { accent: '#ff00ff', secondary: '#00f0ff' },
    monochrome:{ accent: '#e8eaff', secondary: '#9999cc' }
  };

  function applyTheme(theme) {
    var root = document.documentElement;
    var normalizedTheme = theme === 'windows' ? 'cyberpunk' : theme;
    var t = THEME_MAP[normalizedTheme] || THEME_MAP.cyberpunk;
    root.dataset.theme = THEME_MAP[normalizedTheme] ? normalizedTheme : 'cyberpunk';
    root.style.setProperty('--cyan', t.accent);
    root.style.setProperty('--cyan-dim', t.accent + '66');
    root.style.setProperty('--cyan-ghost', t.accent + '18');
    root.style.setProperty('--magenta', t.secondary);
    root.style.setProperty('--magenta-dim', t.secondary + '55');
    root.style.setProperty('--magenta-ghost', t.secondary + '12');
    /* Also update accent-dependent colors */
    root.style.setProperty('--win-border-active', t.accent);
  }
  window.applyTheme = applyTheme;

  function applyWallpaper(wp) {
    var wallpaper = document.getElementById('desktopWallpaper');
    var canvas = document.getElementById('particleCanvas');
    var grid = document.getElementById('desktopGrid');
    var noise = document.getElementById('desktopNoise');
    var orb = document.getElementById('desktopOrb');

    /* Remove all wp-* classes */
    if (wallpaper) {
      wallpaper.className = '';
    }

    if (wp === 'solid-blue') {
      /* Legacy solid wallpaper preference */
      if (wallpaper) wallpaper.style.background = '';
      if (canvas) canvas.style.display = 'none';
      if (grid) grid.style.display = 'none';
      if (noise) noise.style.display = 'none';
      if (orb) orb.style.display = 'none';
    } else if (wp === 'particles') {
      if (wallpaper) { wallpaper.className = 'wp-particles'; wallpaper.style.background = ''; }
      if (canvas) canvas.style.display = '';
      if (grid) grid.style.display = '';
      if (noise) noise.style.display = '';
      if (orb) orb.style.display = '';
    } else if (wp === 'grid') {
      if (wallpaper) { wallpaper.className = 'wp-grid'; wallpaper.style.background = ''; }
      if (canvas) canvas.style.display = 'none';
      if (grid) grid.style.display = '';
      if (noise) noise.style.display = 'none';
      if (orb) orb.style.display = 'none';
    } else {
      /* 'none' or unknown */
      if (wallpaper) { wallpaper.className = 'wp-none'; wallpaper.style.background = ''; }
      if (canvas) canvas.style.display = 'none';
      if (grid) grid.style.display = 'none';
      if (noise) noise.style.display = 'none';
      if (orb) orb.style.display = 'none';
    }
  }
  window.applyWallpaper = applyWallpaper;

  function applyFontSize(size) {
    document.documentElement.style.setProperty('--text-base', size + 'px');
    /* Propagate to all existing app windows and their content */
    document.querySelectorAll('.bos-app, .win-body').forEach(function(el) {
      el.style.fontSize = size + 'px';
    });
  }
  window.applyFontSize = applyFontSize;

  function restoreSettings() {
    try {
      var raw = localStorage.getItem('bos-settings');
      if (!raw) {
        applyTheme('cyberpunk');
        applyWallpaper('particles');
        return;
      }
      var s = JSON.parse(raw);
      if (s.theme === 'windows') {
        s.theme = 'cyberpunk';
        localStorage.setItem('bos-settings', JSON.stringify(s));
      }
      applyTheme(s.theme || 'cyberpunk');
      if (s.wallpaper) applyWallpaper(s.wallpaper);
      if (s.fontSize) applyFontSize(s.fontSize);
    } catch(e) {
      console.warn('Unable to restore B-OS settings:', e);
      applyTheme('cyberpunk');
      applyWallpaper('particles');
    }
  }

  function updateFullscreenLabel() {
    var item = document.getElementById('enterFullscreen');
    if (!item) return;
    item.textContent = document.fullscreenElement ? '⛶ Exit Full Screen' : '⛶ Full Screen';
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(function(err) {
          console.warn('Unable to exit fullscreen:', err);
        });
      }
      return;
    }

    var request = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
    if (!request) {
      showToast('Full Screen', 'This browser does not support fullscreen mode.');
      return;
    }

    try {
      var result = request.call(document.documentElement);
      if (result && typeof result.catch === 'function') {
        result.catch(function(err) {
          console.warn('Fullscreen failed:', err);
          showToast('Full Screen', 'The browser blocked fullscreen mode.');
        });
      }
    } catch (err) {
      console.warn('Fullscreen failed:', err);
      showToast('Full Screen', 'The browser blocked fullscreen mode.');
    }
  }

  document.addEventListener('fullscreenchange', updateFullscreenLabel);

  /* ─────────────────────────────────────────────────
     PARTICLE CANVAS
     ───────────────────────────────────────────────── */
  var particlesRunning = true;
  function initParticles() {
    var canvas = document.getElementById('particleCanvas');
    var ctx = canvas.getContext('2d');
    var particles = [];
    var PARTICLE_COUNT = 50;
    var W, H;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight - 48;
    }

    resize();
    window.addEventListener('resize', resize);

    for (var i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.4 + 0.1,
        color: Math.random() > 0.7 ? '#ff00ff' : '#00f0ff'
      });
    }

    function draw() {
      requestAnimationFrame(draw);
      if (!particlesRunning) return;
      if (document.hidden) return;
      if (canvas.style.display === 'none') return;
      ctx.clearRect(0, 0, W, H);
      particles.forEach(function(p) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      /* Draw faint connecting lines between nearby particles */
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = '#00f0ff';
            ctx.globalAlpha = 0.04 * (1 - dist / 120);
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    draw();
  }

  /* ─────────────────────────────────────────────────
     CLOCK
     ───────────────────────────────────────────────── */
  var clockEl = document.getElementById('trayClock');
  function updateClock() {
    var now = new Date();
    var h = String(now.getHours()).padStart(2, '0');
    var m = String(now.getMinutes()).padStart(2, '0');
    var s = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = h + ':' + m + ':' + s;
  }
  updateClock();
  setInterval(updateClock, 1000);

  /* ─────────────────────────────────────────────────
     BACKEND STATUS POLLING
     ───────────────────────────────────────────────── */
  var backendDot = document.getElementById('backendDot');
  var backendLabel = document.getElementById('backendLabel');
  var backendTooltip = document.getElementById('backendTooltip');
  var previousBackendOnline = null;

  function updateBackendState(online, detail) {
    backendDot.classList.toggle('online', online);
    backendLabel.textContent = online ? 'online' : 'offline';
    backendTooltip.textContent = online
      ? 'Backend: Connected'
      : 'Backend: Offline — desktop remains available. Run ./start-bos.sh; reconnecting automatically.';
    window.dispatchEvent(new CustomEvent('bos-backend-status', {
      detail: { online: online, message: detail || '' }
    }));
    if (previousBackendOnline !== null && previousBackendOnline !== online && typeof window.showToast === 'function') {
      window.showToast(
        online ? 'Backend Connected' : 'Backend Offline',
        online ? 'Local services are available again.' : 'Desktop apps remain available. Run ./start-bos.sh to restore local services.'
      );
    }
    previousBackendOnline = online;
  }

  function pollBackend() {
    BOS.getBackendStatus().then(function(res) {
      updateBackendState(Boolean(res && res.status === 'ok'), res && res.error);
    }).catch(function(error) {
      console.warn('Backend status check failed:', error);
      updateBackendState(false, error && error.message);
    }).finally(function() {
      setTimeout(pollBackend, 5000);
    });
  }

  pollBackend();

  /* ─────────────────────────────────────────────────
     START MENU
     ───────────────────────────────────────────────── */
  document.getElementById('startBtn').addEventListener('click', function(e) {
    e.stopPropagation();
    BOS.toggleStartMenu();
  });

  document.getElementById('startMenuPower').addEventListener('click', function(e) {
    e.stopPropagation();
    BOS.closeStartMenu();
    powerMenu.classList.toggle('open');
  });

  /* Close start menu on outside click — now handled in power menu click handler */

  /* ─────────────────────────────────────────────────
     EXIT BUTTON
     ───────────────────────────────────────────────── */
  var shutdownOverlay = document.getElementById('shutdownOverlay');
  var shutdownText = document.getElementById('shutdownText');
  var shutdownDetail = document.getElementById('shutdownDetail');
  var powerOnButton = document.getElementById('powerOn');

  function showPowerState(state, message, detail) {
    shutdownOverlay.dataset.state = state;
    shutdownText.textContent = message;
    shutdownDetail.textContent = detail;
    powerOnButton.classList.remove('visible');
    powerOnButton.onclick = null;
    shutdownOverlay.classList.add('active');
    shutdownOverlay.setAttribute('aria-hidden', 'false');
  }

  function hidePowerState() {
    shutdownOverlay.classList.remove('active');
    shutdownOverlay.setAttribute('aria-hidden', 'true');
  }

  function setPowerAction(label, handler) {
    powerOnButton.textContent = label;
    powerOnButton.onclick = handler;
    powerOnButton.classList.add('visible');
  }

  document.getElementById('exitButton').addEventListener('click', function() {
    document.getElementById('confirmOverlay').classList.add('active');
  });

  document.getElementById('confirmYes').addEventListener('click', function() {
    document.getElementById('confirmOverlay').classList.remove('active');
    window.close();

    setTimeout(function() {
      if (window.closed) return;
      showPowerState('exit', 'Close B-OS to return to Manjaro', 'This browser blocked automatic window closing. Close this app window or tab to return to your host desktop.');
      setPowerAction('RETURN TO B-OS', hidePowerState);
    }, 250);
  });

  document.getElementById('confirmNo').addEventListener('click', function() {
    document.getElementById('confirmOverlay').classList.remove('active');
  });

  document.getElementById('confirmOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
      this.classList.remove('active');
    }
  });

  /* ─────────────────────────────────────────────────
     TASKBAR SEARCH
     ───────────────────────────────────────────────── */
  var searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', function() {
    var q = this.value.toLowerCase().trim();
    var apps = document.querySelectorAll('.desktop-icon, .start-menu-app');
    apps.forEach(function(app) {
      var name = (app.querySelector('.icon-label, .sma-name') || {}).textContent || '';
      if (q && !name.toLowerCase().includes(q)) {
        app.classList.add('search-hidden');
      } else {
        app.classList.remove('search-hidden');
      }
    });
  });

  document.addEventListener('keydown', function(e) {
    if (document.getElementById('loginOverlay').classList.contains('active')) return;
    if (e.target.closest && e.target.closest('input, textarea, [contenteditable="true"]')) return;
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      searchInput.focus();
    }
  });

  /* ─────────────────────────────────────────────────
     WEATHER WIDGET
     ───────────────────────────────────────────────── */
  var weatherIcon = document.getElementById('weatherIcon');
  var weatherTemp = document.getElementById('weatherTemp');
  function getWeatherIcon(code) {
    if (code === 0) return '☀️';
    if (code === 1 || code === 2) return '🌤️';
    if (code === 3) return '☁️';
    if (code === 45 || code === 48) return '🌫️';
    if ([51,53,55,56,57].indexOf(code)>=0) return '🌦️';
    if ([61,63,65,66,67,80,81,82].indexOf(code)>=0) return '🌧️';
    if ([71,73,75,77,85,86].indexOf(code)>=0) return '🌨️';
    if ([95,96,99].indexOf(code)>=0) return '⛈️';
    return '🌡️';
  }

  if (navigator.onLine) {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=40.7&longitude=-74&current_weather=true&temperature_unit=fahrenheit&timezone=auto')
      .then(function(r) { return r.json(); })
      .then(function(data) {
          if (data.current_weather) {
            var code = data.current_weather.weathercode;
            weatherIcon.textContent = getWeatherIcon(code);
            weatherTemp.textContent = Math.round(data.current_weather.temperature) + '°F';
        }
      })
      .catch(function(error) {
        console.info('Weather service unavailable:', error && error.message ? error.message : error);
      });
  }

  /* ─────────────────────────────────────────────────
     POWER MENU
     ───────────────────────────────────────────────── */
  var powerBtn = document.getElementById('trayPower');
  var powerMenu = document.getElementById('powerMenu');
  powerBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    powerMenu.classList.toggle('open');
  });
  document.addEventListener('click', function(e) {
    if (!e.target.closest('#trayPower')) powerMenu.classList.remove('open');
    if (!e.target.closest('#startMenu') && !e.target.closest('#startBtn')) {
      BOS.closeStartMenu();
    }
  });

  powerMenu.querySelectorAll('.power-item').forEach(function(item) {
    item.addEventListener('click', function() {
      var action = this.dataset.action;
      powerMenu.classList.remove('open');
      if (action === 'fullscreen') {
        toggleFullscreen();
      } else if (action === 'lock') {
        showLogin('Locked');
      } else if (action === 'sleep') {
        showPowerState('sleep', 'Entering sleep mode', 'Suspending the B-OS session and locking your workspace.');
        setTimeout(function() {
          hidePowerState();
          showLogin('Wake from sleep');
        }, 2000);
      } else if (action === 'restart') {
        showPowerState('restart', 'Restarting B-OS', 'Reloading the kernel, services, and application registry.');
        setTimeout(function() { location.reload(); }, 2000);
      } else if (action === 'shutdown') {
        showPowerState('shutdown', 'Shutting down B-OS', 'Closing services and preserving your host system session.');
        setTimeout(function() {
          document.getElementById('desktop').style.display = 'none';
          document.getElementById('taskbar').style.display = 'none';
          document.getElementById('exitButton').style.display = 'none';
          showPowerState('off', 'B-OS is powered off', 'Your host system is still running. Start B-OS again when you are ready.');
          setPowerAction('POWER ON', function() { location.reload(); });
        }, 1500);
      }
    });
  });

  /* ─────────────────────────────────────────────────
     VOLUME CONTROL
     ───────────────────────────────────────────────── */
  var volRange = document.getElementById('volRange');
  volRange.value = String(desktopState.volume);
  updateVolumeIcon(desktopState.volume);

  function updateVolumeIcon(value) {
    var icon = document.getElementById('volIcon');
    if (value === 0) icon.textContent = '🔇';
    else if (value < 33) icon.textContent = '🔈';
    else if (value < 66) icon.textContent = '🔉';
    else icon.textContent = '🔊';
  }

  volRange.addEventListener('input', function() {
    var v = parseInt(this.value);
    desktopState.volume = v;
    saveDesktopState();
    updateVolumeIcon(v);
  });

  /* ─────────────────────────────────────────────────
     CALENDAR FLYOUT
     ───────────────────────────────────────────────── */
  var calPopup = document.getElementById('calendarPopup');
  var calDate = document.getElementById('calDate');
  var calGrid = document.getElementById('calGrid');
  var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  function renderCalendar() {
    var now = new Date();
    calDate.textContent = now.toLocaleDateString('en-US', { month:'long', year:'numeric' });
    var html = days.map(function(d) { return '<div class="cal-header">'+d+'</div>'; }).join('');
    var first = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    var daysIn = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
    for (var i = 0; i < first; i++) html += '<div></div>';
    for (var d = 1; d <= daysIn; d++) {
      var cls = d === now.getDate() ? ' cal-today' : '';
      html += '<div class="'+cls+'">'+d+'</div>';
    }
    calGrid.innerHTML = html;
  }
  document.getElementById('trayClock').addEventListener('click', function(e) {
    e.stopPropagation();
    renderCalendar();
    calPopup.classList.toggle('open');
  });
  document.addEventListener('click', function(e) {
    if (!e.target.closest('#calendarPopup') && !e.target.closest('#trayClock')) {
      calPopup.classList.remove('open');
    }
  });

  /* ─────────────────────────────────────────────────
     DESKTOP RIGHT-CLICK
     ───────────────────────────────────────────────── */
  var ctxMenu = document.getElementById('desktopContextMenu');
  document.getElementById('desktop').addEventListener('contextmenu', function(e) {
    if (e.target.closest('.bos-window')) return;
    e.preventDefault();
    ctxMenu.style.display = 'block';
    ctxMenu.style.left = Math.min(e.clientX, window.innerWidth - 180) + 'px';
    ctxMenu.style.top = Math.min(e.clientY, window.innerHeight - 220) + 'px';
  });
  document.addEventListener('click', function() { ctxMenu.style.display = 'none'; });
  ctxMenu.querySelectorAll('.ctx-item').forEach(function(item) {
    item.addEventListener('click', function() {
      var a = this.dataset.action;
      if (a === 'refresh') location.reload();
      if (a === 'settings' || a === 'terminal' || a === 'files') {
        BOS._apps.forEach(function(app) {
          if (app.id === a || (a==='terminal'&&app.id==='terminal') || (a==='files'&&app.id==='files')) app.launch();
        });
      }
    });
  });

  /* ─────────────────────────────────────────────────
     ALT+TAB WINDOW SWITCHER
     ───────────────────────────────────────────────── */
  var altTabOpen = false;
  var altTabIdx = 0;
  var altTabWindows = [];
  var altTabOverlay = document.getElementById('altTabOverlay');
  var altTabContent = document.getElementById('altTabContent');
  function showAltTab() {
    var wins = Object.values(BOS._windows).sort(function(a, b) { return (b._lastFocused||0) - (a._lastFocused||0); });
    if (!wins.length) return;
    altTabWindows = wins;
    altTabOpen = true;
    altTabIdx = 0;
    altTabOverlay.classList.add('active');
    renderAltTab();
  }
  function renderAltTab() {
    altTabContent.replaceChildren();
    altTabWindows.forEach(function(w, i) {
      var item = document.createElement('div');
      item.className = 'alt-tab-item' + (i === altTabIdx ? ' selected' : '') + (w.minimized ? ' minimized' : '');
      var iconEl = document.createElement('div');
      iconEl.textContent = w.icon || '■';
      var titleEl = document.createElement('div');
      titleEl.style.fontSize = '11px';
      titleEl.textContent = w.title;
      item.appendChild(iconEl);
      item.appendChild(titleEl);
      altTabContent.appendChild(item);
    });
  }
  function hideAltTab() {
    altTabOpen = false;
    altTabOverlay.classList.remove('active');
    if (altTabWindows[altTabIdx]) {
      var w = altTabWindows[altTabIdx];
      if (w.minimized) BOS.restoreWindow(w.id);
      BOS.focusWindow(w.id);
    }
    altTabWindows = [];
  }

  /* ─────────────────────────────────────────────────
     NOTIFICATIONS
     ───────────────────────────────────────────────── */
  window.showToast = function(title, msg) {
    var container = document.getElementById('toastContainer');
    var toast = document.createElement('div');
    toast.className = 'toast';
    var h = document.createElement('strong');
    h.textContent = title;
    var b = document.createElement('span');
    b.style.cssText = 'color:#999;font-size:11px;';
    b.textContent = msg;
    toast.appendChild(h);
    toast.appendChild(document.createElement('br'));
    toast.appendChild(b);
    container.appendChild(toast);
    setTimeout(function() { toast.classList.add('out'); }, 3000);
    setTimeout(function() { toast.remove(); }, 3600);
  };

  /* ─────────────────────────────────────────────────
     KEYBOARD SHORTCUTS
     ───────────────────────────────────────────────── */
  document.addEventListener('keydown', function(e) {
    if (document.getElementById('loginOverlay').classList.contains('active')) return;
    if (e.key === 'Escape') {
      if (document.activeElement === searchInput && searchInput.value) {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
        searchInput.blur();
        return;
      }
      BOS.closeStartMenu();
      document.getElementById('confirmOverlay').classList.remove('active');
      calPopup.classList.remove('open');
      powerMenu.classList.remove('open');
    }
    if (e.altKey && e.key === 'Tab') {
      e.preventDefault();
      if (!altTabOpen) { showAltTab(); }
      else {
        altTabIdx = e.shiftKey ? (altTabIdx - 1 + altTabWindows.length) % altTabWindows.length : (altTabIdx + 1) % altTabWindows.length;
        renderAltTab();
      }
    }
    if (e.key === 'Meta' || (e.ctrlKey && e.key === 'Escape')) {
      BOS.toggleStartMenu();
    }
  });
  document.addEventListener('keyup', function(e) {
    if (e.key === 'Alt' && altTabOpen) { hideAltTab(); }
  });

  /* ─────────────────────────────────────────────────
     WINDOW SNAPPING (drag to edges)
     ───────────────────────────────────────────────── */
  document.addEventListener('mouseup', function(e) {
    setTimeout(function() {
      if (!BOS._focusedId) return;
      var id = BOS._focusedId;
      var w = BOS._windows[id];
      if (!w || w.maximized) return;
      var H = window.innerHeight - 48;
      var HW = window.innerWidth / 2;
      if (w.x <= 5 && w.y <= 5 && w.w > HW * 0.8) { w.x=0; w.y=0; w.w=HW; w.h=H; BOS._applyWindowRect(id); }
      else if (w.x + w.w >= window.innerWidth - 5 && w.y <= 5) { w.x=HW; w.y=0; w.w=HW; w.h=H; BOS._applyWindowRect(id); }
      else if (w.y <= 5 && w.h > H * 0.8) { w.x=0; w.y=0; w.w=window.innerWidth; w.h=H; BOS._applyWindowRect(id); }
    }, 100);
  });

})();
