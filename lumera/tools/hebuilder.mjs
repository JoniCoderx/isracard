/* The builder in Hebrew, right to left: the grids and the scroll rows are new,
   and a grid that only works in one direction is a grid that is wrong. */
import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const lang of ["he", "ar"]) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2400); await p.click("#enterBtn").catch(() => {});
  await p.waitForTimeout(600);
  await p.evaluate(l => window.__setLang ? window.__setLang(l) : (document.querySelector(`[data-lang="${l}"]`) || {}).click?.(), lang);
  await p.waitForTimeout(1400);
  await p.evaluate(async () => { const s = Math.round(innerHeight * 0.8); for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 70)); } });
  await p.evaluate(() => document.querySelector("#opts .chips.cuts").scrollIntoView({ block: "center", behavior: "instant" }));
  await p.waitForTimeout(900);
  const r = await p.evaluate(() => {
    const dir = document.documentElement.dir;
    const cuts = document.querySelector("#opts .chips.cuts");
    const ch = [...cuts.querySelectorAll(".chip")];
    const clipped = ch.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent.trim());
    const over = [...document.querySelectorAll("#opts *")].filter(e => {
      const q = e.getBoundingClientRect(); return q.width > 0 && (q.left < -2 || q.right > innerWidth + 2);
    }).map(e => String(e.className).split(" ")[0] + " " + Math.round(e.getBoundingClientRect().left) + ".." + Math.round(e.getBoundingClientRect().right));
    return { dir, cols: getComputedStyle(cuts).gridTemplateColumns.split(" ").length, clipped, over: [...new Set(over)].slice(0, 6), optsH: Math.round(document.getElementById("opts").getBoundingClientRect().height) };
  });
  console.log(lang, JSON.stringify(r));
  const el = await p.$("#opts"); if (el) await el.screenshot({ path: `${OUT}/opts-${lang}.png` });
  await p.close();
}
await b.close();
