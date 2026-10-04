import fs from "node:fs";
import { body, MARK, MARK_W } from "./body.mjs";
const S = new URL(".", import.meta.url).pathname;
/* Measures in ch follow the width of the "0" of whatever face is in use, so
   changing the type would have widened or narrowed every column set in ch
   (61 of them) and moved the line breaks. They are pinned to the width the
   house's "0" had when those columns were drawn: .593em in Latin (Urbanist),
   .482em in Hebrew (Assistant). See --ch in style.css. */
const css = fs.readFileSync(S + "style.css", "utf8").replace(/(\d*\.?\d+)ch\b/g, "calc($1 * var(--ch))");
/* The house type is served with the site (public/fonts): Fraunces for the
   display and the italic voice, Manrope for everything read and pressed,
   Rubik and Assistant for Hebrew, and the six letters of the wordmark in
   Urbanist. Only Arabic is still fetched from Google, and only by a page
   that has Arabic on it (the files are split by unicode range). */
const FONT_HREF = "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500&display=swap";
/* each face is matched to the one it replaces, so lines break where they did:
   Manrope runs about 4% wider than Urbanist, Fraunces upright about 15%
   narrower and lower in the x-height than the light Urbanist headlines it
   takes over, Rubik about 6% wider than Assistant */
const SIZE_ADJUST = { Manrope: { normal: "96%" }, Fraunces: { normal: "108%" }, Rubik: { normal: "95%" } };
const FONT_FACES = ["fraunces", "manrope", "rubik", "assistant", "wordmark"].map(n => fs.readFileSync(S + "../public/fonts/" + n + ".css", "utf8")).join("\n")
  .replace(/url\(([^)]+\.woff2)\)/g, "url(fonts/$1)")
  .replace(/@font-face \{([^}]*)\}/g, (m, body) => { const fam = (body.match(/font-family: '([^']+)'/) || [])[1], st = (body.match(/font-style: (\w+)/) || [])[1];
    const sa = SIZE_ADJUST[fam] && SIZE_ADJUST[fam][st]; return sa ? "@font-face {" + body.replace(/\s*$/, "") + "\n  size-adjust: " + sa + ";\n}" : m; });
let s1 = fs.readFileSync(S + "script1.html", "utf8");
const s8 = fs.readFileSync(S + "script8.html", "utf8"), s2 = fs.readFileSync(S + "script2.html", "utf8"), s3 = fs.readFileSync(S + "script3.html", "utf8"), s4 = fs.readFileSync(S + "script4.html", "utf8"), s5 = fs.readFileSync(S + "script5.html", "utf8"), s6 = fs.readFileSync(S + "script6.html", "utf8");
const s9 = fs.readFileSync(S + "script9.html", "utf8");
function rep(a, b) { if (!s1.includes(a)) { console.error("MISSING in script1:", a.slice(0, 80)); process.exit(1); } s1 = s1.replace(a, b); }
rep(`window.__lock();`, `window.__lock(); window.__defer = window.__defer || [];`);
rep(`document.querySelectorAll(".rv").forEach(function (el) { io.observe(el); });`, `document.querySelectorAll(".rv:not(.late)").forEach(function (el) { io.observe(el); });`);
rep(`header.classList.add("show"); where.classList.add("show");`, `header.classList.add("show"); where.classList.add("show"); document.querySelectorAll(".late").forEach(function (el) { el.classList.add("in"); }); requestAnimationFrame(function () { var q = window.__defer || []; window.__defer = { push: function (f) { f(); } }; (function step() { var f = q.shift(); if (!f) return; try { f(); } catch (err) { console.error(err); } if (q.length) requestAnimationFrame(step); })(); });`);
rep(`price(); var k = stoneCur; stoneCur = -1; setStone(k); curSec = null; compass();`, `price(); var k = stoneCur; stoneCur = -1; setStone(k); curSec = null; compass(); if (window.__fx) window.__fx.relang();`);
rep(`var alias = { standard: "inside", atelier: "partners" }`, `var alias = { standard: "inside", wrist: "what", voices: "clients", partners: "clients" }`);

/* v9: wrist size, the inside film is gone (the glints themselves went in v103) */
rep(`window.__build = { origin: "lab", ct: 6, metal: "white" };`, `window.__build = { origin: "lab", ct: 6, metal: "white", wrist: 17, cut: "round" };`);
rep(`sumStones.textContent = "36 × " + (b.ct / 36).toFixed(2) + " ct"; sumMetal.textContent = mname(b.metal); sumOrigin.textContent = oname(b.origin);`, `sumStones.textContent = "36 × " + (b.ct / 36).toFixed(2) + " ct"; sumMetal.textContent = mname(b.metal); sumOrigin.textContent = oname(b.origin); $("sumWrist").textContent = b.wrist + " cm";`);
rep(`$("lineLen").innerHTML = (36 * (mm + 0.7) / 10).toFixed(1) + "<small>cm</small>";`, `$("lineLen").innerHTML = b.wrist + "<small>cm</small>";`);
rep(`window.__build[k] = k === "ct" ? Number(v) : v;`, `window.__build[k] = (k === "ct" || k === "wrist") ? Number(v) : v;`);
/* (the Line's reservation is a selection now, not a sentence in the message) */
rep(`var iv = $("insidevid"), ivLoaded = false;`, `var iv = $("insidevid"), ivLoaded = true;`);
rep(`function insideTick() { var r = iv.getBoundingClientRect();`, `function insideTick() { if (!iv) return; var r = iv.getBoundingClientRect();`);

/* v10: no particles; the box replaces the stone */
rep(`var n = desk() ? 110 : 55; motes = [];`, `var n = 0; motes = [];`);

/* v11: a shorter intro, lazy macro film, prices in any currency, a crossfade on language change, compass aliases */
rep(`var iv = $("insidevid"), ivLoaded = true;`, `var iv = $("insidevid"), ivLoaded = false;`);
rep(`estEl.textContent = "AED " + (Math.round(total / 500) * 500).toLocaleString("en-US");`, `estEl.setAttribute("data-aed", Math.round(total / 500) * 500); estEl.textContent = window.__money ? window.__money.fmt(Math.round(total / 500) * 500) : "AED " + (Math.round(total / 500) * 500).toLocaleString("en-US");`);
/* the language lives in the address: Hebrew has a page of its own, French,
   Russian and Arabic ride on ?lang=, so a link copied in one language opens
   in it. Moving between the English and the Hebrew address is a page load. */
rep(`function setLang(c) { lang = c; try { localStorage.setItem("silavu-lang", c); } catch (e) {} applyLang(); }`, `function setLang(c) { if (c === lang) return; try { localStorage.setItem("silavu-lang", c); } catch (e) {}
    var onHe = window.__pageLang === "he", root = new URL(".", document.baseURI);
    if (c === "he" && !onHe) { location.href = new URL("he/", root).href + location.hash; return; }
    if (c !== "he" && onHe) { location.href = root.href + (c === "en" ? "" : "?lang=" + c) + location.hash; return; }
    langURL(c);
    var h = document.documentElement; h.classList.add("langing"); setTimeout(function () { lang = c; applyLang(); if (window.__money) window.__money.refresh(); requestAnimationFrame(function () { h.classList.remove("langing"); }); }, entered ? 220 : 0); }
  function langURL(c) { try { var u = new URL(location.href); if (c === "en" || c === "he") u.searchParams.delete("lang"); else u.searchParams.set("lang", c); if (u.href !== location.href) history.replaceState(history.state, "", u.pathname + u.search + u.hash); } catch (e) {} }`);
rep(`var alias = { standard: "inside", wrist: "what", voices: "clients", partners: "clients" }`, `var alias = { macro: "collection", wrist: "build", voices: "clients", partners: "clients" }`);

/* v12: the piece window opens from the piece */
/* openModal carries its own origin logic in script1 now; it used to be patched
   in here, which meant every edit to that function broke the build. */
/* v12's openModal(pmodal, pc) is now written directly in the piece window */
/* v18: the price and the numbers follow the cut and the count of stones */
const NEW_PRICE = `  var CUTS = {
    round: { kL: 6.5, ratio: 1, orient: "along", set: "prong", price: 1, en: "Round brilliant", he: "בריליאנט עגול" },
    oval: { kL: 7.6, ratio: 1.38, orient: "along", set: "prong", price: 0.9, en: "Oval", he: "אובל" },
    cushion: { kL: 5.8, ratio: 1, orient: "along", set: "prong", price: 0.84, en: "Cushion", he: "קושן" },
    princess: { kL: 5.5, ratio: 1, orient: "along", set: "channel", price: 0.8, en: "Princess", he: "פרינסס" },
    emerald: { kL: 7.0, ratio: 1.45, orient: "along", set: "channel", price: 0.86, en: "Emerald", he: "אמרלד" },
    marquise: { kL: 10.0, ratio: 2, orient: "along", set: "prong", price: 0.9, en: "Marquise", he: "מרקיזה" },
    pear: { kL: 8.4, ratio: 1.55, orient: "along", set: "prong", price: 0.88, en: "Pear", he: "טיפה" },
    baguette: { kL: 7.4, ratio: 2, orient: "across", set: "channel", price: 0.72, en: "Baguette", he: "באגט" }
  };
  var SHAPE = { round: "50%", oval: "50%", cushion: "30%", princess: "6%", emerald: "0", baguette: "0", marquise: "0", pear: "0" };
  var CLIP = { emerald: "polygon(18% 0,82% 0,100% 18%,100% 82%,82% 100%,18% 100%,0 82%,0 18%)", baguette: "polygon(4% 0,96% 0,100% 4%,100% 96%,96% 100%,4% 100%,0 96%,0 4%)", marquise: "polygon(0 50%,12% 22%,30% 6%,50% 0,70% 6%,88% 22%,100% 50%,88% 78%,70% 94%,50% 100%,30% 94%,12% 78%)", pear: "polygon(100% 50%,78% 22%,55% 4%,35% 0,15% 8%,3% 28%,0 50%,3% 72%,15% 92%,35% 100%,55% 96%,78% 78%)" };
  /* the line holds as many stones as the wrist allows: the size of each stone follows its share of the weight, and the count follows the size */
  /* The line has to close as a real bracelet. The stone count is not chosen —
     it falls out of the wrist, the weight and the setting pitch:

        n stones, each of ct/n carats, each measuring kL·∛(ct/n) along the line,
        separated by the metal a shared prong needs, must fill the circumference
        left once the clasp is taken out:

            kL·∛ct · n^(2/3)  +  pitch · n  =  length

     That is monotonic in n, so the largest n that still fits is the answer.
     A two carat line and a twenty carat line on the same wrist therefore carry
     different numbers of stones — as they must. */
  function lineSpec(b) {
    var c = CUTS[b.cut] || CUTS.round;
    var CLASP = 12, EASE = 10, PITCH = 0.18;           /* mm: clasp, comfort, metal between prongs */
    var lenMm = b.wrist * 10 + EASE - CLASP;
    var A = c.kL * Math.cbrt(b.ct); if (c.orient === "across") A = A / c.ratio;
    var n = 8;
    for (var k = 8; k <= 200; k++) { if (A * Math.pow(k, 2 / 3) + PITCH * k <= lenMm) n = k; else break; }
    var each = b.ct / n;
    var L = c.kL * Math.cbrt(each), Wd = L / c.ratio;
    var along = c.orient === "across" ? Wd : L, across = c.orient === "across" ? L : Wd;
    var gap = Math.max(PITCH, lenMm / n - along);
    return { cut: b.cut || "round", n: n, each: each, L: L, W: Wd, alongMm: along, acrossMm: across,
             pitchMm: along + gap, gapMm: gap, orient: c.orient, set: c.set, ratio: c.ratio, lenMm: lenMm };
  }
  /* The estimate comes from one place, src/pricing.json, and is shown only
     when that list is marked approved, carries the date it was set, and is
     not older than it says it may be. Otherwise the builder says the price
     is given on request, and nothing on the page or in the saved picture
     pretends to a number. */
  var PR = window.SILAVU_PRICING || {};
  function fresh(o) { if (!o || !o.approved || !o.updated) return false; var t = Date.parse(o.updated); return !isNaN(t) && (Date.now() - t) / 864e5 <= (o.maxAgeDays || 120); }
  var EST = window.__est = {
    get live() { return fresh(PR); },
    label: function () { return EST.live ? L2("Estimated price", "מחיר משוער") : L2("Price", "מחיר"); },
    note: function () { return EST.live
      ? L2("An estimated price for the design you chose. The final price is confirmed once the stones and the specification are chosen.", "מחיר משוער לעיצוב שבחרתם. המחיר הסופי יאושר לאחר בחירת האבנים והמפרט.")
      : L2("Priced personally, for the stones and the specification you choose.", "המחיר נקבע באופן אישי, לפי האבנים והמפרט שתבחרו."); }
  };
  function price() {
    var b = window.__build, c = CUTS[b.cut] || CUTS.round, spec = lineSpec(b), each = spec.each, nat = b.origin === "natural";
    var S = (PR.stones || {})[nat ? "natural" : "lab"] || {}, M = PR.metal || {}, K = PR.making || {}, R = PR.roundTo || 500;
    var perCt = (S.perCtAtRef || 0) * Math.pow(each / (S.refCt || 0.17), S.exponent || 1) * c.price;
    var stones = perCt * b.ct, metal = b.metal === "platinum" ? (M.platinum || 0) : (M.gold18k || 0), making = (K.base || 0) + (c.set === "channel" ? (K.channelSetting || 0) : 0) + spec.n * (K.perStone || 0);
    var total = Math.round((stones + metal + making) / R) * R, live = EST.live && total > 0;
    var tot = estEl.closest(".tot"); if (tot) tot.classList.toggle("onreq", !live);
    var k = tot && tot.querySelector(".estk"), nt = tot && tot.querySelector(".estnote");
    if (k) { k.setAttribute("data-en", live ? "Estimated price" : "Price"); k.setAttribute("data-he", live ? "מחיר משוער" : "מחיר"); k.textContent = EST.label(); }
    if (nt) { nt.setAttribute("data-en", live ? "An estimated price for the design you chose. The final price is confirmed once the stones and the specification are chosen." : "Priced personally, for the stones and the specification you choose.");
      nt.setAttribute("data-he", live ? "מחיר משוער לעיצוב שבחרתם. המחיר הסופי יאושר לאחר בחירת האבנים והמפרט." : "המחיר נקבע באופן אישי, לפי האבנים והמפרט שתבחרו."); nt.textContent = EST.note(); }
    if (live) { estEl.setAttribute("data-aed", total); estEl.textContent = window.__money ? window.__money.fmt(total) : "≈ AED " + total.toLocaleString("en-US"); }
    else { estEl.setAttribute("data-aed", "0"); estEl.setAttribute("data-en", "Price on request"); estEl.setAttribute("data-he", "מחיר לפי פנייה"); estEl.textContent = L2("Price on request", "מחיר לפי פנייה"); }
    if (live) { estEl.removeAttribute("data-en"); estEl.removeAttribute("data-he"); }
    /* the weight of one stone is the total shared out and rounded, so it is
       marked as approximate: 44 × 0.14 is 6.16, not the 6 ct chosen */
    sumStones.textContent = spec.n + " × ≈" + each.toFixed(2) + " ct · " + (lang === "he" ? c.he : (T(c.en) || c.en)); sumMetal.textContent = mname(b.metal); sumOrigin.textContent = oname(b.origin); $("sumWrist").textContent = b.wrist + " cm";
    $("eachCt").innerHTML = "≈" + each.toFixed(2) + "<small>ct</small>";
    $("eachMm").innerHTML = (c.ratio === 1 ? spec.L.toFixed(1) : spec.L.toFixed(1) + "×" + spec.W.toFixed(1)) + "<small>mm</small>";
    $("eachLbl").textContent = ({ he: "כל אחת מ־" + spec.n + " האבנים, בקירוב", fr: "Chacune des " + spec.n + " pierres, environ", ru: "Каждый из " + spec.n + " камней, примерно", ar: "كل حجر من " + spec.n + " حجرًا، تقريبًا" })[lang] || "Each of the " + spec.n + " stones, approx.";
    $("lineLen").innerHTML = b.wrist + "<small>cm</small>";
    var st = $("stone1"), k = 3.78 * 2.2, pw = Math.max(18, Math.min(64, spec.L * k)), ph = Math.max(10, Math.min(64, spec.W * k)); st.style.width = pw + "px"; st.style.height = ph + "px"; st.style.borderRadius = SHAPE[b.cut] || "50%"; st.style.clipPath = CLIP[b.cut] || "none";
    window.__lineSpec = spec; try { window.dispatchEvent(new Event("silavu:build")); } catch (e) {}
  }
`;
if (!/  function price\(\) \{[\s\S]*?\n  \}\n/.test(s1)) { console.error("price() not found"); process.exit(1); }
s1 = s1.replace(/  function price\(\) \{[\s\S]*?\n  \}\n/, NEW_PRICE);
/* hero reveals wait for the intro to lift */
let b = body;
const hs = b.indexOf('<section id="hero"'), he = b.indexOf("</section>", hs);
b = b.slice(0, hs) + b.slice(hs, he).replace(/class="([^"]*)\brv\b([^"]*)"/g, 'class="$1rv late$2"') + b.slice(he);
/* the three heavy canvases wait for the loader: they are stored, then run in order */
const defer = (s) => s.replace(/^<script>\n/, "<script>\n(window.__defer = window.__defer || []).push(function () {\n").replace(/<\/script>\n?$/, "});\n</script>\n");
/* the symbol as a mask, available to anything on the page that wants to light it */
const MKVAR = ":root{--mk:url('data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + Math.ceil(MARK_W) + ' 1000" preserveAspectRatio="none"><path d="' + MARK + '" fill="#fff"/></svg>') + "');"
  /* the same mark with its own proportions, for places that must never stretch it */
  + "--mkfit:url('data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="' + Math.ceil(MARK_W) + '" height="1000" viewBox="0 0 ' + Math.ceil(MARK_W) + ' 1000"><path d="' + MARK + '" fill="#fff"/></svg>') + "')}\n";
/* The typefaces load from a real <link>, not from an @import inside the sheet.
   An @import is only honoured at the very top of a stylesheet, and this sheet
   opens with the mark variable above — the import sat second and the browser
   dropped it, so the whole house was setting in system-ui and Georgia. A link
   also starts the fetch immediately instead of waiting for half a megabyte of
   CSS to parse first. gen-static.mjs lifts this tag into the document head. */
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
  + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
  + '<link rel="stylesheet" href="' + FONT_HREF + '">';
/* the price list the estimate reads, without its note to the editor */
const PRICING = JSON.parse(fs.readFileSync(S + "pricing.json", "utf8")); delete PRICING._read_me;
const pricingTag = `<script>window.SILAVU_PRICING = ${JSON.stringify(PRICING)};</script>`;
const page = `<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<title>SILAVU</title>\n${FONTS}\n<style>\n${MKVAR}${FONT_FACES}\n${css}</style>\n${b}\n${pricingTag}\n${s1}\n${defer(s2)}\n${defer(s3)}\n${defer(s8)}\n${s4}\n${s5}\n${s6}\n${s9}`;
/* lighter on the wire: dead rules out, the sheet and the scripts minified (see slim.mjs) */
const { slim } = await import("./slim.mjs");
const slimmed = process.env.NO_SLIM ? page : await slim(page, ["gen-static.mjs", "src/body.mjs", "src/pieces.mjs", "src/about.mjs", "src/policies.mjs"]);
fs.writeFileSync("/home/user/isracard/lumera/site/silavu-page.html", slimmed);
console.log("page", (page.length / 1024).toFixed(0), "KB; scripts", (page.match(/<script>/g) || []).length);
