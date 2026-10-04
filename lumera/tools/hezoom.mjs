// Close-ups of Hebrew components, to read arrows, icons and mixed-direction lines.
import { chromium } from "playwright-core"; import fs from "fs";
const O = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/he/z/"; fs.mkdirSync(O, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const shots = [["header.sh", "header"], ["#hero .hacts", "hero-acts"], [".pgrid .piece .acts", "card-acts"], [".pgrid .piece .bd", "card-body"], ["#configure .cacts", "cacts"], ["#configure .total", "total"], ["#opts", "opts"], ["#concierge .cbody > div:first-child", "enq-head"], ["#cform .csub", "csub"], ["#cform .fields", "fields"], ["#end", "footer"]];
for (const [w, h] of [[1366, 900], [390, 844]]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 760, hasTouch: w < 760, reducedMotion: "reduce", deviceScaleFactor: 2 });
  const p = await c.newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p.goto("http://localhost:8777/he/", { waitUntil: "load" }); await p.waitForTimeout(1200); await p.click("#enterBtn", { timeout: 800 }).catch(() => {});
  await p.evaluate(async () => { document.documentElement.style.scrollBehavior = "auto"; document.querySelectorAll(".rv").forEach(e => e.classList.add("in")); await document.fonts.ready; });
  for (const [sel, n] of shots) { const el = await p.$(sel); if (!el) { console.log("missing", sel); continue; }
    await el.evaluate(e => e.scrollIntoView({ block: "center" })); await p.waitForTimeout(500);
    await el.screenshot({ path: `${O}${w}-${n}.png` }).catch(e => console.log("shot fail", sel, e.message.slice(0, 60))); }
  // the piece window and the menu
  await p.evaluate(() => { const q = document.querySelector(".pgrid .piece"); q.scrollIntoView({ block: "center" }); q.click(); }); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${O}${w}-piecewin.png` });
  await p.keyboard.press("Escape"); await p.waitForTimeout(600);
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(400); await p.click("#menuBtn").catch(() => {}); await p.waitForTimeout(900); await p.screenshot({ path: `${O}${w}-menu.png` });
  await c.close();
}
await b.close();
