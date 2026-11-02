/* /test11/ · behaviour. Nothing here is needed to read the page: without
   it the pictures are still, the films show their first frame, and the
   bracelet shows round diamonds in white gold. */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var phone = matchMedia("(max-width: 760px)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* the parts of each section arrive in turn as it comes into view (once):
     the heading, then the words, then the picture, 70ms apart */
  var groups = [".frame .card", ".whead", ".line", ".panel", ".htexts", ".vcard", ".fcols"];
  var parts = { ".frame .card": "> *", ".whead": "> *", ".line": "> h2, > .st, > .sp", ".panel": "> h2, > .knotpic", ".htexts": "> *", ".vcard": "> *", ".fcols": "> div" };
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -12% 0px" });
    groups.forEach(function (g) {
      $$(g).forEach(function (box) {
        $$(parts[g].split(",").map(function (x) { return ":scope " + x.trim(); }).join(", "), box).forEach(function (el, i) {
          if (el.classList.contains("rv")) return;
          el.classList.add("rv"); el.style.transitionDelay = Math.min(i, 5) * 70 + "ms"; io.observe(el);
        });
      });
    });
    /* nothing stays hidden if the observer never fires (a printed page, a very tall screen) */
    setTimeout(function () { $$(".rv:not(.in)").forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add("in"); }); }, 2500);
  }

  /* films: asked for when near, played only while seen, one at a time on a phone */
  function arm(v) {
    if (v.src) return;
    var s = (phone && v.getAttribute("data-src-m")) || v.getAttribute("data-src");
    if (!s) return;
    v.src = s; v.addEventListener("playing", function () { v.classList.add("on"); }, { once: true });
  }
  if (!reduce && "IntersectionObserver" in window) {
    var near = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { arm(e.target); near.unobserve(e.target); } }); }, { rootMargin: "60% 0px" });
    var seen = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && e.intersectionRatio > .25) { arm(v); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: [0, .25, .5] });
    $$(".fvid video").forEach(function (v) { near.observe(v); seen.observe(v); });
    var hv = document.querySelector(".hvid");
    if (hv) {
      var start = function () { arm(hv); seen.observe(hv); };
      if (document.readyState === "complete") setTimeout(start, 300); else addEventListener("load", function () { setTimeout(start, 300); }, { once: true });
    }
  }

  /* worn: each picture drifts at its own rate as the band passes */
  var worn = document.querySelector(".worn"), wps = $$(".wp");
  if (worn && !reduce && !phone) {
    var ticking = false;
    var drift = function () {
      ticking = false;
      var r = worn.getBoundingClientRect(), H = innerHeight;
      if (r.bottom < 0 || r.top > H) return;
      var p = ((r.top + r.height / 2) - H / 2) / (H / 2 + r.height / 2);
      wps.forEach(function (el) { var rate = +el.getAttribute("data-rate") || 6; el.style.transform = "translate3d(0," + (p * rate * el.offsetHeight / 100).toFixed(1) + "px,0)"; });
    };
    addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(drift); } }, { passive: true });
    drift();
  }

  /* your line: the cut and the metal, the house's photograph of that bracelet */
  var pic = document.querySelector("#linepic img"), cut = "round", metal = "white";
  var CUT = { round: "round", oval: "oval", cushion: "cushion", princess: "princess", emerald: "emerald-cut", marquise: "marquise", pear: "pear", baguette: "baguette" };
  var MET = { white: "white gold", yellow: "yellow gold", rose: "rose gold", platinum: "platinum" };
  function show() {
    if (!pic) return;
    var url = "../line/" + cut + "-" + metal + "-1600.jpg", next = new Image();
    next.onload = function () {
      pic.classList.add("out");
      setTimeout(function () { pic.src = url; pic.alt = "The SILAVU line bracelet in " + CUT[cut] + " diamonds and " + MET[metal]; pic.classList.remove("out"); }, reduce ? 0 : 200);
    };
    next.src = url;
  }
  function pick(sel, attr, set) {
    $$(sel + " button").forEach(function (b) {
      b.addEventListener("click", function () {
        $$(sel + " button").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        set(b.getAttribute(attr)); show();
      });
    });
  }
  pick("#pcut", "data-cut", function (v) { cut = v; });
  pick("#pmetal", "data-metal", function (v) { metal = v; });

  /* the two cities' time, now */
  var clocks = $$("[data-tz]");
  function tick() { clocks.forEach(function (d) { try { d.textContent = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: d.getAttribute("data-tz") }).format(new Date()); } catch (e) { d.textContent = ""; } }); }
  if (clocks.length) { tick(); setInterval(tick, 30000); }

  /* the phone's menu closes on the way to a place on the page */
  var menu = document.querySelector(".pmenu");
  if (menu) $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { menu.open = false; }); });
})();
