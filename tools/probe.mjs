import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8792;
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png' };
const server = http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/')p='/index.html'; const fp=path.join(ROOT,p); if(!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'}); fs.createReadStream(fp).pipe(res);});
await new Promise(r=>server.listen(PORT,r));
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport:{width:1280,height:720} });
page.on('pageerror',e=>console.log('PAGEERROR',e.message));
await page.goto(`http://localhost:${PORT}/index.html?auto=1`,{waitUntil:'load'});
await page.waitForTimeout(2500);
const info = await page.evaluate(()=>{
  const g = window.__GAME; const cam = g.camera;
  const walk = (o,d=0)=>{ let n=0; o.traverse(c=>{ if(c.isMesh) n++; }); return n; };
  // find weapon rig under camera
  let rig=null; cam.children.forEach(c=>{ if(c.type==='Group') rig=c; });
  const wp = new (window.__GAME.world.scene.constructor)(); // noop
  const v = {x:0,y:0,z:0};
  let rigWorld=null, meshCount=0, camInScene=false;
  g.world.scene.traverse(o=>{ if(o===cam) camInScene=true; });
  if(rig){ meshCount = walk(rig); const p = new g.camera.position.constructor(); rig.getWorldPosition(p); rigWorld={x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2)}; }
  return { camChildren: cam.children.map(c=>c.type), camInScene, rigMeshCount: meshCount, rigWorld,
    camPos:{x:+cam.position.x.toFixed(2),y:+cam.position.y.toFixed(2),z:+cam.position.z.toFixed(2)},
    camRot:{x:+cam.rotation.x.toFixed(2),y:+cam.rotation.y.toFixed(2)} };
});
console.log(JSON.stringify(info,null,2));
await browser.close(); server.close();
