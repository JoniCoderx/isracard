import { chromium } from "playwright-core";
const out = process.argv[2];
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [tag, vp] of [["d",{width:1440,height:900}],["m",{width:390,height:844}]]) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 2 });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" }); await p.waitForTimeout(3200); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(900);
  await p.screenshot({ path: `${out}/${tag}-header.png`, clip: { x: 0, y: 0, width: vp.width, height: 80 } });
  await p.evaluate(() => window.scrollTo({ top: scrollY + document.getElementById("configure").getBoundingClientRect().top - 40, behavior: "instant" })); await p.waitForTimeout(2500);
  await p.screenshot({ path: `${out}/${tag}-conf.png` });
  await p.evaluate(() => { const h = document.getElementById("hpin"); window.scrollTo({ top: scrollY + h.getBoundingClientRect().top + Math.max(0, h.offsetHeight - innerHeight) * 1.0, behavior: "instant" }); }); await p.waitForTimeout(2500);
  await p.screenshot({ path: `${out}/${tag}-coll-end.png` });
  await p.evaluate(() => { const h = document.getElementById("hpin"); window.scrollTo({ top: scrollY + h.getBoundingClientRect().top + Math.max(0, h.offsetHeight - innerHeight) * 0.5, behavior: "instant" }); }); await p.waitForTimeout(2500);
  await p.screenshot({ path: `${out}/${tag}-coll-mid.png` });
  await p.evaluate(() => window.scrollTo({ top: scrollY + document.getElementById("concierge").getBoundingClientRect().top - 20, behavior: "instant" })); await p.waitForTimeout(1800);
  await p.screenshot({ path: `${out}/${tag}-concierge.png` });
  await p.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })); await p.waitForTimeout(3000);
  const f = await p.$(".fbig"); const r = await f.boundingBox(); await p.screenshot({ path: `${out}/${tag}-footer.png`, clip: { x: 0, y: Math.max(0, r.y - 20), width: vp.width, height: Math.min(vp.height, r.height + 40) } });
  await p.click("#menuBtn").catch(async () => { await p.evaluate(() => document.getElementById("menu").classList.add("open")); }); await p.waitForTimeout(900);
  await p.screenshot({ path: `${out}/${tag}-menu.png` });
  await p.close();
}
await b.close();
