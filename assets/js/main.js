/* thomasalane.github.io — interactions */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll reveal ---------- */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (reduced || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- cursor-tracked glow on cards ---------- */
  function initGlow() {
    if (reduced) return;
    document.querySelectorAll('.card, .entry').forEach(function (card) {
      card.addEventListener('pointermove', function (ev) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
        card.style.setProperty('--my', (ev.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- animated node network ---------- */
  function initNet() {
    var canvas = document.getElementById('net');
    if (!canvas || reduced) return;

    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, nodes = [], raf = null;
    var mouse = { x: -9999, y: -9999 };
    var LINK = 132;

    function resize() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      var target = Math.min(78, Math.max(26, Math.round((w * h) / 20000)));
      nodes = [];
      for (var i = 0; i < target; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: Math.random() * 1.3 + 0.7
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;

        // links between nearby nodes
        for (var j = i + 1; j < nodes.length; j++) {
          var m = nodes[j];
          var dx = n.x - m.x, dy = n.y - m.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            var a = (1 - Math.sqrt(d2) / LINK) * 0.16;
            ctx.strokeStyle = 'rgba(34,211,238,' + a.toFixed(3) + ')';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        }

        // link + highlight near cursor
        var mdx = n.x - mouse.x, mdy = n.y - mouse.y;
        var md = Math.sqrt(mdx * mdx + mdy * mdy);
        var near = md < 170;
        if (near) {
          var ma = (1 - md / 170) * 0.4;
          ctx.strokeStyle = 'rgba(74,222,128,' + ma.toFixed(3) + ')';
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }

        ctx.fillStyle = near ? 'rgba(74,222,128,0.75)' : 'rgba(34,211,238,0.4)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    window.addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    window.addEventListener('pointerleave', function () { mouse.x = -9999; mouse.y = -9999; });

    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(resize, 180); });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
      else if (!raf) { raf = requestAnimationFrame(frame); }
    });

    resize();
    raf = requestAnimationFrame(frame);
  }

  /* ---------- hero terminal typing ---------- */
  function initTerm() {
    var out = document.getElementById('term-out');
    if (!out) return;

    var lines = [
      { t: '<span class="c-prompt">$</span> <span class="c-cmd">whoami</span>' },
      { t: 'thomas alane' },
      { t: '' },
      { t: '<span class="c-prompt">$</span> <span class="c-cmd">cat focus.json</span>' },
      { t: '{' },
      { t: '  <span class="c-key">"field"</span>:     "data science &amp; ai",' },
      { t: '  <span class="c-key">"works_on"</span>:  ["analysis", "modeling", "automation"],' },
      { t: '  <span class="c-key">"exploring"</span>: ["blockchain", "cryptography",' },
      { t: '                 "security", "bitcoin"],' },
      { t: '  <span class="c-key">"status"</span>:    "building in public"' },
      { t: '}' },
      { t: '' },
      { t: '<span class="c-prompt">$</span> <span class="c-dim">_</span>' }
    ];

    if (reduced) {
      out.innerHTML = lines.map(function (l) { return l.t; }).join('\n');
      return;
    }

    var li = 0;
    function nextLine() {
      if (li >= lines.length) return;
      var raw = lines[li].t;
      // type char by char, but emit whole HTML tags at once
      var i = 0, buf = '';
      (function type() {
        if (i >= raw.length) {
          out.innerHTML += '\n';
          li++;
          setTimeout(nextLine, 130);
          return;
        }
        if (raw[i] === '<') {
          var close = raw.indexOf('>', i);
          buf = raw.slice(i, close + 1);
          i = close + 1;
        } else if (raw[i] === '&') {
          var semi = raw.indexOf(';', i);
          buf = raw.slice(i, semi + 1);
          i = semi + 1;
        } else {
          buf = raw[i];
          i++;
        }
        out.innerHTML += buf;
        setTimeout(type, 14);
      })();
    }
    setTimeout(nextLine, 420);
  }

  function boot() {
    initReveal();
    initGlow();
    initNet();
    initTerm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
