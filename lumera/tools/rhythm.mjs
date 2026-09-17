/* The page as a strip of light and dark: is black a choice or just the default? */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{ width:1440, height:900 } });
await p.emulateMedia({ reducedMotion:"reduce" });
await p.goto("http://127.0.0.1:8777/", { waitUntil:"load" });
await p.waitForTimeout(2600); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
await p.waitForTimeout(900);
const rows = await p.evaluate(() => [...document.querySelectorAll("main > section")].map(s => {
  const light = s.classList.contains("ivory");
  return { id: s.id, light, h: Math.round(s.offsetHeight / innerHeight * 10) / 10 };
}));
let run = 0, worst = 0, worstAt = "";
const strip = rows.map(r => {
  if (r.light) { run = 0; } else { run += r.h; if (run > worst) { worst = run; worstAt = r.id; } }
  return (r.light ? "IVORY " : "black ") + r.id.padEnd(11) + r.h + " screens";
});
console.log(strip.join("\n"));
console.log("\nlight chapters: " + rows.filter(r => r.light).map(r => r.id).join(", "));
console.log("longest unbroken black run: " + worst.toFixed(1) + " screens (ends at " + worstAt + ")");
/* nothing looping any more */
const anim = await p.evaluate(() => [...document.querySelectorAll("#silavu *")].map(e => {
  const c = getComputedStyle(e);
  return c.animationIterationCount === "infinite" && c.animationName !== "none" ? e.className + " → " + c.animationName : null;
}).filter(Boolean));
console.log("infinite animations running: " + (anim.length ? anim.join(", ") : "none"));
/* nothing shadowing a mark */
const sh = await p.evaluate(() => [...document.querySelectorAll("svg.sy")].map(e => {
  const c = getComputedStyle(e);
  return c.filter !== "none" ? (e.parentElement.className || e.parentElement.tagName) + " → " + c.filter : null;
}).filter(Boolean));
console.log("marks carrying a filter: " + (sh.length ? sh.join(", ") : "none"));
await b.close();
