// POST /release-status (the build, with BUILD_TOKEN): building, live or failed.
import { type Deps, HttpError, json, readJson, requireBuildToken, fail } from "../_shared/http.ts";

export async function handler(req: Request, deps: Deps): Promise<Response> {
  try {
    if (req.method !== "POST") throw new HttpError(405, "method");
    requireBuildToken(req, deps);
    const b = await readJson(req, 4000);
    const id = Number(b.release), st = String(b.status || "");
    if (!Number.isInteger(id) || id < 1 || !["building", "live", "failed"].includes(st)) throw new HttpError(400, "invalid");
    const url = typeof b.url === "string" && /^https:\/\/github\.com\//.test(b.url) ? b.url : null;
    await deps.rpc("svc_set_release_status", { p_release: id, p_status: st, p_url: url, p_error: st === "failed" ? String(b.error || "").slice(0, 500) : null });
    return json({ ok: true });
  } catch (e) { return fail(e); }
}
