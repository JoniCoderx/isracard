// Restores a SILAVU export (History & backups → Exports, or a nightly backup)
// into a backend whose tables are still empty: a new Supabase project, or a
// local rehearsal database. It never overwrites or deletes anything; if the
// target already holds content, enquiries or customers it stops.
//
//   cd lumera/backend && npm ci
//   RESTORE_DATABASE_URL='postgresql://postgres:…@db.<new-project>.supabase.co:5432/postgres' \
//     node scripts/restore.mjs silavu-export-….json.gz [--dry-run]
//
// The pictures and films: with these set as well, the originals the export
// lists are copied from the old project's private library to the new one.
//   SOURCE_SUPABASE_URL, SOURCE_SERVICE_ROLE_KEY   (the old project)
//   TARGET_SUPABASE_URL, TARGET_SERVICE_ROLE_KEY   (the new project)
// Keys are read from the environment only and are never written anywhere.
//
// Accounts: Supabase Auth users are not part of an export (passwords are not
// exportable). Invite the team again in the new project (or create the owner
// and run bootstrap_owner) BEFORE restoring; staff records are matched to the
// new accounts by email. Anyone not found is listed at the end, and their
// name on old records is kept as "someone".
import fs from "node:fs";
import zlib from "node:zlib";
import pg from "pg";

const args = process.argv.slice(2), file = args.find(a => !a.startsWith("--")), dry = args.includes("--dry-run");
const url = process.env.RESTORE_DATABASE_URL;
if (!file || !url) { console.error("usage: RESTORE_DATABASE_URL=… node scripts/restore.mjs <export.json.gz> [--dry-run]"); process.exit(2); }

const raw = fs.readFileSync(file);
const data = JSON.parse((file.endsWith(".gz") ? zlib.gunzipSync(raw) : raw).toString());
if (data.format !== "silavu-export" || data.version !== 1) { console.error("not a SILAVU export (format/version)"); process.exit(2); }

/* parents before children; columns that hold an account id, per table */
const TABLES = [
  ["content_docs", ["draft_updated_by", "published_by"]],
  ["content_revisions", ["actor"]],
  ["releases", ["created_by"]],
  ["product_private", ["updated_by"]],
  ["media_assets", ["created_by"]],
  ["customers", []],
  ["enquiries", ["assignee"]],
  ["enquiry_notes", ["author"]],
  ["quotes", ["created_by"]],
  ["staff", ["user_id", "invited_by"]],
  ["audit_log", ["actor"]]
];
/* rows that point at another row of the same table: inserted without the
   pointer first, then pointed */
const SELF = { media_assets: "replaced_by", customers: "merged_into", releases: "restored_from" };
const MUST_BE_EMPTY = ["content_docs", "releases", "media_assets", "customers", "enquiries", "quotes"];

/* Supabase requires TLS; a local rehearsal database does not */
const local = /@(localhost|127\.0\.0\.1)[:/]|host=%2F|host=\//.test(url);
const db = new pg.Client({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false } });
await db.connect();
const log = (m) => console.log(m);
try {
  const have = (await db.query("select to_regclass('public.content_docs') is not null as ok")).rows[0].ok;
  if (!have) throw new Error("the target has no SILAVU tables: run the migrations first (supabase db push)");
  for (const t of MUST_BE_EMPTY) {
    const n = (await db.query(`select count(*)::int n from public.${t}`)).rows[0].n;
    if (n) throw new Error(`the target already has ${n} rows in ${t}; restore only into an empty backend (nothing was changed)`);
  }
  /* old account → new account, by email */
  const users = new Map((await db.query("select id, lower(email) email from auth.users")).rows.map(r => [r.email, r.id]));
  const map = new Map(), missing = [];
  for (const s of data.staff || []) { const id = users.get(String(s.email || "").toLowerCase()); if (id) map.set(s.user_id, id); else missing.push(`${s.email} (${s.role}${s.active ? "" : ", removed"})`); }
  const remap = (v) => v == null ? v : (map.get(v) ?? null);

  await db.query("begin");
  const counts = {};
  for (const [t, ucols] of TABLES) {
    let rows = data[t] || [];
    if (t === "audit_log") rows = [...rows].reverse();   // exported newest first
    let n = 0; const later = [];
    for (const r0 of rows) {
      const r = { ...r0 };
      for (const c of ucols) r[c] = remap(r[c]);
      if (t === "staff") { if (!r.user_id) continue; r.invited_by = r.invited_by ?? null; }
      if (SELF[t] && r[SELF[t]] != null) { later.push([r.id, r[SELF[t]]]); r[SELF[t]] = null; }
      const conflict = t === "staff" ? " on conflict (user_id) do nothing" : "";
      const res = await db.query(`insert into public.${t} overriding system value select * from jsonb_populate_record(null::public.${t}, $1::jsonb)${conflict}`, [JSON.stringify(r)]);
      n += res.rowCount;
    }
    for (const [id, ref] of later) await db.query(`update public.${t} set ${SELF[t]} = $2 where id = $1`, [id, ref]);
    /* identity columns continue after the restored ids */
    const seq = (await db.query("select pg_get_serial_sequence($1, 'id') s", ["public." + t])).rows[0]?.s;
    if (seq) await db.query(`select setval($1, greatest((select coalesce(max(id), 0) from public.${t}), 1))`, [seq]);
    counts[t] = n;
  }
  if (dry) { await db.query("rollback"); log("dry run: nothing was written"); } else await db.query("commit");
  log(JSON.stringify({ restored: counts, staff_not_matched: missing }, null, 2));

  /* the library's originals */
  const S = process.env.SOURCE_SUPABASE_URL, SK = process.env.SOURCE_SERVICE_ROLE_KEY, T = process.env.TARGET_SUPABASE_URL, TK = process.env.TARGET_SERVICE_ROLE_KEY;
  if (S && SK && T && TK && !dry) {
    let copied = 0, failed = [];
    for (const m of data.media_assets || []) {
      try {
        const got = await fetch(`${S}/storage/v1/object/media/${m.path}`, { headers: { authorization: "Bearer " + SK, apikey: SK } });
        if (!got.ok) throw new Error("download " + got.status);
        const body = Buffer.from(await got.arrayBuffer());
        const put = await fetch(`${T}/storage/v1/object/media/${m.path}`, { method: "POST", headers: { authorization: "Bearer " + TK, apikey: TK, "content-type": m.mime, "x-upsert": "false" }, body });
        if (!put.ok && put.status !== 409) throw new Error("upload " + put.status + " " + (await put.text()).slice(0, 120));
        copied++;
      } catch (e) { failed.push(`${m.path}: ${e.message}`); }
    }
    log(JSON.stringify({ media_copied: copied, media_failed: failed }, null, 2));
    if (failed.length) process.exitCode = 1;
  } else if (!dry) log("pictures and films: not copied (set SOURCE_/TARGET_ SUPABASE_URL and SERVICE_ROLE_KEY to copy them)");
} catch (e) {
  try { await db.query("rollback"); } catch (x) {}
  console.error("restore stopped: " + e.message); process.exitCode = 1;
} finally { await db.end(); }
