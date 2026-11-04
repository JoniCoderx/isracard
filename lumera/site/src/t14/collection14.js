/* /collection14/: the filters, the arrivals, and the loupe (pointer, or a held finger on a phone) */
(function () {
  var chips = [].slice.call(document.querySelectorAll(".chf .chip")), items = [].slice.call(document.querySelectorAll("[data-cat]"));
  chips.forEach(function (c) { c.addEventListener("click", function () {
    var f = c.getAttribute("data-f"); chips.forEach(function (x) { var on = x === c; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
    items.forEach(function (it) { it.classList.toggle("hid", f !== "all" && it.getAttribute("data-cat") !== f); });
    [].forEach.call(document.querySelectorAll(".sig14, .spc14"), function (s) { s.classList.toggle("hid", !s.querySelector("[data-cat]:not(.hid)")); });
  }); });
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var els = [].slice.call(document.querySelectorAll(".cc14, .sp14"));
  [].forEach.call(document.querySelectorAll(".sp14"), function (s, i) { s.style.setProperty("--i", i); });
  if (reduce || !("IntersectionObserver" in window)) els.forEach(function (e) { e.classList.add("in"); });
  else { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: .15 });
    els.forEach(function (e) { io.observe(e); }); setTimeout(function () { els.forEach(function (e) { var r = e.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) e.classList.add("in"); }); }, 2500); }
  var Z = 2.4, RR = 95;
  [].forEach.call(document.querySelectorAll(".ccpic"), function (c) {
    var img = c.querySelector("img.a"); if (!img) return;
    var lens = document.createElement("i"); lens.className = "lens14"; lens.setAttribute("aria-hidden", "true"); c.appendChild(lens);
    var ex = 0, ey = 0, raf = 0, held = false, holdT = 0, suppress = false;
    function paint() { raf = 0; var r = c.getBoundingClientRect(), ir = img.getBoundingClientRect();
      lens.style.left = (ex - r.left) + "px"; lens.style.top = (ey - r.top - (held ? 115 : 0)) + "px";
      var s = img.currentSrc || img.src; if (lens.__s !== s) { lens.__s = s; lens.style.backgroundImage = 'url("' + s + '")'; }
      lens.style.backgroundSize = (ir.width * Z).toFixed(0) + "px " + (ir.height * Z).toFixed(0) + "px";
      lens.style.backgroundPosition = (RR - (ex - ir.left) * Z).toFixed(1) + "px " + (RR - (ey - ir.top) * Z).toFixed(1) + "px"; }
    c.addEventListener("pointerenter", function (e) { if (e.pointerType !== "mouse") return; ex = e.clientX; ey = e.clientY; c.classList.add("lens"); paint(); });
    c.addEventListener("pointermove", function (e) { if (e.pointerType !== "mouse") return; ex = e.clientX; ey = e.clientY; if (!raf) raf = requestAnimationFrame(paint); });
    c.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") c.classList.remove("lens"); });
    c.addEventListener("touchstart", function (e) { var t = e.touches[0]; ex = t.clientX; ey = t.clientY; clearTimeout(holdT);
      holdT = setTimeout(function () { held = true; suppress = true; c.classList.add("lens"); paint(); }, 280); }, { passive: true });
    c.addEventListener("touchmove", function (e) { var t = e.touches[0];
      if (!held) { if (Math.abs(t.clientX - ex) > 8 || Math.abs(t.clientY - ey) > 8) clearTimeout(holdT); return; }
      e.preventDefault(); ex = t.clientX; ey = t.clientY; if (!raf) raf = requestAnimationFrame(paint); }, { passive: false });
    var end = function () { clearTimeout(holdT); if (held) { held = false; c.classList.remove("lens"); } };
    c.addEventListener("touchend", end); c.addEventListener("touchcancel", end);
    c.addEventListener("click", function (e) { if (suppress) { e.preventDefault(); suppress = false; } });
    c.addEventListener("contextmenu", function (e) { if (held) e.preventDefault(); });
  });
})();
