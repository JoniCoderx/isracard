/* The phone, measured rather than squinted at: do things line up, can a thumb
   hit them, is a button obviously a button, and does any of it sit under the
   system bars. */
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const out = [];
for (const [tag, w, h, lang] of [["320",320,720,"en"],["375",375,812,"en"],["390",390,844,"en"],["430",430,932,"en"],["390he",390,844,"he"]]) {
  const p = await b.newPage({ viewport:{ width:w, height:h }, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  await p.emulateMedia({ reducedMotion:"reduce" });
  await p.goto("http://127.0.0.1:8777/", { waitUntil:"load" });
  await p.waitForTimeout(2600); await p.click("#enterBtn", { timeout:4000 }).catch(() => {});
  if (lang === "he") { await p.evaluate(() => document.getElementById("langBtn").click()); await p.waitForTimeout(900); }
  await p.evaluate(() => { document.querySelectorAll(".rv").forEach(e => e.classList.add("in")); });
  await p.waitForTimeout(600);

  const r = await p.evaluate(() => {
    const vis = e => { const b = e.getBoundingClientRect(); const c = getComputedStyle(e);
      if (e.closest(".modal:not(.open), #menu:not(.open)")) return false;   /* closed overlays are not on screen */
      return b.width > 0 && b.height > 0 && c.visibility !== "hidden" && c.display !== "none" && +c.opacity > 0.05; };
    const rtl = document.documentElement.dir === "rtl";

    /* 1. touch targets */
    const tappable = [...document.querySelectorAll("a[href], button, input, .chip, .lnk, .vp, .vtb")].filter(vis);
    const small = tappable.filter(e => { const b = e.getBoundingClientRect(); return Math.min(b.width, b.height) < 40; })
      .map(e => (e.className || e.tagName) + ":" + (e.textContent || "").trim().slice(0, 18) + " " + Math.round(e.getBoundingClientRect().width) + "x" + Math.round(e.getBoundingClientRect().height));

    /* 2. tap targets too close together */
    const close = [];
    for (let i = 0; i < tappable.length; i++) for (let j = i + 1; j < tappable.length; j++) {
      const a = tappable[i].getBoundingClientRect(), c = tappable[j].getBoundingClientRect();
      if (Math.abs(a.top - c.top) > 400) continue;
      const dx = Math.max(0, Math.max(a.left, c.left) - Math.min(a.right, c.right));
      const dy = Math.max(0, Math.max(a.top, c.top) - Math.min(a.bottom, c.bottom));
      if (dx === 0 && dy > 0 && dy < 8) close.push((tappable[i].textContent||"").trim().slice(0,14) + " / " + (tappable[j].textContent||"").trim().slice(0,14) + " gap " + dy.toFixed(1));
    }

    /* 3. alignment: within each section, how many distinct left edges do the
          text blocks start at? A well set page has one or two, not six. */
    const edges = [];
    document.querySelectorAll("main > section").forEach(s => {
      const items = [...s.querySelectorAll(".k, .h, .h2, .p, .btn, .lnk, .t, .bsl, .fact .t")].filter(vis)
        .filter(e => { const c = getComputedStyle(e); return c.textAlign !== "center" && !e.closest("[style*='text-align:center'], .bhead, .hcap, .wtxt, .mtxt, .ftxt, .certs, .bfoot"); });
      const xs = items.map(e => { const b = e.getBoundingClientRect(); return Math.round(rtl ? b.right : b.left); });
      const uniq = [...new Set(xs)].sort((a, c) => a - c);
      /* cluster within 2px */
      const groups = []; uniq.forEach(x => { const g = groups.find(g => Math.abs(g - x) <= 2); if (g === undefined) groups.push(x); });
      if (groups.length > 2) edges.push(s.id + ": " + groups.length + " edges " + groups.join(","));
    });

    /* 4. anything under the system bars / off the safe area */
    const bad = [...document.querySelectorAll("#silavu *")].filter(vis).filter(e => {
      const b = e.getBoundingClientRect(); const c = getComputedStyle(e);
      return c.position === "fixed" && b.bottom > innerHeight - 2 && b.top < innerHeight;
    }).map(e => e.className + " bottom=" + Math.round(e.getBoundingClientRect().bottom));

    /* 5. type too small to read comfortably on a phone */
    const tiny = [...document.querySelectorAll("#silavu p, #silavu .p, #silavu .d, #silavu .k, #silavu span, #silavu a")].filter(vis)
      .filter(e => { const f = parseFloat(getComputedStyle(e).fontSize); return f > 0 && f < 11.5 && (e.textContent||"").trim().length > 3; })
      .map(e => Math.round(parseFloat(getComputedStyle(e).fontSize)*10)/10 + "px " + (e.className||e.tagName) + ":" + (e.textContent||"").trim().slice(0,20));

    /* 6. buttons: is each one obviously a control? */
    const btns = [...document.querySelectorAll(".btn")].filter(vis).map(e => {
      const c = getComputedStyle(e), b = e.getBoundingClientRect();
      const border = c.borderTopWidth !== "0px" && !/rgba\(.*, ?0\)/.test(c.borderTopColor);
      const filled = !/rgba\(0, 0, 0, 0\)|transparent/.test(c.backgroundColor);
      return { t:(e.textContent||"").trim().slice(0,26), h:Math.round(b.height), w:Math.round(b.width),
               solid:e.classList.contains("solid"), border, filled, fs:Math.round(parseFloat(c.fontSize)*10)/10 };
    });
    const weakBtn = btns.filter(x => !x.border && !x.filled).map(x => x.t);
    const shortBtn = btns.filter(x => x.h < 46).map(x => x.t + " " + x.h + "px");

    return { small: small.slice(0,10), close: close.slice(0,8), edges: edges.slice(0,10), bad: bad.slice(0,5),
             tiny: [...new Set(tiny)].slice(0,8), btnCount: btns.length, weakBtn, shortBtn,
             btnWidths: [...new Set(btns.map(x => x.w))].sort((a,c)=>a-c).slice(0,12) };
  });

  out.push(`\n── ${tag} ──`);
  out.push(`touch targets under 40px: ${r.small.length}` + (r.small.length ? "\n    " + r.small.join("\n    ") : ""));
  out.push(`tappables closer than 8px: ${r.close.length}` + (r.close.length ? "\n    " + r.close.join("\n    ") : ""));
  out.push(`sections with >2 left edges: ${r.edges.length}` + (r.edges.length ? "\n    " + r.edges.join("\n    ") : ""));
  out.push(`type under 11.5px: ${r.tiny.length}` + (r.tiny.length ? "\n    " + r.tiny.join("\n    ") : ""));
  out.push(`buttons: ${r.btnCount}, unstyled: ${r.weakBtn.length ? r.weakBtn.join("|") : "none"}, under 46px tall: ${r.shortBtn.length ? r.shortBtn.join("|") : "none"}`);
  out.push(`button widths: ${r.btnWidths.join(", ")}`);
  await p.close();
}
console.log(out.join("\n"));
await b.close();
