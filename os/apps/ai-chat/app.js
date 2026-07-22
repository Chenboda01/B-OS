// ═══════════════════════════════════════════════════════════════
// APP 3 — AI CHAT
// ═══════════════════════════════════════════════════════════════
(function() {
  var chatHistory = [];
  var isThinking = false;

  function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  }

  function timestamp() {
    var d = new Date();
    var h = String(d.getHours()).padStart(2, '0');
    var m = String(d.getMinutes()).padStart(2, '0');
    return h + ':' + m;
  }

  function createUI() {
    return '<div class="bos-app" style="display:flex;flex-direction:column;height:100%;background:#050510;color:#e8eaff;font-family:var(--font-mono,monospace);font-size:13px;overflow:hidden;">' +
      /* Header */
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 16px;background:#0a0a1a;border-bottom:1px solid rgba(0,240,255,0.1);">' +
        '<span style="color:#ff00ff;font-size:13px;">🤖 B-OS AI Chat</span>' +
        '<button id="ai-new" style="background:none;border:1px solid #181848;color:#9999cc;padding:4px 10px;border-radius:2px;cursor:pointer;font-size:11px;font-family:var(--font-mono,monospace);">New Chat</button>' +
      '</div>' +
      /* Messages */
      '<div id="ai-messages" style="flex:1;overflow-y:auto;padding:16px;"></div>' +
      /* Input */
      '<div style="padding:12px 16px;background:#0a0a1a;border-top:1px solid rgba(0,240,255,0.1);display:flex;gap:8px;">' +
        '<input id="ai-input" type="text" placeholder="Type a message..." ' +
          'style="flex:1;background:#050510;border:1px solid #181848;color:#e8eaff;padding:8px 12px;border-radius:2px;font-family:var(--font-mono,monospace);font-size:13px;outline:none;" />' +
        '<button id="ai-send" style="background:#00f0ff;color:#050510;border:none;padding:8px 16px;border-radius:2px;cursor:pointer;font-family:var(--font-mono,monospace);font-size:12px;font-weight:bold;transition:box-shadow 0.2s;">SEND</button>' +
      '</div>' +
    '</div>';
  }

  function addMessage(container, role, text) {
    var isUser = role === 'user';
    var div = document.createElement('div');
    div.style.cssText = 'margin-bottom:12px;display:flex;flex-direction:column;' + (isUser ? 'align-items:flex-end;' : 'align-items:flex-start;');

    var bubble = document.createElement('div');
    bubble.style.cssText = 'max-width:85%;padding:10px 14px;border-radius:4px;font-size:13px;line-height:1.6;' +
      (isUser
        ? 'background:rgba(0,240,255,0.08);color:#e8eaff;border:1px solid rgba(0,240,255,0.15);'
        : 'background:rgba(255,0,255,0.06);color:#e8eaff;border:1px solid rgba(255,0,255,0.12);');
    bubble.innerHTML = esc(text);

    var ts = document.createElement('div');
    ts.style.cssText = 'font-size:10px;color:#555580;margin-top:4px;padding:0 4px;';
    ts.textContent = (isUser ? 'You' : 'B-OS AI') + ' · ' + timestamp();

    div.appendChild(bubble);
    div.appendChild(ts);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function addThinking(container) {
    var div = document.createElement('div');
    div.id = 'ai-thinking';
    div.style.cssText = 'margin-bottom:12px;display:flex;align-items:flex-start;';
    div.innerHTML =
      '<div style="max-width:85%;padding:10px 14px;border-radius:4px;background:rgba(255,0,255,0.06);border:1px solid rgba(255,0,255,0.12);color:#ff00ff;font-size:13px;">' +
        '<span style="display:inline-block;width:8px;height:8px;background:#ff00ff;border-radius:50%;margin-right:6px;animation:aiPulse 1s ease-in-out infinite;vertical-align:middle;"></span>' +
        'Thinking...' +
      '</div>';

    if (!document.getElementById('ai-pulse-style')) {
      var s = document.createElement('style');
      s.id = 'ai-pulse-style';
      s.textContent = '@keyframes aiPulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.4;transform:scale(0.8);}}';
      document.head.appendChild(s);
    }

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function removeThinking() {
    var el = document.getElementById('ai-thinking');
    if (el) el.remove();
  }

  function sendMessage(container) {
    var input = container.closest('.bos-app').querySelector('#ai-input');
    var text = input.value.trim();
    if (!text || isThinking) return;

    input.value = '';
    addMessage(container, 'user', text);
    chatHistory.push({ role: 'user', content: text });

    isThinking = true;
    addThinking(container);

    API.chat(text, chatHistory).then(function(data) {
      removeThinking();
      isThinking = false;
      if (data.reply) {
        addMessage(container, 'assistant', data.reply);
        chatHistory.push({ role: 'assistant', content: data.reply });
      }
      if (data.error && data.error !== 'no_api_key') {
        addMessage(container, 'assistant', '⚠ ' + data.error);
      }
    }).catch(function(err) {
      removeThinking();
      isThinking = false;
      addMessage(container, 'assistant', '⚠ Could not reach the AI backend. Is the server running on ' + API.baseUrl + '?');
    });
  }

  function setupEvents(win) {
    var messagesEl = win.querySelector('#ai-messages');
    var inputEl = win.querySelector('#ai-input');
    var sendBtn = win.querySelector('#ai-send');

    addMessage(messagesEl, 'assistant', 'Hello! I\'m B-OS AI, powered by QWEN. How can I help you today?');

    sendBtn.addEventListener('click', function() { sendMessage(messagesEl); });
    inputEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(messagesEl);
      }
    });
    sendBtn.addEventListener('mouseover', function() {
      this.style.boxShadow = '0 0 16px rgba(0,240,255,0.4)';
    });
    sendBtn.addEventListener('mouseout', function() {
      this.style.boxShadow = 'none';
    });

    win.querySelector('#ai-new').addEventListener('click', function() {
      chatHistory = [];
      messagesEl.innerHTML = '';
      addMessage(messagesEl, 'assistant', 'Chat cleared. How can I help you?');
    });
  }

  function launch() {
    var win = BOS.createWindow({
      title: 'AI Chat',
      icon: '🤖',
      width: 600,
      height: 500,
      content: createUI(),
      onClose: function() { chatHistory = []; isThinking = false; }
    });
    setupEvents(win);
  }

  BOS.registerApp({
    id: 'aichat',
    name: 'AI Chat',
    icon: '🤖',
    category: 'ai',
    launch: launch
  });
})();
