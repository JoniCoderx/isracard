// Card photographs stay inside the card while the mouse rests on it (one soft turn to the
// piece worn, then still: no timed walk), and
// the enquiry choices stay inside the form and clear of the SILAVU mark, also while it is hovered.
import { chromium } from "playwright-core";
const O = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/look/";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
let pass = 0, fail = 0; const ok = (c, m, x) => { if (c) pass++; else { fail++; console.log("FAIL", m, x !== undefined ? JSON.stringify(x) : ""); } };
for (const lang of ["", "he/"]) {
  const c = await b.newContext({ viewport: { width: 1366, height: 900 } }); const p = await c.newPage();
  await p.goto("http://localhost:8777/" + lang, { waitUntil: "load" }); await p.waitForTimeout(700); await p.click("#enterBtn", { timeout: 800 }).catch(() => {}); await p.waitForFunction(() => !document.documentElement.classList.contains("locked"), null, { timeout: 15000 }).catch(() => {});
  await p.evaluate(() => document.querySelector(".pgrid").scrollIntoView()); await p.waitForTimeout(1200);
  for (let k = 0; k < 3; k++) {
    const fig = (await p.$$(".pgrid .piece .fig"))[k]; const bx = await fig.boundingBox();
    const seen = [];
    /* the state before the mouse arrives, then once a second while it rests */
    const sample = () => fig.evaluate(f => { const r = f.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 3;
      const vis = [...f.querySelectorAll(".im")].filter(im => { const q = im.getBoundingClientRect(), s = getComputedStyle(im); return q.left <= x && q.right >= x && q.top <= y && q.bottom >= y && s.visibility === "visible" && +s.opacity > 0.5; });
      const top = vis[vis.length - 1], img = top && top.querySelector("img");
      return { n: 1, cover: !!top && img.naturalWidth > 0, loaded: !!img && img.complete && img.naturalWidth > 0, src: img ? (img.currentSrc || img.src).split("/").pop() : "" }; });
    seen.push(await sample());
    await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 3);
    for (let t = 0; t < 6; t++) { await p.waitForTimeout(1000); seen.push(await sample()); }
    /* never an empty card (a sample mid-slide has two frames sharing it), and
       at least three different photographs actually come into the window */
    /* never an empty card, one photograph at a time, and exactly one turn:
       from the piece on white to the piece worn, where it then rests */
    const srcs = seen.map(s => s.src).filter(Boolean), changes = srcs.filter((v, i) => i && v !== srcs[i - 1]).length;
    ok(seen.every(s => s.cover && s.n <= 1 && s.loaded) && changes === 1 && /worn/.test(srcs[srcs.length - 1]), `${lang || "en"} card ${k + 1}: one photograph at a time, one soft turn to the piece worn, then still`, seen.map(s => s.n + ":" + s.src));
    await p.mouse.move(5, 5); await p.waitForTimeout(900);
  }
  await p.screenshot({ path: O + `cards-hover-${lang ? "he" : "en"}.png` });
  await c.close();
}
for (const w of [1024, 1180, 1280, 1366, 1440, 1600, 1920]) for (const lang of ["", "he/"]) {
  const c = await b.newContext({ viewport: { width: w, height: 900 } }); const p = await c.newPage();
  await p.goto("http://localhost:8777/" + lang, { waitUntil: "load" }); await p.waitForTimeout(700); await p.click("#enterBtn", { timeout: 800 }).catch(() => {}); await p.waitForFunction(() => !document.documentElement.classList.contains("locked"), null, { timeout: 15000 }).catch(() => {});
  await p.evaluate(() => { document.querySelectorAll(".rv").forEach(e => e.classList.add("in")); document.getElementById("concierge").scrollIntoView(); }); await p.waitForTimeout(600);
  // the mark in its largest state: hovered, letters opened
  await p.evaluate(() => { const e = document.getElementById("emb"); e.classList.add("in", "hov"); }); await p.waitForTimeout(1600);
  const r = await p.evaluate(() => { const R = e => e.getBoundingClientRect();
    const form = R(document.getElementById("cform")), chips = [...document.querySelectorAll("#cform .want .chip, #cform .csub > *")].filter(e => !e.hidden && e.getBoundingClientRect().width > 0).map(R);
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
