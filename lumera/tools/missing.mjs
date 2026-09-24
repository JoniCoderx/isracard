/* Every file the phone asks for and does not get. The photographs are built
   in CI from a host this container cannot reach, so the local copy renders
   with holes where the pictures are — which hides exactly the layout問題 a
   walkthrough is for. List them, and they can be stood in for. */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const miss = new Set();
for (const [w, h, mob] of [[390, 844, true], [1440, 900, false]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, deviceScaleFactor: 2 });
  p.on("response", r => { if (r.status() === 404) miss.add(new URL(r.url()).pathname.replace(/^\//, "")); });
  await p.goto("http://127.0.0.1:8777/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2600); await p.click("#enterBtn").catch(() => {});
  await p.waitForTimeout(900);
  await p.evaluate(async () => { const s = Math.round(innerHeight * 0.55); for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 140)); } });
  await p.waitForTimeout(2500);
  await p.close();
}
console.log([...miss].sort().join("\n"));
