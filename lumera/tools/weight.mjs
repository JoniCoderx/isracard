/* How long is it, and what does it cost to get through it. */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [tag, w, h] of [["desktop",1440,900],["phone",390,844]]) {
  const p = await b.newPage({ viewport:{ width:w, height:h }, deviceScaleFactor:2, isMobile:w<700, hasTouch:w<700 });
  await p.emulateMedia({ reducedMotion:"reduce" });
  await p.goto("http://127.0.0.1:8777/", { waitUntil:"load" });
  await p.waitForTimeout(2600); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
  await p.waitForTimeout(800);
  const rows = await p.evaluate(() => [...document.querySelectorAll("main > section")].map(s =>
    ({ id: s.id, screens: +(s.offsetHeight / innerHeight).toFixed(1) })));
  const total = rows.reduce((a, r) => a + r.screens, 0);
  console.log(`\n── ${tag}: ${total.toFixed(1)} screens of scroll`);
  rows.sort((a,c) => c.screens - a.screens).slice(0,6).forEach(r => console.log(`   ${r.screens.toString().padStart(4)}  ${r.id}`));
  await p.close();
}
await b.close();
