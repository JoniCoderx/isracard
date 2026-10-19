/* SOUL, one piece as the whole experience (/test5/): the SILAVU SOUL
   necklace modelled from the house's own geometry, for soul5-frames.mjs to
   render frame by frame (the page plays the frames).
   - The pendant is the exact symbol (body.mjs MARK), 20 mm tall, extruded
     1.6 mm with polished walls. Its pavé follows both strands and both
     crescents, each stone as wide as the metal at that point; the two small
     wedges are polished (mark-pave.py), as on the piece. Beads of metal hold
     each stone, between it and the next.
   - Every diamond is traced, not painted: each pixel follows its ray into
     the stone through its 57 facets (as src/t4/gem.js does) and out again,
     split into colour as it leaves.
   - The chain is a fine cable chain with bezel-set diamonds along it,
     joined to the outer top of each crescent.
   - The studio: graphite walls, a warm stone floor, softboxes whose lines
     are what the white gold reflects. With look: "white" (/test6/), a pale
     studio with black cards and a graded front card instead, as jewellery
     is shot on white, and a soft shadow on the wall behind the necklace.
   The story, frame by frame: an extreme close-up of polished white gold;
   the camera draws back to the whole pendant; it turns to show its depth;
   its diamonds lift and settle into their seats; the camera moves into the
   pavé; and back, to the pendant as it is worn. Units are millimetres. */
import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";

export function makeSoul(canvas, { MARK, MARK_W, PAVE, W, H, ratio, tall, look }) {
  const white = look === "white";
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(ratio); renderer.setSize(W, H, false); renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();

  /* the studio the metal and the stones reflect */
  const studio = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.SphereGeometry(500, 64, 32), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
    fragmentShader: "varying vec3 vP; void main(){ vec3 d = normalize(vP); vec3 graphite = vec3(.05,.046,.042), stone = vec3(.42,.36,.29); vec3 c = mix(stone, graphite, smoothstep(-.35,.35,d.y)); gl_FragColor = vec4(c, 1.); }" }));
  studio.add(room);
  const box = (w, h, x, y, z, k, tint) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(tint || 0xffffff).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); studio.add(m); };
  if (white) {
    /* a white studio, shot as jewellery is shot on white: the room is pale,
       and black cards stand where the metal's faces look, so polished white
       gold keeps its drawing (a white face in a white room has none) */
    room.material.fragmentShader = "varying vec3 vP; void main(){ vec3 d = normalize(vP); vec3 c = mix(vec3(.07,.068,.066), vec3(.62,.61,.6), smoothstep(-.4,.75,d.y)); gl_FragColor = vec4(c, 1.); }";
    /* the card the front faces see: light at the top, falling to charcoal,
       so a flat polished face reads as a smooth gradient, as in a studio shot */
    const gc = document.createElement("canvas"); gc.width = 4; gc.height = 256; const gx = gc.getContext("2d"), gr = gx.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, "#f6f6f4"); gr.addColorStop(0.36, "#c4c2be"); gr.addColorStop(0.5, "#9d9b97"); gr.addColorStop(0.72, "#4c4b49"); gr.addColorStop(1, "#1a1919"); gx.fillStyle = gr; gx.fillRect(0, 0, 4, 256);
    const gt = new THREE.CanvasTexture(gc); gt.colorSpace = THREE.SRGBColorSpace;
    const card = new THREE.Mesh(new THREE.PlaneGeometry(700, 560), new THREE.MeshBasicMaterial({ map: gt, color: new THREE.Color(1.6, 1.6, 1.6), side: THREE.DoubleSide }));
    card.position.set(0, 20, 470); card.lookAt(0, 0, 0); studio.add(card);
    box(520, 40, 0, 300, 420, 7.0);               // a thin strip light above it: a line along the bevels
    box(110, 520, -430, 0, 220, 0.04);             // dark flags at either side
    box(110, 520, 440, 0, 180, 0.04);
    box(320, 320, 0, 430, 40, 4.5);                // the overhead softbox
    box(70, 420, -320, 60, -240, 6.0);             // strip lights behind, for the edges
    box(70, 420, 330, 40, -230, 5.0);
    box(260, 90, -190, -200, 360, 0.02);           // black flags low in front: the stones' dark facets
    box(260, 90, 200, -210, 340, 0.02);
    box(46, 360, -470, 60, 0, 5.5);                // and at the far sides
    box(46, 360, 480, 40, -20, 4.5);
  } else {
  box(320, 320, 0, 420, 60, 5.0);                 // the overhead softbox
  box(52, 440, -360, 40, 170, 7.0);              // a strip at the left, a little in front
  box(52, 440, 380, 60, 120, 5.5);               // and one at the right
  box(380, 240, -60, 60, 440, 2.4, 0xfff4e6);    // a broad warm fill from the camera's side
  box(420, 70, 0, 140, -420, 3.2, 0xffe9d2);     // a warm rim behind
  }
  /* small hot lamps: what the diamonds break into points of light and colour */
  for (let i = 0; i < 12; i++) { const a = i * 2.399, z = 0.25 + 0.65 * ((i * 0.618) % 1), r = Math.sqrt(1 - z * z);
    const l = new THREE.Mesh(new THREE.SphereGeometry(7, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff).multiplyScalar(36) }));
    l.position.set(Math.cos(a) * r * 420, Math.sin(a) * r * 420, z * 420); studio.add(l); }
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(studio, 0.0, 0.1, 1200).texture;
  const cubeRT = new THREE.WebGLCubeRenderTarget(512, { type: THREE.HalfFloatType });
  new THREE.CubeCamera(1, 1000, cubeRT).update(renderer, studio);

  const gold = new THREE.MeshPhysicalMaterial({ color: 0xeeeef2, metalness: 1, roughness: 0.065, clearcoat: 0.4, clearcoatRoughness: 0.04, envMapIntensity: 1.15 });

  /* the round brilliant, as planes (the same cut as gem.js): table 54%,
     crown 34.5°, pavilion 40.75°, stars 50%, lower halves 77% */
  const P = [];
  {
    const R = Math.PI / 180, sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const add = (n, p) => { const l = Math.hypot(n[0], n[1], n[2]); n = n.map(v => v / l); let d = dot(n, p); if (d < 0) { n = n.map(v => -v); d = -d; } P.push(new THREE.Vector4(n[0], n[1], n[2], d)); };
    const three = (a, b, c) => add(cross(sub(b, a), sub(c, a)), a), at = (r, f, y) => [r * Math.cos(f), y, r * Math.sin(f)];
    const s = 0.54, c22 = Math.cos(22.5 * R), rv = s / c22, tc = Math.tan(34.5 * R), hc = (1 - rv) * tc, g = 0.05;
    const sc = Math.sin(34.5 * R), cc = Math.cos(34.5 * R), sp = Math.sin(40.75 * R), cp = Math.cos(40.75 * R);
    const ra = s + 0.5 * (1 - s), ya = tc * (1 - ra * c22), rq = 0.23, yq = (sp * c22 * rq - sp - g * cp) / cp;
    P.push(new THREE.Vector4(0, 1, 0, hc));
    for (let k = 0; k < 8; k++) {
      const f = k * 45 * R, h = f + 22.5 * R, f2 = f + 45 * R;
      add([sc * Math.cos(f), cc, sc * Math.sin(f)], at(1, f, 0));
      const A = at(ra, h, ya); three(at(rv, f, hc), at(rv, f2, hc), A);
      three(A, at(1, f, 0), at(1, h, 0)); three(A, at(1, f2, 0), at(1, h, 0));
      add([sp * Math.cos(f), -cp, sp * Math.sin(f)], at(1, f, -g));
      const Q = at(rq, h, yq); three(Q, at(1, f, -g), at(1, h, -g)); three(Q, at(1, f2, -g), at(1, h, -g));
    }
  }
  const diamond = new THREE.ShaderMaterial({
    uniforms: { uP: { value: P }, envMap: { value: cubeRT.texture } },
    vertexShader: `varying vec3 vPosO; varying vec3 vCamO; varying mat3 vRot;
      void main(){ mat4 M = modelMatrix * instanceMatrix; vPosO = position; vCamO = (inverse(M) * vec4(cameraPosition, 1.)).xyz; vRot = mat3(M);
        gl_Position = projectionMatrix * viewMatrix * M * vec4(position, 1.); }`,
    fragmentShader: `uniform vec4 uP[57]; uniform samplerCube envMap; varying vec3 vPosO; varying vec3 vCamO; varying mat3 vRot;
      vec3 env(vec3 d){ return textureCube(envMap, normalize(vRot * d)).rgb; }
      float fr(float c){ float f0 = .172; return f0 + (1. - f0) * pow(1. - c, 5.); }
      float leave(vec3 o, vec3 d, out vec3 n){ float t = 1e9; n = vec3(0., 1., 0.);
        for (int i = 0; i < 57; i++){ vec4 q = uP[i]; float dn = dot(q.xyz, d); if (dn > 1e-5){ float u = (q.w - dot(q.xyz, o)) / dn; if (u < t){ t = u; n = q.xyz; } } }
        float A = d.x*d.x + d.z*d.z; if (A > 1e-6){ float B = o.x*d.x + o.z*d.z, C = o.x*o.x + o.z*o.z - 1., s = B*B - A*C; if (s > 0.){ float u = (-B + sqrt(s)) / A; if (u < t){ t = u; n = normalize(vec3(o.x + d.x*u, 0., o.z + d.z*u)); } } }
        return t; }
      void main(){
        vec3 o = vCamO, d = normalize(vPosO - vCamO);
        float tn = -1e9, tf = 1e9; vec3 nn = vec3(0., 1., 0.); bool miss = false;
        for (int i = 0; i < 57; i++){ vec4 p = uP[i]; float dn = dot(p.xyz, d), s = p.w - dot(p.xyz, o); if (abs(dn) < 1e-6){ if (s < 0.) miss = true; continue; } float t = s / dn;
          if (dn < 0.){ if (t > tn){ tn = t; nn = p.xyz; } } else if (t < tf) tf = t; }
        float A = d.x*d.x + d.z*d.z, B = o.x*d.x + o.z*d.z, C = o.x*o.x + o.z*o.z - 1., sq = B*B - A*C;
        if (A > 1e-6){ if (sq < 0.) miss = true; else { float r = sqrt(sq), t0 = (-B - r) / A, t1 = (-B + r) / A; if (t0 > tn){ tn = t0; nn = normalize(vec3(o.x + d.x*t0, 0., o.z + d.z*t0)); } if (t1 < tf) tf = t1; } } else if (C > 0.) miss = true;
        if (miss || tf <= tn) discard;
        vec3 p = o + d * tn, n = nn; float ci = clamp(-dot(d, n), 0., 1.), F = fr(ci);
        vec3 col = F * env(reflect(d, n)), di = refract(d, n, 1. / 2.417), n2; float th = 1. - F;
        for (int b = 0; b < 6; b++){ float t = leave(p + di * 1e-4, di, n2); p = p + di * (t + 1e-4); float c = dot(di, n2), k = 1. - 2.417 * 2.417 * (1. - c * c);
          if (k > 0.){ float Fo = fr(sqrt(k)), w = th * (1. - Fo);
            vec3 dr = refract(di, -n2, 2.400), dg = refract(di, -n2, 2.419), db = refract(di, -n2, 2.446);
            col += w * vec3(dot(dr, dr) > 0. ? env(dr).r : 0., dot(dg, dg) > 0. ? env(dg).g : 0., dot(db, db) > 0. ? env(db).b : 0.); th *= Fo; }
          di = reflect(di, n2); if (th < .01) break; }
        col += th * env(di) * .5;
        gl_FragColor = vec4(col, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  /* the volume each stone is drawn inside (the shader finds the stone) */
  const hull = new THREE.LatheGeometry([new THREE.Vector2(0.001, -0.95), new THREE.Vector2(1.06, -0.07), new THREE.Vector2(1.06, 0.02), new THREE.Vector2(0.62, 0.31), new THREE.Vector2(0.001, 0.31)], 24);

  /* the pendant */
  const S = 20 / 1000, MW = MARK_W * S, DEPTH = 1.6;
  const pendant = new THREE.Group(); scene.add(pendant);
  const shapes = SVGLoader.createShapes(new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${MARK}"/></svg>`).paths[0]);
  const mg = new THREE.ExtrudeGeometry(shapes, { depth: (DEPTH - 0.3) / S, bevelEnabled: true, bevelThickness: 0.15 / S, bevelSize: 0.09 / S, bevelSegments: 4, curveSegments: 12 });
  mg.translate(-MARK_W / 2, -500, 0.15 / S); mg.scale(S, -S, S); mg.computeVertexNormals();
  /* scaling y by -1 turns the faces inside out: they are turned back */
  { const ix = mg.index; if (ix) { for (let i = 0; i < ix.count; i += 3) { const a = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, a); } } else { const p = mg.attributes.position; for (let i = 0; i < p.count; i += 3) for (const k of ["x", "y", "z"]) { const g1 = p["get" + k.toUpperCase()](i + 1); p["set" + k.toUpperCase()](i + 1, p["get" + k.toUpperCase()](i + 2)); p["set" + k.toUpperCase()](i + 2, g1); } } mg.computeVertexNormals(); }
  pendant.add(new THREE.Mesh(mg, gold));
  const svg = (x, y, z) => new THREE.Vector3((x - MARK_W / 2) * S, (500 - y) * S, z);

  /* the pavé, and the beads that hold it */
  const stones = PAVE.map(([x, y, r, a], i) => ({ home: svg(x, y, DEPTH - 0.03 * r * S * 2), d: r * S * 2 * 0.98, i, y }));
  const inst = new THREE.InstancedMesh(hull, diamond, stones.length); pendant.add(inst);
  const beadsAt = [];
  for (let i = 1; i < PAVE.length; i++) {
    const [x1, y1, r1] = PAVE[i - 1], [x2, y2, r2, a2] = PAVE[i];
    if (Math.hypot(x2 - x1, y2 - y1) > 1.6 * (r1 + r2)) continue;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, ang = Math.atan2(y2 - y1, x2 - x1), off = (r1 + r2) / 2 * 0.86, br = Math.max(0.035, (r1 + r2) / 2 * S * 0.2);
    for (const sgn of [1, -1]) beadsAt.push([svg(mx - Math.sin(ang) * off * sgn, my + Math.cos(ang) * off * sgn, DEPTH + br * 0.15), br]);
  }
  const beads = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), gold, beadsAt.length);
  { const m = new THREE.Matrix4(); beadsAt.forEach(([p, r], i) => { m.makeScale(r, r, r).setPosition(p); beads.setMatrixAt(i, m); }); }
  pendant.add(beads);

  /* the chain: from the outer top of each crescent, a jump ring, then the
     cable chain (each link turned a quarter to the last), with a diamond in
     a bezel along it */
  const links = [], stations = [];
  for (const [ax, ay, sgn] of [[76, 329, -1], [795, 324.5, 1]]) {
    const a = svg(ax, ay, DEPTH * 0.5);
    const curve = new THREE.CatmullRomCurve3([a, a.clone().add(new THREE.Vector3(sgn * 3, 2.4, -0.2)), a.clone().add(new THREE.Vector3(sgn * 14, 22, -2)), a.clone().add(new THREE.Vector3(sgn * 34, 70, -8)), a.clone().add(new THREE.Vector3(sgn * 58, 150, -16))]);
    const len = curve.getLength(), pitch = 1.18;
    for (let s = 0.9, k = 0; s < len; s += pitch, k++) {
      const u = s / len, p = curve.getPointAt(u), tg = curve.getTangentAt(u);
      if (Math.abs(s - 24) < 1.3 || Math.abs(s - 56) < 1.3) { if (!stations.some(q => q[0].distanceTo(p) < 1)) stations.push([p, tg]); continue; }
      links.push([p, tg, k % 2]);
    }
  }
  const linkGeo = new THREE.TorusGeometry(0.42, 0.13, 10, 20); linkGeo.scale(1.42, 1, 1);
  const chain = new THREE.InstancedMesh(linkGeo, gold, links.length); pendant.add(chain);
  { const m = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0);
    links.forEach(([p, tg, odd], i) => { q.setFromUnitVectors(X, tg); q2.setFromAxisAngle(X, odd ? Math.PI / 2 : 0); q.multiply(q2); m.compose(p, q, new THREE.Vector3(1, 1, 1)); chain.setMatrixAt(i, m); }); }
  const cup = new THREE.CylinderGeometry(1.0, 0.9, 0.9, 32, 1, true); cup.rotateX(Math.PI / 2);
  const cups = new THREE.InstancedMesh(cup, gold, stations.length); pendant.add(cups);
  const sInst = new THREE.InstancedMesh(hull, diamond, stations.length); pendant.add(sInst);
  { const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1));
    stations.forEach(([p], i) => { m.compose(p, new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); cups.setMatrixAt(i, m); m.compose(p.clone().add(new THREE.Vector3(0, 0, 0.32)), q, new THREE.Vector3(0.78, 0.78, 0.78)); sInst.setMatrixAt(i, m); }); }

  /* on white, the necklace hangs a little in front of the studio wall and
     lays a soft shadow on it, from a light above and to the left */
  if (white) {
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
    const sun = new THREE.DirectionalLight(0xffffff, 0.0001); sun.position.set(-22, 40, 150); sun.castShadow = true;
    Object.assign(sun.shadow.camera, { left: -100, right: 100, top: 160, bottom: -60, near: 1, far: 400 });
    sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 14; sun.shadow.blurSamples = 20; sun.shadow.bias = -0.0005;
    scene.add(sun, sun.target);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.ShadowMaterial({ opacity: 0.13 }));
    wall.position.z = -10; wall.receiveShadow = true; scene.add(wall);
    pendant.traverse(o => { if (o.isMesh) o.castShadow = true; });
  }

  const camera = new THREE.PerspectiveCamera(tall ? 30 : 22, W / H, 0.3, 3000);
  /* on a phone the words sit in the lower part of the screen: the piece is framed above them */
  if (tall) camera.setViewOffset(W, H, 0, H * 0.13, W, H);
  const ease = x => (x = Math.min(1, Math.max(0, x)), x * x * (3 - 2 * x));
  const mix = (a, b, k) => a + (b - a) * k, rnd = i => { const s = Math.sin(i * 12.9898) * 43758.5453; return s - Math.floor(s); };
  const Mx = new THREE.Matrix4(), qS = new THREE.Quaternion(), qUp = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)), qr = new THREE.Quaternion(), Z = new THREE.Vector3(0, 0, 1), pos = new THREE.Vector3(), scl = new THREE.Vector3();
  const centre = new THREE.Vector3(0, 0, DEPTH / 2), macro = svg(590, 372, DEPTH * 0.9), pave = svg(436, 520, DEPTH);
  const orbit = (target, dist, az, el) => camera.position.set(target.x + dist * Math.cos(el) * Math.sin(az), target.y + dist * Math.sin(el), target.z + dist * Math.cos(el) * Math.cos(az));

  /* f: the frame, 0 to 149 (0–29 the opening, 30–149 the story) */
  function frame(f) {
    let target = new THREE.Vector3(), dist, az, el, yaw, lift = 0, settle = 1;
    const F = tall ? 1.18 : 1;
    if (f < 30) {
      /* an extreme close-up of polished white gold, drawn back to the whole */
      const u = f / 29, k = u * u * (3 - 2 * u), kd = Math.pow(u, 2.2);
      target.lerpVectors(macro, centre, ease(u * 1.25)); dist = mix(6.5, 78 * F, kd); az = mix(1.05, 0.14, k); el = mix(0.12, 0.04, k); yaw = mix(0.32, 0.12, k);
    } else {
      const v = (f - 30) / 119;
      /* it turns to show its depth, and back */
      yaw = 0.12 + 1.02 * Math.sin(Math.PI * Math.min(1, v / 0.36)) * (v < 0.36 ? 1 : 0) - 0.12 * ease((v - 0.75) / 0.25);
      /* its diamonds lift as it turns and settle as it faces you again */
      lift = ease((v - 0.06) / 0.12) * (1 - ease((v - 0.2) / 0.06));
      settle = v;
      const dk = ease((v - 0.42) / 0.2), wk = ease((v - 0.74) / 0.22);
      target.copy(centre).lerp(pave, dk).lerp(centre, wk);
      dist = mix(mix(mix(78, 64, ease(v / 0.3)), 9.5, dk), 104, wk) * F;
      az = mix(mix(0.14, 0.32, dk), 0, wk); el = mix(mix(0.04, 0.42, dk), 0, wk);
    }
    pendant.rotation.y = yaw; pendant.updateMatrixWorld();
    target.applyMatrix4(pendant.matrixWorld);
    orbit(target, dist, az, el); camera.lookAt(target); camera.updateMatrixWorld();
    stones.forEach((s, i) => {
      /* lifted: off its seat along the pendant's face, a little turned; each
         returns in turn, from the top of the mark down */
      let k = 0;
      if (f >= 30) { const v = (f - 30) / 119, up = ease((v - 0.06 - rnd(i) * 0.05) / 0.1), down = ease((v - 0.2 - (s.y / 1000) * 0.14 - rnd(i + 3) * 0.03) / 0.1); k = up * (1 - down); }
      pos.copy(s.home).addScaledVector(Z, k * (1.1 + rnd(i + 5) * 1.3)); pos.x += k * (rnd(i + 7) - 0.5) * 0.6; pos.y += k * (rnd(i + 9) - 0.5) * 0.6;
      qr.setFromAxisAngle(new THREE.Vector3(rnd(i + 2) - 0.5, rnd(i + 4) - 0.5, 0.3).normalize(), k * 1.4); qS.copy(qr).multiply(qUp);
      scl.setScalar(s.d / 2); Mx.compose(pos, qS, scl); inst.setMatrixAt(i, Mx);
    });
    inst.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
    /* where the pendant's centre and its height fall on the frame, for the
       page to match the photograph of it worn */
    const c = centre.clone().applyMatrix4(pendant.matrixWorld).project(camera), top = svg(436, 0, DEPTH).applyMatrix4(pendant.matrixWorld).project(camera), bot = svg(436, 1000, DEPTH).applyMatrix4(pendant.matrixWorld).project(camera);
    return { cx: (c.x + 1) / 2, cy: (1 - c.y) / 2, h: Math.abs(top.y - bot.y) / 2 };
  }
  return { frame, stones: stones.length, beads: beadsAt.length, links: links.length, stations: stations.length };
}
