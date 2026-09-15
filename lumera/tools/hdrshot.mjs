import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
for (const [tag, vp] of [["m",{width:390,height:844}],["d",{width:1440,height:900}]]) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 2 });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" }); await p.waitForTimeout(3300); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(1500);
  await p.screenshot({ path: `/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/v14/mob/${tag}-hero-new.png` });
  await p.close();
}
await b.close();
