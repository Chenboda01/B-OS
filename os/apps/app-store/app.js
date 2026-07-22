(function() {
  var apps = [
    {n:'Terminal',i:'>_',d:'Command-line interface',c:'system'},
    {n:'File Manager',i:'📁',d:'Browse files',c:'system'},
    {n:'Browser',i:'🌎',d:'Open websites',c:'network'},
    {n:'AI Chat',i:'🤖',d:'QWEN AI assistant',c:'ai'},
    {n:'Settings',i:'⚙',d:'Configure B-OS',c:'system'},
    {n:'Calculator',i:'🔢',d:'Arithmetic',c:'utility'},
    {n:'Notepad',i:'📝',d:'Text editor',c:'utility'},
    {n:'Paint',i:'🎨',d:'Draw freely',c:'utility'},
    {n:'Task Manager',i:'📊',d:'Monitor system',c:'system'},
    {n:'Clock',i:'🕐',d:'Time & date',c:'utility'},
    {n:'Games',i:'🎮',d:'Coming soon',c:'entertainment'},
    {n:'Music',i:'🎵',d:'Media player',c:'entertainment'}
  ];
  function createUI() {
    var h = '<div class="bos-app" style="padding:16px;background:#050510;color:#e8eaff;height:100%;overflow-y:auto;font-size:12px;">'+
      '<div style="font-weight:bold;font-size:14px;margin-bottom:4px;">B-OS App Store</div>'+
      '<div style="color:#555;font-size:10px;margin-bottom:16px;">'+apps.length+' apps available</div>';
    apps.forEach(function(a){
      h += '<div style="display:flex;align-items:center;padding:10px;margin-bottom:4px;background:#0a0a1a;border-radius:4px;gap:12px;">'+
        '<div style="font-size:24px;">'+a.i+'</div>'+
        '<div style="flex:1;"><div style="font-weight:bold;">'+a.n+'</div><div style="color:#555;font-size:10px;">'+a.d+'</div></div>'+
        '<button data-app="'+a.n.toLowerCase()+'" style="background:var(--cyan);color:#050510;border:none;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:10px;">Open</button></div>';
    });
    return h + '</div>';
  }
  function setupEvents(win) {
    win.querySelectorAll('button').forEach(function(b){
      b.addEventListener('click',function(){
        var id = this.dataset.app.replace(/\s/g,'');
        BOS._apps.forEach(function(app){ if(app.id===id||app.name.toLowerCase()===this.dataset.app) app.launch(); },this);
      });
    });
  }
  function launch() { var w = BOS.createWindow({title:'App Store',icon:'🏪',width:400,height:480,content:createUI()}); setupEvents(w); }
  BOS.registerApp({ id:'appstore', name:'App Store', icon:'🏪', category:'system', launch:launch });
})();
