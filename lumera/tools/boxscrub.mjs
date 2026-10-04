// The box film under a real scroll: mouse-wheel steps through the chapter, down and back up.
// Per sample: the frame the scroll asks for vs the frame on the canvas. Reports the mean lag,
// the share of samples more than 3 frames off, and the longest freeze (picture unchanged while
// the asked-for frame moved on by more than 3).
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const port = process.env.PORT || 8777;
for (const [w, h, mob, step] of [[1366, 768, false, 100], [1366, 768, false, 220], [390, 844, true, 90]]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob }); const p = await c.newPage();
  await p.goto(`http://localhost:${port}/`, { waitUntil: "load" }); await p.waitForTimeout(900); await p.click("#enterBtn", { timeout: 1000 }).catch(() => {});
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
  const pin = await p.evaluate(() => { const r = document.getElementById("stonepin").getBoundingClientRect(); return { y: r.top + scrollY, h: r.height }; });
  await p.evaluate(y => scrollTo(0, y), Math.round(pin.y - h * 1.5)); await p.waitForTimeout(400);
  await p.mouse.move(w / 2, h / 2);
  const N = await p.evaluate(() => 96), S = [];
  const end = pin.y + pin.h - h;
  const sample = async () => S.push(await p.evaluate(() => { const B = window.__box; const want = Math.round(Math.max(0, Math.min(1, B.p)) * 95); return [want, B.frame, scrollY]; }));
  for (let dir of [1, -1]) { let guard = 0;
    while (guard++ < 400) { const y = await p.evaluate(() => scrollY); if (dir > 0 && y >= end) break; if (dir < 0 && y <= pin.y) break;
      if (mob) await p.evaluate(([s]) => scrollBy(0, s), [dir * step]); else await p.mouse.wheel(0, dir * step);
      await p.waitForTimeout(40); await sample(); }
    await p.waitForTimeout(300); }
  const inPin = S.filter(s => s[1] >= 0);
  const lag = inPin.map(s => Math.abs(s[0] - s[1])), off = lag.filter(x => x > 3).length;
  let freeze = 0, run = 0; for (let i = 1; i < S.length; i++) { if (S[i][1] === S[i - 1][1] && Math.abs(S[i][0] - S[i][1]) > 3) { run++; freeze = Math.max(freeze, run); } else run = 0; }
  const held = await p.evaluate(() => [__box.held, __box.peak]);
  console.log(`${w}${mob ? " phone" : ""} step ${step}px: samples ${inPin.length}, mean lag ${(lag.reduce((a, b) => a + b, 0) / Math.max(1, lag.length)).toFixed(1)} frames, >3 frames off ${(100 * off / Math.max(1, lag.length)).toFixed(0)}%, longest freeze ${freeze * 40}ms, frames held now/peak ${held}`);
  await c.close();
}
await b.close();
