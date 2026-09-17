import { chromium } from "playwright-core";
const OUT="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [n,w,h,mob] of [["t-desk",1440,900,false],["t-mob",390,844,true]]) {
  const p = await b.newPage({ viewport:{width:w,height:h}, isMobile:mob, hasTouch:mob });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
  await p.waitForTimeout(3600); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
  await p.waitForTimeout(1600);
  console.log(n+" fonts: "+await p.evaluate(()=>{
    const f=e=>e?getComputedStyle(e).fontFamily.split(",")[0].replace(/["']/g,""):"-";
    return "body="+f(document.body)+" h="+f(document.querySelector(".h,.h2"))+" em="+f(document.querySelector(".h em,.h2 em"))+" lg="+f(document.querySelector(".lg"));
  }));
  await p.screenshot({path:`${OUT}/${n}-hero.png`});
  await p.evaluate(()=>{const e=document.getElementById("what");e&&window.scrollTo({top:scrollY+e.getBoundingClientRect().top,behavior:"instant"});});
  await p.waitForTimeout(1600); await p.screenshot({path:`${OUT}/${n}-what.png`});
  await p.close();
}
await b.close();
