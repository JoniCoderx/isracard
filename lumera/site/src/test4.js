/* /test4/: "SOUL, in light" — the piece pinned in white while the scroll plays
   its film (frames from soul-frames.sh), one stage of words at a time, and
   the specs drawn onto the parts of the piece they name.
   Frames are fetched quietly once the page has loaded and decoded from their
   bytes (createImageBitmap, off the page's thread); only a window around the
   frame on screen, and every sixth frame of the strip, is held decoded, so a
   phone never holds the whole strip (motion-taste 3). */
(function () {
  "use strict";
  var sec = document.getElementById("soulfilm");
  if (!sec) return;
  var pin = sec.querySelector(".sfpin"), cv = document.getElementById("sfcv"), ctx = cv && cv.getContext("2d");
  var beats = [].slice.call(sec.querySelectorAll(".sfbeat")), call = sec.querySelector(".sfcall"), calls = [].slice.call(sec.querySelectorAll(".sfc")), bar = sec.querySelector(".sfprog i");
  if (!pin || !ctx) return;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, phone = matchMedia("(max-width:899px)").matches;
  var N = +sec.getAttribute("data-n") || 0, base = sec.getAttribute("data-base") || "f/soul/";
  /* the pendant drifts across the takes (to the middle while its diamonds
     are out); its centre in each frame (soul-cx.txt) lets the page hold it in
     one place on a wide screen, clear of the words */
  var CX = (sec.getAttribute("data-cx") || "").split(",").map(Number), CXREF = +sec.getAttribute("data-cxref") || 0.5;
  if (!N) return;
  /* where each stage begins, as a share of the chapter; the specs are shown
     while the diamonds are out of their seats */
  var STAGES = [0, 0.24, 0.42, 0.78], CALL = [0.47, 0.7];
  var conn = navigator.connection || {}, weak = (navigator.deviceMemory && navigator.deviceMemory <= 2) || !!conn.saveData;
  var px = innerWidth * Math.min(devicePixelRatio || 1, 2), SET = phone ? "m" : px >= 2400 ? "x" : "d";
  var STEP = weak ? 3 : 1, WIN = phone ? 10 : 14, SKEL = 6;
  function src(i) { return base + SET + "-" + ("00" + i).slice(-3) + ".webp"; }
  var frames = new Array(N), asked = new Array(N), cur = 0, p = -1, target = 0, drawn = -1, W = 0, H = 0, started = false, raf = 0, lastT = 0;
  function at(q) { var i = Math.max(0, Math.min(N - 1, Math.round(q * (N - 1)))); return STEP > 1 ? Math.min(N - 1, Math.round(i / STEP) * STEP) : i; }
  function free(f) { if (f && f.close) f.close(); }
  function load(i) {
    if (asked[i]) return; asked[i] = 1;
    fetch(src(i)).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (bl) { return createImageBitmap(bl); }).then(function (bm) {
      if (!asked[i]) { free(bm); return; }
      frames[i] = bm; if (i === at(cur) || drawn < 0) schedule();
    }, function () { asked[i] = 0; });
  }
  /* the window: ahead of the playhead in the direction of travel, a little
     behind, and the skeleton; everything else is let go */
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
  /* the frame fills the screen; on a wide screen it keeps the piece where it
     stands in the frame (two thirds across), not the centre */
  var fit = { sc: 1, ox: 0, oy: 0, iw: 0, ih: 0 };
  function size() {
    var r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    W = Math.round(r.width * dpr); H = Math.round(r.height * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; drawn = -1; }
  }
  function nearest(i) { for (var d = 0; d < N; d++) { if (frames[i - d]) return i - d; if (frames[i + d]) return i + d; } return -1; }
  function draw() {
    var have = nearest(at(cur)); if (have < 0 || have === drawn) return;
    var im = frames[have], iw = im.width, ih = im.height, sc = Math.max(W / iw, H / ih), dw = iw * sc, dh = ih * sc;
    var cx = phone ? 0.5 : (CX[have] || 0.67), ox = phone ? (W - dw) / 2 : W * 0.64 - cx * dw, oy = (H - dh) / 2;
    ctx.clearRect(0, 0, W, H); ctx.drawImage(im, ox, oy, dw, dh);
    /* where the frame no longer reaches the edge, its own edge is drawn out
       (the studio is plain white there) */
    if (ox > 0) ctx.drawImage(im, 0, 0, 3, ih, 0, oy, ox + 1, dh);
    if (ox + dw < W) ctx.drawImage(im, iw - 3, 0, 3, ih, ox + dw - 1, oy, W - ox - dw + 1, dh);
    fit = { sc: sc, ox: ox, oy: oy, iw: iw, ih: ih }; drawn = have;
    if (!sec.classList.contains("ready")) sec.classList.add("ready");
    place();
  }
  /* each spec sits on its part: its point is given as a share of the frame,
     and it is placed through the same fit as the frame itself */
  function place() {
    var dpr = W / Math.max(1, cv.getBoundingClientRect().width);
    calls.forEach(function (c) {
      var x = +c.getAttribute("data-x"), y = +c.getAttribute("data-y");
      /* the points were read off one frame (the diamonds furthest out); the
         pendant is held in place, so they are placed from it, not the frame */
      var sx = (W * 0.64 + (x - CXREF) * fit.iw * fit.sc) / dpr, sy = (fit.oy + y * fit.ih * fit.sc) / dpr;
      c.style.transform = "translate(" + (c.classList.contains("l") ? "calc(" + sx.toFixed(1) + "px - 100% + 3.5px)" : (sx - 3.5).toFixed(1) + "px") + "," + (sy - 8).toFixed(1) + "px)";
    });
  }
  function stage(q) {
    var k = 0; for (var i = 0; i < STAGES.length; i++) if (q >= STAGES[i]) k = i;
    beats.forEach(function (b, i) { b.classList.toggle("on", i === k); });
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
  schedule();
  window.__soul = { get p() { return p; }, get frame() { return drawn; }, get held() { return frames.filter(Boolean).length; }, N: N, set: SET };
})();
