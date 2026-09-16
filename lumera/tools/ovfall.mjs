import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const vp of [{width:390,height:844},{width:360,height:780},{width:768,height:1024},{width:1440,height:900}]) {
  const p = await b.newPage({ viewport: vp });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" });
  await p.waitForTimeout(3000); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
  await p.waitForTimeout(800);
  await p.evaluate(()=>{ const e=document.getElementById("build"); window.scrollTo({top: scrollY+e.getBoundingClientRect().top, behavior:"instant"}); });
  await p.waitForTimeout(800);
  await p.evaluate(()=>{ const t=Array.from(document.querySelectorAll("#build a,#build button")).find(e=>/START DESIGNING/i.test(e.textContent)); t&&t.click(); });
  await p.waitForTimeout(3500);
  const r = await p.evaluate(async ()=>{
    const H=document.documentElement.scrollHeight; for(let y=0;y<H;y+=innerHeight*0.8){ window.scrollTo(0,y); await new Promise(z=>setTimeout(z,50)); } window.scrollTo(0,0);
    const bad=[];
    document.querySelectorAll("body *").forEach(e=>{ const c=getComputedStyle(e); if(c.display==="none"||c.visibility==="hidden"||c.position==="fixed") return;
      const rr=e.getBoundingClientRect(); if(rr.width<2||rr.height<2) return;
      if(rr.right>innerWidth+2) { let p=e.parentElement,clipped=false; for(let k=0;k<8&&p;k++,p=p.parentElement){const pc=getComputedStyle(p); if(pc.overflowX!=="visible"){clipped=true;break;}} if(!clipped) bad.push((e.tagName+"."+(e.className||"").toString().split(" ")[0]+"#"+(e.id||"")).slice(0,46)+" R"+Math.round(rr.right)); }
    });
    return { sw: document.documentElement.scrollWidth, inner: innerWidth, bad: [...new Set(bad)].slice(0,10), n: bad.length };
  });
  console.log(vp.width+": scrollWidth="+r.sw+" inner="+r.inner+" unclipped-overflow="+r.n+(r.bad.length?"\n   "+r.bad.join("\n   "):""));
  await p.close();
}
await b.close();
