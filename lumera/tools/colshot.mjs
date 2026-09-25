import { chromium } from "playwright-core";
const OUT = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2600); await p.click("#enterBtn").catch(()=>{});
await p.waitForTimeout(900);
await p.evaluate(async () => { const s = Math.round(innerHeight*0.6); for (let y=0;y<document.body.scrollHeight;y+=s){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,120));} });
await p.evaluate(() => document.querySelector("#collection .pgrid").scrollIntoView({ block: "center", behavior: "instant" }));
await p.waitForTimeout(1200);
await (await p.$("#collection .pgrid")).screenshot({ path: `${OUT}/collection.png` });
console.log(await p.evaluate(() => {
  const cards=[...document.querySelectorAll("#collection .pgrid .piece")];
  return JSON.stringify(cards.map(c => {
    const r=c.getBoundingClientRect();
    const fig=c.querySelector(".fig, .sfig");
    const fr=fig?fig.getBoundingClientRect():null;
    const first = c.querySelector(".ref, .k, .pname, h3");
    const name = c.querySelector(".pname, h3, .nm");
    const box = e => { if (!e) return "-"; const q = e.getBoundingClientRect(); return Math.round(q.top - r.top) + "px from card top, h" + Math.round(q.height); };
    return { cls: String(c.className).replace("piece","").trim().slice(0,18),
      cardTop: Math.round(r.top), figTop: fr ? Math.round(fr.top - r.top) : "-", figH: fr ? Math.round(fr.height) : 0,
      figTag: fig ? fig.tagName + "." + String(fig.className).split(" ").slice(0,2).join(".") : "-",
      firstText: box(first), name: box(name) };
  }), null, 1);
}));
await b.close();
