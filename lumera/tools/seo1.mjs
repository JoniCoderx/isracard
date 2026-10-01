import { chromium } from "playwright-core";
const O="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/m/";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
let pass=0,fail=0; const ok=(c,m)=>{c?pass++:fail++; console.log((c?"PASS ":"FAIL ")+m);};
// 1. static Hebrew markup, no script
{ const c=await b.newContext({javaScriptEnabled:false}); const p=await c.newPage(); await p.route(/fonts\./,r=>r.abort());
  await p.goto("http://localhost:8777/he/",{waitUntil:"domcontentloaded"});
  const r=await p.evaluate(()=>{ const t=document.createElement("template"); let bad=[], n=0;
    document.querySelectorAll("body [data-he]").forEach(el=>{ if(el.closest("svg")) return; if(el.parentElement.closest("[data-he]")) return; n++; t.innerHTML=el.getAttribute("data-he"); const inner=el.innerHTML.replace(/^<bdi dir="rtl">([\s\S]*)<\/bdi>$/,"$1"); if(inner.trim()!==t.innerHTML.trim()) bad.push(el.outerHTML.slice(0,120)); });
    return {n,bad:bad.slice(0,5),nb:bad.length,title:document.title,lang:document.documentElement.lang,dir:document.dir,h1:[...document.querySelectorAll("h1")].map(h=>h.textContent),canon:document.querySelector("link[rel=canonical]").href,alts:[...document.querySelectorAll("link[hreflang]")].map(l=>l.hreflang+"="+l.href),desc:document.querySelector("meta[name=description]").content}; });
  console.log(JSON.stringify(r,null,1));
  ok(r.nb===0 && r.n>150, `static Hebrew: ${r.n} outer strings, ${r.nb} mismatched`);
  ok(r.lang==="he"&&r.dir==="ltr"&&r.h1.length===1, "he, layout kept left to right, one h1");
  ok(/\/he\/$/.test(r.canon)&&r.alts.length===3, "canonical + 3 hreflang");
  await c.close(); }
// 2. live Hebrew page: assets, errors, anchors, title in modal
for (const [w,h] of [[1440,900],[390,844]]) {
  const c=await b.newContext({viewport:{width:w,height:h},hasTouch:w<900}); const p=await c.newPage(); const errs=[], bad=[];
  p.on("pageerror",e=>errs.push(e.message)); p.on("response",r=>{ if(r.status()>=400) bad.push(r.status()+" "+r.url()); });
  await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  await p.goto("http://localhost:8777/he/",{waitUntil:"load"}); await p.waitForTimeout(2000);
  await p.click("#enterBtn",{timeout:3000}).catch(()=>{}); await p.waitForTimeout(800);
  const s=await p.evaluate(()=>({lang:document.documentElement.lang, saved:localStorage.getItem("silavu-lang"), h1:document.querySelector("h1").textContent, url:location.pathname}));
  ok(s.lang==="he"&&s.saved==="he"&&/\/he\/$/.test(s.url), `${w} live he ${JSON.stringify(s)}`);
  // nav anchor stays on /he/
  await p.evaluate(()=>{ const a=document.querySelector('a[href="#collection"]'); a&&a.click(); }); await p.waitForTimeout(1500);
  ok(/\/he\/$/.test(await p.evaluate(()=>location.pathname)), `${w} in-page link stays on /he/`);
  await p.evaluate(()=>document.querySelector("#p-ring .fig").scrollIntoView({block:"center"})); await p.waitForTimeout(500);
  await p.click("#p-ring .fig"); await p.waitForTimeout(1200);
  const t1=await p.title(); await p.keyboard.press("Escape"); await p.waitForTimeout(600); const t2=await p.title();
  ok(t1==="SILAVU ICON | טבעת יהלומים" && t2==="SILAVU | תכשיטי יוקרה", `${w} modal title ${t1} / ${t2}`);
  await p.evaluate(()=>scrollTo(0,document.body.scrollHeight)); await p.waitForTimeout(2500);
  ok(bad.length===0, `${w} no failed requests ${bad.slice(0,5).join(" ")}`);
  ok(errs.length===0, `${w} no errors ${errs.join("|")}`);
  if (w===390) await p.screenshot({path:O+"he-foot.jpg",type:"jpeg",quality:60});
  await c.close();
}
// 3. English root title + modal title
{ const c=await b.newContext({viewport:{width:1440,height:900}}); const p=await c.newPage(); await p.route(/fonts\./,r=>r.abort());
  await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1500);
  const t0=await p.title(); await p.evaluate(()=>document.querySelector("#p-knot .fig").scrollIntoView({block:"center"})); await p.waitForTimeout(400);
  await p.click("#p-knot .fig"); await p.waitForTimeout(1000); const t1=await p.title();
  ok(t0==="SILAVU | High Jewellery"&&t1==="SILAVU MOMENT | White Gold Bracelet", `en titles ${t0} / ${t1}`);
  const ld=await p.evaluate(()=>JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)["@graph"].map(g=>[].concat(g["@type"]).join("+")));
  ok(ld.join()==="Organization+JewelryStore,WebSite,ItemList", "schema "+ld);
  await c.close(); }
await b.close(); console.log(pass,"pass,",fail,"fail");
