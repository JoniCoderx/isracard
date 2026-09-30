import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox"] });
let pass=0, fail=0; const ok=(c,m)=>{ c?pass++:fail++; console.log((c?"PASS ":"FAIL ")+m); };
for (const [w,h,lang,touch] of (process.argv[2]==="b" ? [[430,932,"he",true],[1280,760,"he",false]] : [[1440,900,"en",false],[390,844,"he",true],[360,740,"en",true]])) {
  for (const btn of ["pmRes","pmReq"]) {
    const ctx = await b.newContext({ viewport:{width:w,height:h}, hasTouch:touch, isMobile:touch });
    await ctx.addInitScript(l => { localStorage.setItem("silavu-lang", l); localStorage.setItem("silavu-seen","1"); }, lang);
    const p = await ctx.newPage(); await p.goto("http://127.0.0.1:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(500);
    const vw = (await p.$$(".pgrid .piece:not(.soon) .lnk.vw"))[1]; await vw.scrollIntoViewIfNeeded(); await vw.click(); await p.waitForTimeout(900);
    await p.click("#"+btn); await p.waitForTimeout(1200);
    const s = await p.evaluate(() => { const f=document.getElementById("cform").getBoundingClientRect(); const m=document.getElementById("fMsg"); const top=document.elementFromPoint(innerWidth/2, Math.min(innerHeight-2, Math.max(2, f.top+40))); return { open: document.getElementById("pmodal").classList.contains("open"), locked: document.documentElement.classList.contains("locked"), formTop: Math.round(f.top), formInView: f.top < innerHeight && f.bottom > 0, cover: top && top.closest(".modal") ? "modal" : (top && (top.id||top.className)), msg: m.value.slice(0,50), focus: document.activeElement.id || document.activeElement.tagName }; });
    ok(!s.open && !s.locked && s.formInView && s.cover!=="modal" && s.msg && /fName|cform|csend/.test(s.focus), `${w} ${lang} ${btn}: window closed, unlocked, form on screen (top ${s.formTop}), focus ${s.focus}, msg "${s.msg}"`);
    await ctx.close();
  }
}
console.log(`\n${pass} pass, ${fail} fail`); await b.close();
