/* /test13/: the bracelet builder as a studio, one step at a time. The five
   questions keep their own buttons (the bracelet and the price follow them
   exactly as before); this adds the way through them: five bars that show
   where you are and take you to any step, the question in words, Back and
   Next, and the line you are building written on the stage. Without this
   script the builder is what it was. */
(function () {
  function init() {
    var opts = document.getElementById("opts"), stage = document.getElementById("stripwrap");
    if (!opts || opts.querySelector(".b13nav")) return;
    var groups = [].slice.call(opts.querySelectorAll(".opt"));
    if (groups.length < 2 || !groups[0].querySelector(".opthead")) return setTimeout(init, 120);
    var he = function () { return document.documentElement.getAttribute("data-lang") === "he"; };
    var W = { step: ["Step", "שלב"], of: ["of", "מתוך"], back: ["Back", "חזרה"], next: ["Next", "הבא"], done: ["Review and reserve", "לסיכום ולשריון"] };
    var t = function (k) { return W[k][he() ? 1 : 0]; };
    var title = function (g) { var k = g.querySelector(".opthead > .k"); return k ? k.textContent.trim() : ""; };
    var short = function (g) { var k = g.querySelector(".opthead > .k"); return (k && k.getAttribute("data-short")) || title(g); };
    var SUB = { cut: ["Choose the cut for your bracelet.", "בחרו את הליטוש של הצמיד."], origin: ["The same diamond: formed in the earth, or grown in a laboratory.", "אותו יהלום: שנוצר באדמה, או שגודל במעבדה."],
      ct: ["The total weight of every diamond in the line.", "המשקל הכולל של כל היהלומים בצמיד."], wrist: ["Your wrist, measured snugly. We add the comfort.", "היקף פרק היד, נמדד צמוד. את הנוחות נוסיף אנחנו."],
      metal: ["The metal that holds every stone.", "המתכת שמחזיקה כל אבן."] };
    var sub = function (g) { var c = g.querySelector(".chip[data-k]"), k = c && c.getAttribute("data-k"); return SUB[k] ? SUB[k][he() ? 1 : 0] : ""; };
    var answer = function (g) { var on = g.querySelector(".chip.on"); return on ? on.textContent.trim() : ""; };

    var nav = document.createElement("div"); nav.className = "b13nav";
    nav.innerHTML = '<div class="b13bars" role="tablist"></div><div class="b13head"><span class="b13n k"></span><span class="b13t"></span><p class="b13sub"></p></div>';
    var bars = nav.querySelector(".b13bars");
    groups.forEach(function (g, i) {
      var b = document.createElement("button"); b.type = "button"; b.className = "b13bar"; b.setAttribute("role", "tab");
      b.innerHTML = '<i></i><b class="b13num">' + (i + 1) + '</b><span class="b13bl"></span><span class="b13ba"></span>';
      b.addEventListener("click", function () { go(i); });
      bars.appendChild(b);
    });
    opts.insertBefore(nav, opts.firstChild);
    var ft = document.createElement("div"); ft.className = "b13ft";
    ft.innerHTML = '<button type="button" class="b13back"></button><button type="button" class="b13next"><span></span><i aria-hidden="true"></i></button>';
    opts.appendChild(ft);
    var back = ft.querySelector(".b13back"), next = ft.querySelector(".b13next");

    function cur() { for (var i = 0; i < groups.length; i++) if (groups[i].classList.contains("open")) return i; return 0; }
    function go(i) {
      i = Math.max(0, Math.min(groups.length - 1, i));
      if (!groups[i].classList.contains("open")) { var h = groups[i].querySelector(".opthead"); if (h) h.click(); }
      paint();
    }
    function paint() {
      var c = cur();
      [].forEach.call(bars.children, function (b, i) {
        b.classList.toggle("on", i === c); b.classList.toggle("done", i < c);
        b.setAttribute("aria-selected", i === c ? "true" : "false");
        b.querySelector(".b13bl").textContent = short(groups[i]);
        b.querySelector(".b13ba").textContent = answer(groups[i]);
      });
      nav.querySelector(".b13n").textContent = t("step") + " " + (c + 1) + " " + t("of") + " " + groups.length;
      nav.querySelector(".b13t").textContent = title(groups[c]);
      nav.querySelector(".b13sub").textContent = sub(groups[c]);
      back.textContent = t("back"); back.disabled = c === 0;
      next.querySelector("span").textContent = c < groups.length - 1 ? t("next") + ": " + short(groups[c + 1]) : t("done");
      opts.setAttribute("data-step", String(c));
    }
    back.addEventListener("click", function () { go(cur() - 1); });
    next.addEventListener("click", function () {
      var c = cur();
      if (c < groups.length - 1) return go(c + 1);
      var tot = document.querySelector("#configure .total"), r = document.getElementById("reserve");
      if (tot) tot.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
      if (r) setTimeout(function () { r.focus({ preventScroll: true }); r.classList.add("b13ping"); setTimeout(function () { r.classList.remove("b13ping"); }, 1400); }, 500);
    });
    opts.addEventListener("click", function (e) { if (e.target.closest(".chip")) setTimeout(paint, 0); });
    addEventListener("silavu:build", paint);
    if (window.MutationObserver) new MutationObserver(function () { setTimeout(paint, 0); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang"] });

    /* the bar at the foot carries a small picture of the line, in the cut and metal chosen */
    var tot = document.querySelector("#configure .total .tot");
    if (tot && !tot.querySelector(".t13thumb")) {
      var th = document.createElement("img"); th.className = "t13thumb"; th.alt = ""; th.setAttribute("aria-hidden", "true"); th.decoding = "async";
      tot.insertBefore(th, tot.firstChild);
      var thumb = function () { var b = window.__build || {}, on = function (k, d) { var x = opts.querySelector('.chip.on[data-k="' + k + '"]'); return (x && x.getAttribute("data-v")) || b[k] || d; };
        var src = "line/" + on("cut", "round") + "-" + on("metal", "white") + "-1000.jpg"; if (th.getAttribute("src") !== src) th.src = src; };
      thumb(); opts.addEventListener("click", function (e) { if (e.target.closest(".chip")) setTimeout(thumb, 0); }); addEventListener("silavu:build", thumb);
    }
    /* the line being built, written small on the stage */
    var lsum = document.getElementById("lsum");
    if (stage && lsum) {
      var live = document.createElement("div"); live.className = "b13live"; live.setAttribute("aria-hidden", "true");
      live.innerHTML = '<span class="k"></span><b></b>';
      stage.appendChild(live);
      var copy = function () { live.querySelector("b").textContent = lsum.textContent.trim(); live.querySelector(".k").textContent = he() ? "הצמיד שלכם" : "Your line"; };
      copy(); if (window.MutationObserver) new MutationObserver(copy).observe(lsum, { childList: true, characterData: true, subtree: true });
    }
    paint();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 0); });
  else setTimeout(init, 0);
})();

/* the collection: on a computer, hovering a piece shows it worn (the page's
   own cross-fade) and a small round lens magnifies the photograph under the
   pointer, whichever photograph is showing */
(function () {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  var Z = 2.4;
  function init() {
    [].forEach.call(document.querySelectorAll(".pgrid .piece:not(.soon) .fig.swp"), function (f) {
      if (f.querySelector(".lp13")) return;
      var lens = document.createElement("i"); lens.className = "lp13"; lens.setAttribute("aria-hidden", "true"); f.appendChild(lens);
      var raf = 0, ex = 0, ey = 0;
      function shown() {
        var w = f.querySelector(".im.hx.hvr.hvon img"); if (w && w.currentSrc) return w;
        var all = f.querySelectorAll(".im img"), r = f.getBoundingClientRect(), best = null;
        for (var i = 0; i < all.length; i++) { var b = all[i].getBoundingClientRect(); if (Math.abs(b.left - r.left) < r.width / 2 && getComputedStyle(all[i].parentNode).opacity !== "0") { best = all[i]; break; } }
        return best || all[0];
      }
      function paint() {
        raf = 0; var img = shown(); if (!img) return;
        var r = f.getBoundingClientRect(), ir = img.getBoundingClientRect(), x = ex - r.left, y = ey - r.top;
        lens.style.transform = ""; lens.style.left = x + "px"; lens.style.top = y + "px";
        var src = img.currentSrc || img.src; if (lens.__src !== src) { lens.__src = src; lens.style.backgroundImage = "url(\"" + src + "\")"; }
        lens.style.backgroundSize = (ir.width * Z).toFixed(0) + "px " + (ir.height * Z).toFixed(0) + "px";
        lens.style.backgroundPosition = (75 - (ex - ir.left) * Z).toFixed(1) + "px " + (75 - (ey - ir.top) * Z).toFixed(1) + "px";
      }
      f.addEventListener("pointerenter", function (e) { if (e.pointerType !== "mouse") return; ex = e.clientX; ey = e.clientY; f.classList.add("lp13on"); paint(); });
      f.addEventListener("pointermove", function (e) { if (e.pointerType !== "mouse") return; ex = e.clientX; ey = e.clientY; if (!raf) raf = requestAnimationFrame(paint); });
      f.addEventListener("pointerleave", function () { f.classList.remove("lp13on"); });
      /* the worn photograph arrives a moment after the pointer: follow it */
      f.addEventListener("transitionend", function () { if (f.classList.contains("lp13on") && !raf) raf = requestAnimationFrame(paint); });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

/* the kind of each piece, written small on its photograph */
(function () {
  function init() {
    [].forEach.call(document.querySelectorAll(".pgrid .piece:not(.soon)"), function (pc) {
      var kd = pc.querySelector(".bd .t .kd"), fig = pc.querySelector(".fig");
      if (!kd || !fig || fig.querySelector(".k13")) return;
      var tag = document.createElement("span"); tag.className = "k13"; tag.setAttribute("aria-hidden", "true");
      var paint = function () { tag.textContent = kd.textContent.trim(); };
      paint(); fig.appendChild(tag);
      if (window.MutationObserver) new MutationObserver(paint).observe(kd, { childList: true, characterData: true, subtree: true });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

/* Up close: three prints on the table. They develop as they arrive, and a
   tap turns one over to what it shows and the way to the piece. */
(function () {
  function init() {
    var sec = document.getElementById("details"); if (!sec) return;
    var he = function () { return document.documentElement.getAttribute("data-lang") === "he"; };
    [].forEach.call(sec.querySelectorAll(".wlk"), function (w) {
      if (w.querySelector(".w13")) return;
      var pic = w.querySelector(".wlkpic"), cap = w.querySelector("figcaption"), nm = w.querySelector(".wlknm"), kd = cap && cap.querySelector(".k");
      if (!pic || !cap || !nm) return;
      var href = pic.getAttribute("href"), alt = (pic.querySelector("img") || {}).alt || "";
      var inner = document.createElement("div"); inner.className = "w13";
      var front = document.createElement("div"); front.className = "w13f";
      front.appendChild(pic); front.appendChild(cap);
      var back = document.createElement("div"); back.className = "w13b";
      back.innerHTML = '<button type="button" class="w13back"></button><span class="k"></span><b></b><p></p><a></a>';
      back.querySelector("a").href = href;
      inner.appendChild(front); inner.appendChild(back); w.appendChild(inner);
      var paint = function () {
        back.querySelector(".k").textContent = kd ? kd.textContent.trim() : "";
        back.querySelector("b").textContent = nm.textContent.trim();
        back.querySelector("p").textContent = alt;
        back.querySelector("a").textContent = he() ? "לצפייה בתכשיט" : "View the piece";
        back.querySelector(".w13back").textContent = he() ? "חזרה" : "Turn back";
      };
      paint();
      if (window.MutationObserver) new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang"] });
      /* the photograph no longer leaves the page: it turns the print over */
      pic.addEventListener("click", function (e) { e.preventDefault(); w.classList.add("flip"); });
      nm.addEventListener("click", function (e) { e.preventDefault(); w.classList.add("flip"); });
      back.querySelector(".w13back").addEventListener("click", function (e) { e.stopPropagation(); w.classList.remove("flip"); });
      w.setAttribute("tabindex", "-1");
    });
    /* the table: the prints on dark leather, an envelope beneath, a warm side light over all */
    var row = sec.querySelector(".wlkrow");
    if (row && !sec.querySelector(".atl")) {
      var atl = document.createElement("div"); atl.className = "atl";
      row.parentNode.insertBefore(atl, row); atl.appendChild(row);
      var env = document.createElement("div"); env.className = "env"; env.setAttribute("aria-hidden", "true"); env.innerHTML = "<b>SILAVU</b>";
      atl.insertBefore(env, row);
      var lt = document.createElement("i"); lt.className = "atlight"; lt.setAttribute("aria-hidden", "true"); atl.appendChild(lt);
      sec.classList.add("atl13");
    }
    var settle = function () { sec.classList.add("dev"); setTimeout(function () { sec.classList.add("settled"); }, 1900); };
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) { settle(); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { settle(); io.disconnect(); } }); }, { threshold: 0.25 });
    io.observe(sec.querySelector(".wlkrow") || sec);
    setTimeout(function () { var r = sec.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0 && !sec.classList.contains("dev")) settle(); }, 3000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

/* no logo screen on the way in: if the browser would not remember that the
   page has been seen, enter it at once anyway */
(function () {
  function go() { var i = document.getElementById("intro"), b = document.getElementById("enterBtn"); if (i && b && !i.classList.contains("gone") && !i.classList.contains("off")) b.click(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(go, 0); }); else setTimeout(go, 0);
})();

/* the signature in the bracelet (#sig13). The bracelet is a modelled line
   rendered as 48 frames (website/tools/line-blender.py): it leans back, turns
   and drops away from the camera. The scroll is the playhead, forwards and
   back; the frame under the playhead is drawn with the next one laid over it
   by how far between them it is, so the motion is continuous. The name
   writes itself inside the bracelet when the stage arrives and leaves as soon
   as the bracelet starts to move; at the end the bracelet falls out of the
   bottom of the screen while the collection's ivory rises behind it, so no
   screen is ever empty. Frames are decoded off the main thread. */
(function () {
  var sec = document.getElementById("sig13"); if (!sec) return;
  var pin = sec.querySelector(".s13pin"), view = sec.querySelector(".s13view"), cv = sec.querySelector(".s13cv"), first = sec.querySelector(".s13first");
  var sig = sec.querySelector(".s13sig"), line = sec.querySelector(".s13line"), tip = sec.querySelector(".s13tip");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, phone = matchMedia("(max-width: 760px)").matches;
  var N = 48, DIR = "line13/" + (phone ? "m" : "d") + "/", frames = new Array(N), loaded = 0, started = false, ctx = cv.getContext("2d");
  var L = line.getTotalLength(); line.style.strokeDasharray = L; line.style.strokeDashoffset = reduce ? 0 : L;
  if (reduce) { sec.classList.add("in", "signed"); return; }
  var c01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  function load() {
    if (started) return; started = true;
    var order = [0]; for (var s = 24; s >= 1; s = Math.floor(s / 2)) for (var i = s; i < N; i += s) if (order.indexOf(i) < 0) order.push(i);
    for (var k = 0; k < N; k++) if (order.indexOf(k) < 0) order.push(k);
    var inflight = 0, q = order.slice();
    (function more() {
      while (inflight < 4 && q.length) { (function (i) { inflight++;
        fetch(DIR + "f" + ("00" + i).slice(-3) + ".webp").then(function (r) { return r.blob(); }).then(function (b) { return createImageBitmap(b); })
          .then(function (bm) { frames[i] = bm; loaded++; if (i === 0) { size(); fit(); sec.classList.add("live"); } dirty = true; kick(); }, function () {})
          .then(function () { inflight--; more(); }); })(q.shift()); }
    })();
  }
  var W = 0, H = 0, dpr = 1;
  function size() { var r = view.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1); W = Math.round(r.width * dpr); H = Math.round(r.height * dpr); if (cv.width !== W) cv.width = W; if (cv.height !== H) cv.height = H; dirty = true; }
  function near(i) { for (var d = 0; d < N; d++) { if (frames[i - d]) return i - d; if (frames[i + d]) return i + d; } return -1; }
  var drawn = -1, dirty = true;
  function draw(fp) {
    if (!W) return;
    var a = Math.floor(fp), b = Math.min(N - 1, a + 1), f = fp - a;
    var ia = frames[a] ? a : near(a); if (ia < 0) return;
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = 1; ctx.drawImage(frames[ia], 0, 0, W, H);
    if (frames[b] && b !== ia && f > 0.01 && frames[a]) { ctx.globalAlpha = f; ctx.drawImage(frames[b], 0, 0, W, H); ctx.globalAlpha = 1; }
  }
  /* the name: written once when the stage arrives, then the scroll takes it away */
  var drawnSig = 0, writing = false, t0 = 0;
  function setDraw(d) { drawnSig = d; line.style.strokeDashoffset = (L * (1 - d)).toFixed(1);
    if (d > 0 && d < 1) { var pt = line.getPointAtLength(L * d); tip.setAttribute("cx", pt.x.toFixed(1)); tip.setAttribute("cy", pt.y.toFixed(1)); tip.style.opacity = .9; } else tip.style.opacity = 0;
    if (d >= .999) sec.classList.add("signed"); }
  var p = -1, target = 0, raf = 0, last = 0, lastKey = "", exitPx = 700;
  /* how far the view must drop for the bracelet (its last frame fills from 27% of the view's height down) to clear the screen */
  /* measured from the stage's own layout (the view sits centred in it), so it is right wherever the page is scrolled */
  var stg = sec.querySelector(".s13stage");
  function fit() { var sh = stg.clientHeight || innerHeight, vh = view.offsetHeight, top = (sh - vh) / 2; exitPx = Math.max(200, sh - (top + vh * .27) + 24); }
  function place() {
    /* 0 to .08: still, signed. .08 to .94: the 48 frames, the bracelet leaning back, turning and going away.
       All along it sinks a little; from .74 it falls, gathering speed like a dropped thing, and is gone below the
       screen by .98, as the ivory of the collection comes up behind it. Nothing else moves; no empty screen. */
    var fp = c01((p - .08) / .86) * (N - 1);
    var q = c01((p - .08) / .9), fall = .1 * Math.pow(q, 1.6) + .9 * Math.pow(c01((q - .74) / .26), 2);
    var ty = fall * exitPx;
    var key = fp.toFixed(3) + "|" + ty.toFixed(1);
    if (key !== lastKey || dirty) { lastKey = key; dirty = false; draw(fp);
      view.dataset.ty = ty.toFixed(1); view.style.transform = ty > .05 ? "translate3d(0," + ty.toFixed(1) + "px,0)" : ""; }
    /* the name leaves as the bracelet starts to move: it thins, lifts a little and fades */
    var g = c01((p - .06) / .14);
    sig.style.opacity = (1 - g).toFixed(3);
    sig.style.transform = g > 0 ? "translate3d(0," + (-g * 14).toFixed(1) + "px,0) scale(" + (1 - g * .04).toFixed(3) + ")" : "";
    sig.style.filter = g > 0 && g < 1 ? "blur(" + (g * 3).toFixed(2) + "px)" : "";
    var byScroll = c01(p / .06); if (byScroll > drawnSig && byScroll < 1) setDraw(byScroll);
  }
  function frame(now) {
    raf = 0; var dt = last ? Math.min(100, now - last) : 16.7; last = now;
    if (writing) { var d = ease(c01((now - t0) / 2400)); if (d > drawnSig) setDraw(d); if (d >= 1) writing = false; }
    var k = 1 - Math.pow(.84, dt / 16.667);
    p = p < 0 ? target : p + (target - p) * k; if (Math.abs(target - p) < .0004) p = target;
    place();
    if (writing || p !== target) kick(); else last = 0;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  function measure() {
    var r = pin.getBoundingClientRect(), span = r.height - innerHeight;
    target = c01(-r.top / Math.max(1, span));
    /* while the stage holds the screen, the chapter marker stays out of its way */
    document.documentElement.classList.toggle("s13on", r.top < innerHeight * .5 && r.bottom > innerHeight * .3);
    if (!started && r.top < innerHeight * 2.5 && r.bottom > -innerHeight) load();
    if (r.top < innerHeight * .55 && r.bottom > 0 && !sec.classList.contains("in")) {
      sec.classList.add("in"); setTimeout(function () { if (drawnSig < 1) { writing = true; t0 = performance.now(); kick(); } }, 600);
    }
    kick();
  }
  fit();
  addEventListener("scroll", measure, { passive: true }); addEventListener("resize", function () { size(); fit(); dirty = true; measure(); });
  measure();
})();

/* the builder's stones, seen as they are: every shape tile carries a rendered
   stone (website/tools/line-blender.py), the panel shows the chosen (or the
   pointed-at) stone large with a line about it, and choosing a shape shows
   that stone close on the stage before the bracelet sets the new stones */
(function () {
  function init() {
    var opts = document.getElementById("opts"), stage = document.getElementById("stripwrap");
    if (!opts || !stage || !opts.querySelector(".b13nav")) return setTimeout(init, 150);
    if (opts.querySelector(".b13pre")) return;
    var he = function () { return document.documentElement.getAttribute("data-lang") === "he"; };
    var D = {
      round: ["Round brilliant", "The most fire of any cut: the classic line.", "בריליאנט עגול", "הכי הרבה ברק מכל ליטוש: הקו הקלאסי."],
      oval: ["Oval", "An elongated brilliant, softer than a round.", "אובל", "בריליאנט מוארך, רך יותר מהעגול."],
      cushion: ["Cushion", "Rounded corners, a pillow of light.", "קושן", "פינות מעוגלות, כרית של אור."],
      princess: ["Princess", "Square and crisp, brilliant to the corners.", "פרינסס", "ריבועי וחד, מבריק עד הפינות."],
      emerald: ["Emerald", "A step cut: long clean flashes, a hall of mirrors.", "אמרלד", "ליטוש מדרגות: הבזקים ארוכים ונקיים, היכל של מראות."],
      marquise: ["Marquise", "Pointed at both ends: the longest look.", "מרקיז", "מחודד בשני קצותיו: המראה הארוך ביותר."],
      pear: ["Pear", "A teardrop: round at one end, pointed at the other.", "טיפה", "טיפה: עגולה בקצה אחד, מחודדת בשני."],
      baguette: ["Baguette", "Slim and rectangular: quiet, architectural light.", "באגט", "צר ומלבני: אור שקט וארכיטקטוני."]
    };
    var src = function (c, w) { return "cuts13/" + c + "-" + w + ".webp"; };
    /* the tiles */
    [].forEach.call(opts.querySelectorAll('.chip[data-k="cut"]'), function (ch) {
      var v = ch.getAttribute("data-v"); if (!D[v] || ch.querySelector(".c13img")) return;
      var im = document.createElement("img"); im.className = "c13img"; im.alt = ""; im.setAttribute("aria-hidden", "true"); im.decoding = "async"; im.src = src(v, 240);
      var svg = ch.querySelector("svg"); if (svg) svg.replaceWith(im); else ch.insertBefore(im, ch.firstChild);
    });
    /* the preview in the panel */
    var pre = document.createElement("div"); pre.className = "b13pre";
    pre.innerHTML = '<span class="b13pic"><img alt="" decoding="async"></span><span class="b13cap"><b></b><span></span></span>';
    var head = opts.querySelector(".b13head"); head.parentNode.insertBefore(pre, head.nextSibling);
    var pimg = pre.querySelector("img");
    var cur = function () { var on = opts.querySelector('.chip.on[data-k="cut"]'); return on ? on.getAttribute("data-v") : "round"; };
    function show(c) { var d = D[c] || D.round, h = he(); var s = src(c, 600); if (pimg.getAttribute("src") !== s) { pre.classList.remove("in"); pimg.src = s; pimg.onload = function () { pre.classList.add("in"); }; }
      pre.querySelector("b").textContent = h ? d[2] : d[0]; pre.querySelector(".b13cap > span").textContent = h ? d[3] : d[1]; pimg.alt = h ? d[2] : d[0]; }
    show(cur()); pre.classList.add("in");
    opts.addEventListener("pointerover", function (e) { var ch = e.target.closest && e.target.closest('.chip[data-k="cut"]'); if (ch && e.pointerType === "mouse") show(ch.getAttribute("data-v")); });
    opts.addEventListener("pointerout", function (e) { var ch = e.target.closest && e.target.closest('.chip[data-k="cut"]'); if (ch && !ch.contains(e.relatedTarget)) show(cur()); });
    /* the close-up on the stage, then the stones are set */
    var cz = document.createElement("div"); cz.className = "cz13"; cz.setAttribute("aria-hidden", "true");
    cz.innerHTML = '<img alt="" decoding="async"><b></b>'; stage.appendChild(cz);
    var czt = 0, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* order of the moment: the chosen stone comes up close over the stage first; under it the bracelet is rebuilt
       with the new cut (the engine's click is held until the close-up covers the stage); then the close-up
       shrinks back into the bracelet and the new stones are set one by one */
    var passing = false;
    opts.addEventListener("click", function (e) {
      var ch = e.target.closest && e.target.closest('.chip[data-k="cut"]'); if (!ch || passing) return;
      var v = ch.getAttribute("data-v"); show(v);
      if (reduce || !D[v] || !e.isTrusted || ch.classList.contains("on")) return;
      e.stopImmediatePropagation(); e.preventDefault();
      opts.querySelectorAll('.chip[data-k="cut"]').forEach(function (x) { x.classList.toggle("on", x === ch); });
      var im = cz.querySelector("img"); im.src = src(v, 600); cz.querySelector("b").textContent = he() ? D[v][2] : D[v][0];
      clearTimeout(czt); cz.classList.remove("out"); cz.classList.add("on");
      czt = setTimeout(function () {
        passing = true; ch.classList.remove("on"); ch.click(); passing = false;
        /* the rebuild has run; hold the stone a moment on the first frame after it, then hand over to the bracelet */
        requestAnimationFrame(function () { czt = setTimeout(function () { cz.classList.add("out"); dispatchEvent(new Event("silavu:reassemble"));
          czt = setTimeout(function () { cz.classList.remove("on", "out"); }, 520); }, 900); });
      }, 380);
    }, true);
    if (window.MutationObserver) new MutationObserver(function () { show(cur()); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 50); }); else setTimeout(init, 50);
})();
