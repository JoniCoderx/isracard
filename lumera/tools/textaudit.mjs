/* The rendered page, both languages: text that overflows, numbers that reverse
   in RTL, empty or placeholder strings, and headings out of order. */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const out = [];
for (const [tag, w, h, lang] of [["desk",1440,900,"en"],["mob",390,844,"en"],["mob-he",390,844,"he"],["desk-he",1440,900,"he"]]) {
  const p = await b.newPage({ viewport:{ width:w, height:h }, deviceScaleFactor:2 });
  await p.emulateMedia({ reducedMotion:"reduce" });
  await p.goto("http://127.0.0.1:8777/", { waitUntil:"load" });
  await p.waitForTimeout(2600); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
  if (lang === "he") { await p.evaluate(() => document.getElementById("langBtn").click()); await p.waitForTimeout(900); }
  await p.evaluate(() => document.querySelectorAll(".rv").forEach(e => e.classList.add("in")));
  await p.waitForTimeout(600);
  const r = await p.evaluate(() => {
    const vis = e => { const b = e.getBoundingClientRect(); const c = getComputedStyle(e);
      if (e.closest(".modal:not(.open), #menu:not(.open)")) return false;
      return b.width > 0 && b.height > 0 && c.visibility !== "hidden" && c.display !== "none" && +c.opacity > 0.05; };
    const txt = [...document.querySelectorAll("#silavu p, #silavu .p, #silavu .d, #silavu .t, #silavu .k, #silavu h1, #silavu h2, #silavu .h, #silavu .h2, #silavu li, #silavu .bsl, #silavu a")].filter(vis);
    /* 1. text wider or taller than the box that holds it */
    const spill = txt.filter(e => {
      const c = getComputedStyle(e);
      if (c.overflow === "visible" && c.overflowX === "visible") return false;
      return e.scrollWidth > e.clientWidth + 2 || e.scrollHeight > e.clientHeight + 2;
    }).map(e => ((e.className||e.tagName)+"").split(" ")[0] + "«" + e.textContent.trim().slice(0,26) + "» " + e.scrollWidth + ">" + e.clientWidth);
    /* 2. anything empty or obviously placeholder */
    const empty = txt.filter(e => { const t = e.textContent.replace(/\s/g,""); return t === "" && !e.querySelector("img,svg,canvas,input,i"); })
      .map(e => ((e.className||e.tagName)+"").split(" ")[0]);
    const placeholder = txt.filter(e => /lorem|ipsum|TODO|FIXME|XXX|undefined|NaN|\[object/i.test(e.textContent)).map(e => e.textContent.trim().slice(0,40));
    /* 3. in RTL, a run of Latin/digits must be isolated or it reverses */
    const rtl = document.documentElement.dir === "rtl";
    let bidi = [];
    if (rtl) bidi = txt.filter(e => {
      const t = e.textContent.trim();
      if (!/[A-Za-z0-9]{2,}/.test(t)) return false;
      if (!/[֐-׿]/.test(t)) return false;           /* mixed only */
      const c = getComputedStyle(e);
      const iso = c.unicodeBidi.includes("isolate") || e.querySelector("[dir],bdi,.price,span[dir]");
      return !iso;
    }).map(e => ((e.className||e.tagName)+"").split(" ")[0] + "«" + e.textContent.trim().slice(0,34) + "»");
    /* 4. heading order */
    const hs = [...document.querySelectorAll("#silavu h1, #silavu h2, #silavu h3")].filter(vis).map(e => +e.tagName[1]);
    let jump = 0; hs.forEach((v, i) => { if (i && v > hs[i-1] + 1) jump++; });
    return { spill: spill.slice(0,8), empty: [...new Set(empty)].slice(0,6), placeholder, bidi: bidi.slice(0,8),
             h1: document.querySelectorAll("#silavu h1").length, jump, checked: txt.length };
  });
  out.push(`\n── ${tag} (${r.checked} text nodes)`);
  out.push(`  overflowing its box: ${r.spill.length}` + (r.spill.length ? "\n      " + r.spill.join("\n      ") : ""));
  out.push(`  empty: ${r.empty.length ? r.empty.join(", ") : "none"}   placeholder: ${r.placeholder.length ? r.placeholder.join(" | ") : "none"}`);
  out.push(`  unisolated mixed-script runs: ${r.bidi.length}` + (r.bidi.length ? "\n      " + r.bidi.join("\n      ") : ""));
  out.push(`  h1: ${r.h1}   heading-level jumps: ${r.jump}`);
  await p.close();
}
console.log(out.join("\n"));
await b.close();
