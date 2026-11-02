/* /test12/ · behaviour. Without it: the page reads, the pieces link to
   their pages, the bracelet shows round diamonds in white gold. */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* the piece on its box settles once, and leans a little toward the pointer */
  var obj = document.querySelector(".hobj"), stage = document.querySelector(".hero");
  if (obj) {
    var arrive = function () { requestAnimationFrame(function () { obj.classList.add("in"); }); };
    if (obj.complete) arrive(); else { obj.addEventListener("load", arrive, { once: true }); setTimeout(arrive, 1500); }
    if (fine && !reduce && stage) {
      var raf = 0, nx = 0, ny = 0;
      stage.addEventListener("pointermove", function (e) {
        var r = stage.getBoundingClientRect(); nx = (e.clientX - r.left) / r.width - .5; ny = (e.clientY - r.top) / r.height - .5;
        if (!raf) raf = requestAnimationFrame(function () { raf = 0; obj.style.setProperty("--ry", (nx * 7).toFixed(2) + "deg"); obj.style.setProperty("--rx", (-ny * 5).toFixed(2) + "deg"); });
      });
      stage.addEventListener("pointerleave", function () { obj.style.setProperty("--ry", "0deg"); obj.style.setProperty("--rx", "0deg"); });
    }
  }

  /* the parts of each section rise in turn as it comes into view */
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -10% 0px" });
    [[".shead", "h2, p"], [".grid", ".tile"], [".wrow", ".wpic"], [".bctl", ".opt, .sum"], [".visit", ":scope > *"]].forEach(function (g) {
      $$(g[0]).forEach(function (box) {
        $$(g[1], box).forEach(function (el, i) { el.classList.add("rv"); el.style.transitionDelay = Math.min(i, 6) * 70 + "ms"; io.observe(el); });
      });
    });
    setTimeout(function () { $$(".rv:not(.in)").forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add("in"); }); }, 2500);
  }

  /* the loupe: the studio photograph at full size, under a lens that
     follows the pointer (or the finger, while it is held down) */
  var ZOOM = 2.6;
  $$(".tpic").forEach(function (a) {
    var lens = a.querySelector(".loupe"), url = a.getAttribute("data-zoom"), loaded = false, pressing = false, moved = false;
    function load() { if (loaded) return; loaded = true; var im = new Image(); im.src = url; lens.style.backgroundImage = "url(" + url + ")"; }
    function at(x, y) {
      var r = a.getBoundingClientRect(), px = x - r.left, py = y - r.top;
      if (px < 0 || py < 0 || px > r.width || py > r.height) { a.classList.remove("on"); return; }
      var ls = lens.offsetWidth, img = a.querySelector("img"), ir = img.getBoundingClientRect();
      var W = ir.width * ZOOM, H = ir.height * ZOOM;
      lens.style.left = px + "px"; lens.style.top = py + "px";
      lens.style.backgroundSize = W + "px " + H + "px";
      lens.style.backgroundPosition = (ls / 2 - (x - ir.left) * ZOOM).toFixed(1) + "px " + (ls / 2 - (y - ir.top) * ZOOM).toFixed(1) + "px";
      a.classList.add("on");
    }
    a.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") { load(); a.classList.add("armed"); at(e.clientX, e.clientY); } });
    a.addEventListener("pointermove", function (e) { if (e.pointerType === "mouse" || pressing) { at(e.clientX, e.clientY); if (pressing) moved = true; } });
    a.addEventListener("pointerleave", function () { a.classList.remove("on"); });
    /* on a phone: hold a finger on a piece and the loupe opens under it; slide to look; lift to close */
    var hold = 0;
    a.addEventListener("touchstart", function (e) {
      var t = e.touches[0]; moved = false; load();
      hold = setTimeout(function () { pressing = true; at(t.clientX, t.clientY); }, 260);
    }, { passive: true });
    a.addEventListener("touchmove", function (e) { if (pressing) { e.preventDefault(); var t = e.touches[0]; at(t.clientX, t.clientY); } else clearTimeout(hold); }, { passive: false });
    a.addEventListener("touchend", function (e) { clearTimeout(hold); if (pressing) { e.preventDefault(); pressing = false; a.classList.remove("on"); } });
    a.addEventListener("contextmenu", function (e) { if (pressing) e.preventDefault(); });
  });

  /* build your bracelet */
  var img = document.getElementById("bimg"), sum = document.getElementById("bsum"), go = document.getElementById("bgo");
  var state = { cut: "round", metal: "white", ct: "6", wrist: "17" };
  var CUT = { emerald: "Emerald-cut" }, MET = { white: "White gold", yellow: "Yellow gold", rose: "Rose gold", platinum: "Platinum" };
  function cutName(c) { return CUT[c] || c.charAt(0).toUpperCase() + c.slice(1); }
  function render(photo) {
    var line = cutName(state.cut) + " diamonds · " + MET[state.metal] + " · " + state.ct + " ct · " + state.wrist + " cm";
    if (sum) sum.textContent = line;
    if (go) go.href = "mailto:concierge@silavu.com?subject=" + encodeURIComponent("My SILAVU line bracelet") + "&body=" + encodeURIComponent("I would like to reserve a SILAVU line bracelet: " + line + ".");
    if (!photo || !img) return;
    var base = "../line/" + state.cut + "-" + state.metal, next = new Image();
    next.onload = function () {
      img.classList.add("out");
      setTimeout(function () { img.srcset = base + "-1000.jpg 1000w, " + base + "-1600.jpg 1600w"; img.src = base + "-1600.jpg"; img.alt = "The SILAVU line bracelet in " + cutName(state.cut).toLowerCase() + " diamonds and " + MET[state.metal].toLowerCase(); img.classList.remove("out"); }, reduce ? 0 : 200);
    };
    next.src = base + "-1600.jpg";
  }
  [["o-cut", "cut", true], ["o-metal", "metal", true], ["o-ct", "ct", false], ["o-wrist", "wrist", false]].forEach(function (o) {
    $$("#" + o[0] + " button").forEach(function (b) {
      b.addEventListener("click", function () {
        $$("#" + o[0] + " button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        state[o[1]] = b.getAttribute("data-v"); render(o[2]);
      });
    });
  });
  render(false);

  /* the two cities' time, now */
  var clocks = $$("[data-tz]");
  function tick() { clocks.forEach(function (d) { try { d.textContent = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: d.getAttribute("data-tz") }).format(new Date()); } catch (e) { d.textContent = ""; } }); }
  if (clocks.length) { tick(); setInterval(tick, 30000); }
})();
