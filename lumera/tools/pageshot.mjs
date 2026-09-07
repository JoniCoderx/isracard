import { chromium } from "playwright-core";
const dir = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
async function run(tag, vp) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 });
  const errs = [];
  p.on("console", m => { if (m.type()==="error") errs.push(m.text().slice(0,200)); });
  p.on("pageerror", e => errs.push("PAGEERR " + e.message));
  await p.goto("file://" + dir + "/silavu.html", { waitUntil: "load" });
  await p.waitForTimeout(2600);
  await p.screenshot({ path: `${dir}/gem/${tag}-0-intro.png` });
  await p.click("#enterBtn").catch(()=>{});
  await p.waitForTimeout(3500);
  await p.screenshot({ path: `${dir}/gem/${tag}-1-hero.png` });
  for (const [id, n] of [["ch-ring","2-ring"],["ch-line","3-line"],["ch-riv","4-riv"],["ch-star","5-star"],["ch-sapphire","6-sapphire"]]) {
    await p.evaluate(id => { const el = document.getElementById(id); const r = el.getBoundingClientRect(); window.scrollTo(0, scrollY + r.top + r.height*0.55 - innerHeight*0.5); }, id);
    await p.waitForTimeout(3200);
    await p.screenshot({ path: `${dir}/gem/${tag}-${n}.png` });
  }
  console.log(tag, "errors:", errs.length ? [...new Set(errs)].slice(0,5) : "none");
  await p.close();
}
await run("desk", { width: 1440, height: 900 });
await run("mob", { width: 390, height: 844 });
await b.close();
