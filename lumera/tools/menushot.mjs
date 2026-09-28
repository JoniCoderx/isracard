/* The menu overlay, in a language and at a width. */
import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const lang = process.argv[2] || "he", W = Number(process.argv[3] || 390), H = Number(process.argv[4] || 844);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: W, height: H }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: "reduce" });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2600); await p.click("#enterBtn").catch(()=>{});
await p.waitForTimeout(900);
if (lang !== "en") { await p.evaluate(l => window.__setLang ? window.__setLang(l) : null, lang);
  await p.waitForTimeout(400);
  const done = await p.evaluate(()=>document.documentElement.getAttribute("data-lang"));
  if (done !== lang) { await p.click("#langBtn").catch(()=>{}); await p.waitForTimeout(400);
    await p.click(`[data-lang="${lang}"]`).catch(()=>{}); await p.waitForTimeout(700); }
}
await p.waitForTimeout(600);
await p.click(".menubtn").catch(()=>{});
await p.waitForTimeout(1100);
await p.screenshot({ path: `${OUT}/menu-${lang}-${W}.png` });
console.log("lang now:", await p.evaluate(()=>document.documentElement.getAttribute("data-lang")+" dir="+document.documentElement.getAttribute("dir")));
await b.close();
