import { chromium } from "playwright-core";
const OUT="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/walk";
import fs from "node:fs"; fs.mkdirSync(OUT,{recursive:true});
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const mob = process.argv[2]!=="desk";
const W = mob?390:1440, H = mob?844:900;
const p = await b.newPage({ viewport:{width:W,height:H}, isMobile:mob, hasTouch:mob });
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
await p.waitForTimeout(3400); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
await p.waitForTimeout(1200);
await p.evaluate(async()=>{const T=document.documentElement.scrollHeight;for(let y=0;y<T;y+=320){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60));}window.scrollTo(0,0);});
await p.waitForTimeout(2500);
const T = await p.evaluate(()=>document.documentElement.scrollHeight);
const tag = mob?"m":"d";
let n=0;
for (let y=0; y<T && n<20; y+=H, n++){
  await p.evaluate(v=>window.scrollTo({top:v,behavior:"instant"}), y);
  await p.waitForTimeout(700);
  await p.screenshot({path:`${OUT}/${tag}${String(n).padStart(2,"0")}.png`});
}
console.log("captured "+n+" screens ("+Math.round(T/H)+" total) at "+W+"x"+H);
await b.close();
