import { chromium } from "playwright-core";
import fs from "fs";
const OUT = process.argv[2]; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = []; p.on("pageerror", e => errs.push(String(e)));
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2600); await p.click("#enterBtn", { timeout: 6000 }).catch(() => {});
await p.waitForTimeout(700);
await p.click("#langBtn", { timeout: 4000 }).catch(() => {});
await p.waitForTimeout(400);
await p.click('[data-lang="he"]', { timeout: 4000 }).catch(() => {});
await p.waitForTimeout(1400);
const lang = await p.evaluate(() => document.documentElement.getAttribute("dir") + "/" + document.documentElement.getAttribute("data-lang"));
const total = await p.evaluate(() => document.documentElement.scrollHeight);
let shot = 0;
for (let y = 0; y + 200 < total; y += 40) {
  await p.evaluate(v => scrollTo({ top: v, behavior: "instant" }), y); await p.waitForTimeout(40);
  if (y % 760 === 0) { await p.waitForTimeout(450);
    const w = await p.evaluate(() => { let best="",bt=-1e9; document.querySelectorAll("section[id]").forEach(s=>{const t=s.getBoundingClientRect().top; if(t<innerHeight/2&&t>bt){bt=t;best=s.id;}}); return best; });
    await p.screenshot({ path: `${OUT}/${String(shot).padStart(2,"0")}-${w||"x"}.png` }); shot++; }
}
console.log("lang", lang, "screens", shot, "total", total, "errors", errs.length);
await b.close();
