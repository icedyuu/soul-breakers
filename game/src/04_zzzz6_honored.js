// ============================ KUON — THE HONORED ONE ============================
// Technical / space manipulation / rushdown. A relaxed, cocky prodigy in a high-collar black uniform with
// spiky white hair pushed up by a black blindfold. Original design on the chibi kit (inspired by a famous
// blindfolded sorcerer, not a copy).
// Systems: LIMITLESS gauge (spatial hits, Infinity stops, Blue×Red combinations) → FOCUSED (50) → UNVEILED (100, 7 s,
//          blindfold off) · Blue pull orbs · Infinity (timed barrier, grabs/unblockables/ults beat it) · Spatial Step ·
//          Red repulsion · Hollow Purple (needs 30 Limitless) · Domain Expansion: Unlimited Void.
const HON_UNV_T = 420;
const HB = '#5ad8ff', HB2 = '#2a7cff', HRED = '#ff3a4a', HPUR = '#b25cff', HICE = '#cff6ff', HNAVY = '#0a1024';

// ---------------------------------- art ----------------------------------
function honFace(g, r, c, o) {
  const e = o.expr || 'normal', T = o.T || 0;
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  if (c.bare) {
    const ex = 0.5 * r, ey = 0.25 * r, fx = 0.94 * r;
    if (c.shock || e === 'ko') {   // genuinely surprised: wide white eyes, tiny pupils
      for (const [x, w, h] of [[fx, 0.08, 0.3], [ex, 0.24, 0.37]]) {
        g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x, ey, w * r, h * r, 0, 0, TAU); g.fill();
        g.fillStyle = c.eye; g.beginPath(); g.arc(x + w * r * 0.1, ey + 0.02 * r, w * r * 0.4, 0, TAU); g.fill();
        g.fillStyle = '#06101e'; g.beginPath(); g.arc(x + w * r * 0.1, ey + 0.02 * r, w * r * 0.18, 0, TAU); g.fill();
        g.strokeStyle = '#e8eefa'; g.lineWidth = Math.max(1.6, h * r * 0.2); g.beginPath(); g.moveTo(x - w * r * 1.1, ey - h * r * 0.7); g.quadraticCurveTo(x, ey - h * r * 1.35, x + w * r * 1.1, ey - h * r * 0.75); g.stroke();
      }
      g.strokeStyle = c.brow; g.lineWidth = 0.05 * r; g.beginPath(); g.moveTo(ex - 0.22 * r, ey - 0.62 * r); g.quadraticCurveTo(ex, ey - 0.74 * r, ex + 0.24 * r, ey - 0.64 * r); g.stroke();
      g.fillStyle = '#4a1020'; g.strokeStyle = OUTLINE; g.lineWidth = 0.04 * r; g.beginPath(); g.ellipse(0.72 * r, 0.74 * r, 0.05 * r, 0.065 * r, 0, 0, TAU); g.fill(); g.stroke();
      g.restore(); return;
    }
    if (e === 'hurt') { g.restore(); chibiFace(g, r, c, o); return; }
    for (const [x, w, h, far] of [[fx, 0.075, 0.3, true], [ex, 0.23, 0.36, false]]) {
      chibiEye(g, x, ey - (far ? 0.01 * r : 0), w * r, h * r, c, { glow: c.unv || o.glow }, far);
      // white lashes — his signature
      g.strokeStyle = '#f4f8ff'; g.lineWidth = Math.max(1.4, h * r * 0.16); g.beginPath(); g.moveTo(x - w * r * 1.1, ey - h * r * 0.64); g.quadraticCurveTo(x, ey - h * r * 1.3, x + w * r * 1.06, ey - h * r * 0.72); g.stroke();
      if (!far) { g.lineWidth = Math.max(1, h * r * 0.1); g.beginPath(); g.moveTo(x + w * r * 0.9, ey - h * r * 0.8); g.lineTo(x + w * r * 1.5, ey - h * r * 1.05); g.stroke(); }
    }
    if (c.unv) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.55 + 0.2 * Math.sin(T * 0.2); const gr = g.createRadialGradient(ex, ey, 0, ex, ey, 0.55 * r); gr.addColorStop(0, 'rgba(170,240,255,0.85)'); gr.addColorStop(1, 'rgba(40,140,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(ex, ey, 0.55 * r, 0, TAU); g.fill(); g.restore(); }
    g.strokeStyle = c.brow; g.lineWidth = 0.045 * r; g.beginPath(); g.moveTo(ex - 0.22 * r, ey - 0.52 * r); g.quadraticCurveTo(ex, ey - 0.6 * r, ex + 0.24 * r, ey - 0.5 * r); g.stroke();
  }
  // mouth: always a little too pleased with himself
  const mx = 0.72 * r, my = 0.73 * r; g.strokeStyle = OUTLINE; g.lineWidth = 0.045 * r;
  if (e === 'hurt' || e === 'ko') { g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(mx - 0.09 * r, my - 0.03 * r); g.lineTo(mx + 0.09 * r, my - 0.05 * r); g.lineTo(mx + 0.08 * r, my + 0.04 * r); g.lineTo(mx - 0.08 * r, my + 0.05 * r); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(mx - 0.08 * r, my); g.lineTo(mx + 0.08 * r, my - 0.01 * r); g.stroke(); }
  else if (e === 'shout' || e === 'grin') {   // a wide confident grin with teeth
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(mx - 0.12 * r, my - 0.04 * r); g.quadraticCurveTo(mx, my - 0.06 * r, mx + 0.12 * r, my - 0.07 * r); g.quadraticCurveTo(mx + 0.06 * r, my + 0.1 * r, mx - 0.12 * r, my - 0.04 * r); g.closePath(); g.fill(); g.stroke();
  } else { g.beginPath(); g.moveTo(mx - 0.08 * r, my - 0.01 * r); g.quadraticCurveTo(mx + 0.01 * r, my + 0.05 * r, mx + 0.09 * r, my - 0.05 * r); g.stroke(); }   // smirk
  g.restore();
}
function honBlindfold(g, r, c, R) {
  const pts = [[-1.02, -0.3], [-0.3, -0.4], [0.5, -0.38], [0.97, -0.28], [1.02, 0.08], [0.95, 0.42], [0.4, 0.44], [-0.4, 0.4], [-1.0, 0.3]];
  polyR(g, r, pts, c.band, R);
  if (R.mono) return;
  g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 0.05 * r; g.beginPath(); g.moveTo(-0.6 * r, -0.2 * r); g.quadraticCurveTo(0.3 * r, -0.26 * r, 0.9 * r, -0.14 * r); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.moveTo(-0.6 * r, 0.32 * r); g.quadraticCurveTo(0.2 * r, 0.4 * r, 0.86 * r, 0.36 * r); g.stroke();
  circ(g, -0.98 * r, 0.06 * r, 0.12 * r, c.band, R);   // the knot
}
function honHandGlow(g, sk, p, c, R) {
  if (R.mono) return;
  const t = BT ? BT.pf : 0;
  const orb = (P, k, c0, c1) => {
    if (!(k > 0.25)) return; const [hx, hy] = P;
    g.save(); g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(hx, hy, 0, hx, hy, 17 * k); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.4, c0); gr.addColorStop(1, c1);
    g.fillStyle = gr; g.beginPath(); g.arc(hx, hy, 17 * k, 0, TAU); g.fill();
    g.strokeStyle = c0; g.lineWidth = 1.4; g.globalAlpha = 0.7; g.beginPath(); g.ellipse(hx, hy, 22 * k, 8 * k, t * 0.2, 0, TAU); g.stroke();
    g.restore();
  };
  orb(sk.fh, p.pw, HB, 'rgba(40,100,255,0)');
  orb(sk.fh, p.ph, HRED, 'rgba(255,40,60,0)');
  orb(sk.bh, p.kp, HB, 'rgba(40,100,255,0)');
}

// ---------------------------------- character ----------------------------------
const HONORED = {
  id: 'honored', name: 'KUON', jp: 'クオン', title: 'The Honored One', titleJp: '天上の者',
  style: 'SPACE / RUSHDOWN', desc: 'The strongest, and he knows it. Pulls you in with Blue, stops your attacks with Infinity, blinks behind you and ends it with Red or Hollow Purple.',
  stats: { power: 4, speed: 4, range: 4, defense: 2 },
  scale: 1.0, health: 980, walk: 4.6, backWalk: 4.1, jumpV: -17, jumpX: 4.6, dashV: 12, backdashV: 11, backdashInv: 12, juggleMax: 6,
  voicePitch: 0.95, voiceRate: 1.08,
  colors: {
    skin: '#fbe7dc', hair: '#eef2fb', hair2: '#c3cce4', top: '#1a2038', leg: '#161a2e', boot: '#0e1120', foot: '#0e1120', uarm: '#1a2038', farm: '#1a2038', hand: '#fbe7dc', cuff: '#2a3150', belt: '#2a3150',
    eye: '#7fe8ff', eye2: '#0a3a6a', accent: HB, brow: '#dfe6f6', band: '#0b0c14', warm: '#1a2036', sole: '#2a3150', pad: HB2, collar: '#1a2038', male: true,
    bare: false, unv: false, shock: false,
  },
  afterColors: [HB, HPUR, HB2],
  stance: { t: -0.07, hd: -0.06, fa1: 0.12, fa2: 0.55, ba1: -0.22, ba2: 0.35, fl1: 0.12, fl2: 0.03, bl1: -0.12, bl2: -0.03 },
  poses: {
    adjust: { t: -0.08, hd: 0.06, fa1: 2.3, fa2: 3.75, ba1: -0.22, ba2: 0.35 },
    smile: { t: -0.12, hd: -0.18, fa1: 0.12, fa2: 0.55, ba1: -0.22, ba2: 0.35 },
    blue_w: { t: -0.08, hd: -0.04, fa1: 1.0, fa2: 2.4, ba1: -0.3, ba2: 0.3, pw: 1 },
    blue: { t: 0.04, hd: 0.02, fa1: 1.6, fa2: 1.75, ba1: -0.3, ba2: 0.3, fl1: 0.2, fl2: 0.04, bl1: -0.18, bl2: -0.05, pw: 1 },
    bluemax_w: { t: -0.14, hd: -0.2, fa1: 2.4, fa2: 2.9, ba1: -0.35, ba2: 0.3, pw: 1 },
    bluemax: { t: 0.06, hd: 0.0, fa1: 1.8, fa2: 2.2, ba1: -0.35, ba2: 0.3, fl1: 0.22, fl2: 0.05, bl1: -0.2, bl2: -0.05, pw: 1 },
    infinity: { t: -0.1, hd: -0.08, fa1: 1.25, fa2: 2.5, ba1: -0.22, ba2: 0.35, pw: 0.6 },
    step: { t: 0.18, hd: 0.1, fa1: 0.5, fa2: 1.2, ba1: -0.5, ba2: 0.2, fl1: 0.35, fl2: 0.1, bl1: -0.3, bl2: -0.1 },
    red_w: { t: -0.14, hd: -0.05, fa1: -0.2, fa2: 1.3, ba1: 0.5, ba2: 1.2, fl1: 0.1, fl2: 0.02, bl1: -0.25, bl2: -0.08, ph: 1 },
    red: { t: 0.16, hd: 0.06, fa1: 1.6, fa2: 1.55, ba1: -0.6, ba2: -0.3, fl1: 0.45, fl2: 0.12, bl1: -0.4, bl2: -0.15, ph: 1 },
    purple_w: { t: -0.05, hd: -0.05, fa1: 1.0, fa2: 1.9, ba1: 0.9, ba2: 1.7, fl1: 0.15, fl2: 0.03, bl1: -0.2, bl2: -0.05, ph: 1, kp: 1 },
    purple: { t: 0.14, hd: 0.04, fa1: 1.55, fa2: 1.6, ba1: 1.3, ba2: 1.5, fl1: 0.45, fl2: 0.12, bl1: -0.4, bl2: -0.15, ph: 1, kp: 1 },
    domain_w: { t: -0.06, hd: -0.02, fa1: 1.2, fa2: 2.6, ba1: -0.22, ba2: 0.35 },
    domain: { t: -0.04, hd: 0.04, fa1: 1.55, fa2: 3.0, ba1: -0.22, ba2: 0.35, pw: 0.5 },
    touch: { t: 0.08, hd: 0.0, fa1: 1.45, fa2: 1.7, ba1: -0.22, ba2: 0.35, pw: 1 },
    victory: { t: -0.1, hd: 0.12, fa1: 2.3, fa2: 3.75, ba1: -0.25, ba2: 0.35, fl1: 0.12, fl2: 0.03, bl1: -0.06, bl2: -0.02 },
    defeat: { t: 0.3, hd: -0.12, fa1: 0.3, fa2: 0.5, ba1: 0.35, ba2: 0.15, fl1: 1.35, fl2: 0.0, bl1: 0.25, bl2: -1.45 },
    intro: { t: -0.08, hd: 0.06, fa1: 2.3, fa2: 3.75, ba1: -0.22, ba2: 0.35 },
  },
  intro: 'Don\'t worry. I\'ll go easy on you… maybe.',
  wins: ['Throughout heaven and earth, I alone am the honored one.', 'Was that it? I barely moved.', 'You never even touched me. That\'s Infinity.'],
  ropes: [
    { id: 'tail1', at: (sk, r) => headPt(sk, -r * 1.02, r * 0.04), n: 5, seg: 7, w0: 4.6, w1: 3.2, color: 'band', grav: 0.25, wind: 0.75, fork: true },
    { id: 'tail2', at: (sk, r) => headPt(sk, -r * 1.0, r * 0.16), n: 4, seg: 7, w0: 4, w1: 2.8, color: 'band', grav: 0.32, wind: 0.6, fork: true },
  ],
  hairBack(g, r, c, R, o) {
    const T = (o && o.T) || 0, sw = i => Math.sin(T * 0.1 + i) * 0.03 * r;
    if (c.bare) polyR(g, r, [[0.62, -0.92], [0.0, -1.28], [-0.82, -1.1], [-1.26, -0.5], [-1.3, 0.3], [-1.0, 0.8], [-0.62, 0.52], [-0.3, 0.1]], c.hair, R, sw);
    else polyR(g, r, [[0.75, -0.6], [1.08, -1.3], [0.48, -1.04], [0.34, -1.8], [-0.1, -1.16], [-0.58, -1.72], [-0.68, -0.98], [-1.3, -1.26], [-1.08, -0.56], [-1.5, -0.38], [-1.1, -0.04], [-1.3, 0.34], [-0.7, 0.2], [-0.4, 0.1]], c.hair, R, sw);
    if (R.mono) return;
    g.strokeStyle = c.hair2; g.lineWidth = 0.06 * r; g.lineCap = 'round';
    if (!c.bare) for (const [x0, y0, x1, y1] of [[-0.2, -0.9, -0.5, -1.5], [0.2, -0.9, 0.3, -1.5], [-0.7, -0.6, -1.1, -1.0]]) { g.beginPath(); g.moveTo(x0 * r, y0 * r); g.lineTo(x1 * r, y1 * r); g.stroke(); }
  },
  hairFront(g, r, c, R) {
    if (c.bare) {   // without the blindfold the white hair falls over his forehead
      skullHair(g, r, c, R);
      polyR(g, r, [[-0.36, -0.98], [0.36, -1.06], [1.02, -0.7], [1.16, -0.06], [0.98, -0.26], [0.95, 0.0], [0.76, -0.26], [0.58, -0.04], [0.4, -0.34], [0.2, -0.08], [0.08, -0.5]], c.hair, R);
      polyR(g, r, [[-0.1, -0.3], [0.04, 0.4], [-0.08, 0.9], [-0.28, 0.6], [-0.44, 0.2]], c.hair, R);
      shine(g, r, [[-0.2, -0.88], [0.42, -0.9]], R);
      return;
    }
    // blindfold on: hair pushed up into a tall spiky crest
    polyR(g, r, [[-1.06, -0.3], [-0.84, -0.86], [-0.2, -1.08], [0.5, -0.98], [1.0, -0.3]], c.hair, R);
    polyR(g, r, [[-0.66, -0.22], [-0.48, -0.86], [-0.12, -0.98], [0.06, -1.48], [0.3, -0.98], [0.66, -1.3], [0.68, -0.8], [1.14, -0.88], [0.98, -0.24]], c.hair, R);
    honBlindfold(g, r, c, R);
    if (R.mono) return;
    shine(g, r, [[-0.1, -0.86], [0.42, -0.84]], R);
    g.strokeStyle = c.hair2; g.lineWidth = 0.05 * r; g.beginPath(); g.moveTo(0.3 * r, -0.4 * r); g.lineTo(0.5 * r, -0.95 * r); g.moveTo(0.7 * r, -0.36 * r); g.lineTo(0.9 * r, -0.72 * r); g.stroke();
  },
  neckWear(g, sk, p, c, R) {   // the tall uniform collar, up to his chin
    const n = sk.neck;
    poly(g, [[n[0] - 13, n[1] + 10], [n[0] - 12, n[1] - 9], [n[0] + 11, n[1] - 12], [n[0] + 14, n[1] + 8]], c.collar, R, 3);
    if (R.mono) return;
    g.strokeStyle = '#2a3150'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(n[0] - 11, n[1] - 7); g.lineTo(n[0] + 11, n[1] - 10); g.stroke();
    g.fillStyle = '#d8dcea'; g.beginPath(); g.arc(n[0] + 11, n[1] - 1, 1.8, 0, TAU); g.fill();
  },
  torsoDetail(g, L, bw, c) {   // high-collar tunic: centre seam with buttons, a pale icy trim
    g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(-12 * bw, -L + 5, 6 * bw, L * 0.7);
    g.strokeStyle = '#2a3150'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(8 * bw, -L + 2); g.lineTo(9 * bw, -4); g.stroke();
    g.fillStyle = '#d8dcea'; for (const y of [0.78, 0.56, 0.34]) { g.beginPath(); g.arc(10.5 * bw, -L * y, 1.6, 0, TAU); g.fill(); }
    g.fillStyle = HB; g.globalAlpha = 0.6; g.fillRect(-13 * bw, -L * 0.18, 26 * bw, 1.6); g.globalAlpha = 1;
  },
  torsoOver(g, L, bw, c, R) { if (!R.mono) { g.fillStyle = c.belt; g.fillRect(-13 * bw, -6, 26 * bw, 5); } },
  drawSkirt(g, sk, p, c, R, o) {   // short tunic tails over wide trousers
    chibiShorts(g, sk, c, R, c.leg, 0.45, 3);
    const T = (o && o.T) || 0, fl = Math.sin(T * 0.07) * 2;
    const hb = [sk.hip[0] - 15, sk.hip[1] - 8], hf = [sk.hip[0] + 14, sk.hip[1] - 8];
    poly(g, [hb, [hb[0] - 6 + fl, hb[1] + 24], [hb[0] + 10, hb[1] + 26], [hf[0] - 6, hf[1] + 18], hf], R.mono || c.top, R, 3);
    if (!R.mono) { g.strokeStyle = '#2a3150'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(hb[0] + 10, hb[1] + 4); g.lineTo(hb[0] + 10, hb[1] + 25); g.stroke(); }
  },
  weaponFront(g, sk, p, c, R) { honHandGlow(g, sk, p, c, R); },
};
makeChibi(HONORED, { build: { arm: 1.0, leg: 1.04, torso: 1.04 }, colors: {} });
HONORED.faceFn = honFace;
HONORED.drawBoot = (g, K, F, c, R, back, b) => {   // the kit's platform boots in black with icy pads
  chunkyBoot(g, K, F, c, R, back, b);
};

// ---------------------------------- limitless ----------------------------------
const HON_PAL = {};
const honLvl = F => F.unvT > 0 ? 2 : (F.lim || 0) >= 50 ? 1 : 0;
HONORED.palette = F => {
  const st = F.state, cineBare = F.cineBare, unv = F.unvT > 0, shock = st === 'defeat' || (F.ko && st === 'knockdown');
  const bare = unv || shock || !!cineBare, key = (bare ? 1 : 0) + (unv ? 2 : 0) + (shock ? 4 : 0);
  return HON_PAL[key] || (HON_PAL[key] = { ...HONORED.colors, bare, unv, shock, band: bare ? HONORED.colors.hair : HONORED.colors.band, accent: unv ? '#9ff4ff' : HB });
};
function honGain(F, n) {
  if (F.ko || F.unvT > 0) return;
  F.lim = clamp((F.lim || 0) + n, 0, 100); if (n > 0) F.limT = F.T;
}
function honUnveil(F) {
  F.unvT = HON_UNV_T; F.lim = 100;
  FX.ring(F.x, F.y - 110, HB, 20, 340, 26, 6); FX.ring(F.x, F.y - 110, HICE, 10, 160, 18, 3); FX.flashScreen('#bff2ff', 12, 0.45);
  FX.wtext(F.x, F.y - 255, 'UNVEILED', { size: 40, color: '#ffffff', stroke: '#0a3a7a', life: 64 });
  FX.wtext(F.x, F.y - 215, '— 天眼解放 —', { size: 22, font: FX_JP(), color: HICE, stroke: HNAVY, life: 64 });
  Sound.play('chime'); Sound.play('charge');
}
function honTech(A, D, kind) {   // Blue and Red landing close together = a spatial combination
  const other = kind === 'blue' ? A.redHitT : A.blueHitT;
  if (A.T - (other ?? -999) < 150 && A.T - (A.comboBonusT ?? -999) > 60) {
    A.comboBonusT = A.T; honGain(A, 10);
    FX.wtext(D.x, D.y - 250, 'ATTRACT × REPEL', { size: 22, color: '#f0d8ff', stroke: '#4a1a8a', life: 40 });
  }
  if (kind === 'blue') A.blueHitT = A.T; else A.redHitT = A.T;
}
HONORED.initFighter = F => { F.lim = 0; F.limT = -999; F.unvT = 0; F.blueHitT = -999; F.redHitT = -999; F.comboBonusT = -999; F.infHeld = []; F.cineBare = false; F.stepFx = null; };
HONORED.onDealDamage = (A) => { if (!A.ko && A.state !== 'cine') honGain(A, 2); };
HONORED.idlePose = F => { const k = F.T % 420; return k > 300 && k < 350 ? 'adjust' : k > 360 && k < 400 ? 'smile' : null; };
const honBlocked = D => D.state === 'grabbed' || D.state === 'cine' || D.state === 'knockdown' || D.hidden || D.ko;
function honPull(p, D, str, guardStr) {   // attraction: drag the opponent toward the orb's centre
  if (honBlocked(D) || D.invuln > 0) return;
  const dx = p.x - D.x; if (Math.abs(dx) > p.pr || Math.abs(dx) < 6) return;
  const s = D.isGuarding() ? guardStr : str; if (s <= 0) return;
  D.x = clamp(D.x + Math.sign(dx) * Math.min(Math.abs(dx) - 4, s), 50, STAGE_W - 50);
  if (!D.onGround && D.state === 'hit') D.vy = Math.min(D.vy, 1.2);
}
HONORED.tick = F => {
  const O = F.opp; if (!O) return;
  const live = BT && BT.phase === 'fight' && !F.ko;
  if (F.hidden && F.state !== 'cine' && !(F.state === 'attack' && F.moveKey === 'sp1f')) F.hidden = false;
  if (F.state !== 'cine') F.cineBare = false;
  if (F.unvT > 0) {
    F.unvT--; F.lim = 100 * F.unvT / HON_UNV_T;
    if (F.T % 4 === 0) FX.p({ type: 'spark', x: F.x + rand(-36, 36), y: F.y - rand(10, 190), vx: 0, vy: -rand(0.4, 1.2), life: 28, size: rand(1.5, 2.8), color: pick([HB, HICE, HPUR]) });
    if (F.unvT === 0) { F.lim = 0; FX.ring(F.x, F.y - 110, HB, 10, 120, 14, 3); }
  } else if (live) {
    if (F.T - F.limT > 240 && F.lim > 0 && F.state !== 'cine') F.lim = Math.max(0, F.lim - 0.1);
    if (F.lim >= 100) honUnveil(F);
  }
  // effortless movement: faint spatial ripples where he walks
  if (F.state === 'walk' && F.T % 9 === 0) FX.ring(F.x, GROUND - 2, 'rgba(90,216,255,0.5)', 6, 40, 12, 2, 0.25);
  if (F.state === 'idle' && F.T % 34 === 0) FX.p({ type: 'spark', x: F.x + rand(-40, 40), y: F.y - rand(40, 190), vx: 0, vy: -0.3, life: 36, size: 1.6, color: HICE });
  // INFINITY: enemy projectiles near him slow down and stop in mid-air
  const inf = F.state === 'attack' && F.moveKey === 'counter' && F.counterActive;
  if (inf && BT) {
    for (const p of BT.projs) {
      if (p.owner !== O || p.dead || p.infHeld || Math.abs(p.vx) < 1) continue;
      if (Math.abs(p.x - F.x) < 280 && Math.abs(p.y - (F.y - 100)) < 200 && Math.sign(F.x - p.x) === Math.sign(p.vx)) { p.infSlow = 1; }
    }
  }
  if (BT) for (const p of BT.projs) if (p.infSlow && !p.dead) {
    if (!p.infHeld) { p.vx *= 0.78; p.vy *= 0.78; if (Math.abs(p.vx) < 0.6) { p.infHeld = 1; p.hx = p.x; p.hy = p.y; F.infHeld.push(p); } }
    else { p.vx = p.vy = 0; p.x = p.hx; p.y = p.hy; p.life = Math.max(p.life, 3); p.hitT = Math.max(p.hitT, 2); }
    if (!inf && !p.infHeld) { p.infSlow = 0; }
  }
  if (!inf && F.infHeld.length) {
    for (const p of F.infHeld) if (!p.dead) { p.dead = true; FX.burst(p.x, p.y, HB, 12, 6); FX.ring(p.x, p.y, HB, 6, 50, 10, 3); honGain(F, 6); }
    F.infHeld = []; Sound.play('psi');
  }
  // a stopped attacker hangs in the air for a moment
  if (O.infFreezeT > 0) { O.infFreezeT--; if (O.state === 'hit') O.vx *= 0.5; else O.infFreezeT = 0; }
};
HONORED.drawExtra = (g, F) => {
  const O = F.opp, T = F.T;
  if (F.state === 'attack' && F.moveKey === 'counter' && F.counterActive) {   // Infinity: a faint lens of distorted space
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { g.globalAlpha = 0.22 - i * 0.05; g.strokeStyle = i ? HB2 : HB; g.lineWidth = 2; g.beginPath(); g.ellipse(F.x + F.facing * (20 + i * 10), F.y - 100, 70 + i * 16 + Math.sin(T * 0.3 + i) * 4, 120 + i * 14, 0, 0, TAU); g.stroke(); }
    g.restore();
  }
  for (const p of F.infHeld || []) if (!p.dead) {   // a held projectile, trembling against nothing
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5 + 0.3 * Math.sin(T * 0.8); g.strokeStyle = HB; g.lineWidth = 2;
    g.beginPath(); g.arc(p.x, p.y, 30 + Math.sin(T * 0.5) * 4, 0, TAU); g.stroke(); g.restore();
  }
  if (O && O.infFreezeT > 0) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, O.infFreezeT / 10) * 0.6; g.strokeStyle = HB; g.lineWidth = 2;
    for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(O.x, O.y - 100, 50 + i * 12 + (T % 10), 90 + i * 12, 0, 0, TAU); g.stroke(); }
    g.font = `900 28px ${FONT_T}`; g.textAlign = 'center'; g.fillStyle = HICE; g.fillText('∞', O.x, O.y - 200); g.restore();
  }
  if (F.stepFx) {   // Spatial Step: the fold in space between both points
    const s = F.stepFx, k = s.t / 14; s.t--; if (s.t <= 0) F.stepFx = null;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = k * 0.8; g.strokeStyle = HB; g.lineWidth = 3 * k;
    g.beginPath(); g.moveTo(s.x0, s.y - 100); g.lineTo(s.x1, s.y - 100); g.stroke();
    for (const x of [s.x0, s.x1]) { g.beginPath(); g.ellipse(x, s.y - 100, 20 + (1 - k) * 40, 90 * k + 10, 0, 0, TAU); g.stroke(); }
    g.restore();
  }
};
HONORED.introFx = F => {
  FX.ring(F.x, F.y - 110, HB, 10, 240, 30, 3);
  for (let i = 0; i < 16; i++) FX.p({ type: 'spark', x: F.x + rand(-70, 70), y: F.y - rand(20, 220), vx: 0, vy: -rand(0.2, 0.8), life: 60, size: rand(1.5, 2.5), color: pick([HB, HICE]) });
  Sound.play('chime');
};

// ---------------------------------- effects / projectiles ----------------------------------
function honOrb(g, x, y, R, t, inner, outer, core = '#ffffff') {   // a glowing spatial sphere with orbiting distortion
  g.save(); g.globalCompositeOperation = 'lighter';
  const gl = g.createRadialGradient(x, y, R * 0.2, x, y, R * 1.9); gl.addColorStop(0, outer); gl.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalAlpha = 0.55; g.fillStyle = gl; g.beginPath(); g.arc(x, y, R * 1.9, 0, TAU); g.fill();
  g.globalAlpha = 1; const gr = g.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, core); gr.addColorStop(0.45, inner); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill();
  g.strokeStyle = inner; g.lineWidth = 1.6; g.globalAlpha = 0.75;
  for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(x, y, R * 1.25, R * 0.42, t * (0.12 + i * 0.05) + i * 1.05, 0, TAU); g.stroke(); }
  g.restore();
}
function honSuck(p, R, col, n = 1) {   // particles falling inward
  for (let i = 0; i < n; i++) { const a = rand(0, TAU), d = R * rand(0.9, 1.5); FX.p({ type: 'spark', x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d * 0.7, vx: -Math.cos(a) * d / 14, vy: -Math.sin(a) * d * 0.7 / 14, life: 14, size: rand(1.4, 2.6), color: col }); }
}
EXTRA_PROJ.blueOrb = {
  delay(p) { if (p.t % 2 === 0) honSuck(p, 50 * p.sz, HB); },
  update(p) {
    const D = p.owner.opp; if (D) honPull(p, D, p.pull, p.gpull || 0);
    honSuck(p, p.pr * 0.6, pick([HB, HICE, HB2]), p.big ? 3 : 1);
    if (p.t % 12 === 0) FX.ring(p.x, p.y, 'rgba(90,216,255,0.6)', p.pr * 0.8, 10, 12, 2);
    if (p.big && p.t % 4 === 0) { const x = p.x + rand(-p.pr, p.pr); FX.p({ type: 'smoke', x, y: GROUND - rand(0, 10), vx: Math.sign(p.x - x) * 3, vy: -0.4, life: 16, size: 9, grow: 0.3, color: 'rgba(160,200,255,0.35)', add: false }); }   // dust dragged across the ground
  },
  draw(g, p) {
    const k = p.delay > 0 ? 1 - p.delay / (p.delay0 || 1) : Math.min(1, p.life / 8);
    honOrb(g, p.x, p.y, 30 * p.sz * (0.4 + 0.6 * k) + Math.sin(p.t * 0.5) * 2, p.t, HB, 'rgba(40,110,255,0.6)');
    if (p.delay <= 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.2; g.strokeStyle = HB; g.lineWidth = 2; g.setLineDash([6, 8]); g.beginPath(); g.ellipse(p.x, p.y, p.pr, p.pr * 0.55, 0, 0, TAU); g.stroke(); g.restore(); }
  },
};
EXTRA_PROJ.redOrb = {
  update(p) {
    FX.p({ type: 'ember', x: p.x - p.vx * 1.5, y: p.y + rand(-10, 10), vx: -p.vx * 0.15, vy: rand(-0.6, 0.6), life: 14, size: rand(2, 4), color: pick([HRED, '#ff9a8a', '#ffffff']), add: true });
    if (p.t % 4 === 0) FX.ring(p.x - p.vx * 2, p.y, 'rgba(255,60,80,0.6)', 10, 40 * p.sz, 8, 3);
  },
  draw(g, p) { honOrb(g, p.x, p.y, 26 * p.sz + Math.sin(p.t * 0.7) * 2, p.t, HRED, 'rgba(255,40,60,0.6)', '#fff0f0'); },
};
EXTRA_PROJ.hollowPurple = {
  update(p) {
    for (let i = 0; i < 2; i++) FX.p({ type: i ? 'spark' : 'ember', x: p.x - Math.sign(p.vx) * rand(40, 80), y: p.y + rand(-60, 60), vx: -p.vx * 0.3, vy: rand(-1, 1), life: 20, size: rand(2, 4), color: pick([HPUR, '#e8c8ff', HB, HRED]), add: true });
    if (p.t % 3 === 0) FX.p({ type: 'smoke', x: p.x - Math.sign(p.vx) * 70, y: GROUND - rand(0, 20), vx: 0, vy: -0.6, life: 26, size: rand(10, 16), grow: 0.5, color: 'rgba(40,10,60,0.45)', add: false });
    if (p.t % 6 === 0) FX.shakeIt(3);
  },
  draw(g, p) {
    const R = 62 + Math.sin(p.t * 0.4) * 4;
    // scar torn into the ground behind it
    g.save(); g.globalAlpha = 0.5; g.fillStyle = '#12061e'; const d = Math.sign(p.vx) || 1, len = Math.min(400, p.t * Math.abs(p.vx)); g.fillRect(d > 0 ? p.x - len : p.x, GROUND - 4, len, 8); g.restore();
    honOrb(g, p.x, p.y, R, p.t, HPUR, 'rgba(150,60,255,0.7)', '#fbefff');
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; g.strokeStyle = '#e8c8ff'; g.lineWidth = 3;
    for (let i = 0; i < 6; i++) { const a = p.t * 0.25 + i * TAU / 6; g.beginPath(); g.arc(p.x, p.y, R * (1.1 + 0.1 * Math.sin(p.t * 0.3 + i)), a, a + 0.6); g.stroke(); }
    g.restore();
  },
};
EXTRA_PROJ.domainWave = {   // the ult's opening: space folding outward from his hand
  update() {},
  draw(g, p) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, p.life / 6) * 0.6; g.strokeStyle = HB; g.lineWidth = 4; g.beginPath(); g.ellipse(p.x, p.y, 40 + p.t * 30, 30 + p.t * 14, 0, 0, TAU); g.stroke(); g.restore(); },
};

// ---------------------------------- moves ----------------------------------
HONORED.moves = Object.assign(baseNormals({ dmg: 1.0, spd: 0, rng: 1.05 }), {
  sp1: {
    name: 'BLUE: ATTRACTION', jp: '術式順転・蒼', desc: 'He flicks a hand and space collapses into a small blue point ~220 px ahead (hold back: right in front of him). It drags the opponent toward it and hits twice. Not while they block. Focused (50+): wider pull. Unveiled: 3 hits.', special: 1, lvl: 4,
    poses: ['blue_w', 'blue'], st: 9, act: 1, rec: 20, cd: 48, sfx: 'psi',
    spawn: { f: 9, fn(F) {
      const lv = honLvl(F), d = F.input.fwd < 0 ? 120 : 220;
      BT.spawn({ owner: F, kind: 'blueOrb', x: F.x + F.facing * d, y: F.y - 105, vx: F.facing * 0.001, w: 74, h: 74, delay: 6, delay0: 6, life: 30, hits: lv >= 2 ? 3 : 2, interval: 11, persist: 1, sz: 1, pr: lv ? 200 : 160, pull: lv ? 3 : 2.4, gpull: 0,
        dmg: 24, hs: 22, bs: 9, kb: 0.5, str: 2, clash: 0, color: HB, srcKey: 'sp1', projOnHit: 1,
        onHit(A, D) { honGain(A, 6); honTech(A, D, 'blue'); } });
    } },
  },
  sp1f: {
    name: 'SPATIAL STEP', jp: '空間跳躍', desc: 'He folds space and is simply somewhere else: right behind the opponent if they are within ~380 px, otherwise ~240 px forward. Invulnerable, no damage, very short recovery. Focused/Unveiled: shorter cooldown.', special: 1, lvl: 4,
    poses: ['step', 'step'], st: 6, act: 1, rec: 9, cd: 80, invuln: [1, 9], pass: 9, sfx: 'teleport',
    tick(F, f, O) {
      F.vx = 0;
      if (f === 1) { FX.ring(F.x, F.y - 100, HB, 40, 6, 6, 2); }
      if (f === 3) { F.hidden = true; F.stepX0 = F.x; }
      if (f === 5) {
        const dx = O.x - F.x, near = Math.abs(dx) < 380 && Math.sign(dx) === F.facing;
        const x = near ? O.x + F.facing * 72 : F.x + F.facing * 240;
        F.x = clamp(x, 60, STAGE_W - 60); F.hidden = false;
        if (Math.sign(O.x - F.x) && Math.sign(O.x - F.x) !== F.facing) F.facing = Math.sign(O.x - F.x);
        F.stepFx = { x0: F.stepX0, x1: F.x, y: F.y, t: 14 };
        FX.ring(F.x, F.y - 100, HB, 6, 80, 12, 3); FX.ring(F.stepX0, F.y - 100, HB2, 60, 6, 10, 2);
        for (let i = 0; i < 8; i++) FX.p({ type: 'spark', x: F.x + rand(-26, 26), y: F.y - rand(20, 180), vx: 0, vy: -rand(0.5, 1.5), life: 20, size: 2, color: HICE });
        const lv = honLvl(F); if (lv) F.cd.sp1f = Math.round(F.cd.sp1f * (lv >= 2 ? 0.5 : 0.7));
      }
    },
  },
  counter: {
    name: 'INFINITY', jp: '無下限', desc: 'He casually raises a hand: for ~0.5 s attacks never reach him — melee attackers are stopped in mid-swing (big advantage), projectiles slow down and freeze. Grabs, unblockables and ultimates go straight through. Unveiled: stopped projectiles fly back.', special: 1, lvl: 4, counter: 1, counterNoGrab: 1,
    poses: ['infinity', 'infinity'], st: 3, act: 30, rec: 20, cd: 150, sfx: 'chime',
    tick(F, f) { if (f === 1) F.infExt = 0; if (f === 4) FX.ring(F.x, F.y - 100, HB, 20, 110, 14, 2); if (f === 31 && !F.infExt && honLvl(F) >= 1) { F.infExt = 1; F.mf -= 8; } },   // Focused: a slightly longer window
    onCounter(F, A, proj) {
      const lv = honLvl(F);
      if (proj) {
        if (lv >= 2) {   // Unveiled: the projectile reverses
          proj.dead = false; proj.owner = F; proj.vx = (Math.abs(proj.vx) > 1 ? -proj.vx * 1.2 : F.facing * 10); proj.vy = 0; proj.hitT = 0; proj.color = HB; proj.life = Math.max(proj.life, 80); proj.infSlow = 0;
        } else { FX.burst(proj.x, proj.y, HB, 12, 6); }
        FX.ring(proj.x, proj.y, HB, 6, 60, 12, 3); honGain(F, 8); return;
      }
      const dir = Math.sign(A.x - F.x) || F.facing;
      A.setState('hit'); A.hitstun = lv >= 2 ? 40 : 32; A.move = null; A.hitActive = false; A.vx = dir * 1.5; A.infFreezeT = 26;
      if (!A.onGround) A.vy = Math.min(A.vy, 0);
      F.connected = true; F.connectedHit = true; F.mf = F.move.st + F.move.act + F.move.rec - 6;
      BT.hitstop = Math.max(BT.hitstop, 12); BT.slow = Math.max(BT.slow || 0, 12);
      FX.wtext(A.x, A.y - 245, 'INFINITY', { size: 30, color: '#ffffff', stroke: '#0a3a7a', life: 40 });
      Sound.play('psi'); honGain(F, 12);
    },
  },
  sp2: {
    name: 'BLUE: MAXIMUM', jp: '蒼・最大出力', desc: 'A huge blue singularity forms ~210 px ahead after a visible charge. It violently pulls the opponent in (weakly even while blocking), grinds them with 4 hits and the final collapse launches. Longer cooldown.', special: 1, lvl: 4,
    poses: ['bluemax_w', 'bluemax'], st: 16, act: 1, rec: 24, cd: 210, sfx: 'energy',
    tick(F, f) { if (f < 16 && f % 2 === 0) { const h = F.handW('f'); FX.p({ type: 'spark', x: h[0] + rand(-40, 40), y: h[1] + rand(-40, 40), vx: 0, vy: 0, life: 10, size: 2, color: HB }); } },
    spawn: { f: 16, fn(F) {
      const lv = honLvl(F);
      BT.spawn({ owner: F, kind: 'blueOrb', x: F.x + F.facing * 210, y: F.y - 110, vx: F.facing * 0.001, w: 120, h: 130, delay: 8, delay0: 8, life: 56, hits: 5, interval: 10, persist: 0, sz: 1.9, big: 1, pr: lv ? 320 : 260, pull: lv ? 4 : 3.4, gpull: 1.2,
        dmg: 13, hs: 20, bs: 9, kb: 0.5, str: 3, clash: 1, color: HB, srcKey: 'sp2', projOnHit: 1, final: { dmg: 40, launch: -12, kb: 3, hs: 30, str: 3 },
        onHit(A, D) { honGain(A, 4); honTech(A, D, 'blue'); FX.ring(D.x, D.y - 100, HB, 60, 10, 10, 3); } });
    } },
  },
  sp2f: {
    name: 'RED: REVERSAL', jp: '術式反転・赫', desc: 'He points a finger, a red light gathers (clear 20 f startup), then a blast of repulsion fires across the screen: high damage, huge knockback, wall-splat. Focused: bigger. Unveiled: launches instead.', special: 1, lvl: 4,
    poses: ['red_w', 'red'], st: 20, act: 1, rec: 22, cd: 240, sfx: 'charge',
    tick(F, f) { if (f < 20 && f % 2 === 0) { const h = F.handW('f'); FX.p({ type: 'ember', x: h[0] + rand(-24, 24), y: h[1] + rand(-24, 24), vx: 0, vy: 0, life: 10, size: 2.5, color: HRED, add: true }); } },
    spawn: { f: 20, fn(F) {
      const lv = honLvl(F), sz = lv ? 1.3 : 1;
      BT.spawn({ owner: F, kind: 'redOrb', x: F.x + F.facing * 55, y: F.y - 118, vx: F.facing * 17, w: 56 * sz, h: 56 * sz, life: 48, sz, dmg: 100, hs: 26, bs: 18, kb: 15, kd: lv >= 2 ? 0 : 1, launch: lv >= 2 ? -12 : 0, ws: 1, str: 3, shake: 8, color: HRED, srcKey: 'sp2f', projOnHit: 1,
        onHit(A, D) { FX.ring(D.x, D.y - 110, '#ffffff', 10, 150, 14, 7); FX.ring(D.x, D.y - 110, HRED, 20, 230, 18, 5); FX.burst(D.x, D.y - 110, '#ff9a8a', 20, 11); Sound.play('impactBig'); honGain(A, 8); honTech(A, D, 'red'); } });
      FX.ring(F.x + F.facing * 55, F.y - 118, HRED, 10, 90, 10, 5); FX.shakeIt(4); Sound.play('explosion');
    } },
  },
  sp2d: {
    name: 'HOLLOW PURPLE', jp: '虚式・茈', desc: 'Needs 30 Limitless (free while Unveiled). Blue gathers in one hand, Red in the other, and he fuses them into a colossal mass of imaginary purple that erases projectiles and crosses the stage: 3 heavy hits. 40 f startup, long recovery and a long cooldown.', special: 1, lvl: 4,
    poses: ['purple_w', 'purple'], st: 40, act: 1, rec: 42, cd: 540, sfx: 'charge',
    req: F => F.unvT > 0 || (F.lim || 0) >= 30,
    onStart(F) { if (!(F.unvT > 0)) F.lim = Math.max(0, F.lim - 30); },
    tick(F, f) {
      const fs = F.unvT > 0 ? 28 : 40;
      if (f < fs && f % 2 === 0) { const a = F.handW('f'), b = F.handW('b'); FX.p({ type: 'spark', x: a[0] + rand(-20, 20), y: a[1] + rand(-20, 20), vx: 0, vy: 0, life: 8, size: 2, color: HRED }); FX.p({ type: 'spark', x: b[0] + rand(-20, 20), y: b[1] + rand(-20, 20), vx: 0, vy: 0, life: 8, size: 2, color: HB }); }
      if (f === fs - 10) { FX.flashScreen('#2a0a40', 10, 0.35); FX.darkTarget = 0.4; Sound.play('energy'); FX.wtext(F.x, F.y - 250, '虚式「茈」', { size: 30, font: FX_JP(), color: '#f0d8ff', stroke: '#3a0a6a', life: 40 }); }
      if (f === fs) {
        BT.spawn({ owner: F, kind: 'hollowPurple', x: F.x + F.facing * 80, y: F.y - 112, vx: F.facing * 8.5, w: 130, h: 130, life: 150, hits: 3, interval: 9, crush: 1, dmg: 48, hs: 24, bs: 16, kb: 6, str: 4, color: HPUR, srcKey: 'sp2d', projOnHit: 1, final: { kb: 16, kd: 1, ws: 1, hs: 30 },
          onHit(A, D) { FX.ring(D.x, D.y - 110, HPUR, 20, 200, 16, 6); FX.shakeIt(8); honGain(A, 5); } });
        FX.ring(F.x + F.facing * 80, F.y - 112, HPUR, 10, 220, 18, 8); FX.flashScreen('#e0b8ff', 8, 0.5); FX.shakeIt(10); Sound.play('explosion'); Sound.play('impactBig'); FX.darkTarget = 0;
        if (fs < 40) F.mf += 12;
      }
    },
  },
  ult: {
    name: 'DOMAIN EXPANSION: UNLIMITED VOID', jp: '領域展開・無量空処', desc: 'Ultimate. He raises a hand and space folds outward around him (wide, both sides). On hit the battlefield is swallowed by an endless cosmic void: the opponent hangs helpless while infinite information pours into them, until he ends it with one touch.', ult: 1, lvl: 6, cost: 100,
    poses: ['domain_w', 'domain'], st: 16, act: 10, rec: 34, dmg: 20, hs: 40, bs: 20, kb: 1, hb: { x: -80, y: -220, w: 520, h: 220 }, invuln: [0, 20], str: 3,
    tick(F, f) { if (f === 16) { BT.spawn({ owner: F, kind: 'domainWave', x: F.x, y: F.y - 110, vx: 0, w: 1, h: 1, life: 14, harmless: true, clash: 0 }); FX.ring(F.x, F.y - 110, HB, 20, 420, 16, 4, 0.4); } },
    onHit(F, D) { BT.startCine(F, D, CINE.honored, { zoom: 1.2 }); return true; },
  },
});
(() => {
  const M = HONORED.moves;
  Object.assign(M.L, { name: 'Lazy Flick' });
  Object.assign(M.M, { name: 'Casual Kick' });
  Object.assign(M.H, { name: 'REPULSE PALM', poses: ['blue_w', 'touch'], hb: { x: 18, y: -178, w: 96, h: 56 }, onHit(A, D) { FX.ring(D.x, D.y - 110, HB, 10, 70, 10, 3); } });
  Object.assign(M.cH, { name: 'Gravity Sweep' });
  Object.assign(M.LH, { name: 'Upward Repel', poses: ['upper_w', 'upper'] });
  Object.assign(M.FF, { name: 'Gliding Step' });
  Object.assign(M.jH, { name: 'Downward Press' });
})();
// CPU hints: Blue orbs sit at a fixed spot ~220 px ahead (they are not travelling projectiles)
HONORED.moves.sp1.__ai = { reach: 320, kind: 'melee', anti: false, st: 15, low: false, over: false };
HONORED.moves.sp2.__ai = { reach: 380, kind: 'melee', anti: false, st: 24, low: false, over: false };
addFollowup(HONORED, 'sp1', { btn: 'sp2', any: true, motion: 'qcf', cond: F => F.T - F.blueHitT < 40, move: 'sp2f' });   // Blue → Red while the orb holds them
HONORED.combos = [
  { name: 'Gravity Well', notation: 'M → H (Repulse Palm) → SP1 (Blue: Attraction)', seq: ['M', 'H', 'sp1'] },
  { name: 'Attract & Repel', notation: 'SP1 (Blue) → ↓→SP2 (Red: Reversal) while the orb holds them', seq: ['sp1', 'sp2f'] },
  { name: 'Singularity', notation: 'M → H → SP2 (Blue: Maximum)', seq: ['M', 'H', 'sp2'] },
  { name: 'Hollow Technique', notation: 'SP2 (Blue: Maximum) → ↓↓SP2 (Hollow Purple) as they fall — needs 30 Limitless', seq: ['sp2', 'sp2d'], authority: 60 },
  { name: 'Unlimited Void', notation: 'M → H → SP1+SP2 (Ultimate)', seq: ['M', 'H', 'ult'], meter: 1 },
];
HONORED.applyTrial = (A, tr) => { if (!tr) return; if (tr.meter) A.meter = 100; if (tr.authority) { A.lim = tr.authority; A.limT = A.T + 9999; } };

// ---------------------------------- cinematic: DOMAIN EXPANSION — UNLIMITED VOID ----------------------------------
const HON_GLYPHS = '01∞ΣΔλπ∂√≡無量空処天上知情報∴∵#%&∫Ωψ'.split('');
CINE.honored = function (A, D, f, c) {
  const dir = A.facing;
  if (f === 1) {
    D.x = clamp(D.x, 200, STAGE_W - 200); if (Math.abs(D.x - A.x) < 150) D.x = clamp(A.x + dir * 170, 120, STAGE_W - 120);
    D.y = GROUND; D.forcePose = 'hit'; A.forcePose = 'stance'; c.zoom = 1.2; c.camX = A.x; c.camY = GROUND - 150;
    FX.darkTarget = 0.35; Sound.play('heart'); c.bg = HONORED.cineBg; c.fg = HONORED.cineFg; c.dir = dir;
    c.v = 0; c.dom = 0; c.info = 0; c.col = 0; c.burst = 0;
    c.stars = []; for (let i = 0; i < 160; i++) c.stars.push([Math.random() * TAU, Math.random(), Math.random() * 0.006 + 0.002, Math.random() * 1.6 + 0.5]);
    c.streams = []; for (let i = 0; i < 46; i++) c.streams.push([Math.random() * TAU, Math.random(), Math.random() * 0.02 + 0.012, (Math.random() * HON_GLYPHS.length) | 0]);
  }
  // --- Phase 1: activation — he stops, the camera closes in, he raises one hand and smiles ---
  if (f <= 40) { const k = easeOut(f / 40); c.zoom = lerp(1.2, 1.75, k); c.camX = A.x + dir * 10; c.camY = lerp(GROUND - 150, A.y - 150, k); }
  if (f === 8) A.forcePose = 'domain_w';
  if (f === 16) { A.cineBare = true; Sound.play('chime'); }   // he slides the blindfold off
  if (f === 22) A.forcePose = 'domain';
  if (f >= 10 && f < 44 && f % 2 === 0) { const h = A.handW('f'); for (let i = 0; i < 3; i++) { const a = rand(0, TAU), d = rand(60, 160); FX.p({ type: 'spark', x: h[0] + Math.cos(a) * d, y: h[1] + Math.sin(a) * d, vx: -Math.cos(a) * d / 12, vy: -Math.sin(a) * d / 12, life: 12, size: rand(1.5, 3), color: pick([HB, HICE, HPUR]) }); } }
  if (f === 28) { BT.say(A, 'Domain Expansion.', 56); FX.wtext(A.x, A.y - 290, '領域展開', { size: 46, font: FX_JP(), color: '#ffffff', stroke: '#0a2a6a', life: 60 }); Sound.play('gong'); }
  // --- a massive circular distortion spreads out and swallows the battlefield ---
  if (f >= 42 && f <= 74) { c.v = easeIn2((f - 42) / 32); const k = (f - 42) / 32; c.zoom = lerp(1.75, 1.0, easeOut(k)); c.camX = lerp(A.x, (A.x + D.x) / 2, easeOut(k)); c.camY = lerp(A.y - 150, GROUND - 160, easeOut(k)); }
  if (f === 42) { Sound.play('energy'); FX.shakeIt(6); }
  if (f === 52) FX.darkTarget = 0;
  if (f === 74) { Sound.play('impactBig'); FX.flashScreen('#cfe8ff', 10, 0.5); FX.shakeIt(10); }
  // --- Phase 2: the domain — a cosmic void and a gigantic glowing sphere; the camera reveals its scale ---
  if (f >= 74) c.dom = Math.min(1, (f - 74) / 34);
  if (f >= 80 && f < 118) { const k = easeOut((f - 80) / 38); c.zoom = lerp(1.0, 0.72, k); c.camY = lerp(GROUND - 160, GROUND - 230, k); }
  if (f === 92) { FX.announce('無量空処', { sub: 'UNLIMITED VOID', size: 96, life: 76, y: H / 2 - 150, color: '#e8f6ff', glow: HB }); Sound.play('gong'); }
  // --- Phase 3: unlimited void — the opponent hangs helpless while infinite information pours in ---
  if (f >= 100 && f <= 214) { const k = Math.min(1, (f - 100) / 20); D.forcePose = 'airhit'; D.y = GROUND - 46 * k - (1 + Math.sin(f * 0.08)) * 4; D.x += (Math.sin(f * 0.05) * 0.2); }
  if (f === 104) A.forcePose = 'stance';
  if (f >= 112) c.info = Math.min(1, (f - 112) / 70);
  if (f >= 122 && f < 200) { const k = easeOut((f - 122) / 78); c.zoom = lerp(0.72, 1.12, k); c.camX = lerp((A.x + D.x) / 2, D.x - dir * 40, k); c.camY = lerp(GROUND - 230, D.y - 120, k); }
  if (f >= 124 && f <= 196 && f % 12 === 4) { BT.scriptHit(A, D, 10, { str: 1, sfx: 'psi' }); D.flash = 3; FX.shakeIt(2 + c.info * 3); }
  if (f === 150) Sound.play('heart');
  if (f === 176) Sound.play('heart');
  if (f === 198) { A.x = clamp(D.x - dir * 88, 60, STAGE_W - 60); A.forcePose = 'touch'; FX.ring(A.x, A.y - 100, HB, 6, 90, 12, 3); Sound.play('teleport'); }   // he simply appears in front of them
  if (f === 206) Sound.play('charge');
  if (f === 214) {   // one touch: a burst of pure spatial energy
    BT.scriptHit(A, D, 160, { str: 4 }); c.burst = 1;
    FX.impactFrame(6); FX.shakeIt(30); Sound.play('explosion'); Sound.play('impactBig'); FX.flashScreen('#ffffff', 20, 0.9);
    const ch = D.chestW(); FX.ring(ch[0], ch[1], HB, 20, 480, 26, 10); FX.ring(ch[0], ch[1], HPUR, 10, 320, 22, 6); FX.ring(ch[0], ch[1], '#ffffff', 10, 200, 16, 5);
    for (let i = 0; i < 56; i++) FX.p({ type: i % 3 ? 'spark' : 'ember', x: ch[0], y: ch[1], vx: rand(-14, 14), vy: rand(-12, 8), grav: 0.15, life: 50, size: rand(2, 4.5), color: pick([HB, HICE, HPUR, '#ffffff']), add: true });
    FX.wtext(D.x, D.y - 270, '無量空処', { size: 80, font: FX_JP(), color: '#ffffff', stroke: '#0a2a6a', life: 60, vy: -0.3 });
  }
  if (f > 214) c.burst = Math.max(0, 1 - (f - 214) / 24);
  // --- Phase 4: the domain collapses, the battlefield returns ---
  if (f >= 222) { c.col = Math.min(1, (f - 222) / 22); c.zoom = lerp(c.zoom, 1.0, 0.12); c.camX = lerp(c.camX, (A.x + D.x) / 2, 0.12); c.camY = lerp(c.camY, GROUND - 150, 0.12); }
  if (f === 222) Sound.play('hiss');
  if (f === 236) { BT.release(D, dir * 7, -9); A.forcePose = 'victory'; }
  if (f === 246) { A.cineBare = false; Sound.play('chime'); }   // …and casually pulls the blindfold back up
  if (f === 262) { honGain(A, 15); FX.darkTarget = 0; return true; }
};
const easeIn2 = t => clamp(t, 0, 1) ** 2;
HONORED.cineBg = (g, c) => {   // screen space: the expanding void, the starfield and the colossal sphere
  if (!BT || !c.A) return;
  const A = c.A, D = c.D, f = c.f, col = c.col || 0;
  const [hx, hy] = BT.cam.toScreen(...A.handW('f')), maxR = Math.hypot(W, H) * 1.05;
  const vr = (c.v || 0) * maxR * (1 - easeIn2(col));
  if (vr <= 1) return;
  g.save();
  g.beginPath(); g.arc(hx, hy, vr, 0, TAU); g.clip();
  const sky = g.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, maxR * 0.7); sky.addColorStop(0, '#0a0c2a'); sky.addColorStop(0.5, '#05061a'); sky.addColorStop(1, '#010108');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  // infinite stars streaming outward from the centre
  const cx = W / 2, cy = H / 2;
  for (const s of c.stars) {
    const d = (s[1] + f * s[2]) % 1, rr = d * d * maxR * 0.8, x = cx + Math.cos(s[0]) * rr, y = cy + Math.sin(s[0]) * rr * 0.7, sz = s[3] * (0.4 + d * 1.6);
    g.globalAlpha = Math.min(1, d * 3); g.fillStyle = d > 0.6 ? '#ffffff' : '#a8d8ff'; g.fillRect(x, y, sz, sz);
  }
  g.globalAlpha = 1;
  // the gigantic glowing spherical structure around the fighters
  const dm = easeOut(c.dom || 0) * (1 - col);
  if (dm > 0) {
    const mid = BT.cam.toScreen((A.x + D.x) / 2, GROUND - 120), R = 520 * BT.cam.z * (0.6 + 0.4 * dm);
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = dm;
    const halo = g.createRadialGradient(mid[0], mid[1], R * 0.85, mid[0], mid[1], R * 1.25); halo.addColorStop(0, 'rgba(90,200,255,0)'); halo.addColorStop(0.4, 'rgba(110,190,255,0.35)'); halo.addColorStop(1, 'rgba(120,60,255,0)');
    g.fillStyle = halo; g.beginPath(); g.arc(mid[0], mid[1], R * 1.25, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(160,220,255,0.55)'; g.lineWidth = 2;
    g.beginPath(); g.arc(mid[0], mid[1], R, 0, TAU); g.stroke();
    for (let i = 1; i < 6; i++) { const yy = (i / 6 - 0.5) * 2, w = Math.sqrt(1 - yy * yy); g.globalAlpha = dm * 0.35; g.beginPath(); g.ellipse(mid[0], mid[1] + yy * R, R * w, R * w * 0.16, 0, 0, TAU); g.stroke(); }   // latitudes
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI + f * 0.006, w = Math.abs(Math.cos(a)); g.globalAlpha = dm * 0.3; g.strokeStyle = i % 2 ? 'rgba(180,140,255,0.6)' : 'rgba(140,220,255,0.6)'; g.beginPath(); g.ellipse(mid[0], mid[1], R * w + 1, R, 0, 0, TAU); g.stroke(); }   // meridians
    // concentric abstract rings with ticks, like a lens of pure information
    for (let i = 0; i < 3; i++) { const rr = R * (0.32 + i * 0.2); g.globalAlpha = dm * 0.25; g.setLineDash([4, 10 + i * 6]); g.lineDashOffset = f * (i % 2 ? 1 : -1); g.beginPath(); g.arc(mid[0], mid[1], rr, 0, TAU); g.stroke(); }
    g.setLineDash([]); g.restore();
  }
  g.restore();
  // the edge of the spreading void
  if (c.v < 1 || col > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = HB; g.lineWidth = 10; g.globalAlpha = 0.6; g.beginPath(); g.arc(hx, hy, vr, 0, TAU); g.stroke(); g.strokeStyle = HPUR; g.lineWidth = 4; g.beginPath(); g.arc(hx, hy, vr * 0.96, 0, TAU); g.stroke(); g.restore(); }
};
HONORED.cineFg = (g, c) => {   // screen space over the fighters: infinite information pouring into the victim
  if (!BT || !c.D) return;
  const D = c.D, f = c.f, k = (c.info || 0) * (1 - (c.col || 0));
  if (k > 0.01) {
    const [tx, ty] = BT.cam.toScreen(D.x, D.y - 100 * D.s);
    g.save(); g.globalCompositeOperation = 'lighter'; g.font = `700 16px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const n = Math.round(c.streams.length * (0.3 + 0.7 * k));
    for (let i = 0; i < n; i++) {
      const s = c.streams[i], a = s[0] + Math.sin(f * 0.01 + i) * 0.1, R0 = 760;
      const ox = tx + Math.cos(a) * R0, oy = ty + Math.sin(a) * R0 * 0.75;
      g.globalAlpha = 0.18 * k; g.strokeStyle = i % 3 ? '#a8e4ff' : '#d0b0ff'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(ox, oy); g.lineTo(tx, ty); g.stroke();
      for (let j = 0; j < 3; j++) {
        const d = (s[1] + f * s[2] + j / 3) % 1, x = lerp(ox, tx, d), y = lerp(oy, ty, d);
        g.globalAlpha = k * (0.35 + 0.65 * d); g.fillStyle = d > 0.7 ? '#ffffff' : i % 3 ? '#8fdcff' : '#d6b4ff';
        g.fillText(HON_GLYPHS[(s[3] + j + (f >> 3)) % HON_GLYPHS.length], x, y);
      }
    }
    // the victim's mind floods: a growing white-blue core and glitch bands
    const gr = g.createRadialGradient(tx, ty, 0, tx, ty, 90 + 60 * k); gr.addColorStop(0, `rgba(230,246,255,${0.55 * k})`); gr.addColorStop(1, 'rgba(80,140,255,0)');
    g.globalAlpha = 1; g.fillStyle = gr; g.beginPath(); g.arc(tx, ty, 150, 0, TAU); g.fill();
    if (k > 0.5 && f % 4 < 2) { g.globalAlpha = (k - 0.5) * 0.5; g.fillStyle = '#9fdcff'; for (let i = 0; i < 4; i++) g.fillRect(0, ((f * 37 + i * 191) % H), W, 2 + (i % 2) * 3); }
    g.restore();
  }
  if (c.burst > 0) { g.save(); g.fillStyle = `rgba(235,248,255,${c.burst * 0.8})`; g.fillRect(0, 0, W, H); g.restore(); }
};

// ---------------------------------- HUD + how-to ----------------------------------
HONORED.drawHand = (g, F, side, t) => {
  const lv = honLvl(F), unv = F.unvT > 0;
  xpPanel(g, F, side, t, {
    col: unv ? '#9ff4ff' : lv ? HB : '#5a86c8', col2: '#ffffff', icon: '∞', flash: unv,
    title: unv ? 'UNVEILED' : lv ? 'LIMITLESS · FOCUSED' : 'LIMITLESS',
    sub: unv ? '天眼解放 · 3-HIT BLUE · LAUNCHING RED · REFLECT · FAST PURPLE' : '無下限 · spatial hits, Infinity stops, Blue × Red · PURPLE 30',
    k: (F.lim || 0) / 100, label: unv ? `${(F.unvT / 60).toFixed(1)}s` : `${Math.floor(F.lim || 0)}%`, marks: [0.3, 0.5],
    badges: [['sp1', 'S1|BLUE'], ['sp1f', '↓→S1|STEP'], ['counter', '↓←S1|INFINITY'], ['sp2', 'S2|MAX BLUE'], ['sp2f', '↓→S2|RED'], ['sp2d', '↓↓S2|PURPLE']],
  });
};
HONORED.howTo = {
  title: 'HONORED ONE',
  draw(g) {
    xpHowTo(g, 'KUON — THE HONORED ONE', HB, [
      ['LIMITLESS', 'Fills with Blue/Red/Purple hits, Infinity stops (+12) and Blue × Red within 2.5 s (+10). 50 = FOCUSED (wider Blue, faster Step).'],
      ['UNVEILED', 'Full gauge = 7 s, blindfold off: 3-hit Blue, launching Red, Infinity reflects projectiles, Purple is free and faster.'],
      ['SP1', 'Blue: Attraction — a blue point ~220 px ahead (hold ← for close) drags them in, 2 hits. ↓→SP2 during it = Red.'],
      ['↓→ SP1', 'Spatial Step — instant teleport behind them (within ~380 px) or 240 px forward. Invulnerable, no damage.'],
      ['↓← SP1', 'Infinity — ~0.5 s: melee attackers freeze mid-swing, projectiles stop. Grabs, unblockables and ults beat it.'],
      ['SP2', 'Blue: Maximum — big singularity, strong pull (even through block, weakly), 4 hits + launching collapse.'],
      ['↓→ SP2', 'Red: Reversal — 20 f startup, then a blast of repulsion: big damage, knockback, wall-splat.'],
      ['↓↓ SP2', 'Hollow Purple — costs 30 Limitless: Blue + Red fused, erases projectiles, 3 heavy hits. Slow and very punishable.'],
    ], 'Control the space: Blue drags them where you want, Step puts you behind them, Infinity punishes careless pressure. Combine Blue and Red to fill Limitless, then finish with Purple. Ultimate (SP1+SP2): DOMAIN EXPANSION — UNLIMITED VOID.');
  },
};

CHARS.push(HONORED);
finalizeMoves(HONORED);
