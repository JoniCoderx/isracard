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
  window.__dd14D = D;
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
    if (passing || !e.isTrusted || window.__dd14off) return;
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
    var glare = document.createElement("i"); glare.className = "c14glare"; glare.setAttribute("aria-hidden", "true"); pic.appendChild(glare);
    var ex = 0, ey = 0, raf = 0, held = false, holdT = 0, suppress = false;
    /* the glass shows the photograph as it is drawn (object-fit: cover), never the file squeezed into the frame, and
       only over the upper picture: the name and the arrow below stay free to read and to press */
    function paint() { raf = 0; var r = c.getBoundingClientRect(), ir = img.getBoundingClientRect();
      var x = ex - r.left, y = ey - r.top - (held ? 120 : 0);
      /* only a small quiet spot around the arrow is left without the glass, so the arrow can be pressed; everywhere
         else, the pendant at the foot of SOUL included, the glass shows the piece */
      var go = c.querySelector(".c14go"), gr = go && go.getBoundingClientRect(), pad = 16;
      var off = !held && !!gr && ex > gr.left - pad && ex < gr.right + pad && ey > gr.top - pad && ey < gr.bottom + pad;
      c.classList.toggle("off", !!off);
      x = Math.max(R, Math.min(r.width - R, x)); y = Math.max(R, Math.min(r.height - R, y));
      lens.style.left = x + "px"; lens.style.top = y + "px";
      c.style.setProperty("--gx", ((ex - r.left) / r.width * 100).toFixed(1) + "%"); c.style.setProperty("--gy", ((ey - r.top) / r.height * 100).toFixed(1) + "%");
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
    sec.style.setProperty("--cp", (fp / (N - 1)).toFixed(4)); scene(fp / (N - 1));
    if (dirty || Math.round(fp) !== shown) { dirty = false; shown = Math.round(fp); draw(fp); }
    if (p !== target) kick(); else last = 0; }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  /* the scene caption follows the setting: chosen, lowered, closed, set */
  var ul = sec.querySelector(".cr14txt .tr14"), stg = sec.querySelector(".cr14stage"); if (ul && stg) stg.appendChild(ul);
  var SC = [["01", "Chosen by eye", "נבחרת בעין"], ["02", "Lowered into its seat", "יורדת אל מושבה"], ["03", "The prongs close", "השיניים נסגרות"], ["04", "Held for life", "מוחזקת לכל החיים"]];
  var scEl = sec.querySelector(".cr14scene"), scN = scEl && scEl.querySelector(".cr14sn"), scT = scEl && scEl.querySelector(".cr14st"), scI = -1, scTo = 0;
  function scene(q) { if (!scEl) return; var i = Math.min(3, Math.floor(q * 4 + .02)); if (i === scI) return; scI = i; clearTimeout(scTo); scEl.classList.add("sw");
    scTo = setTimeout(function () { var he = document.documentElement.getAttribute("data-lang") === "he"; scN.textContent = SC[i][0]; scT.textContent = he ? SC[i][2] : SC[i][1]; scEl.classList.remove("sw"); }, 180); }
  function measure() { var r = pin.getBoundingClientRect(), span = r.height - innerHeight; target = Math.max(0, Math.min(1, -r.top / Math.max(1, span)));
    if (!started && r.top < innerHeight * 2.5 && r.bottom > -innerHeight) load(); kick(); }
  addEventListener("scroll", measure, { passive: true }); addEventListener("resize", function () { size(); measure(); });
  measure();
})();

/* the builder, round 3 (the house, 4 Nov: "too much empty black", "the round macro feels pasted on", "the right panel is
   long and empty", "the views are too small and technical", "the bottom row is crowded"). On a wide screen the steps
   head the panel, and the panel carries the whole piece to its end: the choices made so far, the price and the
   reservation, so the stage and the panel are one height and nothing hangs below. The macro is no longer a bubble: it
   is what the Detail view shows, a large close-up of the chosen stone opening beside the bracelet. The same buttons
   are moved, never rebuilt, so every handler they carry keeps working. */
(function () {
  function init() {
    var conf = document.getElementById("configure"), opts = document.getElementById("opts"), stage = document.getElementById("stripwrap");
    var top = conf && conf.querySelector(".b14top"), bars = conf && conf.querySelector(".b13bars"), total = conf && conf.querySelector(".total");
    if (!conf || !opts || !stage || !top || !bars || !total) return setTimeout(init, 200);
    if (conf.classList.contains("b14v3")) return;
    conf.classList.add("b14v3");
    var he = function () { return document.documentElement.getAttribute("data-lang") === "he"; };
    /* the steps: over the stage on a phone, at the head of the panel on a wide screen */
    var head = document.createElement("div"); head.className = "b14steps"; opts.insertBefore(head, opts.firstChild);
    var wide = matchMedia("(min-width: 1000px)");
    /* (atelier) the steps head the whole builder, over the bracelet and the choices alike */
    function place() { top.appendChild(bars); }
    place(); (wide.addEventListener ? wide.addEventListener("change", place) : wide.addListener(place));
    /* the piece so far, as a short list that leads back to each step */
    opts.appendChild(total);
    var sum = document.createElement("div"); sum.className = "b14sum";
    sum.innerHTML = '<p class="b14sumk"></p><ul class="b14sumu"></ul>';
    total.insertBefore(sum, total.firstChild);
    function recap() {
      sum.querySelector(".b14sumk").textContent = he() ? "הצמיד שלכם" : "Your bracelet";
      var ul = sum.querySelector(".b14sumu"), list = bars.querySelectorAll(".b13bar"), html = "";
      [].forEach.call(list, function (b, i) { var l = b.querySelector(".b13bl"), a = b.querySelector(".b13ba");
        html += '<li><button type="button" data-i="' + i + '"><span>' + (l ? l.textContent : "") + '</span><b>' + (a ? a.textContent : "") + '</b></button></li>'; });
      if (ul.innerHTML !== html) ul.innerHTML = html;
    }
    sum.addEventListener("click", function (e) { var b = e.target.closest("button[data-i]"); if (!b) return;
      var bar = bars.querySelectorAll(".b13bar")[+b.getAttribute("data-i")]; if (bar) { bar.click(); if (!wide.matches) opts.scrollIntoView({ behavior: "smooth", block: "start" }); } });
    recap(); new MutationObserver(recap).observe(bars, { subtree: true, childList: true, characterData: true });
    addEventListener("silavu:build", recap); document.addEventListener("click", function () { setTimeout(recap, 40); });
    /* the zoom and the full screen: a pair of round buttons in the stage's corner, apart from the views */
    var tools = stage.querySelector(".b14tools"); if (tools) stage.appendChild(tools);
    /* Detail: the chosen stone, close, opening beside the bracelet */
    var NAMES = { round: ["Round brilliant", "בריליאנט עגול"], oval: ["Oval", "אובאלי"], cushion: ["Cushion", "קושן"], princess: ["Princess", "פרינסס"], emerald: ["Emerald cut", "אמרלד"], marquise: ["Marquise", "מרקיז"], pear: ["Pear", "טיפה"], baguette: ["Baguette", "בגט"] };
    var det = document.createElement("figure"); det.className = "b14det"; det.setAttribute("aria-hidden", "true");
    det.innerHTML = '<img alt="" decoding="async"><figcaption><span class="b14detk"></span><b></b></figcaption>'; stage.appendChild(det);
    function cut() { var c = opts.querySelector('.chip.on[data-k="cut"]'); return c ? c.getAttribute("data-v") : "round"; }
    function paint() { var c = cut(), im = det.querySelector("img"), s = "cuts13/" + c + "-600.webp", n = NAMES[c] || ["", ""];
      if (im.getAttribute("src") !== s) im.src = s;
      det.querySelector(".b14detk").textContent = he() ? "במבט מקרוב" : "Seen at the loupe";
      det.querySelector("b").textContent = he() ? n[1] : n[0];
      var on = !!stage.querySelector('[data-vpos="detail"].on'); det.classList.toggle("in", on); stage.classList.toggle("b14detail", on); }
    paint();
    new MutationObserver(paint).observe(stage.querySelector(".vpos") || stage, { subtree: true, attributes: true, attributeFilter: ["class"] });
    opts.addEventListener("click", function () { setTimeout(paint, 30); }); addEventListener("silavu:build", paint);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 300); }); else setTimeout(init, 300);
})();

/* Up close: a turned print turns back with a touch anywhere on it, not only on its small "Turn back" (the house, 4 Nov) */
(function () {
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("#details .w13b"); if (!b) return;
    if (e.target.closest("a")) return;
    var w = b.closest(".wlk"); if (w && w.classList.contains("flip")) { e.preventDefault(); w.classList.remove("flip"); }
  });
})();

/* Up close, round 4: the prints are laid on the table by the scroll itself. As the table comes up the screen each print
   falls from above, turning flat, one after another; scrolling back lifts them away again. The leather and the
   envelope come with them and the light crosses each print as it lands. A hint on hover says a click turns it over. */
(function () {
  var sec = document.getElementById("details"); if (!sec) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  function init() {
    var ws = [].slice.call(sec.querySelectorAll(".wlk")); if (!ws.length || !sec.classList.contains("atl13")) return setTimeout(init, 200);
    var he = function () { return document.documentElement.getAttribute("data-lang") === "he"; };
    ws.forEach(function (w) { var f = w.querySelector(".w13f"); if (f && !f.querySelector(".w14hint")) { var h = document.createElement("span"); h.className = "w14hint"; f.appendChild(h); } });
    function words() { ws.forEach(function (w) { var h = w.querySelector(".w14hint"); if (h) h.textContent = he() ? "להפוך" : "Turn over"; }); }
    words(); new MutationObserver(words).observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang"] });
    sec.classList.add("dev", "settled");
    /* a phone gets a lighter landing: each print settles onto the leather as it comes into view, in 2D only, so the
       scroll is never asked to recompute a 3D scene (it stuck on an iPhone), and a tap made while scrolling never
       turns a print over */
    var phone = matchMedia("(max-width: 760px)");
    if (phone.matches) {
      sec.classList.add("m14");
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: 0.22 });
      ws.forEach(function (w) { io.observe(w); });
      var lastScroll = 0; addEventListener("scroll", function () { lastScroll = Date.now(); }, { passive: true });
      sec.addEventListener("click", function (e) { if (Date.now() - lastScroll < 250 && e.target.closest(".wlkpic, .wlknm")) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
      [].forEach.call(sec.querySelectorAll("img"), function (im) { im.loading = "eager"; });
      if (window.__dust14) window.__dust14(sec, true);
      return;
    }
    if (window.__x14) return window.__x14(sec, ws);
    sec.classList.add("s14");
    [].forEach.call(sec.querySelectorAll("img"), function (im) { im.loading = "eager"; });
    var env = sec.querySelector(".env"), FROM = [[-80, -16, 10, -14], [-110, -20, -6, 9], [-90, -14, -12, 15]], raf = 0;
    var cl = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; }, ease = function (t) { return 1 - Math.pow(1 - t, 3); };
    function frame() {
      raf = 0; var vh = innerHeight, r = sec.getBoundingClientRect(), wide = innerWidth > 760;
      /* the section's own arrival: 0 when its top is at the bottom of the screen, 1 when the table sits in view */
      var p = cl((vh - r.top) / (vh * (wide ? 0.95 : 0.7)));
      sec.style.setProperty("--p14", cl(p * 1.6).toFixed(3));
      var last = 0;
      ws.forEach(function (w, i) {
        var k;
        if (wide) { var order = [0, 2, 1][i]; k = cl((p - 0.3 - order * 0.11) / 0.4); }
        else { var top = r.top + w.offsetTop; k = cl((vh * 0.98 - top) / (vh * 0.45)); }
        var e = ease(k), q = 1 - e, f = FROM[i];
        w.style.setProperty("--fz", (q * (wide ? 340 : 200)).toFixed(1) + "px");
        w.style.setProperty("--fy", (q * f[0]).toFixed(1) + "px");
        w.style.setProperty("--tx", (q * f[1]).toFixed(2) + "deg");
        w.style.setProperty("--ty", (q * f[2]).toFixed(2) + "deg");
        w.style.setProperty("--rd", (q * f[3]).toFixed(2) + "deg");
        w.style.opacity = cl((k - 0.08) * 2.6).toFixed(3);
        var fr = w.querySelector(".w13f"); if (fr) fr.style.setProperty("--sw", cl((k - 0.7) / 0.3).toFixed(3));
        w.classList.toggle("on", k >= 1); if (k > last) last = k;
      });
      if (env) sec.style.setProperty("--pe", cl((p - 0.5) / 0.3).toFixed(3));
    }
    addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(frame); }, { passive: true });
    addEventListener("resize", function () { if (!raf) raf = requestAnimationFrame(frame); });
    frame();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 120); }); else setTimeout(init, 120);
})();

/* the phone menu as a sheet (the house chose "C", 4 Nov): a rounded glass panel that drops from the top with the page
   still there behind it, blurred; the three collections as photographs to tap; the house's six places in two
   columns; the private viewing; a touch outside closes it. The same close and language buttons are moved in, so
   their handlers keep working; in-page links already close the menu (script1). */
(function () {
  function init() {
    var menu = document.getElementById("menu"), close = document.getElementById("menuClose");
    if (!menu || !close) return setTimeout(init, 150);
    if (menu.querySelector(".msheet")) return;
    menu.classList.add("m14c");
    var lang = menu.querySelector("#langBtn3"), cta = menu.querySelector(".mfoot .btn.solid");
    var sheet = document.createElement("div"); sheet.className = "msheet";
    var top = document.createElement("div"); top.className = "m14top";
    var mk = document.createElement("span"); mk.className = "m14mk"; mk.setAttribute("aria-hidden", "true");
    mk.innerHTML = '<svg viewBox="0 0 875 1000"><use href="#symb"/></svg><b>SILAVU</b>';
    top.appendChild(close); top.appendChild(mk); if (lang) top.appendChild(lang);
    var card = function (href, img, pos, name) { return '<a href="' + href + '"><img src="models/' + img + '-900.jpg" alt="" loading="lazy" decoding="async" style="object-position:' + pos + '"><b>' + name + '</b></a>'; };
    var cards = document.createElement("div"); cards.className = "m14cards";
    cards.innerHTML = card("pieces/knot/", "bracelet", "45% 60%", "MOMENT") + card("pieces/ring/", "ring", "55% 50%", "ICON") + card("pieces/pave/", "necklace", "50% 55%", "SOUL");
    var hd = document.createElement("p"); hd.className = "m14k"; hd.setAttribute("data-en", "The house"); hd.setAttribute("data-he", "הבית"); hd.textContent = "The house";
    var L = [["#collection", "Collection", "הקולקציה"], ["#build", "Design yours", "עצבו בעצמכם"], ["#inside", "The box", "הקופסה"], ["#details", "Up close", "מקרוב"], ["about14/", "About", "אודות"], ["#concierge", "Enquire", "פנייה"]];
    var grid = document.createElement("nav"); grid.className = "m14grid"; grid.setAttribute("aria-label", "Main");
    grid.innerHTML = L.map(function (l) { return '<a href="' + l[0] + '" data-en="' + l[1] + '" data-he="' + l[2] + '">' + l[1] + '</a>'; }).join("");
    var foot = document.createElement("div"); foot.className = "m14cta"; if (cta) foot.appendChild(cta);
    var handle = document.createElement("i"); handle.className = "m14handle"; handle.setAttribute("aria-hidden", "true");
    [top, cards, hd, grid, foot, handle].forEach(function (n) { sheet.appendChild(n); });
    menu.insertBefore(sheet, menu.firstChild);
    var he = function () { return document.documentElement.getAttribute("data-lang") === "he"; };
    function words() { [].forEach.call(sheet.querySelectorAll("[data-en]"), function (n) { if (n.closest(".btn")) return; n.textContent = he() ? n.getAttribute("data-he") : n.getAttribute("data-en"); }); }
    words(); new MutationObserver(words).observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang"] });
    /* a touch on the page around the sheet closes it */
    menu.addEventListener("click", function (e) { if (e.target === menu) close.click(); });
    /* swipe the sheet up to put it away */
    var y0 = null;
    sheet.addEventListener("touchstart", function (e) { y0 = sheet.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
    sheet.addEventListener("touchmove", function (e) { if (y0 === null) return; var d = e.touches[0].clientY - y0; if (d < -70) { y0 = null; close.click(); } }, { passive: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

/* the collections' small symbol is revealed once, as the section comes into view */
(function () {
  var s = document.querySelector(".c14sym"); if (!s) return;
  if (!("IntersectionObserver" in window)) { s.classList.add("in"); return; }
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { s.classList.add("in"); io.disconnect(); } }); }, { threshold: .6 });
  io.observe(s);
})();

/* Up close, round 5 (the house, 4 Nov: "the landing feels stuck", "the hover is not ultra smooth", "the background
   looks bad — make it live"). The leather goes; the prints lie on darkness filled with a fine dust of champagne and
   silver that drifts slowly, and around the pointer the nearest points join in hairlines like a constellation under
   a faint warm light. The landing is no longer tied to the scroll: when the table comes into view the prints fall
   onto it, one after another, in one smooth timed motion. The hover is eased every frame: the print lifts towards
   the pointer, tilts with it, straightens, and a highlight follows the pointer across it. */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.__dust14 = function (sec, phone) {
    if (sec.querySelector(".x14cv")) return;
    var cv = document.createElement("canvas"); cv.className = "x14cv"; cv.setAttribute("aria-hidden", "true"); sec.insertBefore(cv, sec.firstChild);
    var ctx = cv.getContext("2d"), W = 0, H = 0, DPR = Math.min(devicePixelRatio || 1, phone ? 1 : 1.5), P = [], on = false, raf = 0, last = 0;
    var mx = -1e4, my = -1e4, tx = -1e4, ty = -1e4, lastMove = 0, t0 = performance.now();
    function size() { var r = sec.getBoundingClientRect(); W = r.width; H = r.height; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var n = Math.round(Math.min(phone ? 80 : 260, W * H / (phone ? 5200 : 6500))); P = [];
      for (var i = 0; i < n; i++) { var z = .35 + Math.random() * .65; P.push({ x: Math.random() * W, y: Math.random() * H, z: z, vx: (Math.random() - .5) * .012 * z, vy: (-.004 - Math.random() * .01) * z, r: .55 + z * 1.45, a: .26 + z * .6, ph: Math.random() * 6.28, gold: Math.random() < .62 }); } }
    function frame(now) {
      raf = on ? requestAnimationFrame(frame) : 0;
      if (phone && now - last < 32) return; var dt = Math.min(50, now - (last || now)); last = now;
      /* the pointer, or on a phone (or a still mouse) a slow guide that wanders the table */
      if (phone || now - lastMove > 2600) { var k = (now - t0) / 1000; tx = W * (.5 + .34 * Math.sin(k * .21)); ty = H * (.5 + .26 * Math.sin(k * .33 + 1.2)); }
      mx += (tx - mx) * (phone ? .05 : .12); my += (ty - my) * (phone ? .05 : .12);
      ctx.clearRect(0, 0, W, H);
      var R = phone ? 140 : 230, R2 = R * R, near = [], ox = (mx - W / 2) * .03, oy = (my - H / 2) * .03;
      /* the warm light under the pointer */
      var g = ctx.createRadialGradient(mx, my, 0, mx, my, R * 1.6); g.addColorStop(0, "rgba(255,226,186,.1)"); g.addColorStop(1, "rgba(255,226,186,0)"); ctx.fillStyle = g; ctx.fillRect(mx - R * 1.6, my - R * 1.6, R * 3.2, R * 3.2);
      for (var i = 0; i < P.length; i++) { var p = P[i];
        p.x += p.vx * dt; p.y += p.vy * dt; if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; } if (p.x < -4) p.x = W + 4; else if (p.x > W + 4) p.x = -4;
        var px = p.x - ox * p.z, py = p.y - oy * p.z, dx = px - mx, dy = py - my, d2 = dx * dx + dy * dy, lit = d2 < R2 ? 1 - Math.sqrt(d2) / R : 0;
        /* the darkness keeps its edges: points fade toward the sides and the foot */
        var ex = Math.abs(p.x / W - .5) * 2, ey = Math.abs(p.y / H - .5) * 2, edge = Math.max(0, 1 - Math.pow(Math.max(ex * .9, ey), 3));
        var tw = .65 + .35 * Math.sin(now * .0012 * (1 + p.z) + p.ph), a = (p.a * tw + lit * .55) * edge;
        if (a < .02) continue;
        var col = p.gold ? "rgba(236,214,172," : "rgba(222,228,238,";
        if (p.z > .82 || lit > .5) { ctx.beginPath(); ctx.arc(px, py, p.r * (3.2 + lit * 2), 0, 6.283); ctx.fillStyle = col + (a * .12).toFixed(3) + ")"; ctx.fill(); }
        var rr = p.r * (1 + lit * .7);
        ctx.fillStyle = col + Math.min(1, a).toFixed(3) + ")";
        if (p.z > .55) { /* a tiny diamond: taller than wide, like a stone seen from the side */
          ctx.beginPath(); ctx.moveTo(px, py - rr * 1.7); ctx.lineTo(px + rr * 1.05, py); ctx.lineTo(px, py + rr * 1.7); ctx.lineTo(px - rr * 1.05, py); ctx.closePath(); ctx.fill();
          if (tw > .96 || lit > .7) { /* and now and then it catches the light */
            var fl = rr * (4 + lit * 4); ctx.strokeStyle = col + (Math.min(1, a) * .6).toFixed(3) + ")"; ctx.lineWidth = .6;
            ctx.beginPath(); ctx.moveTo(px - fl, py); ctx.lineTo(px + fl, py); ctx.moveTo(px, py - fl); ctx.lineTo(px, py + fl); ctx.stroke(); }
        } else { ctx.beginPath(); ctx.arc(px, py, rr, 0, 6.283); ctx.fill(); }
        if (lit > 0) near.push({ x: px, y: py }, lit);
      }
      /* the constellation: the points near the pointer joined by hairlines, and to the pointer itself */
      ctx.lineWidth = .6;
      for (var j = 0; j < near.length; j += 2) { var A = near[j], la = near[j + 1];
        for (var k2 = j + 2; k2 < near.length; k2 += 2) { var B = near[k2], lb = near[k2 + 1], ddx = A.x - B.x, ddy = A.y - B.y, dd = ddx * ddx + ddy * ddy;
          if (dd < 14000) { ctx.strokeStyle = "rgba(236,220,190," + (Math.min(la, lb) * (1 - dd / 14000) * .7).toFixed(3) + ")"; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); } }
        if (la > .4) { ctx.strokeStyle = "rgba(236,220,190," + ((la - .4) * .45).toFixed(3) + ")"; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(mx, my); ctx.stroke(); }
      }
    }
    size(); addEventListener("resize", size);
    if (!phone) sec.addEventListener("pointermove", function (e) { var r = sec.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; lastMove = performance.now(); if (mx < -1e3) { mx = tx; my = ty; } }, { passive: true });
    if (reduce) { on = false; frame(performance.now()); return; }
    new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on && !raf) { last = 0; raf = requestAnimationFrame(frame); } }, { rootMargin: "100px" }).observe(sec);
  };

  window.__x14 = function (sec, ws) {
    sec.classList.add("x14");
    window.__dust14(sec, false);
    ws.forEach(function (w) { var f = w.querySelector(".w13f"); if (f && !f.querySelector(".x14glare")) { var g = document.createElement("i"); g.className = "x14glare"; g.setAttribute("aria-hidden", "true"); f.appendChild(g); } });
    /* the landing: once, when the table is well in view */
    var zero = function () { go(); ws.forEach(function (w) { ["--lz", "--hx", "--hy", "--rd"].forEach(function (k) { w.style.setProperty(k, k === "--lz" ? "0px" : "0deg"); }); w.style.setProperty("--sc", "1"); }); };
    var land = function () { sec.classList.add("land"); setTimeout(function () { zero(); sec.classList.add("ready"); }, 1900); };
    if (reduce) { zero(); sec.classList.add("land", "ready"); }
    else { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { land(); io.disconnect(); } }, { threshold: .35 }); io.observe(sec.querySelector(".atl") || sec); }
    /* the hover, eased every frame */
    var S = ws.map(function () { return { lz: 0, hx: 0, hy: 0, st: 0, sc: 1, tlz: 0, thx: 0, thy: 0, tst: 0, tsc: 1 }; }), raf = 0;
    var vis = false, T0 = performance.now();
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) go(); }, { rootMargin: "80px" }).observe(sec);
    function tick() {
      raf = 0; var moving = vis && !reduce, t = (performance.now() - T0) / 1000;
      ws.forEach(function (w, i) { var s = S[i], e = .16;
        s.lz += (s.tlz - s.lz) * e; s.hx += (s.thx - s.hx) * e; s.hy += (s.thy - s.hy) * e; s.st += (s.tst - s.st) * e; s.sc += (s.tsc - s.sc) * e;
        if (Math.abs(s.tlz - s.lz) + Math.abs(s.thx - s.hx) + Math.abs(s.thy - s.hy) + Math.abs(s.tst - s.st) * 10 + Math.abs(s.tsc - s.sc) * 100 > .02) moving = true;
        if (s.r == null) s.r = parseFloat(getComputedStyle(w).getPropertyValue("--r")) || 0;
        /* at rest each print floats a little in its own time, as if held in the air above the table */
        var calm = 1 - s.st, fz = calm * (4 * Math.sin(t * .7 + i * 2.1)), fx = calm * (.6 * Math.sin(t * .5 + i * 1.3)), fy = calm * (.7 * Math.sin(t * .6 + i * .7 + 1));
        if (!sec.classList.contains("ready")) { fz = 0; fx = 0; fy = 0; }
        w.style.setProperty("--lz", (s.lz + fz).toFixed(2) + "px"); w.style.setProperty("--hx", (s.hx + fx).toFixed(3) + "deg"); w.style.setProperty("--hy", (s.hy + fy).toFixed(3) + "deg");
        w.style.setProperty("--rd", (-s.r * s.st + calm * .5 * Math.sin(t * .4 + i)).toFixed(3) + "deg"); w.style.setProperty("--sc", s.sc.toFixed(4)); });
      if (moving) raf = requestAnimationFrame(tick);
    }
    var go = function () { if (!raf) raf = requestAnimationFrame(tick); };
    ws.forEach(function (w, i) {
      var f = w.querySelector(".w13f");
      w.addEventListener("pointermove", function (e) { if (e.pointerType !== "mouse" || !sec.classList.contains("ready") || w.classList.contains("flip")) return;
        var b = w.getBoundingClientRect(), nx = (e.clientX - b.left) / b.width - .5, ny = (e.clientY - b.top) / b.height - .5, s = S[i];
        s.tlz = 34; s.thx = -ny * 5; s.thy = nx * 6; s.tst = 1; s.tsc = 1.035; w.classList.add("hov");
        if (f) { f.style.setProperty("--gx", ((nx + .5) * 100).toFixed(1) + "%"); f.style.setProperty("--gy", ((ny + .5) * 100).toFixed(1) + "%"); }
        go(); });
      w.addEventListener("pointerleave", function () { var s = S[i]; s.tlz = 0; s.thx = 0; s.thy = 0; s.tst = 0; s.tsc = 1; w.classList.remove("hov"); go(); });
    });
  };
})();

/* the enquiry's field errors, short and calm (the house, 4 Nov: "why is it so big — make it calm and easy"): one
   short line under the field instead of a paragraph inside it */
(function () {
  var form = document.getElementById("cform"); if (!form) return;
  var SHORT = [[/^Please write your name/, "Your name, please", "נא לכתוב שם"], [/^נא לכתוב את שמכם/, "Your name, please", "נא לכתוב שם"],
    [/^Please add a phone/, "A phone or an email, please", "טלפון או אימייל, בבקשה"], [/^נא להוסיף טלפון/, "A phone or an email, please", "טלפון או אימייל, בבקשה"],
    [/^This does not look like/, "That is not a phone or an email", "זה לא טלפון או אימייל"], [/^זה לא נראה כמו/, "That is not a phone or an email", "זה לא טלפון או אימייל"]];
  var he = function () { return document.documentElement.getAttribute("data-lang") === "he"; };
  function tidy() { [].forEach.call(form.querySelectorAll(".ferr"), function (m) { var t = m.textContent;
    SHORT.forEach(function (s) { if (s[0].test(t)) { var v = he() ? s[2] : s[1]; if (t !== v) m.textContent = v; } }); }); }
  new MutationObserver(tidy).observe(form, { subtree: true, childList: true, characterData: true });
})();

/* the symbol's life: its gold highlight drifts slowly by itself and follows the pointer when it is near; the symbol
   turns in space toward the pointer anywhere over the intro, and lifts and glows when the pointer is on it */
(function () {
  var s = document.querySelector(".c14sym"), intro = document.querySelector(".c14intro"); if (!s || !intro) return;
  var inner = s.querySelector(".c14symin"), g = s.querySelector("#c14gold"); if (!inner || !g) return;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, cur = { x: 0, y: 0, h: 0 }, tgt = { x: 0, y: 0, h: 0 }, pointer = false, vis = false, raf = 0, T0 = performance.now();
  function frame(now) {
    raf = 0; var t = (now - T0) / 1000;
    cur.x += (tgt.x - cur.x) * .09; cur.y += (tgt.y - cur.y) * .09; cur.h += (tgt.h - cur.h) * .1;
    var ix = pointer ? cur.x : Math.sin(t * .45) * .35, iy = pointer ? cur.y : Math.cos(t * .33) * .25;
    inner.style.setProperty("--tx", (-iy * 22).toFixed(2) + "deg"); inner.style.setProperty("--ty", (ix * 26).toFixed(2) + "deg");
    inner.style.setProperty("--tz", (cur.h * 22).toFixed(2) + "px"); inner.style.setProperty("--ts", (1 + cur.h * .08).toFixed(4));
    /* the highlight: a diagonal band whose place is the pointer (or a slow drift) */
    var k = .5 + ix * .6 + Math.sin(t * .8) * .06;
    g.setAttribute("x1", (k - .9).toFixed(3)); g.setAttribute("y1", (-.2 + iy * .4).toFixed(3)); g.setAttribute("x2", (k + .9).toFixed(3)); g.setAttribute("y2", (1.2 + iy * .4).toFixed(3));
    if (vis && !reduce) raf = requestAnimationFrame(frame);
  }
  var go = function () { if (!raf) raf = requestAnimationFrame(frame); };
  new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) go(); }).observe(s);
  intro.addEventListener("pointermove", function (e) { if (e.pointerType !== "mouse") return; var r = s.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    tgt.x = Math.max(-1, Math.min(1, (e.clientX - cx) / 260)); tgt.y = Math.max(-1, Math.min(1, (e.clientY - cy) / 260));
    var near = Math.hypot(e.clientX - cx, e.clientY - cy) < 110; tgt.h = near ? 1 : 0; s.classList.toggle("hot", near); pointer = true; go(); });
  intro.addEventListener("pointerleave", function () { tgt.x = 0; tgt.y = 0; tgt.h = 0; pointer = false; s.classList.remove("hot"); go(); });
  if (reduce) frame(performance.now());
})();

/* the shapes in the builder are drawn from the larger renders, so they stay sharp at their new size */
(function () {
  function up() { [].forEach.call(document.querySelectorAll('#opts .chip[data-k="cut"] .c13img'), function (im) { var s = im.getAttribute("src") || ""; if (/-240\.webp$/.test(s)) im.src = s.replace(/-240\.webp$/, "-600.webp"); }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(up, 500); }); else setTimeout(up, 500);
})();

/* the language column stands under its button with its right edge on the button's right edge */
(function () {
  function init() { var m = document.getElementById("langmenu"); if (!m) return setTimeout(init, 300);
    new MutationObserver(function () { if (!m.classList.contains("open")) return;
      var b = [].filter.call(document.querySelectorAll("#langBtn, #langBtn2, #langBtn3, .lang"), function (x) { return x.getAttribute("aria-expanded") === "true"; })[0]; if (!b) return;
      /* the capsule grows out of the button itself: its top ring sits where the button is */
      var r = b.getBoundingClientRect(), L = Math.round(r.left + r.width / 2 - m.offsetWidth / 2) + "px", T = Math.round(r.top + r.height / 2 - 22) + "px";
      if (m.style.left !== L) m.style.left = L; if (m.style.top !== T) m.style.top = T; }).observe(m, { attributes: true, attributeFilter: ["class", "style"] }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 300); }); else setTimeout(init, 300);
})();

/* the emblem as a piece of white gold (the house, 4 Nov): the SILAVU symbol itself — its own path, read from the page,
   never redrawn or mirrored — given thickness and a polished bevel, lit by a photographer's studio so the light moves
   across the metal as it turns. Drag to turn it any way; let go and it carries on with its own weight, slows, and
   settles into a slow float. Double-click (or double-tap) for a slow showcase turn. three.js is fetched only when the
   collections come near; until then, and without WebGL, the flat gold symbol stays. */
(function () {
  var host = document.querySelector(".c14sym"); if (!host || !window.WebGLRenderingContext) return;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, started = false;
  function start() {
    if (started) return; started = true;
    import("./vendor14/three.module.min.js").then(build, function () {});
  }
  new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { o.disconnect(); start(); } }, { rootMargin: "120% 0px" }).observe(host);

  function build(T) {
    var d = (document.querySelector("#symb path") || {}).getAttribute && document.querySelector("#symb path").getAttribute("d"); if (!d) return;
    /* the symbol's own path, as shapes: x as drawn, y turned up (the page draws downward), nothing else changed */
    var sp = new T.ShapePath(), tok = d.match(/[MCLZ]|-?\d*\.?\d+(?:e-?\d+)?/gi), i = 0, cmd = "", n = function () { return parseFloat(tok[i++]); };
    while (i < tok.length) {
      if (/[MCLZ]/i.test(tok[i])) cmd = tok[i++].toUpperCase();
      if (cmd === "M") { sp.moveTo(n(), -n()); cmd = "L"; }
      else if (cmd === "L") sp.lineTo(n(), -n());
      else if (cmd === "C") { var a = n(), b = -n(), c = n(), e = -n(), f = n(), g = -n(); sp.bezierCurveTo(a, b, c, e, f, g); }
      else if (cmd === "Z") { var cp = sp.currentPath; if (cp && cp.curves.length) { var s0 = cp.curves[0].getPoint(0), pe = cp.currentPoint; if (s0.distanceTo(pe) > .01) sp.lineTo(s0.x, s0.y); } }
      else i++;
    }
    var shapes = sp.toShapes(T.ShapeUtils.isClockWise(sp.subPaths[0].getPoints()));
    var geo = new T.ExtrudeGeometry(shapes, { depth: 64, bevelEnabled: true, bevelThickness: 18, bevelSize: 9, bevelOffset: -2, bevelSegments: 8, curveSegments: 40 });
    geo.center(); var S = 1 / 1000; geo.scale(S, S, S); geo.computeVertexNormals();

    var W = 0, H = 0, cv = document.createElement("canvas"); cv.className = "c14gl"; cv.setAttribute("aria-label", "The SILAVU emblem in white gold. Drag to turn it."); cv.setAttribute("role", "img");
    var r = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: "high-performance" });
    r.setPixelRatio(Math.min(2, devicePixelRatio || 1)); r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.0; r.outputColorSpace = T.SRGBColorSpace;
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(30, 1, .1, 20); cam.position.set(0, 0, 3.15);
    /* the studio the metal reflects: tall softboxes left and right, a wide one overhead, a warm card low, black between */
    var studio = new T.Scene(); studio.background = new T.Color(0x050505);
    var box = function (w, h, x, y, z, col, k) { var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(col).multiplyScalar(k), side: T.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); studio.add(m); };
    box(1.8, 4, -3.2, .4, 1.2, 0xffffff, 2.2); box(1.5, 4, 3.4, .2, .4, 0xf6f3ee, 1.6); box(5, 1.6, 0, 3.4, .8, 0xffffff, 1.6);
    box(3, .7, 0, -2.6, 1.8, 0xffe7c4, .9); box(1.2, 2.4, .6, .4, -3.4, 0xffffff, 1.6); box(.5, 3, -1.6, 0, -3.2, 0xffffff, 1.2);
    /* and a large soft one behind the viewer, graded, so a face turned to the camera reads as polished white gold, not black */
    var back = new T.Mesh(new T.PlaneGeometry(7, 4.5), new T.ShaderMaterial({ side: T.DoubleSide, vertexShader: "varying vec2 v; void main(){ v = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "varying vec2 v; void main(){ float g = smoothstep(0.0, 1.0, v.y) * 0.9 + 0.25; float e = 1.0 - smoothstep(0.25, 0.5, abs(v.x - 0.5)); gl_FragColor = vec4(vec3(g * e * 1.25), 1.0); }" }));
    back.position.set(.3, .5, 4.2); back.lookAt(0, 0, 0); studio.add(back);
    studio.background = new T.Color(0x121212);
    var pm = new T.PMREMGenerator(r); scene.environment = pm.fromScene(studio, .02).texture; pm.dispose();
    var gold = new T.MeshPhysicalMaterial({ color: 0xece8e1, metalness: 1, roughness: .27, clearcoat: .2, clearcoatRoughness: .2, envMapIntensity: 1.05 });
    var mesh = new T.Mesh(geo, gold), rig = new T.Group(); rig.add(mesh); scene.add(rig);
    /* a coin is struck on both faces: from behind, the symbol reads true, never as its mirror. The reverse is the same
       piece drawn reflected across its own height, shown only while its face is turned to the viewer (the swap happens
       edge-on, where only the metal's thickness is seen) */
    var meshB = new T.Mesh(geo, gold); meshB.scale.x = -1; meshB.visible = false; rig.add(meshB);
    var fz = new T.Vector3();
    var key = new T.DirectionalLight(0xffffff, .6); key.position.set(-2, 3, 4); scene.add(key);
    /* the orbit: a hairline of the same metal, tilted, with one bead of light travelling it */
    var ring = new T.Mesh(new T.TorusGeometry(.62, .0018, 6, 220), new T.MeshPhysicalMaterial({ color: 0xcfc6b6, metalness: 1, roughness: .4, transparent: true, opacity: .55 }));
    var bead = new T.Mesh(new T.SphereGeometry(.0075, 12, 10), new T.MeshBasicMaterial({ color: 0xf3ead8 }));
    var orbit = new T.Group(); orbit.add(ring); orbit.add(bead); orbit.rotation.set(1.28, .18, -.32); scene.add(orbit);

    host.classList.add("gl"); host.insertBefore(cv, host.firstChild);
    var hint = document.createElement("span"); hint.className = "c14hint"; hint.setAttribute("aria-hidden", "true"); host.appendChild(hint);
    var he = function () { return document.documentElement.getAttribute("data-lang") === "he"; };
    var coarse = matchMedia("(pointer: coarse)").matches;
    var words = function () { hint.textContent = he() ? (coarse ? "גררו לסובב · הקישו פעמיים" : "גררו לסובב · לחיצה כפולה") : (coarse ? "Drag to turn · double-tap" : "Drag to turn · double-click"); };
    words(); new MutationObserver(words).observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang"] });
    function size() { var b = cv.getBoundingClientRect(); if (!b.width) return; W = b.width; H = b.height; r.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); }
    size(); addEventListener("resize", size);

    /* motion: an orientation, an angular velocity that decays like a heavy thing, and a resting pose it returns to */
    var q = new T.Quaternion(), w = new T.Vector3(), rest = new T.Quaternion(), tmp = new T.Quaternion(), ax = new T.Vector3(), eu = new T.Euler();
    var drag = null, lastUp = 0, lastTap = 0, show = null, vis = false, raf = 0, t0 = performance.now(), last = 0;
    q.setFromEuler(eu.set(-.08, -.5, 0));
    function turn(dx, dy, k) { /* a drag turns the piece about the axis across the drag, in the camera's frame */
      var len = Math.hypot(dx, dy); if (!len) return; ax.set(dy, dx, 0).normalize(); tmp.setFromAxisAngle(ax, len * k); q.premultiply(tmp); }
    cv.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY, t: performance.now(), vx: 0, vy: 0 }; show = null; cv.setPointerCapture(e.pointerId); host.classList.add("held", "used"); w.set(0, 0, 0); go(); });
    cv.addEventListener("pointermove", function (e) { if (!drag) return; var now = performance.now(), dx = e.clientX - drag.x, dy = e.clientY - drag.y, dt = Math.max(8, now - drag.t);
      turn(dx, dy, .009); drag.vx = drag.vx * .7 + dx / dt * .3; drag.vy = drag.vy * .7 + dy / dt * .3; drag.x = e.clientX; drag.y = e.clientY; drag.t = now; go(); });
    var up = function () { if (!drag) return; if (performance.now() - drag.t < 120) { w.set(drag.vy, drag.vx, 0).multiplyScalar(9); if (w.length() > 9) w.setLength(9); } drag = null; lastUp = performance.now(); host.classList.remove("held"); go(); };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    var showcase = function () { show = { t: performance.now(), q0: q.clone() }; w.set(0, 0, 0); host.classList.add("used"); go(); };
    cv.addEventListener("dblclick", function (e) { e.preventDefault(); showcase(); });
    cv.addEventListener("touchend", function () { var now = performance.now(); if (now - lastTap < 320) showcase(); lastTap = now; }, { passive: true });

    var ease = function (p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
    function frame(now) {
      raf = 0; var dt = Math.min(.05, (now - (last || now)) / 1000), t = (now - t0) / 1000; last = now;
      /* the pose it floats in: turned a little, breathing, never still */
      var f = reduce ? 0 : 1;
      rest.setFromEuler(eu.set(-.05 + f * Math.sin(t * .31) * .05, -.36 + f * Math.sin(t * .19) * .26, f * Math.sin(t * .27) * .025));
      if (show) {
        var p = Math.min(1, (now - show.t) / 5200), a = ease(p) * Math.PI * 2;
        tmp.setFromAxisAngle(ax.set(0, 1, 0), a); var tq = rest.clone().multiply(tmp);
        q.copy(show.q0).slerp(tq, Math.min(1, p / .14)); if (p >= 1) show = null;
      } else if (!drag) {
        if (w.lengthSq() > 1e-6) { var wl = w.length(); tmp.setFromAxisAngle(ax.copy(w).divideScalar(wl), wl * dt); q.premultiply(tmp); w.multiplyScalar(Math.exp(-dt * 1.1)); if (wl < .03) w.set(0, 0, 0); }
        var since = (now - lastUp) / 1000, pull = since > 1.2 ? 1 - Math.exp(-dt * (w.lengthSq() > .04 ? .15 : .7)) : 0;
        if (pull) q.slerp(rest, pull);
      }
      fz.set(0, 0, 1).applyQuaternion(q); var front = fz.z >= 0; mesh.visible = front; meshB.visible = !front;
      rig.quaternion.copy(q); rig.position.y = f * Math.sin(t * .62) * .02;
      host.style.setProperty("--fl", (rig.position.y * 100).toFixed(2));
      orbit.rotation.z = -.32 + t * (reduce ? 0 : .05); bead.position.set(Math.cos(t * .5) * .62, Math.sin(t * .5) * .62, 0);
      r.render(scene, cam);
      if (vis && (!reduce || drag || show || w.lengthSq() > 1e-6)) go();
    }
    function go() { if (!raf) raf = requestAnimationFrame(frame); }
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) { size(); last = 0; go(); } }).observe(host);
    go();
  }
})();

/* the hero's arrow follows the first part of the scroll */
(function () {
  var hero = document.getElementById("hero"); if (!hero || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var raf = 0; function f() { raf = 0; var v = Math.max(0, Math.min(1, scrollY / (innerHeight * .6))); hero.style.setProperty("--hs", v.toFixed(3)); }
  addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(f); }, { passive: true }); f();
})();

/* the thank-you: a shorter line, and the reference kept on one line */
(function () {
  var p = document.getElementById("cthp"); if (!p) return; var busy = false;
  function tidy() { if (busy) return; var t = p.textContent, m = t.match(/[A-Z]-\d{3,5}-\d{3,6}/), he = document.documentElement.getAttribute("data-lang") === "he";
    var want = (he ? "הפנייה שלכם התקבלה, ונחזור אליכם באופן אישי." : "Your enquiry is with our concierge. We will be in touch personally.") + (m ? " " + (he ? "מספר הפנייה:" : "Reference") + " " : "");
    var html = want.replace(/</g, "&lt;") + (m ? '<span class="cthref" dir="ltr">' + m[0] + "</span>" : "");
    if (p.innerHTML === html) return; busy = true; p.innerHTML = html; busy = false; }
  new MutationObserver(tidy).observe(p, { childList: true, characterData: true, subtree: true });
})();

/* Instant diamond preview (the house, 4 Nov): touching a shape sets it in the bracelet at once — no window, no
   "Select". Beside the bracelet a small macro of the chosen stone shows its name; its ⓘ opens a short line about it
   in place, only for whoever wants it. Next still moves on, and every choice is kept. */
(function () {
  window.__dd14off = true;
  function init() {
    var stage = document.getElementById("stripwrap"), opts = document.getElementById("opts"), D = window.__dd14D;
    if (!stage || !opts || !D) return setTimeout(init, 200);
    if (stage.querySelector(".b14pv")) return;
    var he = function () { return document.documentElement.getAttribute("data-lang") === "he"; };
    var pv = document.createElement("div"); pv.className = "b14pv";
    pv.innerHTML = '<span class="b14pvpic"><img alt="" decoding="async"><i></i></span><span class="b14pvt"><span class="b14pvk"></span><b class="b14pvn"></b></span>' +
      '<button type="button" class="b14pvi" aria-expanded="false"><span>i</span></button><p class="b14pvd" hidden></p>';
    stage.appendChild(pv);
    var img = pv.querySelector("img"), info = pv.querySelector(".b14pvi"), desc = pv.querySelector(".b14pvd");
    function cut() { var c = opts.querySelector('.chip.on[data-k="cut"]'); return c ? c.getAttribute("data-v") : "round"; }
    var shown = "";
    function paint(flash) {
      var v = cut(), d = D[v] || D.round, h = he();
      pv.querySelector(".b14pvk").textContent = h ? "היהלום שלכם" : "Your stone";
      pv.querySelector(".b14pvn").textContent = h ? d[2] : d[0];
      desc.textContent = h ? d[3] : d[1];
      info.setAttribute("aria-label", h ? "על היהלום" : "About this stone");
      if (shown !== v) { shown = v; pv.classList.remove("swap"); void pv.offsetWidth; if (flash) pv.classList.add("swap"); img.src = "cuts13/" + v + "-600.webp"; img.alt = h ? d[2] : d[0]; }
      var step1 = !!opts.querySelector('.opt.open .chips.cuts'); pv.classList.toggle("s1", step1);
      pv.classList.toggle("off", !!stage.querySelector('[data-vpos="detail"].on'));
    }
    info.addEventListener("click", function (e) { e.stopPropagation(); var open = desc.hidden; desc.hidden = !open; info.setAttribute("aria-expanded", open ? "true" : "false"); pv.classList.toggle("open", open); });
    document.addEventListener("click", function (e) { if (pv.classList.contains("open") && !pv.contains(e.target)) { desc.hidden = true; info.setAttribute("aria-expanded", "false"); pv.classList.remove("open"); } });
    opts.addEventListener("click", function (e) { var f = !!(e.target.closest && e.target.closest('.chip[data-k="cut"]')); setTimeout(function () { paint(f); }, 20); });
    addEventListener("silavu:build", function () { paint(false); });
    new MutationObserver(function () { paint(false); }).observe(opts, { subtree: true, attributes: true, attributeFilter: ["class"] });
    new MutationObserver(function () { paint(false); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang"] });
    var vp = stage.querySelector(".vpos"); if (vp) new MutationObserver(function () { paint(false); }).observe(vp, { subtree: true, attributes: true, attributeFilter: ["class"] });
    paint(false);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 400); }); else setTimeout(init, 400);
})();

/* the footer: social circles stay hidden until an account is live; on a phone each column folds under its heading */
(function () {
  var end = document.getElementById("end"); if (!end) return;
  [].forEach.call(end.querySelectorAll(".f13soc"), function (u) { var live = [].filter.call(u.querySelectorAll("li"), function (li) { return !li.classList.contains("soon") && !li.hidden; }); if (!live.length) u.classList.add("none"); });
  var phone = matchMedia("(max-width: 899px)");
  [].forEach.call(end.querySelectorAll(".f13col"), function (col, i) {
    var k = col.querySelector(".k"); if (!k) return;
    k.setAttribute("role", "button"); k.setAttribute("tabindex", "0"); k.setAttribute("aria-expanded", "false");
    var tog = function () { if (!phone.matches) return; var o = !col.classList.contains("open"); col.classList.toggle("open", o); k.setAttribute("aria-expanded", o ? "true" : "false"); };
    k.addEventListener("click", tog); k.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tog(); } });
  });
})();

/* the builder as an atelier (the house's reference, 4 Nov): one quiet glass frame; the steps across its head; the
   bracelet large on the left with its views along the foot; the choices on the right. Next leads while there are
   steps to go; at the last step the reservation takes the lead. */
(function () {
  function init() {
    var conf = document.getElementById("configure"), stage = document.getElementById("stripwrap"), bars = conf && conf.querySelector(".b13bars");
    if (!conf || !stage || !bars || !conf.classList.contains("b14v3")) return setTimeout(init, 250);
    if (conf.classList.contains("b14atl")) return;
    conf.classList.add("b14atl");
    /* the views at the foot of the stage: 3D, Photo, Try on to the left; Front, Side, Detail, Inspect and the two
       rings to the right, in one bar */
    var foot = document.createElement("div"); foot.className = "b14foot"; stage.appendChild(foot);
    var vt = stage.querySelector(".vt"), vp = stage.querySelector(".vposwrap"), tools = stage.querySelector(".b14tools");
    var right = document.createElement("div"); right.className = "b14fr";
    /* on a phone 3D / Photo / Try on sit at the stage's top, the views along its foot; on a wide screen, one foot bar */
    var mq = matchMedia("(max-width: 999px)");
    function seat() { if (!vt) return; if (mq.matches) stage.insertBefore(vt, stage.firstChild); else foot.insertBefore(vt, right); }
    foot.appendChild(right); seat(); (mq.addEventListener ? mq.addEventListener("change", seat) : mq.addListener(seat));
    if (vp) right.appendChild(vp); if (tools) right.appendChild(tools);
    function last() { var all = bars.querySelectorAll(".b13bar"), on = bars.querySelector(".b13bar.on"); conf.classList.toggle("b14last", !!on && on === all[all.length - 1]); }
    last(); new MutationObserver(last).observe(bars, { subtree: true, attributes: true, attributeFilter: ["class"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 700); }); else setTimeout(init, 700);
})();

/* the lead button follows the steps everywhere, the phone's bottom bar included: Next for steps 1–4, Reserve at 5 */
(function () {
  function init() {
    var bar = document.getElementById("cbar"), conf = document.getElementById("configure"); if (!bar || !conf || !conf.classList.contains("b14atl")) return setTimeout(init, 400);
    if (bar.querySelector(".cbn")) return;
    var nb = document.createElement("button"); nb.type = "button"; nb.className = "btn solid cbn"; bar.appendChild(nb);
    var he = function () { return document.documentElement.getAttribute("data-lang") === "he"; };
    function paint() { var last = conf.classList.contains("b14last"); bar.classList.toggle("lastst", last); nb.textContent = he() ? "הבא" : "Next"; }
    nb.addEventListener("click", function () { var n = document.querySelector("#opts .b13next"); if (n) n.click(); });
    paint(); new MutationObserver(paint).observe(conf, { attributes: true, attributeFilter: ["class"] });
    new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 900); }); else setTimeout(init, 900);
})();

/* Bring it to light: the whole pendant and chain are always visible; a soft light passes over them and wakes the
   stones in more detail. On a computer it follows the pointer, gently; left alone it wanders the knot. On a phone it
   needs no mouse: the light travels down the knot as the page scrolls, and a touch on the pendant draws it there for
   a moment. It runs only while the section is on screen, and holds still for anyone who asks for less motion. */
(function () {
  var sec = document.querySelector("#craft14.lt14"); if (!sec) return;
  var piece = sec.querySelector(".lt14piece"); if (!piece) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var coarse = matchMedia("(pointer: coarse)").matches;
  var cx = 40, cy = 32, tx = 40, ty = 32, r = 0, rt = 0, steer = 0, raf = 0, last = 0, t0 = performance.now(), on = false, used = false;
  var box = null; function measure() { box = piece.getBoundingClientRect(); rt = box.width * (innerWidth < 900 ? .3 : .25); if (!r) r = rt; }
  function aim(e) { if (!box) measure(); tx = (e.clientX - box.left) / box.width * 100; ty = (e.clientY - box.top) / box.height * 100;
    tx = Math.max(-8, Math.min(108, tx)); ty = Math.max(-8, Math.min(108, ty)); steer = performance.now();
    if (!used) { used = true; setTimeout(function () { sec.classList.add("used"); }, 1600); } wake(); }
  if (!coarse) { sec.addEventListener("pointermove", function (e) { if (e.pointerType === "mouse" || e.pointerType === "pen") aim(e); });
    sec.addEventListener("pointerleave", function () { steer = 0; }); }
  /* a touch (or a sideways drag) draws the light to the finger; the page keeps scrolling vertically */
  sec.addEventListener("pointerdown", function (e) { if (e.pointerType === "touch") aim(e); });
  sec.addEventListener("pointermove", function (e) { if (e.pointerType === "touch") aim(e); });
  addEventListener("resize", function () { box = null; }); addEventListener("scroll", function () { box = null; }, { passive: true });
  function frame(now) { raf = 0; if (!on) return;
    var dt = Math.min(.05, (now - (last || now)) / 1000); last = now; if (!box) measure();
    var t = (now - t0) / 1000, hold = coarse ? 2600 : 2400;
    if (!steer || now - steer > hold) {
      if (coarse) { /* the scroll is the guide: from the top loop, down through the crossing, to the point */
        var sb = sec.getBoundingClientRect(), p = Math.max(0, Math.min(1, (innerHeight - sb.top) / (innerHeight + sb.height) * 1.5 - .25));
        tx = 49 + 17 * Math.sin(p * Math.PI * 2.2 - .4) + 2.5 * Math.sin(t * .6); ty = 22 + 58 * p + 2 * Math.sin(t * .5);
      } else { tx = 49 + 20 * Math.sin(t * .27); ty = 50 + 24 * Math.sin(t * .39 + 1.1); }
    }
    var k = 1 - Math.exp(-dt * (steer && now - steer <= hold ? 4.5 : 1.8)); cx += (tx - cx) * k; cy += (ty - cy) * k;
    r += (rt - r) * (1 - Math.exp(-dt * 6));
    piece.style.setProperty("--lx", cx.toFixed(2) + "%"); piece.style.setProperty("--ly", cy.toFixed(2) + "%"); piece.style.setProperty("--lr", r.toFixed(1) + "px");
    raf = requestAnimationFrame(frame); }
  function wake() { if (on && !raf) { last = 0; raf = requestAnimationFrame(frame); } }
  new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) { box = null; wake(); } }, { rootMargin: "80px 0px" }).observe(sec);
})();

/* the phone's top strip: Safari paints the bar above the page in the page's theme colour, which was a dead black over
   a bright film. While the opening film is at the top of the screen, the strip takes the colour of the film right
   under it (sampled from the playing video a few times a second, eased); once the film has scrolled away it goes
   back to black. The page itself is untouched: the body stays black. */
(function () {
  var v = document.getElementById("herovid"), meta = document.querySelector('meta[name="theme-color"]'); if (!v || !meta) return;
  var cv = document.createElement("canvas"); cv.width = 8; cv.height = 2;
  var cx = cv.getContext("2d", { willReadFrequently: true }); if (!cx) return;
  var cur = null, on = false, timer = 0, last = "";
  function put(c) { var s = "rgb(" + c.map(Math.round).join(",") + ")"; if (s === last) return; last = s; meta.setAttribute("content", s); document.documentElement.style.backgroundColor = s; }
  function atTop() { var r = v.getBoundingClientRect(); return r.top <= 2 && r.bottom > 24 && r.height > 0; }
  function leave() { on = false; clearTimeout(timer); cur = null; last = ""; meta.setAttribute("content", "#000000"); document.documentElement.style.backgroundColor = ""; }
  function sample() {
    clearTimeout(timer); if (!atTop()) return leave(); timer = setTimeout(sample, 300);
    if (v.readyState < 2 || !v.videoWidth) return;
    var r = v.getBoundingClientRect(), w = v.videoWidth, h = v.videoHeight;
    var fr = Math.min(1, (r.width / r.height) * h / w), sw = w * fr * .6, sx = (w - sw) / 2, sy = Math.min(.95, Math.max(0, -r.top / r.height)) * h;
    try { cx.drawImage(v, sx, sy, sw, h * .04, 0, 0, 8, 2); var d = cx.getImageData(0, 0, 8, 2).data, s = [0, 0, 0];
      for (var i = 0; i < d.length; i += 4) { s[0] += d[i]; s[1] += d[i + 1]; s[2] += d[i + 2]; }
      s = s.map(function (x) { return x / 16; }); if (!cur) cur = s; else for (var k = 0; k < 3; k++) cur[k] += (s[k] - cur[k]) * .55; put(cur); } catch (e) { leave(); }
  }
  function check() { var t = atTop(); if (t && !on) { on = true; sample(); } else if (!t && on) leave(); }
  addEventListener("scroll", check, { passive: true }); v.addEventListener("playing", check); check();
})();
