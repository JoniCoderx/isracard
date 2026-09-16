import { chromium } from "playwright-core";
const out = process.argv[2] || "/tmp/shots";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [tag, vp] of [["d",{width:1440,height:900}],["m",{width:390,height:844}]]) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 }); await p.emulateMedia({ reducedMotion: "reduce" });
  await p.goto("http://127.0.0.1:8765/index.html", { waitUntil:"load" }); await p.waitForTimeout(1200); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(700);
  const go = (y) => window.scrollTo({ top: y, left: 0, behavior: "instant" });
  const at = async (name, fn) => { await p.evaluate(fn); await p.waitForTimeout(900); await p.screenshot({ path: `${out}/${tag}-${name}.png` }); };
  await p.screenshot({ path: `${out}/${tag}-hero.png` });
  await at("what", () => window.scrollTo({ top: scrollY + document.getElementById("what").getBoundingClientRect().top - 40, behavior: "instant" }));
  await at("stone", () => { const pin = document.getElementById("stonepin"); window.scrollTo({ top: scrollY + pin.getBoundingClientRect().top + (pin.offsetHeight - innerHeight) * 0.38, behavior: "instant" }); });
  await at("stone2", () => { const pin = document.getElementById("stonepin"); window.scrollTo({ top: scrollY + pin.getBoundingClientRect().top + (pin.offsetHeight - innerHeight) * 0.92, behavior: "instant" }); });
  await at("specs", () => window.scrollTo({ top: scrollY + document.getElementById("dossier").getBoundingClientRect().top - 300, behavior: "instant" }));
  await at("coll", () => { const h = document.getElementById("hpin"); window.scrollTo({ top: scrollY + h.getBoundingClientRect().top + Math.max(0, h.offsetHeight - innerHeight) * 0.35, behavior: "instant" }); });
  await at("build", () => window.scrollTo({ top: scrollY + document.getElementById("build").getBoundingClientRect().top - 30, behavior: "instant" }));
  await at("conf", () => window.scrollTo({ top: scrollY + document.getElementById("configure").getBoundingClientRect().top - 60, behavior: "instant" }));
  await at("clients", () => window.scrollTo({ top: scrollY + document.getElementById("clients").getBoundingClientRect().top + 300, behavior: "instant" }));
  await at("partners", () => window.scrollTo({ top: scrollY + document.getElementById("partners").getBoundingClientRect().top - 30, behavior: "instant" }));
  await at("end", () => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
  await p.close();
}
await b.close();
