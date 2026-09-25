import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2400); await p.click("#enterBtn").catch(()=>{});
await p.waitForTimeout(900);
console.log(await p.evaluate(() => {
  const out = [];
  [...document.querySelectorAll("#collection .pgrid .piece")].slice(0,3).forEach((c,i) => {
    const r=c.getBoundingClientRect();
    const g=(sel)=>{ const e=c.querySelector(sel); if(!e) return sel+": none";
      const q=e.getBoundingClientRect(), cs=getComputedStyle(e);
      return `${sel}: top+${Math.round(q.top-r.top)} h${Math.round(q.height)} mt${cs.marginTop} pt${cs.paddingTop} lh${cs.lineHeight} disp${cs.display} fam${cs.fontFamily.split(",")[0]}`; };
    out.push(`CARD ${i+1} ${c.className}`);
    ["  .fig", "  .bd", "  .k.sig", "  .k.sig span", "  .t"].forEach(s => out.push("   " + g(s.trim())));
  });
  return out.join("\n");
}));
await b.close();
