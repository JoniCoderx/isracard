import * as THREE from 'three';

const bodyMat = () => new THREE.MeshStandardMaterial({ color: 0x2a2f36, roughness: 0.7, metalness: 0.3 });
const limbMat = () => new THREE.MeshStandardMaterial({ color: 0x20242a, roughness: 0.75, metalness: 0.25 });
const visorMat = () => new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xff2a1e, emissiveIntensity: 3.2, roughness: 0.3 });
const vestMat = () => new THREE.MeshStandardMaterial({ color: 0x14181d, roughness: 0.6, metalness: 0.4 });

function buildEnemy() {
  const g = new THREE.Group();
  const parts = {};
  const b = bodyMat(), l = limbMat(), v = visorMat(), ve = vestMat();

  function m(geo, mat, x, y, z) { const me = new THREE.Mesh(geo, mat); me.position.set(x, y, z); me.castShadow = true; g.add(me); return me; }

  // torso
  parts.torso = m(new THREE.CapsuleGeometry(0.24, 0.42, 6, 12), b, 0, 1.15, 0);
  m(new THREE.BoxGeometry(0.5, 0.5, 0.28), ve, 0, 1.18, 0.02); // vest
  // head + visor
  const head = new THREE.Group(); head.position.set(0, 1.62, 0); g.add(head); parts.head = head;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), b); skull.castShadow = true; head.add(skull);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.07, 0.06), v); visor.position.set(0, 0.0, 0.13); head.add(visor);
  parts.visor = visor;
  // shoulders
  m(new THREE.SphereGeometry(0.12, 10, 10), ve, 0.28, 1.34, 0);
  m(new THREE.SphereGeometry(0.12, 10, 10), ve, -0.28, 1.34, 0);
  // arms (pivot at shoulder)
  function arm(side) {
    const a = new THREE.Group(); a.position.set(side * 0.30, 1.34, 0); g.add(a);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.34, 4, 8), l); upper.position.set(0, -0.22, 0); upper.castShadow = true; a.add(upper);
    return a;
  }
  parts.armL = arm(1); parts.armR = arm(-1);
  // legs (pivot at hip)
  function leg(side) {
    const lg = new THREE.Group(); lg.position.set(side * 0.12, 0.92, 0); g.add(lg);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.4, 4, 8), l); thigh.position.set(0, -0.28, 0); thigh.castShadow = true; lg.add(thigh);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.24), vestMat()); boot.position.set(0, -0.52, 0.04); boot.castShadow = true; lg.add(boot);
    return lg;
  }
  parts.legL = leg(1); parts.legR = leg(-1);

  return { group: g, parts };
}

export function createEnemyManager(world, effects, audio) {
  const enemies = [];
  const _v = new THREE.Vector3();
  const _v2 = new THREE.Vector3();

  function spawn(pos, tier = 0) {
    const { group, parts } = buildEnemy();
    group.position.copy(pos);
    world.scene.add(group);
    const hpBase = 100 + tier * 60;
    const e = {
      group, parts, tier,
      hp: hpBase, maxHp: hpBase,
      speed: 2.2 + Math.random() * 0.8 + tier * 0.5,
      state: 'chase', // chase | attack | dead
      walkPhase: Math.random() * 6.28,
      attackCd: 0, dead: false, deathT: 0, hitFlash: 0,
      radius: 0.35, height: 1.8,
      velY: 0, fallRot: 0,
      box: new THREE.Box3(),
    };
    // scale up tougher tiers slightly + tint visor
    if (tier > 0) {
      group.scale.setScalar(1 + tier * 0.08);
      parts.visor.material = parts.visor.material.clone();
      parts.visor.material.color.setHex(tier === 1 ? 0xffa500 : 0xbe4bff);
      parts.visor.material.emissive.setHex(tier === 1 ? 0xffa500 : 0xbe4bff);
    }
    enemies.push(e);
    return e;
  }

  // hitscan test: returns closest hit enemy + distance + headshot flag
  const _ray = new THREE.Ray();
  const _sphere = new THREE.Sphere();
  function raycast(origin, dir, maxDist, colliders) {
    _ray.origin.copy(origin); _ray.direction.copy(dir);
    // first, distance to nearest world collider (so bullets stop at walls)
    let wallDist = maxDist;
    const _p = new THREE.Vector3();
    for (const c of colliders) {
      const t = _ray.intersectBox(c, _p);
      if (t) { const d = origin.distanceTo(_p); if (d < wallDist) wallDist = d; }
    }
    let best = null, bestDist = wallDist;
    for (const e of enemies) {
      if (e.dead) continue;
      // body sphere
      _sphere.center.copy(e.group.position).add(_v.set(0, 1.15, 0).multiplyScalar(e.group.scale.x));
      _sphere.radius = 0.42 * e.group.scale.x;
      let hit = _ray.intersectSphere(_sphere, _v2);
      let head = false;
      // head sphere
      _sphere.center.copy(e.group.position).add(_v.set(0, 1.62, 0).multiplyScalar(e.group.scale.x));
      _sphere.radius = 0.2 * e.group.scale.x;
      const hh = _ray.intersectSphere(_sphere, _v2);
      let d = Infinity;
      if (hit) d = origin.distanceTo(hit);
      if (hh) { const dh = origin.distanceTo(hh); if (dh <= d) { d = dh; head = true; } }
      if ((hit || hh) && d < bestDist) { best = e; bestDist = d; best._head = head; }
    }
    return { enemy: best, dist: bestDist, wallDist };
  }

  function damageEnemy(e, dmg, head) {
    const total = head ? dmg * 2.4 : dmg;
    e.hp -= total;
    e.hitFlash = 1;
    if (e.hp <= 0 && !e.dead) {
      e.dead = true; e.state = 'dead'; e.deathT = 0;
      audio && audio.enemyDie();
      return { killed: true, head };
    }
    return { killed: false, head };
  }

  const _target = new THREE.Vector3();
  function update(dt, playerObj, playerState, onPlayerHit) {
    const pPos = playerObj.position;
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      const g = e.group;

      if (e.dead) {
        e.deathT += dt;
        // fall over + sink + fade
        e.fallRot = Math.min(Math.PI / 2, e.fallRot + dt * 4);
        g.rotation.x = -e.fallRot;
        g.position.y = Math.max(-0.4, -e.fallRot * 0.15);
        if (e.deathT > 1.4) {
          g.traverse(o => { if (o.material) { o.material.transparent = true; o.material.opacity = Math.max(0, 1 - (e.deathT - 1.4) * 1.6); } });
        }
        if (e.deathT > 2.4) { world.scene.remove(g); enemies.splice(i, 1); }
        continue;
      }

      // hit flash decays
      if (e.hitFlash > 0) {
        e.hitFlash = Math.max(0, e.hitFlash - dt * 4);
        const f = e.hitFlash;
        e.parts.torso.material.emissive.setRGB(f * 0.8, f * 0.1, f * 0.1);
        e.parts.torso.material.emissiveIntensity = f;
      }

      // steering toward player
      _target.copy(pPos); _target.y = g.position.y;
      _v.subVectors(_target, g.position); _v.y = 0;
      const dist = _v.length();
      _v.normalize();

      // face player
      const yaw = Math.atan2(_v.x, _v.z);
      g.rotation.y = yaw;

      if (dist > 2.0) {
        e.state = 'chase';
        // simple separation from other enemies
        _v2.set(0, 0, 0);
        for (const o of enemies) {
          if (o === e || o.dead) continue;
          const dx = g.position.x - o.group.position.x, dz = g.position.z - o.group.position.z;
          const d2 = dx * dx + dz * dz;
          if (d2 < 1.2 && d2 > 0.0001) { const inv = 1 / Math.sqrt(d2); _v2.x += dx * inv; _v2.z += dz * inv; }
        }
        _v.x += _v2.x * 0.5; _v.z += _v2.z * 0.5; _v.normalize();

        const step = e.speed * dt;
        const nx = g.position.x + _v.x * step;
        const nz = g.position.z + _v.z * step;
        // crude wall avoidance: test box
        e.box.min.set(nx - e.radius, g.position.y, nz - e.radius);
        e.box.max.set(nx + e.radius, g.position.y + e.height, nz + e.radius);
        let blocked = false;
        for (const c of world.colliders) { if (e.box.intersectsBox(c)) { blocked = true; break; } }
        if (!blocked) { g.position.x = nx; g.position.z = nz; }
        else { // slide along
          g.position.x += _v.x * step * 0.3 * (Math.random() > 0.5 ? 1 : -1);
        }
        const bd = world.bounds;
        g.position.x = Math.max(bd.min, Math.min(bd.max, g.position.x));
        g.position.z = Math.max(bd.min, Math.min(bd.max, g.position.z));

        // procedural walk
        e.walkPhase += dt * e.speed * 3.2;
        const sw = Math.sin(e.walkPhase) * 0.7;
        e.parts.legL.rotation.x = sw; e.parts.legR.rotation.x = -sw;
        e.parts.armL.rotation.x = -sw * 0.7; e.parts.armR.rotation.x = sw * 0.7;
        e.group.position.y = Math.abs(Math.sin(e.walkPhase)) * 0.04;
      } else {
        e.state = 'attack';
        e.attackCd -= dt;
        if (e.attackCd <= 0) {
          e.attackCd = 1.0;
          if (playerState.alive) {
            const dmg = 8 + e.tier * 4;
            onPlayerHit(dmg, g.position.clone());
            // lunge anim
            e.parts.armR.rotation.x = -1.2; e.parts.armL.rotation.x = -1.2;
          }
        } else {
          e.parts.armR.rotation.x += (0 - e.parts.armR.rotation.x) * Math.min(1, dt * 6);
          e.parts.armL.rotation.x += (0 - e.parts.armL.rotation.x) * Math.min(1, dt * 6);
        }
      }
    }
  }

  function aliveCount() { let n = 0; for (const e of enemies) if (!e.dead) n++; return n; }
  function totalCount() { return enemies.length; }
  function clear() { for (const e of enemies) world.scene.remove(e.group); enemies.length = 0; }

  return { enemies, spawn, raycast, damageEnemy, update, aliveCount, totalCount, clear };
}
