// ═══════════════════════════════════════════════════════════════
// APP 2 — FILE MANAGER
// ═══════════════════════════════════════════════════════════════
(function() {
  var currentPath = '/home';
  var pathHistory = ['/home'];
  var historyIndex = 0;
  var sortBy = 'name';
  var sortAsc = true;

  var FAVORITES = [
    { name: 'Home', path: '/home' },
    { name: 'Desktop', path: '/home/b-os/Desktop' },
    { name: 'Documents', path: '/home/b-os/Documents' },
    { name: 'Downloads', path: '/home/b-os/Downloads' },
    { name: '/etc', path: '/etc' },
    { name: '/tmp', path: '/tmp' }
  ];

  function fileIcon(name, type) {
    if (type === 'dir') return '<span style="color:#00f0ff;">📁</span>';
    var ext = name.split('.').pop().toLowerCase();
    if (['txt','md','log','csv'].indexOf(ext) !== -1) return '<span style="color:#ffaa00;">📄</span>';
    if (['js','html','css','json','py','rb','go','rs','ts','jsx','tsx'].indexOf(ext) !== -1) return '<span style="color:#00ff88;">⟨/⟩</span>';
    if (['png','jpg','jpeg','gif','svg','webp','bmp'].indexOf(ext) !== -1) return '<span style="color:#ff00ff;">🖼</span>';
    if (['mp3','wav','ogg','flac'].indexOf(ext) !== -1) return '<span style="color:#ffaa00;">🎵</span>';
    if (['mp4','mkv','avi','mov'].indexOf(ext) !== -1) return '<span style="color:#ff00ff;">🎬</span>';
    if (['zip','tar','gz','7z','rar'].indexOf(ext) !== -1) return '<span style="color:#ffaa00;">📦</span>';
    return '<span style="color:#555580;">■</span>';
  }

  function formatSize(bytes) {
    if (bytes === undefined || bytes === null) return '-';
    if (bytes === 0) return '0 B';
    var units = ['B','KB','MB','GB','TB'];
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
  }

  function formatDate(d) {
    if (!d) return '-';
    var dt = new Date(d);
    if (isNaN(dt)) return d;
    var mon = String(dt.getMonth()+1).padStart(2,'0');
    var day = String(dt.getDate()).padStart(2,'0');
    var yr = dt.getFullYear();
    var hr = String(dt.getHours()).padStart(2,'0');
    var mn = String(dt.getMinutes()).padStart(2,'0');
    return yr + '-' + mon + '-' + day + ' ' + hr + ':' + mn;
  }

  function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function createUI() {
    return '<div class="bos-app" style="display:flex;flex-direction:column;height:100%;background:#050510;color:#e8eaff;font-family:var(--font-mono,monospace);font-size:12px;overflow:hidden;">' +
      /* Toolbar */
      '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#0a0a1a;border-bottom:1px solid rgba(0,240,255,0.1);">' +
        '<button id="fm-back" title="Back" style="background:none;border:1px solid #181848;color:#9999cc;padding:4px 8px;border-radius:2px;cursor:pointer;font-size:12px;">◀</button>' +
        '<button id="fm-forward" title="Forward" style="background:none;border:1px solid #181848;color:#9999cc;padding:4px 8px;border-radius:2px;cursor:pointer;font-size:12px;">▶</button>' +
        '<button id="fm-up" title="Up" style="background:none;border:1px solid #181848;color:#9999cc;padding:4px 8px;border-radius:2px;cursor:pointer;font-size:12px;">▲</button>' +
        '<button id="fm-refresh" title="Refresh" style="background:none;border:1px solid #181848;color:#9999cc;padding:4px 8px;border-radius:2px;cursor:pointer;font-size:12px;">↻</button>' +
        '<div style="flex:1;display:flex;align-items:center;gap:0;">' +
          '<input id="fm-address" type="text" value="' + esc(currentPath) + '" ' +
            'style="flex:1;background:#050510;border:1px solid #181848;color:#00f0ff;padding:4px 8px;border-radius:2px;font-family:var(--font-mono,monospace);font-size:12px;outline:none;" />' +
        '</div>' +
      '</div>' +
      /* Breadcrumb */
      '<div id="fm-breadcrumb" style="padding:6px 12px;background:#050510;border-bottom:1px solid rgba(0,240,255,0.05);"></div>' +
      /* Main content */
      '<div style="flex:1;display:flex;overflow:hidden;">' +
        /* Sidebar */
        '<div id="fm-sidebar" style="width:180px;min-width:180px;background:#0a0a1a;border-right:1px solid rgba(0,240,255,0.1);padding:8px 0;overflow-y:auto;">' +
          '<div style="padding:4px 12px;color:#555580;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:4px;">Favorites</div>' +
          FAVORITES.map(function(f) {
            return '<div class="fm-fav" data-path="' + esc(f.path) + '" ' +
              'style="padding:6px 12px;cursor:pointer;transition:background 0.15s;color:#9999cc;font-size:12px;">' +
              f.name + '</div>';
          }).join('') +
        '</div>' +
        /* File list */
        '<div style="flex:1;overflow-y:auto;">' +
          '<div id="fm-filelist" style="padding:0;"></div>' +
        '</div>' +
      '</div>' +
      /* Status bar */
      '<div id="fm-status" style="padding:4px 12px;background:#0a0a1a;border-top:1px solid rgba(0,240,255,0.1);color:#555580;font-size:11px;"></div>' +
    '</div>';
  }

  function renderBreadcrumb(el, path) {
    var parts = path.split('/').filter(Boolean);
    var html = '<span class="bos-breadcrumb" style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">';
    html += '<span data-path="/" style="cursor:pointer;color:#00f0ff;font-size:12px;padding:2px 6px;border-radius:2px;">/</span>';
    var accumulated = '';
    parts.forEach(function(p, i) {
      accumulated += '/' + p;
      html += '<span class="sep" style="color:#555580;padding:0 2px;">/</span>';
      html += '<span data-path="' + esc(accumulated) + '" style="cursor:pointer;color:#00f0ff;font-size:12px;padding:2px 6px;border-radius:2px;' +
        (i === parts.length - 1 ? 'color:#e8eaff;' : '') + '">' + esc(p) + '</span>';
    });
    html += '</span>';
    el.innerHTML = html;
  }

  function renderFileList(container, entries, statusEl) {
    var sorted = entries.slice().sort(function(a, b) {
if (a.type === 'dir' && b.type !== 'dir') return -1;
if (a.type !== 'dir' && b.type === 'dir') return 1;
      var cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'size') cmp = (a.size||0) - (b.size||0);
      else if (sortBy === 'type') cmp = (a.type||'').localeCompare(b.type||'');
      else if (sortBy === 'modified') cmp = (a.modified||'').localeCompare(b.modified||'');
      return sortAsc ? cmp : -cmp;
    });

    var html = '<table style="width:100%;border-collapse:collapse;font-size:12px;">';
    html += '<thead><tr style="background:#0a0a1a;border-bottom:1px solid rgba(0,240,255,0.1);">';
    var cols = [
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'size', label: 'Size' },
      { key: 'modified', label: 'Modified' }
    ];
    cols.forEach(function(c) {
      var arrow = sortBy === c.key ? (sortAsc ? ' ▲' : ' ▼') : '';
      html += '<th class="fm-col-header" data-sort="' + c.key + '" ' +
        'style="text-align:left;padding:8px 12px;color:#555580;font-weight:normal;cursor:pointer;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;user-select:none;white-space:nowrap;">' +
        c.label + arrow + '</th>';
    });
    html += '</tr></thead><tbody>';

    if (entries.length === 0) {
      html += '<tr><td colspan="4" style="padding:24px;text-align:center;color:#555580;">Empty directory</td></tr>';
    }

    sorted.forEach(function(entry) {
      html += '<tr class="fm-file-row" data-name="' + esc(entry.name) + '" data-type="' + esc(entry.type) + '" ' +
        'style="cursor:pointer;transition:background 0.15s;border-bottom:1px solid rgba(0,240,255,0.03);">' +
        '<td style="padding:6px 12px;color:#e8eaff;white-space:nowrap;">' + fileIcon(entry.name, entry.type) + ' ' + esc(entry.name) + '</td>' +
        '<td style="padding:6px 12px;color:#9999cc;">' + esc(entry.type || '-') + '</td>' +
        '<td style="padding:6px 12px;color:#9999cc;">' + formatSize(entry.size) + '</td>' +
        '<td style="padding:6px 12px;color:#555580;">' + formatDate(entry.modified) + '</td>' +
      '</tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;
    if (statusEl) {
      var dirs = entries.filter(function(e) { return e.type === 'dir'; }).length;
      var files = entries.length - dirs;
      statusEl.textContent = dirs + ' folder' + (dirs !== 1 ? 's' : '') + ', ' + files + ' file' + (files !== 1 ? 's' : '');
    }
  }

  function navigate(path, win, skipHistory) {
    if (!skipHistory) {
      pathHistory = pathHistory.slice(0, historyIndex + 1);
      pathHistory.push(path);
      historyIndex = pathHistory.length - 1;
    }
    currentPath = path;

    var addressInput = win.querySelector('#fm-address');
    var breadcrumbEl = win.querySelector('#fm-breadcrumb');
    var fileListEl = win.querySelector('#fm-filelist');
    var statusEl = win.querySelector('#fm-status');

    if (addressInput) addressInput.value = path;
    renderBreadcrumb(breadcrumbEl, path);

    var favs = win.querySelectorAll('.fm-fav');
    favs.forEach(function(f) {
      f.style.background = f.dataset.path === path ? 'rgba(0,240,255,0.08)' : 'transparent';
      f.style.color = f.dataset.path === path ? '#00f0ff' : '#9999cc';
    });

    fileListEl.innerHTML = '<div style="padding:24px;text-align:center;color:#555580;">Loading...</div>';

    API.listFiles(path).then(function(data) {
      if (data.error) {
        fileListEl.innerHTML = '<div style="padding:24px;text-align:center;color:#ff3355;">' + esc(data.error) + '</div>';
        if (statusEl) statusEl.textContent = 'Error';
        return;
      }
      renderFileList(fileListEl, data.entries || [], statusEl);
    }).catch(function(err) {
      fileListEl.innerHTML = '<div style="padding:24px;text-align:center;color:#ff3355;line-height:1.8;">Backend Offline<br><span style="color:#9999cc;">The desktop remains usable. Run <strong>./start-bos.sh</strong>; File Manager will reconnect when refreshed.</span></div>';
      if (statusEl) statusEl.textContent = 'Backend offline';
      if (err && err.message) console.warn('File Manager backend unavailable:', err.message);
    });
  }

  function showFileContent(win, filePath) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;inset:0;background:rgba(5,5,16,0.92);z-index:10;display:flex;flex-direction:column;overflow:hidden;';

    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#0a0a1a;border-bottom:1px solid rgba(0,240,255,0.1);';
    bar.innerHTML = '<span style="color:#00f0ff;font-size:12px;">' + esc(filePath.split('/').pop()) + '</span>' +
      '<button id="fm-close-viewer" style="background:none;border:1px solid #181848;color:#ff3355;padding:4px 8px;border-radius:2px;cursor:pointer;font-size:12px;">✕ Close</button>';

    var body = document.createElement('div');
    body.style.cssText = 'flex:1;overflow:auto;padding:12px 16px;font-family:var(--font-mono,monospace);font-size:12px;line-height:1.7;color:#e8eaff;white-space:pre-wrap;word-break:break-all;';
    body.textContent = 'Loading...';

    overlay.appendChild(bar);
    overlay.appendChild(body);
    win.style.position = 'relative';
    win.appendChild(overlay);

    overlay.querySelector('#fm-close-viewer').addEventListener('click', function() {
      overlay.remove();
    });

    API.readFile(filePath).then(function(data) {
      if (data.error) {
        body.textContent = data.error;
        body.style.color = '#ff3355';
      } else {
        body.textContent = data.content || '(empty file)';
      }
    }).catch(function(err) {
      body.textContent = 'Error reading file: ' + (err.message || 'Unknown error');
      body.style.color = '#ff3355';
    });
  }

  function setupEvents(win) {
    navigate(currentPath, win);

    win.querySelector('#fm-back').addEventListener('click', function() {
      if (historyIndex > 0) {
        historyIndex--;
        navigate(pathHistory[historyIndex], win, true);
      }
    });

    win.querySelector('#fm-forward').addEventListener('click', function() {
      if (historyIndex < pathHistory.length - 1) {
        historyIndex++;
        currentPath = pathHistory[historyIndex];
        navigate(currentPath, win);
      }
    });

    win.querySelector('#fm-up').addEventListener('click', function() {
      var parts = currentPath.split('/').filter(Boolean);
      if (parts.length > 0) {
        parts.pop();
        navigate('/' + parts.join('/') || '/', win);
      }
    });

    win.querySelector('#fm-refresh').addEventListener('click', function() {
      navigate(currentPath, win);
    });

    win.querySelector('#fm-address').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        navigate(this.value.trim(), win);
      }
    });

    win.querySelector('#fm-breadcrumb').addEventListener('click', function(e) {
      var target = e.target;
      if (target.dataset && target.dataset.path) {
        navigate(target.dataset.path, win);
      }
    });

    win.querySelector('#fm-sidebar').addEventListener('click', function(e) {
      var fav = e.target.closest('.fm-fav');
      if (fav && fav.dataset.path) {
        navigate(fav.dataset.path, win);
      }
    });

    win.querySelector('#fm-filelist').addEventListener('click', function(e) {
      var header = e.target.closest('.fm-col-header');
      if (header) {
        var sort = header.dataset.sort;
        if (sortBy === sort) { sortAsc = !sortAsc; } else { sortBy = sort; sortAsc = true; }
        navigate(currentPath, win);
        return;
      }
      var row = e.target.closest('.fm-file-row');
      if (row) {
        var name = row.dataset.name;
        var type = row.dataset.type;
        if (type === 'dir') {
          var newPath = currentPath === '/' ? '/' + name : currentPath + '/' + name;
          navigate(newPath, win);
        } else {
          var filePath = currentPath === '/' ? '/' + name : currentPath + '/' + name;
          showFileContent(win, filePath);
        }
      }
    });

    win.querySelector('#fm-filelist').addEventListener('mouseover', function(e) {
      var row = e.target.closest('.fm-file-row');
      if (row) row.style.background = 'rgba(0,240,255,0.04)';
    });
    win.querySelector('#fm-filelist').addEventListener('mouseout', function(e) {
      var row = e.target.closest('.fm-file-row');
      if (row) row.style.background = '';
    });

    win.querySelector('#fm-filelist').addEventListener('contextmenu', function(e) {
      var row = e.target.closest('.fm-file-row');
      if (!row) return;
      e.preventDefault();
      var name = row.dataset.name;
      var fpath = currentPath === '/' ? '/' + name : currentPath + '/' + name;
      var action = confirm('File: '+name+'\n\n[OK] = Delete\n[Cancel] to skip');
      if (action) {
        API.fileOperation('delete', fpath).then(function(result) {
          if (result.error) throw new Error(result.error);
          navigate(currentPath, win);
        }).catch(function(error) {
          console.warn('File Manager delete failed:', error);
          showToast('File Manager', error && error.message ? error.message : 'Delete failed');
        });
      }
    });
  }

  function launch() {
    var win = BOS.createWindow({
      title: 'File Manager',
      icon: '📁',
      width: 750,
      height: 480,
      content: createUI(),
      onClose: function() { pathHistory = ['/home']; historyIndex = 0; currentPath = '/home'; }
    });
    setupEvents(win);
  }

  BOS.registerApp({
    id: 'files',
    name: 'File Manager',
    icon: '📁',
    category: 'system',
    launch: launch
  });
})();
