import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
let fails=0;
for (const [W,path] of [[390,""],[360,""],[430,"he/"]]) {
const p=await (await b.newContext({viewport:{width:W,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true})).newPage();
await p.goto("http://localhost:8777/"+path,{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn",{timeout:2000}).catch(()=>{}); await p.waitForTimeout(600);
await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; const s=document.getElementById("stripwrap"); scrollTo(0,s.getBoundingClientRect().top+scrollY-80);}); await p.waitForTimeout(900);
await p.evaluate(()=>document.querySelector('#stripwrap .vtb[data-view="wrist"]').click()); await p.waitForTimeout(900);
const st=await p.evaluate(()=>({wrist:document.getElementById("stripwrap").classList.contains("wrist"), top:document.getElementById("configure").getBoundingClientRect().top+scrollY, h:document.getElementById("configure").offsetHeight}));
let i=0;
for (let y=st.top-100; y<st.top+st.h; y+=260) {
  await p.evaluate(y=>scrollTo(0,y),y); await p.waitForTimeout(250);
  /* the hand bar must never sit over anything else in the panel */
  const bad=await p.evaluate(()=>{const hb=document.getElementById("handbar")||document.querySelector(".handbar"); if(!hb||hb.hidden) return "nohb"; const r=hb.getBoundingClientRect(); if (r.bottom<0||r.top>innerHeight) return "";
    const hits=[]; for (const x of [r.left+8, r.left+r.width/2, r.right-8]) for (const y of [r.top+r.height/2]) { const e=document.elementFromPoint(x,y); if (e && !hb.contains(e) && !e.closest("#cbar,#header,#fab")) hits.push(e.className||e.tagName); }
    const prev=hb.previousElementSibling.getBoundingClientRect(), nx=[...hb.parentElement.children].slice([...hb.parentElement.children].indexOf(hb)+1).find(e=>e.getBoundingClientRect().height>0), next=nx?nx.getBoundingClientRect():{top:1e9};
    const ov = r.top < prev.bottom-1 || r.bottom > next.top+1 ? `overlaps neighbour (prev.bottom ${Math.round(prev.bottom)} hb ${Math.round(r.top)}-${Math.round(r.bottom)} next.top ${Math.round(next.top)})` : "";
    return (hits.length?"covered:"+hits.join(","):"")+ov; });
  if (bad && bad!=="nohb") { fails++; console.log(W,path,"y",y,bad); }
  if (i++===3) await p.screenshot({path:O+`wr-${W}${path?"-he":""}.jpg`,type:"jpeg",quality:60});
}
console.log(W, path||"en", "wrist:",st.wrist);
}
console.log(fails? fails+" problems":"hand bar never overlaps");
await b.close();
