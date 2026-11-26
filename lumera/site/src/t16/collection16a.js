/* /collection16a/: the title that opens onto the film, the chapters that open out of a slit of light, the strip, the
   discreet filter. One thing moves per screen; everything is transform, opacity or a clip, written once per frame and
   only for what is on screen. With reduced motion every picture is simply open and the film does not play. */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var smooth = function (a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var inout = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var vh = innerHeight, vw = innerWidth;

  /* ── the title ── */
  var hero = document.querySelector(".h16"), video = hero && hero.querySelector(".h16v");
  var win = hero && hero.querySelector(".h16w"), edge = hero && hero.querySelector(".h16o"), txt = hero && hero.querySelector(".h16t"), cue = hero && hero.querySelector(".h16cue");
  var words = hero ? [].slice.call(hero.querySelectorAll(".h16word")) : [];
  var upright = matchMedia("(max-width: 699px) and (orientation: portrait)");
  /* the word is set to fill the screen exactly: across it, or down it on a phone held upright */
  function fit() {
    if (!words.length) return;
    var w = words[1] || words[0]; words.forEach(function (x) { x.style.fontSize = "100px"; });
    var r = w.getBoundingClientRect(), side = upright.matches && !document.documentElement.hasAttribute("data-ns");
    var len = side ? r.height : r.width, room = side ? (vh - 74 - 10 - 8) : vw * .94;
    var fs = 100 * room / Math.max(1, len);
    if (side) fs = Math.min(fs, vw * .3); else fs = Math.min(fs, vh * .42);
    words.forEach(function (x) { x.style.fontSize = fs.toFixed(1) + "px"; });
  }
  if (video) {
    var sm = Math.min(screen.width, screen.height) < 900 || vw < 900;
    video.src = video.getAttribute(sm ? "data-src-sm" : "data-src");
    if (!reduce) { var vio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var p = video.play(); if (p && p.catch) p.catch(function () {}); } else video.pause(); }); });
      vio.observe(video); }
  }

  /* ── the chapters ── */
  var chapters = [].slice.call(document.querySelectorAll(".c16"));
  var parts = chapters.map(function (c) { return { el: c, pic: c.querySelector(".c16pic"), img: c.querySelector(".c16pic img"), shown: false }; });
  var base = function () { return vw >= 1800 ? 1.12 : 1.22; };

  function frame() {
    raf = 0;
    if (reduce) return;
    if (hero) { var r = hero.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        var p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
        var s = 1 + inout(clamp(p / .8, 0, 1)) * (upright.matches ? 1.4 : .9);
        words.forEach(function (w) { w.style.transform = "scale(" + s.toFixed(4) + ")"; });
        win.style.opacity = (1 - smooth(.18, .72, p)).toFixed(3);
        edge.style.opacity = (1 - smooth(.04, .4, p)).toFixed(3);
        var t = 1 - smooth(0, .16, p); txt.style.opacity = t.toFixed(3); txt.style.transform = "translateY(" + ((1 - t) * -18).toFixed(1) + "px)";
        txt.style.visibility = t < .02 ? "hidden" : "visible"; if (cue) cue.style.opacity = t.toFixed(3);
      } }
    for (var i = 0; i < parts.length; i++) { var c = parts[i], b = c.el.getBoundingClientRect();
      if (b.bottom < -60 || b.top > vh + 60 || c.el.classList.contains("hid")) continue;
      var e = clamp((vh - b.top) / (vh * .92), 0, 1), k = clamp(-b.top / Math.max(1, b.height - vh), 0, 1), o = inout(e);
      var cut = ((1 - o) * 46).toFixed(2);
      c.pic.style.clipPath = "inset(" + cut + "% 0 " + cut + "% 0)";
      c.img.style.transform = "scale(" + (base() + (1 - o) * .07).toFixed(4) + ") translate3d(0," + ((.5 - k) * 3).toFixed(2) + "%,0)";
      if (!c.shown && e > .74) { c.shown = true; c.el.classList.add("in"); }
    }
  }
  var raf = 0;
  function ask() { if (!raf) raf = requestAnimationFrame(frame); }
  addEventListener("scroll", ask, { passive: true });
  addEventListener("resize", function () { vh = innerHeight; vw = innerWidth; fit(); ask(); });
  if (reduce) { parts.forEach(function (c) { c.el.classList.add("in"); }); }
  fit(); ask();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fit(); ask(); });
  /* the word changes with the language: set it again */
  new MutationObserver(function () { requestAnimationFrame(function () { fit(); ask(); }); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  /* ── the strip ── */
  var strip = document.querySelector(".strip16"), frames = [].slice.call(document.querySelectorAll(".f16"));
  frames.forEach(function (f, i) { f.style.setProperty("--i", i); });
  if (reduce || !("IntersectionObserver" in window)) frames.forEach(function (f) { f.classList.add("in"); });
  else { var fio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); fio.unobserve(e.target); } }); }, { threshold: .12 });
    frames.forEach(function (f) { fio.observe(f); }); }
  var prev = document.querySelector(".ar16.prev"), next = document.querySelector(".ar16.next");
  function rtl() { return document.documentElement.dir === "rtl"; }
  function ends() { if (!strip || !prev) return; var x = Math.abs(strip.scrollLeft), max = strip.scrollWidth - strip.clientWidth;
    prev.disabled = x < 4; next.disabled = x > max - 4; }
  function step(d) { var f = frames.filter(function (x) { return !x.classList.contains("hid"); })[0]; if (!f) return;
    var w = f.getBoundingClientRect().width + parseFloat(getComputedStyle(strip).columnGap || 24);
    strip.scrollBy({ left: d * w * (rtl() ? -1 : 1), behavior: reduce ? "auto" : "smooth" }); }
  if (strip && prev) { prev.addEventListener("click", function () { step(-1); }); next.addEventListener("click", function () { step(1); });
    strip.addEventListener("scroll", function () { requestAnimationFrame(ends); }, { passive: true }); ends();
    [prev, next].forEach(function (b) { b.setAttribute("data-alt-en", b.getAttribute("aria-label")); });
    new MutationObserver(function () { [prev, next].forEach(function (b) { b.setAttribute("aria-label", rtl() ? b.getAttribute("data-he-label") : b.getAttribute("data-alt-en")); }); ends(); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] }); }

  /* ── the filter: discreet, in the title; it takes you to what it leaves ── */
  var chips = [].slice.call(document.querySelectorAll(".flt .fb")), items = [].slice.call(document.querySelectorAll("[data-cat]"));
  chips.forEach(function (c) { c.addEventListener("click", function () {
    var f = c.getAttribute("data-f"); chips.forEach(function (x) { var on = x === c; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
    items.forEach(function (it) { it.classList.toggle("hid", f !== "all" && it.getAttribute("data-cat") !== f); });
    [].forEach.call(document.querySelectorAll(".sig16, .sp16"), function (s) { s.classList.toggle("hid", !s.querySelector("[data-cat]:not(.hid)")); });
    if (strip) { strip.scrollLeft = 0; ends(); }
    if (f !== "all") { var first = document.querySelector(".sig16:not(.hid) .it16, .sp16:not(.hid)");
      if (first) first.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
    ask();
  }); });
})();
