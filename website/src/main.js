import Lenis from "lenis";

const BASE = import.meta.env.BASE_URL;
const PHONE = matchMedia("(max-width: 760px)").matches;
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// The catalogue, as published on the live site (references, metals, sizes, descriptions).
const PIECES = [
  { id: "pave", name: "SOUL", type: "Diamond necklace", cat: "necklaces", metal: "white", tag: "The signature",
    desc: "A fine 18K white-gold chain with a pavé SILAVU signature pendant at its centre.",
    specs: [["Reference", "SLV·N·003"], ["Metal", "18K white gold"], ["Setting", "Pavé"], ["Length", "42 cm"]],
    shots: [["necklace-front", "The SOUL necklace, full length"], ["necklace-worn", "The SOUL necklace worn at the collarbone"], ["necklace-detail", "The SOUL pendant and the chain either side of it"], ["necklace-macro", "The pavé SOUL pendant, close"]] },
  { id: "aura", name: "AURA", type: "Diamond earrings", cat: "earrings", metal: "white",
    desc: "The SILAVU signature as a pair of 18K white-gold studs, traced in pavé diamonds.",
    specs: [["Reference", "SLV·E·001"], ["Metal", "18K white gold"], ["Setting", "Pavé"], ["Fastening", "Butterfly back"]],
    shots: [["aura-pair", "The AURA earrings, a pair of pavé SILAVU signatures"], ["aura-worn", "An AURA earring worn"], ["aura-side", "One AURA earring from three quarters"], ["aura-macro", "The pavé of an AURA earring, close"], ["aura-signed", "The AURA earrings, signed"]] },
  { id: "knot", name: "MOMENT", type: "White gold bracelet", cat: "bracelets", metal: "white",
    desc: "A delicate 18K white-gold chain, finished with the SILAVU signature in a polished sculptural form.",
    specs: [["Reference", "SLV·B·001"], ["Metal", "18K white gold"], ["Finish", "Polished"], ["Length", "16–19 cm"]],
    shots: [["knot-flat", "The MOMENT bracelet laid flat"], ["knot-worn", "MOMENT bracelets worn on the wrist"], ["knot-macro", "The polished signature of the MOMENT bracelet, close"], ["knot-clasp", "The clasp and the engraved SILAVU tag"], ["knot-full", "The MOMENT bracelet, full length"]] },
  { id: "cadence", name: "CADENCE", type: "Diamond line bracelet", cat: "bracelets", metal: "white",
    desc: "A fine 18K white-gold line of baguette diamonds, with three round diamonds between each.",
    specs: [["Reference", "SLV·B·002"], ["Metal", "18K white gold"], ["Diamonds", "Baguette and round brilliant"], ["Length", "16–19 cm"]],
    shots: [["cadence-front", "The CADENCE bracelet"], ["cadence-worn", "The CADENCE bracelet on the wrist"], ["cadence-macro", "Baguettes and round diamonds of CADENCE, close"], ["cadence-side", "The CADENCE bracelet from the side"]] },
  { id: "ring", name: "ICON", type: "Diamond ring", cat: "rings", metal: "white",
    desc: "A sculptural 18K white-gold ring with the SILAVU signature set in pavé diamonds.",
    specs: [["Reference", "SLV·R·001"], ["Metal", "18K white gold"], ["Setting", "Pavé"], ["Size", "EU 47–58"]],
    shots: [["ring-front", "The ICON ring, the SILAVU signature in pavé diamonds"], ["ring-worn", "The ICON ring worn"], ["ring-side", "The ICON ring from three quarters"], ["ring-macro", "The pavé signature of the ICON ring, close"], ["ring-signed", "SILAVU engraved inside the band"]] },
  { id: "promise", name: "PROMISE", type: "Engagement ring", cat: "rings", metal: "yellow", tag: "Engagement",
    desc: "A sculpted 18K yellow-gold band that folds open along its crown to hold a single baguette diamond.",
    specs: [["Reference", "SLV·R·002"], ["Metal", "18K yellow gold"], ["Stone", "One baguette diamond"], ["Finish", "Polished"], ["Size", "EU 47–58"]],
    shots: [["promise-front", "The PROMISE ring"], ["promise-macro", "The baguette diamond in the fold of the band, close"], ["promise-signed", "SILAVU engraved inside the PROMISE band"]] },
  { id: "blush", name: "BLUSH", type: "Eternity ring", cat: "rings", metal: "rose",
    desc: "An 18K rose-gold eternity band of radiant-cut pink sapphires, edged on both sides in diamond pavé.",
    specs: [["Reference", "SLV·R·003"], ["Metal", "18K rose gold"], ["Stones", "Radiant-cut pink sapphires, diamond pavé"], ["Size", "EU 47–58"]],
    shots: [["blush-front", "The BLUSH ring"], ["blush-worn", "The BLUSH ring worn"], ["blush-macro", "Pink sapphires and diamond pavé, close"], ["blush-side", "The BLUSH ring from the side"], ["blush-profile", "The BLUSH ring in profile"]] },
];
const METAL = { white: "18K white gold", yellow: "18K yellow gold", rose: "18K rose gold" };
const img = (n, w = 900) => `${BASE}img/p/${n}-${w}.jpg`;
const byId = Object.fromEntries(PIECES.map((p) => [p.id, p]));

// ---- wish list, kept in this browser only ----
let wish = new Set();
try { wish = new Set(JSON.parse(localStorage.getItem("silavu-wish") || "[]")); } catch {}
const saveWish = () => { try { localStorage.setItem("silavu-wish", JSON.stringify([...wish])); } catch {} };

// ---- the grid ----
const grid = $(".grid");
grid.innerHTML = PIECES.map((p) => `
  <li class="card rv" data-id="${p.id}" data-cat="${p.cat}">
    <button class="card__wish" type="button" aria-pressed="false" aria-label="Save ${p.name} to wish list"><svg><use href="#i-heart" /></svg></button>
    <button class="card__open" type="button" aria-label="${p.name}, ${p.type}">
      <span class="card__img">
        ${p.tag ? `<span class="card__tag">${p.tag}</span>` : ""}
        <img src="${img(p.shots[0][0])}" alt="${p.shots[0][1]}" loading="lazy" width="900" height="900" />
        <img class="alt" src="${img(p.shots[1][0])}" alt="" loading="lazy" width="900" height="900" />
      </span>
      <span class="card__name">${p.name}</span>
      <span class="card__type">${p.type}</span>
      <span class="card__metal"><span class="dot dot--${p.metal}"></span>${METAL[p.metal]}</span>
      <span class="card__price">Price on request</span>
    </button>
  </li>`).join("") + `
  <li class="card card--insert rv" data-insert>
    <img src="${img("aura-worn")}" alt="" loading="lazy" width="900" height="900" />
    <div class="ins"><p class="eyebrow">In person</p><h3>See every creation in the hand</h3><button class="link link--light" type="button" data-open="book">Book an appointment</button></div>
  </li>`;

const chips = $$(".chip");
const wishChip = $('.chip[data-cat="wish"]');
const empty = $(".grid__empty");
let current = "all";
function filter(cat) {
  current = cat;
  chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.cat === cat)));
  let shown = 0;
  const ins = $("[data-insert]", grid); if (ins) ins.hidden = cat !== "all";
  $$(".card:not([data-insert])", grid).forEach((c) => {
    const on = cat === "all" || (cat === "wish" ? wish.has(c.dataset.id) : c.dataset.cat === cat);
    c.hidden = !on;
    if (on) { shown++; c.classList.add("is-in"); }
  });
  empty.hidden = shown > 0;
}
function paintWish() {
  $$(".card:not([data-insert])", grid).forEach((c) => $(".card__wish", c).setAttribute("aria-pressed", String(wish.has(c.dataset.id))));
  const n = wish.size;
  $$(".wish-n").forEach((b) => { b.textContent = n; b.hidden = n === 0; });
  $("[data-wishlist]").setAttribute("aria-pressed", String(n > 0));
  wishChip.hidden = n === 0;
  wishChip.textContent = `Wish list (${n})`;
  if (current === "wish") filter("wish");
}
function toggleWish(id) { wish.has(id) ? wish.delete(id) : wish.add(id); saveWish(); paintWish(); if (openId === id) paintPvWish(); }
chips.forEach((c) => c.addEventListener("click", () => filter(c.dataset.cat)));
grid.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;
  if (e.target.closest(".card__wish")) toggleWish(card.dataset.id);
  else if (e.target.closest(".card__open")) openPiece(card.dataset.id);
});
$("[data-wishlist]").addEventListener("click", () => { filter(wish.size ? "wish" : "all"); go($("#collection")); });

// ---- smooth wheel on desktop; touch keeps the phone's own scrolling ----
let lenis = null;
if (FINE && !REDUCED) {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}
const hd = $(".hd");
function go(el) {
  const y = el === 0 ? 0 : el.getBoundingClientRect().top + scrollY - hd.offsetHeight + 1;
  if (lenis) lenis.scrollTo(y, { duration: 1.4 }); else scrollTo({ top: y, behavior: REDUCED ? "auto" : "smooth" });
}
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.dataset.open !== undefined) return;
  const id = a.getAttribute("href");
  const el = id === "#top" ? 0 : $(id);
  if (el === null) return;
  e.preventDefault();
  if (a.dataset.cat) filter(a.dataset.cat);
  closePanels();
  go(el);
});

// ---- the header steps aside while reading down, returns when scrolling up ----
let lastY = 0;
const onScroll = (y) => {
  hd.classList.toggle("is-hidden", y > lastY && y > 400 && !document.body.classList.contains("locked"));
  lastY = y;
};
if (lenis) lenis.on("scroll", ({ scroll }) => onScroll(scroll));
else addEventListener("scroll", () => onScroll(scrollY), { passive: true });

// ---- panels ----
const scrim = $(".scrim");
let openPanel = null, lastFocus = null;
function showPanel(id) {
  const p = $(`#${id}`);
  if (openPanel && openPanel !== p) hidePanel(openPanel, true);
  lastFocus = document.activeElement;
  p.hidden = false; scrim.hidden = false;
  requestAnimationFrame(() => { p.classList.add("is-on"); scrim.classList.add("is-on"); });
  document.body.classList.add("locked"); lenis?.stop();
  openPanel = p;
  setTimeout(() => $("[data-close]", p).focus(), 60);
}
function hidePanel(p, swap) {
  p.classList.remove("is-on");
  setTimeout(() => { if (!p.classList.contains("is-on")) p.hidden = true; }, 300);
  if (!swap) {
    scrim.classList.remove("is-on");
    setTimeout(() => { if (!scrim.classList.contains("is-on")) scrim.hidden = true; }, 260);
    document.body.classList.remove("locked"); lenis?.start();
    openPanel = null;
    lastFocus?.focus?.({ preventScroll: true });
  }
}
const closePanels = () => { if (openPanel) hidePanel(openPanel); };
scrim.addEventListener("click", closePanels);
addEventListener("keydown", (e) => { if (e.key === "Escape") closePanels(); });
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) return closePanels();
  const o = e.target.closest("[data-open]");
  if (o) { e.preventDefault(); if (o.dataset.open === "book") openBook(); else showPanel(o.dataset.open); return; }
  const pc = e.target.closest("[data-piece]");
  if (pc) openPiece(pc.dataset.piece);
});

// the piece in quick view
let openId = null;
const pvMain = $(".pv__main"), pvThumbs = $(".pv__thumbs"), pvWish = $("#pv-wish");
const paintPvWish = () => pvWish.setAttribute("aria-pressed", String(wish.has(openId)));
function pick(i) {
  const s = byId[openId].shots[i];
  pvMain.src = img(s[0], 1254); pvMain.alt = s[1];
  $$("button", pvThumbs).forEach((b, k) => b.setAttribute("aria-current", String(k === i)));
}
function openPiece(id) {
  const p = byId[id]; if (!p) return;
  openId = id;
  $("#pv-ref").textContent = p.specs[0][1];
  $("#pv-type").textContent = p.type;
  $("#pv-name").textContent = p.name;
  $("#pv-desc").textContent = p.desc;
  $("#pv-specs").innerHTML = [...p.specs.slice(1), ["Price", "On request"]].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
  pvThumbs.innerHTML = p.shots.map((s, i) => `<button type="button" aria-label="View ${i + 1}: ${s[1]}"><img src="${img(s[0])}" alt="" width="900" height="900" /></button>`).join("");
  pick(0); paintPvWish();
  showPanel("piece");
}
pvThumbs.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) pick($$("button", pvThumbs).indexOf(b)); });
pvWish.addEventListener("click", () => toggleWish(openId));
$("#pv-book").addEventListener("click", () => openBook(openId));

// the appointment
const sel = $("#f-piece");
sel.insertAdjacentHTML("beforeend", PIECES.map((p) => `<option value="${p.id}">${p.name} · ${p.type}</option>`).join(""));
function openBook(id) { if (id) sel.value = id; showPanel("book"); }
const bk = $("#bk-form"), bkMsg = $(".bk__msg");
bk.addEventListener("submit", (e) => {
  e.preventDefault();
  let ok = true;
  for (const id of ["f-name", "f-contact"]) {
    const f = $(`#${id}`); const bad = !f.value.trim();
    f.closest(".field").classList.toggle("is-bad", bad); if (bad) ok = false;
  }
  if (!ok) { bkMsg.classList.remove("is-ok"); bkMsg.textContent = "Add your name and an email or phone number so the concierge can reply."; return; }
  const v = (id) => $(`#${id}`).value.trim();
  const where = $('input[name="where"]:checked', bk).value;
  const piece = sel.value ? `${byId[sel.value].name} · ${byId[sel.value].type}` : "Not sure yet";
  const body = [`Name: ${v("f-name")}`, `Email or phone: ${v("f-contact")}`, `Where: ${where}`, `Creation: ${piece}`, `Preferred day: ${v("f-when") || "Any"}`, "", v("f-note")].join("\n");
  location.href = `mailto:concierge@silavu.com?subject=${encodeURIComponent("Appointment request")}&body=${encodeURIComponent(body)}`;
  bkMsg.classList.add("is-ok");
  bkMsg.textContent = "Your email app has the request ready. Send it and a concierge will confirm the time.";
});

// the letter
$("#news").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = $("#n-email"), m = $(".news__msg");
  if (!/^\S+@\S+\.\S+$/.test(f.value.trim())) { m.textContent = "Enter an email address, like name@example.com."; return; }
  location.href = `mailto:concierge@silavu.com?subject=${encodeURIComponent("The SILAVU letter")}&body=${encodeURIComponent(`Please add ${f.value.trim()} to the SILAVU letter.`)}`;
  m.textContent = "Your email app has the request ready. Send it to join the letter.";
});

// ---- the box: scrolling opens the lid ----
// The film is loaded whole (every frame a keyframe) and scrubbed by the scroll; seeks are gated so a new one
// only starts when the last has landed. Reduced motion keeps the closed box and shows the words.
const boxSec = $(".box"), boxFilm = $(".box__film"), boxStart = $(".box__start"), boxEnd = $(".box__end");
if (PHONE) boxFilm.poster = BASE + boxFilm.dataset.posterV;
let boxBusy = false, boxNext = null, boxLast = -1;
function boxSeek(t) {
  if (!boxFilm.duration) return;
  if (Math.abs(t - boxLast) < 0.01) return;
  if (boxBusy) { boxNext = t; return; }
  boxBusy = true; boxLast = t; boxFilm.currentTime = t;
}
boxFilm.addEventListener("seeked", () => { boxBusy = false; if (boxNext !== null) { const t = boxNext; boxNext = null; boxSeek(t); } });
let boxP = -1;
function boxUpdate(y) {
  const top = boxSec.offsetTop, range = Math.max(1, boxSec.offsetHeight - innerHeight);
  const p = Math.min(1, Math.max(0, (y - top) / range));
  if (Math.abs(p - boxP) < 0.0008) return;
  boxP = p;
  const f = Math.min(1, p / 0.8);
  boxSeek(f * Math.max(0, (boxFilm.duration || 0) - 0.04));
  boxStart.style.opacity = String(Math.max(0, 1 - p * 8));
  const e = Math.min(1, Math.max(0, (p - 0.74) / 0.18));
  boxEnd.style.opacity = String(e);
  boxEnd.style.transform = `translateY(${((1 - e) * 24).toFixed(1)}px)`;
}
if (!REDUCED) {
  fetch(BASE + (PHONE ? boxFilm.dataset.srcV : boxFilm.dataset.src))
    .then((r) => (r.ok ? r.blob() : Promise.reject(r.status)))
    .then((b) => {
      boxFilm.src = URL.createObjectURL(b);
      boxFilm.addEventListener("loadeddata", () => { boxP = -1; boxUpdate(lenis ? lenis.scroll : scrollY); }, { once: true });
    })
    .catch(() => {});             // the closed box stays as a still; the words still arrive with the scroll
  if (lenis) lenis.on("scroll", ({ scroll }) => boxUpdate(scroll));
  else { let tk = false; addEventListener("scroll", () => { if (tk) return; tk = true; requestAnimationFrame(() => { tk = false; boxUpdate(scrollY); }); }, { passive: true }); }
  addEventListener("resize", () => { boxP = -1; boxUpdate(lenis ? lenis.scroll : scrollY); });
  boxUpdate(scrollY);
}

// ---- films: the right cut for the screen, loaded when near, only the one in view plays ----
const films = $$("video.film");
films.forEach((v) => { if (PHONE && v.dataset.posterV) v.poster = BASE + v.dataset.posterV; });
const ratio = new Map();
const near = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  const v = e.target;
  v.src = BASE + (PHONE ? v.dataset.srcV : v.dataset.src);
  v.preload = "auto";
  near.unobserve(v);
}), { rootMargin: "100% 0px" });
const seen = new IntersectionObserver((es) => {
  es.forEach((e) => ratio.set(e.target, e.intersectionRatio));
  let best = null, r = 0;
  ratio.forEach((v, k) => { if (v > r) { r = v; best = k; } });
  films.forEach((v) => {
    if (v === best && r > 0.25 && !REDUCED) { if (v.paused && v.src) v.play().catch(() => {}); }
    else if (!v.paused) v.pause();
  });
}, { threshold: [0, 0.25, 0.5, 0.75, 1] });
films.forEach((v) => {
  near.observe(v); seen.observe(v);
  v.addEventListener("loadeddata", () => { if (ratio.get(v) > 0.25 && !REDUCED) v.play().catch(() => {}); }, { once: true });
});

// ---- a short rise as things arrive ----
const rio = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  e.target.classList.add("is-in");
  rio.unobserve(e.target);
}), { rootMargin: "0px 0px -6% 0px" });
$$(".rv").forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 70}ms`; rio.observe(el); });

paintWish();
if (import.meta.env.DEV) window.__lenis = lenis;
