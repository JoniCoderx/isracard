/* The builder only works on a phone because the canvas stays on screen while
   you answer. Any rule that restates its position quietly un-sticks it and
   nothing else in the suite would notice.

   Scrolled from the top of the chapter downwards, not with scrollIntoView —
   that lands a sticky element at the far end of its own range and then
   reports, correctly, that it is moving. */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2400); await p.click("#enterBtn").catch(() => {});
await p.waitForTimeout(800);
await p.evaluate(async () => { const s = Math.round(innerHeight*0.7); for (let y=0;y<document.body.scrollHeight;y+=s){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,80));} });
let fails = 0;
for (const view of ["line", "wrist"]) {
  await p.evaluate(v => document.getElementById("stripwrap").classList.toggle("wrist", v === "wrist"), view);
  await p.waitForTimeout(1200);
  const r = await p.evaluate(async () => {
    const e = document.getElementById("stripwrap");
    const base = document.getElementById("configure").getBoundingClientRect().top + scrollY - 40;
    const tops = [];
    for (let k = 0; k <= 6; k++) {
      scrollTo({ top: base + k * 130, behavior: "instant" });
      await new Promise(r => setTimeout(r, 220));
      tops.push(Math.round(e.getBoundingClientRect().top));
    }
    /* once it has parked it must stay parked: the last four readings should
       all be the same, and on screen */
    const tail = tops.slice(-4);
    return { pos: getComputedStyle(e).position, tops,
      parked: tail.every(v => v === tail[0] && v > -2 && v < innerHeight * 0.4) };
  });
  const ok = r.pos === "sticky" && r.parked;
  if (!ok) fails++;
  console.log((ok ? "PASS " : "FAIL ") + view + " the canvas stays on screen while you answer — " + r.pos + ", tops " + r.tops.join(" "));
}
console.log(fails ? "\nFAIL" : "\nPASS both views");
await b.close();
process.exit(fails ? 1 : 0);
