(function() {
  'use strict';

  var desktopState = window.BOS_DesktopState.state;

  /* ─────────────────────────────────────────────────
     BOS GLOBAL OBJECT
     ───────────────────────────────────────────────── */
  window.BOS = {
    _windows: {},
    _apps: [],
    _nextId: 1,
    _nextZ: 200,
    _focusedId: null,
    _startMenuOpen: false,

    registerApp: function(app) {
      if (!app || !app.id || !app.name) return false;
      if (this._apps.some(function(e) { return e.id === app.id; })) return false;
      this._apps.push(app);
      this._renderDesktopIcons();
      this._renderStartMenu();
    },

    getRecentApps: function() {
      return desktopState.recentApps.slice();
    },

    getBackendStatus: function() {
      if (typeof API !== 'undefined' && API.health) {
        return API.health();
      }
      return Promise.resolve({ status: 'offline' });
    },
    /* ── Utility ── */
    _escHtml: function(str) {
      var div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  };

})();
