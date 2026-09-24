/* Can a thumb actually turn the bracelet, and does the page stay put while it
   does? Real touch events through CDP, and the answer is read off the canvas
   and the scroll position rather than off an event handler. */
import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--touch-events=enabled"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2600); await p.click("#enterBtn").catch(() => {});
await p.waitForTimeout(800);
await p.evaluate(async () => { const s = Math.round(innerHeight * 0.8); for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 70)); } });

async function swipe(x, y, dx, dy, steps = 12) {
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
  for (let i = 1; i <= steps; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + dx * i / steps, y: y + dy * i / steps, id: 1 }] });
    await new Promise(r => setTimeout(r, 16));
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await new Promise(r => setTimeout(r, 600));
}
const shot = async () => (await (await p.$("#bcv")).screenshot()).length;
const diff = async (a, bb) => Math.abs(a - bb);

for (const view of ["line", "wrist"]) {
  await p.evaluate(v => { const e = document.getElementById("stripwrap"); e.classList.toggle("wrist", v === "wrist"); e.scrollIntoView({ block: "center", behavior: "instant" }); }, view);
  await p.waitForTimeout(2600);
  const box = await (await p.$("#bcv")).boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  const ta = await p.evaluate(() => ({ cv: getComputedStyle(document.getElementById("bcv")).touchAction, wr: getComputedStyle(document.getElementById("stripwrap")).touchAction }));

  /* horizontal: should turn the bracelet and leave the page where it was */
  let y0 = await p.evaluate(() => Math.round(scrollY)); let s0 = await shot();
  await swipe(cx, cy, 120, 0);
  let y1 = await p.evaluate(() => Math.round(scrollY)); let s1 = await shot();
  console.log(`${view} touch-action cv=${ta.cv} wrap=${ta.wr}`);
  console.log(`  sideways: canvas bytes ${s0}->${s1} (turned=${Math.abs(s1 - s0) > 900}), scrollY ${y0}->${y1} (page moved=${y1 !== y0})`);

  /* a diagonal, which is what a thumb actually does */
  await p.evaluate(() => document.getElementById("stripwrap").scrollIntoView({ block: "center", behavior: "instant" }));
  await p.waitForTimeout(700);
  y0 = await p.evaluate(() => Math.round(scrollY)); s0 = await shot();
  await swipe(cx, cy, 110, 34);
  y1 = await p.evaluate(() => Math.round(scrollY)); s1 = await shot();
  console.log(`  diagonal: turned=${Math.abs(s1 - s0) > 900}, page moved=${y1 !== y0}`);

  /* vertical: must scroll the page */
  await p.evaluate(() => document.getElementById("stripwrap").scrollIntoView({ block: "center", behavior: "instant" }));
  await p.waitForTimeout(700);
  y0 = await p.evaluate(() => Math.round(scrollY)); s0 = await shot();
  await swipe(cx, cy + 60, 0, -170);
  y1 = await p.evaluate(() => Math.round(scrollY)); s1 = await shot();
  console.log(`  down the page: page moved=${y1 !== y0} (${y0}->${y1}), canvas turned=${Math.abs(s1 - s0) > 900}`);
}
await b.close();
