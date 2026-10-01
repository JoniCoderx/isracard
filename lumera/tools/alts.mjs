import { chromium } from "playwright-core";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
for (const u of ["/","/he/"]) { const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage(); await p.route(/fonts\./,r=>r.abort());
  await p.goto("http://localhost:8777"+u,{waitUntil:"load"}); await p.waitForTimeout(1500);
  const r=await p.evaluate(()=>[...document.images].map(i=>({s:(i.getAttribute("src")||i.getAttribute("data-src")||"").split("/").pop(),a:i.getAttribute("alt"),h:!!i.closest("[aria-hidden=true]")})));
  console.log(u, r.length); r.forEach(x=>console.log(" ",x.h?"(hidden)":"", x.s, "|", x.a));
  console.log(" h1:", await p.evaluate(()=>document.querySelectorAll("h1").length), "title:", await p.title()); }
await b.close();
