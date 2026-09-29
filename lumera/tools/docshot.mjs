import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: 900, height: 1000 }, deviceScaleFactor: 2 });
const errs = []; p.on("pageerror", e => errs.push(String(e).slice(0,100)));
await p.goto("http://127.0.0.1:8777/authenticity/", { waitUntil: "networkidle" });
await p.waitForTimeout(700);
console.log("errors:", errs.length, errs[0] || "");
await p.screenshot({ path: "/tmp/doc.png", fullPage: false });
await b.close();
