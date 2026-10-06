// The storefront with the backend connected, in a real browser: the form is
// only "sent" when the backend confirms it, a retry saves once, the counter
// asks first and sends nothing before a yes, a no stops it, and the admin's
// own browser is never counted. The backend is simulated at the network
// edge; nothing leaves the machine.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(new URL("../../../package.json", import.meta.url));
const { chromium } = require("playwright-core");

const SITE = new URL("..", import.meta.url).pathname, FN = "https://fn.silavu.test/functions/v1";
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "silavu-sf-")), DIST = path.join(TMP, "dist"), PAGE = SITE + "silavu-page.test-sf-" + process.pid + ".html";
let server, base, browser;

before(async () => {
  const env = { ...process.env, SILAVU_FUNCTIONS_URL: FN, SILAVU_PAGE_OUT: PAGE, SILAVU_RELEASE: path.join(TMP, "none.json") };
  execFileSync("node", ["build.mjs"], { cwd: SITE + "src", env, stdio: "pipe" });
  execFileSync("node", ["gen-static.mjs", PAGE, DIST, "http://127.0.0.1/"], { cwd: SITE, env, stdio: "pipe" });
  fs.cpSync(SITE + "public", DIST, { recursive: true });
  server = http.createServer((q, s) => {
    let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
    const f = path.join(DIST, p);
    if (!f.startsWith(DIST) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
    const t = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" }[path.extname(f)] || "application/octet-stream";
    s.writeHead(200, { "content-type": t }); fs.createReadStream(f).pipe(s);
  });
  await new Promise(r => server.listen(0, "127.0.0.1", r)); base = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
});
after(async () => { await browser?.close(); server?.close(); fs.rmSync(PAGE, { force: true }); });

async function open({ staff = false, gpc = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(([s, g]) => { localStorage.setItem("silavu-seen", "1"); if (s) localStorage.setItem("silavu-staff", "1"); if (g) Object.defineProperty(navigator, "globalPrivacyControl", { get: () => true }); }, [staff, gpc]);
  const page = await ctx.newPage(), hits = { collect: [], enquiry: [] };
  let enquiryReply = (body) => ({ status: 200, body: { ok: true, id: "e1", ref: "E-2610-0042", duplicate: false, confirmation: false } });
  await page.route(FN + "/**", async (route) => {
    const u = route.request().url(), body = route.request().postData();
    if (u.endsWith("/collect")) { hits.collect.push(...JSON.parse(body).events); return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*" } }); }
    if (u.endsWith("/enquiry")) { const b = JSON.parse(body); hits.enquiry.push(b); const r = enquiryReply(b); return route.fulfill({ status: r.status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(r.body) }); }
    route.fulfill({ status: 404 });
  });
  await page.goto(base, { waitUntil: "load" });
  return { ctx, page, hits, setReply: (f) => { enquiryReply = f; } };
}
const flush = (page) => page.evaluate(() => { document.dispatchEvent(new Event("visibilitychange")); }).then(() => page.waitForTimeout(4500));

test("the counter asks first, and sends nothing before a yes", async () => {
  const { ctx, page, hits } = await open();
  await page.waitForSelector("#consent", { timeout: 15000 });
  await page.waitForTimeout(5000);
  assert.equal(hits.collect.length, 0, "nothing before an answer");
  await page.click('#consent [data-c="yes"]');
  await page.waitForTimeout(4600);
  const pv = hits.collect.find(e => e.name === "page_view");
  assert.ok(pv, "a page view once allowed");
  assert.match(pv.sid, /^[A-Za-z0-9_-]{16}$/); assert.ok(pv.vid, "a returning-visit id with consent");
  assert.ok(!JSON.stringify(hits.collect).includes("?"), "no query strings");
  await ctx.close();
});

test("a no stops it, and Global Privacy Control is a no", async () => {
  const a = await open();
  await a.page.waitForSelector("#consent"); await a.page.click('#consent [data-c="no"]');
  await a.page.click(".pgrid .piece:not(.soon) .fig").catch(() => {});
  await a.page.waitForTimeout(4600);
  assert.equal(a.hits.collect.length, 0);
  assert.equal(await a.page.evaluate(() => localStorage.getItem("silavu-vid")), null);
  await a.ctx.close();
  const g = await open({ gpc: true });
  await g.page.waitForTimeout(3000);
  assert.equal(await g.page.$("#consent"), null, "not asked again: GPC already said no");
  await g.page.waitForTimeout(2000);
  assert.equal(g.hits.collect.length, 0);
  await g.ctx.close();
});

test("the admin's own browser is never counted", async () => {
  const { ctx, page, hits } = await open({ staff: true });
  await page.waitForTimeout(3000);
  assert.equal(await page.$("#consent"), null);
  assert.equal(hits.collect.length, 0);
  await ctx.close();
});

test("the enquiry: sent only when the backend confirms; a retry saves once; field errors are named", async () => {
  const { ctx, page, hits, setReply } = await open();
  await page.evaluate(() => { const c = document.querySelector("#consent"); if (c) c.remove(); document.getElementById("concierge").scrollIntoView(); });
  await page.waitForTimeout(800);
  await page.fill("#fName", "Dana Levi"); await page.fill("#fContact", "dana@example.com"); await page.fill("#fCity", "Tel Aviv");
  // first the backend is down
  setReply(() => ({ status: 503, body: { error: "server" } }));
  await page.click("#csend"); await page.waitForTimeout(800);
  assert.equal(await page.evaluate(() => document.getElementById("cform").classList.contains("delivered")), false, "no thank-you without a saved record");
  assert.match(await page.textContent("#cerr"), /could not be sent/);
  // then it answers: the same key is sent again
  setReply(() => ({ status: 200, body: { ok: true, id: "e1", ref: "E-2610-0042", duplicate: false, confirmation: false } }));
  await page.click("#csend"); await page.waitForTimeout(800);
  assert.equal(hits.enquiry.length, 2); assert.equal(hits.enquiry[0].idem, hits.enquiry[1].idem);
  assert.ok(await page.evaluate(() => document.getElementById("cform").classList.contains("delivered")));
  const thanks = await page.textContent("#cthp");
  assert.match(thanks, /E-2610-0042/);
  assert.ok(!/confirmation is on its way/.test(thanks), "no promise of an email that was not sent");
  assert.equal(hits.enquiry[1].email, "dana@example.com");
  assert.ok(!("text" in hits.enquiry[1]));
  // a new enquiry gets a new key; a refused email is shown at the field
  await page.click("#cthAgain").catch(() => {});
  setReply(() => ({ status: 400, body: { error: "invalid", fields: ["email"] } }));
  await page.fill("#fContact", "dana@example.com"); await page.click("#csend"); await page.waitForTimeout(600);
  assert.notEqual(hits.enquiry[2].idem, hits.enquiry[0].idem);
  assert.equal(await page.getAttribute("#fContact", "aria-invalid"), "true");
  await ctx.close();
});

test("the privacy page says what this build does", async () => {
  const t = fs.readFileSync(path.join(DIST, "privacy/index.html"), "utf8");
  assert.match(t, /saved in the house's own records/); assert.match(t, /If you allow it, the site counts your visit anonymously/);
  assert.ok(!t.includes("FormSubmit"));
  const piece = fs.readFileSync(path.join(DIST, "pieces/knot/index.html"), "utf8");
  assert.match(piece, /window\.SILAVU_TRACK=/); assert.match(piece, /assets\/track\.[0-9a-f]{10}\.js/);
});
