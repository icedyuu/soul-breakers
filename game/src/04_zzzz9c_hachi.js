// ============================ HACHISHAKUSAMA — THE EIGHT-FOOT TALL WOMAN ============================
// Supernatural zoner / space control, from the Japanese urban legend (public-domain folklore). An unnaturally tall,
// silent woman in a white dress and a white wide-brimmed hat; long black hair; the sound "po… po… po…".
// Chibi kit, but with a longer body and limbs (own dims) and slower, deliberate animation timing.
// Systems: PRESENCE (apparition / shadow hits, keeping the opponent at her distance, stopping their movement, the
//          Watcher mark) → FULL MANIFESTATION at 100 (8 s: longer reach, more shadow arms, extra follow-ups)
//          · apparitions are real hit entities (harmless carrier projectile + strike hitbox, can be dispelled)
//          · Ult THE EIGHT-FOOT TALL NIGHTMARE (silence, distant silhouettes, the impossible distance, the grab).
const HC = '#dfe6ff', HC2 = '#2a2440', HCD = '#08060c', HCW = '#f6f4f0';
const HAC_MAN = 480, HAC_FADE = 240, HAC_MARK = 360;

// ---------------------------------- art ----------------------------------
// expressions: normal (calm, shadowed by the hat), tilt (same, head tilted), reveal (eyes wide, pin-point pupils,
//              a thin too-wide smile), look (calm, eyes visible), hurt / ko (shared chibi face)
function hacFace(g, r, c, o) {
  let e = c.ex || o.expr || 'normal';
  if (o.expr === 'hurt' || o.expr === 'ko') e = o.expr;
  if (e === 'shout' || e === 'grin') e = 'reveal';
  if (e === 'hurt' || e === 'ko') { chibiFace(g, r, c, { ...o, expr: e }); return; }
  const ex = 0.5 * r, ey = 0.28 * r, fx = 0.94 * r, rev = e === 'reveal';
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  const eye = (x, y, w, h, far) => {
    g.fillStyle = '#f2eeee'; g.beginPath(); g.ellipse(x, y, w, h, 0, 0, TAU); g.fill();
    const gr = g.createLinearGradient(0, y - h, 0, y + h); gr.addColorStop(0, '#000000'); gr.addColorStop(0.7, c.eye); gr.addColorStop(1, c.eye2 || '#3a3440');
    g.fillStyle = gr; g.beginPath(); g.ellipse(x + w * 0.05, y + h * 0.05, w * (rev ? 0.74 : 0.86), h * (rev ? 0.8 : 0.9), 0, 0, TAU); g.fill();
    if (rev) { g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x + w * 0.1, y, w * 0.13, h * 0.12, 0, 0, TAU); g.fill(); }   // pin-point
    else { g.fillStyle = 'rgba(230,230,240,0.35)'; g.beginPath(); g.ellipse(x - w * 0.3, y - h * 0.3, w * 0.22, h * 0.14, -0.3, 0, TAU); g.fill(); }   // a dull shine, no sparkle
    if (c.man && FX.hq) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(200,215,255,0.35)'; g.beginPath(); g.ellipse(x, y, w * 1.2, h * 1.1, 0, 0, TAU); g.fill(); g.restore(); }
    if (!rev) {   // heavy, half-closed upper lid
      g.fillStyle = c.skin; g.beginPath(); g.ellipse(x, y - h * 0.86, w * 1.25, h * 0.62, 0, 0, TAU); g.fill();
    }
    g.strokeStyle = OUTLINE; g.lineWidth = Math.max(1.4, h * 0.2);
    g.beginPath(); g.moveTo(x - w * 1.1, y - h * (rev ? 0.7 : 0.25)); g.quadraticCurveTo(x, y - h * (rev ? 1.25 : 0.42), x + w * 1.05, y - h * (rev ? 0.75 : 0.3)); g.stroke();
    if (!far) { g.lineWidth = Math.max(1, h * 0.12); g.beginPath(); g.moveTo(x - w * 1.0, y - h * (rev ? 0.75 : 0.3)); g.lineTo(x - w * 1.45, y - h * (rev ? 0.95 : 0.5)); g.stroke(); }
  };
  eye(ex, ey, 0.22 * r, 0.33 * r, false);
  eye(fx, ey - 0.01 * r, 0.08 * r, 0.28 * r, true);
  // mouth: a tiny flat line — or, when revealed, a thin smile that is a little too wide
  g.strokeStyle = OUTLINE; g.lineWidth = 0.04 * r;
  if (rev) { g.beginPath(); g.moveTo(0.5 * r, 0.68 * r); g.quadraticCurveTo(0.72 * r, 0.8 * r, 0.96 * r, 0.62 * r); g.stroke(); }
  else { g.beginPath(); g.moveTo(0.66 * r, 0.7 * r); g.lineTo(0.8 * r, 0.69 * r); g.stroke(); }
  // the hat's shadow over the upper face (lighter when the face is revealed)
  const sh = g.createLinearGradient(0, -0.6 * r, 0, (rev ? 0.1 : 0.45) * r);
  sh.addColorStop(0, rev ? 'rgba(12,10,20,0.4)' : 'rgba(12,10,20,0.62)'); sh.addColorStop(1, 'rgba(12,10,20,0)');
  g.fillStyle = sh; g.beginPath(); g.arc(0, 0, r * 1.01, -Math.PI * 0.7, Math.PI * 0.35); g.lineTo(0, 0); g.closePath(); g.fill();
  g.restore();
}
// the white wide-brimmed hat (head space). k > 1 makes the brim a little wider (Full Manifestation).
function hacHat(g, r, c, R, k = 1) {
  const bx = 0.12 * r, by = -0.78 * r, rx = 1.78 * r * k, ry = 0.34 * r;
  // brim (underside darker), then crown, then the black ribbon band
  g.save(); g.translate(bx, by); g.rotate(-0.07);
  g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU);
  if (!R.mono) { g.strokeStyle = OUTLINE; g.lineWidth = R.ol * 2; g.stroke(); }
  g.fillStyle = R.mono || c.hat; g.fill();
  if (!R.mono) {
    g.fillStyle = 'rgba(70,64,80,0.22)'; g.beginPath(); g.ellipse(0, ry * 0.25, rx * 0.92, ry * 0.7, 0, 0, Math.PI); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 0.05 * r; g.beginPath(); g.ellipse(0, -ry * 0.05, rx * 0.9, ry * 0.72, 0, Math.PI * 1.08, Math.PI * 1.7); g.stroke();
  }
  g.restore();
  polyR(g, r, [[-0.78, -0.86], [-0.74, -1.3], [-0.5, -1.56], [0.0, -1.66], [0.5, -1.58], [0.8, -1.34], [0.9, -0.9], [0.4, -0.8], [-0.2, -0.8]], c.hat, R);
  if (R.mono) return;
  g.fillStyle = c.band; g.beginPath(); g.moveTo(-0.77 * r, -1.08 * r); g.quadraticCurveTo(0.05 * r, -1.0 * r, 0.86 * r, -1.13 * r); g.lineTo(0.9 * r, -0.92 * r); g.quadraticCurveTo(0.05 * r, -0.8 * r, -0.78 * r, -0.86 * r); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 0.06 * r; g.beginPath(); g.moveTo(-0.45 * r, -1.42 * r); g.quadraticCurveTo(-0.1 * r, -1.6 * r, 0.3 * r, -1.58 * r); g.stroke();
  // a small knot of the band at the back
  g.fillStyle = c.band; g.beginPath(); g.moveTo(-0.74 * r, -0.95 * r); g.lineTo(-1.05 * r, -0.75 * r); g.lineTo(-0.98 * r, -0.62 * r); g.lineTo(-0.72 * r, -0.88 * r); g.closePath(); g.fill();
}
const HACHI = {
  id: 'hachi', name: 'HACHISHAKUSAMA', jp: '八尺様', title: 'The Eight-Foot Tall Woman', titleJp: '八尺の女',
  style: 'ZONER / SPACE CONTROL', desc: 'A woman far too tall to exist, in a white dress and a wide white hat. She barely moves — until the distance between you is suddenly gone. "Po… po… po…"',
  stats: { power: 3, speed: 2, range: 5, defense: 3 },
  scale: 1.1, health: 1000, walk: 3.1, backWalk: 2.8, jumpV: -15.5, jumpX: 4.0, dashV: 13.5, backdashV: 10.5, backdashInv: 8, juggleMax: 6,
  mute: true, voicePitch: 0.3, voiceRate: 0.7,
  colors: {
    skin: '#f2e4e0', hair: '#141018', hair2: '#221c28', top: HCW, leg: '#f2e4e0', boot: '#e8e4e0', foot: '#e8e4e0', uarm: HCW, farm: HCW, hand: '#f2e4e0', cuff: '#dcd6d2', belt: null,
    eye: '#2a2230', eye2: '#5a5262', accent: HC, brow: '#2a2230', warm: '#ece8e4', sole: '#3a3438', pad: '#d4d0cc', collar: HCW,
    hat: '#f8f6f2', band: '#26222c', dress: HCW, dress2: '#d8d4d6', ex: null, man: false,
  },
  afterColors: ['#ffffff', HC, '#9aa4c8'],
  hurt: { w: 48, h: 196, ch: 128, air: 150, airTop: 178 },
  stance: { t: 0.02, hd: 0.16, fa1: 0.12, fa2: 0.06, ba1: -0.06, ba2: 0.02, fl1: 0.1, fl2: 0.04, bl1: -0.08, bl2: -0.04 },
  poses: {
    tilt: { t: 0.02, hd: 0.62, fa1: 0.1, fa2: 0.04, ba1: -0.06, ba2: 0.02, fl1: 0.1, fl2: 0.04, bl1: -0.08, bl2: -0.04 },
    look_up: { t: -0.06, hd: -0.32, fa1: 0.1, fa2: 0.04, ba1: -0.08, ba2: 0.0, fl1: 0.1, fl2: 0.04, bl1: -0.08, bl2: -0.04 },
    look_down: { t: 0.16, hd: 0.75, fa1: 0.06, fa2: 0.02, ba1: -0.02, ba2: 0.0, fl1: 0.1, fl2: 0.04, bl1: -0.08, bl2: -0.04 },
    reach: { t: 0.08, hd: 0.3, fa1: 1.52, fa2: 1.56, ba1: -0.1, ba2: 0.0 },
    raise: { t: -0.02, hd: 0.35, fa1: 2.2, fa2: 2.45, ba1: -0.1, ba2: 0.0 },
    palm_w: { t: 0.0, hd: 0.2, fa1: 0.85, fa2: 0.5, ba1: -0.1, ba2: 0.0 },
    palm: { t: 0.12, hd: 0.25, fa1: 1.5, fa2: 1.52, ba1: -0.2, ba2: -0.1, fl1: 0.3, bl1: -0.2 },
    swipe_w: { t: -0.1, hd: 0.0, fa1: 2.75, fa2: 2.95, ba1: -0.2, ba2: -0.1 },
    swipe: { t: 0.24, hd: 0.4, fa1: 1.05, fa2: 0.75, ba1: -0.3, ba2: -0.1, fl1: 0.36, bl1: -0.24 },
    bend: { t: 0.52, hd: 0.45, fa1: 0.95, fa2: 1.15, ba1: 0.3, ba2: 0.2, fl1: 0.18, bl1: -0.16 },
    glide: { t: 0.06, hd: 0.28, fa1: -0.25, fa2: -0.12, ba1: -0.38, ba2: -0.24, fl1: 0.22, fl2: 0.1, bl1: -0.2, bl2: -0.1 },
    summon: { t: 0.0, hd: 0.3, fa1: 0.75, fa2: 1.7, ba1: 0.6, ba2: 1.5 },
    shadow: { t: 0.12, hd: 0.5, fa1: 0.42, fa2: 0.2, ba1: 0.34, ba2: 0.14 },
    sweepH: { base: 'sweep', fa1: 1.2, fa2: 1.2 },
    victory: { t: -0.02, hd: 0.08, fa1: 0.1, fa2: 0.04, ba1: -0.06, ba2: 0.02, fl1: 0.1, fl2: 0.04, bl1: -0.08, bl2: -0.04 },
    defeat: { t: 0.32, hd: 0.8, fa1: 0.02, fa2: 0.0, ba1: -0.04, ba2: 0.0, fl1: 0.12, fl2: 0.06, bl1: -0.06, bl2: -0.04 },
    intro: { t: 0.02, hd: 0.45, fa1: 0.1, fa2: 0.04, ba1: -0.06, ba2: 0.02, fl1: 0.1, fl2: 0.04, bl1: -0.08, bl2: -0.04 },
  },
  intro: '…po… po… po…',
  wins: ['…po… po…', '…po.', '…'],
  ropes: [
    { id: 'hairA', at: (sk, r) => headPt(sk, -r * 0.85, -r * 0.2), n: 11, seg: 13, w0: 21, w1: 9, color: 'hair', grav: 0.62, wind: 0.32 },
    { id: 'hairB', at: (sk, r) => headPt(sk, -r * 0.45, -r * 0.62), n: 10, seg: 13, w0: 16, w1: 7, color: 'hair2', grav: 0.66, wind: 0.26 },
    { id: 'hairF', at: (sk, r) => headPt(sk, -r * 0.05, r * 0.35), n: 7, seg: 11, w0: 9, w1: 4, color: 'hair', grav: 0.7, wind: 0.18 },
  ],
  hairBack(g, r, c, R) {
    polyR(g, r, [[0.6, -0.86], [0.0, -1.16], [-0.76, -1.02], [-1.2, -0.4], [-1.22, 0.6], [-1.06, 1.36], [-0.7, 1.4], [-0.5, 0.9], [-0.3, 0.6], [-0.16, 0.4]], c.hair, R);
  },
  hairFront(g, r, c, R, o) {
    skullHair(g, r, c, R);
    // straight, heavy bangs down to the eyes, long side lock in front of the ear
    polyR(g, r, [[-0.4, -0.96], [0.3, -1.04], [0.98, -0.72], [1.1, -0.12], [0.96, -0.06], [0.84, -0.1], [0.66, -0.08], [0.5, -0.1], [0.32, -0.12], [0.14, -0.2], [0.0, -0.5]], c.hair, R);
    polyR(g, r, [[-0.2, -0.4], [0.14, -0.2], [0.24, 0.7], [0.16, 1.5], [-0.04, 1.62], [-0.16, 0.8], [-0.34, 0.0]], c.hair, R);
    polyR(g, r, [[0.96, -0.5], [1.12, -0.1], [1.1, 0.6], [0.98, 0.72], [0.92, 0.12]], c.hair2, R);
    if (!R.mono) { g.strokeStyle = 'rgba(160,150,190,0.25)'; g.lineWidth = 0.05 * r; g.beginPath(); g.arc(0.1 * r, -0.3 * r, 0.82 * r, -2.3, -1.5); g.stroke(); }
    hacHat(g, r, c, R, c.man ? 1.08 : 1);
  },
  neckWear(g, sk, p, c, R) {   // a soft rounded neckline of the dress
    const n = sk.neck;
    poly(g, [[n[0] - 11, n[1] + 6], [n[0] - 9, n[1] - 3], [n[0] + 9, n[1] - 5], [n[0] + 12, n[1] + 5], [n[0] + 1, n[1] + 9]], R.mono || c.collar, R, 2);
    if (R.mono) return;
    g.strokeStyle = 'rgba(120,110,130,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(n[0] - 8, n[1] + 3); g.quadraticCurveTo(n[0] + 1, n[1] + 9, n[0] + 10, n[1] + 2); g.stroke();
  },
  torsoDetail(g, L, bw, c) {
    g.fillStyle = 'rgba(120,110,140,0.12)'; g.fillRect(-15 * bw, -L * 0.5, 30 * bw, L * 0.5 + 6);
    g.strokeStyle = 'rgba(120,110,140,0.25)'; g.lineWidth = 1; for (const x of [-6, 4]) { g.beginPath(); g.moveTo(x * bw, -L * 0.62); g.lineTo(x * bw * 1.3, 4); g.stroke(); }
  },
  drawSkirt(g, sk, p, c, R, o) {   // the long white dress, down to the ankles; it moves unnaturally in Full Manifestation
    const T = (o && o.T) || 0, h = sk.hip, fy = Math.max(sk.ff[1], sk.bf[1]) - 6, man = c.man;
    const sw = Math.sin(T * (man ? 0.13 : 0.05)) * (man ? 7 : 3), jit = man ? Math.sin(T * 0.9) * 2.5 : 0, len = fy - h[1];
    const pts = [[h[0] - 16, h[1] - 10], [h[0] - 24 + sw * 0.3, h[1] + len * 0.45], [h[0] - 34 + sw, fy], [h[0] - 14 + sw + jit, fy + 5], [h[0] + 8 + sw * 0.8, fy + 4], [h[0] + 32 + sw * 0.6 - jit, fy - 2], [h[0] + 24 + sw * 0.2, h[1] + len * 0.45], [h[0] + 16, h[1] - 10]];
    poly(g, pts, R.mono || c.dress, R, 2.6);
    if (R.mono) return;
    g.save(); g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); g.clip();
    g.strokeStyle = 'rgba(110,100,130,0.28)'; g.lineWidth = 1.6;
    for (const d of [-14, -2, 10, 20]) { g.beginPath(); g.moveTo(h[0] + d * 0.4, h[1]); g.quadraticCurveTo(h[0] + d * 0.9 + sw * 0.4, h[1] + len * 0.5, h[0] + d * 1.4 + sw, fy + 4); g.stroke(); }
    g.fillStyle = 'rgba(110,100,130,0.16)'; g.fillRect(h[0] - 40, h[1] + len * 0.55, 80, len);
    g.restore();
    g.strokeStyle = c.dress2; g.lineWidth = 1.4; g.beginPath(); g.moveTo(h[0] - 32 + sw, fy - 2); g.lineTo(h[0] - 14 + sw + jit, fy + 3); g.lineTo(h[0] + 8 + sw * 0.8, fy + 2); g.lineTo(h[0] + 30 + sw * 0.6 - jit, fy - 4); g.stroke();
  },
};
makeChibi(HACHI, { build: { arm: 0.9, leg: 0.88, torso: 0.94 }, colors: {} });
HACHI.dims = { ...CHIBI_DIMS, thigh: 42, shin: 40, torso: 54, neck: 7, headR: 25, uarm: 31, farm: 29 };
HACHI.faceFn = hacFace;
HACHI.portraitScale = 0.6;

// ---------------------------------- presence ----------------------------------
const HAC_PAL = {};
HACHI.palette = F => {
  const man = F.manT > 0, ex = F.hacEx || null, key = (man ? 'm' : '') + (ex || '');
  return HAC_PAL[key] || (HAC_PAL[key] = { ...HACHI.colors, man, ex });
};
function hacGain(F, n, label) {
  if (!F || F.ko || n <= 0 || F.manT > 0 || F.fadeT > 0) return;
  F.pres = clamp((F.pres || 0) + n, 0, 100); F.presT = F.T;
  if (label) FX.wtext(F.x, F.y - 262 * F.s, label, { size: 18, color: '#ffffff', stroke: HC2, life: 28 });
}
function hacManifest(F) {
  F.manT = HAC_MAN; F.pres = 100;
  FX.ring(F.x, F.y - 130, HC, 20, 360, 30, 5); FX.ring(F.x, GROUND, '#ffffff', 10, 240, 24, 3, 0.2); FX.flashScreen('#0a0812', 18, 0.55);
  FX.wtext(F.x, F.y - 300, 'FULL MANIFESTATION', { size: 34, color: '#ffffff', stroke: HC2, life: 80 });
  FX.wtext(F.x, F.y - 262, '— 顕現 —', { size: 22, font: FX_JP(), color: HC, stroke: HCD, life: 80 });
  Sound.play('po', 3, 1.3); Sound.play('hachiDistort');
}
const hacMarked = (F, O) => O && O.hachiMarkT > 0 && O.hachiBy === F;
HACHI.initFighter = F => { F.pres = 0; F.presT = -999; F.manT = 0; F.fadeT = 0; F.hacEx = null; F.intT = -99; F.poT = 0; F.goneT = 0; };
HACHI.walkMul = F => F.manT > 0 ? 1.15 : 1;
HACHI.dmgBonus = F => F.manT > 0 ? 1.05 : 1;
HACHI.onDealDamage = (A, D) => {
  if (A.ko || A.state === 'cine') return;
  // stopping their movement: hitting them while they walk, dash, jump or back off
  if (['walk', 'dash', 'backdash', 'jump', 'prejump'].includes(D.state) && A.T - A.intT > 40) { A.intT = A.T; hacGain(A, 6, 'STOPPED'); }
  else if (D.state === 'attack' && D.move && D.mf <= (D.move.st || 0) + 1 && A.T - A.intT > 40) { A.intT = A.T; hacGain(A, 6, 'STOPPED'); }
};
HACHI.idlePose = F => {   // almost motionless: slow head tilts, an occasional too-sudden snap of the head
  const k = F.T % 520;
  if (k > 150 && k < 230) return 'tilt';
  if (k > 380 && k < 392) return { base: 'stance', hd: -0.12 };
  if (k > 392 && k < 440) return 'tilt';
  return null;
};
HACHI.statePose = F => {
  if (F.state === 'walk') {   // a slow glide with long steps; the dress hides the legs
    const ph = F.walkPhase || 0, s1 = Math.sin(ph * 0.7);
    return [{ t: 0.04, hd: 0.2 + Math.sin(F.T * 0.02) * 0.08, fa1: 0.08 - s1 * 0.05, fa2: 0.04, ba1: -0.06 + s1 * 0.05, ba2: 0.02, fl1: 0.12 + 0.3 * s1, bl1: 0.12 - 0.3 * s1, fl2: 0.04, bl2: 0.0 }, 0.12];
  }
  if (F.state === 'dash') return ['glide', 0.5];
  if (F.state === 'defeat') return [F.sf < 60 ? 'look_down' : 'defeat', 0.05];
  if (F.state === 'victory' && !F.cos) return [F.sf < 80 ? 'victory' : F.sf < 150 ? 'tilt' : 'victory', 0.05];
  return null;
};
HACHI.tick = F => {
  const O = F.opp; if (!O) return;
  const live = BT && BT.phase === 'fight' && !F.ko;
  if (F.state !== 'cine') {
    const s = F.state, k = F.moveKey;
    F.hacEx = s === 'attack' && (k === 'sp2d' || k === 'sp2') ? 'reveal' : s === 'victory' && F.sf > 70 ? 'reveal' : F.manT > 0 && s === 'attack' ? 'reveal' : null;
  }
  // safety: the teleport never leaves her hidden, the ult never leaves the opponent hidden
  if (F.state !== 'cine' && !(F.state === 'attack' && F.moveKey === 'sp2')) F.hidden = F.state === 'defeat' ? F.hidden : false;
  if (!BT.cine && O.hachiHid) { O.hidden = false; O.hachiHid = false; }
  // the opponent marked by THE WATCHER
  if (O.hachiMarkT > 0) {
    O.hachiMarkT--;
    if (live && O.hachiBy === F) {
      if (['walk', 'dash', 'backdash', 'jump'].includes(O.state)) hacGain(F, 0.07);
      if (O.state === 'attack' && O.mf === 1 && O.move && (O.move.special || O.move.ult)) hacGain(F, 4, 'WATCHED');
      if (O.T % 7 === 0) FX.p({ type: 'spark', x: O.x + rand(-30, 30), y: O.y - rand(20, 200), vx: 0, vy: -rand(0.2, 0.8), life: 26, size: 1.6, color: '#ffffff' });
    }
  }
  if (F.fadeT > 0) F.fadeT--;
  if (F.manT > 0) {
    F.manT--;
    if (F.T % 4 === 0) FX.p({ type: 'smoke', x: F.x + rand(-40, 40), y: F.y - rand(10, 230), vx: rand(-0.3, 0.3), vy: -rand(0.2, 0.7), life: 34, size: rand(6, 12), grow: 0.25, color: 'rgba(220,228,255,0.18)', add: false });
    if (F.T % 150 === 0) Sound.play('po', 2, 0.6);
    if (F.state === 'walk' || F.state === 'dash') F.afterimage = Math.max(F.afterimage, 2);
    if (F.manT === 0) { F.pres = 0; F.fadeT = HAC_FADE; FX.wtext(F.x, F.y - 250, '…', { size: 26, color: HC, stroke: HC2, life: 40 }); }
  } else if (live) {
    if (F.pres >= 100) hacManifest(F);
    else {
      // patient space control: the opponent kept at her distance (or pinned in a corner) builds Presence slowly
      const d = Math.abs(O.x - F.x), corner = O.x < 170 || O.x > STAGE_W - 170;
      if (O.state !== 'hit' && O.state !== 'knockdown' && ((d > 200 && d < 500) || (corner && d < 520))) hacGain(F, corner ? 0.06 : 0.045);
      if (F.T - F.presT > 360 && F.pres > 0) F.pres = Math.max(0, F.pres - 0.05);
    }
    if (F.pres >= 60 && F.T % 16 === 0) FX.p({ type: 'smoke', x: F.x + rand(-30, 30), y: F.y - rand(20, 210), vx: 0, vy: -0.4, life: 30, size: 6, grow: 0.2, color: 'rgba(220,228,255,0.14)', add: false });
  }
  // defeat: she looks down, a distortion, and she is gone
  if (F.state === 'defeat' && F.sf === 110 && !F.hidden) {
    F.hidden = true; F.goneT = 1;
    BT.spawn({ owner: F, kind: 'hachiFade', x: F.x, y: F.y, vx: F.facing * 0.001, w: 1, h: 1, life: 50, harmless: true, clash: 0, face: F.facing, pose: { ...F.pose } });
    Sound.play('hachiDistort');
  }
};
HACHI.drawBehind = (g, F) => {
  // her shadow grows long and dark (stronger in Full Manifestation)
  const man = F.manT > 0, k = man ? 1 : (F.pres || 0) >= 60 ? 0.5 : 0.25;
  g.save(); g.globalAlpha = 0.35 * k + 0.1;
  const len = (man ? 260 : 150) + Math.sin(F.T * 0.03) * 10;
  const gr = g.createLinearGradient(F.x, GROUND, F.x - F.facing * len, GROUND); gr.addColorStop(0, 'rgba(6,4,10,0.9)'); gr.addColorStop(1, 'rgba(6,4,10,0)');
  g.fillStyle = gr; g.beginPath(); g.ellipse(F.x - F.facing * len * 0.45, GROUND + 4, len * 0.55, 10 + 4 * k, 0, 0, TAU); g.fill();
  g.restore();
  if (man && FX.hq) {   // a pale distortion around her imposing silhouette
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.14 + 0.06 * Math.sin(F.T * 0.11);
    drawFigure(g, F.ch, F.pose, F.x + Math.sin(F.T * 0.5) * 3, F.y, F.facing, { mono: HC, scale: 1.08 });
    g.globalAlpha = 0.08; drawFigure(g, F.ch, F.pose, F.x - Math.sin(F.T * 0.37) * 5, F.y, F.facing, { mono: '#ffffff', scale: 1.14 });
    g.restore();
  }
};
HACHI.drawExtra = (g, F) => {
  const O = F.opp;
  if (O && hacMarked(F, O) && !O.hidden && FX.hq) {   // THE WATCHER: a white distortion around them, her faint shadow behind them
    const T = F.T, a = Math.min(1, O.hachiMarkT / 30);
    g.save(); g.globalAlpha = 0.16 * a; drawFigure(g, HACHI, hacPose('tilt'), O.x - O.facing * 46, GROUND, O.facing, { mono: '#e8ecff', scale: 0.98 });
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = (0.3 + 0.15 * Math.sin(T * 0.2)) * a; g.strokeStyle = '#ffffff'; g.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) { const yy = O.y - 40 - i * 60 + Math.sin(T * 0.13 + i) * 6; g.beginPath(); g.ellipse(O.x, yy, 40 + Math.sin(T * 0.21 + i * 2) * 6, 7, 0, 0, TAU); g.stroke(); }
    g.restore();
  }
};
const HAC_POSE = {};
const hacPose = k => HAC_POSE[typeof k === 'string' ? k : JSON.stringify(k)] || (HAC_POSE[typeof k === 'string' ? k : JSON.stringify(k)] = buildPose(HACHI, k));
const HAC_GHOST = { ...HACHI.colors, skin: '#eef0f6', hand: '#eef0f6', hair: '#2a2632', hair2: '#36303e', hat: '#ffffff', ex: 'reveal' };
function hacDrawGhost(g, x, y, face, pose, a, T, o = {}) {   // an apparition: her own model, paler, with a white shimmer
  if (!(a > 0.01)) return;
  const p = hacPose(pose || 'stance');
  g.save(); g.globalAlpha = a * (o.solid ? 0.9 : 0.72);
  drawFigure(g, HACHI, p, x + (T % 11 === 0 ? 2 : 0), y, face, { pal: o.pal || HAC_GHOST, T, expr: 'normal', scale: o.scale || 1 });
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * (0.2 + 0.1 * Math.sin(T * 0.5)); drawFigure(g, HACHI, p, x + Math.sin(T * 0.7) * 3, y, face, { mono: HC, scale: (o.scale || 1) * 1.02 });
  g.restore();
}
HACHI.introFx = F => { FX.wtext(F.x, F.y - 280, 'po… po… po…', { size: 22, color: '#ffffff', stroke: HC2, life: 70, vy: -0.25 }); Sound.play('po', 3, 0.8); };

// ---------------------------------- apparitions + projectiles ----------------------------------
// An apparition = a harmless carrier projectile (drawn even while she is hidden, cleared with the round) that spawns a
// real strike hitbox when it acts. The opponent can dispel it with a hit before it strikes.
function hacApparition(F, o) {
  const live = BT.projs.filter(p => p.kind === 'hachiApp' && p.owner === F && !p.dead && !p.done);
  if (live.length >= 3) { const old = live[0]; old.done = true; old.gone = 1; old.life = Math.min(old.life, 10); }
  const p = BT.spawn(Object.assign({ owner: F, kind: 'hachiApp', x: F.x, y: GROUND, vx: 0, w: 1, h: 1, life: 70, harmless: true, clash: 0, at: 26, face: F.facing, strikes: 1, dmg: 50, tr: 0, src: F.moveKey || 'sp1' }, o));
  p.x = clamp(p.x, 50, STAGE_W - 50); p.vx = 0;
  for (let i = 0; i < 10; i++) FX.p({ type: 'smoke', x: p.x + rand(-24, 24), y: GROUND - rand(20, 210), vx: rand(-0.5, 0.5), vy: -rand(0.2, 1), life: 26, size: rand(5, 9), grow: 0.2, color: 'rgba(235,240,255,0.25)', add: false });
  return p;
}
function hacStrike(F, p) {
  const O = F.opp, man = F.manT > 0, mk = hacMarked(F, O);
  const face = Math.sign(O.x - p.x) || p.face; p.face = face;
  BT.spawn({ owner: F, kind: 'hachiStrike', x: p.x + face * 58, y: GROUND - 112, vx: face * 0.001, w: 116, h: 176, life: 5, hits: 1, clash: 0, dmg: p.dmg * (mk ? 1.1 : 1), hs: 22, bs: 12, kb: 5, str: 2,
    color: HC, srcKey: p.src, projOnHit: 1, onHit(A) { hacGain(A, p.src === 'counter' ? 6 : 5); } });
  Sound.play('hachiSlash'); FX.ring(p.x + face * 50, GROUND - 110, '#ffffff', 10, 70, 8, 3);
}
EXTRA_PROJ.hachiApp = {
  update(p) {
    const F = p.owner, O = F.opp;
    if (!O || F.ko) { p.dead = true; return; }
    if (!p.done) {
      if (hacMarked(F, O) && p.tr < 170) { const tx = O.x + (p.x < O.x ? -70 : 70), dx = clamp(tx - p.x, -2.6, 2.6); p.x += dx; p.tr += Math.abs(dx); }   // tracks a marked target, within limits
      p.face = Math.sign(O.x - p.x) || p.face;
      // the opponent can dispel it before it strikes
      const r = { x: p.x - 24, y: GROUND - 196, w: 48, h: 196 };
      const byMelee = O.state === 'attack' && O.hitActive && overlap(O.hitbox(), r);
      const byProj = BT.projs.some(q => q.owner === O && q.active() && overlap(q.rect(), r));
      if (p.t > 4 && (byMelee || byProj)) {
        p.done = true; p.gone = 1; p.life = Math.min(p.life, 12);
        for (let i = 0; i < 14; i++) FX.p({ type: 'smoke', x: p.x + rand(-20, 20), y: GROUND - rand(20, 200), vx: rand(-3, 3), vy: rand(-2, 1), life: 22, size: rand(5, 10), grow: 0.3, color: 'rgba(240,244,255,0.35)', add: false });
        FX.wtext(p.x, GROUND - 230, 'DISPELLED', { size: 16, color: '#ffffff', stroke: HC2, life: 24 }); Sound.play('hachiDistort');
        return;
      }
      if (p.t >= p.at) { hacStrike(F, p); p.strikes--; if (p.strikes > 0) p.at += 16; else { p.done = true; p.life = Math.min(p.life, 18); } }
    }
  },
  draw(g, p) {
    const T = p.t, appear = Math.min(1, T / (p.slow ? 22 : 10)), fade = Math.min(1, p.life / 12), a = appear * fade;
    const striking = p.done && !p.gone && p.life > 6;
    const pose = p.gone ? 'stance' : striking ? 'swipe' : T >= p.at - 6 ? 'swipe_w' : 'tilt';
    if (p.slow && T < 22) {   // THE WHITE APPARITION: a white silhouette that slowly becomes recognizable
      g.save(); g.globalAlpha = Math.min(1, T / 10) * 0.5; drawFigure(g, HACHI, hacPose('stance'), p.x, GROUND, p.face, { mono: '#ffffff' }); g.restore();
    }
    hacDrawGhost(g, p.x, GROUND, p.face, pose, p.slow ? Math.max(0, (T - 8) / 14) * fade : a, T, { solid: !p.slow });
    if (T < 8) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - T / 8; g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.beginPath(); g.ellipse(p.x, GROUND - 110, 26 + T * 4, 120, 0, 0, TAU); g.stroke(); g.restore(); }
  },
};
EXTRA_PROJ.hachiStrike = { update() {}, draw(g, p) {   // a pale claw arc
  const d = Math.sign(p.vx) || 1, k = p.life / 5;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = k * 0.8; g.strokeStyle = '#ffffff'; g.lineWidth = 3;
  for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(p.x - d * 40, p.y - 10 + i * 18, 70, d > 0 ? -1.1 : Math.PI - 0.1, d > 0 ? 0.6 : Math.PI + 1.6); g.stroke(); }
  g.strokeStyle = HC; g.lineWidth = 8; g.globalAlpha = k * 0.3; g.beginPath(); g.arc(p.x - d * 40, p.y + 8, 70, d > 0 ? -1.1 : Math.PI - 0.1, d > 0 ? 0.6 : Math.PI + 1.6); g.stroke();
  g.restore();
} };
// UNNATURAL REACH: the stretched arm, anchored at her hand; the hitbox is the hand at the tip
EXTRA_PROJ.hachiArm = {
  rect(p) { const tip = hacArmTip(p); return { x: tip[0] - 40, y: tip[1] - 40, w: 80, h: 80 }; },
  update(p) {
    const F = p.owner;
    if (F.state !== 'attack' || F.moveKey !== 'sp1f') { p.dead = true; return; }
    p.k = Math.min(1, p.k + (p.t < 9 ? 0.13 : 0)); if (p.t > 14) p.k = Math.max(0, p.k - 0.16);
    if (p.t > 14) p.harmless = true;
  },
  draw(g, p) {
    const F = p.owner, h = F.handW('f'), tip = hacArmTip(p), pal = F.colors;
    g.save(); g.lineCap = 'round';
    g.strokeStyle = OUTLINE; g.lineWidth = 15; g.beginPath(); g.moveTo(h[0], h[1]); g.lineTo(tip[0], tip[1]); g.stroke();
    const gr = g.createLinearGradient(h[0], h[1], tip[0], tip[1]); gr.addColorStop(0, pal.farm); gr.addColorStop(0.55, pal.farm); gr.addColorStop(0.7, pal.skin); gr.addColorStop(1, pal.skin);
    g.strokeStyle = gr; g.lineWidth = 10; g.beginPath(); g.moveTo(h[0], h[1]); g.lineTo(tip[0], tip[1]); g.stroke();
    // a slight unnatural kink in the stretched arm
    g.strokeStyle = 'rgba(80,70,100,0.3)'; g.lineWidth = 2; const m = [lerp(h[0], tip[0], 0.6), lerp(h[1], tip[1], 0.6)]; g.beginPath(); g.moveTo(m[0], m[1] - 5); g.lineTo(m[0], m[1] + 5); g.stroke();
    // long pale fingers at the tip
    const d = F.facing; g.translate(tip[0], tip[1]); g.scale(d, 1);
    g.fillStyle = pal.hand; g.strokeStyle = OUTLINE; g.lineWidth = 2;
    g.beginPath(); g.ellipse(0, 0, 11, 9, 0, 0, TAU); g.fill(); g.stroke();
    const curl = p.t > 9 ? 0.7 : 0;
    for (let i = 0; i < 4; i++) { g.save(); g.rotate(-0.5 + i * 0.32 + curl * 0.3); g.beginPath(); g.moveTo(6, -2); g.lineTo(26 - curl * 10, -1); g.lineTo(26 - curl * 10, 2); g.lineTo(6, 3); g.closePath(); g.fill(); g.stroke(); g.restore(); }
    if (FX.hq) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.25; g.fillStyle = HC; g.beginPath(); g.arc(8, 0, 26, 0, TAU); g.fill(); }
    g.restore();
  },
};
function hacArmTip(p) { const F = p.owner, h = F.handW('f'); return [h[0] + F.facing * p.len * p.k, h[1] + 6 * p.k]; }
// SHADOW OF THE EIGHT FEET: a dark pool on the floor (warning), then a long shadow arm rises out of it
EXTRA_PROJ.hachiShadow = {
  rect(p) { const k = Math.min(1, (p.max - p.life + 1) / 4); return { x: p.x - 34, y: GROUND - 200 * k, w: 68, h: 200 * k }; },
  delay(p) { if (p.delay === 8) Sound.play('shadowRise'); },
  update(p) { if (p.max - p.life === 1) { FX.dust(p.x, GROUND, 6); for (let i = 0; i < 6; i++) FX.p({ type: 'smoke', x: p.x + rand(-20, 20), y: GROUND - rand(0, 60), vx: 0, vy: -rand(1, 3), life: 20, size: 8, grow: 0.3, color: 'rgba(10,6,16,0.5)', add: false }); } },
  draw(g, p) {
    const warn = p.delay > 0, T = p.max - p.life;
    g.save();
    const pr = warn ? 1 - p.delay / (p.delay0 || 20) : 1;
    g.fillStyle = 'rgba(6,4,10,0.78)'; g.beginPath(); g.ellipse(p.x, GROUND + 2, 30 + 26 * pr, 9, 0, 0, TAU); g.fill();
    if (warn) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35 + 0.3 * Math.sin(p.delay * 0.7); g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.beginPath(); g.ellipse(p.x, GROUND + 2, 56, 11, 0, 0, TAU); g.stroke(); g.restore(); return; }
    const k = Math.min(1, T / 4) * Math.min(1, p.life / 8), Hh = 210 * k, sw = Math.sin(T * 0.4 + p.x) * 8 * k, d = p.face || 1;
    g.fillStyle = '#0a0610'; g.strokeStyle = 'rgba(200,210,255,0.35)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(p.x - 16, GROUND); g.quadraticCurveTo(p.x - 14 + sw, GROUND - Hh * 0.5, p.x - 8 + sw * 1.6, GROUND - Hh * 0.92); g.lineTo(p.x + 8 + sw * 1.6, GROUND - Hh * 0.92); g.quadraticCurveTo(p.x + 12 + sw, GROUND - Hh * 0.5, p.x + 16, GROUND); g.closePath(); g.fill(); g.stroke();
    // long fingers at the top, curling toward the target
    for (let i = 0; i < 4; i++) { const bx = p.x + sw * 1.6 + (i - 1.5) * 5, by = GROUND - Hh * 0.9; g.beginPath(); g.moveTo(bx - 2, by); g.quadraticCurveTo(bx + d * (6 + i * 3), by - 26 * k, bx + d * (16 + i * 4), by - 18 * k - i * 3); g.lineWidth = 4; g.strokeStyle = '#0a0610'; g.stroke(); }
    g.restore();
  },
};
EXTRA_PROJ.hachiFade = { update() {}, draw(g, p) {   // defeat: her silhouette dissolves in horizontal slices
  const k = p.life / 50, T = p.t;
  g.save();
  for (let i = 0; i < 9; i++) {
    const y0 = GROUND - 250 + i * 28; g.save(); g.beginPath(); g.rect(p.x - 140, y0, 280, 28); g.clip();
    g.globalAlpha = k * (0.4 + 0.6 * ((i + T) % 3 ? 1 : 0.3)); const ox = Math.sin(T * 0.9 + i * 1.7) * (1 - k) * 30;
    drawFigure(g, HACHI, p.pose, p.x + ox, p.y, p.face, { mono: '#eef0ff' }); g.restore();
  }
  g.restore();
} };

// ---------------------------------- moves ----------------------------------
HACHI.moves = Object.assign(baseNormals({ dmg: 1.04, spd: 2, rng: 1.25 }), {
  sp1: {
    name: 'PO… PO… PO…', jp: 'ぽぽぽ', desc: 'She tilts her head; "po… po… po…". An apparition of her appears right behind the opponent (up to ~560 px away) and strikes after a short pause. The apparition is a real attacker: block it, move away, or hit it first to dispel it. +5 Presence on hit. Marked: it tracks them. Full Manifestation: it strikes twice.', special: 1, lvl: 4,
    poses: ['tilt', 'tilt'], st: 16, act: 1, rec: 20, cd: 150, sfx: 'po',
    spawn: { f: 14, fn(F) {
      const O = F.opp, d = Math.sign(O.x - F.x) || F.facing, dist = Math.min(Math.abs(O.x - F.x), 560);
      const tx = F.x + d * dist + d * 70;   // behind them
      hacApparition(F, { x: tx, face: -d, at: 24, life: F.manT > 0 ? 62 : 46, strikes: F.manT > 0 ? 2 : 1, dmg: 50, src: 'sp1' });
    } },
    tick(F, f) { if (f === 2) { Sound.play('po', 3, 0.9); FX.wtext(F.x, F.y - 270, 'po… po… po…', { size: 18, color: '#ffffff', stroke: HC2, life: 40, vy: -0.3 }); } },
  },
  sp1f: {
    name: 'UNNATURAL REACH', jp: '異様な腕', desc: 'She slowly raises one hand — then her arm stretches unnaturally far (~400 px, ~560 in Full Manifestation) and the pale hand snaps shut on them, pulling them toward her. Clear 20 f startup; blockable, can be jumped or ducked under at the tip. +5 Presence on hit.', special: 1, lvl: 4,
    poses: ['raise', 'reach'], st: 20, act: 1, rec: 26, cd: 110, sfx: 'hachiReach',
    poseFn(F, f) { return f <= 12 ? 'raise' : f <= 40 ? 'reach' : 'stance'; },
    spawn: { f: 18, fn(F) {
      const man = F.manT > 0;
      BT.spawn({ owner: F, kind: 'hachiArm', x: F.x, y: F.y - 150, vx: F.facing * 0.001, w: 80, h: 80, life: 24, hits: 1, clash: 0, k: 0, len: man ? 560 : 400,
        dmg: man ? 72 : 62, hs: 28, bs: 12, kb: -9, str: 2, color: HC, srcKey: 'sp1f', projOnHit: 1,
        onHit(A, D) { hacGain(A, 5); D.vx = -A.facing * Math.min(14, Math.abs(D.x - A.x) / 14); Sound.play('grab'); } });
      Sound.play('hachiReach');
    } },
  },
  counter: {
    name: 'THE WHITE APPARITION', jp: '白い幻影', desc: 'A white silhouette appears at a chosen spot (default ~260 px ahead, hold → for ~420, hold ← for ~120), slowly becomes her, stands motionless — then strikes once and is gone. Great for pressure and combo extensions. Max 3 apparitions; the opponent can dispel one before it strikes. +6 Presence when it connects.', special: 1, lvl: 4,
    poses: ['summon', 'summon'], st: 12, act: 1, rec: 16, cd: 190, sfx: 'hachiDistort',
    onStart(F) { F.appFwd = F.input.fwd > 0 ? 1 : F.input.fwd < 0 ? -1 : 0; },
    spawn: { f: 12, fn(F) {
      const dist = F.appFwd > 0 ? 420 : F.appFwd < 0 ? 120 : 260, man = F.manT > 0;
      hacApparition(F, { x: F.x + F.facing * dist, face: F.facing, at: man ? 36 : 50, life: man ? 56 : 70, strikes: 1, dmg: 58, slow: 1, src: 'counter' });
    } },
  },
  sp2: {
    name: 'THE DISTANCE DISAPPEARS', jp: '距離が消える', desc: 'She stands motionless; the air distorts; she is gone — a faint flicker shows where she will return (behind or beside them, up to ~600 px) a moment before she does, then a sudden strike. Walk or jump away from the flicker, or block. Long recovery if it misses. Full Manifestation: a shadow claw follows on hit.', special: 1, lvl: 4,
    poses: ['tilt', 'swipe'], st: 28, act: 5, rec: 28, cd: 300, dmg: 92, hs: 28, bs: 14, kb: 9, hb: { x: 0, y: -186, w: 110, h: 180 }, str: 3, shake: 6, sfx: 'hachiDistort',
    onStart(F) { F.distHit = false; F.distDest = null; F.distFollow = false; },
    poseFn(F, f) { return f < 8 ? 'tilt' : f < 24 ? 'stance' : f <= 33 ? (f < 27 ? 'swipe_w' : 'swipe') : 'stance'; },
    tick(F, f) {
      const O = F.opp;
      if (f === 2) { FX.flashScreen('#0a0812', 6, 0.25); Sound.play('hachiDistort'); }
      if (f === 8) { F.hidden = true; F.vx = 0; for (let i = 0; i < 14; i++) FX.p({ type: 'smoke', x: F.x + rand(-24, 24), y: F.y - rand(20, 220), vx: rand(-0.6, 0.6), vy: -rand(0.3, 1.4), life: 26, size: rand(5, 10), grow: 0.25, color: 'rgba(235,240,255,0.3)', add: false }); }
      if (f === 12) {   // the destination is decided now and shown as a flicker
        const behind = O.facing, max = 600, tx0 = O.x - behind * 72, dx = tx0 - F.x;
        F.distDest = clamp(Math.abs(dx) > max ? F.x + Math.sign(dx) * max : tx0, 60, STAGE_W - 60);
        BT.spawn({ owner: F, kind: 'hachiFlicker', x: F.distDest, y: GROUND, vx: 0, w: 1, h: 1, life: 14, harmless: true, clash: 0, face: Math.sign(O.x - F.distDest) || 1 });
      }
      if (f === 24 && F.distDest !== null) {
        F.x = F.distDest; F.facing = Math.sign(O.x - F.x) || F.facing; F.hidden = false; F.afterimage = 6;
        FX.ring(F.x, F.y - 120, '#ffffff', 10, 90, 10, 3); Sound.play('whoosh', 0.6);
      }
    },
    onHit(A, D) { if (!A.distHit) { A.distHit = true; hacGain(A, 6); if (A.manT > 0) A.distFollow = true; } },
  },
  distClaw: {
    name: 'SHADOW CLAW', jp: '影の爪', desc: 'Full Manifestation follow-up after The Distance Disappears hits: her shadow lashes up from the floor and launches them.', followup: 1, lvl: 4.5,
    poses: ['shadow', 'raise'], st: 6, act: 4, rec: 20, dmg: 46, hs: 30, bs: 12, kb: 3, launch: -13, hb: { x: -10, y: -170, w: 120, h: 170 }, str: 3, sfx: 'shadowRise',
    tick(F, f) { if (f === 5) BT.spawn({ owner: F, kind: 'hachiShadow', x: F.opp.x, y: GROUND - 100, vx: 0.001 * F.facing, w: 68, h: 200, life: 10, harmless: true, clash: 0, face: -F.facing }); },
    onHit(A) { hacGain(A, 4); },
  },
  sp2f: {
    name: 'SHADOW OF THE EIGHT FEET', jp: '八尺の影', desc: 'The field darkens; her shadow spreads across the floor. Long shadow arms rise one after another around the opponent (left, right, then where they stand; 4–5 arms when marked or manifested). Every arm is announced by a dark pool with a white ring and can be blocked; the pools briefly slow their walk. +4 Presence per hit. Long cooldown.', special: 1, lvl: 4,
    poses: ['shadow', 'shadow'], st: 16, act: 1, rec: 30, cd: 380, sfx: 'shadowRise',
    tick(F, f) { if (f === 2) { FX.darkTarget = Math.max(FX.darkTarget, 0.28); } if (f === 46) FX.darkTarget = 0; },
    spawn: { f: 16, fn(F) {
      const O = F.opp, n = F.manT > 0 ? 5 : hacMarked(F, O) ? 4 : 3, ox = clamp(O.x, 90, STAGE_W - 90);
      const xs = [ox - 100, ox + 100, ox, ox - 50, ox + 50];
      for (let i = 0; i < n; i++) {
        BT.spawn({ owner: F, kind: 'hachiShadow', x: clamp(xs[i], 40, STAGE_W - 40), y: GROUND - 100, vx: 0, w: 68, h: 200, delay: 20 + i * 11, delay0: 20 + i * 11, life: 16, hits: 1, clash: 0, face: Math.sign(O.x - xs[i]) || 1,
          dmg: i === n - 1 ? 40 : 28, hs: i === n - 1 ? 26 : 20, bs: 10, kb: 2, launch: i === n - 1 ? -9 : 0, str: 2, color: HC, srcKey: 'sp2f', projOnHit: 1, onHit(A) { hacGain(A, 4); } });
      }
      if (Math.abs(O.x - ox) < 160 && O.onGround) O.slowT = Math.max(O.slowT, 60);
      Sound.play('hachiDistort');
    } },
  },
  sp2d: {
    name: 'THE WATCHER', jp: '見つめる者', desc: 'She slowly raises her head; her face becomes visible under the hat. The opponent (anywhere within ~700 px) is marked for 6 s: apparitions track them, Shadow gets an extra arm, apparition strikes deal +10%, and every step, jump or special they make builds her Presence. Readable startup, punishable recovery. Does no damage.', special: 1, lvl: 4,
    poses: ['look_up', 'look_up'], st: 22, act: 1, rec: 26, cd: 560, sfx: 'po',
    tick(F, f) {
      const O = F.opp;
      if (f === 4) Sound.play('po', 1, 0.7);
      if (f === 22 && Math.abs(O.x - F.x) <= 700 && !O.hidden) {
        O.hachiMarkT = HAC_MARK; O.hachiBy = F;
        FX.ring(O.x, O.y - 110, '#ffffff', 90, 20, 18, 3); FX.wtext(O.x, O.y - 250 * O.s, 'WATCHED', { size: 22, color: '#ffffff', stroke: HC2, life: 40 });
        Sound.play('hachiDistort'); hacGain(F, 6);
      }
    },
  },
  ult: {
    name: 'THE EIGHT-FOOT TALL NIGHTMARE', jp: '八尺の悪夢', desc: 'Ultimate. She tilts her head and looks at them from far away (long reach). If it connects: silence, "po… po… po…", she is gone — distant white figures, the impossible distance, the grab, and the darkness under her shadow.', ult: 1, lvl: 6, cost: 100,
    poses: ['tilt', 'reach'], st: 14, act: 6, rec: 36, dmg: 20, hs: 40, bs: 20, kb: 1, hb: { x: 0, y: -230, w: 300, h: 230 }, invuln: [0, 18], str: 3, sfx: 'po',
    onHit(F, D) { BT.startCine(F, D, CINE.hachi, { zoom: 1.2 }); return true; },
  },
});
addFollowup(HACHI, 'sp2', { btn: 'sp2', move: 'distClaw', noMotion: true, cond: F => F.manT > 0 && F.distFollow });   // Full Manifestation only, after the strike connected
(() => {
  const M = HACHI.moves;
  Object.assign(M.L, { name: 'Cold Fingers', poses: ['palm_w', 'palm'], st: 7, rec: 11, hb: { x: 10, y: -156, w: 96, h: 36 } });
  Object.assign(M.M, { name: 'Long Stride', hb: { x: 15, y: -112, w: 104, h: 38 } });
  Object.assign(M.H, { name: 'Falling Palm', poses: ['swipe_w', 'swipe'], st: 16, hb: { x: 20, y: -182, w: 118, h: 76 } });
  Object.assign(M.cL, { name: 'Low Reach' });
  Object.assign(M.cM, { name: 'Hem Sweep' });
  Object.assign(M.cH, { name: 'Shadow Sweep', poses: ['sweep_w', 'sweepH'] });
  Object.assign(M.jH, { name: 'Descending Veil', poses: ['swipe_w', 'swipe'] });
  Object.assign(M.LH, { name: 'Rising Hand', poses: ['shadow', 'raise'] });
  Object.assign(M.FF, { name: 'Impossible Glide', poses: ['glide', 'palm'], vx: 13 });
})();
// CPU hints
HACHI.moves.sp1.__ai = { reach: 560, kind: 'proj', anti: false, st: 40, low: false, over: false };
HACHI.moves.sp1f.__ai = { reach: 400, kind: 'proj', anti: false, st: 20, low: false, over: false };
HACHI.moves.counter.__ai = { reach: 300, kind: 'proj', anti: false, st: 62, low: false, over: false };
HACHI.moves.sp2.__ai = { reach: 600, kind: 'melee', anti: false, st: 28, low: false, over: false };
HACHI.moves.sp2f.__ai = { reach: 900, kind: 'proj', anti: false, st: 36, low: false, over: false };
HACHI.moves.sp2d.__ai = { reach: 700, kind: 'buff', anti: false, st: 22, low: false, over: false };
HACHI.moves.ult.__ai = { reach: 330, kind: 'melee', anti: false, st: 14, low: false, over: false };
HACHI.combos = [
  { name: 'Unnatural Reach', notation: 'M → H → ↓→SP1 (Unnatural Reach)', seq: ['M', 'H', 'sp1f'] },
  { name: 'Low Reach', notation: 'cM (Hem Sweep) → ↓→SP1 (Unnatural Reach)', seq: ['cM', 'sp1f'] },
  { name: 'The Distance Disappears', notation: 'L → M → SP2 (The Distance Disappears)', seq: ['L', 'M', 'sp2'] },
  { name: 'Eight-Foot Nightmare', notation: 'M → H → SP1+SP2 (Ultimate)', seq: ['M', 'H', 'ult'], meter: 1 },
];
HACHI.applyTrial = (A, tr) => { if (!tr) return; if (tr.meter) A.meter = 100; };

// ---------------------------------- cinematic: THE EIGHT-FOOT TALL NIGHTMARE ----------------------------------
// Silence, scale and the feeling of being hunted. Screen-space layers (cineBg / cineFg); random geometry is made at
// frame 1 (sim side), the draw functions never call Math.random.
CINE.hachi = function (A, D, f, c) {
  const dir = A.facing;
  if (f === 1) {
    A.x = clamp(A.x, 300, STAGE_W - 300); D.x = clamp(A.x + dir * 300, 140, STAGE_W - 140); D.y = GROUND; D.forcePose = 'hit'; A.forcePose = 'stance'; A.hacEx = null;
    c.ax0 = A.x; c.af0 = A.facing; c.df0 = D.facing; c.zoom = 1.2; c.camX = (A.x + D.x) / 2; c.camY = GROUND - 170; c.bg = HACHI.cineBg; c.fg = HACHI.cineFg; c.A = A; c.D = D;
    c.quiet = 0; c.dark = 0; c.far = 0; c.walk = 0; c.ring = 0; c.arm = 0; c.grip = 0; c.giant = 0; c.pool = 0; c.wave = 0; c.flash = 0; c.tilt = 0;
    c.sil = []; for (let i = 0; i < 7; i++) c.sil.push({ x: rand(0.06, 0.94), d: rand(0.25, 0.6), ph: rand(0, 6) });   // distant silhouettes (screen x, depth)
    c.surround = [-170, -95, 95, 170];
    FX.darkTarget = 0; Sound.play('wind');
  }
  // --- 1: THE SOUND — quiet; the camera moves toward her; po… po… po…; she tilts her head ---
  if (f <= 70) { const k = easeInOut(f / 70); c.quiet = k; c.zoom = lerp(1.2, 1.7, k); c.camX = lerp((c.ax0 + D.x) / 2, A.x, k); c.camY = lerp(GROUND - 170, GROUND - 230, k); }
  if (f === 12 || f === 34 || f === 56) Sound.play('po', 1, 0.8 + f / 120);
  if (f === 12) FX.wtext(A.x - dir * 40, A.y - 290, 'po…', { size: 24, color: '#ffffff', stroke: HC2, life: 22, vy: -0.2 });
  if (f === 34) FX.wtext(A.x + dir * 20, A.y - 320, 'po…', { size: 24, color: '#ffffff', stroke: HC2, life: 22, vy: -0.2 });
  if (f === 56) FX.wtext(A.x + dir * 80, A.y - 350, 'po…', { size: 24, color: '#ffffff', stroke: HC2, life: 22, vy: -0.2 });
  if (f === 40) A.forcePose = 'tilt';
  // --- 2: THE DISAPPEARANCE — she is gone; the opponent looks around; distant figures in white ---
  if (f === 76) { A.hidden = true; c.wave = 1; Sound.play('hachiDistort'); for (let i = 0; i < 16; i++) FX.p({ type: 'smoke', x: A.x + rand(-26, 26), y: A.y - rand(20, 230), vx: rand(-0.5, 0.5), vy: -rand(0.3, 1.2), life: 30, size: rand(6, 11), grow: 0.25, color: 'rgba(235,240,255,0.3)', add: false }); }
  if (f > 76 && f < 140) { const k = easeInOut((f - 76) / 40); c.zoom = lerp(1.7, 1.0, k); c.camX = lerp(c.camX, D.x, 0.08); c.camY = lerp(c.camY, GROUND - 180, 0.08); }
  if (f >= 76 && f <= 120) c.dark = (f - 76) / 44 * 0.55;
  if (f >= 90 && f <= 150) c.far = Math.min(1, (f - 90) / 30);
  if (f >= 84 && f <= 136) { D.forcePose = 'stance'; if (f === 96 || f === 118) D.facing = -D.facing; if (f === 134) D.facing = c.df0; }
  // --- 3: THE ENCOUNTER — far away she walks toward them, much taller than everything; the world bends ---
  if (f >= 140 && f <= 210) { c.walk = (f - 140) / 70; c.far = Math.max(0, 1 - (f - 140) / 20); }
  if (f === 150 || f === 170 || f === 186 || f === 198) Sound.play('po', 1, 1 + (f - 150) / 40);
  if (f === 160 || f === 180 || f === 196) Sound.play('hachiStep');
  if (f >= 170) c.ring = Math.min(1, (f - 170) / 40);
  // --- 4: THE IMPOSSIBLE DISTANCE — she is right behind them, bending down; they turn around; apparitions surround them ---
  if (f === 212) {
    c.walk = 0; A.hidden = false; A.x = clamp(D.x - D.facing * 78, 60, STAGE_W - 60); A.facing = Math.sign(D.x - A.x) || 1; A.forcePose = 'bend'; A.hacEx = 'reveal';
    c.zoom = 1.45; c.camX = (A.x + D.x) / 2; c.camY = GROUND - 200; FX.flashScreen('#000000', 4, 0.8); Sound.play('hachiDistort'); Sound.play('po', 1, 1.5);
  }
  if (f === 226) { D.facing = Math.sign(A.x - D.x) || D.facing; D.forcePose = 'block'; c.surr = 0.01; }
  if (c.surr > 0 && c.surr < 1) c.surr = Math.min(1, c.surr + 0.07);
  if (f === 246) { c.tilt = 1; Sound.play('hachiStep'); }
  // --- 5: THE GRAB — the arm extends; she lifts them; her silhouette becomes enormous ---
  if (f === 262) { A.forcePose = 'reach'; Sound.play('hachiReach'); }
  if (f >= 262 && f <= 276) c.arm = (f - 262) / 14;
  if (f === 276) { c.grip = 1; D.forcePose = 'airhit'; BT.scriptHit(A, D, 40, { str: 3, sfx: 'grab' }); FX.shakeIt(10); FX.impactFrame(2); }
  if (f > 276 && f <= 320) { const k = easeInOut((f - 276) / 44); D.y = GROUND - 230 * k; A.forcePose = 'raise'; c.zoom = lerp(1.45, 0.8, k); c.camY = lerp(GROUND - 200, GROUND - 300, k); c.giant = k; c.dark = 0.55 + 0.25 * k; }
  if (f === 300) { Sound.play('rift'); FX.shakeIt(14); c.wave = 1; }
  // --- 6: THE VANISHING — pulled down into the darkness beneath her shadow; the sound stops ---
  if (f >= 320 && f <= 344) { const k = hacEaseIn((f - 320) / 24); D.y = lerp(GROUND - 230, GROUND, k); c.pool = Math.min(1, (f - 316) / 10); c.arm = 1 - k; }
  if (f === 344) {
    D.hidden = true; D.hachiHid = true; c.grip = 0; c.arm = 0; c.surr = 0; c.tilt = 0;
    BT.scriptHit(A, D, 180, { str: 4, sfx: 'grab' }); FX.impactFrame(5); FX.shakeIt(4); c.flash = 0.6; Sound.play('silence');
    FX.wtext(D.x, GROUND - 160, '八尺様', { size: 58, font: FX_JP(), color: '#ffffff', stroke: HCD, life: 60, vy: -0.2 });
  }
  if (f > 344 && f < 380) { c.giant = Math.max(0, c.giant - 0.06); c.pool = Math.max(0, c.pool - 0.03); c.zoom = lerp(c.zoom, 1.2, 0.06); c.camY = lerp(c.camY, GROUND - 180, 0.06); }
  if (f === 362) A.facing = -A.facing;   // she slowly turns away
  if (c.flash > 0) c.flash = Math.max(0, c.flash - 0.04);
  if (c.wave > 0) c.wave = Math.max(0, c.wave - 0.025);
  // --- 7: AFTERMATH — everything is normal again; she stands where she was; a last, quiet "po…" ---
  if (f === 380) { A.x = c.ax0; A.facing = c.af0; A.forcePose = 'stance'; A.hacEx = null; c.dark = 0; c.ring = 0; c.quiet = 0.5; c.camX = (A.x + D.x) / 2; }
  if (f === 408) A.forcePose = 'tilt';
  if (f === 414) { Sound.play('po', 1, 0.4); FX.wtext(A.x + dir * 20, A.y - 280, 'po…', { size: 18, color: '#ffffff', stroke: HC2, life: 40, vy: -0.2 }); }
  if (f === 426) { D.hidden = false; D.hachiHid = false; D.y = GROUND - 320; c.dvy = 0; D.forcePose = 'airhit'; }
  if (f > 426 && D.y < GROUND) { c.dvy += 1.2; D.y = Math.min(GROUND, D.y + c.dvy); if (D.y >= GROUND) { FX.dust(D.x, GROUND, 14); FX.shakeIt(8); Sound.play('slam'); } }
  if (f >= 452) { D.hidden = false; D.hachiHid = false; D.facing = c.df0; D.y = GROUND; c.quiet = 0; BT.release(D, dir * 2, -3); FX.darkTarget = 0; A.hacEx = null; return true; }
};
const hacEaseIn = t => { t = clamp(t, 0, 1); return t * t; };
HACHI.cineBg = (g, c) => {   // screen space, behind the fighters: darkness, distant figures, the walking giant, the enormous silhouette
  const cam = BT && BT.cam; if (!cam) return;
  if (c.dark > 0.01) {
    g.save(); g.globalAlpha = Math.min(0.85, c.dark);
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#050408'); gr.addColorStop(0.7, '#0e0c14'); gr.addColorStop(1, '#1a1822');
    g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
  }
  // distant, motionless silhouettes on the horizon (small = far)
  if (c.far > 0.01) {
    g.save();
    for (const s of c.sil) { const x = s.x * W, y = H * 0.66, sc = s.d * cam.z; g.globalAlpha = c.far * (0.5 + 0.3 * s.d); hacDrawGhost(g, x, y, s.x < 0.5 ? 1 : -1, 'tilt', 1, c.f + s.ph * 10, { scale: sc, pal: HAC_GHOST }); }
    g.restore();
  }
  // she walks toward them, much taller than her surroundings
  if (c.walk > 0.01 && c.D) {
    const D = c.D, start = D.x + D.facing * 760, wx = lerp(start, D.x + D.facing * 240, easeInOut(c.walk)), [sx, sy] = cam.toScreen(wx, GROUND - 20 * (1 - c.walk));
    const sc = lerp(0.9, 1.6, c.walk) * cam.z, ph = c.f * 0.12;
    const pose = { base: 'stance', hd: 0.3, fl1: 0.1 + 0.25 * Math.sin(ph), bl1: 0.1 - 0.25 * Math.sin(ph), fa1: 0.05, ba1: -0.05 };
    g.save(); g.globalAlpha = Math.min(1, c.walk * 3);
    drawFigure(g, HACHI, buildPose(HACHI, pose), sx + Math.sin(c.f * 0.9) * c.walk * 2, sy, -D.facing, { pal: { ...HACHI.colors, ex: null }, T: c.f, scale: sc });
    g.restore();
  }
  // the enormous silhouette behind her while she lifts them
  if (c.giant > 0.01 && c.A) {
    const [ax] = cam.toScreen(c.A.x, GROUND), sc = (2.2 + c.giant * 1.6) * cam.z, [, gy] = cam.toScreen(0, GROUND + 40);
    g.save(); g.globalAlpha = 0.5 * c.giant; drawFigure(g, HACHI, hacPose('raise'), ax - c.A.facing * 40 * cam.z, gy, c.A.facing, { mono: '#c8d0f0', scale: sc * 1.015 });
    g.globalAlpha = 0.9 * c.giant; drawFigure(g, HACHI, hacPose('raise'), ax - c.A.facing * 40 * cam.z, gy, c.A.facing, { mono: '#06040a', scale: sc });
    g.restore();
  }
  // the pool of darkness beneath her shadow
  if (c.pool > 0.01 && c.D) {
    const [px, py] = cam.toScreen(c.D.x, GROUND), z = cam.z;
    g.save(); g.fillStyle = '#020104'; g.globalAlpha = c.pool; g.beginPath(); g.ellipse(px, py, 150 * z * c.pool, 26 * z * c.pool, 0, 0, TAU); g.fill(); g.restore();
  }
};
HACHI.cineFg = (g, c) => {   // in front: surrounding apparitions, the stretched arm, distortion waves, silence vignette
  const cam = BT && BT.cam; if (!cam) return;
  const z = cam.z;
  if (c.surr > 0.01 && c.D) {   // apparitions all around them; they tilt their heads at the same time
    for (let i = 0; i < c.surround.length; i++) {
      const wx = c.D.x + c.surround[i], [sx, sy] = cam.toScreen(wx, GROUND);
      hacDrawGhost(g, sx, sy, Math.sign(c.D.x - wx) || 1, c.tilt ? 'tilt' : 'stance', c.surr * 0.8, c.f + i * 7, { scale: z });
    }
  }
  if (c.arm > 0.01 && c.A && c.D) {   // the unnaturally long arm, from her hand to them
    const h = c.A.handW('f'), [x0, y0] = cam.toScreen(h[0], h[1]), ch = c.D.chestW(), [x1, y1] = cam.toScreen(ch[0], ch[1] - 30), tx = lerp(x0, x1, c.arm), ty = lerp(y0, y1, c.arm);
    g.save(); g.lineCap = 'round'; g.strokeStyle = OUTLINE; g.lineWidth = 16 * z; g.beginPath(); g.moveTo(x0, y0); g.lineTo(tx, ty); g.stroke();
    g.strokeStyle = HACHI.colors.farm; g.lineWidth = 11 * z; g.beginPath(); g.moveTo(x0, y0); g.lineTo(lerp(x0, tx, 0.6), lerp(y0, ty, 0.6)); g.stroke();
    g.strokeStyle = HACHI.colors.skin; g.beginPath(); g.moveTo(lerp(x0, tx, 0.6), lerp(y0, ty, 0.6)); g.lineTo(tx, ty); g.stroke();
    g.fillStyle = HACHI.colors.hand; g.strokeStyle = OUTLINE; g.lineWidth = 2; g.beginPath(); g.ellipse(tx, ty, 14 * z, 12 * z, 0, 0, TAU); g.fill(); g.stroke();
    if (c.grip) for (let i = 0; i < 4; i++) { const a = -1.2 + i * 0.6; g.beginPath(); g.ellipse(tx + Math.cos(a) * 14 * z, ty + Math.sin(a) * 14 * z, 4 * z, 10 * z, a, 0, TAU); g.fill(); g.stroke(); }
    g.restore();
  }
  if (c.ring > 0.01 && FX.hq) {   // the environment distorts: slow horizontal ripples
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.07 * c.ring; g.fillStyle = '#d8e0ff';
    for (let i = 0; i < 10; i++) { const y = (i * 83 + c.f * 2.2) % H, off = Math.sin(c.f * 0.07 + i) * 30; g.fillRect(off, y, W, 3); }
    g.restore();
  }
  if (c.wave > 0.01) {
    const [sx, sy] = cam.toScreen(c.A ? c.A.x : W / 2, GROUND - 120), r = (1 - c.wave) * W * 0.9;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = c.wave * 0.6; g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.beginPath(); g.ellipse(sx, sy, r, r * 0.5, 0, 0, TAU); g.stroke(); g.restore();
  }
  if (c.flash > 0.01) { g.save(); g.globalAlpha = c.flash; g.fillStyle = '#000000'; g.fillRect(0, 0, W, H); g.restore(); }
  if (c.quiet > 0.01) { g.save(); const gr = g.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, W * 0.75); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${0.65 * Math.min(1, c.quiet)})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); }
};

// ---------------------------------- HUD + how-to ----------------------------------
function hacHatIcon(g, x, y, s, col) {
  g.save(); g.fillStyle = col; g.strokeStyle = OUTLINE; g.lineWidth = 1.2;
  g.beginPath(); g.ellipse(x, y + s * 0.2, s * 1.3, s * 0.32, 0, 0, TAU); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(x - s * 0.6, y + s * 0.15); g.quadraticCurveTo(x - s * 0.6, y - s * 0.75, x, y - s * 0.8); g.quadraticCurveTo(x + s * 0.6, y - s * 0.75, x + s * 0.6, y + s * 0.15); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#26222c'; g.fillRect(x - s * 0.6, y - s * 0.1, s * 1.2, s * 0.2);
  g.restore();
}
HACHI.drawHand = (g, F, side, t) => {
  const man = F.manT > 0, fade = F.fadeT > 0, mk = hacMarked(F, F.opp);
  xpPanel(g, F, side, t, {
    col: man ? '#ffffff' : HC, col2: '#ffffff', icon: '', flash: man,
    title: man ? 'FULL MANIFESTATION' : fade ? 'PRESENCE · FADING' : 'PRESENCE' + (mk ? ' · WATCHING' : ''),
    sub: man ? '顕現 · LONGER REACH · MORE ARMS · FOLLOW-UPS' : fade ? 'she is quiet… no gain' : '気配 · apparitions, shadows, distance, stop them',
    k: man ? F.manT / HAC_MAN : (F.pres || 0) / 100, label: man ? `${(F.manT / 60).toFixed(1)}s` : `${Math.floor(F.pres || 0)}`, marks: [0.6],
    badges: [['sp1', 'S1|PO PO'], ['sp1f', '↓→S1|REACH'], ['counter', '↓←S1|WHITE'], ['sp2', 'S2|DISTANCE'], ['sp2f', '↓→S2|SHADOW'], ['sp2d', '↓↓S2|WATCHER']],
  });
  const pw = 330, x0 = side > 0 ? 40 : W - 40 - pw, ix = side > 0 ? x0 + 33 : x0 + pw - 33, iy = 560 + 36;
  hacHatIcon(g, ix, iy, 11, man ? '#ffffff' : (F.pres || 0) >= 60 ? '#e8ecff' : 'rgba(255,255,255,0.6)');
};
HACHI.howTo = {
  title: 'HACHISHAKUSAMA',
  draw(g) {
    xpHowTo(g, 'HACHISHAKUSAMA — THE EIGHT-FOOT TALL WOMAN', HC, [
      ['PRESENCE', 'Grows when her apparitions and shadows hit (+4–6), while the opponent is kept at her distance or in a corner, when she stops their movement (+6), and while THE WATCHER mark is on them.'],
      ['MANIFESTATION', 'At 100: 8 s of Full Manifestation — Reach ~560 px, 5 shadow arms, Po… strikes twice, Distance gets a shadow-claw follow-up (SP2), faster apparitions. Then a short quiet with no gain.'],
      ['SP1', 'Po… Po… Po… — an apparition appears behind them and strikes. Block it, walk away, or hit it first.'],
      ['↓→ SP1', 'Unnatural Reach — slow raise, then her arm stretches ~400 px and pulls them in. Blockable.'],
      ['↓← SP1', 'The White Apparition — a silhouette at a chosen spot (hold → far, ← near) strikes after a pause.'],
      ['SP2', 'The Distance Disappears — vanishes; a flicker shows where she returns (behind them), then strikes.'],
      ['↓→ SP2', 'Shadow of the Eight Feet — shadow arms rise around them in sequence (dark pools warn first).'],
      ['↓↓ SP2', 'The Watcher — marks them for 6 s: tracking apparitions, extra arm, their movement feeds her Presence.'],
    ], 'Slow and tall: keep them at long range, let apparitions and shadows do the work. Up close she is weak. Ultimate (SP1+SP2): THE EIGHT-FOOT TALL NIGHTMARE.');
  },
};
// the teleport destination flicker (counterplay for THE DISTANCE DISAPPEARS)
EXTRA_PROJ.hachiFlicker = { update() {}, draw(g, p) {
  const a = (p.t % 4 < 2 ? 0.45 : 0.15) * Math.min(1, p.life / 6);
  g.save(); g.globalAlpha = a; drawFigure(g, HACHI, hacPose('tilt'), p.x, GROUND, p.face, { mono: '#ffffff' }); g.restore();
} };

CHARS.push(HACHI);
finalizeMoves(HACHI);
