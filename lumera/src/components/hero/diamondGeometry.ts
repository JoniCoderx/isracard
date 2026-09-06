import * as THREE from "three";

/**
 * Procedural round-brilliant geometry.
 * Table fan + crown (star/bezel scallops) + girdle + pavilion (lower-girdle + mains to culet).
 * Use with material.flatShading = true for real facet flashes.
 */
export function brilliantGeometry(N = 16) {
  const rTable = 0.5;
  const rGirdle = 1.0;
  const crownH = 0.46;
  const pavD = 1.28;

  const verts: number[] = [];
  const idx: number[] = [];
  const push = (x: number, y: number, z: number) => {
    verts.push(x, y, z);
    return verts.length / 3 - 1;
  };
  const ang = (i: number) => (i / N) * Math.PI * 2;
  const half = Math.PI / N;

  const cTop = push(0, crownH, 0);
  const T: number[] = [];
  const G: number[] = []; // girdle at vertex angles
  const Gm: number[] = []; // crown scallop peaks at half angles
  const P: number[] = []; // pavilion peaks at half angles
  const cBot = push(0, -pavD, 0);

  for (let i = 0; i < N; i++) {
    const a = ang(i);
    T[i] = push(Math.cos(a) * rTable, crownH, Math.sin(a) * rTable);
  }
  for (let i = 0; i < N; i++) {
    const a = ang(i);
    G[i] = push(Math.cos(a) * rGirdle, 0, Math.sin(a) * rGirdle);
  }
  for (let i = 0; i < N; i++) {
    const a = ang(i) + half;
    Gm[i] = push(Math.cos(a) * rGirdle * 0.99, 0.07, Math.sin(a) * rGirdle * 0.99);
  }
  for (let i = 0; i < N; i++) {
    const a = ang(i) + half;
    P[i] = push(Math.cos(a) * rGirdle * 0.4, -pavD * 0.52, Math.sin(a) * rGirdle * 0.4);
  }

  const tri = (a: number, b: number, c: number) => idx.push(a, b, c);

  // Table (flat top) — fan
  for (let i = 0; i < N; i++) tri(cTop, T[(i + 1) % N], T[i]);

  // Crown — star facet up to the scallop peak, plus two bezel facets
  for (let i = 0; i < N; i++) {
    const n = (i + 1) % N;
    tri(T[i], T[n], Gm[i]); // star facet
    tri(T[i], Gm[i], G[i]); // bezel left
    tri(Gm[i], T[n], G[n]); // bezel right
  }

  // Pavilion — lower-girdle scallops, main facets, and culet fan
  for (let i = 0; i < N; i++) {
    const n = (i + 1) % N;
    tri(G[i], P[i], G[n]); // lower girdle scallop
    tri(G[i], P[(i - 1 + N) % N], P[i]); // main facet side fill
    tri(P[i], cBot, P[n]); // to culet
  }

  const indexed = new THREE.BufferGeometry();
  indexed.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  indexed.setIndex(idx);
  // Non-indexed + recomputed normals => per-face (flat) normals => real facet flashes.
  const geo = indexed.toNonIndexed();
  geo.computeVertexNormals();
  geo.center();
  indexed.dispose();
  return geo;
}
