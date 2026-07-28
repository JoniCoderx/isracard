import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const GRAVITY = -26;
const WALK = 6.2;
const SPRINT = 10.2;
const CROUCH = 3.4;
const JUMP_V = 8.4;
const RADIUS = 0.4;
const STAND_H = 1.72;
const CROUCH_H = 1.05;
const ACCEL = 14;
const AIR_ACCEL = 4;
const FRICTION = 11;

export function createPlayer(camera, domElement, world) {
  const controls = new PointerLockControls(camera, domElement);
  const obj = controls.getObject();
  obj.position.set(0, STAND_H, 20);
  world.scene.add(obj);

  const vel = new THREE.Vector3();
  const state = {
    onGround: true, crouching: false, sprinting: false, ads: false,
    height: STAND_H, speed: 0, hp: 100, maxHp: 100, alive: true,
    moving: false, wishDir: new THREE.Vector3(),
  };

  const keys = {};
  function onKey(e, down) {
    const k = e.code;
    keys[k] = down;
  }
  window.addEventListener('keydown', (e) => onKey(e, true));
  window.addEventListener('keyup', (e) => onKey(e, false));

  const _forward = new THREE.Vector3();
  const _right = new THREE.Vector3();
  const _box = new THREE.Box3();
  const _tmp = new THREE.Vector3();

  function playerBox(pos, h) {
    _box.min.set(pos.x - RADIUS, pos.y - h, pos.z - RADIUS);
    _box.max.set(pos.x + RADIUS, pos.y + 0.15, pos.z + RADIUS);
    return _box;
  }

  // Resolve collision on a single horizontal axis against world colliders.
  function collideAxis(pos, axis) {
    const b = playerBox(pos, state.height);
    for (const c of world.colliders) {
      if (!b.intersectsBox(c)) continue;
      if (axis === 'x') {
        const push = vel.x > 0 ? c.min.x - b.max.x : c.max.x - b.min.x;
        pos.x += push; vel.x = 0;
      } else {
        const push = vel.z > 0 ? c.min.z - b.max.z : c.max.z - b.min.z;
        pos.z += push; vel.z = 0;
      }
      b.min.set(pos.x - RADIUS, pos.y - state.height, pos.z - RADIUS);
      b.max.set(pos.x + RADIUS, pos.y + 0.15, pos.z + RADIUS);
    }
  }

  function update(dt) {
    if (!state.alive) return;

    // crouch smoothing
    const wantCrouch = keys['ControlLeft'] || keys['ControlRight'] || keys['KeyC'];
    state.crouching = wantCrouch && state.onGround;
    const targetH = state.crouching ? CROUCH_H : STAND_H;
    state.height += (targetH - state.height) * Math.min(1, dt * 12);

    // desired direction (camera relative, flattened)
    camera.getWorldDirection(_forward);
    _forward.y = 0; _forward.normalize();
    _right.crossVectors(_forward, new THREE.Vector3(0, 1, 0)).normalize();

    const wish = state.wishDir.set(0, 0, 0);
    if (keys['KeyW']) wish.add(_forward);
    if (keys['KeyS']) wish.sub(_forward);
    if (keys['KeyD']) wish.add(_right);
    if (keys['KeyA']) wish.sub(_right);
    const moving = wish.lengthSq() > 0;
    if (moving) wish.normalize();
    state.moving = moving;

    state.sprinting = (keys['ShiftLeft'] || keys['ShiftRight']) && keys['KeyW'] && !state.crouching && !state.ads;
    let maxSpeed = state.crouching ? CROUCH : state.sprinting ? SPRINT : WALK;
    if (state.ads) maxSpeed *= 0.55;

    // horizontal acceleration with friction (source-like feel)
    const accel = state.onGround ? ACCEL : AIR_ACCEL;
    const horiz = _tmp.set(vel.x, 0, vel.z);
    if (state.onGround) {
      const sp = horiz.length();
      if (sp > 0) {
        const drop = sp * FRICTION * dt;
        const ns = Math.max(0, sp - drop);
        if (sp > 0) { horiz.multiplyScalar(ns / sp); }
      }
    }
    // add wish acceleration
    horiz.x += wish.x * accel * maxSpeed * dt;
    horiz.z += wish.z * accel * maxSpeed * dt;
    // clamp to max speed (ground only)
    const hs = horiz.length();
    if (state.onGround && hs > maxSpeed) horiz.multiplyScalar(maxSpeed / hs);
    vel.x = horiz.x; vel.z = horiz.z;
    state.speed = Math.hypot(vel.x, vel.z);

    // jump
    if ((keys['Space']) && state.onGround) {
      vel.y = JUMP_V; state.onGround = false;
    }

    // gravity
    vel.y += GRAVITY * dt;

    const pos = obj.position;
    // integrate + collide per-axis
    pos.x += vel.x * dt; collideAxis(pos, 'x');
    pos.z += vel.z * dt; collideAxis(pos, 'z');

    // vertical
    pos.y += vel.y * dt;

    // land on top of colliders (feet check)
    state.onGround = false;
    const feet = pos.y - state.height;
    const b = playerBox(pos, state.height);
    for (const c of world.colliders) {
      // horizontal overlap?
      if (b.max.x > c.min.x && b.min.x < c.max.x && b.max.z > c.min.z && b.min.z < c.max.z) {
        if (vel.y <= 0 && feet <= c.max.y + 0.05 && feet > c.max.y - 0.6) {
          pos.y = c.max.y + state.height; vel.y = 0; state.onGround = true;
        }
      }
    }
    // ground plane
    if (pos.y - state.height <= 0) { pos.y = state.height; vel.y = 0; state.onGround = true; }

    // keep in arena
    const bd = world.bounds;
    pos.x = Math.max(bd.min, Math.min(bd.max, pos.x));
    pos.z = Math.max(bd.min, Math.min(bd.max, pos.z));
  }

  function damage(amount) {
    if (!state.alive) return;
    state.hp = Math.max(0, state.hp - amount);
    if (state.hp <= 0) { state.alive = false; }
  }
  function heal(a) { state.hp = Math.min(state.maxHp, state.hp + a); }
  function reset() {
    state.hp = state.maxHp; state.alive = true; state.height = STAND_H;
    vel.set(0, 0, 0); obj.position.set(0, STAND_H, 20);
  }

  return { controls, object: obj, camera, state, velocity: vel, keys, update, damage, heal, reset };
}
