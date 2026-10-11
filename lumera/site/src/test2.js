/* /test2/: "Find her piece", and the buttons' hover. */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
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

  /* ── a category with no finished piece is not offered as a filter: it
        only opened onto "Coming soon", with nowhere to go from there ── */
  (function () {
    var cards = [].slice.call(document.querySelectorAll(".pgrid .piece:not(.soon)"));
    document.querySelectorAll(".cats .cat").forEach(function (b) {
      var c = b.getAttribute("data-cat");
      if (c !== "all" && !cards.some(function (x) { return x.getAttribute("data-cat") === c; })) b.hidden = true;
    });
  })();

  /* ── "Find her piece" ── */
  var g = document.getElementById("guide"); if (!g) return;
  var steps = [].slice.call(g.querySelectorAll(".gstep")), bars = [].slice.call(g.querySelectorAll(".gbar i")), ans = {}, at = 0;
  var back = g.querySelector(".gback"), prog = g.querySelector(".gprog");
  /* a word in the language now showing: the page's own rule, asked through a
     detached element so a sentence written here follows French, Arabic and
     Russian too, not only English and Hebrew */
  var tr = function (en, hw) {
    if (!window.__say) return he() ? hw : en;
    var e = document.createElement("span"); e.setAttribute("data-en", en); e.setAttribute("data-he", hw || en);
    var v = window.__say(e); return v == null ? en : v;
  };
  var show = function (i) {
    at = i;
    steps.forEach(function (s, k) {
      var on = k === i; s.classList.toggle("on", on); s.setAttribute("aria-hidden", on ? "false" : "true");
      /* a question that is not showing cannot be reached with the keyboard either */
      if (on) s.removeAttribute("inert"); else s.setAttribute("inert", "");
    });
    bars.forEach(function (b, k) { b.classList.toggle("on", k < i || i === steps.length - 1); });
    var last = i === steps.length - 1;
    if (back) back.hidden = i === 0;
    if (prog) { prog.hidden = last; if (!last) { prog.setAttribute("data-en", "Question " + (i + 1) + " of " + (steps.length - 1)); prog.setAttribute("data-he", "שאלה " + (i + 1) + " מתוך " + (steps.length - 1)); prog.textContent = tr(prog.getAttribute("data-en"), prog.getAttribute("data-he")); } }
    /* an answer already given stays marked when the reader comes back to it */
    steps.forEach(function (s) { var k = s.getAttribute("data-k"); s.querySelectorAll(".chip.gq").forEach(function (c) { var on = ans[k] === c.getAttribute("data-v"); c.classList.toggle("on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); }); });
    var f = steps[i].querySelector(".chip.gq.on, button, a"); if (f && g.__started) f.focus({ preventScroll: true });
  };
  var card = function (id) { return document.getElementById("p-" + id); };
  var first = function (t) { var m = String(t || "").match(/^[^.!?]+[.!?]/); return m ? m[0] : t || ""; };
  var chipText = function (k, v) { var c = g.querySelector('.gstep[data-k="' + k + '"] .chip.gq[data-v="' + v + '"]'); return c ? c.textContent.trim() : ""; };
  /* the recommendation is kept as what it is (which piece, why), and written
     out again whenever the language changes */
  var pick = null;
  var result = function () {
    var where = ans.where, how = ans.how;
    if (where === "wrist" && how === "noticed") {
      pick = { name: "SILAVU THE LINE", nameHe: "SILAVU THE LINE",
        why: ["A line of diamonds designed to her wrist: you choose the cut, the carats and the metal.", "שורת יהלומים שמעוצבת לפרק היד שלה: אתם בוחרים את החיתוך, את הקראטים ואת המתכת."],
        pic: "img/tennis-1200.jpg", href: "#build", ref: "" };
    } else {
      var p = card(where === "neck" ? "pave" : where === "hand" ? "ring" : "knot");
      if (!p) return;
      var prose = {}; try { prose = JSON.parse(p.getAttribute("data-prose") || "{}"); } catch (e) {}
      var st = prose.story || {}, img = p.querySelector(".fig .im img"), a = p.querySelector('a[href*="pieces/"]'), q = p.querySelector(".lnk.q[data-piece]");
      pick = { name: (p.getAttribute("data-title") || "").split("|")[0].trim(), nameHe: (p.getAttribute("data-title-he") || p.getAttribute("data-title") || "").split("|")[0].trim(),
        why: st.en ? [st.en, st.he || st.en] : null, pic: img ? (img.currentSrc || img.src) : "", href: a ? a.getAttribute("href") : "#collection",
        piece: q ? q.getAttribute("data-piece") : "", pieceHe: q ? q.getAttribute("data-piece-he") : "", ref: q ? q.getAttribute("data-ref") : "" };
    }
    paintResult();
  };
  var paintResult = function () {
    if (!pick) return;
    var r = g.querySelector(".gres-in");
    r.querySelector(".gfor").textContent = chipText("moment", ans.moment);
    r.querySelector(".gname").textContent = he() ? pick.nameHe : pick.name;
    r.querySelector(".gwhy").textContent = pick.why ? first(tr(pick.why[0], pick.why[1])) : "";
    var im2 = r.querySelector(".gpic img"); if (pick.pic && im2.getAttribute("src") !== pick.pic) im2.src = pick.pic; im2.alt = he() ? pick.nameHe : pick.name;
    r.querySelector(".gview").setAttribute("href", pick.href);
    /* "Book a private viewing" sets the enquiry exactly as the piece's own
       card does: this piece, a viewing, replacing whatever was chosen before.
       The reader's own message is never written into */
    var bk = r.querySelector(".gbook");
    bk.setAttribute("data-piece", pick.piece || pick.name); bk.setAttribute("data-piece-he", pick.pieceHe || pick.nameHe); bk.setAttribute("data-ref", pick.ref || "");
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
    if (e.target.closest(".gback")) { g.__started = true; show(Math.max(0, at - 1)); return; }
    if (e.target.closest(".gagain")) { ans = {}; pick = null; g.__started = true; show(0); return; }
  });
  /* a change of language rewrites what was written here, in the new language */
  new MutationObserver(function () { paintResult(); if (prog && !prog.hidden) prog.textContent = tr(prog.getAttribute("data-en"), prog.getAttribute("data-he")); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  show(0);
})();
