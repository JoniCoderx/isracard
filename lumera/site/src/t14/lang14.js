/* English and Hebrew: the same switch as /test14/'s, remembered under the same name */
(function () {
  var html = document.documentElement, btn = document.querySelector(".lng");
  function apply(l) {
    var he = l === "he"; html.lang = he ? "he" : "en"; html.dir = he ? "rtl" : "ltr"; if (he) html.setAttribute("data-ns", ""); else html.removeAttribute("data-ns");
    [].forEach.call(document.querySelectorAll("[data-en]"), function (e) { var t = e.getAttribute(he ? "data-he" : "data-en"); if (t != null && e.innerHTML !== t) e.innerHTML = t; });
    [].forEach.call(document.querySelectorAll("[data-alt-he]"), function (e) { if (!e.hasAttribute("data-alt-en")) e.setAttribute("data-alt-en", e.getAttribute("alt") || e.getAttribute("aria-label") || ""); var a = he ? e.getAttribute("data-alt-he") : e.getAttribute("data-alt-en"); if (e.tagName === "VIDEO") e.setAttribute("aria-label", a); else e.setAttribute("alt", a); });
    if (btn) btn.setAttribute("aria-label", he ? "English" : "עברית");
  }
  var l = "en"; try { l = localStorage.getItem("silavu-lang") === "he" ? "he" : "en"; } catch (e) {}
  if (l === "he") apply("he");
  if (btn) btn.addEventListener("click", function () { l = l === "he" ? "en" : "he"; try { localStorage.setItem("silavu-lang", l); } catch (e) {} apply(l); });
})();
