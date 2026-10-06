// The connection to the backend. Only public values reach the browser: the
// project address and its publishable (anon) key. Everything the anon key can
// do is decided by row-level security, which lets a visitor do nothing.
import { createClient } from "@supabase/supabase-js";

export const CONFIG = window.SILAVU_ADMIN || {};
export const connected = !!(CONFIG.supabaseUrl && CONFIG.anonKey);

export const sb = connected ? createClient(CONFIG.supabaseUrl, CONFIG.anonKey, {
  auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "silavu-admin-auth" }
}) : null;

export const FUNCTIONS = (CONFIG.functionsUrl || (CONFIG.supabaseUrl ? CONFIG.supabaseUrl.replace(/\/+$/, "") + "/functions/v1" : "")).replace(/\/+$/, "");
/* the storefront the admin belongs to: one level up from /admin/ */
export const SITE = CONFIG.siteUrl || new URL("../", location.href).href;

/* a readable message from any error the backend can return */
export function message(e) {
  if (!e) return "";
  const m = String(e.message || e.error_description || e.msg || e.error || e);
  if (/failed to fetch|networkerror|load failed/i.test(m)) return "The connection dropped. Nothing was lost; try again.";
  if (/not permitted|permission denied|42501|forbidden/i.test(m)) return "Your role does not allow this.";
  return m.replace(/^(conflict|invalid|not published): /i, (x) => x).replace(/\s*\(\w+\)$/, "");
}
export const isConflict = (e) => /conflict/i.test(String(e && (e.message || e.error || e)));

/* the edge functions, called with the signed-in person's session */
export async function fn(name, body, method = "POST") {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error("Signed out. Sign in again.");
  const r = await fetch(`${FUNCTIONS}/${name}`, {
    method, headers: { authorization: "Bearer " + session.access_token, apikey: CONFIG.anonKey, "content-type": "application/json" },
    body: method === "GET" ? undefined : JSON.stringify(body || {})
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.message || j.error || ("The server answered " + r.status)); e.status = r.status; e.body = j; throw e; }
  return j;
}

export async function rpc(name, args) {
  const { data, error } = await sb.rpc(name, args);
  if (error) throw Object.assign(new Error(error.message), { code: error.code, details: error.details });
  return data;
}
export async function q(builder) {
  const { data, error, count } = await builder;
  if (error) throw Object.assign(new Error(error.message), { code: error.code });
  return count != null ? { data, count } : data;
}
