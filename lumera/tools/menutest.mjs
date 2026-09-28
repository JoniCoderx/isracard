/* The menu overlay, in both directions and at two heights.

   What it caught the first time: .mclose asked for position:absolute and a
   later rule of equal weight said relative, so the close button fell into
   the flow, stretched to the full panel and the house mark landed on top of
   it. And the chapter numbers were hand-written into the menu, so Enquire
   was 06 there and 05 everywhere else on the page. */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };

for (const [lang, W, H] of [["en", 390, 844], ["he", 390, 844], ["en", 320, 568], ["he", 320, 568]]) {
  const p = await b.newPage({ viewport: { width: W, height: H }, isMobile: true, hasTouch: true,
    deviceScaleFactor: 1, reducedMotion: "reduce" });
  const errs = []; p.on("pageerror", e => errs.push(String(e).slice(0, 140)));
  await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2600); await p.click("#enterBtn", { timeout: 6000 }).catch(() => {});
  await p.waitForTimeout(800);
  if (lang !== "en") { await p.click("#langBtn", { timeout: 4000 }).catch(() => {}); await p.waitForTimeout(400);
    await p.click(`[data-lang="${lang}"]`, { timeout: 4000 }).catch(() => {}); await p.waitForTimeout(800); }
  await p.click(".menubtn", { timeout: 6000 }).catch(() => {});
  await p.waitForTimeout(1000);
  const tag = `${lang} ${W}`;

  const r = await p.evaluate(W => {
    const box = s => { const e = document.querySelector(s); if (!e) return null;
      const b = e.getBoundingClientRect(), c = getComputedStyle(e);
      return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width, h: b.height, pos: c.position }; };
    const close = box("#menu .mclose"), mark = box("#menu .mbrand"), list = box("#menu .mlist"), foot = box("#menu .mfoot");
    /* every visible thing inside the open menu, checked against the viewport */
    const off = [];
    document.querySelectorAll("#menu *").forEach(e => {
      const b = e.getBoundingClientRect(), c = getComputedStyle(e);
      if (b.width < 6 || b.height < 6 || c.visibility === "hidden" || +c.opacity < 0.05) return;
      if (b.left < -0.5 || b.right > W + 0.5)
        off.push(`${e.tagName}.${(e.className || "").toString().trim().split(/\s+/)[0]}`);
    });
    const nums = [...document.querySelectorAll("#menu .mlist a .k")].map(e => e.textContent.trim());
    /* what the page itself calls those chapters */
    const own = [...document.querySelectorAll("#menu .mlist a")].map(a => {
      const t = document.querySelector(a.getAttribute("href"));
      return t ? (t.getAttribute("data-n") || "") : "";
    });
    return { close, mark, list, foot, off, nums, own,
      dir: document.documentElement.getAttribute("dir"), open: document.getElementById("menu").className };
  }, W);

  ok(r.close && r.close.pos === "absolute", `${tag} the close button is a corner control (${r.close && r.close.pos})`);
  ok(r.close && r.close.w < W * 0.45, `${tag} it is not a banner (${Math.round(r.close.w)} of ${W})`);
  const overlap = r.close && r.mark &&
    Math.max(0, Math.min(r.close.b, r.mark.b) - Math.max(r.close.t, r.mark.t)) *
    Math.max(0, Math.min(r.close.r, r.mark.r) - Math.max(r.close.l, r.mark.l));
  ok(!overlap, `${tag} the house mark is not sitting on it (${Math.round(overlap)}px² of overlap)`);
  ok(r.off.length === 0, `${tag} nothing runs off the screen${r.off.length ? " :: " + r.off.slice(0, 4).join(", ") : ""}`);
  ok(r.nums.join(",") === r.own.join(","),
    `${tag} the menu numbers the chapters the way the page does (menu ${r.nums.join(",")} / page ${r.own.join(",")})`);
  const seq = r.nums.map(Number);
  ok(seq.every((n, i) => n === i + 1), `${tag} the numbering has no gap (${r.nums.join(",")})`);
  const order = r.close && r.mark && r.list && r.foot &&
    r.mark.b <= r.list.t + 1 && r.list.b <= r.foot.t + 1;
  ok(order, `${tag} mark, chapters, footer, in that order and not touching`);
  ok(errs.length === 0, `${tag} no script errors` + (errs.length ? " :: " + errs[0] : ""));
  await p.close();
}
await b.close();
console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
