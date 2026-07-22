// ═══════════════════════════════════════════════════════════════
// APP 7 — GAMES
// ═══════════════════════════════════════════════════════════════
(function() {
  var GAMES = [
    { name: 'Space Invaders B-OS', icon: '👾', color: '#00f0ff', desc: 'Defend the planet from alien invaders' },
    { name: 'Terminal Quest', icon: '⚔', color: '#ff00ff', desc: 'A text-based adventure through the system' },
    { name: 'Pixel Racer', icon: '🏎', color: '#00ff88', desc: 'High-speed racing in the neon grid' },
    { name: 'Code Breaker', icon: '🔐', color: '#ffaa00', desc: 'Crack the code before time runs out' }
  ];

  function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function createUI() {
    return '<div class="bos-app" style="display:flex;flex-direction:column;align-items:center;height:100%;background:#050510;color:#e8eaff;font-family:var(--font-mono,monospace);overflow-y:auto;padding:20px;">' +
      /* Header */
      '<div style="text-align:center;margin-bottom:24px;">' +
        '<div style="font-size:24px;margin-bottom:4px;">🎮</div>' +
        '<div style="font-size:16px;font-weight:bold;color:#e8eaff;margin-bottom:4px;">B-OS Games</div>' +
        '<div style="font-size:12px;color:#555580;">Games are under development. Check back soon!</div>' +
      '</div>' +
      /* Game grid */
      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;width:100%;max-width:420px;">' +
        GAMES.map(function(game, i) {
          return '<div class="game-card" ' +
            'style="background:#0a0a1a;border:1px solid #181848;border-radius:4px;padding:20px 16px;text-align:center;position:relative;overflow:hidden;cursor:not-allowed;transition:all 0.3s;opacity:0.7;">' +
            /* Abstract background glow */
            '<div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:' + game.color + ';filter:blur(40px);opacity:0.08;"></div>' +
            /* Icon */
            '<div style="font-size:32px;margin-bottom:8px;filter:blur(0.5px);">' + game.icon + '</div>' +
            /* Name */
            '<div style="font-size:13px;font-weight:bold;color:#e8eaff;margin-bottom:4px;">' + esc(game.name) + '</div>' +
            /* Description */
            '<div style="font-size:10px;color:#555580;margin-bottom:8px;line-height:1.4;">' + esc(game.desc) + '</div>' +
            /* Badge */
            '<div style="display:inline-block;padding:2px 8px;border:1px solid ' + game.color + ';border-radius:2px;color:' + game.color + ';font-size:9px;letter-spacing:0.1em;text-transform:uppercase;">Coming Q4 2026</div>' +
          '</div>';
        }).join('') +
      '</div>' +
      /* Footer note */
      '<div style="margin-top:24px;text-align:center;color:#555580;font-size:11px;">' +
        'More games coming in future updates.<br>' +
        'Suggest a game on <span style="color:#00f0ff;">GitHub</span>!' +
      '</div>' +
    '</div>';
  }

  function setupEvents(win) {
    var cards = win.querySelectorAll('.game-card');
    cards.forEach(function(card, i) {
      var color = GAMES[i].color;
      card.addEventListener('mouseover', function() {
        this.style.borderColor = color;
        this.style.opacity = '1';
        this.style.boxShadow = '0 0 20px ' + color.replace(')', ',0.15)').replace('rgb', 'rgba');
      });
      card.addEventListener('mouseout', function() {
        this.style.borderColor = '#181848';
        this.style.opacity = '0.7';
        this.style.boxShadow = 'none';
      });
    });
  }

  function launch() {
    var win = BOS.createWindow({
      title: 'Games',
      icon: '🎮',
      width: 480,
      height: 420,
      content: createUI(),
      onClose: function() {}
    });
    setupEvents(win);
  }

  BOS.registerApp({
    id: 'games',
    name: 'Games',
    icon: '🎮',
    category: 'entertainment',
    launch: launch
  });
})();
