/* "ICON, from one stone" (/test4/): the SILAVU ICON ring built in a warm
   studio, for icon-frames.mjs to render frame by frame (the page only plays
   the frames). Everything is the ring as it is made:
   - the mark is the house's exact symbol (body.mjs MARK), extruded in white
     gold and bent to sit on the band;
   - its pavé follows the two interlaced strands, each stone as wide as the
     strand at that point (icon-pave.py); the crescents and the small wedges
     are polished, as on the piece;
   - the band is a fine round wire with pavé along its front half.
   The story, t from 0 to 1: one round brilliant above the plinth; it breaks
   into the pavé, which flies into the signature; the white gold forms under
   the stones; the band is drawn round with its own pavé; the ring rests.
   Units are millimetres. */
import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export function makeScene(canvas, { MARK, MARK_W, PAVE, W, H, ratio, tall }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, alpha: false });
  renderer.setPixelRatio(ratio); renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.92;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(renderer), 0.03).texture;

  /* the studio: one warm stone tone, the floor running away into it with
     no horizon; the light makes the pool */
  const TONE = 0x776d63;
  scene.background = new THREE.Color(TONE);
  scene.fog = new THREE.Fog(TONE, 110, 300);
  /* the plinth: a drum of pale travertine, a little grain in it */
  const grain = document.createElement("canvas"); grain.width = grain.height = 256;
  const gx = grain.getContext("2d"); gx.fillStyle = "#d9d0c3"; gx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) { const v = 190 + Math.random() * 40 | 0; gx.fillStyle = `rgba(${v},${v - 8},${v - 18},${0.25 + Math.random() * 0.3})`; gx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 6, 1); }
  const gtex = new THREE.CanvasTexture(grain); gtex.colorSpace = THREE.SRGBColorSpace; gtex.wrapS = gtex.wrapT = THREE.RepeatWrapping; gtex.repeat.set(3, 1);
  const stoneMat = new THREE.MeshStandardMaterial({ map: gtex, roughness: 0.88, metalness: 0, color: 0x9f9588 });
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 14, 128), stoneMat);
  plinth.position.y = -7; plinth.receiveShadow = true; plinth.castShadow = true; scene.add(plinth);
  /* the floor only holds the shadow, so it meets the studio with no edge */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.ShadowMaterial({ color: 0x2a221b, opacity: 0.28 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -14; floor.receiveShadow = true; scene.add(floor);

  const key = new THREE.DirectionalLight(0xfff1e2, 2.1); key.position.set(-60, 120, 70); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = key.shadow.camera.bottom = -45; key.shadow.camera.right = key.shadow.camera.top = 45; key.shadow.camera.near = 20; key.shadow.camera.far = 260; key.shadow.radius = 6; key.shadow.bias = -0.0004;
  scene.add(key);
  scene.add(new THREE.HemisphereLight(0xfff8f0, 0x5a5048, 0.35));
  const rim = new THREE.DirectionalLight(0xffffff, 1.2); rim.position.set(80, 40, -90); scene.add(rim);

  /* materials: polished white gold; diamonds as faceted mirrors of the
     studio (at this size what reads is their sparkle) */
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xe6e6ea, metalness: 1, roughness: 0.1, clearcoat: 0.3, clearcoatRoughness: 0.05, envMapIntensity: 1.0 });
  const ice = new THREE.MeshPhysicalMaterial({ color: 0xdfe4ea, metalness: 1, roughness: 0.02, envMapIntensity: 1.7, flatShading: true });

  /* a round brilliant, simplified to 16 sides: table, crown, girdle,
     pavilion. One unit across */
  const brilliant = new THREE.LatheGeometry([new THREE.Vector2(0.001, -0.43), new THREE.Vector2(0.5, -0.02), new THREE.Vector2(0.5, 0.01), new THREE.Vector2(0.28, 0.15), new THREE.Vector2(0.001, 0.15)], 16);
  brilliant.computeVertexNormals();

  /* the ring's measures (a size 54): the wire's centre circle, its radius,
     the mark's length along the band and its width across */
  const RC = 9.4, RW = 0.8, RTOP = RC + RW, L = 11.2, S = L / 1000, MW = MARK_W * S, DEPTH = 1.0;
  const ring = new THREE.Group(); scene.add(ring);
  /* the ring stands on its band on the plinth, the mark on top */
  ring.position.y = RC + RW;

  /* bend a point of the flat mark (u along the band, v across, w up) onto
     the top of the wire: the band runs round the ring's axis (x) */
  const bend = (u, v, w, out) => { const th = u / RTOP, r = RTOP + w; out.set(v, r * Math.cos(th), r * Math.sin(th)); return out; };

  /* the mark: the exact symbol, extruded and bent */
  const shapes = SVGLoader.createShapes(new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${MARK}"/></svg>`).paths[0]);
  const mg = new THREE.ExtrudeGeometry(shapes, { depth: DEPTH / S, bevelEnabled: true, bevelThickness: 0.16 / S, bevelSize: 0.1 / S, bevelSegments: 3, curveSegments: 10 });
  { const p = mg.attributes.position, t = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { const sx = p.getX(i), sy = p.getY(i), sz = p.getZ(i);
      /* svg x across, svg y along the band (its top towards the camera) */
      bend((500 - sy) * S, (sx - MARK_W / 2) * S, sz * S - 0.15, t); p.setXYZ(i, t.x, t.y, t.z); }
    mg.computeVertexNormals(); }
  const markClip = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
  const markMat = gold.clone(); markMat.clippingPlanes = [markClip];
  const mark = new THREE.Mesh(mg, markMat); mark.castShadow = true; ring.add(mark);

  /* the band: two halves of a fine round wire, from the mark's two ends
     down and round to meet under the ring; each is drawn as it is made */
  const th0 = (L / 2 - 0.6) / RTOP;
  const half = sgn => { const pts = []; for (let i = 0; i <= 200; i++) { const th = sgn * (th0 + (Math.PI - th0) * i / 200); pts.push(new THREE.Vector3(0, RC * Math.cos(th), RC * Math.sin(th))); } return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, RW, 24, false); };
  const bands = [half(1), half(-1)].map(g => { const m = new THREE.Mesh(g, gold); m.castShadow = true; ring.add(m); return m; });
  const bandIdx = bands[0].geometry.index.count;

  /* the stones: the mark's pavé (seated in its top face) and the band's
     (along the outer top of the wire, the front half of the ring) */
  const stones = [];
  const up = new THREE.Vector3(), pos = new THREE.Vector3(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0);
  PAVE.forEach(([x, y, r]) => {
    const u = (500 - y) * S, v = (x - MARK_W / 2) * S, d = r * S * 2 * 0.96;
    bend(u, v, DEPTH + 0.02 - d * 0.18, pos); up.set(0, Math.cos(u / RTOP), Math.sin(u / RTOP));
    stones.push({ home: pos.clone(), normal: up.clone(), size: d, kind: "mark", u });
  });
  const bandStoneD = 1.12;
  for (const sgn of [1, -1]) for (let th = th0 + 0.13; th < th0 + 1.45; th += (bandStoneD * 1.06) / (RC + RW)) {
    const a = sgn * th; up.set(0, Math.cos(a), Math.sin(a));
    pos.copy(up).multiplyScalar(RC + RW * 0.86);
    stones.push({ home: pos.clone(), normal: up.clone(), size: bandStoneD, kind: "band", t: (th - th0) / (Math.PI - th0) });
  }
  const inst = new THREE.InstancedMesh(brilliant, ice, stones.length); inst.castShadow = false;
  ring.add(inst);
  const M = new THREE.Matrix4(), sc = new THREE.Vector3(), rot = new THREE.Quaternion(), spin = new THREE.Quaternion();

  /* a soft shadow on the plinth under the floating stone */
  const blobC = document.createElement("canvas"); blobC.width = blobC.height = 128;
  const bc = blobC.getContext("2d"), bgd = bc.createRadialGradient(64, 64, 0, 64, 64, 64); bgd.addColorStop(0, "rgba(40,30,20,.5)"); bgd.addColorStop(1, "rgba(40,30,20,0)"); bc.fillStyle = bgd; bc.fillRect(0, 0, 128, 128);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(blobC), transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.02; scene.add(blob);

  const camera = new THREE.PerspectiveCamera(tall ? 34 : 24, W / H, 1, 2000);
  /* on a phone the words take the lower part of the screen: the piece is
     framed in the upper part */
  if (tall) camera.setViewOffset(W, H, 0, H * 0.17, W, H);
  const ease = x => (x = Math.min(1, Math.max(0, x)), x * x * (3 - 2 * x));
  const mix = (a, b, k) => a + (b - a) * k;
  const HERO = new THREE.Vector3(0, 23, 0);
  const rnd = i => { const s = Math.sin(i * 12.9898) * 43758.5453; return s - Math.floor(s); };

  /* the frame for t: returns where the floating stone is on screen (the
     bake draws it there, traced like "The cut"), and how much of it shows */
  function frame(t) {
    /* the camera: close on the stone, then the signature from above, then
       round to three quarters as the band is made */
    /* close on the floating stone; then from above, close, while the
       signature is drawn in stones and the gold forms; then back and round
       to three quarters as the band is made */
    const c1 = ease((t - 0.15) / 0.17), c2 = ease((t - 0.55) / 0.27), T = tall ? 1.08 : 1;
    const dist = mix(mix(84, 46, c1), 70, c2) * T;
    const elev = mix(mix(0.14, 0.86, c1), 0.42, c2), az = mix(mix(-0.1, 0.0, c1), 0.4, c2) + t * 0.05;
    const target = new THREE.Vector3(0, mix(mix(17, 20, c1), 10.5, c2), mix(0, 0.5, c1));
    camera.position.set(target.x + dist * Math.cos(elev) * Math.sin(az), target.y + dist * Math.sin(elev), target.z + dist * Math.cos(elev) * Math.cos(az));
    camera.lookAt(target); camera.updateMatrixWorld();
    ring.rotation.y = mix(0, 0.35, ease((t - 0.82) / 0.18));
    ring.updateMatrixWorld();

    /* the stones: from the hero stone to their seats (the mark's, staggered
       along the strands), then the band's as the band reaches them */
    const fly = (t - 0.2) / 0.22, metal = ease((t - 0.4) / 0.18), bandT = ease((t - 0.56) / 0.24);
    const heroLocal = ring.worldToLocal(HERO.clone());
    stones.forEach((s, i) => {
      let k, p = pos;
      if (s.kind === "mark") { k = ease(fly * 1.35 - rnd(i) * 0.35); p.lerpVectors(heroLocal, s.home, k);
        /* an arc on the way, not a straight line */
        p.y += Math.sin(k * Math.PI) * (1.5 + rnd(i + 7) * 2.5); p.x += Math.sin(k * Math.PI) * (rnd(i + 3) - 0.5) * 9; p.z += Math.sin(k * Math.PI) * (rnd(i + 5) - 0.5) * 6;
        sc.setScalar(s.size * mix(2.4, 1, k) * (k > 0 ? 1 : 0)); }
      else { k = ease((bandT - s.t * 0.9) / 0.12); p.copy(s.home); sc.setScalar(s.size * k); }
      rot.setFromUnitVectors(Y, s.normal);
      spin.setFromAxisAngle(Y, (1 - k) * (rnd(i + 11) * 9) + rnd(i) * 3); rot.multiply(spin);
      M.compose(p, rot, sc); inst.setMatrixAt(i, M);
    });
    inst.instanceMatrix.needsUpdate = true;
    /* the white gold forms under the stones, from the top of the mark down */
    markClip.constant = mix(-L / 2 - 2, L / 2 + 2, metal); markClip.normal.set(0, 0, -1);
    mark.visible = metal > 0;
    bands.forEach(b => { b.geometry.setDrawRange(0, Math.floor(bandIdx * bandT / 6) * 6); b.visible = bandT > 0; });
    /* the floating stone: whole until it breaks into the pavé */
    const heroK = 1 - ease((t - 0.19) / 0.06);
    blob.scale.setScalar(mix(9, 14, 1 - heroK)); blob.material.opacity = heroK;
    const sp = HERO.clone().project(camera), edge = HERO.clone().add(new THREE.Vector3(5, 0, 0)).project(camera);
    renderer.render(scene, camera);
    return { hero: heroK, x: (sp.x + 1) / 2, y: (1 - sp.y) / 2, r: Math.abs(edge.x - sp.x) / 2, spin: t * 6 };
  }
  return { frame, stones: stones.length };
}
