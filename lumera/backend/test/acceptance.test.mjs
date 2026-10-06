// The brief's acceptance checks, end to end, on this machine: a fresh
// database behind the local Supabase stand-in (real Postgres, real policies,
// the real edge functions), the real site build standing in for GitHub
// Actions, the site served under /isracard/ as GitHub Pages serves it, and a
// real browser driving the admin as the owner and the team would.
// Nothing leaves the machine: no email is sent and no GitHub call is made.
//
//   cd lumera/backend && npm run test:acceptance
//
// Each test names the check (1–15) it demonstrates. Where a check depends on
// something only the real services can show (an email arriving, a custom
// domain), the test says so and ADMIN_SETUP.md lists it as unverified.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import pg from "pg";
import { startStack } from "./stack.mjs";
const require = createRequire(new URL("../../../package.json", import.meta.url));
const { chromium } = require("playwright-core");

const BASE = "/isracard", OWNER = "owner@silavu.test", OWNER_PW = "local-owner-password";
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "silavu-accept-"));
const SHOTS = process.env.ACCEPT_SHOTS || path.join(TMP, "shots");
fs.mkdirSync(SHOTS, { recursive: true });
let S, browser, db;
const ctxs = [];

before(async () => {
  S = await startStack({ sitePort: 8788, fnPort: 54331, dist: path.join(TMP, "dist"), base: BASE, log: (m) => fs.appendFileSync(path.join(TMP, "stack.log"), m + "\n") });
  console.log("# stack log: " + path.join(TMP, "stack.log"));
  await S.fake.bootstrapOwner(OWNER, OWNER_PW);
  await S.siteBuild(null);
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
  db = new pg.Client({ host: process.env.PGHOST || "/tmp", port: +(process.env.PGPORT || 54329), user: "postgres", database: "silavu_test" }); await db.connect();
});
after(async () => { for (const c of ctxs) await c.close().catch(() => {}); await browser?.close(); await db?.end(); await S?.close(); });

/* ── helpers ─────────────────────────────────────────────────────────── */
const sql = async (q, p) => (await db.query(q, p)).rows;
/* an ordinary browser's name: the counter rightly sets aside "HeadlessChrome" as a robot */
const UA = { desk: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  phone: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1" };
async function context({ width = 1280, height = 900, lang, staffBrowser = false, init } = {}) {
  const c = await browser.newContext({ viewport: { width, height }, locale: lang === "he" ? "he-IL" : "en-GB", userAgent: width < 600 ? UA.phone : UA.desk });
  await c.addInitScript(([l, st]) => { try { localStorage.setItem("silavu-seen", "1"); if (l) localStorage.setItem("silavu-admin-lang", l); if (st) localStorage.setItem("silavu-staff", "1"); } catch (e) {} }, [lang || "en", staffBrowser]);
  if (init) await c.addInitScript(init);
  ctxs.push(c); return c;
}
async function page(c) {
  const p = await c.newPage(); p.errors = [];
  p.on("pageerror", e => p.errors.push(e.message));
  p.on("dialog", d => d.accept());
  return p;
}
async function signIn(p, email = OWNER, pw = OWNER_PW) {
  await p.goto(S.adminUrl); await p.getByLabel("Email").fill(email); await p.getByLabel("Password").fill(pw);
  await p.getByRole("button", { name: "Sign in" }).click();
  await p.waitForSelector("aside.side, .card.narrow h1:not(:text('Sign in'))", { timeout: 15000 });
}
const go = async (p, route) => { await p.goto(S.adminUrl + "#/" + route); await p.waitForTimeout(400); await p.waitForLoadState("networkidle"); };
const field = (p, legend, lang = "English") => p.locator("fieldset.bi", { has: p.locator("legend", { hasText: legend }) }).first().getByLabel(lang, { exact: true });
const toast = (p, text) => p.locator(".toast", { hasText: text }).first().waitFor({ timeout: 15000 });
async function confirmDialog(p) { await p.locator(".modal footer button.primary, .modal footer button.danger").last().click(); }
async function publishAll(p, note = "") {
  await p.locator(".topact button").click();
  if (note) await p.getByLabel("A note for the history (optional)").fill(note);
  const n = S.builds.length;
  await p.getByRole("button", { name: "Publish the selected changes" }).click();
  await p.locator(".relstate").first().waitFor({ timeout: 15000 });
  const b = await S.waitForBuild(n + 1);
  await p.getByRole("button", { name: "Close" }).last().click();
  return b;
}
async function anonPage(route = "", opts = {}) { const c = await context(opts); const p = await page(c); await p.goto(S.siteUrl + "/" + route); return p; }
const shot = (p, name) => p.screenshot({ path: path.join(SHOTS, name + ".png"), fullPage: false });
const anonFetch = (u, init) => fetch(u, init);
const rest = (pathq, token = S.fake.anonKey, init = {}) => fetch(S.fake.url + "/rest/v1/" + pathq, { ...init, headers: { apikey: S.fake.anonKey, authorization: "Bearer " + token, "content-type": "application/json", ...(init.headers || {}) } });
async function tokenFor(email, password) {
  const r = await fetch(S.fake.url + "/auth/v1/token?grant_type=password", { method: "POST", headers: { apikey: S.fake.anonKey, "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  return (await r.json()).access_token;
}
function jpeg(name, w, h, colour) { const f = path.join(TMP, name); execFileSync("convert", ["-size", `${w}x${h}`, `gradient:${colour}-white`, "-quality", "92", f]); return f; }
const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const html = (rel) => fs.readFileSync(path.join(S.dist, rel), "utf8");

const state = {};
/* the storefront's enquiry form, as a visitor fills it */
async function fillEnquiry(v, { name, contact, city = "", message = "" }) {
  await v.evaluate(() => { const c = document.querySelector("#consent"); if (c) c.remove(); document.getElementById("concierge").scrollIntoView(); });
  await v.waitForTimeout(500);
  await v.fill("#fName", name); await v.fill("#fContact", contact); if (city) await v.fill("#fCity", city); if (message) await v.fill("#fMsg", message);
}

/* ── 1 · sign-in, recovery, sign-out; nobody else gets in ───────────── */
test("1 · the owner signs in, recovers access and signs out; visitors and ordinary accounts get nothing", async () => {
  const c = await context(), p = await page(c);
  await signIn(p);
  await p.locator("h1", { hasText: "Good to see you" }).waitFor();
  /* forgot password: the link Auth would email, opened in a fresh browser */
  await p.getByRole("button", { name: "Sign out" }).click();
  await p.getByRole("button", { name: "Forgot your password?" }).click();
  await p.getByLabel("Email").fill(OWNER); await p.getByRole("button", { name: "Send the link" }).click();
  await p.getByText("a link to set a new password is on its way").waitFor();
  const mail = S.fake.mail.filter(m => m.kind === "recovery").pop();
  assert.ok(mail && mail.link.startsWith(S.adminUrl), "the link leads back to " + S.adminUrl);
  const c2 = await context(), p2 = await page(c2);
  await p2.goto(mail.link);
  await p2.getByLabel("New password").fill("a-new-owner-password");
  await p2.getByLabel("The same again").fill("a-new-owner-password");
  await p2.getByRole("button", { name: "Save the password" }).click();
  await p2.getByText("Your password is changed.").waitFor();
  await c2.close();
  /* the old password no longer works, the new one does */
  await p.goto(S.adminUrl); await p.reload();
  await p.getByLabel("Email").fill(OWNER); await p.getByLabel("Password").fill(OWNER_PW); await p.getByRole("button", { name: "Sign in" }).click();
  await p.getByText("do not match an account").waitFor();
  await signIn(p, OWNER, "a-new-owner-password");
  await p.locator("h1", { hasText: "Good to see you" }).waitFor();
  /* put it back for the rest of the run */
  S.fake.users.get(OWNER).password = OWNER_PW;

  /* a visitor with the public key: no admin data, no writes */
  for (const t of ["content_docs?select=key", "enquiries?select=id", "customers?select=id", "staff?select=email", "audit_log?select=id", "quotes?select=id", "media_assets?select=id", "analytics_events?select=id", "product_private?select=product_key"]) {
    const r = await rest(t); const body = await r.text();
    assert.ok(r.status >= 400 || body === "[]", `anonymous ${t}: ${r.status} ${body.slice(0, 80)}`);
  }
  const w = await rest("rpc/save_draft", undefined, { method: "POST", body: JSON.stringify({ p_key: "settings", p_kind: "settings", p_title: "x", p_data: {}, p_expected_rev: 0, p_checkpoint: true }) });
  assert.ok(w.status >= 400, "anonymous save_draft refused: " + w.status);
  const pub = await fetch(S.fake.url + "/functions/v1/publish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "publish" }) });
  assert.equal(pub.status, 401);
  const snap = await fetch(S.fake.url + "/functions/v1/release-snapshot", { method: "POST" });
  assert.equal(snap.status, 401, "drafts and published data only with the build token");

  /* an account that exists but was never invited to the team */
  await S.fake.addUser("stranger@silavu.test", "stranger-password");
  const tok = await tokenFor("stranger@silavu.test", "stranger-password");
  for (const t of ["content_docs?select=key", "enquiries?select=id", "staff?select=email", "customers?select=id"]) {
    const r = await rest(t, tok); const body = await r.text();
    assert.ok(r.status >= 400 || body === "[]", `stranger ${t}: ${body.slice(0, 80)}`);
  }
  const w2 = await rest("rpc/save_draft", tok, { method: "POST", body: JSON.stringify({ p_key: "settings", p_kind: "settings", p_title: "x", p_data: {}, p_expected_rev: 0, p_checkpoint: true }) });
  assert.ok(w2.status >= 400);
  const c3 = await context(), p3 = await page(c3);
  await signIn(p3, "stranger@silavu.test", "stranger-password");
  await p3.getByText("This account has no access to the admin").waitFor();
  await shot(p3, "01-no-access");
  assert.deepEqual(p.errors, []);
});

/* the site's content comes into the admin once, exactly as it is */
const pages = (dir, rel = "") => fs.readdirSync(path.join(dir, rel), { withFileTypes: true }).flatMap(e => e.isDirectory() ? (e.name === "admin" ? [] : pages(dir, path.join(rel, e.name))) : e.name.endsWith(".html") || e.name.endsWith(".xml") || e.name.endsWith(".txt") ? [path.join(rel, e.name)] : []);
test("setup · the owner imports the current site; built from the backend it is the same site", async () => {
  const before = Object.fromEntries(pages(S.dist).map(f => [f, html(f)]));
  const c = await context(), p = await page(c); state.owner = p;
  await signIn(p);
  await p.locator(".topact button").click();
  await p.getByRole("button", { name: "Import the current site" }).click();
  await p.waitForEvent("load");
  await p.locator("h1", { hasText: "Good to see you" }).waitFor();
  const n = (await sql("select count(*)::int n from public.content_docs"))[0].n;
  assert.ok(n > 15, "documents imported: " + n);
  await p.locator(".topact button").click();
  await p.getByText("Everything is live.").waitFor();
  await p.getByRole("button", { name: "Cancel" }).click();
  /* the next build reads the content from the backend instead of the code */
  const k = S.builds.length; await S.siteBuild(null); const b = await S.waitForBuild(k + 1);
  assert.ok(b.ok, b.error);
  const after = Object.fromEntries(pages(S.dist).map(f => [f, html(f)]));
  assert.deepEqual(Object.keys(after).sort(), Object.keys(before).sort(), "the same pages");
  const differ = Object.keys(before).filter(f => after[f] !== before[f]);
  for (const f of differ) { const d = path.join(TMP, "differ", f); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.writeFileSync(d + ".before", before[f]); fs.writeFileSync(d + ".after", after[f]); }
  assert.deepEqual(differ, [], "every page byte for byte the same");
});

/* ── 3, 4, 6 · a product: words, photographs, price; private until published ── */
test("3·4·6 · the owner changes a piece, adds and orders photographs, sets a price; the draft stays private; preview; publish; every public view changes", async () => {
  const p = state.owner;
  await go(p, "products/knot");
  await field(p, "Name (as on the card)").fill("SILAVU *MOMENTO*");
  await field(p, "Name (as on the card)", "עברית").fill("SILAVU *MOMENTO*");
  /* photographs: two new ones, uploaded from this computer */
  await p.getByRole("tab", { name: "Photographs & film" }).click();
  const before = await p.locator(".card .listed .li").count();
  await p.getByRole("button", { name: "Add photographs from the library" }).click();
  const files = [jpeg("new-face.jpg", 2000, 2000, "#1b2a4a"), jpeg("new-detail.jpg", 1600, 1600, "#4a1b2a")];
  await p.locator(".modal input[type=file]").setInputFiles(files);
  await p.locator(".modal .uplog li.ok").nth(1).waitFor({ timeout: 30000 });
  await p.getByRole("button", { name: "Use 2" }).click();
  assert.equal(await p.locator(".card .listed .li").count(), before + 2);
  /* the first new one becomes the card's face: moved to the top */
  for (let i = before; i > 0; i--) await p.locator(".card .listed .li").nth(i).getByRole("button", { name: "Move up" }).click();
  await p.locator(".card .listed .li").first().getByText("Card face").waitFor();
  await field(p, "Description for people who cannot see it").fill("The new face of MOMENTO, in navy light");
  /* a set price, in shekels */
  await p.getByRole("tab", { name: "Price & visibility" }).click();
  await p.getByLabel("A set price").check();
  await p.getByLabel("ILS", { exact: true }).fill("12500");
  await p.getByText("The site will say:").locator("strong").first().filter({ hasText: "₪12,500" }).waitFor();
  await p.getByRole("button", { name: "Save draft" }).click();
  await toast(p, "Draft saved");

  /* 6 · the draft is private: not in any anonymous answer, page or file */
  const doc = (await sql("select draft, published from public.content_docs where key = 'product:knot'"))[0];
  assert.match(doc.draft.name.en, /MOMENTO/); assert.doesNotMatch(doc.published.name.en, /MOMENTO/);
  const ids = doc.draft.shots.filter(s => s.img.startsWith("media:")).map(s => s.img.slice(6));
  assert.equal(ids.length, 2); state.mediaIds = ids;
  const a = await rest("content_docs?select=draft&key=eq.product:knot"); assert.ok(a.status >= 400 || (await a.text()) === "[]");
  for (const f of ["index.html", "pieces/knot/index.html", "he/pieces/knot/index.html", "_content/release.json"]) assert.doesNotMatch(html(f), /MOMENTO|12,500/, f);
  assert.ok(!fs.existsSync(path.join(S.dist, "img", `m-${ids[0]}-640.jpg`)), "no derived file before publishing");
  const row = (await sql("select path from public.media_assets where id = $1", [ids[0]]))[0];
  for (const u of [`${S.fake.url}/storage/v1/object/media/${row.path}`, `${S.fake.url}/storage/v1/object/public/media/${row.path}`]) {
    const r = await fetch(u, { headers: { apikey: S.fake.anonKey } }); assert.ok(r.status >= 400, "anonymous original: " + u + " " + r.status);
  }
  /* 4 · the original is kept exactly as uploaded */
  assert.equal(sha(S.fake.files.get("media/" + row.path).body), sha(fs.readFileSync(files[0])), "byte for byte");

  /* 6 · preview: the draft on the real page, privately */
  await p.getByRole("button", { name: "Preview" }).click();
  const frame = p.frameLocator("iframe.pv");
  await frame.locator("#p-knot").getByText("MOMENTO").first().waitFor({ timeout: 20000 });
  const src = await p.locator("iframe.pv").getAttribute("srcdoc");
  assert.match(src, /noindex,nofollow/); assert.match(src, /PREVIEW · NOT LIVE/); assert.match(src, /₪12,500/);
  assert.match(src, /\/storage\/v1\/object\/sign\/media\//, "unpublished photographs come over short-lived signed links");
  await shot(p, "06-preview");
  await p.getByRole("button", { name: "Close" }).last().click();

  /* publish: one release, the build, live */
  const n = S.builds.length;
  await p.locator(".savebar").getByRole("button", { name: "Publish", exact: true }).click();
  await confirmDialog(p);
  await toast(p, "Published. The site is rebuilding");
  const b = await S.waitForBuild(n + 1); assert.ok(b.ok, b.error);
  const rel = (await sql("select id, status from public.releases order by id desc limit 1"))[0];
  assert.equal(rel.status, "live");

  /* 3 · a separate, anonymous browser, after reload: card, window, page, data */
  const v = await anonPage("");
  await v.locator("#p-knot").getByText("MOMENTO").first().waitFor();
  await v.reload(); await v.locator("#p-knot").getByText("MOMENTO").first().waitFor();
  const face = await v.locator("#p-knot img").first().getAttribute("src");
  assert.match(face, new RegExp(`m-${ids[0]}-\\d+\\.jpg`), "the new photograph is the card's face");
  const pp = await anonPage("pieces/knot/");
  assert.match(await pp.locator("h1").innerText(), /MOMENTO/);
  assert.ok((await pp.content()).includes("₪12,500"));
  const ld = JSON.parse(await pp.locator('script[type="application/ld+json"]').first().innerText());
  const offers = JSON.stringify(ld); assert.match(offers, /"price":"12500.00"/); assert.match(offers, /"priceCurrency":"ILS"/);
  const he = await anonPage("he/pieces/knot/");
  assert.match(await he.locator("html").getAttribute("dir"), /rtl/); assert.match(await he.locator("h1").innerText(), /MOMENTO/);
  /* 4 · sharp sizes derived from the original, never enlarged */
  const dims = execFileSync("identify", ["-format", "%w %h", path.join(S.dist, "img", `m-${ids[0]}-1254.jpg`)]).toString();
  assert.equal(dims, "1254 1254");
  /* 4 · the phone gallery: every photograph, swiped inside the gallery, the page itself never sideways */
  const m = await anonPage("pieces/knot/", { width: 390, height: 844 });
  const g = await m.evaluate(() => ({ shots: [...new Set([...document.querySelectorAll(".ppgal img")].map(i => i.getAttribute("src").replace(/^.*\//, "").replace(/-(\d+|poster)\.jpg$/, "")))], page: document.scrollingElement.scrollWidth, vw: innerWidth }));
  for (const id of ids) assert.ok(g.shots.includes("m-" + id), "in the phone gallery: " + id);
  assert.ok(g.shots.length >= before + 2, g.shots.join(" ")); assert.ok(g.page <= g.vw, `no sideways page scroll (${g.page} > ${g.vw})`);
  await shot(m, "04-phone-gallery");

  /* 6 · back to the previous version: a new version, published again */
  await p.getByRole("tab", { name: "History" }).click();
  await p.locator("tr", { hasText: "imported" }).getByRole("button", { name: "Use this version" }).click();
  await confirmDialog(p); await toast(p, "Restored as the draft.");
  assert.doesNotMatch((await sql("select draft from public.content_docs where key = 'product:knot'"))[0].draft.name.en, /MOMENTO/);
  const revs = await sql("select source from public.content_revisions where doc_key = 'product:knot' order by id");
  assert.equal(revs.at(-1).source, "restore", "restoring adds a version, it does not erase one");
  assert.ok((await sql("select 1 from public.audit_log where action like 'content.restore%'")).length >= 1, "and an audit entry");
  const n2 = S.builds.length;
  await p.locator(".savebar").getByRole("button", { name: "Publish", exact: true }).click(); await confirmDialog(p);
  await S.waitForBuild(n2 + 1);
  assert.doesNotMatch(html("pieces/knot/index.html"), /MOMENTO|12,500/);
  assert.match(html("pieces/knot/index.html"), /Price on request/);
  assert.deepEqual(p.errors, []);
});

/* ── 2 · the team: roles, escalation, second factor, removal, secrets ─── */
async function invite(p, email, role, name) {
  await go(p, "team");
  await p.getByRole("button", { name: "Invite someone" }).click();
  await p.locator(".modal").getByLabel("Email").fill(email);
  await p.locator(".modal").getByLabel("Name").fill(name);
  await p.locator(".modal").getByLabel("Role").selectOption(role);
  await p.getByRole("button", { name: "Send the invitation" }).click();
  await toast(p, "Invitation sent to " + email);
}
/* the invitation email's link, opened on another device: choose a password, arrive */
async function accept(email, password) {
  const link = S.fake.mail.filter(m => m.kind === "invite" && m.to === email).pop().link;
  const c = await context(), p = await page(c);
  await p.goto(link);
  await p.getByLabel("New password").fill(password); await p.getByLabel("The same again").fill(password);
  await p.getByRole("button", { name: "Save the password" }).click();
  await p.getByRole("link", { name: "Continue" }).click();
  await p.locator("aside.side").waitFor();
  return p;
}
const navOf = (p) => p.locator("aside.side nav a").allInnerTexts();

test("2 · each role sees and can do only its part; nobody can raise their own role; removal and a second factor take effect at once; no secret reaches a browser", async () => {
  const o = state.owner;
  await invite(o, "editor@silavu.test", "editor", "Eden Editor");
  await invite(o, "support@silavu.test", "support", "Sam Support");
  await invite(o, "analyst@silavu.test", "analyst", "Ana Analyst");
  const ed = await accept("editor@silavu.test", "editor-password-1"), su = await accept("support@silavu.test", "support-password-1"), an = await accept("analyst@silavu.test", "analyst-password-1");
  state.editor = ed; state.support = su; state.analyst = an;
  assert.deepEqual(await navOf(ed), ["Overview", "Products", "Pages & text", "Media", "The Line", "Languages & SEO", "Settings", "History & backups"]);
  assert.deepEqual(await navOf(su), ["Overview", "Enquiries", "Customers", "Quotes"]);
  assert.deepEqual(await navOf(an), ["Overview", "Analytics"]);
  /* typing an address they have no part in */
  for (const [p, r] of [[ed, "team"], [ed, "enquiries"], [su, "products"], [su, "history"], [an, "customers"], [an, "settings"]]) {
    await go(p, r); await p.getByText("Your role does not include this part of the admin.").waitFor();
  }
  await shot(su, "02-support-forbidden");

  /* the same, straight at the API with their own sessions */
  const tk = { editor: await tokenFor("editor@silavu.test", "editor-password-1"), support: await tokenFor("support@silavu.test", "support-password-1"), analyst: await tokenFor("analyst@silavu.test", "analyst-password-1") };
  const me = async (email) => (await sql("select id from auth.users where email = $1", [email]))[0].id;
  const empty = async (t, q) => { const r = await rest(q, t); const b = await r.text(); return r.status >= 400 || b === "[]"; };
  assert.ok(await empty(tk.editor, "enquiries?select=id"), "editor: no enquiries");
  assert.ok(await empty(tk.editor, "customers?select=id"), "editor: no customers");
  assert.ok(await empty(tk.support, "content_docs?select=key"), "support: no drafts");
  assert.ok(await empty(tk.analyst, "customers?select=id") && await empty(tk.analyst, "enquiries?select=id"), "analyst: no names");
  assert.ok(await empty(tk.editor, "product_private?select=product_key"), "editor: no costs");
  assert.ok(await empty(tk.analyst, "analytics_events?select=id"), "analyst: figures only through the summaries, never raw rows");
  for (const [who, rpcName, body] of [
    ["editor", "set_staff_role", { p_user: await me("editor@silavu.test"), p_role: "owner" }],
    ["support", "set_staff_role", { p_user: await me("support@silavu.test"), p_role: "owner" }],
    ["analyst", "set_staff_mfa", { p_user: await me("analyst@silavu.test"), p_required: false }],
    ["support", "save_draft", { p_key: "settings", p_kind: "settings", p_title: "x", p_data: {}, p_expected_rev: 1, p_checkpoint: true }],
    ["analyst", "update_enquiry", { p_id: crypto.randomUUID(), p_status: "won", p_assignee: null, p_due: null, p_tags: [] }],
    ["editor", "anonymize_customer", { p_id: crypto.randomUUID() }]]) {
    const r = await rest("rpc/" + rpcName, tk[who], { method: "POST", body: JSON.stringify(body) });
    assert.ok(r.status >= 400, `${who} ${rpcName}: ${r.status}`);
  }
  const upd = await rest("staff?user_id=eq." + await me("editor@silavu.test"), tk.editor, { method: "PATCH", body: JSON.stringify({ role: "owner" }), headers: { prefer: "return=representation" } });
  assert.ok(upd.status >= 400 || (await upd.text()) === "[]", "no direct write to the team table");
  assert.equal((await sql("select role from public.staff s join auth.users u on u.id = s.user_id where u.email = 'editor@silavu.test'"))[0].role, "editor");
  const fnAs = (name, t, body = {}) => fetch(S.fake.url + "/functions/v1/" + name, { method: "POST", headers: { authorization: "Bearer " + t, "content-type": "application/json", origin: S.origin }, body: JSON.stringify(body) });
  assert.equal((await fnAs("export", tk.editor)).status, 403, "only the owner exports");
  assert.equal((await fnAs("publish", tk.support, { action: "publish" })).status, 403, "support does not publish");
  assert.equal((await fnAs("staff", tk.editor, { action: "invite", email: "x@y.z", role: "owner" })).status, 403, "only the owner invites");
  /* private files: the exports and attachments buckets answer nobody but the owner */
  for (const b of ["exports", "attachments", "media"]) {
    const r = await fetch(`${S.fake.url}/storage/v1/object/list/${b}`, { method: "POST", headers: { apikey: S.fake.anonKey, authorization: "Bearer " + S.fake.anonKey, "content-type": "application/json" }, body: "{}" });
    assert.equal((await r.text()), "[]", "anonymous list of " + b);
  }

  /* a second factor, required by the owner */
  await go(o, "team");
  await o.locator("tr", { hasText: "editor@silavu.test" }).getByRole("checkbox").check();
  await toast(o, "They now need an authenticator code");
  await ed.reload();
  await ed.getByText("Your account needs a second factor").waitFor();
  assert.ok(await empty(await tokenFor("editor@silavu.test", "editor-password-1"), "content_docs?select=key"), "no data on a password alone");
  await ed.getByRole("button", { name: "Set up an authenticator" }).click();
  await ed.locator("code.key").waitFor();
  await ed.getByLabel("Code").fill(S.fake.totpFor("editor@silavu.test"));
  await ed.getByRole("button", { name: "Turn it on" }).click();
  await ed.waitForEvent("load");
  await ed.getByText("Your authenticator code").waitFor({ timeout: 15000 }).catch(() => {});
  if (await ed.getByText("Your authenticator code").isVisible()) {
    await ed.getByLabel("Code").fill(S.fake.totpFor("editor@silavu.test")); await ed.getByRole("button", { name: "Continue" }).click();
  }
  await ed.locator("aside.side").waitFor();
  /* a fresh sign-in asks for the code first */
  await ed.getByRole("button", { name: "Sign out" }).click();
  await signIn(ed, "editor@silavu.test", "editor-password-1");
  await ed.getByText("Your authenticator code").waitFor();
  await ed.getByLabel("Code").fill(S.fake.totpFor("editor@silavu.test")); await ed.getByRole("button", { name: "Continue" }).click();
  await ed.locator("aside.side").waitFor();

  /* removal: at once, everywhere */
  await go(o, "team");
  await o.locator("tr", { hasText: "support@silavu.test" }).getByRole("button", { name: "Remove" }).click();
  await confirmDialog(o); await toast(o, "Removed.");
  assert.ok(await empty(tk.support, "enquiries?select=id"), "the session they already had stops working");
  await su.reload(); await su.getByText("This account has no access to the admin").waitFor();
  const again = await fetch(S.fake.url + "/auth/v1/token?grant_type=password", { method: "POST", headers: { apikey: S.fake.anonKey, "content-type": "application/json" }, body: JSON.stringify({ email: "support@silavu.test", password: "support-password-1" }) });
  assert.equal(again.status, 400, "and cannot sign in again");
  assert.ok((await sql("select 1 from public.audit_log where action = 'staff.revoke'")).length === 1);

  /* nothing privileged in anything a browser downloads */
  const secrets = [S.fake.serviceKey, S.fake.env.BUILD_TOKEN, "service_role", "SERVICE_ROLE", "ghp_", "github_pat_", "re_", "GH_TOKEN", "RESEND_API_KEY"].filter(Boolean);
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : /\.(js|html|json|css|txt|xml|webmanifest)$/.test(e.name) ? [path.join(d, e.name)] : []);
  for (const f of walk(S.dist)) {
    const text = fs.readFileSync(f, "utf8");
    for (const s of secrets) {
      if (s === "re_" ) { assert.doesNotMatch(text, /\bre_[A-Za-z0-9]{20,}/, f); continue; }
      assert.ok(!text.includes(s), `${s.slice(0, 12)}… found in ${path.relative(S.dist, f)}`);
    }
  }
  /* support is back for the enquiry checks */
  await o.reload(); state.supportRemoved = true;
  for (const p of [ed, an, o]) assert.deepEqual(p.errors, []);
});

/* ── 5 · words, order, contact, a new page, the menu; both screen sizes ── */
test("5 · the editor changes hero, footer and About words, orders two text bands, a contact number and adds a page to the menu; published, it reads right on desktop and phone", async () => {
  const p = state.editor;
  /* every sentence on the page: found by what it says */
  await go(p, "pages/text");
  const edit = async (find, en) => {
    await p.getByLabel("Find a text").fill(find);
    await p.locator(".str").first().getByLabel("English", { exact: true }).fill(en);
  };
  await edit("Crafted with intention", "Made slowly, by hand. Made to be kept.");
  await edit("Dubai · Tel Aviv · By appointment", "Tel Aviv · Dubai · By private appointment");
  await p.locator(".savebar").getByRole("button", { name: "Save draft" }).click(); await toast(p, "Draft saved");
  /* two bands after the collection, the second moved above the first */
  await go(p, "pages/home");
  for (const title of ["First band", "Second band"]) {
    await p.getByRole("button", { name: "Add a band" }).click();
    const li = p.locator(".listed .li").last();
    await li.locator("fieldset.bi", { has: p.locator("legend", { hasText: /^Title$/ }) }).getByLabel("English", { exact: true }).fill(title);
    await li.locator("fieldset.bi", { has: p.locator("legend", { hasText: /^Title$/ }) }).getByLabel("עברית", { exact: true }).fill(title === "First band" ? "רצועה ראשונה" : "רצועה שנייה");
    await li.locator("fieldset.bi", { has: p.locator("legend", { hasText: /^Text$/ }) }).getByLabel("English", { exact: true }).fill(title + ": a few words between two chapters.");
  }
  await p.locator(".listed .li").nth(1).getByRole("button", { name: "Move up" }).click();
  await p.locator(".savebar").getByRole("button", { name: "Save draft" }).click(); await toast(p, "Draft saved");
  /* About */
  await go(p, "pages/about");
  await field(p, /^Heading$/).fill("A letter from the *house*");
  await p.locator(".savebar").getByRole("button", { name: "Save draft" }).click(); await toast(p, "Draft saved");
  await p.getByRole("button", { name: "Preview" }).click();
  await p.frameLocator("iframe.pv").locator("h1", { hasText: "A letter from the" }).waitFor({ timeout: 20000 });
  await p.getByRole("button", { name: "Close" }).last().click();
  /* a contact number (test value; the real one is the house's to give) */
  await go(p, "settings");
  await p.getByLabel("WhatsApp number").fill("+972 50 123 4567");
  await p.locator(".savebar").getByRole("button", { name: "Save draft" }).click(); await toast(p, "Draft saved");
  /* a new page, from the document template */
  await go(p, "pages/pages");
  await p.getByRole("button", { name: "New page" }).click();
  await p.locator(".modal").getByLabel("Its address").fill("bespoke");
  await p.locator(".modal").getByRole("button", { name: "Create" }).click();
  await field(p, /^Title$/).fill("Bespoke *commissions*"); await field(p, /^Title$/, "עברית").fill("הזמנות *אישיות*");
  await field(p, /^Introduction$/).fill("A piece made for one person, from the first drawing.");
  await field(p, /^Introduction$/, "עברית").fill("תכשיט שנעשה לאדם אחד, מהשרטוט הראשון.");
  await field(p, /^Paragraph$/).fill("Write to the house and we will arrange a private conversation.");
  await field(p, /^Paragraph$/, "עברית").fill("כתבו לבית ונקבע שיחה פרטית.");
  await p.getByRole("button", { name: "Preview" }).click();
  await p.frameLocator("iframe.pv").locator("h1", { hasText: "Bespoke" }).waitFor({ timeout: 20000 });
  await p.getByRole("button", { name: "Close" }).last().click();
  await p.locator(".savebar").getByRole("button", { name: "Save draft" }).click(); await toast(p, "Draft saved");
  /* in the top menu */
  await go(p, "pages/menus");
  await p.getByRole("button", { name: "Add a link" }).click();
  await p.getByLabel("Where").selectOption("top");
  await p.getByLabel("Goes to").fill("bespoke/");
  await field(p, /^Words$/).fill("Bespoke"); await field(p, /^Words$/, "עברית").fill("בהזמנה");
  await p.locator(".savebar").getByRole("button", { name: "Save draft" }).click(); await toast(p, "Draft saved");
  /* nothing public yet */
  assert.doesNotMatch(html("index.html"), /Made slowly, by hand|First band|href="bespoke\//);
  assert.ok(!fs.existsSync(path.join(S.dist, "bespoke/index.html")));
  /* publish everything waiting, in one release */
  await go(p, "");
  const b = await publishAll(p, "Words, bands, a contact number and the bespoke page"); assert.ok(b.ok, b.error);
  const home = html("index.html");
  assert.match(home, /Made slowly, by hand\. Made to be kept\./);
  assert.match(home, /Tel Aviv · Dubai · By private appointment/);
  assert.ok(home.indexOf("Second band") > 0 && home.indexOf("Second band") < home.indexOf("First band"), "the bands in the chosen order");
  assert.ok(home.indexOf("First band") > home.indexOf('id="collection"'), "after the collection");
  assert.match(home, /<form id="cform"[^>]*data-wa="972501234567"/, "the enquiry form offers the new WhatsApp number");
  assert.match(html("about/index.html"), /A letter from the <em>house<\/em>/);
  assert.match(html("bespoke/index.html"), /Bespoke <em>commissions<\/em>/);
  assert.match(html("privacy/index.html"), /<nav class="dnav"[^]*?href="bespoke\/"[^>]*>Bespoke<\/a>/, "the document pages carry the same menu");
  assert.match(html("privacy/index.html"), /href="bespoke\/"[^>]*>Bespoke commissions<\/a>/, "listed under Client care, plainly");
  assert.match(html("he/index.html"), /רצועה שנייה/);
  assert.match(html("sitemap.xml"), /\/isracard\/bespoke\//);
  /* the visitor, on a desktop and on a phone */
  for (const [w, h, name] of [[1366, 900, "desk"], [390, 844, "phone"]]) {
    const v = await anonPage("", { width: w, height: h });
    const link = v.locator('a[href$="bespoke/"]', { hasText: "Bespoke" });
    assert.ok(await link.count() >= 1, "the menu has the new page at " + name);
    assert.ok(await v.locator('footer a[href$="bespoke/"], .end a[href$="bespoke/"], [id="end"] a[href$="bespoke/"]').count() >= 1 || /bespoke\//.test(await v.content()), "listed under Client care");
    await v.locator("text=Second band").first().scrollIntoViewIfNeeded(); await shot(v, `05-band-${name}`);
    const over = await v.evaluate(() => document.scrollingElement.scrollWidth - innerWidth); assert.ok(over <= 0, `no sideways scroll on ${name}: ${over}`);
    const d = await anonPage("bespoke/", { width: w, height: h });
    assert.match(await d.locator("h1").innerText(), /Bespoke/i); await shot(d, `05-page-${name}`);
    /* the document pages switch language in place, as the policies do */
    const he = await anonPage("bespoke/?lang=he", { width: w, height: h });
    await he.locator("h1", { hasText: "הזמנות" }).waitFor(); assert.equal(await he.locator("html").getAttribute("dir"), "rtl");
    await shot(he, `05-page-he-${name}`);
  }
  assert.deepEqual(p.errors, []);
});

/* ── 7 · two people at once, a failed upload, a failed build, no backend ── */
test("7 · simultaneous edits, a failed upload, a failed publication and a backend that is down all end in a plain, recoverable state", async () => {
  const o = state.owner, e = state.editor;
  /* the same piece open in two places */
  await go(o, "products/ring"); await go(e, "products/ring");
  await field(o, "One line").fill("Owner's line, saved first.");
  await field(e, "One line").fill("Editor's line, saved second.");
  await o.getByRole("button", { name: "Save draft" }).click(); await toast(o, "Draft saved");
  await e.getByRole("button", { name: "Save draft" }).click();
  await toast(e, "Someone else saved this page meanwhile");
  await e.locator(".savebar").getByText("Changed elsewhere").waitFor();
  assert.match((await sql("select draft from public.content_docs where key = 'product:ring'"))[0].draft.line.en, /Owner's line/, "nothing overwritten silently");
  await shot(e, "07-conflict");
  /* the editor keeps theirs, knowingly, on top of the owner's */
  await e.getByRole("button", { name: "Keep mine on top of theirs" }).click();
  await e.getByRole("button", { name: "Save draft" }).click(); await toast(e, "Draft saved");
  assert.match((await sql("select draft from public.content_docs where key = 'product:ring'"))[0].draft.line.en, /Editor's line/);
  const vs = await sql("select data->'line'->>'en' l from public.content_revisions where doc_key = 'product:ring' order by id");
  assert.ok(vs.some(v => /Owner's line/.test(v.l)), "the owner's version is still in the history");

  /* an upload that fails on the way */
  await go(e, "media");
  S.fake.faults.storage = true;
  await e.locator("input[type=file]").setInputFiles(jpeg("will-fail.jpg", 1400, 1400, "#333333"));
  await e.locator(".uplog li.bad").waitFor({ timeout: 20000 });
  assert.match(await e.locator(".uplog li.bad").innerText(), /will-fail\.jpg/);
  S.fake.faults.storage = false;
  assert.equal((await sql("select count(*)::int n from public.media_assets where filename = 'will-fail.jpg'"))[0].n, 0, "no half-registered file");
  await e.locator("input[type=file]").setInputFiles(jpeg("will-fail.jpg", 1400, 1400, "#333333"));
  await e.locator(".uplog li.ok, .uplog li.warn").first().waitFor({ timeout: 20000 }).catch(async () => assert.fail("retry: " + await e.locator(".uplog").innerText()));

  /* GitHub refuses the build: said plainly, kept, retried */
  const liveBefore = html("pieces/ring/index.html");
  S.fake.faults.github = true;
  await go(e, "products/ring");
  await e.locator(".savebar").getByRole("button", { name: "Publish", exact: true }).click(); await confirmDialog(e);
  await toast(e, "the site build did not start");
  const r1 = (await sql("select id, status from public.releases order by id desc limit 1"))[0];
  assert.equal(r1.status, "queued", "the release is recorded and waits");
  assert.equal(html("pieces/ring/index.html"), liveBefore, "the site is unchanged");
  S.fake.faults.github = false;
  await go(e, "history/releases");
  const n = S.builds.length;
  await e.locator("tr", { hasText: String(r1.id) }).getByRole("button", { name: "Start the build again" }).click();
  await toast(e, "The build was started again.");
  await S.waitForBuild(n + 1);
  assert.match(html("pieces/ring/index.html"), /Editor's line/);

  /* the build itself fails: the release says so, the last good site stays */
  S.faults.build = true;
  await go(e, "products/ring");
  await field(e, "One line").fill("A line that will not build.");
  const n2 = S.builds.length;
  await e.locator(".savebar").getByRole("button", { name: "Publish", exact: true }).click(); await confirmDialog(e);
  await S.waitForBuild(n2 + 1);
  S.faults.build = false;
  const r2 = (await sql("select status, error from public.releases order by id desc limit 1"))[0];
  assert.equal(r2.status, "failed"); assert.match(r2.error, /made to fail/);
  assert.match(html("pieces/ring/index.html"), /Editor's line/, "the last good release is still the site");
  await go(e, "history/releases");
  await e.getByText("The build failed: the site still shows the previous version").first().waitFor();
  await shot(e, "07-build-failed");
  /* and the next build is of the newest release that did not fail */
  const n3 = S.builds.length; await S.siteBuild(null); await S.waitForBuild(n3 + 1);
  assert.match(html("pieces/ring/index.html"), /Editor's line/);

  /* the backend is unreachable: the work on screen is kept on this device */
  await go(e, "products/ring");
  await field(e, "One line").fill("Typed while the backend was down.");
  S.fake.faults.down = true;
  await e.getByRole("button", { name: "Save draft" }).click();
  await e.locator(".toast.bad").first().waitFor();
  await e.locator(".savebar").getByText("Unsaved changes").waitFor();
  await shot(e, "07-backend-down");
  /* the visitor's form says it was not sent, and keeps what they wrote */
  const v = await anonPage("#concierge");
  await fillEnquiry(v, { name: "Dana Down", contact: "dana.down@example.test", message: "Testing while the backend is down." });
  await v.click("#csend");
  await v.locator("#cerr", { hasText: "could not be sent" }).waitFor({ timeout: 20000 }).catch(async () => assert.fail("form said: " + JSON.stringify(await v.evaluate(() => ({ err: document.getElementById("cerr").textContent, hidden: document.getElementById("cerr").hidden, cls: document.getElementById("cform").className, ferr: [...document.querySelectorAll(".ferr")].map(x => x.textContent).join("|") })))));
  assert.equal(await v.evaluate(() => document.getElementById("cform").classList.contains("delivered")), false, "no thank-you");
  assert.equal(await v.inputValue("#fMsg"), "Testing while the backend is down.", "what they wrote is kept");
  S.fake.faults.down = false;
  /* back up: reload, and the unsaved words are still there */
  await e.reload(); await e.waitForLoadState("networkidle");
  await e.getByText("Unsaved work from earlier on this device was restored.").waitFor();
  assert.equal(await field(e, "One line").inputValue(), "Typed while the backend was down.");
  await e.getByRole("button", { name: "Save draft" }).click(); await toast(e, "Draft saved");
  assert.equal((await sql("select count(*)::int n from public.enquiries where email = 'dana.down@example.test'"))[0].n, 0, "nothing claimed that was not saved");
});

/* ── 8 · a real enquiry from the site, with a design from The Line ───── */
const events = async () => (await sql("select name, session_id, product_key as product, props from public.analytics_events order by id")).map(r => ({ ...r }));
async function visitor(opts = {}) {
  const c = await context(opts); const v = await page(c);
  /* WhatsApp would open another site: stopped here, the click is what matters */
  await c.route(/wa\.me|api\.whatsapp\.com/, r => r.fulfill({ status: 204 }));
  v.collect = []; v.on("request", r => { if (r.url().endsWith("/functions/v1/collect") && r.method() === "POST") v.collect.push(r.postData()); });
  return v;
}
const flush = async (v) => { await v.evaluate(() => document.dispatchEvent(new Event("visibilitychange"))); await v.waitForTimeout(800); };

test("8 · a visitor designs a bracelet and sends an enquiry: one record, their design and details, seen by support, a truthful thank-you; a WhatsApp click is counted apart", async () => {
  /* a support person again (the first was removed in check 2) */
  await invite(state.owner, "care@silavu.test", "support", "Carmel Care");
  const su = await accept("care@silavu.test", "care-password-12"); state.support = su;
  const before = (await sql("select count(*)::int n from public.enquiries"))[0].n;
  const v = await visitor(); await v.goto(S.siteUrl + "/");
  await v.click('#consent [data-c="yes"]');
  /* The Line: oval, natural, 8 carats, yellow gold, a 16 cm wrist */
  await v.evaluate(() => document.getElementById("build").scrollIntoView());
  /* the steps open one after another; each choice is a press on its chip */
  for (const [k, val] of [["cut", "oval"], ["origin", "natural"], ["ct", "8"], ["metal", "yellow"], ["wrist", "16"]]) { await v.locator(`#opts .chip[data-k="${k}"][data-v="${val}"]`).evaluate(el => el.click()); await v.waitForTimeout(150); }
  assert.deepEqual(await v.evaluate(() => { const b = window.__build || {}; return [b.cut, b.origin, +b.ct, b.metal, +b.wrist]; }), ["oval", "natural", 8, "yellow", 16]);
  await v.locator("#reserve").evaluate(el => el.click());
  await v.locator("#csel:not([hidden])").waitFor();
  await fillEnquiry(v, { name: "Noa Test", contact: "noa.test@example.test", city: "Haifa", message: "Could this be ready by spring?" });
  await v.click("#csend");
  await v.locator("#cform.delivered").waitFor({ timeout: 20000 });
  const thanks = await v.textContent("#cthp");
  const e = (await sql("select * from public.enquiries where email = 'noa.test@example.test'"));
  assert.equal(e.length, 1, "one record");
  assert.ok(thanks.includes(e[0].ref), "the thank-you gives the saved reference " + e[0].ref);
  assert.doesNotMatch(thanks, /confirmation is on its way/i, "no promise of an email nobody sends (auto-reply is off here)");
  assert.deepEqual({ cut: e[0].spec.cut, origin: e[0].spec.origin, ct: Number(e[0].spec.ct), metal: e[0].spec.metal, wrist: Number(e[0].spec.wrist) }, { cut: "oval", origin: "natural", ct: 8, metal: "yellow", wrist: 16 });
  assert.equal(e[0].name, "Noa Test"); assert.equal(e[0].city, "Haifa"); assert.equal(e[0].message, "Could this be ready by spring?");
  assert.ok(e[0].config_rev, "the configurator version it was made with is kept");
  assert.equal((await sql("select count(*)::int n from public.enquiries"))[0].n, before + 1);
  state.enquiry = e[0];
  await shot(v, "08-thank-you");
  /* sent is sent: the button is gone until they choose to write again (a
     retry before the answer reuses the same key: backend-storefront.test) */
  assert.equal(await v.locator("#csend").isVisible(), false);

  /* support sees it, with the design, and works it */
  await go(su, "enquiries");
  await su.getByRole("link", { name: e[0].ref }).click();
  await su.getByText("Their design (The Line)").waitFor();
  for (const w of ["Oval", "Natural", "8 ct", "16 cm"]) await su.locator(".meta", { hasText: w }).first().waitFor();
  await su.getByLabel("Status").first().selectOption("contacted"); await toast(su, "Saved.");
  await su.getByLabel("Add a note").fill("Called back, prefers a visit in Tel Aviv."); await su.getByRole("button", { name: "Add the note" }).click();
  await su.locator(".notes li", { hasText: "prefers a visit" }).waitFor();
  await shot(su, "08-enquiry-in-admin");
  /* the editor and the analyst cannot see it */
  assert.ok((await (await rest("enquiries?select=id", await tokenFor("analyst@silavu.test", "analyst-password-1"))).text()) === "[]");

  /* WhatsApp: a click to another app is a click, never an enquiry */
  const w = await visitor(); await w.goto(S.siteUrl + "/"); await w.click('#consent [data-c="yes"]');
  await fillEnquiry(w, { name: "Wa Test", contact: "+972 50 765 4321", message: "Hello" });
  await w.locator('.chan .chip[data-ch="WhatsApp"]').click();
  await w.click("#csend"); await flush(w);
  await w.waitForTimeout(4500);
  assert.equal((await sql("select count(*)::int n from public.enquiries where name = 'Wa Test'"))[0].n, 0, "not an enquiry");
  const clicks = (await events()).filter(x => x.name === "contact_click");
  assert.ok(clicks.some(x => (x.props || {}).channel === "whatsapp"), "counted as a WhatsApp click");
});

/* ── 9 · a quote keeps what was quoted ───────────────────────────────── */
test("9 · support makes a quote from the enquiry, sends it; editing the product later changes nothing in the quote or the customer's copy", async () => {
  const su = state.support;
  await go(su, "enquiries/" + state.enquiry.id);
  await su.getByRole("button", { name: "Make a quote" }).click();
  await su.locator("h1", { hasText: /^Q-/ }).waitFor();
  await su.getByLabel("What it is for").fill("SILAVU The Line, oval, natural, 8 ct, yellow gold");
  await su.getByLabel("Amount").fill("48000"); await su.getByLabel("Currency").selectOption("ILS");
  await su.getByLabel("Valid until").fill("2026-12-31");
  await su.getByLabel("Note to the customer (on their copy)").fill("Made to order in eight weeks.");
  await su.getByLabel("Internal note (never on their copy)").fill("Margin check with the workshop.");
  await su.getByRole("button", { name: "Save", exact: true }).click(); await toast(su, "Saved.");
  await su.getByRole("button", { name: "Mark as sent" }).click(); await confirmDialog(su); await toast(su, "Saved.");
  const qrow = (await sql("select * from public.quotes where enquiry_id = $1", [state.enquiry.id]))[0];
  assert.equal(qrow.status, "sent"); assert.equal(Number(qrow.amount_minor), 4800000); assert.equal(qrow.currency, "ILS");
  assert.equal(qrow.spec_snapshot.cut, "oval");
  /* once sent the amount is fixed, even straight at the API */
  const r = await rest("rpc/update_quote", await tokenFor("care@silavu.test", "care-password-12"), { method: "POST", body: JSON.stringify({ p_id: qrow.id, p_expected_rev: qrow.rev, p: { amount_minor: 100 } }) });
  assert.equal(Number((await sql("select amount_minor from public.quotes where id = $1", [qrow.id]))[0].amount_minor), 4800000, "amount unchanged (" + r.status + ")");
  /* the customer's copy: the amount, the design, their note; nothing internal */
  const pr = await page(su.context());
  await pr.goto(S.adminUrl + "#/print/" + qrow.id);
  await pr.locator(".print .amount").waitFor();
  const copy = await pr.locator(".print").innerText();
  assert.match(copy, /₪48,000/); assert.match(copy, /Made to order in eight weeks\./); assert.match(copy, /Oval/);
  assert.doesNotMatch(copy, /Margin check|workshop/, "no internal note");
  await shot(pr, "09-customer-copy"); await pr.close();
  state.quote = qrow;   /* check 11 takes the oval off the line and looks again */
});

/* ── 10 · counting visits: consent, dedupe, opt-out, never the house ─── */
test("10 · visits are counted only with consent, once each, never after a no, never with Global Privacy Control, never from the admin's browser; the analyst sees and filters them", async () => {
  const n0 = (await events()).length;
  /* no answer yet, then no: nothing */
  const a = await visitor(); await a.goto(S.siteUrl + "/"); await a.waitForTimeout(5000);
  assert.equal(a.collect.length, 0, "nothing before an answer");
  await a.click('#consent [data-c="no"]'); await a.goto(S.siteUrl + "/pieces/knot/"); await flush(a); await a.waitForTimeout(4500);
  assert.equal(a.collect.length, 0, "nothing after a no");
  /* Global Privacy Control is a no */
  const g = await visitor({ init: () => Object.defineProperty(navigator, "globalPrivacyControl", { get: () => true }) });
  await g.goto(S.siteUrl + "/pieces/ring/"); await flush(g); await g.waitForTimeout(4500);
  assert.equal(g.collect.length, 0, "GPC");
  assert.equal(await g.locator("#consent").count(), 0, "and it is not even asked");
  /* the house's own browser */
  const h = await visitor({ staffBrowser: true }); await h.goto(S.siteUrl + "/pieces/knot/"); await h.waitForTimeout(5000);
  assert.equal(h.collect.length, 0, "the admin's browser is never counted");
  /* yes: counted; the same batch sent twice is stored once */
  const y = await visitor({ width: 390, height: 844 });
  await y.goto(S.siteUrl + "/"); await y.click('#consent [data-c="yes"]');
  await y.goto(S.siteUrl + "/pieces/ring/"); await flush(y); await y.waitForTimeout(4500);
  assert.ok(y.collect.length >= 1);
  const mid = (await events()).length; assert.ok(mid > n0, "counted");
  /* a batch that arrives twice (a retry, a beacon and a fetch) is stored once */
  const batch = JSON.stringify({ events: [{ id: crypto.randomUUID(), ts: new Date().toISOString(), name: "page_view", sid: "dedupe-test-01", path: "/isracard/", lang: "en" }] });
  for (let i = 0; i < 2; i++) assert.ok((await fetch(S.fake.url + "/functions/v1/collect", { method: "POST", headers: { "content-type": "text/plain", origin: S.origin, "user-agent": UA.desk }, body: batch })).status < 300);
  assert.equal((await events()).filter(x => x.session_id === "dedupe-test-01").length, 1, "stored once");
  assert.ok((await sql("select 1 from public.analytics_events where device = 'mobile' and product_key = 'ring' and name = 'product_view'")).length >= 1, "the phone visit to the ring, counted");
  /* nothing personal in what is stored */
  const raw = JSON.stringify(await sql("select * from public.analytics_events"));
  for (const bad of ["noa.test@example.test", "Noa Test", "+972", "Could this be ready"]) assert.ok(!raw.includes(bad), "no form content in analytics: " + bad);
  /* withdrawn: from the foot of the page, at any time */
  await y.evaluate(() => window.__consent.open()); await y.click('#consent [data-c="no"]');
  const sent = y.collect.length; await y.goto(S.siteUrl + "/pieces/knot/"); await flush(y); await y.waitForTimeout(4500);
  assert.equal(y.collect.length, sent, "nothing after withdrawing");

  /* the analyst: totals, a breakdown, a filter */
  const an = state.analyst; await go(an, "analytics");
  await an.locator(".stat", { hasText: "Sessions" }).first().waitFor();
  const sessions = Number(await an.locator(".stat", { hasText: /^Sessions/ }).locator(".sv").first().innerText());
  assert.ok(sessions >= 2, "sessions " + sessions);
  await an.getByRole("tab", { name: "Pieces" }).click().catch(() => {});
  await an.locator(".filters label.fld", { hasText: "Device" }).locator("select").selectOption("mobile");
  await an.waitForTimeout(800);
  const mobile = Number(await an.locator(".stat", { hasText: /^Sessions/ }).locator(".sv").first().innerText());
  assert.ok(mobile >= 1 && mobile <= sessions, `mobile ${mobile} of ${sessions}`);
  await shot(an, "10-analytics");
  const ov = await rest("rpc/analytics_overview", await tokenFor("analyst@silavu.test", "analyst-password-1"), { method: "POST", body: JSON.stringify({ p_from: new Date(Date.now() - 86400000).toISOString(), p_to: new Date(Date.now() + 60000).toISOString(), p_filters: {} }) });
  const o = await ov.json();
  assert.equal(o.enquiries_saved, (await sql("select count(*)::int n from public.enquiries where created_at > now() - interval '1 day'"))[0].n, "enquiries come from the enquiry records, not from events");
  assert.ok(o.contact_clicks >= 1);
});
