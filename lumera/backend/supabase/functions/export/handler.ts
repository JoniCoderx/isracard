// POST /export
//   owner, signed in: makes a full export (content, history, releases, the
//   library's records, customers, enquiries, quotes, staff, the audit trail),
//   stores it gzipped in the private exports bucket and returns a link that
//   works for ten minutes.
//   the scheduled backup, with BUILD_TOKEN and { scheduled: true }: stores it
//   and returns only its name; nothing personal travels back to GitHub.
// Pictures and films stay in the media bucket; the restore guide copies them.
import { type Deps, HttpError, json, corsHeaders, readJson, requireStaff, requireBuild, fail } from "../_shared/http.ts";

export async function gzip(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function handler(req: Request, deps: Deps): Promise<Response> {
  const cors = corsHeaders(req, deps);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  try {
    if (req.method !== "POST") throw new HttpError(405, "method");
    const b = await readJson(req, 1000);
    let actor: string | null = null, scheduled = false;
    if (b.scheduled === true) { await requireBuild(req, deps); scheduled = true; }
    else actor = (await requireStaff(req, deps, ["owner"])).user.id;
    const data = await deps.rpc("svc_export", {});
    const name = `silavu-export-${new Date().toISOString().replace(/[:.]/g, "-")}${scheduled ? "-scheduled" : ""}.json.gz`;
    await deps.storage.upload("exports", name, await gzip(JSON.stringify(data)), "application/gzip");
    await deps.rpc("svc_audit", { p_actor: actor, p_role: scheduled ? "schedule" : "owner", p_action: "export.create", p_target: "export:" + name, p_summary: {} });
    if (scheduled) return json({ ok: true, name });
    return json({ ok: true, name, url: await deps.storage.signedUrl("exports", name, 600) }, 200, cors);
  } catch (e) { return fail(e, cors, true); }
}
