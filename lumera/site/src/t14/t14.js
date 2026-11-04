/* /test14/: a diamond shape, seen before it is chosen (the house's reference, screen 04). Touching a shape in the
   builder opens the stone large, with its name, a line about it and three words; "Select" puts it in the bracelet:
   the builder's own choice runs under the sheet, the sheet leaves, and the new stones are set one by one. */
(function () {
  var D = {
    round: ["Round brilliant", "The most iconic diamond cut. Maximum brilliance, every angle.", "בריליאנט עגול", "הליטוש האייקוני ביותר. מקסימום ברק, מכל זווית."],
    oval: ["Oval", "An elongated brilliant, softer than a round, longer on the wrist.", "אובל", "בריליאנט מוארך, רך יותר מהעגול וארוך יותר על פרק היד."],
    cushion: ["Cushion", "Rounded corners and a soft square: a pillow of light.", "קושן", "פינות מעוגלות וריבוע רך: כרית של אור."],
    princess: ["Princess", "Square and crisp, brilliant to the very corners.", "פרינסס", "ריבועי וחד, מבריק עד הפינות."],
    emerald: ["Emerald", "A step cut: long, clean flashes, like a hall of mirrors.", "אמרלד", "ליטוש מדרגות: הבזקים ארוכים ונקיים, כמו היכל של מראות."],
    marquise: ["Marquise", "Pointed at both ends: the longest look for its weight.", "מרקיז", "מחודד בשני קצותיו: המראה הארוך ביותר למשקלו."],
    pear: ["Pear", "A teardrop: round at one end, pointed at the other.", "טיפה", "טיפה: עגולה בקצה אחד, מחודדת בשני."],
    baguette: ["Baguette", "Slim and rectangular: quiet, architectural light.", "באגט", "צר ומלבני: אור שקט וארכיטקטוני."]
  };
  var W = { en: ["Brilliance", "Timeless", "Versatile", "Select", "Back"], he: ["ברק", "על־זמני", "רב־גוני", "בחירה", "חזרה"] };
  var ic = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>"; };
  var I = [ic('<circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.6M12 18.4V21M3 12h2.6M18.4 12H21M5.6 5.6l1.9 1.9M16.5 16.5l1.9 1.9M5.6 18.4l1.9-1.9M16.5 7.5l1.9-1.9"/>'),
           ic('<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.2 2"/>'),
           ic('<path d="M3 9l4-5h10l4 5-9 11z"/><path d="M3 9h18M9 4l3 5 3-5M12 20L9 9m3 11l3-11"/>')];
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, he = function () { return document.documentElement.getAttribute("data-lang") === "he"; };
  var sh = document.createElement("div"); sh.className = "dd14"; sh.setAttribute("role", "dialog"); sh.setAttribute("aria-modal", "true"); sh.setAttribute("aria-hidden", "true"); sh.setAttribute("aria-labelledby", "dd14n");
  sh.innerHTML = '<div class="dd14box"><button type="button" class="dd14back"></button><div class="dd14pic"><img alt="" decoding="async"></div>' +
    '<h3 class="dd14n" id="dd14n"></h3><p class="dd14p"></p><ul class="dd14w"><li>' + I[0] + '<span></span></li><li>' + I[1] + '<span></span></li><li>' + I[2] + '<span></span></li></ul>' +
    '<button type="button" class="dd14go"><span></span></button></div>';
  document.body.appendChild(sh);
  var cur = null, passing = false, lastFocus = null;
  function open(ch) {
    var v = ch.getAttribute("data-v"), d = D[v]; if (!d) return false;
    var h = he(), w = h ? W.he : W.en; cur = ch; lastFocus = document.activeElement;
    sh.querySelector("img").src = "cuts13/" + v + "-600.webp"; sh.querySelector("img").alt = h ? d[2] : d[0];
    sh.querySelector(".dd14n").textContent = h ? d[2] : d[0]; sh.querySelector(".dd14p").textContent = h ? d[3] : d[1];
    [].forEach.call(sh.querySelectorAll(".dd14w span"), function (s, i) { s.textContent = w[i]; });
    sh.querySelector(".dd14go span").textContent = w[3]; sh.querySelector(".dd14back").setAttribute("aria-label", w[4]);
    sh.setAttribute("aria-hidden", "false"); sh.classList.add("on"); document.documentElement.classList.add("dd14on");
    setTimeout(function () { sh.querySelector(".dd14go").focus({ preventScroll: true }); }, 60);
    return true;
  }
  function close() { sh.classList.remove("on"); sh.setAttribute("aria-hidden", "true"); document.documentElement.classList.remove("dd14on"); if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); }
  document.addEventListener("click", function (e) {
    if (passing || !e.isTrusted) return;
    var ch = e.target.closest && e.target.closest('#opts .chip[data-k="cut"]'); if (!ch || ch.classList.contains("on")) return;
    if (open(ch)) { e.stopImmediatePropagation(); e.preventDefault(); }
  }, true);
  sh.querySelector(".dd14back").addEventListener("click", close);
  sh.addEventListener("click", function (e) { if (e.target === sh) close(); });
  addEventListener("keydown", function (e) { if (e.key === "Escape" && sh.classList.contains("on")) close(); });
  sh.querySelector(".dd14go").addEventListener("click", function () {
    var ch = cur; if (!ch) return close();
    passing = true; ch.click(); passing = false; /* the builder's own choice, under the sheet */
    requestAnimationFrame(function () { close(); if (!reduce) setTimeout(function () { dispatchEvent(new Event("silavu:reassemble")); }, 120); });
  });
})();

/* the collections: each card opens as it arrives (a curtain lifting, the photograph settling), drifts a little with the
   scroll, and carries a round loupe that shows the piece closer under the pointer, or under a held finger on a phone */
(function () {
  var cards = [].slice.call(document.querySelectorAll(".c14card")); if (!cards.length) return;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, Z = 2.2, R = 100;
  cards.forEach(function (c, i) { c.style.setProperty("--i", i); });
  if (reduce || !("IntersectionObserver" in window)) cards.forEach(function (c) { c.classList.add("in", "live"); });
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var c = e.target; c.classList.add("in"); io.unobserve(c);
      setTimeout(function () { c.classList.add("live"); }, 1700 + (+c.style.getPropertyValue("--i") || 0) * 110); } }); }, { threshold: .18 });
    cards.forEach(function (c) { io.observe(c); });
    var tick = 0;
    function drift() { tick = 0; var vh = innerHeight; cards.forEach(function (c) { var r = c.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
      var k = ((r.top + r.height / 2) - vh / 2) / vh; c.style.setProperty("--py", (k * -26).toFixed(1) + "px"); }); }
    addEventListener("scroll", function () { if (!tick) tick = requestAnimationFrame(drift); }, { passive: true }); drift();
  }
  cards.forEach(function (c) {
    var pic = c.querySelector(".c14pic"), img = pic && pic.querySelector("img"); if (!img) return;
    var lens = document.createElement("i"); lens.className = "c14lens"; lens.setAttribute("aria-hidden", "true"); c.appendChild(lens);
    var ex = 0, ey = 0, raf = 0, held = false, holdT = 0, suppress = false;
    /* the glass shows the photograph as it is drawn (object-fit: cover), never the file squeezed into the frame, and
       only over the upper picture: the name and the arrow below stay free to read and to press */
    function paint() { raf = 0; var r = c.getBoundingClientRect(), ir = img.getBoundingClientRect();
      var x = ex - r.left, y = ey - r.top - (held ? 120 : 0);
      var off = !held && (y > r.height * 0.64 || (e2 && e2.closest && e2.closest(".c14go, .c14t")));
      c.classList.toggle("off", !!off);
      x = Math.max(R, Math.min(r.width - R, x)); y = Math.max(R, Math.min(r.height - R, y));
      lens.style.left = x + "px"; lens.style.top = y + "px";
      var src = img.currentSrc || img.src; if (lens.__s !== src) { lens.__s = src; lens.style.backgroundImage = 'url("' + src + '")'; }
      var nw = img.naturalWidth || 1, nh = img.naturalHeight || 1, k = Math.max(ir.width / nw, ir.height / nh), dw = nw * k, dh = nh * k;
      var dx = ir.left + (ir.width - dw) / 2, dy = ir.top + (ir.height - dh) / 2, px = r.left + x, py = r.top + y;
      lens.style.backgroundSize = (dw * Z).toFixed(0) + "px " + (dh * Z).toFixed(0) + "px";
      lens.style.backgroundPosition = (R - (px - dx) * Z).toFixed(1) + "px " + (R - (py - dy) * Z).toFixed(1) + "px"; }
    var e2 = null;
    c.addEventListener("pointerenter", function (e) { if (e.pointerType !== "mouse") return; ex = e.clientX; ey = e.clientY; c.classList.add("lens"); paint(); });
    c.addEventListener("pointermove", function (e) { if (e.pointerType !== "mouse") return; ex = e.clientX; ey = e.clientY; e2 = e.target; if (!raf) raf = requestAnimationFrame(paint); });
    c.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") c.classList.remove("lens"); });
    /* a phone: hold a finger on the picture for a moment and the loupe appears above it; slide to look around */
    c.addEventListener("touchstart", function (e) { var t = e.touches[0]; ex = t.clientX; ey = t.clientY; clearTimeout(holdT);
      holdT = setTimeout(function () { held = true; suppress = true; c.classList.add("lens"); paint(); }, 280); }, { passive: true });
    c.addEventListener("touchmove", function (e) { var t = e.touches[0];
      if (!held) { if (Math.abs(t.clientX - ex) > 8 || Math.abs(t.clientY - ey) > 8) clearTimeout(holdT); return; }
      e.preventDefault(); ex = t.clientX; ey = t.clientY; if (!raf) raf = requestAnimationFrame(paint); }, { passive: false });
    var end = function () { clearTimeout(holdT); if (held) { held = false; c.classList.remove("lens"); } };
    c.addEventListener("touchend", end); c.addEventListener("touchcancel", end);
    c.addEventListener("click", function (e) { if (suppress) { e.preventDefault(); suppress = false; } });
    c.addEventListener("contextmenu", function (e) { if (held) e.preventDefault(); });
  });
})();

/* the builder, laid out like the house's fix (4 Nov 2026): the five steps named above the stage, the views small inside
   it with a zoom and a full screen, a true macro of the chosen stone in a circle, and the line summed up in one row.
   Nothing is rebuilt: the same buttons are moved, so every handler they carry keeps working. */
(function () {
  function init() {
    var conf = document.getElementById("configure"), opts = document.getElementById("opts"), stage = document.getElementById("stripwrap");
    var bars = opts && opts.querySelector(".b13bars");
    if (!conf || !stage || !bars) return setTimeout(init, 150);
    if (conf.querySelector(".b14top")) return;
    conf.classList.add("b14");
    var top = document.createElement("div"); top.className = "b14top"; top.appendChild(bars); conf.insertBefore(top, conf.firstChild);
    var vp = conf.querySelector(".vposwrap");
    if (vp) {
      stage.appendChild(vp);
      var he = function () { return document.documentElement.getAttribute("data-lang") === "he"; };
      var tools = document.createElement("span"); tools.className = "b14tools";
      tools.innerHTML = '<button type="button" class="b14zoom" aria-label="Look closer"></button><button type="button" class="b14full" aria-label="Full screen"></button>';
      vp.querySelector(".vpos").appendChild(tools);
      tools.querySelector(".b14zoom").addEventListener("click", function () {
        var on = vp.querySelector('[data-vpos="detail"].on'), t = vp.querySelector(on ? '[data-vpos="front"]' : '[data-vpos="detail"]'); if (t) t.click();
      });
      tools.querySelector(".b14full").addEventListener("click", function () { var b = stage.querySelector(".stbtn"); if (b) b.click(); });
    }
    /* the macro: the chosen stone, rendered and seen close, in a circle on the stage */
    var mac = document.createElement("figure"); mac.className = "b14macro"; mac.setAttribute("aria-hidden", "true");
    mac.innerHTML = '<img alt="" decoding="async"><figcaption></figcaption>'; stage.appendChild(mac);
    var NAMES = { round: "Round", oval: "Oval", cushion: "Cushion", princess: "Princess", emerald: "Emerald", marquise: "Marquise", pear: "Pear", baguette: "Baguette" };
    function cut() { var c = opts.querySelector('.chip.on[data-k="cut"]'); return c ? c.getAttribute("data-v") : "round"; }
    function paint() { var c = cut(), im = mac.querySelector("img"), s = "cuts13/" + c + "-600.webp";
      if (im.getAttribute("src") !== s) { mac.classList.remove("in"); im.onload = function () { mac.classList.add("in"); }; im.src = s; }
      mac.querySelector("figcaption").textContent = NAMES[c] || ""; }
    paint();
    opts.addEventListener("click", function () { setTimeout(paint, 30); });
    addEventListener("silavu:build", paint);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 80); }); else setTimeout(init, 80);
})();

/* the signature writes itself when the enquiry comes into view: the line drawn by a point of light, then the dot,
   the wordmark, the line under it */
(function () {
  var sg = document.querySelector(".sg14"); if (!sg) return;
  var line = sg.querySelector(".sg14line"), glow = sg.querySelector(".sg14glowp"), tip = sg.querySelector(".sg14tip");
  var L = line.getTotalLength(), reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  [line, glow].forEach(function (p) { p.style.strokeDasharray = L; p.style.strokeDashoffset = reduce ? 0 : L; });
  if (reduce) { sg.classList.add("done"); return; }
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  function write() { var t0 = performance.now(), D = 2800;
    (function f(now) { var k = Math.min(1, (now - t0) / D), e = ease(k), off = (L * (1 - e)).toFixed(1);
      line.style.strokeDashoffset = off; glow.style.strokeDashoffset = off;
      if (k < 1) { var pt = line.getPointAtLength(L * e); tip.setAttribute("cx", pt.x.toFixed(1)); tip.setAttribute("cy", pt.y.toFixed(1)); tip.style.opacity = .95; requestAnimationFrame(f); }
      else { tip.style.opacity = 0; sg.classList.add("done"); } })(t0); }
  if (!("IntersectionObserver" in window)) return write();
  var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); setTimeout(write, 250); } }, { threshold: .4 });
  io.observe(sg);
})();

/* craftsmanship: 49 frames of the diamond being set, drawn from the scroll position (forwards and back), decoded off the
   main thread and eased so a flick of the wheel or a thumb never jumps */
(function () {
  var sec = document.getElementById("craft14"); if (!sec || !sec.classList.contains("cr14")) return;
  var pin = sec.querySelector(".cr14pin"), view = sec.querySelector(".cr14view"), cv = sec.querySelector(".cr14cv"), ctx = cv.getContext("2d");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, phone = matchMedia("(max-width: 899px)").matches;
  var N = 49, DIR = "craft14/" + (phone ? "m" : "d") + "/", frames = new Array(N), started = false, W = 0, H = 0, IW = phone ? 854 : 1280, IH = phone ? 480 : 720;
  var io0 = "IntersectionObserver" in window ? new IntersectionObserver(function (es) { if (es[0].isIntersecting) { sec.classList.add("in"); io0.disconnect(); } }, { threshold: .2 }) : null;
  if (io0) io0.observe(sec); else sec.classList.add("in");
  if (reduce) return;
  function size() { var r = view.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); W = Math.round(r.width * d); H = Math.round(r.height * d); if (cv.width !== W) cv.width = W; if (cv.height !== H) cv.height = H; dirty = true; }
  function load() { if (started) return; started = true;
    var order = [0]; for (var s = 24; s >= 1; s = Math.floor(s / 2)) for (var i = s; i < N; i += s) if (order.indexOf(i) < 0) order.push(i);
    var q = order.slice(), fl = 0;
    (function more() { while (fl < 4 && q.length) (function (i) { fl++;
      fetch(DIR + "f" + ("00" + i).slice(-3) + ".webp").then(function (r) { return r.blob(); }).then(function (b) { return createImageBitmap(b); })
        .then(function (bm) { frames[i] = bm; if (i === 0) { size(); sec.classList.add("live"); } dirty = true; kick(); }, function () {})
        .then(function () { fl--; more(); }); })(q.shift()); })(); }
  function near(i) { for (var d = 0; d < N; d++) { if (frames[i - d]) return i - d; if (frames[i + d]) return i + d; } return -1; }
  function draw(fp) { if (!W) return; var a = Math.round(fp), k = frames[a] ? a : near(a); if (k < 0) return;
    /* cover the box, as the picture does on a phone */
    var s = Math.max(W / IW, H / IH), dw = IW * s, dh = IH * s;
    ctx.clearRect(0, 0, W, H); ctx.drawImage(frames[k], (W - dw) / 2, (H - dh) / 2, dw, dh); }
  var p = -1, target = 0, raf = 0, last = 0, dirty = true, shown = -1;
  function frame(now) { raf = 0; var dt = last ? Math.min(100, now - last) : 16.7; last = now;
    var k = 1 - Math.pow(.82, dt / 16.667); p = p < 0 ? target : p + (target - p) * k; if (Math.abs(target - p) < .0005) p = target;
    var fp = Math.max(0, Math.min(1, (p - .1) / .78)) * (N - 1);
    if (dirty || Math.round(fp) !== shown) { dirty = false; shown = Math.round(fp); draw(fp); }
    if (p !== target) kick(); else last = 0; }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  function measure() { var r = pin.getBoundingClientRect(), span = r.height - innerHeight; target = Math.max(0, Math.min(1, -r.top / Math.max(1, span)));
    if (!started && r.top < innerHeight * 2.5 && r.bottom > -innerHeight) load(); kick(); }
  addEventListener("scroll", measure, { passive: true }); addEventListener("resize", function () { size(); measure(); });
  measure();
})();
