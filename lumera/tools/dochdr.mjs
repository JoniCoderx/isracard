import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
for (const [w,path,tag] of [[1440,"care/","d"],[1200,"about/","a"],[390,"care/","m"],[390,"about/","h"]]) {
  const p=await (await b.newContext({viewport:{width:w,height:300},deviceScaleFactor:1})).newPage();
  await p.goto("http://localhost:8777/"+path,{waitUntil:"load"}).catch(e=>console.log(e.message)); await p.waitForTimeout(700);
  const r=await p.evaluate(()=>{const h=document.querySelector(".dhd"), m=document.querySelector(".dhome"); if(!h) return "nohdr"; const a=m.getBoundingClientRect(); return {centerOff:Math.round(a.left+a.width/2-innerWidth/2), h:Math.round(h.offsetHeight)};});
  console.log(w,path,JSON.stringify(r));
  await p.screenshot({path:O+`dh-${tag}.png`,clip:{x:0,y:0,width:w,height:140}});
}
await b.close();
