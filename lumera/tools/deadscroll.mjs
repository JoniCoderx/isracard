/* Where does the page stop changing?
   Length alone is a poor measure of "too long" — a chapter that earns its
   screens reads short. What reads long is scroll that returns the same
   picture. This walks the page in half screens and reports every run where
   consecutive frames are near-identical: the stretches where a reader is
   paying scroll and getting nothing back. */
import { chromium } from "playwright-core";
const W = Number(process.argv[2] || 390), H = Number(process.argv[3] || 844);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: W, height: H }, isMobile: W < 900, hasTouch: W < 900, deviceScaleFactor: 1 });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2600); await p.click("#enterBtn", { timeout: 4000 }).catch(() => {});
await p.waitForTimeout(900);
await p.evaluate(async () => { const s = Math.round(innerHeight * 0.6); for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 130)); } });
const total = await p.evaluate(() => document.body.scrollHeight);
const step = Math.round(H * 0.5);
const chapter = async () => p.evaluate(() => {
  let best = "", bt = -1e9;
  for (const s of document.querySelectorAll("section[id], div[id].cwrap")) {
    const t = s.getBoundingClientRect().top;
    if (t <= innerHeight * 0.4 && t > bt) { bt = t; best = s.id; }
  }
  return best;
});
const shots = [];
for (let y = 0; y + H <= total; y += step) {
  await p.evaluate(v => scrollTo({ top: v, behavior: "instant" }), y);
  await p.waitForTimeout(420);
  shots.push({ y, buf: await p.screenshot(), ch: await chapter() });
}
/* how different are two frames, as a percentage of differing bytes sampled */
function diff(a, b) {
  const n = Math.min(a.length, b.length); let d = 0, k = 0;
  for (let i = 0; i < n; i += 97) { k++; if (a[i] !== b[i]) d++; }
  return d / Math.max(1, k);
}
let runs = [], cur = null;
for (let i = 1; i < shots.length; i++) {
  const dd = diff(shots[i - 1].buf, shots[i].buf);
  const dead = dd < 0.06;
  if (dead) { if (!cur) cur = { from: shots[i - 1].y, to: shots[i].y, ch: shots[i].ch, n: 1 }; else { cur.to = shots[i].y; cur.n++; } }
  else if (cur) { runs.push(cur); cur = null; }
}
if (cur) runs.push(cur);
console.log(`${W}x${H}  ${total}px = ${(total / H).toFixed(2)} screens, ${shots.length} samples`);
runs.filter(r => r.n >= 2).sort((a, b) => (b.to - b.from) - (a.to - a.from))
  .forEach(r => console.log(`  DEAD ${((r.to - r.from) / H).toFixed(2)} screens  y ${r.from}..${r.to}  in "${r.ch}"`));
if (!runs.some(r => r.n >= 2)) console.log("  no dead stretch of a screen or more");
await b.close();
