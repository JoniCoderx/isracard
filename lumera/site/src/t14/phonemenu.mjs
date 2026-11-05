// The phone menu for the test14 side pages (about14, collection14): the same sheet as /test14/'s (the house chose
// "C"): a rounded glass panel that drops from the top, the three collections as photographs, the house's six places
// in two columns, the private viewing. Shown only on phones and small tablets; wider screens keep their top links.
// R is the path back to the site root ("../").
export function phoneMenu(R, current) {
  const places = [
    ["collection14/", "Collection"], ["test14/#build", "Design yours"], ["test14/#inside", "The box"],
    ["test14/#details", "Up close"], ["about14/", "About"], ["test14/#concierge", "Enquire"],
  ];
  const card = (href, img, pos, name) => `<a href="${R}${href}"><img src="${R}models/${img}-900.jpg" alt="" loading="lazy" decoding="async" style="object-position:${pos}"><b>${name}</b></a>`;
  const html = `<button class="pm14btn" type="button" aria-expanded="false" aria-controls="pm14" aria-label="Menu"><i aria-hidden="true"></i></button>
<div class="pm14" id="pm14" role="dialog" aria-modal="true" aria-label="Menu" hidden>
  <div class="pm14sheet">
    <div class="pm14top"><button class="pm14x" type="button" aria-label="Close"></button><a class="pm14mk" href="${R}test14/" aria-label="SILAVU, the house"><svg viewBox="0 0 875 1000" aria-hidden="true"><use href="#symb"/></svg><b>SILAVU</b></a><span></span></div>
    <div class="pm14cards">${card("pieces/knot/", "bracelet", "45% 60%", "MOMENT")}${card("pieces/ring/", "ring", "55% 50%", "ICON")}${card("pieces/pave/", "necklace", "50% 55%", "SOUL")}</div>
    <p class="pm14k">The house</p>
    <nav class="pm14grid" aria-label="Main">${places.map(([h, t]) => `<a href="${R}${h}"${h === current ? ' aria-current="page"' : ""}>${t}</a>`).join("")}</nav>
    <a class="pm14cta" href="${R}test14/#concierge">Book a private viewing</a>
    <i class="pm14handle" aria-hidden="true"></i>
  </div>
</div>`;
  const css = `
/* ── phone menu (the test14 sheet) ── */
.pm14btn, .pm14 { display: none; }
@media (max-width: 899px) {
  header .tnav, header .hback { display: none !important; }
  .pm14btn { display: grid; place-items: center; position: fixed; z-index: 31; top: max(16px, env(safe-area-inset-top)); left: 16px; width: 44px; height: 44px; padding: 0; border-radius: 50%; border: 1px solid rgba(214,219,226,.34); background: rgba(255,255,255,.045); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); color: #f4f2ee; cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
  .pm14btn i, .pm14btn i::before, .pm14btn i::after { display: block; width: 16px; height: 1px; background: currentColor; border-radius: 1px; }
  .pm14btn i { position: relative; pointer-events: none; }
  .pm14btn i::before, .pm14btn i::after { content: ""; position: absolute; left: 0; }
  .pm14btn i::before { top: -5px; } .pm14btn i::after { top: 5px; }
  .pm14btn:active { transform: scale(.97); }
  .pm14 { display: block; position: fixed; inset: 0; z-index: 60; padding: max(8px, env(safe-area-inset-top)) 8px 8px; background: rgba(0,0,0,.42); -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); opacity: 0; transition: opacity .22s cubic-bezier(.2,.8,.2,1); overscroll-behavior: contain; }
  .pm14[hidden] { display: none; }
  .pm14.pm14on { opacity: 1; }
  .pm14sheet { max-height: calc(100% - 8px); overflow-y: auto; -webkit-overflow-scrolling: touch; border-radius: 28px; background: rgba(16,16,17,.96); border: 1px solid rgba(255,255,255,.08); box-shadow: 0 30px 80px -20px rgba(0,0,0,.8); padding: 20px 16px 12px; transform: translateY(-14px); transition: transform .26s cubic-bezier(.2,.8,.2,1); }
  .pm14.pm14on .pm14sheet { transform: none; }
  .pm14top { display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; margin-bottom: 18px; }
  .pm14x { position: relative; width: 44px; height: 44px; border-radius: 50%; border: 1px solid rgba(214,219,226,.3); background: none; padding: 0; cursor: pointer; touch-action: manipulation; }
  .pm14x::before, .pm14x::after { content: ""; position: absolute; left: 50%; top: 50%; width: 16px; height: 1px; background: #f4f2ee; }
  .pm14x::before { transform: translate(-50%, -50%) rotate(45deg); } .pm14x::after { transform: translate(-50%, -50%) rotate(-45deg); }
  .pm14mk { justify-self: center; display: grid; justify-items: center; gap: 6px; color: #f4f2ee; text-decoration: none; }
  .pm14mk svg { width: 26px; height: 30px; fill: currentColor; }
  .pm14mk b { font-weight: 400; font-size: .62rem; letter-spacing: .38em; padding-left: .38em; }
  .pm14cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .pm14cards a { position: relative; display: block; aspect-ratio: 3 / 4.2; border-radius: 16px; overflow: hidden; background: #111; }
  .pm14cards img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .pm14cards a::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,.55)); }
  .pm14cards b { position: absolute; z-index: 1; left: 10px; bottom: 10px; font-weight: 400; font-size: .62rem; letter-spacing: .26em; color: #fff; }
  .pm14k { margin: 22px 4px 4px; font-size: .64rem; letter-spacing: .32em; text-transform: uppercase; color: rgba(239,233,221,.55); }
  .pm14grid { display: grid; grid-template-columns: 1fr 1fr; column-gap: 14px; }
  .pm14grid a { position: relative; display: block; padding: 16px 22px 16px 4px; border-bottom: 1px solid rgba(255,255,255,.08); font-size: 1.06rem; font-weight: 300; color: #f3ede2; text-decoration: none; }
  .pm14grid a::after { content: ""; position: absolute; right: 6px; top: 50%; width: 7px; height: 7px; border-top: 1px solid rgba(243,237,226,.55); border-right: 1px solid rgba(243,237,226,.55); transform: translateY(-50%) rotate(45deg); }
  .pm14grid a[aria-current] { color: #d9c79f; }
  .pm14cta { display: flex; align-items: center; justify-content: space-between; margin: 18px 0 10px; height: 54px; padding: 0 24px; border-radius: 999px; background: linear-gradient(180deg, #f6f0e4, #ddd0b6); color: #111; text-decoration: none; font-size: .66rem; letter-spacing: .26em; text-transform: uppercase; }
  .pm14cta::after { content: "→"; font-size: .9rem; letter-spacing: 0; }
  .pm14handle { display: block; width: 40px; height: 3px; margin: 4px auto 0; border-radius: 3px; background: rgba(255,255,255,.18); }
  html.pm14lock, html.pm14lock body { overflow: hidden; }
}
@media (prefers-reduced-motion: reduce) { .pm14, .pm14sheet { transition: none; } }
`;
  const js = `
/* phone menu: open and close with the button, the cross, a touch outside the sheet, Escape, a link, or a swipe up */
(function () {
  var btn = document.querySelector(".pm14btn"), m = document.getElementById("pm14"); if (!btn || !m) return;
  var sheet = m.querySelector(".pm14sheet"), x = m.querySelector(".pm14x"), t = 0;
  function set(open) {
    clearTimeout(t); btn.setAttribute("aria-expanded", open ? "true" : "false");
    document.documentElement.classList.toggle("pm14lock", open);
    if (open) { m.hidden = false; requestAnimationFrame(function () { requestAnimationFrame(function () { m.classList.add("pm14on"); }); }); x.focus({ preventScroll: true }); }
    else { m.classList.remove("pm14on"); t = setTimeout(function () { m.hidden = true; }, 240); }
  }
  btn.addEventListener("click", function () { set(btn.getAttribute("aria-expanded") !== "true"); });
  x.addEventListener("click", function () { set(false); btn.focus({ preventScroll: true }); });
  m.addEventListener("click", function (e) { if (e.target === m) set(false); else if (e.target.closest("a")) set(false); });
  addEventListener("keydown", function (e) { if (e.key === "Escape" && !m.hidden) { set(false); btn.focus({ preventScroll: true }); } });
  var y0 = null;
  sheet.addEventListener("touchstart", function (e) { y0 = sheet.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
  sheet.addEventListener("touchmove", function (e) { if (y0 !== null && e.touches[0].clientY - y0 < -70) { y0 = null; set(false); } }, { passive: true });
  addEventListener("resize", function () { if (innerWidth > 899 && !m.hidden) set(false); });
})();
`;
  return { html, css, js };
}
