// Inside the stone: the held passage on a desktop, the short drift on a phone, reduced motion.
// Checks: composition centred on the stage, no overlapping lines, cue gone early, Fire on the
// stage centre when it leads, words gone by the end, no sideways overflow, no section jump.
import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/";
const BASE = process.env.BASE || "http://localhost:8777/";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? "ok   " : "FAIL ") + m); };
const SIZES = (process.env.SIZES || "1366x768,1440x900,1920x1080,375x812,390x844,430x932").split(",").map(s => s.split("x").map(Number));
for (const rm of [false, true]) for (const [w, h] of SIZES) {
  if (rm && !(w === 1366 || w === 390)) continue;
  const mob = w < 900, tag = `${w}x${h}${rm ? " reduced" : ""}`;
  const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, reducedMotion: rm ? "reduce" : "no-preference" });
  const p = await c.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto(BASE + (process.env.LANG2 === "he" ? "he/" : ""), { waitUntil: "load" }); await p.waitForTimeout(900);
  await p.click("#enterBtn", { timeout: 1500 }).catch(() => {}); await p.waitForTimeout(500);
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
  const top = await p.evaluate(() => document.getElementById("macro").getBoundingClientRect().top + scrollY);
  const secH = await p.evaluate(() => document.getElementById("macro").offsetHeight);
  const pinned = !mob && !rm;
  ok(pinned ? secH > h * 2.1 && secH < h * 2.7 : secH <= h * 1.01, `${tag} section height ${secH}px (${(secH / h).toFixed(2)} screens)`);
  const probe = () => p.evaluate(() => { const q = s => document.querySelector("#macro " + s), R = e => e.getBoundingClientRect(), O = e => +getComputedStyle(e).opacity;
    const st = R(q(".mfilm")), v = R(q("video")), l1 = R(q(".ml1")), l2 = R(q(".ml2")), sig = R(q(".msig")), cue = q(".mcue");
    return { st: [st.top, st.height, st.width], vid: [v.left, v.top, v.width, v.height], l1: [l1.top, l1.bottom, O(q(".ml1"))], l2: [l2.top, l2.bottom, O(q(".ml2")), l2.left, l2.right],
      sig: [sig.top, sig.bottom, O(q(".msig"))], cue: cue ? O(cue) * (getComputedStyle(cue).display === "none" ? 0 : 1) : 0, over: document.documentElement.scrollWidth - innerWidth }; });
  const shots = pinned ? [0, 0.08, 0.35, 0.56, 0.78, 0.95, 1] : [-0.5, 0, 0.5];
  let prevTop = null;
  for (const f of shots) {
    const y = pinned ? top + f * (secH - h) : top - h / 2 + (f + 0.5) * (secH);
    await p.evaluate(y => scrollTo(0, y), Math.round(y)); await p.waitForTimeout(pinned ? 1300 : 900);
    const r = await probe();
    const cx = r.st[2] / 2, stC = r.st[0] + r.st[1] / 2, l2c = (r.l2[0] + r.l2[1]) / 2;
    ok(r.over <= 0, `${tag} @${f} no sideways overflow`);
    ok(r.vid[0] <= 0.5 && r.vid[2] >= w - 1 && r.vid[3] >= r.st[1] - 1, `${tag} @${f} film covers the stage, no bars`);
    if (r.l1[2] > 0.05 && r.l2[2] > 0.05) ok(r.l1[1] <= r.l2[0] + 6, `${tag} @${f} lines do not overlap (${Math.round(r.l1[1])} / ${Math.round(r.l2[0])})`);
    if (r.sig[2] > 0.05 && r.l1[2] > 0.05) ok(r.sig[1] < r.l1[0], `${tag} @${f} mark clear of the words`);
    ok(Math.abs((r.l2[3] + r.l2[4]) / 2 - cx) < 3, `${tag} @${f} centred across`);
    if (pinned) {
      if (f === 0) ok(Math.abs(((r.sig[0] + r.l2[1]) / 2) - stC) < 30 && r.cue > 0.9, `${tag} start: composition centred on the stone, cue shown`);
      if (f === 0.35) ok(r.cue < 0.02, `${tag} cue gone early`);
      if (f === 0.56 || f === 0.78) ok(Math.abs(l2c - stC) < h * 0.05 && r.l2[2] > 0.25 && r.l1[2] < 0.45, `${tag} @${f} Fire leads, on the centre of the stone (off by ${Math.round(l2c - stC)}px, l1 ${r.l1[2].toFixed(2)})`);
      if (f >= 0.95) ok(r.l2[2] < 0.02 && r.sig[2] < 0.02, `${tag} @${f} words gone, the stone alone`);
      if (f > 0 && f < 1) { ok(Math.abs(r.st[0]) < 1, `${tag} @${f} stage held (top ${r.st[0].toFixed(1)})`); }
    } else ok(r.l2[2] > 0.95 && r.l1[2] > 0.95, `${tag} @${f} words readable`);
    if (process.env.SHOT) await p.screenshot({ path: `${OUT}mc-${w}${rm ? "r" : ""}-${String(f).replace("-", "m")}.jpg`, quality: 55, type: "jpeg" });
  }
  ok(!errs.length, `${tag} no errors ${errs[0] || ""}`);
  await c.close();
}
console.log(`${pass} pass, ${fail} fail`); await b.close();
