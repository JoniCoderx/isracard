import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const mob = process.argv[2]!=="desk";
const p = await b.newPage({ viewport: mob?{width:390,height:844}:{width:1440,height:900}, isMobile:mob, hasTouch:mob });
const errs=[]; p.on("pageerror",e=>errs.push(String(e).slice(0,100)));
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
await p.waitForTimeout(3000); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
await p.waitForTimeout(700);
const ok=(n,v,d)=>console.log((v?"PASS ":"FAIL ")+n+(d?"  ("+d+")":""));

// set the builder to a non-default state first, so we can see if switching language resets it
await p.evaluate(()=>{const e=document.getElementById("build");e&&window.scrollTo({top:scrollY+e.getBoundingClientRect().top,behavior:"instant"});});
await p.waitForTimeout(600);
await p.evaluate(()=>{const t=[...document.querySelectorAll("#build a,#build button")].find(e=>/START DESIGNING/i.test(e.textContent));t&&t.click();});
await p.waitForTimeout(3500);
await p.evaluate(()=>{ const c=[...document.querySelectorAll('.chip[data-k="cut"]')].find(x=>x.getAttribute("data-v")==="oval"); c&&c.click();
  const w=[...document.querySelectorAll('.chip[data-k="wrist"]')].find(x=>x.getAttribute("data-v")==="19"); w&&w.click(); });
await p.waitForTimeout(1200);
const before = await p.evaluate(()=>({cut:window.__build.cut, wrist:window.__build.wrist, ct:window.__build.ct, cur:(document.querySelector("[data-cur] .chip.on")||{}).textContent}));

// switch to Hebrew
await p.evaluate(()=>{const a=document.querySelector("#langBtn,.lang");a&&a.click();});
await p.waitForTimeout(1500);
const st = await p.evaluate(()=>({lang:document.documentElement.getAttribute("data-lang"), dir:document.documentElement.getAttribute("dir")}));
ok("Hebrew sets lang and direction", st.lang==="he" && st.dir==="rtl", "lang="+st.lang+" dir="+st.dir);

const after = await p.evaluate(()=>({cut:window.__build.cut, wrist:window.__build.wrist, ct:window.__build.ct, cur:(document.querySelector("[data-cur] .chip.on")||{}).textContent}));
ok("switching language keeps the bracelet", before.cut===after.cut && before.wrist===after.wrist && before.ct===after.ct,
   "was "+before.cut+"/"+before.wrist+"cm/"+before.ct+"ct, now "+after.cut+"/"+after.wrist+"cm/"+after.ct+"ct");
ok("switching language keeps the currency", before.cur===after.cur, "was "+before.cur+", now "+after.cur);

// English left showing in Hebrew
const leaks = await p.evaluate(()=>{
  const bad=[]; const skip=/SILAVU|GIA|IGI|AED|USD|EUR|ILS|ct|mm|cm|@|\.com|©|MMXXVI/;
  document.querySelectorAll("[data-en]").forEach(e=>{
    const he=e.getAttribute("data-he"); const t=(e.textContent||"").trim();
    if(!he) { bad.push("no data-he: "+t.slice(0,28)); return; }
    if(/[A-Za-z]{4,}/.test(t) && !skip.test(t) && !/[֐-׿]/.test(t)) bad.push("still English: "+t.slice(0,32));
  });
  return [...new Set(bad)];
});
ok("nothing is left in English", leaks.length===0, leaks.length? leaks.length+" found: "+leaks.slice(0,4).join(" | ") : "all translated");

// bidi isolation where Hebrew meets Latin or digits
const bidi = await p.evaluate(()=>{
  const mixed=[];
  document.querySelectorAll("p,.k,.t,.d,li,h1,h2,h3,.price,.big,button,a").forEach(e=>{
    if(e.children.length>2) return;
    const t=(e.textContent||"").trim(); if(t.length<3) return;
    const heb=/[֐-׿]/.test(t), lat=/[A-Za-z]{2,}|[0-9]/.test(t);
    if(heb&&lat){ const cs=getComputedStyle(e);
      const iso = cs.unicodeBidi==="isolate"||cs.unicodeBidi==="plaintext"||e.querySelector("bdi,[dir]");
      if(!iso) mixed.push(t.slice(0,34)); }
  });
  return [...new Set(mixed)];
});
console.log("mixed Hebrew/Latin runs without explicit isolation: "+bidi.length);
bidi.slice(0,6).forEach(x=>console.log("     "+x));

// persistence across a reload
await p.reload({waitUntil:"load"}); await p.waitForTimeout(2600); await p.click("#enterBtn",{timeout:3000}).catch(()=>{});
await p.waitForTimeout(700);
const kept = await p.evaluate(()=>document.documentElement.getAttribute("data-lang"));
ok("the language survives a refresh", kept==="he", "after reload lang="+kept);
console.log("\nerrors="+errs.length+(errs.length?" :: "+errs[0]:""));
await b.close();
