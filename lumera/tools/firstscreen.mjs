/* What a phone has to fetch before the opening screen is there. Throttled to a
   mid-range phone on 4G: 6x CPU, 9Mbps down, 170ms round trip. */
import { chromium } from "playwright-core";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); c ? pass++ : fail++; };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const cdp = await p.context().newCDPSession(p);
await cdp.send("Network.enable");
await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 170, downloadThroughput: 9 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
const bytes = [];
p.on("response", async r => { const h = r.headers(); bytes.push({ url: r.url().replace(/^https?:\/\/[^/]+/, ""), n: Number(h["content-length"] || 0), type: (h["content-type"] || "").split(";")[0] }); });
const t0 = Date.now();
await p.goto("http://127.0.0.1:8777/", { waitUntil: "load" });
const tLoad = Date.now() - t0;
const paint = await p.evaluate(() => { const e = performance.getEntriesByType("paint").find(x => x.name === "first-contentful-paint"); return e ? Math.round(e.startTime) : -1; });
await p.waitForTimeout(5000);
/* the browser's own timeline, not a snapshot taken from outside it: when did
   the video request start, relative to the first paint and to load? */
const tl = await p.evaluate(() => {
  const nav = performance.getEntriesByType("navigation")[0] || {};
  const fcp = (performance.getEntriesByType("paint").find(x => x.name === "first-contentful-paint") || {}).startTime;
  const res = performance.getEntriesByType("resource");
  const v = res.filter(r => /\.mp4$/.test(r.name)).map(r => ({ url: r.name.replace(/^https?:\/\/[^/]+/, ""), start: Math.round(r.startTime) }));
  return { fcp: Math.round(fcp || -1), loadEnd: Math.round(nav.loadEventEnd || -1), videos: v,
    before: res.filter(r => r.startTime < (fcp || 0)).length,
    beforeKB: Math.round(res.filter(r => r.startTime < (fcp || 0)).reduce((s, r) => s + (r.transferSize || 0), 0) / 1024) };
});
console.log(`  first contentful paint ${tl.fcp}ms · load ${tl.loadEnd}ms (6x CPU, 9Mbps, 170ms RTT)`);
console.log(`  before the opening screen: ${tl.before} requests, ${tl.beforeKB} KB`);
tl.videos.forEach(v => console.log(`  video ${v.url} requested at ${v.start}ms`));
/* the video is low priority anyway, so "after the paint" is not much of a bar;
   what is worth holding is how little goes out before the opening screen */
ok(tl.beforeKB <= 40, `the opening screen costs under forty kilobytes (${tl.beforeKB} KB in ${tl.before} requests)`);
ok(tl.videos.every(v => v.start > tl.fcp), `no video is asked for before the opening screen (earliest ${Math.min(...tl.videos.map(v => v.start), Infinity)}ms vs paint ${tl.fcp}ms)`);
ok(tl.fcp > 0 && tl.fcp < 4000, `the opening screen is painted inside four seconds (${tl.fcp}ms)`);
const heroOn = await p.evaluate(() => !!document.getElementById("herovid").getAttribute("src"));
ok(heroOn, `and the loop is asked for afterwards (src set: ${heroOn})`);
console.log(`\n${pass} pass, ${fail} fail`);
await b.close();
process.exit(fail ? 1 : 0);
