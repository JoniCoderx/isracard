// POST /media (owner, editor): { asset } after an upload. Reads the stored
// bytes and checks they are the kind of file they claim to be (JPEG, PNG,
// WebP, AVIF, MP4, WebM: no SVG, no HTML, nothing executable), records the
// real pixel size, and marks the asset ready or rejected.
import { type Deps, HttpError, json, corsHeaders, readJson, requireStaff, fail } from "../_shared/http.ts";

export function sniff(b: Uint8Array): string | null {
  const s = (i: number, n: number) => String.fromCharCode(...b.slice(i, i + n));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && s(1, 3) === "PNG") return "image/png";
  if (s(0, 4) === "RIFF" && s(8, 4) === "WEBP") return "image/webp";
  if (s(4, 4) === "ftyp") { const brand = s(8, 4); if (/^avi[fs]/.test(brand)) return "image/avif"; return "video/mp4"; }
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return "video/webm";
  return null;
}

export function dimensions(b: Uint8Array, mime: string): { width: number; height: number } | null {
  const u16 = (i: number) => (b[i] << 8) | b[i + 1], u32 = (i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  const le16 = (i: number) => b[i] | (b[i + 1] << 8), le24 = (i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
  if (mime === "image/png") return { width: u32(16), height: u32(20) };
  if (mime === "image/jpeg") {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { height: u16(i + 5), width: u16(i + 7) };
      i += 2 + u16(i + 2);
    }
    return null;
  }
  if (mime === "image/webp") {
    const kind = String.fromCharCode(...b.slice(12, 16));
    if (kind === "VP8 ") return { width: le16(26) & 0x3fff, height: le16(28) & 0x3fff };
    if (kind === "VP8L") { const v = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24); return { width: (v & 0x3fff) + 1, height: ((v >> 14) & 0x3fff) + 1 }; }
    if (kind === "VP8X") return { width: le24(24) + 1, height: le24(27) + 1 };
  }
  return null;
}

export async function handler(req: Request, deps: Deps): Promise<Response> {
  const cors = corsHeaders(req, deps);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  try {
    if (req.method !== "POST") throw new HttpError(405, "method");
    await requireStaff(req, deps, ["owner", "editor"]);
    const b = await readJson(req, 2000);
    const row = await deps.rpc("svc_media_row", { p_id: String(b.asset || "") }) as any;
    if (!row) throw new HttpError(404, "no_asset");
    const bytes = await deps.storage.download("media", row.path);
    const real = sniff(bytes);
    const family = (m: string | null) => (m || "").replace("image/jpg", "image/jpeg");
    let ok = !!real && family(real) === family(row.mime), reason = ok ? null : `the file is ${real || "not a picture or a film"}, not ${row.mime}`;
    const dim = real && real.startsWith("image/") ? dimensions(bytes, real) : null;
    if (ok && real !== "image/avif" && real.startsWith("image/") && !dim) { ok = false; reason = "the picture could not be read"; }
    if (ok && dim && (dim.width < 200 || dim.height < 200)) { ok = false; reason = `too small (${dim.width}×${dim.height}); 200 pixels is the least, 1254 or more is best`; }
    if (ok && dim && dim.width * dim.height > 80e6) { ok = false; reason = "larger than 80 megapixels"; }
    await deps.rpc("svc_set_media_check", { p_id: row.id, p_ok: ok, p_reason: reason, p_width: dim ? dim.width : null, p_height: dim ? dim.height : null });
    return json({ ok, reason, width: dim?.width ?? row.width, height: dim?.height ?? row.height }, 200, cors);
  } catch (e) { return fail(e, cors, true); }
}
