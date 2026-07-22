(function() {
  function createUI() {
    return '<div class="bos-app" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:#050510;color:#e8eaff;">' +
      '<div style="font-size:64px;margin-bottom:16px;">🎵</div>' +
      '<div style="font-size:16px;font-weight:bold;margin-bottom:8px;">Music Player</div>' +
      '<div style="color:#555;font-size:11px;margin-bottom:16px;">Coming soon — stream your music</div>' +
      '<div style="display:flex;gap:12px;">' +
        '<button style="background:#181848;border:1px solid #333;color:#ccc;padding:8px 16px;border-radius:4px;cursor:pointer;font-size:12px;">⏮</button>' +
        '<button style="background:var(--cyan);border:none;color:#050510;padding:8px 16px;border-radius:4px;cursor:pointer;font-size:14px;">▶</button>' +
        '<button style="background:#181848;border:1px solid #333;color:#ccc;padding:8px 16px;border-radius:4px;cursor:pointer;font-size:12px;">⏭</button>' +
      '</div>' +
    '</div>';
  }
  function setupEvents(win) {}
  function launch() { var w = BOS.createWindow({title:'Music',icon:'🎵',width:350,height:300,content:createUI()}); setupEvents(w); }
  BOS.registerApp({ id:'music', name:'Music', icon:'🎵', category:'entertainment', launch:launch });
})();
