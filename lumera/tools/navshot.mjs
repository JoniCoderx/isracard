import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
for (const [w,h,u] of [[1440,900,"/"],[1024,768,"/"],[390,844,"/"],[1440,900,"/about/"],[390,844,"/about/"]]) {
  const p=await (await b.newContext({viewport:{width:w,height:h},hasTouch:w<900})).newPage(); await p.route(/fonts\./,r=>r.abort());
  await p.goto("http://localhost:8777"+u,{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn",{timeout:2000}).catch(()=>{}); await p.waitForTimeout(600);
  const r=await p.evaluate(()=>{const n=document.getElementById("topnav"); return n?{vis:getComputedStyle(n).display, links:[...n.querySelectorAll("a")].map(a=>a.textContent+(a.getBoundingClientRect().width?"":"(hidden)")).join(" · ")}:null;});
  console.log(w,u,JSON.stringify(r));
  await p.screenshot({path:O+`nav-${w}${u.replace(/\//g,"_")}.jpg`,type:"jpeg",quality:60,clip:{x:0,y:0,width:w,height:u==="/"?110:Math.min(h,700)}});
}
await b.close();
