/* /test17/: the four pieces, worn, beside the SILAVU film (the house's own photographs and pages only) */
(function () {
  var sec = document.querySelector("#craft14.sg16"); if (!sec || sec.querySelector(".s17side")) return;
  var P = [["knot", "knot-worn", "MOMENT", "Bracelet", "צמיד"], ["ring", "ring-worn", "ICON", "Ring", "טבעת"], ["pave", "necklace-worn", "SOUL", "Necklace", "שרשרת"], ["aura", "aura-worn", "AURA", "Earrings", "עגילים"]];
  var side = document.createElement("div"); side.className = "s17side";
  side.innerHTML = P.map(function (p) {
    return '<a class="s17t" href="pieces16/' + p[0] + '/"><img src="img/' + p[1] + '-900.jpg" srcset="img/' + p[1] + '-640.jpg 640w, img/' + p[1] + '-900.jpg 900w, img/' + p[1] + '-1254.jpg 1254w" sizes="(min-width: 900px) 25vw, 50vw" width="900" height="900" loading="lazy" decoding="async" alt="SILAVU ' + p[2] + ', worn" data-alt-he="SILAVU ' + p[2] + ', ענוד">' +
      '<span><small data-en="' + p[3] + '" data-he="' + p[4] + '">' + p[3] + '</small><b>' + p[2] + '</b></span></a>'; }).join("");
  sec.appendChild(side);
  /* the alt text and the kind follow the language like the rest of the page */
  var he = function () { return document.documentElement.lang === "he"; };
  var sync = function () { side.querySelectorAll("[data-he]").forEach(function (e) { if (e.tagName === "SMALL") e.textContent = he() ? e.getAttribute("data-he") : e.getAttribute("data-en"); });
    side.querySelectorAll("img").forEach(function (i) { if (!i.getAttribute("data-alt-en")) i.setAttribute("data-alt-en", i.alt); i.alt = he() ? i.getAttribute("data-alt-he") : i.getAttribute("data-alt-en"); }); };
  sync(); if (window.MutationObserver) new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  dispatchEvent(new Event("resize"));   // the SILAVU word measures its new half of the screen
})();
