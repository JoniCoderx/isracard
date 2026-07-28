import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8793;
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png' };
const server = http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/')p='/index.html'; const fp=path.join(ROOT,p); if(!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'}); fs.createReadStream(fp).pipe(res);});
await new Promise(r=>server.listen(PORT,r));
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport:{width:1600,height:900} });
await page.goto(`http://localhost:${PORT}/index.html?auto=1`,{waitUntil:'load'});
await page.waitForTimeout(1600);
await page.evaluate(()=>{
  window.__FREEZE = true; window.__FIRE = false;
  const g = window.__GAME;
  g.camera.rotation.set(-0.02, 0, 0);
  g.player.object.position.set(0, 1.72, 6);   // near center, look at arena
});
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(ROOT,'qa','pose_forward.png') });

// highlight the viewmodel to locate it precisely
await page.evaluate(()=>{
  const cam = window.__GAME.camera;
  let rig=null; cam.children.forEach(c=>{ if(c.type==='Group') rig=c; });
  let n=0; rig.traverse(m=>{ if(m.isMesh){ n++; m.material = m.material.clone(); m.material.emissive && m.material.emissive.setHex(0xff0055); if(m.material.emissiveIntensity!==undefined) m.material.emissiveIntensity=3; } });
  window.__hl = n;
});
await page.waitForTimeout(200);
await page.screenshot({ path: path.join(ROOT,'qa','pose_hl.png') });
console.log('highlighted meshes:', await page.evaluate(()=>window.__hl));
// fire pose
await page.evaluate(()=>{ window.__FIRE = true; });
await page.waitForTimeout(120);
await page.screenshot({ path: path.join(ROOT,'qa','pose_fire.png') });
console.log('done');
await browser.close(); server.close();
