// The foot of the signature stage, scrolled past and back: no dark hairline
// between the white half and the white collection, at several widths and
// pixel densities. Reads the actual pixels.
import { chromium } from "playwright-core";
import { execFileSync } from "child_process";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/seam/";
import fs from "fs"; fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ports = (process.env.PORTS || "8777").split(",");
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };
for (const port of ports) for (const [w, h, dpr] of [[2000, 1000, 1], [1440, 900, 1], [1440, 900, 2], [390, 844, 3], [1366, 768, 1.25]]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: w < 500, hasTouch: w < 500 }); const p = await c.newPage();
  await p.goto(`http://localhost:${port}/`, { waitUntil: "load" }); await p.waitForTimeout(600); await p.evaluate(() => document.getElementById("enterBtn").click());
  await p.waitForFunction(() => !document.documentElement.classList.contains("locked"), null, { timeout: 15000 }).catch(() => {}); await p.evaluate(() => document.documentElement.style.scrollBehavior = "auto");
  let worst = 0, where = "";
  for (const off of [0.2, 0.35, 0.5, 0.65]) {
    // past it, then back up to it
    await p.evaluate(() => { const e = document.getElementById("collection"); scrollTo(0, e.getBoundingClientRect().top + scrollY + 600); }); await p.waitForTimeout(250);
    const y = await p.evaluate(off => { const st = document.querySelector("#craft .sgstage"), e = document.getElementById("craft"); const r = st.getBoundingClientRect(); scrollTo(0, scrollY + r.bottom - innerHeight * off); return 0; }, off); await p.waitForTimeout(500);
    const bot = await p.evaluate(() => document.querySelector("#craft .sgstage").getBoundingClientRect().bottom);
    const clip = { x: 0, y: Math.max(0, bot - 6), width: w, height: 12 };
    const f = OUT + `${port}-${w}-${dpr}-${off}.png`; await p.screenshot({ clip, path: f });
    const d = JSON.parse(execFileSync("python3", ["-c", `
from PIL import Image; import json,sys
im=Image.open(sys.argv[1]).convert("L"); W,H=im.size; px=im.load(); best=(0,0)
for y in range(H):
    xs=range(int(W*0.55),W,3); v=sum(255-px[x,y] for x in xs)/len(xs)
    if v>best[0]: best=(v,y)
print(json.dumps(best))`, f]).toString());
    if (d[0] > worst) { worst = d[0]; where = `off ${off} row ${d[1]}`; }
  }
  ok(worst < 12, `${port} ${w}×${h}@${dpr}: darkest row at the foot of the stage ${worst.toFixed(1)}/255 (${where})`);
  await c.close();
}
console.log(`${pass} pass, ${fail} fail`); await b.close();
