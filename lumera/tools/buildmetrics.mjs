import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [n,w,h,mob] of [["mob",390,844,true],["ipad",834,1112,true]]) {
  const p = await b.newPage({ viewport:{width:w,height:h}, isMobile:mob, hasTouch:mob });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
  await p.waitForTimeout(3000); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
  await p.evaluate(()=>{const e=document.getElementById("build");window.scrollTo({top:scrollY+e.getBoundingClientRect().top,behavior:"instant"});});
  await p.waitForTimeout(700);
  await p.evaluate(()=>{const t=[...document.querySelectorAll("#build a,#build button")].find(e=>/START DESIGNING/i.test(e.textContent));t&&t.click();});
  await p.waitForTimeout(5000);
  console.log("\n=== "+n+" "+w+"x"+h+" ===");
  console.log(await p.evaluate(()=>{
    const cfg=document.getElementById("configure"); const out=[];
    out.push("panel height = "+Math.round(cfg.getBoundingClientRect().height)+"px = "+(cfg.getBoundingClientRect().height/innerHeight).toFixed(1)+" screens");
    [...cfg.children].forEach(c=>{ const r=c.getBoundingClientRect(); if(r.height<2) return;
      out.push("  "+(c.tagName+"."+(c.className||"").toString().split(" ")[0]+"#"+(c.id||"")).padEnd(30)+" "+Math.round(r.height)+"px"); });
    const opts=[...cfg.querySelectorAll(".opt")].map(o=>{ const lbl=(o.querySelector("span,label")||{}).textContent||"?";
      const chips=[...o.querySelectorAll(".chip")]; const rows=new Set(chips.map(c=>Math.round(c.getBoundingClientRect().top))).size;
      const cw=chips.length?Math.round(chips[0].getBoundingClientRect().width):0; const ch=chips.length?Math.round(chips[0].getBoundingClientRect().height):0;
      return "  "+lbl.trim().slice(0,14).padEnd(15)+" chips="+String(chips.length).padStart(2)+" rows="+rows+" chip="+cw+"x"+ch+" total="+Math.round(o.getBoundingClientRect().height)+"px"; });
    return out.join("\n")+"\n OPTIONS:\n"+opts.join("\n");
  }));
  await p.close();
}
await b.close();
