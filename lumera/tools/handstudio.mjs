/* A turntable for the hand. Drags the canvas the way a finger would, so what
   comes back is what a reader would actually see from each side. */
import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const TAG = process.argv[2] || "s";
const KIND = process.argv[3] || "f";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
const errs = []; p.on("pageerror", e => errs.push(String(e).slice(0, 160)));
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil: "load" });
await p.waitForTimeout(2600);
await p.click("#enterBtn", { timeout: 4000 }).catch(() => {});
await p.waitForTimeout(800);
await p.evaluate(async () => {
  const s = Math.round(innerHeight * 0.8);
  for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 80)); }
});
await p.evaluate(() => { const e = document.getElementById("stripwrap"); e.scrollIntoView({ block: "center", behavior: "instant" }); e.classList.add("wrist"); });
await p.waitForTimeout(3000);
await p.evaluate(k => window.__hand && window.__hand({ kind: k, skin: 1 }), KIND);
await p.waitForTimeout(1800);
const box = await (await p.$("#bcv")).boundingBox();
const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
/* each step drags the same distance, so the frames are an even turntable */
for (let i = 0; i < 4; i++) {
  if (i) {
    await p.mouse.move(cx, cy); await p.mouse.down();
    for (let k = 1; k <= 8; k++) { await p.mouse.move(cx + k * 22, cy); await p.waitForTimeout(18); }
    await p.mouse.up(); await p.waitForTimeout(1500);
  }
  const el = await p.$("#bcv"); await el.screenshot({ path: `${OUT}/st-${TAG}-${KIND}-${i}.png` });
}
console.log("errors=" + errs.length + (errs.length ? " :: " + errs[0] : ""));
await b.close();
