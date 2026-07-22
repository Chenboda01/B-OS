(function() {
  'use strict';

  /* ─────────────────────────────────────────────────
     B-OS AUTHENTICATION AND LOCAL ROLES
     ───────────────────────────────────────────────── */
  var loginOverlay = document.getElementById('loginOverlay');
  var loginMsg = document.getElementById('loginMsg');
  var loginError = document.getElementById('loginError');
  var loginModeBadge = document.getElementById('loginModeBadge');
  var loginHint = document.getElementById('loginHint');
  var loginButton = document.getElementById('loginBtn');
  var currentUser = null;
  var lockClockInterval = null;

  function normalizeUsername(username) {
    return String(username || '').trim().toLowerCase();
  }

  function validateUsername(username) {
    if (!/^[a-z0-9._-]{3,24}$/.test(username)) {
      throw new Error('Username must be 3–24 characters using letters, numbers, dots, dashes, or underscores.');
    }
  }

  function validatePassword(password) {
    if (String(password || '').length < 6) throw new Error('Password must be at least 6 characters.');
  }

  function accountKey(username) {
    return 'bos-user-' + normalizeUsername(username);
  }

  function loadAccount(username) {
    try {
      var raw = localStorage.getItem(accountKey(username));
      if (!raw) return null;
      var account = JSON.parse(raw);
      account.username = normalizeUsername(account.username || username);
      account.displayName = String(account.displayName || account.username);
      account.role = account.role === 'admin' ? 'admin' : 'user';
      account.owner = account.owner === true;
      account.disabled = account.disabled === true;
      return account;
    } catch (e) {
      return null;
    }
  }

  function saveAccount(account) {
    localStorage.setItem(accountKey(account.username), JSON.stringify(account));
  }

  function listAccountRecords() {
    var accounts = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf('bos-user-') !== 0) continue;
        var account = JSON.parse(localStorage.getItem(key));
        if (!account || !account.hash || !account.salt) continue;
        account.username = normalizeUsername(account.username || key.slice(9));
        account.displayName = String(account.displayName || account.username);
        account.role = account.role === 'admin' ? 'admin' : 'user';
        account.owner = account.owner === true;
        account.disabled = account.disabled === true;
        accounts.push(account);
      }
    } catch (e) {
      console.warn('Unable to enumerate B-OS accounts:', e);
    }
    return accounts.sort(function(a, b) {
      if (a.owner !== b.owner) return a.owner ? -1 : 1;
      return a.username.localeCompare(b.username);
    });
  }

  function publicAccount(account) {
    if (!account) return null;
    return {
      username: account.username,
      displayName: account.displayName,
      role: account.role,
      owner: account.owner,
      disabled: account.disabled,
      createdAt: account.createdAt || null
    };
  }

  function dispatchAuthChange() {
    window.dispatchEvent(new CustomEvent('bos-auth-change', { detail: publicAccount(currentUser) }));
  }

  function requireAdmin() {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Administrator access required.');
  }

  async function hashPassword(password, salt) {
    var data = new TextEncoder().encode(salt + ':' + password);
    var digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest)).map(function(b){return b.toString(16).padStart(2,'0');}).join('');
  }

  function generateSalt() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16))).map(function(b){return b.toString(16).padStart(2,'0');}).join('');
  }

  async function buildAccount(username, displayName, password, role, owner) {
    username = normalizeUsername(username);
    validateUsername(username);
    validatePassword(password);
    if (loadAccount(username)) throw new Error('That username already exists.');
    var salt = generateSalt();
    return {
      username: username,
      displayName: String(displayName || username).trim().slice(0, 50) || username,
      role: role === 'admin' ? 'admin' : 'user',
      owner: owner === true,
      disabled: false,
      salt: salt,
      hash: await hashPassword(password, salt),
      createdAt: new Date().toISOString()
    };
  }

  function updateLockClock() {
    var now = new Date();
    document.getElementById('lockTime').textContent = now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
    document.getElementById('lockDate').textContent = now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  }

  function showLogin(msg) {
    var setupMode = listAccountRecords().length === 0;
    loginOverlay.classList.toggle('setup-mode', setupMode);
    loginModeBadge.textContent = setupMode ? 'FIRST-RUN OWNER SETUP' : 'IDENTITY GATE';
    loginMsg.textContent = msg || (setupMode ? 'Initialize the owner identity for this B-OS installation' : 'Authenticate to enter your workspace');
    loginHint.textContent = setupMode ? 'The first account is the protected owner and can manage all other users.' : 'Accounts can only be created by an administrator after login.';
    loginButton.textContent = setupMode ? 'Initialize Owner' : 'Enter B-OS';
    loginError.style.display = 'none';
    updateLockClock();
    loginOverlay.classList.add('active');
    if (lockClockInterval) clearInterval(lockClockInterval);
    lockClockInterval = setInterval(updateLockClock, 10000);
    requestAnimationFrame(function() {
      document.getElementById(setupMode ? 'loginDisplayName' : 'loginUser').focus();
    });
  }

  function hideLogin() {
    loginOverlay.classList.remove('active');
    loginOverlay.classList.remove('setup-mode');
    document.getElementById('loginDisplayName').value = '';
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
    document.getElementById('loginConfirm').value = '';
    loginError.style.display = 'none';
    if (lockClockInterval) { clearInterval(lockClockInterval); lockClockInterval = null; }
  }

  window.BOS_Auth = {
    hasAccounts: function() { return listAccountRecords().length > 0; },
    getCurrentUser: function() { return publicAccount(currentUser); },
    isAdmin: function() { return Boolean(currentUser && currentUser.role === 'admin'); },
    listUsers: function() {
      requireAdmin();
      return listAccountRecords().map(publicAccount);
    },
    createOwner: async function(username, displayName, password) {
      if (listAccountRecords().length > 0) throw new Error('The owner account has already been created.');
      var account = await buildAccount(username, displayName, password, 'admin', true);
      saveAccount(account);
      currentUser = account;
      dispatchAuthChange();
      return publicAccount(account);
    },
    createUser: async function(username, displayName, password, role) {
      requireAdmin();
      var account = await buildAccount(username, displayName, password, role, false);
      saveAccount(account);
      return publicAccount(account);
    },
    authenticate: async function(username, password) {
      var account = loadAccount(username);
      if (!account || !account.hash || !account.salt) throw new Error('Account not found.');
      if (account.disabled) throw new Error('This account is disabled. Contact the owner.');
      var hash = await hashPassword(password, account.salt);
      if (hash !== account.hash) throw new Error('Invalid password.');
      if (!listAccountRecords().some(function(item) { return item.owner; })) {
        account.owner = true;
        account.role = 'admin';
        saveAccount(account);
      }
      currentUser = account;
      dispatchAuthChange();
      return publicAccount(account);
    },
    setDisabled: function(username, disabled) {
      requireAdmin();
      var account = loadAccount(username);
      if (!account) throw new Error('Account not found.');
      if (account.owner) throw new Error('The owner account cannot be disabled.');
      if (currentUser.username === account.username) throw new Error('You cannot disable your active account.');
      account.disabled = disabled === true;
      saveAccount(account);
      return publicAccount(account);
    },
    setRole: function(username, role) {
      requireAdmin();
      var account = loadAccount(username);
      if (!account) throw new Error('Account not found.');
      if (account.owner) throw new Error('The owner role cannot be changed.');
      if (currentUser.username === account.username) throw new Error('You cannot change your active role.');
      account.role = role === 'admin' ? 'admin' : 'user';
      saveAccount(account);
      return publicAccount(account);
    },
    resetPassword: async function(username, password) {
      requireAdmin();
      validatePassword(password);
      var account = loadAccount(username);
      if (!account) throw new Error('Account not found.');
      var salt = generateSalt();
      account.salt = salt;
      account.hash = await hashPassword(password, salt);
      saveAccount(account);
      return publicAccount(account);
    },
    deleteUser: function(username) {
      requireAdmin();
      var account = loadAccount(username);
      if (!account) throw new Error('Account not found.');
      if (account.owner) throw new Error('The owner account cannot be deleted.');
      if (currentUser.username === account.username) throw new Error('You cannot delete your active account.');
      localStorage.removeItem(accountKey(account.username));
    },
    signOut: function() {
      Object.keys(BOS._windows).forEach(function(id) { BOS.closeWindow(id); });
      currentUser = null;
      dispatchAuthChange();
      showLogin('Signed out');
    }
  };

  window.showLogin = showLogin;

  document.getElementById('loginBox').addEventListener('submit', async function(e) {
    e.preventDefault();
    var setupMode = loginOverlay.classList.contains('setup-mode');
    var username = document.getElementById('loginUser').value;
    var password = document.getElementById('loginPass').value;
    loginButton.disabled = true;
    loginError.style.display = 'none';
    try {
      if (setupMode) {
        var confirmation = document.getElementById('loginConfirm').value;
        if (password !== confirmation) throw new Error('Passwords do not match.');
        await window.BOS_Auth.createOwner(username, document.getElementById('loginDisplayName').value, password);
      } else {
        await window.BOS_Auth.authenticate(username, password);
      }
      hideLogin();
    } catch (err) {
      loginError.textContent = err && err.message ? err.message : 'Authentication failed. Try again.';
      loginError.style.display = 'block';
    } finally {
      loginButton.disabled = false;
    }
  });

  showLogin();


})();
