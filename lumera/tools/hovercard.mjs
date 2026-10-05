// Collection cards: one soft cross-fade on hover, no timer, no tilt, frame and
// buttons hold still; fast in/out leaves nothing half-turned; arrows still
// work; on touch a swipe changes the photograph without opening the piece and
// a tap opens the photograph on show.
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const U = process.env.U || "http://localhost:8777/";
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };
{ const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto(U, { waitUntil: "load" }); await p.waitForTimeout(800); await p.click("#enterBtn", { timeout: 1500 }).catch(() => {});
  const card = p.locator(".pgrid .piece:not(.soon)").first(); await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(900);
  const geo = () => p.evaluate(() => { const pc = document.querySelector(".pgrid .piece:not(.soon)"), f = pc.querySelector(".fig"), n = pc.querySelector(".cnext"), t = pc.querySelector(".t");
    const R = e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(v => Math.round(v * 10) / 10).join(","); };
    return { fig: R(f), next: R(n), t: R(t), tf: getComputedStyle(f).transform, at: pc.__at, on: [...pc.querySelectorAll(".im.hx")].map(l => +getComputedStyle(l).opacity * (getComputedStyle(l).visibility === "visible" ? 1 : 0)) }; });
  const box = await card.locator(".fig").boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.waitForTimeout(150);
  const g0 = await geo();
  const seen = new Set(); for (let i = 0; i < 14; i++) { await p.waitForTimeout(300); const g = await geo(); seen.add(g.on.map(v => v > 0.5 ? 1 : 0).join("")); }
  const g1 = await geo();
  ok(seen.size <= 2 && g1.on.filter(v => v > 0.95).length === 1, `hover: one soft change and it stays (${[...seen].join(" | ")})`);
  ok(g0.fig === g1.fig && g0.next === g1.next && g0.t === g1.t && (g1.tf === "none" || g1.tf === "matrix(1, 0, 0, 1, 0, 0)"), `frame, arrow and name hold still (${g1.tf}) ${JSON.stringify([g0,g1])}`);
  const sc = await p.evaluate(() => { const l = [...document.querySelectorAll(".pgrid .piece:not(.soon)")[0].querySelectorAll(".im img")].map(i => getComputedStyle(i).transform); return l; });
  ok(sc.some(t => /matrix\(1\.02/.test(t)) && !sc.some(t => /matrix3d/.test(t)), `inner zoom a breath, no 3D (${[...new Set(sc)].join(" ")})`);
  ok(await p.evaluate(() => !document.querySelector(".tglare") && !document.querySelector(".fig.tilt")), "no tilt layer");
  await p.mouse.move(5, 5); await p.waitForTimeout(1200);
  const g2 = await geo(); ok(g2.on.every(v => v === 0) && g2.at === 0, `leave: back to the first photograph (${g2.on.join(",")})`);
  // fast passes
  for (let i = 0; i < 6; i++) { await p.mouse.move(box.x + 40, box.y + 40); await p.waitForTimeout(40 + i * 15); await p.mouse.move(5, 5); await p.waitForTimeout(30); }
  await p.waitForTimeout(1200); const g3 = await geo(); ok(g3.on.every(v => v === 0), `fast in/out leaves nothing half-turned (${g3.on.join(",")})`);
  // arrows from a hovered card
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.waitForTimeout(1200);
  await card.locator(".cnext").click(); await p.waitForTimeout(900);
  const g4 = await geo(); ok(g4.on.filter(v => v > 0.95).length === 1 && g4.at === 2, `arrow after the hover moves on to photograph ${g4.at + 1} ${JSON.stringify(g4)}`);
  await card.locator(".cprev").click(); await p.waitForTimeout(900); await card.locator(".cprev").click(); await p.waitForTimeout(900);
  const g5 = await geo(); ok(g5.at === 0 && g5.on.every(v => v === 0), `arrows walk back to the first (${g5.at})`);
  // click opens the photograph on show
  await card.locator(".cnext").click(); await p.waitForTimeout(800);
  await p.mouse.click(box.x + box.width / 2, box.y + box.height / 3); await p.waitForTimeout(1200);
  const mo = await p.evaluate(() => ({ open: !!document.querySelector("#pmodal.open"), src: (document.querySelector("#pmodal .gmain img, #pmodal img") || {}).currentSrc || "" }));
  ok(mo.open && /worn/.test(mo.src), `click opens the photograph on show (${mo.src.split("/").pop()})`);
  ok(!errs.length, "no page errors " + errs.join("|"));
}
{ const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const p = await c.newPage();
  await p.goto(U, { waitUntil: "load" }); await p.waitForTimeout(800); await p.tap("#enterBtn", { timeout: 1500 }).catch(() => {});
  const card = p.locator(".pgrid .piece:not(.soon)").first(); await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
  const f = await card.locator(".fig").boundingBox(); const cdp = await c.newCDPSession(p);
  const swipe = async (x0, x1, y0, y1) => { await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y: y0 }] });
    for (let i = 1; i <= 8; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 + (x1 - x0) * i / 8, y: y0 + (y1 - y0) * i / 8 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); };
  await swipe(f.x + f.width * .8, f.x + f.width * .2, f.y + f.height / 2, f.y + f.height / 2 + 4); await p.waitForTimeout(900);
  const s1 = await p.evaluate(() => ({ at: document.querySelector(".pgrid .piece:not(.soon)").__at, open: !!document.querySelector("#pmodal.open") }));
  ok(s1.at === 1 && !s1.open, `phone: swipe changes the photograph (${s1.at}) and opens nothing`);
  const y0 = await p.evaluate(() => scrollY);
  await swipe(f.x + f.width / 2, f.x + f.width / 2 + 6, f.y + f.height * .8, f.y + f.height * .2); await p.waitForTimeout(700);
  const s2 = await p.evaluate(() => ({ y: scrollY, at: document.querySelector(".pgrid .piece:not(.soon)").__at }));
  ok(s2.y > y0 + 40 && s2.at === 1, `phone: an upright drag scrolls the page (${Math.round(s2.y - y0)}px), photograph kept`);
  await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
  await card.locator(".fig").tap(); await p.waitForTimeout(1200);
  const s3 = await p.evaluate(() => ({ open: !!document.querySelector("#pmodal.open"), src: (document.querySelector("#pmodal .gmain img, #pmodal img") || {}).currentSrc || "" }));
  ok(s3.open && /worn/.test(s3.src), `phone: tap opens the photograph on show (${s3.src.split("/").pop()})`);
}
{ const c = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await c.newPage();
  await p.route(/worn-\d+\.jpg/, async r => { await new Promise(z => setTimeout(z, 1500)); await r.continue(); });
  await p.goto(U, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(1500); await p.click("#enterBtn", { timeout: 1500 }).catch(() => {});
  const cards = p.locator(".pgrid .piece:not(.soon)"); const card = cards.nth(1); await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(600);
  const bx = await card.locator(".fig").boundingBox();
  const st = () => p.evaluate(() => [...document.querySelectorAll(".pgrid .piece:not(.soon)")[1].querySelectorAll(".im.hx")].map(l => +getComputedStyle(l).opacity * (getComputedStyle(l).visibility === "visible" ? 1 : 0)));
  await p.mouse.move(bx.x + 50, bx.y + 50); await p.waitForTimeout(400); await p.mouse.move(3, 3); await p.waitForTimeout(2600);
  const a = await st(); ok(a.every(v => v === 0), `slow photograph: a pass that left before it arrived shows nothing later (${a.join(",")})`);
  const card3 = cards.nth(2); await card3.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); const b3 = await card3.locator(".fig").boundingBox();
  const st3 = () => p.evaluate(() => [...document.querySelectorAll(".pgrid .piece:not(.soon)")[2].querySelectorAll(".im.hx")].map(l => +getComputedStyle(l).opacity * (getComputedStyle(l).visibility === "visible" ? 1 : 0)));
  await p.mouse.move(b3.x + 60, b3.y + 60); await p.waitForTimeout(500); const m = await st3(); await p.waitForTimeout(2600); const e = await st3();
  ok(m.every(v => v === 0) && e.filter(v => v > 0.95).length === 1, `slow photograph: staying on the card turns once it has arrived (${m.join(",")} then ${e.join(",")})`);
}
console.log(`${pass} pass, ${fail} fail`); await b.close();
