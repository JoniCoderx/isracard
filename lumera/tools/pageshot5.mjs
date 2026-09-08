// Capture the SILAVU artifact at named scroll stops on desktop + phone (+ Hebrew pass).
// Usage: node tools/pageshot5.mjs [lang=en|he] [stop ...]   stop = id or id@fraction (fraction of the pinned scroll)
import { chromium } from "playwright-core";
const dir = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad";
const args = process.argv.slice(2);
const lang = args[0] && /^(en|he)$/.test(args[0]) ? args.shift() : "en";
const only = process.env.ONLY || "";            // "desk" | "mob" | ""
const query = process.env.QUERY || "";          // e.g. "?nogl=1" or "?q=0.3"
const suffix = process.env.SUFFIX || "";
const stops = args.length ? args : ["film-sec@0", "film-sec@0.45", "film-sec@0.92", "statement", "macro@0.3", "macro@0.85", "rare", "ch-ring", "ch-line", "ch-riv", "ch-star", "ch-sapphire", "bespoke", "concierge", "end"];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
async function run(tag, vp) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 });
  const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error" && !/ERR_CONNECTION/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await p.goto("file://" + dir + "/silavu.html" + query, { waitUntil: "load" });
  await p.waitForTimeout(1200);
  if (lang === "he") await p.click("#langBtn2");
  await p.click("#enterBtn").catch(() => {}); await p.waitForTimeout(3500);
  for (const s of stops) {
    const [id, fr] = s.split("@");
    await p.evaluate(([id, fr]) => {
      const el = document.getElementById(id); const r = el.getBoundingClientRect(); const top = scrollY + r.top;
      if (fr != null) window.scrollTo(0, top + (r.height - innerHeight) * Number(fr));
      else window.scrollTo(0, top + r.height * 0.55 - innerHeight * 0.5);
    }, [id, fr]);
    await p.waitForTimeout(3800);
    await p.screenshot({ timeout: 180000, path: `${dir}/gem/${tag}-${lang}-${id}${fr != null ? "-" + fr : ""}${suffix}.png` });
  }
  console.log(tag, lang, "errors:", errs.length ? [...new Set(errs)].slice(0, 5) : "none");
  await p.close();
}
if (only !== "mob") await run("desk", { width: 1440, height: 900 });
if (only !== "desk") await run("mob", { width: 390, height: 844 });
await b.close();
