import { chromium } from "playwright-core";
/* reproduce: does "View the piece" open the same window as the photograph? */
const port=process.argv[2]||"8778";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
for (const [w,h,mob] of [[1440,900,false],[390,844,true]]) {
  const p=await (await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob})).newPage();
  await p.goto(`http://localhost:${port}/`,{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn",{timeout:1500}).catch(()=>{}); await p.waitForTimeout(500);
  const n=await p.locator(".pgrid .piece:not(.soon)").count();
  for (let i=0;i<n;i++) for (const what of [".vw",".fig"]) {
    const card=p.locator(".pgrid .piece:not(.soon)").nth(i);
    await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
    const y0=await p.evaluate(()=>scrollY);
    if (mob) await card.locator(what).first().tap(); else await card.locator(what).first().click();
    await p.waitForTimeout(900);
    const r=await p.evaluate(()=>({open:document.getElementById("pmodal").classList.contains("open"), title:(document.getElementById("pmT")||{}).textContent, y:scrollY, msg:(document.getElementById("fMsg")||document.querySelector("#cform textarea")||{}).value}));
    console.log(w, "card",i, what, "open:",r.open, "title:",(r.title||"").trim().slice(0,30), "scrolled:",Math.round(r.y-y0), r.msg?("msg:"+r.msg.slice(0,40)):"");
    await p.keyboard.press("Escape"); await p.waitForTimeout(500);
  }
}
await b.close();
