import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const vp = process.argv[2]==="desk" ? {width:1440,height:900} : {width:390,height:844};
const mob = process.argv[2]!=="desk";
const p = await b.newPage({ viewport:vp, isMobile:mob, hasTouch:mob, deviceScaleFactor:mob?2:1 });
const errs=[]; p.on("pageerror",e=>errs.push(String(e).slice(0,140)));
p.on("console",c=>{ if(c.type()==="error") errs.push("C:"+c.text().slice(0,140)); });
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
await p.waitForTimeout(3200); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
await p.waitForTimeout(1000);
console.log("innerWidth="+await p.evaluate(()=>innerWidth)+" (should be "+vp.width+")");
// walk the page so lazy content mounts
await p.evaluate(async()=>{ const H=document.documentElement.scrollHeight; for(let y=0;y<H;y+=innerHeight*0.7){window.scrollTo(0,y); await new Promise(r=>setTimeout(r,70));} window.scrollTo(0,0); });
await p.waitForTimeout(1500);
// open the builder so its controls exist
await p.evaluate(()=>{ const e=document.getElementById("build"); window.scrollTo({top:scrollY+e.getBoundingClientRect().top,behavior:"instant"}); });
await p.waitForTimeout(800);
await p.evaluate(()=>{ const t=[...document.querySelectorAll("#build a,#build button")].find(e=>/START DESIGNING/i.test(e.textContent)); t&&t.click(); });
await p.waitForTimeout(5000);
const rep = await p.evaluate(()=>{
  const out={covered:[],tiny:[],offscreen:[],dead:[]};
  const sel='a[href], button, [role="tab"], input, select, textarea, [data-toy], [data-vpos], .chip, .btn';
  document.querySelectorAll(sel).forEach(e=>{
    const cs=getComputedStyle(e); if(cs.display==="none"||cs.visibility==="hidden"||cs.opacity==="0") return;
    const r=e.getBoundingClientRect(); if(r.width<1||r.height<1) return;
    const id=(e.tagName+(e.id?"#"+e.id:"")+"."+(e.className||"").toString().trim().split(/\s+/).slice(0,2).join(".")).slice(0,44)+' "'+(e.textContent||"").trim().slice(0,22)+'"';
    if (r.right>innerWidth+2||r.left<-2) out.offscreen.push(id+" L"+Math.round(r.left)+" R"+Math.round(r.right));
    if ((r.width<32||r.height<32) && e.tagName!=="A") out.tiny.push(id+" "+Math.round(r.width)+"x"+Math.round(r.height));
    // is the centre of the control actually the control?
    if (r.top>=0 && r.bottom<=innerHeight) {
      const t=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2);
      if (t && t!==e && !e.contains(t) && !t.contains(e)) out.covered.push(id+" <- "+(t.tagName+(t.id?"#"+t.id:"")+"."+(t.className||"").toString().trim().split(/\s+/)[0]).slice(0,40));
    }
  });
  return out;
});
for (const k of Object.keys(rep)) { console.log("\n## "+k+" ("+rep[k].length+")"); rep[k].slice(0,18).forEach(x=>console.log("   "+x)); }
console.log("\nerrors="+errs.length); errs.slice(0,6).forEach(e=>console.log("  "+e));
await b.close();
