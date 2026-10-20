import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
if ("scrollRestoration" in history) history.scrollRestoration = "manual";   // the story always starts at beat one

const BASE = import.meta.env.BASE_URL;
// Phones, tablets and reduced motion get still photographs instead of the scrubbed film.
// This string must match the media query in style.css.
const STATIC_HERO = matchMedia("(max-width: 768px), (hover: none), (prefers-reduced-motion: reduce)");
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

const PIECES = [
  { id: "soul", name: "SOUL", type: "Pendant", img: "pave", metal: "18K white gold · diamonds",
    line: "The knot of the house, pavé-set in 18K white gold, on a chain with diamond stations." },
  { id: "silavu", name: "SILAVU", type: "Ring", img: "ring", metal: "18K white gold · diamonds",
    line: "The knot as a pavé crown, on a band set all the way round." },
  { id: "knot", name: "KNOT", type: "Bracelet", img: "knot", metal: "18K white gold",
    line: "The polished knot, unset, on a fine chain with the engraved house tag." },
  { id: "aura", name: "AURA & ECHO", type: "Earrings", img: "aura", metal: "18K white gold · diamonds",
    line: "The knot as pavé studs, in two scales." },
  { id: "cadence", name: "CADENCE", type: "Line bracelet", img: "cadence", metal: "18K white gold · diamonds",
    line: "Emerald-cut diamonds between trios of round brilliants." },
  { id: "blush", name: "BLUSH", type: "Eternity ring", img: "blush", metal: "18K rose gold · pink stones",
    line: "Cushion-cut pink stones all the way round, in 18K rose gold." },
  { id: "promise", name: "PROMISE", type: "Band", img: "promise", metal: "18K yellow gold · diamond",
    line: "A sculpted wave of 18K yellow gold holding one baguette diamond." },
];

// ---- smooth scroll ----
const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
  const id = a.getAttribute("href");
  const el = id === "#top" ? 0 : document.querySelector(id);
  if (el === null) return;
  e.preventDefault();
  lenis.scrollTo(el, { offset: id === "#top" ? 0 : -10, duration: 1.4 });
}));

// ---- the collection: an index of seven pieces beside one lit vitrine ----
const list = document.querySelector(".pieces");
const viewer = document.querySelector(".viewer");
const vImg = viewer.querySelector(".viewer__img");
const pieceSelect = document.getElementById("f-piece");
list.innerHTML = PIECES.map((p, i) => `
  <li class="piece${i === 0 ? " is-active" : ""}" data-i="${i}">
    <button class="piece__btn" type="button" aria-pressed="${i === 0}">
      <img class="piece__img" src="${BASE}img/pieces/${p.img}-700.webp" alt="${p.name} ${p.type.toLowerCase()}" loading="lazy" />
      <span class="piece__name">${p.name}</span>
      <span class="piece__type">${p.type}</span>
      <span class="piece__line">${p.line}</span>
    </button>
    <a class="piece__ask" href="#viewing" data-piece="${p.name}">Ask to see ${p.name}</a>
  </li>`).join("");
pieceSelect.insertAdjacentHTML("beforeend", PIECES.map((p) => `<option>${p.name} · ${p.type}</option>`).join(""));
PIECES.forEach((p) => { const im = new Image(); im.src = `${BASE}img/pieces/${p.img}-1200.webp`; });   // warm the vitrine
let active = 0, swapT;
function show(i) {
  if (i === active) return;
  list.children[active].classList.remove("is-active");
  list.children[active].querySelector(".piece__btn").setAttribute("aria-pressed", "false");
  active = i;
  list.children[i].classList.add("is-active");
  list.children[i].querySelector(".piece__btn").setAttribute("aria-pressed", "true");
  const p = PIECES[i];
  clearTimeout(swapT);
  viewer.classList.add("is-swapping");
  swapT = setTimeout(() => {
    vImg.src = `${BASE}img/pieces/${p.img}-1200.webp`;
    viewer.querySelector(".viewer__name").textContent = p.name;
    viewer.querySelector(".viewer__metal").textContent = p.metal;
    viewer.classList.remove("is-swapping");
  }, 200);
}
list.addEventListener("click", (e) => {
  const li = e.target.closest(".piece");
  if (!li) return;
  if (e.target.closest(".piece__ask")) {
    const p = PIECES[+li.dataset.i];
    pieceSelect.value = `${p.name} · ${p.type}`;
    return;
  }
  show(+li.dataset.i);
});
if (matchMedia("(hover: hover)").matches) {
  list.addEventListener("pointerover", (e) => { const li = e.target.closest(".piece"); if (li) show(+li.dataset.i); });
}

// ---- the film: scrubbed by the story's scroll, desktop only ----
const story = document.getElementById("story");
const bgVideo = document.getElementById("bgv");
const storyProgress = () => {
  const range = Math.max(1, story.offsetHeight - innerHeight);
  return gsap.utils.clamp(0, 1, (lenis.scroll - story.offsetTop) / range);
};
let seekBusy = false, pendingTime = null, lastVideoT = -1;
function requestSeek(t) {
  if (!bgVideo.duration) return;
  if (Math.abs(t - lastVideoT) < 0.008) return;
  if (seekBusy) { pendingTime = t; return; }
  seekBusy = true; lastVideoT = t; bgVideo.currentTime = t;
}
bgVideo.addEventListener("seeked", () => {
  seekBusy = false;
  if (pendingTime !== null) { const t = pendingTime; pendingTime = null; requestSeek(t); }
});
bgVideo.addEventListener("error", () => { seekBusy = false; pendingTime = null; document.body.classList.add("video-failed"); });
const scrubVideo = () => requestSeek(storyProgress() * (bgVideo.duration - 0.05));
async function initVideo() {
  if (STATIC_HERO.matches) return;
  try {
    const res = await fetch(`${BASE}film.mp4`);
    if (!res.ok) throw new Error(res.status);
    bgVideo.src = URL.createObjectURL(await res.blob());
    bgVideo.load();
    bgVideo.addEventListener("loadeddata", () => { scrubVideo(); document.body.classList.add("video-ready"); }, { once: true });
    lenis.on("scroll", scrubVideo);
  } catch { document.body.classList.add("video-failed"); }
}
initVideo();
if (!STATIC_HERO.matches) import("./atmosphere.js").then(({ initAtmosphere }) => initAtmosphere({ lenis }));

// ---- phones: a still per beat instead of the film ----
if (STATIC_HERO.matches) {
  const stills = [...document.querySelectorAll(".still[data-beat]:not(.still--film)")];
  const byBeat = { 0: 0, 1: 0, 2: 1, 3: 2, 4: 1 };          // world, world, SOUL, the pavé, SOUL
  document.querySelector(".still--film").classList.remove("is-on");
  stills[0].classList.add("is-on");
  const seen = new Map();
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => seen.set(+e.target.dataset.beat, e.intersectionRatio));
    let best = 0, r = -1;
    seen.forEach((v, k) => { if (v > r) { r = v; best = k; } });
    stills.forEach((s, i) => s.classList.toggle("is-on", i === byBeat[best]));
  }, { threshold: [0, .25, .5, .75, 1] });
  document.querySelectorAll(".beat").forEach((b) => io.observe(b));
}

// ---- after the story the film dims behind the knot ----
gsap.fromTo(".stage-dim", { opacity: 0 }, { opacity: 0.9, ease: "none",
  scrollTrigger: { trigger: ".impact", start: "top bottom", end: "top 25%", scrub: true } });

// ---- header turns solid once the page leaves the film ----
const hd = document.querySelector(".hd");
const col = document.getElementById("collection");
lenis.on("scroll", () => hd.classList.toggle("is-solid", col.getBoundingClientRect().top <= 80));

// ---- reveals and the knot drawing itself (once each) ----
const rio = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  e.target.classList.add("is-in");
  rio.unobserve(e.target);
}), { rootMargin: "0px 0px -12% 0px" });
document.querySelectorAll(".rv").forEach((el) => rio.observe(el));
const impact = document.querySelector(".impact");
const iio = new IntersectionObserver((es) => { if (es[0].isIntersecting) { impact.classList.add("is-in"); iio.disconnect(); } }, { threshold: 0.45 });
iio.observe(impact);

// ---- craft: the photograph tilts under the pointer; pins light their note ----
const tilt = document.querySelector(".loupe__tilt");
if (!REDUCED && matchMedia("(hover: hover) and (min-width: 901px)").matches) {
  let raf = 0, rx = 0, ry = 0;
  tilt.addEventListener("pointermove", (e) => {
    const r = tilt.getBoundingClientRect();
    ry = ((e.clientX - r.left) / r.width - 0.5) * 6;
    rx = -((e.clientY - r.top) / r.height - 0.5) * 4;
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; tilt.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`; });
  });
  tilt.addEventListener("pointerleave", () => { tilt.style.transform = ""; });
}
document.querySelectorAll(".pin").forEach((pin) => {
  const note = document.getElementById(pin.getAttribute("aria-describedby"));
  const on = (v) => { pin.classList.toggle("is-on", v); note.classList.toggle("is-on", v); };
  pin.addEventListener("pointerenter", () => on(true));
  pin.addEventListener("pointerleave", () => on(false));
  pin.addEventListener("focus", () => on(true));
  pin.addEventListener("blur", () => on(false));
  note.addEventListener("pointerenter", () => on(true));
  note.addEventListener("pointerleave", () => on(false));
});

// ---- the viewing request: composed as an email to the concierge ----
const form = document.getElementById("book");
const msg = form.querySelector(".book__msg");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  let ok = true;
  for (const id of ["f-name", "f-contact"]) {
    const f = document.getElementById(id);
    const bad = !f.value.trim();
    f.closest(".field").classList.toggle("is-bad", bad);
    if (bad) ok = false;
  }
  if (!ok) {
    msg.classList.remove("is-ok");
    msg.textContent = "Add your name and an email or phone number so the concierge can reply.";
    return;
  }
  const v = (id) => document.getElementById(id).value.trim();
  const body = [`Name: ${v("f-name")}`, `Email or phone: ${v("f-contact")}`, `Where: ${v("f-where")}`, `Piece: ${v("f-piece")}`, "", v("f-note")].join("\n");
  location.href = `mailto:concierge@silavu.com?subject=${encodeURIComponent("A private viewing")}&body=${encodeURIComponent(body)}`;
  msg.classList.add("is-ok");
  msg.textContent = "Your email app has the request ready. Send it and a concierge will reply.";
});

if (import.meta.env.DEV) { window.__lenis = lenis; window.__ST = ScrollTrigger; window.__bgv = bgVideo; }
