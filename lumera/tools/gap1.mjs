import { chromium } from "playwright-core";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
for (const [w,h] of [[1440,900],[390,844]]) {
  const p=await (await b.newContext({viewport:{width:w,height:h},hasTouch:w<900})).newPage(); await p.route(/fonts\./,r=>r.abort());
  await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn",{timeout:3000}).catch(()=>{});
  const r=await p.evaluate(()=>{ const q=s=>document.querySelector(s); const R=e=>{if(!e)return null; const r=e.getBoundingClientRect(); return [Math.round(r.top+scrollY),Math.round(r.bottom+scrollY)]};
    const cs=e=>{const c=getComputedStyle(e); return `pad ${c.paddingTop}/${c.paddingBottom} mar ${c.marginTop}/${c.marginBottom}`};
    const inside=q("#inside"), craft=q("#craft"), certs=q("#certs");
    return {inside:R(inside), insideCS:cs(inside), wrap:R(certs.parentElement), wrapCS:cs(certs.parentElement), certs:R(certs), certsCS:cs(certs), note:R(q(".certnote")), noteVis:getComputedStyle(q(".certnote")).display, craft:R(craft), craftCS:cs(craft), drawpin:R(q("#drawpin")), drawcap:R(q(".drawcap")), canvas:R(q("#drawcv"))}; });
  console.log(w, JSON.stringify(r,null,0));
}
await b.close();
