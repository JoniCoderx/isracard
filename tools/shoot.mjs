// Headless QA: serve the game, load ?auto, capture console + screenshots.
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8791;
const OUT = process.argv[2] || path.join(ROOT, 'qa');
const WAIT = Number(process.argv[3] || 4500);
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});

await new Promise(r => server.listen(PORT, r));

const exe = fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
  ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  : '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';

const browser = await chromium.launch({
  executablePath: exe,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl',
    '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });

const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

await page.goto(`http://localhost:${PORT}/index.html?auto=1`, { waitUntil: 'load' });
await page.waitForTimeout(WAIT);

// capture a few frames spaced out to catch action
const frames = Number(process.env.FRAMES || 3);
for (let i = 0; i < frames; i++) {
  await page.screenshot({ path: path.join(OUT, `frame_${i}.png`) });
  if (i < frames - 1) await page.waitForTimeout(1400);
}

// pull some runtime state
const state = await page.evaluate(() => {
  const g = window.__GAME;
  if (!g) return { ok: false };
  return { ok: true, state: g.GAME.state, wave: g.GAME.wave, kills: g.GAME.kills,
    enemies: g.enemies.enemies.length, hp: Math.round(g.player.state.hp),
    calls: g.renderer.info.render.calls, tris: g.renderer.info.render.triangles };
});

fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ errors, state }, null, 2));
console.log('ERRORS:', errors.length ? JSON.stringify(errors, null, 2) : 'none');
console.log('STATE:', JSON.stringify(state));
console.log('Screenshots →', OUT);

await browser.close();
server.close();
