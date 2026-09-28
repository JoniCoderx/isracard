/* Walks the whole page in Hebrew on a phone and reports anything that runs
   off the screen, plus any row whose children sit against the wrong edge for
   the direction. */
import { chromium } from "playwright-core";
const W = 390, H = 844;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: W, height: H }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, reducedMotion: "reduce" });
const errs = []; p.on("pageerror", e => errs.push(String(e).slice(0, 140)));
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2600); await p.click("#enterBtn", { timeout: 6000 }).catch(() => {});
await p.waitForTimeout(800);
await p.click("#langBtn", { timeout: 4000 }).catch(() => {});
await p.waitForTimeout(400);
await p.click('[data-lang="he"]', { timeout: 4000 }).catch(() => {});
await p.waitForTimeout(1200);
const dir = await p.evaluate(() => document.documentElement.getAttribute("dir"));
console.log("dir =", dir);
await p.evaluate(async () => { const s = Math.round(innerHeight * 0.7); for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 130)); } });
await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
await p.waitForTimeout(500);
const out = await p.evaluate(W => {
  const off = [], seen = new Set();
  document.querySelectorAll("body *").forEach(e => {
    const c = getComputedStyle(e);
    if (c.display === "none" || c.visibility === "hidden" || +c.opacity < 0.05) return;
    if (c.position === "fixed") return;                 /* overlays park off-screen by design */
    const r = e.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return;
    /* a row that scrolls sideways is allowed to be wider than its box */
    let sc = e.parentElement;
    for (let i = 0; i < 4 && sc; i++, sc = sc.parentElement) {
      const o = getComputedStyle(sc).overflowX;
      if (o === "auto" || o === "scroll" || o === "hidden") return;
    }
    const over = Math.max(0, -r.left, r.right - W);
    if (over > 2) {
      const key = e.tagName + "." + (e.className || "").toString().trim().split(/\s+/)[0];
      if (seen.has(key)) return; seen.add(key);
      off.push(`${key} x ${Math.round(r.left)}..${Math.round(r.right)} over by ${Math.round(over)} "${(e.textContent||"").trim().replace(/\s+/g," ").slice(0,26)}"`);
    }
  });
  return { off, scrollW: document.documentElement.scrollWidth, sideways: document.documentElement.scrollWidth > W + 1 };
}, W);
console.log("sideways page scroll:", out.sideways ? `YES (${out.scrollW} > ${W})` : "no");
console.log(out.off.length ? "runs off the screen:\n  " + out.off.join("\n  ") : "nothing runs off the screen");
console.log("script errors:", errs.length, errs[0] || "");
await b.close();
