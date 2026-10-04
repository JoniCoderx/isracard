// Card photographs stay inside the card while the mouse rests on it (the slow walk), and
// the enquiry choices stay inside the form and clear of the SILAVU mark, also while it is hovered.
import { chromium } from "playwright-core";
const O = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/look/";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
let pass = 0, fail = 0; const ok = (c, m, x) => { if (c) pass++; else { fail++; console.log("FAIL", m, x !== undefined ? JSON.stringify(x) : ""); } };
for (const lang of ["", "he/"]) {
  const c = await b.newContext({ viewport: { width: 1366, height: 900 } }); const p = await c.newPage();
  await p.goto("http://localhost:8777/" + lang, { waitUntil: "load" }); await p.waitForTimeout(700); await p.click("#enterBtn", { timeout: 800 }).catch(() => {});
  await p.evaluate(() => document.querySelector(".pgrid").scrollIntoView()); await p.waitForTimeout(1200);
  for (let k = 0; k < 3; k++) {
    const fig = (await p.$$(".pgrid .piece .fig"))[k]; const bx = await fig.boundingBox();
    await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 3);
    const seen = [];
    for (let t = 0; t < 6; t++) { await p.waitForTimeout(1000);
      seen.push(await fig.evaluate(f => { const r = f.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 3;
        const shown = [...f.querySelectorAll(".im")].filter(im => { const q = im.getBoundingClientRect(); return q.left <= x && q.right >= x && q.top <= y && q.bottom >= y; });
        const img = shown.length ? shown[shown.length - 1].querySelector("img") : null; return { n: shown.length, loaded: !!img && img.complete && img.naturalWidth > 0, at: f.closest(".piece").__at }; })); }
    ok(seen.every(s => s.n >= 1 && s.loaded) && new Set(seen.map(s => s.at)).size > 1, `${lang || "en"} card ${k + 1}: a photograph is always on show while the mouse rests, and it walks`, seen);
    await p.mouse.move(5, 5); await p.waitForTimeout(900);
  }
  await p.screenshot({ path: O + `cards-hover-${lang ? "he" : "en"}.png` });
  await c.close();
}
for (const w of [1024, 1180, 1280, 1366, 1440, 1600, 1920]) for (const lang of ["", "he/"]) {
  const c = await b.newContext({ viewport: { width: w, height: 900 } }); const p = await c.newPage();
  await p.goto("http://localhost:8777/" + lang, { waitUntil: "load" }); await p.waitForTimeout(700); await p.click("#enterBtn", { timeout: 800 }).catch(() => {});
  await p.evaluate(() => { document.querySelectorAll(".rv").forEach(e => e.classList.add("in")); document.getElementById("concierge").scrollIntoView(); }); await p.waitForTimeout(600);
  // the mark in its largest state: hovered, letters opened
  await p.evaluate(() => { const e = document.getElementById("emb"); e.classList.add("in", "hov"); }); await p.waitForTimeout(1600);
  const r = await p.evaluate(() => { const R = e => e.getBoundingClientRect();
    const form = R(document.getElementById("cform")), chips = [...document.querySelectorAll("#cform .want .chip, #cform .csub > *")].map(R);
    const parts = [...document.querySelectorAll("#emb .embart, #emb .embword, #emb .embsub")].map(R);
    const rtl = document.documentElement.dir === "rtl";
    const inForm = chips.every(c => c.left >= form.left - 1 && c.right <= form.right + 1);
    const gap = Math.min(...chips.flatMap(c => parts.map(m => (c.bottom < m.top || c.top > m.bottom) ? 999 : (rtl ? c.left - m.right : m.left - c.right))));
    return { inForm, gap: Math.round(gap), formR: Math.round(form.right), chipsR: Math.round(Math.max(...chips.map(c => c.right))) }; });
  ok(r.inForm && r.gap >= 24, `${w} ${lang || "en"} choices inside the form, ≥24px clear of the hovered mark`, r);
  if (w === 1366) await p.screenshot({ path: O + `emb-fixed-${lang ? "he" : "en"}.png` });
  await c.close();
}
console.log(pass + " pass, " + fail + " fail"); await b.close();
