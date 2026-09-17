import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const mob = process.argv[2]!=="desk";
const p = await b.newPage({ viewport: mob?{width:390,height:844}:{width:1440,height:900}, isMobile:mob, hasTouch:mob });
const errs=[]; p.on("pageerror",e=>errs.push(String(e).slice(0,120)));
await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html",{waitUntil:"load"});
await p.waitForTimeout(3200); await p.click("#enterBtn",{timeout:4000}).catch(()=>{});
await p.waitForTimeout(800);
const top = async () => { await p.evaluate(()=>window.scrollTo({top:0,behavior:"instant"})); await p.waitForTimeout(400); };
const ok=(n,v,d)=>console.log((v?"PASS ":"FAIL ")+n+(d?"  ("+d+")":""));

// 1. Enquire link prefills the concierge and lands there
await top();
let r = await p.evaluate(async ()=>{
  const a=[...document.querySelectorAll("a")].find(e=>/enquire|בירור/i.test(e.textContent)&&e.getAttribute("href")); if(!a) return {no:1};
  const before=document.getElementById("fMsg")?document.getElementById("fMsg").value:"";
  a.click(); await new Promise(r=>setTimeout(r,1500));
  const c=document.getElementById("concierge").getBoundingClientRect();
  return {before, after:document.getElementById("fMsg").value, near:Math.abs(c.top)<innerHeight*0.6};
});
ok("Enquire prefills the message", r.no?false:(r.after&&r.after!==r.before), r.no?"no link":"msg="+String(r.after).slice(0,34));
ok("Enquire lands on the concierge", !!r.near);

// 2. Book a private viewing scrolls to the concierge
await top();
r = await p.evaluate(async ()=>{
  const a=[...document.querySelectorAll("a,button")].find(e=>/book a private viewing|book a viewing/i.test(e.textContent)); if(!a) return {no:1};
  a.click(); await new Promise(r=>setTimeout(r,1600));
  return {top:Math.round(document.getElementById("concierge").getBoundingClientRect().top), y:Math.round(scrollY)};
});
ok("Book a viewing lands on the concierge", !r.no && Math.abs(r.top)<80, r.no?"not found":"offset "+r.top);

// 3. Empty send shows validation
await top();
r = await p.evaluate(async ()=>{
  const f=document.getElementById("cform"); if(!f) return {no:1};
  document.getElementById("fName").value=""; document.getElementById("fContact").value="";
  const btn=[...f.querySelectorAll("button")].find(e=>/send|שליחה/i.test(e.textContent)); if(!btn) return {no:2};
  btn.click(); await new Promise(r=>setTimeout(r,700));
  return {bad:f.querySelectorAll(".bad,[aria-invalid='true'],.err").length, note:(document.getElementById("cnote")||{}).textContent||""};
});
ok("Empty send is refused with a signal", !r.no && (r.bad>0||/required|נדרש|חסר/i.test(r.note)), "flagged="+r.bad+" note="+String(r.note).slice(0,30));

// 4. A piece card opens its window
await top();
r = await p.evaluate(async ()=>{
  const a=document.querySelector("[data-piece]"); if(!a) return {no:1};
  a.click(); await new Promise(r=>setTimeout(r,1500));
  return {open:(document.querySelector(".modal.open")||{}).id||"", msg:(document.getElementById("fMsg")||{}).value||""};
});
ok("A piece opens a window or prefills", !r.no && (r.open||r.msg), "modal="+r.open+" msg="+String(r.msg).slice(0,26));

// 5. Side / Underside actually move the 3D view
await p.evaluate(()=>{const e=document.getElementById("build");window.scrollTo({top:scrollY+e.getBoundingClientRect().top,behavior:"instant"});});
await p.waitForTimeout(700);
await p.evaluate(()=>{const t=[...document.querySelectorAll("#build a,#build button")].find(e=>/START DESIGNING/i.test(e.textContent));t&&t.click();});
await p.waitForTimeout(4500);
const cam = () => p.evaluate(()=>{ try { return JSON.stringify(window.__bcam ? window.__bcam() : null); } catch(e){ return null; } });
const shot = async () => { const el=await p.$("#bcv"); return el ? (await el.screenshot()).length : 0; };
const s1 = await shot();
await p.evaluate(()=>{const t=document.querySelector('[data-vpos="side"]'); t&&t.click();}); await p.waitForTimeout(2200);
const s2 = await shot();
await p.evaluate(()=>{const t=document.querySelector('[data-vpos="under"]'); t&&t.click();}); await p.waitForTimeout(2200);
const s3 = await shot();
ok("Side changes the view", s1>0 && s2>0 && s1!==s2, "front="+s1+" side="+s2);
ok("Underside changes the view", s3>0 && s3!==s2, "under="+s3);

console.log("\nerrors="+errs.length+(errs.length?" :: "+errs[0]:""));
await b.close();
