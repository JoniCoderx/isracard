/* /test18/: the pieces floating over the film beside the glass word (the house's own photographs and pages only) */
(function () {
  var sec = document.querySelector("#craft14.sg16"), fig = sec && sec.querySelector(".sg16reel"); if (!fig || fig.querySelector(".f18")) return;
  var P = [["knot", "knot-flat", "MOMENT", "Bracelet", "צמיד"], ["ring", "ring-front", "ICON", "Ring", "טבעת"], ["pave", "necklace-front", "SOUL", "Necklace", "שרשרת"], ["aura", "aura-pair", "AURA", "Earrings", "עגילים"]];
  var box = document.createElement("div"); box.className = "f18";
  box.innerHTML = '<svg class="f18arc" viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true"><path class="a" d="M -20 170 C 220 60, 520 40, 760 90 S 980 170, 1040 120"/><path class="g" pathLength="1490" d="M -20 170 C 220 60, 520 40, 760 90 S 980 170, 1040 120"/></svg>' +
    '<div class="f18cards">' + P.map(function (p) {
      return '<a class="f18c" href="pieces16/' + p[0] + '/"><span class="f18in"><img src="img/' + p[1] + '-640.jpg" srcset="img/' + p[1] + '-640.jpg 640w, img/' + p[1] + '-900.jpg 900w" sizes="(min-width: 900px) 12vw, 25vw" width="640" height="640" loading="lazy" decoding="async" alt="SILAVU ' + p[2] + '">' +
        '<b>' + p[2] + '<small data-en="' + p[3] + '" data-he="' + p[4] + '">' + p[3] + '</small></b></span></a>'; }).join("") + '</div>';
  fig.appendChild(box);
  var he = function () { return document.documentElement.lang === "he"; };
  var sync = function () { box.querySelectorAll("small[data-he]").forEach(function (e) { e.textContent = he() ? e.getAttribute("data-he") : e.getAttribute("data-en"); }); };
  sync(); if (window.MutationObserver) new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  /* the glass word moves to its own half: set after the page's own fitting, on every size */
  function place() { var lens = fig.querySelector(".sg16lens"); if (!lens) return; var w = fig.clientWidth, h = fig.clientHeight, phone = w < 900;
    var fs = Math.round(phone ? Math.min(w * .25, h * .3) : Math.min(w * .112, h * .34 / .7)), x = phone ? w / 2 : (he() ? w * .75 : w * .25), y = Math.round(phone ? h * .36 : h / 2 + fs * .35);
    [].forEach.call(sec.querySelectorAll(".sg16t"), function (t) { t.setAttribute("x", x); t.setAttribute("y", y); t.setAttribute("font-size", fs); }); }
  place(); addEventListener("resize", function () { setTimeout(place, 0); }); if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(place, 0); });
  if (window.MutationObserver) new MutationObserver(function () { setTimeout(place, 0); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "dir"] });
  setTimeout(place, 400);
  /* the cards float and the light runs only while the film is on screen */
  new IntersectionObserver(function (es) { fig.classList.toggle("f18on", es[0].isIntersecting); }, { threshold: .1 }).observe(fig);
  /* on a computer, each card leans a little toward the pointer */
  if (matchMedia("(hover: hover) and (pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches)
    box.querySelectorAll(".f18c").forEach(function (c) {
      c.addEventListener("pointermove", function (e) { var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.setProperty("--ry", (x * 12).toFixed(1) + "deg"); c.style.setProperty("--rx", (y * -12).toFixed(1) + "deg"); });
      c.addEventListener("pointerleave", function () { c.style.setProperty("--ry", "0deg"); c.style.setProperty("--rx", "0deg"); }); });
})();
