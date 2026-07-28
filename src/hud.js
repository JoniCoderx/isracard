export function createHUD() {
  const $ = (id) => document.getElementById(id);
  const el = {
    hud: $('hud'), crosshair: $('crosshair'), hitmarker: $('hitmarker'),
    wave: $('wave-num'), kills: $('kills-num'), enemies: $('enemies-num'),
    healthFill: $('health-fill'), healthNum: $('health-num'),
    ammoCur: $('ammo-cur'), ammoRes: $('ammo-res'), ammoWrap: $('ammo'), weaponName: $('weapon-name'),
    announce: $('announce'), announceBig: $('announce-big'), announceSub: $('announce-sub'),
    vignette: $('vignette'), lowhp: $('lowhp'), killfeed: $('killfeed'), dirDmg: $('dir-dmg'),
    menu: $('menu'), pause: $('pause'), gameover: $('gameover'), goStats: $('go-stats'),
    loading: $('loading'), loadbar: $('loadbar'),
  };
  let hmT = 0;

  function show() { el.hud.classList.remove('hidden'); }
  function hide() { el.hud.classList.add('hidden'); }

  function setHealth(hp, max) {
    const pct = Math.max(0, hp / max) * 100;
    el.healthFill.style.width = pct + '%';
    el.healthNum.textContent = Math.ceil(hp);
    el.healthFill.style.background = pct > 50
      ? 'linear-gradient(90deg,#16d67a,#7dffb0)'
      : pct > 25 ? 'linear-gradient(90deg,#e0b020,#ffe07a)'
      : 'linear-gradient(90deg,#e02020,#ff7a7a)';
    el.lowhp.style.opacity = pct < 30 ? (1 - pct / 30) * 0.9 : 0;
  }
  function setAmmo(cur, res) {
    el.ammoCur.textContent = cur; el.ammoRes.textContent = res;
    el.ammoWrap.classList.toggle('low', cur <= 6);
  }
  function setWeapon(name) { el.weaponName.textContent = name; }
  function setStats(wave, kills, enemies) {
    el.wave.textContent = wave; el.kills.textContent = kills; el.enemies.textContent = enemies;
  }
  function setSpread(px) { document.documentElement.style.setProperty('--spread', px + 'px'); }

  function hitmarker(kill) {
    el.hitmarker.classList.toggle('kill', !!kill);
    el.hitmarker.style.opacity = '1';
    el.hitmarker.style.transform = 'scale(1.15)';
    hmT = kill ? 0.32 : 0.16;
  }
  function damageFlash(intensity) {
    el.vignette.style.opacity = Math.min(0.9, intensity);
  }
  function dirIndicator(angleDeg) {
    const arc = document.createElement('div');
    arc.className = 'dmg-arc';
    arc.style.transform = `rotate(${angleDeg}deg)`;
    el.dirDmg.appendChild(arc);
    requestAnimationFrame(() => { arc.style.opacity = '1'; });
    setTimeout(() => { arc.style.opacity = '0'; }, 700);
    setTimeout(() => arc.remove(), 1200);
  }
  function killFeed(text) {
    const d = document.createElement('div'); d.innerHTML = text;
    el.killfeed.appendChild(d);
    setTimeout(() => d.remove(), 3300);
  }
  function announce(big, sub, dur = 1800) {
    el.announceBig.textContent = big; el.announceSub.textContent = sub || '';
    el.announce.style.opacity = '1';
    clearTimeout(announce._t);
    announce._t = setTimeout(() => { el.announce.style.opacity = '0'; }, dur);
  }

  function update(dt) {
    if (hmT > 0) {
      hmT -= dt;
      if (hmT <= 0) { el.hitmarker.style.opacity = '0'; el.hitmarker.style.transform = 'scale(1)'; }
    }
    // decay vignette
    const cur = parseFloat(el.vignette.style.opacity) || 0;
    if (cur > 0) el.vignette.style.opacity = Math.max(0, cur - dt * 1.4);
  }

  return {
    el, show, hide, setHealth, setAmmo, setWeapon, setStats, setSpread,
    hitmarker, damageFlash, dirIndicator, killFeed, announce, update,
    showMenu: () => el.menu.classList.remove('hidden'),
    hideMenu: () => el.menu.classList.add('hidden'),
    showPause: () => el.pause.classList.remove('hidden'),
    hidePause: () => el.pause.classList.add('hidden'),
    showGameOver: (wave, kills) => { el.goStats.textContent = `Wave ${wave} · ${kills} Eliminations`; el.gameover.classList.remove('hidden'); },
    hideGameOver: () => el.gameover.classList.add('hidden'),
    hideLoading: () => { el.loading.style.opacity = '0'; setTimeout(() => el.loading.classList.add('hidden'), 500); },
    setLoad: (pct) => { el.loadbar.style.width = pct + '%'; },
  };
}
