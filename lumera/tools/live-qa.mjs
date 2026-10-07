// Read-only QA of the live site and admin. It never saves, publishes or
// sends anything: enquiry and visit-counting requests are blocked in the
// browser, the visit counter is switched off as for the house's own
// browsers, and the admin is only looked at.
//
//   QA_EMAIL=… QA_PASSWORD=… node lumera/tools/live-qa.mjs [out-dir]
//
// Without QA_EMAIL the admin part is skipped. Writes report.json and
// screenshots into out-dir (default ./qa-out).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(new URL("../../package.json", import.meta.url));
const { chromium } = require("playwright-core");

const BASE = (process.env.QA_BASE || "https://jonicoderx.github.io/isracard").replace(/\/$/, "");
const OUT = process.argv[2] || "qa-out"; fs.mkdirSync(OUT, { recursive: true });
const AXE = process.env.AXE_PATH;   // optional: path to axe.min.js for accessibility rules
const args = ["--no-sandbox"]; if (process.env.QA_CHROME_ARGS) args.push(...process.env.QA_CHROME_ARGS.split(" "));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args });
const report = { base: BASE, at: new Date().toISOString(), pages: [], interactions: [], admin: [], security: [], issues: [] };
const issue = (where, what) => { report.issues.push({ where, what }); console.log("ISSUE", where, "·", what); };
const VIEW = { desk: { width: 1366, height: 900 }, phone: { width: 390, height: 844, isMobile: true, hasTouch: true } };

async function ctx(view, { staff = true, lang } = {}) {
  const c = await browser.newContext({ viewport: { width: VIEW[view].width, height: VIEW[view].height }, isMobile: !!VIEW[view].isMobile, hasTouch: !!VIEW[view].hasTouch, locale: lang === "he" ? "he-IL" : "en-GB" });
  await c.addInitScript(([st]) => { try { localStorage.setItem("silavu-seen", "1"); if (st) localStorage.setItem("silavu-staff", "1"); } catch (e) {} }, [staff]);
  /* nothing leaves: no enquiry, no visit count */
  c.blocked = [];
  await c.route(/\/functions\/v1\/(enquiry|collect)$|formsubmit\.co/, r => { c.blocked.push(r.request().url()); r.abort(); });
  return c;
}
async function open(c, url) {
  const p = await c.newPage(); p.errs = []; p.bad = [];
  p.on("pageerror", e => p.errs.push(e.message.slice(0, 200)));
  p.on("console", m => { if (m.type() === "error" && !/ERR_FAILED|net::ERR_BLOCKED|Failed to load resource/.test(m.text())) p.errs.push("console: " + m.text().slice(0, 200)); });
  p.on("response", r => { if (r.status() >= 400 && !/favicon|no-such-page/.test(r.url())) p.bad.push(r.status() + " " + r.url()); });
  p.on("requestfailed", r => { const f = r.failure()?.errorText || ""; if (!/ERR_ABORTED|ERR_FAILED/.test(f) || !/functions\/v1|formsubmit/.test(r.url())) if (!/ERR_ABORTED/.test(f)) p.bad.push("failed " + r.url() + " " + f); });
  const res = await p.goto(url, { waitUntil: "load", timeout: 60000 }).catch(e => ({ status: () => 0, err: e.message }));
  p.status = res.status(); await p.waitForTimeout(1500);
  return p;
}
async function scrollThrough(p) { await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += Math.round(innerHeight * 0.8)) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); }); await p.waitForTimeout(1200); }
async function facts(p) {
  return p.evaluate(() => {
    const meta = (s) => document.querySelector(s)?.getAttribute("content") || document.querySelector(s)?.getAttribute("href") || "";
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => { try { JSON.parse(s.textContent); return "ok"; } catch (e) { return "bad"; } });
    const broken = [...document.images].filter(i => i.complete && i.naturalWidth === 0 && (i.getAttribute("src") || i.currentSrc) && getComputedStyle(i).display !== "none" && i.offsetParent !== null).map(i => i.getAttribute("src") || i.currentSrc);
    const noAlt = [...document.images].filter(i => !i.hasAttribute("alt")).length;
    return { title: document.title, lang: document.documentElement.lang, dir: document.documentElement.dir || getComputedStyle(document.documentElement).direction, desc: meta('meta[name="description"]'), canonical: meta('link[rel="canonical"]'), ogImage: meta('meta[property="og:image"]'), robots: meta('meta[name="robots"]'),
      hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(l => l.hreflang), ld, h1: document.querySelectorAll("h1").length, broken, noAlt, overflow: document.scrollingElement.scrollWidth - innerWidth };
  });
}
async function axe(p) {
  if (!AXE) return null;
  await p.addScriptTag({ path: AXE });
  return p.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"], runOnly: ["wcag2a", "wcag2aa"] })).violations.filter(v => ["serious", "critical"].includes(v.impact)).map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0]?.target?.join(" ") })));
}

/* ── 1. every page in the sitemap, plus the rest, on a desk and a phone ── */
const sitemap = await (await fetch(BASE + "/sitemap.xml")).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const extra = [BASE + "/?lang=fr", BASE + "/?lang=ar", BASE + "/?lang=ru", BASE + "/privacy/?lang=he", BASE + "/about/?lang=he", BASE + "/no-such-page/"];
for (const view of ["desk", "phone"]) {
  const c = await ctx(view);
  for (const u of [...urls, ...extra]) {
    const p = await open(c, u); await scrollThrough(p);
    const f = await facts(p); const a = view === "desk" && /isracard\/(he\/)?(pieces\/knot\/)?$|about\/$|privacy\/$/.test(u) ? await axe(p) : null;
    const rec = { url: u.replace(BASE, ""), view, status: p.status, ...f, errors: p.errs, badRequests: [...new Set(p.bad)].slice(0, 10), axe: a };
    report.pages.push(rec);
    const where = `${view} ${rec.url}`;
    if (u.endsWith("no-such-page/")) { if (p.status !== 404) issue(where, "a missing page answers " + p.status); }
    else {
      if (p.status !== 200) issue(where, "status " + p.status);
      if (!f.title) issue(where, "no title"); if (!f.desc) issue(where, "no description"); if (!f.canonical && !/lang=/.test(u)) issue(where, "no canonical");
      if (f.h1 !== 1) issue(where, f.h1 + " h1 headings");
      if (f.ld.includes("bad")) issue(where, "structured data does not parse");
    }
    if (p.errs.length) issue(where, "script errors: " + p.errs.join(" | "));
    if (rec.badRequests.length) issue(where, "failed requests: " + rec.badRequests.join(" | "));
    if (f.broken.length) issue(where, "broken images: " + f.broken.slice(0, 4).join(" "));
    if (f.noAlt) issue(where, f.noAlt + " images without alt");
    if (f.overflow > 1) issue(where, `runs ${f.overflow}px off the side`);
    if (/\/he\/|lang=(he|ar)/.test(u) && f.dir !== "rtl") issue(where, "Hebrew/Arabic page not right-to-left");
    if (a && a.length) issue(where, "accessibility: " + a.map(v => `${v.id} (${v.impact}, ${v.n})`).join(", "));
    if (/\/(pieces\/knot\/)?$/.test(u) && !/lang=/.test(u)) await p.screenshot({ path: path.join(OUT, `site-${view}-${rec.url.replace(/\W+/g, "_") || "home"}.png`) });
    await p.close();
  }
  if (c.blocked.length) report.interactions.push({ view, note: "requests stopped by the QA (nothing sent)", blocked: c.blocked });
  await c.close();
}
/* og images and sitemap targets answer */
for (const u of [...new Set(report.pages.map(p => p.ogImage).filter(Boolean))]) { const r = await fetch(u, { method: "HEAD" }); if (!r.ok) issue("og:image", u + " → " + r.status); }
for (const f of ["robots.txt", "sitemap.xml", "_content/release.json", "favicon.ico", "site.webmanifest"]) { const r = await fetch(BASE + "/" + f); report.security.push({ file: f, status: r.status }); if (!r.ok && f !== "site.webmanifest") issue(f, "status " + r.status); }

/* ── 2. the things a visitor does ── */
for (const view of ["desk", "phone"]) {
  const c = await ctx(view); const p = await open(c, BASE + "/"); const log = (k, v) => report.interactions.push({ view, step: k, result: v });
  try {
    if (view === "phone") { await p.locator("#menuBtn").click(); await p.waitForTimeout(600); log("menu opens", await p.locator("#menu").getAttribute("aria-hidden")); await p.locator("#menuClose").click(); await p.waitForTimeout(400); }
    /* a piece's window */
    await p.locator(".pgrid .piece:not(.soon)").first().scrollIntoViewIfNeeded(); await p.locator(".pgrid .piece:not(.soon) .fig").first().click(); await p.waitForTimeout(1200);
    const modal = await p.evaluate(() => { const m = document.querySelector(".modal.open"); return m ? (m.id || "modal") : null; });
    log("piece window opens", modal); if (!modal) issue(view + " home", "the piece window did not open");
    await p.screenshot({ path: path.join(OUT, `site-${view}-piece-window.png`) });
    await p.keyboard.press("Escape"); await p.waitForTimeout(700);
    const still = await p.evaluate(() => !!document.querySelector(".modal.open"));
    log("Escape closes it", !still); if (still) issue(view + " home", "Escape did not close the piece window");
    /* The Line */
    await p.evaluate(() => document.getElementById("build").scrollIntoView()); await p.waitForTimeout(1500);
    await p.locator('#opts .chip[data-k="cut"][data-v="oval"]').evaluate(el => el.click()); await p.waitForTimeout(300);
    const b = await p.evaluate(() => (window.__build || {}).cut); log("The Line answers a choice", b); if (b !== "oval") issue(view + " The Line", "choosing a shape did not change the design");
    await p.screenshot({ path: path.join(OUT, `site-${view}-the-line.png`) });
    /* the form: an empty send is caught on the page and nothing is sent */
    await p.evaluate(() => document.getElementById("concierge").scrollIntoView()); await p.waitForTimeout(800);
    const before = c.blocked.length; await p.locator("#csend").click(); await p.waitForTimeout(800);
    const shown = await p.evaluate(() => [...document.querySelectorAll(".ferr")].filter(e => !e.hidden && e.textContent.trim()).map(e => e.textContent.trim()));
    log("empty form is caught", shown); if (!shown.length) issue(view + " form", "an empty enquiry shows no message"); if (c.blocked.length > before) issue(view + " form", "an empty enquiry was sent");
    const ep = await p.evaluate(() => document.getElementById("cform").getAttribute("data-endpoint")); log("form sends to", ep); if (!/supabase\.co\/functions\/v1\/enquiry$/.test(ep || "")) issue(view + " form", "the form is not connected to the backend: " + ep);
    await p.screenshot({ path: path.join(OUT, `site-${view}-form.png`) });
    /* language */
    await p.evaluate(() => scrollTo(0, 0)); const lb = p.locator("#langBtn"); if (await lb.isVisible()) { await lb.click(); await p.waitForTimeout(500); const he = p.locator('[data-lang="he"]').first(); if (await he.isVisible().catch(() => false)) { await he.click(); await p.waitForTimeout(1200); log("switch to Hebrew", await p.evaluate(() => document.documentElement.dir)); } }
  } catch (e) { issue(view + " home", "interaction failed: " + e.message.split("\n")[0]); }
  if (p.errs.length) issue(view + " home (interactions)", "script errors: " + p.errs.join(" | "));
  await c.close();
}
/* the visit counter: asks first, sends nothing before or after a no */
{
  const c = await ctx("desk", { staff: false }); const p = await open(c, BASE + "/"); await p.waitForTimeout(3000);
  const asked = await p.locator("#consent").isVisible().catch(() => false);
  report.interactions.push({ step: "visit counter asks first", result: asked }); if (!asked) issue("consent", "the question did not appear");
  if (asked) { await p.screenshot({ path: path.join(OUT, "site-consent.png") }); await p.click('#consent [data-c="no"]'); }
  await p.goto(BASE + "/pieces/ring/"); await p.waitForTimeout(5000);
  const sent = c.blocked.filter(u => u.endsWith("/collect")).length;
  report.interactions.push({ step: "nothing counted after a no", result: sent === 0 }); if (sent) issue("consent", sent + " counting requests after a no");
  await c.close();
}

/* ── 3. the admin, looked at, never changed ── */
if (process.env.QA_EMAIL) {
  const routes = ["", "analytics", "products", "products/knot", "products/ring", "products/pave", "products/star", "pages/home", "pages/text", "pages/menus", "pages/pages", "pages/policies", "pages/policies/privacy", "pages/about", "media", "enquiries", "customers", "quotes", "line", "languages", "languages/fr", "settings", "team", "history/releases", "history/versions", "history/audit", "history/backups", "account"];
  for (const [view, lang] of [["desk", "en"], ["phone", "en"], ["desk", "he"]]) {
    const c = await browser.newContext({ viewport: { width: VIEW[view].width, height: VIEW[view].height }, isMobile: !!VIEW[view].isMobile });
    await c.addInitScript((l) => localStorage.setItem("silavu-admin-lang", l), lang);
    const p = await open(c, BASE + "/admin/");
    await p.locator('input[type="email"]').fill(process.env.QA_EMAIL); await p.locator('input[type="password"]').fill(process.env.QA_PASSWORD); await p.locator("button.primary").click();
    await p.locator("aside.side").waitFor({ timeout: 30000 });
    for (const r of routes) {
      p.errs.length = 0; p.bad.length = 0;
      await p.goto(BASE + "/admin/#/" + r); await p.waitForTimeout(1800);
      const f = await p.evaluate(() => ({ h1: document.querySelector("main h1")?.textContent || "", dir: document.documentElement.dir, overflow: document.scrollingElement.scrollWidth - innerWidth,
        failed: [...document.querySelectorAll(".state.bad, .err[role=alert], p.err")].map(e => e.textContent.trim()).filter(Boolean),
        unnamed: [...document.querySelectorAll("main input:not([type=hidden]):not([hidden]), main select, main textarea, main button")].filter(e => !((e.id && document.querySelector(`label[for="${e.id}"]`)) || e.closest("label") || e.getAttribute("aria-label") || (e.tagName === "BUTTON" && e.textContent.trim()))).length,
        english: document.documentElement.lang === "he" ? [...document.querySelectorAll("main h1, main h2, main label, main button")].map(e => e.textContent.trim()).filter(t => /^[A-Za-z][a-z]+( [a-z]+){1,}$/.test(t)).slice(0, 5) : [] }));
      const where = `admin ${view} ${lang} #/${r}`;
      report.admin.push({ route: r, view, lang, ...f, errors: [...p.errs], bad: [...new Set(p.bad)] });
      if (!f.h1) issue(where, "no heading (screen did not render?)");
      if (f.failed.length) issue(where, "shows an error: " + f.failed.join(" | "));
      if (p.errs.length) issue(where, "script errors: " + p.errs.join(" | "));
      if (p.bad.length) issue(where, "failed requests: " + [...new Set(p.bad)].slice(0, 4).join(" | "));
      if (f.overflow > 1) issue(where, `runs ${f.overflow}px off the side`);
      if (f.unnamed) issue(where, f.unnamed + " controls without a label");
      if (f.english.length) issue(where, "English left in Hebrew: " + f.english.join(" / "));
      if (lang === "he" && f.dir !== "rtl") issue(where, "not right-to-left");
      if (view === "desk" && lang === "en" && ["", "products", "products/knot", "pages/text", "line", "history/releases"].includes(r)) await p.screenshot({ path: path.join(OUT, `admin-${r.replace(/\W+/g, "_") || "overview"}.png`) });
    }
    /* previews: the real page with the draft, looked at and closed */
    if (view === "desk" && lang === "en") for (const r of ["products/knot", "pages/about", "pages/policies/privacy", "line"]) {
      await p.goto(BASE + "/admin/#/" + r); await p.waitForTimeout(1500);
      const btn = p.getByRole("button", { name: "Preview", exact: true }); if (!(await btn.count())) { issue("admin " + r, "no Preview button"); continue; }
      await btn.first().click(); const ok = await p.locator("iframe.pv").waitFor({ timeout: 30000 }).then(() => true).catch(() => false);
      if (!ok) issue("admin preview " + r, "the preview did not appear: " + ((await p.locator(".modal .state.bad").textContent().catch(() => "")) || "timeout"));
      else { await p.waitForTimeout(2500); await p.screenshot({ path: path.join(OUT, `admin-preview-${r.replace(/\W+/g, "_")}.png`) }); }
      report.admin.push({ route: "preview " + r, ok }); await p.getByRole("button", { name: "Close" }).last().click().catch(() => {});
    }
    await c.close();
  }
}

/* ── 4. what a stranger can reach on the backend ── */
{
  const html = await (await fetch(BASE + "/admin/")).text();
  if (!/SILAVU_ADMIN/.test(html)) throw new Error("could not read the admin page (network?): " + html.slice(0, 80));
  const cfg = JSON.parse(html.match(/SILAVU_ADMIN\s*=\s*(\{[^<]*?\});/)[1]);
  const S = cfg.supabaseUrl, K = cfg.anonKey, H = { apikey: K, authorization: "Bearer " + K, "content-type": "application/json" };
  const role = JSON.parse(Buffer.from(K.split(".")[1], "base64url").toString()).role; if (role !== "anon") issue("admin bundle", "the key in the admin is not the public one: " + role);
  for (const t of ["content_docs", "content_revisions", "releases", "product_private", "media_assets", "customers", "enquiries", "enquiry_notes", "quotes", "staff", "audit_log", "analytics_events"]) {
    const r = await fetch(`${S}/rest/v1/${t}?select=*&limit=1`, { headers: H }); const b = await r.text();
    const open = r.ok && b !== "[]"; report.security.push({ table: t, status: r.status, readable: open }); if (open) issue("security", "anyone can read " + t);
  }
  for (const [fn, body] of [["save_draft", { p_key: "settings", p_kind: "settings", p_title: "x", p_data: {}, p_expected_rev: 0, p_checkpoint: true }], ["publish_docs", { p_keys: null, p_note: "" }], ["set_staff_role", { p_user: "00000000-0000-0000-0000-000000000000", p_role: "owner" }], ["svc_export", {}], ["my_staff", {}]]) {
    const r = await fetch(`${S}/rest/v1/rpc/${fn}`, { method: "POST", headers: H, body: JSON.stringify(body) }); const b = await r.text();
    const ok = r.ok && b !== "null" && b !== "{}" && b !== "[]"; report.security.push({ rpc: fn, status: r.status }); if (ok) issue("security", "anyone can call " + fn + ": " + b.slice(0, 80));
  }
  for (const bucket of ["media", "attachments", "exports"]) {
    const r = await fetch(`${S}/storage/v1/object/list/${bucket}`, { method: "POST", headers: H, body: JSON.stringify({ prefix: "", limit: 5 }) }); const b = await r.text();
    report.security.push({ bucket, status: r.status, body: b.slice(0, 60) }); if (r.ok && b !== "[]") issue("security", "anyone can list the " + bucket + " bucket");
    const pub = await fetch(`${S}/storage/v1/bucket/${bucket}`, { headers: H }); if (pub.ok && (await pub.json()).public) issue("security", bucket + " bucket is public");
  }
  for (const fn of ["publish", "export", "staff", "setup", "status", "release-snapshot", "release-status", "maintenance", "media"]) {
    const r = await fetch(`${S}/functions/v1/${fn}`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    report.security.push({ function: fn, status: r.status }); if (r.status !== 401 && r.status !== 403) issue("security", `function ${fn} answered ${r.status} without sign-in`);
  }
  /* a form post from another website is refused before anything is saved */
  const evil = await fetch(`${S}/functions/v1/enquiry`, { method: "POST", headers: { "content-type": "application/json", origin: "https://evil.example" }, body: "{}" });
  report.security.push({ enquiry_from_other_site: evil.status }); if (evil.status !== 403) issue("security", "enquiry from another website answered " + evil.status);
  const signup = await fetch(`${S}/auth/v1/signup`, { method: "POST", headers: { apikey: K, "content-type": "application/json" }, body: JSON.stringify({ email: "qa-signup-check@silavu.com", password: "qa-signup-check-123" }) });
  report.security.push({ signup: signup.status }); if (signup.ok) issue("security", "anyone can sign up");
  /* nothing privileged in what browsers download */
  for (const f of [BASE + "/", BASE + "/admin/", ...[...html.matchAll(/src="(app\.[^"]+\.js)"/g)].map(m => BASE + "/admin/" + m[1])]) {
    const t = await (await fetch(f)).text();
    /* real keys, not the library's own mention of their names */
    if (/sb_secret_[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}/.test(t)) issue("security", "a secret key in " + f);
    for (const jwt of t.match(/eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g) || []) {
      try { const r = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString()).role; if (r && r !== "anon") issue("security", `a ${r} key in ${f}`); } catch (e) {}
    }
  }
}

fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 1));
console.log(`\n${report.pages.length} page views, ${report.admin.length} admin views, ${report.issues.length} issues → ${OUT}/report.json`);
await browser.close();
