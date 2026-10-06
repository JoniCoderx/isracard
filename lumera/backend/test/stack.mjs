// The whole thing, locally: a fresh test database, the fake Supabase in
// front of it, the real site build as "GitHub Actions", and a static server
// for the built site and its admin. Used by the end-to-end tests and by
// `node test/dev.mjs` for working on the admin by hand.
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { execFileSync, execFile } from "node:child_process";
import { promisify } from "node:util";
import { startFakeSupabase } from "./fake-supabase.mjs";
const run = promisify(execFile);

const BACKEND = new URL("..", import.meta.url).pathname, LUMERA = path.resolve(BACKEND, ".."), SITE = path.join(LUMERA, "site"), ADMIN = path.join(LUMERA, "admin");

export async function startStack({ sitePort = 8777, fnPort = 54321, dist = "/tmp/silavu-stack/dist", log = (m) => console.log("[stack] " + m), resetDb = true } = {}) {
  if (resetDb) execFileSync("bash", [path.join(BACKEND, "test/reset.sh")], { stdio: "pipe" });
  fs.mkdirSync(dist, { recursive: true });
  const siteUrl = `http://127.0.0.1:${sitePort}`;
  let fake;
  const buildEnv = () => ({ ...process.env, SILAVU_FUNCTIONS_URL: fake.url + "/functions/v1", SILAVU_BUILD_TOKEN: fake.env.BUILD_TOKEN, SILAVU_LIVE: siteUrl,
    SILAVU_SUPABASE_URL: fake.url, SILAVU_SUPABASE_ANON_KEY: fake.anonKey, SILAVU_SITE_URL: siteUrl + "/" });
  const builds = [];
  /* what the Pages workflow does, in the same order, with the same scripts */
  async function siteBuild(release) {
    const env = { ...buildEnv(), RELEASE_ID: release ? String(release) : "", SILAVU_PAGE_OUT: path.join(SITE, "silavu-page.stack.html") };
    const t0 = Date.now(); log(`build: release ${release || "(newest)"}`);
    const report = async (status, error) => fetch(fake.url + "/functions/v1/release-status", { method: "POST", headers: { authorization: "Bearer " + fake.env.BUILD_TOKEN, "content-type": "application/json" },
      body: JSON.stringify({ release, status, url: "https://github.com/local/site/actions/runs/" + Date.now(), error }) });
    try {
      const f = await run("node", [path.join(SITE, "content-fetch.mjs")], { env });
      const rel = (f.stdout.match(/release=(\d*)/) || [])[1];
      if (release) await report("building");
      await run("node", ["build.mjs"], { cwd: path.join(SITE, "src"), env });
      const tmp = dist + ".next"; fs.rmSync(tmp, { recursive: true, force: true });
      await run("node", [path.join(SITE, "gen-static.mjs"), env.SILAVU_PAGE_OUT, tmp, siteUrl + "/"], { env });
      fs.cpSync(path.join(SITE, "public"), tmp, { recursive: true });
      /* the photographs: derived once and kept between builds, as the live site keeps them */
      const cache = path.join(path.dirname(dist), "img-cache");
      if (!fs.existsSync(path.join(cache, "knot-flat-640.jpg"))) await run("bash", [path.join(SITE, "piece-assets.sh"), cache], { env });
      fs.mkdirSync(path.join(tmp, "img"), { recursive: true }); for (const f of fs.readdirSync(cache)) fs.copyFileSync(path.join(cache, f), path.join(tmp, "img", f));
      await run("bash", [path.join(SITE, "library-assets.sh"), tmp], { env });
      await run("node", [path.join(ADMIN, "build.mjs"), path.join(tmp, "admin")], { env });
      /* swap in whole, like a Pages deploy: the old site stays up until the new one is complete */
      fs.rmSync(dist + ".old", { recursive: true, force: true }); if (fs.existsSync(dist)) fs.renameSync(dist, dist + ".old"); fs.renameSync(tmp, dist);
      if (release) await report("live");
      builds.push({ release: release || +rel || null, ok: true, ms: Date.now() - t0 }); log(`build: done in ${Date.now() - t0} ms`);
    } catch (e) {
      if (release) await report("failed", String(e.stderr || e.message).slice(0, 400));
      builds.push({ release, ok: false, error: String(e.stderr || e.message) }); log("build failed: " + String(e.stderr || e.message).slice(0, 600));
    } finally { fs.rmSync(path.join(SITE, "silavu-page.stack.html"), { force: true }); }
  }
  fake = await startFakeSupabase({ port: fnPort, functionsDir: path.join(BACKEND, "supabase/functions"), siteBuild, env: { SITE_URL: siteUrl, ADMIN_URL: siteUrl + "/admin/", ALLOWED_ORIGINS: siteUrl }, log });

  const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".mp4": "video/mp4", ".woff2": "font/woff2", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json", ".xml": "application/xml", ".txt": "text/plain" };
  const server = http.createServer((q, s) => {
    let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
    const f = path.join(dist, p);
    if (!f.startsWith(dist) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { const nf = path.join(dist, "404.html"); s.writeHead(404, { "content-type": "text/html" }); return s.end(fs.existsSync(nf) ? fs.readFileSync(nf) : "not found"); }
    s.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream", "cache-control": "no-store" }); fs.createReadStream(f).pipe(s);
  });
  await new Promise(r => server.listen(sitePort, "127.0.0.1", r));
  log(`site on ${siteUrl}/  admin on ${siteUrl}/admin/`);
  return { fake, siteUrl, adminUrl: siteUrl + "/admin/", dist, builds, siteBuild,
    async waitForBuild(n, ms = 240000) { const t = Date.now(); while (builds.length < n) { if (Date.now() - t > ms) throw new Error("build timed out"); await new Promise(r => setTimeout(r, 250)); } return builds[n - 1]; },
    async close() { server.close(); await fake.close(); } };
}
