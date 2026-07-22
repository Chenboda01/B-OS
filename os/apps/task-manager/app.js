(function() {
  function createUI() {
    return '<div class="bos-app" style="padding:16px;background:#050510;color:#e8eaff;font-family:monospace;font-size:12px;overflow-y:auto;height:100%;">' +
      '<div style="font-weight:bold;font-size:14px;margin-bottom:12px;">Task Manager</div>' +
      '<div style="display:flex;gap:16px;margin-bottom:16px;">' +
        '<div style="flex:1;padding:12px;background:#0a0a1a;border-radius:4px;text-align:center;">' +
          '<div style="color:#00f0ff;font-size:22px;font-weight:bold;">' + navigator.hardwareConcurrency + '</div><div style="color:#555;font-size:10px;">CPU Cores</div>' +
        '</div>' +
        '<div style="flex:1;padding:12px;background:#0a0a1a;border-radius:4px;text-align:center;">' +
          '<div style="color:#00ff88;font-size:22px;font-weight:bold;">' + (navigator.deviceMemory||'?') + '</div><div style="color:#555;font-size:10px;">GB RAM</div>' +
        '</div>' +
      '</div>' +
      '<div id="tm-proc" style="color:#555;font-size:11px;margin-bottom:12px;"></div>' +
      '<div id="tm-list" style="max-height:200px;overflow-y:auto;"></div>' +
    '</div>';
  }
  function setupEvents(win) {
    win.querySelector('#tm-proc').textContent = 'Processes: ' + Object.keys(BOS._windows).length + ' windows';
    var list = win.querySelector('#tm-list');
    list.replaceChildren();
    Object.keys(BOS._windows).forEach(function(id) {
      var w = BOS._windows[id];
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.03);';
      row.innerHTML = '<span>'+w.icon+' '+w.title+'</span><button data-id="'+id+'" style="background:#ff3355;color:#fff;border:none;padding:2px 8px;border-radius:2px;cursor:pointer;font-size:10px;">End</button>';
      row.querySelector('button').addEventListener('click', function() { BOS.closeWindow(id); setupEvents(win); });
      list.appendChild(row);
    });
  }
  function launch() { var w = BOS.createWindow({title:'Task Manager',icon:'📊',width:400,height:350,content:createUI()}); setupEvents(w); }
  BOS.registerApp({ id:'taskmgr', name:'Task Manager', icon:'📊', category:'system', launch:launch });
})();
