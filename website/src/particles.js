// Light dust for the atmosphere layer: soft round motes that sink slowly and sway,
// in the brand accents. Scroll speed stirs them a little.
import * as THREE from "three";

export function makeDust(count, color, pixelRatio, size = 26, opacity = 0.7) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3), seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 12;
    pos[i * 3 + 1] = Math.random() * 7 - 1;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    seed[i] = Math.random();
  }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uBoost: { value: 0 }, uColor: { value: new THREE.Color(color) }, uSize: { value: size * pixelRatio }, uOpacity: { value: opacity } },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime, uBoost, uSize;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        float sp = 0.06 + aSeed * 0.1;
        p.y = mod(p.y - uTime * sp * (1.0 + uBoost * 3.0), 7.0) - 1.0;      // sink, wrap
        p.x += sin(uTime * 0.3 + aSeed * 40.0) * 0.25;                       // sway
        p.z += cos(uTime * 0.23 + aSeed * 23.0) * 0.2;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * (0.35 + aSeed * 0.9) / -mv.z;
        float twinkle = 0.55 + 0.45 * sin(uTime * (0.8 + aSeed * 1.6) + aSeed * 60.0);
        vAlpha = smoothstep(9.0, 1.4, -mv.z) * twinkle;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float mote = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(uColor, mote * mote * vAlpha * uOpacity);
      }`,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  return pts;
}
