// Screenshots of given paths at given sizes; LOOK="path|w|h|name[|js]" separated by ;;
import { chromium } from "playwright-core";
const O = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/look/";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
for (const spec of process.env.LOOK.split(";;")) {
  const [pth, w, h, name, js, full] = spec.split("|");
  const c = await b.newContext({ viewport: { width: +w, height: +h }, isMobile: +w < 760, hasTouch: +w < 760, reducedMotion: "reduce" });
  const p = await c.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  await p.goto("http://localhost:8777" + pth, { waitUntil: "load" }); await p.waitForTimeout(900);
  await p.click("#enterBtn", { timeout: 600 }).catch(() => {});
  await p.evaluate(() => document.querySelectorAll(".rv").forEach(e => e.classList.add("in")));
  if (js) { await p.evaluate(js); await p.waitForTimeout(1200); }
  await p.screenshot({ path: O + name + ".png", fullPage: full === "1" });
  console.log(name, p.url(), errs.length ? "ERR " + errs.slice(0, 3).join(" | ") : "ok");
  await c.close();
}
await b.close();
