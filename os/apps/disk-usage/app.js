(function() {
  function createUI() {
    return '<div class="bos-app" style="padding:16px;background:#050510;color:#e8eaff;height:100%;overflow-y:auto;font-size:12px;">'+
      '<div style="font-weight:bold;font-size:14px;margin-bottom:16px;">Disk Usage</div>'+
      '<div id="disk-info" style="color:#555;">Loading...</div></div>';
  }
  function setupEvents(win) {
    API.exec('df -h /home', '~').then(function(d) {
      win.querySelector('#disk-info').innerHTML = '<pre style="color:#00ff88;font-family:monospace;font-size:11px;">'+(d.stdout||d.stderr||'No disk information available')+'</pre>';
    }).catch(function(error) {
      console.warn('Disk Usage backend unavailable:', error);
      win.querySelector('#disk-info').textContent = 'Backend Offline — run ./start-bos.sh to load disk information.';
    });
  }
  function launch() { var w = BOS.createWindow({title:'Disk Usage',icon:'💾',width:500,height:250,content:createUI()}); setupEvents(w); }
  BOS.registerApp({ id:'diskusage', name:'Disk Usage', icon:'💾', category:'system', launch:launch });
})();
