import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
const bad = []; p.on("response", r => { if (r.status() >= 400 && /f\/film/.test(r.url())) bad.push(r.status() + " " + r.url().split("/").pop()); });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2600); await p.click("#enterBtn").catch(()=>{});
await p.waitForTimeout(900);
await p.evaluate(async () => { const s = Math.round(innerHeight*0.5); for (let y=0;y<document.body.scrollHeight;y+=s){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,160));} });
const top = await p.evaluate(() => document.getElementById("film").offsetTop);
console.log(await p.evaluate(() => { const f=document.getElementById("filmpin"); const cs=getComputedStyle(f); const st=document.querySelector("#film .fstick"); const cs2=getComputedStyle(st); return "fpin computed height=" + cs.height + " maxh=" + cs.maxHeight + " | fstick pos=" + cs2.position + " h=" + cs2.height + " top=" + cs2.top + " | svh=" + innerHeight; }));
for (const d of [-200, 0, 300, 600, 900]) {
  await p.evaluate(y => scrollTo({ top: y, behavior: "instant" }), top + d);
  await p.waitForTimeout(700);
  console.log(d, await p.evaluate(() => {
    const c = document.getElementById("filmcv");
    const r = c.getBoundingClientRect();
    const x = c.getContext("2d");
    let ink = "n/a";
    try { const dd = x.getImageData(0,0,c.width,c.height).data; let n=0; for (let i=0;i<dd.length;i+=4000) if (dd[i]+dd[i+1]+dd[i+2] > 60) n++; ink = n + "/" + Math.round(dd.length/4000); } catch(e) { ink = "ERR"; }
    const pin = document.getElementById("filmpin").getBoundingClientRect();
    const con = document.getElementById("concierge").getBoundingClientRect();
    return `canvas ${c.width}x${c.height} box top=${Math.round(r.top)} h=${Math.round(r.height)} lit=${ink} | pin top=${Math.round(pin.top)} h=${Math.round(pin.height)} | form top=${Math.round(con.top)}`;
  }));
}
console.log("film 404s:", bad.length, bad.slice(0,3).join(" "));
await b.close();
