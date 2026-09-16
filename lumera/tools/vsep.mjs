import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const lang of ["en","he"]) for (const w of [360,390,430,600,700,768,1100,1440]) {
  const p = await b.newPage({ viewport:{width:w,height:900} });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" });
  await p.waitForTimeout(2800); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
  if (lang==="he") { await p.evaluate(()=>{ const a=document.querySelector('.lang,[data-lang-toggle],#langBtn'); a&&a.click(); }); await p.waitForTimeout(900); }
  await p.evaluate(()=>{ const e=document.getElementById("build"); window.scrollTo({top: scrollY+e.getBoundingClientRect().top, behavior:"instant"}); });
  await p.waitForTimeout(700);
  await p.evaluate(()=>{ const t=Array.from(document.querySelectorAll("#build a,#build button")).find(e=>/START DESIGNING|עיצוב|התחילו/i.test(e.textContent)); t&&t.click(); });
  await p.waitForTimeout(2500);
  console.log(lang+" "+w+": "+await p.evaluate(()=>{
    const row=document.querySelector(".vpos"); if(!row) return "no row";
    const rr=row.getBoundingClientRect(), sep=row.querySelector(".vsep");
    const btns=[...row.querySelectorAll(".vp")].filter(x=>getComputedStyle(x).display!=="none");
    const lines=[...new Set(btns.map(x=>Math.round(x.getBoundingClientRect().top)))].length;
    const s=sep?sep.getBoundingClientRect():null;
    const sc = sep?getComputedStyle(sep):null;
    const visible = sc && sc.display!=="none" && parseFloat(sc.height)>0.5 && sc.backgroundImage==="none" && sc.backgroundColor!=="rgba(0, 0, 0, 0)";
    const dangling = visible && (rr.right - s.right) < 6;
    return "lines="+lines+" rowW="+Math.round(rr.width)+" fits="+(rr.right<=innerWidth+2)+" bar="+(visible?"yes":"no")+(dangling?" DANGLING":"");
  }));
  await p.close();
}
await b.close();
