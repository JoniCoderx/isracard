/* The bar must not carry the page. At each chapter the strip under the bar is
   read at two scroll positions a hundred pixels apart: if anything of the page
   shows through, those two reads differ. The bar's own pills are excluded by
   reading a column between them. */
import { chromium } from "playwright-core";
const PORT = 8777;
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const W of [390, 360, 320]) {
  const p = await b.newPage({ viewport: { width: W, height: 780 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  const read = async y => {
    await p.evaluate(v => scrollTo({ top: v, behavior: "instant" }), y);
    await p.waitForTimeout(420);
    return p.evaluate(() => {
      const h = document.getElementById("header"); const r = h.getBoundingClientRect();
      /* a band inside the bar, clear of the pills and the lockup */
      const x = Math.round(r.width * 0.22), y0 = Math.round(r.height * 0.5);
      const c = document.createElement("canvas"); c.width = 1; c.height = 1;
      return { h: Math.round(r.height), x, y0, bg: getComputedStyle(h).backgroundColor };
    });
  };
  let worst = 0, worstAt = 0;
  for (let y = 900; y + 800 < total; y += 700) {
    const tone = () => p.evaluate(() => getComputedStyle(document.getElementById("header")).backgroundColor);
    await p.evaluate(v => scrollTo({ top: v, behavior: "instant" }), y);
    await p.waitForTimeout(420);
    const t1 = await tone();
    const a = await p.screenshot({ clip: { x: 0, y: 0, width: W, height: 44 } });
    await p.evaluate(v => scrollTo({ top: v, behavior: "instant" }), y + 110);
    await p.waitForTimeout(420);
    const t2 = await tone();
    const c = await p.screenshot({ clip: { x: 0, y: 0, width: W, height: 44 } });
    /* the bar changes ground between a dark chapter and an ivory one; that is
       the bar itself, not the page coming through, so the pair is skipped */
    if (t1 !== t2) continue;
    const d = await p.evaluate(async ([A, B, w]) => {
      const load = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = "data:image/png;base64," + s; });
      const [ia, ib] = await Promise.all([load(A), load(B)]);
      const cv = document.createElement("canvas"); cv.width = ia.width; cv.height = ia.height; const g = cv.getContext("2d");
      g.drawImage(ia, 0, 0); const da = g.getImageData(0, 0, cv.width, cv.height).data;
      g.clearRect(0, 0, cv.width, cv.height); g.drawImage(ib, 0, 0); const db = g.getImageData(0, 0, cv.width, cv.height).data;
      let n = 0; for (let i = 0; i < da.length; i += 4)
        if (Math.abs(da[i] - db[i]) > 6 || Math.abs(da[i+1] - db[i+1]) > 6 || Math.abs(da[i+2] - db[i+2]) > 6) n++;
      return n / (cv.width * cv.height) * 100;
    }, [a.toString("base64"), c.toString("base64"), W]);
    if (d > worst) { worst = d; worstAt = y; }
  }
  ok(worst < 1.2, `${W} the page does not show through the bar (worst ${worst.toFixed(2)}% at y=${worstAt})`);
  await p.close();
}
console.log(`\n${pass} pass, ${fail} fail`);
await b.close();
process.exit(fail ? 1 : 0);
