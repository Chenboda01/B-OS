(function() {
  var display = '0', op = '', prev = '';
  function createUI() {
    var btns = ['AC','±','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','='];
    var html = '<div class="bos-app" style="display:flex;flex-direction:column;height:100%;background:#050510;padding:8px;">' +
      '<div id="calc-display" style="background:#0a0a1a;color:#00ff88;font-size:28px;text-align:right;padding:16px;border-radius:4px;margin-bottom:8px;font-family:monospace;overflow:hidden;">0</div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;flex:1;">';
    btns.forEach(function(b) { html += '<button class="calc-btn" data-v="'+b+'" style="background:#111130;border:1px solid #181848;color:#e8eaff;font-size:16px;border-radius:4px;cursor:pointer;">'+b+'</button>'; });
    html += '</div></div>';
    return html;
  }
  function setupEvents(win) {
    var d = win.querySelector('#calc-display');
    win.querySelectorAll('.calc-btn').forEach(function(b) {
      b.addEventListener('click', function() {
        var v = this.dataset.v;
        if (v === 'AC') { display='0'; op=''; prev=''; }
        else if (v === '±') { display = String(-parseFloat(display)); }
        else if (v === '%') { display = String(parseFloat(display)/100); }
        else if (v === '=') { if(op&&prev){ display=String(eval(prev+op+display)); op=''; prev=''; } }
        else if ('+-×÷'.indexOf(v)>=0) { prev=display; op=v.replace('×','*').replace('÷','/'); display='0'; }
        else if (v === '.' && display.indexOf('.')>=0) return;
        else { display = display==='0'?v:display+v; }
        d.textContent = display.length>12 ? parseFloat(display).toExponential(6) : display;
      });
    });
  }
  function launch() { var w = BOS.createWindow({title:'Calculator',icon:'🔢',width:280,height:360,content:createUI()}); setupEvents(w); }
  BOS.registerApp({ id:'calculator', name:'Calculator', icon:'🔢', category:'utility', launch:launch });
})();
