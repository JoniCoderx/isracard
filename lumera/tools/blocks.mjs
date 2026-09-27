import { chromium } from "playwright-core";
const W = Number(process.argv[2]||390), H = Number(process.argv[3]||844);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: W, height: H }, isMobile: W<900, hasTouch: W<900, deviceScaleFactor: 1 });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2400); await p.click("#enterBtn").catch(()=>{});
await p.waitForTimeout(700);
await p.evaluate(async () => { const s=Math.round(innerHeight*0.6); for(let y=0;y<document.body.scrollHeight;y+=s){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,110));} scrollTo({top:0,behavior:"instant"}); });
await p.waitForTimeout(400);
const ids = process.argv.slice(4);
for (const id of ids) {
  const r = await p.evaluate(sel => {
    const s = document.querySelector(sel); if (!s) return "missing";
    const cs = getComputedStyle(s);
    const out = [`${sel} h=${Math.round(s.getBoundingClientRect().height)} padT=${cs.paddingTop} padB=${cs.paddingBottom}`];
    for (const c of s.children) {
      const b = c.getBoundingClientRect(); const k = getComputedStyle(c);
      out.push(`   <${c.tagName.toLowerCase()}${c.id?"#"+c.id:""}${c.className&&typeof c.className==="string"?"."+c.className.trim().split(/\s+/).join("."):""} h=${Math.round(b.height)} mT=${k.marginTop} mB=${k.marginBottom} pT=${k.paddingTop} pB=${k.paddingBottom}`);
    }
    return out.join("\n");
  }, id);
  console.log(r); console.log("");
}
await b.close();
