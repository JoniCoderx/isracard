import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [n,w,h,mob] of [["desk",1440,900,false],["mob",390,844,true]]) {
  const p = await b.newPage({ viewport:{width:w,height:h}, isMobile:mob, hasTouch:mob });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
  await p.waitForTimeout(3200); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
  await p.waitForTimeout(900);
  const read = () => p.evaluate(()=>{const s=document.querySelector("header.sh .mark .sy");return s?(s.style.getPropertyValue("--syr")||"0deg")+" / "+(s.style.getPropertyValue("--sys")||"1"):"-";});
  console.log("\n"+n+" at rest: "+await read());
  // a burst of scrolling
  await p.evaluate(async()=>{ for(let i=0;i<8;i++){ window.scrollBy(0,240); await new Promise(r=>requestAnimationFrame(r)); } });
  await p.waitForTimeout(60);
  console.log(n+" mid-scroll: "+await read());
  await p.waitForTimeout(1400);
  console.log(n+" settled:    "+await read());
  await p.close();
}
await b.close();
