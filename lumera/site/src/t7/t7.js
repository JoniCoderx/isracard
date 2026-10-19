/* /test7/: what moves, and why (motion-taste 1):
   - the chapters: each a take of real footage, full screen; the page's own
     scroll slides the next over the last (sticky: nothing of ours is in the
     way of the hand). As a chapter is covered it drifts up a little, slower than the page, and its
     words come up as it arrives (continuity);
   - a film plays only while its chapter can be seen, at most two at once;
     the rest stand still, unloaded until they are near;
   - the collection: a piece comes forward when it is chosen.
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


  /* ── the chapters ── */
  var chs = $$(".ch").map(function (el) {
    var g = geo(el), vid = $(".vid", el), media = $(".media", el), txt = $(".txt", el);
    return { el: el, g: g, vid: vid, media: media, txt: txt, playing: false, last: {} };
  });
  var data = (function () { var c = navigator.connection || {}; return !(c.saveData || /2g/.test(c.effectiveType || "")); })();
  function load(c) {
    if (c.vid.src || !data || reduce) return;
    c.vid.src = innerWidth / innerHeight < 1 ? c.vid.getAttribute("data-src-m") : c.vid.getAttribute("data-src");
    c.vid.addEventListener("playing", function () { c.vid.classList.add("on"); });
  }
  function play(c, on) {
    if (on === c.playing) return; c.playing = on;
    if (on) { load(c); var r = c.vid.play(); if (r && r.catch) r.catch(function () {}); }
    else if (c.vid.src) c.vid.pause();
  }
  function set(c, k, v, f) { if (c.last[k] !== v) { c.last[k] = v; f(v); } }
  /* where each chapter's own place in the page is (its top as if nothing were
     sticky), measured with the rest: a sticky element reports where it is
     stuck, so it is worked out from the first chapter and the screen height */
  scenes.push({ frame: function () {
    for (var i = 0; i < chs.length; i++) {
      var c = chs[i], top = c.g.top, H = V.VH, y = V.Y - top;
      /* in: how far it has come up (0 below the screen, 1 in place); over: how
         far the next has covered it */
      var inn = clamp(1 + y / H), over = c.el.classList.contains("appt") ? 0 : clamp(y / H);
      /* on a phone, one film at a time: the one that holds most of the
         screen; elsewhere the arriving one starts as it comes in */
      var seen = coarse ? inn > 0.5 && over < 0.5 : inn > 0.35 && over < 0.98;
      if (inn > -1 + 0 && V.Y > top - 2.2 * H && V.Y < top + 2 * H) load(c);
      play(c, seen);
      if (reduce) continue;
      /* the covered film drifts up a little, slower than the page: depth,
         without leaving any edge uncovered */
      set(c, "m", over > 0.001 ? "translate3d(0," + (-14 * over).toFixed(2) + "vh,0)" : "", function (v) { c.media.style.transform = v; });
      var to = c.el.id === "top" ? 1 - clamp(over * 1.6) : clamp((inn - 0.45) / 0.4) * (1 - clamp(over * 1.6));
      set(c, "t", to.toFixed(3), function (v) { c.txt.style.opacity = v; c.txt.style.visibility = v < 0.01 ? "hidden" : ""; });
      set(c, "ty", ((1 - clamp((inn - 0.45) / 0.4)) * 36).toFixed(1), function (v) { c.txt.style.transform = +v ? "translateY(" + v + "px)" : ""; });
    }
  } });
  /* a sticky chapter reports where it is stuck: its place in the page is
     worked out from the chapters before it (each one screen tall) */
  scenes.push({ measure: function () {
    var first = chs.filter(function (c) { return !c.el.classList.contains("appt"); });
    if (!first.length) return;
    var t0 = first[0].el.parentNode.getBoundingClientRect().top + scrollY;
    first.forEach(function (c, i) { c.g.top = t0 + i * c.el.offsetHeight; });
  } });
  window.__chs = chs;

  /* ── the bar: clear over the first film, solid after it ── */
  (function () {
    var solid = null, moved = null;
    scenes.push({ frame: function () {
      var s = V.Y > V.VH * 0.85; if (s !== solid) { solid = s; H.classList.toggle("solid", s); }
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
      if (!id && b.closest(".hd")) { var sc = chs.filter(function (c) { return c.el.id === "soul"; })[0]; if (sc && V.Y > sc.g.top - V.VH * 0.5 && V.Y < sc.g.top + V.VH * 0.5) id = "pave"; }
      var r = id && $("#bp-" + id); if (r) r.checked = true; else $("#bp-open").checked = true;
      paint();
      if (menu && !menuEl.hidden) menu.close(true);
      book.open(b);
    });
    paint();
  }

  measure();
})();
