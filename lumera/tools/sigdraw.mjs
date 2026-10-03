// The signature: held passage on desktop and phone, one line writing SILAVU, the words
// only near the end, the sparks brief, reduced motion static and complete.
import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/";
const BASE = process.env.BASE || "http://localhost:8777/";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; if (!c || process.env.V) console.log((c ? "ok   " : "FAIL ") + m); };
const SIZES = (process.env.SIZES || "1366x768,1440x900,1920x1080,375x812,390x844,430x932").split(",").map(s => s.split("x").map(Number));
for (const rm of [false, true]) for (const [w, h] of SIZES) {
  if (rm && !(w === 1366 || w === 390)) continue;
  const mob = w < 760, tag = `${w}x${h}${rm ? " reduced" : ""}`;
  const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, reducedMotion: rm ? "reduce" : "no-preference" });
  const p = await c.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto(BASE + (process.env.LANG2 === "he" ? "he/" : ""), { waitUntil: "load" }); await p.waitForTimeout(800);
  await p.click("#enterBtn", { timeout: 1500 }).catch(() => {}); await p.waitForTimeout(400);
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
  const top = await p.evaluate(() => document.getElementById("craft").getBoundingClientRect().top + scrollY);
  const H = await p.evaluate(() => document.getElementById("craft").offsetHeight);
  ok(rm ? H < h * 1.2 : H > h * (mob ? 1.5 : 1.8) && H < h * 2, `${tag} section ${(H / h).toFixed(2)} screens`);
  const probe = () => p.evaluate(() => { const q = s => document.querySelector("#craft " + s), O = e => +getComputedStyle(e).opacity, R = e => e.getBoundingClientRect();
    const st = R(q(".sgstage")), fig = R(q(".sgfig")), cp = R(q(".sgcopy"));
    return { st: st.top, fig: [fig.left, fig.top, fig.right, fig.bottom], copy: [cp.top, cp.bottom, O(q(".sgc1")), O(q(".sgc2"))],
      dot: O(q(".sgdot")), spark: Math.max(...[...document.querySelectorAll("#craft .sgspark > g")].map(O)) * O(q(".sgspark")),
      line: (() => { const e = q(".sgpath"); return (parseFloat(getComputedStyle(e).strokeDashoffset) || 0) / e.getTotalLength(); })(), pen: O(q(".sgpen")),
      over: document.documentElement.scrollWidth - innerWidth, vw: innerWidth }; });
  const fs = rm ? [0.5] : [0, 0.1, 0.2, 0.35, 0.6, 0.83, 0.88, 1];
  for (const f of fs) {
    await p.evaluate(y => scrollTo(0, y), Math.round(rm ? top - (h - H) / 2 : top + f * (H - h))); await p.waitForTimeout(rm ? 500 : 1400);
    const r = await probe();
    ok(r.over <= 0, `${tag} @${f} no sideways overflow`);
    ok(Math.abs((r.fig[0] + r.fig[2]) / 2 - r.vw / 2) < 2, `${tag} @${f} mark centred`);
    ok(r.copy[0] >= r.fig[3] - 2, `${tag} @${f} words below the mark`);
    if (rm) { ok(r.line < 0.001 && r.dot > 0.99 && r.copy[2] > 0.99 && r.copy[3] > 0.99 && r.spark === 0, `${tag} written name and words, no sparks`); }
    else {
      if (f > 0 && f < 1) ok(Math.abs(r.st) < 1, `${tag} @${f} stage held`);
      if (f === 0.2 || f === 0.35 || f === 0.6) ok(r.line > 0.05 && r.line < 0.95 && r.pen > 0.5, `${tag} @${f} writing, pen light on (${r.line.toFixed(2)})`);
      if (f <= 0.6) ok(r.copy[2] < 0.02 && r.spark < 0.02, `${tag} @${f} no words, no sparks yet`);
      if (f === 1) ok(r.line < 0.001 && r.dot > 0.99 && r.copy[2] > 0.99 && r.copy[3] > 0.98 && r.pen < 0.01, `${tag} end: written, dotted, words shown`);
      if (f === 1) ok(r.spark < 0.35, `${tag} end: sparks settled (${r.spark.toFixed(2)})`);
      if (f === 1) ok(r.copy[1] < h - 8, `${tag} words inside the screen (${Math.round(r.copy[1])})`);
    }
    if (process.env.SHOT) await p.screenshot({ path: `${OUT}sg-${w}${rm ? "r" : ""}-${f}.jpg`, type: "jpeg", quality: 60 });
  }
  ok(!errs.length, `${tag} no errors ${errs[0] || ""}`);
  await c.close();
}
console.log(`${pass} pass, ${fail} fail`); await b.close();
