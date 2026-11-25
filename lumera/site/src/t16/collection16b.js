/* /collection16b/: the kinds as text tabs, the arrivals, and the loupe (the macro photograph followed by the pointer) */
(function () {
  var tabs = [].slice.call(document.querySelectorAll(".tab")), items = [].slice.call(document.querySelectorAll("[data-cat]"));
  var bar = document.querySelector(".tabs");
  tabs.forEach(function (t) { t.addEventListener("click", function () {
    var f = t.getAttribute("data-f");
    tabs.forEach(function (x) { var on = x === t; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
    items.forEach(function (it) { var hide = f !== "all" && it.getAttribute("data-cat") !== f; it.classList.toggle("hid", hide); if (!hide) it.classList.add("in"); });
    [].forEach.call(document.querySelectorAll(".gal, .wall, .room"), function (s) { s.classList.toggle("hid", !s.querySelector("[data-cat]:not(.hid)")); });
    /* the reader stays at the top of what is shown, under the tabs */
    var first = document.querySelector(".gal:not(.hid), .room:not(.hid)");
    if (first && bar) { var bt = bar.getBoundingClientRect().top, stuck = bt < 140 && scrollY > 200;
      if (stuck) scrollTo(0, Math.max(0, first.getBoundingClientRect().top + scrollY - (bt + bar.offsetHeight) + 1)); }
  }); });

  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var els = [].slice.call(document.querySelectorAll(".ex, .rm, .mkpic, .pva"));
  if (reduce || !("IntersectionObserver" in window)) els.forEach(function (e) { e.classList.add("in"); });
  else { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: .12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (e) { io.observe(e); });
    setTimeout(function () { els.forEach(function (e) { var r = e.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) e.classList.add("in"); }); }, 2500); }

  /* the loupe: on a pointer, the lens looks closer where the pointer is (transform only; the 1254 photograph is asked for
     the first time it is used) */
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  [].forEach.call(document.querySelectorAll(".lp"), function (lp) {
    var a = lp.querySelector(".lpin"), img = a && a.querySelector("img"); if (!img) return;
    var raf = 0, x = .5, y = .5;
    function paint() { raf = 0; img.style.transformOrigin = (x * 100).toFixed(1) + "% " + (y * 100).toFixed(1) + "%"; }
    a.addEventListener("pointerenter", function (e) { if (e.pointerType !== "mouse") return;
      if (img.getAttribute("sizes") !== "1254px") img.setAttribute("sizes", "1254px");
      var r = a.getBoundingClientRect(); x = (e.clientX - r.left) / r.width; y = (e.clientY - r.top) / r.height; paint(); lp.classList.add("on"); });
    a.addEventListener("pointermove", function (e) { if (e.pointerType !== "mouse") return;
      var r = a.getBoundingClientRect(); x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)); if (!raf) raf = requestAnimationFrame(paint); });
    a.addEventListener("pointerleave", function () { lp.classList.remove("on"); });
  });
})();
