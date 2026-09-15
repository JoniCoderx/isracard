import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
for (const [tag, vp] of [["d",{width:1440,height:900}],["m",{width:390,height:844}]]) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 });
  const log = []; p.on("console", m => { if (m.type()==="error") log.push(m.text().slice(0,120)); });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" }); await p.waitForTimeout(3200); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(800);
  await p.evaluate(() => { const h = document.getElementById("hpin"); window.scrollTo({ top: scrollY + h.getBoundingClientRect().top + Math.max(0, h.offsetHeight - innerHeight) * 0.35, behavior: "instant" }); }); await p.waitForTimeout(1500);
  const y0 = await p.evaluate(() => scrollY);
  const piece = await p.$("#p-ring .fig"); const box = await piece.boundingBox();
  await p.mouse.click(box.x + box.width/2, box.y + box.height/2); await p.waitForTimeout(600);
  const y1 = await p.evaluate(() => ({ y: scrollY, open: document.querySelector("#pmodal").classList.contains("open"), locked: document.body.classList.contains("locked"), hash: location.hash }));
  await p.keyboard.press("Escape"); await p.waitForTimeout(700);
  const y2 = await p.evaluate(() => ({ y: scrollY, open: document.querySelector("#pmodal").classList.contains("open") }));
  await p.waitForTimeout(1500); const y3 = await p.evaluate(() => scrollY);
  console.log(tag, "before", y0, "open", JSON.stringify(y1), "closed", JSON.stringify(y2), "later", y3, log.slice(0,3));
  await p.close();
}
await b.close();
