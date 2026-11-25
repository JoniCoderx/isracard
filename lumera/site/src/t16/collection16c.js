/* /collection16c/: the light. With a mouse, the light follows the pointer over a piece (the spotlight, the highlight on
   the stones, a tilt of at most 6 degrees, the magnetic "View"), and a faint torch on the night ground. On a phone, the
   piece at the centre of the screen comes into the light as the reader scrolls, the highlight passing over it with the
   scroll. The filter moves the pieces to their new places (FLIP, 260ms). A piece opens into its preview. Only transform
   and opacity move; work stops when nothing is lit; with reduced motion the pieces are simply shown. */
(function () {
  var html = document.documentElement, D = window.__c16 || {};
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var vit = document.querySelector(".vit");
  var cards = [].slice.call(document.querySelectorAll(".v16"));
  var heads = [].slice.call(document.querySelectorAll(".gk"));
  var he = function () { return html.lang === "he"; };
  var L = function (o) { return o ? (he() ? o.he || o.en : o.en) : ""; };

  /* ── places in the constellation, from what is shown ── */
  function place() {
    var big = cards.filter(function (c) { return c.classList.contains("big") && !c.classList.contains("hid"); });
    var small = cards.filter(function (c) { return c.classList.contains("small") && !c.classList.contains("hid"); });
    big.forEach(function (c, i) { c.setAttribute("data-l", big.length % 2 && i === big.length - 1 ? (big.length === 1 ? "C" : "C") : (i % 2 ? "R" : "L")); });
    small.forEach(function (c, i) { c.setAttribute("data-l", "abc"[i % 3] + Math.min(3, small.length)); });
    heads.forEach(function (h) { var g = h.getAttribute("data-g"); h.classList.toggle("hid", !(g === "sig" ? big : small).length); });
  }
  place();

  /* ── the filter: FLIP to the new places ── */
  var chips = [].slice.call(document.querySelectorAll(".chf .chip"));
  chips.forEach(function (chip) { chip.addEventListener("click", function () {
    var f = chip.getAttribute("data-f");
    chips.forEach(function (x) { var on = x === chip; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
    var els = cards.concat(heads), first = new Map(), was = new Map();
    els.forEach(function (e) { was.set(e, !e.classList.contains("hid")); if (was.get(e)) first.set(e, e.getBoundingClientRect()); });
    cards.forEach(function (c) { c.classList.toggle("hid", f !== "all" && c.getAttribute("data-cat") !== f); });
    place();
    if (reduce || !Element.prototype.animate) return;
    els.forEach(function (e) {
      if (e.classList.contains("hid")) return;
      if (!was.get(e)) { e.animate([{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)" }); return; }
      var a = first.get(e), b = e.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top, s = a.width / (b.width || 1);
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(s - 1) < .01) return;
      e.animate([{ transformOrigin: "0 0", transform: "translate(" + dx + "px," + dy + "px) scale(" + s + ")" }, { transformOrigin: "0 0", transform: "none" }], { duration: 260, easing: "cubic-bezier(.65,0,.35,1)" });
    });
  }); });

  /* ── the light on each piece ── */
  function rig(card) {
    var lv = card.querySelector(".lv"), lvi = lv.querySelector(".lvi"), veil = lv.querySelector(".veil"), glint = lv.querySelector(".glint"), vw = lv.querySelector(".vw");
    return { card: card, lv: lv, lvi: lvi, veil: veil, glint: glint, vw: vw, w: 1, h: 1,
      /* x, y: where the light stands in the picture, 0..1 */
      light: function (x, y, g) {
        this.veil.style.transform = "translate3d(" + ((x - .5) * this.w).toFixed(1) + "px," + ((y - .5) * this.h).toFixed(1) + "px,0)";
        /* the highlight crosses the picture a little faster than the light, so the stones flash as it passes */
        if (g == null) g = Math.max(0, Math.min(1, (x - .5) * 1.6 + .5));
        this.glint.style.transform = "translate3d(" + ((g * 1.3 - .43) * this.w).toFixed(1) + "px,0,0)";
      },
      on: function (v) { this.lv.classList.toggle("lit", v); this.card.classList.toggle("on", v); },
      size: function () { this.w = this.lv.offsetWidth; this.h = this.lv.offsetHeight; } };
  }
  var rigs = cards.map(rig);
  rigs.forEach(function (r) { r.size(); r.light(.5, .45); });
  addEventListener("resize", function () { rigs.forEach(function (r) { r.size(); }); }, { passive: true });

  if (reduce) {
    if (!fine) rigs.forEach(function (r) { r.on(true); });
    else rigs.forEach(function (r) {
      r.lv.addEventListener("pointerenter", function () { r.on(true); });
      r.lv.addEventListener("pointerleave", function () { r.on(false); });
      r.lv.addEventListener("focus", function () { r.on(true); }); r.lv.addEventListener("blur", function () { r.on(false); });
    });
  } else {
    /* the scroll's light (phone and desktop alike): only the piece nearest the middle of the screen is lit, and the light
       and the highlight move over it with the scroll. On a desktop the pointer takes the light over while on a piece. */
    var held = null, shown = null, sraf = 0;
    function sframe() { sraf = 0; var vh = innerHeight, best = null, bd = 1e9, bp = 0;
      rigs.forEach(function (r) { if (r.card.classList.contains("hid")) return; var b = r.lv.getBoundingClientRect(); if (b.bottom < vh * .3 || b.top > vh * .7) return;
        var d = Math.abs(b.top + b.height / 2 - vh * .5); if (d < bd) { bd = d; best = r; bp = Math.max(0, Math.min(1, (vh * .5 - b.top) / (b.height || 1))); } });
      if (held) best = null;
      if (shown && shown !== best && shown !== held) shown.on(false);
      shown = best; if (best) { best.light(.38 + bp * .24, .22 + bp * .56, bp); best.on(true); } }
    var kick = function () { if (!sraf) sraf = requestAnimationFrame(sframe); };
    addEventListener("scroll", kick, { passive: true }); addEventListener("resize", kick, { passive: true });
    chips.forEach(function (c) { c.addEventListener("click", function () { setTimeout(kick, 300); }); });
    setTimeout(kick, 60);
    if (fine) {
    /* the pointer's light */
    rigs.forEach(function (r) {
      var raf = 0, px = .5, py = .5, rect = null, cx = 0, cy = 0;
      function frame() { raf = 0; r.light(px, py);
        var tx = Math.max(-1, Math.min(1, (px - .5) * 2)), ty = Math.max(-1, Math.min(1, (py - .5) * 2));
        r.lvi.style.transform = "rotateX(" + (-ty * 6).toFixed(2) + "deg) rotateY(" + (tx * 6).toFixed(2) + "deg)";
        /* the "View" leans toward the pointer when it comes near (at most 12px) */
        var dx = cx - r.bx, dy = cy - r.by, d = Math.sqrt(dx * dx + dy * dy), k = d < 170 ? (1 - d / 170) : 0;
        r.vw.style.setProperty("--mx", (dx * .35 * k).toFixed(1) + "px"); r.vw.style.setProperty("--my", (dy * .35 * k).toFixed(1) + "px");
      }
      function at(e) { if (!rect) return; cx = e.clientX - rect.left; cy = e.clientY - rect.top; px = cx / rect.width; py = cy / rect.height; if (!raf) raf = requestAnimationFrame(frame); }
      r.lv.addEventListener("pointerenter", function (e) { if (e.pointerType !== "mouse") return;
        r.size(); rect = r.lv.getBoundingClientRect();
        var b = r.vw.getBoundingClientRect(); r.bx = b.left - rect.left + b.width / 2; r.by = b.top - rect.top + b.height / 2;
        held = r; if (shown && shown !== r) shown.on(false); shown = null; r.lv.classList.add("tilt"); r.on(true); at(e); });
      r.lv.addEventListener("pointermove", function (e) { if (e.pointerType === "mouse") at(e); });
      r.lv.addEventListener("pointerleave", function (e) { if (e.pointerType !== "mouse") return; rect = null; if (raf) cancelAnimationFrame(raf); raf = 0;
        r.lv.classList.remove("tilt"); r.on(false); r.lvi.style.transform = ""; r.vw.style.setProperty("--mx", "0px"); r.vw.style.setProperty("--my", "0px"); held = null; kick(); });
      addEventListener("scroll", function () { if (rect) rect = r.lv.getBoundingClientRect(); }, { passive: true });
      /* a keyboard reader brings the light by focusing the piece */
      r.lv.addEventListener("focus", function () { if (r.lv.matches(":focus-visible")) { r.size(); r.light(.5, .45); r.on(true); } });
      r.lv.addEventListener("blur", function () { r.on(false); });
    });
    /* the torch on the night ground, and the name in the title catching it */
    var torch = document.querySelector(".torch"), h1b = document.querySelector(".h1b"), traf = 0, tx = 0, ty = 0;
    function tframe() { traf = 0; torch.style.transform = "translate3d(" + tx + "px," + ty + "px,0)";
      if (h1b && ty < 700) { var b = h1b.getBoundingClientRect(); h1b.style.setProperty("--hx", Math.max(-20, Math.min(120, (tx - b.left) / b.width * 100)).toFixed(1) + "%"); } }
    addEventListener("pointermove", function (e) { if (e.pointerType !== "mouse") return; tx = e.clientX; ty = e.clientY; torch.classList.add("on"); if (!traf) traf = requestAnimationFrame(tframe); }, { passive: true });
    document.addEventListener("pointerleave", function () { torch.classList.remove("on"); });
    }
  }

  /* ── the preview ── */
  var dlg = document.getElementById("pv"); if (!dlg || !dlg.showModal) return;
  var sl = dlg.querySelector(".pvsl"), th = dlg.querySelector(".pvth"), prev = dlg.querySelector(".prev"), next = dlg.querySelector(".next");
  var R = (document.querySelector('link[rel="icon"]').getAttribute("href") || "../favicon.svg").replace(/favicon\.svg.*$/, "");
  var cur = null, from = null, idx = 0, n = 0, closing = 0;
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }
  function attrs(o) { return 'data-en="' + esc(o.en) + '" data-he="' + esc(o.he || o.en) + '"'; }
  function imgTag(d, s, sizes) { var w = d.w, mid = w[1] || w[0];
    return '<img src="' + R + "img/" + s.img + "-" + mid + '.jpg" srcset="' + w.map(function (x) { return R + "img/" + s.img + "-" + x + ".jpg " + x + "w"; }).join(", ") + '" sizes="' + sizes + '" alt="' + esc(L(s.alt)) + '" data-alt-he="' + esc(s.alt.he || s.alt.en) + '" data-alt-en="' + esc(s.alt.en) + '" decoding="async">'; }
  function fill(id) {
    var d = D[id]; cur = d; var slides = [], thumbs = [];
    if (d.film) { slides.push('<li class="film"><video muted loop playsinline preload="none" poster="' + esc(d.film.poster) + '" data-src="' + esc(d.film.src) + '.mp4" data-src-sm="' + esc(d.film.src) + '-720.mp4" aria-label="' + esc(L(d.film.alt)) + '"></video></li>');
      thumbs.push('<button type="button" class="pl" aria-label="Film" data-he-label="סרט"><img src="' + esc(d.film.poster) + '" alt="" loading="lazy"></button>'); }
    d.shots.forEach(function (s, i) { slides.push("<li>" + imgTag(d, s, "(min-width: 900px) 56vw, 100vw") + "</li>");
      thumbs.push('<button type="button" aria-label="' + (i + 1) + '"><img src="' + R + "img/" + s.img + "-" + d.w[0] + '.jpg" alt="" loading="lazy"></button>'); });
    sl.innerHTML = slides.join(""); th.innerHTML = thumbs.join(""); n = slides.length; idx = 0; sl.scrollLeft = 0;
    [].forEach.call(th.children, function (b, i) { b.addEventListener("click", function () { go(i); }); });
    var k = dlg.querySelector(".pvk"), nm = dlg.querySelector(".pvn"), ln = dlg.querySelector(".pvl"), dl = dlg.querySelector(".pvkey"), pr = dlg.querySelector(".pvp");
    [[k, d.kind], [nm, d.name], [ln, d.line]].forEach(function (x) { x[0].setAttribute("data-en", x[1].en); x[0].setAttribute("data-he", x[1].he || x[1].en); x[0].innerHTML = L(x[1]); });
    dl.innerHTML = d.key.map(function (kv) { return "<dt " + attrs(kv[0]) + ">" + L(kv[0]) + "</dt><dd " + attrs(kv[1]) + ">" + L(kv[1]) + "</dd>"; }).join("");
    if (d.price) { pr.setAttribute("data-en", d.price.en); pr.setAttribute("data-he", d.price.he || d.price.en); pr.innerHTML = L(d.price); } else pr.innerHTML = "";
    dlg.querySelector(".pvgo").href = d.url;
    labels(); mark();
  }
  function mark() { [].forEach.call(th.children, function (b, i) { b.classList.toggle("on", i === idx); });
    prev.disabled = idx <= 0; next.disabled = idx >= n - 1;
    /* the film plays only while it is the picture shown */
    var v = sl.querySelector("video"); if (!v) return;
    if (idx === 0 && dlg.open) { if (!v.getAttribute("src")) v.src = v.getAttribute(innerWidth < 900 ? "data-src-sm" : "data-src"); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    else v.pause(); }
  function go(i) { idx = Math.max(0, Math.min(n - 1, i)); sl.scrollTo({ left: idx * sl.clientWidth, behavior: reduce ? "auto" : "smooth" }); mark(); }
  var st = 0; sl.addEventListener("scroll", function () { clearTimeout(st); st = setTimeout(function () { var i = Math.round(sl.scrollLeft / (sl.clientWidth || 1)); if (i !== idx) { idx = i; mark(); } }, 90); }, { passive: true });
  prev.addEventListener("click", function () { go(idx - 1); }); next.addEventListener("click", function () { go(idx + 1); });
  dlg.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") { go(idx + 1); e.preventDefault(); } else if (e.key === "ArrowLeft") { go(idx - 1); e.preventDefault(); } });
  function open(id, src) {
    if (!D[id]) return false; from = src; fill(id);
    var b = src.getBoundingClientRect(), pin = dlg.querySelector(".pvin");
    pin.style.transformOrigin = (b.left + b.width / 2) + "px " + (b.top + b.height / 2) + "px";
    clearTimeout(closing); dlg.classList.remove("out"); html.classList.add("pvlock"); dlg.showModal(); mark();
    dlg.querySelector(".pvx").focus({ preventScroll: true });
    return true; }
  function close() { if (!dlg.open || dlg.classList.contains("out")) return; var v = sl.querySelector("video"); if (v) v.pause();
    var done = function () { dlg.classList.remove("out"); dlg.close(); html.classList.remove("pvlock"); sl.innerHTML = ""; if (from) from.focus({ preventScroll: true }); };
    if (reduce) { done(); return; } dlg.classList.add("out"); closing = setTimeout(done, 200); }
  dlg.querySelector(".pvx").addEventListener("click", close);
  dlg.addEventListener("cancel", function (e) { e.preventDefault(); close(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); });
  document.addEventListener("click", function (e) { var a = e.target.closest("[data-open]"); if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    if (open(a.getAttribute("data-open"), a.closest(".v16").querySelector(".lv"))) e.preventDefault(); });

  /* labels of the controls, in the reader's language (lang14.js says the words; this says the labels) */
  function labels() { var h = he();
    [].forEach.call(document.querySelectorAll("[data-he-label]"), function (e) { if (!e.hasAttribute("data-en-label")) e.setAttribute("data-en-label", e.getAttribute("aria-label")); e.setAttribute("aria-label", e.getAttribute(h ? "data-he-label" : "data-en-label")); });
    [].forEach.call(document.querySelectorAll("[data-aria-he]"), function (e) { if (!e.hasAttribute("data-aria-en")) e.setAttribute("data-aria-en", e.getAttribute("aria-label")); e.setAttribute("aria-label", e.getAttribute(h ? "data-aria-he" : "data-aria-en")); }); }
  labels();
  new MutationObserver(function () { labels(); rigs.forEach(function (r) { r.size(); }); }).observe(html, { attributes: true, attributeFilter: ["lang"] });
})();
