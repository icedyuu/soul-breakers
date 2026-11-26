// ============================ AUDIO FILES ================================
// CC0 samples + music (sources and licenses: audio/CREDITS.txt; re-encode with tools/make_audio.py).
// Each file exists as .ogg and .mp3 under audio/; the browser gets whichever it can decode.
// sfx entry: f = file variants (one is picked at random), v = volume, r = playback rate,
// j = random rate jitter, w = reverb send, syn = extra synth layer (Sound L.*), pick(args) = variants by argument.
// A sound missing here, or not loaded yet, plays its procedural version from 01_audio.js.
const AUDIO_FILES = {
  sfx: {
    hit: { f: ['punch_m1', 'punch_m2', 'punch_m3', 'punch_h1', 'punch_h2', 'punch_h3'], v: 0.9, syn: 'sub',
      pick: (str = 1) => str >= 3 ? ['punch_h1', 'punch_h2', 'punch_h3'] : str >= 2 ? ['punch_m1', 'punch_m2', 'punch_h1'] : ['punch_m1', 'punch_m2', 'punch_m3'] },
    kick: { f: ['punch_h1', 'punch_h2', 'punch_h3'], v: 0.95, r: 0.9, syn: 'sub' },
    block: { f: ['plate1', 'plate2', 'plate3'], v: 0.55, r: 1.1 },
    land: { f: ['step1', 'step2', 'step3'], v: 0.45, r: 0.85 },
    grab: { f: ['soft_m1', 'soft_m2', 'cloth1'], v: 0.8 },
    slam: { f: ['soft_h1', 'soft_h2'], v: 1.0, r: 0.8, syn: 'boom', w: 0.25 },
    slap: { f: ['soft_m1', 'soft_m2'], v: 0.8, r: 1.3 },
    armor: { f: ['metal_h1', 'metal_h2'], v: 0.6 },
    clack: { f: ['wood_l1', 'wood_l2'], v: 0.8 },
    crush: { f: ['mining1', 'mining2'], v: 0.8, syn: 'boom' },
    bell: { f: ['bell1'], v: 0.55, j: 0.02, w: 0.5 },
    kunai: { f: ['draw1', 'draw2'], v: 0.5, r: 1.4 },
    slash: { f: ['slice1', 'slice2'], v: 0.7, r: 1.15, syn: 'zap' },
    explosion: { f: ['expl1', 'expl2'], v: 0.9, syn: 'boom', w: 0.4 },
    impactBig: { f: ['punch_h1', 'punch_h2', 'punch_h3'], v: 1.0, r: 0.75, syn: 'boom', w: 0.3 },
    ko: { f: ['lowboom1'], v: 1.0, j: 0, syn: 'tail', w: 0.5 },
    energy: { f: ['laser1', 'laser2'], v: 0.45, r: 0.9 },
    menuMove: { f: ['ui_move1', 'ui_move2'], v: 0.5, j: 0.04 },
    menuOk: { f: ['ui_ok1'], v: 0.6, j: 0 },
    menuBack: { f: ['ui_back1'], v: 0.6, j: 0 },
  },
  voice: { round1: 'round1', round2: 'round2', round3: 'round3', round4: 'round4', round5: 'round5', final: 'final', fight: 'fight', time: 'time' },
  music: { menu: { f: 'menu', v: 0.9 }, neon: { f: 'neon', v: 0.8 }, volcano: { f: 'volcano', v: 0.85 }, bamboo: { f: 'bamboo', v: 0.9 }, school: { f: 'menu', v: 0.85 }, clock: { f: 'neon', v: 0.78 }, forge: { f: 'volcano', v: 0.85 }, results: { f: 'results', v: 0.85 } },
};
