/* /test19/: the studio beside the film (the house's mark, used as it is, and its own studio photographs) */
(function () {
  var sec = document.querySelector("#craft14.sg16"); if (!sec || sec.querySelector(".st19")) return;
  var P = [["ring", "ring-front", "ICON"], ["knot", "knot-flat", "MOMENT"], ["pave", "necklace-front", "SOUL"], ["aura", "aura-pair", "AURA"]];
  var st = document.createElement("div"); st.className = "st19";
  var img = function (n) { return '<img src="img/' + n + '-640.jpg" srcset="img/' + n + '-640.jpg 640w, img/' + n + '-900.jpg 900w" sizes="(min-width: 900px) 12vw, 40vw" width="640" height="640" loading="lazy" decoding="async"'; };
  st.innerHTML = '<div class="st19hd"><svg viewBox="0 0 875 1000" aria-hidden="true" focusable="false"><use href="#symb"/></svg><span class="st19wm">SILAVU</span></div>' +
    '<div class="st19row">' + P.map(function (p) { return '<a class="st19p" href="pieces16/' + p[0] + '/"><span class="im">' + img(p[1]) + ' alt="SILAVU ' + p[2] + '"></span><span class="rf" aria-hidden="true">' + img(p[1]) + ' alt=""></span><b>' + p[2] + '</b></a>'; }).join("") + '</div>';
  sec.appendChild(st);
})();
