import { chromium } from "playwright-core";
const [,, file, out, w, h] = process.argv;
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
const p = await b.newPage({ viewport:{ width:+w||1000, height:+h||900 }, deviceScaleFactor:1 });
await p.goto("file://" + file, { waitUntil:"load" }); await p.waitForTimeout(400);
await p.screenshot({ path: out, fullPage:true }); await b.close();
