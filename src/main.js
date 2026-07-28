import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { createWorld } from './world.js';
import { createPlayer } from './player.js';
import { createWeapon } from './weapons.js';
import { createEnemyManager } from './enemies.js';
import { createEffects } from './effects.js';
import { createHUD } from './hud.js';
import { createAudio } from './audio.js';

const params = new URLSearchParams(location.search);
const AUTO = params.has('auto');       // demo/QA mode: runs without pointer-lock
const app = document.getElementById('app');

// ---------- Renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

// ---------- Scene / camera ----------
const world = createWorld(renderer);
const scene = world.scene;
const BASE_FOV = 76;
const camera = new THREE.PerspectiveCamera(BASE_FOV, innerWidth / innerHeight, 0.05, 500);
camera.rotation.order = 'YXZ';

// ---------- Post-processing ----------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.32, 0.55, 0.92);
composer.addPass(bloom);
composer.addPass(new SMAAPass(innerWidth * renderer.getPixelRatio(), innerHeight * renderer.getPixelRatio()));
const outputPass = new OutputPass();
composer.addPass(outputPass);

// ---------- Systems ----------
const hud = createHUD();
const audio = createAudio();
const effects = createEffects(scene);
const player = createPlayer(camera, renderer.domElement, world);
const weapon = createWeapon(camera, effects, audio);
const enemies = createEnemyManager(world, effects, audio);

// Dedicated view-light so the viewmodel reads against dark environments.
const viewLight = new THREE.PointLight(0xd6e4fa, 2.0, 1.1, 2.0); // short range → minimal world spill
viewLight.position.set(0.16, 0.22, -0.42);
camera.add(viewLight);
const viewRim = new THREE.PointLight(0x8aa0d0, 1.4, 1.1, 2.0);
viewRim.position.set(-0.12, 0.05, -0.48); // grazes the camera-facing side
camera.add(viewRim);
scene.add(camera); // ensure camera (and its viewmodel children) are in the graph

// ---------- Game state ----------
const GAME = { state: 'menu', wave: 0, kills: 0, spawnQueue: [], waveCooldown: 0, pendingWave: false };
let firing = false;
const _muzzleWorld = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _camPos = new THREE.Vector3();

// ---------- Input ----------
function bindInput() {
  document.getElementById('start-btn').onclick = startGame;
  document.getElementById('retry-btn').onclick = startGame;
  document.getElementById('resume-btn').onclick = () => setPaused(false);

  addEventListener('resize', onResize);

  renderer.domElement.addEventListener('mousedown', (e) => {
    if (GAME.state !== 'playing') return;
    if (e.button === 0) firing = true;
    if (e.button === 2) { weapon.setAds(true); }
  });
  addEventListener('mouseup', (e) => {
    if (e.button === 0) firing = false;
    if (e.button === 2) weapon.setAds(false);
  });
  addEventListener('contextmenu', (e) => e.preventDefault());
  addEventListener('keydown', (e) => {
    if (e.code === 'KeyR' && GAME.state === 'playing') weapon.reload();
    if (e.code === 'Escape' && GAME.state === 'playing') setPaused(true);
  });

  if (!AUTO) {
    player.controls.addEventListener('unlock', () => {
      if (GAME.state === 'playing') setPaused(true);
    });
  }
}

function onResize() {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
}

// ---------- Flow ----------
function startGame() {
  hud.hideMenu(); hud.hideGameOver(); hud.hidePause(); hud.show();
  audio.init(); audio.resume();
  enemies.clear(); effects.clear();
  player.reset(); weapon.reset();
  GAME.state = 'playing'; GAME.wave = 0; GAME.kills = 0; GAME.spawnQueue = []; GAME.pendingWave = false; GAME.waveCooldown = 1.2;
  firing = false;
  if (!AUTO) player.controls.lock();
  updateHudStatic();
}
function setPaused(p) {
  if (p) { GAME.state = 'paused'; hud.showPause(); if (!AUTO) document.exitPointerLock?.(); }
  else { GAME.state = 'playing'; hud.hidePause(); if (!AUTO) player.controls.lock(); }
}
function gameOver() {
  GAME.state = 'dead';
  hud.showGameOver(GAME.wave, GAME.kills);
  if (!AUTO) document.exitPointerLock?.();
}

function updateHudStatic() {
  hud.setHealth(player.state.hp, player.state.maxHp);
  hud.setAmmo(weapon.st.ammo, weapon.st.reserve);
  hud.setWeapon(weapon.cfg.name);
  hud.setStats(GAME.wave, GAME.kills, enemies.aliveCount());
}

// ---------- Waves ----------
function startWave(n) {
  GAME.wave = n;
  audio.waveStart();
  hud.announce('WAVE ' + n, n % 5 === 0 ? 'HEAVY ASSAULT' : 'INCOMING HOSTILES');
  const count = 4 + n * 2;
  GAME.spawnQueue = [];
  for (let i = 0; i < count; i++) {
    let tier = 0;
    const r = Math.random();
    if (n >= 3 && r > 0.85) tier = 2; else if (n >= 2 && r > 0.6) tier = 1;
    GAME.spawnQueue.push({ delay: 0.4 + i * (0.55 - Math.min(0.35, n * 0.03)), tier });
  }
  GAME.pendingWave = false;
}

function processSpawns(dt) {
  const pPos = player.object.position;
  for (const s of GAME.spawnQueue) {
    s.delay -= dt;
    if (s.delay <= 0 && !s.done) {
      s.done = true;
      // spawn at arena edge away from player
      let x, z, tries = 0;
      do {
        const a = Math.random() * Math.PI * 2;
        const rad = 22 + Math.random() * 5;
        x = Math.cos(a) * rad; z = Math.sin(a) * rad;
        tries++;
      } while (Math.hypot(x - pPos.x, z - pPos.z) < 12 && tries < 8);
      x = Math.max(world.bounds.min, Math.min(world.bounds.max, x));
      z = Math.max(world.bounds.min, Math.min(world.bounds.max, z));
      enemies.spawn(new THREE.Vector3(x, 0, z), s.tier);
    }
  }
  GAME.spawnQueue = GAME.spawnQueue.filter(s => !s.done);
}

// ---------- Shooting ----------
const _hitPoint = new THREE.Vector3();
const _normal = new THREE.Vector3();

function onShoot(shot) {
  weapon.muzzle.getWorldPosition(_muzzleWorld);

  // barrels first
  let barrelHit = null, barrelDist = Infinity;
  const ray = new THREE.Ray(shot.origin, shot.dir);
  const _bp = new THREE.Vector3();
  for (const b of world.barrels) {
    if (b.userData.dead) continue;
    const sph = new THREE.Sphere(b.position.clone().setY(0.55), 0.55);
    if (ray.intersectSphere(sph, _bp)) {
      const d = shot.origin.distanceTo(_bp);
      if (d < barrelDist) { barrelDist = d; barrelHit = b; }
    }
  }

  const res = enemies.raycast(shot.origin, shot.dir, 200, world.colliders);
  const enemyDist = res.enemy ? res.dist : Infinity;

  // whichever is closest
  const minDist = Math.min(enemyDist, res.wallDist, barrelDist);

  if (barrelHit && barrelDist <= minDist + 0.01) {
    explodeBarrel(barrelHit, _bp.copy(shot.origin).addScaledVector(shot.dir, barrelDist));
    effects.tracer(_muzzleWorld, shot.origin.clone().addScaledVector(shot.dir, barrelDist));
    return;
  }

  if (res.enemy && enemyDist <= minDist + 0.01) {
    _hitPoint.copy(shot.origin).addScaledVector(shot.dir, enemyDist);
    effects.tracer(_muzzleWorld, _hitPoint);
    effects.impact(_hitPoint, _normal.copy(shot.dir).negate(), 'flesh');
    const out = enemies.damageEnemy(res.enemy, shot.damage, res.enemy._head);
    audio.hitMarker();
    hud.hitmarker(out.killed);
    if (out.killed) {
      GAME.kills++;
      hud.killFeed((out.head ? '★ ' : '') + 'HOSTILE <b>ELIMINATED</b>');
    }
  } else {
    // wall
    _hitPoint.copy(shot.origin).addScaledVector(shot.dir, Math.min(res.wallDist, 200));
    effects.tracer(_muzzleWorld, _hitPoint);
    if (res.wallDist < 200) effects.impact(_hitPoint, _normal.copy(shot.dir).negate(), 'wall');
  }
}

function explodeBarrel(barrel, at) {
  barrel.userData.dead = true;
  barrel.visible = false;
  effects.explosion(at);
  audio.explosion();
  hud.damageFlash(0.15);
  // area damage
  for (const e of enemies.enemies) {
    if (e.dead) continue;
    const d = e.group.position.distanceTo(barrel.position);
    if (d < 6) {
      const out = enemies.damageEnemy(e, 200 * (1 - d / 6), false);
      if (out.killed) { GAME.kills++; hud.killFeed('HOSTILE <b>ELIMINATED</b>'); }
    }
  }
  // damage player if close
  const dp = player.object.position.distanceTo(barrel.position);
  if (dp < 6) onPlayerHit(30 * (1 - dp / 6), barrel.position.clone());
}

function onPlayerHit(dmg, sourcePos) {
  if (player.state.alive === false) return;
  player.damage(dmg);
  audio.playerHurt();
  hud.damageFlash(0.3 + Math.min(0.5, dmg / 40));
  // direction indicator
  camera.getWorldDirection(_camDir); _camDir.y = 0; _camDir.normalize();
  const toSrc = new THREE.Vector3().subVectors(sourcePos, player.object.position); toSrc.y = 0; toSrc.normalize();
  const ang = Math.atan2(toSrc.x, toSrc.z) - Math.atan2(_camDir.x, _camDir.z);
  hud.dirIndicator(THREE.MathUtils.radToDeg(ang) + 180);
  hud.setHealth(player.state.hp, player.state.maxHp);
  if (!player.state.alive) gameOver();
}

// ---------- Auto/demo camera ----------
let demoT = 0;
function driveDemo(dt) {
  if (window.__FREEZE) { firing = window.__FIRE || false; return; }
  demoT += dt;
  // pick nearest alive enemy to look at, else slow pan
  let target = null, best = Infinity;
  for (const e of enemies.enemies) {
    if (e.dead) continue;
    const d = e.group.position.distanceTo(player.object.position);
    if (d < best) { best = d; target = e; }
  }
  if (target) {
    const to = new THREE.Vector3().subVectors(
      target.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)),
      camera.getWorldPosition(_camPos)
    );
    const yaw = Math.atan2(to.x, to.z);
    const pitch = Math.atan2(to.y, Math.hypot(to.x, to.z));
    camera.rotation.y += (Math.atan2(Math.sin(yaw - camera.rotation.y), Math.cos(yaw - camera.rotation.y))) * Math.min(1, dt * 3);
    camera.rotation.x += ((pitch) - camera.rotation.x) * Math.min(1, dt * 3);
    firing = best < 40;
    weapon.setAds(best < 25);
  } else {
    camera.rotation.y += dt * 0.25;
    firing = false;
  }
  // gentle strafe for parallax
  player.keys['KeyW'] = false;
}

// ---------- Loop ----------
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());

  world.update(dt);
  effects.update(dt);
  hud.update(dt);

  if (GAME.state === 'playing') {
    if (AUTO) driveDemo(dt);
    player.update(dt);
    weapon.update(dt, player.state);
    enemies.update(dt, player.object, player.state, onPlayerHit);

    // auto-fire
    if (firing) {
      const now = performance.now() / 1000;
      weapon.tryFire(now, { moving: player.state.moving, onGround: player.state.onGround }, onShoot);
    }

    // wave management
    if (GAME.spawnQueue.length) processSpawns(dt);
    const remaining = enemies.aliveCount() + GAME.spawnQueue.length;
    if (remaining === 0) {
      if (!GAME.pendingWave) { GAME.pendingWave = true; GAME.waveCooldown = 3.0; if (GAME.wave > 0) hud.announce('SECTOR CLEAR', 'Reinforcements inbound'); }
      GAME.waveCooldown -= dt;
      if (GAME.waveCooldown <= 0) startWave(GAME.wave + 1);
    }

    // ADS fov + crosshair spread
    const adsFov = weapon.st.ads ? 55 : BASE_FOV;
    camera.fov += (adsFov - camera.fov) * Math.min(1, dt * 12);
    camera.updateProjectionMatrix();
    const spread = (weapon.st.ads ? 2 : 6) + player.state.speed * 0.8 + weapon.st.heat * 10 + (player.state.onGround ? 0 : 8);
    hud.setSpread(spread.toFixed(1));

    // live HUD
    hud.setHealth(player.state.hp, player.state.maxHp);
    hud.setAmmo(weapon.st.ammo, weapon.st.reserve);
    hud.setStats(GAME.wave, GAME.kills, enemies.aliveCount());
  }

  composer.render();
}

// ---------- Boot ----------
bindInput();
hud.setLoad(100);
setTimeout(() => hud.hideLoading(), 300);
animate();

if (AUTO) {
  // auto-start demo shortly after load for QA screenshots
  setTimeout(() => {
    startGame();
    GAME.wave = 1; GAME.pendingWave = true; GAME.waveCooldown = 999; // suppress auto-waves in demo
    // seed visible hostiles at varied ranges/tiers for representative screenshots
    const seed = [[6, 9, 0], [-5, 12, 1], [10, 6, 0], [-9, 7, 0], [3, 16, 2], [13, 13, 1], [-13, 14, 0]];
    for (const [x, z, t] of seed) enemies.spawn(new THREE.Vector3(x, 0, z), t);
    hud.setStats(GAME.wave, GAME.kills, enemies.aliveCount());
  }, 500);
}

// expose for debugging / QA
window.__GAME = { GAME, player, weapon, enemies, world, renderer, camera };
