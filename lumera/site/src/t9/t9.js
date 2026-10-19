/* /test9/: what moves, and why (motion-taste 1):
   - the films play only while they can be seen (the campaign film at the
     top, each piece's own film), and they
     are not even fetched until they are near;
   - only one film plays at a time, the one holding most of the screen;
   - a section fades in once as it first arrives (it is arriving);
   - a card shows the piece worn under the pointer (a second picture).
   Nothing follows the scroll: the page is the browser's own, and this
   script does no work while it moves but for one cheap check of where the
   top of the page is. */
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


  /* ── the films: fetched when near, played while seen ── */
  (function () {
    var vids = $$("video.vid"); if (!vids.length || reduce) return;
    var c = navigator.connection || {}; if (c.saveData || /2g/.test(c.effectiveType || "")) return;
    var tall = innerWidth / innerHeight < 1, ratio = new Map();
    function load(v) { if (v.src) return; v.src = tall ? v.getAttribute("data-src-m") : v.getAttribute("data-src"); v.addEventListener("playing", function () { v.classList.add("on"); }); }
    function decide() {
      /* only the film that holds most of the screen plays, everywhere */
      var best = null, bestR = 0;
      vids.forEach(function (v) { var r = ratio.get(v) || 0; if (r > bestR) { bestR = r; best = v; } });
      vids.forEach(function (v) {
        var r = ratio.get(v) || 0, on = v === best && r > (coarse ? 0.35 : 0.2);
        if (on) { load(v); if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
        else if (v.src && !v.paused) v.pause();
      });
    }
    var near = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) load(e.target); }); }, { rootMargin: "100% 0px" });
    var seen = new IntersectionObserver(function (es) { es.forEach(function (e) { ratio.set(e.target, e.isIntersecting ? e.intersectionRatio : 0); }); decide(); }, { threshold: [0, 0.2, 0.35, 0.5, 0.75, 1] });
    vids.forEach(function (v) { near.observe(v); seen.observe(v); });
    window.__films = { vids: vids, ratio: ratio };
  })();

  /* ── sections come in once ── */
  (function () {
    var els = $$(".rv"); if (!els.length) return;
    if (reduce || !window.IntersectionObserver) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (e) { io.observe(e); });
  })();

  /* ── the bar: light over the campaign film, ivory after it ── */
  (function () {
    var top = $("#top"), g = top ? geo(top) : null, solid = null;
    scenes.push({ frame: function () { var s = !g || V.Y > g.top + g.h - 90; if (s !== solid) { solid = s; H.classList.toggle("solid", s); } } });
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
      /* from the bar while SOUL is on the stage, SOUL */
      /* from the bar while a piece's film holds the screen, that piece */
      if (!id && b.closest(".hd")) { $$(".frow").forEach(function (f) { var r = f.getBoundingClientRect(); if (r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.5) id = f.id.slice(2); }); }
      var r = id && $("#bp-" + id); if (r) r.checked = true; else $("#bp-open").checked = true;
      paint();
      if (menu && !menuEl.hidden) menu.close(true);
      book.open(b);
    });
    paint();
  }

  measure();
})();
