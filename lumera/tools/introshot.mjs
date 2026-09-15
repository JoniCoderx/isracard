import { chromium } from "playwright-core";
const out = process.argv[2];
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1200, height: 700 }, deviceScaleFactor: 1 });
await p.addInitScript(() => { const s = document.createElement("style"); s.textContent = "svg.sy.imark, svg.sy.imark path { animation-play-state: paused !important; animation-delay: -0.9s !important; }"; document.addEventListener("DOMContentLoaded", () => document.head.appendChild(s)); });
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" });
await p.waitForTimeout(300); await p.screenshot({ path: `${out}/intro-frozen.png`, clip: { x: 350, y: 150, width: 500, height: 400 } });
await b.close();
