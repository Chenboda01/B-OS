// ═══════════════════════════════════════════════════════════════
// APP 5 — SETTINGS
// ═══════════════════════════════════════════════════════════════
(function() {
  var THEMES = {
    cyberpunk: { accent: '#00f0ff', secondary: '#ff00ff' },
    aurora:    { accent: '#00ff88', secondary: '#ffaa00' },
    synthwave: { accent: '#ff00ff', secondary: '#00f0ff' },
    monochrome:{ accent: '#e8eaff', secondary: '#9999cc' }
  };

  function defaultSettings() {
    return { theme: 'cyberpunk', fontSize: 13, wallpaper: 'particles', serverUrl: API.baseUrl };
  }

  function normalizeSettings(settings) {
    var normalized = settings && typeof settings === 'object' ? settings : defaultSettings();
    if (normalized.theme === 'windows' || !THEMES[normalized.theme]) normalized.theme = 'cyberpunk';
    if (!normalized.fontSize) normalized.fontSize = 13;
    if (!normalized.wallpaper) normalized.wallpaper = 'particles';
    if (!normalized.serverUrl) normalized.serverUrl = API.baseUrl;
    return normalized;
  }

  function loadSettings() {
    try {
      var raw = localStorage.getItem('bos-settings');
      return raw ? normalizeSettings(JSON.parse(raw)) : defaultSettings();
    } catch(e) {
      console.warn('Unable to load B-OS settings:', e);
      return defaultSettings();
    }
  }

  function saveSettings(s) {
    try {
      localStorage.setItem('bos-settings', JSON.stringify(s));
    } catch(e) {
      console.warn('Unable to save B-OS settings:', e);
    }
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
        '<div class="set-tab" data-tab="appearance" style="padding:8px 16px;cursor:pointer;color:var(--cyan);background:var(--cyan-ghost);border-left:2px solid var(--cyan);">Appearance</div>' +
        '<div class="set-tab" data-tab="system" style="padding:8px 16px;cursor:pointer;color:#9999cc;border-left:2px solid transparent;">System</div>' +
        (window.BOS_Auth && window.BOS_Auth.isAdmin() ? '<div class="set-tab" data-tab="accounts" style="padding:8px 16px;cursor:pointer;color:#9999cc;border-left:2px solid transparent;">Accounts</div>' : '') +
        '<div class="set-tab" data-tab="updates" style="padding:8px 16px;cursor:pointer;color:#9999cc;border-left:2px solid transparent;">Updates</div>' +
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
          'style="width:100%;accent-color:var(--cyan);" />' +
      '</div>' +
      /* Wallpaper */
      '<div style="margin-bottom:16px;">' +
        '<div style="color:#555580;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;">Desktop Background</div>' +
        '<div style="display:flex;gap:8px;">' +
          ['particles','grid','none'].map(function(w) {
            var active = s.wallpaper === w;
            return '<div class="set-wallpaper-opt" data-wallpaper="' + w + '" ' +
              'style="padding:8px 14px;border:1px solid ' + (active ? 'var(--cyan)' : '#181848') + ';border-radius:4px;cursor:pointer;color:' + (active ? 'var(--cyan)' : '#9999cc') + ';text-transform:capitalize;transition:all 0.2s;">' + w + '</div>';
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
        '<input id="set-server" type="text" value="' + esc(API.baseUrl) + '" ' +
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
          (data.service ? '<div style="color:#9999cc;font-size:11px;">Service: ' + esc(String(data.service)) + '</div>' : '');
      } else {
        target.innerHTML = '<div style="display:flex;align-items:center;gap:8px;">' +
          '<div style="width:8px;height:8px;border-radius:50%;background:#ff3355;box-shadow:0 0 8px #ff3355;"></div>' +
          '<span style="color:#ff3355;font-size:12px;">Backend Offline</span></div>' +
          '<div style="color:#9999cc;font-size:11px;line-height:1.7;margin-top:6px;">Desktop-only apps remain available.<br>Start local services with <strong>./start-bos.sh</strong>.<br>The system tray retries automatically every 5 seconds.</div>';
      }
    }).catch(function(error) {
      var target = win.querySelector('#set-health');
      if (target) target.innerHTML = '<div style="display:flex;align-items:center;gap:8px;">' +
        '<div style="width:8px;height:8px;border-radius:50%;background:#ff3355;box-shadow:0 0 8px #ff3355;"></div>' +
        '<span style="color:#ff3355;font-size:12px;">Backend Offline</span></div>' +
        '<div style="color:#9999cc;font-size:11px;line-height:1.7;margin-top:6px;">Run <strong>./start-bos.sh</strong>. Desktop-only apps remain available and B-OS retries automatically.</div>';
      if (error && error.message) console.warn('Settings health check failed:', error.message);
    });
  }

  function buildAccountsPanel() {
    if (!window.BOS_Auth || !window.BOS_Auth.isAdmin()) {
      return '<div style="color:#ff3355;padding:16px;border:1px solid rgba(255,51,85,0.3);background:rgba(255,51,85,0.05);">Administrator access required.</div>';
    }
    var current = window.BOS_Auth.getCurrentUser();
    var users = window.BOS_Auth.listUsers();
    return '<div id="panel-accounts">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:18px;">' +
        '<div><div style="color:#e8eaff;font-size:14px;font-weight:bold;margin-bottom:4px;">Account Management</div>' +
        '<div style="color:#555580;font-size:10px;line-height:1.6;">Signed in as <span style="color:#00f0ff;">' + esc(current.displayName) + '</span>. Administrators can manage all non-owner accounts.</div></div>' +
        '<div style="padding:5px 9px;border:1px solid rgba(0,255,136,0.25);color:#00ff88;font-size:9px;letter-spacing:0.12em;">ADMIN</div>' +
      '</div>' +
      '<form id="account-create-form" style="padding:14px;border:1px solid #181848;background:#0a0a1a;border-radius:4px;margin-bottom:16px;">' +
        '<div style="color:#9999cc;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:10px;">Add account</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">' +
          '<input id="account-display" type="text" maxlength="50" placeholder="Display name" style="background:#050510;border:1px solid #181848;color:#e8eaff;padding:8px;font-family:monospace;">' +
          '<input id="account-user" type="text" maxlength="24" placeholder="Username" autocomplete="off" style="background:#050510;border:1px solid #181848;color:#e8eaff;padding:8px;font-family:monospace;">' +
          '<input id="account-password" type="password" placeholder="Temporary password" autocomplete="new-password" style="background:#050510;border:1px solid #181848;color:#e8eaff;padding:8px;font-family:monospace;">' +
          '<select id="account-role" style="background:#050510;border:1px solid #181848;color:#e8eaff;padding:8px;font-family:monospace;"><option value="user">Standard user</option><option value="admin">Administrator</option></select>' +
        '</div>' +
        '<button type="submit" style="background:var(--cyan);color:#050510;border:0;padding:8px 16px;border-radius:3px;cursor:pointer;font-size:11px;">Create Account</button>' +
        '<span id="account-status" style="margin-left:10px;color:#9999cc;font-size:10px;"></span>' +
      '</form>' +
      '<div style="display:flex;flex-direction:column;gap:8px;">' + users.map(function(user) {
        var protectedAccount = user.owner || user.username === current.username;
        var roleColor = user.role === 'admin' ? '#ffaa00' : '#00f0ff';
        return '<div class="account-row" data-username="' + esc(user.username) + '" style="display:flex;align-items:center;gap:10px;padding:12px;border:1px solid #181848;background:#080818;border-radius:4px;">' +
          '<div style="width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:var(--cyan-ghost);color:var(--cyan);">' + esc(user.displayName.charAt(0).toUpperCase()) + '</div>' +
          '<div style="flex:1;min-width:0;"><div style="color:#e8eaff;font-size:12px;font-weight:bold;">' + esc(user.displayName) + (user.owner ? ' <span style="color:#00ff88;font-size:9px;">OWNER</span>' : '') + '</div>' +
          '<div style="color:#555580;font-size:10px;">@' + esc(user.username) + ' · <span style="color:' + roleColor + ';">' + esc(user.role) + '</span>' + (user.disabled ? ' · <span style="color:#ff3355;">disabled</span>' : '') + '</div></div>' +
          '<button data-account-action="reset" data-username="' + esc(user.username) + '" style="background:#181848;color:#e8eaff;border:1px solid #333;padding:5px 8px;cursor:pointer;font-size:9px;">Reset</button>' +
          (!protectedAccount ? '<button data-account-action="role" data-username="' + esc(user.username) + '" data-role="' + (user.role === 'admin' ? 'user' : 'admin') + '" style="background:#181848;color:#ffaa00;border:1px solid #333;padding:5px 8px;cursor:pointer;font-size:9px;">' + (user.role === 'admin' ? 'Make User' : 'Make Admin') + '</button>' : '') +
          (!protectedAccount ? '<button data-account-action="disable" data-username="' + esc(user.username) + '" data-disabled="' + (!user.disabled) + '" style="background:#181848;color:#ffaa00;border:1px solid #333;padding:5px 8px;cursor:pointer;font-size:9px;">' + (user.disabled ? 'Enable' : 'Disable') + '</button>' : '') +
          (!protectedAccount ? '<button data-account-action="delete" data-username="' + esc(user.username) + '" style="background:rgba(255,51,85,0.08);color:#ff3355;border:1px solid rgba(255,51,85,0.3);padding:5px 8px;cursor:pointer;font-size:9px;">Delete</button>' : '') +
        '</div>';
      }).join('') + '</div>' +
    '</div>';
  }

  function renderAccountsPanel(contentEl) {
    contentEl.innerHTML = buildAccountsPanel();
    bindAccountsEvents(contentEl);
  }

  function bindAccountsEvents(contentEl) {
    var form = contentEl.querySelector('#account-create-form');
    if (!form) return;
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      var status = contentEl.querySelector('#account-status');
      try {
        await window.BOS_Auth.createUser(
          contentEl.querySelector('#account-user').value,
          contentEl.querySelector('#account-display').value,
          contentEl.querySelector('#account-password').value,
          contentEl.querySelector('#account-role').value
        );
        showToast('Accounts', 'Account created successfully.');
        renderAccountsPanel(contentEl);
      } catch (err) {
        status.textContent = err && err.message ? err.message : 'Unable to create account.';
        status.style.color = '#ff3355';
      }
    });
    contentEl.querySelectorAll('[data-account-action]').forEach(function(button) {
      button.addEventListener('click', async function() {
        var action = this.dataset.accountAction;
        var username = this.dataset.username;
        try {
          if (action === 'reset') {
            var password = prompt('New password for ' + username + ' (minimum 6 characters):');
            if (password === null) return;
            await window.BOS_Auth.resetPassword(username, password);
            showToast('Accounts', 'Password reset for ' + username + '.');
          } else if (action === 'role') {
            window.BOS_Auth.setRole(username, this.dataset.role);
            showToast('Accounts', 'Role updated for ' + username + '.');
          } else if (action === 'disable') {
            window.BOS_Auth.setDisabled(username, this.dataset.disabled === 'true');
            showToast('Accounts', 'Account status updated for ' + username + '.');
          } else if (action === 'delete') {
            if (!confirm('Delete account ' + username + '? This cannot be undone.')) return;
            window.BOS_Auth.deleteUser(username);
            showToast('Accounts', 'Account deleted: ' + username + '.');
          }
          renderAccountsPanel(contentEl);
        } catch (err) {
          showToast('Accounts', err && err.message ? err.message : 'Account operation failed.');
        }
      });
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
          '<div style="color:#9999cc;padding:8px 12px;border:1px solid #181848;border-radius:2px;background:#050510;">' + esc(API.baseUrl + '/api/ai/chat') + '</div>' +
        '</div>' +
        '<div style="margin-bottom:16px;">' +
          '<div style="color:#555580;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;">API Key</div>' +
          '<input id="set-apikey" type="text" placeholder="Enter QWEN API key..." style="width:100%;background:#050510;border:1px solid #181848;color:#00f0ff;padding:8px 12px;border-radius:2px;font-family:monospace;font-size:11px;outline:none;" />' +
          '<button id="btn-save-key" style="margin-top:8px;background:var(--cyan);color:#050510;border:none;padding:6px 16px;border-radius:4px;cursor:pointer;font-size:11px;">Save Key</button>' +
          '<span id="key-status" style="margin-left:8px;font-size:11px;"></span>' +
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
        'B-OS is a retro-futuristic cyberpunk desktop simulation that reimagines what a personal workspace can be.<br><br>' +
        'Built with vanilla HTML, CSS, and JavaScript on the frontend.<br>' +
        'Optional Python Flask backend for restricted system commands, file access, and QWEN-powered AI tools.' +
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
          t.style.color = t.dataset.tab === tabName ? 'var(--cyan)' : '#9999cc';
          t.style.background = t.dataset.tab === tabName ? 'var(--cyan-ghost)' : 'transparent';
          t.style.borderLeftColor = t.dataset.tab === tabName ? 'var(--cyan)' : 'transparent';
        });
        if (tabName === 'appearance') { contentEl.innerHTML = buildAppearancePanel(settings); bindAppearanceEvents(win, contentEl, settings); }
        else if (tabName === 'system') { contentEl.innerHTML = buildSystemPanel(); checkSystemHealth(win); bindSystemEvents(win, contentEl, settings); }
        else if (tabName === 'accounts') { renderAccountsPanel(contentEl); }
        else if (tabName === 'updates') { contentEl.innerHTML = buildUpdatesPanel(); bindUpdatesEvents(win, contentEl); }
        else if (tabName === 'ai') { contentEl.innerHTML = buildAIPanel(); bindAIEvents(win, contentEl); }
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
        contentEl.innerHTML = buildAppearancePanel(settings);
        bindAppearanceEvents(win, contentEl, settings);
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
          o.style.borderColor = o.dataset.wallpaper === settings.wallpaper ? 'var(--cyan)' : '#181848';
          o.style.color = o.dataset.wallpaper === settings.wallpaper ? 'var(--cyan)' : '#9999cc';
        });
      });
    });
  }

  function bindSystemEvents(win, contentEl, settings) {
    var serverInput = contentEl.querySelector('#set-server');
    if (serverInput) {
      serverInput.value = settings.serverUrl || API.baseUrl;
      serverInput.addEventListener('change', function() {
        settings.serverUrl = this.value.trim();
        saveSettings(settings);
      });
    }
  }

  function buildUpdatesPanel() {
    return '<div id="panel-updates">' +
      '<div style="color:#e8eaff;font-size:14px;font-weight:bold;margin-bottom:16px;">Software Update</div>' +
      '<div style="padding:16px;border:1px solid #181848;border-radius:4px;background:#0a0a1a;margin-bottom:16px;text-align:center;">' +
        '<div style="font-size:24px;font-weight:bold;color:#00f0ff;margin-bottom:4px;">B-OS v0.1.0</div>' +
        '<div id="update-status" style="color:#00ff88;font-size:11px;margin-bottom:12px;">Your system is up to date.</div>' +
        '<button id="btn-check-updates" style="background:var(--cyan);color:#050510;border:none;padding:8px 24px;border-radius:4px;cursor:pointer;font-size:12px;">Check for Updates</button>' +
        '<div id="update-progress" style="margin-top:12px;display:none;">' +
          '<div style="height:6px;background:#181848;border-radius:3px;overflow:hidden;">' +
            '<div id="update-bar" style="height:100%;width:0;background:linear-gradient(90deg,var(--magenta),var(--cyan));border-radius:3px;transition:width 0.3s;"></div>' +
          '</div>' +
          '<div id="update-label" style="color:#9999cc;font-size:11px;margin-top:6px;">Checking for updates...</div>' +
        '</div>' +
      '</div>' +
      '<div style="color:#555580;font-size:10px;line-height:1.6;">' +
        'Update channel: <span style="color:#00f0ff;">Stable</span>' +
      '</div>' +
    '</div>';
  }

  function bindUpdatesEvents(win, contentEl) {
    var btn = contentEl.querySelector('#btn-check-updates');
    var bar = contentEl.querySelector('#update-bar');
    var progress = contentEl.querySelector('#update-progress');
    var label = contentEl.querySelector('#update-label');
    var status = contentEl.querySelector('#update-status');
    if (!btn || !bar) return;
    btn.addEventListener('click', function() {
      btn.disabled = true;
      btn.textContent = 'Checking...';
      progress.style.display = 'block';
      bar.style.width = '0';
      label.textContent = 'Checking for updates...';
      var width = 0;
      var interval = setInterval(function() {
        width += Math.random() * 30;
        if (width > 90) width = 90;
        bar.style.width = width + '%';
        if (width >= 90) {
          clearInterval(interval);
          setTimeout(function() {
            bar.style.width = '100%';
            label.textContent = 'Your system is up to date.';
            btn.textContent = 'Check Again';
            btn.disabled = false;
            status.textContent = 'Last checked: ' + new Date().toLocaleString();
          }, 800);
        }
      }, 200);
    });
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
