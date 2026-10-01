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
    drawcv:!!q("#drawcv"), benchcv:!!q("#benchcv"),
    caratShown:(q("#build .sdet")&&!q("#build .sdet").open)?"none":"shown", cacts:[...document.querySelectorAll("#configure .cacts button")].map(e=>e.id), buildActs:!!q("#build .copy .acts"),
    filmcv:!!q("#filmcv"), emb:!!q("#emb"), embStop:q("#embGold stop")?q("#embGold stop").getAttribute("stop-color"):null,
    fbig:!!q(".fbig"), fbrand:!!q("#end .fbrand"), seam:!!q("#hero .hseam"),
  };});
ok(r.heroP.startsWith("Diamonds chosen one by one") && !r.hmeta, `${dv} hero: luxury line, no fact row`);
ok(r.houseP.startsWith("Nothing leaves the bench unsigned"), `${dv} house line rewritten (no GIA/IGI)`);
ok(!r.exceptional, `${dv} exceptional pieces section removed`);
ok(!r.colActs && /in three pieces/.test(r.colH) && /A few pieces/.test(r.colP), `${dv} collection head: buttons gone, new sentences`);
ok(JSON.stringify(r.names)===JSON.stringify(["SILAVU MOMENTBracelet","SILAVU ICONRing","SILAVU SOULNecklace"]), `${dv} cards named ${JSON.stringify(r.names)}`);
ok(r.lines[0]==="A delicate 18k white-gold chain, finished with the SILAVU signature in a polished sculptural form." && r.lines[1]==="A sculptural 18k white-gold ring with the SILAVU signature set in pavé diamonds." && r.lines[2]==="A fine 18k white-gold chain with a pavé SILAVU signature pendant at its center.", `${dv} card descriptions exactly as given`);
ok(/255, 255, 255/.test(r.bespokeBg||"") && r.jpin && r.jsteps===6, `${dv} journey white, scroll-pinned, six steps`);
ok(r.macro.some(x=>/Light goes in/.test(x)) && !r.macro.some(x=>/Fifty-seven/.test(x)), `${dv} macro heading rewritten`);
ok(r.drawcv && !r.benchcv, `${dv} The Line is the drawing, car film gone`);
ok(r.caratShown==="none" && r.cacts.join()==="saveImg,sendSpec,tryonBtn2" && !r.buildActs, `${dv} builder trimmed; save / send / try on present`);
ok(!r.filmcv && r.emb && r.embStop==="#ffffff", `${dv} enquiry: bags film gone, white-gold mark`);
ok(!r.fbig && r.fbrand, `${dv} footer lockup small in the row`);
ok(r.seam, `${dv} hero seam present`);
// chosen value sits to the right of its label (desktop)
if (w>900) { const o=await p.evaluate(()=>{const g=document.querySelector("#opts .opt"); const k=g.querySelector(".opthead > .k").getBoundingClientRect(), v=g.querySelector(".optnow").getBoundingClientRect(); return {kx:k.left, vx:v.left, vy:Math.abs(v.top-k.top), col:getComputedStyle(g.querySelector(".optnow")).color};});
  ok(o.vx>o.kx+150 && o.vy<14 && o.col!=="rgb(246, 243, 237)", `desk chosen value on the right, own colour ${JSON.stringify(o)}`); }
// enquiry form width (desktop)
if (w>900) { const fw=await p.evaluate(()=>document.getElementById("cform").getBoundingClientRect().width); ok(fw>600, `desk enquiry form is wide (${Math.round(fw)}px)`); }
// journey: sticky holds and changes step with scroll
const j=await p.evaluate(async()=>{ const e=document.getElementById("jpin"), top=e.getBoundingClientRect().top+scrollY, span=e.offsetHeight-innerHeight; document.documentElement.style.scrollBehavior="auto";
  scrollTo(0,top+span*0.1); await new Promise(r=>setTimeout(r,300)); const a=document.getElementById("jnow").textContent, sa=document.querySelector(".jsticky").getBoundingClientRect().top;
  scrollTo(0,top+span*0.9); await new Promise(r=>setTimeout(r,300)); const b2=document.getElementById("jnow").textContent, sb=document.querySelector(".jsticky").getBoundingClientRect().top; return {a,b2,sa:Math.round(sa),sb:Math.round(sb)}; });
if (w>900) ok(j.a==="01" && j.b2==="06" && Math.abs(j.sa-j.sb)<3, `${dv} journey walks 01→06 by scroll and holds still ${JSON.stringify(j)}`);
else { const v=await p.evaluate(()=>{ const sh=[...document.querySelectorAll("#bespoke .jshot")], st=[...document.querySelectorAll("#bespoke .jstep")]; return { shots:sh.filter(e=>getComputedStyle(e).opacity==="1"&&e.getBoundingClientRect().height>100).length, steps:st.filter(e=>getComputedStyle(e).display!=="none").length, order: sh.every((e,i)=>e.getBoundingClientRect().top < st[i].getBoundingClientRect().top && (i===5 || st[i].getBoundingClientRect().top < sh[i+1].getBoundingClientRect().top)) }; });
  ok(v.shots===6 && v.steps===6 && v.order, `${dv} journey told in order: picture then step, six times ${JSON.stringify(v)}`); }
// hero → house seam: no hard edge (last row of hero ≈ black)
ok(bad.filter(x=>!/fonts/.test(x)).length===0, `${dv} no failed requests ${bad.slice(0,3).join(" | ")}`);
ok(errs.length===0, `${dv} no script errors ${errs.join(" | ")}`);
await ctx.close(); }
await b.close(); console.log(pass,"pass,",fail,"fail");
