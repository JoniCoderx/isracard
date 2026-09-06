import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{width:1440,height:810} });
await p.goto("http://localhost:3000/showcase",{waitUntil:"domcontentloaded"});
await p.waitForTimeout(1200);
// nudge scroll to trigger IntersectionObserver
await p.mouse.move(700,400);
await p.evaluate(()=>window.scrollBy(0,200));
await p.waitForTimeout(400);
await p.evaluate(()=>window.scrollTo(0,0));
await p.waitForTimeout(1500);
await p.screenshot({ path:"shots/test-showcase2.png" });
console.log("done");
await b.close();
