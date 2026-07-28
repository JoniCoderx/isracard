import * as THREE from 'three';

// A stylized-but-detailed original carbine built from primitives (no external assets).
function buildCarbine() {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: 0x565b65, roughness: 0.5, metalness: 0.45, emissive: 0x646a76, emissiveIntensity: 1.15 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x24282f, roughness: 0.55, metalness: 0.55, emissive: 0x3a4049, emissiveIntensity: 1.05 });
  const rail = new THREE.MeshStandardMaterial({ color: 0x40454e, roughness: 0.35, metalness: 0.85, emissive: 0x2a2e35, emissiveIntensity: 0.8 });
  const accent = new THREE.MeshStandardMaterial({ color: 0x35e0ff, emissive: 0x1aa8cc, emissiveIntensity: 0.7, roughness: 0.3 });
  const grip = new THREE.MeshStandardMaterial({ color: 0x16181c, roughness: 0.85, metalness: 0.2 });

  function part(geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
    m.castShadow = true; g.add(m); return m;
  }
  // receiver
  part(new THREE.BoxGeometry(0.09, 0.10, 0.52), body, 0, 0, -0.05);
  // upper rail
  const railTop = part(new THREE.BoxGeometry(0.07, 0.03, 0.46), rail, 0, 0.065, -0.03);
  for (let i = 0; i < 8; i++) part(new THREE.BoxGeometry(0.075, 0.012, 0.012), dark, 0, 0.083, -0.22 + i * 0.05);
  // barrel + handguard
  part(new THREE.CylinderGeometry(0.022, 0.022, 0.46, 16), dark, 0, 0.005, -0.42, Math.PI / 2, 0, 0);
  part(new THREE.CylinderGeometry(0.045, 0.045, 0.30, 12), body, 0, 0.005, -0.30, Math.PI / 2, 0, 0);
  // muzzle
  const muzzle = part(new THREE.CylinderGeometry(0.03, 0.034, 0.09, 12), dark, 0, 0.005, -0.66, Math.PI / 2, 0, 0);
  // magazine (curved)
  part(new THREE.BoxGeometry(0.05, 0.20, 0.10), dark, 0, -0.14, 0.02, 0.25, 0, 0);
  // pistol grip
  part(new THREE.BoxGeometry(0.05, 0.15, 0.07), grip, 0, -0.11, 0.16, -0.35, 0, 0);
  // stock
  part(new THREE.BoxGeometry(0.06, 0.09, 0.20), body, 0, -0.01, 0.28);
  part(new THREE.BoxGeometry(0.05, 0.12, 0.05), grip, 0, -0.04, 0.36);
  // foregrip
  part(new THREE.BoxGeometry(0.04, 0.10, 0.04), grip, 0, -0.075, -0.34, 0.2, 0, 0);
  // holo sight
  part(new THREE.BoxGeometry(0.06, 0.05, 0.08), dark, 0, 0.10, -0.02);
  const reticleDot = part(new THREE.SphereGeometry(0.006, 8, 8), accent, 0, 0.11, -0.06);
  // side accent strip
  part(new THREE.BoxGeometry(0.005, 0.02, 0.3), accent, 0.047, 0.0, -0.05);
  part(new THREE.BoxGeometry(0.005, 0.02, 0.3), accent, -0.047, 0.0, -0.05);

  // muzzle world-anchor
  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0, 0.005, -0.72);
  g.add(muzzlePoint);

  return { group: g, muzzlePoint, reticleDot };
}

export function createWeapon(camera, effects, audio) {
  const { group, muzzlePoint } = buildCarbine();

  // Viewmodel rig attached to camera
  const rig = new THREE.Group();
  rig.add(group);
  camera.add(rig);
  // Viewmodel layer: gun meshes live on layers 0 (seen by camera + world lights)
  // AND 1 (lit by the dedicated view-lights, which are layer-1-only so they never spill on the world).
  rig.traverse((o) => { if (o.isMesh) o.layers.enable(1); });
  group.scale.setScalar(0.74);
  const HIP = new THREE.Vector3(0.3, -0.3, -0.8); // bottom-right, pushed back so it doesn't fill center
  const ADS = new THREE.Vector3(0.0, -0.1, -0.5);
  group.position.copy(HIP);
  group.rotation.set(0.03, -0.13, 0.02); // slight 3/4 angle so it reads as a rifle, not end-on
  group.userData.baseRot = group.rotation.clone();

  // muzzle flash (additive sprite) + light
  const flashTex = makeFlashTexture();
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: flashTex, color: 0xffe6a0, blending: THREE.AdditiveBlending, depthTest: false, transparent: true, opacity: 0 }));
  flash.scale.set(0.13, 0.13, 0.13);
  flash.position.set(0, 0, -0.04);
  muzzlePoint.add(flash);
  const flashLight = new THREE.PointLight(0xffd27a, 0, 8, 2);
  muzzlePoint.add(flashLight);

  const cfg = {
    name: 'MK-7 CARBINE', mag: 30, reserveMax: 240, rpm: 660, damage: 26,
    reloadTime: 1.9, spreadHip: 0.028, spreadAds: 0.006, recoilKick: 0.055, recoilRot: 0.02,
  };
  const st = {
    ammo: cfg.mag, reserve: 150, firing: false, ads: false,
    lastShot: 0, reloading: false, reloadT: 0, recoil: 0, heat: 0,
  };
  const shotInterval = 60 / cfg.rpm;

  // recoil / sway state
  let swayT = 0, kickPos = 0, kickRot = 0, curPos = new THREE.Vector3().copy(HIP), curADS = 0;
  const _dir = new THREE.Vector3();
  const _origin = new THREE.Vector3();

  function canFire(now) {
    return st.ammo > 0 && !st.reloading && (now - st.lastShot) >= shotInterval;
  }

  // returns a hitscan request {origin, dir, spread} or null
  function tryFire(now, playerState, onShoot) {
    if (!canFire(now)) {
      if (st.ammo <= 0 && !st.reloading) reload();
      return;
    }
    st.lastShot = now;
    st.ammo--;
    // recoil impulse
    kickPos = Math.min(1, kickPos + 1);
    kickRot = Math.min(1, kickRot + 1);
    st.heat = Math.min(1, st.heat + 0.12);

    // spread
    const spread = st.ads ? cfg.spreadAds : cfg.spreadHip;
    const s = spread * (1 + st.heat * 0.8) * (playerState.moving ? 1.5 : 1) * (playerState.onGround ? 1 : 2.2);

    camera.getWorldDirection(_dir);
    _dir.x += (Math.random() * 2 - 1) * s;
    _dir.y += (Math.random() * 2 - 1) * s;
    _dir.z += (Math.random() * 2 - 1) * s;
    _dir.normalize();
    camera.getWorldPosition(_origin);

    // muzzle flash
    flash.material.opacity = 1;
    flash.material.rotation = Math.random() * Math.PI;
    flash.scale.setScalar(0.10 + Math.random() * 0.06);
    flashLight.intensity = 14;
    audio && audio.shoot();

    onShoot({ origin: _origin.clone(), dir: _dir.clone(), damage: cfg.damage });
    return true;
  }

  function reload() {
    if (st.reloading || st.ammo === cfg.mag || st.reserve <= 0) return;
    st.reloading = true; st.reloadT = 0;
    audio && audio.reload();
  }

  function update(dt, playerState) {
    const now = performance.now() / 1000;

    // reload progress
    if (st.reloading) {
      st.reloadT += dt;
      if (st.reloadT >= cfg.reloadTime) {
        const need = cfg.mag - st.ammo;
        const take = Math.min(need, st.reserve);
        st.ammo += take; st.reserve -= take;
        st.reloading = false;
      }
    }

    st.heat = Math.max(0, st.heat - dt * 0.6);

    // ADS blend
    const adsTarget = st.ads && !st.reloading ? 1 : 0;
    curADS += (adsTarget - curADS) * Math.min(1, dt * 14);
    const basePos = new THREE.Vector3().lerpVectors(HIP, ADS, curADS);

    // weapon sway from movement (bob) + idle breathing
    swayT += dt * (playerState.moving ? (playerState.sprinting ? 13 : 9) : 2.2);
    const bobAmt = (playerState.moving ? (playerState.sprinting ? 0.026 : 0.014) : 0.004) * (1 - curADS * 0.7);
    const bobX = Math.cos(swayT) * bobAmt;
    const bobY = Math.abs(Math.sin(swayT)) * bobAmt;

    // recoil decay
    kickPos = Math.max(0, kickPos - dt * 9);
    kickRot = Math.max(0, kickRot - dt * 8);

    // sprint lower
    const sprintDrop = playerState.sprinting ? 0.05 : 0;
    const sprintRot = playerState.sprinting ? -0.5 : 0;

    curPos.lerp(new THREE.Vector3(
      basePos.x + bobX,
      basePos.y + bobY - sprintDrop - kickPos * 0.02,
      basePos.z + kickPos * cfg.recoilKick
    ), Math.min(1, dt * 22));
    group.position.copy(curPos);
    const br = group.userData.baseRot;
    group.rotation.set(
      br.x - kickRot * cfg.recoilRot + Math.sin(swayT * 0.5) * 0.004,
      br.y + Math.sin(swayT * 0.7) * 0.006,
      br.z + sprintRot + kickRot * 0.01 * (Math.random() - 0.5)
    );

    // flash decay
    if (flash.material.opacity > 0) {
      flash.material.opacity = Math.max(0, flash.material.opacity - dt * 22);
      flashLight.intensity = Math.max(0, flashLight.intensity - dt * 220);
    }

    // recoil pushes camera pitch slightly (visual). Handled via state for main to apply.
  }

  function reset() {
    st.ammo = cfg.mag; st.reserve = 150; st.reloading = false; st.heat = 0;
  }

  return { cfg, st, update, tryFire, reload, reset, muzzle: muzzlePoint,
    setAds: (v) => { st.ads = v; },
    getRecoilPitch: () => kickRot * 0.012,
  };
}

function makeFlashTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.2, 'rgba(255,235,150,0.95)');
  g.addColorStop(0.5, 'rgba(255,170,60,0.5)');
  g.addColorStop(1, 'rgba(255,120,30,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  // star spikes
  x.globalCompositeOperation = 'lighter'; x.strokeStyle = 'rgba(255,220,140,0.6)'; x.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2; x.beginPath(); x.moveTo(64, 64);
    x.lineTo(64 + Math.cos(a) * 60, 64 + Math.sin(a) * 60); x.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
