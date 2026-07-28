// Procedural WebAudio SFX — no external files, works offline.
export function createAudio() {
  let ctx = null, master = null, noiseBuf = null, enabled = true;

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    // noise buffer
    const len = ctx.sampleRate * 1.0;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // ambient bed
    ambient();
  }
  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

  function noise(dur, gain, filterType, freq, q) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q || 1;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(master); src.start(t); src.stop(t + dur);
    return { f, g };
  }
  function tone(freq, dur, gain, type, slideTo) {
    const o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.value = freq;
    const g = ctx.createGain(); const t = ctx.currentTime;
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur);
  }

  function shoot() {
    if (!ctx || !enabled) return;
    // punchy crack: click + body + tail
    noise(0.09, 0.9, 'bandpass', 1800, 0.8);
    noise(0.18, 0.5, 'lowpass', 500, 1);
    tone(120, 0.12, 0.5, 'square', 60);
  }
  function reload() {
    if (!ctx || !enabled) return;
    tone(300, 0.05, 0.25, 'square', 200);
    setTimeout(() => tone(220, 0.05, 0.2, 'square', 160), 260);
    setTimeout(() => noise(0.05, 0.3, 'highpass', 3000, 1), 700);
    setTimeout(() => tone(420, 0.06, 0.28, 'square', 300), 1500);
  }
  function enemyDie() {
    if (!ctx || !enabled) return;
    noise(0.3, 0.5, 'lowpass', 700, 1);
    tone(160, 0.3, 0.35, 'sawtooth', 60);
  }
  function hitMarker() {
    if (!ctx || !enabled) return;
    tone(1400, 0.03, 0.18, 'square');
  }
  function playerHurt() {
    if (!ctx || !enabled) return;
    noise(0.25, 0.5, 'lowpass', 400, 1);
    tone(90, 0.2, 0.4, 'sine', 50);
  }
  function explosion() {
    if (!ctx || !enabled) return;
    noise(0.7, 1.0, 'lowpass', 300, 1);
    tone(70, 0.6, 0.6, 'sine', 30);
  }
  function waveStart() {
    if (!ctx || !enabled) return;
    tone(300, 0.5, 0.3, 'sawtooth', 450);
    setTimeout(() => tone(450, 0.6, 0.3, 'sawtooth', 600), 200);
  }
  function ambient() {
    if (!ctx) return;
    // low wind drone
    const g = ctx.createGain(); g.gain.value = 0.06; g.connect(master);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220; f.connect(g);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true; src.connect(f); src.start();
    // slow LFO on filter
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.1; const lg = ctx.createGain(); lg.gain.value = 80;
    lfo.connect(lg); lg.connect(f.frequency); lfo.start();
  }

  return { init, resume, shoot, reload, enemyDie, hitMarker, playerHurt, explosion, waveStart,
    setEnabled: (v) => { enabled = v; } };
}
