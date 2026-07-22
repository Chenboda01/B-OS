// Virtual Filesystem — IndexedDB-backed
(function() {
  'use strict';
  var DB_NAME = 'bos-filesystem';
  var DB_VERSION = 1;
  var db = null;

  function open() {
    return new Promise(function(resolve, reject) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function(e) {
        var d = e.target.result;
        if (!d.objectStoreNames.contains('files')) {
          var store = d.createObjectStore('files', { keyPath: 'path' });
          store.createIndex('parent', 'parent', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
      req.onsuccess = function(e) { db = e.target.result; resolve(db); };
      req.onerror = function(e) { reject(e.target.error); };
    });
  }

  function transaction(mode) { return db.transaction(['files'], mode).objectStore('files'); }

  function defaultDirs() {
    return [
      { path: '/', type: 'dir', parent: null, name: '', owner: 'b-os', createdAt: Date.now(), modifiedAt: Date.now() },
      { path: '/home', type: 'dir', parent: '/', name: 'home', owner: 'b-os', createdAt: Date.now(), modifiedAt: Date.now() },
      { path: '/home/b-os', type: 'dir', parent: '/home', name: 'b-os', owner: 'b-os', createdAt: Date.now(), modifiedAt: Date.now() },
      { path: '/home/b-os/Desktop', type: 'dir', parent: '/home/b-os', name: 'Desktop', owner: 'b-os', createdAt: Date.now(), modifiedAt: Date.now() },
      { path: '/home/b-os/Documents', type: 'dir', parent: '/home/b-os', name: 'Documents', owner: 'b-os', createdAt: Date.now(), modifiedAt: Date.now() },
      { path: '/home/b-os/Downloads', type: 'dir', parent: '/home/b-os', name: 'Downloads', owner: 'b-os', createdAt: Date.now(), modifiedAt: Date.now() },
      { path: '/home/b-os/Pictures', type: 'dir', parent: '/home/b-os', name: 'Pictures', owner: 'b-os', createdAt: Date.now(), modifiedAt: Date.now() },
      { path: '/home/b-os/.config', type: 'dir', parent: '/home/b-os', name: '.config', owner: 'b-os', createdAt: Date.now(), modifiedAt: Date.now() },
      { path: '/system', type: 'dir', parent: '/', name: 'system', owner: 'system', createdAt: Date.now(), modifiedAt: Date.now() },
      { path: '/system/apps', type: 'dir', parent: '/system', name: 'apps', owner: 'system', createdAt: Date.now(), modifiedAt: Date.now() },
      { path: '/system/themes', type: 'dir', parent: '/system', name: 'themes', owner: 'system', createdAt: Date.now(), modifiedAt: Date.now() },
      { path: '/system/logs', type: 'dir', parent: '/system', name: 'logs', owner: 'system', createdAt: Date.now(), modifiedAt: Date.now() },
      { path: '/tmp', type: 'dir', parent: '/', name: 'tmp', owner: 'system', createdAt: Date.now(), modifiedAt: Date.now() },
      { path: '/trash', type: 'dir', parent: '/', name: 'trash', owner: 'system', createdAt: Date.now(), modifiedAt: Date.now() }
    ];
  }

  function init() {
    return open().then(function() {
      var store = transaction('readonly');
      return new Promise(function(resolve) {
        var req = store.count();
        req.onsuccess = function() {
          if (req.result === 0) {
            var write = transaction('readwrite');
            var dirs = defaultDirs();
            var count = 0;
            dirs.forEach(function(d) {
              var r = write.put(d);
              r.onsuccess = function() { count++; if (count === dirs.length) resolve(true); };
              r.onerror = function() { resolve(true); };
            });
          } else { resolve(false); }
        };
        req.onerror = function() { resolve(false); };
      });
    });
  }

  function readFile(path) {
    return new Promise(function(resolve, reject) {
      var store = transaction('readonly');
      var req = store.get(path);
      req.onsuccess = function() { resolve(req.result || null); };
      req.onerror = function() { reject(req.error); };
    });
  }

  function writeFile(path, content, owner) {
    var parent = path.substring(0, path.lastIndexOf('/')) || '/';
    var name = path.substring(path.lastIndexOf('/') + 1);
    return new Promise(function(resolve, reject) {
      var store = transaction('readwrite');
      var file = {
        path: path,
        type: 'file',
        parent: parent,
        name: name,
        content: content || '',
        owner: owner || 'b-os',
        permissions: { read: true, write: true, execute: false },
        createdAt: Date.now(),
        modifiedAt: Date.now()
      };
      var req = store.put(file);
      req.onsuccess = function() { resolve(file); };
      req.onerror = function() { reject(req.error); };
    });
  }

  function mkdir(path) {
    var parent = path.substring(0, path.lastIndexOf('/')) || '/';
    var name = path.substring(path.lastIndexOf('/') + 1);
    return new Promise(function(resolve, reject) {
      var store = transaction('readwrite');
      var dir = {
        path: path,
        type: 'dir',
        parent: parent,
        name: name,
        owner: 'b-os',
        createdAt: Date.now(),
        modifiedAt: Date.now()
      };
      var req = store.put(dir);
      req.onsuccess = function() { resolve(dir); };
      req.onerror = function() { reject(req.error); };
    });
  }

  function listDir(path) {
    return new Promise(function(resolve, reject) {
      var store = transaction('readonly');
      var idx = store.index('parent');
      var req = idx.getAll(path);
      req.onsuccess = function() { resolve(req.result || []); };
      req.onerror = function() { reject(req.error); };
    });
  }

  function deleteEntry(path) {
    return new Promise(function(resolve, reject) {
      var store = transaction('readwrite');
      var req = store.get(path);
      req.onsuccess = function() {
        var entry = req.result;
        if (!entry) return resolve(false);
        if (entry.type === 'dir') {
          listAllDescendants(path).then(function(children) {
            var write = transaction('readwrite');
            children.forEach(function(c) { write.delete(c.path); });
            write.delete(path);
            resolve(true);
          });
        } else {
          store.delete(path);
          resolve(true);
        }
      };
      req.onerror = function() { reject(req.error); };
    });
  }

  function listAllDescendants(parentPath) {
    return new Promise(function(resolve) {
      var all = [];
      function collect(path) {
        return listDir(path).then(function(children) {
          var promises = children.map(function(c) {
            all.push(c);
            if (c.type === 'dir') return collect(c.path);
            return Promise.resolve();
          });
          return Promise.all(promises);
        });
      }
      collect(parentPath).then(function() { resolve(all); });
    });
  }

  function exists(path) {
    return new Promise(function(resolve) {
      var store = transaction('readonly');
      var req = store.get(path);
      req.onsuccess = function() { resolve(!!req.result); };
      req.onerror = function() { resolve(false); };
    });
  }

  function rename(oldPath, newPath) {
    return new Promise(function(resolve, reject) {
      var store = transaction('readwrite');
      var req = store.get(oldPath);
      req.onsuccess = function() {
        var entry = req.result;
        if (!entry) return reject(new Error('Not found'));
        var parent = newPath.substring(0, newPath.lastIndexOf('/')) || '/';
        var name = newPath.substring(newPath.lastIndexOf('/') + 1);
        entry.path = newPath;
        entry.parent = parent;
        entry.name = name;
        entry.modifiedAt = Date.now();
        store.delete(oldPath);
        store.put(entry);
        resolve(entry);
      };
      req.onerror = function() { reject(req.error); };
    });
  }

  window.BOS_FS = {
    init: init,
    open: open,
    readFile: readFile,
    writeFile: writeFile,
    mkdir: mkdir,
    listDir: listDir,
    deleteEntry: deleteEntry,
    exists: exists,
    rename: rename,
    defaultDirs: defaultDirs
  };
})();
