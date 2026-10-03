import { chromium } from "playwright-core";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const p=await c.newPage();
await p.goto(`http://localhost:${process.argv[2]||8777}/`,{waitUntil:"load"}); await p.waitForTimeout(1300); await p.click("#enterBtn",{timeout:1500}).catch(()=>{});
console.log(await p.evaluate(()=>{ const H=innerHeight; const rows=[...document.querySelectorAll("main > section, main > div > section, #end")].map(s=>`${(s.id||s.className.split(" ")[0]).padEnd(12)} ${String(s.offsetHeight).padStart(6)}px  ${(s.offsetHeight/H).toFixed(1)} screens`); return rows.join("\n")+`\nTOTAL ${document.documentElement.scrollHeight}px = ${(document.documentElement.scrollHeight/H).toFixed(1)} screens`; }));
await b.close();
