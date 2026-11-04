/* /about13/: each section comes up once as it enters the screen; the opening
   arrives as soon as its portrait is ready. Without this, everything is shown. */
(function () {
  var secs = [].slice.call(document.querySelectorAll(".open, .vision, .facts, .make, .three"));
  [].forEach.call(document.querySelectorAll(".facts li"), function (li, i) { li.style.setProperty("--n", i); });
  var open = document.querySelector(".open"), img = open && open.querySelector("img");
  var show = function (s) { s.classList.add("in"); };
  if (open) { if (img && !img.complete) { img.addEventListener("load", function () { requestAnimationFrame(function () { show(open); }); }, { once: true }); setTimeout(function () { show(open); }, 1600); } else requestAnimationFrame(function () { show(open); }); }
  if (!("IntersectionObserver" in window)) { secs.forEach(show); return; }
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }); }, { threshold: 0.05, rootMargin: "0px 0px -12% 0px" });
  secs.forEach(function (s) { if (s !== open) io.observe(s); });
  setTimeout(function () { secs.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) show(s); }); }, 2500);
})();
/* the header takes a glass band once the page moves */
(function () { var b = document.querySelector(".bar14"); if (!b) return; var f = function () { b.classList.toggle("sc", scrollY > 30); }; addEventListener("scroll", f, { passive: true }); f(); })();
