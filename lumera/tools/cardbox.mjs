import { chromium } from "playwright-core";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const p=await c.newPage();
await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1300);
console.log(await p.evaluate(()=>{const pc=document.querySelector(".pgrid .piece:not(.soon)"); const out=[["card",pc]]; [".fig",".bd",".t",".kd",".p",".meta",".acts"].forEach(s=>out.push([s,pc.querySelector(s)])); out.push(["gap", null]);
 const r=out.filter(x=>x[1]).map(([n,e])=>{const b=e.getBoundingClientRect(), cs=getComputedStyle(e); return `${n} h${Math.round(b.height)} mt${cs.marginTop} pt${cs.paddingTop} pb${cs.paddingBottom}`;});
 const g=getComputedStyle(document.querySelector(".pgrid")); r.push("pgrid rowgap "+g.rowGap+" display "+g.display); const s=document.querySelector("#collection .sechead"); r.push("sechead h"+Math.round(s.getBoundingClientRect().height)); return r.join("\n");}));
await b.close();
