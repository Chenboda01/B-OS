(function() {
  function launch() {
    BOS.createWindow({title:'Screenshot saved!',icon:'📸',width:300,height:180,
      content:'<div class="bos-app" style="display:flex;align-items:center;justify-content:center;height:100%;text-align:center;background:#050510;color:#e8eaff;font-size:12px;">'+
        '<div>📸<br><br>Screenshot copied!<br><span style="color:#555;">Press Ctrl+Shift+S to capture</span></div></div>'
    });
  }
  BOS.registerApp({ id:'screenshot', name:'Screenshot', icon:'📸', category:'utility', launch:launch });
})();
