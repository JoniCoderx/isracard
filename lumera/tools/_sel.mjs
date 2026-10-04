import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const S = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/";
for (const [path, w, mob, n] of [["", 1366, false, 2], ["he/", 1366, false, 2], ["", 390, true, 2], ["he/", 390, true, 0]]) {
  const c = await b.newContext({ viewport: { width: w, height: 900 }, hasTouch: mob, isMobile: mob });
  const p = await c.newPage();
  await p.goto("http://localhost:8777/" + path, { waitUntil: "load" }); await p.waitForTimeout(1000);
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; sessionStorage.clear(); });
  const card = p.locator(".pgrid .piece:not(.soon)").nth(n); await card.scrollIntoViewIfNeeded();
  if (mob) await card.locator(".q").tap(); else await card.locator(".q").click(); await p.waitForTimeout(1500);
  const el = p.locator("#csel"); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
  const info = await el.evaluate(e => { const r = e.getBoundingClientRect(); const t = document.getElementById("cselTxt").getBoundingClientRect(), a = document.getElementById("cselAct").getBoundingClientRect(), i = document.getElementById("cselImg").getBoundingClientRect(); return { h: Math.round(r.height), txt: [Math.round(t.top), Math.round(t.height)], act: Math.round(a.top), img: [Math.round(i.top), Math.round(i.height)], over: e.scrollWidth > e.clientWidth }; });
  console.log(path || "en", w, JSON.stringify(info));
  const bb = await el.boundingBox();
  await p.screenshot({ path: S + `sel-${path ? "he" : "en"}-${w}.png`, clip: { x: Math.max(0, bb.x - 16), y: bb.y - 16, width: Math.min(bb.width + 32, w - Math.max(0, bb.x - 16)), height: bb.height + 32 } });
  await c.close();
}
await b.close();
