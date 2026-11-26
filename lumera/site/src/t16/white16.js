/* /test16/: the home page in white (the house, 26 Nov 2026: "an option for the home page in white").
   The page's own stylesheets were written for black, with their colours written out by hand in thousands of rules
   (and their states: hover, chosen chips, open dialogs, the phone's menu). Rather than chase each one, this reads those
   rules once, at load, and writes a second sheet with the same selectors (so the same weight, the same media and the
   same states) where every colour is moved onto the white house palette:
     ivory and white type and hairlines  -> ink, keeping their own transparency (so the hierarchy stays)
     warm gold type                      -> the house's light-theme gold (#8a6f3c)
     black grounds and dark veils        -> paper, keeping their transparency (frosted white instead of smoked glass)
     faint white tints on dark           -> the same faint tint in ink
     solid ivory buttons                 -> solid ink, their dark letters -> paper
   Text drawn as a gradient (background-clip: text) is moved to ink and gold too, or it would vanish on white.
   Nothing that is a photograph, a film, a 3D render, the knot or the box is touched: the hero's film, the box's
   sequence and the craft reel keep their own light type, because they keep their own dark pictures behind it
   (see EXEMPT). src/t16/white16.css then shapes what a mapping cannot: the grounds, the hero's fade, the collections'
   sky, the builder's stage, the frames around the pictures. Runs once; no listeners, nothing per frame. */
(function () {
  var root = document.documentElement; if (!root.classList.contains("w16")) return;
  var PAPER = [251, 250, 247], INK = [22, 20, 16], GOLD = [138, 111, 60];
  /* rules inside these keep their light type: their ground is a picture that stays dark. They are marked once with a
     class, so each re-coloured rule carries a short ":not(.w16x, .w16x *)" rather than the whole list */
  var KEEP = "#hero, #stonepin, .sg16reel, #pmodal, .ivory, .dpage.light, #intro, #header, .b14macro, #tryon .tstage, #details .ar15pin";
  [].forEach.call(document.querySelectorAll(KEEP), function (e) { e.classList.add("w16x"); });
  var EXEMPT = ".w16x, .w16x *";
  var NAMED = { white: [255, 255, 255, 1], black: [0, 0, 0, 1], ivory: [255, 255, 240, 1] };
  function parse(s) {
    var m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(s);
    if (m) { var a = m[4] == null ? 1 : (/%$/.test(m[4]) ? parseFloat(m[4]) / 100 : +m[4]); return [+m[1], +m[2], +m[3], a]; }
    m = /^#([0-9a-f]{3,8})$/i.exec(s);
    if (m) { var h = m[1]; if (h.length < 6) h = h.split("").map(function (c) { return c + c; }).join("");
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1]; }
    return NAMED[s.toLowerCase()] || null;
  }
  function L(c) { return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; }
  function S(c) { return (Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2])) / 255; }
  function out(t, a) { a = Math.round(a * 1000) / 1000; return a >= 1 ? "rgb(" + t.join(",") + ")" : "rgba(" + t.join(",") + "," + a + ")"; }
  var COLOR_RE = /rgba?\([^)]*\)|#[0-9a-f]{3,8}\b|\b(?:white|black)\b/gi;
  /* kind: "ink" (type and lines), "bg" (grounds), "clip" (gradient-filled type), "veil" (gradients on grounds) */
  function map(s, kind, ctx) {
    var c = parse(s); if (!c || c[3] === 0) return null;
    var l = L(c), sat = S(c);
    if (kind === "ink" || kind === "clip") {
      if (sat > .12 && l > .42 && l < .9) return out(GOLD, Math.min(1, c[3] * 1.1));
      if (l > .55) return out(INK, kind === "clip" ? 1 : c[3]);
      if (l < .16 && ctx && ctx.lightBg) return out(PAPER, c[3]);
      return null;
    }
    if (kind === "bg") {
      if (sat > .15 && l < .35) return out(GOLD, Math.min(.16, c[3] * .6));
      if (l < .2) return out(PAPER, c[3]);
      if (l > .78) return out(INK, c[3] >= .5 ? 1 : c[3]);
      return null;
    }
    if (kind === "veil") { if (l < .2 && sat < .15) return out(PAPER, c[3]); return null; }
    if (kind === "tshadow") { if (l < .3) return out(PAPER, c[3]); return null; }
    if (kind === "ring") { if (l > .6) return out(INK, c[3]); return null; }
    return null;
  }
  function mapAll(v, kind, ctx) { var changed = false;
    var r = v.replace(COLOR_RE, function (m) { var x = map(m, kind, ctx); if (x) { changed = true; return x; } return m; });
    return changed ? r : null; }
  /* box-shadow: only hard rings (no blur) are lines; soft light glows stay as they are (on white they are not seen) */
  function mapShadow(v) { var parts = [], d = 0, cur = "";
    for (var i = 0; i < v.length; i++) { var ch = v[i]; if (ch === "(") d++; if (ch === ")") d--; if (ch === "," && !d) { parts.push(cur); cur = ""; } else cur += ch; }
    parts.push(cur); var changed = false;
    parts = parts.map(function (p) { var nums = p.replace(COLOR_RE, "").match(/-?[\d.]+px|\b0\b/g) || []; var blur = nums[2] ? parseFloat(nums[2]) : 0;
      if (blur > 1.5) return p; var r = mapAll(p, "ring"); if (r) { changed = true; return r; } return p; });
    return changed ? parts.join(",") : null; }
  var INKP = ["color", "-webkit-text-fill-color", "caret-color", "fill", "stroke", "text-decoration-color", "outline-color",
    "border-top-color", "border-right-color", "border-bottom-color", "border-left-color", "column-rule-color", "accent-color"];
  function splitSel(sel) { var o = [], d = 0, cur = ""; for (var i = 0; i < sel.length; i++) { var ch = sel[i]; if (ch === "(" || ch === "[") d++; if (ch === ")" || ch === "]") d--; if (ch === "," && !d) { o.push(cur); cur = ""; } else cur += ch; } o.push(cur); return o; }
  function scope(sel) {
    return splitSel(sel).map(function (s) { s = s.trim(); if (!s) return s;
      var m = /(::?(?:before|after|placeholder|selection|marker|first-line|first-letter|backdrop|file-selector-button|-webkit-[a-z-]+|-moz-[a-z-]+)(?:\([^)]*\))?)+\s*$/.exec(s);
      var head = m ? s.slice(0, m.index) : s, tail = m ? m[0] : "";
      if (!head || /[\s>+~]$/.test(head)) head += "*";
      return head + ":not(:where(" + EXEMPT + "))" + tail; }).join(",");
  }
  function rule(r) {
    var st = r.style, decl = [], lightBg = false;
    var bgc = st.getPropertyValue("background-color"), bgi = st.getPropertyValue("background-image");
    var bc = bgc && parse(bgc.trim()); if (bc && bc[3] > .5 && L(bc) > .78) lightBg = true;
    var clip = /text/.test(st.getPropertyValue("-webkit-background-clip") + st.getPropertyValue("background-clip"));
    function put(p, v) { decl.push(p + ":" + v + (st.getPropertyPriority(p) ? " !important" : "")); }
    for (var i = 0; i < INKP.length; i++) { var v = st.getPropertyValue(INKP[i]); if (!v) continue; var x = mapAll(v, "ink", { lightBg: lightBg }); if (x) put(INKP[i], x); }
    if (bgc) { var y = mapAll(bgc, "bg"); if (y) put("background-color", y); }
    if (bgi && /gradient/.test(bgi)) { var z = mapAll(bgi, clip ? "clip" : "veil"); if (z) put("background-image", z); }
    var ts = st.getPropertyValue("text-shadow"); if (ts && ts !== "none") { var t = mapAll(ts, "tshadow"); if (t) put("text-shadow", t); }
    var bs = st.getPropertyValue("box-shadow"); if (bs && bs !== "none") { var b = mapShadow(bs); if (b) put("box-shadow", b); }
    for (var k = 0; k < st.length; k++) { var n = st[k]; if (n.slice(0, 2) !== "--") continue; var cv = st.getPropertyValue(n).trim(), cp = parse(cv);
      if (!cp) continue; var lab = /bg|ground|paper|plate|fill|surface/.test(n) ? "bg" : "ink", w = map(cv, lab); if (w) put(n, w); }
    return decl.length ? scope(r.selectorText) + "{" + decl.join(";") + "}" : "";
  }
  function walk(list) { var o = [];
    for (var i = 0; i < list.length; i++) { var r = list[i];
      if (r.type === 1) { if (/w16/.test(r.selectorText)) continue; var g = rule(r); if (g) o.push(g); }
      else if (r.type === 4) { var m = walk(r.cssRules); if (m) o.push("@media " + r.conditionText + "{" + m + "}"); }
      else if (r.type === 12) { var s = walk(r.cssRules); if (s) o.push("@supports " + r.conditionText + "{" + s + "}"); } }
    return o.join("\n"); }
  var css = [];
  for (var i = 0; i < document.styleSheets.length; i++) { var sh = document.styleSheets[i], rl = null;
    try { rl = sh.cssRules; } catch (e) { continue; } if (!rl || (sh.ownerNode && sh.ownerNode.id === "w16map")) continue; css.push(walk(rl)); }
  var el = document.createElement("style"); el.id = "w16map"; el.textContent = css.join("\n");
  /* placed before white16.css's own sheet would be wrong: it must follow every sheet it re-colours, and white16.css
     wins over it by weight (html.w16 ...), not by order */
  document.head.appendChild(el);
})();
