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

/* the collection: on a computer, hovering a piece shows it worn (the page's
   own cross-fade) and a small round lens magnifies the photograph under the
   pointer, whichever photograph is showing */
(function () {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  var Z = 2.4;
  function init() {
    [].forEach.call(document.querySelectorAll(".pgrid .piece:not(.soon) .fig.swp"), function (f) {
      if (f.querySelector(".lp13")) return;
      var lens = document.createElement("i"); lens.className = "lp13"; lens.setAttribute("aria-hidden", "true"); f.appendChild(lens);
      var raf = 0, ex = 0, ey = 0;
      function shown() {
        var w = f.querySelector(".im.hx.hvr.hvon img"); if (w && w.currentSrc) return w;
        var all = f.querySelectorAll(".im img"), r = f.getBoundingClientRect(), best = null;
        for (var i = 0; i < all.length; i++) { var b = all[i].getBoundingClientRect(); if (Math.abs(b.left - r.left) < r.width / 2 && getComputedStyle(all[i].parentNode).opacity !== "0") { best = all[i]; break; } }
        return best || all[0];
      }
      function paint() {
        raf = 0; var img = shown(); if (!img) return;
        var r = f.getBoundingClientRect(), ir = img.getBoundingClientRect(), x = ex - r.left, y = ey - r.top;
        lens.style.transform = ""; lens.style.left = x + "px"; lens.style.top = y + "px";
        var src = img.currentSrc || img.src; if (lens.__src !== src) { lens.__src = src; lens.style.backgroundImage = "url(\"" + src + "\")"; }
        lens.style.backgroundSize = (ir.width * Z).toFixed(0) + "px " + (ir.height * Z).toFixed(0) + "px";
        lens.style.backgroundPosition = (75 - (ex - ir.left) * Z).toFixed(1) + "px " + (75 - (ey - ir.top) * Z).toFixed(1) + "px";
      }
      f.addEventListener("pointerenter", function (e) { if (e.pointerType !== "mouse") return; ex = e.clientX; ey = e.clientY; f.classList.add("lp13on"); paint(); });
      f.addEventListener("pointermove", function (e) { if (e.pointerType !== "mouse") return; ex = e.clientX; ey = e.clientY; if (!raf) raf = requestAnimationFrame(paint); });
      f.addEventListener("pointerleave", function () { f.classList.remove("lp13on"); });
      /* the worn photograph arrives a moment after the pointer: follow it */
      f.addEventListener("transitionend", function () { if (f.classList.contains("lp13on") && !raf) raf = requestAnimationFrame(paint); });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

/* the kind of each piece, written small on its photograph */
(function () {
  function init() {
    [].forEach.call(document.querySelectorAll(".pgrid .piece:not(.soon)"), function (pc) {
      var kd = pc.querySelector(".bd .t .kd"), fig = pc.querySelector(".fig");
      if (!kd || !fig || fig.querySelector(".k13")) return;
      var tag = document.createElement("span"); tag.className = "k13"; tag.setAttribute("aria-hidden", "true");
      var paint = function () { tag.textContent = kd.textContent.trim(); };
      paint(); fig.appendChild(tag);
      if (window.MutationObserver) new MutationObserver(paint).observe(kd, { childList: true, characterData: true, subtree: true });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

/* Up close: three prints on the table. They develop as they arrive, and a
   tap turns one over to what it shows and the way to the piece. */
(function () {
  function init() {
    var sec = document.getElementById("details"); if (!sec) return;
    var he = function () { return document.documentElement.getAttribute("data-lang") === "he"; };
    [].forEach.call(sec.querySelectorAll(".wlk"), function (w) {
      if (w.querySelector(".w13")) return;
      var pic = w.querySelector(".wlkpic"), cap = w.querySelector("figcaption"), nm = w.querySelector(".wlknm"), kd = cap && cap.querySelector(".k");
      if (!pic || !cap || !nm) return;
      var href = pic.getAttribute("href"), alt = (pic.querySelector("img") || {}).alt || "";
      var inner = document.createElement("div"); inner.className = "w13";
      var front = document.createElement("div"); front.className = "w13f";
      front.appendChild(pic); front.appendChild(cap);
      var back = document.createElement("div"); back.className = "w13b";
      back.innerHTML = '<button type="button" class="w13back"></button><span class="k"></span><b></b><p></p><a></a>';
      back.querySelector("a").href = href;
      inner.appendChild(front); inner.appendChild(back); w.appendChild(inner);
      var paint = function () {
        back.querySelector(".k").textContent = kd ? kd.textContent.trim() : "";
        back.querySelector("b").textContent = nm.textContent.trim();
        back.querySelector("p").textContent = alt;
        back.querySelector("a").textContent = he() ? "לצפייה בתכשיט" : "View the piece";
        back.querySelector(".w13back").textContent = he() ? "חזרה" : "Turn back";
      };
      paint();
      if (window.MutationObserver) new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang"] });
      /* the photograph no longer leaves the page: it turns the print over */
      pic.addEventListener("click", function (e) { e.preventDefault(); w.classList.add("flip"); });
      nm.addEventListener("click", function (e) { e.preventDefault(); w.classList.add("flip"); });
      back.querySelector(".w13back").addEventListener("click", function (e) { e.stopPropagation(); w.classList.remove("flip"); });
      w.setAttribute("tabindex", "-1");
    });
    /* the table: the prints on dark leather, an envelope beneath, a warm side light over all */
    var row = sec.querySelector(".wlkrow");
    if (row && !sec.querySelector(".atl")) {
      var atl = document.createElement("div"); atl.className = "atl";
      row.parentNode.insertBefore(atl, row); atl.appendChild(row);
      var env = document.createElement("div"); env.className = "env"; env.setAttribute("aria-hidden", "true"); env.innerHTML = "<b>SILAVU</b>";
      atl.insertBefore(env, row);
      var lt = document.createElement("i"); lt.className = "atlight"; lt.setAttribute("aria-hidden", "true"); atl.appendChild(lt);
      sec.classList.add("atl13");
    }
    var settle = function () { sec.classList.add("dev"); setTimeout(function () { sec.classList.add("settled"); }, 1900); };
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) { settle(); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { settle(); io.disconnect(); } }); }, { threshold: 0.25 });
    io.observe(sec.querySelector(".wlkrow") || sec);
    setTimeout(function () { var r = sec.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0 && !sec.classList.contains("dev")) settle(); }, 3000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

/* no logo screen on the way in: if the browser would not remember that the
   page has been seen, enter it at once anyway */
(function () {
  function go() { var i = document.getElementById("intro"), b = document.getElementById("enterBtn"); if (i && b && !i.classList.contains("gone") && !i.classList.contains("off")) b.click(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(go, 0); }); else setTimeout(go, 0);
})();

/* the signature in the bracelet (#sig13). When the stage comes into view the
   bracelet arrives and the name writes itself inside it in one line; then the
   scroll is the camera: the bracelet leans back, a band of light crosses its
   stones, and at the end it falls away into the white that rises to meet the
   collection. Transform and opacity only; the scroll is followed smoothly. */
(function () {
  var sec = document.getElementById("sig13"); if (!sec) return;
  var pin = sec.querySelector(".s13pin"), obj = sec.querySelector(".s13obj"), line = sec.querySelector(".s13line"), tip = sec.querySelector(".s13tip"), tide = sec.querySelector(".s13tide"), sig = sec.querySelector(".s13sig");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var L = line.getTotalLength(); line.style.strokeDasharray = L; line.style.strokeDashoffset = reduce ? 0 : L;
  if (reduce) { sec.classList.add("in", "signed"); return; }
  var drawn = 0, t0 = 0, writing = false, p = -1, target = 0, raf = 0, last = 0;
  var c01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var seg = function (a, b) { return c01((p - a) / (b - a)); };
  function setDraw(d) {
    drawn = d; line.style.strokeDashoffset = (L * (1 - d)).toFixed(1);
    if (d > 0 && d < 1) { var pt = line.getPointAtLength(L * d); tip.setAttribute("cx", pt.x.toFixed(1)); tip.setAttribute("cy", pt.y.toFixed(1)); tip.style.opacity = .9; }
    else tip.style.opacity = 0;
    if (d >= .999) sec.classList.add("signed");
  }
  function place() {
    /* 0 to .22: still; .22 to .7: it leans back and turns a little, the light crosses; .7 to 1: it falls into the tide */
    var lean = ease(seg(.18, .56)), fall = ease(seg(.56, 1)), sweep = seg(.2, .62);
    var y = lean * 6 + fall * 46, rx = lean * 22 + fall * 30, rz = -lean * 5 - fall * 8, s = 1 + lean * .05 - fall * .1;
    obj.style.transform = "translate3d(0," + y.toFixed(2) + "vh,0) rotateX(" + rx.toFixed(2) + "deg) rotateZ(" + rz.toFixed(2) + "deg) scale(" + s.toFixed(4) + ")";
    obj.style.setProperty("--sx", (-40 + sweep * 180).toFixed(1) + "%");
    sig.style.opacity = (1 - seg(.62, .82)).toFixed(3);
    tide.style.setProperty("--ty", (101 - ease(seg(.5, .96)) * 101).toFixed(2) + "%");
    /* a reader who scrolls on before the name is finished sees it finished by the scroll */
    var byScroll = c01(p / .18); if (byScroll > drawn) setDraw(byScroll);
  }
  function frame(now) {
    raf = 0;
    var dt = last ? Math.min(100, now - last) : 16.7; last = now;
    if (writing) { var d = c01((now - t0) / 2600); d = ease(d); if (d > drawn) setDraw(d); if (d >= 1) writing = false; }
    var k = 1 - Math.pow(.86, dt / 16.667);
    p = p < 0 ? target : p + (target - p) * k; if (Math.abs(target - p) < .0005) p = target;
    place();
    if (writing || p !== target) raf = requestAnimationFrame(frame); else last = 0;
  }
  function measure() {
    var r = pin.getBoundingClientRect(), span = r.height - innerHeight;
    target = c01(-r.top / Math.max(1, span));
    if (r.top < innerHeight * .6 && r.bottom > 0 && !sec.classList.contains("in")) {
      sec.classList.add("in"); setTimeout(function () { if (drawn < 1) { writing = true; t0 = performance.now(); if (!raf) raf = requestAnimationFrame(frame); } }, 700);
    }
    if (!raf) raf = requestAnimationFrame(frame);
  }
  addEventListener("scroll", measure, { passive: true }); addEventListener("resize", measure);
  measure();
})();
