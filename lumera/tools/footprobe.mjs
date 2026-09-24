import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
for (const w of [390, 320]) {
  const p = await b.newPage({ viewport: { width: w, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2200); await p.click("#enterBtn").catch(()=>{});
  await p.waitForTimeout(600);
  await p.evaluate(() => document.getElementById("end").scrollIntoView({ block: "start", behavior: "instant" }));
  await p.waitForTimeout(900);
  console.log(w, await p.evaluate(() => {
    const soc = document.querySelector(".fgrid .soc");
    const a = [...soc.querySelectorAll("a")].map(e => { const r = e.getBoundingClientRect(); return Math.round(r.top); });
    const rows = new Set(a).size;
    const over = [...document.querySelectorAll("#end *")].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1); }).length;
    return JSON.stringify({ icons: a.length, rows, overflowing: over });
  }));
  await (await p.$("#end")).screenshot({ path: `${OUT}/foot-${w}.png` });
  await p.close();
}
await b.close();
