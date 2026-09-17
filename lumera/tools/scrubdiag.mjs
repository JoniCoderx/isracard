/* What does p actually do at 1440 after one instant scroll? */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [tag, w, h] of [["1440",1440,900],["390",390,844]]) {
  const p = await b.newPage({ viewport:{ width:w, height:h }, deviceScaleFactor:2 });
  await p.goto("http://127.0.0.1:8777/", { waitUntil:"load" });
  await p.waitForTimeout(2800); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
  await p.waitForTimeout(1000);
  const top = await p.evaluate(() => scrollY + document.getElementById("filmpin").getBoundingClientRect().top);
  const ph  = await p.evaluate(() => document.getElementById("filmpin").offsetHeight);
  /* park in the middle, let it fully settle, then take one step and watch */
  await p.evaluate(([t, hh, ih]) => window.scrollTo({ top: t + (hh - ih) * 0.40, behavior:"instant" }), [top, ph, h]);
  await p.waitForTimeout(3000);
  const before = await p.evaluate(() => ({ p: +window.__film.p.toFixed(4), f: window.__film.frame, loaded: window.__film.loaded }));
  await p.evaluate(([t, hh, ih]) => window.scrollTo({ top: t + (hh - ih) * 0.44, behavior:"instant" }), [top, ph, h]);
  const curve = [];
  for (let i = 0; i < 12; i++) { await p.waitForTimeout(80); curve.push(await p.evaluate(() => [+window.__film.p.toFixed(4), window.__film.frame])); }
  /* how many animation frames actually run in 500ms here */
  const fps = await p.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); (function l(){ n++; if (performance.now() - t0 < 500) requestAnimationFrame(l); else res(Math.round(n / ((performance.now()-t0)/1000))); })(); }));
  console.log(tag, "loaded=" + before.loaded, "fps≈" + fps, "from p=" + before.p + " f=" + before.f);
  console.log("   ", curve.map(c => c[0] + "/" + c[1]).join("  "));
  await p.close();
}
await b.close();
