import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const w of [360,375,390,393,414,430]) {
  const p = await b.newPage({ viewport:{width:w,height:800}, isMobile:true, hasTouch:true, deviceScaleFactor:2 });
  const errs=[]; p.on("pageerror",e=>errs.push(String(e).slice(0,90)));
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
  await p.waitForTimeout(3000); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
  await p.waitForTimeout(700);
  await p.evaluate(()=>{const e=document.getElementById("build");e&&window.scrollTo({top:scrollY+e.getBoundingClientRect().top,behavior:"instant"});});
  await p.waitForTimeout(600);
  await p.evaluate(()=>{const t=[...document.querySelectorAll("#build a,#build button")].find(e=>/START DESIGNING/i.test(e.textContent));t&&t.click();});
  await p.waitForTimeout(3500);
  const r = await p.evaluate(async ()=>{
    const T=document.documentElement.scrollHeight;
    for(let y=0;y<T;y+=innerHeight*0.8){window.scrollTo(0,y); await new Promise(r=>setTimeout(r,45));}
    window.scrollTo(0,0);
    // touch targets below 44px that a finger is meant to hit
    const small=[];
    document.querySelectorAll('button, a[href], .chip, .vp, input[type="file"] + *, label.btn').forEach(e=>{
      const cs=getComputedStyle(e); if(cs.display==="none"||cs.visibility==="hidden") return;
      const rr=e.getBoundingClientRect(); if(rr.width<2||rr.height<2) return;
      if(rr.height<44) small.push(((e.textContent||e.id||"?").trim().slice(0,18))+" "+Math.round(rr.width)+"x"+Math.round(rr.height));
    });
    return { sw:document.documentElement.scrollWidth, inner:innerWidth,
      small:[...new Set(small)], nSmall:small.length,
      hdr:(()=>{const h=document.querySelector("header.sh").getBoundingClientRect();return Math.round(h.height);})() };
  });
  console.log(w+": overflow="+(r.sw>r.inner?("YES "+r.sw+"/"+r.inner):"no")+"  header="+r.hdr+"px  under-44px targets="+r.nSmall+"  errors="+errs.length);
  if (r.small.length) console.log("     "+r.small.slice(0,6).join(" | "));
  await p.close();
}
await b.close();
