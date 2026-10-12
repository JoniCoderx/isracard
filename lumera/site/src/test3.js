/* /test3/: the close-up photographs open once, as they come into view */
(function () {
  var d = document.getElementById("details");
  if (!d || matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("dtgo");
  var io = new IntersectionObserver(function (es) {
    if (es.some(function (e) { return e.isIntersecting; })) { d.classList.add("in"); io.disconnect(); }
  }, { rootMargin: "0px 0px -18% 0px" });
  io.observe(d);
})();

/* Build your bracelet: the photograph of the bracelet chosen. It follows the
   cut and the metal (a hovered metal is shown, as the 3D does), and changes
   by a short cross-fade once the next picture is decoded, so it never
   blinks. A press on the picture opens the 3D. */
(function () {
  var w = document.getElementById("stripwrap"), box = w && w.querySelector(".bph");
  if (!box) return;
  var ims = box.querySelectorAll("img"), front = 0, shown = "", want = "", note = w.querySelector(".bphnote");
  var label = function (k) { var c = document.querySelector('#opts .chip.on[data-k="' + k + '"]'); return c ? c.textContent.trim() : ""; };
  function src(k, wd) { return "line/" + k + "-" + wd + ".jpg"; }
  function show() {
    var b = window.__build || {}, k = (b.cut || "round") + "-" + (window.__preview || b.metal || "white");
    if (note) note.hidden = (b.ct || 6) === 6;
    var alt = [label("cut"), label("metal")].filter(Boolean).join(" · ");
    if (k === shown || k === want) { ims[front].alt = alt; return; }
    want = k;
    var next = ims[1 - front];
    next.sizes = "(min-width: 900px) 52vw, 100vw";
    next.srcset = src(k, 1000) + " 1000w, " + src(k, 1600) + " 1600w";
    next.src = src(k, 1000);
    next.alt = alt;
    var done = function () {
      if (want !== k) return;
      next.classList.add("on"); ims[front].classList.remove("on"); ims[front].alt = "";
      front = 1 - front; shown = k; want = "";
    };
    (next.decode ? next.decode() : Promise.resolve()).then(done, done);
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("#opts .chip")) setTimeout(show, 0);
  });
  var opts = document.getElementById("opts");
  if (opts) {
    opts.addEventListener("mouseover", function (e) { if (e.target.closest('.chip[data-k="metal"]')) setTimeout(show, 0); });
    opts.addEventListener("mouseout", function (e) { if (e.target.closest('.chip[data-k="metal"]')) setTimeout(show, 0); });
  }
  var to3d = function () { var b = w.querySelector('.vtb[data-view="line"]'); if (b) b.click(); };
  box.addEventListener("click", to3d);
  /* front, side, detail and inspect are places for the camera: they open the 3D */
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("[data-vpos]") && w.classList.contains("photo")) to3d(); }, true);
  /* the first picture is asked for only as the chapter comes near */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) { io.disconnect(); show(); } }, { rootMargin: "120% 0px" });
    io.observe(w);
  } else show();
})();

/* The box: the photograph for the line on screen. The film's own machine
   still chooses the line and fades the chapter in and out; the photographs
   follow it, one at a time. */
(function () {
  var box = document.querySelector("#inside .bxph"), cv = document.getElementById("boxcv"), beats = document.querySelectorAll("#beats .beat");
  if (!box || !beats.length) return;
  var ims = box.querySelectorAll("img"), at = 0;
  function sync() {
    var k = 0; for (var i = 0; i < beats.length; i++) if (beats[i].classList.contains("on")) k = i;
    if (k !== at && ims[k]) { ims[at].classList.remove("on"); ims[k].classList.add("on"); at = k; }
    if (cv) box.style.opacity = cv.style.opacity;
  }
  var mo = new MutationObserver(sync);
  for (var i = 0; i < beats.length; i++) mo.observe(beats[i], { attributes: true, attributeFilter: ["class"] });
  if (cv) mo.observe(cv, { attributes: true, attributeFilter: ["style"] });
  /* the next photograph is asked for before it is needed */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); ims.forEach(function (im) { im.loading = "eager"; }); } }, { rootMargin: "150% 0px" });
    io.observe(document.getElementById("inside"));
  }
  sync();
})();
