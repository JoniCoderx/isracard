/* The stage: does a tap open it, is the drag free once it is open, does the
   page come back where it was, and is nothing left behind when it closes? */
import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const out = []; let fails = 0;
const ok = (c, m, d = "") => { if (c) out.push("PASS " + m); else { fails++; out.push("FAIL " + m + (d ? " — " + d : "")); } };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
const errs = []; p.on("pageerror", e => errs.push(String(e).slice(0, 150)));
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2600); await p.click("#enterBtn").catch(() => {});
await p.waitForTimeout(800);
await p.evaluate(async () => { const s = Math.round(innerHeight * 0.8); for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 70)); } });

async function tap(x, y) {
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
  await new Promise(r => setTimeout(r, 60));
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await new Promise(r => setTimeout(r, 700));
}
async function swipe(x, y, dx, dy, steps = 12) {
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
  for (let i = 1; i <= steps; i++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + dx * i / steps, y: y + dy * i / steps, id: 1 }] }); await new Promise(r => setTimeout(r, 16)); }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  /* the stage draws the hand into the whole screen, which is four times the
     pixels of the panel in the page; on a CPU rasteriser a frame there takes
     a second or more, and photographing it sooner photographs the old one */
  await new Promise(r => setTimeout(r, 2600));
}
/* the bracelet drifts, so an element screenshot waits for a box that is never
   "stable" and times out. A clip does not wait for anything. */
/* the whole buffer, not its length: two renders of a hand at slightly
   different angles compress to almost the same number of bytes, and a
   threshold on that number is a test that passes when it should not */
const shot = async () => {
  const bx = await (await p.$("#bcv")).boundingBox();
  return await p.screenshot({ clip: bx, timeout: 15000 });
};
const turned = (a, b) => !a.equals(b);

for (const view of ["line", "wrist"]) {
  await p.evaluate(v => { const e = document.getElementById("stripwrap"); e.classList.toggle("wrist", v === "wrist"); e.scrollIntoView({ block: "center", behavior: "instant" }); }, view);
  await p.waitForTimeout(2600);
  const before = await p.evaluate(() => ({ y: Math.round(scrollY), h: document.body.scrollHeight, parent: document.getElementById("stripwrap").parentElement.className }));
  const btn = await p.$(".stbtn");
  ok(!!btn && await btn.isVisible(), `${view} the way in is visible on touch`);
  const box = await (await p.$("#bcv")).boundingBox();
  await tap(box.x + box.width / 2, box.y + box.height / 2);
  const st = await p.evaluate(() => ({
    open: !!document.querySelector(".bstage.open"),
    locked: document.documentElement.classList.contains("locked"),
    ta: getComputedStyle(document.getElementById("bcv")).touchAction,
    cw: document.getElementById("bcv").getBoundingClientRect().width,
    chH: document.getElementById("bcv").getBoundingClientRect().height,
    bar: (() => { const h = document.getElementById("handbar"); if (!h || h.hasAttribute("hidden")) return "n/a"; const r = h.getBoundingClientRect(); return r.top > 0 && r.bottom <= innerHeight + 1 ? "on screen" : "off at " + Math.round(r.top); })(),
    hint: !!document.querySelector(".bstage.open .sthint")
  }));
  ok(st.open, `${view} a tap opens the stage`);
  ok(st.locked, `${view} the page is held while it is open`);
  ok(st.ta === "none", `${view} the drag is free in the stage`, st.ta);
  ok(st.cw > 340 && st.chH > 600, `${view} the stage is the whole screen`, `${Math.round(st.cw)}x${Math.round(st.chH)}`);
  ok(st.bar !== "n/a" ? st.bar === "on screen" : true, `${view} the hand controls came with it`, st.bar);

  /* a drag in any direction must turn it and must not move the page */
  const y0 = await p.evaluate(() => Math.round(scrollY));
  let s0 = await shot(); await swipe(195, 420, 40, 150); let s1 = await shot();
  ok(turned(s0, s1), `${view} a downward drag turns it in the stage`, "the frame did not change");
  s0 = s1; await swipe(195, 420, -150, 30); s1 = await shot();
  ok(turned(s0, s1), `${view} a sideways drag turns it in the stage`, "the frame did not change");
  ok((await p.evaluate(() => Math.round(scrollY))) === y0, `${view} the page does not move behind it`);

  await p.screenshot({ path: `${OUT}/stage-${view}.png` });
  await p.click(".stclose");
  await p.waitForTimeout(800);
  const after = await p.evaluate(() => ({ y: Math.round(scrollY), h: document.body.scrollHeight, parent: document.getElementById("stripwrap").parentElement.className, open: !!document.querySelector(".bstage.open"), locked: document.documentElement.classList.contains("locked"), holds: document.querySelectorAll(".bhold").length }));
  ok(!after.open && !after.locked, `${view} it closes and gives the page back`);
  ok(after.parent === before.parent, `${view} the chapter goes back where it was`, `${before.parent} -> ${after.parent}`);
  ok(after.holds === 0, `${view} no placeholder is left behind`, String(after.holds));
  ok(Math.abs(after.y - before.y) < 6, `${view} the page is where you left it`, `${before.y} -> ${after.y}`);
  ok(after.h === before.h, `${view} the page is the height it was`, `${before.h} -> ${after.h}`);
}
ok(errs.length === 0, "nothing throws", errs.slice(0, 2).join(" | "));
console.log(out.join("\n"));
console.log(`\n${out.filter(l => l.startsWith("PASS")).length} pass, ${fails} fail`);
await b.close();
process.exit(fails ? 1 : 0);
