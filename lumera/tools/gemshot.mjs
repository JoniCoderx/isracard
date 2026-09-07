import { chromium } from "playwright-core";
const dir = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/gem";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport:{ width:1280, height:720 } });
p.on("console", m => { if (m.type()==="error") console.log("CONSOLE", m.text().slice(0,300)); });
for (const [name, q] of [["gem-hq","?q=1"], ["gem-sapphire","?q=1&sapphire=1"]]) {
  await p.goto("file://" + dir + "/gem.html" + q, { waitUntil:"load" });
  await p.waitForTimeout(6000);
  await p.screenshot({ path: dir + "/" + name + ".png" });
  console.log("title:", await p.title(), "->", name);
}
await b.close();
