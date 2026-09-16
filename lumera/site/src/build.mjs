import fs from "node:fs";
import { body } from "./body.mjs";
const S = new URL(".", import.meta.url).pathname;
const css = fs.readFileSync(S + "style.css", "utf8");
let s1 = fs.readFileSync(S + "script1.html", "utf8");
const s8 = fs.readFileSync(S + "script8.html", "utf8"), s2 = fs.readFileSync(S + "script2.html", "utf8"), s3 = fs.readFileSync(S + "script3.html", "utf8"), s7 = fs.readFileSync(S + "script7.html", "utf8"), s4 = fs.readFileSync(S + "script4.html", "utf8"), s5 = fs.readFileSync(S + "script5.html", "utf8"), s6 = fs.readFileSync(S + "script6.html", "utf8");
function rep(a, b) { if (!s1.includes(a)) { console.error("MISSING in script1:", a.slice(0, 80)); process.exit(1); } s1 = s1.replace(a, b); }
rep(`window.__lock();`, `window.__lock(); window.__defer = window.__defer || [];`);
rep(`document.querySelectorAll(".rv").forEach(function (el) { io.observe(el); });`, `document.querySelectorAll(".rv:not(.late)").forEach(function (el) { io.observe(el); });`);
rep(`header.classList.add("show"); where.classList.add("show");`, `header.classList.add("show"); where.classList.add("show"); document.querySelectorAll(".late").forEach(function (el) { el.classList.add("in"); }); requestAnimationFrame(function () { var q = window.__defer || []; window.__defer = { push: function (f) { f(); } }; q.forEach(function (f) { try { f(); } catch (err) { console.error(err); } }); });`);
rep(`price(); var k = stoneCur; stoneCur = -1; setStone(k); curSec = null; compass();`, `price(); var k = stoneCur; stoneCur = -1; setStone(k); curSec = null; compass(); if (window.__fx) window.__fx.relang();`);
rep(`var alias = { standard: "inside", atelier: "partners" }`, `var alias = { standard: "inside", wrist: "what", voices: "clients", partners: "clients" }`);

/* v9: wrist size, no glints on buttons, the inside film is gone */
rep(`window.__build = { origin: "lab", ct: 6, metal: "white" };`, `window.__build = { origin: "lab", ct: 6, metal: "white", wrist: 17, cut: "round" };`);
rep(`sumStones.textContent = "36 × " + (b.ct / 36).toFixed(2) + " ct"; sumMetal.textContent = NAMES[b.metal][lang]; sumOrigin.textContent = ORIG[b.origin][lang];`, `sumStones.textContent = "36 × " + (b.ct / 36).toFixed(2) + " ct"; sumMetal.textContent = NAMES[b.metal][lang]; sumOrigin.textContent = ORIG[b.origin][lang]; $("sumWrist").textContent = b.wrist + " cm";`);
rep(`$("lineLen").innerHTML = (36 * (mm + 0.7) / 10).toFixed(1) + "<small>cm</small>";`, `$("lineLen").innerHTML = b.wrist + "<small>cm</small>";`);
rep(`window.__build[k] = k === "ct" ? Number(v) : v;`, `window.__build[k] = (k === "ct" || k === "wrist") ? Number(v) : v;`);
rep(`+ b.ct + " ct · " + ORIG[b.origin][lang] + " · " + NAMES[b.metal][lang] + " · " + estEl.textContent);`, `+ b.ct + " ct · " + ORIG[b.origin][lang] + " · " + NAMES[b.metal][lang] + " · " + b.wrist + " cm · " + estEl.textContent);`);
rep(`var el = e.target.closest && e.target.closest(".card, .piece, .btn, .chip, .voice"); if (el && !reduce) sparkle(el, el.classList.contains("btn") || el.classList.contains("chip") ? 2 : 4); }, true);`, `var el = e.target.closest && e.target.closest(".piece, .card"); if (el && !reduce) sparkle(el, 3); }, true);`);
rep(`var iv = $("insidevid"), ivLoaded = false;`, `var iv = $("insidevid"), ivLoaded = true;`);
rep(`function insideTick() { var r = iv.getBoundingClientRect();`, `function insideTick() { if (!iv) return; var r = iv.getBoundingClientRect();`);

/* v10: no particles, no glints; the box replaces the stone */
rep(`var n = desk() ? 110 : 55; motes = [];`, `var n = 0; motes = [];`);
rep(`var el = e.target.closest && e.target.closest(".piece, .card"); if (el && !reduce) sparkle(el, 3); }, true);`, `var el = null; if (el && !reduce) sparkle(el, 3); }, true);`);

/* v11: a shorter intro, lazy macro film, prices in any currency, a crossfade on language change, compass aliases */
rep(`var iv = $("insidevid"), ivLoaded = true;`, `var iv = $("insidevid"), ivLoaded = false;`);
rep(`estEl.textContent = "AED " + (Math.round(total / 500) * 500).toLocaleString("en-US");`, `estEl.setAttribute("data-aed", Math.round(total / 500) * 500); estEl.textContent = window.__money ? window.__money.fmt(Math.round(total / 500) * 500) : "AED " + (Math.round(total / 500) * 500).toLocaleString("en-US");`);
rep(`btns.forEach(function (b) { b.addEventListener("click", function () { lang = lang === "he" ? "en" : "he"; applyLang(); }); });`, `btns.forEach(function (b) { b.addEventListener("click", function () { var h = document.documentElement; h.classList.add("langing"); setTimeout(function () { lang = lang === "he" ? "en" : "he"; applyLang(); if (window.__money) window.__money.refresh(); requestAnimationFrame(function () { h.classList.remove("langing"); }); }, entered ? 220 : 0); }); });`);
rep(`var alias = { standard: "inside", wrist: "what", voices: "clients", partners: "clients" }`, `var alias = { macro: "collection", wrist: "build", voices: "clients", partners: "clients" }`);

/* v12: the piece window opens from the piece */
rep(`function openModal(m) { m.classList.add("open");`, `function openModal(m, from) { if (from) { var fr = from.getBoundingClientRect(); m.querySelector(".mbox").style.setProperty("--ox", ((fr.left + fr.width / 2) / innerWidth * 100).toFixed(1) + "%"); m.querySelector(".mbox").style.setProperty("--oy", ((fr.top + fr.height / 2) / innerHeight * 100).toFixed(1) + "%"); } m.classList.add("open");`);
rep(`$("pmReq").setAttribute("data-piece", pmPiece); openModal(pmodal);`, `$("pmReq").setAttribute("data-piece", pmPiece); openModal(pmodal, pc);`);
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
  function lineSpec(b) {
    var c = CUTS[b.cut] || CUTS.round, lenMm = (b.wrist + 1) * 10 - 12, gap = c.set === "channel" ? 0.25 : 0.4, each = b.ct / 36, n = 36, L = 3.6, Wd = 3.6, along, across;
    for (var it = 0; it < 5; it++) { L = c.kL * Math.cbrt(each); Wd = L / c.ratio; along = c.orient === "across" ? Wd : L; across = c.orient === "across" ? L : Wd; n = Math.max(8, Math.min(110, Math.round(lenMm / (along + gap)))); each = b.ct / n; }
    return { cut: b.cut || "round", n: n, each: each, L: L, W: Wd, alongMm: along, acrossMm: across, pitchMm: along + gap, orient: c.orient, set: c.set, ratio: c.ratio, lenMm: lenMm };
  }
  function price() {
    var b = window.__build, c = CUTS[b.cut] || CUTS.round, spec = lineSpec(b), each = spec.each, nat = b.origin === "natural";
    var perCt = (nat ? 22000 * Math.pow(each / 0.17, 0.9) : 2200 * Math.pow(each / 0.17, 0.6)) * c.price;
    var stones = perCt * b.ct, metal = b.metal === "platinum" ? 9500 : 6500, making = 9000 + (c.set === "channel" ? 1500 : 0) + spec.n * 40;
    var total = stones + metal + making;
    estEl.setAttribute("data-aed", Math.round(total / 500) * 500); estEl.textContent = window.__money ? window.__money.fmt(Math.round(total / 500) * 500) : "AED " + (Math.round(total / 500) * 500).toLocaleString("en-US");
    sumStones.textContent = spec.n + " × " + each.toFixed(2) + " ct · " + c[lang]; sumMetal.textContent = NAMES[b.metal][lang]; sumOrigin.textContent = ORIG[b.origin][lang]; $("sumWrist").textContent = b.wrist + " cm";
    $("eachCt").innerHTML = each.toFixed(2) + "<small>ct</small>";
    $("eachMm").innerHTML = (c.ratio === 1 ? spec.L.toFixed(1) : spec.L.toFixed(1) + "×" + spec.W.toFixed(1)) + "<small>mm</small>";
    $("eachLbl").textContent = lang === "he" ? "כל אחת מ־" + spec.n + " האבנים" : "Each of the " + spec.n + " stones";
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
const page = `<title>SILAVU</title>\n<style>\n${css}</style>\n${b}\n${s1}\n${defer(s2)}\n${defer(s3)}\n${defer(s8)}\n${defer(s7)}\n${s4}\n${s5}\n${s6}`;
fs.writeFileSync("/home/user/isracard/lumera/site/silavu-page.html", page);
console.log("page", (page.length / 1024).toFixed(0), "KB; scripts", (page.match(/<script>/g) || []).length);
