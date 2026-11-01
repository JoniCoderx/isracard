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

/* SOUL, in three dimensions (#soul3d): 96 rendered frames, played by the
   scroll. The frames are fetched only when the chapter is near, decoded off
   the main thread (createImageBitmap from the file's bytes), coarse to fine,
   so the whole move works at once and sharpens as the rest arrive. A frame is
   drawn only when the scroll asks for a different one. */
(function () {
  var sec = document.getElementById("soul3d");
  if (!sec || !window.createImageBitmap) return;
  var cv = sec.querySelector("canvas"), cx = cv.getContext("2d"), ws = [].slice.call(sec.querySelectorAll(".s3w")), st = sec.style;
  var NF = 96, PHONE = matchMedia("(max-width: 899px)").matches, REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dir = "soul3d/" + (PHONE ? 600 : 864) + "/", bm = [], order = [], shown = -1, now = 0, raf = 0, started = false;
  [16, 8, 4, 2, 1].forEach(function (s) { for (var i = 0; i < NF; i += s) if (order.indexOf(i) < 0) order.push(i); });
  order.splice(1, 0, NF - 1);
  function load(i) {
    return fetch(dir + "f" + ("00" + i).slice(-3) + ".webp").then(function (r) { return r.blob(); }).then(createImageBitmap)
      .then(function (b) { bm[i] = b; }, function () {}).then(function () { shown = -1; tick(); });
  }
  function start() {
    if (started) return; started = true;
    var k = 0, lane = function () { if (k < order.length) return load(order[k++]).then(lane); };
    lane(); lane(); lane(); lane();
  }
  function size() {
    var W = innerWidth, H = innerHeight, s = PHONE ? Math.min(W * 1.04, H * 0.56) : Math.min(H * 0.84, W * 0.46);
    st.setProperty("--s3", s + "px");
    var d = Math.min(window.devicePixelRatio || 1, 2); cv.width = cv.height = Math.round(Math.min(s * d, PHONE ? 600 : 864)); shown = -1;
    var bg = getComputedStyle(sec).backgroundColor; if (bg && bg !== "rgba(0, 0, 0, 0)") st.setProperty("--s3bg", bg);
  }
  function near(i) { for (var d = 0; d < NF; d++) { if (bm[i - d]) return bm[i - d]; if (bm[i + d]) return bm[i + d]; } return null; }
  var sm = function (x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  function frame() {
    raf = 0;
    var r = sec.getBoundingClientRect(), t = REDUCED ? 1 : Math.max(0, Math.min(1, -r.top / (r.height - innerHeight)));
    var want = t * (NF - 1); now += (want - now) * (REDUCED ? 1 : 0.2); if (Math.abs(want - now) < 0.05) now = want;
    var i = Math.round(now), b;
    if (i !== shown && (b = near(i))) { shown = i; cx.clearRect(0, 0, cv.width, cv.height); cx.drawImage(b, 0, 0, cv.width, cv.height); }
    var out = sm((t - 0.3) / 0.16) - sm((t - 0.72) / 0.16);
    st.setProperty("--s3r", (1 + out * 1.1).toFixed(3)); st.setProperty("--s3o", (1 - out).toFixed(3)); st.setProperty("--s3p", t.toFixed(4));
    ws.forEach(function (w) { w.classList.toggle("on", t >= +w.dataset.from && t < +w.dataset.to); });
    if (now !== want) tick();
  }
  function tick() { if (!raf) raf = requestAnimationFrame(frame); }
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting) start(); }, { rootMargin: "150% 0px" }).observe(sec);
  else start();
  addEventListener("scroll", function () { if (started) tick(); }, { passive: true });
  addEventListener("resize", function () { size(); tick(); });
  size(); tick();
})();
