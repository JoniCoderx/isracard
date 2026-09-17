import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const vp = process.argv[2]==="desk" ? {width:1440,height:900} : {width:390,height:844};
const mob = process.argv[2]!=="desk";
const p = await b.newPage({ viewport:vp, isMobile:mob, hasTouch:mob });
const errs=[]; p.on("pageerror",e=>errs.push("PAGEERROR "+String(e).slice(0,120)));
p.on("console",c=>{ if(c.type()==="error" && !/ERR_FILE_NOT_FOUND|ERR_CERT/.test(c.text())) errs.push("CONSOLE "+c.text().slice(0,120)); });
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
await p.waitForTimeout(3200); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
await p.waitForTimeout(900);
await p.evaluate(()=>{const e=document.getElementById("build");e&&window.scrollTo({top:scrollY+e.getBoundingClientRect().top,behavior:"instant"});});
await p.waitForTimeout(700);
await p.evaluate(()=>{const t=[...document.querySelectorAll("#build a,#build button")].find(e=>/START DESIGNING/i.test(e.textContent));t&&t.click();});
await p.waitForTimeout(4500);

await p.evaluate(()=>{ window.__fp = () => {
  const on=[...document.querySelectorAll(".on,.open,[aria-selected='true']")].map(e=>e.className+"|"+(e.id||"")).join(",");
  const txt=["estimate","sumStones","sumMetal","sumOrigin","sumWrist","eachCt","eachMm","lineLen","whereT","whereN"].map(id=>{const e=document.getElementById(id);return e?e.textContent:"";}).join("~");
  let cvs=""; document.querySelectorAll("canvas").forEach(c=>{ try{ const x=c.getContext("2d"); if(x){ const d=x.getImageData(0,0,Math.min(c.width,60),Math.min(c.height,60)).data; let h=0; for(let i=0;i<d.length;i+=97) h=(h*31+d[i])>>>0; cvs+=h+"."; } else cvs+="gl."; }catch(e){cvs+="x.";} });
  const body=document.body.innerText.length;
  return [on.length+":"+on.slice(0,400), txt, cvs, Math.round(scrollY), document.documentElement.className, (document.querySelector(".modal.open")||{}).id||"", body].join("§");
}; });

const list = await p.evaluate(()=>{
  const out=[];
  document.querySelectorAll('button, a[href^="#"], .chip, [data-vpos], [data-toy], .vtb, .clock, [data-cur]').forEach((e,i)=>{
    const cs=getComputedStyle(e); if(cs.display==="none"||cs.visibility==="hidden") return;
    const r=e.getBoundingClientRect(); if(r.width<2||r.height<2) return;
    e.setAttribute("data-probe", String(i));
    out.push({i, label:(e.textContent||e.getAttribute("aria-label")||e.id||"?").trim().replace(/\s+/g," ").slice(0,32)});
  });
  return out;
});
console.log("probing "+list.length+" controls on "+(mob?"mobile":"desktop"));
const dead=[];
for (const c of list) {
  const before = await p.evaluate(()=>window.__fp());
  const res = await p.evaluate(i=>{ const e=document.querySelector('[data-probe="'+i+'"]'); if(!e) return "gone";
    const cs=getComputedStyle(e); if(cs.display==="none") return "hidden"; try{ e.click(); return "ok"; }catch(err){ return "throw"; } }, c.i);
  await p.waitForTimeout(650);
  const after = await p.evaluate(()=>window.__fp());
  if (res==="ok" && before===after) dead.push(c.label);
  await p.evaluate(()=>{ const m=document.querySelector(".modal.open"); if(m){const x=m.querySelector(".mclose,.mclose2,[data-close]"); if(x) x.click();}
    const mm=document.getElementById("menu"); if(mm&&mm.classList.contains("open")){const mb=document.getElementById("menuBtn"); mb&&mb.click();} });
  await p.waitForTimeout(240);
}
console.log("\nDEAD — clicked, nothing changed anywhere ("+dead.length+" of "+list.length+"):");
dead.forEach(d=>console.log("   "+d));
console.log("\nerrors="+errs.length); errs.slice(0,8).forEach(e=>console.log("   "+e));
await b.close();
