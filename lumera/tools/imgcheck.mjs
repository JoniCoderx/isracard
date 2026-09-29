/* No broken photograph anywhere a reader can get to.
   Walks the whole page at three widths and in both languages, opens each piece
   window, and reports any <img> the browser could not decode, plus any request
   that came back 4xx. A card whose photograph is missing still lays out
   correctly, so nothing but this catches it. */
import { chromium } from "playwright-core";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });

for (const [W, H, lang] of [[390, 844, "en"], [768, 1024, "en"], [1440, 900, "en"], [390, 844, "he"]]) {
  const tag = `${W} ${lang}`;
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const bad = [];
  p.on("response", r => { if (r.status() >= 400 && /\.(jpg|png|webp|mp4)(\?|$)/.test(r.url())) bad.push(r.status() + " " + r.url().replace(/^https?:\/\/[^/]+/, "")); });
  await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2400); await p.click("#enterBtn", { timeout: 6000 }).catch(() => {});
  await p.waitForTimeout(600);
  if (lang === "he") { await p.click("#langBtn", { timeout: 4000 }).catch(() => {});
    await p.waitForTimeout(350); await p.click('[data-lang="he"]', { timeout: 4000 }).catch(() => {}); await p.waitForTimeout(1200); }

  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += Math.round(H * 0.6)) {
    await p.evaluate(v => scrollTo({ top: v, behavior: "instant" }), y); await p.waitForTimeout(120);
  }
  await p.waitForTimeout(1200);

  /* every piece window, where the gallery lives */
  const pieces = await p.evaluate(() => [...document.querySelectorAll("#collection .piece .lnk.vw")].length);
  for (let i = 0; i < pieces; i++) {
    await p.evaluate(k => { const v = document.querySelectorAll("#collection .piece .lnk.vw")[k]; if (v) v.click(); }, i);
    await p.waitForTimeout(900);
    await p.evaluate(() => { const g = document.querySelector("#pmodal .gnext"); for (let n = 0; n < 5; n++) g && g.click(); });
    await p.waitForTimeout(700);
    await p.keyboard.press("Escape"); await p.waitForTimeout(400);
  }

  const broken = await p.evaluate(() => [...document.querySelectorAll("img")]
    .filter(i => (i.currentSrc || i.src) && !i.naturalWidth)
    .map(i => (i.currentSrc || i.src).replace(/^https?:\/\/[^/]+/, "")));
  ok(broken.length === 0, `${tag} every photograph decodes (${broken.length} broken${broken[0] ? ": " + broken[0] : ""})`);
  ok(bad.length === 0, `${tag} nothing came back missing (${bad.length}${bad[0] ? ": " + bad[0] : ""})`);
  await p.close();
}
console.log(`\n${pass} pass, ${fail} fail`);
await b.close();
process.exit(fail ? 1 : 0);
