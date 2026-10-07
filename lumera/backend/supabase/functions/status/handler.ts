// GET or POST /status (any staff): which integrations are connected. Says
// yes or no, never a secret.
import { type Deps, HttpError, json, corsHeaders, requireStaff, fail } from "../_shared/http.ts";
import { provider } from "../_shared/notify.ts";

export async function handler(req: Request, deps: Deps): Promise<Response> {
  const cors = corsHeaders(req, deps, "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  try {
    if (req.method !== "GET" && req.method !== "POST") throw new HttpError(405, "method");
    const { role } = await requireStaff(req, deps, ["owner", "editor", "support", "analyst"]);
    return json({
      role,
      publishing: !!(deps.env("GH_TOKEN") && deps.env("GH_REPO")),
      publishing_mode: deps.env("GH_TOKEN") ? "direct" : "schedule",
      build_token: (deps.env("BUILD_TOKEN") || "").length >= 32 || !!(deps.env("GH_REPO") && deps.env("GH_BRANCH")),
      mail: provider(deps),
      auto_reply: deps.env("AUTO_REPLY") === "on",
      site_url: deps.env("SITE_URL") || null,
      admin_url: deps.env("ADMIN_URL") || null,
      origins: (deps.env("ALLOWED_ORIGINS") || "").split(",").map(s => s.trim()).filter(Boolean)
    }, 200, cors);
  } catch (e) { return fail(e, cors, true); }
}
