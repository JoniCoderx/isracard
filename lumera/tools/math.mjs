import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
await p.waitForTimeout(3000); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
await p.evaluate(()=>{const e=document.getElementById("build");window.scrollTo({top:scrollY+e.getBoundingClientRect().top,behavior:"instant"});});
await p.waitForTimeout(700);
await p.evaluate(()=>{const t=[...document.querySelectorAll("#build a,#build button")].find(e=>/START DESIGNING/i.test(e.textContent));t&&t.click();});
await p.waitForTimeout(4500);
console.log("wrist  ct   | displayed              | spec n  each   mm    gap   | rendered | closes?");
for (const [wrist,ct] of [[15,2],[17,6],[20,20],[15,20],[20,2]]) {
  await p.evaluate(([w,c])=>{
    const wb=[...document.querySelectorAll('.chip[data-k="wrist"]')].find(x=>x.getAttribute("data-v")==String(w)); wb&&wb.click();
    const cb=[...document.querySelectorAll('.chip[data-k="ct"]')].find(x=>x.getAttribute("data-v")==String(c)); cb&&cb.click();
  },[wrist,ct]);
  await p.waitForTimeout(1800);
  const r = await p.evaluate(()=>{
    const sp=window.__lineSpec||{};
    const shown=(document.getElementById("sumStones")||{}).textContent||"";
    const each=(document.getElementById("eachCt")||{}).textContent||"";
    const lbl=(document.getElementById("eachLbl")||{}).textContent||"";
    const drawn=(window.__bstones!==undefined)?window.__bstones:(sp.n||"?");
    const span=sp.n*(sp.alongMm+sp.gapMm);
    return {shown:shown.trim(), each:each.trim(), lbl:lbl.trim(), n:sp.n, e:sp.each, L:sp.alongMm, g:sp.gapMm, len:sp.lenMm, span, drawn};
  });
  const closes = Math.abs(r.span - r.len) < 0.6;
  console.log(String(wrist).padStart(4)+"cm "+String(ct).padStart(2)+"ct | "+r.shown.padEnd(22)+" | "
    +String(r.n).padStart(3)+"  "+(r.e||0).toFixed(3)+"  "+(r.L||0).toFixed(2)+"  "+(r.g||0).toFixed(2)
    +" | "+String(r.drawn).padStart(3)+"      | "+(closes?"yes":"NO  span="+(r.span||0).toFixed(1)+" len="+r.len));
}
await b.close();
