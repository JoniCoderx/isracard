// Uploading to the library. The original is kept exactly as it was sent (the
// site derives its own sizes at publish time, so nothing is ever re-encoded
// twice or recoloured here). Each file is checked in the browser for type,
// size and pixel size, then by the server, which reads the actual bytes.
import { sb, rpc, fn, q, SITE } from "./sb.js";
import { t } from "./i18n.js";

export const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "video/mp4": "mp4", "video/webm": "webm" };
export const MAX = { image: 50 * 1024 * 1024, video: 50 * 1024 * 1024 };

async function sha256(file) { const d = await crypto.subtle.digest("SHA-256", await file.arrayBuffer()); return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, "0")).join(""); }
async function pixels(file) {
  if (file.type.startsWith("image/")) { try { const b = await createImageBitmap(file); const r = { width: b.width, height: b.height }; b.close && b.close(); return r; } catch (e) { return null; } }
  return await new Promise(res => { const v = document.createElement("video"); v.preload = "metadata"; v.onloadedmetadata = () => { res({ width: v.videoWidth, height: v.videoHeight }); URL.revokeObjectURL(v.src); }; v.onerror = () => res(null); v.src = URL.createObjectURL(file); });
}

/* one file: returns { id, ok, reason } and reports progress in words */
export async function upload(file, { folder = "", tags = [], onStep = () => {} } = {}) {
  const ext = TYPES[file.type];
  if (!ext) return { ok: false, reason: t("{f}: only JPEG, PNG, WebP, AVIF pictures and MP4 or WebM films can be added (SVG is not accepted).", { f: file.name }) };
  const kind = file.type.startsWith("video/") ? "video" : "image";
  if (file.size > MAX[kind]) return { ok: false, reason: t("{f}: larger than 50 MB.", { f: file.name }) };
  onStep(t("Reading {f}…", { f: file.name }));
  const dim = await pixels(file);
  if (kind === "image" && !dim) return { ok: false, reason: t("{f}: this picture could not be read.", { f: file.name }) };
  if (kind === "image" && (dim.width < 200 || dim.height < 200)) return { ok: false, reason: t("{f}: too small ({w}×{h}). The site needs at least 1254 pixels across for sharp product photographs.", { f: file.name, w: dim.width, h: dim.height }) };
  const hash = await sha256(file);
  const path = `originals/${crypto.randomUUID()}.${ext}`;
  onStep(t("Uploading {f}…", { f: file.name }));
  const { error } = await sb.storage.from("media").upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { ok: false, reason: `${file.name}: ${error.message}` };
  const id = await rpc("register_media", { p_path: path, p_kind: kind, p_mime: file.type, p_bytes: file.size, p_width: dim && dim.width, p_height: dim && dim.height, p_filename: file.name, p_sha256: hash, p_folder: folder, p_tags: tags });
  onStep(t("Checking {f}…", { f: file.name }));
  const chk = await fn("media", { asset: id });
  return chk.ok ? { ok: true, id, small: kind === "image" && dim.width < 1254 } : { ok: false, id, reason: `${file.name}: ${chk.reason}` };
}

/* where a picture can be seen right now: the live site for what the site
   already has, a short-lived private link for the library */
const urls = new Map();
export async function thumb(img, width = 640) {
  if (!img) return "";
  if (/^media:/.test(img)) {
    const id = img.slice(6); if (urls.has(id)) return urls.get(id);
    const row = await q(sb.from("media_assets").select("path").eq("id", id).maybeSingle()); if (!row) return "";
    const { data } = await sb.storage.from("media").createSignedUrl(row.path, 3600);
    const u = data ? data.signedUrl : ""; urls.set(id, u); return u;
  }
  return `${SITE}img/${img}-${width}.jpg`;
}
export async function signedFor(rows) {
  const need = rows.filter(r => !urls.has(r.id));
  if (need.length) { const { data } = await sb.storage.from("media").createSignedUrls(need.map(r => r.path), 3600); (data || []).forEach((d, i) => d.signedUrl && urls.set(need[i].id, d.signedUrl)); }
  return Object.fromEntries(rows.map(r => [r.id, urls.get(r.id) || ""]));
}
