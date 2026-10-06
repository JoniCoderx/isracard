// A local stand-in for a Supabase project, for development and end-to-end
// tests only. It speaks the small part of Supabase's HTTP APIs the admin
// uses (REST/PostgREST, Auth, Storage, Functions) on top of the real local
// Postgres, so every read and write runs through the real SQL, the real
// row-level security and the real edge-function handlers. What it fakes is
// only the platform: tokens are signed with a test secret, files live in
// memory, email is not sent, and "GitHub" is a local build of the real site.
//
// TEST ONLY. It has no relationship with any real project and must never be
// pointed at one.
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const SECRET = "local-test-secret-not-for-any-real-project";
const b64u = (b) => Buffer.from(b).toString("base64url");
export const ANON_KEY = sign({ role: "anon", iss: "fake-supabase", exp: 4102444800 });
export const SERVICE_KEY = sign({ role: "service_role", iss: "fake-supabase", exp: 4102444800 });
function sign(payload) { const h = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" })), p = b64u(JSON.stringify(payload)); return `${h}.${p}.${crypto.createHmac("sha256", SECRET).update(h + "." + p).digest("base64url")}`; }
function verify(jwt) {
  const [h, p, s] = String(jwt || "").split("."); if (!s) return null;
  const want = crypto.createHmac("sha256", SECRET).update(h + "." + p).digest("base64url");
  if (want.length !== s.length || !crypto.timingSafeEqual(Buffer.from(want), Buffer.from(s))) return null;
  const c = JSON.parse(Buffer.from(p, "base64url").toString()); if (c.exp && c.exp * 1000 < Date.now()) return null; return c;
}
/* RFC 6238 TOTP, 30 s, 6 digits, SHA-1: what authenticator apps use */
export function totp(secretB32, t = Date.now()) {
  const al = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; let bits = "";
  for (const ch of secretB32.replace(/=+$/, "")) bits += al.indexOf(ch).toString(2).padStart(5, "0");
  const key = Buffer.from(bits.match(/.{8}/g).map(b => parseInt(b, 2)));
  const ctr = Buffer.alloc(8); ctr.writeBigUInt64BE(BigInt(Math.floor(t / 30000)));
  const h = crypto.createHmac("sha1", key).update(ctr).digest(), o = h[19] & 15;
  return String(((h.readUInt32BE(o) & 0x7fffffff) % 1e6)).padStart(6, "0");
}

export async function startFakeSupabase({ port = 54321, database = "silavu_test", functionsDir, siteBuild, env: extraEnv = {}, log = () => {} } = {}) {
  const db = new pg.Pool({ host: process.env.PGHOST || "/tmp", port: +(process.env.PGPORT || 54329), user: "postgres", database, max: 6 });
  const base = `http://127.0.0.1:${port}`;
  const users = new Map();          // email -> { id, password, factors: [] }
  const sessions = new Map();       // refresh token -> { user, aal }
  const files = new Map();          // bucket/path -> { body, type }
  const mail = [];                  // what Auth would have emailed
  const dispatches = [];            // what GitHub would have been asked
  const faults = { github: false, storage: false, down: false };   // switched on by tests
  const env = { BUILD_TOKEN: "t".repeat(40), RATE_SALT: "dev", ALLOWED_ORIGINS: "*", SITE_URL: "http://127.0.0.1:8777", ADMIN_URL: "http://127.0.0.1:8777/admin/", GH_TOKEN: "fake", GH_REPO: "local/site", ...extraEnv };

  async function asCaller(claims, fn) {
    const c = await db.connect();
    try {
      await c.query("begin");
      const role = claims && ["anon", "authenticated", "service_role"].includes(claims.role) ? claims.role : "anon";
      await c.query(`set local role ${role}`);
      await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims || { role: "anon" })]);
      const r = await fn(c); await c.query("commit"); return r;
    } catch (e) { await c.query("rollback").catch(() => {}); throw e; } finally { c.release(); }
  }
  const pgErr = (e) => {
    const code = e.code || "", m = e.message || String(e);
    const status = code === "42501" ? 403 : code === "40001" || /conflict/i.test(m) ? 409 : code === "23505" ? 409 : code === "P0002" ? 404 : 400;
    return { status, body: { code, message: m, details: e.detail || null, hint: e.hint || null } };
  };

  /* ── a little PostgREST ──────────────────────────────────────────────── */
  const ident = (s) => { if (!/^[a-z_][a-z0-9_]*$/.test(s)) throw Object.assign(new Error("bad identifier " + s), { code: "42601" }); return `"${s}"`; };
  function where(params, args) {
    const parts = [];
    const one = (col, expr) => {
      const m = expr.match(/^(not\.)?(eq|neq|gt|gte|lt|lte|like|ilike|is|in|cs|cd|ov)\.([\s\S]*)$/); if (!m) throw Object.assign(new Error("bad filter " + expr), { code: "42601" });
      const [, not, op, raw] = m, c = ident(col);
      let sql;
      if (op === "is") sql = `${c} is ${raw === "null" ? "null" : raw === "true" ? "true" : raw === "false" ? "false" : "null"}`;
      else if (op === "in") { const vals = raw.replace(/^\(|\)$/g, "").split(",").map(v => v.replace(/^"|"$/g, "")); args.push(vals); sql = `${c}::text = any($${args.length}::text[])`; }
      else if (op === "cs" || op === "cd" || op === "ov") { args.push(raw); sql = `${c} ${op === "cs" ? "@>" : op === "cd" ? "<@" : "&&"} $${args.length}`; }
      else { args.push(op.endsWith("like") ? raw.replace(/\*/g, "%") : raw); sql = `${c}${op === "eq" || op === "neq" || op.endsWith("like") ? "::text" : ""} ${{ eq: "=", neq: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=", like: "like", ilike: "ilike" }[op]} $${args.length}`; }
      return not ? `not (${sql})` : sql;
    };
    for (const [k, v] of params) {
      if (["select", "order", "limit", "offset", "on_conflict", "columns"].includes(k)) continue;
      if (k === "or") { const items = v.replace(/^\(|\)$/g, "").match(/[a-z_]+\.(?:not\.)?\w+\.(?:\([^)]*\)|[^,]*)/g) || []; parts.push("(" + items.map(it => { const i = it.indexOf("."); return one(it.slice(0, i), it.slice(i + 1)); }).join(" or ") + ")"); continue; }
      parts.push(one(k, v));
    }
    return parts.length ? " where " + parts.join(" and ") : "";
  }
  const cols = (sel) => !sel || sel === "*" ? "*" : sel.split(",").map(s => ident(s.trim())).join(", ");
  const order = (o) => !o ? "" : " order by " + o.split(",").map(x => { const [c, d, n] = x.split("."); return ident(c) + (d === "desc" ? " desc" : " asc") + (n === "nullslast" ? " nulls last" : n === "nullsfirst" ? " nulls first" : ""); }).join(", ");

  async function rest(req, url, claims, body) {
    const seg = url.pathname.replace(/^\/rest\/v1\//, "");
    const prefer = req.headers.prefer || "", single = /vnd\.pgrst\.object/.test(req.headers.accept || "");
    if (seg.startsWith("rpc/")) {
      const fn = ident(seg.slice(4)), a = body && typeof body === "object" ? body : {};
      const ks = Object.keys(a), vals = ks.map(k => a[k] !== null && typeof a[k] === "object" && !Array.isArray(a[k]) ? JSON.stringify(a[k]) : Array.isArray(a[k]) && a[k].some(x => x && typeof x === "object") ? JSON.stringify(a[k]) : a[k]);
      const r = await asCaller(claims, c => c.query(`select public.${fn}(${ks.map((k, i) => `${ident(k)} => $${i + 1}`).join(", ")}) as r`, vals));
      return { status: 200, body: r.rows[0].r };
    }
    const table = ident(seg), args = [];
    if (req.method === "GET" || req.method === "HEAD") {
      const sql = `select ${cols(url.searchParams.get("select"))} from public.${table}${where(url.searchParams, args)}${order(url.searchParams.get("order"))}`
        + (url.searchParams.get("limit") ? ` limit ${+url.searchParams.get("limit")}` : "") + (url.searchParams.get("offset") ? ` offset ${+url.searchParams.get("offset")}` : "");
      const r = await asCaller(claims, async c => {
        const rows = (await c.query(sql, args)).rows;
        let total = null; if (/count=exact/.test(prefer)) { const a2 = []; total = (await c.query(`select count(*)::int n from public.${table}${where(url.searchParams, a2)}`, a2)).rows[0].n; }
        return { rows, total };
      });
      const off = +(url.searchParams.get("offset") || 0), headers = r.total != null ? { "content-range": `${off}-${off + r.rows.length - 1}/${r.total}` } : {};
      if (single) { if (r.rows.length !== 1) return { status: 406, body: { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" } }; return { status: 200, body: r.rows[0], headers }; }
      return { status: 200, body: r.rows, headers };
    }
    if (req.method === "POST") {
      const rows = Array.isArray(body) ? body : [body]; if (!rows.length) return { status: 201, body: [] };
      const keys = Object.keys(rows[0]).map(ident), vals = [];
      const tuples = rows.map(r => "(" + Object.keys(rows[0]).map(k => { vals.push(r[k] !== null && typeof r[k] === "object" && !Array.isArray(r[k]) ? JSON.stringify(r[k]) : r[k]); return "$" + vals.length; }).join(", ") + ")").join(", ");
      const oc = url.searchParams.get("on_conflict"), merge = /merge-duplicates/.test(prefer);
      const conflict = merge ? ` on conflict (${(oc || "id").split(",").map(ident).join(", ")}) do update set ${keys.map(k => `${k} = excluded.${k}`).join(", ")}` : "";
      const r = await asCaller(claims, c => c.query(`insert into public.${table} (${keys.join(", ")}) values ${tuples}${conflict} returning *`, vals));
      return { status: 201, body: /return=representation/.test(prefer) ? (single ? r.rows[0] : r.rows) : null };
    }
    if (req.method === "PATCH") {
      const keys = Object.keys(body || {}); const set = keys.map(k => { args.push(body[k] !== null && typeof body[k] === "object" && !Array.isArray(body[k]) ? JSON.stringify(body[k]) : body[k]); return `${ident(k)} = $${args.length}`; }).join(", ");
      const r = await asCaller(claims, c => c.query(`update public.${table} set ${set}${where(url.searchParams, args)} returning *`, args));
      return { status: 200, body: /return=representation/.test(prefer) ? (single ? r.rows[0] : r.rows) : null };
    }
    if (req.method === "DELETE") {
      const r = await asCaller(claims, c => c.query(`delete from public.${table}${where(url.searchParams, args)} returning *`, args));
      return { status: 200, body: /return=representation/.test(prefer) ? r.rows : null };
    }
    return { status: 405, body: { message: "method" } };
  }

  /* ── a little GoTrue ─────────────────────────────────────────────────── */
  const userJson = (u) => ({ id: u.id, aud: "authenticated", role: "authenticated", email: u.email, email_confirmed_at: new Date().toISOString(), app_metadata: { provider: "email" }, user_metadata: {}, created_at: new Date().toISOString(),
    factors: u.factors.map(f => ({ id: f.id, friendly_name: f.name, factor_type: "totp", status: f.verified ? "verified" : "unverified", created_at: new Date().toISOString(), updated_at: new Date().toISOString() })) });
  function issue(u, aal = "aal1") {
    const exp = Math.floor(Date.now() / 1000) + 3600, sid = crypto.randomUUID();
    const access = sign({ sub: u.id, role: "authenticated", aud: "authenticated", email: u.email, aal, amr: [{ method: aal === "aal2" ? "totp" : "password", timestamp: Math.floor(Date.now() / 1000) }], session_id: sid, exp, iat: Math.floor(Date.now() / 1000) });
    const refresh = crypto.randomBytes(16).toString("hex"); sessions.set(refresh, { user: u, aal });
    return { access_token: access, token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: refresh, user: userJson(u) };
  }
  const byId = (id) => [...users.values()].find(u => u.id === id);
  async function auth(req, url, claims, body) {
    const p = url.pathname.replace(/^\/auth\/v1/, "");
    if (p === "/token") {
      const gt = url.searchParams.get("grant_type");
      if (gt === "password") {
        const u = users.get(String(body.email || "").toLowerCase());
        if (!u || u.password !== body.password || u.banned) return { status: 400, body: { error: "invalid_grant", error_description: "Invalid login credentials", code: "invalid_credentials", msg: "Invalid login credentials" } };
        return { status: 200, body: issue(u) };
      }
      if (gt === "refresh_token") { const s = sessions.get(body.refresh_token); if (!s || s.user.banned) return { status: 400, body: { code: "refresh_token_not_found", msg: "Invalid Refresh Token" } }; sessions.delete(body.refresh_token); return { status: 200, body: issue(s.user, s.aal) }; }
    }
    if (p === "/recover") { const u = users.get(String(body.email || "").toLowerCase()); if (u) { const code = crypto.randomUUID(); recoveries.set(code, u); mail.push({ to: u.email, kind: "recovery", link: `${env.ADMIN_URL}?token_hash=${code}&type=recovery` }); } return { status: 200, body: {} }; }
    /* the link in the email (supabase/templates): a one-time token, any browser */
    if (p === "/verify" && req.method === "POST") { const r = recoveries.get(body.token_hash); if (!r || !["recovery", "invite"].includes(body.type)) return { status: 403, body: { code: "otp_expired", msg: "Email link is invalid or has expired" } }; recoveries.delete(body.token_hash); return { status: 200, body: issue(r) }; }
    if (!claims || !claims.sub) return { status: 401, body: { msg: "not signed in", code: "no_authorization" } };
    const u = byId(claims.sub); if (!u) return { status: 401, body: { msg: "user not found" } };
    if (p === "/user" && req.method === "GET") return { status: 200, body: userJson(u) };
    if (p === "/user" && req.method === "PUT") { if (body.password) { if (String(body.password).length < 10) return { status: 422, body: { msg: "Password should be at least 10 characters.", code: "weak_password" } }; u.password = body.password; } return { status: 200, body: userJson(u) }; }
    if (p === "/logout") { for (const [k, s] of sessions) if (s.user === u) sessions.delete(k); return { status: 204, body: null }; }
    if (p === "/factors" && req.method === "POST") {
      const secret = Array.from(crypto.randomBytes(20)).map(b => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[b & 31]).join("");
      const f = { id: crypto.randomUUID(), name: body.friendly_name || "Authenticator", secret, verified: false }; u.factors.push(f);
      const uri = `otpauth://totp/SILAVU:${encodeURIComponent(u.email)}?secret=${secret}&issuer=SILAVU`;
      return { status: 200, body: { id: f.id, type: "totp", friendly_name: f.name, totp: { qr_code: "data:image/svg+xml;utf-8,<svg xmlns='http://www.w3.org/2000/svg'/>", secret, uri } } };
    }
    let m;
    if ((m = p.match(/^\/factors\/([\w-]+)\/challenge$/))) return { status: 200, body: { id: crypto.randomUUID(), type: "totp", expires_at: Math.floor(Date.now() / 1000) + 300 } };
    if ((m = p.match(/^\/factors\/([\w-]+)\/verify$/))) {
      const f = u.factors.find(x => x.id === m[1]); if (!f) return { status: 404, body: { msg: "factor not found" } };
      const ok = [totp(f.secret), totp(f.secret, Date.now() - 30000)].includes(String(body.code));
      if (!ok) return { status: 422, body: { msg: "Invalid TOTP code entered", code: "mfa_verification_failed" } };
      if (!f.verified) { f.verified = true; await db.query("insert into auth.mfa_factors (id, user_id, status) values ($1, $2, 'verified') on conflict do nothing", [f.id, u.id]); }
      return { status: 200, body: issue(u, "aal2") };
    }
    if ((m = p.match(/^\/factors\/([\w-]+)$/)) && req.method === "DELETE") { u.factors = u.factors.filter(x => x.id !== m[1]); await db.query("delete from auth.mfa_factors where id = $1", [m[1]]); return { status: 200, body: { id: m[1] } }; }
    return { status: 404, body: { msg: "not here: " + p } };
  }
  const recoveries = new Map();

  /* ── a little Storage ────────────────────────────────────────────────── */
  async function storage(req, url, claims, raw) {
    const p = url.pathname.replace(/^\/storage\/v1/, "");
    let m;
    if ((m = p.match(/^\/object\/sign\/([\w-]+)\/(.+)$/)) && req.method === "POST") {
      const bucket = m[1], name = decodeURIComponent(m[2]);
      const ok = (await asCaller(claims, c => c.query("select count(*)::int n from storage.objects where bucket_id = $1 and name = $2", [bucket, name]))).rows[0].n;
      if (!ok) return { status: 400, body: { statusCode: "404", error: "not_found", message: "Object not found" } };
      const token = sign({ url: bucket + "/" + name, exp: Math.floor(Date.now() / 1000) + (JSON.parse(raw || "{}").expiresIn || 60) });
      return { status: 200, body: { signedURL: `/object/sign/${bucket}/${encodeURIComponent(name).replace(/%2F/g, "/")}?token=${token}` } };
    }
    if ((m = p.match(/^\/object\/sign\/([\w-]+)$/)) && req.method === "POST") {
      const b = JSON.parse(raw || "{}"), out = [];
      for (const name of b.paths || []) {
        const ok = (await asCaller(claims, c => c.query("select count(*)::int n from storage.objects where bucket_id = $1 and name = $2", [m[1], name]))).rows[0].n;
        out.push(ok ? { path: name, signedURL: `/object/sign/${m[1]}/${name}?token=${sign({ url: m[1] + "/" + name, exp: Math.floor(Date.now() / 1000) + (b.expiresIn || 60) })}`, error: null } : { path: name, signedURL: null, error: "not found" });
      }
      return { status: 200, body: out };
    }
    if ((m = p.match(/^\/object\/list\/([\w-]+)$/)) && req.method === "POST") {
      const b = JSON.parse(raw || "{}");
      const rows = (await asCaller(claims, c => c.query("select id, name, created_at, updated_at, metadata from storage.objects where bucket_id = $1 and name like $2 order by created_at desc limit $3", [m[1], (b.prefix || "") + "%", b.limit || 100]))).rows;
      return { status: 200, body: rows };
    }
    if ((m = p.match(/^\/object\/sign\/([\w-]+)\/(.+)$/)) && req.method === "GET") {
      const c = verify(url.searchParams.get("token")), key = m[1] + "/" + decodeURIComponent(m[2]);
      if (!c || c.url !== key || !files.has(key)) return { status: 400, body: { message: "invalid signature" } };
      const f = files.get(key); return { status: 200, raw: f.body, type: f.type };
    }
    if ((m = p.match(/^\/object\/(?:authenticated\/)?([\w-]+)\/(.+)$/))) {
      const bucket = m[1], name = decodeURIComponent(m[2]);
      if (req.method === "POST" || req.method === "PUT") {
        const bk = (await db.query("select * from storage.buckets where id = $1", [bucket])).rows[0];
        let type = (req.headers["content-type"] || "application/octet-stream").split(";")[0];
        /* the client sends a File as multipart form data, like the real service accepts */
        if (type === "multipart/form-data") {
          const form = await new Request("http://x/", { method: "POST", headers: { "content-type": req.headers["content-type"] }, body: raw }).formData();
          const part = [...form.values()].find(v => typeof v === "object" && v && "arrayBuffer" in v);
          if (!part) return { status: 400, body: { message: "no file in the form" } };
          raw = Buffer.from(await part.arrayBuffer()); type = part.type || "application/octet-stream";
        }
        if (!bk) return { status: 400, body: { message: "bucket not found" } };
        if (bk.file_size_limit && raw.length > bk.file_size_limit) return { status: 413, body: { statusCode: "413", error: "Payload too large", message: "The object exceeded the maximum allowed size" } };
        if (bk.allowed_mime_types && !bk.allowed_mime_types.includes(type)) return { status: 415, body: { statusCode: "415", error: "invalid_mime_type", message: `mime type ${type} is not supported` } };
        try { await asCaller(claims, c => c.query("insert into storage.objects (bucket_id, name, owner) values ($1, $2, $3)", [bucket, name, claims && claims.sub || null])); }
        catch (e) { return { status: 400, body: { statusCode: "403", error: "Unauthorized", message: "new row violates row-level security policy" } }; }
        files.set(bucket + "/" + name, { body: raw, type }); return { status: 200, body: { Key: bucket + "/" + name, Id: crypto.randomUUID() } };
      }
      if (req.method === "GET") {
        const ok = (await asCaller(claims, c => c.query("select count(*)::int n from storage.objects where bucket_id = $1 and name = $2", [bucket, name]))).rows[0].n;
        if (!ok || !files.has(bucket + "/" + name)) return { status: 400, body: { message: "Object not found" } };
        const f = files.get(bucket + "/" + name); return { status: 200, raw: f.body, type: f.type };
      }
    }
    return { status: 404, body: { message: "not here: " + p } };
  }

  /* ── Functions: the real handlers, with platform pieces from here ────── */
  const handlers = {};
  for (const n of ["enquiry", "collect", "publish", "release-snapshot", "release-status", "staff", "media", "export", "setup", "status", "maintenance"])
    handlers[n] = (await import(path.join(functionsDir, n, "handler.ts"))).handler;
  const call = (fn, args) => { const ks = Object.keys(args); return `select public.${fn}(${ks.map((k, i) => `${k} => $${i + 1}`).join(", ")}) as r`; };
  const val = (v) => v === null || v === undefined ? null : typeof v === "object" && !Array.isArray(v) ? JSON.stringify(v) : Array.isArray(v) && v.some(x => typeof x === "object") ? JSON.stringify(v) : v;
  const deps = {
    env: (k) => env[k],
    fetch: async (u, init) => {
      u = String(u);
      if (u.startsWith("https://api.github.com/repos/")) { if (faults.github) return new Response('{"message":"Bad credentials"}', { status: 401 }); const b = JSON.parse(init.body); dispatches.push(b); if (siteBuild) setTimeout(() => siteBuild(b.client_payload.release).catch(e => log("build failed: " + e.message)), 50); return new Response(null, { status: 204 }); }
      if (u.startsWith(env.SITE_URL)) return fetch(u, init);
      if (u.startsWith("https://api.resend.com") || u.startsWith("https://formsubmit.co")) { mail.push({ to: "provider", body: init.body }); return new Response("{}", { status: 200 }); }
      return new Response("blocked in the fake", { status: 599 });
    },
    rpc: async (fn, args) => (await asCaller({ role: "service_role" }, c => c.query(call(fn, args), Object.values(args).map(val)))).rows[0].r,
    userRpc: async (jwt, fn, args) => (await asCaller(verify(jwt), c => c.query(call(fn, args), Object.values(args).map(val)))).rows[0].r,
    verify: async (jwt) => { const c = verify(jwt); return c && c.sub ? { id: c.sub, email: c.email, aal: c.aal || "aal1" } : null; },
    storage: {
      signedUrl: async (b, p, s) => `${base}/storage/v1/object/sign/${b}/${p}?token=${sign({ url: b + "/" + p, exp: Math.floor(Date.now() / 1000) + s })}`,
      download: async (b, p) => { const f = files.get(b + "/" + p); if (!f) throw new Error("not found"); return new Uint8Array(f.body); },
      upload: async (b, p, body, type) => { await db.query("insert into storage.objects (bucket_id, name) values ($1, $2)", [b, p]); files.set(b + "/" + p, { body: Buffer.from(body), type }); },
      list: async (b) => (await db.query("select name, created_at from storage.objects where bucket_id = $1 and name not like '%/%' order by created_at desc", [b])).rows.map(r => ({ name: r.name, created_at: new Date(r.created_at).toISOString() })),
      remove: async (b, ps) => { for (const p of ps) { await db.query("delete from storage.objects where bucket_id = $1 and name = $2", [b, p]); files.delete(b + "/" + p); } }
    },
    authAdmin: {
      invite: async (email) => { let u = users.get(email); if (!u) { u = await addUser(email, null); const code = crypto.randomUUID(); recoveries.set(code, u); mail.push({ to: email, kind: "invite", link: `${env.ADMIN_URL}?token_hash=${code}&type=invite` }); } return { id: u.id }; },
      ban: async (id) => { const u = byId(id); if (u) u.banned = true; }
    }
  };
  async function addUser(email, password) {
    const id = (await db.query("insert into auth.users (email) values ($1) on conflict (email) do update set email = excluded.email returning id", [email.toLowerCase()])).rows[0].id;
    const u = { id, email: email.toLowerCase(), password, factors: [] }; users.set(u.email, u); return u;
  }

  const server = http.createServer(async (req, res) => {
    const cors = { "access-control-allow-origin": req.headers.origin || "*", "access-control-allow-headers": "authorization, apikey, content-type, prefer, range, accept, accept-profile, content-profile, x-client-info, x-upsert, x-supabase-api-version, cache-control", "access-control-allow-methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS, HEAD", "access-control-expose-headers": "content-range, x-supabase-api-version" };
    if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
    if (faults.down) { res.writeHead(503, { ...cors, "content-type": "application/json" }); return res.end('{"message":"Service unavailable"}'); }
    if (faults.storage && req.url.startsWith("/storage/v1/object/media/") && req.method === "POST") { res.writeHead(500, { ...cors, "content-type": "application/json" }); return res.end('{"statusCode":"500","error":"internal","message":"Storage is unavailable"}'); }
    const chunks = []; for await (const c of req) chunks.push(c); const raw = Buffer.concat(chunks);
    const url = new URL(req.url, base);
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "") || req.headers.apikey;
    const claims = verify(token);
    let out;
    try {
      if (url.pathname.startsWith("/rest/v1/")) out = await rest(req, url, claims, raw.length ? JSON.parse(raw.toString()) : null);
      else if (url.pathname.startsWith("/auth/v1/")) out = await auth(req, url, claims, raw.length ? JSON.parse(raw.toString() || "{}") : {});
      else if (url.pathname.startsWith("/storage/v1/")) out = await storage(req, url, claims, raw);
      else if (url.pathname.startsWith("/functions/v1/")) {
        const name = url.pathname.split("/")[3]; const h = handlers[name];
        if (!h) out = { status: 404, body: { message: "no function" } };
        else {
          const r = await h(new Request(base + url.pathname, { method: req.method, headers: req.headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : raw }), deps);
          res.writeHead(r.status, { ...cors, ...Object.fromEntries(r.headers) }); return res.end(Buffer.from(await r.arrayBuffer()));
        }
      } else out = { status: 404, body: { message: "unknown path" } };
    } catch (e) { out = pgErr(e); log(`${req.method} ${url.pathname} -> ${out.status} ${out.body.message}`); }
    if (out.raw) { res.writeHead(out.status, { ...cors, "content-type": out.type }); return res.end(out.raw); }
    res.writeHead(out.status, { ...cors, "content-type": "application/json", ...(out.headers || {}) });
    res.end(out.body === null || out.body === undefined ? (out.status === 204 ? undefined : "null") : JSON.stringify(out.body));
  });
  await new Promise(r => server.listen(port, "127.0.0.1", r));
  log(`fake supabase on ${base}`);
  return {
    url: base, anonKey: ANON_KEY, serviceKey: SERVICE_KEY, env, mail, dispatches, files, users, deps, faults,
    addUser,
    /** the first owner, exactly as ADMIN_SETUP.md does it: a user, then bootstrap_owner in SQL */
    async bootstrapOwner(email, password) { const u = await addUser(email, password); await db.query("select app.bootstrap_owner($1)", [email]); return u; },
    totpFor: (email) => { const u = users.get(email.toLowerCase()); const f = u && u.factors[u.factors.length - 1]; return f ? totp(f.secret) : null; },
    async close() { server.close(); await db.end(); }
  };
}
