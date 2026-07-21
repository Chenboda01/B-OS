(function() {
  'use strict';

  var style = document.createElement('style');
  style.textContent =
    '.adv-app{height:100%;background:#050510;color:#e8eaff;font:12px var(--font-mono);overflow:auto;padding:16px}' +
    '.adv-card{border:1px solid #181848;background:#0a0a1a;border-radius:4px;padding:12px;margin-bottom:10px}' +
    '.adv-title{font-size:14px;font-weight:bold;margin-bottom:4px;color:#e8eaff}' +
    '.adv-muted{color:#66668f;font-size:10px;line-height:1.6}' +
    '.adv-input,.adv-select,.adv-textarea{width:100%;background:#050510;color:#e8eaff;border:1px solid #181848;padding:8px;font:11px var(--font-mono);outline:none}' +
    '.adv-textarea{resize:vertical;min-height:90px}' +
    '.adv-input:focus,.adv-textarea:focus,.adv-select:focus{border-color:#00f0ff}' +
    '.adv-btn{background:#0078d4;color:white;border:0;border-radius:3px;padding:7px 12px;cursor:pointer;font:10px var(--font-mono)}' +
    '.adv-btn.alt{background:#181848;color:#00f0ff;border:1px solid #303060}' +
    '.adv-btn.danger{background:rgba(255,51,85,.12);color:#ff3355;border:1px solid rgba(255,51,85,.3)}' +
    '.adv-row{display:flex;gap:8px;align-items:center}.adv-row>*{min-width:0}' +
    '.adv-output{white-space:pre-wrap;word-break:break-word;background:#03030b;border:1px solid #181848;padding:10px;min-height:60px;color:#cdd0ff}' +
    '.ai-tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:12px}.ai-tab.active{background:#00f0ff;color:#02020a}' +
    '.ai-panel{display:none}.ai-panel.active{display:block}';
  document.head.appendChild(style);

  function esc(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Multi-monitor awareness ──────────────────────────────────
  (function() {
    function createUI() {
      return '<div class="adv-app"><div class="adv-title">Display Manager</div>' +
        '<div class="adv-muted" style="margin-bottom:12px;">Inspect connected displays using the Window Management API when the browser supports it.</div>' +
        '<button id="display-detect" class="adv-btn">Detect Displays</button>' +
        '<div id="display-status" class="adv-muted" style="margin:10px 0;"></div><div id="display-list"></div></div>';
    }
    function render(list, details) {
      var current = details && details.currentScreen;
      list.replaceChildren();
      details.screens.forEach(function(screen, index) {
        var card = document.createElement('div');
        card.className = 'adv-card';
        var title = document.createElement('div');
        title.className = 'adv-title';
        title.textContent = 'Display ' + (index + 1) + (screen === current ? ' · Current' : '') + (screen.isPrimary ? ' · Primary' : '');
        var body = document.createElement('div');
        body.className = 'adv-muted';
        body.textContent = screen.width + '×' + screen.height + ' · available ' + screen.availWidth + '×' + screen.availHeight + ' · scale ' + (screen.devicePixelRatio || window.devicePixelRatio || 1);
        card.appendChild(title); card.appendChild(body); list.appendChild(card);
      });
    }
    function setupEvents(win) {
      var status = win.querySelector('#display-status');
      var list = win.querySelector('#display-list');
      function fallback() {
        status.textContent = screen.isExtended ? 'Multiple displays detected; detailed permission is not available.' : 'Primary display information (extended display API unavailable).';
        render(list, { currentScreen: screen, screens: [screen] });
      }
      fallback();
      win.querySelector('#display-detect').addEventListener('click', function() {
        if (!window.getScreenDetails) { fallback(); return; }
        status.textContent = 'Requesting display information…';
        window.getScreenDetails().then(function(details) {
          status.textContent = details.screens.length + ' display' + (details.screens.length === 1 ? '' : 's') + ' detected.';
          render(list, details);
        }).catch(function(err) {
          status.textContent = 'Display access unavailable: ' + (err.message || err.name);
          fallback();
        });
      });
    }
    function launch() { var win = BOS.createWindow({ title:'Display Manager', icon:'🖥', width:520, height:420, content:createUI() }); setupEvents(win); }
    BOS.registerApp({ id:'displays', name:'Display Manager', icon:'🖥', category:'system', launch:launch });
  })();

  // ── Clipboard manager ────────────────────────────────────────
  (function() {
    function storageKey() {
      var user = window.BOS_Auth && window.BOS_Auth.getCurrentUser();
      return 'bos-clipboard-' + (user ? user.username : 'guest');
    }
    function loadHistory() {
      try { return JSON.parse(localStorage.getItem(storageKey()) || '[]'); } catch (e) { return []; }
    }
    function saveHistory(history) { localStorage.setItem(storageKey(), JSON.stringify(history.slice(0, 30))); }
    function remember(text) {
      text = String(text || '').trim();
      if (!text) return;
      var history = loadHistory().filter(function(item) { return item.text !== text; });
      history.unshift({ text:text.slice(0, 4000), time:new Date().toISOString() });
      saveHistory(history);
    }
    document.addEventListener('copy', function() { setTimeout(function() { remember(window.getSelection().toString()); }, 0); });
    document.addEventListener('paste', function(e) { remember(e.clipboardData && e.clipboardData.getData('text/plain')); });

    function createUI() {
      return '<div class="adv-app"><div class="adv-title">Clipboard Manager</div><div class="adv-muted" style="margin-bottom:12px;">Recent copied text is stored locally for the signed-in B-OS user.</div>' +
        '<div class="adv-row" style="margin-bottom:10px;"><button id="clip-import" class="adv-btn">Read System Clipboard</button><button id="clip-clear" class="adv-btn danger">Clear History</button></div>' +
        '<textarea id="clip-manual" class="adv-textarea" placeholder="Add text manually…" style="min-height:55px"></textarea><button id="clip-add" class="adv-btn alt" style="margin:7px 0 12px;">Add to History</button><div id="clip-list"></div></div>';
    }
    function setupEvents(win) {
      var list = win.querySelector('#clip-list');
      function render() {
        var history = loadHistory(); list.replaceChildren();
        if (!history.length) { list.innerHTML = '<div class="adv-muted">Clipboard history is empty.</div>'; return; }
        history.forEach(function(item, index) {
          var card = document.createElement('div'); card.className = 'adv-card';
          var text = document.createElement('div'); text.textContent = item.text; text.style.whiteSpace = 'pre-wrap'; text.style.marginBottom = '8px';
          var copy = document.createElement('button'); copy.className = 'adv-btn'; copy.textContent = 'Copy';
          copy.addEventListener('click', function() { navigator.clipboard.writeText(item.text).then(function(){showToast('Clipboard','Copied');}).catch(function(){showToast('Clipboard','Copy blocked');}); });
          var remove = document.createElement('button'); remove.className = 'adv-btn danger'; remove.textContent = 'Remove'; remove.style.marginLeft = '6px';
          remove.addEventListener('click', function() { var h=loadHistory(); h.splice(index,1); saveHistory(h); render(); });
          card.appendChild(text); card.appendChild(copy); card.appendChild(remove); list.appendChild(card);
        });
      }
      win.querySelector('#clip-import').addEventListener('click', function() {
        if (!navigator.clipboard || !navigator.clipboard.readText) { showToast('Clipboard','Clipboard reading is unavailable'); return; }
        navigator.clipboard.readText().then(function(text){remember(text);render();}).catch(function(){showToast('Clipboard','Clipboard permission was denied');});
      });
      win.querySelector('#clip-add').addEventListener('click', function() { remember(win.querySelector('#clip-manual').value); win.querySelector('#clip-manual').value=''; render(); });
      win.querySelector('#clip-clear').addEventListener('click', function() { saveHistory([]); render(); });
      render();
    }
    function launch() { var win=BOS.createWindow({title:'Clipboard Manager',icon:'📋',width:520,height:460,content:createUI()});setupEvents(win); }
    BOS.registerApp({id:'clipboard',name:'Clipboard Manager',icon:'📋',category:'utility',launch:launch});
  })();

  // ── AI-native workspace ──────────────────────────────────────
  (function() {
    var lastVoiceReply = '';
    function createUI() {
      return '<div class="adv-app"><div class="adv-title">AI Studio</div><div class="adv-muted" style="margin-bottom:12px;">File editing, terminal help, coding, voice, and safe agent workflows.</div>' +
        '<div class="ai-tabs">' + ['file','terminal','coding','voice','workflow'].map(function(id,i){return '<button class="adv-btn ai-tab'+(i===0?' active':'')+'" data-panel="'+id+'">'+id.toUpperCase()+'</button>';}).join('') + '</div>' +
        '<section class="ai-panel active" data-panel="file"><div class="adv-row"><input id="ai-file-path" class="adv-input" value="/tmp/bos-ai-file.txt" aria-label="File path"><button id="ai-file-load" class="adv-btn">Load</button><button id="ai-file-save" class="adv-btn alt">Save</button></div><textarea id="ai-file-editor" class="adv-textarea" style="min-height:180px;margin-top:8px" placeholder="File content"></textarea><textarea id="ai-file-instruction" class="adv-textarea" style="min-height:60px;margin-top:8px" placeholder="Describe the edit"></textarea><button id="ai-file-edit" class="adv-btn" style="margin-top:8px">Generate Edit</button><button id="ai-file-apply" class="adv-btn alt" style="margin-top:8px">Apply Preview</button><div id="ai-file-status" class="adv-muted" style="margin:8px 0"></div><pre id="ai-file-preview" class="adv-output"></pre></section>' +
        '<section class="ai-panel" data-panel="terminal"><textarea id="ai-term-goal" class="adv-textarea" placeholder="Describe what you want to do in Manjaro"></textarea><button id="ai-term-suggest" class="adv-btn">Suggest Command</button><button id="ai-term-run" class="adv-btn danger">Run Suggested Command</button><pre id="ai-term-output" class="adv-output" style="margin-top:8px"></pre></section>' +
        '<section class="ai-panel" data-panel="coding"><textarea id="ai-code-task" class="adv-textarea" placeholder="Describe a coding task, language, and constraints"></textarea><button id="ai-code-send" class="adv-btn">Ask Coding Assistant</button><pre id="ai-code-output" class="adv-output" style="margin-top:8px"></pre></section>' +
        '<section class="ai-panel" data-panel="voice"><div class="adv-row"><button id="ai-voice-listen" class="adv-btn">Start Listening</button><button id="ai-voice-send" class="adv-btn alt">Send to AI</button><button id="ai-voice-speak" class="adv-btn alt">Speak Reply</button></div><textarea id="ai-voice-text" class="adv-textarea" style="margin-top:8px" placeholder="Voice transcript"></textarea><pre id="ai-voice-output" class="adv-output"></pre></section>' +
        '<section class="ai-panel" data-panel="workflow"><select id="ai-flow-template" class="adv-select"><option value="build">Build feature</option><option value="debug">Debug issue</option><option value="research">Research and summarize</option></select><textarea id="ai-flow-goal" class="adv-textarea" style="margin-top:8px" placeholder="Workflow goal"></textarea><button id="ai-flow-run" class="adv-btn">Run Agent Workflow</button><pre id="ai-flow-output" class="adv-output" style="margin-top:8px"></pre></section></div>';
    }
    function setupEvents(win) {
      win.querySelectorAll('.ai-tab').forEach(function(tab) { tab.addEventListener('click', function() { var id=this.dataset.panel; win.querySelectorAll('.ai-tab').forEach(function(t){t.classList.toggle('active',t.dataset.panel===id);}); win.querySelectorAll('.ai-panel').forEach(function(p){p.classList.toggle('active',p.dataset.panel===id);}); }); });
      var filePreview = '';
      win.querySelector('#ai-file-load').addEventListener('click', function(){var p=win.querySelector('#ai-file-path').value;API.readFile(p).then(function(r){if(r.error)throw new Error(r.error);win.querySelector('#ai-file-editor').value=r.content||'';win.querySelector('#ai-file-status').textContent='Loaded '+p;}).catch(function(e){win.querySelector('#ai-file-status').textContent=e.message;});});
      win.querySelector('#ai-file-save').addEventListener('click', function(){var p=win.querySelector('#ai-file-path').value;API.writeFile(p,win.querySelector('#ai-file-editor').value).then(function(r){win.querySelector('#ai-file-status').textContent=r.success?'Saved '+p:(r.error||'Save failed');});});
      win.querySelector('#ai-file-edit').addEventListener('click', function(){var out=win.querySelector('#ai-file-preview');out.textContent='Generating edit…';var prompt='Path: '+win.querySelector('#ai-file-path').value+'\nInstruction: '+win.querySelector('#ai-file-instruction').value+'\nCurrent file:\n'+win.querySelector('#ai-file-editor').value;API.chat(prompt,[],'file-edit').then(function(r){filePreview=r.reply||'';out.textContent=filePreview;});});
      win.querySelector('#ai-file-apply').addEventListener('click', function(){if(filePreview)win.querySelector('#ai-file-editor').value=filePreview;});
      var suggestedCommand='';
      win.querySelector('#ai-term-suggest').addEventListener('click',function(){var out=win.querySelector('#ai-term-output');out.textContent='Thinking…';API.chat(win.querySelector('#ai-term-goal').value,[],'terminal').then(function(r){var reply=r.reply||'';var lines=reply.split('\n').map(function(line){return line.trim();}).filter(function(line){return line&&line.indexOf('```')!==0;});suggestedCommand=(lines[0]||'').replace(/^\$\s*/, '').trim();out.textContent=reply;});});
      win.querySelector('#ai-term-run').addEventListener('click',function(){if(!suggestedCommand){showToast('AI Studio','Generate a command first');return;}if(!confirm('Run this command?\n\n'+suggestedCommand))return;API.exec(suggestedCommand,'~').then(function(r){win.querySelector('#ai-term-output').textContent+='\n\n'+(r.stdout||r.stderr||'Command completed.');});});
      win.querySelector('#ai-code-send').addEventListener('click',function(){var out=win.querySelector('#ai-code-output');out.textContent='Thinking…';API.chat(win.querySelector('#ai-code-task').value,[],'coding').then(function(r){out.textContent=r.reply||r.error||'';});});
      var Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
      win.querySelector('#ai-voice-listen').addEventListener('click',function(){if(!Recognition){showToast('Voice','Speech recognition is unavailable');return;}var recognition=new Recognition();recognition.lang='en-US';recognition.interimResults=false;recognition.onresult=function(e){win.querySelector('#ai-voice-text').value=e.results[0][0].transcript;};recognition.onerror=function(e){showToast('Voice','Recognition error: '+e.error);};recognition.start();});
      win.querySelector('#ai-voice-send').addEventListener('click',function(){var out=win.querySelector('#ai-voice-output');out.textContent='Thinking…';API.chat(win.querySelector('#ai-voice-text').value,[],'chat').then(function(r){lastVoiceReply=r.reply||'';out.textContent=lastVoiceReply;});});
      win.querySelector('#ai-voice-speak').addEventListener('click',function(){if(!lastVoiceReply||!window.speechSynthesis)return;window.speechSynthesis.cancel();window.speechSynthesis.speak(new SpeechSynthesisUtterance(lastVoiceReply));});
      win.querySelector('#ai-flow-run').addEventListener('click',async function(){var output=win.querySelector('#ai-flow-output');var goal=win.querySelector('#ai-flow-goal').value;var template=win.querySelector('#ai-flow-template').value;if(!goal.trim()){output.textContent='Enter a workflow goal.';return;}output.textContent='[1/3] Planning…';try{var plan=await API.chat('Workflow type: '+template+'\nGoal: '+goal,[],'workflow');output.textContent='[PLAN]\n'+(plan.reply||'')+'\n\n[2/3] Reviewing…';var review=await API.chat('Review this workflow for gaps and risks:\n'+(plan.reply||''),[],'coding');output.textContent+='\n[REVIEW]\n'+(review.reply||'')+'\n\n[3/3] Building verification…';var verify=await API.chat('Create a concise verification checklist for this goal: '+goal,[],'workflow');output.textContent+='\n[VERIFY]\n'+(verify.reply||'');}catch(e){output.textContent+='\nWorkflow failed: '+e.message;}});
    }
    function launch(){var win=BOS.createWindow({title:'AI Studio',icon:'🧠',width:760,height:600,content:createUI()});setupEvents(win);}
    BOS.registerApp({id:'aistudio',name:'AI Studio',icon:'🧠',category:'ai',launch:launch});
  })();
})();
