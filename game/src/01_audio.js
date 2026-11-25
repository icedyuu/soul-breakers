// ============================== AUDIO =================================
// All sounds and music are synthesized with the Web Audio API.
const Sound = (() => {
  let ac = null, master, sfxG, musG, noiseBuf;
  function unlock() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 6;
    master = ac.createGain(); sfxG = ac.createGain(); musG = ac.createGain();
    sfxG.connect(master); musG.connect(master); master.connect(comp); comp.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    applyVolume();
    Music.onUnlock();
  }
  function applyVolume() {
    if (!ac) return;
    master.gain.value = Settings.muted ? 0 : Settings.master;
    sfxG.gain.value = Settings.sfx;
    musG.gain.value = Settings.music * 0.5;
  }
  function env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  function osc(type, f0, f1, dur, vol, delay = 0, dest) {
    const t = ac.currentTime + delay;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    env(g, t, 0.004, vol, dur);
    o.connect(g); g.connect(dest || sfxG); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, ftype, f0, f1, q = 1, delay = 0, dest) {
    const t = ac.currentTime + delay;
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const fl = ac.createBiquadFilter(); fl.type = ftype; fl.Q.value = q;
    fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = ac.createGain(); env(g, t, 0.004, vol, dur);
    s.connect(fl); fl.connect(g); g.connect(dest || sfxG);
    s.start(t, Math.random() * 1.2); s.stop(t + dur + 0.05);
  }
  const S = {
    whoosh(p = 1) { noise(0.13, 0.22, 'bandpass', 500 * p, 2600 * p, 1.4); },
    hit(str = 1) {
      noise(0.05 + 0.04 * str, 0.45 + 0.15 * str, 'bandpass', 2600, 500, 0.9);
      osc('sine', 150 + 30 * str, 38, 0.09 + 0.06 * str, 0.55 + 0.15 * str);
      if (str >= 3) { osc('square', 95, 28, 0.25, 0.22); noise(0.3, 0.4, 'lowpass', 1500, 80, 0.8); }
    },
    block() { osc('square', 1500, 900, 0.05, 0.12); noise(0.06, 0.3, 'highpass', 3000, 6000, 0.7); },
    perfect() { osc('sine', 1760, 1760, 0.45, 0.25); osc('sine', 2637, 2637, 0.55, 0.14, 0.02); osc('triangle', 880, 880, 0.3, 0.15); },
    jump() { osc('sine', 230, 520, 0.11, 0.12); },
    land() { noise(0.08, 0.25, 'lowpass', 500, 100, 1); },
    fire() { noise(0.45, 0.45, 'lowpass', 2000, 260, 0.7); osc('sawtooth', 130, 55, 0.3, 0.12); },
    thunder() { noise(0.9, 0.6, 'lowpass', 5000, 160, 0.5); osc('sawtooth', 85, 28, 0.6, 0.25); noise(0.12, 0.5, 'highpass', 2500, 7000, 1); },
    energy() { osc('sawtooth', 200, 1200, 0.24, 0.13); osc('square', 320, 1500, 0.2, 0.06); },
    slash() { noise(0.1, 0.35, 'highpass', 2200, 8000, 1); osc('sine', 2600, 700, 0.09, 0.1); },
    teleport() { osc('sine', 1900, 140, 0.26, 0.18); noise(0.2, 0.15, 'bandpass', 3200, 400, 4); },
    grab() { osc('sine', 110, 50, 0.16, 0.45); noise(0.08, 0.3, 'lowpass', 900, 200, 1); },
    slam() { osc('sine', 85, 24, 0.7, 0.9); noise(0.55, 0.7, 'lowpass', 1300, 70, 0.7); },
    charge() { osc('sawtooth', 110, 900, 0.9, 0.14); noise(0.9, 0.22, 'bandpass', 200, 3500, 2); osc('sine', 55, 110, 0.9, 0.3); },
    explosion() { osc('sine', 65, 20, 1.3, 0.9); noise(1.3, 0.8, 'lowpass', 3500, 50, 0.6); },
    ko() { osc('sine', 75, 20, 1.6, 0.9); noise(1.6, 0.6, 'lowpass', 2500, 50, 0.5); osc('sawtooth', 220, 55, 1.2, 0.14); },
    counter() { osc('square', 600, 1800, 0.12, 0.14); osc('sine', 2100, 2100, 0.3, 0.14, 0.05); },
    armor() { osc('square', 300, 180, 0.12, 0.2); osc('sine', 900, 650, 0.22, 0.14); },
    kunai() { osc('triangle', 2400, 1200, 0.08, 0.1); noise(0.07, 0.2, 'highpass', 4000, 8000, 1); },
    menuMove() { osc('square', 660, 660, 0.04, 0.05); },
    menuOk() { osc('square', 880, 1320, 0.1, 0.09); osc('sine', 1760, 1760, 0.15, 0.06, 0.05); },
    menuBack() { osc('square', 440, 220, 0.1, 0.07); },
    gong() { [110, 166, 221, 332, 443].forEach((f, i) => osc('sine', f, f * 0.985, 2.2, 0.3 / (i + 1))); noise(0.4, 0.2, 'lowpass', 900, 100, 1); },
    victory() { [523, 659, 784, 1047].forEach((f, i) => osc('square', f, f, 0.22, 0.1, i * 0.12)); osc('square', 1047, 1047, 0.7, 0.1, 0.5); osc('square', 1319, 1319, 0.7, 0.06, 0.5); },
    defeat() { [392, 349, 311, 233].forEach((f, i) => osc('triangle', f, f * 0.98, 0.4, 0.16, i * 0.24)); },
    whistle() { for (let i = 0; i < 8; i++) osc('sine', i % 2 ? 2350 : 2050, i % 2 ? 2350 : 2050, 0.07, 0.16, i * 0.065); noise(0.55, 0.12, 'highpass', 3000, 5000, 1); osc('sine', 2200, 2150, 0.25, 0.14, 0.52); },
    trainRumble() { noise(1.8, 0.55, 'lowpass', 320, 120, 1); for (let i = 0; i < 12; i++) noise(0.09, 0.3, 'bandpass', 900, 500, 2, i * 0.14); },
    horn() { osc('sawtooth', 311, 300, 1.0, 0.09); osc('sawtooth', 392, 380, 1.0, 0.09); osc('sawtooth', 466, 450, 1.0, 0.06); },
    ding(p = 1) { osc('triangle', 1250 * p, 1250 * p, 0.32, 0.16); osc('sine', 2500 * p, 2500 * p, 0.22, 0.06); },
    croak() { osc('square', 330, 140, 0.08, 0.15); osc('square', 360, 150, 0.11, 0.15, 0.11); noise(0.18, 0.12, 'lowpass', 700, 200, 2); },
    boing() { osc('sine', 180, 720, 0.28, 0.3); osc('triangle', 360, 900, 0.2, 0.12, 0.05); },
    splash() { noise(0.7, 0.55, 'bandpass', 1600, 300, 0.8); noise(0.25, 0.3, 'highpass', 3000, 6000, 1); osc('sine', 160, 60, 0.3, 0.3); },
    slap() { noise(0.06, 0.4, 'bandpass', 1300, 700, 1.5); osc('sine', 700, 200, 0.07, 0.25); },
    tick() { for (let i = 0; i < 4; i++) osc('square', 3200, 3200, 0.018, 0.1, i * 0.22); },
    clack() { osc('square', 950, 520, 0.04, 0.2); noise(0.05, 0.3, 'highpass', 4000, 7000, 1); },
    roar() { osc('sawtooth', 120, 55, 0.9, 0.3); osc('square', 82, 40, 0.8, 0.18, 0.02); noise(0.9, 0.5, 'lowpass', 900, 120, 0.8); },
    howl() { osc('sine', 420, 760, 0.35, 0.16); osc('sine', 760, 520, 0.7, 0.16, 0.33); osc('triangle', 380, 700, 0.9, 0.06, 0.05); },
    hiss() { noise(0.6, 0.35, 'highpass', 3000, 6000, 0.7); osc('sine', 90, 60, 0.5, 0.15); },
    chime() { [1319, 1760, 2093, 2637].forEach((f, i) => osc('sine', f, f, 0.9, 0.09, i * 0.06)); },
    caw() { osc('sawtooth', 900, 420, 0.16, 0.16); osc('sawtooth', 860, 400, 0.18, 0.14, 0.2); noise(0.14, 0.2, 'bandpass', 1800, 900, 2); },
    drain() { noise(0.55, 0.4, 'lowpass', 1400, 180, 2.5); osc('sine', 140, 70, 0.5, 0.25); osc('triangle', 420, 260, 0.3, 0.06, 0.1); },
    bats() { for (let i = 0; i < 7; i++) noise(0.05, 0.22, 'bandpass', 2400 + i * 120, 1600, 3, i * 0.045); osc('sine', 3200, 2600, 0.25, 0.04); },
    spike() { noise(0.35, 0.55, 'bandpass', 900, 220, 1.2); osc('sawtooth', 220, 60, 0.3, 0.16); noise(0.12, 0.35, 'highpass', 3000, 7000, 1); },
    heart() { osc('sine', 62, 38, 0.18, 0.7); osc('sine', 58, 34, 0.2, 0.55, 0.24); },
    shift() { osc('sawtooth', 60, 520, 0.5, 0.16); osc('sine', 1200, 300, 0.5, 0.12, 0.1); noise(0.5, 0.3, 'bandpass', 400, 3000, 1.2); },
    saw(p = 1) { osc('sawtooth', 95 * p, 120 * p, 0.32, 0.16); osc('square', 190 * p, 240 * p, 0.3, 0.06); noise(0.32, 0.3, 'bandpass', 1800 * p, 2600 * p, 2); },
    rev() { osc('sawtooth', 60, 260, 0.6, 0.18); osc('square', 120, 520, 0.55, 0.07, 0.05); noise(0.6, 0.3, 'bandpass', 600, 3200, 1.5); },
    rune() { osc('sine', 330, 660, 0.4, 0.14); osc('triangle', 495, 990, 0.45, 0.08, 0.06); noise(0.35, 0.15, 'bandpass', 900, 2400, 3); },
    crush() { osc('sine', 70, 22, 0.8, 0.8); noise(0.25, 0.5, 'bandpass', 300, 120, 2); osc('square', 140, 40, 0.3, 0.12); },
    psi() { osc('sine', 880, 220, 0.35, 0.12); osc('sine', 1320, 330, 0.3, 0.06, 0.04); noise(0.3, 0.12, 'bandpass', 2400, 600, 6); },
    impactBig() { osc('sine', 120, 30, 0.5, 0.9); noise(0.5, 0.8, 'bandpass', 4000, 200, 0.5); osc('square', 60, 25, 0.4, 0.3); },
  };
  function play(name, ...a) { if (!ac || Settings.muted) return; try { S[name](...a); } catch (e) { /* ignore */ } }
  let voices = null;
  function speak(text, pitch = 0.55, rate = 0.95) {
    if (!Settings.voice || Settings.muted || !('speechSynthesis' in window)) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      if (!voices) voices = speechSynthesis.getVoices();
      const en = voices && voices.find(v => /en[-_](US|GB)/i.test(v.lang));
      if (en) u.voice = en;
      u.pitch = pitch; u.rate = rate; u.volume = Math.min(1, Settings.master * 1.1);
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  }
  return { unlock, play, speak, applyVolume, get ac() { return ac; }, get musDest() { return musG; }, get noiseBuf() { return noiseBuf; } };
})();

// ---------------- Procedural music sequencer ----------------
const Music = (() => {
  let timer = null, nextT = 0, step = 0, track = null, wanted = null;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const MINOR = [0, 2, 3, 5, 7, 8, 10, 12, 14, 15];
  function genMelody(seed) {
    let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const out = []; let deg = 4;
    for (let i = 0; i < 64; i++) {
      if (i % 2 === 0 && r() < 0.62) { deg = clamp(deg + Math.round((r() - 0.5) * 4), 0, MINOR.length - 1); out.push(MINOR[deg]); } else out.push(null);
    }
    return out;
  }
  const TRACKS = {
    menu: { bpm: 96, root: 45, prog: [[0, 0], [-4, 1], [3, 1], [-2, 1]], drums: 1, arp: true, pad: true, mel: genMelody(7) },
    neon: { bpm: 142, root: 50, prog: [[0, 0], [-4, 1], [-2, 1], [-5, 0]], drums: 2, arp: true, mel: genMelody(31) },
    volcano: { bpm: 152, root: 52, prog: [[0, 0], [1, 1], [0, 0], [-2, 1]], drums: 3, arp: true, mel: genMelody(99) },
    bamboo: { bpm: 126, root: 47, prog: [[0, 0], [-4, 1], [3, 1], [-2, 1]], drums: 2, arp: true, pad: true, mel: genMelody(53) },
    storm: { bpm: 148, root: 49, prog: [[0, 0], [-2, 1], [-4, 1], [-5, 1]], drums: 3, arp: true, mel: genMelody(77) },
    results: { bpm: 110, root: 48, prog: [[0, 1], [5, 1], [-3, 0], [7, 1]], drums: 1, arp: true, pad: true, mel: genMelody(13) },
  };
  function note(type, freq, t, dur, vol, cut) {
    const ac = Sound.ac; const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
    o.type = type; o.frequency.value = freq; f.type = 'lowpass'; f.frequency.value = cut;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(Sound.musDest); o.start(t); o.stop(t + dur + 0.05);
  }
  function drum(kind, t, v = 1) {
    const ac = Sound.ac;
    if (kind === 'kick') {
      const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.18);
      g.gain.setValueAtTime(0.9 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.28); o.connect(g); g.connect(Sound.musDest); o.start(t); o.stop(t + 0.3);
    } else {
      const s = ac.createBufferSource(); s.buffer = Sound.noiseBuf; const f = ac.createBiquadFilter(); const g = ac.createGain();
      const snare = kind === 'snare';
      f.type = snare ? 'bandpass' : 'highpass'; f.frequency.value = snare ? 1800 : 7500; f.Q.value = snare ? 0.8 : 1;
      const d = snare ? 0.18 : 0.04;
      g.gain.setValueAtTime((snare ? 0.55 : 0.16) * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
      s.connect(f); f.connect(g); g.connect(Sound.musDest); s.start(t, Math.random()); s.stop(t + d + 0.02);
      if (snare) note('triangle', 190, t, 0.08, 0.2 * v, 2000);
    }
  }
  function playStep(s, t) {
    const tr = track, spb = 60 / tr.bpm / 4;
    const bar = Math.floor(s / 16) % 4, st = s % 16;
    const [off, maj] = tr.prog[bar];
    const cr = tr.root + off;
    const tri = maj ? [0, 4, 7] : [0, 3, 7];
    if (tr.drums) {
      if (st % 4 === 0) drum('kick', t);
      if (tr.drums >= 3 && st === 10) drum('kick', t, 0.7);
      if (st === 4 || st === 12) drum('snare', t);
      if (tr.drums >= 2 && st % 2 === 0) drum('hat', t);
      if (tr.drums >= 3 && st % 2 === 1) drum('hat', t, 0.5);
    }
    if (st % 2 === 0) note('sawtooth', mtof(cr - 12 + (st % 4 === 2 ? 12 : 0)), t, spb * 1.7, 0.16, 520);
    if (tr.arp) { const a = [0, 1, 2, 3, 2, 1, 0, 2][st % 8]; const n = a === 3 ? 12 : tri[a]; note('square', mtof(cr + 12 + n), t, spb * 0.9, 0.035, 1900); }
    if (tr.mel) { const n = tr.mel[s % 64]; if (n !== null && s % 128 >= 64) note('sawtooth', mtof(tr.root + 24 + n), t, spb * 1.9, 0.045, 2600); }
    if (st === 0 && tr.pad) tri.forEach(i => note('triangle', mtof(cr + 12 + i), t, spb * 15, 0.045, 1200));
  }
  function schedule() {
    const ac = Sound.ac; if (!ac || !track) return;
    const spb = 60 / track.bpm / 4;
    if (nextT < ac.currentTime) nextT = ac.currentTime + 0.02;
    while (nextT < ac.currentTime + 0.12) { playStep(step, nextT); nextT += spb; step++; }
  }
  function play(name) {
    wanted = name;
    if (!Sound.ac) return;
    if (track === TRACKS[name]) return;
    track = TRACKS[name]; step = 0; nextT = Sound.ac.currentTime + 0.08;
    if (!timer) timer = setInterval(schedule, 25);
  }
  function stop() { track = null; wanted = null; }
  function onUnlock() { if (wanted) { const w = wanted; wanted = null; play(w); } }
  return { play, stop, onUnlock };
})();
