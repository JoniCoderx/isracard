import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/r4/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox","--disable-background-networking","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]});
let pass=0,fail=0; const ok=(c,m)=>{c?pass++:fail++; console.log((c?"PASS ":"FAIL ")+m);};
for (const [dv,w,h] of [["d",1440,900],["m",390,844]]) {
  const p=await (await b.newContext({viewport:{width:w,height:h},hasTouch:w<900})).newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error"&&!/Failed to load/.test(m.text()))errs.push(m.text())});
  await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn",{timeout:3000}).catch(()=>{}); await p.waitForTimeout(800);
  await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; document.getElementById("configure").scrollIntoView();}); await p.waitForTimeout(4000);
  const y0=await p.evaluate(()=>scrollY);
  await p.evaluate(()=>document.querySelector('[data-toy="up"]').click()); await p.waitForTimeout(500);
  await p.screenshot({path:O+`snake-${dv}-1open.jpg`,type:"jpeg",quality:70});
  await p.waitForTimeout(1200);
  ok(await p.evaluate(()=>document.documentElement.classList.contains("silavu-snake")), `${dv} play mode on`);
  // lead it around
  const pts = w>900 ? [[1100,250],[1200,600],[700,700],[300,500],[400,200]] : [[300,300],[100,600],[250,700]];
  if (w>900) { for (const [x,y] of pts) { await p.mouse.move(x,y,{steps:20}); await p.waitForTimeout(350); } }
  else { await p.evaluate(async()=>{ const v=document.getElementById("snakeveil"); const ev=(t,x,y)=>v.dispatchEvent(new PointerEvent(t,{pointerType:"touch",clientX:x,clientY:y,bubbles:true,isPrimary:true,pointerId:7}));
      ev("pointerdown",200,420); for (let i=0;i<30;i++){ ev("pointermove",200+Math.sin(i/5)*140,420+i*8); await new Promise(r=>setTimeout(r,40)); } ev("pointerup",200,660); }); }
  await p.waitForTimeout(600);
  await p.screenshot({path:O+`snake-${dv}-2play.jpg`,type:"jpeg",quality:70});
  await p.waitForTimeout(1200);
  await p.screenshot({path:O+`snake-${dv}-3play.jpg`,type:"jpeg",quality:70});
  // set it back
  await p.click("#snakeback"); await p.waitForTimeout(500);
  await p.screenshot({path:O+`snake-${dv}-4close.jpg`,type:"jpeg",quality:70});
  await p.waitForTimeout(1500);
  const st=await p.evaluate(()=>({on:document.documentElement.classList.contains("silavu-snake"), y:scrollY}));
  ok(!st.on && Math.abs(st.y-y0)<4, `${dv} back on the stand, page where it was (${y0}→${st.y})`);
  await p.screenshot({path:O+`snake-${dv}-5back.jpg`,type:"jpeg",quality:70});
  // click-to-return path
  await p.evaluate(()=>document.querySelector('[data-toy="up"]').click()); await p.waitForTimeout(1700);
  const ph0 = await p.evaluate(()=>window.__snakeState && window.__snakeState());
  if (w>900) await p.mouse.click(720,450); else await p.touchscreen.tap(195,420);
  console.log(dv, "phase before tap", ph0, "hit", await p.evaluate(()=>{const e=document.elementFromPoint(195,420); return e&&(e.id||e.className);}));
  const ph1 = await p.evaluate(()=>window.__snakeState());
  await p.waitForFunction(()=>!document.documentElement.classList.contains("silavu-snake"), null, {timeout:8000}).catch(()=>{});
  ok(await p.evaluate(()=>!document.documentElement.classList.contains("silavu-snake")), `${dv} a click/tap sets it back (phase right after: ${ph1})`);
  ok(errs.length===0, `${dv} no errors ${errs.join("|")}`);
}
await b.close(); console.log(pass,"pass,",fail,"fail");
