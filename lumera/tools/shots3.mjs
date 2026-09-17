import { chromium } from "playwright-core";
import fs from "fs";
const DIR = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/v17";
fs.mkdirSync(DIR, { recursive:true });
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [tag, w, h] of [["d",1440,900],["m320",320,720],["m390",390,844]]) {
  const p = await b.newPage({ viewport:{ width:w, height:h } });
  await p.emulateMedia({ reducedMotion:"reduce" });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" });
  await p.waitForTimeout(2800); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
  await p.waitForTimeout(1400);
  await p.screenshot({ path: `${DIR}/${tag}-hero.png` });
  await p.close();
}
console.log("ok"); await b.close();
