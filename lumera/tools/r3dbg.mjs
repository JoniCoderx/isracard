import { chromium } from "playwright-core";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox","--disable-background-networking","--disable-component-update"]});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
await p.goto("http://localhost:8777/",{waitUntil:"load"}); await p.waitForTimeout(1200);
await p.evaluate(()=>{const e=document.getElementById("jpin"); scrollTo(0,e.getBoundingClientRect().top+scrollY+(e.offsetHeight-innerHeight)*0.45);}); await p.waitForTimeout(1500);
console.log(await p.evaluate(()=>{
  const r=e=>{const b=e.getBoundingClientRect(), c=getComputedStyle(e); return `${e.tagName}.${[...e.classList].join(".")} ${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.width)}x${Math.round(b.height)} op${c.opacity} vis${c.visibility} disp${c.display} pad${c.paddingLeft} filt${c.filter} clip${c.clipPath}`;};
  const sh=document.querySelector(".jshot.on"); const o=[r(document.getElementById("jrn")), r(document.querySelector(".jstage")), r(sh), r(sh.querySelector(".jim")), r(sh.querySelector("picture")||sh), r(sh.querySelector("img"))];
  document.querySelectorAll(".jstep").forEach(s=>o.push(r(s)));
  o.push(r(document.querySelector(".jsteps")), r(document.querySelector(".jside")));
  return o.join("\n");
}));
await b.close();
