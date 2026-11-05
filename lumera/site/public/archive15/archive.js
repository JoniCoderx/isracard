/* Up close · the private archive (test14): the live layer over the rendered drawer.
   The drawer is a Blender render (website/tools/archive-drawer.py, path traced). Over it, with the render's own
   camera (archive15/open-*.json), its own reflections (an HDR panorama taken inside the drawer) and its own spot
   for the shadows, this module draws everything that lies in the drawer: the jewellery in true 3D, built from the
   house's exact mark and pavé maps, and the prints from the house's photographs. Everything it draws comes from
   archive15/config.json, so a piece, a print, a name or a link changes there alone.
   Units: the scene is in metres like the render; the drawer's floor is a group in millimetres (x right, y towards
   the back, z up), whose origin is the floor's centre. */
import * as T from "../vendor14/three.module.min.js";
import { RGBELoader } from "../vendor14/RGBELoader.js";

const J = u => fetch(u).then(r => { if (!r.ok) throw new Error(u); return r.json(); });

/* ── the house's mark as shapes, from its path (y as drawn, downwards) ── */
function markShapes(d, map) {
  const sp = new T.ShapePath(), tok = d.match(/[MCLZ]|-?\d*\.?\d+(?:e-?\d+)?/gi); let i = 0, cmd = "";
  const n2 = () => { const a = map(parseFloat(tok[i]), parseFloat(tok[i + 1])); i += 2; return a; };
  while (i < tok.length) {
    if (/[MCLZ]/i.test(tok[i])) cmd = tok[i++].toUpperCase();
    if (cmd === "M") { const m = n2(); sp.moveTo(m[0], m[1]); cmd = "L"; }
    else if (cmd === "L") { const l = n2(); sp.lineTo(l[0], l[1]); }
    else if (cmd === "C") { const a = n2(), b = n2(), c = n2(); sp.bezierCurveTo(a[0], a[1], b[0], b[1], c[0], c[1]); }
    else if (cmd === "Z") { const cp = sp.currentPath; if (cp && cp.curves.length) { const s0 = cp.curves[0].getPoint(0), pe = cp.currentPoint; if (s0.distanceTo(pe) > 1e-4) sp.lineTo(s0.x, s0.y); } cmd = ""; }
    else i++;
  }
  return sp.toShapes(T.ShapeUtils.isClockWise(sp.subPaths[0].getPoints()));
}

/* a round brilliant, one unit across: table, crown, girdle, pavilion, flat facets; table up (+z) */
function brilliant() {
  const N = 16, pos = [], tb = .56, ch = .3, pd = .86, gi = .03, at = (r, a, z) => [Math.cos(a) * r, Math.sin(a) * r, z], tr = p => pos.push(p[0], p[1], p[2]);
  for (let k = 0; k < N; k++) { const a0 = k / N * Math.PI * 2, a1 = (k + 1) / N * Math.PI * 2, am = (a0 + a1) / 2;
    tr([0, 0, ch]); tr(at(tb, a0, ch)); tr(at(tb, a1, ch));
    tr(at(tb, a0, ch)); tr(at(1, a0, gi)); tr(at(1, am, gi)); tr(at(tb, a0, ch)); tr(at(1, am, gi)); tr(at(tb, a1, ch));
    tr(at(tb, a1, ch)); tr(at(1, am, gi)); tr(at(1, a1, gi));
    tr(at(1, a0, gi)); tr(at(1, a0, -gi)); tr(at(1, a1, -gi)); tr(at(1, a0, gi)); tr(at(1, a1, -gi)); tr(at(1, a1, gi));
    tr(at(1, a0, -gi)); tr([0, 0, -pd]); tr(at(1, a1, -gi)); }
  const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
}
const Z = new T.Vector3(0, 0, 1);

/* ── SOUL: the pendant lying face up (as the Blender model: 20 mm tall, 1.6 mm deep, pavé set between beads) ── */
function soul(D, M, BRIL) {
  const S = .02, MW = D.W, DEPTH = 1.6, BT = .22, P = (x, y) => [(x - MW / 2) * S, (500 - y) * S];
  const g = new T.Group();
  const geo = new T.ExtrudeGeometry(markShapes(D.mark, P), { depth: DEPTH - 2 * BT, bevelEnabled: true, bevelThickness: BT, bevelSize: .13, bevelOffset: -.05, bevelSegments: 6, curveSegments: 6 });
  geo.translate(0, 0, BT); geo.computeVertexNormals();
  const body = new T.Mesh(geo, M.gold); body.castShadow = true; g.add(body);
  const st = new T.InstancedMesh(BRIL, M.dia, D.pave.length), m = new T.Matrix4(), q = new T.Quaternion(), v = new T.Vector3(), s = new T.Vector3();
  let seed = 7; const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  D.pave.forEach((p, k) => { const c = P(p[0], p[1]), dd = p[2] * S * 2 * .98; q.setFromAxisAngle(Z, rnd() * Math.PI); m.compose(v.set(c[0], c[1], DEPTH - .06 * dd), q, s.setScalar(dd / 2)); st.setMatrixAt(k, m); });
  g.add(st);
  const beads = [];
  for (let b = 1; b < D.pave.length; b++) { const A = D.pave[b - 1], B = D.pave[b]; if (Math.hypot(B[0] - A[0], B[1] - A[1]) > 1.6 * (A[2] + B[2])) continue;
    const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, an = Math.atan2(B[1] - A[1], B[0] - A[0]), off = (A[2] + B[2]) / 2 * .86, br = Math.max(.035, (A[2] + B[2]) / 2 * S * .2);
    for (const sg of [1, -1]) { const c = P(mx - Math.sin(an) * off * sg, my + Math.cos(an) * off * sg); beads.push([c[0], c[1], DEPTH + br * .15, br]); } }
  const bd = new T.InstancedMesh(new T.SphereGeometry(1, 10, 8), M.gold, beads.length);
  beads.forEach((b, k) => { m.compose(v.set(b[0], b[1], b[2]), q.identity(), s.setScalar(b[3])); bd.setMatrixAt(k, m); }); g.add(bd);
  const rings = D.rings.map(r => { const c = P(r[0], r[1]); return new T.Vector3(c[0], c[1], DEPTH / 2); });
  const jr = new T.TorusGeometry(.62, .13, 10, 28);
  rings.forEach((p, k) => { const o = new T.Mesh(jr, M.gold); o.position.copy(p); o.position.z = .75; o.rotation.set(0, 0, (k ? -1 : 1) * .6); o.castShadow = true; g.add(o); });
  g.userData.rings = rings;
  return g;
}

/* the cable chain lying on the suede along a curve: links alternately flat and on edge, a quarter turn apart, with
   the two bezel-set stations of the house's chain at 24 and 56 mm from the pendant */
function chainOnFloor(points, M, BRIL) {
  const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(p[0], p[1], 0)), false, "centripetal"), L = curve.getLength();
  const LINK = new T.TorusGeometry(.42, .13, 8, 20); LINK.scale(1.42, 1, 1);
  const n = Math.floor(L / 1.18), links = new T.InstancedMesh(LINK, M.gold, n), g = new T.Group();
  const m = new T.Matrix4(), q = new T.Quaternion(), q2 = new T.Quaternion(), v = new T.Vector3(), t = new T.Vector3(), s = new T.Vector3(1, 1, 1), X = new T.Vector3(1, 0, 0);
  let li = 0; const stations = [];
  for (let k = 0; k < n; k++) { const d = .9 + k * 1.18; if (d > L) break; const u = d / L;
    if (Math.abs(d - 24) < 1.3 || Math.abs(d - 56) < 1.3) { if (Math.abs(d - 24) < .6 || Math.abs(d - 56) < .6) stations.push(curve.getPointAt(u)); continue; }
    curve.getPointAt(u, v); curve.getTangentAt(u, t); t.z = 0; t.normalize();
    q.setFromUnitVectors(X, t); const edge = k % 2 === 1; if (edge) q.multiply(q2.setFromAxisAngle(X, Math.PI / 2));
    v.z = edge ? .55 : .13; m.compose(v, q, s); links.setMatrixAt(li++, m); }
  links.count = li; links.castShadow = true; g.add(links);
  const cupG = new T.CylinderGeometry(1, 1, .9, 32, 1, true); cupG.rotateX(Math.PI / 2);
  stations.forEach(p => { const c = new T.Mesh(cupG, M.gold); c.position.set(p.x, p.y, .45); c.castShadow = true; g.add(c);
    const st = new T.Mesh(BRIL, M.dia); st.scale.setScalar(.78); st.position.set(p.x, p.y, .82); g.add(st); });
  return g;
}

/* ── ICON: the ring as /test4/'s model makes it (the mark bent onto a fine round band, its strands set, the band's
   front half set), then laid down as a ring rests: on its band and the edge of its head, the head facing up ── */
function icon(D, PAVE, M, BRIL) {
  const RC = 9.4, RW = .8, RTOP = RC + RW, L = 11.2, S = L / 1000, MW = D.W, DEPTH = 1.0;
  const g = new T.Group(), inner = new T.Group(); g.add(inner);
  const bend = (u, v, w, out) => { const th = u / RTOP, r = RTOP + w; return out.set(v, r * Math.cos(th), r * Math.sin(th)); };
  const mg = new T.ExtrudeGeometry(markShapes(D.mark, (x, y) => [x, y]), { depth: DEPTH / S, bevelEnabled: true, bevelThickness: .16 / S, bevelSize: .1 / S, bevelSegments: 3, curveSegments: 4 });
  { const p = mg.attributes.position, t = new T.Vector3();
    for (let i = 0; i < p.count; i++) { bend((500 - p.getY(i)) * S, (p.getX(i) - MW / 2) * S, p.getZ(i) * S - .15, t); p.setXYZ(i, t.x, t.y, t.z); }
    mg.computeVertexNormals(); }
  const mark = new T.Mesh(mg, M.gold); mark.castShadow = true; inner.add(mark);
  const th0 = (L / 2 - .6) / RTOP;
  const half = sg => { const pts = []; for (let i = 0; i <= 120; i++) { const th = sg * (th0 + (Math.PI - th0) * i / 120); pts.push(new T.Vector3(0, RC * Math.cos(th), RC * Math.sin(th))); } return new T.TubeGeometry(new T.CatmullRomCurve3(pts), 120, RW, 20, false); };
  const bands = [half(1), half(-1)].map(gg => { const b = new T.Mesh(gg, M.gold); b.castShadow = true; inner.add(b); return b; });
  const st = [], up = new T.Vector3(), pos = new T.Vector3();
  PAVE.forEach(([x, y, r]) => { const u = (500 - y) * S, v = (x - MW / 2) * S, d = r * S * 2 * .96; bend(u, v, DEPTH + .02 - d * .18, pos); up.set(0, Math.cos(u / RTOP), Math.sin(u / RTOP)); st.push([pos.clone(), up.clone(), d]); });
  for (const sg of [1, -1]) for (let th = th0 + .13; th < th0 + 1.45; th += (1.12 * 1.06) / (RC + RW)) { const a = sg * th; up.set(0, Math.cos(a), Math.sin(a)); st.push([up.clone().multiplyScalar(RC + RW * .86), up.clone(), 1.12]); }
  const inst = new T.InstancedMesh(BRIL, M.dia, st.length), m = new T.Matrix4(), q = new T.Quaternion(), s = new T.Vector3();
  st.forEach(([p, nrm, d], k) => { q.setFromUnitVectors(Z, nrm); m.compose(p, q, s.setScalar(d / 2)); inst.setMatrixAt(k, m); }); inner.add(inst);
  /* laid down: axis upright with the head towards the viewer (-y), then tipped about x until the head's lower edge
     and the far side of the band both touch the floor */
  inner.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3(0, 0, 1), new T.Vector3(0, -1, 0), new T.Vector3(1, 0, 0)));
  const lowest = (meshes, tilt) => { const R = new T.Matrix4().makeRotationX(tilt).multiply(new T.Matrix4().makeRotationFromQuaternion(inner.quaternion)), v = new T.Vector3(); let lo = Infinity;
    meshes.forEach(me => { const p = me.geometry.attributes.position; for (let i = 0; i < p.count; i += 3) { v.fromBufferAttribute(p, i).applyMatrix4(R); if (v.z < lo) lo = v.z; } }); return lo; };
  let a0 = -1.2, a1 = 0;
  for (let it = 0; it < 30; it++) { const a = (a0 + a1) / 2, dk = lowest([mark], a) - lowest(bands, a); if (dk < 0) a1 = a; else a0 = a; }
  const tilt = (a0 + a1) / 2; g.userData.tilt = tilt;
  const tg = new T.Group(); tg.rotation.x = tilt; g.remove(inner); tg.add(inner); g.add(tg);
  const lo = Math.min(lowest([mark], tilt), lowest(bands, tilt)); tg.position.z = -lo;
  return g;
}

/* ── a print: an editorial instant print (54 x 86 mm card, 46 x 62 mm picture), the house's photograph, its caption ── */
function printCard(p, font, maxAniso) {
  const W = 54, H = 86, k = 12, cv = document.createElement("canvas"); cv.width = W * k; cv.height = H * k;
  const c = cv.getContext("2d");
  c.fillStyle = "#e9e1d2"; c.fillRect(0, 0, cv.width, cv.height);
  const id = c.getImageData(0, 0, cv.width, cv.height), dd = id.data; for (let i = 0; i < dd.length; i += 4) { const n = (Math.random() - .5) * 7; dd[i] += n; dd[i + 1] += n; dd[i + 2] += n; } c.putImageData(id, 0, 0);
  const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = maxAniso;
  const img = new Image(); img.decoding = "async"; img.src = p.img;
  const ready = img.decode().then(() => {
    const px = 4 * k, py = 6.5 * k, pw = 46 * k, ph = 62 * k, r = Math.max(pw / img.naturalWidth, ph / img.naturalHeight), sw = pw / r, sh = ph / r;
    c.filter = "contrast(1.14) saturate(1.12) brightness(.97)"; c.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) * .3, sw, sh, px, py, pw, ph); c.filter = "none";
    c.strokeStyle = "rgba(60,45,30,.18)"; c.lineWidth = 2; c.strokeRect(px, py, pw, ph);
    c.fillStyle = "#231c16"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = `400 ${2.5 * k}px ${font}`;
    try { c.letterSpacing = `${.62 * k}px`; } catch (e) {}
    c.fillText(p.caption, cv.width / 2 + .31 * k, 77.5 * k);
    tex.needsUpdate = true; });
  const geo = new T.BoxGeometry(W, H, .3, 1, 24, 1), pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / (H / 2); pos.setZ(i, pos.getZ(i) + .55 * Math.pow(Math.abs(y), 3) + (p.lift || 0) * (.5 - y / 2)); }
  geo.computeVertexNormals();
  const edge = new T.MeshStandardMaterial({ color: 0xece5d7, roughness: .7 });
  const face = new T.MeshPhysicalMaterial({ map: tex, roughness: .5, clearcoat: .3, clearcoatRoughness: .3, envMapIntensity: .8 });
  const mesh = new T.Mesh(geo, [edge, edge, edge, edge, face, edge]); mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.position.z = .15; mesh.userData.ready = ready;
  return mesh;
}

/* a soft contact shadow, drawn on the suede under a piece */
function blob(w, h, a) {
  const cv = document.createElement("canvas"); cv.width = cv.height = 128; const c = cv.getContext("2d"), gr = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, `rgba(10,6,3,${a})`); gr.addColorStop(.55, `rgba(10,6,3,${a * .45})`); gr.addColorStop(1, "rgba(10,6,3,0)"); c.fillStyle = gr; c.fillRect(0, 0, 128, 128);
  const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv), transparent: true, depthWrite: false, toneMapped: false }));
  m.position.z = .03; m.renderOrder = -1; return m;
}

export async function mount(stage, opts = {}) {
  const cfg = await J("archive15/config.json"), key = opts.scene || "d", SC = cfg.scenes[key];
  const [meta, D, PAVE, hdr] = await Promise.all([J(SC.meta), J("craft15/soul.json"), J("archive15/icon-pave.json"), new RGBELoader().loadAsync(SC.env)]);

  const cv = document.createElement("canvas"); cv.className = "ar15gl"; stage.appendChild(cv);
  const r = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
  r.setClearColor(0x000000, 0); r.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  r.toneMapping = T.AgXToneMapping; r.toneMappingExposure = cfg.exposure || 1; r.outputColorSpace = T.SRGBColorSpace;
  r.shadowMap.enabled = true; r.shadowMap.type = T.PCFShadowMap;
  const scene = new T.Scene();
  hdr.mapping = T.EquirectangularReflectionMapping;
  const pm = new T.PMREMGenerator(r); scene.environment = pm.fromEquirectangular(hdr).texture; pm.dispose(); hdr.dispose();

  /* Blender (z up) to three.js (y up) */
  const B = a => new T.Vector3(a[0], a[2], -a[1]);
  const cam = new T.PerspectiveCamera(30, meta.res[0] / meta.res[1], .01, 10);
  { const M4 = new T.Matrix4().set(...meta.cam.flat()), C = new T.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1);
    C.multiply(M4).decompose(cam.position, cam.quaternion, cam.scale);
    const [W, H] = meta.res, half = Math.atan(meta.sensor / 2 / meta.lens);
    cam.fov = (W >= H ? 2 * Math.atan(Math.tan(half) * H / W) : 2 * half) * 180 / Math.PI; cam.updateProjectionMatrix(); }

  /* the spot the render was lit by, for the shadows the pieces cast (and a little direct light on them) */
  const sp = meta.spot, spot = new T.SpotLight(new T.Color(...sp.color), sp.w / (4 * Math.PI) * (cfg.spot || 1), 0, sp.angle / 2, 1, 2);
  spot.position.copy(B(sp.pos)); spot.target.position.copy(B(sp.target)); scene.add(spot); scene.add(spot.target);
  spot.castShadow = true; spot.shadow.mapSize.set(2048, 2048); spot.shadow.camera.near = .2; spot.shadow.camera.far = 1.5; spot.shadow.bias = -.00002; spot.shadow.normalBias = .00002; spot.shadow.radius = 5;

  /* the drawer's floor, in millimetres */
  const F = meta.floor, floor = new T.Group(); floor.position.copy(B([F.x, F.y, F.z])); floor.rotation.x = -Math.PI / 2; floor.scale.setScalar(.001); scene.add(floor);
  const catcher = new T.Mesh(new T.PlaneGeometry(F.w * 1000, F.d * 1000), new T.ShadowMaterial({ color: 0x140c06, opacity: .5 })); catcher.receiveShadow = true; catcher.position.z = .01; floor.add(catcher);

  const M = { gold: new T.MeshPhysicalMaterial({ color: 0xe8e4dc, metalness: 1, roughness: .14, clearcoat: .3, clearcoatRoughness: .1, envMapIntensity: 1.1 }),
    dia: new T.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: .015, envMapIntensity: 2.6, flatShading: true }) };
  const BRIL = brilliant(), targets = [];
  const font = getComputedStyle(document.body).fontFamily || "Jost, sans-serif";
  const he = () => document.documentElement.getAttribute("data-lang") === "he";

  for (const p of cfg.pieces) {
    const g = new T.Group(); g.position.set(p.at[0], p.at[1], 0); g.rotation.z = (p.turn || 0) * Math.PI / 180; floor.add(g);
    if (p.model === "soul") {
      const s = soul(D, M, BRIL); g.add(s); g.add(Object.assign(blob(30, 30, .5), {}));
      /* the chain: from each jump ring, through the points the config gives (in the floor's frame) */
      floor.updateMatrixWorld(true);
      (p.chain || []).forEach((pts, k) => { const ring = s.userData.rings[k].clone(); g.updateMatrix(); ring.applyMatrix4(g.matrix);
        floor.add(chainOnFloor([[ring.x, ring.y]].concat(pts), M, BRIL)); });
    } else if (p.model === "icon") { g.add(icon(D, PAVE, M, BRIL)); g.add(blob(26, 16, .55)); }
    g.traverse(o => { o.userData.piece = p; });
    targets.push(g);
  }
  const prints = [];
  for (const pr of cfg.prints) { const m = printCard(pr, font, r.capabilities.getMaxAnisotropy()); m.position.x = pr.at[0]; m.position.y = pr.at[1]; m.rotation.z = (pr.turn || 0) * Math.PI / 180; m.userData.print = pr; floor.add(m); prints.push(m);
    const sh = blob(62, 94, .35); sh.position.set(pr.at[0] + 1.2, pr.at[1] - 1.6, .02); sh.rotation.z = m.rotation.z; floor.add(sh); }

  /* ── size: the render covers the stage (object-fit: cover), and the camera crops exactly as the picture does ── */
  let W = 0, H = 0;
  function size() { const b = stage.getBoundingClientRect(); if (!b.width) return; W = b.width; H = b.height; r.setSize(W, H, false);
    const [iw, ih] = meta.res, k = Math.max(W / iw, H / ih), fw = iw * k, fh = ih * k;
    cam.aspect = iw / ih; cam.setViewOffset(fw, fh, (fw - W) / 2, (fh - H) / 2, W, H); cam.updateProjectionMatrix(); draw(); }
  let raf = 0; function draw() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; r.render(scene, cam); }); }

  /* ── hover: the piece's name, and a little more light on it ── */
  const tag = document.createElement("div"); tag.className = "ar15tag"; tag.setAttribute("aria-hidden", "true"); stage.appendChild(tag);
  const ray = new T.Raycaster(), ndc = new T.Vector2(); let hot = null;
  function pick(e) { const b = cv.getBoundingClientRect(); ndc.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1); ray.setFromCamera(ndc, cam);
    const hit = ray.intersectObjects(targets, true)[0]; return hit ? hit.object.userData.piece : null; }
  cv.addEventListener("pointermove", e => { const p = pick(e); if (p === hot) return; hot = p; cv.style.cursor = p ? "pointer" : "";
    if (p) { const g = targets.find(t => t.userData.piece === p), v = new T.Vector3(); g.getWorldPosition(v); v.project(cam);
      tag.innerHTML = `<b>${p.name}</b><span>${he() ? p.kind.he : p.kind.en}</span>`; tag.style.left = ((v.x + 1) / 2 * W) + "px"; tag.style.top = ((1 - v.y) / 2 * H) + "px"; tag.classList.add("on"); }
    else tag.classList.remove("on"); });
  cv.addEventListener("pointerleave", () => { hot = null; tag.classList.remove("on"); });
  cv.addEventListener("click", e => { const p = pick(e); if (p && p.href) location.href = p.href; });

  addEventListener("resize", size); size();
  await Promise.all(prints.map(m => m.userData.ready.catch(() => {})));
  draw();
  return { draw, scene, cam, renderer: r };
}
