/* /test2/: the living collection, "Find her piece", and the buttons' hover. */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
  var conn = navigator.connection || {}, thin = !!conn.saveData || /(^|[^0-9])2g$/.test(conn.effectiveType || "");
  var he = function () { return (document.documentElement.lang || "en") === "he"; };

  /* ── the buttons: ring, sheen, a light under the pointer, a lean toward the hand ── */
  if (fine && !reduce) {
    document.documentElement.classList.add("xhov");
    var dress = function (b) {
      if (b.querySelector(":scope > .x-ring")) return;
      if (b.__dressed) { var s0 = document.createElement("i"), r0 = document.createElement("i"); s0.className = "x-sheen"; r0.className = "x-ring";
        s0.setAttribute("aria-hidden", "true"); r0.setAttribute("aria-hidden", "true"); b.appendChild(s0); b.appendChild(r0); return; }
      b.__dressed = true;
      if (getComputedStyle(b).position === "static") b.style.position = "relative";
      var r = document.createElement("i"), s = document.createElement("i");
      r.className = "x-ring"; s.className = "x-sheen"; r.setAttribute("aria-hidden", "true"); s.setAttribute("aria-hidden", "true");
      b.appendChild(s); b.appendChild(r);
      b.addEventListener("pointermove", function (e) {
        var k = b.getBoundingClientRect(), x = e.clientX - k.left, y = e.clientY - k.top;
        b.style.setProperty("--mx", x + "px"); b.style.setProperty("--my", y + "px");
        var dx = (x / k.width - 0.5) * Math.min(12, k.width * 0.06), dy = (y / k.height - 0.5) * 6;
        b.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    };
    var all = function () { document.querySelectorAll(".btn, .chip.gq").forEach(dress); };
    all(); addEventListener("load", all);
    /* switching the language rewrites a button's words and with them its
       ring and sheen: they are put back as soon as that happens */
    var again = 0;
    new MutationObserver(function () { if (!again) again = requestAnimationFrame(function () { again = 0; all(); }); })
      .observe(document.body, { childList: true, subtree: true });
  }

  /* ── the living collection ── */
  var FILM = { soul: "v/soul-film", icon: "v/icon-film", moment: "v/moment-film" };
  var cards = [].slice.call(document.querySelectorAll("#collection article.piece")).filter(function (p) { return FILM[p.getAttribute("data-theme")]; });
  if (cards.length && !reduce && !thin) {
    var desk = matchMedia("(min-width:900px)").matches;
    cards.forEach(function (p) {
      var im = p.querySelector(".fig .im"); if (!im) return;
      var v = document.createElement("video");
      v.className = "pfilm"; v.muted = true; v.loop = true; v.playsInline = true; v.preload = "none";
      v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("aria-hidden", "true");
      v.setAttribute("data-src", FILM[p.getAttribute("data-theme")] + (desk ? "" : "-720") + ".mp4");
      var cue = document.createElement("span"); cue.className = "pfilm-cue";
      cue.setAttribute("data-en", "The film"); cue.setAttribute("data-he", "הסרט"); cue.textContent = he() ? "הסרט" : "The film";
      im.appendChild(v); im.appendChild(cue); p.__film = v;
    });
    var on = function (p) {
      var v = p.__film; if (!v) return; p.__want = true;
      if (!v.src) v.src = v.getAttribute("data-src");
      /* the film may start after the reader has moved on: it shows only if still wanted */
      var go = function () { if (p.__want) p.classList.add("live"); else v.pause(); };
      var pr = v.play(); if (pr && pr.then) pr.then(go).catch(function () {}); else go();
    };
    var off = function (p) { var v = p.__film; if (!v) return; p.__want = false; p.classList.remove("live"); setTimeout(function () { if (!p.classList.contains("live")) v.pause(); }, 900); };
    if (fine) {
      cards.forEach(function (p) {
        var t = 0, fig = p.querySelector(".fig");
        if (!fig) return;
        fig.addEventListener("pointerenter", function () { clearTimeout(t); t = setTimeout(function () { on(p); }, 260); });
        fig.addEventListener("pointerleave", function () { clearTimeout(t); off(p); });
      });
    } else if ("IntersectionObserver" in window) {
      /* on a phone, only the card most in view plays, and only once it is well in view */
      var seen = new Map(), cur = null;
      var pick = function () {
        var best = null, br = 0.62;
        seen.forEach(function (r, p) { if (r > br) { br = r; best = p; } });
        if (best === cur) return;
        if (cur) off(cur); cur = best; if (cur) on(cur);
      };
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { seen.set(e.target.__p, e.intersectionRatio); }); pick(); },
        { threshold: [0, 0.4, 0.62, 0.8, 1] });
      cards.forEach(function (p) { var f = p.querySelector(".fig"); if (f) { f.__p = p; io.observe(f); } });
    }
  }

  /* ── "Find her piece" ── */
  var g = document.getElementById("guide"); if (!g) return;
  var steps = [].slice.call(g.querySelectorAll(".gstep")), bars = [].slice.call(g.querySelectorAll(".gbar i")), ans = {};
  var show = function (i) {
    steps.forEach(function (s, k) { s.classList.toggle("on", k === i); s.setAttribute("aria-hidden", k === i ? "false" : "true"); });
    bars.forEach(function (b, k) { b.classList.toggle("on", k < i || i === steps.length - 1); });
    var f = steps[i].querySelector("button, a"); if (f && g.__started) f.focus({ preventScroll: true });
  };
  var card = function (id) { return document.getElementById("p-" + id); };
  var first = function (t) { var m = String(t || "").match(/^[^.!?]+[.!?]/); return m ? m[0] : t || ""; };
  var result = function () {
    var where = ans.where, how = ans.how, L = he() ? "he" : "en", r = g.querySelector(".gres-in");
    var name, why, pic, href;
    if (where === "wrist" && how === "noticed") {
      var b = document.getElementById("build"), lead = b && b.querySelector(".p");
      name = "THE LINE"; why = lead ? first(lead.textContent.trim()) : ""; pic = "img/tennis-1200.jpg"; href = "#build";
    } else {
      var p = card(where === "neck" ? "pave" : where === "hand" ? "ring" : "knot");
      if (!p) return;
      var prose = {}; try { prose = JSON.parse(p.getAttribute("data-prose") || "{}"); } catch (e) {}
      name = ((L === "he" ? p.getAttribute("data-title-he") : p.getAttribute("data-title")) || "").split("|")[0].trim();
      why = first(prose.story && (prose.story[L] || prose.story.en));
      var img = p.querySelector(".fig .im img"); pic = img ? (img.currentSrc || img.src) : "";
      var a = p.querySelector('a[href*="pieces/"]'); href = a ? a.getAttribute("href") : "#collection";
    }
    var moment = g.querySelector('.gstep[data-k="moment"] .chip.gq[data-v="' + ans.moment + '"]');
    r.querySelector(".gfor").textContent = (L === "he" ? "בשביל " : "For ") + (moment ? moment.textContent.trim().toLowerCase() : "");
    r.querySelector(".gname").textContent = name;
    r.querySelector(".gwhy").textContent = why;
    var im2 = r.querySelector(".gpic img"); im2.src = pic; im2.alt = name;
    r.querySelector(".gview").setAttribute("href", href);
    g.__pick = name;
  };
  g.addEventListener("click", function (e) {
    var c = e.target.closest(".chip.gq");
    if (c) {
      g.__started = true;
      var s = c.closest(".gstep"); ans[s.getAttribute("data-k")] = c.getAttribute("data-v");
      var i = steps.indexOf(s) + 1;
      if (i === steps.length - 1) result();
      show(i); return;
    }
    if (e.target.closest(".gagain")) { ans = {}; show(0); return; }
    var book = e.target.closest(".gbook");
    if (book) {
      var m = document.getElementById("fMsg"), mo = g.querySelector('.gstep[data-k="moment"] .chip.gq[data-v="' + ans.moment + '"]');
      if (m && g.__pick) {
        m.value = (he() ? "אשמח לראות את " + g.__pick + (mo ? " (" + mo.textContent.trim() + ")" : "") + "."
                        : "I would like to see " + g.__pick + (mo ? " (" + mo.textContent.trim().toLowerCase() + ")" : "") + ".");
        m.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  });
  show(0);
})();
