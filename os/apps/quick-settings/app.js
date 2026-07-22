(function() {
  var toggles = { wifi:true, bluetooth:false, nightlight:false, dnd:false };
  function createUI() {
    function row(icon,label,id,on) {
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.03);">' +
        '<span>'+icon+' '+label+'</span>' +
        '<div class="qs-toggle" data-id="'+id+'" style="width:36px;height:20px;border-radius:10px;cursor:pointer;transition:0.2s;background:'+(on?'var(--cyan)':'#181848')+';position:relative;">' +
          '<div style="width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:2px;left:'+(on?'18px':'2px')+';transition:0.2s;"></div>' +
        '</div></div>';
    }
    return '<div class="bos-app" style="padding:16px;background:#050510;color:#e8eaff;font-size:12px;height:100%;overflow-y:auto;">' +
      '<div style="font-weight:bold;font-size:14px;margin-bottom:16px;">Quick Settings</div>' +
      row('📶','WiFi','wifi',true) + row('📡','Bluetooth','bluetooth',false) +
      row('🌙','Night Light','nightlight',false) + row('🔕','Do Not Disturb','dnd',false) +
      '<div style="margin-top:12px;color:#555;font-size:10px;">Volume: <span style="color:#00f0ff;">70%</span> | Brightness: <span style="color:#00f0ff;">100%</span></div>' +
    '</div>';
  }
  function setupEvents(win) {
    win.querySelectorAll('.qs-toggle').forEach(function(t) {
      t.addEventListener('click', function() {
        var id = this.dataset.id;
        toggles[id] = !toggles[id];
        var on = toggles[id];
        this.style.background = on ? 'var(--cyan)' : '#181848';
        this.querySelector('div').style.left = on ? '18px' : '2px';
        showToast(id.charAt(0).toUpperCase()+id.slice(1), on?'On':'Off');
      });
    });
  }
  function launch() { var w = BOS.createWindow({title:'Quick Settings',icon:'⚡',width:300,height:280,content:createUI()}); setupEvents(w); }
  BOS.registerApp({ id:'quicksettings', name:'Quick Settings', icon:'⚡', category:'system', launch:launch });
})();
