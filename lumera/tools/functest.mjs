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
  await p.click("#enterBtn"); await p.waitForTimeout(600);
  const y = async () => p.evaluate(() => scrollY);
  const secTop = async id => p.evaluate(id => { const r = document.getElementById(id).getBoundingClientRect(); return scrollY + r.top; }, id);
  // nav + rail + film links
  for (const [sel, id] of [['nav a[href="#ch-ring"]', "ch-ring"], ['nav a[href="#bespoke"]', "bespoke"], ['nav a[href="#concierge"]', "concierge"], ['#rail a[href="#ch-star"]', "ch-star"], ['.fc[data-i="2"] a[href="#ch-line"]', "ch-line"], ['.hconc', "concierge"]]) {
    const vis = await p.evaluate(s => { const el = document.querySelector(s); return el && getComputedStyle(el).display !== "none" && el.getClientRects().length > 0; }, sel);
    if (!vis) { ok(`${tag} link ${sel} (hidden at this width)`, true, "skipped"); continue; }
    await p.evaluate(s => document.querySelector(s).click(), sel); await p.waitForTimeout(1400);
    const top = await secTop(id), sy = await y();
    ok(`${tag} link ${sel} → #${id}`, Math.abs(sy - top) < innerHeightGuess(vp) * 1.2, `scrollY ${Math.round(sy)} target ${Math.round(top)}`);
  }
  // rail lights the chamber on stage
  await p.evaluate(() => { const el = document.getElementById("ch-riv"); const r = el.getBoundingClientRect(); window.scrollTo({ top: scrollY + r.top + r.height * 0.55 - innerHeight * 0.5, behavior: "instant" }); }); await p.waitForTimeout(500);
  ok(`${tag} rail marks III on stage`, await p.evaluate(() => document.querySelector('#rail a[href="#ch-riv"]').classList.contains("on")));
  // builder
  await p.evaluate(() => document.getElementById("ch-line").scrollIntoView()); await p.waitForTimeout(400);
  const est0 = await p.textContent("#est");
  await p.click('.chip[data-k="metal"][data-v="yellow"]'); await p.click('.chip[data-k="ct"][data-v="10"]'); await p.click('.chip[data-k="origin"][data-v="natural"]');
  const est1 = await p.textContent("#est"), sumCt = await p.textContent("#sumCt"), sumMetal = await p.textContent("#sumMetal"), sumStones = await p.textContent("#sumStones");
  ok(`${tag} builder updates price`, est0 !== est1, `${est0} → ${est1}`);
  ok(`${tag} builder summary`, sumCt === "10.00 CT" && sumMetal === "18K yellow gold" && sumStones === "36 × 0.28 CT", `${sumCt} · ${sumStones} · ${sumMetal}`);
  ok(`${tag} chip states`, await p.evaluate(() => document.querySelectorAll('.chip[data-k="metal"].on').length === 1 && document.querySelector('.chip[data-k="metal"].on').getAttribute("data-v") === "yellow"));
  // reserve → concierge prefilled
  await p.evaluate(() => document.getElementById("reserve").click()); await p.waitForTimeout(1400);
  const msg = await p.inputValue("#fMsg");
  ok(`${tag} reserve prefills concierge`, /10 ct/.test(msg) && /natural/.test(msg) && /yellow/.test(msg) && /AED/.test(msg), msg);
  ok(`${tag} reserve scrolls to concierge`, Math.abs((await y()) - (await secTop("concierge"))) < innerHeightGuess(vp) * 1.2);
  // form validation
  await p.evaluate(() => document.querySelector("#cform .send").click()); await p.waitForTimeout(200);
  ok(`${tag} empty form flags name + contact`, await p.evaluate(() => document.querySelector("#fName").parentElement.classList.contains("err") && document.querySelector("#fContact").parentElement.classList.contains("err") && !document.getElementById("cform").classList.contains("sent")));
  await p.fill("#fName", "Test Client"); await p.fill("#fContact", "+971 50 000 0000"); await p.click('.chip[data-ch="Email"]');
  ok(`${tag} typing clears error + floats label`, await p.evaluate(() => !document.querySelector("#fName").parentElement.classList.contains("err") && document.querySelector("#fName").parentElement.classList.contains("filled")));
  await p.evaluate(() => { window.__href = null; });
  await p.evaluate(() => document.querySelector("#cform .send").click()); await p.waitForTimeout(300);
  ok(`${tag} form submits → confirmation`, await p.evaluate(() => document.getElementById("cform").classList.contains("sent") && getComputedStyle(document.querySelector("#cform .done")).display !== "none"));
  // clocks
  ok(`${tag} clocks live`, /^\d\d:\d\d$/.test(await p.textContent("#clkDXB")) && /^\d\d:\d\d$/.test(await p.textContent("#clkTLV")));
  // language
  await p.click("#langBtn"); await p.waitForTimeout(300);
  ok(`${tag} hebrew toggles rtl + summary translates`, await p.evaluate(() => document.documentElement.dir === "rtl" && document.getElementById("sumMetal").textContent === "זהב צהוב 18K" && document.getElementById("langBtn").textContent === "English"));
  await p.click("#langBtn"); await p.waitForTimeout(300);
  ok(`${tag} back to english`, await p.evaluate(() => document.documentElement.dir === "ltr" && document.getElementById("sumMetal").textContent === "18K yellow gold"));
  // back to top
  await p.evaluate(() => document.querySelector('#end a[href="#film-sec"]').click()); await p.waitForTimeout(1800);
  ok(`${tag} back to top`, (await y()) < 5, `scrollY ${await y()}`);
  // film captions + progress
  await p.evaluate(() => { const r = document.getElementById("film-sec").getBoundingClientRect(); window.scrollTo(0, (r.height - innerHeight) * 0.5); }); await p.waitForTimeout(700);
  ok(`${tag} film caption 2 active mid-scroll`, await p.evaluate(() => document.querySelector('.fc[data-i="1"]').classList.contains("on") && !document.querySelector('.fc[data-i="0"]').classList.contains("on")));
  ok(`${tag} film progress ~50%`, await p.evaluate(() => Math.abs(parseFloat(document.getElementById("filmprog").style.width) - 50) < 3));
  // macro specs + loupe
  await p.evaluate(() => { const r = document.getElementById("macro").getBoundingClientRect(); window.scrollTo(0, scrollY + r.top + (r.height - innerHeight) * 0.9); }); await p.waitForTimeout(700);
  ok(`${tag} macro specs all on at 90%`, await p.evaluate(() => document.querySelectorAll(".spec.on").length === 4 && document.getElementById("loupe").textContent === "10×"));
  ok(`${tag} no page errors`, errs.length === 0, errs.join(" | "));
  await p.close();
}
function innerHeightGuess(vp) { return vp.height; }
await suite("desk", { width: 1440, height: 900 });
await suite("mob", { width: 390, height: 844 });
await b.close();
console.log(results.join("\n"));
process.exit(results.some(r => r.startsWith("FAIL")) ? 1 : 0);
