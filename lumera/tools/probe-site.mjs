import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" }); await p.waitForTimeout(1200);
await p.click("#enterBtn"); await p.waitForTimeout(800); await p.mouse.move(2,2);
await p.evaluate(() => document.querySelector('nav a[href="#concierge"]').click());
for (const w of [500,1000,1500,2500,4000]) { await p.waitForTimeout(w===500?500:w-[500,1000,1500,2500,4000][[500,1000,1500,2500,4000].indexOf(w)-1]); console.log("t="+w, await p.evaluate(() => [scrollY, scrollY + document.getElementById("concierge").getBoundingClientRect().top, document.documentElement.scrollHeight].join(" "))); }
await p.evaluate(() => window.scrollTo({top:0, behavior:"instant"})); await p.waitForTimeout(300);
await p.evaluate(() => { const r=document.getElementById("hero").getBoundingClientRect(); window.scrollTo({top:(r.height-innerHeight)*0.5, behavior:"instant"}); }); await p.waitForTimeout(700);
console.log("beats", await p.evaluate(() => Array.from(document.querySelectorAll(".beat")).map(b => b.className + ":" + b.style.opacity).join(" | ") + " scrollY=" + scrollY + " heroH=" + document.getElementById("hero").getBoundingClientRect().height));
await b.close();
