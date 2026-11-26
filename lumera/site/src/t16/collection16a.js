/* /collection16a/: the title that opens onto the film and closes on the Signature's title card; four chapters cut four
   ways, each with a second beat (the piece's film, the stone close, a pan); the strip; the ending. One thing moves per
   screen; everything is transform, opacity or a clip, written once per frame and only for what is near the screen.
   Films load only when their chapter comes near, and play only while they are seen. With reduced motion every
   picture is simply open, every beat already in place, and no film plays. */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var html = document.documentElement;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var smooth = function (a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var inout = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var vh = innerHeight, vw = innerWidth;
  var small = Math.min(screen.width, screen.height) < 900 || vw < 900;
  var rtl = function () { return html.dir === "rtl"; };
  var phone = matchMedia("(max-width: 899px)");

  /* films: the source is set only when needed; play() only while seen */
  function arm(v) { if (!v || v.__armed) return; v.__armed = true;
    var po = v.getAttribute("data-poster"); if (po) v.poster = po;
    var s = v.getAttribute(small ? "data-src-sm" : "data-src"); if (s) v.src = s; }
  function run(v, on) { if (!v) return; on = on && !reduce;
    if (on === v.__on) return; v.__on = on;
    if (on) { arm(v); var p = v.play(); if (p && p.catch) p.catch(function () {}); } else if (v.__armed) v.pause(); }

  /* ── the title ── */
  var hero = document.querySelector(".h16"), hv = hero && hero.querySelector(".h16v");
  var win = hero && hero.querySelector(".h16w"), edge = hero && hero.querySelector(".h16o"), txt = hero && hero.querySelector(".h16t"), cue = hero && hero.querySelector(".h16cue");
  var dim = hero && hero.querySelector(".h16d"), card = hero && hero.querySelector(".h16i");
  var words = hero ? [].slice.call(hero.querySelectorAll(".h16word")) : [];
  var upright = matchMedia("(max-width: 699px) and (orientation: portrait)");
  function side() { return upright.matches && !html.hasAttribute("data-ns"); }
  /* the word is set to fill the screen exactly: across it, or down it on a phone held upright */
  function fit() {
    if (!words.length) return;
    var w = words[1] || words[0]; words.forEach(function (x) { x.style.fontSize = "100px"; });
    var r = w.getBoundingClientRect(), sd = side();
    var len = sd ? r.height : r.width, room = sd ? (vh - 74 - 10 - 8) : vw * .94;
    var fs = 100 * room / Math.max(1, len);
    fs = sd ? Math.min(fs, vw * .3) : Math.min(fs, vh * .42);
    words.forEach(function (x) { x.style.fontSize = fs.toFixed(1) + "px"; });
  }
  if (hv) { arm(hv); if (reduce) hv.removeAttribute("autoplay"); }

  /* ── the chapters ── */
  var parts = [].slice.call(document.querySelectorAll(".c16")).map(function (c) {
    var pic = c.querySelector(".c16pic"), x = c.querySelector(".c16x");
    return { el: c, v: c.getAttribute("data-v"), pic: pic, main: pic.querySelector("img, video"), x: x, xm: x && x.querySelector("img, video"),
      g: c.querySelector(".c16g"), shown: false };
  });
  /* films come near: give them their source a screen and a half ahead */
  if ("IntersectionObserver" in window) {
    var near = new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting) return;
      [].forEach.call(e.target.querySelectorAll("video"), function (v) { var po = v.getAttribute("data-poster"); if (po && !v.poster) v.poster = po; });
      near.unobserve(e.target); }); }, { rootMargin: "150% 0px" });
    parts.forEach(function (c) { near.observe(c.el); });
  } else parts.forEach(function (c) { [].forEach.call(c.el.querySelectorAll("video"), arm); });

  var mk = document.querySelector(".mkbg img"), mks = document.querySelector(".mk16");

  function frame() {
    raf = 0;
    if (reduce) return;
    /* the title: the word opens onto the film, the film dims, the Signature's card comes up */
    if (hero) { var r = hero.getBoundingClientRect(), on = r.bottom > 0 && r.top < vh;
      run(hv, on);
      if (on) {
        var p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
        var s = 1 + inout(clamp(p / .6, 0, 1)) * (side() ? 1.4 : .9);
        words.forEach(function (w) { w.style.transform = "scale(" + s.toFixed(4) + ")"; });
        win.style.opacity = (.87 * (1 - smooth(.12, .52, p))).toFixed(3);
        edge.style.opacity = (1 - smooth(.04, .34, p)).toFixed(3);
        var t = 1 - smooth(0, .12, p); txt.style.opacity = t.toFixed(3); txt.style.transform = "translateY(" + ((1 - t) * -18).toFixed(1) + "px)";
        txt.style.visibility = t < .02 ? "hidden" : "visible"; if (cue) cue.style.opacity = t.toFixed(3);
        var c = smooth(.6, .78, p); dim.style.opacity = c.toFixed(3);
        card.style.opacity = c.toFixed(3); card.style.transform = "translateY(" + ((1 - c) * 22).toFixed(1) + "px)";
      } }
    var ph = phone.matches, R = rtl();
    for (var i = 0; i < parts.length; i++) { var q = parts[i], b = q.el.getBoundingClientRect();
      var seen = !(b.bottom < 0 || b.top > vh || q.el.classList.contains("hid"));
      if (b.bottom < -60 || b.top > vh + 60 || q.el.classList.contains("hid")) { if (q.main && q.main.tagName === "VIDEO") run(q.main, false); if (q.xm && q.xm.tagName === "VIDEO") run(q.xm, false); continue; }
      var e = clamp((vh - b.top) / (vh * .92), 0, 1), k = clamp(-b.top / Math.max(1, b.height - vh), 0, 1), o = inout(e);
      var cut = ((1 - o) * 46).toFixed(2);
      q.pic.style.clipPath = "inset(" + cut + "% 0 " + cut + "% 0)";
      /* the second beat, while the chapter holds the screen */
      var bt = smooth(.1, .46, k), bo = inout(bt);
      if (q.v === "d") {   /* the slow pan, start to end of the hold */
        q.main.style.transform = "translate3d(" + ((R ? -15.25 : 0) + (R ? k * 15.25 : -k * 15.25)).toFixed(2) + "%,0,0)";
      } else if (q.main && q.main.tagName === "IMG") {
        q.main.style.transform = "scale(" + ((vw >= 1800 ? 1.1 : 1.2) + (1 - o) * .07 - bo * .04).toFixed(4) + ") translate3d(0," + ((.5 - k) * 3).toFixed(2) + "%,0)";
      }
      if (q.x) {
        if (q.v === "b") { var w = ((1 - bo) * 100).toFixed(2);
          q.x.style.clipPath = ph ? "inset(0 0 0 " + w + "%)" : (R ? "inset(0 0 0 " + w + "%)" : "inset(0 " + w + "% 0 0)"); }
        else if (q.v === "c") { q.x.style.clipPath = "inset(" + ((1 - bo) * 100).toFixed(2) + "% 0 0 0)";
          if (q.xm) q.xm.style.transform = "scale(" + (1.12 - bo * .1).toFixed(4) + ")"; }
        else { q.x.style.clipPath = "inset(" + ((1 - bo) * 100).toFixed(2) + "% 0 0 0)";
          q.x.style.transform = "translate3d(0," + ((1 - bo) * 40).toFixed(1) + "px,0)"; }
      }
      if (q.g) q.g.style.transform = "translate3d(0," + ((.5 - k) * 50).toFixed(1) + "px,0)";
      if (!q.shown && e > .74) { q.shown = true; q.el.classList.add("in"); }
      /* films play only while seen: the main one once its slit is open, the beat once it has arrived */
      if (q.main && q.main.tagName === "VIDEO") run(q.main, seen && e > .3);
      if (q.xm && q.xm.tagName === "VIDEO") run(q.xm, seen && bt > .02);
    }
    /* the ending: the worn bracelet comes slowly close behind the words */
    if (mk) { var m = mks.getBoundingClientRect(); if (m.top < vh && m.bottom > 0) {
      var z = clamp((vh - m.top) / (vh + m.height), 0, 1); mk.style.transform = "scale(" + (1.16 - z * .16).toFixed(4) + ")"; } }
  }
  var raf = 0;
  function ask() { if (!raf) raf = requestAnimationFrame(frame); }
  addEventListener("scroll", ask, { passive: true });
  addEventListener("resize", function () { vh = innerHeight; vw = innerWidth; fit(); ask(); });
  if (reduce) parts.forEach(function (c) { c.el.classList.add("in"); [].forEach.call(c.el.querySelectorAll("video"), arm); });
  fit(); ask();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fit(); ask(); });
  /* the word changes with the language: set it again */
  new MutationObserver(function () { requestAnimationFrame(function () { fit(); ask(); }); }).observe(html, { attributes: true, attributeFilter: ["lang"] });
  /* a hidden tab plays nothing */
  document.addEventListener("visibilitychange", function () { if (document.hidden) [].forEach.call(document.querySelectorAll("video"), function (v) { v.__on = false; v.pause(); }); else ask(); });

  /* ── the strip ── */
  var sp = document.querySelector(".sp16"), strip = document.querySelector(".strip16"), frames = [].slice.call(document.querySelectorAll(".f16"));
  frames.forEach(function (f, i) { f.style.setProperty("--i", i); });
  if (reduce || !("IntersectionObserver" in window)) { frames.forEach(function (f) { f.classList.add("in"); }); if (sp) sp.classList.add("in"); }
  else { var fio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); fio.unobserve(e.target); } }); }, { threshold: .12 });
    frames.forEach(function (f) { fio.observe(f); }); if (sp) fio.observe(sp); }
  var prev = document.querySelector(".ar16.prev"), next = document.querySelector(".ar16.next");
  var num = document.querySelector(".sp16n b"), bar = document.querySelector(".sp16p > i > i");
  function live() { return frames.filter(function (x) { return !x.classList.contains("hid"); }); }
  function ends() { if (!strip) return; var x = Math.abs(strip.scrollLeft), max = strip.scrollWidth - strip.clientWidth;
    if (prev) { prev.disabled = x < 4; next.disabled = x > max - 4; }
    var L = live(), n = L.length || 1, at = max > 0 ? x / max : 0, idx = Math.round(at * (n - 1));
    if (num) num.textContent = String(idx + 1).padStart(2, "0");
    if (bar) bar.style.transform = "translateX(" + (at * (n - 1) / n * 100).toFixed(2) + "%) scaleX(" + (1 / n).toFixed(3) + ")";
    if (bar) bar.style.transformOrigin = "0 50%"; }
  function step(d) { var f = live()[0]; if (!f) return;
    var w = f.getBoundingClientRect().width + parseFloat(getComputedStyle(strip).columnGap || 24);
    strip.scrollBy({ left: d * w * (rtl() ? -1 : 1), behavior: reduce ? "auto" : "smooth" }); }
  if (strip) { strip.addEventListener("scroll", function () { requestAnimationFrame(ends); }, { passive: true }); ends();
    var sn = document.querySelector(".sp16n"); if (sn) { var tot = sn.textContent.split("/")[1]; sn.__tot = tot; } }
  if (strip && prev) { prev.addEventListener("click", function () { step(-1); }); next.addEventListener("click", function () { step(1); });
    [prev, next].forEach(function (b) { b.setAttribute("data-alt-en", b.getAttribute("aria-label")); });
    new MutationObserver(function () { [prev, next].forEach(function (b) { b.setAttribute("aria-label", rtl() ? b.getAttribute("data-he-label") : b.getAttribute("data-alt-en")); }); ends(); })
      .observe(html, { attributes: true, attributeFilter: ["dir"] }); }

  /* ── the filter: discreet, in the title; it takes you to what it leaves ── */
  var chips = [].slice.call(document.querySelectorAll(".flt .fb")), items = [].slice.call(document.querySelectorAll("[data-cat]"));
  chips.forEach(function (c) { c.addEventListener("click", function () {
    var f = c.getAttribute("data-f"); chips.forEach(function (x) { var on = x === c; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
    items.forEach(function (it) { it.classList.toggle("hid", f !== "all" && it.getAttribute("data-cat") !== f); });
    [].forEach.call(document.querySelectorAll(".sig16, .sp16"), function (s) { s.classList.toggle("hid", !s.querySelector("[data-cat]:not(.hid)")); });
    var sn = document.querySelector(".sp16n"); if (sn) sn.innerHTML = "<b>01</b> / " + String(live().length).padStart(2, "0"); num = document.querySelector(".sp16n b");
    if (strip) { strip.scrollLeft = 0; ends(); }
    if (f !== "all") { var first = document.querySelector(".c16:not(.hid), .sp16:not(.hid)");
      if (first) scrollTo({ top: first.getBoundingClientRect().top + scrollY + (first.classList.contains("c16") ? vh * .4 : 0), behavior: reduce ? "auto" : "smooth" }); }
    ask();
  }); });
})();
