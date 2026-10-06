// The enquiry sent through FormSubmit (simulated: nothing leaves the machine): payload, auto-reply, thank-you card, retry on failure.
import { chromium } from "playwright-core";
const S = "/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/";
const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let fails = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
for (const [path, w, mob, mode] of [["", 1440, false, "ok"], ["he/", 390, true, "ok"], ["", 1440, false, "fail"]]) {
  const p = await br.newPage({ viewport: { width: w, height: mob ? 844 : 900 }, isMobile: mob });
  let sent = null;
  await p.route("**/formsubmit.co/**", async r => { sent = { url: r.request().url(), body: JSON.parse(r.request().postData()) }; await r.fulfill(mode === "ok" ? { status: 200, contentType: "application/json", body: '{"success":"true","message":"The form was submitted successfully."}' } : { status: 200, contentType: "application/json", body: '{"success":"false","message":"Activate"}' }); });
  await p.route(/localhost:8777\/(he\/)?(index\.html)?$/, async r => { const res = await r.fetch(); const t = (await res.text()).replace(/data-to="[^"]*"/, 'data-to="house@example.com"'); await r.fulfill({ response: res, body: t }); });
  await p.goto("http://localhost:8777/" + path, { waitUntil: "load" });
  await p.waitForFunction(() => !document.documentElement.classList.contains("locked"), null, { timeout: 20000 }).catch(() => {});
  const tag = `${path || "en"} ${w} ${mode}`;
  await p.evaluate(() => document.getElementById("cform").scrollIntoView({ block: "center", behavior: "instant" })); await p.waitForTimeout(600);
  ok(/send|שליחת/i.test(await p.textContent("#csend")), `${tag}: the button says it sends (${(await p.textContent("#csend")).trim()})`);
  await p.fill("#fName", "Dana Levi"); await p.fill("#fCity", "Tel Aviv"); await p.fill("#fContact", "dana@example.com"); await p.fill("#fMsg", "A tennis bracelet, 17 cm.");
  await p.click(".want .chip >> nth=0");
  await p.click("#csend"); await p.waitForTimeout(1600);
  ok(sent && /formsubmit\.co\/ajax\/house%40example\.com/.test(sent.url), `${tag}: posted to the house inbox`);
  ok(sent && sent.body.email === "dana@example.com" && /SILAVU/.test(sent.body._autoresponse || "") && /Dana Levi/.test(sent.body._subject), `${tag}: auto-reply to the reader and a clear subject`);
  if (mode === "ok") {
    const st = await p.evaluate(() => ({ cls: document.getElementById("cform").className, h: document.getElementById("cthh").textContent, t: document.getElementById("cthp").textContent, vis: getComputedStyle(document.getElementById("cthanks")).display, fields: getComputedStyle(document.querySelector("#cform .fields")).display }));
    ok(st.vis === "grid" && st.fields === "none", `${tag}: the form gives way to the thank-you card`);
    ok(/Dana/.test(st.h) && /dana@example\.com/.test(st.t), `${tag}: the card names the reader and where the confirmation went: "${st.h}" / "${st.t}"`);
    await p.waitForTimeout(1200); await p.screenshot({ path: S + `thanks-${path ? "he" : "en"}.jpg`, quality: 65, clip: await p.evaluate(() => { const r = document.getElementById("cthanks").getBoundingClientRect(); return { x: Math.max(0, r.left - 30), y: Math.max(0, r.top - 30), width: Math.min(innerWidth - Math.max(0, r.left - 30), r.width + 60), height: r.height + 60 }; }) });
    await p.click("#cthAgain"); ok(await p.evaluate(() => !document.getElementById("cform").classList.contains("delivered") && document.getElementById("fName").value === "Dana Levi"), `${tag}: "write another" brings the form back, name kept`);
  } else {
    const st = await p.evaluate(() => ({ err: !document.getElementById("cerr").hidden, del: document.getElementById("cform").classList.contains("delivered"), msg: document.getElementById("fMsg").value }));
    ok(st.err && !st.del && st.msg, `${tag}: a refusal says so, keeps everything typed, offers email`);
  }
  await p.close();
}
await br.close(); console.log(fails ? fails + " FAILED" : "all passed"); process.exit(fails ? 1 : 0);
