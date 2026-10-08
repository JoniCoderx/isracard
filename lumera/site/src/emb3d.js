/* The emblem in metal: the SILAVU symbol as a solid piece of polished white
   gold, for the "By appointment" chapter.

   The solid is extruded from the master outline (MARK, read from the page's
   own SVG), never redrawn, and turned only by a proper rotation, so it is
   never mirrored. It leans toward the pointer (on a phone, with the scroll),
   at most a few degrees, so its back is never shown. It is lit by a studio
   room for its reflections and one moving light for the highlight that runs
   along the curves. It renders only while it can be seen. Without WebGL the
   flat emblem stays as it is. */
import * as THREE from "./three.module.min.js";
import { SVGLoader } from "./SVGLoader.js";
import { RoomEnvironment } from "./RoomEnvironment.js";

export function start(emb, host, d, w) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" }); }
  catch (e) { return false; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const canvas = renderer.domElement;
  canvas.className = "emb3d";
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(renderer), 0.035).texture;

  /* the outline, as the page draws it */
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(w)} 1000"><path d="${d}"/></svg>`;
  const shapes = new SVGLoader().parse(svg).paths.flatMap(p => SVGLoader.createShapes(p));
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: 46, curveSegments: 3,
    bevelEnabled: true, bevelThickness: 16, bevelSize: 6.5, bevelOffset: -6.5, bevelSegments: 4,
  });
  /* SVG runs downward; a half turn about the x axis stands it up the right
     way round (a rotation, not a reflection, so nothing is mirrored) */
  geo.rotateX(Math.PI);
  geo.center();
  geo.computeVertexNormals();

  const metal = new THREE.MeshPhysicalMaterial({
    color: 0xf1f3f6, metalness: 1, roughness: 0.11,
    clearcoat: 0.8, clearcoatRoughness: 0.06, envMapIntensity: 1.6,
  });
  const mesh = new THREE.Mesh(geo, metal);
  const rig = new THREE.Group(); rig.add(mesh); scene.add(rig);

  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(-600, 700, 900); scene.add(key);
  const sweep = new THREE.PointLight(0xfff6e6, 9, 0, 0); sweep.position.set(0, 0, 700); scene.add(sweep);
  scene.add(new THREE.AmbientLight(0xffffff, 0.15));

  const cam = new THREE.PerspectiveCamera(20, 1, 10, 10000);
  function size() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    cam.aspect = r.width / r.height;
    /* the symbol fills the emblem box; the canvas is larger than the box so a
       tilted edge is never cut */
    const fill = 1000 / 0.76;
    cam.position.set(0, 0, (fill / 2) / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }
  size();
  addEventListener("resize", size);

  /* the lean: toward the pointer where there is one, with the scroll where there is not */
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
  let tx = 0, ty = 0, rx = 0, ry = 0;
  if (fine) {
    emb.addEventListener("pointermove", e => { const r = emb.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, (e.clientX - r.left) / r.width * 2 - 1));
      ty = Math.max(-1, Math.min(1, (e.clientY - r.top) / r.height * 2 - 1)); });
    emb.addEventListener("pointerleave", () => { tx = ty = 0; });
  }
  const MAXY = THREE.MathUtils.degToRad(16), MAXX = THREE.MathUtils.degToRad(10);

  let on = false, raf = 0, t0 = performance.now(), shown = false;
  function frame(now) {
    raf = 0; if (!on) return;
    const t = (now - t0) / 1000;
    if (!fine) { const r = emb.getBoundingClientRect(); tx = Math.max(-1, Math.min(1, ((r.top + r.height / 2) / innerHeight) * 2 - 1)) * -0.6; }
    const sway = Math.sin(t * 0.45) * 0.35;
    rx += ((ty * 0.8) * MAXX - rx) * 0.06;
    ry += ((tx * 0.85 + sway * 0.4) * MAXY - ry) * 0.06;
    rig.rotation.set(rx, Math.max(-MAXY, Math.min(MAXY, ry)), 0);
    /* the highlight crosses the metal slowly, once every few seconds */
    const s = (t * 0.16) % 1, k = s * 2.6 - 1.3;
    sweep.position.set(k * 900, 420 - k * 300, 650);
    sweep.intensity = 9 * Math.max(0, 1 - Math.abs(k) / 1.3) + 1.5;
    renderer.render(scene, cam);
    if (!shown) { shown = true; emb.classList.add("e3d"); }
    raf = requestAnimationFrame(frame);
  }
  function play(v) { on = v && !document.hidden; if (on && !raf) raf = requestAnimationFrame(frame); }
  new IntersectionObserver(es => play(es.some(e => e.isIntersecting)), { rootMargin: "120px" }).observe(emb);
  document.addEventListener("visibilitychange", () => play(!document.hidden && emb.getBoundingClientRect().bottom > 0 && emb.getBoundingClientRect().top < innerHeight));
  return true;
}
