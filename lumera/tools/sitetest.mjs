import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const out = [];
for (const [tag, vp] of [["desk",{width:1440,height:900}],["mob",{width:390,height:844}]]) {
  const p = await b.newPage({ viewport: vp }); await p.emulateMedia({ reducedMotion: "reduce" }); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" }); await p.waitForTimeout(1200);
  await p.waitForTimeout(2600); await p.click("#enterBtn", { timeout: 4000 }).catch(() => {}); await p.waitForTimeout(800); await p.mouse.move(2,2);
  const y = () => p.evaluate(() => scrollY), top = id => p.evaluate(id => scrollY + document.getElementById(id).getBoundingClientRect().top, id);
  const go = async (sel) => { await p.evaluate(s => document.querySelector(s).click(), sel); await p.waitForTimeout(1400); await p.evaluate(() => window.scrollTo({top: scrollY, behavior:"instant"})); };
  for (const [sel,id] of [['#topnav a[href="#collection"]',"collection"],['#topnav a[href="#partners"]',"partners"],['.hbook',"concierge"],['.hacts a[href="#build"]',"build"],['#end a[href="#clients"]',"clients"]]) {
    const vis = await p.evaluate(s => { const el=document.querySelector(s); return !!el && getComputedStyle(el).display!=="none" && el.getClientRects().length>0; }, sel);
    if (!vis) { out.push(`skip ${tag} ${sel}`); continue; }
    await go(sel); const d = Math.abs(await y() - await top(id));
    out.push((d < 4 ? "PASS" : "FAIL") + ` ${tag} link ${sel} (off ${Math.round(d)})`);
  }
  // menu (mobile)
  const menuVis = await p.evaluate(() => getComputedStyle(document.getElementById("menuBtn")).display !== "none");
  if (menuVis) { await p.click("#menuBtn"); await p.waitForTimeout(600);
    out.push((await p.evaluate(() => document.getElementById("menu").classList.contains("open")) ? "PASS":"FAIL") + ` ${tag} menu opens`);
    await p.evaluate(() => document.querySelector('#mlist a[href="#partners"]').click()); await p.waitForTimeout(1500);
    out.push((await p.evaluate(() => !document.getElementById("menu").classList.contains("open")) && Math.abs(await y() - await top("partners")) < 4 ? "PASS":"FAIL") + ` ${tag} menu link closes + lands`);
    out.push((await p.evaluate(() => document.getElementById("fab").classList.contains("show")) ? "PASS":"FAIL") + ` ${tag} floating book button shown`);
  } else out.push(`skip ${tag} menu`);
  // compass
  await p.evaluate(() => window.scrollTo({top: scrollY + document.getElementById("partners").getBoundingClientRect().top, behavior:"instant"})); for (let i = 0; i < 30 && (await p.evaluate(() => document.getElementById("whereN").textContent)) !== "06"; i++) await p.waitForTimeout(250);
  out.push((await p.evaluate(() => document.getElementById("whereT").textContent === "For partners" && document.getElementById("whereN").textContent === "06") ? "PASS":"FAIL") + ` ${tag} compass says where you are (${await p.evaluate(() => document.getElementById("whereN").textContent + " " + document.getElementById("whereT").textContent)})`);
  // film
  await p.evaluate(() => window.scrollTo({top: scrollY + document.getElementById("inside").getBoundingClientRect().top + innerHeight*1.0, behavior:"instant"})); for (let i = 0; i < 30 && (await p.evaluate(() => window.__film.target)) < 30; i++) await p.waitForTimeout(250);
  const f = await p.evaluate(() => ({ t: window.__film.target, beats: document.querySelectorAll(".fbeat.on").length, on: [...document.querySelectorAll(".fbeat.on")].map(e=>e.dataset.j).join("") }));
  out.push((f.t > 45 && f.t < 60 && f.beats === 1 && f.on === "1" ? "PASS":"FAIL") + ` ${tag} film scrubs (frame ${f.t}, beat ${f.on})`);
  // stone picker
  await p.evaluate(() => window.scrollTo({top: scrollY + document.getElementById("standard").getBoundingClientRect().top, behavior:"instant"})); await p.waitForTimeout(500);
  await p.click("#dNext"); await p.click("#dNext"); out.push((await p.textContent("#dcur")) === "03" ? "PASS":"FAIL"); out[out.length-1] += ` ${tag} stone next`;
  await p.evaluate(() => document.querySelector('#dline b[data-j="20"]').click()); out.push(((await p.textContent("#dcur")) === "21" && /ct$/.test(await p.textContent("#dv0")) ? "PASS":"FAIL") + ` ${tag} stone tap`);
  // piece → concierge prefilled
  await p.evaluate(() => document.querySelector('a[data-piece="Rivière Lumière"]').click()); await p.waitForTimeout(1500);
  out.push((/Rivière/.test(await p.inputValue("#fMsg")) ? "PASS":"FAIL") + ` ${tag} piece prefills`);
  await p.evaluate(() => document.querySelector('a[data-partner]').click()); await p.waitForTimeout(1500);
  out.push((/Partnership/.test(await p.inputValue("#fMsg")) && await p.evaluate(() => document.querySelector('.chip[data-who="partner"]').classList.contains("on")) ? "PASS":"FAIL") + ` ${tag} partner prefills`);
  await p.click('.chip[data-k="metal"][data-v="yellow"]'); await p.click('.chip[data-k="ct"][data-v="10"]');
  out.push(((await p.textContent("#sumMetal"))==="18K yellow gold" && (await p.textContent("#sumStones"))==="36 × 0.28 ct" ? "PASS":"FAIL") + ` ${tag} builder`);
  await p.evaluate(() => document.getElementById("reserve").click()); await p.waitForTimeout(1200);
  out.push((/10 ct/.test(await p.inputValue("#fMsg")) && await p.evaluate(() => document.querySelector('.chip[data-who="client"]').classList.contains("on")) ? "PASS":"FAIL") + ` ${tag} reserve prefills`);
  await p.fill("#fName",""); await p.fill("#fContact",""); await p.evaluate(() => document.querySelector("#cform .btn").click()); await p.waitForTimeout(200);
  out.push((await p.evaluate(() => document.querySelector("#fName").parentElement.classList.contains("err")) ? "PASS":"FAIL") + ` ${tag} validation`);
  await p.fill("#fName","T"); await p.fill("#fContact","x@y.z"); await p.click('.chip[data-ch="Email"]'); await p.evaluate(() => document.querySelector("#cform .btn").click()); await p.waitForTimeout(300);
  out.push((await p.evaluate(() => document.getElementById("cform").classList.contains("sent")) ? "PASS":"FAIL") + ` ${tag} submit`);
  out.push((await p.evaluate(() => document.querySelectorAll("[data-socials] a").length === 15) ? "PASS":"FAIL") + ` ${tag} socials rendered`);
  await p.click("#langBtn"); await p.waitForTimeout(300);
  out.push((await p.evaluate(() => document.documentElement.dir==="rtl" && document.getElementById("sumMetal").textContent==="זהב צהוב 18K" && document.getElementById("whereT").textContent.length > 0 && !/[A-Za-z]/.test(document.getElementById("whereT").textContent)) ? "PASS":"FAIL") + ` ${tag} hebrew`);
  out.push((await p.evaluate(() => /^\d\d:\d\d$/.test(document.getElementById("clkDXB").textContent)) ? "PASS":"FAIL") + ` ${tag} clocks`);
  out.push((await p.evaluate(() => document.body.scrollHeight / innerHeight < 22) ? "PASS":"FAIL") + ` ${tag} page length ${await p.evaluate(() => (document.body.scrollHeight / innerHeight).toFixed(1))} screens`);
  out.push((await p.evaluate(() => document.getElementById("dust").width > 0 && document.getElementById("pbar").style.width !== "") ? "PASS":"FAIL") + ` ${tag} dust + progress alive`);
  out.push((errs.length===0 ? "PASS":"FAIL") + ` ${tag} no errors ${errs.join(" | ")}`);
  await p.close();
}
await b.close(); console.log(out.join("\n")); process.exit(out.some(l => l.startsWith("FAIL")) ? 1 : 0);
