// A transparent WebGL layer over the film: dust in the two accent lights drifts
// through the frame, stirs with scroll speed, and leans with the cursor.
// Desktop only; it stops drawing once an opaque section covers the screen.
import * as THREE from "three";
import { makeDust } from "./particles.js";

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function initAtmosphere({ lenis }) {
  const canvas = document.getElementById("atmos");
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "low-power" }); } catch { return null; }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 40);
  camera.position.set(0, 1.5, 6);
  const blush = makeDust(520, css("--accent"), renderer.getPixelRatio(), 30, 0.75);
  const ice = makeDust(380, css("--accent-2"), renderer.getPixelRatio(), 24, 0.6);
  ice.position.x = 1.2;           // the ice light sits to the right of the beam, as in the film
  scene.add(blush, ice);

  const pointer = { x: 0, y: 0 };
  addEventListener("pointermove", (e) => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / innerHeight) * 2 + 1;
  }, { passive: true });
  const resize = () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
  };
  addEventListener("resize", resize);
  resize();

  const cover = document.querySelector(".stage-cover");
  const t0 = performance.now();
  let boost = 0;
  renderer.setAnimationLoop(() => {
    if (document.hidden || (cover && cover.getBoundingClientRect().top <= 0)) return;
    const t = (performance.now() - t0) / 1000;
    boost += (Math.min(1, Math.abs(lenis?.velocity || 0) * 0.02) - boost) * 0.08;
    camera.position.x += (pointer.x * 0.4 - camera.position.x) * 0.03;
    camera.position.y += (1.5 + pointer.y * 0.25 - camera.position.y) * 0.03;
    camera.lookAt(0, 1.5, 0);
    for (const p of [blush, ice]) {
      p.material.uniforms.uTime.value = t;
      p.material.uniforms.uBoost.value = boost;
    }
    renderer.render(scene, camera);
  });
  return { renderer };
}
