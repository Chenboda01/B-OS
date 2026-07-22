(function() {
  function createUI() {
    return '<div class="bos-app" style="padding:16px;background:#050510;color:#e8eaff;height:100%;overflow-y:auto;font-size:12px;">'+
      '<div style="font-weight:bold;font-size:14px;margin-bottom:16px;">System Monitor</div>'+
      '<div style="padding:8px;background:#0a0a1a;border-radius:4px;margin-bottom:8px;">'+
        '<div style="display:flex;justify-content:space-between;"><span>CPU Cores</span><span style="color:#00f0ff;">'+navigator.hardwareConcurrency+'</span></div></div>'+
      '<div style="padding:8px;background:#0a0a1a;border-radius:4px;margin-bottom:8px;">'+
        '<div style="display:flex;justify-content:space-between;"><span>Memory</span><span style="color:#00f0ff;">'+(navigator.deviceMemory||'?')+' GB</span></div></div>'+
      '<div style="padding:8px;background:#0a0a1a;border-radius:4px;margin-bottom:8px;">'+
        '<div style="display:flex;justify-content:space-between;"><span>Online</span><span style="color:#00ff88;">'+navigator.onLine+'</span></div></div>'+
      '<div style="padding:8px;background:#0a0a1a;border-radius:4px;margin-bottom:8px;">'+
        '<div style="display:flex;justify-content:space-between;"><span>Screen</span><span style="color:#00f0ff;">'+screen.width+'x'+screen.height+'</span></div></div>'+
      '<div style="padding:8px;background:#0a0a1a;border-radius:4px;margin-bottom:8px;">'+
        '<div style="display:flex;justify-content:space-between;"><span>Platform</span><span style="color:#999;font-size:10px;">'+navigator.platform+'</span></div></div>'+
    '</div>';
  }
  function setupEvents(win) {}
  function launch() { var w = BOS.createWindow({title:'System Monitor',icon:'📈',width:360,height:320,content:createUI()}); setupEvents(w); }
  BOS.registerApp({ id:'sysmonitor', name:'System Monitor', icon:'📈', category:'system', launch:launch });
})();
