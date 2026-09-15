import { chromium } from "playwright-core";
const out = process.argv[2];
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [tag, vp] of [["d",{width:1440,height:900}],["m",{width:390,height:844}]]) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 2 });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" });
  await p.waitForTimeout(900); await p.screenshot({ path: `${out}/${tag}-intro-mid.png` });
  await p.waitForTimeout(1900); await p.screenshot({ path: `${out}/${tag}-intro-end.png` });
  await p.emulateMedia({ reducedMotion: "reduce" });
  await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(900);
  const shot = async (name, sel, pad) => { const el = await p.$(sel); if (!el) { console.log("missing", sel); return; } await el.scrollIntoViewIfNeeded(); await p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); window.scrollTo({ top: scrollY + r.top - 160, behavior: "instant" }); }, sel); await p.waitForTimeout(1200); const r = await el.boundingBox(); await p.screenshot({ path: `${out}/${tag}-${name}.png`, clip: { x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: Math.min(vp.width, r.width + pad * 2), height: Math.min(vp.height, r.height + pad * 2) } }); };
  await p.screenshot({ path: `${out}/${tag}-header.png`, clip: { x: 0, y: 0, width: vp.width, height: 90 } });
  await shot("certs", "#certs", 24);
  await shot("sig", ".k.sig", 30);
  await shot("seal", ".pricerow", 30);
  await shot("engraved", ".engraved", 40);
  await shot("who", ".voice .who", 30);
  await p.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })); await p.waitForTimeout(2500);
  await shot("footer", ".fbig", 30);
  await p.close();
}
await b.close();
