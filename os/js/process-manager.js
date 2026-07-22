// Process Manager — tracks app instances as processes
(function() {
  'use strict';
  var processes = new Map();
  var nextPid = 100;

  window.BOS_ProcessManager = {
    spawn: function(appId, instance) {
      var process = {
        pid: nextPid++,
        appId: appId,
        state: 'running',
        startedAt: Date.now(),
        memory: Math.round(Math.random() * 50 + 10),
        windows: [],
        instance: instance
      };
      processes.set(process.pid, process);
      BOS_Events.emit('process:started', process);
      return process;
    },
    addWindow: function(pid, windowId) {
      var p = processes.get(pid);
      if (p) { p.windows.push(windowId); p.memory += Math.round(Math.random() * 5 + 1); }
    },
    kill: function(pid) {
      var p = processes.get(pid);
      if (!p) return false;
      p.state = 'terminated';
      p.windows.forEach(function(wid) {
      try {
        BOS.closeWindow(wid);
      } catch(e) {
        console.error('Unable to close process window ' + wid + ':', e);
      }
      });
      processes.delete(pid);
      BOS_Events.emit('process:killed', p);
      return true;
    },
    list: function() {
      return Array.from(processes.values());
    },
    get: function(pid) {
      return processes.get(pid);
    },
    getByAppId: function(appId) {
      var result = [];
      processes.forEach(function(p) { if (p.appId === appId) result.push(p); });
      return result;
    },
    terminateAll: function() {
      processes.forEach(function(p) { p.state = 'terminated'; });
      processes.clear();
      BOS_Events.emit('process:all-terminated');
    }
  };
})();
