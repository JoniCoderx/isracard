// Functional test of every interactive control on the SILAVU page (engine off for speed).
import { chromium } from "playwright-core";
const dir = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const results = [];
const ok = (name, cond, extra) => results.push((cond ? "PASS " : "FAIL ") + name + (extra ? " · " + extra : ""));
async function suite(tag, vp) {
  const p = await b.newPage({ viewport: vp });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + dir + "/silavu.html?nogl=1", { waitUntil: "load" }); await p.waitForTimeout(800);
  await p.click("#enterBtn"); await p.waitForTimeout(600); await p.mouse.move(2, 2);
  const y = async () => p.evaluate(() => scrollY);
  const secTop = async id => p.evaluate(id => { const r = document.getElementById(id).getBoundingClientRect(); return scrollY + r.top; }, id);
  const visible = async s => p.evaluate(s => { const el = document.querySelector(s); return !!el && getComputedStyle(el).display !== "none" && el.getClientRects().length > 0; }, s);
  for (const [sel, id] of [['nav a[href="#loupe"]', "loupe"], ['nav a[href="#build"]', "build"], ['nav a[href="#collection"]', "collection"], ['nav a[href="#concierge"]', "concierge"], ['.hconc', "concierge"], ['.beat[data-i="3"] a[href="#build"]', "build"], ['.beat[data-i="3"] a[href="#concierge"]', "concierge"]]) {
    if (!(await visible(sel))) { ok(`${tag} ${sel} hidden at this width`, true, "skipped"); continue; }
    await p.evaluate(s => document.querySelector(s).click(), sel); await p.waitForTimeout(1500);
    const top = await secTop(id), sy = await y();
    ok(`${tag} link ${sel} → #${id}`, Math.abs(sy - top) < 4, `scrollY ${Math.round(sy)} target ${Math.round(top)}`);
  }
  // builder
  await p.evaluate(() => window.scrollTo({ top: scrollY + document.getElementById("build").getBoundingClientRect().top, behavior: "instant" })); await p.waitForTimeout(300);
  const est0 = await p.textContent("#est");
  await p.click('.chip[data-k="metal"][data-v="yellow"]'); await p.click('.chip[data-k="ct"][data-v="10"]'); await p.click('.chip[data-k="origin"][data-v="natural"]');
  const est1 = await p.textContent("#est"), sumMetal = await p.textContent("#sumMetal"), sumStones = await p.textContent("#sumStones"), sumOrigin = await p.textContent("#sumOrigin");
  ok(`${tag} builder updates price`, est0 !== est1, `${est0} → ${est1}`);
  ok(`${tag} builder summary`, sumMetal === "18K yellow gold" && sumStones === "36 × 0.28 ct" && sumOrigin === "Natural", `${sumStones} · ${sumMetal} · ${sumOrigin}`);
  ok(`${tag} one chip per group`, await p.evaluate(() => ["origin", "ct", "metal"].every(k => document.querySelectorAll(`.chip[data-k="${k}"].on`).length === 1)));
  await p.evaluate(() => document.getElementById("reserve").click()); await p.waitForTimeout(1500);
  const msg = await p.inputValue("#fMsg");
  ok(`${tag} reserve prefills concierge`, /10 ct/.test(msg) && /Natural/.test(msg) && /yellow/.test(msg) && /AED/.test(msg), msg);
  ok(`${tag} reserve lands on concierge`, Math.abs((await y()) - (await secTop("concierge"))) < 4);
  // collection piece → concierge prefilled
  await p.evaluate(() => document.querySelector('.piece[data-piece="Rivière Lumière"]').click()); await p.waitForTimeout(1500);
  ok(`${tag} collection piece prefills viewing request`, /Rivière Lumière/.test(await p.inputValue("#fMsg")) && Math.abs((await y()) - (await secTop("concierge"))) < 4);
  // form
  await p.fill("#fName", ""); await p.fill("#fContact", "");
  await p.evaluate(() => document.querySelector("#cform .btn").click()); await p.waitForTimeout(200);
  ok(`${tag} empty form flags name + contact`, await p.evaluate(() => document.querySelector("#fName").parentElement.classList.contains("err") && document.querySelector("#fContact").parentElement.classList.contains("err") && !document.getElementById("cform").classList.contains("sent")));
  await p.fill("#fName", "Test Client"); await p.fill("#fContact", "+971 50 000 0000"); await p.click('.chip[data-ch="Email"]');
  ok(`${tag} typing clears error + floats label`, await p.evaluate(() => !document.querySelector("#fName").parentElement.classList.contains("err") && document.querySelector("#fName").parentElement.classList.contains("filled")));
  await p.evaluate(() => document.querySelector("#cform .btn").click()); await p.waitForTimeout(300);
  ok(`${tag} form submits → confirmation`, await p.evaluate(() => document.getElementById("cform").classList.contains("sent") && getComputedStyle(document.querySelector("#cform .done")).display !== "none"));
  ok(`${tag} clocks live`, /^\d\d:\d\d$/.test(await p.textContent("#clkDXB")) && /^\d\d:\d\d$/.test(await p.textContent("#clkTLV")));
  // language
  await p.click("#langBtn"); await p.waitForTimeout(300);
  ok(`${tag} hebrew: rtl + translated summary`, await p.evaluate(() => document.documentElement.dir === "rtl" && document.getElementById("sumMetal").textContent === "זהב צהוב 18K" && document.getElementById("sumOrigin").textContent === "טבעי" && document.getElementById("langBtn").textContent === "English"));
  await p.click("#langBtn"); await p.waitForTimeout(300);
  ok(`${tag} back to english`, await p.evaluate(() => document.documentElement.dir === "ltr" && document.getElementById("sumMetal").textContent === "18K yellow gold"));
  // back to top + film
  await p.evaluate(() => document.querySelector('#end a[href="#film"]').click()); await p.waitForTimeout(2000);
  ok(`${tag} back to top`, (await y()) < 5, `scrollY ${await y()}`);
  for (const [fr, i] of [[0.05, 0], [0.38, 1], [0.66, 2], [0.95, 3]]) {
    await p.evaluate(fr => { const r = document.getElementById("film").getBoundingClientRect(); window.scrollTo({ top: (r.height - innerHeight) * fr, behavior: "instant" }); }, fr); await p.waitForTimeout(500);
    ok(`${tag} film beat ${i} at ${fr}`, await p.evaluate(i => document.querySelectorAll(".beat.on").length === 1 && document.querySelector(".beat.on").getAttribute("data-i") === String(i), i));
  }
  ok(`${tag} film progress ~95%`, await p.evaluate(() => Math.abs(parseFloat(document.getElementById("prog").style.width) - 95) < 3));
  ok(`${tag} no page errors`, errs.length === 0, errs.join(" | "));
  await p.close();
}
await suite("desk", { width: 1440, height: 900 });
await suite("mob", { width: 390, height: 844 });
await b.close();
console.log(results.join("\n"));
process.exit(results.some(r => r.startsWith("FAIL")) ? 1 : 0);
