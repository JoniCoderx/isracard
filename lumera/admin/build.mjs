/* Builds the admin into <out> (the site's dist/admin in the Pages workflow).
     node lumera/admin/build.mjs dist/admin
   The backend's public address and publishable key come from the environment
   (SILAVU_SUPABASE_URL, SILAVU_SUPABASE_ANON_KEY); without them the admin is
   built anyway and says it is not connected. No secret is ever read here. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import * as esbuild from "esbuild";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const out = path.resolve(process.argv[2] || path.join(HERE, "../site/dist/admin"));
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (/^(app|admin)\.[0-9a-f]{10}\.(js|css)$/.test(f)) fs.rmSync(path.join(out, f));

const url = (process.env.SILAVU_SUPABASE_URL || "").trim().replace(/\/+$/, "");
const key = (process.env.SILAVU_SUPABASE_ANON_KEY || "").trim();
if (key && /service_role/.test(Buffer.from((key.split(".")[1] || ""), "base64").toString())) { console.error("admin: refusing to build with a service-role key"); process.exit(1); }
const config = { supabaseUrl: /^https?:\/\/[^\s"<>]+$/.test(url) ? url : "", anonKey: /^[\w.-]+$/.test(key) ? key : "",
  functionsUrl: (process.env.SILAVU_FUNCTIONS_URL || (url ? url + "/functions/v1" : "")).replace(/\/+$/, ""),
  siteUrl: (process.env.SILAVU_SITE_URL || "").replace(/\/?$/, "/").replace(/^\/$/, "") };

const r = await esbuild.build({
  entryPoints: [path.join(HERE, "src/main.jsx")], bundle: true, write: false, minify: true, format: "esm", target: ["es2020", "safari15"],
  jsx: "automatic", jsxImportSource: "preact", legalComments: "none", define: { "process.env.NODE_ENV": '"production"' },
  plugins: [{ name: "content-shim", setup(b) { b.onResolve({ filter: /content\/load\.mjs$/ }, () => ({ path: path.join(HERE, "src/content-shim.js") })); } }]
});
const js = r.outputFiles[0].text, css = fs.readFileSync(path.join(HERE, "src/admin.css"), "utf8");
const h = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 10);
const jsName = `app.${h(js)}.js`, cssName = `admin.${h(css)}.css`;
fs.writeFileSync(path.join(out, jsName), js); fs.writeFileSync(path.join(out, cssName), css);

/* the page text the editor lists, read from the page before any content is applied */
const { body } = await import(path.join(HERE, "../site/src/body.mjs"));
const { stringInventory } = await import(path.join(HERE, "../site/src/content/apply.mjs"));
const strings = stringInventory(body).map(({ at, ...s }) => s);
fs.writeFileSync(path.join(out, "inventory.json"), JSON.stringify({ strings }));

const html = fs.readFileSync(path.join(HERE, "src/index.html"), "utf8")
  /* no plugins, no foreign <base>, forms post nowhere else; on https every request is https */
  .replace("%CSP%", `<meta http-equiv="Content-Security-Policy" content="${/^https:/.test(config.supabaseUrl) ? "upgrade-insecure-requests; " : ""}object-src 'none'; base-uri 'self'; form-action 'self'">`)
  .replace("%CONFIG%", JSON.stringify(config).replace(/</g, "\\u003c"))
  .replace("%CSS%", cssName).replace("%JS%", jsName);
fs.writeFileSync(path.join(out, "index.html"), html);
console.log(`admin: ${jsName} ${(js.length / 1024).toFixed(0)} KB, ${strings.length} page texts, ${config.supabaseUrl ? "connected to " + config.supabaseUrl : "not connected"}`);
