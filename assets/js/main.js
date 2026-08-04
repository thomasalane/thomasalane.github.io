/* thomasalane.github.io — interactions */
(function () {
  'use strict';

  var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  var reduced = mq('(prefers-reduced-motion: reduce)');
  var coarse = mq('(pointer: coarse)');

  var pointer = { x: -9999, y: -9999, active: false };

  /* ============================================================
     scroll reveal
     ============================================================ */
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

  /* ============================================================
     scroll progress bar
     ============================================================ */
  function initProgress() {
    var bar = document.getElementById('progress');
    if (!bar) return;
    var ticking = false;

    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? h.scrollTop / max : 0;
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ============================================================
     cursor spotlight
     ============================================================ */
  function initSpotlight() {
    var el = document.getElementById('spot');
    if (!el || reduced || coarse) return;

    var x = window.innerWidth / 2, y = window.innerHeight / 2;
    var tx = x, ty = y, raf = null;

    function loop() {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      el.style.transform = 'translate3d(' + (x - 300) + 'px,' + (y - 300) + 'px,0)';
      raf = Math.abs(tx - x) > 0.4 || Math.abs(ty - y) > 0.4 ? requestAnimationFrame(loop) : null;
    }
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      el.style.opacity = '1';
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('pointerleave', function () { el.style.opacity = '0'; });
  }

  /* ============================================================
     3D tilt + cursor-tracked glow on cards
     ============================================================ */
  function initTilt() {
    var cards = document.querySelectorAll('.card, .entry');

    cards.forEach(function (card) {
      card.addEventListener('pointermove', function (ev) {
        var r = card.getBoundingClientRect();
        var px = ev.clientX - r.left;
        var py = ev.clientY - r.top;
        card.style.setProperty('--mx', px + 'px');
        card.style.setProperty('--my', py + 'px');

        if (reduced || coarse) return;
        // -1..1 from centre, inverted on X so the card leans toward the cursor
        var rx = ((py / r.height) - 0.5) * -2;
        var ry = ((px / r.width) - 0.5) * 2;
        card.style.setProperty('--rx', (rx * 4.5).toFixed(2) + 'deg');
        card.style.setProperty('--ry', (ry * 5.5).toFixed(2) + 'deg');
      });

      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ============================================================
     magnetic buttons
     ============================================================ */
  function initMagnetic() {
    if (reduced || coarse) return;
    document.querySelectorAll('.btn').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        b.style.setProperty('--tx', (dx * 5).toFixed(2) + 'px');
        b.style.setProperty('--ty', (dy * 4).toFixed(2) + 'px');
      });
      b.addEventListener('pointerleave', function () {
        b.style.setProperty('--tx', '0px');
        b.style.setProperty('--ty', '0px');
      });
    });
  }

  /* ============================================================
     text scramble — decodes headings as they enter the viewport
     ============================================================ */
  var GLYPHS = '!<>-_\\/[]{}—=+*^?#01';

  function scramble(el, done) {
    // Headings can hold markup (e.g. the cyan "#" span), and the animation
    // overwrites innerHTML — so keep the original and put it back at the end.
    var original = el.innerHTML;
    var text = el.textContent;
    var queue = [];
    for (var i = 0; i < text.length; i++) {
      queue.push({
        to: text[i],
        start: Math.floor(Math.random() * 12),
        end: Math.floor(Math.random() * 22) + 12
      });
    }
    var frame = 0, raf;

    (function run() {
      var out = '', done_ = 0;
      for (var i = 0; i < queue.length; i++) {
        var q = queue[i];
        if (frame >= q.end) { done_++; out += q.to; }
        else if (frame >= q.start) {
          if (!q.ch || Math.random() < 0.3) q.ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          out += '<span class="scr">' + q.ch + '</span>';
        } else out += q.to === ' ' ? ' ' : '<span class="scr-hide">' + q.to + '</span>';
      }
      el.innerHTML = out;
      if (done_ === queue.length) { el.innerHTML = original; if (done) done(); return; }
      frame++;
      raf = requestAnimationFrame(run);
    })();
    return function () { cancelAnimationFrame(raf); el.innerHTML = original; };
  }

  function initScramble() {
    var els = document.querySelectorAll('.sec-title, .page-title, .eyebrow');
    if (reduced || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        scramble(e.target);
      });
    }, { threshold: 0.5 });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ============================================================
     neural network background
     ============================================================ */
  function initNet() {
    var canvas = document.getElementById('net');
    if (!canvas || reduced) return;

    var ctx = canvas.getContext('2d', { alpha: true });
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, raf = null, t0 = performance.now();

    // three parallax planes: far, mid, near
    var PLANES = [
      { z: 0.35, link: 118, speed: 0.10, size: 0.9,  alpha: 0.38 },
      { z: 0.65, link: 138, speed: 0.16, size: 1.25, alpha: 0.62 },
      { z: 1.00, link: 158, speed: 0.24, size: 1.7,  alpha: 0.95 }
    ];

    var planes = [];
    var pulses = [];
    var MAX_PULSES = 130;
    var nextFire = 0;

    // A halo drawn as a second, larger, low-alpha circle. Cheaper than
    // ctx.shadowBlur, which re-rasterises and collapses the frame rate once
    // there are dozens of glowing points on screen.
    function glowDot(x, y, r, cr, cg, cb, a) {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (a * 0.16).toFixed(3) + ')';
      ctx.arc(x, y, r * 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + a.toFixed(3) + ')';
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    function resize() {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      var area = W * H;
      planes = PLANES.map(function (cfg) {
        var count = Math.round(Math.min(52, Math.max(14, area / 30000)) * (0.7 + cfg.z * 0.6));
        var nodes = [];
        for (var i = 0; i < count; i++) {
          nodes.push({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * cfg.speed,
            vy: (Math.random() - 0.5) * cfg.speed,
            r: (Math.random() * 0.9 + 0.8) * cfg.size,
            charge: 0,
            ox: 0, oy: 0            // repulsion offset
          });
        }
        return { cfg: cfg, nodes: nodes, edges: [] };
      });
      pulses.length = 0;
    }

    function fire(plane, node, energy, depth) {
      node.charge = Math.min(1, Math.max(node.charge, energy));
      if (depth > 3 || pulses.length > MAX_PULSES) return;
      var link = plane.cfg.link;
      for (var i = 0; i < plane.nodes.length; i++) {
        var m = plane.nodes[i];
        if (m === node) continue;
        var dx = m.x - node.x, dy = m.y - node.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < link && pulses.length < MAX_PULSES) {
          pulses.push({
            plane: plane, from: node, to: m,
            t: 0, spd: 0.014 + Math.random() * 0.012,
            e: energy, depth: depth
          });
        }
      }
    }

    function tickPulses(dt) {
      for (var i = pulses.length - 1; i >= 0; i--) {
        var p = pulses[i];
        p.t += p.spd * dt;
        if (p.t >= 1) {
          if (p.e > 0.26) fire(p.plane, p.to, p.e * 0.6, p.depth + 1);
          else p.to.charge = Math.min(1, Math.max(p.to.charge, p.e));
          pulses.splice(i, 1);
        }
      }
    }

    function frame(now) {
      var dt = Math.min(2.4, (now - t0) / 16.67);
      t0 = now;

      ctx.clearRect(0, 0, W, H);

      // spontaneous firing
      if (now > nextFire) {
        nextFire = now + 620 + Math.random() * 900;
        var pl = planes[Math.floor(Math.random() * planes.length)];
        if (pl && pl.nodes.length) {
          fire(pl, pl.nodes[Math.floor(Math.random() * pl.nodes.length)], 1, 0);
        }
      }

      tickPulses(dt);

      var cx = W / 2, cy = H / 2;
      var px = pointer.active ? pointer.x : cx;
      var py = pointer.active ? pointer.y : cy;

      for (var pi = 0; pi < planes.length; pi++) {
        var plane = planes[pi];
        var cfg = plane.cfg;
        var nodes = plane.nodes;

        // parallax shift for this depth plane
        var shx = ((px - cx) / cx) * 16 * cfg.z;
        var shy = ((py - cy) / cy) * 12 * cfg.z;

        for (var i = 0; i < nodes.length; i++) {
          var n = nodes[i];
          n.x += n.vx * dt;
          n.y += n.vy * dt;

          if (n.x < -30) n.x = W + 30; else if (n.x > W + 30) n.x = -30;
          if (n.y < -30) n.y = H + 30; else if (n.y > H + 30) n.y = -30;

          // cursor repulsion
          var rdx = (n.x + shx) - px, rdy = (n.y + shy) - py;
          var rd = Math.sqrt(rdx * rdx + rdy * rdy);
          var R = 150;
          if (pointer.active && rd < R && rd > 0.01) {
            var push = (1 - rd / R) * 26 * cfg.z;
            n.ox += ((rdx / rd) * push - n.ox) * 0.12;
            n.oy += ((rdy / rd) * push - n.oy) * 0.12;
          } else {
            n.ox += (0 - n.ox) * 0.08;
            n.oy += (0 - n.oy) * 0.08;
          }

          n.charge *= Math.pow(0.955, dt);
          if (n.charge < 0.004) n.charge = 0;
        }

        // edges
        var link = cfg.link;
        ctx.lineWidth = 0.6 * cfg.z + 0.15;
        for (var a = 0; a < nodes.length; a++) {
          var na = nodes[a];
          var ax = na.x + na.ox + shx, ay = na.y + na.oy + shy;
          for (var b = a + 1; b < nodes.length; b++) {
            var nb = nodes[b];
            var bx = nb.x + nb.ox + shx, by = nb.y + nb.oy + shy;
            var dx = ax - bx, dy = ay - by;
            var d2 = dx * dx + dy * dy;
            if (d2 > link * link) continue;
            var d = Math.sqrt(d2);
            var base = (1 - d / link) * 0.19 * cfg.alpha;
            var hot = Math.max(na.charge, nb.charge);
            var alpha = base + hot * 0.4;
            ctx.strokeStyle = hot > 0.05
              ? 'rgba(120,240,220,' + Math.min(0.85, alpha).toFixed(3) + ')'
              : 'rgba(34,211,238,' + alpha.toFixed(3) + ')';
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }

        // travelling signal pulses
        for (var q = 0; q < pulses.length; q++) {
          var p = pulses[q];
          if (p.plane !== plane) continue;
          var fx = p.from.x + p.from.ox + shx, fy = p.from.y + p.from.oy + shy;
          var tx2 = p.to.x + p.to.ox + shx, ty2 = p.to.y + p.to.oy + shy;
          var lx = fx + (tx2 - fx) * p.t;
          var ly = fy + (ty2 - fy) * p.t;
          var fade = Math.sin(p.t * Math.PI);
          var pr = (1.6 + p.e * 1.6) * cfg.z;
          glowDot(lx, ly, pr, 160, 255, 235, Math.min(1, 0.9 * fade * p.e));
        }

        // nodes
        for (var k = 0; k < nodes.length; k++) {
          var nd = nodes[k];
          var nx = nd.x + nd.ox + shx, ny = nd.y + nd.oy + shy;

          var mdx = nx - px, mdy = ny - py;
          var md = Math.sqrt(mdx * mdx + mdy * mdy);
          var near = pointer.active && md < 190 ? 1 - md / 190 : 0;

          var glow = Math.max(nd.charge, near * 0.65);
          var rr = nd.r * (1 + glow * 1.25);

          if (glow > 0.12) {
            if (nd.charge > near) glowDot(nx, ny, rr, 160, 255, 220, Math.min(1, 0.5 + nd.charge));
            else glowDot(nx, ny, rr, 34, 211, 238, Math.min(1, cfg.alpha * (0.42 + near * 0.58)));
          } else {
            ctx.beginPath();
            ctx.fillStyle = 'rgba(34,211,238,' + (cfg.alpha * (0.42 + near * 0.58)).toFixed(3) + ')';
            ctx.arc(nx, ny, rr, 0, Math.PI * 2);
            ctx.fill();
          }

          // link the closest nodes to the cursor
          if (near > 0.25) {
            ctx.strokeStyle = 'rgba(74,222,128,' + (near * 0.42).toFixed(3) + ')';
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(nx, ny);
            ctx.lineTo(px, py);
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(frame);
    }

    // click anywhere fires the nearest node of the front plane
    window.addEventListener('pointerdown', function (e) {
      var plane = planes[planes.length - 1];
      if (!plane) return;
      var best = null, bd = Infinity;
      for (var i = 0; i < plane.nodes.length; i++) {
        var n = plane.nodes[i];
        var d = Math.hypot(n.x - e.clientX, n.y - e.clientY);
        if (d < bd) { bd = d; best = n; }
      }
      if (best) fire(plane, best, 1, 0);
    }, { passive: true });

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt); rt = setTimeout(resize, 180);
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
      else if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(frame); }
    });

    resize();
    raf = requestAnimationFrame(frame);
  }

  /* ============================================================
     hero terminal typing
     ============================================================ */
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

    var full = lines.map(function (l) { return l.t; }).join('\n');

    if (reduced) {
      out.innerHTML = full;
      return;
    }

    // Accumulate raw HTML in a string and re-render from it. Appending to
    // innerHTML directly would reserialize the DOM, auto-closing any tag
    // still being typed and pushing the rest of the line outside its span.
    var acc = '';
    var li = 0;

    function nextLine() {
      if (li >= lines.length) return;
      var raw = lines[li].t;
      var i = 0;

      (function type() {
        if (i >= raw.length) {
          acc += '\n';
          out.innerHTML = acc;
          li++;
          setTimeout(nextLine, 90);
          return;
        }
        var buf;
        if (raw[i] === '<') {                       // emit whole tags at once
          var close = raw.indexOf('>', i);
          buf = raw.slice(i, close + 1);
          i = close + 1;
        } else if (raw[i] === '&') {                // and whole entities
          var semi = raw.indexOf(';', i);
          buf = raw.slice(i, semi + 1);
          i = semi + 1;
        } else {
          buf = raw[i];
          i++;
        }
        acc += buf;
        out.innerHTML = acc;
        setTimeout(type, 11);
      })();
    }
    setTimeout(nextLine, 380);
  }

  /* ============================================================
     boot
     ============================================================ */
  function boot() {
    window.addEventListener('pointermove', function (e) {
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true;
    }, { passive: true });
    document.addEventListener('pointerleave', function () { pointer.active = false; });

    initReveal();
    initProgress();
    initSpotlight();
    initTilt();
    initMagnetic();
    initScramble();
    initNet();
    initTerm();

    document.documentElement.classList.add('ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
