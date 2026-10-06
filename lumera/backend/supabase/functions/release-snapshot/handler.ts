// POST /release-snapshot (the build, with BUILD_TOKEN): the published content
// a build renders, and short-lived links to the library originals it uses.
// { release?: number }  a publish names its release; a code push asks for the newest.
import { type Deps, HttpError, json, readJson, requireBuildToken, fail } from "../_shared/http.ts";

export async function handler(req: Request, deps: Deps): Promise<Response> {
  try {
    if (req.method !== "POST") throw new HttpError(405, "method");
    requireBuildToken(req, deps);
    const body = await readJson(req, 2000);
    const id = body.release == null ? null : Number(body.release);
    if (id !== null && (!Number.isInteger(id) || id < 1)) throw new HttpError(400, "release");
    const r = await deps.rpc("svc_release_for_build", { p_release: id }) as any;
    if (!r) throw new HttpError(404, "no_release", "nothing has been published yet");
    const media = await deps.rpc("svc_media_for_snapshot", { p_snapshot: r.snapshot }) as any[];
    const signed = [];
    for (const m of media || []) signed.push({ id: m.id, kind: m.kind, mime: m.mime, width: m.width, height: m.height, url: await deps.storage.signedUrl("media", m.path, 3600) });
    return json({ release: r.release, status: r.status, snapshot: r.snapshot, media: signed });
  } catch (e) { return fail(e); }
}
