/* one piece, seductive (pieces16): the opening, the reveals, the film while it is seen, the loupe, the viewer, the bar */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var doc = document.documentElement, body = document.body;
  var he = function () { return doc.lang === "he"; };
  var rtl = function () { return doc.dir === "rtl"; };

  /* labels in both languages (aria-label), following the language switch */
  function labels() { [].forEach.call(document.querySelectorAll("[data-he-label]"), function (e) {
    if (!e.hasAttribute("data-en-label")) e.setAttribute("data-en-label", e.getAttribute("aria-label") || "");
    e.setAttribute("aria-label", he() ? e.getAttribute("data-he-label") : e.getAttribute("data-en-label")); }); }
  new MutationObserver(function () { labels(); if (vw && !vw.hidden) show(cur, true); }).observe(doc, { attributes: true, attributeFilter: ["lang"] });
  labels();

  /* 1 · the opening settles out of the dark once its photograph is ready */
  var hero = document.querySelector(".h16"), himg = hero && hero.querySelector(".h16img"), hpic = hero && hero.querySelector(".h16pic"), htxt = hero && hero.querySelector(".h16txt");
  function enter() { if (!hero || hero.classList.contains("in")) return; requestAnimationFrame(function () { hero.classList.add("in"); }); }
  if (himg) { if (himg.complete && himg.naturalWidth) enter(); else { himg.addEventListener("load", enter); himg.addEventListener("error", enter); } setTimeout(enter, 1800); }

  /* the header closes, the bar arrives (desktop), and the opening drifts slowly as it is left */
  var ab = document.querySelector(".ab16"), tick = 0;
  function onScroll() {
    tick = 0; var y = scrollY, h = innerHeight;
    body.classList.toggle("sc", y > 40);
    if (ab) ab.classList.toggle("on", y > h * .55);
    if (!reduce && hpic && y < h * 1.1) { hpic.style.transform = "translate3d(0," + (y * .32).toFixed(1) + "px,0)"; htxt.style.opacity = Math.max(0, 1 - y / (h * .55)).toFixed(3); }
  }
  addEventListener("scroll", function () { if (!tick) tick = requestAnimationFrame(onScroll); }, { passive: true });
  onScroll();

  /* 2, 3 · reveals: the piece alone opens like a curtain; the story's lines light as they reach the middle of the screen */
  var rvs = document.querySelectorAll(".rv"), lns = document.querySelectorAll(".stp .ln");
  if ("IntersectionObserver" in window && !reduce) {
    /* a clipped element never intersects, so its section is watched instead */
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.querySelector(".rv").classList.add("on"); io.unobserve(e.target); } }); }, { threshold: .22 });
    [].forEach.call(rvs, function (e) { io.observe(e.parentNode); });
    var lo = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("on"); lo.unobserve(e.target); } }); }, { rootMargin: "-30% 0px -38% 0px" });
    [].forEach.call(lns, function (e) { lo.observe(e); });
  } else { [].forEach.call(rvs, function (e) { e.classList.add("on"); }); [].forEach.call(lns, function (e) { e.classList.add("on"); }); }

  /* the film: loads when near, plays muted and looping only while it is seen, pauses when it is not */
  var v = document.querySelector(".alfilm video"), seen = false;
  function film() { if (!v) return; var on = seen && !document.hidden && !(vw && !vw.hidden);
    if (on && !v.getAttribute("src")) v.src = v.getAttribute(innerWidth < 900 ? "data-src-sm" : "data-src");
    if (on && !reduce) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause(); }
  if (v && "IntersectionObserver" in window) {
    var sec = v.closest("section");
    new IntersectionObserver(function (es) { if (es[0].isIntersecting && !v.getAttribute("src")) { v.src = v.getAttribute(innerWidth < 900 ? "data-src-sm" : "data-src"); v.preload = "auto"; } }, { rootMargin: "60% 0px" }).observe(sec);
    new IntersectionObserver(function (es) { seen = es[0].isIntersecting; film(); }, { threshold: .4 }).observe(sec);
    document.addEventListener("visibilitychange", film);
    /* with reduced motion the film waits for a touch */
    if (reduce) v.addEventListener("click", function () { if (v.paused) { if (!v.getAttribute("src")) v.src = v.getAttribute("data-src-sm"); v.play(); } else v.pause(); });
  }

  /* 4 · up close: a loupe under a mouse; a tap to look closer (and a finger to move around) on a touch screen */
  var box = document.querySelector(".lpbox");
  if (box) {
    var limg = box.querySelector(".lpimg"), lens = box.querySelector(".lplens"), li = null, Z = 2.4, L = 260;
    var z = 1, tx = 0, ty = 0, down = null, moved = false;
    function lensImg() { if (li) return; li = document.createElement("img"); li.alt = ""; li.decoding = "async"; li.src = box.getAttribute("data-full"); lens.appendChild(li); }
    function lensAt(e) { var r = box.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, W = r.width;
      li.style.width = W * Z + "px"; li.style.height = W * Z + "px";
      lens.style.transform = "translate3d(" + (x - L / 2) + "px," + (y - L / 2) + "px,0)";
      li.style.transform = "translate3d(" + (L / 2 - x * Z) + "px," + (L / 2 - y * Z) + "px,0)"; }
    box.addEventListener("pointerenter", function (e) { if (e.pointerType !== "mouse") return; lensImg(); lensAt(e); lens.classList.add("on"); });
    box.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") lens.classList.remove("on"); });
    function clamp() { var W = box.clientWidth, H = box.clientHeight; tx = Math.min(0, Math.max(W - W * z, tx)); ty = Math.min(0, Math.max(H - H * z, ty)); }
    function paint(glide) { limg.classList.toggle("glide", !!glide && !reduce); limg.style.transform = z === 1 ? "" : "translate3d(" + tx + "px," + ty + "px,0) scale(" + z + ")"; }
    box.addEventListener("pointerdown", function (e) { if (e.pointerType === "mouse") return; down = { x: e.clientX, y: e.clientY, tx: tx, ty: ty, t: Date.now() }; moved = false; if (z > 1) box.setPointerCapture(e.pointerId); });
    box.addEventListener("pointermove", function (e) {
      if (e.pointerType === "mouse") { if (li) lensAt(e); return; }
      if (!down || z === 1) return; var dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (Math.abs(dx) + Math.abs(dy) > 8) moved = true;
      if (moved) { tx = down.tx + dx; ty = down.ty + dy; clamp(); paint(false); } });
    box.addEventListener("pointerup", function (e) {
      if (e.pointerType === "mouse" || !down) return;
      var dx = e.clientX - down.x, dy = e.clientY - down.y, tap = Math.abs(dx) + Math.abs(dy) < 8 && Date.now() - down.t < 450; down = null;
      if (!tap) return;
      var r = box.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (z === 1) { z = Z; tx = x - x * z; ty = y - y * z; clamp(); box.classList.add("zoomed"); }
      else { z = 1; tx = ty = 0; box.classList.remove("zoomed"); }
      paint(true); });
    box.addEventListener("pointercancel", function () { down = null; });
    addEventListener("resize", function () { if (z > 1) { z = 1; tx = ty = 0; box.classList.remove("zoomed"); paint(false); } });
  }

  /* 6 · the viewer: every photograph full screen; arrows, Escape, a swipe */
  var vw = document.querySelector(".vw16"), cur = 0, back = null;
  if (!vw) return;
  var data = JSON.parse(vw.querySelector(".vwdata").textContent), vimg = vw.querySelector(".vwimg"), vn = vw.querySelector(".vwn b"), vcap = vw.querySelector(".vwcap"), stage = vw.querySelector(".vwstage");
  var n = data.length, pad = function (k) { return (k < 10 ? "0" : "") + k; };
  function show(i, still) {
    cur = (i + n) % n; var d = data[cur];
    var put = function () { vimg.src = d.s; vimg.alt = he() ? d.he : d.en; vcap.textContent = vimg.alt; vn.textContent = pad(cur + 1);
      var done = function () { vimg.classList.remove("out"); }; if (vimg.complete) requestAnimationFrame(done); else { vimg.onload = done; vimg.onerror = done; } };
    if (still || reduce) put(); else { vimg.classList.add("out"); setTimeout(put, 160); }
    [cur + 1, cur - 1].forEach(function (k) { var im = new Image(); im.src = data[(k + n) % n].s; });
  }
  function open(i) { back = document.activeElement; vimg.classList.remove("drag", "back"); vimg.style.transform = ""; show(i, true); vw.hidden = false; doc.classList.add("vwopen");
    requestAnimationFrame(function () { requestAnimationFrame(function () { vw.classList.add("on"); }); }); vw.querySelector(".vwx").focus({ preventScroll: true }); film(); }
  function close() { vw.classList.remove("on"); doc.classList.remove("vwopen"); setTimeout(function () { vw.hidden = true; film(); }, reduce ? 0 : 180); if (back && back.focus) back.focus({ preventScroll: true }); }
  [].forEach.call(document.querySelectorAll(".gz"), function (b) { b.addEventListener("click", function () { open(+b.getAttribute("data-i")); }); });
  vw.querySelector(".vwx").addEventListener("click", close);
  vw.querySelector(".vwar.prev").addEventListener("click", function () { show(cur - 1); });
  vw.querySelector(".vwar.next").addEventListener("click", function () { show(cur + 1); });
  document.addEventListener("keydown", function (e) {
    if (vw.hidden) return;
    var fwd = rtl() ? "ArrowLeft" : "ArrowRight", bwd = rtl() ? "ArrowRight" : "ArrowLeft";
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === fwd) { e.preventDefault(); show(cur + 1); }
    else if (e.key === bwd) { e.preventDefault(); show(cur - 1); }
    else if (e.key === "Tab") { var f = [].filter.call(vw.querySelectorAll("button"), function (b) { return b.offsetParent !== null; }); if (!f.length) return;
      var k = f.indexOf(document.activeElement); e.preventDefault(); f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
  });
  /* a swipe: the photograph follows the finger, then gives way to the next */
  var sx = null, sy = 0, dx = 0;
  stage.addEventListener("pointerdown", function (e) { if (e.pointerType === "mouse") { sx = null; return; } sx = e.clientX; sy = e.clientY; dx = 0; vimg.classList.remove("back"); vimg.classList.add("drag"); });
  stage.addEventListener("pointermove", function (e) { if (sx === null) return; dx = e.clientX - sx; vimg.style.transform = "translate3d(" + dx + "px,0,0)"; vimg.style.opacity = String(1 - Math.min(.5, Math.abs(dx) / 600)); });
  function release(e) { if (sx === null) return; var dy = e ? Math.abs(e.clientY - sy) : 0; sx = null; vimg.classList.remove("drag"); vimg.classList.add("back"); vimg.style.transform = ""; vimg.style.opacity = "";
    if (Math.abs(dx) > 50) show(cur + ((dx < 0) !== rtl() ? 1 : -1)); else if (Math.abs(dx) < 6 && dy < 6 && e && e.target === stage) close(); }
  stage.addEventListener("pointerup", release); stage.addEventListener("pointercancel", function () { release(null); });
  stage.addEventListener("click", function (e) { if (e.target === stage && e.pointerType === "mouse") close(); });
})();
