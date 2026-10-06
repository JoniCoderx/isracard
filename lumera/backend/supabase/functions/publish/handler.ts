// POST /publish (owner, editor): makes drafts live and starts the site build.
//   { action: "publish", keys?: string[] | null, note?: string }
//   { action: "retry", release: number }        start the build again
//   { action: "republish", release: number }    owner: an earlier release, as a new one
// The database records the release before GitHub is asked to build it, so a
// GitHub outage never loses a publish: the admin shows "not started" and a
// retry button. The GitHub token never leaves this function.
import { type Deps, HttpError, json, corsHeaders, readJson, requireStaff, fail } from "../_shared/http.ts";

export async function dispatch(deps: Deps, release: number): Promise<{ dispatched: boolean; error?: string }> {
  const token = deps.env("GH_TOKEN"), repo = deps.env("GH_REPO");
  if (!token || !repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) return { dispatched: false, error: "GitHub is not connected (GH_TOKEN, GH_REPO)" };
  try {
    const r = await deps.fetch(`https://api.github.com/repos/${repo}/dispatches`, {
      method: "POST",
      headers: { authorization: "Bearer " + token, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28", "content-type": "application/json", "user-agent": "silavu-admin" },
      body: JSON.stringify({ event_type: "silavu-publish", client_payload: { release } }), signal: AbortSignal.timeout(15000)
    });
    if (r.status !== 204) return { dispatched: false, error: "GitHub answered " + r.status };
    return { dispatched: true };
  } catch (e) { return { dispatched: false, error: String((e as any)?.message || e).slice(0, 200) }; }
}

export async function handler(req: Request, deps: Deps): Promise<Response> {
  const cors = corsHeaders(req, deps);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  try {
    if (req.method !== "POST") throw new HttpError(405, "method");
    const body = await readJson(req, 20000);
    const action = body.action || "publish";
    const { jwt, role } = await requireStaff(req, deps, action === "republish" ? ["owner"] : ["owner", "editor"]);
    let release: number;
    if (action === "publish") {
      const keys = Array.isArray(body.keys) ? body.keys.filter((k: unknown) => typeof k === "string").slice(0, 500) : null;
      release = Number(await deps.userRpc(jwt, "publish_docs", { p_keys: keys, p_note: String(body.note || "").slice(0, 300) }));
    } else if (action === "republish") {
      release = Number(await deps.userRpc(jwt, "republish_release", { p_release: Number(body.release), p_note: String(body.note || "").slice(0, 300) }));
    } else if (action === "retry") {
      release = Number(body.release);
      if (!Number.isInteger(release) || release < 1) throw new HttpError(400, "release");
    } else throw new HttpError(400, "action");
    const d = await dispatch(deps, release);
    return json({ ok: true, release, role, ...d }, 200, cors);
  } catch (e) { return fail(e, cors, true); }
}
