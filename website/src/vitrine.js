// The vitrine: seven niches in a wall of black leather. The wall drifts with the pointer (or a finger); selecting a
// niche brings the camera close, beside the piece's details; ‹ › travel along the wall; Back returns to it.
const BASE = import.meta.env.BASE_URL;
const PHONE = matchMedia("(max-width: 760px)").matches;
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s) => document.querySelector(s);

// The catalogue, as published (names, references, metals, sizes, descriptions); the wall's order and each niche's light.
const P = [
  { id: "knot", name: ["Mo", "ment"], type: "White gold bracelet", tint: "#a9bde0", w: 82,
    desc: "A delicate 18K white-gold chain, finished with the SILAVU signature in a polished sculptural form.",
    specs: [["Metal", "18K white gold"], ["Finish", "Polished"], ["Length", "16–19 cm"]], ref: "SLV·B·001" },
  { id: "aura", name: ["Au", "ra"], type: "Diamond earrings", tint: "#e9b4c8", w: 70,
    desc: "The SILAVU signature as a pair of 18K white-gold studs, traced in pavé diamonds.",
    specs: [["Metal", "18K white gold"], ["Setting", "Pavé"], ["Fastening", "Butterfly back"]], ref: "SLV·E·001" },
  { id: "ring", name: ["I", "con"], type: "Diamond ring", tint: "#f3eee4", w: 76,
    desc: "A sculptural 18K white-gold ring with the SILAVU signature set in pavé diamonds.",
    specs: [["Metal", "18K white gold"], ["Setting", "Pavé"], ["Size", "EU 47–58"]], ref: "SLV·R·001" },
  { id: "pave", name: ["So", "ul"], type: "Diamond necklace", tint: "#ffcc8f", w: 90,
    desc: "A fine 18K white-gold chain with a pavé SILAVU signature pendant at its centre.",
    specs: [["Metal", "18K white gold"], ["Setting", "Pavé"], ["Length", "42 cm"]], ref: "SLV·N·003" },
  { id: "promise", name: ["Pro", "mise"], type: "Engagement ring", tint: "#ffd27a", w: 70,
    desc: "A sculpted 18K yellow-gold band that folds open along its crown to hold a single baguette diamond.",
    specs: [["Metal", "18K yellow gold"], ["Stone", "One baguette diamond"], ["Size", "EU 47–58"]], ref: "SLV·R·002" },
  { id: "blush", name: ["Blu", "sh"], type: "Eternity ring", tint: "#ff98b4", w: 46,
    desc: "An 18K rose-gold eternity band of radiant-cut pink sapphires, edged on both sides in diamond pavé.",
    specs: [["Metal", "18K rose gold"], ["Stones", "Pink sapphires, diamond pavé"], ["Size", "EU 47–58"]], ref: "SLV·R·003" },
  { id: "cadence", name: ["Ca", "dence"], type: "Diamond line bracelet", tint: "#b3d1ff", w: 84,
    desc: "A fine 18K white-gold line of baguette diamonds, with three round diamonds between each.",
    specs: [["Metal", "18K white gold"], ["Diamonds", "Baguette and round brilliant"], ["Length", "16–19 cm"]], ref: "SLV·B·002" },
];
const N = P.length, pad = (n) => String(n).padStart(2, "0");

// ---- build the wall ----
const track = $("#track"), wall = $("#wall");
track.innerHTML = P.map((p, i) => `
  <button class="niche" type="button" data-i="${i}" style="--tint:${p.tint};--pw:${p.w}%" aria-label="${p.name.join("")}, ${p.type}. Come closer">
    <span class="niche__box"><span class="niche__lamp"></span><span class="niche__ledge"></span>
      <img class="niche__piece" src="${BASE}img/cut/${p.id}-1200.webp" alt="" decoding="async" /></span>
    <span class="niche__refl"><img src="${BASE}img/cut/${p.id}-700.webp" alt="" decoding="async" /></span>
    <span class="niche__label"><b>${p.name.join("")}</b><span>N°${pad(i + 1)} · ${p.type}</span></span>
  </button>`).join("");
const niches = [...track.children];

// ---- geometry: niche size, positions, the wall's pan range ----
let G = {};
function layout() {
  const W = innerWidth, H = innerHeight;
  const nh = PHONE ? Math.min(H * 0.5, W * 0.95) : Math.min(H * 0.56, W * 0.32);
  const nw = nh * 0.66, gap = PHONE ? nw * 0.16 : nw * 0.2, side = PHONE ? W * 0.5 - nw / 2 : Math.max(W * 0.06, 40);
  const width = side * 2 + N * nw + (N - 1) * gap;
  const top = PHONE ? H * 0.22 : H * 0.17;
  niches.forEach((n, i) => { n.style.left = `${side + i * (nw + gap)}px`; });
  document.documentElement.style.setProperty("--nw", `${nw}px`);
  document.documentElement.style.setProperty("--nh", `${nh}px`);
  G = { W, H, nh, nw, gap, side, width, top, minPan: Math.min(0, W - width), maxPan: 0 };
  if (cur < 0) { setPan(clampPan(G.pan ?? centreOn(3)), true); } else close(cur, true);
}
const centreOn = (i) => G.W / 2 - (G.side + i * (G.nw + G.gap) + G.nw / 2);
const clampPan = (x) => Math.max(G.minPan, Math.min(G.maxPan, x));

// ---- the wall drifts: with the pointer on desktop, under a finger on a phone ----
let pan = 0, panTo = 0, raf = 0;
function setPan(x, now) { panTo = x; G.pan = x; if (now) { pan = x; paint(); } else if (!raf) raf = requestAnimationFrame(step); }
function step() { raf = 0; pan += (panTo - pan) * 0.08; if (Math.abs(panTo - pan) < 0.3) pan = panTo; paint(); if (pan !== panTo) raf = requestAnimationFrame(step); }
function paint() { if (cur < 0) track.style.transform = `translate3d(${pan.toFixed(1)}px, ${G.top.toFixed(1)}px, 0)`; }
if (!PHONE) addEventListener("pointermove", (e) => { if (cur >= 0 || e.pointerType !== "mouse" || REDUCED) return; const k = e.clientX / G.W; setPan(G.minPan + (G.maxPan - G.minPan) * (1 - k)); }, { passive: true });
let drag = null;
wall.addEventListener("pointerdown", (e) => { if (cur >= 0) return; drag = { x: e.clientX, p: panTo, moved: false }; });
addEventListener("pointermove", (e) => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 6) drag.moved = true; if (drag.moved) setPan(clampPan(drag.p + dx * (PHONE ? 1.2 : 1)), true); });
addEventListener("pointerup", () => { if (drag && drag.moved && PHONE) { // settle on the nearest niche
  const i = Math.round((G.W / 2 - pan - G.side - G.nw / 2) / (G.nw + G.gap)); setPan(clampPan(centreOn(Math.max(0, Math.min(N - 1, i))))); }
  setTimeout(() => (drag = null), 0); });
addEventListener("wheel", (e) => { if (cur >= 0) return; setPan(clampPan(panTo - (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY))); }, { passive: true });

// ---- coming closer ----
let cur = -1;
const detail = $("#detail");
function close(i, instant) {
  cur = i;
  const p = P[i], n = niches[i];
  const targetH = PHONE ? G.H * 0.44 : G.H * 0.84, s = targetH / G.nh;
  const cx = parseFloat(n.style.left) + G.nw / 2, cy = G.nh / 2;
  const X = PHONE ? G.W / 2 : G.W * 0.64, Y = PHONE ? G.H * 0.27 : G.H * 0.5;
  track.classList.toggle("is-gliding", !instant && !REDUCED);
  track.style.transform = `translate3d(${(X - s * cx).toFixed(1)}px, ${(Y - s * cy).toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
  niches.forEach((e, k) => e.classList.toggle("is-on", k === i));
  document.body.classList.add("is-close");
  document.documentElement.style.setProperty("--tint", p.tint);
  document.documentElement.style.setProperty("--wallz", "1.08");
  // the words
  $("#dKick").textContent = `N°${pad(i + 1)} · ${p.type}`;
  $("#dName").innerHTML = `${p.name[0]}<em>${p.name[1]}</em>`;
  $("#dDesc").textContent = p.desc;
  $("#dSpecs").innerHTML = p.specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
  $("#dRef").textContent = p.ref;
  $("#count").textContent = `${pad(i + 1)} / ${pad(N)}`;
  $("#dBook").href = `mailto:concierge@silavu.com?subject=${encodeURIComponent(`A private viewing: ${p.name.join("").toUpperCase()}`)}&body=${encodeURIComponent(`I would like to see ${p.name.join("").toUpperCase()} (${p.ref}) in person.\n\nName:\nPhone:\nTel Aviv, Dubai or at home:\n`)}`;
  detail.hidden = false;
  detail.classList.remove("is-on");
  setTimeout(() => detail.classList.add("is-on"), instant || REDUCED ? 0 : 520);
  history.replaceState(null, "", `#${p.name.join("").toLowerCase()}`);
}
function back() {
  if (cur < 0) return;
  const i = cur; cur = -1;
  detail.classList.remove("is-on");
  document.body.classList.remove("is-close");
  document.documentElement.style.setProperty("--wallz", "1");
  track.classList.toggle("is-gliding", !REDUCED);
  setPan(clampPan(centreOn(i)), true);
  setTimeout(() => { if (cur < 0) { detail.hidden = true; track.classList.remove("is-gliding"); } }, 1200);
  niches[i].focus({ preventScroll: true });
  history.replaceState(null, "", location.pathname + location.search);
}
const go = (d) => { if (cur >= 0) close((cur + d + N) % N); };
track.addEventListener("click", (e) => { const n = e.target.closest(".niche"); if (!n || (drag && drag.moved)) return; if (cur < 0) close(+n.dataset.i); });
document.addEventListener("click", (e) => { if (e.target.closest("[data-back]")) { e.preventDefault(); back(); } });
$("#prev").addEventListener("click", () => go(-1));
$("#next").addEventListener("click", () => go(1));
addEventListener("keydown", (e) => {
  if (e.key === "Escape") back();
  else if (e.key === "ArrowRight") cur >= 0 ? go(1) : setPan(clampPan(panTo - G.nw));
  else if (e.key === "ArrowLeft") cur >= 0 ? go(-1) : setPan(clampPan(panTo + G.nw));
});
// a swipe on the details travels along the wall on a phone
let sx = null;
detail.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
detail.addEventListener("touchend", (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); sx = null; }, { passive: true });

// the wish list count, shared with the house page
try { $("#wishN").textContent = JSON.parse(localStorage.getItem("silavu-wish") || "[]").length; } catch {}

let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(layout, 120); });
layout();
// a shared link opens on its piece
const fromHash = () => P.findIndex((p) => `#${p.name.join("").toLowerCase()}` === location.hash);
if (fromHash() >= 0) close(fromHash(), true);
addEventListener("hashchange", () => { const i = fromHash(); if (i >= 0 && i !== cur) close(i); else if (i < 0 && !location.hash) back(); });
if (import.meta.env.DEV) window.__vitrine = { P, close, back, get cur() { return cur; } };
