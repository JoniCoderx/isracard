import { chromium } from "playwright-core";
import fs from "fs";
const DIR = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/v20";
fs.mkdirSync(DIR, { recursive:true });
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [tag, w, h] of [["d",1440,900],["m390",390,844],["m320",320,720],["ipad",768,1024]]) {
  const p = await b.newPage({ viewport:{ width:w, height:h }, deviceScaleFactor:2 });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("http://127.0.0.1:8777/", { waitUntil:"load" });
  await p.waitForTimeout(2800); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
  await p.waitForTimeout(1200);
  const pinTop = await p.evaluate(() => scrollY + document.getElementById("filmpin").getBoundingClientRect().top);
  const pinH   = await p.evaluate(() => document.getElementById("filmpin").offsetHeight);
  for (const f of [0.0, 0.08, 0.30, 0.55, 0.80, 0.97]) {
    await p.evaluate(([t, hh, ff, ih]) => window.scrollTo({ top: t + (hh - ih) * ff, behavior:"instant" }), [pinTop, pinH, f, h]);
    /* the scrub is smoothed, so let it settle */
    await p.waitForTimeout(1600);
    await p.screenshot({ path: `${DIR}/${tag}-${String(Math.round(f*100)).padStart(2,"0")}.png` });
  }
  const st = await p.evaluate(() => ({ ok: window.__film.ok, loaded: window.__film.loaded, req: window.__film.requested, frame: window.__film.frame, p: +window.__film.p.toFixed(3),
    sw: document.documentElement.scrollWidth, iw: innerWidth,
    cv: (() => { const c = document.getElementById("filmcv"); const r = c.getBoundingClientRect(); return Math.round(r.width)+"x"+Math.round(r.height)+" buf "+c.width+"x"+c.height; })() }));
  console.log(tag, JSON.stringify(st), "errors:", errs.length, errs.slice(0,2).join(" | "));
  await p.close();
}
await b.close();
