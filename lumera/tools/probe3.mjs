import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{ width:390, height:844 }, deviceScaleFactor:2, isMobile:true, hasTouch:true });
await p.emulateMedia({ reducedMotion:"reduce" });
await p.goto("http://127.0.0.1:8777/", { waitUntil:"load" });
await p.waitForTimeout(2600); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
await p.evaluate(() => document.querySelectorAll(".rv").forEach(e => e.classList.add("in")));
await p.waitForTimeout(600);
console.log(await p.evaluate(() => {
  const o = [];
  const cert = document.querySelector(".cert");
  o.push("cert: " + JSON.stringify(cert.getBoundingClientRect().toJSON()).slice(0,60) + " display=" + getComputedStyle(cert).display + " minH=" + getComputedStyle(cert).minHeight);
  const lnk = document.querySelector(".card .lnk");
  o.push("lnk: h=" + Math.round(lnk.getBoundingClientRect().height) + " padT=" + getComputedStyle(lnk).paddingTop + " padB=" + getComputedStyle(lnk).paddingBottom);
  /* what is at x=39 */
  const at39 = [...document.querySelectorAll("#what *, #collection *")].filter(e => {
    const r = e.getBoundingClientRect(); const c = getComputedStyle(e);
    return r.width>0 && r.height>0 && c.display!=="none" && Math.round(r.left)===39;
  }).slice(0,6).map(e => ((e.className||e.tagName)+"").split(" ").slice(0,2).join(".") + "«" + (e.textContent||"").trim().slice(0,20) + "»");
  o.push("elements starting at x=39: " + (at39.join("  ") || "none"));
  /* visible button widths, and which container */
  const vis = e => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e);
    if (e.closest(".modal:not(.open), #menu:not(.open)")) return false;
    return r.width>0 && r.height>0 && c.visibility!=="hidden" && c.display!=="none" && +c.opacity>0.05; };
  o.push("visible buttons:");
  [...document.querySelectorAll(".btn")].filter(vis).forEach(e => {
    const par = e.parentElement;
    o.push("   " + Math.round(e.getBoundingClientRect().width).toString().padStart(4) + "px  in ." + ((par.className||par.tagName)+"").split(" ")[0] + "  display=" + getComputedStyle(par).display + "  «" + e.textContent.trim().slice(0,26) + "»");
  });
  /* chip label sizes */
  const sp = document.querySelector(".opts .chip span");
  if (sp) o.push("chip span font-size=" + getComputedStyle(sp).fontSize + "  chip=" + getComputedStyle(sp.closest(".chip")).fontSize);
  /* what is the 'Close' still near the header */
  const closes = [...document.querySelectorAll(".btn")].filter(e => /Close|סגירה/.test(e.textContent)).map(e => {
    const r = e.getBoundingClientRect();
    return ((e.className||"")+"").split(" ").slice(0,2).join(".") + " in #" + (e.closest("[id]")||{id:"?"}).id + " visSkip=" + !!e.closest(".modal:not(.open), #menu:not(.open)") + " top=" + Math.round(r.top);
  });
  o.push("Close buttons: " + closes.join(" | "));
  return o.join("\n");
}));
await b.close();
