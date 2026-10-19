/* /test6/: what moves, and why (motion-taste 1):
   - the house's film opens the page and plays while it is on screen;
   - SOUL's story is played by the scroll and only by the scroll: the camera
     draws back from the metal, the pendant turns, its diamonds settle, the
     camera goes in to the pavé and back, and SOUL meets the film of it worn,
     which then plays (it explains the piece, then shows it lived in);
   - the collection: a piece comes forward when it is chosen (continuity).
   Lightness is a design rule here. The frames are plain JPEGs on an opaque
   canvas (nothing to blend); on a touch screen the frame follows the finger
   exactly (no easing to lag behind it); every frame's bytes are fetched
   ahead while the page is idle, so a fast hand meets pictures already here;
   decoded pictures are held within a budget; and a frame writes only the
   few transforms and opacities that changed, never a style the page has to
   recalculate. Where things are is measured when the page changes, never
   while it scrolls. */
(function () {
  "use strict";
  var H = document.documentElement, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, coarse = matchMedia("(pointer: coarse)").matches;
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { x = clamp(x); return x * x * (3 - 2 * x); }
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
     stage is sized to the large viewport, so that is not a new layout */
  var lastW = innerWidth, lastH = innerHeight;
  addEventListener("resize", function () {
    var dw = Math.abs(innerWidth - lastW), dh = Math.abs(innerHeight - lastH);
    if (dw > 0 || dh > 160 || !coarse) { lastW = innerWidth; lastH = innerHeight; measure(); } else kick();
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
    if (l === "en") apply("en"); else go(l);
  })();


  /* ── frames played by the scroll: one loader ──
     Every frame goes through one queue, a few at a time, the nearest to the
     playhead first (ahead in the direction of travel). Decoded pictures are
     held within a budget of memory: a window around the playhead and a sparse
     skeleton across the film (so a jump always finds something near), the
     rest let go. A failed request waits longer each time. */
  var Loader = (function () {
    var q = [], busy = 0, LIMIT = coarse ? 3 : 4;
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
      seq.bytes(i).then(function (b) { return createImageBitmap(b); })
        .then(function (bm) { busy--; seq.got(i, bm, gen); pump(); }, function () { busy--; seq.failed(i, gen); pump(); });
    }
    return { get busy() { return busy + q.length; }, add: function (seq, i) { q.push({ seq: seq, i: i }); pump(); }, purge: function (seq) { q = q.filter(function (j) { if (j.seq === seq) { seq.dropped(j.i); return false; } return true; }); } };
  })();
  function FrameSeq(o) {
    var self = this, N = o.n, lo = o.from || 0, frames = new Array(N), state = new Uint8Array(N), fails = new Uint8Array(N), retry = new Float64Array(N);
    var set = "", held = 0, cur = lo, dir = 1, active = false, skelEvery = N, ahead = 8, behind = 3, budget = o.budget;
    var blobs = new Array(N), pending = new Array(N);
    this.gen = 0;
    this.src = function (i) { return o.src(set, i); };
    /* a frame's bytes, fetched once and kept (a JPEG of a few dozen kB):
       the picture itself is decoded again from them whenever it is needed */
    this.bytes = function (i) {
      if (blobs[i]) return Promise.resolve(blobs[i]);
      if (pending[i]) return pending[i];
      var s = set;
      return pending[i] = fetch(o.src(s, i)).then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); })
        .then(function (b) { pending[i] = null; if (s === set) blobs[i] = b; return b; }, function (e) { pending[i] = null; throw e; });
    };
    this.cached = function (i) { return !!blobs[i]; };
    function isSkel(i) { return (i - lo) % skelEvery === 0 || i === N - 1; }
    function inWin(i) { var d = (i - cur) * dir; return d >= -behind && d <= ahead; }
    this.wants = function (i) { return active && i >= lo && (inWin(i) || isSkel(i)); };
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
      self.gen++; Loader.purge(self); for (var i = 0; i < N; i++) { free(i); blobs[i] = null; pending[i] = null; }
      set = s;
      var n = N - lo, max = Math.max(6, Math.floor(budget / bytes)), sk = Math.max(2, Math.min(Math.ceil(n / 6), Math.floor(max * 0.3)));
      skelEvery = Math.ceil(n / sk); var w = max - sk; ahead = Math.max(3, Math.round(w * 0.7)); behind = Math.max(2, w - ahead);
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
      for (var d = 0; d <= ahead; d++) { var a = cur + d * dir; if (a >= lo && a < N && !state[a] && retry[a] <= now) { state[a] = 1; Loader.add(self, a); } if (d && d <= behind) { var b = cur - d * dir; if (b >= lo && b < N && !state[b] && retry[b] <= now) { state[b] = 1; Loader.add(self, b); } } }
      for (var s = lo; s < N; s += skelEvery) if (!state[s] && retry[s] <= now) { state[s] = 1; Loader.add(self, s); }
      if (!state[N - 1] && retry[N - 1] <= now) { state[N - 1] = 1; Loader.add(self, N - 1); }
    };
    /* the frame to show for the playhead, given the one on screen: never one
       behind it while the reader moves forward (or ahead of it while moving
       back); until a nearer one has arrived, the one on screen stays */
    this.pick = function (t, shown, reach) {
      if (frames[t]) return t;
      if (shown >= 0) {
        if (t > shown) { for (var k = t - 1; k > shown; k--) if (frames[k]) return k; return -1; }
        for (var m = t + 1; m < shown; m++) if (frames[m]) return m; return -1;
      }
      for (var d = 1; d < (reach || N); d++) { if (frames[t - d]) return t - d; if (frames[t + d]) return t + d; }
      return -1;
    };
    this.get = function (i) { return frames[i]; };
    this.stats = function () { var c = 0; for (var i = 0; i < N; i++) if (blobs[i]) c++; return { set: set, held: held, cached: c, skelEvery: skelEvery, ahead: ahead, behind: behind }; };
  }
  var MEM = (navigator.deviceMemory && navigator.deviceMemory <= 4) || coarse ? 72e6 : 170e6;

  /* a pinned chapter's progress, with a short time-based easing so the hand
     is followed closely and a turn back answers at once; a long jump (a
     link, Back, a flick) is taken almost at once rather than played through */
  function Pin(el, stage) {
    var g = geo(el), sh = 0, p = -1, last = 0, seen = false;
    return {
      measure: function () { sh = stage.clientHeight || innerHeight; },
      near: function (m) { return V.Y + V.VH * (1 + m) > g.top && V.Y - V.VH * m < g.top + g.h; },
      target: function () { return clamp((V.Y - g.top) / Math.max(1, g.h - sh)); },
      step: function (tau, jump) {
        var t = this.target(), dt = last ? Math.min(100, V.now - last) : 16.7; last = V.now;
        if (p < 0 || !seen || !tau) p = t;
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

  /* the bytes of the frames ahead, fetched quietly, two at a time, only
     when nothing the reader is waiting for is on the way; never on a
     connection that asks to save data */
  function Prefetch(seq, n) {
    var c = navigator.connection || {}, k = 0, live = 0, on = !(c.saveData || /2g/.test(c.effectiveType || ""));
    function next() {
      if (!on) return;
      while (live < 2 && k < n) {
        if (Loader.busy > 0) { setTimeout(next, 250); return; }
        var i = k++; if (seq.cached(i)) continue;
        live++; seq.bytes(i).then(done, done);
      }
    }
    function done() { live--; next(); }
    return { start: function () { next(); }, reset: function () { k = 0; } };
  }

  /* ── 0 · the house's film: fetched once the page has arrived, played only
     while it is on screen (the still is there from the first moment) ── */
  (function () {
    var sec = $("#top"), vid = sec && $(".hvid", sec); if (!vid || reduce) return;
    var c = navigator.connection || {}; if (c.saveData || /2g/.test(c.effectiveType || "")) return;
    var seen = true;
    function start() {
      vid.src = innerWidth / innerHeight < 1 ? vid.getAttribute("data-src-m") : vid.getAttribute("data-src");
      vid.addEventListener("playing", function () { vid.classList.add("on"); }, { once: true });
      if (seen) { var r = vid.play(); if (r && r.catch) r.catch(function () {}); }
    }
    new IntersectionObserver(function (es) { es.forEach(function (e) { seen = e.isIntersecting; if (!vid.src) return; if (seen) { var r = vid.play(); if (r && r.catch) r.catch(function () {}); } else vid.pause(); }); }).observe(sec);
    if (document.readyState === "complete") setTimeout(start, 0); else addEventListener("load", function () { setTimeout(start, 0); });
  })();

  /* ── 1 · SOUL: the story, played by the scroll ── */
  var soul = (function () {
    var sec = $("#soul"); if (!sec) return null;
    var stage = $(".stage", sec), cv = $(".scv", sec), ctx = cv.getContext("2d", { alpha: false }), poster = $(".spost", sec);
    var wpost = $(".wpost", sec), wvid = $(".wvid", sec), shade = $(".shade", sec), cap = $(".cap", sec), bar = $(".prog i", sec), beats = $$(".beat", sec);
    var N = +sec.getAttribute("data-n"), base = sec.getAttribute("data-base");
    var META = JSON.parse(sec.getAttribute("data-meta")), WORN = JSON.parse(sec.getAttribute("data-worn")), STAGES = sec.getAttribute("data-stages").split(",").map(Number);
    var pin = Pin($(".spin", sec), stage), coldAt = 0, tall = false, set = "", W = 0, Hh = 0, cw = 0, ch = 0, shown = -1, key = "", beat = -2, last = {};
    /* the story is the frames over the first 84% of the pin; then the
       pendant goes to where it is in the film of SOUL worn, the film's first
       frame comes in over it, and the film plays */
    var STORY = 0.84, MEET = 0.93, BYTES = { d: 1920 * 1080 * 4, m: 720 * 1280 * 4 };
    var seq = new FrameSeq({ n: N, budget: MEM, src: function (s, i) { return base + s + "-" + ("00" + i).slice(-3) + ".jpg"; }, onload: function () { kick(); } });
    var pre = Prefetch(seq, N), prefetching = false;
    /* only what changed is written, and only transforms and opacities */
    function op(el, n, v) { if (last[n] !== v) { last[n] = v; el.style.opacity = v; } }

    /* the film of SOUL worn, fitted as the page fits it (cover, centred):
       where the pendant is in it, on the canvas, in canvas pixels */
    function wornAt() {
      var fw = tall ? 1080 : 1920, fh = tall ? 1920 : 1080, s = Math.max(W / fw, Hh / fh), dw = fw * s, dh = fh * s, w = WORN[tall ? "m" : "d"];
      return { x: (W - dw) / 2 + w[0] * dw, y: (Hh - dh) / 2 + w[1] * dh, h: w[2] * dh };
    }
    /* where a frame is drawn: covering the stage; on a wide screen, while
       the words are beside it, the piece stands a little to the other side
       (the frames are the page's own white to their edges, so moving one
       leaves no seam); at the end, where SOUL is in the film */
    function place(k, im, p) {
      var iw = im.width, ih = im.height, sc = Math.max(W / iw, Hh / ih), m = (META[set] || [])[k] || [0.5, 0.5, 0.3];
      var side = tall ? 0 : (rtl() ? -1 : 1) * 0.12 * ease((p - 0.15) / 0.06) * (1 - ease((m[2] - 0.8) / 0.25));
      var r = { s: sc, x: (W - iw * sc) / 2 + side * W, y: (Hh - ih * sc) / 2 };
      var wk = ease((p - STORY) / (MEET - STORY));
      if (wk > 0) {
        var w = wornAt(), s2 = w.h / (m[2] * ih), x2 = w.x - m[0] * iw * s2, y2 = w.y - m[1] * ih * s2;
        r = { s: r.s + (s2 - r.s) * wk, x: r.x + (x2 - r.x) * wk, y: r.y + (y2 - r.y) * wk };
      }
      return r;
    }
    function draw(k, p) {
      var im = seq.get(k); if (!im) return;
      var r = place(k, im, p), nk = k + ":" + r.s.toFixed(4) + ":" + r.x.toFixed(1) + ":" + r.y.toFixed(1);
      if (nk === key) return; key = nk;
      /* a frame smaller than the stage (only while it is carried to the
         film) leaves the page's white around it */
      if (r.x > 0 || r.y > 0 || r.x + im.width * r.s < W || r.y + im.height * r.s < Hh) { ctx.fillStyle = "#faf9f7"; ctx.fillRect(0, 0, W, Hh); }
      ctx.drawImage(im, r.x, r.y, im.width * r.s, im.height * r.s);
      shown = k;
      if (!sec.classList.contains("live")) sec.classList.add("live");
    }
    function stages(p) {
      var n = -1; for (var i = 0; i < STAGES.length; i++) if (p >= STAGES[i]) n = i;
      if (n !== beat) { beat = n; beats.forEach(function (b, i) { b.classList.toggle("on", i === n); b.inert = i !== n; }); }
    }
    function loadWorn() {
      if (wpost.src) return;
      wpost.src = tall ? wpost.getAttribute("data-src-m") : wpost.getAttribute("data-src");
    }
    /* the film plays once the pendant has met it, and stops (back at its
       first frame, under the still) as soon as the reader turns back */
    var playing = false;
    function film(on) {
      if (on === playing) return; playing = on;
      if (on) {
        if (!wvid.src) { wvid.src = tall ? wvid.getAttribute("data-src-m") : wvid.getAttribute("data-src"); wvid.addEventListener("playing", function () { if (playing) wvid.classList.add("on"); }); }
        var r = wvid.play(); if (r && r.catch) r.catch(function () {});
        if (wvid.readyState > 2 && !wvid.paused) wvid.classList.add("on");
      } else { wvid.classList.remove("on"); wvid.pause(); try { wvid.currentTime = 0; } catch (e) {} }
    }

    var api = {
      measure: function () {
        pin.measure();
        var w0 = stage.clientWidth, h0 = stage.clientHeight, dpr = devicePixelRatio || 1;
        /* (with nothing played, the stage is the whole chapter: the screen decides) */
        tall = w0 / (reduce ? innerHeight : h0) < 1;
        var s = tall ? "m" : "d";
        if (seq.use(s, BYTES[s])) { set = s; shown = -1; key = ""; poster.src = base + s + (reduce ? "-029.jpg" : "-000.jpg"); pre.reset(); prefetching = false;
          if (wpost.src) { wpost.removeAttribute("src"); loadWorn(); } if (wvid.src) { film(false); wvid.removeAttribute("src"); wvid.load(); } }
        /* the canvas is no sharper than its frames: on a phone 1.5 pixels to
           the point at most */
        var bs = tall || coarse ? Math.min(dpr, 1.5) : Math.min(dpr, Math.max(1, 1920 / w0));
        var w = Math.round(w0 * bs), h = Math.round(h0 * bs);
        if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; key = ""; }
        W = w; Hh = h; cw = w0; ch = h0;
      },
      wake: function () { pin.leave(); key = ""; },
      frame: function () {
        if (reduce) return;
        var near = pin.near(1.2);
        seq.on(near && document.readyState === "complete");
        /* within a few screens, the frames' bytes start to come, quietly */
        if (!prefetching && pin.near(2.5) && document.readyState === "complete") { prefetching = true; pre.start(); }
        if (!near) { if (!pin.near(4)) seq.sleep(); pin.leave(); shown = -1; key = ""; film(false); return; }
        /* the hand is followed exactly on a touch screen; a mouse wheel's
           steps are smoothed a little */
        var p = pin.step(coarse ? 0 : 55, 0.2), i = Math.round(clamp(p / STORY) * (N - 1));
        seq.at(i);
        /* arriving from elsewhere (a link, Back): only a frame close to the
           place is taken at first; something further off only if nothing
           near has come within a moment */
        var cold = shown < 0;
        if (cold && !coldAt) coldAt = V.now; else if (!cold) coldAt = 0;
        var k = seq.pick(i, cold ? -1 : shown, cold && V.now - coldAt < 400 ? 7 : 0);
        if (k >= 0) draw(k, p);
        stages(p);
        op(cap, "cap", (1 - ease((p - 0.08) / 0.06)).toFixed(3));
        op(shade, "shade", (tall ? ease((p - 0.15) / 0.04) : ease((p - 0.14) / 0.05)).toFixed(3));
        if (p > 0.6) loadWorn();
        op(wpost, "wpost", ease((p - 0.875) / 0.05).toFixed(3));
        film(p >= MEET + 0.015 && pin.near(0));
        var bp = Math.round(p * 400) / 400; if (bar && last.bar !== bp) { last.bar = bp; bar.style.transform = "scaleX(" + bp + ")"; }
        return !pin.settled() || (k < 0 && cold && V.now - coldAt < 450);
      },
      get p() { return pin.p; }, get shown() { return shown; }, get playing() { return playing; }, stats: function () { return seq.stats(); }
    };
    if (reduce) { tall = innerWidth / innerHeight < 1; loadWorn(); beats.forEach(function (b) { b.classList.add("on"); }); }
    hooks.push(function () { key = ""; });
    scenes.push(api);
    return api;
  })();
  window.__soul6 = soul;

  /* ── the bar: clear over the house's film, solid after it ── */
  (function () {
    var top = $("#top"), g = top ? geo(top) : null, solid = null, moved = null;
    scenes.push({ frame: function () {
      var s = !g || V.Y > g.top + g.h - 90; if (s !== solid) { solid = s; H.classList.toggle("solid", s); }
      var m = V.Y > 30; if (m !== moved) { moved = m; H.classList.toggle("moved", m); }
    } });
  })();

  /* ── 2 · the collection: one piece in front, the others a tap away ── */
  var gal = (function () {
    var sec = $("#collection"); if (!sec) return null;
    var pieces = $$(".gpiece", sec), thumbs = $$(".gthumb", sec), filters = $$(".gfilter button", sec), prev = $(".gprev", sec), next = $(".gnext", sec), num = $(".gnum b", sec), strip = $(".gthumbs", sec);
    var cur = 0, group = "all", tIn = 0;
    function list() { return pieces.map(function (p, i) { return i; }).filter(function (i) { return group === "all" || pieces[i].getAttribute("data-group") === group; }); }
    /* the pieces either side are fetched before they are asked for */
    function warm(i) { var p = pieces[i]; if (p) $$("img", p).forEach(function (im) { if (im.loading === "lazy") im.loading = "eager"; }); }
    function show(i, quiet) {
      var L = list(), at = L.indexOf(i); if (at < 0) { i = L[0]; at = 0; }
      if (i !== cur) {
        var old = pieces[cur]; old.hidden = true; old.classList.remove("in"); var f = $(".gfig", old); f.classList.remove("turned"); $(".gturn", old).setAttribute("aria-pressed", "false");
        var nw = pieces[i]; warm(i); nw.hidden = false;
        if (!quiet && !reduce) { nw.classList.add("in"); clearTimeout(tIn); tIn = setTimeout(function () { nw.classList.remove("in"); }, 400); }
        cur = i;
      }
      thumbs.forEach(function (t, k) { if (k === i) t.setAttribute("aria-current", "true"); else t.removeAttribute("aria-current"); });
      if (num) num.textContent = ("0" + (at + 1)).slice(-2);
      $(".gnum", sec).lastChild.textContent = " / " + ("0" + L.length).slice(-2);
      prev.disabled = at <= 0; next.disabled = at >= L.length - 1;
      warm(L[at - 1]); warm(L[at + 1]);
      /* the chosen thumbnail is brought into the strip, without moving the page */
      var sr = strip.getBoundingClientRect(), tr = thumbs[i].getBoundingClientRect();
      if (tr.width) { if (tr.left < sr.left) strip.scrollLeft -= sr.left - tr.left; else if (tr.right > sr.right) strip.scrollLeft += tr.right - sr.right; }
    }
    function step(d, quiet) { var L = list(), at = L.indexOf(cur); show(L[Math.max(0, Math.min(L.length - 1, at + d))], quiet); }
    prev.addEventListener("click", function () { step(-1); });
    next.addEventListener("click", function () { step(1); });
    thumbs.forEach(function (t, k) { t.addEventListener("click", function () { show(k); }); });
    filters.forEach(function (b) { b.addEventListener("click", function () {
      group = b.getAttribute("data-f");
      filters.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      thumbs.forEach(function (t) { t.hidden = !(group === "all" || t.getAttribute("data-group") === group); });
      var L = list(); show(L.indexOf(cur) >= 0 ? cur : L[0], true);
    }); });
    /* keys answer at once, without animation (motion-taste 1) */
    sec.addEventListener("keydown", function (e) {
      var f = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!f || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (rtl()) f = -f; e.preventDefault(); step(f, true);
    });
    /* the other angle, and a sideways swipe across the picture */
    pieces.forEach(function (p) {
      var fig = $(".gfig", p), b = $(".gturn", p), x0 = null, y0 = 0;
      b.addEventListener("click", function () { var on = fig.classList.toggle("turned"); b.setAttribute("aria-pressed", on ? "true" : "false"); });
      fig.addEventListener("pointerdown", function (e) { if (e.pointerType === "mouse") return; x0 = e.clientX; y0 = e.clientY; });
      fig.addEventListener("pointerup", function (e) {
        if (x0 === null) return; var dx = e.clientX - x0, dy = e.clientY - y0; x0 = null;
        if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) step((dx < 0 ? 1 : -1) * (rtl() ? -1 : 1));
      });
      fig.addEventListener("pointercancel", function () { x0 = null; });
    });
    show(0, true);
    hooks.push(function () { show(cur, true); });
    return { show: show, get cur() { return cur; }, get id() { return pieces[cur].id.slice(2); } };
  })();
  window.__gal = gal;

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
      /* from the bar while SOUL is on the stage, SOUL */
      if (!id && b.closest(".hd") && soul && V.Y > $("#soul").offsetTop - V.VH * 0.5 && V.Y < $("#collection").offsetTop - V.VH * 0.5) id = "pave";
      var r = id && $("#bp-" + id); if (r) r.checked = true; else $("#bp-open").checked = true;
      paint();
      if (menu && !menuEl.hidden) menu.close(true);
      book.open(b);
    });
    paint();
  }

  measure();
})();
