import Lenis from "lenis";

const BASE = import.meta.env.BASE_URL;
const PHONE = matchMedia("(max-width: 760px)").matches;
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;

const PIECES = [
  { id: "soul", name: "SOUL", type: "Pendant", img: "necklace-front", alt: "worn/necklace-worn-900",
    line: "The knot of the house, pavé-set in 18K white gold, on a chain with diamond stations." },
  { id: "silavu", name: "SILAVU", type: "Ring", img: "ring-front", alt: "worn/ring-worn-900",
    line: "The knot as a pavé crown, on a band set all the way round." },
  { id: "knot", name: "KNOT", type: "Bracelet", img: "knot-flat", alt: "worn/knot-worn-900",
    line: "The polished knot, unset, on a fine chain with the engraved house tag." },
  { id: "aura", name: "AURA", type: "Earrings", img: "aura-pair", alt: "worn/aura-worn-900",
    line: "The knot as pavé studs, sized to sit close to the ear." },
  { id: "echo", name: "ECHO", type: "Earrings", img: "echo-pair", alt: "p/necklace-macro-900",
    line: "AURA's smaller twin, for every day." },
  { id: "cadence", name: "CADENCE", type: "Line bracelet", img: "cadence-front", alt: "worn/cadence-worn-900",
    line: "Emerald-cut diamonds between trios of round brilliants, in 18K white gold." },
  { id: "blush", name: "BLUSH", type: "Eternity ring", img: "blush-front", alt: "worn/blush-worn-900",
    line: "Cushion-cut pink stones all the way round, in 18K rose gold." },
  { id: "promise", name: "PROMISE", type: "Band", img: "promise-front", alt: "p/promise-macro-900",
    line: "A sculpted wave of 18K yellow gold holding one baguette diamond." },
];

// ---- the collection ----
const track = document.querySelector(".rail__track");
const pieceSelect = document.getElementById("f-piece");
track.innerHTML = PIECES.map((p) => `
  <li class="card" id="piece-${p.id}">
    <span class="card__img">
      <img src="${BASE}img/p/${p.img}-900.jpg" alt="${p.name} ${p.type.toLowerCase()}" loading="lazy" width="900" height="900" />
      <img class="alt" src="${BASE}img/${p.alt}.jpg" alt="" loading="lazy" width="900" height="900" />
    </span>
    <span class="card__name">${p.name}</span>
    <span class="card__type">${p.type}</span>
    <span class="card__line">${p.line}</span>
    <a class="txt" href="#appointment" data-piece="${p.id}">Book a viewing</a>
  </li>`).join("");
pieceSelect.insertAdjacentHTML("beforeend", PIECES.map((p) => `<option value="${p.id}">${p.name} · ${p.type}</option>`).join(""));
track.addEventListener("click", (e) => {
  const a = e.target.closest("[data-piece]");
  if (a) pieceSelect.value = a.dataset.piece;
});

// ---- the intro sentence, one span per word ----
const line = document.querySelector(".intro__line");
line.innerHTML = line.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
const words = [...line.querySelectorAll(".w")];

// ---- smooth wheel on desktop; touch keeps the phone's own scrolling ----
let lenis = null;
if (FINE && !REDUCED) {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}
document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
  const id = a.getAttribute("href");
  const el = id === "#top" ? 0 : document.querySelector(id);
  if (el === null) return;
  e.preventDefault();
  const hd = document.querySelector(".hd").offsetHeight;
  if (lenis) lenis.scrollTo(el, { offset: id === "#top" ? 0 : -hd, duration: 1.6 });
  else scrollTo({ top: id === "#top" ? 0 : el.getBoundingClientRect().top + scrollY - hd, behavior: REDUCED ? "auto" : "smooth" });
}));

// ---- the scroll engine: each effect maps a scroll range to 0..1 and writes only when that changes ----
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const fx = [];
// range(top, height, vh) -> [start, end] in page scroll pixels
const add = (el, range, fn) => { if (el) fx.push({ el, range, fn, s: 0, e: 1, last: -1 }); };
const pageTop = (el) => el.getBoundingClientRect().top + scrollY;
let vh = innerHeight;
function measure() {
  vh = innerHeight;
  const rail = document.querySelector(".rail");
  // the collection is as tall as it takes to slide the whole track past
  rail.style.height = `${vh + Math.max(0, track.scrollWidth - innerWidth) + vh * 0.25}px`;
  for (const f of fx) { const t = pageTop(f.el); [f.s, f.e] = f.range(t, f.el.offsetHeight, vh); f.last = -1; }
}
function update(y) {
  for (const f of fx) {
    const p = clamp((y - f.s) / (f.e - f.s || 1));
    if (Math.abs(p - f.last) < 0.0005) continue;
    f.last = p; f.fn(p);
  }
}

if (!REDUCED) {
  // the opening: the film recedes into a frame and SOUL rises beneath it
  const frame = document.querySelector(".hero__frame"), title = document.querySelector(".hero__title"), cue = document.querySelector(".hero__cue");
  const endScale = 0.6;
  add(document.querySelector(".hero"), (t, h, v) => [t, t + h - v], (p) => {
    const k = ease(clamp(p / 0.8));
    frame.style.transform = `translateY(${(-k * (PHONE ? 9 : 6)).toFixed(2)}%) scale(${(1 - (1 - endScale) * k).toFixed(4)})`;
    cue.style.opacity = (1 - clamp(p * 6)).toFixed(3);
    const t2 = clamp((p - 0.45) / 0.4);
    title.style.opacity = t2.toFixed(3);
    title.style.transform = `translateY(${((1 - t2) * 40).toFixed(1)}px)`;
  });

  // the sentence lights word by word
  add(document.querySelector(".intro"), (t, h, v) => [t - v * 0.2, t + h - v * 1.15], (p) => {
    const n = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle("on", i < n));
  });

  // pictures drift a little slower than the page
  document.querySelectorAll(".px").forEach((img) => {
    const box = img.parentElement, amp = img.closest(".duo__item--low") ? 9 : 6;
    add(box, (t, h, v) => [t - v, t + h], (p) => { img.style.transform = `translate3d(0, ${((p - 0.5) * 2 * amp).toFixed(2)}%, 0)`; });
  });

  // the collection slides sideways while the section is pinned
  const bar = document.querySelector(".rail__bar span");
  add(document.querySelector(".rail"), (t, h, v) => [t, t + h - v], (p) => {
    const dist = Math.max(0, track.scrollWidth - innerWidth);
    const k = clamp(p / 0.92);
    track.style.transform = `translate3d(${(-k * dist).toFixed(1)}px, 0, 0)`;
    bar.style.transform = `scaleX(${k.toFixed(4)})`;
  });

  // LUMIÈRE: the window opens to the whole screen, then the words arrive
  const lf = document.querySelector(".lumiere__film"), lv = lf.querySelector(".film"), lt = document.querySelector(".lumiere__txt"), ls = document.querySelector(".lumiere__stage");
  const [iy, ix] = PHONE ? [18, 20] : [22, 36];
  add(document.querySelector(".lumiere"), (t, h, v) => [t - v * 0.3, t + h - v], (p) => {
    const k = ease(clamp(p / 0.7));
    lf.style.clipPath = `inset(${((1 - k) * iy).toFixed(2)}% ${((1 - k) * ix).toFixed(2)}% ${((1 - k) * iy).toFixed(2)}% ${((1 - k) * ix).toFixed(2)}%)`;
    lv.style.transform = `scale(${(1.18 - 0.18 * k).toFixed(4)})`;
    const t2 = clamp((p - 0.66) / 0.24);
    lt.style.opacity = t2.toFixed(3);
    lt.style.transform = `translateY(${((1 - t2) * 30).toFixed(1)}px)`;
    ls.style.setProperty("--shade", t2.toFixed(3));
  });

  // the house name moves across as the page passes
  const band = document.querySelector(".band__line");
  add(document.querySelector(".band"), (t, h, v) => [t - v, t + h], (p) => { band.style.transform = `translate3d(${(-p * 38).toFixed(2)}%, 0, 0)`; });

  // pictures open like a curtain when they arrive
  document.querySelectorAll(".duo__img, .row__img").forEach((el) => el.classList.add("reveal"));
  const rio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("is-in");
    rio.unobserve(e.target);
  }), { rootMargin: "0px 0px -12% 0px" });
  document.querySelectorAll(".reveal").forEach((el) => rio.observe(el));

  let ticking = false;
  const onScroll = () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; update(scrollY); }); };
  if (lenis) lenis.on("scroll", ({ scroll }) => update(scroll));
  else addEventListener("scroll", onScroll, { passive: true });
  let rt;
  const remeasure = () => { measure(); update(lenis ? lenis.scroll : scrollY); };
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(remeasure, 150); });
  addEventListener("load", remeasure);
  document.fonts?.ready.then(remeasure);
  remeasure();
}

// ---- films: the right cut for the screen, loaded when near, only the one in view plays ----
const films = [...document.querySelectorAll("video.film")];
films.forEach((v) => { if (PHONE && v.dataset.posterV) v.poster = BASE + v.dataset.posterV; });
const ratio = new Map();
// visibility is judged on each film's stage: the LUMIÈRE window is clipped, which would hide most of the video from the observer
const stageOf = (v) => v.closest(".hero__stage, .lumiere__stage") || v;
const near = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  const v = e.target.querySelector("video.film") || e.target;
  v.src = BASE + (PHONE ? v.dataset.srcV : v.dataset.src);
  v.preload = "auto";
  near.unobserve(e.target);
}), { rootMargin: "100% 0px" });
const seen = new IntersectionObserver((es) => {
  es.forEach((e) => ratio.set(e.target.querySelector("video.film") || e.target, e.intersectionRatio));
  let best = null, r = 0;
  ratio.forEach((v, k) => { if (v > r) { r = v; best = k; } });
  films.forEach((v) => {
    if (v === best && r > 0.25 && !REDUCED) { if (v.paused && v.src) v.play().catch(() => {}); }
    else if (!v.paused) v.pause();
  });
}, { threshold: [0, 0.25, 0.5, 0.75, 1] });
films.forEach((v) => {
  near.observe(stageOf(v)); seen.observe(stageOf(v));
  v.addEventListener("loadeddata", () => { if (ratio.get(v) > 0.25 && !REDUCED) v.play().catch(() => {}); }, { once: true });
});

// ---- the appointment request: composed as an email to the concierge ----
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
  const piece = pieceSelect.options[pieceSelect.selectedIndex].text;
  const body = [`Name: ${v("f-name")}`, `Email or phone: ${v("f-contact")}`, `Where: ${v("f-where")}`, `Piece: ${piece}`, "", v("f-note")].join("\n");
  location.href = `mailto:concierge@silavu.com?subject=${encodeURIComponent("An appointment")}&body=${encodeURIComponent(body)}`;
  msg.classList.add("is-ok");
  msg.textContent = "Your email app has the request ready. Send it and a concierge will reply.";
});

if (import.meta.env.DEV) window.__lenis = lenis;
