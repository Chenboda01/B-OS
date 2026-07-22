(function() {
  var drawing = false;
  function createUI() {
    return '<div class="bos-app" style="display:flex;flex-direction:column;height:100%;background:#050510;">' +
      '<div style="display:flex;gap:4px;padding:4px 8px;background:#0a0a1a;border-bottom:1px solid rgba(255,255,255,0.05);">' +
        '<button class="pt-color" data-c="#e8eaff" style="width:20px;height:20px;border-radius:50%;background:#e8eaff;border:2px solid var(--cyan);cursor:pointer;"></button>' +
        '<button class="pt-color" data-c="#ff3355" style="width:20px;height:20px;border-radius:50%;background:#ff3355;border:2px solid transparent;cursor:pointer;"></button>' +
        '<button class="pt-color" data-c="#00f0ff" style="width:20px;height:20px;border-radius:50%;background:#00f0ff;border:2px solid transparent;cursor:pointer;"></button>' +
        '<button class="pt-color" data-c="#00ff88" style="width:20px;height:20px;border-radius:50%;background:#00ff88;border:2px solid transparent;cursor:pointer;"></button>' +
        '<button class="pt-color" data-c="#ffaa00" style="width:20px;height:20px;border-radius:50%;background:#ffaa00;border:2px solid transparent;cursor:pointer;"></button>' +
        '<span style="flex:1;"></span>' +
        '<button id="pt-clear" style="background:#181848;color:#ccc;border:none;padding:2px 8px;border-radius:2px;cursor:pointer;font-size:10px;">Clear</button>' +
        '<input id="pt-size" type="range" min="1" max="10" value="3" style="width:60px;">' +
      '</div>' +
      '<canvas id="pt-canvas" style="flex:1;cursor:crosshair;background:#fff;border-radius:2px;"></canvas>' +
    '</div>';
  }
  function setupEvents(win) {
    var canvas = win.querySelector('#pt-canvas');
    var ctx = canvas.getContext('2d');
    var color = '#e8eaff', size = 3;
    setTimeout(function() { canvas.width=canvas.offsetWidth; canvas.height=canvas.offsetHeight; ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); }, 200);
    canvas.addEventListener('mousedown', function(e) { drawing=true; ctx.beginPath(); ctx.moveTo(e.offsetX,e.offsetY); });
    canvas.addEventListener('mousemove', function(e) { if(!drawing)return; ctx.strokeStyle=color; ctx.lineWidth=size; ctx.lineCap='round'; ctx.lineTo(e.offsetX,e.offsetY); ctx.stroke(); });
    canvas.addEventListener('mouseup', function() { drawing=false; });
    win.querySelector('#pt-clear').addEventListener('click', function() { ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); });
    win.querySelector('#pt-size').addEventListener('input', function() { size=parseInt(this.value); });
    win.querySelectorAll('.pt-color').forEach(function(b) {
      b.addEventListener('click', function() { color=this.dataset.c; win.querySelectorAll('.pt-color').forEach(function(x){x.style.borderColor='transparent';}); this.style.borderColor='var(--cyan)'; });
    });
  }
  function launch() { var w = BOS.createWindow({title:'Paint',icon:'🎨',width:600,height:400,content:createUI()}); setupEvents(w); }
  BOS.registerApp({ id:'paint', name:'Paint', icon:'🎨', category:'utility', launch:launch });
})();
