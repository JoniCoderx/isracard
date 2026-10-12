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
