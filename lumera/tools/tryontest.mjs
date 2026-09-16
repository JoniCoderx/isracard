import { chromium } from "playwright-core";
const OUT="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [n,w,h,mob] of [["desk",1440,900,false],["mob",390,844,true]]) {
  const p = await b.newPage({ viewport:{width:w,height:h}, isMobile:mob, hasTouch:mob });
  const errs=[]; p.on("pageerror",e=>errs.push(String(e).slice(0,140)));
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
  await p.waitForTimeout(3000); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
  await p.waitForTimeout(600);
  await p.evaluate(()=>window.__tryon && window.__tryon.open());
  await p.waitForTimeout(1200);
  console.log("\n=== "+n+" ===");
  console.log("opened: "+await p.evaluate(()=>document.getElementById("tryon").classList.contains("open")));
  await p.setInputFiles("#tfile", OUT+"/wrist-test.png");
  await p.waitForTimeout(2500);
  console.log("after upload: cls="+await p.evaluate(()=>document.getElementById("tryon").className)+" emptyHidden="+await p.evaluate(()=>getComputedStyle(document.getElementById("tempty")).display==="none"));
  console.log("canvas has ink: "+await p.evaluate(()=>{const c=document.getElementById("tcanvas");const x=c.getContext("2d");try{const d=x.getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=4000)if(d[i]+d[i+1]+d[i+2]>40)n++;return n+" bright samples of "+Math.round(d.length/4000);}catch(e){return "ERR "+e.message;}}));
  await p.evaluate(()=>{const b=document.getElementById("tdone"); if(b) b.click();});
  await p.waitForTimeout(2500);
  console.log("after done: cls="+await p.evaluate(()=>document.getElementById("tryon").className));
  console.log("stamp visible: "+await p.evaluate(()=>{const t=document.getElementById("tcv");const cs=getComputedStyle(t,"::after");const cb=getComputedStyle(t,"::before");return "after op="+cs.opacity+" before op="+cb.opacity;}));
  const el=await p.$("#tcv"); if(el) await el.screenshot({path:`${OUT}/tryon-${n}.png`});
  console.log("errors="+errs.length+(errs.length?" :: "+errs[0]:""));
  await p.close();
}
await b.close();
