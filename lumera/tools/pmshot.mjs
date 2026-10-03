// The piece window: screenshot + layout at desktop and phone. SHOT=prefix PIECE=n LANG=he
import { chromium } from "playwright-core";
const OUT = process.env.OUT || "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const sizes = (process.env.SIZES || "1352x1024,1920x1080,1366x768,390x844").split(",").map(s => s.split("x").map(Number));
for (const [w, h] of sizes) for (const n of (process.env.PIECES || "0").split(",").map(Number)) {
  const mob = w < 760;
  const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, reducedMotion: "reduce" });
  const p = await c.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("http://localhost:8777/" + (process.env.LANG2 === "he" ? "he/" : ""), { waitUntil: "load" }); await p.waitForTimeout(900);
  await p.evaluate(n => document.querySelectorAll(".pgrid .piece:not(.soon) .vw")[n].click(), n); await p.waitForTimeout(1200);
  const r = await p.evaluate(() => { const q = s => document.querySelector(s), R = e => e ? e.getBoundingClientRect() : null;
    const box = q("#pmodal .mbox"), req = q("#pmReq"), mim = q("#pmIm"), bd = q("#pmodal .mbd");
    const b = R(box), rq = R(req);
    return { box: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)], bg: getComputedStyle(box).backgroundColor,
      img: Math.round(R(mim).width), info: Math.round(R(bd).width), reqBottom: Math.round(rq.bottom), vh: innerHeight,
      boxScroll: box.scrollHeight - box.clientHeight, bdScroll: bd.scrollHeight - bd.clientHeight, docOver: document.documentElement.scrollWidth - innerWidth };
  });
  console.log(`${w}x${h} piece${n}`, JSON.stringify(r), errs.length ? "ERR " + errs[0] : "");
  await p.screenshot({ path: `${OUT}${process.env.SHOT || "pm"}-${w}-${n}.png` });
  await c.close();
}
await b.close();
