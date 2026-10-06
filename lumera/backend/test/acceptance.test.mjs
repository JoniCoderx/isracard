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
async function context({ width = 1280, height = 900, lang, staffBrowser = false, init } = {}) {
  const c = await browser.newContext({ viewport: { width, height }, locale: lang === "he" ? "he-IL" : "en-GB" });
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
