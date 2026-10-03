// Renders a candidate signature path to PNG for review. node sigpath.mjs path.txt out.png
import { chromium } from "playwright-core"; import fs from "fs";
const d = fs.readFileSync(process.argv[2], "utf8").replace(/\s+/g, " ").trim();
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1400, height: 520 } });
await p.setContent(`<body style="margin:0;background:#000"><svg width=1400 height=520 viewBox="-320 0 1720 520">
<g stroke="#333" stroke-width="1"><line x1="-320" x2="1400" y1="330" y2="330"/><line x1="-320" x2="1400" y1="240" y2="240"/><line x1="-320" x2="1400" y1="90" y2="90"/></g>
<path id=s d="${d}" fill="none" stroke="#eee" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></body>`);
console.log("length", await p.evaluate(() => document.getElementById("s").getTotalLength().toFixed(0)));
await p.screenshot({ path: process.argv[3] }); await b.close();
