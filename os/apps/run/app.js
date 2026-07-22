(function() {
  function createUI() {
    return '<div class="bos-app" style="display:flex;flex-direction:column;height:100%;background:#050510;">'+
      '<div style="padding:12px;background:#0a0a1a;border-bottom:1px solid rgba(255,255,255,0.05);">'+
        '<input id="run-input" type="text" placeholder="Type a command or app name..." style="width:100%;background:#050510;border:1px solid #181848;color:#00f0ff;padding:8px 12px;border-radius:4px;font-family:monospace;font-size:13px;outline:none;" autofocus>'+
      '</div>'+
      '<div id="run-results" style="flex:1;overflow-y:auto;padding:8px;"></div></div>';
  }
  function setupEvents(win) {
    var input = win.querySelector('#run-input');
    var results = win.querySelector('#run-results');
    input.addEventListener('keydown',function(e){
      if(e.key==='Enter'){
        var q = this.value.trim().toLowerCase();
        results.innerHTML = '';
        BOS._apps.forEach(function(app){
          if(app.name.toLowerCase().includes(q)||app.id.includes(q)){
            var d=document.createElement('div');
            d.style.cssText='padding:8px 12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.03);display:flex;align-items:center;gap:8px;';
            d.innerHTML='<span>'+app.icon+'</span><span>'+app.name+'</span>';
            d.addEventListener('click',function(){app.launch();BOS.closeWindow?BOS.closeWindow(win.id||''):null;});
            results.appendChild(d);
          }
        });
        if(!results.children.length) results.innerHTML='<div style="padding:12px;color:#555;">No matches</div>';
      }
    });
  }
  function launch() { var w = BOS.createWindow({title:'Run',icon:'▶',width:350,height:280,content:createUI()}); setupEvents(w); }
  BOS.registerApp({ id:'run', name:'Run', icon:'▶', category:'system', launch:launch });
})();
