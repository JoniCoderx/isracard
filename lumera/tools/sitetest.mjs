import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const out = [];
for (const [tag, vp] of [["desk",{width:1440,height:900}],["mob",{width:390,height:844}]]) {
  const p = await b.newPage({ viewport: vp }); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" }); await p.waitForTimeout(1200);
  await p.click("#enterBtn"); await p.waitForTimeout(800); await p.mouse.move(2,2);
  const y = () => p.evaluate(() => scrollY), top = id => p.evaluate(id => scrollY + document.getElementById(id).getBoundingClientRect().top, id);
  for (const [sel,id] of [['nav a[href="#collection"]',"collection"],['nav a[href="#concierge"]',"concierge"],['.hconc',"concierge"],['.beat[data-i="2"] a[href="#build"]',"build"]]) {
    const vis = await p.evaluate(s => { const el=document.querySelector(s); return !!el && getComputedStyle(el).display!=="none" && el.getClientRects().length>0; }, sel);
    if (!vis) { out.push(`skip ${tag} ${sel}`); continue; }
    await p.evaluate(s => document.querySelector(s).click(), sel); await p.waitForTimeout(1500);
    out.push((Math.abs(await y() - await top(id)) < 4 ? "PASS" : "FAIL") + ` ${tag} link ${sel}`);
  }
  await p.evaluate(() => window.scrollTo({top:0, behavior:"instant"})); await p.waitForTimeout(300);
  for (const [fr,i] of [[0.05,0],[0.5,1],[0.95,2]]) { await p.evaluate(fr => { const r=document.getElementById("hero").getBoundingClientRect(); window.scrollTo({top:(r.height-innerHeight)*fr, behavior:"instant"}); }, fr); await p.waitForTimeout(500);
    out.push((await p.evaluate(i => document.querySelectorAll(".beat.on").length===1 && document.querySelector(".beat.on").getAttribute("data-i")===String(i), i) ? "PASS" : "FAIL") + ` ${tag} beat ${i}`); }
  await p.evaluate(() => document.querySelector('.ch[data-piece], a[data-piece="Rivière Lumière"]').click()); await p.waitForTimeout(1500);
  out.push((/Rivière/.test(await p.inputValue("#fMsg")) ? "PASS":"FAIL") + ` ${tag} piece prefills`);
  await p.click('.chip[data-k="metal"][data-v="yellow"]'); await p.click('.chip[data-k="ct"][data-v="10"]');
  out.push(((await p.textContent("#sumMetal"))==="18K yellow gold" && (await p.textContent("#sumStones"))==="36 × 0.28 ct" ? "PASS":"FAIL") + ` ${tag} builder`);
  await p.evaluate(() => document.getElementById("reserve").click()); await p.waitForTimeout(1200);
  out.push((/10 ct/.test(await p.inputValue("#fMsg")) ? "PASS":"FAIL") + ` ${tag} reserve prefills`);
  await p.fill("#fName",""); await p.fill("#fContact",""); await p.evaluate(() => document.querySelector("#cform .btn").click()); await p.waitForTimeout(200);
  out.push((await p.evaluate(() => document.querySelector("#fName").parentElement.classList.contains("err")) ? "PASS":"FAIL") + ` ${tag} validation`);
  await p.fill("#fName","T"); await p.fill("#fContact","x@y.z"); await p.click('.chip[data-ch="Email"]'); await p.evaluate(() => document.querySelector("#cform .btn").click()); await p.waitForTimeout(300);
  out.push((await p.evaluate(() => document.getElementById("cform").classList.contains("sent")) ? "PASS":"FAIL") + ` ${tag} submit`);
  out.push((await p.evaluate(() => document.querySelectorAll("[data-socials] a").length === 15) ? "PASS":"FAIL") + ` ${tag} socials rendered`);
  await p.click("#langBtn"); await p.waitForTimeout(300);
  out.push((await p.evaluate(() => document.documentElement.dir==="rtl" && document.getElementById("sumMetal").textContent==="זהב צהוב 18K") ? "PASS":"FAIL") + ` ${tag} hebrew`);
  out.push((await p.evaluate(() => /^\d\d:\d\d$/.test(document.getElementById("clkDXB").textContent)) ? "PASS":"FAIL") + ` ${tag} clocks`);
  out.push((errs.length===0 ? "PASS":"FAIL") + ` ${tag} no errors ${errs.join(" | ")}`);
  await p.close();
}
await b.close(); console.log(out.join("\n")); process.exit(out.some(l => l.startsWith("FAIL")) ? 1 : 0);
