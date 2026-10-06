import { chromium } from "playwright-core";
/* the enquiry, end to end — nothing is ever sent: mailto is caught */
const port=process.argv[2]||"8777"; let pass=0, fail=0;
const ok=(c,m)=>{ console.log((c?"PASS ":"FAIL ")+m); c?pass++:fail++; };
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
for (const [W,H,mob] of [[1440,900,false],[390,844,true]]) {
  const c=await b.newContext({viewport:{width:W,height:H},hasTouch:mob,isMobile:mob,permissions:["clipboard-read","clipboard-write"]});
  /* a mailto is recorded, never followed */
  await c.addInitScript(()=>{ window.__mail=null; const d=Object.getOwnPropertyDescriptor(Location.prototype,"href"); });
  const p=await c.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  /* the form sends straight to the house inbox through FormSubmit: answered here, never sent */
  let mailto=null; await p.route("**/*", r=>r.continue()); p.on("request",r=>{ if (r.url().startsWith("mailto:")) mailto=r.url(); });
  let posted=null; /* registered last, so it is the one that answers */ await p.route("**/formsubmit.co/**", r=>{ posted=JSON.parse(r.request().postData()||"{}"); r.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:'{"success":"true"}'}); });
  await p.goto(`http://localhost:${port}/`,{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn",{timeout:1500}).catch(()=>{}); await p.waitForTimeout(400);
  await p.evaluate(()=>{document.documentElement.style.scrollBehavior="auto"; sessionStorage.clear();});
  const tag=mob?"phone":"desktop";
  const geo=await p.evaluate(()=>{const f=document.getElementById("cform").getBoundingClientRect(), t=document.getElementById("fMsg").getBoundingClientRect(); return [Math.round(f.width),Math.round(t.width),Math.round(t.height)];});
  ok(geo[1]>=geo[0]-4 && geo[2]<=80, `${tag} message spans the form and rests at one line (${geo[1]} of ${geo[0]}px, ${geo[2]}px tall)`);
  await p.evaluate(()=>document.getElementById("fMsg").focus()); await p.waitForTimeout(600);
  const hf=await p.evaluate(()=>Math.round(document.getElementById("fMsg").getBoundingClientRect().height)); await p.evaluate(()=>document.activeElement.blur());
  ok(hf>=110, `${tag} message opens when you go to write (${hf}px)`);
  /* Reserve on a card */
  const card=p.locator(".pgrid .piece:not(.soon)").first(); await card.scrollIntoViewIfNeeded();
  if (mob) await card.locator(".q").tap(); else await card.locator(".q").click(); await p.waitForTimeout(1200);
  let s=await p.evaluate(()=>({vis:!document.getElementById("csel").hidden, act:document.getElementById("cselAct").textContent, txt:document.getElementById("cselTxt").textContent, want:(document.querySelector("#cform .want .chip.on")||{}).textContent, msg:document.getElementById("fMsg").value}));
  ok(s.vis && /Reserv/.test(s.act) && /MOMENT/.test(s.txt), `${tag} Reserve shows the selection (${s.act}: ${s.txt})`);
  ok(/collection/i.test(s.want||""), `${tag} Reserve sets the enquiry type (${s.want})`);
  ok(s.msg==="", `${tag} the message is left to the client`);
  await p.fill("#fMsg","My own words, 6 ct please."); await p.fill("#fName","Test Person"); await p.fill("#fContact","test@example.com");
  /* language switch */
  await p.click("#langBtn").catch(async()=>{ await p.click("#menuBtn"); }); await p.waitForTimeout(300);
  await p.click('#langmenu button[data-lang="he"]'); await p.waitForTimeout(1500);
  s=await p.evaluate(()=>({txt:document.getElementById("cselTxt").textContent, act:document.getElementById("cselAct").textContent, msg:document.getElementById("fMsg").value, dir:document.documentElement.dir}));
  ok(/צמיד/.test(s.txt) && /שריון/.test(s.act) && s.msg==="My own words, 6 ct please.", `${tag} Hebrew translates the selection (${s.act}: ${s.txt}), keeps the message`);
  ok(s.dir==="rtl", `${tag} Hebrew page is right to left`);
  /* About and back */
  await p.goto(`http://localhost:${port}/about/`,{waitUntil:"load"}); await p.waitForTimeout(600);
  await p.goto(`http://localhost:${port}/`,{waitUntil:"load"}); await p.waitForTimeout(1500); await p.click("#enterBtn",{timeout:1500}).catch(()=>{});
  s=await p.evaluate(()=>({vis:!document.getElementById("csel").hidden, txt:document.getElementById("cselTxt").textContent, msg:document.getElementById("fMsg").value, name:document.getElementById("fName").value}));
  ok(s.vis && /MOMENT/.test(s.txt) && s.msg.startsWith("My own words") && s.name==="Test Person", `${tag} selection and draft survive About and back`);
  /* edit selection opens the piece */
  await p.evaluate(()=>document.getElementById("cselEdit").click()); await p.waitForTimeout(900);
  s=await p.evaluate(()=>({open:document.getElementById("pmodal").classList.contains("open"), t:document.getElementById("pmT").textContent}));
  ok(s.open && /MOMENT/.test(s.t), `${tag} Edit selection opens that piece`);
  await p.keyboard.press("Escape"); await p.waitForTimeout(400);
  /* builder reserve replaces it with the Line */
  await p.evaluate(()=>{ document.querySelector('#opts .chip[data-k="ct"][data-v="8"]').click(); document.getElementById("reserve").click(); }); await p.waitForTimeout(900);
  s=await p.evaluate(()=>document.getElementById("cselTxt").textContent);
  ok(/The Line/.test(s) && /8 ct/.test(s.replace(/[⁦⁩]/g,"")), `${tag} the Line's reservation becomes the selection (${s.replace(/[⁦⁩]/g,"")})`);
  /* copy, then send */
  await p.evaluate(()=>document.getElementById("ccopy").click()); await p.waitForTimeout(500);
  const clip=await p.evaluate(()=>navigator.clipboard.readText().catch(e=>"ERR "+e));
  ok(/concierge@silavu.com/.test(clip) && /My own words/.test(clip) && /Test Person/.test(clip), `${tag} Copy the details puts everything on the clipboard`);
  await p.evaluate(()=>{ window.addEventListener("beforeunload",e=>{}); });
  await p.evaluate(()=>document.getElementById("csend").click()).catch(()=>{}); await p.waitForTimeout(800);
  s=await p.evaluate(()=>({delivered:document.getElementById("cform").classList.contains("delivered"), thanks:document.getElementById("cthh").textContent, body:document.getElementById("cthp").textContent}));
  ok(s.delivered && /Test/.test(s.thanks) && posted && /The Line/.test(posted.selection||""), `${tag} after sending: delivered with the selection, thank-you names the reader ("${s.thanks}")`);
  ok(!errs.length, `${tag} no page errors ${errs.join("|")}`);
  await c.close();
}
console.log(`${pass} pass, ${fail} fail`); await b.close();
