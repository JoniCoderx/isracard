import { chromium } from "playwright-core";
const out = process.argv[2];
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [tag, vp, dpr] of [["d",{width:1440,height:900},2],["u",{width:3840,height:2160},1],["m",{width:390,height:844},3]]) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: dpr });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" }); await p.waitForTimeout(3200); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(900);
  await p.evaluate(() => window.scrollTo({ top: scrollY + document.getElementById("stripwrap").getBoundingClientRect().top - 60, behavior: "instant" })); await p.waitForTimeout(2500);
  const r = await (await p.$("#stripwrap")).boundingBox(); await p.screenshot({ path: `${out}/${tag}-strip.png`, clip: { x: r.x, y: r.y, width: r.width, height: r.height } });
  await p.evaluate(() => { const h = document.getElementById("hpin"); window.scrollTo({ top: scrollY + h.getBoundingClientRect().top + Math.max(0, h.offsetHeight - innerHeight) * 0.5, behavior: "instant" }); }); await p.waitForTimeout(2500);
  await p.screenshot({ path: `${out}/${tag}-coll.png` });
  await p.close();
}
await b.close();
