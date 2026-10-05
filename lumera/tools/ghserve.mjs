// A static server that answers like GitHub Pages (Cache-Control: max-age=600),
// optionally serving the box frames from a folder of real-weight stand-ins.
// node ghserve.mjs <root> <port> [boxdir]
import http from "http"; import fs from "fs"; import path from "path";
const [root, port, boxdir] = process.argv.slice(2);
const T = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".woff2": "font/woff2", ".ico": "image/x-icon", ".xml": "application/xml", ".txt": "text/plain", ".webmanifest": "application/manifest+json" };
http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split("?")[0]);
  let f = path.join(root, u); const m = boxdir && /^\/f\/box\/((m|d)-\d\d\.webp)$/.exec(u); if (m) f = path.join(boxdir, m[1]);
  try { if (fs.statSync(f).isDirectory()) f = path.join(f, "index.html"); } catch { r.writeHead(404); return r.end(); }
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { "Content-Type": T[path.extname(f)] || "application/octet-stream", "Cache-Control": "max-age=600", "Content-Length": d.length }); r.end(d); });
}).listen(+port, () => console.log("serving", root, "on", port));
