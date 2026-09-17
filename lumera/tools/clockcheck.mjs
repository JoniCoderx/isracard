import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [n,w,h,mob] of [["desk",1440,900,false],["mob",390,844,true]]) {
  const p = await b.newPage({ viewport:{width:w,height:h}, isMobile:mob, hasTouch:mob });
  const errs=[]; p.on("pageerror",e=>errs.push(String(e).slice(0,140)));
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
  await p.waitForTimeout(3000); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
  await p.evaluate(()=>{const e=document.getElementById("concierge");e&&window.scrollTo({top:scrollY+e.getBoundingClientRect().top,behavior:"instant"});});
  await p.waitForTimeout(1600);
  console.log("\n"+n+": "+await p.evaluate(()=>[...document.querySelectorAll(".clock")].map(c=>{
    const t=c.querySelector(".c"), s=c.querySelector(".cst");
    return (c.getAttribute("data-city")||"?")+" "+(t?t.textContent:"-")+" ["+(s?s.textContent:"NO TAG")+"] open="+c.classList.contains("open");
  }).join("   |   ")));
  // hebrew
  await p.evaluate(()=>{const a=document.querySelector("#langBtn,.lang");a&&a.click();});
  await p.waitForTimeout(1500);
  console.log(n+" he: "+await p.evaluate(()=>[...document.querySelectorAll(".clock .cst")].map(s=>s.textContent).join(" | ")));
  console.log(n+" footer repeats: "+await p.evaluate(()=>{const f=document.getElementById("end");const t=f?f.innerText:"";return "privateRooms="+(t.match(/private rooms/gi)||[]).length+" repliesWithin="+(t.match(/Replies within/gi)||[]).length;}));
  console.log(n+" errors="+errs.length+(errs.length?" :: "+errs[0]:""));
  await p.close();
}
await b.close();
