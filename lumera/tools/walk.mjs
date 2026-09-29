/* Every screen of the phone, in order, so they can be looked at. */
import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/walk";
import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });
const lang = process.argv[2] || "en";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: "reduce" });
const errs = []; p.on("pageerror", e => errs.push(String(e).slice(0, 160)));
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2800); await p.click("#enterBtn", { timeout: 6000 }).catch(() => {});
await p.waitForTimeout(1000);
if (lang !== "en") { await p.click("#langBtn", { timeout: 4000 }).catch(()=>{}); await p.waitForTimeout(400);
  await p.click(`[data-lang="${lang}"]`, { timeout: 4000 }).catch(()=>{}); await p.waitForTimeout(1200); }
await p.evaluate(async () => { const s = Math.round(innerHeight * 0.7); for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 150)); } });
const total = await p.evaluate(() => document.body.scrollHeight);
let n = 0;
for (let y = 0; y + 200 < total; y += 760) {
  await p.evaluate(v => scrollTo({ top: v, behavior: "instant" }), y);
  await p.waitForTimeout(750);
  const where = await p.evaluate(() => {
    let best = "", bt = -1e9;
    for (const s of document.querySelectorAll("section[id], div[id].cwrap"))
      { const t = s.getBoundingClientRect().top; if (t <= innerHeight * 0.5 && t > bt) { bt = t; best = s.id; } }
    return best;
  });
  await p.screenshot({ path: `${OUT}/${String(n).padStart(2,"0")}-${where || "x"}.png` });
  n++;
}
console.log(`${n} screens, ${total}px, errors ${errs.length}` + (errs.length ? " :: " + errs[0] : ""));
await b.close();
