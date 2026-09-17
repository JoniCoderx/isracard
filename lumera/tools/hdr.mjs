import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [n,w,h,mob] of [["mob",390,844,true],["desk",1440,900,false]]) {
  const p = await b.newPage({ viewport:{width:w,height:h}, isMobile:mob, hasTouch:mob });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
  await p.waitForTimeout(3200); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
  await p.waitForTimeout(900);
  const read = async (label) => console.log(n+" "+label+": cls="+await p.evaluate(()=>document.querySelector("header.sh").className)
    +"  bg="+await p.evaluate(()=>getComputedStyle(document.querySelector("header.sh")).backgroundColor)
    +"  blur="+await p.evaluate(()=>getComputedStyle(document.querySelector("header.sh")).backdropFilter||"-"));
  await read("at top      ");
  await p.evaluate(()=>window.scrollTo({top:2500,behavior:"instant"})); await p.waitForTimeout(900);
  await read("scrolled 2500");
  await p.evaluate(()=>window.scrollTo({top:7000,behavior:"instant"})); await p.waitForTimeout(900);
  await read("scrolled 7000");
  await p.close();
}
await b.close();
