// A published release, built into the real site: every kind of content edit
// reaches every place it should, and nothing unsafe gets through.
// node --test lumera/site/test/content.test.mjs   (needs lumera/node_modules for the minifier)
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SITE = new URL("..", import.meta.url).pathname;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "silavu-content-"));
// the page sits next to the real one: the generator finds public/ beside it
const REL = path.join(TMP, "release.json"), PAGE = SITE + "silavu-page.test-" + process.pid + ".html", DIST = path.join(TMP, "dist");
after(() => { fs.rmSync(PAGE, { force: true }); });
const read = (p) => fs.readFileSync(path.join(DIST, p), "utf8");
const all = (dir = DIST) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(f => f.isDirectory() ? all(path.join(dir, f.name)) : f.name.endsWith(".html") ? [path.join(dir, f.name)] : []);

before(async () => {
  const { publicRelease } = await import(SITE + "src/content/load.mjs");
  const { stringInventory } = await import(SITE + "src/content/apply.mjs");
  const r = publicRelease(); const d = r.snapshot.docs;
  const inv = stringInventory(fs.readFileSync(SITE + "silavu-page.html", "utf8"));
  const heroLine = inv.find(s => s.section === "hero" && s.tag === "p");
  const bookLink = inv.find(s => s.section === "hero" && s.tag === "a" && s.href === "#concierge");
  const knot = d["product:knot"].data;
  knot.name = { en: "SILAVU <em>MOMENTO</em>", he: "SILAVU <em>MOMENTO</em>" };
  knot.price = { mode: "exact", amounts: { ILS: 1250000 }, base: "ILS" };
  delete d["product:ring"]; r.snapshot.archived.push("product:ring");
  d.strings.data.overrides = {
    [heroLine.key]: { en: "A new *opening* line", he: "שורה *חדשה*" },
    [bookLink.key]: { en: "<script>alert(1)</script>", he: "x", href: "javascript:alert(1)" }
  };
  d["page:home"].data.sections.house = { hidden: true };
  d["page:home"].data.blocks = [{ id: "b1", after: "collection", theme: "dark", title: { en: "Made for *you*", he: "נעשה *בשבילכם*" }, text: { en: "A band of text.", he: "פס טקסט." }, cta: { label: { en: "Write to us", he: "כתבו לנו" }, href: "#concierge" } }];
  d.settings.data.contact = { email: "house@example.com", whatsapp: "+972 50-123-4567", phone: "" };
  d.settings.data.socials.instagram = "https://www.instagram.com/silavu.test/";
  d.settings.data.announcement = { enabled: true, text: { en: "Viewings in Tel Aviv this week", he: "פגישות בתל אביב השבוע" }, href: "#concierge" };
  const cfg = d.configurator.data;
  cfg.cuts.find(c => c.id === "pear").enabled = false;
  cfg.metals.find(m => m.id === "rose").en = "18K rose gold, warm";
  cfg.defaults.metal = "rose";
  cfg.carat.options = [3, 5, 7];
  d.seo.data.home.title = { en: "SILAVU | Test Title", he: "SILAVU | כותרת" };
  d.translations.data.fr = { "Collection": "La Collection (test)" };
  d["docpage:care-guide"] = { kind: "docpage", sort: 0, rev: 1, data: { slug: "care-guide", title: { en: "Care guide", he: "מדריך טיפול" }, lede: { en: "How to keep it bright.", he: "איך לשמור על הברק." },
    blocks: [{ type: "heading", text: { en: "Cleaning", he: "ניקוי" } }, { type: "paragraph", text: { en: "Warm water and a *soft* brush. <b>no</b>", he: "מים חמימים." } }, { type: "button", label: { en: "Ask us", he: "שאלו" }, href: "javascript:alert(1)" }] } };
  r.release = 42;
  fs.writeFileSync(REL, JSON.stringify(r));
  const env = { ...process.env, SILAVU_RELEASE: REL, SILAVU_PAGE_OUT: PAGE };
  execFileSync("node", ["build.mjs"], { cwd: SITE + "src", env, stdio: "pipe" });
  execFileSync("node", ["gen-static.mjs", PAGE, DIST, "https://jonicoderx.github.io/isracard/"], { cwd: SITE, env, stdio: "pipe" });
});

test("a product edit reaches the card, its page, both languages and the structured data", () => {
  const idx = read("index.html"), pg = read("pieces/knot/index.html"), he = read("he/pieces/knot/index.html");
  assert.match(idx, /SILAVU <em>MOMENTO<\/em>/);
  assert.match(pg, /MOMENTO/); assert.match(he, /MOMENTO/);
  assert.match(idx, /₪12,500/);
  assert.match(pg, /₪12,500/);
  assert.match(pg, /"price":"12500.00","priceCurrency":"ILS"/);
  assert.ok(!/MOMENTO[\s\S]{0,4000}Price on request/.test(idx.slice(idx.indexOf('id="p-knot"'), idx.indexOf('id="p-knot"') + 4000)), "the card no longer says on request");
});

test("an archived product disappears everywhere", () => {
  assert.ok(!read("index.html").includes('id="p-ring"'));
  assert.ok(!fs.existsSync(path.join(DIST, "pieces/ring/index.html")));
  assert.ok(!read("sitemap.xml").includes("pieces/ring/"));
});

test("page text: both languages change, unsafe text and links are neutralised", () => {
  const idx = read("index.html"), he = read("he/index.html");
  assert.match(idx, /A new <em>opening<\/em> line/);
  assert.match(he, /שורה <em>חדשה<\/em>/);
  assert.ok(!idx.includes("<script>alert(1)</script>"));
  assert.match(idx, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.ok(!all().some(f => /href="javascript:/i.test(fs.readFileSync(f, "utf8"))));
});

test("a hidden chapter is gone, and so is every link to it; a new band is in place", () => {
  const idx = read("index.html");
  assert.ok(!idx.includes('<section id="house"'));
  assert.ok(!idx.includes('href="#house"'));
  assert.match(idx, /class="cmsband dark" id="b-b1"/);
  assert.ok(idx.indexOf('id="b-b1"') > idx.indexOf('<section id="collection"'));
  assert.ok(idx.indexOf('id="b-b1"') < idx.indexOf('<section id="macro"'));
});

test("settings: the house address everywhere, WhatsApp, a confirmed social account, the announcement", () => {
  for (const f of all()) assert.ok(!fs.readFileSync(f, "utf8").includes("concierge@silavu.com"), path.relative(DIST, f));
  const idx = read("index.html");
  assert.match(idx, /house@example\.com/);
  assert.match(idx, /data-wa="972501234567"/);
  const js = fs.readdirSync(path.join(DIST, "assets")).filter(f => f.endsWith(".js")).map(f => fs.readFileSync(path.join(DIST, "assets", f), "utf8")).join("\n");
  assert.ok(js.includes("https://www.instagram.com/silavu.test/"));
  assert.match(idx, /class="annbar"/);
  assert.ok(read("privacy/index.html").includes("house@example.com"));
});

test("the configurator offers what was set, opening on the defaults", () => {
  const idx = read("index.html");
  assert.ok(!idx.includes('data-k="cut" data-v="pear"'));
  assert.match(idx, /<button class="chip on" data-k="metal" data-v="rose">[\s\S]*?18K rose gold, warm/);
  assert.ok(!/class="chip on" data-k="metal" data-v="white"/.test(idx));
  const cts = [...idx.matchAll(/data-k="ct" data-v="(\d+)"/g)].map(m => m[1]);
  assert.deepEqual(cts, ["3", "5", "7"]);
  const js = fs.readdirSync(path.join(DIST, "assets")).map(f => fs.readFileSync(path.join(DIST, "assets", f), "utf8")).join("\n");
  assert.match(js, /__build=\{origin:"lab",ct:3,metal:"rose",wrist:17,cut:"round"\}/);
});

test("a new page: written, in the sitemap and the footer, its text kept plain", () => {
  const pg = read("care-guide/index.html");
  assert.match(pg, /<h1 data-doc-title[^>]*>Care guide<\/h1>/);
  assert.match(pg, /Warm water and a <em>soft<\/em> brush. &lt;b&gt;no&lt;\/b&gt;/);
  assert.ok(!pg.includes("javascript:"));
  assert.match(read("sitemap.xml"), /care-guide\//);
  assert.match(read("index.html"), /href="care-guide\/"/);
});

test("search and other languages", () => {
  assert.match(read("index.html"), /<title[^>]*>SILAVU \| Test Title<\/title>/);
  assert.equal(JSON.parse(read("lang/fr.json"))["Collection"], "La Collection (test)");
  const pub = JSON.parse(read("_content/release.json"));
  assert.equal(pub.release, 42);
  assert.ok(pub.snapshot.archived.includes("product:ring"));
});

test("without a release the site is exactly the committed one", async () => {
  const out = path.join(TMP, "seed.html");
  execFileSync("node", ["build.mjs"], { cwd: SITE + "src", env: { ...process.env, SILAVU_RELEASE: path.join(TMP, "none.json"), SILAVU_PAGE_OUT: out }, stdio: "pipe" });
  assert.equal(fs.readFileSync(out, "utf8"), fs.readFileSync(SITE + "silavu-page.html", "utf8"));
});
