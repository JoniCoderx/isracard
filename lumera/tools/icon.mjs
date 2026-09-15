import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
for (const s of [512, 180, 32]) { const p = await b.newPage({ viewport:{ width:s, height:s }, deviceScaleFactor:1 }); await p.goto("file:///tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/v11/icon.html"); await p.evaluate(s => { const e = document.getElementById("s"); e.setAttribute("width", s); e.setAttribute("height", s); }, s); await p.screenshot({ path: `/home/user/isracard/lumera/site/public/icon-${s}.png`, omitBackground:false }); await p.close(); }
await b.close();
