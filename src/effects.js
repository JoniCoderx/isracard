import * as THREE from 'three';

export function createEffects(scene) {
  // ---- Tracer pool (bright stretched beams) ----
  const tracers = [];
  const tracerGeo = new THREE.CylinderGeometry(0.012, 0.012, 1, 6, 1, true);
  tracerGeo.translate(0, 0.5, 0); // pivot at base
  const tracerMat = new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });

  function tracer(from, to) {
    const m = new THREE.Mesh(tracerGeo, tracerMat.clone());
    const dir = new THREE.Vector3().subVectors(to, from);
    const len = dir.length();
    m.position.copy(from);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    m.scale.set(1, len, 1);
    scene.add(m);
    tracers.push({ mesh: m, life: 0.06, max: 0.06 });
  }

  // ---- Particle system (sparks / blood / smoke) as pooled points ----
  const MAXP = 900;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(MAXP * 3);
  const pCol = new Float32Array(MAXP * 3);
  const pSize = new Float32Array(MAXP);
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('pcolor', new THREE.BufferAttribute(pCol, 3));
  pGeo.setAttribute('psize', new THREE.BufferAttribute(pSize, 1));
  const sparkTex = makeSpark();
  const pMat = new THREE.ShaderMaterial({
    uniforms: { tex: { value: sparkTex } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float psize; attribute vec3 pcolor; varying vec3 vC;
      void main(){ vC=pcolor; vec4 mv=modelViewMatrix*vec4(position,1.0);
        gl_PointSize = psize * (300.0/-mv.z); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `
      uniform sampler2D tex; varying vec3 vC;
      void main(){ vec4 t=texture2D(tex,gl_PointCoord); gl_FragColor=vec4(vC,1.0)*t; }`,
  });
  const points = new THREE.Points(pGeo, pMat);
  points.frustumCulled = false;
  scene.add(points);

  const parts = new Array(MAXP).fill(null).map(() => ({ active: false, life: 0, max: 1, vx: 0, vy: 0, vz: 0, grav: -9, drag: 0.9, r: 1, g: 1, b: 1, size: 1 }));
  let pHead = 0;
  function emit(x, y, z, opt) {
    const p = parts[pHead];
    p.active = true; p.life = p.max = opt.life;
    p.px = x; p.py = y; p.pz = z;
    p.vx = opt.vx; p.vy = opt.vy; p.vz = opt.vz;
    p.grav = opt.grav; p.drag = opt.drag; p.r = opt.r; p.g = opt.g; p.b = opt.b; p.size = opt.size;
    pPos[pHead * 3] = x; pPos[pHead * 3 + 1] = y; pPos[pHead * 3 + 2] = z;
    pHead = (pHead + 1) % MAXP;
  }

  function impact(point, normal, kind = 'wall') {
    // spark burst
    const n = kind === 'flesh' ? 14 : 10;
    for (let i = 0; i < n; i++) {
      const spd = 3 + Math.random() * 6;
      const dx = normal.x + (Math.random() * 2 - 1);
      const dy = normal.y + (Math.random() * 2 - 1) + 0.5;
      const dz = normal.z + (Math.random() * 2 - 1);
      const isBlood = kind === 'flesh';
      emit(point.x, point.y, point.z, {
        life: 0.4 + Math.random() * 0.4, vx: dx * spd, vy: dy * spd, vz: dz * spd,
        grav: isBlood ? -14 : -10, drag: 0.86,
        r: isBlood ? 0.65 : 0.6, g: isBlood ? 0.05 : 0.42, b: isBlood ? 0.05 : 0.16,
        size: isBlood ? 3.0 : 1.9,
      });
    }
    // smoke puff for wall
    if (kind !== 'flesh') {
      for (let i = 0; i < 4; i++) {
        emit(point.x, point.y, point.z, {
          life: 0.5 + Math.random() * 0.35, vx: (Math.random() - 0.5) * 1.5, vy: 0.6 + Math.random(), vz: (Math.random() - 0.5) * 1.5,
          grav: 1.5, drag: 0.9, r: 0.18, g: 0.18, b: 0.2, size: 3.4,
        });
      }
      // decal
      decal(point, normal);
    }
    // light pop
    flashAt(point, kind === 'flesh' ? 0xff3020 : 0xffc060, 6, 3.5);
  }

  // ---- Bullet-hole decals (ring pool) ----
  const decals = [];
  const decalGeo = new THREE.CircleGeometry(0.08, 12);
  const decalTex = makeDecal();
  function decal(point, normal) {
    if (decals.length > 60) { const d = decals.shift(); scene.remove(d); }
    const m = new THREE.Mesh(decalGeo, new THREE.MeshBasicMaterial({ map: decalTex, transparent: true, depthWrite: false, opacity: 0.9, polygonOffset: true, polygonOffsetFactor: -4 }));
    m.position.copy(point).addScaledVector(normal, 0.01);
    m.lookAt(point.clone().add(normal));
    m.scale.setScalar(0.6 + Math.random() * 0.6);
    scene.add(m); decals.push(m);
  }

  // ---- Explosion (barrel) ----
  function explosion(pos) {
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI - Math.PI / 2;
      const spd = 4 + Math.random() * 12;
      emit(pos.x, pos.y, pos.z, {
        life: 0.5 + Math.random() * 0.7,
        vx: Math.cos(a) * Math.cos(e) * spd, vy: Math.abs(Math.sin(e)) * spd + 3, vz: Math.sin(a) * Math.cos(e) * spd,
        grav: -12, drag: 0.9, r: 1, g: 0.5 + Math.random() * 0.3, b: 0.1, size: 5,
      });
    }
    flashAt(pos, 0xff8020, 200, 16);
  }

  // ---- transient point lights ----
  const flashLights = [];
  function flashAt(pos, color, intensity = 40, range = 6) {
    const l = new THREE.PointLight(color, intensity, range, 2);
    l.position.copy(pos); scene.add(l);
    flashLights.push({ light: l, life: 0.12, max: 0.12 });
  }

  function update(dt) {
    // tracers
    for (let i = tracers.length - 1; i >= 0; i--) {
      const t = tracers[i]; t.life -= dt;
      t.mesh.material.opacity = Math.max(0, t.life / t.max) * 0.9;
      if (t.life <= 0) { scene.remove(t.mesh); tracers.splice(i, 1); }
    }
    // particles
    const posAttr = pGeo.attributes.position, colAttr = pGeo.attributes.pcolor, sizeAttr = pGeo.attributes.psize;
    for (let i = 0; i < MAXP; i++) {
      const p = parts[i];
      if (!p.active) { sizeAttr.array[i] = 0; continue; }
      p.life -= dt;
      if (p.life <= 0) { p.active = false; sizeAttr.array[i] = 0; continue; }
      p.vy += p.grav * dt;
      p.vx *= p.drag; p.vz *= p.drag;
      p.px += p.vx * dt; p.py += p.vy * dt; p.pz += p.vz * dt;
      if (p.py < 0.02) { p.py = 0.02; p.vy *= -0.3; p.vx *= 0.6; p.vz *= 0.6; }
      const k = p.life / p.max;
      posAttr.array[i * 3] = p.px; posAttr.array[i * 3 + 1] = p.py; posAttr.array[i * 3 + 2] = p.pz;
      colAttr.array[i * 3] = p.r * k; colAttr.array[i * 3 + 1] = p.g * k; colAttr.array[i * 3 + 2] = p.b * k;
      sizeAttr.array[i] = p.size * (0.4 + k * 0.6);
    }
    posAttr.needsUpdate = colAttr.needsUpdate = sizeAttr.needsUpdate = true;

    // flash lights
    for (let i = flashLights.length - 1; i >= 0; i--) {
      const f = flashLights[i]; f.life -= dt;
      f.light.intensity = Math.max(0, (f.life / f.max)) * f.light.intensity;
      if (f.life <= 0) { scene.remove(f.light); flashLights.splice(i, 1); }
    }
  }

  function clear() {
    for (const t of tracers) scene.remove(t.mesh); tracers.length = 0;
    for (const d of decals) scene.remove(d); decals.length = 0;
    for (const f of flashLights) scene.remove(f.light); flashLights.length = 0;
    for (const p of parts) p.active = false;
  }

  return { tracer, impact, explosion, update, clear };
}

function makeSpark() {
  const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
  const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 32, 32);
  const t = new THREE.CanvasTexture(c); return t;
}
function makeDecal() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.clearRect(0, 0, 64, 64);
  const g = x.createRadialGradient(32, 32, 2, 32, 32, 26);
  g.addColorStop(0, 'rgba(6,6,8,0.95)'); g.addColorStop(0.6, 'rgba(20,18,16,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.beginPath(); x.arc(32, 32, 26, 0, 7); x.fill();
  x.fillStyle = 'rgba(0,0,0,0.9)'; x.beginPath(); x.arc(32, 32, 7, 0, 7); x.fill();
  const t = new THREE.CanvasTexture(c); return t;
}
