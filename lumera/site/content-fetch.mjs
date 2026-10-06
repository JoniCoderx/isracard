/* Before a build: which content does it render?

   1. The backend, when the workflow has its address and build token: a given
      release (a publish names it) or the newest one that has not failed. The
      answer carries signed links to the library originals it uses.
   2. Otherwise, the copy the live site already serves (/_content/release.json),
      so a code change never undoes what the owner published.
   3. Otherwise nothing is written, and the build renders the seed.

   Writes lumera/site/content/release.json and lumera/site/content/media.json,
   and prints release=<id> for the workflow. Never fails the build on its own:
   it falls through to the next source and says why. */
import fs from "node:fs";

const DIR = new URL("./content/", import.meta.url).pathname;
const { SILAVU_FUNCTIONS_URL: FN, SILAVU_BUILD_TOKEN: TOKEN, SILAVU_LIVE: LIVE, RELEASE_ID } = process.env;
fs.mkdirSync(DIR, { recursive: true });
const out = (k, v) => { if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`); console.log(`${k}=${v}`); };
const valid = (r) => r && r.snapshot && r.snapshot.schema === 1 && r.snapshot.docs && typeof r.snapshot.docs === "object";

async function fromBackend() {
  const res = await fetch(FN.replace(/\/+$/, "") + "/release-snapshot", {
    method: "POST", headers: { "authorization": "Bearer " + TOKEN, "content-type": "application/json" },
    body: JSON.stringify({ release: RELEASE_ID ? Number(RELEASE_ID) : null }), signal: AbortSignal.timeout(30000)
  });
  if (!res.ok) throw new Error("backend answered " + res.status);
  const r = await res.json();
  if (!valid(r)) throw new Error("backend answered without a snapshot");
  return r;
}
async function fromLive() {
  const res = await fetch(LIVE.replace(/\/+$/, "") + "/_content/release.json", { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error("live copy answered " + res.status);
  const r = await res.json();
  if (!valid(r)) throw new Error("live copy is not a release");
  // the library pictures it uses are already derived on the live site
  const ids = [...new Set((JSON.stringify(r.snapshot).match(/media:[0-9a-f-]{36}/g) || []).map(x => x.slice(6)))];
  r.media = ids.map(id => ({ id, live: true }));
  return r;
}

let r = null;
if (FN && TOKEN) { try { r = await fromBackend(); console.log("content: from the backend, release", r.release); } catch (e) { console.warn("content: backend unavailable:", e.message); } }
if (!r && LIVE) { try { r = await fromLive(); console.log("content: from the live site, release", r.release); } catch (e) { console.warn("content: no live copy:", e.message); } }
if (r) {
  fs.writeFileSync(DIR + "release.json", JSON.stringify({ release: r.release ?? null, snapshot: r.snapshot }));
  fs.writeFileSync(DIR + "media.json", JSON.stringify(r.media || []));
  out("release", r.release ?? "");
  out("source", r.media && r.media.some(m => m.live) ? "live" : (FN && TOKEN ? "backend" : "live"));
} else {
  /* a copy left by an earlier local build must not be mistaken for content */
  for (const f of ["release.json", "media.json"]) fs.rmSync(DIR + f, { force: true });
  console.log("content: none published yet; the seed is built");
  out("release", ""); out("source", "seed");
}
