const BASE = import.meta.env.BASE_URL;
const PHONE = matchMedia("(max-width: 760px)").matches;
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

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

// ---- the collection rail ----
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

const arrows = document.querySelectorAll(".arrow");
const step = () => track.querySelector(".card").offsetWidth + 24;
arrows.forEach((b) => b.addEventListener("click", () => track.scrollBy({ left: +b.dataset.dir * step() * 2, behavior: REDUCED ? "auto" : "smooth" })));
const syncArrows = () => {
  arrows[0].disabled = track.scrollLeft < 4;
  arrows[1].disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 4;
};
track.addEventListener("scroll", syncArrows, { passive: true });
syncArrows();

// the two large pictures open their piece in the rail
document.querySelectorAll(".duo__item").forEach((a) => a.addEventListener("click", () => {
  const card = document.getElementById(`piece-${a.dataset.piece}`);
  if (card) track.scrollTo({ left: card.offsetLeft - track.offsetLeft - parseFloat(getComputedStyle(track).paddingLeft), behavior: "auto" });
}));

// ---- films: the right cut for the screen, loaded when near, only the one in view plays ----
const films = [...document.querySelectorAll("video.film")];
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

// ---- a light fade as sections arrive ----
document.querySelectorAll(".duo__item, .card, .row, .lumiere__film").forEach((el) => el.classList.add("rv"));
const rio = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  e.target.classList.add("is-in");
  rio.unobserve(e.target);
}), { rootMargin: "0px 0px -8% 0px" });
document.querySelectorAll(".rv").forEach((el) => rio.observe(el));

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
