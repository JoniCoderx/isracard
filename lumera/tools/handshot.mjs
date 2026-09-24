import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const TAG = process.argv[2] || "a";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const [n, w, h, mob] of [["desk", 1440, 900, false], ["mob", 390, 844, true]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, deviceScaleFactor: 2 });
  const errs = []; p.on("pageerror", e => errs.push(String(e).slice(0, 160)));
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil: "load" });
  await p.waitForTimeout(2600);
  await p.click("#enterBtn", { timeout: 4000 }).catch(() => {});
  await p.waitForTimeout(900);
  await p.evaluate(async () => {
    const s = Math.round(innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 90)); }
  });
  await p.evaluate(() => {
    const el = document.getElementById("stripwrap");
    el.scrollIntoView({ block: "center", behavior: "instant" });
    el.classList.add("wrist");
  });
  await p.waitForTimeout(3500);
  for (const [k, kind] of [["f", "f"], ["m", "m"]]) {
    await p.evaluate(kk => window.__hand && window.__hand({ kind: kk, skin: 1 }), kind);
    await p.waitForTimeout(2200);
    const el = await p.$("#bcv");
    if (el) await el.screenshot({ path: `${OUT}/hand-${TAG}-${n}-${k}.png` });
  }
  console.log(n + " errors=" + errs.length + (errs.length ? " :: " + errs[0] : ""));
  await p.close();
}
await b.close();
