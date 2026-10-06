// POST /maintenance (BUILD_TOKEN only; run nightly by the Maintenance
// workflow): deletes visit records older than the retention set in Settings,
// clears spent rate-limit counters, and removes scheduled backups older than
// EXPORT_KEEP_DAYS (35 by default). Backups the owner made by hand are kept
// until the owner removes them.
import { type Deps, HttpError, json, requireBuildToken, fail } from "../_shared/http.ts";

export async function handler(req: Request, deps: Deps): Promise<Response> {
  try {
    if (req.method !== "POST") throw new HttpError(405, "method");
    requireBuildToken(req, deps);
    const db = await deps.rpc("svc_maintenance", {}) as Record<string, unknown>;
    const keep = Math.max(7, Number(deps.env("EXPORT_KEEP_DAYS") || 35) || 35);
    const cutoff = Date.now() - keep * 86400000;
    const old = (await deps.storage.list("exports")).filter(f => /-scheduled\.json\.gz$/.test(f.name) && Date.parse(f.created_at) < cutoff).map(f => f.name);
    if (old.length) await deps.storage.remove("exports", old);
    return json({ ok: true, ...db, exports_removed: old.length, exports_keep_days: keep });
  } catch (e) { return fail(e, {}, false); }
}
