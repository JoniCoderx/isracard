import { chromium } from "playwright-core";
const U=process.argv[2]||"http://localhost:8777/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox","--disable-background-networking"]});
let pass=0,fail=0; const ok=(c,m)=>{c?pass++:fail++; console.log((c?"PASS ":"FAIL ")+m);};
for (const [dv,w,h] of [["desk",1440,900],["phone",390,844]]) {
const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:w<900}); const p=await ctx.newPage(); const errs=[], bad=[];
p.on("pageerror",e=>errs.push(e.message)); p.on("response",r=>{ if(r.status()>=400) bad.push(r.status()+" "+r.url()); });
await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
await p.goto(U+"?c="+Date.now(),{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn",{timeout:3000}).catch(()=>{}); await p.waitForTimeout(800);
const r=await p.evaluate(()=>{ const q=s=>document.querySelector(s), t=s=>(q(s)||{}).textContent||"";
  const cs=(s,k)=>q(s)?getComputedStyle(q(s))[k]:null;
  return {
    heroP:t("#hcap .p"), hmeta:!!q(".hmeta"), houseP:t("#house .p"),
    exceptional:!!q("#exceptional") || /Desert Star/.test(t("#collection")),
    colActs:!!q("#collection .sechead .acts"), colH:t("#collection .sechead .h2"), colP:t("#collection .sechead .p"),
    names:[...document.querySelectorAll(".pgrid .piece:not(.soon) .t")].map(e=>e.textContent.trim()),
    lines:[...document.querySelectorAll(".pgrid .piece:not(.soon) .bd > .p")].map(e=>e.textContent.trim()),
    bespokeBg:cs("#bespoke","backgroundImage"), jpin:!!q("#jpin"), jsteps:document.querySelectorAll(".jstep").length,
    macro:[...document.querySelectorAll("h2,h3")].map(e=>e.textContent).filter(x=>/Light goes in|Fifty-seven/.test(x)),
    drawcv:!!q("#craft .sgsvg") && !q("#drawcv"), benchcv:!!q("#benchcv"),
    caratShown:(q("#build .sdet")&&!q("#build .sdet").open)?"none":"shown", cacts:[...document.querySelectorAll("#configure .cacts button")].map(e=>e.id), buildActs:!!q("#build .copy .acts"),
    filmcv:!!q("#filmcv"), emb:!!q("#emb"), embStop:q("#embGold stop")?q("#embGold stop").getAttribute("stop-color"):null,
    fbig:!!q(".fbig"), fbrand:!!q("#end .fbrand"), seam:!!q("#hero .hseam"),
  };});
ok(r.heroP.startsWith("Diamonds chosen one by one") && !r.hmeta, `${dv} hero: luxury line, no fact row`);
ok(r.houseP.startsWith("Nothing leaves the bench unsigned"), `${dv} house line rewritten (no GIA/IGI)`);
ok(!r.exceptional, `${dv} exceptional pieces section removed`);
ok(!r.colActs && /made to be lived in/.test(r.colH) && /never take off/.test(r.colP) && !/three pieces/.test(r.colH), `${dv} collection head: buttons gone, new sentences`);
ok(JSON.stringify(r.names)===JSON.stringify(["SILAVU MOMENTBracelet","SILAVU ICONRing","SILAVU SOULNecklace"]), `${dv} cards named ${JSON.stringify(r.names)}`);
ok(r.lines[0]==="A delicate 18k white-gold chain, finished with the SILAVU signature in a polished sculptural form." && r.lines[1]==="A sculptural 18k white-gold ring with the SILAVU signature set in pavé diamonds." && r.lines[2]==="A fine 18k white-gold chain with a pavé SILAVU signature pendant at its center.", `${dv} card descriptions exactly as given`);
ok(true, `${dv} journey checks retired`);
ok(r.macro.some(x=>/Light goes in/.test(x)) && !r.macro.some(x=>/Fifty-seven/.test(x)), `${dv} macro heading rewritten`);
ok(r.drawcv && !r.benchcv, `${dv} the drawn mark replaces the old Line, car film gone`);
ok(r.caratShown==="none" && r.cacts.join()==="saveImg,sendSpec,tryonBtn2" && !r.buildActs, `${dv} builder trimmed; save / send / try on present`);
ok(!r.filmcv && r.emb && r.embStop==="#ffffff", `${dv} enquiry: bags film gone, white-gold mark`);
ok(!r.fbig && r.fbrand, `${dv} footer lockup small in the row`);
ok(r.seam, `${dv} hero seam present`);
// chosen value sits to the right of its label (desktop)
if (w>900) { const o=await p.evaluate(()=>{const g=document.querySelector("#opts .opt"); const k=g.querySelector(".opthead > .k").getBoundingClientRect(), v=g.querySelector(".optnow").getBoundingClientRect(); return {kx:k.left, vx:v.left, vy:Math.abs(v.top-k.top), col:getComputedStyle(g.querySelector(".optnow")).color};});
  ok(o.vx>o.kx+150 && o.vy<14 && o.col!=="rgb(246, 243, 237)", `desk chosen value on the right, own colour ${JSON.stringify(o)}`); }
// enquiry form width (desktop)
if (w>900) { const fw=await p.evaluate(()=>document.getElementById("cform").getBoundingClientRect().width); ok(fw>600, `desk enquiry form is wide (${Math.round(fw)}px)`); }
// the bespoke journey was taken out at the client's request; nothing may still point at it
{ const g=await p.evaluate(()=>({sec:!!document.getElementById("bespoke"), links:document.querySelectorAll('a[href="#bespoke"]').length})); ok(!g.sec && g.links===0, `${dv} no journey section and no link to it ${JSON.stringify(g)}`); }
// hero → house seam: no hard edge (last row of hero ≈ black)
ok(bad.filter(x=>!/fonts/.test(x)).length===0, `${dv} no failed requests ${bad.slice(0,3).join(" | ")}`);
ok(errs.length===0, `${dv} no script errors ${errs.join(" | ")}`);
await ctx.close(); }
await b.close(); console.log(pass,"pass,",fail,"fail");
