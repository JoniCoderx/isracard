import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2400); await p.click("#enterBtn").catch(()=>{});
await p.waitForTimeout(700);
await p.evaluate(async () => { const s=Math.round(innerHeight*0.6); for(let y=0;y<document.body.scrollHeight;y+=s){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,120));} });
const base = await p.evaluate(()=>document.getElementById("film").offsetTop);
for (const d of [-300,0,200,400,600,800]) {
  await p.evaluate(y=>scrollTo({top:y,behavior:"instant"}), base+d);
  await p.waitForTimeout(400);
  const r = await p.evaluate(()=>{
    const t=document.querySelector("#film .ftxt"), c=document.querySelector("#film canvas"), g=document.querySelector("#film .fgrade"), f=document.getElementById("concierge");
    const bb=e=>e?(e.getBoundingClientRect()):null;
    const o=e=>e?getComputedStyle(e).opacity:"-";
    const tb=bb(t), cb=bb(c), fb=bb(f);
    return {ftxt: tb?`top=${Math.round(tb.top)} h=${Math.round(tb.height)} op=${o(t)} txt=${(t.innerText||"").slice(0,40).replace(/\n/g," ")}`:"none",
            canvas: cb?`top=${Math.round(cb.top)} h=${Math.round(cb.height)}`:"none",
            grade: g?o(g):"none", form: fb?`top=${Math.round(fb.top)}`:"none"};
  });
  console.log(d, JSON.stringify(r));
}
await b.close();
