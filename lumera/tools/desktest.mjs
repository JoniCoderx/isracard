// The desk in #macro: loads, starts in view, pointer pushes stones, sleeps at rest, no errors; phone + reduced motion.
import { chromium } from "playwright-core";
const B = process.argv[2] || "http://localhost:8777/";
const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let fails = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
for (const [w, h, mob, red, path] of [[1440, 900, false, false, ""], [390, 844, true, false, ""], [1440, 900, false, true, ""], [1366, 800, false, false, "he/"]]) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, deviceScaleFactor: mob ? 3 : 1, reducedMotion: red ? "reduce" : "no-preference" });
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto(B + path, { waitUntil: "load" });
  await p.waitForFunction(() => !document.documentElement.classList.contains("locked"), null, { timeout: 20000 }).catch(() => {});
  const tag = `${w}${mob ? " phone" : ""}${red ? " reduced" : ""}${path ? " " + path : ""}`;
  await p.evaluate(() => document.getElementById("macro").scrollIntoView({ block: "center" }));
  await p.waitForFunction(() => window.__desk && window.__desk.started, null, { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(1200);
  const st = await p.evaluate(() => ({ s: __desk.stones, l: __desk.links, started: __desk.started, vid: !!document.getElementById("insidevid"), cv: getComputedStyle(document.getElementById("deskcv")).opacity, top: (() => { const r = document.getElementById("deskcv").getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width * 0.2, r.top + r.height * 0.5); return e && e.id; })() }));
  ok(st.started && st.s > 8 && st.l > 20, `${tag}: desk started, ${st.s} stones, ${st.l} links`);
  ok(!st.vid, `${tag}: the stone film is gone`);
  ok(st.top === "deskcv", `${tag}: the canvas takes the pointer (top element: ${st.top})`);
  if (!red) {
    const before = await p.evaluate(() => JSON.stringify(__desk.pos()));
    const r = await p.evaluate(() => { const b = document.getElementById("deskcv").getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
    if (mob) { await p.touchscreen.tap(r.x + 20, r.y + r.h * 0.8); const c = await p.context().newCDPSession(p);
      const pts = []; for (let i = 0; i <= 20; i++) pts.push({ x: r.x + r.w * (0.05 + 0.9 * i / 20), y: r.y + r.h * 0.72 });
      await c.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [pts[0]] });
      for (const q of pts) { await c.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [q] }); await p.waitForTimeout(16); }
      await c.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    } else { await p.mouse.move(r.x + 5, r.y + r.h * 0.75); for (let i = 0; i <= 40; i++) { await p.mouse.move(r.x + r.w * i / 40, r.y + r.h * (0.75 - 0.4 * Math.sin(i / 40 * Math.PI))); await p.waitForTimeout(16); } }
    await p.waitForTimeout(300);
    const after = await p.evaluate(() => JSON.stringify(__desk.pos()));
    ok(before !== after, `${tag}: a pass of the ${mob ? "finger" : "pointer"} moves the stones`);
    if (!mob) await p.mouse.move(r.x + r.w / 2, r.y - 200);
    await p.waitForFunction(() => !__desk.running, null, { timeout: 12000 }).catch(() => {});
    ok(await p.evaluate(() => !__desk.running), `${tag}: the desk sleeps once everything is at rest`);
  } else ok(await p.evaluate(() => !__desk.running), `${tag}: reduced motion draws once and holds`);
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(400);
  ok(await p.evaluate(() => !__desk.running), `${tag}: off screen it does nothing`);
  ok(!errs.length, `${tag}: no page errors ${errs.join(" | ")}`);
  await ctx.close();
}
await br.close(); console.log(fails ? `${fails} FAILED` : "all passed"); process.exit(fails ? 1 : 0);
