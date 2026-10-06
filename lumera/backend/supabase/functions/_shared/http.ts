// Shared by every function. Web-standard APIs only (Request, Response,
// crypto.subtle), so the same code runs on Supabase's Deno runtime and in the
// Node test suite.

export type User = { id: string; email?: string; aal: string };
export type Deps = {
  env: (k: string) => string | undefined;
  /** the database, as the service role (the svc_* functions) */
  rpc: (fn: string, args: Record<string, unknown>) => Promise<unknown>;
  /** the database as the signed-in caller: their own permissions apply */
  userRpc: (jwt: string, fn: string, args: Record<string, unknown>) => Promise<unknown>;
  /** verifies a session token with Auth; null when it is not valid */
  verify: (jwt: string) => Promise<User | null>;
  storage: {
    signedUrl: (bucket: string, path: string, seconds: number) => Promise<string>;
    download: (bucket: string, path: string) => Promise<Uint8Array>;
    upload: (bucket: string, path: string, body: Uint8Array, type: string) => Promise<void>;
    /** the files at the top of a bucket, newest first */
    list: (bucket: string) => Promise<{ name: string; created_at: string }[]>;
    remove: (bucket: string, paths: string[]) => Promise<void>;
  };
  authAdmin: {
    invite: (email: string, redirectTo: string) => Promise<{ id: string }>;
    ban: (userId: string) => Promise<void>;
  };
  fetch: typeof fetch;
};

export class HttpError extends Error {
  status: number; code: string; extra?: Record<string, unknown>;
  constructor(status: number, code: string, message?: string, extra?: Record<string, unknown>) {
    super(message || code); this.status = status; this.code = code; this.extra = extra;
  }
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(body === null ? null : JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });
}

/* CORS is courtesy, not security: every function still authorises the caller */
export function corsHeaders(req: Request, deps: Deps, methods = "POST, OPTIONS"): Record<string, string> {
  const allowed = (deps.env("ALLOWED_ORIGINS") || "").split(",").map(s => s.trim()).filter(Boolean);
  const origin = req.headers.get("origin") || "";
  const ok = origin && (allowed.includes(origin) || allowed.includes("*"));
  return ok ? { "access-control-allow-origin": origin, "access-control-allow-methods": methods, "access-control-allow-headers": "authorization, content-type, apikey, x-client-info", "access-control-max-age": "600", "vary": "origin" } : { "vary": "origin" };
}
export function originAllowed(req: Request, deps: Deps): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;   // a server or a beacon without one; rate limits still apply
  const allowed = (deps.env("ALLOWED_ORIGINS") || "").split(",").map(s => s.trim()).filter(Boolean);
  return allowed.includes(origin) || allowed.includes("*");
}

export async function readJson(req: Request, maxBytes: number): Promise<any> {
  const len = Number(req.headers.get("content-length") || "0");
  if (len > maxBytes) throw new HttpError(413, "too_large");
  const buf = new Uint8Array(await req.arrayBuffer());
  if (buf.byteLength > maxBytes) throw new HttpError(413, "too_large");
  try { const v = JSON.parse(new TextDecoder().decode(buf)); if (v === null || typeof v !== "object") throw 0; return v; }
  catch { throw new HttpError(400, "bad_json", "the request was not valid JSON"); }
}

export function bearer(req: Request): string | null {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i); return m ? m[1].trim() : null;
}

export async function sha256hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/* the build's token: a long random secret shared with GitHub Actions */
export function requireBuildToken(req: Request, deps: Deps): void {
  const t = bearer(req), want = deps.env("BUILD_TOKEN") || "";
  if (want.length < 32 || !t || !safeEqual(t, want)) throw new HttpError(401, "unauthorized");
}

function claims(jwt: string): Record<string, unknown> {
  try { const p = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"); return JSON.parse(atob(p + "===".slice((p.length + 3) % 4))); } catch { return {}; }
}

/* a signed-in member of staff with one of these roles, read from the staff
   table on this request (a revoked or demoted person is refused at once) */
export async function requireStaff(req: Request, deps: Deps, roles: string[]): Promise<{ user: User; role: string; jwt: string }> {
  const jwt = bearer(req); if (!jwt) throw new HttpError(401, "unauthorized");
  const user = await deps.verify(jwt); if (!user) throw new HttpError(401, "unauthorized");
  const aal = String(claims(jwt).aal || user.aal || "aal1");
  const role = await deps.rpc("svc_staff_role", { p_user: user.id, p_aal: aal }) as string | null;
  if (!role || !roles.includes(role)) throw new HttpError(403, "forbidden");
  return { user: { ...user, aal }, role, jwt };
}

export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("cf-connecting-ip") || "unknown";
}

/* turns a thrown error into a response; database messages are not echoed to
   the public, only to staff, and only the first line */
export function fail(e: unknown, cors: Record<string, string> = {}, staff = false): Response {
  if (e instanceof HttpError) return json({ error: e.code, message: e.message, ...(e.extra || {}) }, e.status, cors);
  const msg = String((e as any)?.message || e);
  if (/not permitted|42501|permission denied/i.test(msg)) return json({ error: "forbidden" }, 403, cors);
  if (/conflict/i.test(msg)) return json({ error: "conflict", message: staff ? msg.split("\n")[0] : undefined }, 409, cors);
  console.error(msg);
  return json({ error: "server", message: staff ? msg.split("\n")[0] : "Something went wrong on our side." }, staff && /not published|nothing to publish|invalid/i.test(msg) ? 422 : 500, cors);
}

/* the handler shape every function exports */
export type Handler = (req: Request, deps: Deps) => Promise<Response>;
