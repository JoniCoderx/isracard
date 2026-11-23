/* test15 only (the house, 23 Nov 2026): three things the builder can do beyond drawing the bracelet.
   1 · In the light: the house's own studio photograph of the line in the chosen shape and metal, with a light that
       follows the hand (the pointer on a computer, the tilt of a phone). It is a photograph, and says so.
   2 · Send a hint: the design sealed into a link that opens on WhatsApp; the one who opens it sees the design made
       for them, and can book a viewing with it attached.
   3 · True size: the screen measured against a bank card, then the stones of this design drawn at their real size,
       from the same geometry the builder uses for each cut and carat. */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, root = document.documentElement;
  var CUTS = ["round", "oval", "cushion", "princess", "emerald", "marquise", "pear", "baguette"], ORIG = ["lab", "natural"], CTS = ["2", "4", "6", "8", "10", "15", "20"], WR = ["15", "16", "17", "18", "19", "20"], MET = ["white", "yellow", "rose", "platinum"];
  function lang() { return root.getAttribute("data-lang") || "en"; }
  function he() { return lang() === "he"; }
  function say(el) { if (window.__say) { var t = window.__say(el); if (t != null) el.textContent = t; } else el.textContent = he() ? el.getAttribute("data-he") : el.getAttribute("data-en"); }
  function T(en, hb) { var s = document.createElement("span"); s.setAttribute("data-en", en); s.setAttribute("data-he", hb); return (window.__say ? window.__say(s) : null) || (he() ? hb : en); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function words(box) { [].forEach.call(box.querySelectorAll("[data-en]"), say); }
  function iso(x) { return (lang() === "he" || lang() === "ar") ? "⁦" + x + "⁩" : x; }

  /* the design as chosen now, read from the builder's own chips */
  function now() { var o = {}; ["cut", "origin", "ct", "wrist", "metal"].forEach(function (k) { var c = document.querySelector('#opts .chip.on[data-k="' + k + '"]'); o[k] = c ? c.getAttribute("data-v") : null; });
    var b = window.__build || {}; ["cut", "origin", "metal"].forEach(function (k) { if (!o[k] && b[k]) o[k] = b[k]; }); if (!o.ct && b.ct) o.ct = String(b.ct); if (!o.wrist && b.wrist) o.wrist = String(b.wrist); return o; }
  function chipName(k, v) { var c = document.querySelector('#opts .chip[data-k="' + k + '"][data-v="' + v + '"]'); if (!c) return String(v); var t = c.querySelector("[data-en]") || c;
    if (!t.getAttribute("data-en")) return t.textContent.trim(); return (window.__say ? window.__say(t) : null) || (he() ? t.getAttribute("data-he") : t.getAttribute("data-en")); }
  function title(d) { return "The Line · " + chipName("cut", d.cut); }
  function spec(d) { return [chipName("origin", d.origin), iso(d.ct + " ct"), iso(d.wrist + " cm"), chipName("metal", d.metal)].join(" · "); }
  function photo(d, w) { return "line/" + (CUTS.indexOf(d.cut) >= 0 ? d.cut : "round") + "-" + (MET.indexOf(d.metal) >= 0 ? d.metal : "white") + "-" + (w || 1600) + ".jpg"; }

  /* ── one quiet window for all three ── */
  var dlg = el("dialog", "x15d"); dlg.setAttribute("aria-labelledby", "x15h");
  dlg.innerHTML = '<button class="x15x" type="button" data-al-en="Close" data-al-he="סגירה" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button><div class="x15in" tabindex="-1" autofocus></div>';
  document.body.appendChild(dlg);
  var inner = dlg.querySelector(".x15in"), onClose = null;
  function open(build) { if (dlg.open) close(); inner.innerHTML = ""; onClose = build(inner) || null; words(dlg); var x = dlg.querySelector(".x15x"); x.setAttribute("aria-label", he() ? "סגירה" : T("Close", "סגירה"));
    root.classList.add("x15lock"); try { dlg.showModal(); } catch (e) { dlg.setAttribute("open", ""); } }
  function close() { if (dlg.open) dlg.close(); }
  dlg.addEventListener("close", function () { root.classList.remove("x15lock"); var f = onClose; onClose = null; if (typeof f === "function") f(); });
  dlg.querySelector(".x15x").addEventListener("click", close);
  dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); });

  /* ── 1 · the light over the stones ── */
  var GL = document.createElement("canvas"); GL.width = GL.height = 64; (function () { var s = GL.getContext("2d"), r = s.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(.12, "rgba(255,250,240,.75)"); r.addColorStop(.4, "rgba(255,245,230,.12)"); r.addColorStop(1, "rgba(255,245,230,0)"); s.fillStyle = r; s.fillRect(0, 0, 64, 64); s.globalCompositeOperation = "lighter";
    [[0, 1.3, .95], [Math.PI / 2, 1.3, .95], [Math.PI / 4, .7, .3], [-Math.PI / 4, .7, .3]].forEach(function (a) { s.save(); s.translate(32, 32); s.rotate(a[0]); var l = s.createLinearGradient(-32, 0, 32, 0); l.addColorStop(0, "rgba(255,255,255,0)"); l.addColorStop(.5, "rgba(255,255,255," + a[2] + ")"); l.addColorStop(1, "rgba(255,255,255,0)"); s.fillStyle = l; s.fillRect(-32, -a[1] / 2, 64, a[1]); s.restore(); }); })();
  var FIRE = ["255,170,170", "255,230,160", "170,255,210", "170,200,255"], fxc = {};
  function FX(rgb) { if (fxc[rgb]) return fxc[rgb]; var c = document.createElement("canvas"); c.width = c.height = 64; var s = c.getContext("2d"); s.drawImage(GL, 0, 0); s.globalCompositeOperation = "source-atop"; s.fillStyle = "rgba(" + rgb + ",.55)"; s.fillRect(0, 0, 64, 64); return fxc[rgb] = c; }
  /* the brightest small points of the photograph are where its facets already catch the studio light; each answers
     the moving light from an angle of its own. A fixed seed, so the same photograph always sparkles the same way. */
  function spotsOf(img) { var w = 250, h = Math.round(w * img.naturalHeight / img.naturalWidth), c = document.createElement("canvas"); c.width = w; c.height = h; var x = c.getContext("2d"); x.drawImage(img, 0, 0, w, h);
    var d; try { d = x.getImageData(0, 0, w, h).data; } catch (e) { return []; }
    var lum = function (i, j) { var k = (j * w + i) * 4; return d[k] * .3 + d[k + 1] * .59 + d[k + 2] * .11; }, cand = [], seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (var j = 2; j < h - 2; j++) for (var i = 2; i < w - 2; i++) { var v = lum(i, j); if (v < 200) continue; var mx = true; for (var dj = -2; dj <= 2 && mx; dj++) for (var di = -2; di <= 2; di++) if ((di || dj) && lum(i + di, j + dj) > v) { mx = false; break; } if (mx) cand.push([v, i / w, j / h]); }
    cand.sort(function (a, b) { return b[0] - a[0]; });
    return cand.slice(0, 140).map(function (q) { return { x: q[1], y: q[2], a: rnd() * 6.283, f: rnd() < .25 ? FIRE[(rnd() * 4) | 0] : null, s: .6 + rnd() * .8 }; }); }
  function light(cv, src, alt) {
    var g = cv.getContext("2d"), img = new Image(), spots = [], W = 0, H = 0, L = { x: .5, y: .4, tx: .5, ty: .4, live: 0 }, t0 = performance.now(), raf = 0, alive = true, ready = false;
    cv.setAttribute("role", "img"); if (alt) cv.setAttribute("aria-label", alt);
    function size() { var r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; if (!W || !H) return; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function frame(now) { raf = 0; if (!alive || !ready) return; if (!W) size(); if (!W) { kick(); return; }
      var idle = now - L.live > 1600, t = (now - t0) / 1000;
      if (idle && !reduce) { L.tx = .5 + .4 * Math.sin(t * .35); L.ty = .45 + .2 * Math.sin(t * .55); }
      L.x += (L.tx - L.x) * (reduce ? 1 : .12); L.y += (L.ty - L.y) * (reduce ? 1 : .12);
      g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; g.drawImage(img, 0, 0, W, H);
      var lx = L.x * W, ly = L.y * H, rg = g.createRadialGradient(lx, ly, 0, lx, ly, W * .35); rg.addColorStop(0, "rgba(255,248,236,.14)"); rg.addColorStop(1, "rgba(255,248,236,0)");
      g.globalCompositeOperation = "screen"; g.fillStyle = rg; g.fillRect(0, 0, W, H); g.globalCompositeOperation = "lighter";
      for (var i = 0; i < spots.length; i++) { var s = spots[i], px = s.x * W, py = s.y * H, dx = lx - px, dy = ly - py, dist = Math.sqrt(dx * dx + dy * dy);
        var face = Math.pow(Math.max(0, Math.cos(Math.atan2(dy, dx) - s.a)), 6), near = Math.max(0, 1 - dist / (W * .45)), k = face * near * near;
        if (k < .04) continue; var sz = (10 + 34 * k) * s.s * Math.min(1.4, W / 640 + .3); g.globalAlpha = Math.min(1, k * 1.3); g.drawImage(s.f && k > .5 ? FX(s.f) : GL, px - sz / 2, py - sz / 2, sz, sz); }
      g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
      /* still drifting or still settling: draw again; at rest with reduced motion, wait for the hand */
      if (!reduce || Math.abs(L.tx - L.x) + Math.abs(L.ty - L.y) > .002) kick(); }
    function kick() { if (!raf && alive) raf = requestAnimationFrame(frame); }
    function aim(x, y) { L.tx = Math.max(-.1, Math.min(1.1, x)); L.ty = Math.max(-.1, Math.min(1.1, y)); L.live = performance.now(); kick(); }
    function pm(e) { var r = cv.getBoundingClientRect(); aim((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); }
    function tilt(e) { if (e.gamma == null) return; aim(.5 + e.gamma / 40, .45 + ((e.beta || 45) - 45) / 50); }
    function rs() { size(); kick(); }
    cv.addEventListener("pointermove", pm); cv.addEventListener("pointerdown", pm); addEventListener("deviceorientation", tilt); addEventListener("resize", rs);
    img.onload = function () { if (!alive) return; spots = spotsOf(img); ready = true; cv.classList.add("on"); size(); kick(); };
    img.src = src;
    return function stop() { alive = false; if (raf) cancelAnimationFrame(raf); raf = 0; cv.removeEventListener("pointermove", pm); cv.removeEventListener("pointerdown", pm); removeEventListener("deviceorientation", tilt); removeEventListener("resize", rs); };
  }
  /* a phone's tilt is asked for once, on the press that opens the light (iOS asks permission then, and only then) */
  function askTilt() { try { if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function") DeviceOrientationEvent.requestPermission().catch(function () {}); } catch (e) {} }
  var touch = matchMedia("(hover: none)").matches;

  function openLight() { askTilt(); var d = now();
    open(function (box) {
      box.innerHTML = '<div class="x15k" data-en="In the light" data-he="באור">In the light</div><h2 class="x15t" id="x15h"></h2><p class="x15s"></p>'
        + '<div class="x15ph"><canvas class="x15cv"></canvas></div>'
        + '<p class="x15how">' + (touch ? '<span data-en="Tilt your phone, or touch the picture, to move the light over the stones." data-he="הטו את הטלפון, או געו בתמונה, כדי להזיז את האור על האבנים.">Tilt your phone, or touch the picture, to move the light over the stones.</span>'
          : '<span data-en="Move the pointer over the picture to move the light over the stones." data-he="הזיזו את העכבר על התמונה כדי להעביר את האור על האבנים.">Move the pointer over the picture to move the light over the stones.</span>') + '</p>'
        + '<p class="x15note" data-en="A studio photograph of the line in this shape and metal, with a light added as you move. The carat weight shown is not the one you chose." data-he="צילום סטודיו של הצמיד בצורה ובמתכת האלה, עם אור שנוסף כשאתם זזים. משקל הקראט בצילום אינו זה שבחרתם.">A studio photograph of the line in this shape and metal, with a light added as you move. The carat weight shown is not the one you chose.</p>';
      box.querySelector(".x15t").textContent = title(d); box.querySelector(".x15s").textContent = spec(d);
      var cv = box.querySelector(".x15cv"); return light(cv, photo(d, matchMedia("(min-width: 700px)").matches ? 1600 : 1000), title(d) + ", " + chipName("metal", d.metal));
    }); }

  /* ── 2 · send a hint ── */
  function enc(d) { return [d.cut, d.origin, d.ct, d.wrist, d.metal].join("."); }
  function dec(s) { var p = String(s || "").split("."); if (p.length !== 5) return null; var d = { cut: p[0], origin: p[1], ct: p[2], wrist: p[3], metal: p[4] };
    return CUTS.indexOf(d.cut) >= 0 && ORIG.indexOf(d.origin) >= 0 && CTS.indexOf(d.ct) >= 0 && WR.indexOf(d.wrist) >= 0 && MET.indexOf(d.metal) >= 0 ? d : null; }
  function link(d, from) { var u = location.origin + location.pathname + "?hint=" + enc(d); from = (from || "").trim().slice(0, 40); if (from) u += "&from=" + encodeURIComponent(from); return u; }
  var SEAL = '<svg class="x15env" viewBox="0 0 300 200" aria-hidden="true" focusable="false"><defs><linearGradient id="x15gd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8e7046"/><stop offset=".45" stop-color="#e9d4a3"/><stop offset=".55" stop-color="#fff3d6"/><stop offset="1" stop-color="#8a6b42"/></linearGradient></defs>'
    + '<rect x="1" y="1" width="298" height="198" rx="10" fill="#0d0c0b" stroke="rgba(230,214,182,.35)"/><path class="x15flap" d="M1 11 L150 118 L299 11" fill="none" stroke="rgba(230,214,182,.35)"/>'
    + '<g class="x15seal"><circle cx="150" cy="112" r="30" fill="url(#x15gd)"/><circle cx="150" cy="112" r="25" fill="none" stroke="rgba(60,40,15,.35)"/><svg x="136" y="96" width="28" height="32" viewBox="0 0 875 1000" style="color:#3a2a12;opacity:.85"><use href="#symb"/></svg></g></svg>';
  function openHint() { var d = now();
    open(function (box) {
      box.innerHTML = '<div class="x15k" data-en="Send a hint" data-he="לשלוח רמז">Send a hint</div><h2 class="x15t" id="x15h" data-en="Let someone know." data-he="שמישהו ידע.">Let someone know.</h2>'
        + '<div class="x15hint"><div class="x15card"><img alt="" src="' + photo(d, 1000) + '"><div><div class="x15cn"></div><div class="x15cs"></div></div></div>' + SEAL
        + '<div class="x15sent" role="status"><span data-en="Sealed and handed to WhatsApp. Choose who it goes to there." data-he="נחתם והועבר לוואטסאפ. שם בוחרים למי לשלוח.">Sealed and handed to WhatsApp. Choose who it goes to there.</span></div></div>'
        + '<p class="x15s2" data-en="Your design is sealed into a link. Whoever opens it sees the bracelet you chose, and can book a viewing with it." data-he="העיצוב שלכם נחתם בתוך קישור. מי שיפתח אותו יראה את הצמיד שבחרתם, ויוכל לקבוע פגישה פרטית איתו.">Your design is sealed into a link. Whoever opens it sees the bracelet you chose, and can book a viewing with it.</p>'
        + '<label class="x15lbl" for="x15from"><span data-en="Your name, if you want it on the card (optional)" data-he="השם שלכם, אם תרצו שיופיע (לא חובה)">Your name, if you want it on the card (optional)</span></label><input id="x15from" class="x15in2" type="text" maxlength="40" autocomplete="given-name">'
        + '<div class="x15acts"><a class="x15b solid" id="x15wa" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.2-3.8A8 8 0 1 1 8 19z"/></svg><span data-en="Send on WhatsApp" data-he="שליחה בוואטסאפ">Send on WhatsApp</span></a>'
        + '<button class="x15b" type="button" id="x15copy"><span data-en="Copy the link" data-he="העתקת הקישור">Copy the link</span></button></div>';
      box.querySelector(".x15cn").textContent = title(d); box.querySelector(".x15cs").textContent = spec(d);
      var hb = box.querySelector(".x15hint"), wa = box.querySelector("#x15wa"), from = box.querySelector("#x15from"), cp = box.querySelector("#x15copy"), steps = [];
      try { from.value = localStorage.getItem("silavu-from") || ""; } catch (e) {}
      function msg() { var u = link(d, from.value);
        return (he() ? "מצאתי ב־SILAVU משהו שאהבתי: " : T("I found something I love at SILAVU: ", "מצאתי ב־SILAVU משהו שאהבתי: ")) + "SILAVU " + title(d) + " (" + spec(d).replace(/[⁦⁩]/g, "") + "). " + (he() ? "רק רמז קטן." : T("Just a hint.", "רק רמז קטן.")) + "\n" + u; }
      function upd() { wa.href = "https://wa.me/?text=" + encodeURIComponent(msg()); }
      from.addEventListener("input", function () { upd(); try { localStorage.setItem("silavu-from", from.value.trim().slice(0, 40)); } catch (e) {} }); upd();
      function seal() { steps.forEach(clearTimeout); steps = []; hb.className = "x15hint sent";
        steps.push(setTimeout(function () { hb.classList.add("sealed"); }, reduce ? 0 : 450));
        steps.push(setTimeout(function () { hb.classList.add("done"); }, reduce ? 0 : 1100)); }
      /* the link opens WhatsApp in the same press (a browser only lets a new window open from the press itself);
         the envelope seals behind it, for when they come back */
      wa.addEventListener("click", function () { upd(); seal(); });
      cp.addEventListener("click", function () { var u = link(d, from.value), done = function () { cp.firstChild.setAttribute("data-en", "Link copied"); cp.firstChild.setAttribute("data-he", "הקישור הועתק"); say(cp.firstChild); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(done, function () { prompt("", u); }); else prompt("", u); });
      return function () { steps.forEach(clearTimeout); };
    }); }

  /* the one who opens the link: the design, made for them */
  var got = (location.search.match(/[?&]hint=([^&#]+)/) || [])[1], hd = got ? dec(decodeURIComponent(got)) : null;
  if (hd) { var who = ((location.search.match(/[?&]from=([^&#]*)/) || [])[1] || ""); try { who = decodeURIComponent(who.replace(/\+/g, " ")).trim().slice(0, 40); } catch (e) { who = ""; }
    var opened = function () { open(function (box) {
      box.parentNode.classList.add("x15recv");
      box.innerHTML = '<div class="x15k x15for" data-en="For you" data-he="בשבילך">For you</div>' + SEAL.replace('class="x15env"', 'class="x15env x15open"')
        + '<div class="x15ph"><canvas class="x15cv"></canvas></div><h2 class="x15t" id="x15h"></h2><p class="x15s"></p><p class="x15from"></p>'
        + '<p class="x15s2" data-en="This design was chosen for you to see. It is made to order, and can be seen in person at a private viewing." data-he="העיצוב הזה נבחר במיוחד בשבילך. הוא נעשה בהזמנה אישית, ואפשר לראות אותו מקרוב בפגישה פרטית.">This design was chosen for you to see. It is made to order, and can be seen in person at a private viewing.</p>'
        + '<div class="x15acts"><button class="x15b solid" type="button" id="x15book"><span data-en="Book a viewing together" data-he="לקבוע פגישה פרטית יחד">Book a viewing together</span></button><button class="x15b" type="button" id="x15see"><span data-en="See it in the builder" data-he="לראות אותו בבונה">See it in the builder</span></button></div>'
        + '<p class="x15note" data-en="A studio photograph of the line in this shape and metal. The carat weight shown is not the one chosen." data-he="צילום סטודיו של הצמיד בצורה ובמתכת האלה. משקל הקראט בצילום אינו זה שנבחר.">A studio photograph of the line in this shape and metal. The carat weight shown is not the one chosen.</p>';
      var put = function () { box.querySelector(".x15t").textContent = title(hd); box.querySelector(".x15s").textContent = spec(hd); var f = box.querySelector(".x15from"); f.textContent = who ? (he() ? "מאת " : T("From ", "מאת ")) + who : ""; f.hidden = !who; };
      put(); var stop = light(box.querySelector(".x15cv"), photo(hd, matchMedia("(min-width: 700px)").matches ? 1600 : 1000), title(hd));
      box.querySelector("#x15see").addEventListener("click", function () { setDesign(hd); close(); var c = document.getElementById("configure"); if (c) c.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" }); });
      box.querySelector("#x15book").addEventListener("click", function () { setDesign(hd); close();
        /* the builder's own enquiry carries the design to the form; the request is a viewing */
        var r = document.getElementById("reserve"); if (r) r.click(); else location.hash = "#concierge";
        setTimeout(function () { var f = document.getElementById("concierge") || document; var c = [].filter.call(f.querySelectorAll(".want .chip"), function (x) { return x.getAttribute("data-en") === "Private viewing"; })[0]; if (c && !c.classList.contains("on")) c.click(); }, 700); });
      return stop; }); };
    /* the page first, then the card over it */
    var tries = 0; (function wait() { if (document.querySelector('#opts .chip[data-k="cut"]') && window.__say || ++tries > 40) setTimeout(opened, 300); else setTimeout(wait, 150); })();
  }
  function setDesign(d) { ["cut", "origin", "ct", "wrist", "metal"].forEach(function (k) { var c = document.querySelector('#opts .chip[data-k="' + k + '"][data-v="' + d[k] + '"]'); if (c && !c.classList.contains("on")) c.click(); }); }

  /* ── 3 · true size ── */
  var CARD = { long: 85.6, short: 53.98 };
  function shape(g, cut, x, y, a, b) { g.beginPath();
    if (cut === "round" || cut === "oval") g.ellipse(x, y, a, b, 0, 0, 6.2832);
    else if (cut === "cushion" || cut === "princess" || cut === "baguette") { var r = cut === "cushion" ? Math.min(a, b) * .55 : Math.min(a, b) * .08; if (g.roundRect) g.roundRect(x - a, y - b, 2 * a, 2 * b, r); else g.rect(x - a, y - b, 2 * a, 2 * b); }
    else if (cut === "emerald") { var c = Math.min(a, b) * .32; g.moveTo(x - a + c, y - b); g.lineTo(x + a - c, y - b); g.lineTo(x + a, y - b + c); g.lineTo(x + a, y + b - c); g.lineTo(x + a - c, y + b); g.lineTo(x - a + c, y + b); g.lineTo(x - a, y + b - c); g.lineTo(x - a, y - b + c); g.closePath(); }
    else if (cut === "marquise") { g.moveTo(x - a, y); g.quadraticCurveTo(x, y - 2 * b, x + a, y); g.quadraticCurveTo(x, y + 2 * b, x - a, y); g.closePath(); }
    else if (cut === "pear") { g.moveTo(x - a + b, y - b); g.arc(x - a + b, y, b, -Math.PI / 2, Math.PI / 2, true); g.quadraticCurveTo(x + a * .35, y + b, x + a, y); g.quadraticCurveTo(x + a * .35, y - b, x - a + b, y - b); g.closePath(); }
    else g.ellipse(x, y, a, b, 0, 0, 6.2832); }
  function stone(g, cut, x, y, a, b) { var r = Math.max(a, b), gr = g.createRadialGradient(x - a * .3, y - b * .35, r * .08, x, y, r * 1.05); gr.addColorStop(0, "#ffffff"); gr.addColorStop(.5, "#cfd3dc"); gr.addColorStop(1, "#5d6270");
    shape(g, cut, x, y, a, b); g.fillStyle = gr; g.fill(); g.lineWidth = Math.max(.6, r * .06); g.strokeStyle = "rgba(255,255,255,.75)"; g.stroke();
    shape(g, cut, x, y, a * .52, b * .52); g.lineWidth = Math.max(.5, r * .04); g.strokeStyle = "rgba(255,255,255,.55)"; g.stroke(); }
  function openSize() { var d = now();
    open(function (box) {
      box.parentNode.classList.add("x15wide");
      box.innerHTML = '<div class="x15k" data-en="True size" data-he="בגודל אמיתי">True size</div><h2 class="x15t" id="x15h" data-en="Your stones, at their real size." data-he="האבנים שלכם, בגודלן האמיתי.">Your stones, at their real size.</h2>'
        + '<ol class="x15steps"><li><span class="x15n">1</span><div><p class="x15st"></p><div class="x15cardwrap"><div class="x15cardbox"><span data-en="Bank card" data-he="כרטיס אשראי">Bank card</span></div></div>'
        + '<div class="x15cal"><button class="x15pm" type="button" data-d="-1" aria-label="Smaller">−</button><input type="range" id="x15cw" min="200" max="900" step="1"><button class="x15pm" type="button" data-d="1" aria-label="Larger">+</button></div></div></li>'
        + '<li><span class="x15n">2</span><div><p class="x15st2"></p><canvas class="x15ts" role="img"></canvas><p class="x15big" aria-live="polite"></p></div></li></ol>'
        + '<p class="x15note" data-en="Sizes come from the cut and carat weight you chose and are approximate; each stone is cut to its own measure. Without measuring against a card, the sizes on a screen are only a guess." data-he="המידות נגזרות מהליטוש ומהמשקל שבחרתם והן בקירוב; כל אבן מלוטשת למידה משלה. בלי מדידה מול כרטיס, הגודל על המסך הוא רק הערכה.">Sizes come from the cut and carat weight you chose and are approximate; each stone is cut to its own measure. Without measuring against a card, the sizes on a screen are only a guess.</p>';
      var narrow = function () { return box.clientWidth < 520; }, cw = box.querySelector("#x15cw"), cb = box.querySelector(".x15cardbox"), ts = box.querySelector(".x15ts"), tg = ts.getContext("2d"), big = box.querySelector(".x15big"), st = box.querySelector(".x15st"), st2 = box.querySelector(".x15st2");
      var kept = 0; try { kept = +localStorage.getItem("silavu-pxmm") || 0; } catch (e) {}
      /* a CSS pixel is meant to be 1/96 inch; screens differ, which is why the card */
      cw.value = Math.round((kept || 96 / 25.4) * 100);
      [].forEach.call(box.querySelectorAll(".x15pm"), function (b) { b.setAttribute("aria-label", b.getAttribute("data-d") > 0 ? T("Larger", "גדול יותר") : T("Smaller", "קטן יותר"));
        b.addEventListener("click", function () { cw.value = +cw.value + 3 * b.getAttribute("data-d"); draw(true); }); });
      cw.setAttribute("aria-label", T("Width of the card outline", "רוחב מסגרת הכרטיס"));
      function draw(save) {
        var nar = narrow(), mmRef = nar ? CARD.short : CARD.long, room = box.querySelector(".x15cardwrap").clientWidth || 300;
        /* the outline can never be wider than the window it is in */
        var maxP = Math.floor(room / mmRef * 100); cw.max = Math.max(250, maxP); if (+cw.value > +cw.max) cw.value = cw.max;
        var pxmm = cw.value / 100, w = mmRef * pxmm; cb.style.width = w + "px"; cb.style.height = (nar ? Math.min(w * .62, 170) : w * CARD.short / CARD.long) + "px"; cb.classList.toggle("tall", nar);
        if (save) try { localStorage.setItem("silavu-pxmm", String(pxmm)); } catch (e) {}
        st.textContent = nar ? T("Hold a bank card flat against the screen, its short side across, and match the outline to its width.", "הצמידו כרטיס אשראי למסך, הצד הקצר לרוחב, והתאימו את המסגרת לרוחב שלו.")
          : T("Hold a bank card flat against the screen and match the outline to it.", "הצמידו כרטיס אשראי למסך והתאימו את המסגרת לגודלו.");
        var sp = window.__lineSpec || { cut: "round", n: 36, alongMm: 3.6, acrossMm: 3.6, pitchMm: 4, L: 3.6, W: 3.6, each: d.ct / 36 }, cut = sp.cut || d.cut || "round";
        ts.style.height = Math.ceil(sp.acrossMm * pxmm + 66) + "px";
        var r = ts.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), CW = r.width, CH = r.height; ts.width = Math.round(CW * dpr); ts.height = Math.round(CH * dpr); tg.setTransform(dpr, 0, 0, dpr, 0, 0); tg.clearRect(0, 0, CW, CH);
        var a = sp.alongMm / 2 * pxmm, b = sp.acrossMm / 2 * pxmm, pitch = sp.pitchMm * pxmm, y = b + 10, n = Math.max(1, Math.floor((CW - 24) / pitch)), x0 = (CW - (n - 1) * pitch) / 2;
        var rtl = root.getAttribute("dir") === "rtl";
        for (var i = 0; i < n; i++) stone(tg, cut, x0 + i * pitch, y, a, b);
        /* a ruler in millimetres beneath: one centimetre, then the next */
        var span = Math.min(30, Math.floor((CW - 40) / pxmm)), rx0 = rtl ? CW - 40 - span * pxmm : 12, ry = y + b + 24;
        tg.strokeStyle = "rgba(241,236,226,.55)"; tg.fillStyle = "rgba(241,236,226,.7)"; tg.lineWidth = 1; tg.direction = "ltr"; tg.font = "11px " + (getComputedStyle(document.body).fontFamily || "sans-serif");
        tg.beginPath(); tg.moveTo(rx0, ry + .5); tg.lineTo(rx0 + span * pxmm, ry + .5); tg.stroke();
        for (var m = 0; m <= span; m++) { var x = rx0 + m * pxmm, hh = m % 10 ? (m % 5 ? 4 : 7) : 11; tg.beginPath(); tg.moveTo(Math.round(x) + .5, ry); tg.lineTo(Math.round(x) + .5, ry - hh); tg.stroke(); if (!(m % 10)) tg.fillText(m / 10 + " cm", x + 3, ry + 15); }
        var ratio = Math.abs(sp.L - sp.W) < .05, dims = ratio ? sp.L.toFixed(1) : sp.L.toFixed(1) + " × " + sp.W.toFixed(1), each = (sp.each || d.ct / (sp.n || 36));
        st2.textContent = T("Each stone of your line, on that measure:", "כל אבן בצמיד שלכם, לפי המידה הזאת:");
        big.textContent = he() ? "כל אבן כ־" + iso(dims) + " מ״מ, כ־" + iso(each.toFixed(2)) + " קראט. " + iso(sp.n + "") + " אבנים בצמיד של " + iso(d.wrist) + " ס״מ."
          : "Each stone ≈ " + dims + " mm, ≈" + each.toFixed(2) + " ct. " + sp.n + " stones in a " + d.wrist + " cm line.";
        ts.setAttribute("aria-label", big.textContent);
      }
      cw.addEventListener("input", function () { draw(true); }); var rs = function () { draw(false); }; addEventListener("resize", rs);
      requestAnimationFrame(function () { draw(false); });
      return function () { removeEventListener("resize", rs); };
    }); }

  /* ── the three, right under the builder's own enquiry ── */
  var I = {
    light: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="2.4"/></svg>',
    hint: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="M3.5 6.8 12 13l8.5-6.2"/></svg>',
    size: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="10" rx="1"/><path d="M7 7v3M11 7v4M15 7v3M19 7v2"/></svg>'
  };
  function bar() { var r = document.getElementById("reserve"); if (!r || !r.parentNode) return false; if (document.querySelector("#configure .x15row")) return true;
    var row = el("div", "x15row"); row.setAttribute("role", "group"); row.setAttribute("aria-label", "More");
    row.innerHTML = '<button class="x15o" type="button" data-x="light">' + I.light + '<span data-en="In the light" data-he="באור">In the light</span></button>'
      + '<button class="x15o" type="button" data-x="size">' + I.size + '<span data-en="True size" data-he="גודל אמיתי">True size</span></button>'
      + '<button class="x15o" type="button" data-x="hint">' + I.hint + '<span data-en="Send a hint" data-he="לשלוח רמז">Send a hint</span></button>';
    /* the enquiry button is moved about as the builder lays itself out: the three follow it */
    var q = 0, place = function () { q = 0; var rr = document.getElementById("reserve"); if (rr && rr.nextElementSibling !== row) rr.insertAdjacentElement("afterend", row); };
    place(); new MutationObserver(function () { if (!q) q = requestAnimationFrame(place); }).observe(document.getElementById("configure") || document.body, { childList: true, subtree: true });
    words(row); row.addEventListener("click", function (e) { var b = e.target.closest(".x15o"); if (!b) return; var x = b.getAttribute("data-x"); if (x === "light") openLight(); else if (x === "size") openSize(); else openHint(); });
    new MutationObserver(function () { words(row); row.setAttribute("aria-label", T("More about your design", "עוד על העיצוב שלכם")); if (dlg.open) words(dlg); }).observe(root, { attributes: true, attributeFilter: ["data-lang"] });
    row.setAttribute("aria-label", T("More about your design", "עוד על העיצוב שלכם")); return true; }
  var n = 0; (function put() { if (!bar() && ++n < 60) setTimeout(put, 150); })();
})();
