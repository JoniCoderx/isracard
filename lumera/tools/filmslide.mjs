import { chromium } from "playwright-core";
const S = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/";
const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let fails = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
for (const [path, w, h] of [["pieces/pave/", 1440, 900], ["pieces/pave/", 390, 844], ["he/pieces/pave/", 1440, 900]]) {
  const p = await br.newPage({ viewport: { width: w, height: h } }); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("http://localhost:8777/" + path, { waitUntil: "load" }); await p.waitForTimeout(1800);
  const st = await p.evaluate(() => { const v = document.querySelector(".ppvid"); return { src: v && v.currentSrc, paused: v && v.paused, slides: document.querySelectorAll(".pptrack > li").length, thumbs: document.querySelectorAll(".ppth").length, dots: document.querySelectorAll(".ppdots i").length }; });
  ok(st.src && /soul-film(-720)?\.mp4$/.test(st.src) && (w < 900 ? /-720/.test(st.src) : !/-720/.test(st.src)), `${path} ${w}: film loaded at the right size (${st.src && st.src.split("/").pop()})`);
  const h264 = await p.evaluate(() => document.createElement("video").canPlayType("video/mp4; codecs=\"avc1.42E01E\""));
  if (h264) ok(!st.paused, `${path} ${w}: playing as the first slide`); else console.log(`skip ${path} ${w}: this test browser has no H.264, so it cannot play an mp4 (real browsers do)`);
  ok(st.slides === 5 && st.thumbs === 5 && st.dots === 5, `${path} ${w}: film + 4 photographs (${st.slides}/${st.thumbs}/${st.dots})`);
  if (w > 900) await p.screenshot({ path: S + `film-page-${path.startsWith("he") ? "he" : "en"}.jpg`, quality: 60 });
  await p.click(".ppstage .ppnext"); await p.waitForTimeout(900);
  ok(await p.evaluate(() => document.querySelector(".ppvid").paused), `${path} ${w}: next photograph pauses the film`);
  await p.click(".pptrack > li:nth-child(2) .ppzoom"); await p.waitForTimeout(500);
  const lb = await p.evaluate(() => ({ open: !document.getElementById("ppbox").hidden, src: document.querySelector("#ppbox img").getAttribute("src"), cnt: document.querySelector("#ppbox .ppcount").textContent }));
  ok(lb.open && /necklace/.test(lb.src) && /1 \/ 4/.test(lb.cnt), `${path} ${w}: the enlarged view shows the photographs (${lb.cnt})`);
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  ok(!errs.length, `${path} ${w}: no page errors ${errs.join(" | ")}`); await p.close(); }
await br.close(); console.log(fails ? fails + " FAILED" : "all passed");
