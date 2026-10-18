/* /test4/: what moves, and why (motion-taste 1):
   - the opening film closes into an arch as the page moves: continuity, from
     the film into the house's own window;
   - the house's sentence is inked in word by word: it is read as it is shown;
   - "SOUL, in light" and "The cut" are played by the scroll: they explain
     the piece and the stone, one stage at a time;
   - the four signature pieces come forward one at a time;
   - the mark is drawn as the appointment arrives: a rare close.
   Everything is set from the scroll once per frame, transform, opacity and
   clip only; nothing decodes or compiles while the reader scrolls. */
(function () {
  "use strict";
  var H = document.documentElement, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { x = clamp(x); return x * x * (3 - 2 * x); }
  function out(x) { x = clamp(x); return 1 - Math.pow(1 - x, 3); }
  var hooks = [];

  /* ── the language: English and Hebrew are in the page, French, Arabic and
     Russian come from the site's dictionaries (lang/*.json) ── */
  (function () {
    var cache = {};
    function apply(l, dict) {
      var rtl = l === "he" || l === "ar";
      H.lang = l; H.dir = rtl ? "rtl" : "ltr";
      if (rtl) H.setAttribute("data-ns", "1"); else H.removeAttribute("data-ns");
      document.querySelectorAll("[data-en]").forEach(function (el) {
        var en = el.getAttribute("data-en"), t = l === "en" ? en : l === "he" ? el.getAttribute("data-he") : dict && dict[en];
        el.innerHTML = t || en;
      });
      document.querySelectorAll("img[data-alt-he]").forEach(function (im) { if (!im.hasAttribute("data-alt-en")) im.setAttribute("data-alt-en", im.alt); var en = im.getAttribute("data-alt-en"); im.alt = l === "he" ? im.getAttribute("data-alt-he") : l === "en" ? en : (dict && dict[en]) || en; });
      document.querySelectorAll("[data-aria-he]").forEach(function (el) { if (!el.hasAttribute("data-aria-en")) el.setAttribute("data-aria-en", el.getAttribute("aria-label") || ""); var en = el.getAttribute("data-aria-en"); el.setAttribute("aria-label", l === "he" ? el.getAttribute("data-aria-he") : l === "en" ? en : (dict && dict[en]) || en); });
      document.querySelectorAll(".lang button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-lang") === l ? "true" : "false"); });
      hooks.forEach(function (f) { f(l); });
      /* the chapters that place things beside the words mirror with them */
      dispatchEvent(new Event("t4lang"));
    }
    function go(l) {
      try { localStorage.setItem("silavu-lang", l); } catch (e) {}
      if (l === "en" || l === "he" || cache[l]) return apply(l, cache[l]);
      fetch("../lang/" + l + ".json", { cache: "force-cache" }).then(function (r) { return r.json(); })
        .then(function (d) { cache[l] = d; apply(l, d); }).catch(function () { apply("en"); });
    }
    var box = document.querySelector(".lang"), narrow = matchMedia("(max-width:899px)");
    document.querySelectorAll(".lang button").forEach(function (b) { b.addEventListener("click", function (e) {
      if (narrow.matches && b.getAttribute("aria-pressed") === "true" && !box.classList.contains("open")) { box.classList.add("open"); e.stopPropagation(); return; }
      box.classList.remove("open"); go(b.getAttribute("data-lang")); }); });
    document.addEventListener("click", function (e) { if (box && !box.contains(e.target)) box.classList.remove("open"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && box) box.classList.remove("open"); });
    var l = "en", qp = new URLSearchParams(location.search).get("lang");
    try { l = localStorage.getItem("silavu-lang") || "en"; } catch (e) {}
    if (qp && /^(en|he|fr|ar|ru)$/.test(qp)) l = qp;
    window.__t4go = go;
    /* applied once the rest of this script has registered its hooks */
    setTimeout(function () { go(l); }, 0);
  })();
  document.querySelectorAll(".fyr").forEach(function (e) { e.textContent = new Date().getFullYear(); });

  /* ── one frame for everything that follows the scroll directly ── */
  var jobs = [], raf = 0;
  function frame() { raf = 0; var W = innerWidth, VH = innerHeight; for (var i = 0; i < jobs.length; i++) jobs[i](W, VH); }
  function schedule() { if (!raf) raf = requestAnimationFrame(frame); }
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
  hooks.push(function () { schedule(); });

  /* the opening */
  (function () {
    var sec = document.querySelector(".open");
    if (!sec) return;
    var pin = sec.querySelector(".opin"), film = sec.querySelector(".ofilm"), vid = sec.querySelector(".ovid"), stick = sec.querySelector(".ostick"), cap = sec.querySelector(".ocap");
    var uw = false;
    /* the film, once the page has its first picture: the cut that fits the
       screen (an upright one on a phone, a 32:9 one on an ultrawide, 4K on a
       large screen with a fast connection) */
    function pick() {
      var W = innerWidth, VH = innerHeight, dpr = devicePixelRatio || 1, c = navigator.connection || {};
      if (W < 900) return vid.getAttribute("data-src-m");
      if (W / VH >= 2.8 && W >= 1800) { uw = true; return vid.getAttribute("data-src-uw"); }
      if (W * dpr >= 2600 && !c.saveData && (!c.effectiveType || c.effectiveType === "4g")) return vid.getAttribute("data-src-4k");
      return vid.getAttribute("data-src");
    }
    function start() {
      if (reduce || !vid) return;
      vid.src = pick();
      vid.addEventListener("playing", function () { vid.classList.add("on"); }, { once: true });
      var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {});
      /* it rests while it is off screen */
      new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var r = vid.play(); if (r && r.catch) r.catch(function () {}); } else vid.pause(); }); }).observe(stick);
    }
    if (document.readyState === "complete") start(); else addEventListener("load", start);
    var last = "";
    jobs.push(function (W, VH) {
      var r = pin.getBoundingClientRect();
      if (r.bottom < -50 || r.top > VH) return;
      var p = reduce ? 1 : clamp(-r.top / Math.max(1, r.height - VH)), e = ease(p / 0.72), phone = W < 900;
      /* the arch: a window as tall as the screen allows, two thirds as wide */
      var T = (phone ? 0.13 : 0.12) * VH, B = (phone ? 0.3 : 0.12) * VH, aw = phone ? 0.82 * W : Math.min(0.3 * W, 0.72 * (VH - T - B)), S = (W - aw) / 2, rad = aw / 2 * e;
      var clip = "inset(" + (e * T).toFixed(1) + "px " + (e * S).toFixed(1) + "px " + (e * B).toFixed(1) + "px " + (e * S).toFixed(1) + "px round " + rad.toFixed(1) + "px " + rad.toFixed(1) + "px 0 0)";
      if (clip !== last) { film.style.clipPath = clip; last = clip; }
      film.style.setProperty("--zs", (1 + 0.08 * e).toFixed(4));
      if (uw) { var op = (50 + 25 * e).toFixed(1) + "% 50%"; vid.style.objectPosition = op; }
      var to = out((p - 0.2) / 0.42);
      stick.style.setProperty("--to", to.toFixed(3));
      stick.style.setProperty("--tx", (1 - to).toFixed(3));
      stick.style.setProperty("--kick", (1 - clamp(p / 0.12)).toFixed(3));
      stick.style.setProperty("--sh", (1 - e).toFixed(3));
      if (cap) cap.style.opacity = to.toFixed(3);
      if (p > 0.01) H.classList.add("moved");
    });
  })();

  /* the house's sentence, inked in as it is read */
  (function () {
    var el = document.querySelector(".wtext");
    if (!el) return;
    var ws = [];
    function split() {
      var words = el.textContent.trim().split(/\s+/);
      el.innerHTML = words.map(function (w) { return '<span class="w">' + w.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</span>"; }).join(" ");
      ws = [].slice.call(el.querySelectorAll(".w")); schedule();
    }
    hooks.push(split);
    if (reduce) return;
    jobs.push(function (W, VH) {
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > VH || !ws.length) return;
      /* from the moment it enters the lower third until it is just above the middle */
      var p = clamp((VH * 0.82 - r.top) / (VH * 0.5 + r.height * 0.6)), n = ws.length;
      for (var i = 0; i < n; i++) { var o = 0.14 + 0.86 * clamp(p * (n + 2) - i); ws[i].style.setProperty("--o", o.toFixed(3)); }
    });
  })();

  /* the materials, carried across: the two rows go opposite ways */
  (function () {
    var rows = [].slice.call(document.querySelectorAll(".band .bline")), band = document.querySelector(".band");
    if (!band || reduce) return;
    jobs.push(function (W, VH) {
      var r = band.getBoundingClientRect();
      if (r.bottom < 0 || r.top > VH) return;
      var d = VH - r.top;
      rows.forEach(function (b, i) { var x = i ? -b.scrollWidth * 0.5 + d * 0.32 : -d * 0.42; b.style.transform = "translate3d(" + x.toFixed(1) + "px,0,0)"; });
    });
  })();

  /* the mark, drawn as the appointment arrives */
  (function () {
    var sec = document.querySelector(".appt"), m = sec && sec.querySelector(".amark");
    if (!sec || !m) return;
    if (reduce) { m.style.setProperty("--ad", "0"); m.style.setProperty("--af", ".05"); return; }
    jobs.push(function (W, VH) {
      var r = sec.getBoundingClientRect();
      if (r.bottom < 0 || r.top > VH) return;
      var p = clamp((VH - r.top) / (VH * 0.95));
      m.style.setProperty("--ad", (1 - ease(p)).toFixed(4));
      m.style.setProperty("--af", (0.05 * ease((p - 0.75) / 0.25)).toFixed(4));
    });
  })();

  /* the bar steps aside while the reader reads down, and comes back when they
     scroll up (never while the language menu is open) */
  (function () {
    var lastY = scrollY, box = document.querySelector(".lang");
    jobs.push(function () {
      var y = scrollY, d = y - lastY;
      if (Math.abs(d) < 6) return;
      var up = d > 0 && y > 160 && !(box && box.classList.contains("open"));
      H.classList.toggle("hd-up", up);
      H.classList.toggle("hd-solid", y > 160);
      lastY = y;
    });
  })();

  /* the bar's ink follows the chapter under it */
  (function () {
    var secs = [].slice.call(document.querySelectorAll("[data-tone]")), film = document.querySelector(".ofilm");
    var cur = "";
    jobs.push(function () {
      var tone = "paper";
      for (var i = 0; i < secs.length; i++) { var r = secs[i].getBoundingClientRect(); if (r.top <= 40 && r.bottom > 40) { tone = secs[i].getAttribute("data-tone"); break; } }
      /* over the film only while it still fills the top of the screen */
      if (tone === "film" && film) { var c = getComputedStyle(film).clipPath, m = /inset\(([\d.]+)px/.exec(c); if (m && +m[1] > 30) tone = "paper"; }
      if (tone !== cur) { cur = tone; H.classList.toggle("on-film", tone === "film"); H.classList.toggle("on-night", tone === "night"); }
    });
  })();
  schedule();
})();

/* ── "SOUL, in light": the frames of soul-frames.sh, played by the scroll.
   Fetched once the page has loaded and decoded from their bytes
   (createImageBitmap, off the page's thread); only a window around the frame
   on screen, and every sixth frame, is held decoded (motion-taste 3). ── */
[].slice.call(document.querySelectorAll("section.sfilm")).forEach(function (sec) {
  "use strict";
  var pin = sec.querySelector(".sfpin"), cv = sec.querySelector("canvas"), ctx = cv && cv.getContext("2d");
  var beats = [].slice.call(sec.querySelectorAll(".sfbeat")), call = sec.querySelector(".sfcall"), calls = [].slice.call(sec.querySelectorAll(".sfc")), bar = sec.querySelector(".prog i");
  if (!pin || !ctx) return;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, phone = matchMedia("(max-width:899px)").matches;
  var N = +sec.getAttribute("data-n") || 0, base = sec.getAttribute("data-base") || "f/soul/";
  /* the pendant's centre in each frame (soul-cx.txt): it is held in one
     place on a wide screen, clear of the words */
  var CX = (sec.getAttribute("data-cx") || "").split(",").map(Number), CXREF = +sec.getAttribute("data-cxref") || 0.5;
  if (!N) return;
  var STAGES = (sec.getAttribute("data-stages") || "0").split(",").map(Number), CALL = (sec.getAttribute("data-call") || "2,2").split(",").map(Number);
  var conn = navigator.connection || {}, weak = (navigator.deviceMemory && navigator.deviceMemory <= 2) || !!conn.saveData;
  var px = innerWidth * Math.min(devicePixelRatio || 1, 2), SET = phone ? "m" : px >= 2400 ? "x" : "d";
  var STEP = weak ? 3 : 1, WIN = phone ? 10 : 14, SKEL = 6;
  function src(i) { return base + SET + "-" + ("00" + i).slice(-3) + ".webp"; }
  var frames = new Array(N), asked = new Array(N), cur = 0, p = -1, target = 0, drawn = -1, W = 0, Hh = 0, started = false, raf = 0, lastT = 0;
  function at(q) { var i = Math.max(0, Math.min(N - 1, Math.round(q * (N - 1)))); return STEP > 1 ? Math.min(N - 1, Math.round(i / STEP) * STEP) : i; }
  function free(f) { if (f && f.close) f.close(); }
  function load(i) {
    if (asked[i]) return; asked[i] = 1;
    fetch(src(i)).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (bl) { return createImageBitmap(bl); }).then(function (bm) {
      if (!asked[i]) { free(bm); return; }
      frames[i] = bm; if (i === at(cur) || drawn < 0) schedule();
    }, function () { asked[i] = 0; });
  }
  var dir = 1, prev = 0;
  function fill() {
    var want = at(cur); if (want !== prev) { dir = want > prev ? 1 : -1; prev = want; }
    for (var j = 0; j < N; j++) if (frames[j] && j % SKEL !== 0 && ((j - want) * dir > WIN || (want - j) * dir > WIN / 2)) { free(frames[j]); frames[j] = null; asked[j] = 0; }
    var n = 0;
    for (var d = 0; d <= WIN && n < 6; d += STEP) {
      var a = want + d * dir, b = want - d * dir;
      if (a >= 0 && a < N && !asked[a]) { load(a); n++; }
      if (d <= WIN / 2 && b >= 0 && b < N && !asked[b]) { load(b); n++; }
    }
    for (var s = 0; s < N && n < 8; s += SKEL) if (!asked[s]) { load(s); n++; }
  }
  var fit = { sc: 1, ox: 0, oy: 0, iw: 0, ih: 0 };
  /* the pendant stands two thirds across, on the side away from the words */
  function anchor() { return document.documentElement.dir === "rtl" ? 0.36 : 0.64; }
  function size() {
    var r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    W = Math.round(r.width * dpr); Hh = Math.round(r.height * dpr);
    if (cv.width !== W || cv.height !== Hh) { cv.width = W; cv.height = Hh; drawn = -1; }
  }
  function nearest(i) { for (var d = 0; d < N; d++) { if (frames[i - d]) return i - d; if (frames[i + d]) return i + d; } return -1; }
  function draw() {
    var have = nearest(at(cur)); if (have < 0 || have === drawn) return;
    var im = frames[have], iw = im.width, ih = im.height, sc = Math.max(W / iw, Hh / ih), dw = iw * sc, dh = ih * sc;
    var A = anchor(), cx = phone ? 0.5 : (CX[have] || CXREF), ox = phone ? (W - dw) / 2 : W * A - cx * dw, oy = (Hh - dh) / 2;
    ctx.clearRect(0, 0, W, Hh); ctx.drawImage(im, ox, oy, dw, dh);
    /* where the frame no longer reaches the edge, its own edge is drawn out
       (the studio is plain white there) */
    if (ox > 0) ctx.drawImage(im, 0, 0, 3, ih, 0, oy, ox + 1, dh);
    if (ox + dw < W) ctx.drawImage(im, iw - 3, 0, 3, ih, ox + dw - 1, oy, W - ox - dw + 1, dh);
    fit = { sc: sc, ox: ox, oy: oy, iw: iw, ih: ih }; drawn = have;
    if (!sec.classList.contains("ready")) sec.classList.add("ready");
    place();
  }
  function place() {
    var dpr = W / Math.max(1, cv.getBoundingClientRect().width);
    calls.forEach(function (c) {
      var x = +c.getAttribute("data-x"), y = +c.getAttribute("data-y");
      var sx = (W * anchor() + (x - CXREF) * fit.iw * fit.sc) / dpr, sy = (fit.oy + y * fit.ih * fit.sc) / dpr;
      c.style.transform = "translate(" + (sx - 3.5).toFixed(1) + "px," + (sy - 8).toFixed(1) + "px)";
    });
  }
  function stage(q) {
    var k = 0; for (var i = 0; i < STAGES.length; i++) if (q >= STAGES[i]) k = i;
    beats.forEach(function (b, i) { b.classList.toggle("on", i === k); b.inert = i !== k; });
    if (call) call.classList.toggle("on", q >= CALL[0] && q <= CALL[1] && !phone);
    if (bar) bar.style.width = (q * 100).toFixed(1) + "%";
  }
  function tick(now) {
    raf = 0;
    var r = pin.getBoundingClientRect();
    target = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - innerHeight)));
    var dt = lastT ? Math.min(100, now - lastT) : 16.7; lastT = now;
    var k = 1 - Math.pow(0.8, dt / 16.667);
    p = p < 0 ? target : p + (target - p) * k; if (Math.abs(target - p) < 0.0008) p = target;
    cur = p; stage(p);
    if (!started && document.readyState === "complete" && r.top < innerHeight * 2.5 && r.bottom > -innerHeight) { started = true; size(); }
    if (started) { fill(); draw(); }
    if (p !== target) schedule(); else lastT = 0;
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(tick); }
  if (reduce) { beats.forEach(function (b) { b.classList.add("on"); }); return; }
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", function () { phone = matchMedia("(max-width:899px)").matches; size(); drawn = -1; schedule(); });
  addEventListener("load", schedule);
  addEventListener("t4lang", function () { drawn = -1; schedule(); });
  schedule();
  window["__" + sec.id] = { get p() { return p; }, get frame() { return drawn; }, get held() { return frames.filter(Boolean).length; }, N: N, set: SET };
});

/* ── "The cut": the round brilliant (gem.js), played by the scroll. First
   the drawing of its 57 facets, seen from the side, its parts named; then
   in light; then it turns to face you. It is built only once the reader has
   paused near it (motion-taste 3), and drawn only while it is on screen. ── */
(function () {
  "use strict";
  var sec = document.getElementById("cut");
  if (!sec) return;
  var pin = sec.querySelector(".cpin"), stick = sec.querySelector(".cstick"), cv = sec.querySelector(".ccv"), partsBox = sec.querySelector(".cparts");
  var parts = [].slice.call(sec.querySelectorAll(".cpart")), beats = [].slice.call(sec.querySelectorAll(".sfbeat")), bar = sec.querySelector(".prog i");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var gem = null, tried = false, raf = 0, p = -1, target = 0, lastT = 0, drift = 0, visible = false, slow = false, idle = 0;
  var L = { side: 0, cx: 0, cy: 0, phone: false }, times = [], Q = 1, still = false, settle = 0;
  var STAGES = [0, 0.2, 0.46, 0.76];
  function layout() {
    var W = innerWidth, VH = innerHeight, phone = W < 900;
    var side = phone ? Math.min(W * 0.96, VH * 0.52) : Math.min(VH * 0.92, W * 0.52);
    var dpr = Math.min(devicePixelRatio || 1, phone ? 1.6 : 2);
    if (side * dpr > (phone ? 1100 : 1500)) dpr = (phone ? 1100 : 1500) / side;
    var px = Math.round(side * dpr * Q);
    if (cv.width !== px) { cv.width = px; cv.height = px; }
    cv.style.width = cv.style.height = side + "px";
    L = { side: side, phone: phone, W: W, VH: VH };
  }
  function build() {
    if (tried) return; tried = true;
    layout();
    gem = window.SilavuGem ? window.SilavuGem(cv, { bounces: L.phone ? 5 : 7 }) : null;
    if (!gem) { sec.classList.add("nogl"); return; }
    cv.addEventListener("webglcontextlost", function (e) { e.preventDefault(); sec.classList.add("nogl"); gem = null; });
    /* the stone is sized to what this device can draw: it is measured, and
       made smaller until one drawing fits well inside a frame. Drawn without
       a graphics chip it is drawn small, and only once the page is still. */
    if (gem.soft) { Q = 0.4; still = true; slow = true; layout(); }
    else {
      var v = view(Math.max(0.5, p)), ms = 0;
      for (var k = 0; k < 4; k++) { gem.timed(v); ms = gem.timed(v); if (ms < 14 || Q <= 0.45) break; Q = Math.max(0.45, Q * 0.75); layout(); }
      if (ms > 22) slow = true;
    }
    schedule();
  }
  function stage(q) {
    var k = 0; for (var i = 0; i < STAGES.length; i++) if (q >= STAGES[i]) k = i;
    beats.forEach(function (b, i) { b.classList.toggle("on", i === k); b.inert = i !== k; });
    if (bar) bar.style.width = (q * 100).toFixed(1) + "%";
  }
  /* the stone at each point of the chapter */
  function view(q) {
    var lit = reduce ? 1 : Math.min(1, Math.max(0, (q - 0.13) / 0.16)), tf = reduce ? 1 : Math.min(1, Math.max(0, (q - 0.46) / 0.26));
    tf = tf * tf * (3 - 2 * tf);
    var tilt = tf * 1.38, wire = reduce ? 0 : 1 - Math.min(1, Math.max(0, (q - 0.2) / 0.14));
    var labels = !reduce && q > 0.05 && q < 0.44;
    var cx = L.phone ? 0.5 : document.documentElement.dir === "rtl" ? 0.37 : 0.63, cy = L.phone ? 0.31 : 0.5;
    var size = (L.phone ? 0.25 : 0.36) + tf * (L.phone ? 0.08 : 0.05);
    return { tilt: tilt, spin: q * 4.4 + drift, yaw: 0, wire: wire, lit: lit, size: size, y: -gem_mid() * (1 - tf), cxs: cx, cys: cy, labels: labels };
  }
  function gem_mid() { return gem ? gem.mid : -0.31; }
  function draw(v) {
    var side = L.side, x = v.cxs * L.W - side / 2, y = v.cys * L.VH - side / 2;
    cv.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
    stick.style.setProperty("--gx", (v.cxs * 100).toFixed(2) + "%"); stick.style.setProperty("--gy", (v.cys * 100).toFixed(2) + "%");
    if (gem) gem.draw({ tilt: v.tilt, spin: v.spin, yaw: v.yaw, wire: v.wire, lit: v.lit, size: v.size, y: v.y });
    partsBox.classList.toggle("on", v.labels && !!gem);
    if (v.labels && gem) {
      /* the names stand in one column to the right of the stone */
      var gap = L.phone ? 8 : 34, colR = x + side * (0.5 + v.size * 1.04) + gap, colL = x + side * (0.5 - v.size * 1.04) - gap;
      parts.forEach(function (el) {
        var pt = gem.project(el.getAttribute("data-part"), v), ax = x + pt.x * side, ay = y + pt.y * side, left = el.classList.contains("l");
        el.querySelector("b").style.width = Math.max(10, left ? ax - colL - 10 : colR - ax - 10).toFixed(0) + "px";
        el.style.transform = "translate3d(" + (left ? "calc(" + (ax + 2.5).toFixed(1) + "px - 100%)" : (ax - 2.5).toFixed(1) + "px") + "," + (ay - 8).toFixed(1) + "px,0)";
      });
    }
  }
  function tick(now) {
    raf = 0;
    var r = pin.getBoundingClientRect();
    target = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - innerHeight)));
    var dt = lastT ? Math.min(100, now - lastT) : 16.7; lastT = now;
    p = p < 0 ? target : p + (target - p) * (1 - Math.pow(0.84, dt / 16.667)); if (Math.abs(target - p) < 0.0005) p = target;
    stage(p);
    if (!visible) return;
    /* while it is on screen the stone keeps turning, slowly, so its light
       keeps changing; on a device that cannot keep up it turns only with the
       scroll */
    var moving = p !== target;
    if (gem && !reduce && !slow) { drift += dt * 0.00011; moving = true; }
    if (gem && still) {
      /* without a graphics chip: the words and labels follow the scroll, the
         stone is drawn again when the page comes to rest */
      clearTimeout(settle); settle = setTimeout(function () { draw(view(p)); }, 140);
      stage(p);
    } else if (gem) {
      draw(view(p));
      if (!slow) { times.push(now); if (times.length > 40) { var avg = (times[times.length - 1] - times[0]) / (times.length - 1); times.shift(); if (avg > 34) slow = true; } }
    } else stage(p);
    if (moving) schedule(); else lastT = 0;
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(tick); }
  new IntersectionObserver(function (es) { es.forEach(function (e) { visible = e.isIntersecting; if (visible) { if (!tried) build(); schedule(); } else { lastT = 0; times = []; } }); }, { rootMargin: "0px" }).observe(stick);
  /* built ahead of time once the reader pauses within a few screens of it */
  function near() { var r = sec.getBoundingClientRect(); return r.top < innerHeight * 3 && r.bottom > -innerHeight; }
  addEventListener("scroll", function () { schedule(); clearTimeout(idle); idle = setTimeout(function () { if (!tried && near() && document.readyState === "complete") build(); }, 450); }, { passive: true });
  addEventListener("resize", function () { if (tried) { layout(); schedule(); } });
  addEventListener("t4lang", schedule);
  if (reduce) beats.forEach(function (b) { b.classList.add("on"); });
  if (reduce) { addEventListener("load", function () { build(); if (gem) draw(view(1)); }); }
  window.__cut = { get p() { return p; }, get on() { return !!gem; }, get slow() { return slow; }, get q() { return Q; }, get still() { return still; } };
})();

/* ── the four of the signature: the scroll brings each forward in turn ── */
(function () {
  "use strict";
  var sec = document.getElementById("four");
  if (!sec) return;
  var pin = sec.querySelector(".fpin"), pcs = [].slice.call(sec.querySelectorAll(".fpc")), ones = [].slice.call(sec.querySelectorAll(".fone")), num = sec.querySelector(".fnum b");
  if (!pin || !pcs.length || matchMedia("(prefers-reduced-motion: reduce)").matches) { ones.forEach(function (o) { o.classList.add("on"); }); return; }
  var n = pcs.length, raf = 0, p = -1, lastT = 0, shown = -1, ready = false;
  /* the photographs are decoded before they are needed, not as they arrive */
  function prepare() {
    if (ready) return; var r = sec.getBoundingClientRect();
    if (r.top > innerHeight * 3 || document.readyState !== "complete") return;
    ready = true;
    sec.querySelectorAll(".fpc img").forEach(function (im) { im.loading = "eager"; if (im.decode) im.decode().catch(function () {}); });
  }
  var idle = 0;
  addEventListener("scroll", function () { clearTimeout(idle); idle = setTimeout(prepare, 300); }, { passive: true });
  addEventListener("load", function () { setTimeout(prepare, 300); });
  function tick(now) {
    raf = 0;
    var r = pin.getBoundingClientRect(), target = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - innerHeight)));
    var dt = lastT ? Math.min(100, now - lastT) : 16.7; lastT = now;
    p = p < 0 ? target : p + (target - p) * (1 - Math.pow(0.82, dt / 16.667)); if (Math.abs(target - p) < 0.0006) p = target;
    if (r.bottom > -innerHeight && r.top < innerHeight * 1.5) {
      /* each stop is held a little, so each piece can be looked at */
      var f = p * (n - 1), k = Math.floor(f), t = f - k; t = t < 0.25 ? 0 : t > 0.75 ? 1 : (t - 0.25) / 0.5; t = t * t * (3 - 2 * t); f = Math.min(n - 1, k + t);
      var wide = innerWidth >= 900, gap = wide ? Math.min(innerWidth * 0.3, 520) : innerWidth * 0.78;
      pcs.forEach(function (el, i) {
        var d = i - f, a = Math.min(1, Math.abs(d)), s = 1 - a * 0.48, x = d * gap, ry = -d * 28 + (i === Math.round(f) ? (p - 0.5) * 24 : 0);
        el.style.transform = "translate3d(" + x.toFixed(1) + "px," + (a * 18).toFixed(1) + "px,0) rotateY(" + ry.toFixed(2) + "deg) scale(" + s.toFixed(3) + ")";
        el.style.opacity = (1 - a * 0.62).toFixed(3);
        el.style.zIndex = String(10 - Math.round(Math.abs(d) * 3));
      });
      var on = Math.round(f);
      if (on !== shown) { shown = on; ones.forEach(function (o, i) { o.classList.toggle("on", i === on); o.inert = i !== on; }); if (num) num.textContent = "0" + (on + 1); }
    }
    if (p !== target) raf = requestAnimationFrame(tick); else lastT = 0;
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(tick); }
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
  schedule();
})();
