(function() {
  function safeText(value) {
    var div = document.createElement('div');
    div.textContent = String(value);
    return div.innerHTML;
  }
  function createUI() {
    var user = window.BOS_Auth ? window.BOS_Auth.getCurrentUser() : null;
    var displayName = user ? user.displayName : 'Guest';
    var username = user ? user.username : 'not signed in';
    var role = user ? (user.owner ? 'Owner / Administrator' : (user.role === 'admin' ? 'Administrator' : 'Standard User')) : 'Locked';
    return '<div class="bos-app" style="padding:24px;text-align:center;background:#050510;color:#e8eaff;height:100%;overflow-y:auto;">' +
      '<div style="width:64px;height:64px;border-radius:50%;background:var(--cyan-ghost);border:1px solid var(--cyan);box-shadow:var(--glow-cyan);margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:28px;">👤</div>' +
      '<div style="font-size:16px;font-weight:bold;margin-bottom:4px;">' + safeText(displayName) + '</div>' +
      '<div style="color:#00f0ff;font-size:11px;margin-bottom:4px;">@' + safeText(username) + '</div>' +
      '<div style="color:#555;font-size:11px;margin-bottom:20px;">' + role + '</div>' +
      '<div style="text-align:left;padding:12px;background:#0a0a1a;border-radius:4px;margin-bottom:8px;">' +
      '<div style="color:#555;font-size:10px;">HOSTNAME</div><div style="font-size:13px;">b-os.local</div></div>' +
      '<div style="text-align:left;padding:12px;background:#0a0a1a;border-radius:4px;margin-bottom:8px;">' +
      '<div style="color:#555;font-size:10px;">BROWSER</div><div style="font-size:13px;">'+(navigator.userAgent.split(') ').pop()||'Unknown')+'</div></div>' +
      '<button id="profile-signout" style="margin-top:12px;background:#ff3355;color:#fff;border:none;padding:8px 24px;border-radius:4px;cursor:pointer;font-size:12px;">Sign Out</button>' +
    '</div>';
  }
  function setupEvents(win) {
    win.querySelector('#profile-signout').addEventListener('click', function() {
      if (window.BOS_Auth) window.BOS_Auth.signOut();
    });
  }
  function launch() { var w = BOS.createWindow({title:'Profile',icon:'👤',width:320,height:360,content:createUI()}); setupEvents(w); }
  BOS.registerApp({ id:'profile', name:'Profile', icon:'👤', category:'system', launch:launch });
})();
