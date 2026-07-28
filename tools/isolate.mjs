import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8794;
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png' };
const server = http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/')p='/index.html'; const fp=path.join(ROOT,p); if(!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'}); fs.createReadStream(fp).pipe(res);});
await new Promise(r=>server.listen(PORT,r));
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport:{width:1600,height:900} });
await page.goto(`http://localhost:${PORT}/index.html?auto=1`,{waitUntil:'load'});
await page.waitForTimeout(1600);
// freeze forward
await page.evaluate(()=>{ window.__FREEZE=true; window.__FIRE=false; const g=window.__GAME; g.camera.rotation.set(-0.05,0,0); g.player.object.position.set(0,1.72,6); });
await page.waitForTimeout(300);
// what is straight ahead & down? raycast
const hit = await page.evaluate(async ()=>{
  const g = window.__GAME; const THREE = g.THREE;
  return 'no-three-global';
});
// toggle env off
await page.evaluate(()=>{ const s=window.__GAME.world.scene; window.__envBak=s.environment; s.environment=null; });
await page.waitForTimeout(200);
await page.screenshot({ path: path.join(ROOT,'qa','iso_noenv.png') });
// env back, kill moon
await page.evaluate(()=>{ const s=window.__GAME.world.scene; s.environment=window.__envBak; window.__GAME.world.moon.intensity=0; });
await page.waitForTimeout(200);
await page.screenshot({ path: path.join(ROOT,'qa','iso_nomoon.png') });
console.log('done');
await browser.close(); server.close();
