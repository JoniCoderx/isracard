import { chromium } from "playwright-core";
const OUT="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/mob/"; import fs from "fs"; fs.mkdirSync(OUT,{recursive:true});
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--disable-background-networking","--disable-component-update"] });
let pass=0, fail=0; const ok=(c,m)=>{ c?pass++:fail++; console.log((c?"PASS ":"FAIL ")+m); };
const W = +(process.argv[2]||390), lang = process.argv[3]||"he", H = W===360?740:(W===430?932:844);
const ctx = await b.newContext({ viewport:{width:W,height:H}, hasTouch:true, isMobile:true, deviceScaleFactor:2 });
await ctx.addInitScript(l => { localStorage.setItem("silavu-lang", l); localStorage.setItem("silavu-seen","1"); }, lang);
const p = await ctx.newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/, r=>r.abort()); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
await p.goto("http://127.0.0.1:8777/",{waitUntil:"load"}); await p.waitForTimeout(1200); await p.click("#enterBtn").catch(()=>{}); await p.waitForTimeout(600);
const T = `${W} ${lang}`;
// walk the page: clipped controls and overlapping tap targets at every screen
const PH = await p.evaluate(()=>document.documentElement.scrollHeight);
const clipped = new Set(), overl = new Set();
for (let y=0; y<PH; y+=Math.round(H*0.75)) {
  await p.evaluate(y=>scrollTo(0,y), y); await p.waitForTimeout(140);
  const r = await p.evaluate(() => {
    const vis = e => { const s=getComputedStyle(e); if (s.display==="none"||s.visibility==="hidden"||+s.opacity<0.05||s.pointerEvents==="none") return false; const r=e.getBoundingClientRect(); return r.width>1 && r.height>1 && r.bottom>0 && r.top<innerHeight && !e.closest("[hidden],.modal:not(.open),#menu:not(.open)"); };
    const ctl = [...document.querySelectorAll("a[href], button, input, textarea, summary, [role=tab], .chip")].filter(vis);
    /* the text itself against the box it sits in (an enlarged invisible tap
       area inflates scrollWidth without cutting anything) */
    const cl = ctl.filter(e => { if (!e.textContent.trim() || e.matches("input,textarea,.mark")) return false; const s=getComputedStyle(e), rg=document.createRange(); rg.selectNodeContents(e); const tr=rg.getBoundingClientRect(), er=e.getBoundingClientRect(); return tr.width > er.width + 1 || tr.left < er.left - 1 || tr.right > er.right + 1; }).map(e => (e.id||e.className||e.tagName)+":"+e.textContent.trim().slice(0,24));
    const ov = []; const R = ctl.map(e=>[e, e.getBoundingClientRect()]);
    for (let i=0;i<R.length;i++) for (let j=i+1;j<R.length;j++) { const [a,ra]=R[i], [c,rc]=R[j]; if (a.contains(c)||c.contains(a)) continue;
      const w=Math.min(ra.right,rc.right)-Math.max(ra.left,rc.left), h=Math.min(ra.bottom,rc.bottom)-Math.max(ra.top,rc.top);
      if (w>3 && h>3) { const fa=getComputedStyle(a).position==="fixed"||a.closest("header,#fab"), fc=getComputedStyle(c).position==="fixed"||c.closest("header,#fab");
        if (fa && fc) ov.push("fixed:"+(a.id||a.textContent.trim().slice(0,14))+" × "+(c.id||c.textContent.trim().slice(0,14)));
        else if (!fa && !fc) ov.push((a.id||a.textContent.trim().slice(0,16))+" × "+(c.id||c.textContent.trim().slice(0,16))); } }
    return { cl, ov };
  });
  r.cl.forEach(x=>clipped.add(x)); r.ov.forEach(x=>overl.add(x));
}
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), `${T} no sideways scroll`);
ok(clipped.size===0, `${T} no control clips its label ${[...clipped].slice(0,6).join(" | ")}`);
ok(overl.size===0, `${T} no overlapping tap targets ${[...overl].slice(0,6).join(" | ")}`);
// the menu
await p.evaluate(()=>scrollTo(0,0)); await p.waitForTimeout(300);
await p.click("#menuBtn"); await p.waitForTimeout(700);
const m = await p.evaluate(()=>{ const links=[...document.querySelectorAll("#menu a, #menu button")].filter(e=>e.offsetParent); return { open: document.getElementById("menu").classList.contains("open"), n: links.length, out: links.filter(e=>{ const r=e.getBoundingClientRect(); return r.left<-1||r.right>innerWidth+1; }).length, small: links.filter(e=>e.getBoundingClientRect().height<40).map(e=>e.textContent.trim().slice(0,16)) }; });
ok(m.open && m.n>3 && m.out===0 && m.small.length===0, `${T} menu opens, ${m.n} items inside the screen, tap height ≥40 ${m.small.join(",")}`);
await p.screenshot({ path: OUT+`${W}-${lang}-menu.png` });
await p.keyboard.press("Escape"); await p.waitForTimeout(500);
ok(await p.evaluate(()=>!document.getElementById("menu").classList.contains("open") && !document.documentElement.classList.contains("locked")), `${T} menu closes with Escape`);
// the gallery
const vw = (await p.$$(".pgrid .piece:not(.soon) .fig"))[1]; await vw.scrollIntoViewIfNeeded(); await vw.tap(); await p.waitForTimeout(1200);
const g = await p.evaluate(()=>{ const q=id=>document.getElementById(id).getBoundingClientRect(); const im=q("pmIm"), pr=q("pmPrev"), nx=q("pmNext"), cl=document.querySelector("#pmodal .mclose2").getBoundingClientRect(), th=q("pmThumbs"), req=q("pmReq");
  const hit=(r,el)=>{ const e=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2); return e && (e===el||el.contains(e)); };
  return { imIn: im.left>=-1 && im.right<=innerWidth+1, navOk: pr.width>=40 && nx.width>=40 && hit(pr,document.getElementById("pmPrev")) && hit(nx,document.getElementById("pmNext")), closeOk: hit(cl, document.querySelector("#pmodal .mclose2")), thumbsIn: th.right<=innerWidth+1 && th.left>=-1, reqOk: hit(req, document.getElementById("pmReq")) && req.bottom<=innerHeight+1 }; });
ok(g.imIn && g.navOk && g.closeOk && g.thumbsIn && g.reqOk, `${T} piece window: photo inside, arrows ≥40px and tappable, Close tappable, thumbnails inside, booking button reachable ${JSON.stringify(g)}`);
await p.tap("#pmNext"); await p.waitForTimeout(700);
ok(await p.evaluate(()=>document.querySelector("#pmThumbs button.on").dataset.i==="1"), `${T} tapping the arrow turns the photograph`);
await p.screenshot({ path: OUT+`${W}-${lang}-piece.png` });
await p.tap("#pmodal .mclose2"); await p.waitForTimeout(600);
ok(await p.evaluate(()=>!document.getElementById("pmodal").classList.contains("open") && !document.documentElement.classList.contains("locked")), `${T} Close closes and releases the page`);
// the configurator: every control reachable, nothing under the bottom bar
await p.evaluate(()=>{ const e=document.getElementById("configure"); scrollTo(0, e.getBoundingClientRect().top+scrollY); }); await p.waitForTimeout(900);
const chips = await p.$$('.chip[data-k]'); let blocked = [];
for (const c of chips) { const bx = await c.boundingBox(); if (!bx) continue; await c.evaluate(e=>e.scrollIntoView({block:"center"})); await p.waitForTimeout(60);
  const hit = await c.evaluate(e=>{ const r=e.getBoundingClientRect(); const t=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2); return t && (t===e||e.contains(t)); }); if (!hit) blocked.push(await c.evaluate(e=>e.dataset.k+"="+e.dataset.v)); }
ok(blocked.length===0, `${T} all ${chips.length} configurator choices tappable (none under the bar) ${blocked.slice(0,5).join(",")}`);
await p.evaluate(()=>document.querySelector('.chip[data-k="cut"][data-v="emerald"]').click()); await p.waitForTimeout(500);
await p.evaluate(()=>document.getElementById("reserve").scrollIntoView({block:"end"})); await p.waitForTimeout(1500);
ok(await p.evaluate(()=>{ const e=document.getElementById("reserve"), r=e.getBoundingClientRect(), t=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2); return t && (t===e||e.contains(t)); }), `${T} "Reserve this bracelet" not covered by the bottom bar at the screen's foot`);
await p.screenshot({ path: OUT+`${W}-${lang}-config.png` });
// the form with the keyboard up
await p.tap("#reserve"); await p.waitForTimeout(1200);
await p.evaluate(()=>{ const e=document.getElementById("fName"); e.scrollIntoView({block:"center"}); }); await p.waitForTimeout(400);
await p.tap("#fName"); await p.waitForTimeout(300);
await p.setViewportSize({ width: W, height: Math.round(H*0.52) }); await p.waitForTimeout(700);
await p.evaluate(()=>document.activeElement.scrollIntoView({block:"nearest"})); await p.waitForTimeout(400);
for (const id of ["fName","fContact","fMsg"]) {
  await p.focus("#"+id); await p.evaluate(id=>document.getElementById(id).scrollIntoView({block:"nearest"}), id); await p.waitForTimeout(700);   /* the page brings a focused message field into view after 480ms, once the keyboard has settled */
  const k = await p.evaluate(id=>{ const e=document.getElementById(id), r=e.getBoundingClientRect(), t=document.elementFromPoint(r.left+r.width/2, r.top+Math.min(r.height/2, 12)); const fab=document.getElementById("fab"), fr=fab.getBoundingClientRect(); return { inView: r.top>=0 && r.bottom<=innerHeight+1, hit: !!t && (t===e || e.contains(t) || t.closest(".field")===e.closest(".field")), fabOver: getComputedStyle(fab).opacity>0.1 && fr.top < r.bottom && fr.bottom > r.top }; }, id);
  ok(k.inView && k.hit && !k.fabOver, `${T} keyboard up (${Math.round(H*0.52)}px tall): #${id} visible and not covered ${JSON.stringify(k)}`);
}
await p.screenshot({ path: OUT+`${W}-${lang}-keyboard.png` });
await p.setViewportSize({ width: W, height: H });
// the foot of the page is not hidden under the bar
for (let i=0;i<4;i++) { await p.evaluate(()=>scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(500); }
ok(await p.evaluate(()=>{ const last=[...document.querySelectorAll("#end a")].filter(e=>e.offsetParent).pop(); if (!last) return true; const r=last.getBoundingClientRect(), t=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2); return t && (t===last||last.contains(t)); }), `${T} last footer link not covered at the very bottom`);
ok(errs.length===0, `${T} no script errors ${errs.join(" | ")}`);
console.log(`\n${pass} pass, ${fail} fail`); await b.close();
