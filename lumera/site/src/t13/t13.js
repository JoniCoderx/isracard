/* /test13/: the bracelet builder as a studio, one step at a time. The five
   questions keep their own buttons (the bracelet and the price follow them
   exactly as before); this adds the way through them: five bars that show
   where you are and take you to any step, the question in words, Back and
   Next, and the line you are building written on the stage. Without this
   script the builder is what it was. */
(function () {
  function init() {
    var opts = document.getElementById("opts"), stage = document.getElementById("stripwrap");
    if (!opts || opts.querySelector(".b13nav")) return;
    var groups = [].slice.call(opts.querySelectorAll(".opt"));
    if (groups.length < 2 || !groups[0].querySelector(".opthead")) return setTimeout(init, 120);
    var he = function () { return document.documentElement.getAttribute("data-lang") === "he"; };
    var W = { step: ["Step", "שלב"], of: ["of", "מתוך"], back: ["Back", "חזרה"], next: ["Next", "הבא"], done: ["Review and reserve", "לסיכום ולשריון"] };
    var t = function (k) { return W[k][he() ? 1 : 0]; };
    var title = function (g) { var k = g.querySelector(".opthead > .k"); return k ? k.textContent.trim() : ""; };
    var answer = function (g) { var on = g.querySelector(".chip.on"); return on ? on.textContent.trim() : ""; };

    var nav = document.createElement("div"); nav.className = "b13nav";
    nav.innerHTML = '<div class="b13bars" role="tablist"></div><div class="b13head"><span class="b13n k"></span><span class="b13t"></span></div>';
    var bars = nav.querySelector(".b13bars");
    groups.forEach(function (g, i) {
      var b = document.createElement("button"); b.type = "button"; b.className = "b13bar"; b.setAttribute("role", "tab");
      b.innerHTML = '<i></i><span class="b13bl"></span><span class="b13ba"></span>';
      b.addEventListener("click", function () { go(i); });
      bars.appendChild(b);
    });
    opts.insertBefore(nav, opts.firstChild);
    var ft = document.createElement("div"); ft.className = "b13ft";
    ft.innerHTML = '<button type="button" class="b13back"></button><button type="button" class="b13next"><span></span><i aria-hidden="true"></i></button>';
    opts.appendChild(ft);
    var back = ft.querySelector(".b13back"), next = ft.querySelector(".b13next");

    function cur() { for (var i = 0; i < groups.length; i++) if (groups[i].classList.contains("open")) return i; return 0; }
    function go(i) {
      i = Math.max(0, Math.min(groups.length - 1, i));
      if (!groups[i].classList.contains("open")) { var h = groups[i].querySelector(".opthead"); if (h) h.click(); }
      paint();
    }
    function paint() {
      var c = cur();
      [].forEach.call(bars.children, function (b, i) {
        b.classList.toggle("on", i === c); b.classList.toggle("done", i < c);
        b.setAttribute("aria-selected", i === c ? "true" : "false");
        b.querySelector(".b13bl").textContent = title(groups[i]);
        b.querySelector(".b13ba").textContent = answer(groups[i]);
      });
      nav.querySelector(".b13n").textContent = t("step") + " " + (c + 1) + " " + t("of") + " " + groups.length;
      nav.querySelector(".b13t").textContent = title(groups[c]);
      back.textContent = t("back"); back.disabled = c === 0;
      next.querySelector("span").textContent = c < groups.length - 1 ? t("next") + " · " + title(groups[c + 1]) : t("done");
      opts.setAttribute("data-step", String(c));
    }
    back.addEventListener("click", function () { go(cur() - 1); });
    next.addEventListener("click", function () {
      var c = cur();
      if (c < groups.length - 1) return go(c + 1);
      var tot = document.querySelector("#configure .total"), r = document.getElementById("reserve");
      if (tot) tot.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
      if (r) setTimeout(function () { r.focus({ preventScroll: true }); r.classList.add("b13ping"); setTimeout(function () { r.classList.remove("b13ping"); }, 1400); }, 500);
    });
    opts.addEventListener("click", function (e) { if (e.target.closest(".chip")) setTimeout(paint, 0); });
    addEventListener("silavu:build", paint);
    if (window.MutationObserver) new MutationObserver(function () { setTimeout(paint, 0); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang"] });

    /* the line being built, written small on the stage */
    var lsum = document.getElementById("lsum");
    if (stage && lsum) {
      var live = document.createElement("div"); live.className = "b13live"; live.setAttribute("aria-hidden", "true");
      live.innerHTML = '<span class="k"></span><b></b>';
      stage.appendChild(live);
      var copy = function () { live.querySelector("b").textContent = lsum.textContent.trim(); live.querySelector(".k").textContent = he() ? "הצמיד שלכם" : "Your line"; };
      copy(); if (window.MutationObserver) new MutationObserver(copy).observe(lsum, { childList: true, characterData: true, subtree: true });
    }
    paint();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 0); });
  else setTimeout(init, 0);
})();

/* the collection: on a computer, the photograph zooms in under the pointer and
   follows it, like a loupe inside the frame (the worn photograph stays one
   arrow away instead of taking over on hover) */
(function () {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  function init() {
    [].forEach.call(document.querySelectorAll(".pgrid .piece:not(.soon) .fig"), function (f) {
      var raf = 0, x = 50, y = 50;
      function set() { raf = 0; f.style.setProperty("--zx", x.toFixed(1) + "%"); f.style.setProperty("--zy", y.toFixed(1) + "%"); }
      function at(e) { var r = f.getBoundingClientRect(); x = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)); y = Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100)); if (!raf) raf = requestAnimationFrame(set); }
      f.addEventListener("pointerenter", function (e) { if (e.pointerType !== "mouse") return; at(e); set(); f.classList.add("z13"); });
      f.addEventListener("pointermove", function (e) { if (e.pointerType === "mouse") at(e); });
      f.addEventListener("pointerleave", function () { f.classList.remove("z13"); });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
