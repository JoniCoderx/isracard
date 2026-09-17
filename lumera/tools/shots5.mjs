import { chromium } from "playwright-core";
import fs from "fs";
const DIR = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/v21";
fs.mkdirSync(DIR, { recursive:true });
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [tag, w, h] of [["d",1440,900],["m390",390,844]]) {
  const p = await b.newPage({ viewport:{ width:w, height:h }, deviceScaleFactor:2 });
  await p.goto("http://127.0.0.1:8777/", { waitUntil:"load" });
  await p.waitForTimeout(2800); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
  await p.waitForTimeout(1200);
  /* the dissolve on the way out */
  const top = await p.evaluate(() => scrollY + document.getElementById("filmpin").getBoundingClientRect().top);
  const ph  = await p.evaluate(() => document.getElementById("filmpin").offsetHeight);
  for (const f of [0.55, 0.80, 0.88, 0.94, 1.0]) {
    await p.evaluate(([t, hh, ff, ih]) => window.scrollTo({ top: t + (hh - ih) * ff, behavior:"instant" }), [top, ph, f, h]);
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${DIR}/${tag}-out-${String(Math.round(f*100))}.png` });
  }
  /* the house mark taking the light as it crosses the screen */
  await p.evaluate(() => { const e = document.getElementById("house"); window.scrollTo({ top: scrollY + e.getBoundingClientRect().top - 260, behavior:"instant" }); });
  await p.waitForTimeout(900);
  for (const d of [0, 150, 150]) {
    if (d) { await p.evaluate(v => window.scrollBy({ top: v, behavior:"instant" }), d); await p.waitForTimeout(700); }
    await p.screenshot({ path: `${DIR}/${tag}-mark-${d ? "s" + d : "0"}-${Math.random().toString(36).slice(2,5)}.png`, clip: tag === "d" ? { x:420, y:0, width:600, height:620 } : undefined });
  }
  await p.close();
}
console.log("ok"); await b.close();
