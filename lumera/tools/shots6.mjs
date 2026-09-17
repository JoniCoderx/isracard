import { chromium } from "playwright-core";
import fs from "fs";
const DIR = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/v22";
fs.mkdirSync(DIR, { recursive:true });
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [tag, w, h] of [["d",1440,900],["m390",390,844]]) {
  const p = await b.newPage({ viewport:{ width:w, height:h } });
  await p.emulateMedia({ reducedMotion:"reduce" });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("http://127.0.0.1:8777/", { waitUntil:"load" });
  await p.waitForTimeout(2800); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
  await p.waitForTimeout(1200);
  const shot = async (id, name, off = 0) => {
    await p.evaluate(([i, o]) => { const e = document.getElementById(i); window.scrollTo({ top: scrollY + e.getBoundingClientRect().top + o, behavior:"instant" }); }, [id, off]);
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${DIR}/${tag}-${name}.png` });
  };
  await p.screenshot({ path: `${DIR}/${tag}-hero.png` });
  await shot("what", "what");
  await shot("what", "what2", 520);
  await shot("clients", "clients");
  await shot("collection", "collection", 200);
  await shot("filmpin", "film", 700);
  await shot("house", "house");
  console.log(tag, "errors:", errs.length, errs.slice(0,2).join(" | "));
  await p.close();
}
console.log("ok"); await b.close();
