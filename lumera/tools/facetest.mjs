/* The things a reader sees first, checked as facts rather than opinions:
   the selected filter is readable, the collection is five in one row with a
   hairline on every tile, the bracelet chapter opens on words, the house mark
   is behind the render, and the two headlines say what they were rewritten to
   say. Usage: node tools/facetest.mjs [base-url] */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: process.env.CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const out=[]; let bad=0;
const ok=(c,m,d="")=>{ if(c) out.push("PASS "+m); else { bad++; out.push("FAIL "+m+(d?" — "+d:"")); } };
for (const [tag,w,h,touch] of [["desk",1440,900,false],["mob",390,844,true]]) {
  const ctx = await b.newContext({ viewport:{width:w,height:h}, deviceScaleFactor:2, hasTouch:touch, isMobile:touch });
  const p = await ctx.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto(process.argv[2] || "http://127.0.0.1:8777/",{waitUntil:"domcontentloaded",timeout:45000});
  await p.waitForTimeout(2600); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(1200);
  await p.evaluate(async()=>{const s=Math.round(innerHeight*0.8);for(let y=0;y<document.body.scrollHeight;y+=s){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,120));}scrollTo({top:0,behavior:"instant"});});
  await p.waitForTimeout(1500);
  const r = await p.evaluate(()=>{
    const lum = c => { const m=c.match(/[\d.]+/g)||[0,0,0]; const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};
      return 0.2126*f(+m[0])+0.7152*f(+m[1])+0.0722*f(+m[2]); };
    const chip = document.querySelector(".cats .cat.on"), cs = getComputedStyle(chip);
    const L1 = lum(cs.color), L2 = lum(cs.backgroundColor);
    const ratio = (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
    return {
      chipContrast: +ratio.toFixed(2),
      gridCols: getComputedStyle(document.querySelector(".pgrid")).gridTemplateColumns.split(" ").length,
      cards: document.querySelectorAll(".pgrid .piece").length,
      wrapln: document.querySelectorAll(".pgrid .piece .wrapln").length,
      edSolo: !!document.querySelector(".ed.solo"),
      edHasFig: !!document.querySelector("#build .ed .fig"),
      bgmk: !!document.getElementById("stripwrap").querySelector(".bgmk"),
      house: (document.querySelector("#house .h2")||{}).textContent||"",
      collSub: (document.querySelector("#collection .p")||{}).textContent||"",
      screens: +(document.body.scrollHeight/innerHeight).toFixed(2),
      over: document.documentElement.scrollWidth-innerWidth,
      sections: document.querySelectorAll("main > section").length
    };
  });
  ok(r.chipContrast >= 4.5, `${tag} the selected filter is readable (contrast ${r.chipContrast}:1)`);
  ok(r.cards===5, `${tag} five pieces in the collection (${r.cards})`);
  if (tag==="desk") ok(r.gridCols===5, `${tag} five in one row (${r.gridCols})`);
  ok(r.wrapln===5, `${tag} every piece has the wrapping hairline (${r.wrapln})`);
  ok(r.edSolo && !r.edHasFig, `${tag} the bracelet chapter is words, not a stock photograph`);
  ok(r.bgmk, `${tag} the house mark is behind the bracelet`);
  ok(/SILAVU signs/.test(r.house), `${tag} the house headline is about the house`, r.house.slice(0,40));
  ok(/Five pieces/.test(r.collSub), `${tag} the collection line is rewritten`, r.collSub.slice(0,40));
  ok(r.over<=1, `${tag} no sideways scroll`);
  ok(errs.length===0, `${tag} no script errors`, errs.slice(0,2).join(" | "));
  out.push(`      ${tag} ${r.screens} screens, ${r.sections} chapters`);
  await ctx.close();
}
console.log(out.join("\n"));
console.log(`\n${out.filter(l=>l.startsWith("PASS")).length} pass, ${bad} fail`);
await b.close();

process.exit(bad ? 1 : 0);
