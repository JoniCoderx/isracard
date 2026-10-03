import { chromium } from "playwright-core"; import fs from "fs";
const d = fs.readFileSync(process.argv[2], "utf8").trim(); const tf = process.argv[4] || "";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1400, height: 600 } });
await p.setContent(`<body style="margin:0;background:#000"><svg width=1400 height=600 viewBox="-200 -40 1600 600"><g transform="${tf}">
<path d="${d}" fill="none" stroke="#eee" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g></svg></body>`);
await p.screenshot({ path: process.argv[3] }); await b.close();
