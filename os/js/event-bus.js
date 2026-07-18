// Event Bus — pub/sub system for B-OS
(function() {
  'use strict';
  var listeners = new Map();

  window.BOS_Events = {
    on: function(event, callback) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(callback);
      return function() { listeners.get(event).delete(callback); };
    },
    emit: function(event, payload) {
      if (listeners.has(event)) {
        listeners.get(event).forEach(function(cb) { cb(payload); });
      }
    },
    off: function(event, callback) {
      if (listeners.has(event)) listeners.get(event).delete(callback);
    }
  };
})();
