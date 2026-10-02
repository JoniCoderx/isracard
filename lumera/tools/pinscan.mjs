import { chromium } from "playwright-core";
/* walk the whole page on a phone and list everything that is pinned to the
   screen (fixed or sticky and currently stuck) at each scroll position */
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
const mode=process.argv[2]||"line", W=+(process.argv[3]||390);
const p=await (await b.newContext({viewport:{width:W,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true})).newPage();
await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn",{timeout:2000}).catch(()=>{}); await p.waitForTimeout(600);
await p.evaluate(()=>document.documentElement.style.scrollBehavior="auto");
if (mode==="wrist") { await p.evaluate(()=>{document.getElementById("build").scrollIntoView(); }); await p.waitForTimeout(600); await p.evaluate(()=>document.querySelector('.vtb[data-view="wrist"]').click()); await p.waitForTimeout(600); }
const H=await p.evaluate(()=>document.documentElement.scrollHeight);
const seen={};
for (let y=0;y<H;y+=300) {
  await p.evaluate(y=>scrollTo(0,y),y); await p.waitForTimeout(120);
  const r=await p.evaluate(()=>{
    const out=[];
    for (const e of document.querySelectorAll("body *")) {
      const cs=getComputedStyle(e); if (cs.position!=="fixed" && cs.position!=="sticky") continue;
      if (cs.display==="none"||cs.visibility==="hidden"||+cs.opacity<0.05) continue;
      const b=e.getBoundingClientRect(); if (b.width<2||b.height<2||b.bottom<=0||b.top>=innerHeight) continue;
      if (cs.position==="sticky") { const t=parseFloat(cs.top); if (isNaN(t)||Math.abs(b.top-t)>1.5) continue; }
      if (e.closest("[aria-hidden=true]")&&cs.position==="fixed"&&b.height>=innerHeight-2) continue;
      const sec=e.closest("section,header,footer,nav,.modal,#menu")?.id||e.closest("section,header,nav")?.className||"-";
      out.push(`${cs.position} ${e.tagName.toLowerCase()}${e.id?"#"+e.id:""}.${[...e.classList].join(".")} [${sec}] h${Math.round(b.height)}`);
    }
    return out;});
  for (const k of r) (seen[k] ||= []).push(y);
}
for (const [k,v] of Object.entries(seen)) console.log(k, "@", v[0]+"–"+v[v.length-1], `(${v.length})`);
await b.close();
