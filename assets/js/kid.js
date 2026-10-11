/* kid.js — الطفل وخرطوم النقاط
   لما النقاط تزيد (O2Loyalty.earn / هدايا الترقية) بتطلع قطرات من فوهة الخرطوم بقوس:
   جزء بيروح على الزجاجة وجزء على بار المستويات. بتشتغل بإحداثيات حيّة، فبتضبط حتى لو تغيّر التخطيط أو تحرّكت الصفحة. */
(function () {
    'use strict';
    var REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    var $ = function (id) { return document.getElementById(id); };
    var layer = null, drops = [], raf = 0, kidT = null, last = { bottle: 0, road: 0 };

    function ensureLayer() {
        if (layer) return layer;
        layer = document.createElement('div'); layer.id = 'o2-fx'; layer.setAttribute('aria-hidden', 'true');
        document.body.appendChild(layer); return layer;
    }
    function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

    /* ---------- نقطة الهدف (إحداثيات الشاشة الحالية) ---------- */
    function target(kind, j) {
        if (kind === 'bottle') {
            var b = $('o2-bottle'); if (!b) return null;
            var r = b.getBoundingClientRect();
            return { x: r.left + r.width * (0.2 + j.a * 0.35), y: r.top + r.height * 0.1 };   // فوق حرف O
        }
        var el = document.querySelector('#tier-road .tr-link.active .tr-spark') || document.querySelector('#tier-road .tr-node.cur') || document.querySelector('#tier-road .tr-node');
        if (!el) return null;
        var q = el.getBoundingClientRect();
        return { x: q.left + q.width / 2 + (j.b - .5) * 14, y: q.top + q.height / 2 };
    }

    /* ---------- أثر الوصول ---------- */
    function ripple(x, y, c) {
        var L = ensureLayer(), e = document.createElement('i');
        e.className = 'o2-rip'; e.style.left = x + 'px'; e.style.top = y + 'px'; e.style.setProperty('--d1', c);
        L.appendChild(e); setTimeout(function () { e.remove(); }, 750);
    }
    function hit(kind, p, c) {
        var now = performance.now(); if (now - last[kind] < 90) return; last[kind] = now;
        if (p) ripple(p.x, p.y, c);
        var el = kind === 'bottle' ? $('o2-bottle') : document.querySelector('#tier-road .tr-node.cur');
        if (!el) return;
        var cls = kind === 'bottle' ? 'splash' : 'kid-hit';
        el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
        setTimeout(function () { el.classList.remove(cls); }, 520);
    }

    /* ---------- حركة القطرات ---------- */
    function frame(now) {
        raf = 0;
        var sx = window.scrollX || 0, sy = window.scrollY || 0, keep = [];
        for (var i = 0; i < drops.length; i++) {
            var d = drops[i], t = (now - d.t0) / d.dur;
            if (t < 0) { keep.push(d); continue; }
            var tp = target(d.kind, d.j);
            if (!tp) { d.el.remove(); continue; }
            if (t >= 1) { hit(d.kind, tp, d.c); d.el.remove(); continue; }
            var p0x = d.x0 - sx, p0y = d.y0 - sy;
            var cx = (p0x + tp.x) / 2 - 30 * (tp.x < p0x ? 1 : -1) * .2, cy = Math.min(p0y, tp.y) - d.lift;
            var u = 1 - t, e = t;
            var x = u * u * p0x + 2 * u * e * cx + e * e * tp.x, y = u * u * p0y + 2 * u * e * cy + e * e * tp.y;
            var dx = 2 * u * (cx - p0x) + 2 * e * (tp.x - cx), dy = 2 * u * (cy - p0y) + 2 * e * (tp.y - cy);
            var s = t < .15 ? .5 + t / .15 * .5 : t > .85 ? 1 - (t - .85) / .15 * .6 : 1;
            d.el.style.opacity = '1';
            d.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + (Math.atan2(dy, dx) * 180 / Math.PI).toFixed(1) + 'deg) scale(' + s.toFixed(2) + ')';
            keep.push(d);
        }
        drops = keep;
        if (drops.length) raf = requestAnimationFrame(frame);
    }
    function spawn(kind, c1, c2) {
        var n = $('kid-nozzle'); if (!n) return;
        var r = n.getBoundingClientRect(), L = ensureLayer(), el = document.createElement('i');
        el.className = 'o2-drop'; el.style.setProperty('--d1', c1); el.style.setProperty('--d2', c2); el.style.opacity = '0';
        L.appendChild(el);
        drops.push({ el: el, kind: kind, c: c1, x0: r.left + r.width / 2 + (window.scrollX || 0), y0: r.top + r.height / 2 + (window.scrollY || 0),
            t0: performance.now(), dur: 750 + Math.random() * 350, lift: 50 + Math.random() * 90, j: { a: Math.random(), b: Math.random() } });
        if (!raf) raf = requestAnimationFrame(frame);
    }

    /* ---------- الصبّ ---------- */
    function pour(n) {
        n = Math.max(0, +n || 0);
        var kid = $('o2-kid'), nz = $('kid-nozzle'); if (!kid || !nz) return;
        var c1 = css('--liq-1') || '#fde047', c2 = css('--liq-2') || '#f5b301';
        var r = nz.getBoundingClientRect();
        var seen = r.bottom > -40 && r.top < window.innerHeight + 40;      // الطفل مش ظاهر؟ ما في داعي نرسم
        if (!seen) return;
        if (REDUCE) { hit('bottle', target('bottle', { a: .4 }), c1); hit('road', target('road', { b: .5 }), c1); return; }
        if (window.O2Sound) O2Sound.play('pour');
        var count = Math.max(6, Math.min(22, Math.round(6 + Math.sqrt(n) * 0.5)));
        kid.classList.add('pouring'); clearTimeout(kidT);
        kidT = setTimeout(function () { kid.classList.remove('pouring'); }, count * 55 + 700);
        for (var i = 0; i < count; i++) (function (i) {
            setTimeout(function () {
                var kind = i === 0 ? 'bottle' : i === 1 ? 'road' : (Math.random() < .55 ? 'bottle' : 'road');
                spawn(kind, c1, c2);
            }, i * 55);
        })(i);
    }

    // الصندوق = مستواك الحالي: الضغطة بتفتح مودال المستوى
    var crate = $('kid-crate');
    if (crate) crate.addEventListener('click', function () {
        if (window.O2Loyalty && O2Loyalty.openTier) O2Loyalty.openTier(O2Loyalty.info(O2Loyalty.lifetime()).i);
    });

    window.O2Kid = { pour: pour };
})();
