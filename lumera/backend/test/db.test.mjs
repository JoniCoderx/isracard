// The database's permissions and workflows, exercised as each kind of caller.
// Runs against the local test database built by test/reset.sh (a plain
// Postgres with test/shim.sql standing in for Supabase's auth and storage).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";

const db = new pg.Client({ host: process.env.PGHOST || "/tmp", port: +(process.env.PGPORT || 54329), user: "postgres", database: "silavu_test" });
const U = {};

// run fn as a caller; everything is rolled back unless keep is true
async function as(who, fn, { keep = false } = {}) {
  await db.query("begin");
  try {
    if (who === "service") await db.query("set local role service_role");
    else if (who === null) { await db.query("set local role anon"); await db.query(`set local request.jwt.claims = '{"role":"anon"}'`); }
    else {
      const u = typeof who === "string" ? { id: U[who] } : who;
      await db.query("set local role authenticated");
      await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: u.id, role: "authenticated", aal: u.aal || "aal2", ...(u.extra || {}) })]);
    }
    const r = await fn((q, p) => db.query(q, p));
    await db.query(keep ? "commit" : "rollback");
    return r;
  } catch (e) { await db.query("rollback"); throw e; }
}
// an expected failure inside a transaction, without aborting the rest of it
const fails = async (q, sql, params, re) => { await q("savepoint t"); await assert.rejects(q(sql, params), re); await q("rollback to savepoint t"); };
const denied = async (p, re = /not permitted|permission denied|42501/) => assert.rejects(p, e => re.test(e.message) || e.code === "42501");

before(async () => {
  await db.connect();
  for (const n of ["owner", "editor", "support", "analyst", "stranger", "temp"]) {
    const r = await db.query("insert into auth.users (email) values ($1) returning id", [n + "@example.com"]);
    U[n] = r.rows[0].id;
  }
  await db.query("select app.bootstrap_owner('owner@example.com')");
  for (const [n, role] of [["editor", "editor"], ["support", "support"], ["analyst", "analyst"], ["temp", "support"]])
    await db.query("select app.add_staff($1, $2, $3, $4)", [U.owner, U[n], n + "@example.com", role]);
  // the site as it is: two documents imported and live
  await db.query(`select app.import_doc('settings', 'settings', 'Settings', '{"contact":{"email":"concierge@silavu.com"},"_note":"private"}', 0)`);
  await db.query(`select app.import_doc('configurator', 'configurator', 'The Line', '{"cuts":[{"id":"round","enabled":true},{"id":"pear","enabled":false}],"origins":[{"id":"lab"},{"id":"natural"}],"metals":[{"id":"white"}],"carat":{"min":1,"max":20}}', 0)`);
  await db.query(`select app.import_doc('product:knot', 'product', 'MOMENT', $1, 1)`, [JSON.stringify({ id: "knot", ref: "SLV·B·001", plain: "SILAVU MOMENT Bracelet", name: { en: "SILAVU MOMENT", he: "SILAVU MOMENT" }, shots: [{ img: "knot-flat" }], price: { mode: "on_request" }, internal: { cost: 1 } })]);
  await db.query("select app.import_release('initial import')");
});
after(async () => { await db.end(); });

test("a visitor (anon) can read and write nothing directly", async () => {
  await denied(as(null, q => q("select * from public.content_docs")));
  await denied(as(null, q => q("select * from public.enquiries")));
  await denied(as(null, q => q("select * from public.analytics_events")));
  await denied(as(null, q => q("select public.save_draft('product:x','product','x','{}',0)")));
  await denied(as(null, q => q("select app.submit_enquiry('{}')")));
  await denied(as(null, q => q("select app.bootstrap_owner('stranger@example.com')")));
});

test("a signed-in account that is not staff sees nothing and can change nothing", async () => {
  const rows = await as("stranger", q => q("select count(*)::int n from public.content_docs"));
  assert.equal(rows.rows[0].n, 0);
  await denied(as("stranger", q => q("select public.save_draft('product:x','product','x','{}',0)")));
  await denied(as("stranger", q => q("insert into public.staff (user_id, email, role) values ($1, 'x', 'owner')", [U.stranger])));
  await denied(as("stranger", q => q("select public.publish_docs(null, '')")));
  await denied(as("stranger", q => q("select public.analytics_overview(now() - interval '1 day', now())")));
  const me = await as("stranger", q => q("select public.my_staff() s"));
  assert.equal(me.rows[0].s, null);
});

test("roles cannot be raised by the user: JWT metadata is ignored, staff rows are read-only", async () => {
  const forged = { id: U.stranger, extra: { user_metadata: { role: "owner" }, app_metadata: { role: "owner" } } };
  await denied(as(forged, q => q("select public.save_draft('product:x','product','x','{}',0)")));
  await denied(as("editor", q => q("update public.staff set role = 'owner' where user_id = $1", [U.editor])));
  await denied(as("editor", q => q("select public.set_staff_role($1, 'owner')", [U.editor])));
  await assert.rejects(as("owner", q => q("select public.set_staff_role($1, 'editor')", [U.owner])), /your own role/);
  await assert.rejects(as("owner", q => q("select public.revoke_staff($1)", [U.owner])), /revoke yourself/);
  await denied(as("support", q => q("select app.add_staff($1, $2, 'x@example.com', 'owner')", [U.support, U.stranger])));
});

test("editors: drafts with version checks, validation, publishing, private fields kept out", async () => {
  await as("editor", async q => {
    const d = await q(`select public.save_draft('product:ring', 'product', 'ICON', $1, 0) r`, [JSON.stringify({ id: "ring", name: { en: "ICON", he: "" }, shots: [], _secret: "x" })]);
    assert.equal(d.rows[0].r.rev, 1);
    await fails(q, `select public.save_draft('product:ring', 'product', 'ICON', '{}', 0)`, [], /conflict/);
    await fails(q, `select public.publish_docs(array['product:ring'], '')`, [], /name \(Hebrew\) is required.*photograph/);
    await q(`select public.save_draft('product:ring', 'product', 'ICON', $1, 1)`, [JSON.stringify({ id: "ring", name: { en: "ICON", he: "ICON" }, shots: [{ img: "ring-front" }], price: { mode: "exact", amounts: { ILS: 1250000 } }, _secret: "x", details: { internal: "cost 5" } })]);
    const rid = (await q(`select public.publish_docs(array['product:ring'], 'first') id`)).rows[0].id;
    const snap = (await q("select snapshot from public.releases where id = $1", [rid])).rows[0].snapshot;
    assert.ok(snap.docs["product:ring"]);
    assert.equal(snap.docs["product:ring"].data._secret, undefined);
    assert.equal(snap.docs["product:ring"].data.details.internal, undefined);
    assert.equal(snap.docs["product:knot"].data.internal, undefined);
    assert.equal(snap.docs.settings.data._note, undefined);
    // a price must be whole minor units in a supported currency
    await q(`select public.save_draft('product:ring', 'product', 'ICON', $1, 2)`, [JSON.stringify({ id: "ring", name: { en: "ICON", he: "ICON" }, shots: [{ img: "a" }], price: { mode: "from", amounts: { GBP: 10.5 } } })]);
    await fails(q, `select public.publish_docs(array['product:ring'], '')`, [], /unsupported currency GBP/);
  });
  // editors do not see people, costs or the audit trail
  for (const t of ["customers", "enquiries", "quotes", "product_private", "audit_log"]) {
    const r = await as("editor", q => q(`select count(*)::int n from public.${t}`));
    assert.equal(r.rows[0].n, 0, t);
  }
});

test("a draft is invisible to the public snapshot until it is published", async () => {
  await as("editor", async q => {
    await q(`select public.save_draft('product:knot', 'product', 'MOMENT', $1, 1)`, [JSON.stringify({ id: "knot", name: { en: "MOMENT DRAFT TITLE", he: "x" }, shots: [{ img: "knot-flat" }] })]);
    const snap = (await q("select app.public_snapshot() s")).rows[0].s;
    assert.equal(snap.docs["product:knot"].data.name.en, "SILAVU MOMENT");
    assert.ok(!JSON.stringify(snap).includes("DRAFT TITLE"));
  });
});

test("support works enquiries but cannot publish, edit content or read analytics", async () => {
  await denied(as("support", q => q("select public.save_draft('product:y','product','y','{}',0)")));
  await denied(as("support", q => q("select public.publish_docs(null, '')")));
  await denied(as("support", q => q("select public.analytics_overview(now() - interval '1 day', now())")));
  await denied(as("support", q => q("select public.set_staff_role($1, 'owner')", [U.analyst])));
  assert.equal((await as("support", q => q("select count(*)::int n from public.content_docs"))).rows[0].n, 0, "no drafts for support");
});

test("analysts see aggregates only", async () => {
  const r = await as("analyst", q => q("select public.analytics_overview(now() - interval '7 days', now()) o"));
  assert.equal(typeof r.rows[0].o.sessions, "number");
  for (const t of ["customers", "enquiries", "content_revisions", "content_docs"]) assert.equal((await as("analyst", q => q(`select count(*)::int n from public.${t}`))).rows[0].n, 0, t);
  await denied(as("analyst", q => q("select * from public.analytics_events")));
  await denied(as("analyst", q => q("select public.update_enquiry(gen_random_uuid(), 'closed', null, null, null)")));
});

test("the public enquiry: validated, saved once, linked to the person by what they gave", async () => {
  const idem = "3d1f6a1e-1b7a-4d4f-9a55-0a2a1c0b0001";
  const ok = { idem, name: "Dana Levi", contact: "dana@example.com", city: "Tel Aviv", channel: "Email", want: "A piece from the collection", product: "knot", message: "Hello", lang: "he", page: "/isracard/?utm_source=x#c", utm: { utm_source: "instagram", evil: "x" } };
  const a = await as("service", q => q("select app.submit_enquiry($1) r", [ok]), { keep: true });
  assert.equal(a.rows[0].r.duplicate, false);
  const b = await as("service", q => q("select app.submit_enquiry($1) r", [ok]));
  assert.equal(b.rows[0].r.duplicate, true);
  assert.equal(b.rows[0].r.id, a.rows[0].r.id);
  const row = (await as("support", q => q("select * from public.enquiries where id = $1", [a.rows[0].r.id]))).rows[0];
  assert.equal(row.email, "dana@example.com");
  assert.equal(row.product_ref, "SLV·B·001");
  assert.equal(row.page, "/isracard/");
  assert.deepEqual(row.utm, { utm_source: "instagram" });
  assert.equal(row.consent_marketing, false);
  await assert.rejects(as("service", q => q("select app.submit_enquiry($1)", [{ ...ok, idem: "3d1f6a1e-1b7a-4d4f-9a55-0a2a1c0b0002", contact: "not-an-email@", }])), /invalid: .*email/);
  await assert.rejects(as("service", q => q("select app.submit_enquiry($1)", [{ ...ok, idem: "3d1f6a1e-1b7a-4d4f-9a55-0a2a1c0b0003", website: "spam" }])), /invalid request/);
  await assert.rejects(as("service", q => q("select app.submit_enquiry($1)", [{ ...ok, idem: "3d1f6a1e-1b7a-4d4f-9a55-0a2a1c0b0004", product: "nope" }])), /invalid: product/);
  // a configuration outside what is offered is refused; the page's price is never stored
  await assert.rejects(as("service", q => q("select app.submit_enquiry($1)", [{ ...ok, idem: "3d1f6a1e-1b7a-4d4f-9a55-0a2a1c0b0005", product: "", spec: { cut: "pear", ct: 5 } }])), /spec.cut/);
  await assert.rejects(as("service", q => q("select app.submit_enquiry($1)", [{ ...ok, idem: "3d1f6a1e-1b7a-4d4f-9a55-0a2a1c0b0006", product: "", spec: { cut: "round", ct: 50 } }])), /spec.ct/);
  const c = await as("service", q => q("select app.submit_enquiry($1) r", [{ ...ok, idem: "3d1f6a1e-1b7a-4d4f-9a55-0a2a1c0b0007", product: "", spec: { cut: "round", ct: 6, origin: "lab", metal: "white", price: 99999 } }]), { keep: true });
  const spec = (await db.query("select spec, customer_id from public.enquiries where id = $1", [c.rows[0].r.id])).rows[0];
  assert.equal(spec.spec.price, undefined);
  assert.equal(spec.customer_id, row.customer_id, "same email, same customer");
});

test("quotes keep what was quoted after the product changes", async () => {
  const e = (await db.query("select id from public.enquiries where product_key = 'knot' limit 1")).rows[0].id;
  const qid = (await as("support", q => q("select public.create_quote($1, null, null) id", [e]), { keep: true })).rows[0].id;
  await as("support", q => q("select public.update_quote($1, 1, $2)", [qid, { amount_minor: 1850000, currency: "ILS", valid_until: "2026-11-30", notes_internal: "margin note" }]), { keep: true });
  await assert.rejects(as("support", q => q("select public.update_quote($1, 1, '{}')", [qid])), /conflict/);
  await as("support", q => q("select public.update_quote($1, 2, $2)", [qid, { status: "sent" }]), { keep: true });
  await assert.rejects(as("support", q => q("select public.update_quote($1, 3, $2)", [qid, { amount_minor: 1 }])), /has been sent/);
  // the product is renamed and published
  await as("editor", async q => {
    const rev = (await q("select draft_rev from public.content_docs where key = 'product:knot'")).rows[0].draft_rev;
    await q(`select public.save_draft('product:knot', 'product', 'MOMENT', $1, $2)`, [JSON.stringify({ id: "knot", ref: "SLV·B·002", name: { en: "RENAMED", he: "RENAMED" }, shots: [{ img: "knot-flat" }] }), rev]);
    await q(`select public.publish_docs(array['product:knot'], '')`);
  }, { keep: true });
  const qq = (await as("support", q => q("select * from public.quotes where id = $1", [qid]))).rows[0];
  assert.equal(qq.product_snapshot.ref, "SLV·B·001");
  assert.equal(qq.amount_minor, "1850000");
  assert.equal(qq.product_snapshot.internal, undefined);
  const audit = await as("owner", q => q("select summary from public.audit_log where target = $1 order by id", ["quote:" + qid]));
  assert.ok(!JSON.stringify(audit.rows).includes("margin note"), "notes are not copied into the audit trail");
});

test("revoking someone, or changing their role, applies to their next request", async () => {
  const before = await as("temp", q => q("select count(*)::int n from public.enquiries"));
  assert.ok(before.rows[0].n > 0);
  await db.query("insert into auth.sessions (user_id) values ($1)", [U.temp]);
  await as("owner", q => q("select public.revoke_staff($1)", [U.temp]), { keep: true });
  assert.equal((await as("temp", q => q("select count(*)::int n from public.enquiries"))).rows[0].n, 0);
  assert.equal((await db.query("select count(*)::int n from auth.sessions where user_id = $1", [U.temp])).rows[0].n, 0);
  await as("owner", q => q("select public.set_staff_role($1, 'analyst')", [U.support]), { keep: true });
  assert.equal((await as("support", q => q("select count(*)::int n from public.enquiries"))).rows[0].n, 0);
  await as("owner", q => q("select public.set_staff_role($1, 'support')", [U.support]), { keep: true });
});

test("a second factor, once required, is enforced in the database", async () => {
  /* required before they have one: nothing on a password alone until they set it up */
  await as("owner", q => q("select public.set_staff_mfa($1, true)", [U.editor]), { keep: true });
  await db.query("insert into auth.mfa_factors (user_id) values ($1)", [U.editor]);
  await denied(as({ id: U.editor, aal: "aal1" }, q => q("select public.save_draft('product:z','product','z','{}',0)")));
  const r = await as({ id: U.editor, aal: "aal2" }, q => q("select count(*)::int n from public.content_docs"));
  assert.ok(r.rows[0].n > 0);
  await as("owner", q => q("select public.set_staff_mfa($1, false)", [U.editor]), { keep: true });
});

test("storage: editors upload originals; support, analysts and visitors cannot", async () => {
  await as("editor", q => q("insert into storage.objects (bucket_id, name) values ('media', 'originals/11111111-1111-1111-1111-111111111111.jpg')"), { keep: true });
  await denied(as("support", q => q("insert into storage.objects (bucket_id, name) values ('media', 'originals/22222222-2222-2222-2222-222222222222.jpg')")), /row-level security|permission/);
  await denied(as("editor", q => q("insert into storage.objects (bucket_id, name) values ('media', 'public/x.jpg')")), /row-level security/);
  assert.equal((await as(null, q => q("select count(*)::int n from storage.objects"))).rows[0].n, 0);
  assert.equal((await as("analyst", q => q("select count(*)::int n from storage.objects where bucket_id = 'media'"))).rows[0].n, 0);
  await db.query("insert into storage.objects (bucket_id, name) values ('exports', 'backup-1.json')");
  assert.equal((await as("editor", q => q("select count(*)::int n from storage.objects where bucket_id = 'exports'"))).rows[0].n, 0);
  assert.equal((await as("owner", q => q("select count(*)::int n from storage.objects where bucket_id = 'exports'"))).rows[0].n, 1);
  const id = (await as("editor", q => q("select public.register_media('originals/11111111-1111-1111-1111-111111111111.jpg','image','image/jpeg',1000,1254,1254,'a.jpg',null) id"), { keep: true })).rows[0].id;
  await assert.rejects(as("editor", q => q("select public.register_media('originals/33333333-3333-3333-3333-333333333333.jpg','image','image/jpeg',1000,1,1,'b.jpg',null)")), /did not finish uploading/);
  // a file in use is not deleted
  await as("service", q => q("select app.set_media_check($1, true, null, 1254, 1254)", [id]), { keep: true });
  await as("editor", async q => {
    const rev = (await q("select draft_rev from public.content_docs where key = 'product:knot'")).rows[0].draft_rev;
    await q(`select public.save_draft('product:knot', 'product', 'MOMENT', $1, $2)`, [JSON.stringify({ id: "knot", name: { en: "A", he: "A" }, shots: [{ img: "media:" + id }] }), rev]);
    await fails(q, "select public.delete_media($1)", [id], /in use/);
  });
});

test("the audit trail cannot be edited, even by the database owner role", async () => {
  await assert.rejects(db.query("update public.audit_log set action = 'x'"), /cannot be changed/);
  await assert.rejects(db.query("delete from public.audit_log"), /cannot be changed/);
  await denied(as("owner", q => q("insert into public.audit_log (action) values ('forged')")));
  const n = (await as("owner", q => q("select count(*)::int n from public.audit_log where action like 'staff.%'"))).rows[0].n;
  assert.ok(n >= 5);
});

test("analytics: allowlisted, deduplicated, bots set aside, funnels in order", async () => {
  const ev = (o) => ({ id: crypto.randomUUID(), ts: new Date().toISOString(), sid: "sessAAAAAAAA", path: "/isracard/pieces/knot/?email=a@b.c", ref: "https://www.instagram.com/some/path?x=1", ...o });
  const dup = ev({ name: "page_view" });
  const batch = [dup, dup, ev({ name: "product_view", product: "knot" }), ev({ name: "configurator_start" }), ev({ name: "configurator_complete", props: { cut: "round", email: "x@y.z" } }),
    ev({ name: "enquiry_success" }), ev({ name: "contact_click", props: { channel: "whatsapp" } }), ev({ name: "steal_cookies" }), ev({ name: "page_view", sid: "bad id!" })];
  const n = (await as("service", q => q("select app.ingest_events($1, $2) n", [JSON.stringify(batch), { device: "mobile", browser: "Safari", country: "IL" }]), { keep: true })).rows[0].n;
  assert.equal(n, 6);
  await as("service", q => q("select app.ingest_events($1, $2)", [JSON.stringify([ev({ name: "page_view", sid: "botBBBBBBBB" })]), { bot: true }]), { keep: true });
  const raw = (await db.query("select path, referrer_host, props from public.analytics_events where session_id = 'sessAAAAAAAA' order by id")).rows;
  assert.equal(raw[0].path, "/isracard/pieces/knot/");
  assert.equal(raw[0].referrer_host, "www.instagram.com");
  assert.ok(!JSON.stringify(raw).includes("@"), "no email anywhere");
  const o = (await as("analyst", q => q("select public.analytics_overview(now() - interval '1 day', now() + interval '1 minute') o"))).rows[0].o;
  assert.equal(o.sessions, 1, "the bot session is not counted");
  assert.equal(o.contact_by_channel.whatsapp, 1);
  const f = (await as("analyst", q => q("select public.analytics_funnel(now() - interval '1 day', now() + interval '1 minute', array['configurator_start','configurator_complete','enquiry_success']) f"))).rows[0].f;
  assert.deepEqual(f.map(s => s.sessions), [1, 1, 1]);
  const b = (await as("owner", q => q("select public.analytics_breakdown(now() - interval '1 day', now() + interval '1 minute', 'source') b"))).rows[0].b;
  assert.equal(b[0].value, "www.instagram.com");
});

test("customers: merge, and anonymize on request", async () => {
  const ids = (await db.query("select id from public.customers order by created_at")).rows.map(r => r.id);
  const extra = (await as("support", q => q("insert into public.customers (name, email) values ('Dana L', 'dana.l@example.com') returning id"), { keep: true })).rows[0].id;
  await as("support", q => q("select public.merge_customers($1, $2)", [ids[0], extra]), { keep: true });
  await denied(as("support", q => q("select public.anonymize_customer($1)", [ids[0]])));
  await as("owner", q => q("select public.anonymize_customer($1)", [ids[0]]), { keep: true });
  const e = (await db.query("select name, email, message from public.enquiries where customer_id = $1", [ids[0]])).rows;
  assert.ok(e.length > 0 && e.every(r => r.name === "Anonymized" && r.email === null && r.message === "[removed]"));
});

test("restoring a revision makes a new revision; republishing a release makes a new release", async () => {
  await as("editor", async q => {
    const first = (await q("select id from public.content_revisions where doc_key = 'product:knot' and source = 'import'")).rows[0].id;
    const r = (await q("select public.restore_revision($1) r", [first])).rows[0].r;
    const d = (await q("select draft from public.content_docs where key = 'product:knot'")).rows[0].draft;
    assert.equal(d.name.en, "SILAVU MOMENT");
    const last = (await q("select source from public.content_revisions where doc_key = 'product:knot' order by id desc limit 1")).rows[0].source;
    assert.equal(last, "restore");
    assert.ok(r.rev > 1);
  });
  await denied(as("editor", q => q("select public.republish_release(1, '')")));
  const nid = (await as("owner", q => q("select public.republish_release(1, 'back to the import') id"), { keep: true })).rows[0].id;
  const snap = (await db.query("select snapshot from public.releases where id = $1", [nid])).rows[0].snapshot;
  assert.equal(snap.docs["product:knot"].data.name.en, "SILAVU MOMENT");
  assert.equal(snap.docs["product:ring"], undefined, "a piece added after that release is taken down");
});
