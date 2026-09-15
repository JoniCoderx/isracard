import { chromium } from "playwright-core";
const out = process.argv[2];
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [tag, vp] of [["d",{width:1440,height:900}],["m",{width:390,height:844}]]) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" }); await p.waitForTimeout(1500); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(1500);
  const at = async (name, fn) => { await p.evaluate(fn); await p.waitForTimeout(1200); await p.screenshot({ path: `${out}/${tag}-${name}.png` }); };
  await at("wrist40", () => { const w = document.getElementById("wpin"); window.scrollTo({ top: scrollY + w.getBoundingClientRect().top + (w.offsetHeight - innerHeight) * 0.35, behavior: "instant" }); });
  await at("wrist90", () => { const w = document.getElementById("wpin"); window.scrollTo({ top: scrollY + w.getBoundingClientRect().top + (w.offsetHeight - innerHeight) * 0.9, behavior: "instant" }); });
  await at("box", () => { const w = document.getElementById("stonepin"); window.scrollTo({ top: scrollY + w.getBoundingClientRect().top + (w.offsetHeight - innerHeight) * 0.5, behavior: "instant" }); });
  await at("piece", () => { window.scrollTo({ top: scrollY + document.getElementById("collection").getBoundingClientRect().top, behavior: "instant" }); document.getElementById("p-riv").click(); });
  await p.keyboard.press("Escape"); await p.waitForTimeout(400);
  await at("tryon", () => { document.getElementById("tryonBtn").click(); });
  await p.close();
}
await b.close();
