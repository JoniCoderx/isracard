// Compares two builds screen by screen: the same scroll positions, motion off, pixel difference per screen.
import { chromium } from "playwright-core"; import fs from "fs";
const O = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/sd/"; fs.mkdirSync(O, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const sizes = (process.env.SIZES || "390x844,1366x900").split(",").map(s => s.split("x").map(Number));
const paths = (process.env.PATHS || "/,/he/,/about/,/privacy/").split(",");
for (const [w, h] of sizes) for (const pth of paths) for (const port of [8778, 8777]) {
  const mob = w < 760; const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, reducedMotion: "reduce", deviceScaleFactor: 1 });
  const p = await c.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p.goto(`http://localhost:${port}${pth}`, { waitUntil: "load" }); await p.waitForTimeout(900);
  await p.click("#enterBtn", { timeout: 800 }).catch(() => {});
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; document.querySelectorAll(".rv").forEach(e => e.classList.add("in")); });
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  let i = 0; for (let y = 0; y < H && i < 40; y += h) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(350); await p.screenshot({ path: `${O}${port}-${w}-${pth.replace(/\//g, "_")}-${String(i++).padStart(2, "0")}.png` }); }
  console.log(port, w, pth, "height", H, "screens", i, errs.length ? "ERR " + errs[0] : "");
  await c.close();
}
await b.close();
