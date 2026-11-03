/* /test14/: the craft film plays where it sits, on a touch; nothing else moves on its own */
(function () {
  var b = document.querySelector("#craft14 .crvid"); if (!b) return;
  var v = b.querySelector("video");
  b.addEventListener("click", function () {
    if (!v.getAttribute("src")) v.setAttribute("src", v.getAttribute("data-src"));
    if (v.paused) { v.play().catch(function () {}); b.classList.add("playing"); b.setAttribute("aria-label", b.getAttribute("data-pause") || "Pause"); }
    else { v.pause(); b.classList.remove("playing"); b.setAttribute("aria-label", b.getAttribute("data-play") || "Play"); }
  });
})();
