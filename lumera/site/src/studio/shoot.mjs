import { chromium } from "/home/user/isracard/lumera/node_modules/playwright-core/index.mjs";
import fs from "node:fs";
const S = new URL(".", import.meta.url).pathname, frames = process.argv.slice(2), widths = frames.length && /^\d+$/.test(frames[0]) ? [Number(frames.shift())] : [800, 1200, 1600, 2000];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const list = frames.length ? frames : fs.readdirSync(S + "out").filter((f) => f.endsWith(".html")).map((f) => f.slice(0, -5));
for (const k of list) for (const w of widths) {
  const p = await b.newPage({ viewport: { width: w, height: Math.round(w * 1.25) }, deviceScaleFactor: 1 });
  await p.goto("file://" + S + "out/" + k + ".html"); await p.waitForTimeout(150);
  await p.screenshot({ path: S + "out/" + k + "-" + w + ".jpg", type: "jpeg", quality: 86 }); await p.close();
}
await b.close(); console.log("shot", list.join(" "), widths.join(","));
