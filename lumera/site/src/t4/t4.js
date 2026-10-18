/* /test4/: what moves, and why (motion-taste 1):
   - the opening film closes into an arch as the page moves (continuity);
   - the house's sentence is inked in as it is read;
   - "SOUL, in light" and "The cut" are played by the scroll, one stage of
     words at a time (they explain the piece and the stone);
   - the collection brings each signature piece forward in turn.
   One loop drives everything. Where things are on the page is measured
   when the page changes (size, fonts, language), never while it scrolls:
   a frame reads the scroll position and writes only the styles that
   changed. Transform, opacity and clip only. */
(function () {
  "use strict";
  var H = document.documentElement, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { x = clamp(x); return x * x * (3 - 2 * x); }
  function out(x) { x = clamp(x); return 1 - Math.pow(1 - x, 3); }
  function rtl() { return H.dir === "rtl"; }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  var hooks = [];

  /* ── the loop ── */
  var scenes = [], geos = [], raf = 0, V = { Y: 0, W: innerWidth, VH: innerHeight, now: 0 };
  function geo(el) { var g = { el: el, top: 0, h: 0 }; geos.push(g); return g; }
  function measure() {
    var y = scrollY;
    geos.forEach(function (g) { var r = g.el.getBoundingClientRect(); g.top = r.top + y; g.h = r.height; });
    V.W = innerWidth; V.VH = innerHeight;
    scenes.forEach(function (s) { if (s.measure) s.measure(); });
    kick();
  }
  function run(now) {
    raf = 0; V.Y = scrollY; V.now = now;
    var more = false;
    for (var i = 0; i < scenes.length; i++) if (scenes[i].frame && scenes[i].frame() === true) more = true;
    if (more) kick();
  }
  function kick() { if (!raf) raf = requestAnimationFrame(run); }
  addEventListener("scroll", kick, { passive: true });
  /* a phone's own bars coming and going change the height a little: the
     stages are sized to the large viewport, so that is not a new layout */
  var lastW = innerWidth, lastH = innerHeight;
  addEventListener("resize", function () {
    var dw = Math.abs(innerWidth - lastW), dh = Math.abs(innerHeight - lastH);
    if (dw > 0 || dh > 160 || !matchMedia("(pointer: coarse)").matches) { lastW = innerWidth; lastH = innerHeight; measure(); } else kick();
  });
  addEventListener("load", measure);
  addEventListener("pageshow", function (e) { if (e.persisted) { scenes.forEach(function (s) { if (s.wake) s.wake(); }); measure(); } });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  if (window.ResizeObserver) { var roT = 0; new ResizeObserver(function () { clearTimeout(roT); roT = setTimeout(measure, 60); }).observe(document.body); }
  hooks.push(function () { requestAnimationFrame(measure); });

  /* ── the language: English and Hebrew are in the page; French, Arabic and
     Russian come from the site's dictionaries (lang/*.json) ── */
  var LANGNAME = { en: "English", he: "עברית", fr: "Français", ar: "العربية", ru: "Русский" };
  (function () {
    var cache = {};
    function apply(l, dict) {
      var r = l === "he" || l === "ar";
      H.lang = l; H.dir = r ? "rtl" : "ltr";
      if (r) H.setAttribute("data-ns", "1"); else H.removeAttribute("data-ns");
      $$("[data-en]").forEach(function (el) { var en = el.getAttribute("data-en"), t = l === "en" ? en : l === "he" ? el.getAttribute("data-he") : dict && dict[en]; el.innerHTML = t || en; });
      $$("img[data-alt-he]").forEach(function (im) { if (!im.hasAttribute("data-alt-en")) im.setAttribute("data-alt-en", im.alt); var en = im.getAttribute("data-alt-en"); im.alt = l === "he" ? im.getAttribute("data-alt-he") : l === "en" ? en : (dict && dict[en]) || en; });
      $$("[data-aria-he]").forEach(function (el) { if (!el.hasAttribute("data-aria-en")) el.setAttribute("data-aria-en", el.getAttribute("aria-label") || ""); var en = el.getAttribute("data-aria-en"); el.setAttribute("aria-label", l === "he" ? el.getAttribute("data-aria-he") : l === "en" ? en : (dict && dict[en]) || en); });
      $$(".lang button, .mlang button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-lang") === l ? "true" : "false"); });
      hooks.forEach(function (f) { f(l); });
    }
    function go(l) {
      try { localStorage.setItem("silavu-lang", l); } catch (e) {}
      try { var u = new URL(location.href); if (l === "en") u.searchParams.delete("lang"); else u.searchParams.set("lang", l); if (u.href !== location.href) history.replaceState(history.state, "", u.pathname + u.search + u.hash); } catch (e) {}
      if (l === "en" || l === "he" || cache[l]) return apply(l, cache[l]);
      fetch("../lang/" + l + ".json", { cache: "force-cache" }).then(function (r) { return r.json(); })
        .then(function (d) { cache[l] = d; apply(l, d); }).catch(function () { apply("en"); });
    }
    $$(".lang button, .mlang button").forEach(function (b) { b.addEventListener("click", function () { go(b.getAttribute("data-lang")); }); });
    var l = "en", qp = new URLSearchParams(location.search).get("lang");
    try { l = localStorage.getItem("silavu-lang") || "en"; } catch (e) {}
    if (qp && /^(en|he|fr|ar|ru)$/.test(qp)) l = qp;
    setTimeout(function () { go(l); }, 0);
  })();
  $$(".fyr").forEach(function (e) { e.textContent = new Date().getFullYear(); });

  /* ── frames played by the scroll: a shared loader ──
     Every frame of every film goes through one queue, at most a few at a
     time (so a fast scroll cannot start a burst of requests). The next one
     is chosen when a slot frees: the nearest to where its film is, ahead in
     the direction of travel first. Decoded pictures are held within a budget
     of memory per film: a window around the playhead and a sparse skeleton
     across the whole film (so a jump always finds something near), and
     everything else is let go. A failed request waits longer each time
     before it is asked again. */
  var Loader = (function () {
    var q = [], busy = 0, LIMIT = matchMedia("(pointer: coarse)").matches ? 3 : 4;
    function pump() {
      while (busy < LIMIT && q.length) {
        var bi = -1, bs = Infinity;
        for (var k = 0; k < q.length; k++) { var s = q[k].seq.score(q[k].i); if (s < bs) { bs = s; bi = k; } }
        var job = q.splice(bi, 1)[0];
        if (!job.seq.wants(job.i)) { job.seq.dropped(job.i); continue; }
        busy++; go(job);
      }
    }
    function go(job) {
      var seq = job.seq, i = job.i, gen = seq.gen;
      fetch(seq.src(i)).then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); })
        .then(function (b) { return createImageBitmap(b); })
        .then(function (bm) { busy--; seq.got(i, bm, gen); pump(); }, function () { busy--; seq.failed(i, gen); pump(); });
    }
    return { add: function (seq, i) { q.push({ seq: seq, i: i }); pump(); }, purge: function (seq) { q = q.filter(function (j) { if (j.seq === seq) { seq.dropped(j.i); return false; } return true; }); } };
  })();
  function FrameSeq(o) {
    var self = this, N = o.n, frames = new Array(N), state = new Uint8Array(N), fails = new Uint8Array(N), retry = new Float64Array(N);
    var set = "", held = 0, cur = 0, dir = 1, active = false, skelEvery = N, ahead = 8, behind = 3, budget = o.budget;
    this.gen = 0;
    this.src = function (i) { return o.src(set, i); };
    function isSkel(i) { return i % skelEvery === 0 || i === N - 1; }
    function inWin(i) { var d = (i - cur) * dir; return d >= -behind && d <= ahead; }
    this.wants = function (i) { return active && (inWin(i) || isSkel(i)); };
    this.score = function (i) { var d = (i - cur) * dir; return d >= 0 ? d : 2 - d * 2.5 + (isSkel(i) ? 0 : 6); };
    function free(i) { if (frames[i]) { if (frames[i].close) frames[i].close(); frames[i] = null; held--; } state[i] = 0; }
    this.got = function (i, bm, gen) {
      if (gen !== self.gen || !self.wants(i)) { if (bm.close) bm.close(); if (gen === self.gen) state[i] = 0; return; }
      if (!frames[i]) held++;
      frames[i] = bm; state[i] = 2; fails[i] = 0;
      if (o.onload) o.onload(i);
    };
    this.failed = function (i, gen) { if (gen !== self.gen) return; state[i] = 0; fails[i] = Math.min(fails[i] + 1, 6); retry[i] = performance.now() + 700 * Math.pow(2, fails[i]); };
    this.dropped = function (i) { if (state[i] === 1) state[i] = 0; };
    /* the film to use (its size follows the screen); a change lets
       everything go and starts again */
    this.use = function (s, bytes) {
      if (s === set) return false;
      self.gen++; Loader.purge(self); for (var i = 0; i < N; i++) free(i);
      set = s;
      var max = Math.max(6, Math.floor(budget / bytes)), sk = Math.max(2, Math.min(Math.ceil(N / 6), Math.floor(max * 0.3)));
      skelEvery = Math.ceil(N / sk); var w = max - sk; ahead = Math.max(3, Math.round(w * 0.7)); behind = Math.max(2, w - ahead);
      return true;
    };
    this.on = function (b) {
      if (b === active) return; active = b;
      if (!b) { Loader.purge(self); for (var i = 0; i < N; i++) if (frames[i] && !isSkel(i)) free(i); }
    };
    this.sleep = function () { if (!held && !active) return; active = false; Loader.purge(self); for (var i = 0; i < N; i++) free(i); };
    /* the playhead: keep what is near it, ask for what is missing */
    this.at = function (i) {
      if (i !== cur) dir = i > cur ? 1 : -1;
      cur = i;
      if (!active || !set) return;
      for (var j = 0; j < N; j++) if (frames[j] && !self.wants(j)) free(j);
      var now = performance.now();
      for (var d = 0; d <= ahead; d++) { var a = cur + d * dir; if (a >= 0 && a < N && !state[a] && retry[a] <= now) { state[a] = 1; Loader.add(self, a); } if (d && d <= behind) { var b = cur - d * dir; if (b >= 0 && b < N && !state[b] && retry[b] <= now) { state[b] = 1; Loader.add(self, b); } } }
      for (var s = 0; s < N; s += skelEvery) if (!state[s] && retry[s] <= now) { state[s] = 1; Loader.add(self, s); }
      if (!state[N - 1] && retry[N - 1] <= now) { state[N - 1] = 1; Loader.add(self, N - 1); }
    };
    /* the frame to show for the playhead, given the one on screen: never
       one behind it while the reader is moving forward (or ahead of it
       while moving back): until a nearer one has arrived, the one on screen
       stays. With nothing on screen yet, the nearest there is */
    this.pick = function (t, shown) {
      if (frames[t]) return t;
      if (shown >= 0) {
        if (t > shown) { for (var k = t - 1; k > shown; k--) if (frames[k]) return k; return -1; }
        for (var m = t + 1; m < shown; m++) if (frames[m]) return m; return -1;
      }
      for (var d = 1; d < N; d++) { if (frames[t - d]) return t - d; if (frames[t + d]) return t + d; }
      return -1;
    };
    this.get = function (i) { return frames[i]; };
    this.stats = function () { return { set: set, held: held, skelEvery: skelEvery, ahead: ahead, behind: behind }; };
  }
  var MEM = (navigator.deviceMemory && navigator.deviceMemory <= 4) || matchMedia("(pointer: coarse)").matches ? 72e6 : 170e6;

  /* a pinned chapter's progress: how far through its pin the page is, with
     a short time-based easing so the reader's hand is followed closely and
     a turn back answers at once; a long jump (a link, Back, a flick) is
     taken almost at once rather than played through */
  function Pin(el, stage) {
    var g = geo(el), sh = 0, p = -1, last = 0, seen = false;
    return {
      measure: function () { sh = stage.clientHeight || innerHeight; },
      near: function (m) { return V.Y + V.VH * (1 + m) > g.top && V.Y - V.VH * m < g.top + g.h; },
      target: function () { return clamp((V.Y - g.top) / Math.max(1, g.h - sh)); },
      step: function (tau, jump) {
        var t = this.target(), dt = last ? Math.min(100, V.now - last) : 16.7; last = V.now;
        if (p < 0 || !seen) p = t;
        else if (Math.abs(t - p) > jump) p = t - Math.sign(t - p) * jump * 0.25;
        else p += (t - p) * (1 - Math.exp(-dt / tau));
        if (Math.abs(t - p) < 0.0004) p = t;
        seen = true;
        if (p === t) last = 0;
        return p;
      },
      settled: function () { return p === this.target(); },
      leave: function () { seen = false; last = 0; },
      get p() { return p; }, g: g, get sh() { return sh; }
    };
  }

  /* ── the opening ── */
  var archOpen = 0;
  (function () {
    var sec = $(".open"); if (!sec) return;
    var stick = $(".ostick", sec), film = $(".ofilm", sec), vid = $(".ovid", sec), hero = $(".ohero", sec), pin = Pin($(".opin", sec), stick), uw = false;
    function pick() {
      var W = innerWidth, VH = innerHeight;
      if (W / VH < 1) return vid.getAttribute("data-src-m");
      if (W / VH >= 2.8 && W >= 1800) { uw = true; return vid.getAttribute("data-src-uw"); }
      return vid.getAttribute("data-src");
    }
    function start() {
      if (reduce || !vid) return;
      var c = navigator.connection || {}; if (c.saveData || /2g$/.test(c.effectiveType || "")) return;
      vid.src = pick();
      vid.addEventListener("playing", function () { vid.classList.add("on"); }, { once: true });
      var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {});
      new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var r = vid.play(); if (r && r.catch) r.catch(function () {}); } else vid.pause(); }); }).observe(stick);
    }
    if (document.readyState === "complete") start(); else addEventListener("load", start);
    var last = "", lastK = "";
    scenes.push({ measure: pin.measure, frame: function () {
      if (!pin.near(0.2)) return;
      var p = reduce ? 0 : pin.target(), W = V.W, VH = pin.sh, tall = W / VH < 1, e = ease(p / 0.7);
      archOpen = e;
      var T = (tall ? 0.13 : 0.12) * VH, B = (tall ? 0.3 : 0.12) * VH, aw = tall ? 0.82 * W : Math.min(0.3 * W, 0.72 * (VH - T - B)), S = (W - aw) / 2, rad = aw / 2 * e;
      var clip = e < 0.002 ? "none" : "inset(" + (e * T).toFixed(0) + "px " + (e * S).toFixed(0) + "px " + (e * B).toFixed(0) + "px " + (e * S).toFixed(0) + "px round " + rad.toFixed(0) + "px " + rad.toFixed(0) + "px 0 0)";
      if (clip !== last) { film.style.clipPath = clip; last = clip; if (uw) vid.style.objectPosition = (50 + 25 * e).toFixed(1) + "% 50%"; }
      var ho = 1 - clamp(p / 0.18), to = out((p - 0.22) / 0.4), key = ho.toFixed(3) + to.toFixed(3);
      if (key !== lastK) {
        lastK = key;
        stick.style.setProperty("--ho", ho.toFixed(3)); stick.style.setProperty("--hy", (-36 * (1 - ho)).toFixed(1) + "px");
        stick.style.setProperty("--to", to.toFixed(3)); stick.style.setProperty("--tx", (1 - to).toFixed(3)); stick.style.setProperty("--sh", (1 - e).toFixed(3));
        hero.style.visibility = ho < 0.01 ? "hidden" : "";
      }
    } });
  })();

  /* ── the house's sentence, inked in as it is read ── */
  (function () {
    var el = $(".wtext"); if (!el) return;
    var ws = [], was = [], g = geo(el);
    function split() {
      var words = el.textContent.trim().split(/\s+/);
      el.innerHTML = words.map(function (w) { return '<span class="w">' + w.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</span>"; }).join(" ");
      ws = $$(".w", el); was = []; kick();
    }
    hooks.push(split);
    if (reduce) return;
    scenes.push({ frame: function () {
      var top = g.top - V.Y; if (top + g.h < 0 || top > V.VH || !ws.length) return;
      var p = clamp((V.VH * 0.85 - top) / (V.VH * 0.45 + g.h * 0.5)), n = ws.length;
      for (var i = 0; i < n; i++) { var o = (0.16 + 0.84 * clamp(p * (n + 2) - i)).toFixed(2); if (was[i] !== o) { was[i] = o; ws[i].style.opacity = o; } }
    } });
  })();

  /* a stage of words at a time, the place in the chapter on a hairline */
  function Stages(sec, list) {
    var beats = $$(".sfbeat", sec), bar = $(".prog i", sec), k = -1, lastBar = -1;
    if (reduce) beats.forEach(function (b) { b.classList.add("on"); });
    return function (q) {
      if (reduce) return;
      var n = 0; for (var i = 0; i < list.length; i++) if (q >= list[i]) n = i;
      if (n !== k) { k = n; beats.forEach(function (b, i) { b.classList.toggle("on", i === n); b.inert = i !== n; }); }
      var s = Math.round(q * 400) / 400; if (bar && s !== lastBar) { lastBar = s; bar.style.transform = "scaleX(" + s + ")"; }
    };
  }

  /* ── "SOUL, in light": the signature moment ── */
  (function () {
    var sec = $("#soulfilm"); if (!sec) return;
    var stick = $(".sstick", sec), cv = $(".scv", sec), ctx = cv.getContext("2d"), poster = $(".sposter", sec), call = $(".sfcall", sec), calls = $$(".sfc", sec);
    var N = +sec.getAttribute("data-n"), base = sec.getAttribute("data-base"), CX = sec.getAttribute("data-cx").split(",").map(Number), CXREF = +sec.getAttribute("data-cxref");
    var CALL = sec.getAttribute("data-call").split(",").map(Number), stage = Stages(sec, sec.getAttribute("data-stages").split(",").map(Number));
    var pin = Pin($(".spin", sec), stick), tall = false, W = 0, Hh = 0, shown = -1, fit = null, lastCall = null;
    var BYTES = { d: 1920 * 1080 * 4, x: 2560 * 1440 * 4, m: 900 * 1600 * 4 };
    var seq = new FrameSeq({ n: N, budget: MEM, src: function (s, i) { return base + s + "-" + ("00" + i).slice(-3) + ".webp"; }, onload: function () { kick(); } });
    function anchor() { return rtl() ? 0.36 : 0.64; }
    var api = {
      measure: function () {
        pin.measure();
        var w0 = stick.clientWidth, h0 = stick.clientHeight, dpr = Math.min(devicePixelRatio || 1, 2);
        tall = w0 / h0 < 1;
        var set = tall ? "m" : w0 * dpr >= 2400 ? "x" : "d";
        if (seq.use(set, BYTES[set])) { shown = -1; poster.src = tall ? poster.getAttribute("data-tall") : base + "d-000.webp"; }
        var w = Math.round(w0 * dpr), h = Math.round(h0 * dpr);
        if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; shown = -1; }
        W = w; Hh = h; fit = null;
      },
      wake: function () { pin.leave(); shown = -1; },
      frame: function () {
        if (reduce) return;
        var near = pin.near(1.2);
        seq.on(near && document.readyState === "complete");
        if (!near) { if (!pin.near(4)) seq.sleep(); pin.leave(); shown = -1; return; }
        var p = pin.step(70, 0.2), i = Math.round(p * (N - 1));
        stage(p);
        seq.at(i);
        var k = seq.pick(i, shown);
        if (k >= 0 && k !== shown) draw(k);
        var on = !tall && p >= CALL[0] && p <= CALL[1];
        if (on !== lastCall) { lastCall = on; call.classList.toggle("on", on); }
        return !pin.settled();
      }
    };
    function draw(k) {
      var im = seq.get(k), iw = im.width, ih = im.height, sc = Math.max(W / iw, Hh / ih), dw = iw * sc, dh = ih * sc;
      var cx = tall ? 0.5 : (CX[k] || CXREF), ox = tall ? (W - dw) / 2 : W * anchor() - cx * dw, oy = (Hh - dh) / 2;
      ctx.drawImage(im, ox, oy, dw, dh);
      /* where the frame no longer reaches the edge, its own edge (plain
         studio white) is drawn out */
      if (ox > 0) ctx.drawImage(im, 0, 0, 3, ih, 0, oy, ox + 1, dh);
      if (ox + dw < W) ctx.drawImage(im, iw - 3, 0, 3, ih, ox + dw - 1, oy, W - ox - dw + 1, dh);
      shown = k;
      if (!sec.classList.contains("ready")) sec.classList.add("ready");
      var nf = sc.toFixed(4) + oy.toFixed(1) + anchor();
      if (!tall && nf !== fit) { fit = nf; var dpr = W / Math.max(1, stick.clientWidth);
        calls.forEach(function (c) { var x = +c.getAttribute("data-x"), y = +c.getAttribute("data-y"), sx = (W * anchor() + (x - CXREF) * iw * sc) / dpr, sy = (oy + y * ih * sc) / dpr;
          c.style.transform = "translate(" + (sx - 3.5).toFixed(1) + "px," + (sy - 8).toFixed(1) + "px)"; }); }
    }
    hooks.push(function () { shown = -1; fit = null; });
    scenes.push(api);
    window.__soul = { get p() { return pin.p; }, get frame() { return shown; }, stats: seq.stats };
  })();

  /* ── "ICON, from one stone": the ring made, rendered once
     (icon-frames.mjs) and played by the scroll; the photograph of it worn
     comes last ── */
  (function () {
    var sec = $("#icon"); if (!sec) return;
    var stick = $(".sstick", sec), cv = $(".icv", sec), ctx = cv.getContext("2d"), poster = $(".iposter", sec), worn = $(".iworn", sec);
    var N = +sec.getAttribute("data-n"), base = sec.getAttribute("data-base"), stage = Stages(sec, sec.getAttribute("data-stages").split(",").map(Number));
    var pin = Pin($(".spin", sec), stick), tall = false, W = 0, Hh = 0, shown = -1, lastW = -1;
    var BYTES = { d: 1920 * 1080 * 4, m: 900 * 1600 * 4 };
    var seq = new FrameSeq({ n: N, budget: MEM, src: function (s, i) { return base + s + "-" + ("00" + i).slice(-3) + ".webp"; }, onload: function () { kick(); } });
    var api = {
      measure: function () {
        pin.measure();
        var w0 = stick.clientWidth, h0 = stick.clientHeight, dpr = Math.min(devicePixelRatio || 1, 2);
        tall = w0 / h0 < 1;
        var set = tall ? "m" : "d";
        if (seq.use(set, BYTES[set])) { shown = -1; poster.src = tall ? poster.getAttribute("data-tall") : base + "d-119.webp"; }
        var w = Math.round(w0 * dpr), h = Math.round(h0 * dpr);
        if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; shown = -1; }
        W = w; Hh = h;
      },
      wake: function () { pin.leave(); shown = -1; },
      frame: function () {
        if (reduce) return;
        var near = pin.near(1.2);
        seq.on(near && document.readyState === "complete");
        if (!near) { if (!pin.near(4)) seq.sleep(); pin.leave(); shown = -1; return; }
        var p = pin.step(70, 0.2), i = Math.round(p * (N - 1));
        stage(p);
        seq.at(i);
        var k = seq.pick(i, shown);
        if (k >= 0 && k !== shown) draw(k);
        var wo = Math.round(ease((p - 0.88) / 0.1) * 100) / 100;
        if (wo !== lastW) { lastW = wo; worn.style.opacity = wo; stick.style.setProperty("--wo", wo); }
        return !pin.settled();
      }
    };
    function draw(k) {
      var im = seq.get(k), iw = im.width, ih = im.height, sc = Math.max(W / iw, Hh / ih), dw = iw * sc, dh = ih * sc;
      /* on a wide screen the ring stands two thirds across, away from the
         words; the studio is one tone, so its edge is simply drawn out */
      var ox = tall ? (W - dw) / 2 : W * (rtl() ? 0.35 : 0.65) - dw / 2, oy = (Hh - dh) / 2;
      ctx.drawImage(im, ox, oy, dw, dh);
      if (ox > 0) ctx.drawImage(im, 0, 0, 3, ih, 0, oy, ox + 1, dh);
      if (ox + dw < W) ctx.drawImage(im, iw - 3, 0, 3, ih, ox + dw - 1, oy, W - ox - dw + 1, dh);
      shown = k;
      if (!sec.classList.contains("ready")) sec.classList.add("ready");
    }
    hooks.push(function () { shown = -1; });
    scenes.push(api);
    window.__icon = { get p() { return pin.p; }, get frame() { return shown; }, stats: seq.stats };
  })();

  /* ── the collection ──
     One progress value (the scroll through the chapter) sets everything:
     each piece's place, size and depth, which one is named, the counter and
     the controls. Its mapping moves all the time: it only slows a little as
     a piece reaches the centre, so each piece has a moment without the page
     ever holding still under the reader's hand. The controls move the page
     itself, so scrolling and pressing are the same state. */
  /* the same test as the one in the page's head, which sets the layout
     before anything is drawn (so a restored scroll position is not moved) */
  function pinFits() { return !reduce && innerWidth >= 900 && innerHeight >= 560 && innerWidth / innerHeight >= 1.05; }
  var four = (function () {
    var sec = $("#four"); if (!sec) return null;
    var stick = $(".fstick", sec), track = $(".ftrack", sec), cards = $$(".fcard", sec), dots = $$(".fdot", sec), prev = $(".fprev", sec), next = $(".fnext", sec), num = $(".fnum b", sec);
    var n = cards.length, infos = cards.map(function (c) { return $(".finfo", c); }), backs = cards.map(function (c) { return $(".fb", c); });
    var pin = Pin($(".fpin", sec), stick), mode = "", active = -1, step = 0, last = [], gap = 0, lift = 0;
    /* the mapping: steady forward motion, a little slower (never stopped)
       while a piece is at the centre */
    function g(u) { var k = Math.floor(u), t = u - k; return Math.min(n - 1, k + t - 0.55 / (2 * Math.PI) * Math.sin(2 * Math.PI * t)); }
    function setActive(i) {
      if (i === active) return; active = i;
      dots.forEach(function (d, k) { if (k === i) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current"); });
      if (num) num.textContent = "0" + (i + 1);
      prev.disabled = i <= 0; next.disabled = i >= n - 1;
      if (mode === "pin") cards.forEach(function (c, k) { c.inert = k !== i; c.setAttribute("aria-hidden", k === i ? "false" : "true"); });
    }
    function clear() { cards.forEach(function (c, k) { c.style.transform = ""; c.style.zIndex = ""; c.style.opacity = ""; c.inert = false; c.removeAttribute("aria-hidden"); infos[k].style.opacity = ""; backs[k].style.opacity = ""; }); last = []; }
    function goTo(i, instant) {
      i = Math.max(0, Math.min(n - 1, i));
      if (mode === "pin") {
        var range = pin.g.h - pin.sh, y = pin.g.top + (n > 1 ? i / (n - 1) : 0) * range;
        window.scrollTo({ top: Math.round(y), behavior: instant || reduce ? "instant" : "smooth" });
      } else {
        track.scrollTo({ left: i * step * (rtl() ? -1 : 1), behavior: instant || reduce ? "instant" : "smooth" });
      }
    }
    prev.addEventListener("click", function () { goTo(active - 1); });
    next.addEventListener("click", function () { goTo(active + 1); });
    dots.forEach(function (d, k) { d.addEventListener("click", function () { goTo(k); }); });
    /* keys answer at once, without animation (motion-taste 1) */
    sec.addEventListener("keydown", function (e) {
      var f = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!f) return;
      if (rtl()) f = -f; e.preventDefault(); goTo(active + f, true);
    });
    track.addEventListener("scroll", kick, { passive: true });
    var api = {
      measure: function () {
        var m = pinFits() ? "pin" : "gallery";
        if (m !== mode) { mode = m; H.classList.toggle("pin4", m === "pin"); clear(); active = -1; pin.leave(); }
        pin.measure();
        gap = Math.min(V.W * 0.27, 470); lift = V.VH * 0.035;
        step = cards.length > 1 ? Math.abs(cards[1].offsetLeft - cards[0].offsetLeft) : 1;
      },
      wake: function () { pin.leave(); },
      frame: function () {
        if (mode === "gallery") {
          if (!pin.near(0.5)) return;
          setActive(Math.max(0, Math.min(n - 1, Math.round(Math.abs(track.scrollLeft) / Math.max(1, step)))));
          return;
        }
        if (!pin.near(0.3)) { pin.leave(); return; }
        var p = pin.step(55, 1.05 / (n - 1)), f = g(p * (n - 1)), s = rtl() ? -1 : 1;
        for (var i = 0; i < n; i++) {
          var d = i - f, a = Math.abs(d), c = Math.min(a, 1.5);
          /* beyond its neighbours a piece leaves the stage sideways rather
             than lingering faded */
          var x = (d + Math.sign(d) * Math.max(0, a - 1) * 0.8) * gap * s;
          var tr = "translate3d(" + x.toFixed(1) + "px," + (-c * lift).toFixed(1) + "px,0) scale(" + (1 - c * 0.3 + (1 - Math.min(a, 1)) * 0.03).toFixed(4) + ")";
          var op = a < 1.2 ? 1 : Math.max(0, 1 - (a - 1.2) / 0.3), io = clamp(1 - a * 2.6), bo = clamp((-d - 0.03) / 0.14) * clamp(1 - (-d - 0.5) / 0.3);
          var key = tr + op.toFixed(3) + io.toFixed(3) + bo.toFixed(3);
          if (last[i] === key) continue; last[i] = key;
          cards[i].style.transform = tr; cards[i].style.opacity = op.toFixed(3); cards[i].style.zIndex = String(20 - Math.round(a * 4));
          infos[i].style.opacity = io.toFixed(3); backs[i].style.opacity = bo.toFixed(3);
        }
        setActive(Math.max(0, Math.min(n - 1, Math.round(f))));
        return !pin.settled();
      },
      goTo: goTo, get active() { return active; }, get mode() { return mode; }, get p() { return pin.p; }
    };
    hooks.push(function () { last = []; });
    scenes.push(api);
    return api;
  })();
  window.__four = four;

  /* ── the mark comes forward as the appointment arrives ── */
  (function () {
    var sec = $(".appt"), m = sec && $(".amark", sec); if (!sec || !m || reduce) return;
    var g = geo(sec), lastO = -1;
    scenes.push({ frame: function () {
      var top = g.top - V.Y; if (top + g.h < 0 || top > V.VH) return;
      var p = ease((V.VH - top) / (V.VH * 0.95)), o = Math.round(p * 200) / 200; if (o === lastO) return; lastO = o;
      m.style.opacity = (o * 0.5).toFixed(3); m.style.transform = "translate(-50%,-50%) scale(" + (1.06 - 0.06 * o).toFixed(4) + ")";
    } });
  })();

  /* ── the bar: steps aside while the reader reads down, back when they turn
     up; its ink follows the chapter under it ── */
  (function () {
    var lastY = scrollY, tones = $$("[data-tone]").map(function (el) { var g = geo(el); g.tone = el.getAttribute("data-tone"); return g; }), cur = "", up = null, solid = null;
    scenes.push({ frame: function () {
      var d = V.Y - lastY;
      if (Math.abs(d) >= 6) { var u = d > 0 && V.Y > 160 && !H.classList.contains("lock"); if (u !== up) { up = u; H.classList.toggle("hd-up", u); } lastY = V.Y; }
      var s = V.Y > 160; if (s !== solid) { solid = s; H.classList.toggle("hd-solid", s); }
      var tone = "paper";
      for (var i = 0; i < tones.length; i++) { var t = tones[i].top - V.Y; if (t <= 40 && t + tones[i].h > 40) { tone = tones[i].tone; break; } }
      if (tone === "film" && archOpen > 0.25) tone = "paper";
      if (tone !== cur) { cur = tone; H.classList.toggle("on-film", tone === "film"); H.classList.toggle("on-night", tone === "night" || tone === "stone"); }
    } });
  })();

  /* ── sheets: the menu and the private viewing. The page behind is out of
     reach while one is open; Escape or the scrim closes it, and focus goes
     back where it came from ── */
  function Sheet(el) {
    var panel = $(".panel", el), from = null, outside = [$("main"), $(".hd"), $(".ft"), $(".skip")].filter(Boolean), t = 0, me;
    function close(keepFocus) {
      if (el.hidden) return;
      el.classList.remove("open"); H.classList.remove("lock"); outside.forEach(function (o) { o.inert = false; });
      clearTimeout(t); t = setTimeout(function () { el.hidden = true; }, reduce ? 0 : 280);
      if (!keepFocus && from && from.focus && document.contains(from)) try { from.focus({ preventScroll: true }); } catch (e) {}
      if (me.onclose) me.onclose();
    }
    function open(opener) {
      from = opener || document.activeElement; clearTimeout(t);
      el.hidden = false; H.classList.add("lock"); outside.forEach(function (o) { o.inert = true; });
      requestAnimationFrame(function () { el.classList.add("open"); var f = $("input:checked", panel) || panel; try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } });
    }
    el.addEventListener("click", function (e) { var c = e.target.closest("[data-close]"); if (c) close(c.tagName === "A"); });
    el.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); close(); } });
    me = { open: open, close: close, el: el };
    return me;
  }
  var menuEl = $("#menu"), menu = menuEl && Sheet(menuEl), menuBtn = $(".hmenu");
  if (menu && menuBtn) {
    menuBtn.addEventListener("click", function () { menuBtn.setAttribute("aria-expanded", "true"); menu.open(menuBtn); });
    menu.onclose = function () { menuBtn.setAttribute("aria-expanded", "false"); };
  }
  var bookEl = $("#book"), book = bookEl && Sheet(bookEl);
  if (book) {
    var radios = $$('input[name="bpiece"]', bookEl), go = $(".bgo", bookEl), mail = $(".bmail", bookEl), refEl = $(".bref", bookEl), langEl = $(".blang", bookEl);
    /* the piece and the language travel with the reader: the house's own
       form opens with the piece chosen (?piece=…), in the reader's language */
    var paint = function () {
      var r = radios.filter(function (x) { return x.checked; })[0] || radios[radios.length - 1], id = r.value, l = H.lang || "en";
      var qs = []; if (id) qs.push("piece=" + id, "act=viewing"); if (l !== "en" && l !== "he") qs.push("lang=" + l);
      go.href = (l === "he" ? "../he/" : "../") + (qs.length ? "?" + qs.join("&") : "") + "#concierge";
      refEl.textContent = r.getAttribute("data-ref") || "—"; langEl.textContent = LANGNAME[l] || l;
      var subj = "SILAVU · Private viewing" + (id ? " · " + r.getAttribute("data-name") + " (" + r.getAttribute("data-ref") + ")" : "");
      var body = (id ? "Piece: " + r.getAttribute("data-name") + "\nReference: " + r.getAttribute("data-ref") + "\n" : "") + "Language: " + (LANGNAME[l] || l) + "\n\n";
      mail.href = "mailto:concierge@silavu.com?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body);
    };
    radios.forEach(function (x) { x.addEventListener("change", paint); });
    hooks.push(paint);
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-book]"); if (!b) return;
      e.preventDefault();
      var id = b.getAttribute("data-book");
      /* from the collection's own controls, the piece in front */
      if (!id && b.closest("#four") && four) { var fc = $$("#four .fcard")[four.active]; id = fc && fc.id.slice(2); }
      var r = id && $("#bp-" + id); if (r) r.checked = true; else $("#bp-open").checked = true;
      paint();
      if (menu && !menuEl.hidden) menu.close(true);
      book.open(b);
    });
    paint();
  }

  measure();
})();
