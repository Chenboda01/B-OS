(function() {
  function createUI() {
    return '<div class="bos-app" style="display:flex;flex-direction:column;height:100%;background:#050510;">' +
      '<div style="display:flex;gap:4px;padding:4px 8px;background:#0a0a1a;border-bottom:1px solid rgba(255,255,255,0.05);">' +
        '<button id="np-save" style="background:var(--cyan);color:#050510;border:none;padding:4px 12px;border-radius:2px;cursor:pointer;font-size:11px;">Save</button>' +
        '<button id="np-load" style="background:#181848;color:#ccc;border:none;padding:4px 12px;border-radius:2px;cursor:pointer;font-size:11px;">Load</button>' +
      '</div>' +
      '<textarea id="np-text" style="flex:1;background:#050510;color:#e8eaff;border:none;outline:none;resize:none;padding:12px;font-family:monospace;font-size:13px;"></textarea>' +
    '</div>';
  }
  function setupEvents(win) {
    var ta = win.querySelector('#np-text');
    win.querySelector('#np-save').addEventListener('click', function() { localStorage.setItem('bos-notepad', ta.value); showToast('Notepad','Saved'); });
    win.querySelector('#np-load').addEventListener('click', function() { ta.value = localStorage.getItem('bos-notepad')||''; showToast('Notepad','Loaded'); });
  }
  function launch() { var w = BOS.createWindow({title:'Notepad',icon:'📝',width:500,height:400,content:createUI()}); setupEvents(w); }
  BOS.registerApp({ id:'notepad', name:'Notepad', icon:'📝', category:'utility', launch:launch });
})();
