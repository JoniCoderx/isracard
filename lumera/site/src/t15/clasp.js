/* The clasp (the house chose it, 23 Nov 2026, from three proposals): a heading whose letters arrive in two halves,
   top and bottom sliding in from either side, meeting like a clasp closing, with a thin gold seam flashing across
   the word as it locks. Under the pointer the letters nearest it open a little, showing the gold seam inside.
   Plays once, as the heading comes into view. The heading keeps its words for screen readers (aria-label); reduced
   motion leaves it as it is. Used by /test15/ (Enquire) and /collection14/ (The SILAVU collection). */
window.__clasp = function (h) {
  if (!h || h.__clasp) return; h.__clasp = 1;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, fine = matchMedia("(hover: hover) and (pointer: fine)").matches, root = document.documentElement;
  if (reduce) return;
  var chars = [], seam = null, timers = [], played = false, finished = false, busy = false, raf = 0, mx = -999, my = -999;
  function joined() { return root.getAttribute("data-lang") === "ar"; }   /* Arabic letters join: it closes word by word */
  function split() { var txt = h.textContent.replace(/\s+/g, " ").trim(); if (!txt) return false;
    busy = true; h.setAttribute("aria-label", txt); h.textContent = ""; chars = [];
    txt.split(" ").forEach(function (w, wi) { if (wi) h.appendChild(document.createTextNode(" ")); var ws = document.createElement("span"); ws.className = "clpw"; ws.setAttribute("aria-hidden", "true"); if (/[A-Za-z0-9]/.test(w) && !/[\u0590-\u06FF]/.test(w)) ws.setAttribute("dir", "ltr");   /* a Latin word inside Hebrew keeps its own order */
      (joined() ? [w] : Array.from(w)).forEach(function (ch) { var s = document.createElement("span"); s.className = "clpc"; s.style.setProperty("--i", chars.length); s.textContent = ch; s.setAttribute("data-c", ch); ws.appendChild(s); chars.push(s); });   /* the halves are drawn from data-c, so the text reads once */
      h.appendChild(ws); });
    seam = document.createElement("i"); seam.className = "clpseam"; seam.setAttribute("aria-hidden", "true"); h.appendChild(seam);
    h.style.setProperty("--clps", getComputedStyle(h).direction === "rtl" ? -1 : 1); h.classList.add("clp");
    busy = false; return true; }
  function state() { h.classList.toggle("clpwait", !played); h.classList.toggle("clpgo", played); h.classList.toggle("clpdone", finished); }
  function play() { if (played) return; played = true; finished = false; timers.forEach(clearTimeout); timers = []; h.classList.remove("clpgo", "clpdone"); h.classList.add("clpwait"); void h.offsetWidth;
    requestAnimationFrame(function () { h.classList.remove("clpwait"); h.classList.add("clpgo"); });
    var lock = chars.length * 34 + 620;
    timers.push(setTimeout(function () { place(); seam.classList.add("on"); }, lock));
    timers.push(setTimeout(function () { finished = true; h.classList.add("clpdone"); }, lock + 420));
    timers.push(setTimeout(function () { seam.classList.remove("on"); }, lock + 1300)); }
  /* the seam runs the length of the line it closes, at the middle of the letters */
  function place() { if (!chars.length || !seam) return; var hr = h.getBoundingClientRect(), a = chars[0].getBoundingClientRect(), z = chars[chars.length - 1].getBoundingClientRect(), l = Math.min(a.left, z.left), r = Math.max(a.right, z.right);
    seam.style.left = (l - hr.left - 24) + "px"; seam.style.width = (r - l + 48) + "px"; seam.style.top = (a.top - hr.top + a.height / 2) + "px"; }
  h.style.setProperty("--clpink", getComputedStyle(h).color);
  if (!split()) return; state();
  /* the page writes the heading again (its own reveal, a change of language): close it again where it now is */
  new MutationObserver(function () { if (busy || h.querySelector(".clpc")) return; requestAnimationFrame(function () { if (h.querySelector(".clpc")) return; if (!split()) return;
    if (played && !finished) { played = false; play(); } else state(); }); }).observe(h, { childList: true });
  if (window.IntersectionObserver) new IntersectionObserver(function (es, io) { if (es[0].isIntersecting) { io.disconnect(); play(); } }, { threshold: .9, rootMargin: "0px 0px -15% 0px" }).observe(h);
  else { played = finished = true; state(); }
  if (fine) {
    function hover() { raf = 0; if (!finished) return; chars.forEach(function (c) { var r = c.getBoundingClientRect(), d = Math.hypot(r.left + r.width / 2 - mx, (r.top + r.height / 2 - my) * 1.4), k = Math.max(0, 1 - d / 120); c.style.setProperty("--k", k.toFixed(2)); }); }
    h.addEventListener("pointermove", function (e) { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(hover); });
    h.addEventListener("pointerleave", function () { chars.forEach(function (c) { c.style.setProperty("--k", 0); }); });
  }
};
