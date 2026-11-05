/* Up close · the private archive (test14): the player.
   Everything shown is a path-traced render of the house's own pieces (website/tools/archive-build.py), described by
   archive15/<layout>/manifest.json; nothing is drawn or guessed here, only placed.
   - The scroll alone opens the drawer: the section is pinned and its frames are scrubbed in both directions, never
     played on their own. At the end of the travel the full-resolution still takes over (the same picture).
   - Open, each piece answers the pointer exactly where it is (an id map rendered with the still): a soft pool of light
     and its name on hover; a click (or a tap) lifts that very piece towards the viewer, its own 3x render growing out
     of the place it lay, the drawer dims and the piece's details appear. The suede it lay on is rendered too (the
     plate), so nothing is left behind.
   - The phone has its own render and its own composition, fitted between the header and the bar at the foot.
   - Reduced motion: the drawer is shown open and still, and the details simply fade in. */
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const he = () => document.documentElement.getAttribute("data-lang") === "he";
const bitmap = url => fetch(url).then(r => r.blob()).then(b => createImageBitmap(b));

export async function mount(sec) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pickLayout = () => (innerWidth < 900 || innerHeight > innerWidth * 1.05) ? "m" : "d";
  let L = pickLayout();
  const run = sec.querySelector(".ar15run"), pin = sec.querySelector(".ar15pin"), stage = sec.querySelector(".ar15stage");
  const cv = stage.querySelector(".ar15seq"), g = cv.getContext("2d", { alpha: false }), still = stage.querySelector(".ar15still img"), fx = stage.querySelector(".ar15fx");
  const tag = stage.querySelector(".ar15tag"), dim = stage.querySelector(".ar15dim"), pool = stage.querySelector(".ar15pool");
  const panel = sec.querySelector(".ar15detail"), closeBtn = panel.querySelector(".ar15x"), go = panel.querySelector(".ar15go");
  const picks = [...sec.querySelectorAll(".ar15pick")], cue = sec.querySelector(".ar15cue");
  const text = id => { const b = picks.find(x => x.dataset.id === id); const l = he() ? "he" : "en";
    return b ? { name: b.dataset.name, kind: b.dataset["kind" + l[0].toUpperCase() + l[1]], line: b.dataset["line" + l[0].toUpperCase() + l[1]], href: b.dataset.href } : null; };

  let M, frames = [], ids = null, idW = 0, idH = 0, R = { x: 0, y: 0, w: 1, h: 1, k: 1 };
  async function load() {
    M = await fetch(`archive15/${L}/manifest.json`).then(r => r.json());
    still.src = M.final; still.width = M.res[0]; still.height = M.res[1];
    const idImg = await bitmap(M.ids.src); idW = idImg.width; idH = idImg.height;
    const c = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(idW, idH) : Object.assign(document.createElement("canvas"), { width: idW, height: idH }), g = c.getContext("2d"); g.drawImage(idImg, 0, 0); ids = g.getImageData(0, 0, idW, idH).data;
    const want = reduce ? [] : [...Array(M.seq.n).keys()];
    frames = new Array(M.seq.n);
    /* the first frame, then the rest in order: decoded off the main thread, kept decoded */
    if (want.length) { frames[0] = await bitmap(M.seq.src.replace("%02d", "00")); }
    Promise.all(want.slice(1).map(k => bitmap(M.seq.src.replace("%02d", String(k).padStart(2, "0"))).then(b => { frames[k] = b; dirty = true; tick(); })));
    M.pieces.forEach(p => { new Image().src = p.hero.src; new Image().src = p.patch.src; });
  }

  /* the frame's place: the whole picture, contained, between the header and any bar fixed at the foot */
  function insets() {
    const h = document.getElementById("header"), top = h ? Math.max(0, h.getBoundingClientRect().bottom) : 0;
    let bot = 0;
    for (const el of document.querySelectorAll("#fab, #cbar, body > *")) { const cs = getComputedStyle(el); if (cs.position !== "fixed" || cs.display === "none" || cs.visibility === "hidden") continue;
      const r = el.getBoundingClientRect(); if (r.height && r.bottom >= innerHeight - 2 && r.top > innerHeight * .6) bot = Math.max(bot, innerHeight - r.top); }
    return { top, bot };   // clear of the header: its glass (a backdrop blur) is then never redrawn over the moving frames
  }
  function layout() {
    const b = pin.getBoundingClientRect(), { top, bot } = insets(), W = M.res[0], H = M.res[1];
    const aw = b.width, ah = b.height - top - bot, k = Math.min(aw / W, ah / H);
    R = { w: W * k, h: H * k, k }; R.x = (aw - R.w) / 2; R.y = top + (ah - R.h) / 2;
    Object.assign(stage.style, { left: R.x + "px", top: R.y + "px", width: R.w + "px", height: R.h + "px" });
    sec.style.setProperty("--ar15top", top + "px"); sec.style.setProperty("--ar15bot", bot + "px"); sec.classList.toggle("ar15m", L === "m");
    // the canvas no finer than the frames themselves (the composite scales it up): the fewest pixels to push per frame
    const dpr = Math.min(2, devicePixelRatio || 1), cw = Math.min(R.w * dpr, M.seq.res[0]); cv.width = Math.round(cw); cv.height = Math.round(cw * R.h / R.w); dirty = true;
  }

  /* ── the scroll: 0 closed … 1 open; the last part of the runway holds the drawer open for looking */
  let t = reduce ? 1 : 0, shown = "", dirty = true, raf = 0, open = false;
  /* 24 frames carry a long camera move, so two neighbours laid over each other read as a double image. While the
     scroll moves, the next frame comes in over a short stretch around the midpoint only (it reads as motion); once the
     scroll rests, the drawer settles on the nearer whole frame (snap 0 → 1), so a paused drawer is always one picture. */
  let snap = 1, snapT = 0, snapA = 0;
  const steep = a => { const x = clamp((a - .3) / .4, 0, 1); return x * x * (3 - 2 * x); };
  function settle() { const t0 = performance.now(); cancelAnimationFrame(snapA);
    const step = now => { snap = clamp((now - t0) / 220, 0, 1); snap = 1 - Math.pow(1 - snap, 3); draw(); if (snap < 1) snapA = requestAnimationFrame(step); };
    snapA = requestAnimationFrame(step); }
  function moved() { if (snap !== 0) { cancelAnimationFrame(snapA); snap = 0; } clearTimeout(snapT); snapT = setTimeout(settle, 140); }
  function progress() { const r = run.getBoundingClientRect(), span = r.height - pin.offsetHeight; return span > 0 ? clamp(-r.top / span / .78, 0, 1) : 1; }
  function draw() {
    if (!M) return;
    const n = M.seq.n, f = t * (n - 1), i = Math.floor(f), a0 = f - i;
    const a = steep(a0) * (1 - snap) + (a0 >= .5 ? 1 : 0) * snap, key = i + "|" + a.toFixed(3);
    if (!reduce && (dirty || shown !== key)) {
      // a frame not yet arrived (a fast scroll on a slow connection): the nearest earlier one that has, never a jump to closed
      let A = frames[i]; for (let k = i - 1; !A && k >= 0; k--) A = frames[k];
      const B = frames[i] ? frames[Math.min(n - 1, i + 1)] : null;
      if (A && !(B && a > .999)) { g.globalAlpha = 1; g.drawImage(A, 0, 0, cv.width, cv.height); }
      if (B && a > .001) { g.globalAlpha = a; g.drawImage(B, 0, 0, cv.width, cv.height); g.globalAlpha = 1; }
      shown = key; dirty = false;
    }
    const s = reduce ? 1 : clamp((t - .93) / .07, 0, 1); still.style.opacity = s;
    const isOpen = t > .995; if (isOpen !== open) { open = isOpen; sec.classList.toggle("ar15open", open); if (!open) { hover(null); if (cur) close(true); } }
    if (cue) cue.style.opacity = String(clamp(1 - t * 4, 0, 1));
  }
  function tick() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; if (!reduce) t = progress(); draw(); }); }

  /* ── which piece is under a point of the screen (the id map) */
  function at(cx, cy, touch) {
    const b = stage.getBoundingClientRect(), x = (cx - b.left) / b.width, y = (cy - b.top) / b.height;
    if (!ids || x < 0 || y < 0 || x >= 1 || y >= 1) return null;
    /* the exact point first, then the nearest piece within a few pixels (a fingertip's width on a phone): the chains
       are fine, and a near miss should still find them */
    const px = Math.floor(x * idW), py = Math.floor(y * idH), rad = Math.ceil((touch ? 16 : 7) * idW / b.width);
    const read = (u, v) => (u < 0 || v < 0 || u >= idW || v >= idH) ? 0 : Math.round(ids[(v * idW + u) * 4] / M.ids.step);
    let pid = read(px, py);
    for (let r = 1; !pid && r <= rad; r++) for (let k = -r; k <= r && !pid; k++) pid = read(px + k, py - r) || read(px + k, py + r) || read(px - r, py + k) || read(px + r, py + k);
    if (!pid) return null;
    const pc = M.pieces.find(p => p.pid === pid); if (pc) return pc;
    const pr = M.prints.find(p => p.pid === pid); return pr ? M.pieces.find(p => p.id === pr.piece) : null;
  }
  const toStage = box => ({ x: box[0] * R.k, y: box[1] * R.k, w: (box[2] - box[0]) * R.k, h: (box[3] - box[1]) * R.k });
  let hot = null;
  function hover(p) {
    if (p === hot) return; hot = p; stage.style.cursor = p ? "pointer" : "";
    if (!p) { tag.classList.remove("on"); pool.classList.remove("on"); return; }
    const r = toStage(p.box), x = text(p.id);
    tag.innerHTML = `<b>${x.name}</b><span>${x.kind}</span>`; tag.style.left = (r.x + r.w / 2) + "px"; tag.style.top = r.y + "px"; tag.classList.add("on");
    pool.style.setProperty("--px", (r.x + r.w / 2) + "px"); pool.style.setProperty("--py", (r.y + r.h / 2) + "px"); pool.style.setProperty("--pr", (Math.max(r.w, r.h) * .62 + 24) + "px"); pool.classList.add("on");
  }
  stage.addEventListener("pointermove", e => { if (open && !cur && e.pointerType === "mouse") hover(at(e.clientX, e.clientY)); });
  stage.addEventListener("pointerleave", () => hover(null));
  stage.addEventListener("click", e => { if (!open) return; if (cur) { close(); return; } const p = at(e.clientX, e.clientY, e.pointerType !== "mouse"); if (p) show(p, null); });

  /* ── the detail: the piece comes forward */
  let cur = null, heroEl = null, patchEl = null, anim = 0, back = null;
  function target(p) {
    const pr = toStage(p.hero.rect), ar = pr.w / pr.h, P = pin.getBoundingClientRect(), S = stage.getBoundingClientRect();
    let w, cx, cy;
    if (L === "d") { const maxW = P.width * .52, maxH = P.height * .64; w = Math.min(maxW, maxH * ar); cx = P.width * (he() ? .66 : .34); cy = P.height * .5; }
    else { const maxW = P.width * .9, maxH = P.height * .44; w = Math.min(maxW, maxH * ar); cx = P.width * .5; cy = P.height * .36; }
    const h = w / ar; return { x: cx - w / 2 - (S.left - P.left), y: cy - h / 2 - (S.top - P.top), w, h };
  }
  function place(el, r) { el.style.transform = `translate(${r.x}px, ${r.y}px)`; el.style.width = r.w + "px"; el.style.height = r.h + "px"; }
  function fly(from, to, dur, done) {
    cancelAnimationFrame(anim); const t0 = performance.now();
    const step = now => { const k = reduce ? 1 : ease(clamp((now - t0) / dur, 0, 1)), lift = Math.sin(k * Math.PI) * -10;
      const r = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k + lift, w: from.w + (to.w - from.w) * k, h: from.h + (to.h - from.h) * k };
      const bw = parseFloat(heroEl.style.width), bh = parseFloat(heroEl.style.height);
      heroEl.style.transform = `translate(${r.x}px, ${r.y}px) scale(${r.w / bw}, ${r.h / bh})`;
      if (k < 1) anim = requestAnimationFrame(step); else done && done(); };
    anim = requestAnimationFrame(step);
  }
  function show(p, opener) {
    if (cur) return; cur = p; back = opener || document.activeElement; hover(null);
    patchEl = new Image(); patchEl.className = "ar15patch"; patchEl.alt = ""; patchEl.src = p.patch.src; place(patchEl, toStage(p.patch.rect)); stage.insertBefore(patchEl, pool);
    heroEl = new Image(); heroEl.className = "ar15hero"; heroEl.alt = ""; heroEl.src = p.hero.src;
    const from = toStage(p.hero.rect); heroEl.style.width = from.w + "px"; heroEl.style.height = from.h + "px"; heroEl.style.transformOrigin = "0 0";
    heroEl.style.transform = `translate(${from.x}px, ${from.y}px)`; fx.appendChild(heroEl);
    const x = text(p.id); panel.querySelector(".ar15dk").textContent = x.kind; panel.querySelector(".ar15dn").textContent = x.name;
    panel.querySelector(".ar15dl").textContent = x.line; go.href = x.href;
    // the room darkens most just behind where the piece will hang, so nothing left in the drawer reads through it
    const to = target(p); dim.style.setProperty("--hx", (to.x + to.w / 2) + "px"); dim.style.setProperty("--hy", (to.y + to.h / 2) + "px");
    dim.style.setProperty("--hr", (Math.max(to.w, to.h) * .62) + "px");
    sec.classList.add("ar15sel"); dim.classList.add("on"); panel.hidden = false;
    const startFly = () => { patchEl.classList.add("on"); heroEl.classList.add("on"); fly(from, to, 720, () => { panel.classList.add("on"); closeBtn.focus({ preventScroll: true }); }); };
    (heroEl.decode ? heroEl.decode() : Promise.resolve()).then(startFly, startFly);
  }
  function close(now) {
    if (!cur) return; const p = cur, h = heroEl, pa = patchEl; cur = null; panel.classList.remove("on"); dim.classList.remove("on"); sec.classList.remove("ar15sel");
    const end = () => { h && h.remove(); pa && pa.remove(); panel.hidden = true; if (back && back.focus) back.focus({ preventScroll: true }); };
    if (now || reduce || !h) { cancelAnimationFrame(anim); end(); return; }
    const from = toStage(p.hero.rect), cs = h.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\) scale\(([-\d.]+), ([-\d.]+)\)/);
    const at0 = cs ? { x: +cs[1], y: +cs[2], w: from.w * +cs[3], h: from.h * +cs[4] } : target(p);
    heroEl = h; fly(at0, from, 560, () => { pa.classList.remove("on"); setTimeout(end, 180); });
  }
  closeBtn.addEventListener("click", () => close());
  dim.addEventListener("click", () => close());
  addEventListener("keydown", e => { if (e.key === "Escape" && cur) close(); });
  picks.forEach(b => b.addEventListener("click", () => {
    const p = M && M.pieces.find(x => x.id === b.dataset.id); if (!p) return;
    if (!open) { const r = run.getBoundingClientRect(), span = r.height - pin.offsetHeight; scrollTo({ top: scrollY + r.top + span * .8, behavior: "instant" }); t = 1; draw(); }
    show(p, b); }));
  let y0 = scrollY; addEventListener("scroll", () => { if (cur && Math.abs(scrollY - y0) > 60) close(); if (!cur) y0 = scrollY; moved(); tick(); }, { passive: true });
  addEventListener("resize", () => { const l = pickLayout(); if (l !== L) { L = l; close(true); load().then(() => { layout(); tick(); }); } else { layout(); if (cur) { close(true); } tick(); } });
  new MutationObserver(() => { if (hot) { const h = hot; hot = null; hover(h); } }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang"] });

  await load(); layout(); sec.classList.add("ar15live"); if (reduce) sec.classList.add("ar15still-only"); t = reduce ? 1 : progress(); dirty = true; draw();
  return { get t() { return t; } };
}
