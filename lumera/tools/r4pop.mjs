import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/r4/", tag=process.argv[2]||"x";
import fs from "fs"; fs.mkdirSync(O,{recursive:true});
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox","--disable-background-networking","--disable-component-update"]});
let pass=0,fail=0; const ok=(c,m)=>{c?pass++:fail++; console.log((c?"PASS ":"FAIL ")+m);};
for (const [dv,w,h,lang] of [["d-en",1440,900,"en"],["m-en",390,844,"en"],["d-he",1440,900,"he"],["m-he",390,844,"he"]]) {
  const c=await b.newContext({viewport:{width:w,height:h},hasTouch:w<900}); const p=await c.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort()); await p.addInitScript(l=>{try{localStorage.setItem("silavu-lang",l)}catch(e){}},lang);
  await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn",{timeout:3000}).catch(()=>{}); await p.waitForTimeout(800);
  await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; document.getElementById("collection").scrollIntoView();}); await p.waitForTimeout(2000);
  if (dv==="d-en"||dv==="m-en") { await p.evaluate(()=>scrollBy(0, 300)); await p.waitForTimeout(1200); await p.screenshot({path:O+`cards-${tag}-${dv}.jpg`,type:"jpeg",quality:65}); }
  for (const id of ["knot","ring","pave"]) {
    await p.evaluate(id=>{ const b=document.querySelector(`#p-${id} .lnk.vw`); b.scrollIntoView({block:"center"}); },id); await p.waitForTimeout(400);
    await p.click(`#p-${id} .lnk.vw`); await p.waitForTimeout(1500);
    const st=await p.evaluate(()=>({open:document.getElementById("pmodal").classList.contains("open"), t:document.getElementById("pmT").textContent.trim(), story:document.getElementById("pmStory").textContent.trim().slice(0,40), img:document.getElementById("pmImg").getAttribute("src"), nat:document.getElementById("pmImg").naturalWidth, piece:document.getElementById("pmRes").getAttribute("data-piece")}));
    console.log(dv,id,JSON.stringify(st));
    ok(st.open && st.nat>0, `${dv} ${id} opens with photo`);
    await p.screenshot({path:O+`pop-${tag}-${dv}-${id}.jpg`,type:"jpeg",quality:65});
    if (id==="ring") { await p.click("#pmodal [data-close]"); } else await p.keyboard.press("Escape");
    await p.waitForTimeout(700);
    ok(await p.evaluate(()=>!document.getElementById("pmodal").classList.contains("open")), `${dv} ${id} closes`);
  }
  // reserve from SOUL
  await p.click(`#p-pave .lnk.vw`); await p.waitForTimeout(1200); await p.click("#pmRes"); await p.waitForTimeout(2500);
  const r=await p.evaluate(()=>({open:document.getElementById("pmodal").classList.contains("open"), msg:document.getElementById("fMsg").value, top:Math.round(document.getElementById("concierge").getBoundingClientRect().top)}));
  ok(!r.open && /SILAVU SOUL/.test(r.msg), `${dv} reserve → form: ${r.msg}`);
  ok(errs.length===0, `${dv} no errors ${errs.join("|")}`);
  await c.close();
}
await b.close(); console.log(pass,"pass,",fail,"fail");
