// The edge functions, run in Node against the local test database: the same
// handlers Supabase serves, with the platform pieces (Auth, Storage, the
// network) replaced by small fakes and the database left real.
// node --experimental-strip-types --test test/functions.test.mjs
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import zlib from "node:zlib";
import pg from "pg";

const F = new URL("../supabase/functions/", import.meta.url).pathname;
const H = {};
for (const n of ["enquiry", "collect", "publish", "release-snapshot", "release-status", "staff", "media", "export", "setup", "status", "maintenance"]) H[n] = (await import(F + n + "/handler.ts")).handler;

const db = new pg.Client({ host: process.env.PGHOST || "/tmp", port: +(process.env.PGPORT || 54329), user: "postgres", database: "silavu_test" });
const U = {};
const store = new Map(), stamps = new Map(), passwords = new Map(), calls = [], banned = [];
let fetchImpl = async () => new Response("{}", { status: 200 });
const ENV = { ALLOWED_ORIGINS: "https://jonicoderx.github.io", RATE_SALT: "test", BUILD_TOKEN: "b".repeat(40), SITE_URL: "https://jonicoderx.github.io/isracard", ADMIN_URL: "https://jonicoderx.github.io/isracard/admin/" };
let env = { ...ENV };

async function asRole(role, claims, sql, params) {
  await db.query("begin");
  try {
    await db.query(`set local role ${role}`);
    if (claims) await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    const r = await db.query(sql, params); await db.query("commit"); return r;
  } catch (e) { await db.query("rollback"); throw e; }
}
const call = (fn, args) => { const ks = Object.keys(args); return `select public.${fn}(${ks.map((k, i) => `${k} => $${i + 1}`).join(", ")}) as r`; };
const val = (v) => v === null || v === undefined ? null : typeof v === "object" && !Array.isArray(v) ? JSON.stringify(v) : Array.isArray(v) && v.some(x => typeof x === "object") ? JSON.stringify(v) : v;
const tok = (id, aal = "aal1") => "h." + Buffer.from(JSON.stringify({ sub: id, aal })).toString("base64url") + ".valid";
const claimsOf = (jwt) => JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString());

const deps = {
  env: (k) => env[k],
  fetch: (u, i) => { calls.push({ url: String(u), init: i }); return fetchImpl(String(u), i); },
  rpc: async (fn, args) => (await asRole("service_role", null, call(fn, args), Object.values(args).map(val))).rows[0].r,
  userRpc: async (jwt, fn, args) => { const c = claimsOf(jwt); return (await asRole("authenticated", { sub: c.sub, role: "authenticated", aal: c.aal }, call(fn, args), Object.values(args).map(val))).rows[0].r; },
  verify: async (jwt) => { if (!jwt.endsWith(".valid")) return null; const c = claimsOf(jwt); return { id: c.sub, aal: c.aal }; },
  storage: {
    signedUrl: async (b, p, s) => `https://signed.example/${b}/${p}?ttl=${s}`,
    download: async (b, p) => { const v = store.get(b + "/" + p); if (!v) throw new Error("not found"); return v; },
    upload: async (b, p, body) => { store.set(b + "/" + p, body); stamps.set(b + "/" + p, new Date().toISOString()); },
    list: async (b) => [...store.keys()].filter(k => k.startsWith(b + "/")).map(k => ({ name: k.slice(b.length + 1), created_at: stamps.get(k) })),
    remove: async (b, ps) => { for (const p of ps) { store.delete(b + "/" + p); stamps.delete(b + "/" + p); } }
  },
  authAdmin: {
    invite: async (email) => ({ id: (await db.query("insert into auth.users (email) values ($1) on conflict (email) do update set email = excluded.email returning id", [email])).rows[0].id }),
    create: async (email, password) => { const r = await db.query("insert into auth.users (email) values ($1) on conflict (email) do nothing returning id", [email]); if (!r.rows.length) throw new Error("conflict: this email already has an account"); passwords.set(r.rows[0].id, password); return { id: r.rows[0].id }; },
    setPassword: async (id, password) => { passwords.set(id, password); },
    ban: async (id) => { banned.push(id); }
  }
};
const req = (method, body, { token, origin = "https://jonicoderx.github.io", ip = "203.0.113.9", ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1" } = {}) =>
  new Request("https://fn.example/x", { method, headers: { "content-type": "application/json", ...(origin ? { origin } : {}), "x-forwarded-for": ip, "user-agent": ua, ...(token ? { authorization: "Bearer " + token } : {}) }, body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body) });

before(async () => {
  await db.connect();
  for (const n of ["owner", "editor", "support", "analyst"]) U[n] = (await db.query("insert into auth.users (email) values ($1) returning id", [n + "@fn.example"])).rows[0].id;
  await db.query("select app.bootstrap_owner('owner@fn.example')");
  for (const n of ["editor", "support", "analyst"]) await db.query("select app.add_staff($1, $2, $3, $4)", [U.owner, U[n], n + "@fn.example", n]);
});
after(async () => { await db.end(); });

test("setup imports the live site's content once, then leaves it alone", async () => {
  const { publicRelease } = await import(new URL("../../site/src/content/load.mjs", import.meta.url).pathname);
  fetchImpl = async (u) => u.endsWith("/_content/release.json") ? new Response(JSON.stringify(publicRelease())) : new Response("", { status: 404 });
  assert.equal((await H.setup(req("POST", { action: "import" }, { token: tok(U.editor) }), deps)).status, 403);
  const r1 = await (await H.setup(req("POST", { action: "import" }, { token: tok(U.owner) }), deps)).json();
  assert.ok(r1.imported >= 15, JSON.stringify(r1));
  const r2 = await (await H.setup(req("POST", { action: "import" }, { token: tok(U.owner) }), deps)).json();
  assert.equal(r2.imported, 0);
  const live = (await db.query("select status from public.releases order by id limit 1")).rows[0].status;
  assert.equal(live, "live");
});

test("enquiry: saved once, notified separately, validated, rate-limited, origin-checked", async () => {
  const body = { idem: crypto.randomUUID(), name: "Noa", contact: "noa@example.com", city: "Haifa", channel: "Email", want: "A piece from the collection", product: "knot", message: "Hi", lang: "en" };
  const r = await H.enquiry(req("POST", body), deps); const j = await r.json();
  assert.equal(r.status, 200); assert.match(j.ref, /^E-\d{4}-\d{4}$/); assert.equal(j.duplicate, false);
  assert.equal(r.headers.get("access-control-allow-origin"), "https://jonicoderx.github.io");
  const again = await (await H.enquiry(req("POST", body), deps)).json();
  assert.equal(again.id, j.id); assert.equal(again.duplicate, true);
  assert.equal((await db.query("select notify_status from public.enquiries where id = $1", [j.id])).rows[0].notify_status, "off");
  // with mail connected; the provider failing does not lose the enquiry
  env = { ...ENV, RESEND_API_KEY: "re_x", MAIL_FROM: "SILAVU <concierge@silavu.com>", NOTIFY_TO: "concierge@silavu.com", AUTO_REPLY: "on" };
  fetchImpl = async () => new Response("{}", { status: 500 });
  const f = await (await H.enquiry(req("POST", { ...body, idem: crypto.randomUUID() }, { ip: "203.0.113.10" }), deps)).json();
  assert.equal(f.ok, true);
  const row = (await db.query("select notify_status, notify_error from public.enquiries where id = $1", [f.id])).rows[0];
  assert.equal(row.notify_status, "failed"); assert.match(row.notify_error, /500/);
  fetchImpl = async () => new Response("{}", { status: 200 }); calls.length = 0;
  const s = await (await H.enquiry(req("POST", { ...body, idem: crypto.randomUUID() }, { ip: "203.0.113.11" }), deps)).json();
  assert.equal((await db.query("select notify_status from public.enquiries where id = $1", [s.id])).rows[0].notify_status, "sent");
  assert.equal(calls.filter(c => c.url.includes("resend")).length, 2, "the house, and the reader's confirmation");
  env = { ...ENV };
  // bad details, a foreign origin, a flood, a huge body
  const bad = await H.enquiry(req("POST", { ...body, idem: crypto.randomUUID(), contact: "nope@" }, { ip: "203.0.113.12" }), deps);
  assert.equal(bad.status, 400); assert.deepEqual((await bad.json()).fields, ["email"]);
  assert.equal((await H.enquiry(req("POST", body, { origin: "https://evil.example" }), deps)).status, 403);
  let last; for (let i = 0; i < 6; i++) last = await H.enquiry(req("POST", { ...body, idem: crypto.randomUUID() }, { ip: "198.51.100.1" }), deps);
  assert.equal(last.status, 429);
  assert.equal((await H.enquiry(req("POST", JSON.stringify({ name: "x".repeat(30000) }), { ip: "198.51.100.2" }), deps)).status, 413);
});

test("collect: allowlisted events in, robots set aside, nothing for foreign origins", async () => {
  const ev = (name, o = {}) => ({ id: crypto.randomUUID(), ts: new Date().toISOString(), name, sid: "colSESSION01", path: "/isracard/", ...o });
  assert.equal((await H.collect(req("POST", { events: [ev("page_view"), ev("contact_click", { props: { channel: "whatsapp" } })] }), deps)).status, 204);
  assert.equal((await H.collect(req("POST", { events: [ev("page_view", { sid: "colBOT000001" })] }, { ua: "Googlebot/2.1" }), deps)).status, 204);
  const rows = (await db.query("select session_id, is_bot, device, browser from public.analytics_events where session_id like 'col%' order by id")).rows;
  assert.equal(rows.length, 3);
  assert.deepEqual([rows[0].device, rows[0].browser, rows[0].is_bot], ["mobile", "Safari", false]);
  assert.equal(rows[2].is_bot, true);
  assert.equal((await H.collect(req("POST", { events: [ev("page_view")] }, { origin: "https://evil.example" }), deps)).status, 403);
});

test("publish: editors publish and the build is asked for; support cannot; GitHub down is reported, not lost", async () => {
  const rev = (await db.query("select draft_rev from public.content_docs where key = 'product:knot'")).rows[0].draft_rev;
  const data = (await db.query("select draft from public.content_docs where key = 'product:knot'")).rows[0].draft;
  await deps.userRpc(tok(U.editor), "save_draft", { p_key: "product:knot", p_kind: "product", p_title: "MOMENT", p_data: { ...data, line: { en: "Edited line", he: "שורה" } }, p_expected_rev: rev, p_checkpoint: true });
  assert.equal((await H.publish(req("POST", { action: "publish", keys: ["product:knot"] }, { token: tok(U.support) }), deps)).status, 403);
  const nogh = await (await H.publish(req("POST", { action: "publish", keys: ["product:knot"] }, { token: tok(U.editor) }), deps)).json();
  assert.equal(nogh.dispatched, false); assert.equal(nogh.watched, true, "without a token, GitHub's schedule picks it up"); assert.ok(!nogh.error); assert.ok(nogh.release > 1);
  const w = await (await H["release-snapshot"](req("POST", { waiting: true }, { token: ENV.BUILD_TOKEN }), deps)).json();
  assert.equal(Number(w.waiting), nogh.release, "the schedule sees the waiting release");
  assert.equal((await H["release-snapshot"](req("POST", { waiting: true }, { token: tok(U.owner) }), deps)).status, 401);
  env = { ...ENV, GH_TOKEN: "ghp_x", GH_REPO: "JoniCoderx/isracard" }; calls.length = 0;
  fetchImpl = async () => new Response(null, { status: 204 });
  const ok = await (await H.publish(req("POST", { action: "retry", release: nogh.release }, { token: tok(U.editor) }), deps)).json();
  assert.equal(ok.dispatched, true);
  const gh = calls.find(c => c.url.includes("api.github.com"));
  assert.deepEqual(JSON.parse(gh.init.body), { event_type: "silavu-publish", client_payload: { release: nogh.release } });
  assert.equal((await H.publish(req("POST", { action: "republish", release: 1 }, { token: tok(U.editor) }), deps)).status, 403);
  const nothing = await H.publish(req("POST", { action: "publish", keys: ["product:knot"] }, { token: tok(U.editor) }), deps);
  assert.equal(nothing.status, 422);
  env = { ...ENV };
});

test("the build: snapshot only with the build token, media links signed, status reported", async () => {
  assert.equal((await H["release-snapshot"](req("POST", {}, { token: "wrong" }), deps)).status, 401);
  assert.equal((await H["release-snapshot"](req("POST", {}, { token: tok(U.owner) }), deps)).status, 401, "a staff session is not the build token");
  const r = await (await H["release-snapshot"](req("POST", {}, { token: ENV.BUILD_TOKEN }), deps)).json();
  assert.equal(r.snapshot.docs["product:knot"].data.line.en, "Edited line");
  assert.ok(Array.isArray(r.media));
  assert.equal((await H["release-status"](req("POST", { release: r.release, status: "live", url: "https://github.com/JoniCoderx/isracard/actions/runs/1" }, { token: ENV.BUILD_TOKEN }), deps)).status, 200);
  assert.equal((await db.query("select status from public.releases where id = $1", [r.release])).rows[0].status, "live");
  assert.equal((await H["release-status"](req("POST", { release: r.release, status: "hacked" }, { token: ENV.BUILD_TOKEN }), deps)).status, 400);
  /* once a release is live, nothing older is waiting: the site never steps back */
  assert.equal((await (await H["release-snapshot"](req("POST", { waiting: true }, { token: ENV.BUILD_TOKEN }), deps)).json()).waiting, null);
  assert.equal((await db.query("select count(*)::int n from public.releases where status = 'queued' and id < $1", [r.release])).rows[0].n, 0);
});

test("media: the bytes must be what they claim; the real size is recorded", async () => {
  const png = (w, h) => { const b = new Uint8Array(64); b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]); new DataView(b.buffer).setUint32(16, w); new DataView(b.buffer).setUint32(20, h); return b; };
  const reg = async (bytes, mime) => {
    const id = crypto.randomUUID(), path = `originals/${id}.${mime === "image/png" ? "png" : "jpg"}`;
    await db.query("insert into storage.objects (bucket_id, name) values ('media', $1)", [path]); store.set("media/" + path, bytes);
    return await deps.userRpc(tok(U.editor), "register_media", { p_path: path, p_kind: "image", p_mime: mime, p_bytes: bytes.length, p_width: 10, p_height: 10, p_filename: "x", p_sha256: null, p_folder: "", p_tags: [] });
  };
  const good = await reg(png(1254, 1600), "image/png");
  const g = await (await H.media(req("POST", { asset: good }, { token: tok(U.editor) }), deps)).json();
  assert.equal(g.ok, true); assert.equal(g.width, 1254); assert.equal(g.height, 1600);
  const fake = await reg(new TextEncoder().encode("<html><script>alert(1)</script></html>"), "image/png");
  const f = await (await H.media(req("POST", { asset: fake }, { token: tok(U.editor) }), deps)).json();
  assert.equal(f.ok, false);
  assert.equal((await db.query("select status from public.media_assets where id = $1", [fake])).rows[0].status, "rejected");
  assert.equal((await H.media(req("POST", { asset: good }, { token: tok(U.support) }), deps)).status, 403);
});

test("staff: only the owner invites and revokes; a revoked account is also blocked at Auth", async () => {
  assert.equal((await H.staff(req("POST", { action: "invite", email: "new@fn.example", role: "editor" }, { token: tok(U.editor) }), deps)).status, 403);
  const r = await (await H.staff(req("POST", { action: "invite", email: "new@fn.example", role: "support", name: "New" }, { token: tok(U.owner) }), deps)).json();
  assert.equal(r.ok, true);
  assert.equal((await db.query("select role from public.staff where user_id = $1", [r.user])).rows[0].role, "support");
  assert.equal((await H.staff(req("POST", { action: "invite", email: "x@fn.example", role: "god" }, { token: tok(U.owner) }), deps)).status, 400);
  await H.staff(req("POST", { action: "revoke", user: r.user }, { token: tok(U.owner) }), deps);
  assert.ok(banned.includes(r.user));
  assert.equal((await db.query("select active from public.staff where user_id = $1", [r.user])).rows[0].active, false);
  /* without email: an account ready at once with a password the owner hands over, and a new password set by the owner */
  assert.equal((await H.staff(req("POST", { action: "invite", email: "pw@fn.example", role: "editor", password: "short" }, { token: tok(U.owner) }), deps)).status, 400);
  const p = await (await H.staff(req("POST", { action: "invite", email: "pw@fn.example", role: "editor", password: "a-long-enough-pw" }, { token: tok(U.owner) }), deps)).json();
  assert.equal(passwords.get(p.user), "a-long-enough-pw");
  assert.equal((await H.staff(req("POST", { action: "invite", email: "pw@fn.example", role: "editor", password: "a-long-enough-pw" }, { token: tok(U.owner) }), deps)).status, 409, "an existing account is not taken over");
  assert.equal((await H.staff(req("POST", { action: "set_password", user: p.user, password: "another-long-pw" }, { token: tok(U.editor) }), deps)).status, 403);
  assert.equal((await H.staff(req("POST", { action: "set_password", user: p.user, password: "another-long-pw" }, { token: tok(U.owner) }), deps)).status, 200);
  assert.equal(passwords.get(p.user), "another-long-pw");
  assert.equal((await H.staff(req("POST", { action: "set_password", user: r.user, password: "another-long-pw" }, { token: tok(U.owner) }), deps)).status, 404, "not for someone removed");
});

test("export: the owner gets a ten-minute link; nobody else; the schedule stores without returning data", async () => {
  assert.equal((await H.export(req("POST", {}, { token: tok(U.analyst) }), deps)).status, 403);
  const r = await (await H.export(req("POST", {}, { token: tok(U.owner) }), deps)).json();
  assert.match(r.url, /ttl=600/);
  const data = JSON.parse(zlib.gunzipSync(Buffer.from(store.get("exports/" + r.name))).toString());
  assert.equal(data.format, "silavu-export"); assert.ok(data.enquiries.length > 0); assert.ok(data.content_docs.length > 10);
  const s = await (await H.export(req("POST", { scheduled: true }, { token: ENV.BUILD_TOKEN }), deps)).json();
  assert.ok(s.name && !s.url);
});

test("status says what is connected, never a secret", async () => {
  env = { ...ENV, GH_TOKEN: "ghp_secret", GH_REPO: "JoniCoderx/isracard", RESEND_API_KEY: "re_secret", MAIL_FROM: "a@b.c", NOTIFY_TO: "c@d.e" };
  const r = await H.status(req("GET", undefined, { token: tok(U.analyst) }), deps); const t = await r.text();
  assert.equal(r.status, 200); assert.ok(!/secret|ghp_|re_/.test(t), t);
  assert.equal(JSON.parse(t).publishing, true); assert.equal(JSON.parse(t).mail, "resend");
  assert.equal((await H.status(req("GET", undefined, {}), deps)).status, 401);
  env = { ...ENV };
});

test("maintenance: only on the schedule's token; keeps visits for the set retention; old scheduled backups go, hand-made ones stay", async () => {
  assert.equal((await H.maintenance(req("POST", {}, { token: tok(U.owner) }), deps)).status, 401);
  await db.query("insert into public.analytics_events (event_id, ts, name, session_id, path) values (gen_random_uuid(), now() - interval '500 days', 'page_view', 'old-session', '/'), (gen_random_uuid(), now() - interval '2 days', 'page_view', 'new-session', '/')");
  const old = "silavu-export-2025-01-01-scheduled.json.gz", mine = "silavu-export-2025-01-01.json.gz";
  for (const n of [old, mine]) { store.set("exports/" + n, new Uint8Array([1])); stamps.set("exports/" + n, "2025-01-01T00:00:00Z"); }
  const r = await (await H.maintenance(req("POST", {}, { token: ENV.BUILD_TOKEN }), deps)).json();
  assert.equal(r.ok, true); assert.equal(r.retention_days, 400); assert.ok(r.analytics_pruned >= 1); assert.equal(r.exports_removed, 1);
  assert.ok(!store.has("exports/" + old)); assert.ok(store.has("exports/" + mine));
  const left = (await db.query("select session_id from public.analytics_events where session_id in ('old-session', 'new-session')")).rows.map(x => x.session_id);
  assert.deepEqual(left, ["new-session"]);
  assert.equal((await db.query("select count(*)::int n from public.audit_log where action = 'maintenance.run'")).rows[0].n, 1);
});

test("the site's builds prove themselves with GitHub's signed statement: right repository, branch, audience and event only", async () => {
  const crypto = await import("node:crypto");
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: "jwk" }), kid: "gh-test-key", alg: "RS256", use: "sig" };
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const sign = (claims, kid = "gh-test-key", key = privateKey) => { const h = b64({ alg: "RS256", typ: "JWT", kid }), p = b64(claims); return `${h}.${p}.${crypto.createSign("RSA-SHA256").update(h + "." + p).sign(key).toString("base64url")}`; };
  const now = Math.floor(Date.now() / 1000);
  const good = { iss: "https://token.actions.githubusercontent.com", aud: "silavu-build", repository: "JoniCoderx/isracard", ref: "refs/heads/claude/isracard-dev-environment-tzc6s5", event_name: "schedule", iat: now, nbf: now - 5, exp: now + 300 };
  env = { ...ENV, BUILD_TOKEN: "", GH_REPO: "JoniCoderx/isracard", GH_BRANCH: "claude/isracard-dev-environment-tzc6s5" };
  fetchImpl = async (u) => u === "https://token.actions.githubusercontent.com/.well-known/jwks" ? new Response(JSON.stringify({ keys: [jwk] }), { status: 200 }) : new Response("{}", { status: 404 });
  const ask = (token) => H["release-snapshot"](req("POST", { waiting: true }, { token }), deps);
  assert.equal((await ask(sign(good))).status, 200, "a build of this repository's branch");
  for (const [why, claims] of [["another repository", { ...good, repository: "someone/else" }], ["another branch", { ...good, ref: "refs/heads/feature" }],
    ["another audience", { ...good, aud: "sts.amazonaws.com" }], ["expired", { ...good, exp: now - 10 }], ["a pull request", { ...good, event_name: "pull_request" }], ["another issuer", { ...good, iss: "https://evil.example" }]])
    assert.equal((await ask(sign(claims))).status, 401, why);
  const other = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey;
  assert.equal((await ask(sign(good, "gh-test-key", other))).status, 401, "not signed by GitHub");
  assert.equal((await ask(sign(good, "unknown-kid"))).status, 401, "an unknown key");
  assert.equal((await ask(tok(U.owner))).status, 401, "a staff session is not a build");
  assert.equal((await H.maintenance(req("POST", {}, { token: sign(good) }), deps)).status, 200, "the nightly job too");
  env = { ...ENV }; fetchImpl = async () => new Response("{}", { status: 200 });
});
