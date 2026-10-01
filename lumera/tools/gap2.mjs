import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const tag=process.argv[2]||"a";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
for (const [w,h] of [[1440,900],[390,844]]) {
  const p=await (await b.newContext({viewport:{width:w,height:h},hasTouch:w<900})).newPage(); await p.route(/fonts\./,r=>r.abort());
  await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn",{timeout:3000}).catch(()=>{}); await p.waitForTimeout(500);
  for (const off of [0.15,0.55]) {
    await p.evaluate(off=>{document.documentElement.style.scrollBehavior="auto"; const c=document.getElementById("certs"); scrollTo(0,c.getBoundingClientRect().top+scrollY-innerHeight*off);},off);
    await p.waitForTimeout(1800); await p.screenshot({path:O+`gap-${tag}-${w}-${off}.jpg`,type:"jpeg",quality:55});
  }
}
await b.close();
