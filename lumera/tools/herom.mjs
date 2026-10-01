import { chromium } from "playwright-core";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
let pass=0,fail=0; const ok=(c,m)=>{c?pass++:fail++; console.log((c?"PASS ":"FAIL ")+m);};
for (const [w,h,touch] of [[390,844,true],[1440,900,false]]) {
  const p=await (await b.newContext({viewport:{width:w,height:h},hasTouch:touch,isMobile:touch})).newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.route(/fonts\./,r=>r.abort()); await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn",{timeout:3000}).catch(()=>{});
  const t0=await p.evaluate(()=>document.getElementById("hcap").getBoundingClientRect().top);
  await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; scrollTo(0,300);}); await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{const c=document.getElementById("hcap"); return {top:c.getBoundingClientRect().top, op:+getComputedStyle(c).opacity, tf:getComputedStyle(c).transform, hs:document.getElementById("hero").style.getPropertyValue("--hs")};});
  if (touch) ok(Math.abs((t0-300)-r.top)<2 && r.tf==="none" && r.op<1 && !r.hs, `${w} caption stays in place and fades (moved ${Math.round(t0-r.top)}px, opacity ${r.op.toFixed(2)})`);
  else ok(r.tf!=="none" && r.op<1, `${w} desktop keeps its drift (${r.tf.slice(0,30)})`);
  ok(errs.length===0, `${w} no errors ${errs.join("|")}`);
}
await b.close(); console.log(pass,"pass,",fail,"fail");
