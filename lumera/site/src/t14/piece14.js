/* one piece (pieces14): the gallery, the enlarged picture, the film when it is in view, and the language switch */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var g = document.querySelector(".ppg"); if (!g) return;
  var track = g.querySelector(".pptrack"), slides = [].slice.call(track.children), ths = [].slice.call(g.querySelectorAll(".ppt")), num = g.querySelector(".ppn b"), cur = 0, n = slides.length;
  function mark(i) { cur = i; ths.forEach(function (t, k) { t.classList.toggle("on", k === i); if (k === i) t.scrollIntoView({ block: "nearest", inline: "nearest" }); }); if (num) num.textContent = i + 1; film(); }
  function go(i) { i = (i + n) % n; track.scrollTo({ left: i * track.clientWidth, behavior: reduce ? "auto" : "smooth" }); mark(i); }
  var raf = 0; track.addEventListener("scroll", function () { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; var i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth)); if (i !== cur) mark(i); }); }, { passive: true });
  g.querySelector(".ppar.prev").addEventListener("click", function () { go(cur - 1); });
  g.querySelector(".ppar.next").addEventListener("click", function () { go(cur + 1); });
  ths.forEach(function (t) { t.addEventListener("click", function () { go(+t.getAttribute("data-i")); }); });
  track.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") { e.preventDefault(); go(cur + 1); } else if (e.key === "ArrowLeft") { e.preventDefault(); go(cur - 1); } });
  addEventListener("resize", function () { track.scrollTo({ left: cur * track.clientWidth }); });

  /* the film plays only while it is the slide in view and the gallery is on screen; it loads only then */
  var v = track.querySelector("video"), seen = false;
  function film() { if (!v) return; var on = seen && cur === 0 && !document.hidden;
    if (on && !v.getAttribute("src")) v.src = v.getAttribute(innerWidth < 900 ? "data-src-sm" : "data-src");
    if (on && !reduce) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); }
  if (v && "IntersectionObserver" in window) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; film(); }, { threshold: .35 }).observe(g);
  document.addEventListener("visibilitychange", film);

  /* the enlarged picture */
  var box = document.querySelector(".ppbox"), bimg = box.querySelector("img"), pics = slides.filter(function (s) { return s.querySelector(".ppz img"); }), bi = 0, back = null;
  function show(i) { bi = (i + pics.length) % pics.length; var im = pics[bi].querySelector("img"); bimg.src = im.currentSrc || im.src; bimg.alt = im.alt; }
  function open(i) { back = document.activeElement; show(i); box.hidden = false; document.documentElement.classList.add("ppopen"); box.querySelector(".ppx").focus(); }
  function close() { box.hidden = true; document.documentElement.classList.remove("ppopen"); go(slides.indexOf(pics[bi])); if (back && back.focus) back.focus(); }
  pics.forEach(function (s, i) { s.querySelector(".ppz").addEventListener("click", function () { open(i); }); });
  box.querySelector(".ppx").addEventListener("click", close);
  box.querySelector(".ppar.prev").addEventListener("click", function () { show(bi - 1); });
  box.querySelector(".ppar.next").addEventListener("click", function () { show(bi + 1); });
  box.addEventListener("click", function (e) { if (e.target === box) close(); });
  var sx = 0; box.addEventListener("pointerdown", function (e) { sx = e.clientX; }); box.addEventListener("pointerup", function (e) { if (e.pointerType === "mouse") return; var d = e.clientX - sx; if (Math.abs(d) > 40) show(bi + (d < 0 ? 1 : -1)); });
  document.addEventListener("keydown", function (e) { if (box.hidden) return; if (e.key === "Escape") close(); else if (e.key === "ArrowRight") show(bi + 1); else if (e.key === "ArrowLeft") show(bi - 1); });
})();

