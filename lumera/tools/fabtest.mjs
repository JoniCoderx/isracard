/* The phone's bottom bar: it arrives once the opening screen is behind the
   reader, it leaves when the enquiry is in front of them, it spans the screen
   rather than floating over a corner of it, and the closing chapter keeps its
   own last line clear of it. */
import { chromium } from "playwright-core";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const [W, lang] of [[390, "en"], [320, "en"], [390, "he"]]) {
  const p = await b.newPage({ viewport: { width: W, height: 800 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const errs = []; p.on("pageerror", e => errs.push(String(e).slice(0, 120)));
  await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2400); await p.click("#enterBtn", { timeout: 6000 }).catch(() => {});
  await p.waitForTimeout(700);
  if (lang === "he") { await p.click("#langBtn", { timeout: 4000 }).catch(() => {});
    await p.waitForTimeout(350); await p.click('[data-lang="he"]', { timeout: 4000 }).catch(() => {}); await p.waitForTimeout(1300); }
  const read = async y => {
    await p.evaluate(v => scrollTo({ top: v, behavior: "instant" }), y); await p.waitForTimeout(420);
    return p.evaluate(() => { const f = document.getElementById("fab"), r = f.getBoundingClientRect();
      return { show: f.classList.contains("show"), x: Math.round(r.left), w: Math.round(r.width),
        bottom: Math.round(r.bottom), h: Math.round(r.height), vw: innerWidth, vh: innerHeight }; });
  };
  const top = await read(0);
  ok(!top.show, `${W} ${lang} the bar is not there on the opening screen`);
  const mid = await read(3000);
  ok(mid.show, `${W} ${lang} it arrives once the opening screen is behind the reader`);
  ok(mid.x === 0 && mid.w === mid.vw, `${W} ${lang} it spans the screen rather than floating (${mid.x}, ${mid.w} of ${mid.vw})`);
  ok(mid.h <= 78, `${W} ${lang} it stays slim (${mid.h}px)`);
  ok(Math.abs(mid.bottom - mid.vh) <= 1, `${W} ${lang} it sits on the bottom edge`);
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  const end = await read(total);
  ok(!end.show, `${W} ${lang} it leaves once the enquiry is in front of the reader`);
  /* the bar is gone by the time the last line of the page is on screen, so
     there is nothing for it to be covering — that is the whole reason it
     leaves rather than a claim about padding */
  const lastLine = await p.evaluate(() => {
    const f = document.getElementById("fab");
    const foot = document.querySelector("#end") || document.body;
    const r = foot.getBoundingClientRect();
    return { barShown: f.classList.contains("show"), footBottom: Math.round(r.bottom), vh: innerHeight };
  });
  ok(!lastLine.barShown && lastLine.footBottom <= lastLine.vh + 2,
    `${W} ${lang} the page ends with the bar already gone (foot at ${lastLine.footBottom} of ${lastLine.vh})`);
  ok(errs.length === 0, `${W} ${lang} no script errors (${errs[0] || ""})`);
  await p.close();
}
console.log(`\n${pass} pass, ${fail} fail`);
await b.close();
process.exit(fail ? 1 : 0);
