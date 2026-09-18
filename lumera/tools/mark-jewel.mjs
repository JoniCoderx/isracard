/* Build the SILAVU mark as a pave-set jewel, deterministically, from the very
   path the site draws. A generative model always redraws a logo — it produces
   something like the mark. This produces the mark: the silhouette IS the path,
   and the stones are laid inside it by point-in-path test, so the outline can
   never drift.

   Everything below works in device pixels with the scale baked into a
   transformed Path2D, because isPointInPath tests its point in untransformed
   canvas space while the path itself is under the CTM — leave a transform on
   the context and every test silently fails. */
import { chromium } from "playwright-core";
import { MARK, MARK_W } from "../site/src/body.mjs";

const out = process.argv[2];
const metal = process.argv[3] || "white";
const S = 4, W = Math.ceil(MARK_W), H = 1000, PAD = 20;

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 900, height: 1100 } });
await p.setContent(`<style>html,body{margin:0;background:transparent}canvas{display:block}</style><canvas id=c></canvas>`);
const n = await p.evaluate(([d, W, H, PAD, S, metal]) => {
  const c = document.getElementById("c");
  c.width = (W + PAD * 2) * S; c.height = (H + PAD * 2) * S;
  c.style.width = c.width / 4 + "px"; c.style.height = c.height / 4 + "px";
  const x = c.getContext("2d");
  const P = new Path2D();
  P.addPath(new Path2D(d), new DOMMatrix().translate(PAD * S, PAD * S).scaleSelf(S));

  const tone = metal === "yellow"
    ? { hi: "#fff7e2", lo: "#a97c2e", mid: "#e3bd6c", dk: "#6b4a16" }
    : { hi: "#ffffff", lo: "#9aa0ac", mid: "#dcdfe6", dk: "#5c616b" };

  /* THE METAL. A jewel is not a flat fill — it is a curved surface, so the
     gradient has to run across the ribbon rather than across the picture, and
     it needs a dark side. Two passes: a broad body gradient, then a narrow
     specular sweep along the diagonal the ribbon actually travels. */
  const g = x.createLinearGradient(0, 0, c.width * .75, c.height);
  g.addColorStop(0, tone.mid); g.addColorStop(.18, tone.hi); g.addColorStop(.34, tone.mid);
  g.addColorStop(.5, tone.lo); g.addColorStop(.66, tone.mid); g.addColorStop(.84, tone.hi);
  g.addColorStop(1, tone.lo);
  x.fillStyle = g; x.fill(P);

  /* THE EDGE. A dark wall painted just inside the silhouette gives the piece a
     thickness. Clip to the path and stroke it: half the stroke falls outside
     and is clipped away, leaving a clean inner band. */
  x.save(); x.clip(P);
  for (const [w, col, al] of [[26, tone.dk, .55], [13, tone.lo, .5], [5, tone.hi, .7]]) {
    x.lineWidth = w; x.strokeStyle = col; x.globalAlpha = al; x.stroke(P);
  }
  x.restore(); x.globalAlpha = 1;

  /* THE STONES. Real pave grades its stones: big down the middle of a wide
     band, smaller where the metal narrows. So for each seat, measure how far
     the edge is — push outward until the point leaves the path — and take the
     stone radius from that clearance rather than from a fixed number. */
  const clearance = (px, py, cap) => {
    let lo = 0, hi = cap;
    const ok = (r) => {
      for (let a = 0; a < 16; a++) {
        const t = a / 16 * Math.PI * 2;
        if (!x.isPointInPath(P, px + Math.cos(t) * r, py + Math.sin(t) * r)) return false;
      }
      return true;
    };
    if (!x.isPointInPath(P, px, py) || !ok(2)) return 0;
    for (let i = 0; i < 9; i++) { const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; }
    return lo;
  };

  const RMAX = 15 * S, RMIN = 3.4 * S, seats = [];
  const step = 9.6 * S;
  for (let row = 0, y = step * .5; y < c.height; row++, y += step * 0.866) {
    for (let px = (row % 2 ? step / 2 : 0); px < c.width; px += step) {
      const cl = clearance(px, py_(y), RMAX);
      if (cl < RMIN + 1.6 * S) continue;
      seats.push([px, y, Math.min(RMAX, cl - 1.5 * S)]);
    }
  }
  function py_(v) { return v; }

  /* drop the seats that overlap one already taken, biggest first, so the grid
     reads as set stones rather than as a mesh of colliding circles */
  seats.sort((A, B) => B[2] - A[2]);
  const kept = [];
  for (const s of seats) {
    let clash = false;
    for (const k of kept) {
      const dx = s[0] - k[0], dy = s[1] - k[1];
      if (Math.hypot(dx, dy) < (s[2] + k[2]) * 0.97) { clash = true; break; }
    }
    if (!clash) kept.push(s);
  }

  for (const [px, py, R] of kept) {
    // the seat the stone sits down into
    x.beginPath(); x.arc(px, py, R * 1.1, 0, 7); x.fillStyle = tone.dk; x.globalAlpha = .42; x.fill();
    x.globalAlpha = 1;
    // the stone: bright where the light is, and a dark crescent opposite it
    const sg = x.createRadialGradient(px - R * .36, py - R * .4, R * .06, px, py, R);
    sg.addColorStop(0, "#ffffff"); sg.addColorStop(.32, "#f7f9fd");
    sg.addColorStop(.62, "#dde2ec"); sg.addColorStop(.86, "#b3bac9"); sg.addColorStop(1, "#8f97a8");
    x.beginPath(); x.arc(px, py, R, 0, 7); x.fillStyle = sg; x.fill();
    // the table, and the facet lines that make it read as cut
    x.beginPath(); x.arc(px, py, R * .44, 0, 7); x.fillStyle = "rgba(255,255,255,.62)"; x.fill();
    x.lineWidth = Math.max(1, R * .07); x.strokeStyle = "rgba(255,255,255,.5)";
    for (let a = 0; a < 8; a++) {
      const t = a / 8 * Math.PI * 2 + .4;
      x.beginPath();
      x.moveTo(px + Math.cos(t) * R * .44, py + Math.sin(t) * R * .44);
      x.lineTo(px + Math.cos(t) * R * .95, py + Math.sin(t) * R * .95);
      x.stroke();
    }
    // the glint
    x.beginPath(); x.arc(px - R * .3, py - R * .34, R * .15, 0, 7);
    x.fillStyle = "rgba(255,255,255,.98)"; x.fill();
  }

  // the beads of metal that hold the stones down
  for (const [px, py, R] of kept) {
    for (let a = 0; a < 4; a++) {
      const t = a / 4 * Math.PI * 2 + Math.PI / 4;
      const qx = px + Math.cos(t) * R * 1.02, qy = py + Math.sin(t) * R * 1.02;
      if (!x.isPointInPath(P, qx, qy)) continue;
      const r = Math.max(1.4, R * .15);
      const bg = x.createRadialGradient(qx - r * .4, qy - r * .4, 0, qx, qy, r);
      bg.addColorStop(0, tone.hi); bg.addColorStop(1, tone.lo);
      x.beginPath(); x.arc(qx, qy, r, 0, 7); x.fillStyle = bg; x.fill();
    }
  }
  return kept.length;

}, [MARK, W, H, PAD, S, metal]);
await p.locator("#c").screenshot({ path: out, omitBackground: true });
console.log("wrote", out, "-", n, "stones");
await b.close();
