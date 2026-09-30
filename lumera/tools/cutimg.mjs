import { chromium } from "playwright-core"; import fs from "fs";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/cut/"; fs.mkdirSync(OUT, { recursive: true });
const gl = process.argv[2] !== "nogl", mob = process.argv[3] === "m";
const args = ["--no-sandbox"].concat(gl ? ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] : ["--disable-gpu","--disable-webgl","--disable-3d-apis"]);
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args });
const ctx = await b.newContext(mob ? { viewport:{width:390,height:844}, deviceScaleFactor:2, hasTouch:true } : { viewport:{width:1440,height:900} });
const p = await ctx.newPage(); const errs=[]; p.on("pageerror", e=>errs.push(e.message.slice(0,160)));
await p.goto("http://127.0.0.1:8777/", { waitUntil:"load" }); await p.waitForTimeout(2500); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(800);
await p.evaluate(() => window.scrollTo({ top: scrollY + document.getElementById("stripwrap").getBoundingClientRect().top - 90, behavior:"instant" })); await p.waitForTimeout(2500);
const wrap = await p.$("#stripwrap"); const tag=(gl?"gl":"nogl")+(mob?"-m":"-d");
const info = async () => p.evaluate(() => ({ no3d: document.documentElement.classList.contains("no3d"), vis: [...document.querySelectorAll("#stripwrap > *")].filter(e=>getComputedStyle(e).display!=="none" && e.getBoundingClientRect().height>10).map(e=>e.id||e.className) , spec: window.__lineSpec && window.__lineSpec.cut }));
console.log("round", JSON.stringify(await info())); await wrap.screenshot({ path: OUT+tag+"-round.png" });
for (const c of ["emerald","pear"]) { await p.evaluate(c => document.querySelector('.chip[data-k="cut"][data-v="'+c+'"]').click(), c); await p.waitForTimeout(1800); console.log(c, JSON.stringify(await info())); await wrap.screenshot({ path: OUT+tag+"-"+c+".png" }); }
await p.evaluate(() => document.querySelector('.vtb[data-view="wrist"]')?.click()); await p.waitForTimeout(2500); await wrap.screenshot({ path: OUT+tag+"-wrist.png" });
console.log("errors", errs); await b.close();
