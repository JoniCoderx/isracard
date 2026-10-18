/* /test5/: what moves, and why (motion-taste 1):
   - the opening: the camera draws back from polished white gold to the whole
     pendant, once, as the page arrives (rare delight; skipped when it cannot
     be played smoothly, and the still is shown instead);
   - the story: SOUL turns, its diamonds settle, the camera goes in to the
     pavé and draws back to the piece worn, played by the scroll and only by
     the scroll (it explains the piece);
   - the collection: a piece comes forward when it is chosen (continuity).
   One loop drives everything. Where things are on the page is measured when
   the page changes (size, fonts, language), never while it scrolls; a frame
   reads the scroll position and writes only what changed. Transform, opacity
   and the frames on one canvas; nothing else moves. */
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
      fetch(seq.src(i)).then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); })
        .then(function (b) { return createImageBitmap(b); })
        .then(function (bm) { busy--; seq.got(i, bm, gen); pump(); }, function () { busy--; seq.failed(i, gen); pump(); });
    }
    return { add: function (seq, i) { q.push({ seq: seq, i: i }); pump(); }, purge: function (seq) { q = q.filter(function (j) { if (j.seq === seq) { seq.dropped(j.i); return false; } return true; }); } };
  })();
  function FrameSeq(o) {
    var self = this, N = o.n, lo = o.from || 0, frames = new Array(N), state = new Uint8Array(N), fails = new Uint8Array(N), retry = new Float64Array(N);
    var set = "", held = 0, cur = lo, dir = 1, active = false, skelEvery = N, ahead = 8, behind = 3, budget = o.budget;
    this.gen = 0;
    this.src = function (i) { return o.src(set, i); };
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
      self.gen++; Loader.purge(self); for (var i = 0; i < N; i++) free(i);
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
    this.stats = function () { return { set: set, held: held, skelEvery: skelEvery, ahead: ahead, behind: behind }; };
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

  /* ── 1 · SOUL: the opening and the story ── */
  var soul = (function () {
    var sec = $("#soul"); if (!sec) return null;
    var stage = $(".stage", sec), cv = $(".scv", sec), ctx = cv.getContext("2d"), poster = $(".spost", sec), worn = $(".sworn", sec), bar = $(".prog i", sec), beats = $$(".beat", sec), openEl = $(".open", sec);
    var N = +sec.getAttribute("data-n"), NI = +sec.getAttribute("data-intro"), base = sec.getAttribute("data-base");
    var META = JSON.parse(sec.getAttribute("data-meta")), WORN = JSON.parse(sec.getAttribute("data-worn")), STAGES = sec.getAttribute("data-stages").split(",").map(Number);
    var pin = Pin($(".spin", sec), stage), coldAt = 0, tall = false, set = "", W = 0, Hh = 0, shown = -1, key = "", beat = -2, last = {};
    /* the story is frames NI…N−1, over the first 86% of the pin; the rest
       of it is the meeting with the photograph of SOUL worn */
    var STORY = 0.86, BYTES = { d: 1920 * 1080 * 4, m: 720 * 1280 * 4 };
    var seq = new FrameSeq({ n: N, from: NI, budget: MEM, src: function (s, i) { return base + s + "-" + ("00" + i).slice(-3) + ".webp"; }, onload: function () { kick(); } });
    var intro = { state: H.classList.contains("i5") ? "wait" : "off", t0: 0, k: -1 };

    function css(n, v) { if (last[n] !== v) { last[n] = v; stage.style.setProperty(n, v); } }
    /* the photograph worn, fitted as the page fits it (cover, its own
       position): where SOUL is in it, on the stage, in canvas pixels */
    function wornAt() {
      var bh = tall ? Hh * 0.62 : Hh, s = Math.max(W / 1254, bh / 1254), dw = 1254 * s, dh = 1254 * s, x = (W - dw) / 2, y = (bh - dh) * (tall ? 0.5 : 0.7);
      return { x: x + WORN.cx * dw, y: y + WORN.cy * dh, h: WORN.h * dh };
    }
    /* where a frame is drawn: covering the stage; on a wide screen, while
       the words are beside it, the piece stands a little to the other side
       (only while it is whole in the frame, so no edge of the frame shows) */
    function place(k, im, p) {
      var iw = im.width, ih = im.height, sc = Math.max(W / iw, Hh / ih), m = (META[set] || [])[k] || [0.5, 0.5, 0.3];
      var side = tall ? 0 : (rtl() ? -1 : 1) * 0.13 * ease(p / 0.08) * (1 - ease((m[2] - 0.8) / 0.25));
      var r = { s: sc, x: (W - iw * sc) / 2 + side * W, y: (Hh - ih * sc) / 2 };
      /* the last stretch: the pendant goes to where it is in the photograph */
      var wk = ease((p - STORY) / (0.95 - STORY));
      if (wk > 0) {
        var w = wornAt(), s2 = w.h / (m[2] * ih), x2 = w.x - m[0] * iw * s2, y2 = w.y - m[1] * ih * s2;
        r = { s: r.s + (s2 - r.s) * wk, x: r.x + (x2 - r.x) * wk, y: r.y + (y2 - r.y) * wk };
      }
      return r;
    }
    function draw(k, p) {
      var im = k < NI ? intro.frames[k] : seq.get(k); if (!im) return;
      var r = place(k, im, p), nk = k + ":" + r.s.toFixed(4) + ":" + r.x.toFixed(1) + ":" + r.y.toFixed(1);
      if (nk === key) return; key = nk;
      ctx.clearRect(0, 0, W, Hh);
      ctx.drawImage(im, r.x, r.y, im.width * r.s, im.height * r.s);
      shown = k;
      if (!sec.classList.contains("live")) sec.classList.add("live");
    }
    function stages(p) {
      var n = -1; for (var i = 0; i < STAGES.length; i++) if (p >= STAGES[i]) n = i;
      if (n !== beat) { beat = n; beats.forEach(function (b, i) { b.classList.toggle("on", i === n); b.inert = i !== n; }); }
    }

    /* the opening: played once, as the page arrives, only if it can be
       played whole: its thirty frames are fetched (small files), the first
       decoded, and the rest decoded just ahead of the playhead. If that
       has not happened within a moment and a half, the still is shown */
    function startIntro() {
      if (intro.state !== "wait") return;
      var c = navigator.connection || {};
      if (reduce || c.saveData || /2g|3g/.test(c.effectiveType || "") || scrollY > 4) return endIntro(false);
      intro.frames = new Array(NI); intro.blobs = new Array(NI);
      var got = 0, s = tall ? "m" : "d", gave = setTimeout(function () { if (intro.state === "wait") endIntro(false); }, 1500);
      for (var i = 0; i < NI; i++) (function (i) {
        fetch(base + s + "-" + ("00" + i).slice(-3) + ".webp").then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (b) {
          intro.blobs[i] = b; got++;
          if (got === NI && intro.state === "wait") decodeAhead(0).then(function () { if (intro.state !== "wait") return; clearTimeout(gave); play(); });
        }).catch(function () { if (intro.state === "wait") { clearTimeout(gave); endIntro(false); } });
      })(i);
    }
    var decoding = {};
    function decodeAhead(from) {
      var ps = [];
      for (var i = from; i < Math.min(NI, from + 6); i++) if (!intro.frames[i] && !decoding[i] && intro.blobs[i]) (function (i) {
        decoding[i] = createImageBitmap(intro.blobs[i]).then(function (bm) { if (intro.state === "off") { bm.close(); return; } intro.frames[i] = bm; });
      })(i);
      for (var j = from; j < Math.min(NI, from + 3); j++) if (decoding[j]) ps.push(decoding[j]);
      return Promise.all(ps);
    }
    function play() {
      intro.state = "play"; intro.t0 = 0;
      sec.classList.add("intro", "live"); H.classList.remove("i5");
      kick();
    }
    function endIntro(played) {
      intro.state = "off"; H.classList.remove("i5"); sec.classList.remove("intro");
      if (intro.frames) {
        /* the last frame of the opening stays on the canvas until the
           story's first one is there; then all of them are let go */
        var keepLast = played && shown === NI - 1;
        intro.frames.forEach(function (bm, i) { if (bm && !(keepLast && i === NI - 1)) bm.close(); });
        intro.frames = keepLast ? intro.frames.map(function (b, i) { return i === NI - 1 ? b : null; }) : [];
        intro.blobs = null;
      }
      if (!played) shown = -1;
      kick();
    }
    var DUR = 1900;
    function introFrame() {
      if (!intro.t0) intro.t0 = V.now;
      var u = clamp((V.now - intro.t0) / DUR), want = Math.round(u * (NI - 1));
      decodeAhead(want);
      /* time-based: a frame that is late is skipped, never waited for */
      var k = want; while (k > 0 && !intro.frames[k]) k--;
      if (intro.frames[k] && k !== intro.k) { intro.k = k; key = ""; draw(k, 0); }
      var io = ease((u - 0.42) / 0.5);
      css("--io", io.toFixed(3));
      if (u >= 1 && intro.k === NI - 1) { endIntro(true); return false; }
      return true;
    }

    var api = {
      measure: function () {
        pin.measure();
        var w0 = stage.clientWidth, h0 = stage.clientHeight, dpr = devicePixelRatio || 1;
        /* (with nothing played, the stage is the whole chapter: the screen decides) */
        tall = w0 / (reduce ? innerHeight : h0) < 1;
        var s = tall ? "m" : "d";
        if (seq.use(s, BYTES[s])) { set = s; shown = -1; key = ""; poster.src = tall ? poster.getAttribute("data-tall") : base + "d-029.webp"; }
        /* the canvas is no sharper than its frames: on a phone 1.5 pixels to
           the point at most */
        var bs = tall || coarse ? Math.min(dpr, 1.5) : Math.min(dpr, Math.max(1, 2200 / w0));
        var w = Math.round(w0 * bs), h = Math.round(h0 * bs);
        if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; key = ""; }
        W = w; Hh = h;
        if (intro.state === "wait") startIntro();
      },
      wake: function () { pin.leave(); key = ""; },
      frame: function () {
        if (reduce) return;
        if (intro.state === "play") return introFrame();
        var near = pin.near(1.2);
        seq.on(near && intro.state === "off");
        if (!near) { if (!pin.near(4)) seq.sleep(); pin.leave(); shown = -1; key = ""; return; }
        if (intro.state !== "off") return;
        var p = pin.step(70, 0.2), i = NI + Math.round(clamp(p / STORY) * (N - 1 - NI));
        seq.at(i);
        /* arriving from elsewhere (a link, Back): only a frame close to the
           place is taken at first; something further off only if nothing
           near has come within a moment */
        var cold = shown < NI;
        if (cold && !coldAt) coldAt = V.now; else if (!cold) coldAt = 0;
        var k = seq.pick(i, cold ? -1 : shown, cold && V.now - coldAt < 400 ? 7 : 0);
        if (k >= 0) draw(k, p);
        else if (shown === NI - 1 && intro.frames && intro.frames[NI - 1]) draw(NI - 1, p);
        if (k >= 0 && intro.frames && intro.frames[NI - 1]) { intro.frames[NI - 1].close(); intro.frames = []; }
        stages(p);
        /* the opening's words go as soon as the reader moves; the wordmark
           behind the piece a little later, drawing nearer */
        var oo = 1 - ease(p / 0.04); css("--oo", oo.toFixed(3));
        /* gone is gone: out of reach of the pointer and the keyboard too */
        if ((oo < 0.02) !== last.gone) { last.gone = oo < 0.02; openEl.style.visibility = last.gone ? "hidden" : ""; }
        css("--wo", (1 - ease(p / 0.045)).toFixed(3));
        css("--ws", (1 + 0.06 * ease(p / 0.045)).toFixed(4));
        css("--wk", (tall ? ease((p - 0.03) / 0.04) : ease((p - 0.03) / 0.05) * (1 - 0.4 * ease((p - STORY) / 0.1))).toFixed(3));
        /* the photograph of SOUL worn takes over the stage at the end */
        var wo = ease((p - 0.9) / 0.07);
        if (wo > 0 && !worn.src) loadWorn();
        css("--won", wo.toFixed(3));
        var bp = Math.round(p * 400) / 400; if (bar && last.bar !== bp) { last.bar = bp; bar.style.transform = "scaleX(" + bp + ")"; }
        if (p > 0.55 && !worn.src) loadWorn();
        return !pin.settled() || (k < 0 && cold && V.now - coldAt < 450);
      },
      get p() { return pin.p; }, get shown() { return shown; }, get intro() { return intro.state; }, stats: function () { return seq.stats(); }
    };
    function loadWorn() { worn.sizes = "100vw"; worn.srcset = worn.getAttribute("data-srcset"); worn.src = worn.getAttribute("data-src"); }
    if (reduce) { loadWorn(); beats.forEach(function (b) { b.classList.add("on"); }); }
    hooks.push(function () { key = ""; });
    scenes.push(api);
    return api;
  })();
  window.__soul5 = soul;

  /* ── the bar: clear over the opening, solid after it; the collection is
     always in it ── */
  (function () {
    var sec = $("#soul"), g = sec ? geo(sec) : null, solid = null, moved = null;
    scenes.push({ frame: function () {
      var s = !g || V.Y > g.top + g.h - V.VH * 0.6; if (s !== solid) { solid = s; H.classList.toggle("solid", s); }
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
      if (!id && b.closest(".hd") && soul && V.Y < $("#collection").offsetTop - V.VH * 0.5) id = "pave";
      var r = id && $("#bp-" + id); if (r) r.checked = true; else $("#bp-open").checked = true;
      paint();
      if (menu && !menuEl.hidden) menu.close(true);
      book.open(b);
    });
    paint();
  }

  measure();
})();
