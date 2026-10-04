// Walks the whole page at one size, a screen at a time, and makes contact sheets.
import { chromium } from "playwright-core";
const [W, H, tag] = [+(process.argv[2] || 390), +(process.argv[3] || 844), process.argv[4] || "m"];
const O = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/walk/";
import fs from "fs"; fs.mkdirSync(O, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const mob = W < 760; const c = await b.newContext({ viewport: { width: W, height: H }, isMobile: mob, hasTouch: mob, deviceScaleFactor: 1 });
const p = await c.newPage(); await p.goto("http://localhost:8777/", { waitUntil: "load" }); await p.waitForTimeout(1000);
await p.click("#enterBtn", { timeout: 1500 }).catch(() => {}); await p.waitForTimeout(500);
await p.evaluate(() => document.documentElement.style.scrollBehavior = "auto");
const total = await p.evaluate(() => document.documentElement.scrollHeight);
let i = 0; for (let y = 0; y < total; y += Math.round(H * 0.9)) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(1300); await p.screenshot({ path: `${O}${tag}-${String(i++).padStart(2, "0")}.png` }); }
console.log(tag, i, "screens");
await b.close();
