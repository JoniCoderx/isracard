import { chromium } from "playwright-core";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
for (const lang of ["fr","ru","ar","he"]) for (const path of ["","about/","terms/"]) {
  const c=await b.newContext({viewport:{width:1366,height:900}}); await c.addInitScript(l=>{try{localStorage.setItem("silavu-lang",l)}catch(e){}},lang);
  const p=await c.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("http://localhost:8777/"+path,{waitUntil:"load"}); await p.waitForTimeout(1800);
  const r=await p.evaluate(()=>{ const all=[...document.querySelectorAll("[data-en]")].filter(e=>!e.closest("svg,script,title,#intro")); const same=all.filter(e=>{const t=e.textContent.trim(), en=(e.getAttribute("data-en")||"").replace(/<[^>]+>/g,"").trim(); return t && t===en && /[a-z]{4}/.test(en) && !/^(SILAVU|MOMENT|ICON|SOUL|The Line|The Line of Desire|GIA|IGI|AED|USD|EUR)$/.test(en);}); return {dir:document.documentElement.dir, n:all.length, en:same.map(e=>e.getAttribute("data-en").slice(0,50))}; });
  console.log(lang, path||"home", "dir", r.dir, "strings", r.n, "still English:", r.en.length, r.en.slice(0,6).join(" | "), errs.length?"ERR "+errs[0]:"");
  await c.close();
}
await b.close();
