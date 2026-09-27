/* Measures the hand's silhouette inside its own canvas: where it starts and
   stops, how much of the frame it uses, and whether it runs off any edge. */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [n, w, h, mob] of [["desk",1440,900,false],["mob",390,844,true]]) {
  const p = await b.newPage({ viewport:{width:w,height:h}, isMobile:mob, hasTouch:mob, deviceScaleFactor:1 });
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" });
  await p.waitForTimeout(2400); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
  await p.waitForTimeout(800);
  await p.evaluate(async()=>{const s=Math.round(innerHeight*0.8);for(let y=0;y<document.body.scrollHeight;y+=s){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,90));}});
  await p.evaluate(()=>{const el=document.getElementById("stripwrap");el.scrollIntoView({block:"center",behavior:"instant"});el.classList.add("wrist");});
  await p.waitForTimeout(3200);
  for (const k of ["f","m"]) {
    await p.evaluate(kk=>window.__hand&&window.__hand({kind:kk,skin:1}),k);
    await p.waitForTimeout(2000);
    const r = await p.evaluate(()=>{
      const cv=document.getElementById("bcv"); const W=cv.width,H=cv.height;
      const c2=document.createElement("canvas"); c2.width=W; c2.height=H;
      const g=c2.getContext("2d"); g.drawImage(cv,0,0);
      const d=g.getImageData(0,0,W,H).data;
      let x0=W,x1=-1,y0=H,y1=-1,n=0;
      const row=new Array(H).fill(0), col=new Array(W).fill(0);
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;
        const lum=d[i]*0.3+d[i+1]*0.59+d[i+2]*0.11;
        if(lum>38){n++;row[y]++;col[x]++;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}}
      const edge={top:row[0]>W*0.004,bottom:row[H-1]>W*0.004,left:col[0]>H*0.004,right:col[W-1]>H*0.004};
      return {W,H,x0,x1,y0,y1,fill:(n/(W*H)*100).toFixed(1),
        wpc:(((x1-x0)/W)*100).toFixed(0), hpc:(((y1-y0)/H)*100).toFixed(0), edge};
    });
    console.log(n,k,`canvas ${r.W}x${r.H} bbox x ${r.x0}..${r.x1} (${r.wpc}% wide) y ${r.y0}..${r.y1} (${r.hpc}% tall) ink ${r.fill}% | runs off: ${Object.entries(r.edge).filter(e=>e[1]).map(e=>e[0]).join(",")||"nothing"}`);
  }
  await p.close();
}
await b.close();
