import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport:{ width:390, height:844 } });
const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.emulateMedia({ reducedMotion:"reduce" });
await p.goto("http://127.0.0.1:8777/", { waitUntil:"load" });
await p.waitForTimeout(2600); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
await p.waitForTimeout(800);
await p.evaluate(() => window.scrollTo({top: scrollY + document.getElementById("collection").getBoundingClientRect().top, behavior:"instant"}));
await p.waitForTimeout(400);
console.log(await p.evaluate(() => {
  const pc = document.getElementById("p-mneck");
  return "piece exists=" + !!pc + "  has .k=" + !!pc.querySelector(".k") + "  has .t=" + !!pc.querySelector(".t") + "  has .p=" + !!pc.querySelector(".p") + "  has .meta=" + !!pc.querySelector(".meta") + "  has img=" + !!pc.querySelector("img");
}));
await p.evaluate(() => document.getElementById("p-mneck").click());
await p.waitForTimeout(700);
console.log(await p.evaluate(() => {
  const m = document.getElementById("pmodal");
  return "modal open=" + m.classList.contains("open") + "  pmT=" + (document.getElementById("pmT") ? JSON.stringify(document.getElementById("pmT").textContent) : "NULL") + "  specs=" + document.querySelectorAll("#pmSpecs .dc").length;
}));
console.log("page errors:", errs.length, errs.slice(0,2).join(" | "));
await b.close();
