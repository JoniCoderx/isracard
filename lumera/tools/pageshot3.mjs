import { chromium } from "playwright-core";
const dir = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
async function run(tag, vp, ids) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 });
  const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type()==="error" && !/ERR_CONNECTION/.test(m.text())) errs.push(m.text().slice(0,160)); });
  await p.goto("file://" + dir + "/silavu.html", { waitUntil: "load" });
  await p.waitForTimeout(1500); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(4500);
  for (const id of ids) {
    await p.evaluate((id) => { const el = document.getElementById(id); const r = el.getBoundingClientRect(); window.scrollTo(0, scrollY + r.top + r.height*0.55 - innerHeight*0.5); }, id);
    await p.waitForTimeout(5000);
    await p.screenshot({ path: `${dir}/gem/${tag}-${id}.png` });
  }
  console.log(tag, "errors:", errs.length ? [...new Set(errs)].slice(0,4) : "none");
  await p.close();
}
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ["ch-line","ch-riv","ch-star"];
await run("desk", { width: 1440, height: 900 }, ids);
await run("mob", { width: 390, height: 844 }, ids);
await b.close();
