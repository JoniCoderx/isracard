import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Deterministic PRNG so the layout is stable across runs (nice for QA screenshots).
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createWorld(renderer) {
  const rng = mulberry32(1337);
  const scene = new THREE.Scene();

  // --- Atmosphere: cold industrial dusk with fog for depth ---
  scene.background = new THREE.Color(0x0a1018);
  scene.fog = new THREE.FogExp2(0x151d2c, 0.013);

  // --- Image-based lighting for realistic PBR reflections ---
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;

  // --- Sky dome (gradient) ---
  const skyGeo = new THREE.SphereGeometry(400, 32, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color(0x0b1a2e) },
      mid: { value: new THREE.Color(0x0a1220) },
      bot: { value: new THREE.Color(0x05070c) },
    },
    vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec3 vP; uniform vec3 top, mid, bot;
      void main(){
        float h = normalize(vP).y;
        vec3 c = h > 0.0 ? mix(mid, top, pow(h,0.6)) : mix(mid, bot, pow(-h,0.5));
        gl_FragColor = vec4(c,1.0);
      }`,
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  // --- Lights ---
  const hemi = new THREE.HemisphereLight(0x9fc0ff, 0x2a2418, 0.9);
  scene.add(hemi);
  const fill = new THREE.AmbientLight(0x4a5568, 0.55);
  scene.add(fill);

  const moon = new THREE.DirectionalLight(0xbcd4ff, 2.1);
  moon.position.set(-60, 90, 40);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.near = 10;
  moon.shadow.camera.far = 260;
  const s = 70;
  moon.shadow.camera.left = -s; moon.shadow.camera.right = s;
  moon.shadow.camera.top = s; moon.shadow.camera.bottom = -s;
  moon.shadow.bias = -0.0004;
  moon.shadow.normalBias = 0.02;
  scene.add(moon);
  scene.add(moon.target);

  // Dim fill from opposite side lifts shadowed faces (key/fill contrast).
  const fillDir = new THREE.DirectionalLight(0x5a70a0, 0.6);
  fillDir.position.set(50, 40, -30);
  scene.add(fillDir);

  const colliders = [];        // Array<THREE.Box3> for player/enemy collision
  const accentLights = [];     // flickering emergency lights

  // --- Ground ---
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x2b2f36, roughness: 0.92, metalness: 0.1,
  });
  // subtle procedural tiling via vertex colors on a subdivided plane for large-scale variation
  const groundGeo = new THREE.PlaneGeometry(300, 300, 60, 60);
  groundGeo.rotateX(-Math.PI / 2);
  const gcol = [];
  const pos = groundGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const n = 0.5 + 0.5 * Math.sin(pos.getX(i) * 0.3) * Math.cos(pos.getZ(i) * 0.3);
    const v = 0.16 + n * 0.06 + rng() * 0.03;
    gcol.push(v, v * 1.02, v * 1.08);
  }
  groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(gcol, 3));
  groundMat.vertexColors = true;
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.receiveShadow = true;
  scene.add(ground);

  // painted arena lines
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xd8c246, roughness: 0.6, emissive: 0x1a1600, emissiveIntensity: 0.4 });
  for (let i = -1; i <= 1; i += 2) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 60), lineMat);
    l.position.set(i * 22, 0.02, 0); l.receiveShadow = true; scene.add(l);
  }

  // --- Reusable materials ---
  const matMetal = new THREE.MeshStandardMaterial({ color: 0x5a6068, roughness: 0.45, metalness: 0.85 });
  const matCrate = new THREE.MeshStandardMaterial({ color: 0x6e5a3c, roughness: 0.75, metalness: 0.15 });
  const matContainerA = new THREE.MeshStandardMaterial({ color: 0x8a3b2e, roughness: 0.6, metalness: 0.35 });
  const matContainerB = new THREE.MeshStandardMaterial({ color: 0x2e5a6a, roughness: 0.6, metalness: 0.35 });
  const matContainerC = new THREE.MeshStandardMaterial({ color: 0x4a5540, roughness: 0.6, metalness: 0.35 });
  const matConcrete = new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.95, metalness: 0.05 });
  const matBarrel = new THREE.MeshStandardMaterial({ color: 0x8a2f22, roughness: 0.5, metalness: 0.5 });

  function addBox(w, h, d, x, y, z, mat, ry = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.rotation.y = ry;
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m);
    const box = new THREE.Box3().setFromObject(m);
    colliders.push(box);
    return m;
  }

  // --- Perimeter walls (arena bounds ~ +/-30) ---
  const WALL = 30;
  const wallH = 8;
  addBox(WALL * 2 + 2, wallH, 1, 0, wallH / 2, -WALL, matConcrete);
  addBox(WALL * 2 + 2, wallH, 1, 0, wallH / 2, WALL, matConcrete);
  addBox(1, wallH, WALL * 2 + 2, -WALL, wallH / 2, 0, matConcrete);
  addBox(1, wallH, WALL * 2 + 2, WALL, wallH / 2, 0, matConcrete);

  // --- Shipping containers (stacked) ---
  const contMats = [matContainerA, matContainerB, matContainerC];
  function container(x, z, ry, mat) {
    return addBox(6.05, 2.6, 2.45, x, 1.3, z, mat, ry);
  }
  container(-16, -12, 0.1, matContainerA);
  container(-16, -12 + 0.02, 0.1, matContainerB); // (visual variety, same spot handled below)
  container(14, -14, -0.15, matContainerB);
  container(14, -11.4, -0.15, matContainerB);      // stacked
  addBox(6.05, 2.6, 2.45, 14, 1.3 + 2.62, -14, matContainerA, -0.15); colliders[colliders.length-1]; // top
  container(20, 8, Math.PI / 2 + 0.05, matContainerC);
  container(-20, 10, Math.PI / 2 - 0.08, matContainerA);

  // --- Concrete cover barriers (jersey barriers) ---
  for (let i = 0; i < 7; i++) {
    const x = (rng() * 2 - 1) * 20;
    const z = (rng() * 2 - 1) * 20;
    if (Math.hypot(x, z) < 6) continue; // keep spawn clear
    addBox(3.2, 1.1, 0.7, x, 0.55, z, matConcrete, rng() * Math.PI);
  }

  // --- Crate clusters ---
  for (let i = 0; i < 10; i++) {
    const x = (rng() * 2 - 1) * 24;
    const z = (rng() * 2 - 1) * 24;
    if (Math.hypot(x, z) < 5) continue;
    const sz = 0.9 + rng() * 0.5;
    addBox(sz, sz, sz, x, sz / 2, z, matCrate, rng() * Math.PI);
    if (rng() > 0.5) addBox(sz * 0.85, sz * 0.85, sz * 0.85, x + 0.1, sz + sz * 0.42, z, matCrate, rng());
  }

  // --- Explosive barrels (visual + collider) ---
  const barrels = [];
  for (let i = 0; i < 6; i++) {
    const x = (rng() * 2 - 1) * 23;
    const z = (rng() * 2 - 1) * 23;
    if (Math.hypot(x, z) < 5) continue;
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.1, 20), matBarrel);
    b.position.set(x, 0.55, z); b.castShadow = true; b.receiveShadow = true;
    scene.add(b);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 8, 24), new THREE.MeshStandardMaterial({ color: 0xe8c84a, roughness: 0.4, metalness: 0.6, emissive: 0x2a2200, emissiveIntensity: 0.5 }));
    ring.rotation.x = Math.PI / 2; ring.position.set(x, 0.75, z); scene.add(ring);
    colliders.push(new THREE.Box3().setFromObject(b));
    barrels.push(b);
  }

  // --- Light poles with emissive lamps + real point lights ---
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xfff2c0, emissive: 0xffcf6e, emissiveIntensity: 2.2, roughness: 0.3 });
  function pole(x, z, color) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 7, 10), matMetal);
    p.position.set(x, 3.5, z); p.castShadow = true; scene.add(p);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 0.6), matMetal);
    head.position.set(x, 7, z); scene.add(head);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), lampMat);
    lamp.position.set(x, 6.86, z); scene.add(lamp);
    const pl = new THREE.PointLight(color, 13, 22, 2.0);
    pl.position.set(x, 6.7, z); scene.add(pl);
    accentLights.push({ light: pl, base: 13, phase: rng() * 6.28 });
  }
  pole(-18, -18, 0xffcf8a);
  pole(18, -18, 0xffcf8a);
  pole(-18, 18, 0xff8a5a);
  pole(18, 18, 0xff8a5a);

  // red emergency accents near center
  const redA = new THREE.PointLight(0xff2a2a, 10, 18, 2); redA.position.set(0, 3, -8); scene.add(redA);
  accentLights.push({ light: redA, base: 10, phase: 1.1, flicker: true });

  // --- Central raised platform (extraction pad) ---
  const pad = addBox(8, 0.4, 8, 0, 0.2, 12, matMetal);
  pad.material = new THREE.MeshStandardMaterial({ color: 0x2f3a44, roughness: 0.4, metalness: 0.7 });
  const padGlow = new THREE.Mesh(new THREE.RingGeometry(3.2, 3.6, 48),
    new THREE.MeshBasicMaterial({ color: 0x35e0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.6 }));
  padGlow.rotation.x = -Math.PI / 2; padGlow.position.set(0, 0.42, 12); scene.add(padGlow);

  // Arena bounds for enemy clamping
  const bounds = { min: -WALL + 1.5, max: WALL - 1.5 };

  let t = 0;
  function update(dt) {
    t += dt;
    for (const a of accentLights) {
      if (a.flicker) {
        a.light.intensity = a.base * (0.6 + 0.4 * Math.abs(Math.sin(t * 9 + a.phase)) * (Math.sin(t * 2.3) > -0.4 ? 1 : 0.2));
      } else {
        a.light.intensity = a.base * (0.92 + 0.08 * Math.sin(t * 5 + a.phase));
      }
    }
    padGlow.material.opacity = 0.4 + 0.25 * (0.5 + 0.5 * Math.sin(t * 2));
    padGlow.scale.setScalar(1 + 0.03 * Math.sin(t * 2));
  }

  return { scene, colliders, bounds, barrels, update, moon };
}
