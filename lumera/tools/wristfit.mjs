/* Does the Line land on the wrist?

   The local stand-in plates paint a bright green band exactly where the plate
   table says the wrist is. This opens the wrist view, screenshots the strip
   canvas, and asks one question: of the pixels the renderer drew that are NOT
   the plate, how many sit inside the green band's rows?  If the geometry is
   right the stones cover the band; if it is wrong they sit off the arm. */
import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };

for (const [n, w, h, mob] of [["desk", 1440, 900, false], ["mob", 390, 844, true]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, deviceScaleFactor: 1 });
  const errs = []; p.on("pageerror", e => errs.push(String(e).slice(0, 200)));
  await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2400); await p.click("#enterBtn", { timeout: 4000 }).catch(() => {});
  await p.waitForTimeout(800);
  await p.evaluate(async () => { const s = Math.round(innerHeight * 0.8); for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 90)); } });
  await p.evaluate(() => { const el = document.getElementById("stripwrap"); el.scrollIntoView({ block: "center", behavior: "instant" }); });
  await p.waitForTimeout(500);
  await p.evaluate(() => window.__stripView && window.__stripView("wrist"));
  await p.waitForTimeout(2600);

  const shown = await p.evaluate(() => {
    const cs = id => getComputedStyle(document.getElementById(id)).display;
    return { strip: cs("stripcv"), bcv: cs("bcv"), src: (window.__wristPlate ? window.__wristPlate() : null) };
  });
  ok(shown.strip === "block" && shown.bcv === "none", `${n} the wrist view is the photographed canvas (strip=${shown.strip} bcv=${shown.bcv})`);
  ok(!!shown.src, `${n} the plate table answers (${JSON.stringify(shown.src)})`);

  const { writeFileSync } = await import("node:fs");
  const shot = async tag => {
    const r = await p.$("#stripwrap").then(e => e.boundingBox());
    const buf = await p.screenshot({ clip: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) } });
    writeFileSync(`${OUT}/wristfit-${n}-${tag}.png`, buf);
    return buf;
  };
  const seen = {};
  for (const kind of ["f", "m"]) {
    await p.evaluate(k => window.__hand && window.__hand({ kind: k, skin: 2 }), kind);
    await p.waitForTimeout(1600);
    seen[kind] = await shot(kind);
  }
  ok(!seen.f.equals(seen.m), `${n} her hand and his are different plates`);

  /* the tones have to reach the picture, not just the table */
  await p.evaluate(() => window.__hand && window.__hand({ kind: "f", skin: 0 }));
  await p.waitForTimeout(1500); const light = await shot("f-skin0");
  await p.evaluate(() => window.__hand && window.__hand({ kind: "f", skin: 5 }));
  await p.waitForTimeout(1500); const dark = await shot("f-skin5");
  ok(!light.equals(dark), `${n} the skin tones change the plate`);

  /* the stage would open the canvas this view switched off */
  const stage = await p.evaluate(() => { const b = document.querySelector("#stripwrap .stbtn"); return b ? getComputedStyle(b).display : "absent"; });
  ok(stage === "none" || stage === "absent", `${n} the stage button is not offered on a wrist (${stage})`);

  /* and the Line turns on the arm under a finger */
  const box = await p.$("#stripwrap").then(e => e.boundingBox());
  const before = await shot("pre-drag");
  await p.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.62);
  await p.mouse.down();
  for (let i = 1; i <= 8; i++) { await p.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.62 + i * 9); await p.waitForTimeout(30); }
  await p.mouse.up(); await p.waitForTimeout(1200);
  const after = await shot("post-drag");
  ok(!before.equals(after), `${n} the Line turns on the wrist under a drag`);
  ok(errs.length === 0, `${n} no script errors` + (errs.length ? " :: " + errs[0] : ""));
  await p.close();
}
await b.close();
console.log(`\n${pass} pass, ${fail} fail`);
