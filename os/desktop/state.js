(function() {
  'use strict';

  var DESKTOP_STATE_KEY = 'bos-desktop-state';

  function loadDesktopState() {
    try {
      var parsed = JSON.parse(localStorage.getItem(DESKTOP_STATE_KEY) || '{}');
      return {
        windows: parsed.windows && typeof parsed.windows === 'object' ? parsed.windows : {},
        recentApps: Array.isArray(parsed.recentApps) ? parsed.recentApps.slice(0, 10) : [],
        iconOrder: Array.isArray(parsed.iconOrder) ? parsed.iconOrder : [],
        volume: Number.isFinite(parsed.volume) ? Math.max(0, Math.min(100, parsed.volume)) : 70
      };
    } catch (error) {
      console.warn('Unable to load desktop state:', error);
      return { windows: {}, recentApps: [], iconOrder: [], volume: 70 };
    }
  }

  var desktopState = loadDesktopState();

  function saveDesktopState() {
    try {
      localStorage.setItem(DESKTOP_STATE_KEY, JSON.stringify(desktopState));
    } catch (error) {
      console.warn('Unable to save desktop state:', error);
    }
  }

  function rememberRecentApp(key, title, icon) {
    desktopState.recentApps = desktopState.recentApps.filter(function(item) { return item.key !== key; });
    desktopState.recentApps.unshift({ key: key, title: title, icon: icon, openedAt: Date.now() });
    desktopState.recentApps = desktopState.recentApps.slice(0, 10);
    saveDesktopState();
  }

  window.BOS_DesktopState = {
    state: desktopState,
    save: saveDesktopState,
    remember: rememberRecentApp
  };
})();
