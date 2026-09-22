import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const out = [];
for (const [tag, vp] of [["desk",{width:1440,height:900}],["mob",{width:390,height:844}]]) {
  const p = await b.newPage({ viewport: vp }); await p.emulateMedia({ reducedMotion: "reduce" }); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file:///home/user/isracard/lumera/site/silavu-page.html", { waitUntil:"load" }); await p.waitForTimeout(1200);
  await p.waitForTimeout(2600); await p.click("#enterBtn", { timeout: 4000 }).catch(() => {}); await p.waitForTimeout(800); await p.mouse.move(2,2);
  const y = () => p.evaluate(() => scrollY), top = id => p.evaluate(id => scrollY + document.getElementById(id).getBoundingClientRect().top, id);
  const go = async (sel) => { await p.evaluate(s => document.querySelector(s).click(), sel); await p.waitForTimeout(1400); await p.evaluate(() => window.scrollTo({top: scrollY, behavior:"instant"})); };
  for (const [sel,id] of [['#topnav a[href="#collection"]',"collection"],['.hbook',"concierge"],['.hacts a[href="#bespoke"]',"bespoke"],['#end a[href="#build"]',"build"]]) {
    const vis = await p.evaluate(s => { const el=document.querySelector(s); return !!el && getComputedStyle(el).display!=="none" && el.getClientRects().length>0; }, sel);
    if (!vis) { out.push(`skip ${tag} ${sel}`); continue; }
    await go(sel); const d = Math.abs(await y() - await top(id));
    out.push((d < 4 ? "PASS" : "FAIL") + ` ${tag} link ${sel} (off ${Math.round(d)})`);
  }
  // menu (mobile)
  const menuVis = await p.evaluate(() => getComputedStyle(document.getElementById("menuBtn")).display !== "none");
  if (menuVis) { await p.click("#menuBtn"); await p.waitForTimeout(600);
    out.push((await p.evaluate(() => document.getElementById("menu").classList.contains("open")) ? "PASS":"FAIL") + ` ${tag} menu opens`);
    await p.evaluate(() => document.querySelector('#mlist a[href="#build"]').click()); await p.waitForTimeout(1500);
    out.push((await p.evaluate(() => !document.getElementById("menu").classList.contains("open")) && Math.abs(await y() - await top("build")) < 4 ? "PASS":"FAIL") + ` ${tag} menu link closes + lands`);
    await p.waitForTimeout(700);
    out.push((await p.evaluate(() => { const f = document.getElementById("fab"); if (f.classList.contains("show")) return true; const r = f.getBoundingClientRect(); const hasText = (el) => { for (let c = el.firstChild; c; c = c.nextSibling) if (c.nodeType === 3 && c.nodeValue.trim()) return true; return false; }; return [r.left + 5, r.left + r.width / 2, r.right - 5].some(x => [r.top + 4, r.top + r.height / 2, r.bottom - 4].some(yy => { const els = document.elementsFromPoint(x, yy).filter(e => e !== f && !f.contains(e)); return els.length > 0 && (/^(P|H1|H2|H3|H4|LI|A|BUTTON|INPUT|TEXTAREA|SELECT|LABEL|SPAN|SMALL|EM|STRONG|BLOCKQUOTE|FIGCAPTION|TD|TH|SVG|DT|DD|IMG|CANVAS|VIDEO)$/.test(els[0].tagName) || hasText(els[0]) || !!els[0].closest(".btn, .chip, .modal, form")); })); }) ? "PASS":"FAIL") + ` ${tag} floating book button shown or stepped aside for content`);
  } else out.push(`skip ${tag} menu`);
  // compass
  await p.evaluate(() => window.scrollTo({top: scrollY + document.getElementById("bespoke").getBoundingClientRect().top, behavior:"instant"})); for (let i = 0; i < 30 && !/bespoke|בהזמנה אישית/i.test(await p.evaluate(() => document.getElementById("whereT").textContent)); i++) await p.waitForTimeout(250);
  out.push((await p.evaluate(() => document.getElementById("whereT").textContent === "Bespoke" && document.getElementById("whereN").textContent === "03") ? "PASS":"FAIL") + ` ${tag} compass says where you are (${await p.evaluate(() => document.getElementById("whereN").textContent + " " + document.getElementById("whereT").textContent)})`);
  // inside: a chapter with a film that loads when near
  await p.evaluate(() => { const pin = document.getElementById("stonepin"); window.scrollTo({top: scrollY + pin.getBoundingClientRect().top + (pin.offsetHeight - innerHeight) * 0.4, behavior:"instant"}); });
  for (let i = 0; i < 60 && !(await p.evaluate(() => window.__stone && window.__stone.ok && window.__stone.p > 0.3 && window.__stone.p < 0.62 && document.getElementById("whereN").textContent === "01" && +document.querySelectorAll("#beats .beat")[1].style.opacity > 0.5)); i++) await p.waitForTimeout(100);
  out.push(((await p.evaluate(() => window.__stone.ok && window.__stone.p > 0.3 && window.__stone.p < 0.62 && document.getElementById("whereN").textContent === "01" && +document.querySelectorAll("#beats .beat")[1].style.opacity > 0.5)) ? "PASS":"FAIL") + ` ${tag} box film scrubs with scroll (p=${await p.evaluate(() => window.__stone.p.toFixed(2) + " ok=" + window.__stone.ok + " n=" + document.getElementById("whereN").textContent + " b1=" + document.querySelectorAll("#beats .beat")[1].style.opacity + " y=" + scrollY + " body=" + document.body.className)})`);
  out.push(((await p.evaluate(() => window.__box.requested > 0 && document.getElementById("boxcv").width > 0)) ? "PASS":"FAIL") + ` ${tag} box film frames requested (${await p.evaluate(() => window.__box.requested)})`);
  await p.evaluate(() => { const w = document.getElementById("wpin"); window.scrollTo({top: scrollY + w.getBoundingClientRect().top + (w.offsetHeight - innerHeight) * 0.85, behavior:"instant"}); }); await p.waitForTimeout(500);
  out.push(((await p.evaluate(() => { const t = document.getElementById("wtxt"); const f = document.getElementById("wframe"); return getComputedStyle(t).opacity !== "0" && f.getBoundingClientRect().height > innerHeight * 0.9; })) ? "PASS":"FAIL") + ` ${tag} wrist chapter revealed`);
  // stone picker
  // piece → concierge prefilled
  await p.evaluate(() => document.querySelector('a[data-piece="The Knot"]').click()); await p.waitForTimeout(1500);
  out.push((/Knot/.test(await p.inputValue("#fMsg")) ? "PASS":"FAIL") + ` ${tag} piece prefills`);
  await p.click('.chip[data-k="metal"][data-v="yellow"]'); await p.click('.chip[data-k="ct"][data-v="10"]');
  out.push(((await p.textContent("#sumMetal"))==="18K yellow gold" && await p.evaluate(() => { const t = document.getElementById("sumStones").textContent, m = t.match(/^(\d+) × (\d\.\d\d) ct · Round brilliant$/); return !!m && Math.abs(m[1] * m[2] - 10) < 0.6 && +m[1] >= 30 && +m[1] <= 60; }) ? "PASS":"FAIL") + ` ${tag} builder (${await p.textContent("#sumStones")})`);
  await p.evaluate(() => document.getElementById("reserve").click()); await p.waitForTimeout(1200);
  out.push((/10 ct/.test(await p.inputValue("#fMsg")) ? "PASS":"FAIL") + ` ${tag} reserve prefills`);
  await p.fill("#fName",""); await p.fill("#fContact",""); await p.evaluate(() => document.querySelector("#cform .btn").click()); await p.waitForTimeout(200);
  out.push((await p.evaluate(() => document.querySelector("#fName").parentElement.classList.contains("err")) ? "PASS":"FAIL") + ` ${tag} validation`);
  await p.fill("#fName","T"); await p.fill("#fContact","x@y.z"); await p.click('.chip[data-ch="Email"]'); await p.evaluate(() => document.querySelector("#cform .btn").click()); await p.waitForTimeout(300);
  out.push((await p.evaluate(() => document.getElementById("cform").classList.contains("sent")) ? "PASS":"FAIL") + ` ${tag} submit`);
  out.push((await p.evaluate(() => document.querySelectorAll("[data-socials] a").length === 12 && !document.querySelector('[data-socials] a[href*="wa.me"]')) ? "PASS":"FAIL") + ` ${tag} socials rendered`);
  /* the control opens a five-language menu now rather than toggling */
  await p.click("#langBtn"); await p.waitForTimeout(250);
  await p.evaluate(() => document.querySelector('#langmenu [data-lang="he"]').click()); await p.waitForTimeout(500);
  out.push((await p.evaluate(() => document.documentElement.dir==="rtl" && document.getElementById("sumMetal").textContent==="זהב צהוב 18K" && document.getElementById("whereT").textContent.length > 0 && !/[A-Za-z]/.test(document.getElementById("whereT").textContent)) ? "PASS":"FAIL") + ` ${tag} hebrew`);
  out.push((await p.evaluate(() => /^\d\d:\d\d$/.test(document.getElementById("clkDXB").textContent)) ? "PASS":"FAIL") + ` ${tag} clocks`);
  out.push((await p.evaluate(() => document.body.scrollHeight / innerHeight < (innerWidth < 1000 ? 28 : 28)) ? "PASS":"FAIL") + ` ${tag} page length ${await p.evaluate(() => (document.body.scrollHeight / innerHeight).toFixed(1))} screens`);
  // the piece window, the chain, the try-on, the carat numbers
  await p.evaluate(() => window.scrollTo({top: scrollY + document.getElementById("collection").getBoundingClientRect().top, behavior:"instant"})); await p.waitForTimeout(300);
  await p.evaluate(() => document.getElementById("p-knot").click()); await p.waitForTimeout(500);
  out.push((await p.evaluate(() => document.getElementById("pmodal").classList.contains("open") && /Knot|הקשר/.test(document.getElementById("pmT").textContent) && document.querySelectorAll("#pmSpecs .srow").length === 11) ? "PASS":"FAIL") + ` ${tag} piece window opens`);
  await p.evaluate(() => document.getElementById("pmReq").click()); await p.waitForTimeout(600);
  out.push((await p.evaluate(() => !document.getElementById("pmodal").classList.contains("open") && /Knot|הקשר/.test(document.getElementById("fMsg").value)) ? "PASS":"FAIL") + ` ${tag} piece window → request`);
  await p.evaluate(() => window.scrollTo({top: scrollY + document.getElementById("stripwrap").getBoundingClientRect().top - 60, behavior:"instant"})); await p.waitForTimeout(1200);
  out.push(((await p.evaluate(() => { const c = document.getElementById("bcv"); return c.width > 100 && c.height > 100 && typeof window.__bracelet === "object"; })) ? "PASS":"FAIL") + ` ${tag} the bracelet is built`);
  {
    const bb = await (await p.$("#bcv")).boundingBox();
    if (bb && bb.y > -bb.height) {
      const before = await p.screenshot({ clip: { x: Math.max(0, bb.x), y: Math.max(0, bb.y), width: Math.min(300, bb.width), height: Math.min(200, bb.height) } });
      await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down();
      for (let i = 1; i <= 6; i++) { await p.mouse.move(bb.x + bb.width / 2 - i * 16, bb.y + bb.height / 2); await p.waitForTimeout(30); }
      await p.mouse.up(); await p.waitForTimeout(700);
      const after = await p.screenshot({ clip: { x: Math.max(0, bb.x), y: Math.max(0, bb.y), width: Math.min(300, bb.width), height: Math.min(200, bb.height) } });
      out.push(((!before.equals(after)) ? "PASS":"FAIL") + ` ${tag} the bracelet turns under the hand`);
    } else out.push(`skip ${tag} bracelet drag`);
  }
  await p.evaluate(() => document.querySelector('[data-vpos="under"]').click()); await p.waitForTimeout(600);
  out.push(((await p.evaluate(() => document.querySelector('[data-vpos="under"]').classList.contains("on"))) ? "PASS":"FAIL") + ` ${tag} the underside`);
  await p.evaluate(() => document.querySelector('[data-vpos="front"]').click()); await p.waitForTimeout(400);
  await p.evaluate(() => window.scrollTo({top: scrollY + document.getElementById("collection").getBoundingClientRect().top, behavior:"instant"})); await p.waitForTimeout(300);
  await p.evaluate(() => document.getElementById("tryonBtn2").click()); await p.waitForTimeout(400);
  out.push(((await p.evaluate(() => document.getElementById("tryon").classList.contains("open") && document.getElementById("tcanvas").width > 0)) ? "PASS":"FAIL") + ` ${tag} try-on opens`);
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  await p.evaluate(() => document.getElementById("tryonBtn").click()); await p.waitForTimeout(1200);
  out.push(((await p.evaluate(() => document.getElementById("stripwrap").classList.contains("wrist"))) ? "PASS":"FAIL") + ` ${tag} wrist view opens from the copy`);
  await p.evaluate(() => document.querySelector('.vtb[data-view="line"]').click()); await p.waitForTimeout(200);
  for (const c of ["marquise", "baguette", "emerald"]) { await p.click('.chip[data-k="cut"][data-v="' + c + '"]'); await p.waitForTimeout(150); out.push(((await p.evaluate((c) => window.__lineSpec && window.__lineSpec.cut === c && window.__lineSpec.n >= 8 && new RegExp("^\\d+ × \\d\\.\\d\\d ct · ").test(document.getElementById("sumStones").textContent), c)) ? "PASS":"FAIL") + ` ${tag} cut ${c} (${await p.textContent("#sumStones")})`); }
  await p.click('.chip[data-k="cut"][data-v="round"]'); await p.waitForTimeout(150);
  await p.click('.chip[data-k="ct"][data-v="20"]');
  out.push((await p.evaluate(() => { const ct = parseFloat(document.getElementById("eachCt").textContent), mm = parseFloat(document.getElementById("eachMm").textContent); return ct > 0.4 && ct < 0.9 && Math.abs(mm - 6.5 * Math.cbrt(ct)) < 0.15; }) ? "PASS":"FAIL") + ` ${tag} carat explained (${await p.evaluate(() => document.getElementById("eachCt").textContent + " / " + document.getElementById("eachMm").textContent)})`);
  out.push((await p.evaluate(() => document.getElementById("dust").width > 0 && document.getElementById("pbar").style.width !== "") ? "PASS":"FAIL") + ` ${tag} dust + progress alive`);
  out.push(((await p.evaluate(() => document.querySelectorAll(".h.sp .w").length > 2 && document.querySelectorAll("#hero .late.in").length >= 4)) ? "PASS":"FAIL") + ` ${tag} hero words split + revealed after enter`);
  out.push(((await p.evaluate(() => { const m = document.querySelector(".sh .mark").getBoundingClientRect(); return Math.abs((m.left + m.right) / 2 - innerWidth / 2) < 3 && m.height >= 15; })) ? "PASS":"FAIL") + ` ${tag} mark centred`);
  out.push(((await p.evaluate(() => document.querySelectorAll(".band").length === 0)) ? "PASS":"FAIL") + ` ${tag} no marquee, no twinkles`);
  out.push(((await p.evaluate(() => { const f = document.querySelector("#build .ed > .fig"); const r = f.getBoundingClientRect(); return r.width <= 600.5 && r.width > 200 && Math.abs(r.height - r.width * 1.25) < 2; })) ? "PASS":"FAIL") + ` ${tag} editorial figure contained 4:5`);
  if (vp.width >= 1000) {
    await p.evaluate(() => window.scrollTo({top: scrollY + document.getElementById("collection").getBoundingClientRect().top, behavior:"instant"})); await p.waitForTimeout(400);
    out.push(((await p.evaluate(() => {
      const g = document.querySelector("#collection .pgrid");
      const cols = getComputedStyle(g).gridTemplateColumns.split(" ").length;
      const ps = [...document.querySelectorAll("#collection .piece")];
      const tops = new Set(ps.map(x => Math.round(x.getBoundingClientRect().top)));
      return ps.length === 6 && cols === 4 && tops.size === 2;
    })) ? "PASS":"FAIL") + ` ${tag} collection is a four-up grid (${await p.evaluate(() => document.querySelectorAll("#collection .piece").length + " cols=" + getComputedStyle(document.querySelector("#collection .pgrid")).gridTemplateColumns)})`);
  }
  await p.click('.chip[data-k="wrist"][data-v="19"]'); out.push(((await p.textContent("#sumWrist")) === "19 cm" && /19/.test(await p.textContent("#lineLen")) ? "PASS":"FAIL") + ` ${tag} wrist size`);
  out.push(((await p.evaluate(() => (document.querySelector(".sh .mark .lg") || {}).textContent === "SILAVU" && document.querySelectorAll(".sh .mark svg.sy use[href=\"#symb\"]").length === 1 && document.querySelectorAll("svg.symdefs symbol#symb path").length === 1 && (function () { var k = document.querySelector("#intro .imk"); if (!k) return false; var mk = k.style.getPropertyValue("--mk") || ""; var hdr = document.querySelector("svg.symdefs symbol#symb path"); if (!hdr || !mk) return false; var d = encodeURIComponent(document.querySelector("#end svg.sy.huge path").getAttribute("d")); return mk.length > 20000 && mk.indexOf(d.slice(0, 400)) > 0 && k.querySelectorAll("i").length >= 4; })() && document.querySelectorAll("#end svg.sy.huge").length === 1)) ? "PASS":"FAIL") + ` ${tag} symbol, lockup, intro trace, footer symbol`);
  out.push(((await p.evaluate(() => { const b = document.querySelector(".hacts .btn.solid"); const c = getComputedStyle(b).color.match(/\d+/g).map(Number); return c[0] < 40 && c[1] < 40; })) ? "PASS":"FAIL") + ` ${tag} solid button has dark text`);
  await p.evaluate(() => window.__money.set("USD")); out.push(((await p.evaluate(() => /US\$/.test(document.getElementById("est").textContent) && /Price on request|מחיר לפי בקשה/.test(document.querySelector("#p-knot .price").textContent) && document.querySelectorAll("[data-cur] .chip.on").length >= 1)) ? "PASS":"FAIL") + ` ${tag} currency switch (${await p.evaluate(() => document.getElementById("est").textContent)})`);
  await p.evaluate(() => window.__money.set("AED"));
  /* the collection is a filtered grid now, not a swipe tray */
  await p.evaluate(() => document.querySelector('.cats .cat[data-cat="bracelets"]').click()); await p.waitForTimeout(400);
  out.push(((await p.evaluate(() => {
    const shown = [...document.querySelectorAll("#collection .piece")].filter(c => !c.hidden);
    return shown.length === 1 && shown[0].id === "p-knot";
  })) ? "PASS":"FAIL") + ` ${tag} category filters the grid`);
  await p.evaluate(() => document.querySelector('.cats .cat[data-cat="all"]').click()); await p.waitForTimeout(300);
  out.push(((await p.evaluate(() => [...document.querySelectorAll("#collection .piece")].filter(c => !c.hidden).length === 6)) ? "PASS":"FAIL") + ` ${tag} all shows every piece`);
  out.push(((await p.evaluate(() => ["hero","house","inside","craft","collection","bespoke","macro","build","wrist","film","concierge","end"].join() === [...document.querySelectorAll("main > section")].map(s => s.id).join())) ? "PASS":"FAIL") + ` ${tag} journey order`);
  out.push(((await p.evaluate(() => { const im = document.querySelector("#hero img"); return /hero(v)?-\d+\.jpg/.test(im.currentSrc || im.src) && im.getAttribute("srcset").split(",").length >= 2; })) ? "PASS":"FAIL") + ` ${tag} hero served from srcset (${await p.evaluate(() => (document.querySelector("#hero img").currentSrc || "").split("/").pop())})`);
  out.push((errs.length===0 ? "PASS":"FAIL") + ` ${tag} no errors ${errs.join(" | ")}`);
  await p.close();
}
await b.close(); console.log(out.join("\n")); process.exit(out.some(l => l.startsWith("FAIL")) ? 1 : 0);
