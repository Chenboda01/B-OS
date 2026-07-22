// ═══════════════════════════════════════════════════════════════
// APP 6 — CLOCK
// ═══════════════════════════════════════════════════════════════
(function() {
  var interval = null;
  var is24h = true;

  function formatTime(d, h24) {
    var h = d.getHours();
    var m = String(d.getMinutes()).padStart(2, '0');
    var s = String(d.getSeconds()).padStart(2, '0');
    if (!h24) {
      var ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return String(h).padStart(2, '0') + ':' + m + ':' + s + ' ' + ampm;
    }
    return String(h).padStart(2, '0') + ':' + m + ':' + s;
  }

  function formatDate(d) {
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  function createUI() {
    return '<div class="bos-app" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:#050510;color:#e8eaff;font-family:var(--font-mono,monospace);overflow:hidden;position:relative;">' +
      /* Analog clock SVG */
      '<svg id="clock-analog" width="160" height="160" viewBox="0 0 160 160" style="margin-bottom:20px;">' +
        '<circle cx="80" cy="80" r="75" fill="none" stroke="#181848" stroke-width="2" />' +
        '<circle cx="80" cy="80" r="72" fill="none" stroke="#111130" stroke-width="1" />' +
        /* Hour markers */
        Array.from({length:12}, function(_, i) {
          var angle = (i * 30 - 90) * Math.PI / 180;
          var x1 = 80 + 64 * Math.cos(angle);
          var y1 = 80 + 64 * Math.sin(angle);
          var x2 = 80 + 70 * Math.cos(angle);
          var y2 = 80 + 70 * Math.sin(angle);
          return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#555580" stroke-width="2" />';
        }).join('') +
        /* Minute markers */
        Array.from({length:60}, function(_, i) {
          if (i % 5 === 0) return '';
          var angle = (i * 6 - 90) * Math.PI / 180;
          var x1 = 80 + 67 * Math.cos(angle);
          var y1 = 80 + 67 * Math.sin(angle);
          var x2 = 80 + 70 * Math.cos(angle);
          var y2 = 80 + 70 * Math.sin(angle);
          return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#181848" stroke-width="1" />';
        }).join('') +
        /* Hands */
        '<line id="clock-hour" x1="80" y1="80" x2="80" y2="40" stroke="#e8eaff" stroke-width="3" stroke-linecap="round" />' +
        '<line id="clock-min" x1="80" y1="80" x2="80" y2="25" stroke="#00f0ff" stroke-width="2" stroke-linecap="round" />' +
        '<line id="clock-sec" x1="80" y1="80" x2="80" y2="18" stroke="#ff00ff" stroke-width="1" stroke-linecap="round" />' +
        '<circle cx="80" cy="80" r="4" fill="#00f0ff" />' +
      '</svg>' +
      /* Digital time */
      '<div id="clock-digital" style="font-size:48px;font-weight:bold;letter-spacing:4px;color:#e8eaff;margin-bottom:4px;text-shadow:0 0 30px rgba(0,240,255,0.15);">' +
        '<span id="clock-hhmm">00:00</span>' +
        '<span id="clock-sec-display" style="color:#00f0ff;">:00</span>' +
        '<span id="clock-ampm" style="font-size:16px;color:#555580;margin-left:4px;"></span>' +
      '</div>' +
      /* Date */
      '<div id="clock-date" style="font-size:14px;color:#9999cc;margin-bottom:8px;"></div>' +
      /* Timezone */
      '<div id="clock-tz" style="font-size:11px;color:#555580;margin-bottom:16px;"></div>' +
      /* Toggle button */
      '<button id="clock-toggle" style="background:none;border:1px solid #181848;color:#9999cc;padding:6px 16px;border-radius:2px;cursor:pointer;font-family:var(--font-mono,monospace);font-size:11px;transition:all 0.2s;">Switch to 12h</button>' +
    '</div>';
  }

  function updateClock() {
    var now = new Date();
    var hhmmEl = document.getElementById('clock-hhmm');
    var secEl = document.getElementById('clock-sec-display');
    var ampmEl = document.getElementById('clock-ampm');
    var dateEl = document.getElementById('clock-date');
    var tzEl = document.getElementById('clock-tz');

    var h = now.getHours();
    var m = String(now.getMinutes()).padStart(2, '0');
    var s = String(now.getSeconds()).padStart(2, '0');

    if (!is24h) {
      var ampm = h >= 12 ? ' PM' : ' AM';
      var h12 = h % 12 || 12;
      if (hhmmEl) hhmmEl.textContent = String(h12).padStart(2, '0') + ':' + m;
      if (ampmEl) ampmEl.textContent = ampm;
    } else {
      if (hhmmEl) hhmmEl.textContent = String(h).padStart(2, '0') + ':' + m;
      if (ampmEl) ampmEl.textContent = '';
    }
    if (secEl) {
      secEl.textContent = ':' + s;
      secEl.style.opacity = parseInt(s) % 2 === 0 ? '1' : '0.5';
    }
    if (dateEl) dateEl.textContent = formatDate(now);
    if (tzEl) tzEl.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;

    var hourHand = document.getElementById('clock-hour');
    var minHand = document.getElementById('clock-min');
    var secHand = document.getElementById('clock-sec');
    if (hourHand && minHand && secHand) {
      var hDeg = ((h % 12) + now.getMinutes() / 60) * 30;
      var mDeg = (now.getMinutes() + now.getSeconds() / 60) * 6;
      var sDeg = now.getSeconds() * 6;
      hourHand.setAttribute('transform', 'rotate(' + hDeg + ' 80 80)');
      minHand.setAttribute('transform', 'rotate(' + mDeg + ' 80 80)');
      secHand.setAttribute('transform', 'rotate(' + sDeg + ' 80 80)');
    }
  }

  function setupEvents(win) {
    var toggleBtn = win.querySelector('#clock-toggle');
    toggleBtn.addEventListener('click', function() {
      is24h = !is24h;
      this.textContent = is24h ? 'Switch to 12h' : 'Switch to 24h';
      updateClock();
    });
    toggleBtn.addEventListener('mouseover', function() {
      this.style.borderColor = '#00f0ff';
      this.style.color = '#00f0ff';
    });
    toggleBtn.addEventListener('mouseout', function() {
      this.style.borderColor = '#181848';
      this.style.color = '#9999cc';
    });

    updateClock();
    interval = setInterval(updateClock, 1000);
  }

  function launch() {
    if (interval) clearInterval(interval);
    var win = BOS.createWindow({
      title: 'Clock',
      icon: '🕐',
      width: 400,
      height: 420,
      content: createUI(),
      onClose: function() { if (interval) { clearInterval(interval); interval = null; } }
    });
    setupEvents(win);
  }

  BOS.registerApp({
    id: 'clock',
    name: 'Clock',
    icon: '🕐',
    category: 'utility',
    launch: launch
  });
})();
