import { chromium } from "playwright-core";
import fs from "fs";
const DIR = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/v23";
fs.mkdirSync(DIR, { recursive:true });
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [tag, w, h, lang] of [["390",390,844,"en"],["320",320,720,"en"],["390he",390,844,"he"]]) {
  const p = await b.newPage({ viewport:{ width:w, height:h }, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  await p.emulateMedia({ reducedMotion:"reduce" });
  await p.goto("http://127.0.0.1:8777/", { waitUntil:"load" });
  await p.waitForTimeout(2600); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
  if (lang === "he") { await p.evaluate(() => document.getElementById("langBtn").click()); await p.waitForTimeout(900); }
  await p.waitForTimeout(800);
  const shot = async (id, name, off = 0) => {
    await p.evaluate(([i, o]) => { const e = document.getElementById(i); window.scrollTo({ top: scrollY + e.getBoundingClientRect().top + o, behavior:"instant" }); }, [id, off]);
    await p.waitForTimeout(1200); await p.screenshot({ path: `${DIR}/${tag}-${name}.png` });
  };
  await p.screenshot({ path: `${DIR}/${tag}-hero.png` });
  await shot("clients", "clients");
  await shot("build", "build", 620);
  await shot("inside", "certs", 2400);
  await p.close();
}
console.log("ok"); await b.close();
