// Stones falling into the signature: they load, fall with the scroll, rest above the white edge, rise back on scroll up; reduced motion shows them at rest.
import { chromium } from "playwright-core";
const S = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/";
const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let fails = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
for (const [w, h, mob, red] of [[1440, 900, false, false], [390, 844, true, false], [1440, 900, false, true]]) {
  const p = await br.newPage({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, deviceScaleFactor: mob ? 2 : 1, reducedMotion: red ? "reduce" : "no-preference" });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("http://localhost:8777/", { waitUntil: "load" });
  await p.waitForFunction(() => !document.documentElement.classList.contains("locked"), null, { timeout: 20000 }).catch(() => {});
  const tag = `${w}${mob ? " phone" : ""}${red ? " reduced" : ""}`;
  const top = await p.evaluate(() => document.getElementById("craft").getBoundingClientRect().top + scrollY);
  /* count lit pixels in the black above the edge, and on the white below it */
  const lit = async () => p.evaluate(() => { const cv = document.querySelector("#craft .sgfall"); if (!cv || !cv.width) return { n: 0 }; const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 40) n++; return { n }; });
  const shots = [];
  for (const [k, off] of [["before", -h * 1.2], ["mid", -h * 0.55], ["rest", -h * 0.1]]) {
    await p.evaluate(y => scrollTo({ top: y, behavior: "instant" }), top + off); await p.waitForTimeout(700);
    shots.push({ k, ...(await lit()) });
    if (!red) await p.screenshot({ path: S + `fall-${w}${red ? "r" : ""}-${k}.jpg`, quality: 55 });
  }
  const st = await p.evaluate(() => window.__sgfall && { s: window.__sgfall.stones, l: window.__sgfall.loaded });
  ok(st && st.s > 10 && st.l > 2, `${tag}: ${st && st.s} stones, ${st && st.l} kinds loaded`);
  if (red) ok(shots[2].n > 50, `${tag}: at rest without motion (${shots.map(s => s.k + "=" + s.n).join(" ")})`);
  else ok(shots[0].n < shots[2].n && shots[2].n > 50, `${tag}: they fall in with the scroll (${shots.map(s => s.k + "=" + s.n).join(" ")})`);
  if (!red) { await p.evaluate(y => scrollTo({ top: y, behavior: "instant" }), top - h * 0.92); await p.waitForTimeout(600); const back = await lit(); ok(back.n < shots[2].n * 0.6, `${tag}: scrolling back lifts them out again (${back.n} of ${shots[2].n})`); }
  ok(!errs.length, `${tag}: no page errors ${errs.join(" | ")}`);
  await p.close();
}
await br.close(); console.log(fails ? fails + " FAILED" : "all passed"); process.exit(fails ? 1 : 0);
