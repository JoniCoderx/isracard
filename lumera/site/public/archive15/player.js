/* Up close · the private archive (test14): the player.
   Everything shown is a path-traced render of the house's own pieces (website/tools/archive-build.py), described by
   archive15/<layout>/manifest.json; nothing is drawn or guessed here, only placed.
   - The scroll alone opens the drawer: the section is pinned and its frames are scrubbed in both directions, never
     played on their own. At the end of the travel the full-resolution still takes over (the same picture).
   - The frames are handled as the box sequence's are: the drawer eases towards the scroll's place (it glides, never
     jumps), each frame's file is fetched once (compressed, a few MB in all), and only the frames near the drawer's place
     are held decoded (off the main thread, at their own size: resizing as they decode was measured slower); the rest
     are released.
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
  // phone (m) for narrow or upright phones, tablet (t: the phone's picture with room around it) for upright screens
  // 600px and wider, desktop (d) for anything held landscape
  const pickLayout = () => innerWidth < 600 ? "m" : innerHeight > innerWidth * 1.05 ? "t" : "d";   // a phone held sideways is landscape: the desktop composition
  let L = pickLayout();
  const run = sec.querySelector(".ar15run"), pin = sec.querySelector(".ar15pin"), stage = sec.querySelector(".ar15stage");
  const cv = stage.querySelector(".ar15seq"), g = cv.getContext("2d", { alpha: false }), still = stage.querySelector(".ar15still img"), fx = stage.querySelector(".ar15fx");
  const tag = stage.querySelector(".ar15tag"), dim = stage.querySelector(".ar15dim"), pool = stage.querySelector(".ar15pool");
  const panel = sec.querySelector(".ar15detail"), closeBtn = panel.querySelector(".ar15x"), go = panel.querySelector(".ar15go");
  const picks = [...sec.querySelectorAll(".ar15pick")], cue = sec.querySelector(".ar15cue");
  const text = id => { const b = picks.find(x => x.dataset.id === id); const l = he() ? "he" : "en";
    return b ? { name: b.dataset.name, kind: b.dataset["kind" + l[0].toUpperCase() + l[1]], line: b.dataset["line" + l[0].toUpperCase() + l[1]], href: b.dataset.href } : null; };

  let M, X = false, ids = null, idW = 0, idH = 0, R = { x: 0, y: 0, w: 1, h: 1, k: 1 };
  let blobs = [], bmps = [], busy = new Set(), fetching = 0, want = 0, dir = 1, gen = 0, shownK = -1, near = true;
  // frames held decoded: so many ahead in the scroll's direction, so many behind, and every so many as a fallback
  let AHEAD = 12, BEHIND = 4, SKEL = 16;
  async function load() {
    gen++; bmps.forEach(b => b && b.close()); blobs = []; bmps = []; busy = new Set(); shownK = -1; want = 0;
    [AHEAD, BEHIND, SKEL] = L === "m" ? [10, 3, 24] : [12, 4, 16];   // the phone holds fewer: about 140 MB at most
    M = await fetch(`archive15/${L}/manifest.json`).then(r => { if (!r.ok) throw 0; return r.json(); })
      .catch(() => { if (L !== "t") throw new Error("archive15 manifest"); L = "m"; return fetch("archive15/m/manifest.json").then(r => r.json()); });
    // a high-density screen wider than about 1200px takes the still at twice the size, where it was rendered
    X = !!(M.finalX && innerWidth * Math.min(2, devicePixelRatio || 1) >= 2400);
    still.src = X ? M.finalX.src : M.final; still.width = M.res[0]; still.height = M.res[1];
    const idImg = await bitmap(M.ids.src); idW = idImg.width; idH = idImg.height;
    const c = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(idW, idH) : Object.assign(document.createElement("canvas"), { width: idW, height: idH }), g = c.getContext("2d"); g.drawImage(idImg, 0, 0); ids = g.getImageData(0, 0, idW, idH).data;
    blobs = new Array(M.seq.n); bmps = new Array(M.seq.n);
    if (!reduce) { blobs[0] = await fetch(url(0)).then(r => r.blob()); fetchMore(); }
    M.pieces.forEach(p => { new Image().src = p.hero.src; new Image().src = patchSrc(p); });
  }

  /* ── the frames: fetched nearest first, four at a time; decoded two at a time, nearest first, at the canvas's size */
  const url = k => M.seq.src.replace("%02d", String(k).padStart(2, "0"));
  const patchSrc = p => X && p.patch.srcX ? p.patch.srcX : p.patch.src;
  const keep = k => near && (k % SKEL === 0 || ((k - want) * dir <= AHEAD && (want - k) * dir <= BEHIND));
  function fetchMore() {
    const n = M.seq.n, my = gen;
    while (fetching < 4) {
      let k = -1;
      for (let d = 0; d < n && k < 0; d++) for (const j of [want + d * dir, want - d * dir]) if (j >= 0 && j < n && blobs[j] === undefined) { k = j; break; }
      if (k < 0) return;
      blobs[k] = null; fetching++;
      fetch(url(k)).then(r => { if (!r.ok) throw 0; return r.blob(); }).then(b => { if (my === gen) blobs[k] = b; }, () => { if (my === gen) blobs[k] = undefined; })
        .finally(() => { if (my !== gen) return; fetching--; pump(); fetchMore(); });
    }
  }
  const decode = b => createImageBitmap(b);
  function pump() {
    if (!M || reduce) return; const n = M.seq.n, my = gen;
    for (let k = 0; k < n; k++) if (bmps[k] && !keep(k) && k !== shownK) { bmps[k].close(); bmps[k] = null; }
    while (busy.size < 2) {
      let k = -1;
      for (let d = 0; d <= AHEAD && k < 0; d++) for (const j of [want + d * dir, want - d * dir]) if (j >= 0 && j < n && keep(j) && !bmps[j] && !busy.has(j) && blobs[j]) { k = j; break; }
      for (let j = 0; j < n && k < 0; j += SKEL) if (keep(j) && !bmps[j] && !busy.has(j) && blobs[j]) k = j;
      if (k < 0) return;
      busy.add(k);
      decode(blobs[k]).then(b => { if (my !== gen) { b.close(); return; } busy.delete(k); if (keep(k) || k === want) { bmps[k] = b; kick(); } else b.close(); pump(); },
                            () => { if (my === gen) { busy.delete(k); pump(); } });
    }
  }
  function nearest(i) {
    const n = M.seq.n; if (bmps[i]) return i;
    for (let d = 1; d < n; d++) { const a = i - d * dir, b = i + d * dir; if (a >= 0 && a < n && bmps[a]) return a; if (b >= 0 && b < n && bmps[b]) return b; }
    return -1;
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
    // the approved frame is fitted whole between the header and any bar at the foot; where the render runs wider than
    // that frame (manifest "frame"), the rest of the view fills the window around it, the room fading out at its edges
    const b = pin.getBoundingClientRect(), { top, bot } = insets(), W = M.res[0], H = M.res[1], F = M.frame || [0, 0, W, H];
    const aw = b.width, ah = b.height - top - bot, k = Math.min(aw / (F[2] - F[0]), ah / (F[3] - F[1]));
    R = { w: W * k, h: H * k, k }; R.x = (aw - (F[2] - F[0]) * k) / 2 - F[0] * k; R.y = top + (ah - (F[3] - F[1]) * k) / 2 - F[1] * k;
    Object.assign(stage.style, { left: R.x + "px", top: R.y + "px", width: R.w + "px", height: R.h + "px" });
    sec.style.setProperty("--ar15top", top + "px"); sec.style.setProperty("--ar15bot", bot + "px"); sec.classList.toggle("ar15m", L !== "d");
    // the canvas no finer than the frames themselves (the composite scales it up): the fewest pixels to push per frame
    const dpr = Math.min(2, devicePixelRatio || 1), cw = Math.round(Math.min(R.w * dpr, M.seq.res[0]));
    if (cw !== cv.width) { cv.width = cw; cv.height = Math.round(cw * R.h / R.w); }
    dirty = true;
  }

  /* ── the scroll: 0 closed … 1 open; the last part of the runway holds the drawer open for looking */
  let t = reduce ? 1 : 0, dirty = true, loop = 0, last = 0, open = false, shown = "";
  /* a short set (fewer than 48 frames) is too coarse to show frame by frame: there the next frame comes in over a short
     stretch around the midpoint while the drawer moves, and once it rests it settles on the nearer whole frame */
  let snap = 1, snapA = 0;
  const steep = a => { const x = clamp((a - .3) / .4, 0, 1); return x * x * (3 - 2 * x); };
  function settle() { const t0 = performance.now(); cancelAnimationFrame(snapA);
    const step = now => { snap = 1 - Math.pow(1 - clamp((now - t0) / 220, 0, 1), 3); dirty = true; draw(); if (snap < 1) snapA = requestAnimationFrame(step); };
    snapA = requestAnimationFrame(step); }
  function progress() { const r = run.getBoundingClientRect(), span = r.height - pin.offsetHeight; return span > 0 ? clamp(-r.top / span / .78, 0, 1) : 1; }
  // the drawer eases towards the scroll's place: about a quarter of the way each 60th of a second
  function frame(now) {
    loop = 0; const c = reduce ? 1 : progress(), dt = last ? Math.min(100, now - last) : 16.7; last = now;
    const was = t; t = Math.abs(c - t) < 1e-4 ? c : t + (c - t) * (1 - Math.pow(.75, dt / 16.667));
    if (t !== was && snap !== 0) { cancelAnimationFrame(snapA); snap = 0; }
    draw();
    if (t !== c) loop = requestAnimationFrame(frame); else { last = 0; if (M && M.seq.n < 48 && snap === 0) settle(); }
  }
  function kick() { if (!loop) loop = requestAnimationFrame(frame); }
  function draw() {
    if (!M) return;
    // frames spaced evenly along the move: a gentle ease of the page's own (70% of full speed at either end, never a
    // dead stretch); a set spaced in time already carries its ease
    const n = M.seq.n, v = M.seq.space === "even" ? t + .3 * (t * t * (3 - 2 * t) - t) : t, f = v * (n - 1), i = Math.round(f);
    if (i !== want && !reduce) { dir = i > want ? 1 : -1; want = i; pump(); fetchMore(); }   // reduced motion: no frames at all
    if (!reduce && n >= 48) {
      const k = nearest(i);   // a frame not yet decoded: the nearest one that is, never a jump to closed
      if (k >= 0 && (dirty || k !== shownK)) { g.drawImage(bmps[k], 0, 0, cv.width, cv.height); shownK = k; dirty = false; }
    } else if (!reduce) {
      const i0 = Math.floor(f), a0 = f - i0, a = steep(a0) * (1 - snap) + (a0 >= .5 ? 1 : 0) * snap, key = i0 + "|" + a.toFixed(3);
      if (dirty || shown !== key) {
        let A = bmps[i0]; for (let k = i0 - 1; !A && k >= 0; k--) A = bmps[k];
        const B = bmps[i0] ? bmps[Math.min(n - 1, i0 + 1)] : null;
        if (A && !(B && a > .999)) { g.globalAlpha = 1; g.drawImage(A, 0, 0, cv.width, cv.height); }
        if (B && a > .001) { g.globalAlpha = a; g.drawImage(B, 0, 0, cv.width, cv.height); g.globalAlpha = 1; }
        shown = key; dirty = false;
      }
    }
    const s = reduce ? 1 : clamp((t - .93) / .07, 0, 1); still.style.opacity = s;
    const isOpen = t > .995; if (isOpen !== open) { open = isOpen; sec.classList.toggle("ar15open", open); if (!open) { hover(null); if (cur) close(true); home.slice().forEach(land); stage.querySelectorAll(".ar15hero, .ar15patch").forEach(e => e.remove()); } }
    if (cue) cue.style.opacity = String(clamp(1 - t * 4, 0, 1));
  }
  const tick = kick;

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

  /* ── the detail: the piece comes forward.
     Each lift is its own object (its piece, its two images, its own animation), so a second click while the first piece
     is still flying home can never strand it: the one on its way home lands at once, and a lift that was closed before
     its image had decoded never starts. */
  let cur = null, back = null, home = [], y0 = scrollY;
  function target(p) {
    const pr = toStage(p.hero.rect), ar = pr.w / pr.h, P = pin.getBoundingClientRect(), S = stage.getBoundingClientRect();
    let w, cx, cy;
    // centred in the room between the header and any bar at the foot (a short window must not tuck it under either)
    const { top, bot } = insets(), avail = P.height - top - bot;
    if (L === "d") { const maxW = P.width * .52, maxH = avail * .74; w = Math.min(maxW, maxH * ar); cx = P.width * (he() ? .66 : .34); cy = top + avail * .5; }
    else { const maxW = P.width * .9, maxH = P.height * .44; w = Math.min(maxW, maxH * ar); cx = P.width * .5; cy = P.height * .36; }
    const h = w / ar; return { x: cx - w / 2 - (S.left - P.left), y: cy - h / 2 - (S.top - P.top), w, h };
  }
  function place(el, r) { el.style.transform = `translate(${r.x}px, ${r.y}px)`; el.style.width = r.w + "px"; el.style.height = r.h + "px"; }
  function put(Lf, r) { Lf.r = r; Lf.hero.style.transform = `translate(${r.x}px, ${r.y}px) scale(${r.w / Lf.base.w}, ${r.h / Lf.base.h})`; }
  function fly(Lf, to, dur, done) {
    cancelAnimationFrame(Lf.anim); const from = Lf.r, t0 = performance.now();
    const step = now => { const k = reduce ? 1 : ease(clamp((now - t0) / dur, 0, 1)), lift = Math.sin(k * Math.PI) * -10;
      put(Lf, { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k + lift, w: from.w + (to.w - from.w) * k, h: from.h + (to.h - from.h) * k });
      if (k < 1) Lf.anim = requestAnimationFrame(step); else { Lf.anim = 0; done && done(); } };
    Lf.anim = requestAnimationFrame(step);
  }
  function land(Lf) { cancelAnimationFrame(Lf.anim); clearTimeout(Lf.wait); Lf.hero.remove(); Lf.patch.remove(); home = home.filter(x => x !== Lf); }
  function show(p, opener) {
    if (cur) return; home.slice().forEach(land);   // anything still on its way home is set down at once
    y0 = scrollY;   // the scroll that brought it here (a name below the drawer scrolls it open) must not close it
    back = opener || document.activeElement; hover(null);
    const from = toStage(p.hero.rect), Lf = { p, anim: 0, wait: 0, base: { w: from.w, h: from.h }, r: from, hero: new Image(), patch: new Image() };
    cur = Lf;
    Lf.patch.className = "ar15patch"; Lf.patch.alt = ""; Lf.patch.src = patchSrc(p); place(Lf.patch, toStage(p.patch.rect)); stage.insertBefore(Lf.patch, pool);
    Lf.hero.className = "ar15hero"; Lf.hero.alt = ""; Lf.hero.src = p.hero.src; Lf.hero.style.width = from.w + "px"; Lf.hero.style.height = from.h + "px";
    Lf.hero.style.transformOrigin = "0 0"; put(Lf, from); fx.appendChild(Lf.hero);
    const x = text(p.id); panel.querySelector(".ar15dk").textContent = x.kind; panel.querySelector(".ar15dn").textContent = x.name;
    panel.querySelector(".ar15dl").textContent = x.line; go.href = x.href;
    // the room darkens most just behind where the piece will hang, so nothing left in the drawer reads through it
    const to = target(p); dim.style.setProperty("--hx", (to.x + to.w / 2) + "px"); dim.style.setProperty("--hy", (to.y + to.h / 2) + "px");
    dim.style.setProperty("--hr", (Math.max(to.w, to.h) * .62) + "px");
    sec.classList.add("ar15sel"); dim.classList.add("on"); panel.hidden = false;
    const go1 = () => { if (cur !== Lf) return; Lf.patch.classList.add("on"); Lf.hero.classList.add("on");
      fly(Lf, to, 720, () => { if (cur !== Lf) return; panel.classList.add("on"); closeBtn.focus({ preventScroll: true }); }); };
    (Lf.hero.decode ? Lf.hero.decode() : Promise.resolve()).then(go1, go1);
  }
  function close(now) {
    if (!cur) return; const Lf = cur; cur = null; panel.classList.remove("on"); dim.classList.remove("on"); sec.classList.remove("ar15sel");
    const end = () => { land(Lf); if (!cur) { panel.hidden = true; if (back && back.focus) back.focus({ preventScroll: true }); } };
    if (now || reduce || !Lf.hero.classList.contains("on")) { end(); return; }
    home.push(Lf);
    fly(Lf, toStage(Lf.p.hero.rect), 560, () => { Lf.patch.classList.remove("on"); Lf.wait = setTimeout(end, 180); });
  }
  closeBtn.addEventListener("click", () => close());
  dim.addEventListener("click", () => close());
  addEventListener("keydown", e => { if (e.key === "Escape" && cur) close(); });
  picks.forEach(b => b.addEventListener("click", () => {
    const p = M && M.pieces.find(x => x.id === b.dataset.id); if (!p) return;
    if (!open) { const r = run.getBoundingClientRect(), span = r.height - pin.offsetHeight; scrollTo({ top: scrollY + r.top + span * .8, behavior: "instant" }); t = 1; dirty = true; draw(); }
    show(p, b); }));
  addEventListener("scroll", () => { if (cur && Math.abs(scrollY - y0) > 60) close(); if (!cur) y0 = scrollY;
    // far from the section, every decoded frame is let go (the files stay, compressed); back near, they are decoded again
    const r = run.getBoundingClientRect(), nr = r.bottom > -2 * innerHeight && r.top < 3 * innerHeight;
    if (nr !== near) { near = nr; if (!near) { bmps.forEach((b, k) => { if (b) { b.close(); bmps[k] = null; } }); shownK = -1; dirty = true; } else pump(); }
    if (near) kick(); }, { passive: true });
  addEventListener("resize", () => { const l = pickLayout(); home.slice().forEach(land);
    if (l !== L) { L = l; close(true); load().then(() => { layout(); pump(); tick(); }); } else { layout(); if (cur) { close(true); } tick(); } });
  new MutationObserver(() => { if (hot) { const h = hot; hot = null; hover(h); } }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang"] });

  await load(); layout(); if (!reduce) bmps[0] = await decode(blobs[0]);   // the closed drawer, at the canvas's size, before anything shows
  sec.classList.add("ar15live"); if (reduce) sec.classList.add("ar15still-only"); t = reduce ? 1 : progress(); dirty = true; draw(); pump();
  const api = { get t() { return t; }, get frame() { return shownK; }, get held() { return bmps.filter(Boolean).length; }, get fetched() { return blobs.filter(Boolean).length; }, get manifest() { return M; } };
  sec.__ar15 = api; return api;
}
