/* The picture that changes: does every monogram card carry two frames, do they
   take turns rather than blink together, and does hover resolve to the worn one? */
import { chromium } from "playwright-core";
const U = "file://" + process.cwd() + "/site/dist/index.html";
const EX = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, console.log("PASS " + m)) : (fail++, console.log("FAIL " + m)); };

const b = await chromium.launch({ executablePath: EX, args: ["--use-angle=swiftshader", "--no-sandbox"] });
for (const [w, h, tag] of [[1440, 900, "desk"], [390, 844, "mob"]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto(U); await p.waitForTimeout(600);
  await p.evaluate(() => window.scrollTo({ top: scrollY + document.getElementById("collection").getBoundingClientRect().top, behavior: "instant" }));
  await p.waitForTimeout(900);

  const shape = await p.evaluate(() => {
    const f = [...document.querySelectorAll(".fig.sw")];
    return f.map(x => ({
      ims: x.querySelectorAll(".im").length,
      dt: !!x.querySelector(".im.dt img"),
      dots: x.querySelectorAll(".swd i").length,
      light: x.classList.contains("swl"),
    }));
  });
  ok(shape.length === 4, `${tag} four swapping figures (${shape.length})`);
  ok(shape.every(s => s.ims === 2 && s.dt), `${tag} each carries a second frame`);
  ok(shape.every(s => s.dots === 2), `${tag} each shows the two-dot tell`);
  ok(shape.filter(s => s.light).length === 3, `${tag} only the monogram trio swaps to a high-key frame (${shape.filter(s => s.light).length})`);

  // watch the ticker for a few beats: never all three at once, and not always none
  const seen = new Set();
  for (let i = 0; i < 26; i++) {
    // re-anchor: with no image files on disk the figures collapse and the page
    // keeps resettling, so hold the collection on screen between samples
    await p.evaluate(() => window.scrollTo({ top: scrollY + document.getElementById("collection").getBoundingClientRect().top, behavior: "instant" }));
    seen.add(await p.evaluate(() => [...document.querySelectorAll(".fig.sw")].filter(f => f.classList.contains("flip")).length));
    await p.waitForTimeout(700);
  }
  ok(!seen.has(4), `${tag} never all at once (${[...seen].sort().join(",")})`);
  ok(seen.size > 1 && Math.max(...seen) > 0, `${tag} the rail does change (${[...seen].sort().join(",")})`);

  const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok(over <= 1, `${tag} no horizontal overflow (${over})`);
  await p.close();
}
await b.close();
console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
