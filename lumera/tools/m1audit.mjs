import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const U=process.argv[2]||"http://localhost:8777/", TAG=process.argv[3]||"a", SHOT=(process.argv[4]||"390,320").split(",").map(Number);
const SIZES=[[320,568],[360,740],[375,667],[390,844],[393,852],[414,896],[430,932]];
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox","--disable-background-networking"]});
for (const [w,h] of SIZES) {
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:true,deviceScaleFactor:2}); const p=await ctx.newPage(); const errs=[];
  p.on("pageerror",e=>errs.push(e.message)); await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  await p.goto(U,{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn",{timeout:3000}).catch(()=>{}); await p.waitForTimeout(900);
  if (SHOT.includes(w)) await p.screenshot({path:O+`${TAG}-${w}-00-hero.jpg`,type:"jpeg",quality:60});
  const ids=await p.evaluate(()=>[...document.querySelectorAll("main > section[id]")].map(s=>s.id));
  const heights=await p.evaluate(()=>Object.fromEntries([...document.querySelectorAll("main > section[id]")].map(s=>[s.id,Math.round(s.offsetHeight)])));
  const issues=new Map(); const add=(k,v)=>{ if(!issues.has(k)) issues.set(k,v); };
  for (let i=0;i<ids.length;i++) {
    const id=ids[i];
    await p.evaluate(id=>{document.documentElement.style.scrollBehavior="auto"; const e=document.getElementById(id); scrollTo(0,e.getBoundingClientRect().top+scrollY);},id); await p.waitForTimeout(700);
    if (SHOT.includes(w)) await p.screenshot({path:O+`${TAG}-${w}-${String(i+1).padStart(2,"0")}-${id}.jpg`,type:"jpeg",quality:60});
    const r=await p.evaluate((W)=>{
      const out=[]; const vis=e=>{const c=getComputedStyle(e); if(c.visibility==="hidden"||c.display==="none"||+c.opacity===0) return false; const r=e.getBoundingClientRect(); return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight;};
      const clipped=e=>{ let a=e.parentElement; while(a&&a!==document.body){ const c=getComputedStyle(a); if(/hidden|clip|auto|scroll/.test(c.overflowX)){ const ar=a.getBoundingClientRect(), er=e.getBoundingClientRect(); if(er.right>ar.right+1||er.left<ar.left-1) return true; } a=a.parentElement;} return false; };
      const name=e=>(e.id?"#"+e.id:e.tagName.toLowerCase()+(e.className&&typeof e.className==="string"?"."+e.className.trim().split(/\s+/).slice(0,2).join("."):""))+" '"+(e.textContent||e.getAttribute("aria-label")||"").trim().slice(0,24)+"'";
      document.querySelectorAll("a,button,input,textarea,select,[role=button],summary,.chip").forEach(e=>{ if(!vis(e)) return; const r=e.getBoundingClientRect(); if((r.height<40||r.width<40) && !e.closest("#where")) out.push(["tap",name(e)+` ${Math.round(r.width)}x${Math.round(r.height)}`]); });
      document.querySelectorAll("input,textarea,select").forEach(e=>{ if(!vis(e)) return; const f=parseFloat(getComputedStyle(e).fontSize); if(f<16) out.push(["iosZoom",name(e)+" "+f+"px"]); });
      const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let n; const seen=new Set();
      while((n=walker.nextNode())){ const e=n.parentElement; if(!e||seen.has(e)||!n.textContent.trim()||!vis(e)) continue; seen.add(e); if(e.closest("svg,#where,script,style")) continue;
        const c=getComputedStyle(e), f=parseFloat(c.fontSize), r=e.getBoundingClientRect();
        if(f<11) out.push(["tiny",name(e)+" "+f+"px"]);
        if(!clipped(e)) { if(r.right>W+1||r.left<-1) out.push(["overflow",name(e)+` ${Math.round(r.left)}..${Math.round(r.right)}`]); else if((r.left<10||r.right>W-10) && r.width<W-4) out.push(["edge",name(e)+` ${Math.round(r.left)}..${Math.round(r.right)}`]); }
      }
      return out;
    }, w);
    r.forEach(([k,v])=>add(k+" "+v,[id,k,v]));
  }
  const hs=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  const byKind={}; for (const [id,k,v] of issues.values()) (byKind[k]=byKind[k]||[]).push(id+": "+v);
  console.log(`\n=== ${w}x${h}  hscroll=${hs}  errors=${errs.length}  total=${Math.round(Object.values(heights).reduce((a,b)=>a+b,0))}px`);
  console.log("heights", JSON.stringify(heights));
  for (const k of Object.keys(byKind)) { console.log(` ${k} (${byKind[k].length})`); byKind[k].slice(0, w===390||w===320?40:8).forEach(x=>console.log("   "+x)); }
  await ctx.close();
}
await b.close();
