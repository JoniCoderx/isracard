// Steady scroll: walks the page in small steps, frame by frame, and checks that
// things in the flow do not move relative to the page (no scroll-linked drift),
// and that sticky stages hold exactly at the top while they are pinned.
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? "ok   " : "FAIL ") + m); };
for (const [w, h, mob] of [[1366, 768, false], [390, 844, true]]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob });
  const p = await c.newPage();
  await p.goto(process.env.BASE || "http://localhost:8777/", { waitUntil: "load" }); await p.waitForTimeout(900);
  await p.click("#enterBtn", { timeout: 1500 }).catch(() => {}); await p.waitForTimeout(500);
  const r = await p.evaluate(async () => {
    document.documentElement.style.scrollBehavior = "auto";
    const watch = [...document.querySelectorAll(".pgrid .piece:not(.soon) .im img, .hsig svg.sy, .fbig svg.sy, #macro video, #macro .mh, #macro .msig, #collection .sechead h2, #build h2")].slice(0, 40);
    const stages = [...document.querySelectorAll("#craft .sgstage")];
    const raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const H = document.documentElement.scrollHeight - innerHeight, base = new Map(), dev = new Map(); let stageJ = 0;
    /* a first pass lets every one-time reveal play out; the second is measured */
    for (let y = 0; y < H; y += 300) { scrollTo(0, y); await raf(); }
    await new Promise(r => setTimeout(r, 2600));
    for (let y = 0; y < H; y += 23) {
      scrollTo(0, y); await raf();
      for (const e of watch) { const rr = e.getBoundingClientRect(); if (rr.bottom < -50 || rr.top > innerHeight + 50) continue;
        const pos = rr.top + scrollY; if (!base.has(e)) base.set(e, pos); dev.set(e, Math.max(dev.get(e) || 0, Math.abs(pos - base.get(e)))); }
      for (const s of stages) { const sec = s.parentElement.getBoundingClientRect(), st = s.getBoundingClientRect();
        if (sec.top < -2 && sec.bottom > innerHeight + 2) stageJ = Math.max(stageJ, Math.abs(st.top)); }
    }
    const moved = [...dev.entries()].filter(([, d]) => d > 1.5).map(([e, d]) => (e.closest("[id]") || e).id + " " + e.tagName.toLowerCase() + " " + d.toFixed(1) + "px");
    return { n: dev.size, moved, stageJ };
  });
  ok(r.moved.length === 0, `${w} ${r.n} watched elements steady against the page${r.moved.length ? ": " + r.moved.slice(0, 6).join(", ") : ""}`);
  ok(r.stageJ < 0.6, `${w} signature stage holds at the top while pinned (max ${r.stageJ.toFixed(2)}px)`);
  await c.close();
}
console.log(`${pass} pass, ${fail} fail`); await b.close();
