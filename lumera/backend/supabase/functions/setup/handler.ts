// POST /setup (owner): { action: "import" } brings the site as it is into the
// database: every document the live site was built from (its public copy at
// /_content/release.json), recorded as already published, plus a first
// release marked live. Safe to run again: a document already in the database
// is left exactly as it is.
import { type Deps, HttpError, json, corsHeaders, readJson, requireStaff, fail } from "../_shared/http.ts";

export async function handler(req: Request, deps: Deps): Promise<Response> {
  const cors = corsHeaders(req, deps);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  try {
    if (req.method !== "POST") throw new HttpError(405, "method");
    const { user } = await requireStaff(req, deps, ["owner"]);
    const b = await readJson(req, 1000);
    if (b.action !== "import") throw new HttpError(400, "action");
    const site = (deps.env("SITE_URL") || "").replace(/\/+$/, "");
    if (!/^https:\/\//.test(site) && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/.test(site)) throw new HttpError(500, "site_url", "SITE_URL is not set");
    const res = await deps.fetch(site + "/_content/release.json", { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new HttpError(502, "site", "The live site's content could not be read (" + res.status + ").");
    const r = await res.json() as any;
    const docs = r && r.snapshot && r.snapshot.schema === 1 ? r.snapshot.docs : null;
    if (!docs) throw new HttpError(502, "site", "The live site's content is not in the expected form.");
    let imported = 0, kept = 0;
    for (const [key, d] of Object.entries(docs) as [string, any][]) {
      const out = await deps.rpc("svc_import_doc", { p_key: key, p_kind: d.kind, p_title: d.data && (d.data.plain || (d.data.title && d.data.title.en)) || key, p_data: d.data, p_sort: d.sort || 0 });
      out === "imported" ? imported++ : kept++;
    }
    const release = await deps.rpc("svc_import_release", { p_note: "The site as it was, imported" });
    await deps.rpc("svc_audit", { p_actor: user.id, p_role: "owner", p_action: "setup.import", p_target: "content", p_summary: { imported, kept } });
    return json({ ok: true, imported, kept, release }, 200, cors);
  } catch (e) { return fail(e, cors, true); }
}
