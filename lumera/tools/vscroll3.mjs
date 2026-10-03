import { chromium } from "playwright-core";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}); const p=await c.newPage();
await p.goto(`http://localhost:${process.argv[2]||8778}/`,{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn",{timeout:1500}).catch(()=>{});
const cdp=await c.newCDPSession(p); await p.evaluate(()=>document.documentElement.style.scrollBehavior="auto");
for (const sel of [".pgrid .piece .bd p",".pgrid .piece .fig",".pgrid .piece .bd p",".pgrid .piece .fig"]) {
  await p.evaluate(()=>document.querySelector(".pgrid .piece").scrollIntoView()); await p.waitForTimeout(500);
  const bx=await p.locator(sel).first().boundingBox(); const x=bx.x+bx.width/2, y=Math.min(bx.y+bx.height/2, 600); const y1=await p.evaluate(()=>scrollY);
  await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y}]});
  for (let k=1;k<=12;k++){ await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x,y:y-k*20}]}); await p.waitForTimeout(16); }
  await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]}); await p.waitForTimeout(700);
  console.log(sel, Math.round((await p.evaluate(()=>scrollY))-y1));
}
await b.close();
