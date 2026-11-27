// ============================== AUDIO =================================
// Web Audio. SFX = CC0 samples (audio/sfx, see AUDIO_FILES in 01a_audio_files.js) layered with
// procedural synthesis; every sound still has its synthesized version, used whenever a file is
// missing or not loaded yet (single-file build, offline before the first visit, file://).
// Music: CC0 tracks (audio/music) with the procedural sequencer as fallback. Presentation only:
// nothing here may touch the sim (own RNG, never Math.random-dependent gameplay).
const Sound = (() => {
  let ac = null, master, sfxG, musG, noiseBuf, rvb, rvbSend, live = 0;
  let rs = 1234567; const arand = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
  const bufs = {};   // file -> AudioBuffer | 'loading' | 'fail'
  let ext = null;    // 'ogg' where Vorbis decodes (Chrome, Firefox, Android), else 'mp3' (older Safari / iOS)
  function fileExt() { if (!ext) { try { ext = new Audio().canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'mp3'; } catch (e) { ext = 'mp3'; } } return ext; }
  const canFetch = () => location.protocol !== 'file:' && typeof fetch === 'function';
  function decode(ab) { return new Promise((res, rej) => { const p = ac.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); }); }
  function load(file, cb) {
    const b = bufs[file];
    if (b) { if (cb && b instanceof AudioBuffer) cb(b); return; }
    if (!ac || !canFetch()) { bufs[file] = 'fail'; return; }
    bufs[file] = 'loading';
    fetch((window.AUDIO_BASE || 'audio/') + file + '.' + fileExt()).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(decode).then(buf => { bufs[file] = buf; if (cb) cb(buf); }).catch(() => { bufs[file] = 'fail'; });
  }
  function preloadSfx() { if (typeof AUDIO_FILES === 'undefined') return; for (const k in AUDIO_FILES.sfx) for (const v of AUDIO_FILES.sfx[k].f) load('sfx/' + v); for (const k in AUDIO_FILES.voice) load('voice/' + AUDIO_FILES.voice[k]); }
  // play a decoded sample; false if not available (caller falls back to synthesis)
  function sample(file, vol, rate = 1, delay = 0, wet = 0, dest) {
    const b = bufs[file]; if (!(b instanceof AudioBuffer)) return false;
    if (live > 28) return true;   // voice cap: drop, but don't double up with synthesis
    const t = ac.currentTime + delay, s = ac.createBufferSource(), g = ac.createGain();
    s.buffer = b; s.playbackRate.value = rate; g.gain.value = vol;
    s.connect(g); g.connect(dest || sfxG);
    if (wet > 0) { const w = ac.createGain(); w.gain.value = wet; g.connect(w); w.connect(rvbSend); }
    live++; s.onended = () => { live--; }; s.start(t);
    return true;
  }
  function makeIR(sec, decay) {
    const n = Math.floor(ac.sampleRate * sec), ir = ac.createBuffer(2, n, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (arand() * 2 - 1) * Math.pow(1 - i / n, decay); }
    return ir;
  }
  function unlock() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 6;
    master = ac.createGain(); sfxG = ac.createGain(); musG = ac.createGain();
    sfxG.connect(master); musG.connect(master); master.connect(comp); comp.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = arand() * 2 - 1;
    // shared reverb for big hits, ultimates and the announcer
    try { rvb = ac.createConvolver(); rvb.buffer = makeIR(1.8, 2.6); rvbSend = ac.createGain(); rvbSend.gain.value = 0.55; rvbSend.connect(rvb); rvb.connect(sfxG); }
    catch (e) { rvbSend = ac.createGain(); rvbSend.gain.value = 0; rvbSend.connect(sfxG); }
    applyVolume();
    preloadSfx();
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
    o.connect(g); route(g, dest); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, ftype, f0, f1, q = 1, delay = 0, dest) {
    const t = ac.currentTime + delay;
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const fl = ac.createBiquadFilter(); fl.type = ftype; fl.Q.value = q;
    fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = ac.createGain(); env(g, t, 0.004, vol, dur);
    s.connect(fl); fl.connect(g); route(g, dest);
    s.start(t, arand() * 1.2); s.stop(t + dur + 0.05);
  }
  // dest: undefined = dry SFX bus, a number = dry + that much reverb, a node = that node
  function route(g, dest) {
    if (typeof dest === 'number') { g.connect(sfxG); const w = ac.createGain(); w.gain.value = dest; g.connect(w); w.connect(rvbSend); }
    else g.connect(dest || sfxG);
  }
  // rising "power up" riser + sub swell used by ultimates
  function riser(dur, f0, f1, vol, wet = 0.6) {
    const t = ac.currentTime;
    const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
    o.type = 'sawtooth'; o2.type = 'sawtooth'; o2.detune.value = 18;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    o2.frequency.setValueAtTime(f0 * 1.5, t); o2.frequency.exponentialRampToValueAtTime(f1 * 1.5, t + dur);
    f.type = 'lowpass'; f.Q.value = 6; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(5000, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.85); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
    o.connect(f); o2.connect(f); f.connect(g); route(g, wet); o.start(t); o2.start(t); o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
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
    // Kanae / Tokine
    kick() { osc('sine', 150, 45, 0.14, 0.7); noise(0.08, 0.45, 'lowpass', 1800, 300, 1); },
    gunshot() { noise(0.16, 0.85, 'bandpass', 2600, 400, 0.8); osc('square', 220, 40, 0.12, 0.35); osc('sine', 90, 30, 0.25, 0.5, 0.01); },
    tock() { osc('square', 2100, 1900, 0.02, 0.14); osc('square', 1500, 1400, 0.02, 0.1, 0.28); },
    bell() { [196, 392, 523, 784].forEach((f, i) => osc('sine', f, f * 0.995, 1.6 - i * 0.25, 0.14 - i * 0.025, i * 0.01)); },
    gear() { for (let i = 0; i < 6; i++) osc('square', 600 + i * 40, 500, 0.02, 0.09, i * 0.05); noise(0.3, 0.12, 'highpass', 3000, 5000, 1); },
    rewind() { osc('sawtooth', 300, 1400, 0.4, 0.12); osc('sine', 1200, 300, 0.4, 0.08, 0.05); noise(0.35, 0.15, 'bandpass', 2000, 5000, 3); },
    bloom() { osc('sine', 60, 110, 1.2, 0.35); osc('triangle', 220, 140, 1.1, 0.08, 0.1); noise(1.0, 0.18, 'lowpass', 400, 1400, 0.6); },
    // Aimi
    pistol() { noise(0.09, 0.95, 'highpass', 1800, 700, 0.7); noise(0.14, 0.5, 'bandpass', 3200, 600, 1); osc('square', 320, 60, 0.07, 0.3); osc('sine', 110, 40, 0.18, 0.45, 0.005); },
    cock() { osc('square', 1800, 1400, 0.025, 0.14); noise(0.04, 0.35, 'highpass', 3500, 6000, 2); osc('square', 1200, 900, 0.03, 0.12, 0.09); noise(0.05, 0.3, 'bandpass', 2500, 1500, 3, 0.09); },
    aimiLove() { osc('sine', 880, 440, 0.6, 0.1, 0, 0.6); osc('sine', 660, 330, 0.7, 0.08, 0.12, 0.6); noise(0.6, 0.12, 'bandpass', 600, 2400, 4, 0, 0.5); },
    aimiVanish() { osc('sine', 300, 2400, 0.22, 0.12, 0, 0.6); noise(0.2, 0.25, 'highpass', 6000, 2000, 1, 0, 0.6); },
    aimiReach() { osc('sawtooth', 40, 90, 1.4, 0.12, 0, 0.6); noise(1.4, 0.2, 'lowpass', 200, 900, 1, 0, 0.6); },
    rift() { osc('sine', 48, 34, 1.8, 0.5, 0, 0.7); osc('sawtooth', 70, 52, 1.6, 0.06, 0.1, 0.8); noise(1.8, 0.25, 'bandpass', 220, 90, 2, 0, 0.8); },
    skyCrack() { noise(0.06, 0.6, 'highpass', 5000, 9000, 1); for (let i = 0; i < 5; i++) noise(0.04, 0.35, 'bandpass', 3000 - i * 300, 2000, 4, 0.03 + i * 0.035, 0.5); osc('sine', 2400, 1800, 0.3, 0.05, 0, 0.9); },
    skyTear() { noise(1.3, 0.6, 'bandpass', 900, 5200, 0.9, 0, 0.6); noise(1.4, 0.35, 'lowpass', 300, 1800, 1, 0.05, 0.6); for (let i = 0; i < 10; i++) noise(0.05, 0.3, 'highpass', 4000, 7000, 2, i * 0.11, 0.4); osc('sawtooth', 60, 140, 1.3, 0.08, 0, 0.7); },
    skyClose() { osc('sine', 90, 22, 1.6, 0.9, 0, 0.5); noise(0.3, 0.7, 'bandpass', 4000, 300, 0.7); noise(1.6, 0.5, 'lowpass', 2400, 60, 0.6, 0.05, 0.8); osc('sawtooth', 400, 40, 0.5, 0.1, 0, 0.6); },
    // Hachishakusama: a distant, low, unnatural "po… po… po…" (plosive click + two vowel formants, lots of reverb)
    po(n = 3, v = 1) {
      for (let i = 0; i < n; i++) {
        const d = i * 0.44, a = 0.16 * v;
        noise(0.025, 0.25 * a / 0.16, 'highpass', 1800, 2400, 1, d, 0.95);
        osc('sine', 128, 104, 0.2, a, d + 0.012, 0.95); osc('sine', 440, 380, 0.17, a * 0.45, d + 0.012, 0.95); osc('sine', 820, 700, 0.14, a * 0.18, d + 0.012, 0.95);
        noise(0.16, 0.05 * v, 'bandpass', 520, 420, 5, d + 0.012, 0.95);
      }
    },
    wind() { noise(2.2, 0.16, 'bandpass', 380, 900, 0.8, 0, 0.7); noise(2.0, 0.08, 'highpass', 2400, 1600, 0.6, 0.3, 0.7); },
    hachiStep() { noise(0.07, 0.2, 'lowpass', 420, 120, 1, 0, 0.8); osc('sine', 70, 50, 0.1, 0.12, 0, 0.8); },
    hachiDistort() { osc('sine', 64, 30, 1.1, 0.3, 0, 0.8); osc('sine', 1400, 260, 0.7, 0.04, 0.05, 0.9); noise(0.9, 0.12, 'bandpass', 300, 1200, 6, 0, 0.8); },
    hachiReach() { osc('sawtooth', 95, 38, 0.45, 0.07, 0, 0.6); noise(0.4, 0.22, 'bandpass', 1300, 300, 3, 0, 0.5); osc('square', 220, 60, 0.3, 0.03, 0.1); },
    hachiSlash() { noise(0.16, 0.45, 'bandpass', 900, 3200, 1.2, 0, 0.5); osc('sine', 180, 60, 0.2, 0.25); },
    shadowRise() { noise(0.45, 0.32, 'lowpass', 160, 900, 1.2, 0, 0.6); osc('sine', 46, 82, 0.45, 0.28, 0, 0.5); },
    silence() { osc('sine', 40, 38, 0.06, 0.001); },
    // Kuchisake-onna: scissors, breath, the mask
    snip() { osc('square', 3400, 2700, 0.018, 0.1); noise(0.04, 0.4, 'highpass', 5200, 8000, 2); osc('triangle', 2500, 2300, 0.08, 0.06, 0.05); noise(0.03, 0.3, 'highpass', 6000, 8000, 2, 0.06); },
    shear() { noise(0.2, 0.55, 'bandpass', 4200, 1400, 1.2); osc('triangle', 1900, 1200, 0.16, 0.1); osc('square', 3000, 2600, 0.02, 0.08, 0.12); noise(0.03, 0.35, 'highpass', 6000, 8000, 2, 0.12); },
    breath() { noise(0.7, 0.07, 'bandpass', 900, 600, 1.4, 0, 0.4); noise(0.6, 0.05, 'bandpass', 700, 1000, 1.4, 0.8, 0.4); },
    maskOff() { noise(0.28, 0.22, 'bandpass', 2400, 1200, 0.9); osc('sine', 300, 120, 0.4, 0.05, 0.2, 0.6); },
    kuchiVanish() { osc('sine', 700, 70, 0.26, 0.1, 0, 0.6); noise(0.22, 0.24, 'bandpass', 3000, 600, 1, 0, 0.5); },
    // HAZE (smoke dealer): inhale, exhale, bong bubbles, vape hiss, smoke poof, smoke boom, lighter flick, cough, fog roll
    inhale() { noise(0.55, 0.09, 'bandpass', 700, 1500, 1.2, 0, 0.3); noise(0.4, 0.04, 'highpass', 3000, 5000, 1, 0.1); },
    exhale(v = 1) { noise(0.8, 0.12 * v, 'bandpass', 1400, 400, 0.9, 0, 0.4); noise(0.7, 0.05 * v, 'lowpass', 900, 200, 0.7, 0.05, 0.5); },
    bubble() { for (let i = 0; i < 3; i++) osc('sine', 180 + i * 70, 420 + i * 90, 0.06, 0.08, i * 0.05); },
    vapeHiss() { noise(0.35, 0.18, 'highpass', 5200, 2600, 0.8); osc('sine', 1200, 600, 0.12, 0.03); },
    poof(v = 1) { noise(0.25, 0.3 * v, 'lowpass', 1800, 200, 0.8); osc('sine', 160, 60, 0.18, 0.12 * v); },
    smokeBoom(v = 1) { osc('sine', 90, 28, 0.7, 0.6 * v); noise(0.7, 0.45 * v, 'lowpass', 1400, 80, 0.7, 0, 0.6); noise(0.5, 0.15 * v, 'bandpass', 600, 2200, 1.5, 0.05, 0.6); },
    flick() { osc('square', 2600, 2200, 0.015, 0.1); noise(0.03, 0.3, 'highpass', 4000, 6000, 2); noise(0.25, 0.08, 'bandpass', 900, 1800, 1, 0.06); },
    cough() { for (let i = 0; i < 2; i++) { noise(0.12, 0.3, 'bandpass', 700, 380, 1.4, i * 0.2); osc('sawtooth', 160, 110, 0.1, 0.04, i * 0.2); } },
    fogRoll() { noise(2.2, 0.16, 'lowpass', 300, 900, 0.8, 0, 0.8); osc('sine', 48, 40, 2.0, 0.22, 0, 0.7); },
    fear() { osc('sine', 55, 40, 1.2, 0.35, 0, 0.6); osc('sawtooth', 220, 210, 1.0, 0.03, 0.1, 0.8); osc('sawtooth', 233, 222, 1.0, 0.03, 0.1, 0.8); noise(1.0, 0.1, 'highpass', 6000, 3000, 1, 0, 0.8); },
  };
  // extra synth layers that can sit under a sample (AUDIO_FILES.sfx[name].syn)
  const L = {
    // JACKPOT (gambler): chips, dice, cards, coin, roulette, revolver click, jackpot fanfare, bad luck
    coin(v = 1) { osc('sine', 2637, 2600, 0.35, 0.09 * v); osc('sine', 3951, 3900, 0.25, 0.05 * v, 0.01); osc('triangle', 1760, 1760, 0.12, 0.05 * v, 0.02); },
    chips() { for (let i = 0; i < 4; i++) { osc('square', 2400 + i * 180, 2100, 0.015, 0.07, i * 0.035); noise(0.025, 0.25, 'bandpass', 4200, 3000, 3, i * 0.035); } },
    dice() { for (let i = 0; i < 3; i++) { osc('square', 900 - i * 120, 700, 0.02, 0.1, i * 0.06); noise(0.03, 0.3, 'bandpass', 1800, 1200, 2, i * 0.06); } },
    cardFlick() { noise(0.06, 0.45, 'highpass', 3000, 7000, 1.5); osc('triangle', 1900, 900, 0.05, 0.06); },
    rTick() { osc('square', 3000, 2800, 0.012, 0.06); noise(0.015, 0.2, 'highpass', 5000, 6000, 3); },
    click() { osc('square', 1500, 1200, 0.02, 0.16); noise(0.03, 0.3, 'bandpass', 2600, 1800, 3); osc('sine', 300, 250, 0.4, 0.04, 0.1); },
    snap() { noise(0.035, 0.7, 'bandpass', 2600, 2200, 2); osc('sine', 1800, 900, 0.03, 0.12); },
    slot() { for (let i = 0; i < 8; i++) osc('square', 660 + (i % 4) * 220, 660 + (i % 4) * 220, 0.05, 0.05, i * 0.06); },
    jackpot(v = 1) { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => { osc('square', f, f, 0.12, 0.06 * v, i * 0.07); osc('sine', f * 2, f * 2, 0.3, 0.04 * v, i * 0.07); }); [2093, 2637, 3136].forEach((f, i) => osc('sine', f, f, 0.8, 0.05 * v, 0.45 + i * 0.05)); },
    badLuck() { [392, 370, 349, 262].forEach((f, i) => osc('triangle', f, f * 0.97, i === 3 ? 0.5 : 0.16, 0.12, i * 0.17)); },
    sub(str = 1) { osc('sine', 120 + 25 * str, 36, 0.08 + 0.05 * str, 0.35 + 0.12 * str); },
    boom() { osc('sine', 70, 22, 0.9, 0.7, 0, 0.4); noise(0.6, 0.35, 'lowpass', 900, 60, 0.7, 0, 0.5); },
    tail(v = 0.25) { noise(0.5, v, 'lowpass', 2500, 120, 0.6, 0, 0.9); },
    zap() { osc('sawtooth', 1400, 300, 0.12, 0.06); },
  };
  // ultimate start: one shared riser + an element "colour" per fighter
  const ULT_FLAVOR = { kazuma: 'fire', saint: 'holy', sera: 'storm', goro: 'earth', yoru: 'void', frogs: 'water', conductor: 'steel', cardmaster: 'rune', nue: 'beast',
    borgar: 'earth', buzzu: 'steel', reika: 'blood', yamika: 'void', lunaria: 'holy', honored: 'void', hollow: 'blood', remnant: 'blood', fragment: 'void', kanae: 'steel', tokine: 'time', aimi: 'love', hachi: 'po', kuchi: 'cut', jackpot: 'gold', haze: 'smoke' };
  S.ultStart = (id) => {
    riser(0.85, 90, 520, 0.12);
    osc('sine', 45, 90, 0.9, 0.35, 0, 0.3);
    noise(0.9, 0.18, 'bandpass', 300, 4000, 2, 0, 0.6);
    osc('sine', 2093, 2093, 0.5, 0.06, 0.82, 0.8); osc('sine', 3136, 3136, 0.6, 0.04, 0.84, 0.8);
    const fl = ULT_FLAVOR[id] || 'fire';
    if (fl === 'fire') { noise(1.0, 0.3, 'lowpass', 600, 3000, 0.8, 0.1, 0.4); }
    else if (fl === 'storm') { noise(0.25, 0.4, 'highpass', 2500, 7000, 1, 0.75, 0.6); osc('sawtooth', 80, 30, 0.5, 0.15, 0.75, 0.5); }
    else if (fl === 'earth') { osc('sine', 60, 25, 1.0, 0.6, 0.3, 0.3); noise(0.8, 0.4, 'lowpass', 400, 60, 1, 0.3, 0.3); }
    else if (fl === 'void') { osc('sine', 1800, 60, 1.1, 0.14, 0, 0.9); osc('sine', 55, 41, 1.2, 0.4, 0.2, 0.5); }
    else if (fl === 'holy') { [523, 659, 784, 1047, 1319].forEach((f, i) => osc('triangle', f, f, 1.0, 0.05, 0.1 + i * 0.07, 0.9)); }
    else if (fl === 'water') { for (let i = 0; i < 6; i++) osc('sine', 500 + i * 160, 1300 + i * 200, 0.08, 0.08, i * 0.09, 0.5); }
    else if (fl === 'steel') { [1, 1.5, 2.76].forEach((m, i) => osc('triangle', 420 * m, 410 * m, 0.9, 0.07, 0.6 + i * 0.01, 0.8)); }
    else if (fl === 'rune') { [440, 554, 659, 880].forEach((f, i) => osc('sine', f, f * 2, 0.6, 0.06, i * 0.12, 0.8)); }
    else if (fl === 'beast') { osc('sawtooth', 140, 60, 0.9, 0.18, 0.35, 0.4); noise(0.8, 0.3, 'lowpass', 900, 150, 0.8, 0.35, 0.4); }
    else if (fl === 'blood') { osc('sine', 62, 38, 0.18, 0.6, 0.2); osc('sine', 58, 34, 0.2, 0.5, 0.45); noise(0.8, 0.25, 'lowpass', 1400, 150, 2.5, 0.1, 0.6); }
    else if (fl === 'love') { osc('sine', 62, 38, 0.18, 0.6, 0.2); osc('sine', 58, 34, 0.2, 0.5, 0.45); osc('sine', 1760, 440, 1.0, 0.06, 0.5, 0.9); noise(0.7, 0.2, 'bandpass', 500, 3000, 3, 0.6, 0.7); }
    else if (fl === 'po') { noise(1.6, 0.14, 'bandpass', 380, 900, 0.8, 0.1, 0.8); S.po(2, 0.8); }
    else if (fl === 'cut') { for (let i = 0; i < 3; i++) { osc('square', 3400, 2700, 0.018, 0.08, 0.5 + i * 0.12); noise(0.04, 0.3, 'highpass', 5200, 8000, 2, 0.5 + i * 0.12); } osc('sine', 62, 38, 0.18, 0.5, 0.2); }
    else if (fl === 'smoke') { S.inhale(); S.exhale(1.2); osc('sine', 52, 40, 1.4, 0.3, 0.5, 0.8); }
    else if (fl === 'gold') { S.coin(1.2); [523, 784, 1047, 1568].forEach((f, i) => osc('square', f, f, 0.14, 0.05, 0.5 + i * 0.08)); }
    else if (fl === 'time') { for (let i = 0; i < 6; i++) osc('square', 2100 - i * 120, 1900 - i * 120, 0.02, 0.1, i * 0.12, 0.6); osc('sine', 196, 194, 1.4, 0.18, 0.7, 0.9); }
  };
  for (const k of ['coin', 'chips', 'dice', 'cardFlick', 'rTick', 'click', 'snap', 'slot', 'jackpot', 'badLuck']) if (!S[k]) S[k] = L[k];   // Jackpot's sounds live in L; make them playable
  function play(name, ...a) {
    if (!ac || Settings.muted) return;
    try {
      const e = typeof AUDIO_FILES !== 'undefined' && AUDIO_FILES.sfx[name];
      let done = false;
      if (e) {
        const list = e.pick ? e.pick(...a) : e.f, f = list[Math.floor(arand() * list.length)];
        const r = (e.r || 1) * (1 + (arand() - 0.5) * (e.j ?? 0.1));
        done = sample('sfx/' + f, e.v ?? 0.8, r, 0, e.w || 0);
        if (done && e.syn) L[e.syn](...a);
      }
      if (!done) S[name](...a);
    } catch (e) { /* ignore */ }
  }
  // announcer line: CC0 voice sample if loaded, else speech synthesis
  function announce(key, text, pitch = 0.5, rate = 0.95) {
    if (!Settings.voice || Settings.muted) return;
    const v = typeof AUDIO_FILES !== 'undefined' && AUDIO_FILES.voice[key];
    if (ac && v && sample('voice/' + v, 1.0, 1, 0, 0.35)) { try { speechSynthesis.cancel(); } catch (e) { } return; }
    speak(text, pitch, rate);
  }
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
  // music file: streamed through ONE reused <audio> element (low memory on phones; iOS only lets an
  // element play after a touch, so it is started inside unlock() and then just gets new sources)
  let mel = null, mgain = null;
  function musicEl() {
    if (mel !== null) return mel || null;
    mel = false;
    if (!ac || !canFetch() || !ac.createMediaElementSource) return null;
    try {
      const a = new Audio(); a.loop = true; a.preload = 'auto';
      const n = ac.createMediaElementSource(a); mgain = ac.createGain(); mgain.gain.value = 0; n.connect(mgain); mgain.connect(musG);
      mel = a;
    } catch (e) { mel = false; }
    return mel || null;
  }
  const musicUrl = name => (window.AUDIO_BASE || 'audio/') + 'music/' + name + '.' + fileExt();
  // debug/test: how many sample files are decoded / failed / still loading
  function status() { const o = { loaded: 0, fail: 0, loading: 0, ext: fileExt(), live, failed: [] }; for (const k in bufs) { const b = bufs[k]; if (b instanceof AudioBuffer) o.loaded++; else if (b === 'fail') { o.fail++; o.failed.push(k); } else o.loading++; } return o; }
  const names = () => Object.keys(S);
  return { unlock, play, speak, announce, applyVolume, load, status, names, musicEl, musicUrl, get musicGain() { return mgain; }, get ac() { return ac; }, get musDest() { return musG; }, get noiseBuf() { return noiseBuf; } };
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
    school: { bpm: 118, root: 46, prog: [[0, 1], [-3, 0], [5, 1], [-5, 1]], drums: 2, arp: true, pad: true, mel: genMelody(61) },
    clock: { bpm: 136, root: 45, prog: [[0, 0], [-2, 1], [-4, 1], [-5, 0]], drums: 3, arp: true, mel: genMelody(88) },
    forge: { bpm: 146, root: 43, prog: [[0, 0], [3, 1], [-2, 1], [0, 0]], drums: 3, arp: true, pad: true, mel: genMelody(45) },
    shrine: { bpm: 104, root: 44, prog: [[0, 1], [1, 0], [-4, 1], [-2, 1]], drums: 1, arp: true, pad: true, mel: genMelody(21) },
    boss: { bpm: 160, root: 41, prog: [[0, 1], [1, 0], [-2, 1], [-5, 0]], drums: 3, arp: true, pad: true, mel: genMelody(66) },
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
  // file tracks (AUDIO_FILES.music) stream from the shared <audio> element; the sequencer plays
  // until the file can play, and keeps playing if it fails (offline, single-file build, unsupported)
  let cur = null, fileOn = false, gen = 0;
  function fadeOutFile(sec = 0.5, pause = true) {
    const el = Sound.musicEl(), g = Sound.musicGain; if (!el || !g) return;
    const ac = Sound.ac, t = ac.currentTime, my = ++gen;
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + sec);
    if (fileOn && pause) setTimeout(() => { if (gen === my) try { el.pause(); } catch (e) { } }, sec * 1000 + 50);
    fileOn = false;
    return my;
  }
  function play(name) {
    wanted = name;
    if (!Sound.ac) return;
    if (cur === name) return;
    cur = name;
    const m = typeof AUDIO_FILES !== 'undefined' && AUDIO_FILES.music[name], el = Sound.musicEl();
    const wasOn = fileOn, my = fadeOutFile(0.5, !(m && el));   // a new file replaces the source itself
    track = TRACKS[name] || null; step = 0; nextT = Sound.ac.currentTime + 0.08;
    if (!timer) timer = setInterval(schedule, 25);
    if (!m || !el) return;
    const start = () => {
      if (gen !== my) return;
      const ac = Sound.ac, g = Sound.musicGain;
      el.onplaying = () => {
        if (gen !== my) return;
        track = null; fileOn = true;   // sequencer stops scheduling; file fades in
        const t = ac.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(m.v ?? 1, t + 0.8);
      };
      el.onerror = () => { };
      try { el.src = Sound.musicUrl(m.f); el.currentTime = 0; const p = el.play(); if (p && p.catch) p.catch(() => { }); } catch (e) { }
    };
    if (wasOn) setTimeout(start, 520); else start();
  }
  function stop() { track = null; wanted = null; cur = null; if (Sound.ac) fadeOutFile(0.4); }
  function onUnlock() { if (wanted) { const w = wanted; wanted = null; cur = null; play(w); } }
  return { play, stop, onUnlock };
})();
