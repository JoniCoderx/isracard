import { chromium } from "playwright-core";
import { execSync } from "child_process";
const bg = process.argv[2] || "#e9e5dc";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--disable-background-networking","--disable-component-update"] });
const lum = (r,g,b) => { const f=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4)}; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
const ctx = await b.newContext({ viewport:{width:1440,height:900} }); await ctx.addInitScript(() => { localStorage.setItem("silavu-seen","1"); localStorage.setItem("silavu-lang","en"); });
const p = await ctx.newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/, r=>r.abort());
await p.goto("http://127.0.0.1:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(2500);
await p.addStyleTag({ content:`#hero .hv, #herovid, #heroimg { visibility:hidden !important } #hero { background:${bg} !important }` }); await p.waitForTimeout(400);
const els = await p.evaluate(()=>[...document.querySelectorAll("header.sh nav a, header.sh #langBtn, header.sh .btn")].filter(e=>e.offsetParent).map((e,i)=>{ e.setAttribute("data-nc",i); const s=getComputedStyle(e); return {i, t:e.textContent.trim(), c:s.color}; }));
await p.addStyleTag({ content:"[data-nc]{color:transparent!important;text-shadow:none!important}" }); await p.waitForTimeout(300);
let min=99;
for (const e of els) { const h=await p.$(`[data-nc="${e.i}"]`); await h.screenshot({path:"/tmp/nc.png"});
  const px = execSync("python3 -c \"from PIL import Image; im=Image.open('/tmp/nc.png').convert('RGB').resize((30,10)); print(chr(10).join(' '.join(map(str,im.getpixel((x,y)))) for y in range(10) for x in range(30)))\"").toString().trim().split("\n").map(l=>l.split(" ").map(Number));
  const m=e.c.match(/[\d.]+/g).map(Number), Lt=lum(m[0],m[1],m[2]); const Ls=px.map(q=>lum(...q)).sort((a,b)=>a-b); const worst=Ls[Math.floor(Ls.length*0.9)];
  const cr=(Lt+0.05)/(worst+0.05); min=Math.min(min,cr); console.log(e.t.padEnd(12), "p90 bg contrast", cr.toFixed(2)); }
console.log("background", bg, "minimum", min.toFixed(2), min>=4.5?"PASS":"FAIL"); await b.close();
