// Builder repro: line and wrist views for several cuts and metals, the saved image, and the photo try-on.
import { chromium } from "playwright-core"; import fs from "fs";
const O = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/br/"; fs.mkdirSync(O, { recursive: true });
const [W, H] = (process.env.SIZE || "1366x900").split("x").map(Number), mob = W < 760;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const c = await b.newContext({ viewport: { width: W, height: H }, isMobile: mob, hasTouch: mob, acceptDownloads: true, deviceScaleFactor: 1 });
const p = await c.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
await p.goto("http://localhost:8777/", { waitUntil: "load" }); await p.waitForTimeout(800);
await p.click("#enterBtn", { timeout: 1500 }).catch(() => {});
await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; document.getElementById("configure").scrollIntoView(); });
await p.waitForTimeout(4000);
console.log("no3d", await p.evaluate(() => document.documentElement.classList.contains("no3d")));
const chip = async (k, v) => { await p.evaluate(([k, v]) => { const e = document.querySelector(`#opts .chip[data-k="${k}"][data-v="${v}"]`); e && e.click(); }, [k, v]); await p.waitForTimeout(1600); };
const view = async v => { await p.evaluate(v => document.querySelector(`#stripwrap .vtb[data-view="${v}"]`).click(), v); await p.waitForTimeout(2600); };
const shot = async n => { const e = await p.$("#stripwrap"); await e.screenshot({ path: O + n + ".jpg", type: "jpeg", quality: 70 }); };
for (const [cut, metal] of (process.env.CASES || "round:white,emerald:yellow,pear:rose,baguette:platinum").split(",").map(s => s.split(":"))) {
  await chip("cut", cut); await chip("metal", metal); await view("line"); await shot(`line-${cut}-${metal}`); await view("wrist"); await shot(`wrist-${cut}-${metal}`);
}
await view("line");
const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 15000 }).catch(() => null), p.click("#saveImg")]);
if (dl) { await dl.saveAs(O + "saved.png"); console.log("saved", dl.suggestedFilename()); } else console.log("no download");
await p.click("#tryonBtn2"); await p.waitForTimeout(800);
await p.setInputFiles("#tfile", "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/arm.jpg"); await p.waitForTimeout(1500);
await (await p.$("#tryon .mbox")).screenshot({ path: O + "tryon.jpg", type: "jpeg", quality: 72 });
await p.click("#tdone"); await p.waitForTimeout(900);
await (await p.$("#tryon .mbox")).screenshot({ path: O + "tryon-seen.jpg", type: "jpeg", quality: 72 });
const [dl2] = await Promise.all([p.waitForEvent("download", { timeout: 15000 }).catch(() => null), p.click("#tsave").catch(e => console.log("no tsave", e.message.slice(0, 80)))]);
if (dl2) { await dl2.saveAs(O + "tryon-saved.jpg"); console.log("tryon saved", dl2.suggestedFilename()); } else console.log("no tryon download");
console.log("errors", errs.slice(0, 5));
await b.close();
