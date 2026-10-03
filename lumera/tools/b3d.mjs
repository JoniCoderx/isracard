import { chromium } from "playwright-core";
/* the builder in real 3D and in its fallback: node b3d.mjs <port> <3d|no3d> <tag> */
const [port,mode,tag]=[process.argv[2]||"8777",process.argv[3]||"3d",process.argv[4]||"x"];
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/b3d/"; import fs from "fs"; fs.mkdirSync(O,{recursive:true});
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
for (const [W,H,mob] of [[1440,900,false],[390,844,true]]) {
  const c=await b.newContext({viewport:{width:W,height:H},hasTouch:mob,isMobile:mob});
  if (mode==="no3d") await c.addInitScript(()=>{ const g=HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext=function(t,...a){ if(/webgl/i.test(t)) return null; return g.call(this,t,...a); }; });
  const p=await c.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{ if(m.type()==="error") errs.push("console:"+m.text().slice(0,120)); });
  await p.goto(`http://localhost:${port}/`,{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn",{timeout:1500}).catch(()=>{});
  await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; const s=document.getElementById("stripwrap"); scrollTo(0,s.getBoundingClientRect().top+scrollY-(innerWidth<700?70:120));}); await p.waitForTimeout(3500);
  const st=await p.evaluate(()=>({no3d:document.documentElement.classList.contains("no3d"), gl:!!window.__bracelet}));
  console.log(W,mode,"no3d class:",st.no3d,"3d api:",st.gl);
  const combos=[["cut","round","metal","white","ct","6"],["cut","emerald","metal","yellow","ct","12"],["cut","pear","metal","rose","ct","2"],["cut","baguette","metal","platinum","ct","8"]];
  let i=0; for (const cb of combos) { await p.evaluate(cb=>{ for (let k=0;k<cb.length;k+=2){ const c=document.querySelector(`#opts .chip[data-k="${cb[k]}"][data-v="${cb[k+1]}"]`); if(c) c.click(); } },cb); await p.waitForTimeout(2200);
    const el=await p.$("#stripwrap"); await el.screenshot({path:O+`${tag}-${mode}-${W}-${i++}-${cb[1]}-${cb[3]}-${cb[5]}.jpg`,type:"jpeg",quality:60}); }
  /* on a wrist */
  for (const hand of ["f","m"]) { await p.evaluate(h=>{ const v=document.querySelector('#stripwrap .vtb[data-view="wrist"]'); if(v) v.click(); const hb=document.querySelector(`.handbar [data-hand="${h}"]`); if(hb) hb.click(); const sk=document.querySelector(`.handbar [data-skin="0"]`); if(sk) sk.click(); },hand); await p.waitForTimeout(3000);
    const el=await p.$("#stripwrap"); await el.screenshot({path:O+`${tag}-${mode}-${W}-wrist-${hand}.jpg`,type:"jpeg",quality:60}); }
  console.log(W,mode,"errors:",errs.slice(0,4).join(" | ")||"none");
  await c.close();
}
await b.close();
