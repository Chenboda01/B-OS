(function() {
  'use strict';

  var desktopState = window.BOS_DesktopState.state;
  var saveDesktopState = window.BOS_DesktopState.save;
  var rememberRecentApp = window.BOS_DesktopState.remember;

  Object.assign(window.BOS, {
    _saveWindowState: function(id) {
      var win = this._windows[id];
      if (!win || win.maximized) return;
      desktopState.windows[win.stateKey] = { x: win.x, y: win.y, w: win.w, h: win.h };
      saveDesktopState();
    },

    createWindow: function(opts) {
      /* opts: { title, icon, width, height, content, onClose, x, y } */
      var id = 'win_' + (this._nextId++);
      var stateKey = opts.appId || opts.title || 'Untitled';
      var savedRect = desktopState.windows[stateKey] || null;
      var w = savedRect && Number.isFinite(savedRect.w) ? savedRect.w : (opts.width || 700);
      var h = savedRect && Number.isFinite(savedRect.h) ? savedRect.h : (opts.height || 480);
      var x = opts.x != null ? opts.x : (savedRect ? savedRect.x : Math.max(40, (window.innerWidth - w) / 2 + Math.random() * 60 - 30));
      var y = opts.y != null ? opts.y : (savedRect ? savedRect.y : Math.max(20, (window.innerHeight - h - 48) / 2 + Math.random() * 40 - 20));

      /* Clamp within viewport */
      x = Math.max(0, Math.min(x, window.innerWidth - 100));
      y = Math.max(0, Math.min(y, window.innerHeight - 48 - 80));

      this._windows[id] = {
        id: id,
        stateKey: stateKey,
        title: opts.title || 'Untitled',
        icon: opts.icon || '&#9632;',
        x: x, y: y, w: w, h: h,
        minW: opts.minWidth || 320,
        minH: opts.minHeight || 200,
        content: opts.content || '',
        onClose: opts.onClose || null,
        minimized: false,
        maximized: false,
        prevRect: null
      };

      this._renderWindow(id);
      this._updateTaskbar();
      this._renderDesktopIcons();
      this.focusWindow(id);
      this.closeStartMenu();
      rememberRecentApp(stateKey, this._windows[id].title, this._windows[id].icon);

      return document.getElementById(id);
    },

    closeWindow: function(id) {
      var win = this._windows[id];
      if (!win) return;
      this._saveWindowState(id);
      var el = document.getElementById(id);
      if (el) {
        el.classList.add('closing');
        el.addEventListener('animationend', function() {
          el.remove();
        });
      }
      /* Remove document-level event listeners */
      if (win._docListeners) {
        win._docListeners.forEach(function(l) {
          document.removeEventListener(l.type, l.fn);
        });
      }
      if (win.onClose) win.onClose(id);
      delete this._windows[id];
      if (this._focusedId === id) {
        this._focusedId = null;
        var visibleWins = Object.values(this._windows).filter(function(w) { return !w.minimized; });
        if (visibleWins.length > 0) {
          var topWin = visibleWins.reduce(function(a, b) { return (b._zIdx||0) > (a._zIdx||0) ? b : a; });
          this.focusWindow(topWin.id);
        }
      }
      this._updateTaskbar();
      this._renderDesktopIcons();
    },

    focusWindow: function(id) {
      var win = this._windows[id];
      if (!win || win.minimized) return;

      this._nextZ++;
      win._zIdx = this._nextZ;
      win._lastFocused = Date.now();
      var el = document.getElementById(id);
      if (el) el.style.zIndex = this._nextZ;

      this._focusedId = id;
      document.querySelectorAll('.bos-window').forEach(function(w) {
        w.classList.remove('focused');
      });
      if (el) el.classList.add('focused');

      this._updateTaskbar();
    },

    minimizeWindow: function(id) {
      var self = this;
      var win = this._windows[id];
      if (!win) return;
      var el = document.getElementById(id);
      if (el) {
        el.classList.add('minimizing');
        el.addEventListener('animationend', function handler() {
          el.removeEventListener('animationend', handler);
          el.style.display = 'none';
          el.classList.remove('minimizing');
        });
      }
      win.minimized = true;
      if (this._focusedId === id) {
        this._focusedId = null;
        var found = false;
        Object.keys(this._windows).forEach(function(kid) {
          if (!found && kid !== id && !self._windows[kid].minimized) {
            found = true;
            self.focusWindow(kid);
          }
        });
      }
      this._updateTaskbar();
    },

    restoreWindow: function(id) {
      var win = this._windows[id];
      if (!win) return;
      var el = document.getElementById(id);
      if (el) {
        el.style.display = '';
        el.classList.add('restoring');
        el.addEventListener('animationend', function handler() {
          el.removeEventListener('animationend', handler);
          el.classList.remove('restoring');
        });
      }
      win.minimized = false;
      this.focusWindow(id);
    },

    maximizeWindow: function(id) {
      var win = this._windows[id];
      if (!win) return;
      var el = document.getElementById(id);
      if (!el) return;

      if (win.maximized) {
        if (win.prevRect) { win.x = win.prevRect.x; win.y = win.prevRect.y; win.w = win.prevRect.w; win.h = win.prevRect.h; }
        win.maximized = false;
        this._applyWindowRect(id);
        el.style.borderRadius = '';
        var maxBtn = el.querySelector('.win-max');
        if (maxBtn) { maxBtn.innerHTML = '&#9723;'; maxBtn.title = 'Maximize'; }
        this._saveWindowState(id);
      } else {
        win.prevRect = { x: win.x, y: win.y, w: win.w, h: win.h };
        win.x = 0; win.y = 0;
        win.w = window.innerWidth;
        win.h = window.innerHeight - getTaskbarHeight();
        win.maximized = true;
        this._applyWindowRect(id);
        el.style.borderRadius = '0';
        var maxBtn2 = el.querySelector('.win-max');
        if (maxBtn2) { maxBtn2.innerHTML = '&#10064;'; maxBtn2.title = 'Restore'; }
      }
    },

    _applyWindowRect: function(id) {
      var win = this._windows[id];
      var el = document.getElementById(id);
      if (!win || !el) return;
      el.style.left = win.x + 'px';
      el.style.top = win.y + 'px';
      el.style.width = win.w + 'px';
      el.style.height = win.h + 'px';
    },

    setWindowContent: function(id, node) {
      var win = this._windows[id];
      if (!win) return;
      var body = document.querySelector('#' + id + ' .win-body');
      if (!body) return;
      if (typeof node === 'string') {
        win.content = node;
        body.innerHTML = node;
      } else {
        win.content = '';
        body.replaceChildren(node);
      }
    },

    updateWindowTitle: function(id, title) {
      var win = this._windows[id];
      if (!win) return;
      win.title = title;
      var titleEl = document.querySelector('#' + id + ' .win-titlebar-title');
      if (titleEl) titleEl.textContent = title;
      this._updateTaskbar();
    },

    /* ── Internal: Render a window ── */
    _renderWindow: function(id) {
      var win = this._windows[id];
      var container = document.getElementById('windowContainer');

      var el = document.createElement('div');
      el.id = id;
      el.className = 'bos-window';
      el.style.left = win.x + 'px';
      el.style.top = win.y + 'px';
      el.style.width = win.w + 'px';
      el.style.height = win.h + 'px';
      el.style.zIndex = this._nextZ;

      el.innerHTML =
        '<div class="win-titlebar" data-win="' + id + '">' +
          '<span class="win-titlebar-icon">' + win.icon + '</span>' +
          '<span class="win-titlebar-title">' + this._escHtml(win.title) + '</span>' +
          '<div class="win-controls">' +
            '<button class="win-ctrl-btn win-min" title="Minimize">&#9472;</button>' +
            '<button class="win-ctrl-btn win-max" title="Maximize">&#9723;</button>' +
            '<button class="win-ctrl-btn win-close" title="Close">&#10005;</button>' +
          '</div>' +
        '</div>' +
        '<div class="win-body">' + win.content + '</div>' +
        '<div class="win-resize n" data-dir="n"></div>' +
        '<div class="win-resize s" data-dir="s"></div>' +
        '<div class="win-resize e" data-dir="e"></div>' +
        '<div class="win-resize w" data-dir="w"></div>' +
        '<div class="win-resize ne" data-dir="ne"></div>' +
        '<div class="win-resize nw" data-dir="nw"></div>' +
        '<div class="win-resize se" data-dir="se"></div>' +
        '<div class="win-resize sw" data-dir="sw"></div>';

      container.appendChild(el);
      this._attachWindowEvents(id, el);
    },

    /* ── Internal: Attach window drag/resize/button events ── */
    _attachWindowEvents: function(id, el) {
      var self = this;
      var win = this._windows[id];
      win._docListeners = [];

      /* Click to focus */
      el.addEventListener('mousedown', function(e) {
        self.focusWindow(id);
        self.closeStartMenu();
      });

      /* Title bar buttons */
      el.querySelector('.win-min').addEventListener('click', function(e) {
        e.stopPropagation();
        self.minimizeWindow(id);
      });

      el.querySelector('.win-max').addEventListener('click', function(e) {
        e.stopPropagation();
        self.maximizeWindow(id);
      });

      el.querySelector('.win-close').addEventListener('click', function(e) {
        e.stopPropagation();
        self.closeWindow(id);
      });

      /* Double-click title to maximize */
      el.querySelector('.win-titlebar').addEventListener('dblclick', function(e) {
        if (e.target.closest('.win-controls')) return;
        self.maximizeWindow(id);
      });

      /* Dragging */
      var titlebar = el.querySelector('.win-titlebar');
      var dragging = false;
      var dragOffsetX, dragOffsetY;

      titlebar.addEventListener('mousedown', function(e) {
        if (e.target.closest('.win-controls')) return;
        if (win.maximized) return;
        dragging = true;
        dragOffsetX = e.clientX - win.x;
        dragOffsetY = e.clientY - win.y;
        document.body.style.cursor = 'grabbing';
        e.preventDefault();
      });

      var dragMove = function(e) {
        if (!dragging) return;
        win.x = Math.max(-win.w + 100, Math.min(window.innerWidth - 100, e.clientX - dragOffsetX));
        win.y = Math.max(0, Math.min(window.innerHeight - 48 - 32, e.clientY - dragOffsetY));
        el.style.left = win.x + 'px';
        el.style.top = win.y + 'px';
      };
      var dragUp = function() {
        if (dragging) {
          dragging = false;
          document.body.style.cursor = '';
          self._saveWindowState(id);
        }
      };
      document.addEventListener('mousemove', dragMove);
      document.addEventListener('mouseup', dragUp);
      win._docListeners.push({ type: 'mousemove', fn: dragMove });
      win._docListeners.push({ type: 'mouseup', fn: dragUp });

      /* Resizing */
      var resizeHandles = el.querySelectorAll('.win-resize');
      resizeHandles.forEach(function(handle) {
        var dir = handle.getAttribute('data-dir');
        var resizing = false;
        var startX, startY, startW, startH, startLeft, startTop;

        handle.addEventListener('mousedown', function(e) {
          if (win.maximized) return;
          resizing = true;
          startX = e.clientX;
          startY = e.clientY;
          startW = win.w;
          startH = win.h;
          startLeft = win.x;
          startTop = win.y;
          e.preventDefault();
          e.stopPropagation();
        });

        var resizeMove = function(e) {
          if (!resizing) return;
          var dx = e.clientX - startX;
          var dy = e.clientY - startY;

          if (dir.indexOf('e') !== -1) {
            win.w = Math.max(win.minW, startW + dx);
          }
          if (dir.indexOf('w') !== -1) {
            var newW = Math.max(win.minW, startW - dx);
            win.x = startLeft + (startW - newW);
            win.w = newW;
          }
          if (dir.indexOf('s') !== -1) {
            win.h = Math.max(win.minH, startH + dy);
          }
          if (dir.indexOf('n') !== -1) {
            var newH = Math.max(win.minH, startH - dy);
            win.y = startTop + (startH - newH);
            win.h = newH;
          }

          el.style.left = win.x + 'px';
          el.style.top = win.y + 'px';
          el.style.width = win.w + 'px';
          el.style.height = win.h + 'px';
        };
        var resizeUp = function() {
          if (resizing) self._saveWindowState(id);
          resizing = false;
        };
        document.addEventListener('mousemove', resizeMove);
        document.addEventListener('mouseup', resizeUp);
        win._docListeners.push({ type: 'mousemove', fn: resizeMove });
        win._docListeners.push({ type: 'mouseup', fn: resizeUp });
      });
    }
  });

  function getTaskbarHeight() {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--taskbar-h')) || 48;
  }

  window.addEventListener('resize', function() {
    Object.values(BOS._windows).forEach(function(win) {
      if (!win.maximized) return;
      win.w = window.innerWidth;
      win.h = window.innerHeight - getTaskbarHeight();
      BOS._applyWindowRect(win.id);
    });
  });


})();
