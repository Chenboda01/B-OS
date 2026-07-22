// ═══════════════════════════════════════════════════════════════
// APP 4 — BROWSER
// ═══════════════════════════════════════════════════════════════
(function() {
  function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function createUI() {
    return '<div class="bos-app" style="display:flex;flex-direction:column;height:100%;background:#050510;color:#e8eaff;font-family:var(--font-mono,monospace);font-size:12px;overflow:hidden;">' +
      '<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:#0a0a1a;border-bottom:1px solid rgba(0,240,255,0.1);flex-wrap:wrap;">' +
        '<input id="br-url" type="text" placeholder="Enter URL or search..." ' +
          'style="flex:1;min-width:200px;background:#050510;border:1px solid #181848;color:#00f0ff;padding:4px 10px;border-radius:2px;font-family:var(--font-mono,monospace);font-size:12px;outline:none;" />' +
        '<button id="br-go" style="background:#00f0ff;color:#050510;border:none;padding:4px 12px;border-radius:2px;cursor:pointer;font-weight:bold;font-size:12px;">Open</button>' +
      '</div>' +
      '<div style="display:flex;gap:6px;padding:6px 10px;background:#050510;border-bottom:1px solid rgba(0,240,255,0.05);flex-wrap:wrap;">' +
        '<span class="br-quick" data-url="https://www.google.com" style="cursor:pointer;color:#9999cc;font-size:11px;padding:4px 12px;border:1px solid #181848;border-radius:2px;transition:all 0.2s;">Google</span>' +
        '<span class="br-quick" data-url="https://www.bing.com" style="cursor:pointer;color:#9999cc;font-size:11px;padding:4px 12px;border:1px solid #181848;border-radius:2px;transition:all 0.2s;">Bing</span>' +
        '<span class="br-quick" data-url="https://duckduckgo.com" style="cursor:pointer;color:#9999cc;font-size:11px;padding:4px 12px;border:1px solid #181848;border-radius:2px;transition:all 0.2s;">DuckDuckGo</span>' +
        '<span class="br-quick" data-url="https://github.com" style="cursor:pointer;color:#9999cc;font-size:11px;padding:4px 12px;border:1px solid #181848;border-radius:2px;transition:all 0.2s;">GitHub</span>' +
      '</div>' +
      '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;text-align:center;">' +
        '<div style="font-size:48px;margin-bottom:16px;opacity:0.3;">🌎</div>' +
        '<div style="color:#9999cc;font-size:13px;margin-bottom:8px;">B-OS Browser</div>' +
        '<div style="color:#555580;font-size:11px;max-width:400px;line-height:1.6;">' +
          'Type a URL or search query above and press Enter.<br>' +
          'Sites open in your real browser for full compatibility.<br><br>' +
          '<span style="color:#00f0ff;">Quick links</span> above open popular sites instantly.' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function openURL(url) {
    if (!url) return;
    if (!/^https?:\/\//.test(url)) {
      if (url.includes('.') && !url.includes(' ')) url = 'https://' + url;
      else url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
    }
    window.open(url, '_blank');
  }

  function setupEvents(win) {
    win.querySelector('#br-go').addEventListener('click', function() {
      openURL(win.querySelector('#br-url').value.trim());
    });
    win.querySelector('#br-url').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') openURL(this.value.trim());
    });
    win.querySelectorAll('.br-quick').forEach(function(link) {
      link.addEventListener('click', function() { openURL(this.dataset.url); });
      link.addEventListener('mouseover', function() { this.style.color = '#00f0ff'; this.style.borderColor = '#00f0ff'; });
      link.addEventListener('mouseout', function() { this.style.color = '#9999cc'; this.style.borderColor = '#181848'; });
    });
  }

  function launch() {
    var win = BOS.createWindow({
      title: 'Browser',
      icon: '🌎',
      width: 800,
      height: 550,
      content: createUI(),
      onClose: function() {}
    });
    setupEvents(win);
  }

  BOS.registerApp({
    id: 'browser',
    name: 'Browser',
    icon: '🌎',
    category: 'network',
    launch: launch
  });
})();
