import { chromium } from "playwright-core";
const OUT="/tmp/claude-0/-home-user-isracard/cbce1d7f-fb80-59fc-b523-1be1a454b815/scratchpad/";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--disable-background-networking","--disable-component-update"] });
let pass=0, fail=0; const ok=(c,m)=>{ c?pass++:fail++; console.log((c?"PASS ":"FAIL ")+m); };
for (const lang of ["en","he","fr","ru","ar"]) {
  const ctx = await b.newContext({ viewport:{width:390,height:844} });
  await ctx.addInitScript(l => { localStorage.setItem("silavu-lang", l); }, lang);
  const p = await ctx.newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/, r=>r.abort()); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  for (const s of ["privacy","terms","warranty","care","authenticity","delivery"]) {
    await p.goto("http://127.0.0.1:8777/"+s+"/", { waitUntil:"load" }); await p.waitForTimeout(500);
    const r = await p.evaluate(()=>{ const all=[...document.querySelectorAll("main [data-en]")]; const en=all.filter(e=>e.textContent.trim()===e.getAttribute("data-en").trim()).length; return { dir: document.documentElement.dir||"ltr", lang: document.documentElement.lang, en, n: all.length, bracket: /\[[^\]]+\]/.test(document.querySelector("main").innerText), h1: document.querySelector("h1").textContent, back: document.querySelector("a.dhome").href, hs: document.documentElement.scrollWidth - innerWidth }; });
    const expectDir = "ltr";
    ok(r.lang===lang && r.dir===expectDir && (lang==="en" ? true : r.en===0) && !r.bracket && r.hs<=0, `${lang} ${s}: lang=${r.lang} dir=${r.dir} untranslated=${r.en}/${r.n} placeholders=${r.bracket} "${r.h1}"`);
    if (s==="terms" && (lang==="he"||lang==="en")) await p.screenshot({ path: OUT+`doc-${lang}-terms.png`, fullPage:true });
  }
  ok(errs.length===0, `${lang} no errors`);
  await ctx.close();
}
console.log(`\n${pass} pass, ${fail} fail`); await b.close();
