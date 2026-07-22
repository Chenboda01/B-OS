// ═══════════════════════════════════════════════════════════════
// B-OS Desktop Applications — apps.js
// Core applications registered with the BOS shell
// ═══════════════════════════════════════════════════════════════

// ─── Shared styles injected once ───────────────────────────────
(function injectSharedStyles() {
  if (document.getElementById('bos-app-styles')) return;
  var s = document.createElement('style');
  s.id = 'bos-app-styles';
  s.textContent = `
    /* ── App-level base reset (scoped to window content) ── */
    .bos-app * { box-sizing: border-box; }
    .bos-app input, .bos-app button, .bos-app textarea {
      font-family: var(--font-mono, 'Consolas','SF Mono','Fira Code','Courier New',monospace);
    }
    .bos-app ::-webkit-scrollbar { width: 6px; height: 6px; }
    .bos-app ::-webkit-scrollbar-track { background: var(--void, #050510); }
    .bos-app ::-webkit-scrollbar-thumb {
      background: var(--surface, #111130);
      border-radius: 3px;
    }
    .bos-app ::-webkit-scrollbar-thumb:hover {
      background: var(--elevated, #181848);
    }

    /* ── Breadcrumb ── */
    .bos-breadcrumb { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
    .bos-breadcrumb span {
      cursor: pointer;
      color: var(--cyan, #00f0ff);
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 2px;
      transition: background 0.2s;
    }
    .bos-breadcrumb span:hover { background: rgba(0,240,255,0.1); }
    .bos-breadcrumb .sep { color: var(--text-dim, #555580); cursor: default; padding: 0 2px; }
    .bos-breadcrumb .sep:hover { background: none; }
  `;
  document.head.appendChild(s);
})();
