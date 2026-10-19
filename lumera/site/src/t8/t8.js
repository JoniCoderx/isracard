/* /test8/: what moves, and why (motion-taste 1):
   - the opening: SOUL floats a little in front of the house's name (rare
     delight; it stops when out of sight), and as the page moves the name
     goes faster than the piece (depth);
   - the lineup: the scroll brings each piece in, turning, its colour and its
     name with it (it is the collection, one piece at a time). The mapping
     never stops: it only slows as a piece reaches the middle;
   - the controls move the page itself, so scrolling and pressing are the
     same state.
   One loop, run only when the page scrolls; where things are is measured
   when the page changes, never while it scrolls; a frame writes only the
   transforms and opacities that changed. */
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


  function Pin(el, stage) {
    var g = geo(el), sh = 0;
    return {
      measure: function () { sh = stage.clientHeight || innerHeight; },
      near: function (m) { return V.Y + V.VH * (1 + m) > g.top && V.Y - V.VH * m < g.top + g.h; },
      p: function () { return clamp((V.Y - g.top) / Math.max(1, g.h - sh)); },
      g: g, get sh() { return sh; }
    };
  }
  /* one record of what was last written for each element */
  function css(el, k, v, memo) { if (memo[k] !== v) { memo[k] = v; el.style[k] = v; } }

  /* ── the bar's ink: the deep tone of whatever is under it ── */
  /* (set on the bar and the row of names only: set on the page it would
     make every element's style be worked out again) */
  var ink = (function () {
    var cur = "", els = [$(".hd"), $(".lnav")].filter(Boolean);
    return function (c) {
      if (!c || c === cur) return; cur = c;
      /* the pill's words: light on a deep ink, deep on a light one */
      var on = parseInt(c.slice(1, 3), 16) + parseInt(c.slice(3, 5), 16) + parseInt(c.slice(5, 7), 16) > 450 ? "#1b1a19" : "#fbf7f1";
      els.forEach(function (e) { e.style.setProperty("--hdink", c); e.style.setProperty("--hdon", on); });
    };
  })();

  /* ── 0 · the opening ── */
  (function () {
    var sec = $("#top"); if (!sec) return;
    var g = geo(sec), word = $(".giant", sec), piece = $(".hpiece", sec), mw = {}, mp = {}, still = null;
    scenes.push({ frame: function () {
      var y = V.Y - g.top, seen = y < g.h;
      if (seen !== !still) { still = !seen; H.classList.toggle("still", still); }
      if (y < g.h * 0.6) ink(sec.getAttribute("data-ink"));
      if (!seen || reduce) return;
      var k = clamp(y / g.h);
      css(word, "transform", "translate(-50%,calc(-50% + " + (k * 34).toFixed(1) + "vh))", mw);
      css(piece, "transform", "translate(-50%,calc(-50% + " + (k * 12).toFixed(1) + "vh)) scale(" + (1 + k * 0.08).toFixed(3) + ")", mp);
    } });
  })();

  /* ── 1 · the lineup ── */
  var lineup = (function () {
    var sec = $("#collection"); if (!sec) return null;
    var stage = $(".lstage", sec), pin = Pin($(".lpin", sec), stage), scs = $$(".sc", sec), n = scs.length, INKS = JSON.parse(sec.getAttribute("data-inks"));
    var pills = $$(".lpill", sec), prev = $(".lprev", sec), next = $(".lnext", sec), active = -1;
    var parts = scs.map(function (el) { return { el: el, bg: $(".scbg", el), name: $(".scname", el), piece: $(".scpiece", el), info: $(".scinfo", el), mb: {}, mn: {}, mp: {}, mi: {} }; });
    /* the mapping: steady, a little slower (never stopped) at each piece */
    function g(u) { var k = Math.floor(u), t = u - k; return Math.min(n - 1, k + t - 0.6 / (2 * Math.PI) * Math.sin(2 * Math.PI * t)); }
    function setActive(i) {
      if (i === active) return; active = i;
      parts.forEach(function (q, k) { q.el.classList.toggle("on", k === i); q.el.inert = k !== i; });
      pills.forEach(function (b, k) { if (k === i) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
      if (prev) prev.disabled = i <= 0; if (next) next.disabled = i >= n - 1;
      /* the chosen name is brought into its row, without moving the page */
      var b = pills[i], row = b && b.parentNode; if (b && row.scrollWidth > row.clientWidth) { var r = row.getBoundingClientRect(), br = b.getBoundingClientRect(); if (br.left < r.left || br.right > r.right) row.scrollLeft += br.left + br.width / 2 - (r.left + r.width / 2); }
    }
    function goTo(i, instant) {
      i = Math.max(0, Math.min(n - 1, i));
      var range = pin.g.h - pin.sh, y = pin.g.top + (n > 1 ? i / (n - 1) : 0) * range;
      window.scrollTo({ top: Math.round(y), behavior: instant || reduce ? "instant" : "smooth" });
    }
    pills.forEach(function (b, k) { b.addEventListener("click", function () { goTo(k); }); });
    if (prev) prev.addEventListener("click", function () { goTo(active - 1); });
    if (next) next.addEventListener("click", function () { goTo(active + 1); });
    /* keys answer at once (motion-taste 1) */
    sec.addEventListener("keydown", function (e) {
      var f = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!f) return;
      if (rtl()) f = -f; e.preventDefault(); goTo(active + f, true);
    });
    var api = {
      measure: pin.measure,
      frame: function () {
        if (!pin.near(0.2)) return;
        var p = pin.p(), f = reduce ? 0 : g(p * (n - 1)), k = Math.floor(f), t = f - k, s = rtl() ? -1 : 1;
        if (reduce) { setActive(Math.round((V.Y - pin.g.top) / Math.max(1, V.VH))); return; }
        var W = V.W;
        for (var i = 0; i < n; i++) {
          var q = parts[i], d = i - f, a = Math.abs(d), c = Math.min(a, 1);
          /* the next colour wipes up over the last, whole (no half-tones) */
          css(q.bg, "opacity", i <= k + 1 ? "1" : "0", q.mb);
          css(q.bg, "transform", i === k + 1 ? "translate3d(0," + ((1 - t) * 100).toFixed(2) + "%,0)" : "", q.mb);
          css(q.name, "opacity", clamp(1 - a * 2.4).toFixed(3), q.mn);
          css(q.name, "transform", "translate(-50%,calc(-50% + " + (d * 55).toFixed(1) + "%))", q.mn);
          css(q.piece, "opacity", clamp(1.3 - a * 1.1).toFixed(3), q.mp);
          css(q.piece, "transform", "translate(calc(-50% + " + (d * 0.62 * W * s).toFixed(1) + "px),-50%) rotate(" + (d * 18 * s).toFixed(2) + "deg) scale(" + (1 - c * 0.3).toFixed(3) + ")", q.mp);
          css(q.info, "opacity", clamp(1 - a * 3).toFixed(3), q.mi);
          css(q.info, "transform", a > 0.001 ? "translateY(" + (a * 28).toFixed(1) + "px)" : "", q.mi);
        }
        var r = Math.max(0, Math.min(n - 1, Math.round(f)));
        setActive(r);
        if (V.Y >= pin.g.top - V.VH * 0.4 && V.Y < pin.g.top + pin.g.h - V.VH * 0.6) ink(INKS[r]);
      },
      get active() { return active; }, goTo: goTo, ids: scs.map(function (el) { return el.id.slice(2); })
    };
    /* every piece's picture is unpacked while the page is idle, before the
       scroll asks for it, never while it moves */
    function warm() { var imgs = $$(".sccut", sec), i = 0; (function one() { var im = imgs[i++]; if (!im) return; im.loading = "eager"; var d = im.decode ? im.decode() : Promise.resolve(); d.then(next, next); })(); function next() { (window.requestIdleCallback || setTimeout)(function () { var im = imgs[i++]; if (!im) return; im.loading = "eager"; (im.decode ? im.decode() : Promise.resolve()).then(next, next); }); } }
    if (document.readyState === "complete") warm(); else addEventListener("load", warm);
    scenes.push(api);
    return api;
  })();
  window.__lineup = lineup;

  /* ── the bar over the rest of the page ── */
  (function () {
    var all = $("#all"), appt = $("#appointment"), ft = $(".ft");
    var ga = all && geo(all), gp = appt && geo(appt), gf = ft && geo(ft), moved = null;
    scenes.push({ frame: function () {
      var y = V.Y + 40;
      if (gf && y >= gf.top) ink("#1b1a19");
      else if (gp && y >= gp.top) ink("#fbf7f1");
      else if (ga && y >= ga.top) ink("#1b1a19");
      var mv = V.Y > 30; if (mv !== moved) { moved = mv; H.classList.toggle("moved", mv); }
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
      /* from the bar while SOUL is on the stage, SOUL */
      /* from the bar while the lineup is on screen, the piece in front */
      if (!id && b.closest(".hd") && lineup && lineup.active >= 0) { var ls = $("#collection"), r = ls.getBoundingClientRect(); if (r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.5) id = lineup.ids[lineup.active]; }
      var r = id && $("#bp-" + id); if (r) r.checked = true; else $("#bp-open").checked = true;
      paint();
      if (menu && !menuEl.hidden) menu.close(true);
      book.open(b);
    });
    paint();
  }

  measure();
})();
