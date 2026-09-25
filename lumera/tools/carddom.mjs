import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2400); await p.click("#enterBtn").catch(()=>{});
await p.waitForTimeout(900);
console.log(await p.evaluate(() => {
  const cards=[...document.querySelectorAll("#collection .pgrid .piece")].slice(0,2);
  return cards.map((c,i) => {
    const out=[];
    c.querySelectorAll("*").forEach(e => {
      if (e.children.length > 2) return;
      const r=e.getBoundingClientRect(), cs=getComputedStyle(e);
      if (r.height < 1) return;
      out.push(`  ${String(e.className||e.tagName).split(" ")[0].padEnd(12)} top+${Math.round(r.top - c.getBoundingClientRect().top)} h${Math.round(r.height)} fs${cs.fontSize} mt${cs.marginTop} "${(e.textContent||"").trim().slice(0,26)}"`);
    });
    return "CARD " + (i+1) + "\n" + out.slice(0,14).join("\n");
  }).join("\n\n");
}));
await b.close();
