import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
let pass=0, fail=0; const ok=(c,m)=>{ c?pass++:fail++; console.log((c?"PASS ":"FAIL ")+m); };
for (const [w,h,lang] of [[1440,900,"en"],[390,844,"he"]]) {
  const ctx = await b.newContext({ viewport:{width:w,height:h}, hasTouch:w<900 });
  await ctx.addInitScript(l => { localStorage.setItem("silavu-lang", l); localStorage.setItem("silavu-seen","1"); }, lang);
  const p = await ctx.newPage(); const errs=[]; p.on("pageerror", e=>errs.push(e.message));
  await p.goto("http://127.0.0.1:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(500);
  const T = `${w} ${lang}`;
  for (const idx of [0,1,2]) {
    const vw = (await p.$$(".pgrid .piece:not(.soon) .lnk.vw"))[idx];
    await vw.scrollIntoViewIfNeeded(); await vw.focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(700);
    const st = () => p.evaluate(() => ({ open: document.getElementById("pmodal").classList.contains("open"), inside: document.getElementById("pmodal").contains(document.activeElement), src: document.getElementById("pmImg").getAttribute("src"), nThumbs: document.querySelectorAll("#pmThumbs button").length, sel: [...document.querySelectorAll("#pmThumbs button")].findIndex(b=>b.getAttribute("aria-selected")==="true"), title: document.getElementById("pmT").textContent, nat: document.getElementById("pmImg").naturalWidth }));
    let s = await st(); ok(s.open && s.inside, `${T} piece ${idx} opens by keyboard, focus inside (${s.title})`);
    ok(s.nat > 0, `${T} piece ${idx} first photo loaded ${s.src}`);
    const src0 = s.src; await p.keyboard.press("ArrowRight"); await p.waitForTimeout(500); s = await st();
    ok(s.src !== src0 && s.sel === 1, `${T} piece ${idx} arrow key → next (${s.sel}/${s.nThumbs})`);
    await p.click("#pmNext"); await p.waitForTimeout(400); s = await st(); ok(s.sel === 2 % s.nThumbs, `${T} next button → ${s.sel}`);
    await p.click("#pmPrev"); await p.waitForTimeout(400); s = await st(); ok(s.sel === 1, `${T} prev button → ${s.sel}`);
    const last = s.nThumbs-1; await p.click(`#pmThumbs button[data-i="${last}"]`); await p.waitForTimeout(600); s = await st(); ok(s.sel === last && s.nat>0, `${T} thumbnail ${last} selects and loads`);
    await p.keyboard.press("Escape"); await p.waitForTimeout(600);
    const back = await p.evaluate((i) => ({ open: document.getElementById("pmodal").classList.contains("open"), foc: document.activeElement === document.querySelectorAll(".pgrid .piece:not(.soon) .lnk.vw")[i], locked: document.documentElement.classList.contains("locked") }), idx);
    ok(!back.open && back.foc && !back.locked, `${T} Escape closes, focus returns, scroll unlocked`);
  }
  // close button path
  const fg = (await p.$$(".pgrid .piece:not(.soon) .fig"))[0]; await fg.scrollIntoViewIfNeeded(); await fg.click(); await p.waitForTimeout(600);
  await p.click("#pmodal .mclose2"); await p.waitForTimeout(500);
  ok(!(await p.evaluate(() => document.getElementById("pmodal").classList.contains("open"))), `${T} Close button closes`);
  ok(errs.length===0, `${T} no page errors ${errs.join("|")}`);
  await ctx.close();
}
console.log(`\n${pass} pass, ${fail} fail`); await b.close();
