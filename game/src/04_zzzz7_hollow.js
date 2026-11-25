// ============================ THE HOLLOW — PSYCHIC SEALER ============================
// Technical / psychic control / anti-ability. Beni's original manga character: a man with a completely featureless
// head who never speaks (only telepathy) and seals other people's abilities. Fragments of every psyche he sealed stay
// inside his head; almost the entire psyche of his late wife is among them.
// Systems: PSYCHIC FRAGMENTS (hits, interrupts, evasions, seals) → PSYCHIC OVERLOAD (auto at 100 or ↓↓SP2 at 40+, then a
//          short exhaustion) · Outlet Detection mark · Outlet Seal (generic hook: locks the victim's last-used special slot
//          for a short time, see Fighter.canUse / sealT) · shadow Fragment · Ult THE LAST REMNANT (his wife).
const HV = '#b996ff', HV2 = '#6c4bc0', HVW = '#efe8ff', HDK = '#120c1a', HPALE = '#dcd6ff';
const HLW_OV = 420, HLW_EXH = 180;

// ---------------------------------- art: The Hollow ----------------------------------
function coldSkin(g, r, c) {   // repaint the head with a cold, bloodless shading (the default head shading is warm)
  g.fillStyle = c.skin; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(-0.55 * r, 0.5 * r); g.quadraticCurveTo(0.1 * r, 1.02 * r, 0.55 * r, 0.86 * r); g.quadraticCurveTo(0.98 * r, 0.6 * r, 0.99 * r, -0.1 * r); g.lineTo(0, -0.2 * r); g.closePath(); g.fill();
  g.save(); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.clip(); g.fillStyle = 'rgba(70,60,120,0.2)'; g.beginPath(); g.arc(-0.62 * r, 0.32 * r, r * 0.86, 0, TAU); g.fill(); g.restore();
}
function hlwFace(g, r, c, o) {   // no eyes, no mouth, no nose, no ears: a smooth, empty face — only soft shading and psychic cracks
  const T = o.T || 0, hurt = o.expr === 'hurt' || o.expr === 'ko';
  g.save();
  coldSkin(g, r, c);
  g.fillStyle = 'rgba(255,255,255,0.28)'; g.beginPath(); g.ellipse(0.42 * r, -0.36 * r, 0.42 * r, 0.24 * r, -0.4, 0, TAU); g.fill();   // smooth highlight
  g.fillStyle = 'rgba(60,40,90,0.12)'; g.beginPath(); g.ellipse(0.62 * r, 0.5 * r, 0.32 * r, 0.2 * r, 0.3, 0, TAU); g.fill();          // where a face should be: nothing, just a soft hollow
  const k = c.crack + (hurt ? 0.5 : 0);
  // a faint dark fissure is always there
  g.strokeStyle = 'rgba(60,40,90,0.45)'; g.lineWidth = 0.035 * r; g.lineCap = 'round'; g.beginPath(); g.moveTo(0.1 * r, -0.96 * r); g.lineTo(0.22 * r, -0.6 * r); g.lineTo(0.12 * r, -0.36 * r); g.stroke();
  if (k > 0) {
    const j = hurt ? 0.04 * r : 0;
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    g.strokeStyle = c.crackCol; g.globalAlpha = Math.min(1, 0.35 + 0.25 * k + 0.15 * Math.sin(T * 0.15)); g.lineWidth = 0.05 * r;
    g.beginPath(); g.moveTo(0.1 * r, -0.96 * r); g.lineTo(0.22 * r + j, -0.6 * r); g.lineTo(0.12 * r, -0.36 * r); g.lineTo(0.3 * r - j, -0.1 * r);
    if (k > 0.9) { g.moveTo(0.22 * r, -0.6 * r); g.lineTo(0.52 * r, -0.66 * r); g.lineTo(0.7 * r + j, -0.5 * r); }
    if (k > 1.9) { g.moveTo(0.12 * r, -0.36 * r); g.lineTo(-0.2 * r, -0.2 * r); g.lineTo(-0.36 * r, 0.06 * r); g.moveTo(0.3 * r, -0.1 * r); g.lineTo(0.5 * r, 0.2 * r); }
    g.stroke();
  }
  g.restore();
}
const HOLLOW = {
  id: 'hollow', name: 'THE HOLLOW', jp: 'ホロウ', title: 'The Psychic Sealer', titleJp: '封印の虚', mute: true, noEar: true,
  style: 'ANTI-ABILITY', desc: 'A faceless man who never speaks. He reads your outlet, seals your last ability and keeps a fragment of your mind. Deep inside him, someone is still waiting.',
  stats: { power: 3, speed: 2, range: 4, defense: 3 },
  scale: 1.0, health: 960, walk: 3.6, backWalk: 3.3, jumpV: -16, jumpX: 4.1, dashV: 10.5, backdashV: 10, backdashInv: 10, juggleMax: 6,
  voicePitch: 0.5, voiceRate: 0.9,
  colors: {
    skin: '#e8e6ee', hair: '#1a1620', top: '#3b3545', leg: '#26222e', boot: '#1a171f', foot: '#1a171f', uarm: '#3b3545', farm: '#3b3545', hand: '#dedae6', cuff: '#4a4356', belt: '#4a4356', inner: '#6a6278',
    eye: HV, eye2: HDK, accent: HV, brow: '#2c2834', warm: '#34303e', sole: '#0e0c12', pad: '#5c4a86', collar: '#1b1822', scarf: '#221e2a', scarf2: '#4a4258', male: true,
    crack: 0, crackCol: HV,
  },
  afterColors: [HV, '#2a1a40', HPALE],
  stance: { t: 0.03, hd: 0.08, fa1: 0.14, fa2: 0.22, ba1: -0.1, ba2: 0.12, fl1: 0.1, fl2: 0.02, bl1: -0.1, bl2: -0.03 },
  poses: {
    tilt: { t: 0.03, hd: 0.42, fa1: 0.14, fa2: 0.22, ba1: -0.1, ba2: 0.12 },
    burst_w: { t: -0.12, hd: -0.06, fa1: 0.7, fa2: 1.9, ba1: 0.6, ba2: 1.8, fl1: 0.12, fl2: 0.03, bl1: -0.14, bl2: -0.04 },
    burst: { t: 0.1, hd: 0.06, fa1: 1.5, fa2: 1.6, ba1: 1.25, ba2: 1.45, fl1: 0.3, fl2: 0.06, bl1: -0.3, bl2: -0.1 },
    point_w: { t: -0.05, hd: 0.02, fa1: 0.9, fa2: 2.2, ba1: -0.1, ba2: 0.12 },
    point: { t: 0.04, hd: 0.0, fa1: 1.58, fa2: 1.62, ba1: -0.14, ba2: 0.1 },
    seal_w: { t: -0.08, hd: -0.12, fa1: 2.5, fa2: 2.9, ba1: -0.12, ba2: 0.1, fl1: 0.12, fl2: 0.03, bl1: -0.12, bl2: -0.03 },
    seal: { t: 0.08, hd: 0.0, fa1: 1.75, fa2: 2.05, ba1: -0.16, ba2: 0.1, fl1: 0.26, fl2: 0.05, bl1: -0.26, bl2: -0.08 },
    step: { t: 0.3, hd: 0.3, fa1: 0.05, fa2: 0.05, ba1: -0.05, ba2: 0.0, fl1: 0.3, fl2: 0.1, bl1: -0.2, bl2: -0.06 },
    manifest_w: { t: -0.16, hd: -0.38, fa1: 0.5, fa2: 0.5, ba1: -0.5, ba2: -0.4 },
    manifest: { t: 0.12, hd: 0.05, fa1: 1.45, fa2: 1.55, ba1: -0.3, ba2: -0.1, fl1: 0.25, fl2: 0.05, bl1: -0.25, bl2: -0.08 },
    overload: { t: -0.16, hd: -0.4, fa1: 0.95, fa2: 0.85, ba1: -0.95, ba2: -0.75, fl1: 0.18, fl2: 0.04, bl1: -0.18, bl2: -0.04 },
    release: { t: 0.12, hd: 0.0, fa1: 1.55, fa2: 1.6, ba1: 1.2, ba2: 1.4, fl1: 0.34, fl2: 0.07, bl1: -0.32, bl2: -0.1 },
    victory: { t: 0.02, hd: 0.12, fa1: 0.12, fa2: 0.18, ba1: -0.08, ba2: 0.1, fl1: 0.06, fl2: 0.02, bl1: -0.06, bl2: -0.02 },
    defeat: { t: 0.42, hd: 0.45, fa1: 0.25, fa2: 0.1, ba1: 0.3, ba2: 0.1, fl1: 1.35, fl2: 0.0, bl1: 0.25, bl2: -1.45 },
    intro: { t: 0.02, hd: 0.3, fa1: 0.14, fa2: 0.22, ba1: -0.1, ba2: 0.12 },
  },
  intro: '< ...I can hear what you are afraid of. >',
  wins: ['< . . . >', '< Your outlet is quiet now. A piece of you stays with me. >', '< She says you fought well. >'],
  ropes: [   // the two tails of his worn scarf
    { id: 'sc1', at: sk => [sk.neck[0] - 12, sk.neck[1] + 6], n: 6, seg: 8, w0: 7, w1: 4, color: 'scarf', grav: 0.35, wind: 0.6 },
    { id: 'sc2', at: sk => [sk.neck[0] - 9, sk.neck[1] + 9], n: 5, seg: 8, w0: 5.5, w1: 3.2, color: 'scarf2', grav: 0.4, wind: 0.5 },
  ],
  hairBack() {},   // no hair: the smooth empty head is his whole silhouette
  hairFront() {},
  neckWear(g, sk, p, c, R) {   // a heavy, frayed scarf wound high around the neck
    const n = sk.neck;
    poly(g, [[n[0] - 15, n[1] + 9], [n[0] - 14, n[1] - 6], [n[0] + 2, n[1] - 9], [n[0] + 14, n[1] - 5], [n[0] + 15, n[1] + 8], [n[0] + 8, n[1] + 12], [n[0] + 2, n[1] + 9], [n[0] - 6, n[1] + 13]], c.scarf, R, 3);
    if (R.mono) return;
    g.strokeStyle = c.scarf2; g.lineWidth = 1.6; g.beginPath(); g.moveTo(n[0] - 13, n[1] - 1); g.quadraticCurveTo(n[0], n[1] - 5, n[0] + 14, n[1]); g.moveTo(n[0] - 13, n[1] + 5); g.quadraticCurveTo(n[0], n[1] + 2, n[0] + 14, n[1] + 5); g.stroke();
  },
  torsoDetail(g, L, bw, c) {   // layered, worn coat: lighter inner layer, overlapping flap, stitched tear, faint psychic seam
    g.fillStyle = c.inner; g.beginPath(); g.moveTo(2 * bw, -L + 2); g.lineTo(13 * bw, -L + 2); g.lineTo(9 * bw, -L * 0.45); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(-12 * bw, -L + 6, 7 * bw, L * 0.7);
    g.strokeStyle = '#3a3446'; g.lineWidth = 2; g.beginPath(); g.moveTo(-6 * bw, -L + 2); g.lineTo(12 * bw, -L * 0.25); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-10 * bw, -L * 0.5); g.lineTo(-4 * bw, -L * 0.42); g.stroke();
    g.strokeStyle = '#4a4258'; g.lineWidth = 0.9; for (let i = 0; i < 4; i++) { const x = -9 * bw + i * 1.8 * bw; g.beginPath(); g.moveTo(x, -L * 0.5 - 2); g.lineTo(x + 1, -L * 0.44 + 1); g.stroke(); }
    if (c.crack > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.25 + 0.2 * c.crack; g.strokeStyle = c.crackCol; g.lineWidth = 1.2; g.beginPath(); g.moveTo(4 * bw, -L * 0.85); g.lineTo(7 * bw, -L * 0.6); g.lineTo(5 * bw, -L * 0.4); g.stroke(); g.restore(); }
  },
  torsoOver(g, L, bw, c, R) { if (!R.mono) { g.fillStyle = c.belt; g.fillRect(-13 * bw, -7, 26 * bw, 4); } },
  drawSkirt(g, sk, p, c, R, o) {   // long worn coat tails with a torn hem over dark trousers
    chibiShorts(g, sk, c, R, c.leg, 0.45, 3);
    const T = (o && o.T) || 0, fl = Math.sin(T * 0.05) * 2;
    const hb = [sk.hip[0] - 16, sk.hip[1] - 8], hf = [sk.hip[0] + 14, sk.hip[1] - 8];
    poly(g, [hb, [hb[0] - 8 + fl, hb[1] + 36], [hb[0] - 1 + fl, hb[1] + 31], [hb[0] + 5 + fl, hb[1] + 40], [hb[0] + 12, hb[1] + 33], [hb[0] + 17, hb[1] + 38], [hf[0] - 8, hf[1] + 24], [hf[0] - 2, hf[1] + 14], hf], R.mono || c.top, R, 3);
    if (!R.mono) { g.strokeStyle = 'rgba(0,0,0,0.28)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(hb[0] + 6, hb[1] + 4); g.lineTo(hb[0] + 3 + fl, hb[1] + 34); g.moveTo(hb[0] + 15, hb[1] + 4); g.lineTo(hb[0] + 14, hb[1] + 32); g.stroke(); }
  },
  shoulderOver(g, sk, p, c, R) {   // slightly oversized sleeve on the front arm, wide at the wrist
    const E = sk.fe, Hd = sk.fh, a = Math.atan2(Hd[1] - E[1], Hd[0] - E[0]), nx = -Math.sin(a), ny = Math.cos(a);
    const W0 = 7.5, W1 = 10.5, P = [lerp(E[0], Hd[0], 0.82), lerp(E[1], Hd[1], 0.82)];
    poly(g, [[E[0] + nx * W0, E[1] + ny * W0], [P[0] + nx * W1, P[1] + ny * W1], [P[0] - nx * W1 + Math.cos(a) * 3, P[1] - ny * W1 + Math.sin(a) * 3], [E[0] - nx * W0, E[1] - ny * W0]], R.mono || c.top, R, 2.4);
    if (!R.mono) { g.strokeStyle = '#3a3446'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(P[0] + nx * W1, P[1] + ny * W1); g.lineTo(P[0] - nx * W1 + Math.cos(a) * 3, P[1] - ny * W1 + Math.sin(a) * 3); g.stroke(); }
  },
};
makeChibi(HOLLOW, { build: { arm: 1.0, leg: 1.0, torso: 1.04 }, colors: {} });
HOLLOW.faceFn = hlwFace;
HOLLOW.noEar = true;

// ---------------------------------- art: the remnant (his wife) ----------------------------------
function remFace(g, r, c, o) {   // calm, melancholic half-lidded eyes; no blush on her white skin
  const e = o.expr || 'normal', ex = 0.5 * r, ey = 0.27 * r, fx = 0.94 * r;
  g.save(); g.lineCap = 'round'; coldSkin(g, r, c);
  if (e === 'closed') {
    g.strokeStyle = OUTLINE; g.lineWidth = 0.07 * r; g.beginPath(); g.moveTo(ex - 0.2 * r, ey + 0.02 * r); g.quadraticCurveTo(ex, ey + 0.12 * r, ex + 0.22 * r, ey); g.moveTo(fx - 0.07 * r, ey + 0.02 * r); g.quadraticCurveTo(fx, ey + 0.08 * r, fx + 0.06 * r, ey); g.stroke();
  } else {
    for (const [x, w, h, far] of [[fx, 0.075, 0.3, true], [ex, 0.23, 0.36, false]]) {
      chibiEye(g, x, ey, w * r, h * r, c, { glow: o.glow }, far);
      g.fillStyle = c.skin; g.beginPath(); g.ellipse(x, ey - h * r * 0.62, w * r * 1.35, h * r * 0.62, 0, Math.PI, TAU); g.fill();   // heavy lids
      g.fillRect(x - w * r * 1.35, ey - h * r * 0.64, w * r * 2.7, h * r * 0.3);
      g.strokeStyle = OUTLINE; g.lineWidth = Math.max(1.4, h * r * 0.2); g.beginPath(); g.moveTo(x - w * r * 1.15, ey - h * r * 0.22); g.quadraticCurveTo(x, ey - h * r * 0.42, x + w * r * 1.1, ey - h * r * 0.26); g.stroke();
    }
    g.strokeStyle = c.brow; g.lineWidth = 0.04 * r; g.beginPath(); g.moveTo(ex - 0.2 * r, ey - 0.38 * r); g.quadraticCurveTo(ex + 0.02 * r, ey - 0.42 * r, ex + 0.24 * r, ey - 0.54 * r); g.stroke();   // inner ends raised: sad
  }
  g.strokeStyle = 'rgba(40,30,50,0.8)'; g.lineWidth = 0.035 * r; g.beginPath(); g.moveTo(0.67 * r, 0.75 * r); g.lineTo(0.78 * r, 0.74 * r); g.stroke();
  g.fillStyle = 'rgba(150,160,220,0.14)'; g.beginPath(); g.ellipse(0.5 * r, 0.62 * r, 0.16 * r, 0.06 * r, 0, 0, TAU); g.fill();   // a cold shadow instead of a blush
  g.restore();
}
const REMNANT = {
  id: 'remnant', name: 'REMNANT', jp: '残影', scale: 1.06, noEar: true,
  colors: {
    skin: '#fbfbff', hair: '#07070c', hair2: '#1e1e2c', top: '#ecebf4', leg: '#fbfbff', boot: '#e2e2ec', foot: '#e2e2ec', uarm: '#ecebf4', farm: '#ecebf4', hand: '#fbfbff', cuff: '#ecebf4', belt: '#1a1a24',
    eye: '#4a4a66', eye2: '#06060c', accent: '#d8e0ff', brow: '#1a1a26', warm: '#ecebf4', sole: '#cfcfe0', pad: '#cfcfe0', collar: '#1a1a24',
  },
  stance: { t: -0.02, hd: 0.1, fa1: 0.08, fa2: 0.2, ba1: -0.06, ba2: 0.12, fl1: 0.05, fl2: 0.02, bl1: -0.04, bl2: -0.01 },
  poses: {
    shoulder: { t: 0.06, hd: 0.18, fa1: 1.15, fa2: 1.55, ba1: -0.06, ba2: 0.12 },
    reach: { t: 0.08, hd: -0.05, fa1: 1.95, fa2: 2.2, ba1: -0.1, ba2: 0.1 },
    glide: { t: 0.12, hd: 0.08, fa1: 0.4, fa2: 0.5, ba1: -0.4, ba2: -0.2, fl1: 0.12, fl2: 0.08, bl1: -0.12, bl2: -0.02 },
    lower: { t: 0.1, hd: 0.5, fa1: 0.05, fa2: 0.1, ba1: -0.05, ba2: 0.08 },
    look: { t: -0.04, hd: -0.12, fa1: 0.1, fa2: 0.25, ba1: -0.06, ba2: 0.12 },
  },
  ropes: [],
  hairBack(g, r, c, R, o) {   // extremely long, straight black hair down past her knees
    const T = (o && o.T) || 0, sw = i => Math.sin(T * 0.05 + i * 0.7) * 0.05 * r * Math.max(0, i - 3);
    polyR(g, r, [[0.62, -0.92], [0.0, -1.24], [-0.82, -1.08], [-1.24, -0.5], [-1.32, 0.6], [-1.3, 2.0], [-1.22, 3.4], [-1.06, 4.9], [-0.7, 5.3], [-0.42, 4.6], [-0.2, 3.2], [0.0, 1.6], [0.2, 0.4], [0.5, -0.2]], c.hair, R, sw);
    if (R.mono) return;
    g.strokeStyle = 'rgba(120,130,190,0.22)'; g.lineWidth = 0.06 * r; g.lineCap = 'round';
    for (const x of [-1.0, -0.72, -0.44]) { g.beginPath(); g.moveTo(x * r, -0.4 * r); g.lineTo((x - 0.06) * r, 4.2 * r); g.stroke(); }
  },
  hairFront(g, r, c, R) {   // blunt straight fringe and long side locks framing her face
    skullHair(g, r, c, R);
    polyR(g, r, [[-0.5, -0.95], [0.3, -1.08], [0.96, -0.72], [1.12, -0.12], [0.2, -0.16], [-0.3, -0.3]], c.hair, R);
    polyR(g, r, [[-0.32, -0.4], [0.16, -0.3], [0.2, 0.8], [0.16, 2.3], [-0.06, 2.5], [-0.14, 0.9], [-0.3, 0.1]], c.hair, R);
    shine(g, r, [[-0.1, -0.86], [0.46, -0.88]], R);
  },
  neckWear(g, sk, p, c, R) { if (!R.mono) { g.strokeStyle = c.collar; g.lineWidth = 2.2; g.beginPath(); g.moveTo(sk.neck[0] - 6, sk.neck[1] + 1); g.lineTo(sk.neck[0] + 7, sk.neck[1] - 1); g.stroke(); } },
  torsoDetail(g, L, bw, c) { g.strokeStyle = 'rgba(80,80,120,0.25)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-2 * bw, -L + 6); g.lineTo(2 * bw, -6); g.moveTo(6 * bw, -L + 8); g.lineTo(8 * bw, -8); g.stroke(); },
  torsoOver(g, L, bw, c, R) { if (!R.mono) { g.fillStyle = c.belt; g.fillRect(-12 * bw, -L * 0.42, 24 * bw, 2.5); } },
  drawSkirt(g, sk, p, c, R, o) {   // a long, plain white dress to the ankles
    const T = (o && o.T) || 0, fl = Math.sin(T * 0.04) * 3, h = sk.hip;
    poly(g, [[h[0] - 14, h[1] - 10], [h[0] - 26 + fl, h[1] + 58], [h[0] - 8 + fl, h[1] + 62], [h[0] + 10 + fl, h[1] + 60], [h[0] + 26 + fl, h[1] + 55], [h[0] + 14, h[1] - 10]], R.mono || c.top, R, 3);
    if (!R.mono) { g.strokeStyle = 'rgba(90,90,140,0.22)'; g.lineWidth = 1.2; for (const x of [-10, 0, 10]) { g.beginPath(); g.moveTo(h[0] + x * 0.6, h[1]); g.lineTo(h[0] + x * 1.5 + fl, h[1] + 58); g.stroke(); } }
  },
};
makeChibi(REMNANT, { build: { arm: 0.9, leg: 1.06, torso: 0.9 }, colors: {} });
REMNANT.faceFn = remFace; REMNANT.scale = 1.06;
REMNANT.drawBoot = (g, K, F, c, R, back) => { limb(g, K, F, 6.4, 4.6, c.leg, R, back); ell(g, F[0] + 4, F[1] + 3, 8, 4, c.boot, R); };
const REM_POSE = {};
const remPose = k => REM_POSE[k] || (REM_POSE[k] = buildPose(REMNANT, k));
// s = { x, y, face, pose, a (alpha), col (0 = pure black silhouette .. 1 = full colour), reveal (0..1 from the top), expr, ropes }
function remDraw(g, s, T) {
  if (!(s.a > 0.01)) return;
  const p = remPose(s.pose || 'stance'), top = s.y - 250, rv = s.reveal ?? 1;
  g.save();
  if (rv < 1) { g.beginPath(); g.rect(s.x - 220, top - 60, 440, 60 + 270 * rv); g.clip(); }
  if (s.col < 1) { g.globalAlpha = s.a * (1 - (s.col || 0) * 0.6); drawFigure(g, REMNANT, p, s.x, s.y, s.face, { mono: '#07060c', T }); }
  if (s.col > 0) { g.globalAlpha = s.a * s.col; drawFigure(g, REMNANT, p, s.x, s.y, s.face, { pal: REMNANT.colors, expr: s.expr || 'normal', T, ropes: s.ropes }); }
  g.restore();
}

// ---------------------------------- art: shadow fragments (NOT her: indistinct, no identity) ----------------------------------
const HFRAG = {
  id: 'fragment', name: 'FRAGMENT', scale: 1.0, noEar: true, colors: { ...HOLLOW.colors },
  stance: { t: 0.2, hd: 0.2, fa1: 0.4, fa2: 0.6, ba1: -0.3, ba2: 0.0, fl1: 0.2, fl2: 0.1, bl1: -0.2, bl2: -0.1 },
  poses: {
    lunge: { t: 0.35, hd: 0.15, fa1: 1.6, fa2: 1.65, ba1: -0.9, ba2: -0.6, fl1: 0.7, fl2: 0.2, bl1: -0.6, bl2: -0.3 },
    rise: { t: -0.1, hd: -0.3, fa1: 0.9, fa2: 1.4, ba1: -0.9, ba2: -0.8, fl1: 0.1, fl2: 0.02, bl1: -0.1, bl2: -0.02 },
    stand: { t: 0.1, hd: 0.3, fa1: 0.2, fa2: 0.3, ba1: -0.2, ba2: 0.0 },
  },
  ropes: [],
  hairBack(g, r, c, R) { polyR(g, r, [[0.7, -0.8], [0.2, -1.4], [-0.4, -1.1], [-1.0, -1.5], [-1.2, -0.6], [-1.6, -0.2], [-1.2, 0.3], [-1.4, 0.9], [-0.6, 0.5]], c.hair, R); },   // a ragged, shapeless mass
  hairFront() {},
};
makeChibi(HFRAG, { colors: {} });
HFRAG.faceFn = () => {}; HFRAG.drawBoot = (g, K, F, c, R, back) => limb(g, K, F, 8, 3, c.leg, R, back);
const HFRAG_POSE = {};
function hfragDraw(g, x, y, face, pose, a, col = '#0d0814', sc = 1) {
  if (!(a > 0.01)) return;
  const p = HFRAG_POSE[pose] || (HFRAG_POSE[pose] = buildPose(HFRAG, pose));
  g.save(); g.globalAlpha = a; drawFigure(g, HFRAG, p, x, y, face, { mono: col, scale: sc });
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * 0.35; drawFigure(g, HFRAG, p, x + rand(-2, 2), y, face, { mono: HV2, scale: sc * 1.03 }); g.restore();
}

// ---------------------------------- psychic fragments / overload ----------------------------------
const HLW_PAL = {};
const hlwLvl = F => F.ovT > 0 ? 3 : (F.frag || 0) >= 70 ? 2 : (F.frag || 0) >= 35 ? 1 : 0;
HOLLOW.palette = F => {
  const lv = hlwLvl(F), key = lv;
  return HLW_PAL[key] || (HLW_PAL[key] = { ...HOLLOW.colors, crack: lv === 3 ? 2.2 : lv, crackCol: lv === 3 ? HVW : HV, accent: lv === 3 ? HVW : HV });
};
function hlwHead(F) { return toWorld(F.x, F.y, F.facing, F.s, F.pose, F.sk, F.sk.head[0], F.sk.head[1]); }
function hlwGain(F, n) {
  if (F.ko || F.exhT > 0 || n <= 0) return;
  if (F.ovT > 0) { F.ovT = Math.min(F.ovMax, F.ovT + n * 1.5); return; }   // during Overload new fragments sustain it
  F.frag = clamp((F.frag || 0) + n, 0, 100); F.fragT = F.T;
}
function hlwOverload(F, dur) {
  F.ovT = F.ovMax = Math.round(dur); F.frag = 100; F.distT = 22;
  const h = hlwHead(F);
  FX.ring(h[0], h[1], HV, 10, 300, 24, 6); FX.ring(F.x, F.y - 100, HVW, 20, 180, 18, 3); FX.flashScreen('#2a1040', 14, 0.45); FX.shakeIt(8);
  FX.wtext(F.x, F.y - 255, 'PSYCHIC OVERLOAD', { size: 36, color: '#ffffff', stroke: '#3a1a6a', life: 64 });
  FX.wtext(F.x, F.y - 218, '— 念・過負荷 —', { size: 22, font: FX_JP(), color: HPALE, stroke: HDK, life: 64 });
  for (let i = 0; i < 30; i++) FX.p({ type: i % 2 ? 'spark' : 'smoke', x: h[0], y: h[1], vx: rand(-5, 5), vy: rand(-5, 3), life: 30, size: rand(2, 9), grow: 0.3, color: i % 2 ? HPALE : 'rgba(20,8,34,0.6)', add: !!(i % 2) });
  Sound.play('psi'); Sound.play('charge');
}
function hlwMark(A, D) {
  D.hlwMarkT = A.ovT > 0 ? 420 : 300; D.hlwMarkBy = A;
  FX.wtext(D.x, D.y - 240, 'OUTLET DETECTED', { size: 22, color: HPALE, stroke: '#2a0a4a', life: 40 });
}
const hlwMarked = (A, D) => D.hlwMarkT > 0 && D.hlwMarkBy === A;
function hlwSealKey(D, not) {
  const ok = k => k && k !== not && D.ch.moves[k] && SEAL_SLOTS.includes(k);
  if (ok(D.lastSpK)) return D.lastSpK;
  if (ok(D.lastSpK2)) return D.lastSpK2;
  return SEAL_SLOTS.find(ok) || null;
}
function hlwSeal(A, D, dur, two) {   // the generic hook: lock the victim's most recently used special slot(s) for a short time
  const k1 = hlwSealKey(D, null), k2 = two ? hlwSealKey(D, k1) : null;
  if (!k1) return;
  D.sealK = k1; D.sealK2 = k2; D.sealT = D.sealMax = Math.round(dur); D.sealBy = A;
  const nm = k => (D.ch.moves[k].name || k).toUpperCase();
  FX.wtext(D.x, D.y - 262, 'SEALED', { size: 34, color: '#ffffff', stroke: '#3a0a6a', life: 50 });
  FX.wtext(D.x, D.y - 228, nm(k1) + (k2 ? ' · ' + nm(k2) : ''), { size: 18, color: HPALE, stroke: HDK, life: 50 });
}
const hlwSealName = (D, k) => k && D.ch.moves[k] ? (D.ch.moves[k].name || k).toUpperCase() : '';
HOLLOW.initFighter = F => {
  F.frag = 0; F.fragT = -999; F.ovT = 0; F.ovMax = HLW_OV; F.exhT = 0; F.distT = 0; F.stepFx = null; F.evaded = false; F.remV = null; F.hurtFx = 0;
  F.remRopes = {};
};
HOLLOW.dmgBonus = F => F.ovT > 0 ? 1.08 : 1;
HOLLOW.onDealDamage = (A, D) => {
  if (A.ko || A.state === 'cine') return;
  hlwGain(A, 1.5);
  if (D.state === 'attack' && D.move && (D.move.special || D.move.ult) && !D.move.counter && A.T - (A.intT ?? -99) > 30) {   // an ability cut off mid-use
    A.intT = A.T; hlwGain(A, 10);
    FX.wtext(D.x, D.y - 250, 'INTERRUPT', { size: 26, color: HPALE, stroke: '#2a0a4a', life: 36 });
    if (A.ovT > 0 && SEAL_SLOTS.includes(D.moveKey) && !(D.sealT > 0)) { D.sealK = D.moveKey; D.sealK2 = null; D.sealT = D.sealMax = 90; D.sealBy = A; }   // Overload: the interrupted ability is briefly sealed too
  }
};
HOLLOW.idlePose = F => { const k = F.T % 520; return k > 380 && k < 460 ? 'tilt' : null; };   // unnaturally still; now and then the empty head tilts
HOLLOW.tick = F => {
  const O = F.opp; if (!O) return;
  const live = BT && BT.phase === 'fight' && !F.ko;
  if (F.hidden && F.state !== 'cine' && !(F.state === 'attack' && F.moveKey === 'counter')) F.hidden = false;
  if (F.distT > 0) F.distT--;
  if (F.ovT > 0) {
    F.ovT--; F.frag = 100 * F.ovT / F.ovMax;
    if (F.ovT === 0) { F.frag = 0; F.exhT = HLW_EXH; FX.wtext(F.x, F.y - 230, 'EXHAUSTED', { size: 22, color: '#a89cc0', stroke: HDK, life: 40 }); FX.ring(F.x, F.y - 110, HV2, 10, 120, 14, 3); }
  } else if (live) {
    if (F.exhT > 0) F.exhT--;
    if (F.T - F.fragT > 300 && F.frag > 0 && F.state !== 'cine') F.frag = Math.max(0, F.frag - 0.06);
    if (F.frag >= 100) hlwOverload(F, HLW_OV);
  }
  if (O.hlwMarkT > 0 && O.hlwMarkBy === F) O.hlwMarkT--;
  // the head: dark particles grow with the fragments inside it
  const lv = hlwLvl(F), h = hlwHead(F);
  const every = [40, 16, 8, 3][lv];
  if (!F.hidden && F.T % every === 0 && F.state !== 'cine') FX.p({ type: lv >= 3 && F.T % 2 ? 'spark' : 'smoke', x: h[0] + rand(-14, 14), y: h[1] + rand(-20, 6), vx: rand(-0.4, 0.4), vy: -rand(0.3, 1.1), life: 34, size: lv >= 3 ? rand(2, 3) : rand(3, 7), grow: 0.25, color: lv >= 3 ? pick([HVW, HV]) : 'rgba(18,8,30,0.55)', add: lv >= 3 });
  // hit reaction: psychic fragments scatter, no facial expression
  if (F.state === 'hit' && F.flash === 6) { for (let i = 0; i < 10; i++) FX.p({ type: i % 3 ? 'smoke' : 'spark', x: h[0] + rand(-12, 12), y: h[1] + rand(-12, 12), vx: rand(-3, 3), vy: rand(-3, 1), life: 22, size: rand(2, 6), grow: 0.2, color: i % 3 ? 'rgba(20,8,34,0.6)' : HV, add: !(i % 3) }); F.hurtFx = 10; }
  if (F.hurtFx > 0) F.hurtFx--;
  // defeat: fragments pour out of his head
  if ((F.state === 'defeat' || (F.ko && F.state === 'knockdown')) && F.T % 3 === 0 && F.sf < 200) FX.p({ type: F.T % 2 ? 'spark' : 'smoke', x: h[0] + rand(-10, 10), y: h[1] + rand(-10, 4), vx: rand(-1.4, 1.4), vy: -rand(0.6, 2), life: 40, size: rand(2, 6), grow: 0.3, color: F.T % 2 ? HPALE : 'rgba(18,8,30,0.6)', add: !!(F.T % 2) });
  // Psychic Step: reward a real evasion
  if (F.state === 'attack' && F.moveKey === 'counter' && F.mf >= 2 && F.mf <= 10 && !F.evaded) {
    const near = (O.state === 'attack' && O.hitActive && Math.abs(O.x - F.x) < 190) || (BT && BT.projs.some(p => p.owner === O && p.active() && Math.abs(p.x - F.x) < 150));
    if (near) { F.evaded = true; hlwGain(F, 8); FX.wtext(F.x, F.y - 230, 'EVADED', { size: 22, color: HPALE, stroke: HDK, life: 30 }); }
  }
};
HOLLOW.drawBehind = (g, F) => {
  const T = F.T, c = BT && BT.cine;
  // the remnant during the ultimate (and the rift she comes through)
  if (c && c.A === F && c.rem) {
    const s = c.rem;
    if (c.rift > 0.01) {
      const rx = s.rx, ry = GROUND - 120, k = c.rift;
      g.save(); g.globalAlpha = k * 0.9; g.fillStyle = '#05030a'; g.beginPath(); g.ellipse(rx, ry, 46 * k + Math.sin(T * 0.3) * 3, 150 * k, 0, 0, TAU); g.fill();
      g.globalCompositeOperation = 'lighter'; g.strokeStyle = HV; g.lineWidth = 3; g.globalAlpha = k * 0.6; g.beginPath(); g.ellipse(rx, ry, 50 * k, 156 * k, 0, 0, TAU); g.stroke();
      g.strokeStyle = HPALE; g.lineWidth = 1.2; g.globalAlpha = k * 0.35; g.beginPath(); g.ellipse(rx, ry, 60 * k + Math.sin(T * 0.2) * 6, 170 * k, 0, 0, TAU); g.stroke(); g.restore();
    }
    remDraw(g, s, T);
    return;
  }
  // victory: for a moment, a faint figure stands behind him
  if (F.state === 'victory' && F.sf < 200) {
    const t = F.sf, a = t < 30 ? 0 : t < 70 ? (t - 30) / 40 : t < 140 ? 1 : Math.max(0, 1 - (t - 140) / 50);
    if (!F.remV) F.remV = { ropes: {} };
    remDraw(g, { x: F.x - F.facing * 34, y: F.y, face: F.facing, pose: t > 100 ? 'lower' : 'look', a: a * 0.5, col: 1, expr: 'normal', ropes: F.remV.ropes }, T);
  }
  // defeat: many faint silhouettes surround him for a moment
  if (F.state === 'defeat' || (F.ko && F.state === 'knockdown')) {
    const t = F.sf, a = t < 20 ? 0 : t < 50 ? (t - 20) / 30 : Math.max(0, 1 - (t - 90) / 60);
    for (let i = 0; i < 4; i++) hfragDraw(g, F.x + [-90, -46, 52, 96][i], F.y + 2, i < 2 ? 1 : -1, 'stand', a * 0.32 * (0.7 + 0.3 * Math.sin(T * 0.1 + i)), '#2a1a40', 0.92);
  }
  // Overload: fragments of other personalities flicker around him
  if (F.ovT > 0 && F.state !== 'cine') {
    for (let i = 0; i < 2; i++) { const ph = (T * 0.02 + i * Math.PI); const a = 0.12 + 0.1 * Math.sin(T * 0.13 + i * 2); hfragDraw(g, F.x + Math.cos(ph) * 54, F.y, Math.cos(ph) > 0 ? -F.facing : F.facing, 'stand', a, '#1a1026', 0.9); }
  }
};
HOLLOW.drawExtra = (g, F) => {
  const O = F.opp, T = F.T, h = hlwHead(F), lv = hlwLvl(F), c = BT && BT.cine;
  // distortion around the head grows with his fragments
  if (lv >= 1 && !F.hidden) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < lv; i++) { g.globalAlpha = (lv >= 3 ? 0.4 : 0.18) - i * 0.04; g.strokeStyle = lv >= 3 ? (i % 2 ? HVW : HV) : HV2; g.lineWidth = lv >= 3 ? 2 : 1.5; g.beginPath(); g.ellipse(h[0] + Math.sin(T * 0.21 + i) * 2, h[1], 34 + i * 9 + Math.sin(T * 0.17 + i * 2) * 4, 30 + i * 8 + Math.cos(T * 0.13 + i) * 4, Math.sin(T * 0.05 + i) * 0.3, 0, TAU); g.stroke(); }
    g.restore();
  }
  if (F.distT > 0 || F.hurtFx > 0) {   // his body briefly distorts (overload burst / getting hit)
    const k = Math.max(F.distT / 22, F.hurtFx / 10);
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.3 * k;
    drawFigure(g, F.ch, F.pose, F.x + rand(-6, 6) * k, F.y, F.facing, { mono: HV }); g.globalAlpha = 0.2 * k; drawFigure(g, F.ch, F.pose, F.x - rand(-6, 6) * k, F.y, F.facing, { mono: HPALE }); g.restore();
  }
  // Outlet Detection: psychic outline, a dark mark on the chest and thin lines back to his head
  if (O && hlwMarked(F, O) && !O.hidden) {
    const ch = O.chestW(), a = Math.min(1, O.hlwMarkT / 30);
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * (0.16 + 0.08 * Math.sin(T * 0.4));
    drawFigure(g, O.ch, O.pose, O.x + Math.sin(T * 0.5) * 2, O.y, O.facing, { mono: HV, scale: 1.04 });
    g.globalAlpha = a * 0.3; g.strokeStyle = HV; g.lineWidth = 1; g.setLineDash([3, 7]); g.lineDashOffset = -T;
    for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(h[0], h[1]); g.quadraticCurveTo((h[0] + ch[0]) / 2, Math.min(h[1], ch[1]) - 40 - i * 20 + Math.sin(T * 0.1 + i) * 8, ch[0], ch[1] - 10 + i * 10); g.stroke(); }
    g.setLineDash([]); g.restore();
    g.save(); g.globalAlpha = a * 0.85; hlwSigil(g, ch[0], ch[1] - 6, 16, T * 0.04, '#140a20', 2.2); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * 0.6; hlwSigil(g, ch[0], ch[1] - 6, 16, T * 0.04, HV, 1); g.restore();
  }
  // Outlet Seal: a closed seal around the victim and the 封 glyph over their head
  if (O && O.sealT > 0 && O.sealBy === F && !O.hidden) {
    const k = O.sealT / (O.sealMax || 1), ch = O.chestW();
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.25 + 0.35 * k; hlwSigil(g, ch[0], ch[1], 34, -T * 0.03, HV, 1.6);
    g.font = `900 24px ${FX_JP()}`; g.textAlign = 'center'; g.fillStyle = HPALE; g.fillText('封', O.x, O.y - 222 * O.s);
    g.strokeStyle = HV; g.lineWidth = 2; g.beginPath(); g.arc(O.x, O.y - 230 * O.s, 17, -Math.PI / 2, -Math.PI / 2 + TAU * k); g.stroke(); g.restore();
  }
  // the remnant's hair during the ultimate: it reaches across the stage and coils around the opponent
  if (c && c.A === F && c.rem && c.hair > 0.01) hlwHair(g, c, T);
  if (F.stepFx) {   // Psychic Step: the distortion left behind
    const s = F.stepFx, k = s.t / 16; s.t--; if (s.t <= 0) F.stepFx = null;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = k * 0.5; g.strokeStyle = HV; g.lineWidth = 2;
    g.beginPath(); g.ellipse(s.x0, s.y - 100, 24 + (1 - k) * 20, 100 * k + 10, 0, 0, TAU); g.stroke(); g.restore();
  }
};
function hlwSigil(g, x, y, R, rot, col, lw = 1.5) {   // the seal symbol: two rings, a broken square and four marks
  g.save(); g.translate(x, y); g.rotate(rot); g.strokeStyle = col; g.lineWidth = lw;
  g.beginPath(); g.arc(0, 0, R, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, R * 0.7, 0.3, TAU - 0.3); g.stroke();
  g.beginPath(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; g.moveTo(Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5); g.lineTo(Math.cos(a + 1.2) * R * 0.5, Math.sin(a + 1.2) * R * 0.5); } g.stroke();
  g.beginPath(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; g.moveTo(Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.86); g.lineTo(Math.cos(a) * R * 1.2, Math.sin(a) * R * 1.2); } g.stroke();
  g.restore();
}
function hlwHair(g, c, T) {   // black hair strands from her head to the victim, then coils that tighten
  const s = c.rem, D = c.D, hx = s.x - s.face * 4, hy = s.y - 150, k = c.hair, ch = D.chestW(), coil = c.coil || 0, tight = c.tight || 0;
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const ty = ch[1] - 70 + i * 18, tx = ch[0] + Math.sin(T * 0.05 + i) * 8, ex = lerp(hx, tx, k), ey = lerp(hy, ty, k);
    const mx = (hx + ex) / 2, my = Math.min(hy, ey) - 60 - (i % 3) * 30 + Math.sin(T * 0.07 + i * 1.3) * 18;
    g.strokeStyle = '#07070c'; g.lineWidth = 4.5 - (i % 3); g.beginPath(); g.moveTo(hx, hy + (i - 4) * 3); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
    g.strokeStyle = 'rgba(130,140,200,0.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(hx, hy + (i - 4) * 3 - 1); g.quadraticCurveTo(mx, my - 1, ex, ey - 1); g.stroke();
  }
  if (coil > 0) {   // coils wrapped around the suspended opponent
    const rw = 46 * (1 - 0.45 * tight), n = 5;
    for (let i = 0; i < n; i++) {
      const y = ch[1] - 80 + i * 32 * (1 - 0.2 * tight), a0 = T * 0.06 + i, span = TAU * coil;
      g.strokeStyle = '#07070c'; g.lineWidth = 5; g.beginPath(); g.ellipse(ch[0], y, rw, 9, 0.12 * Math.sin(i), a0, a0 + span); g.stroke();
      g.strokeStyle = 'rgba(150,160,220,0.3)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(ch[0], y - 1, rw, 9, 0.12 * Math.sin(i), a0, a0 + span * 0.8); g.stroke();
    }
  }
  g.restore();
}
HOLLOW.introFx = F => {
  const h = hlwHead(F);
  FX.ring(h[0], h[1], HV, 10, 160, 26, 3);
  for (let i = 0; i < 18; i++) FX.p({ type: i % 2 ? 'smoke' : 'spark', x: h[0] + rand(-20, 20), y: h[1] + rand(-20, 10), vx: rand(-1, 1), vy: -rand(0.3, 1.2), life: 50, size: rand(2, 7), grow: 0.3, color: i % 2 ? 'rgba(18,8,30,0.6)' : HPALE, add: !(i % 2) });
  FX.wtext(F.x, F.y - 250, '< . . . >', { size: 26, color: HPALE, stroke: HDK, life: 70, vy: -0.3 });   // he doesn't speak: telepathy
  Sound.play('psi');
};

// ---------------------------------- projectiles / effects ----------------------------------
EXTRA_PROJ.psyWave = {   // Psychic Burst: an almost invisible force wave
  update(p) { if (p.t % 2 === 0) FX.p({ type: 'smoke', x: p.x + rand(-20, 20), y: p.y + rand(-50, 50), vx: p.vx * 0.2, vy: rand(-0.4, 0.4), life: 12, size: rand(5, 10), grow: 0.3, color: 'rgba(20,10,34,0.4)', add: false }); },
  draw(g, p) {
    const k = Math.min(1, p.life / 6), d = Math.sign(p.vx) || 1, s = p.sz || 1;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) { g.globalAlpha = k * (0.45 - i * 0.09); g.strokeStyle = i % 2 ? HPALE : HV; g.lineWidth = 3 - i * 0.5; g.beginPath(); g.ellipse(p.x - d * i * 16, p.y, (20 + p.t * 3 + i * 6) * s, (58 + i * 8) * s, 0, d > 0 ? -1.2 : Math.PI - 1.2, d > 0 ? 1.2 : Math.PI + 1.2); g.stroke(); }
    g.restore();
  },
};
EXTRA_PROJ.psyThread = {   // Outlet Detection: a thin psychic line that searches for the outlet
  update(p) { if (p.t % 2 === 0) FX.p({ type: 'spark', x: p.x, y: p.y + rand(-4, 4), vx: -p.vx * 0.1, vy: 0, life: 10, size: 1.6, color: HPALE }); },
  draw(g, p) {
    const F = p.owner, hd = F.handW('f'), k = Math.min(1, p.life / 5);
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.55 * k; g.strokeStyle = HV; g.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(hd[0], hd[1]); g.quadraticCurveTo((hd[0] + p.x) / 2, p.y + Math.sin(p.t * 0.6 + i * 2) * 16, p.x, p.y + (i - 1) * 4); g.stroke(); }
    g.globalAlpha = k; hlwSigil(g, p.x, p.y, 11, p.t * 0.2, HPALE, 1.2); g.restore();
  },
};
EXTRA_PROJ.sealSigil = {   // Outlet Seal: the symbol forms around the target spot (visible warning), then closes
  rect: p => ({ x: p.x - p.w / 2, y: GROUND - p.h, w: p.w, h: p.h }),
  delay(p) { if (p.t % 2 === 0) { const a = rand(0, TAU); FX.p({ type: 'spark', x: p.x + Math.cos(a) * 60, y: p.y + Math.sin(a) * 60, vx: -Math.cos(a) * 3, vy: -Math.sin(a) * 3, life: 14, size: 1.8, color: HV }); } },
  update(p) { if (!p.fired) { p.fired = 1; Sound.play('psi'); FX.ring(p.x, p.y, HV, 70, 10, 10, 3); } },
  draw(g, p) {
    const k = p.delay > 0 ? 1 - p.delay / p.delay0 : 1, close = p.delay > 0 ? 0 : Math.min(1, p.t / 6);
    g.save(); g.globalCompositeOperation = 'lighter';
    g.globalAlpha = p.delay > 0 ? 0.35 + 0.35 * Math.sin(p.t * 0.8) : 0.85 * Math.min(1, p.life / 6);
    hlwSigil(g, p.x, p.y, (70 - 22 * close) * (0.5 + 0.5 * k), p.t * 0.08, HV, 2);
    g.globalAlpha *= 0.5; hlwSigil(g, p.x, GROUND - 4, 60 * k, -p.t * 0.05, HV2, 1.5);
    g.restore();
  },
};
EXTRA_PROJ.fragShade = {   // Fragment Manifestation: an indistinct shadow rises behind him and strikes alongside him
  rect: p => ({ x: p.x - p.w / 2, y: GROUND - p.h, w: p.w, h: p.h }),
  delay(p) { if (p.t % 2 === 0) FX.p({ type: 'smoke', x: p.x + rand(-30, 30), y: GROUND - rand(0, 120), vx: 0, vy: -rand(0.4, 1.2), life: 20, size: rand(8, 14), grow: 0.4, color: 'rgba(16,6,28,0.5)', add: false }); },
  update(p) {
    if (!p.go) { p.go = 1; Sound.play('whoosh'); }
    if (p.t % 2 === 0) FX.p({ type: 'smoke', x: p.x - p.vx * 2, y: GROUND - rand(30, 140), vx: -p.vx * 0.15, vy: -0.3, life: 18, size: rand(8, 14), grow: 0.4, color: 'rgba(16,6,28,0.45)', add: false });
    if (p.life <= 2) for (let i = 0; i < 12; i++) FX.p({ type: i % 3 ? 'smoke' : 'spark', x: p.x + rand(-26, 26), y: GROUND - rand(20, 150), vx: rand(-1, 1), vy: -rand(0.5, 2), life: 24, size: rand(3, 12), grow: 0.4, color: i % 3 ? 'rgba(20,8,34,0.5)' : HV, add: !(i % 3) });
  },
  draw(g, p) {
    const d = Math.sign(p.vx) || p.owner.facing, rise = p.delay > 0 ? 1 - p.delay / p.delay0 : 1, a = Math.min(1, p.life / 8) * (0.35 + 0.55 * rise);
    hfragDraw(g, p.x, GROUND + (1 - rise) * 40, d, p.delay > 0 ? 'rise' : 'lunge', a, '#0d0814', 1.05 * (p.sz || 1));
  },
};
EXTRA_PROJ.stepPulse = { update() {}, draw(g, p) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, p.life / 4) * 0.6; g.strokeStyle = HV; g.lineWidth = 3; g.beginPath(); g.ellipse(p.x, p.y, 30 + p.t * 16, 50 + p.t * 8, 0, 0, TAU); g.stroke(); g.restore(); } };
EXTRA_PROJ.remWave = { update() {}, draw(g, p) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, p.life / 6) * 0.5; g.strokeStyle = HPALE; g.lineWidth = 3; g.beginPath(); g.ellipse(p.x, p.y, 30 + p.t * 22, 40 + p.t * 10, 0, 0, TAU); g.stroke(); g.restore(); } };

// ---------------------------------- moves ----------------------------------
HOLLOW.moves = Object.assign(baseNormals({ dmg: 1.0, spd: 1, rng: 1.06 }), {
  sp1: {
    name: 'PSYCHIC BURST', jp: '念動波', desc: 'Dark particles gather on his upper body, then an almost invisible force wave erupts (~210 px). Reliable, moderate damage, pushes back and interrupts. +8 Fragments (+4 vs a marked foe). Overload: bigger and stronger.', special: 1, lvl: 4,
    poses: ['burst_w', 'burst'], st: 11, act: 1, rec: 18, cd: 45, sfx: 'psi',
    tick(F, f) { if (f < 11 && f % 2 === 0) { const c = F.chestW(); for (let i = 0; i < 2; i++) { const a = rand(0, TAU), d = rand(30, 60); FX.p({ type: 'smoke', x: c[0] + Math.cos(a) * d, y: c[1] + Math.sin(a) * d, vx: -Math.cos(a) * 3, vy: -Math.sin(a) * 3, life: 10, size: rand(3, 6), grow: 0.1, color: 'rgba(18,8,30,0.6)', add: false }); } } },
    spawn: { f: 11, fn(F) {
      const ov = F.ovT > 0;
      BT.spawn({ owner: F, kind: 'psyWave', x: F.x + F.facing * 62, y: F.y - 108, vx: F.facing * 9, w: ov ? 140 : 110, h: ov ? 150 : 130, life: ov ? 12 : 10, sz: ov ? 1.3 : 1, hits: 1, clash: 0,
        dmg: ov ? 68 : 56, hs: 20, bs: 12, kb: 7.5, str: 2, color: HV, srcKey: 'sp1', projOnHit: 1,
        onHit(A, D) { const mk = hlwMarked(A, D); hlwGain(A, mk ? 12 : 8); FX.ring(D.x, D.y - 110, HV, 10, 90, 12, 3); } });
      FX.ring(F.x + F.facing * 50, F.y - 108, 'rgba(185,150,255,0.6)', 10, 70, 10, 3); FX.shakeIt(2);
    } },
  },
  sp1f: {
    name: 'OUTLET DETECTION', jp: '出口探知', desc: 'He points, and a thin psychic line searches for the opponent\'s inner connection (~400 px). Low damage, blockable. On hit: MARKED for 5 s — Burst gains more, the Seal reaches further and lasts longer. Overload: faster line, 7 s mark.', special: 1, lvl: 4,
    poses: ['point_w', 'point'], st: 10, act: 1, rec: 18, cd: 90, sfx: 'chime',
    spawn: { f: 10, fn(F) {
      const ov = F.ovT > 0;
      BT.spawn({ owner: F, kind: 'psyThread', x: F.x + F.facing * 50, y: F.y - 140, vx: F.facing * (ov ? 30 : 20), w: 50, h: 40, life: ov ? 14 : 20, hits: 1, clash: 0,
        dmg: 14, hs: 16, bs: 8, kb: 1, str: 1, color: HV, srcKey: 'sp1f', projOnHit: 1,
        onHit(A, D) { hlwMark(A, D); hlwGain(A, 6); } });
    } },
  },
  counter: {
    name: 'PSYCHIC STEP', jp: '念歩', desc: 'He collapses into dark particles and reappears ~190 px forward (stops in front of the opponent) or ~200 px back (hold ←). Short invulnerability only, 100 f cooldown. Dodging a live attack this way: +8 Fragments. Overload: a shockwave on arrival.', special: 1, lvl: 4,
    poses: ['step', 'step'], st: 7, act: 1, rec: 12, cd: 100, invuln: [2, 10], pass: 10, sfx: 'teleport',
    tick(F, f, O) {
      F.vx = 0;
      if (f === 1) { F.evaded = false; F.stepBack = F.input.fwd < 0; const h = hlwHead(F); for (let i = 0; i < 14; i++) FX.p({ type: 'smoke', x: F.x + rand(-24, 24), y: F.y - rand(10, 190), vx: rand(-1, 1), vy: -rand(0.2, 1), life: 18, size: rand(5, 10), grow: 0.3, color: 'rgba(16,6,28,0.6)', add: false }); FX.ring(h[0], h[1], HV, 30, 4, 8, 2); }
      if (f === 3) { F.hidden = true; F.stepX0 = F.x; }
      if (f === 7) {
        let x;
        if (F.stepBack) x = F.x - F.facing * 200;
        else { x = F.x + F.facing * 190; if (Math.sign(O.x - F.x) === F.facing && Math.abs(O.x - F.x) < 260) x = O.x - F.facing * 72; }
        F.x = clamp(x, 60, STAGE_W - 60); F.hidden = false;
        F.stepFx = { x0: F.stepX0, y: F.y, t: 16 };
        FX.ring(F.x, F.y - 100, HV, 6, 90, 12, 3); FX.ring(F.x, GROUND - 2, HV2, 10, 70, 12, 2, 0.25);
        for (let i = 0; i < 8; i++) FX.p({ type: 'spark', x: F.x + rand(-26, 26), y: F.y - rand(20, 180), vx: 0, vy: -rand(0.5, 1.5), life: 18, size: 2, color: HPALE });
        if (F.ovT > 0) { F.cd.counter = 60; BT.spawn({ owner: F, kind: 'stepPulse', x: F.x + F.facing * 30, y: F.y - 100, vx: F.facing * 0.001, w: 150, h: 130, life: 5, hits: 1, clash: 0, dmg: 30, hs: 18, bs: 10, kb: 5, str: 2, color: HV, srcKey: 'counter', projOnHit: 1, onHit(A) { hlwGain(A, 3); } }); }
      }
    },
  },
  sp2: {
    name: 'OUTLET SEAL', jp: '出口封印', desc: 'Signature. He raises a hand and the seal symbol forms where the opponent stands (~300 px, 420 vs marked) — a clear 20 f warning. If it catches them, thin lines bind them and the seal closes: their LAST USED special is locked for 2.5 s (3.5 s if marked). Overload: two specials. +22 Fragments.', special: 1, lvl: 4,
    poses: ['seal_w', 'seal'], st: 20, act: 1, rec: 24, cd: 330, sfx: 'chime',
    tick(F, f) { if (f < 20 && f % 3 === 0) { const h = F.handW('f'); FX.p({ type: 'spark', x: h[0] + rand(-14, 14), y: h[1] + rand(-14, 14), vx: 0, vy: -0.4, life: 12, size: 2, color: HV }); } },
    spawn: { f: 8, fn(F) {
      const O = F.opp, mk = hlwMarked(F, O), range = mk ? 420 : 300, dx = O.x - F.x;
      const d = Math.sign(dx) === F.facing ? clamp(Math.abs(dx), 80, range) : 200;
      BT.spawn({ owner: F, kind: 'sealSigil', x: F.x + F.facing * d, y: F.y - 100, vx: F.facing * 0.001, w: 120, h: 190, delay: 12, delay0: 12, life: 12, hits: 1, clash: 0,
        dmg: 42, hs: 38, bs: 14, kb: 0.5, str: 3, color: HV, srcKey: 'sp2', projOnHit: 1,
        onHit(A, D) {
          const mk2 = hlwMarked(A, D), ov = A.ovT > 0;
          D.vx = 0; hlwSeal(A, D, (mk2 ? 210 : 150) + (ov ? 60 : 0), ov);
          if (mk2) D.hlwMarkT = 0;   // the mark is consumed by the seal
          hlwGain(A, 22); A.sealFxT = 26; A.sealFxX = D.x;
          FX.ring(D.x, D.y - 100, HV, 120, 20, 18, 4); FX.flashScreen('#1a0a30', 6, 0.3); Sound.play('crush');
        } });
    } },
  },
  sp2f: {
    name: 'FRAGMENT MANIFESTATION', jp: '断片顕現', desc: 'His head distorts and a faceless shadow — one of the weaker fragments he keeps — rises behind him (visible), then lunges forward with him: 2 hits, the second launches. Blockable; he is open while it acts. Overload: a second fragment follows.', special: 1, lvl: 4,
    poses: ['manifest_w', 'manifest'], st: 14, act: 1, rec: 30, cd: 300, sfx: 'energy',
    tick(F, f) { if (f === 2) { F.distT = 14; } },
    spawn: { f: 8, fn(F) {
      const mk = (x, dl, sz) => BT.spawn({ owner: F, kind: 'fragShade', x: clamp(x, 40, STAGE_W - 40), y: GROUND - 80, vx: F.facing * 21, w: 84, h: 150, delay: dl, delay0: dl, life: 15, hits: 2, interval: 8, clash: 0, sz,
        dmg: 30, hs: 22, bs: 12, kb: 2, str: 2, color: HV, srcKey: 'sp2f', projOnHit: 1, final: { dmg: 50, launch: -10, kb: 5, hs: 30, str: 3 },
        onHit(A, D) { hlwGain(A, 6); FX.burst(D.x, D.y - 110, HV2, 10, 6); } });
      mk(F.x - F.facing * 10, 8, 1);
      if (F.ovT > 0) mk(F.x - F.facing * 50, 24, 0.9);
    } },
  },
  sp2d: {
    name: 'PSYCHIC OVERLOAD', jp: '念・過負荷', desc: 'Needs 40 Fragments. He releases what is stored in his head: 4–7 s of Overload (longer the more he had). Stronger Burst, faster Detection, Step shockwave, double Seal, two Fragments, +8% damage; new fragments sustain it. Afterwards 3 s of exhaustion (no gain).', special: 1, lvl: 4,
    poses: ['overload', 'overload'], st: 16, act: 1, rec: 14, cd: 600, invuln: [1, 16], sfx: 'charge',
    req: F => !(F.ovT > 0) && !(F.exhT > 0) && (F.frag || 0) >= 40,
    tick(F, f) {
      if (f < 16 && f % 2 === 0) { const h = hlwHead(F); FX.p({ type: 'spark', x: h[0] + rand(-30, 30), y: h[1] + rand(-30, 30), vx: 0, vy: 0, life: 10, size: 2, color: HPALE }); }
      if (f === 16) hlwOverload(F, 240 + Math.max(0, (F.frag || 0) - 40) * 3);
    },
  },
  ult: {
    name: 'THE LAST REMNANT', jp: '最後の残影', desc: 'Ultimate. Everything becomes still; a psychic wave (wide, ~300 px) leaves him. On hit, the most precious fragment inside him — almost the entire psyche of his late wife — steps out of his shadow, binds the opponent with her endless black hair and draws the energy out of them, before he releases one enormous psychic burst.', ult: 1, lvl: 6, cost: 100,
    poses: ['burst_w', 'release'], st: 14, act: 8, rec: 36, dmg: 20, hs: 40, bs: 20, kb: 1, hb: { x: 0, y: -220, w: 300, h: 220 }, invuln: [0, 18], str: 3,
    tick(F, f) { if (f === 14) { BT.spawn({ owner: F, kind: 'remWave', x: F.x + F.facing * 40, y: F.y - 110, vx: F.facing * 0.001, w: 1, h: 1, life: 12, harmless: true, clash: 0 }); FX.ring(F.x, F.y - 110, HV, 20, 300, 16, 4, 0.4); } },
    onHit(F, D) { BT.startCine(F, D, CINE.hollow, { zoom: 1.25 }); return true; },
  },
});
(() => {
  const M = HOLLOW.moves;
  Object.assign(M.L, { name: 'Psychic Tap' });
  Object.assign(M.M, { name: 'Quiet Push' });
  Object.assign(M.H, { name: 'MIND PRESS', poses: ['burst_w', 'point'], hb: { x: 18, y: -176, w: 100, h: 56 }, onHit(A, D) { FX.ring(D.x, D.y - 110, HV, 10, 70, 10, 3); hlwGain(A, 2); } });
  Object.assign(M.cH, { name: 'Undertow' });
  Object.assign(M.LH, { name: 'Lifting Thought', poses: ['upper_w', 'upper'] });
  Object.assign(M.FF, { name: 'Drift' });
  Object.assign(M.jH, { name: 'Falling Weight' });
})();
// CPU hints: Burst and Seal are short-range psychic attacks, not zoning projectiles
HOLLOW.moves.sp1.__ai = { reach: 210, kind: 'melee', anti: false, st: 12, low: false, over: false };
HOLLOW.moves.sp2.__ai = { reach: 300, kind: 'melee', anti: false, st: 22, low: false, over: false };
HOLLOW.moves.sp2f.__ai = { reach: 260, kind: 'melee', anti: false, st: 20, low: false, over: false };
HOLLOW.combos = [
  { name: 'Mind Pressure', notation: 'M → H (Mind Press) → SP1 (Psychic Burst)', seq: ['M', 'H', 'sp1'] },
  { name: 'Read the Outlet', notation: 'M → H → ↓→SP1 (Outlet Detection)', seq: ['M', 'H', 'sp1f'] },
  { name: 'Seal the Outlet', notation: 'M → H → SP2 (Outlet Seal)', seq: ['M', 'H', 'sp2'] },
  { name: 'Someone Else\'s Hands', notation: 'M → H → ↓→SP2 (Fragment Manifestation)', seq: ['M', 'H', 'sp2f'] },
  { name: 'The Last Remnant', notation: 'M → H → SP1+SP2 (Ultimate)', seq: ['M', 'H', 'ult'], meter: 1 },
];
HOLLOW.applyTrial = (A, tr) => { if (!tr) return; if (tr.meter) A.meter = 100; if (tr.authority) { A.frag = Math.min(99, tr.authority); A.fragT = A.T + 9999; } };

// ---------------------------------- cinematic: THE LAST REMNANT ----------------------------------
CINE.hollow = function (A, D, f, c) {
  const dir = A.facing;
  if (f === 1) {
    const dx = clamp(Math.abs(D.x - A.x), 170, 250); D.x = clamp(A.x + dir * dx, 120, STAGE_W - 120);
    if (Math.abs(D.x - A.x) < 150) { A.x = clamp(D.x - dir * 170, 80, STAGE_W - 80); }
    D.y = GROUND; D.forcePose = 'hit'; A.forcePose = 'stance';
    c.zoom = 1.25; c.camX = A.x; c.camY = GROUND - 150; c.bg = HOLLOW.cineBg; c.fg = HOLLOW.cineFg;
    c.rift = 0; c.hair = 0; c.coil = 0; c.tight = 0; c.drain = 0; c.voidK = 0; c.white = 0; c.glitch = 0; c.still = 0;
    c.rem = { x: A.x - dir * 52, rx: A.x - dir * 52, y: GROUND, face: dir, pose: 'stance', a: 0, col: 0, reveal: 0, expr: 'normal', ropes: A.remRopes || (A.remRopes = {}) };
    c.motes = []; for (let i = 0; i < 70; i++) c.motes.push([Math.random() * W, Math.random() * H, Math.random() * 0.6 + 0.2, Math.random() < 0.5]);
    FX.darkTarget = 0.6;
  }
  const R = c.rem;
  // --- Phase 1: THE SILENCE — he stops, the world darkens and goes still, particles leave his head ---
  if (f <= 48) { const k = easeOut(f / 48); c.zoom = lerp(1.25, 1.95, k); c.camX = A.x; c.camY = lerp(GROUND - 150, A.y - 175, k); c.still = k; }
  if (f >= 4 && f < 70 && f % 2 === 0) { const h = hlwHead(A); FX.p({ type: f % 4 ? 'smoke' : 'spark', x: h[0] + rand(-12, 12), y: h[1] + rand(-14, 4), vx: rand(-0.6, 0.6), vy: -rand(0.4, 1.4), life: 40, size: f % 4 ? rand(4, 9) : 2, grow: 0.3, color: f % 4 ? 'rgba(14,6,24,0.65)' : HPALE, add: !(f % 4) }); }
  if (f === 18) Sound.play('heart');
  if (f === 32) { c.glitch = 1; Sound.play('psi'); }
  if (f === 44) Sound.play('heart');
  // --- Phase 2: HER APPEARANCE — a rift opens in his shadow; her hair first, then her pale face and body ---
  if (f >= 40 && f <= 70) c.rift = easeOut((f - 40) / 30);
  if (f >= 48 && f < 110) { const k = easeOut((f - 48) / 62); c.zoom = lerp(1.95, 1.7, k); c.camX = lerp(A.x, A.x - dir * 30, k); c.camY = lerp(A.y - 175, GROUND - 165, k); }
  if (f >= 52 && f <= 80) { R.a = (f - 52) / 28; R.reveal = 0.35 + 0.65 * (f - 52) / 28; }   // a black silhouette — mostly hair — seeps out of the dark
  if (f >= 74 && f <= 104) R.col = (f - 74) / 30;                                         // …and becomes a woman
  if (f === 60) Sound.play('hiss');
  if (f >= 90) c.rift = Math.max(0, c.rift - 0.04);
  if (f === 100) { R.pose = 'shoulder'; Sound.play('chime'); }                          // she gently rests one hand on his shoulder
  if (f === 102) FX.wtext(R.x, R.y - 280, '< . . . >', { size: 22, color: HPALE, stroke: HDK, life: 40, vy: -0.2 });
  // --- Phase 3: THE ATTACK — she turns to the opponent; her hair crosses the stage and binds them in the air ---
  if (f === 126) { R.pose = 'look'; Sound.play('whoosh'); }
  if (f >= 128 && f <= 148) c.hair = easeOut((f - 128) / 20);
  if (f >= 128 && f < 160) { const k = easeOut((f - 128) / 32); c.zoom = lerp(1.7, 1.1, k); c.camX = lerp(A.x - dir * 30, (A.x + D.x) / 2, k); c.camY = lerp(GROUND - 160, GROUND - 175, k); }
  if (f >= 142 && f <= 164) c.coil = (f - 142) / 22;
  if (f === 146) { Sound.play('grab'); FX.shakeIt(4); }
  if (f >= 146 && f <= 238) { const k = Math.min(1, (f - 146) / 18); D.forcePose = 'airhit'; D.y = GROUND - 74 * k - Math.sin(f * 0.07) * 3; }
  if (f >= 150 && f <= 174) { const k = easeOut((f - 150) / 24); R.pose = 'glide'; R.x = lerp(A.x - dir * 52, D.x - dir * 66, k); R.y = GROUND - 8 * k; }   // she approaches, gliding
  if (f >= 156) c.voidK = Math.min(1, (f - 156) / 26);
  if (f === 176) { R.pose = 'reach'; Sound.play('drain'); }                               // her hand on their forehead
  if (f >= 176 && f <= 208) c.drain = Math.min(1, (f - 176) / 12);
  if (f >= 178 && f <= 206 && f % 2 === 0) { const ch = D.chestW(), hd = [R.x + dir * 34, R.y - 168]; for (let i = 0; i < 2; i++) FX.p({ type: 'spark', x: ch[0] + rand(-30, 30), y: ch[1] + rand(-50, 40), vx: (hd[0] - ch[0]) / 16, vy: (hd[1] - ch[1]) / 16, life: 16, size: rand(1.5, 3), color: i ? HDK : HVW, add: !i }); }
  if (f >= 178 && f <= 208 && f % 6 === 4) { BT.scriptHit(A, D, 10, { str: 1, sfx: 'psi' }); D.flash = 3; FX.shakeIt(3); c.tight = Math.min(0.5, c.tight + 0.08); }
  if (f >= 168 && f < 210) { c.zoom = lerp(c.zoom, 1.3, 0.05); c.camX = lerp(c.camX, D.x - dir * 30, 0.06); c.camY = lerp(c.camY, D.y - 130, 0.06); }
  // --- Phase 4: THE FINISHER — she withdraws, looks back at him; he releases everything ---
  if (f === 210) { R.pose = 'stance'; c.drain = 0; }
  if (f === 214) { R.face = -dir; R.pose = 'look'; }                                       // for a moment she looks toward him
  if (f >= 210 && f < 232) { c.zoom = lerp(c.zoom, 1.0, 0.1); c.camX = lerp(c.camX, (A.x + D.x) / 2, 0.1); c.camY = lerp(c.camY, GROUND - 160, 0.1); }
  if (f === 222) { A.forcePose = 'release'; Sound.play('charge'); A.distT = 22; }
  if (f >= 222 && f <= 238) { c.tight = 0.5 + 0.5 * (f - 222) / 16; if (f % 2 === 0) { const ch = D.chestW(); FX.ring(ch[0], ch[1], f % 4 ? HV : '#07070c', 160 - (f - 222) * 8, 10, 8, 3); } }   // implosion
  if (f === 238) {
    BT.scriptHit(A, D, 160, { str: 4 }); c.white = 1;
    FX.impactFrame(6); FX.shakeIt(30); Sound.play('explosion'); Sound.play('impactBig'); FX.flashScreen('#ffffff', 22, 0.95);
    const ch = D.chestW(); FX.ring(ch[0], ch[1], HVW, 10, 480, 26, 10); FX.ring(ch[0], ch[1], HV, 10, 320, 22, 6); FX.ring(ch[0], ch[1], '#07070c', 10, 220, 18, 5);
    for (let i = 0; i < 56; i++) FX.p({ type: i % 3 ? 'spark' : 'smoke', x: ch[0], y: ch[1], vx: rand(-14, 14), vy: rand(-12, 8), grav: 0.12, life: 50, size: rand(2, 6), grow: 0.1, color: pick([HV, HVW, HPALE, 'rgba(10,6,18,0.7)']), add: !!(i % 3) });
    FX.wtext(D.x, D.y - 270, '最後の残影', { size: 64, font: FX_JP(), color: '#ffffff', stroke: '#2a0a4a', life: 64, vy: -0.3 });
  }
  if (f === 240) { BT.release(D, dir * 9, -10); c.hair = 0; c.coil = 0; R.x = A.x - dir * 52; R.y = GROUND; R.face = dir; R.pose = 'lower'; A.forcePose = 'stance'; }   // under the white flash she is back in his shadow
  if (f > 238) c.white = Math.max(0, 1 - (f - 238) / 22);
  // --- Phase 5: AFTERMATH — the world returns; she lingers, lowers her head and dissolves back into him ---
  if (f >= 244) c.voidK = Math.max(0, c.voidK - 0.05);
  if (f >= 244 && f < 290) { c.zoom = lerp(c.zoom, 1.6, 0.05); c.camX = lerp(c.camX, A.x - dir * 20, 0.06); c.camY = lerp(c.camY, GROUND - 150, 0.06); }
  if (f === 252) FX.darkTarget = 0.35;
  if (f === 262) R.expr = 'closed';
  if (f >= 276 && f <= 304) {
    R.a = 1 - (f - 276) / 28;
    if (f % 2 === 0) { const h = hlwHead(A); for (let i = 0; i < 3; i++) { const x = R.x + rand(-26, 26), y = R.y - rand(20, 230); FX.p({ type: i ? 'smoke' : 'spark', x, y, vx: (h[0] - x) / 24, vy: (h[1] - y) / 24, life: 24, size: i ? rand(4, 8) : 2, grow: 0.1, color: i ? 'rgba(12,6,20,0.6)' : HPALE, add: !i }); } }
  }
  if (f === 278) Sound.play('hiss');
  if (f >= 300) { c.zoom = lerp(c.zoom, 1.0, 0.12); c.camX = lerp(c.camX, (A.x + D.x) / 2, 0.12); }
  if (f === 314) { R.a = 0; hlwGain(A, 15); FX.darkTarget = 0; return true; }
};
HOLLOW.cineBg = (g, c) => {   // screen space: the battlefield loses its normal appearance
  const k = c.voidK || 0, s = (c.still || 0) * (1 - k);
  if (s > 0.01) { g.save(); g.fillStyle = `rgba(6,4,12,${0.35 * s})`; g.fillRect(0, 0, W, H); g.restore(); }
  if (k <= 0.01) return;
  g.save();
  g.globalAlpha = k; const gr = g.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, W * 0.7); gr.addColorStop(0, '#2a2236'); gr.addColorStop(0.55, '#120c1c'); gr.addColorStop(1, '#030206');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // pale, falling motes and dark ones rising: memory and its shadow
  for (const m of c.motes) {
    const y = m[3] ? (m[1] + c.f * m[2]) % H : (m[1] - c.f * m[2] + H * 4) % H;
    g.globalAlpha = k * (m[3] ? 0.5 : 0.35); g.fillStyle = m[3] ? '#d8d0ec' : '#000000'; g.fillRect(m[0], y, m[3] ? 2 : 4, m[3] ? 2 : 4);
  }
  g.globalAlpha = k * 0.12; g.strokeStyle = '#cfc4ff'; g.lineWidth = 1;
  for (let i = 0; i < 9; i++) { const x = (i * 157 + c.f * 0.4) % W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x - 40, H); g.stroke(); }
  g.restore();
};
HOLLOW.cineFg = (g, c) => {   // screen space over everything: distortion bands, vignette and the white-out
  const f = c.f;
  if (c.glitch > 0) {
    g.save(); g.globalAlpha = c.glitch * 0.35; g.fillStyle = '#cbb8ff';
    for (let i = 0; i < 5; i++) g.fillRect(0, (f * 53 + i * 151) % H, W, 2 + (i % 3) * 2);
    g.restore(); c.glitch = Math.max(0, c.glitch - 0.06);
  }
  const v = Math.max(c.still || 0, c.voidK || 0) * (1 - (c.white || 0));
  if (v > 0.01) { g.save(); const gr = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.75); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${0.7 * v})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); }
  if (c.drain > 0 && c.D) {   // the opponent's silhouette distorts as their energy is drawn out
    const [tx, ty] = BT.cam.toScreen(c.D.x, c.D.y - 110 * c.D.s);
    g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(tx, ty, 0, tx, ty, 140); gr.addColorStop(0, `rgba(235,228,255,${0.4 * c.drain})`); gr.addColorStop(1, 'rgba(120,80,200,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(tx, ty, 140, 0, TAU); g.fill();
    if (f % 4 < 2) { g.globalAlpha = 0.3 * c.drain; g.fillStyle = '#b99cff'; for (let i = 0; i < 3; i++) g.fillRect(tx - 120, ty - 90 + ((f * 23 + i * 61) % 180), 240, 2); }
    g.restore();
  }
  if (c.white > 0) { g.save(); g.fillStyle = `rgba(250,248,255,${c.white * 0.92})`; g.fillRect(0, 0, W, H); g.restore(); }
};

// ---------------------------------- HUD + how-to ----------------------------------
HOLLOW.drawHand = (g, F, side, t) => {
  const ov = F.ovT > 0, exh = F.exhT > 0;
  xpPanel(g, F, side, t, {
    col: ov ? HVW : exh ? '#6a6080' : HV, col2: '#ffffff', icon: '念', flash: ov,
    title: ov ? 'PSYCHIC OVERLOAD' : exh ? 'EXHAUSTED' : 'PSYCHIC FRAGMENTS',
    sub: ov ? '念・過負荷 · STRONGER BURST · DOUBLE SEAL · TWO FRAGMENTS · +8%' : exh ? 'the fragments are quiet… no gain for a moment' : '念片 · burst, detect, seal, interrupt, evade · OVERLOAD 40+',
    k: (F.frag || 0) / 100, label: ov ? `${(F.ovT / 60).toFixed(1)}s` : `${Math.floor(F.frag || 0)}%`, marks: [0.4],
    badges: [['sp1', 'S1|BURST'], ['sp1f', '↓→S1|DETECT'], ['counter', '↓←S1|STEP'], ['sp2', 'S2|SEAL'], ['sp2f', '↓→S2|FRAGMENT'], ['sp2d', '↓↓S2|OVERLOAD']],
  });
  // the opponent's status, shown on THEIR side of the screen: Marked / Sealed (which ability, how long)
  const O = F.opp; if (!O) return;
  const sealed = O.sealT > 0 && O.sealBy === F, marked = hlwMarked(F, O);
  if (!sealed && !marked) return;
  const pw = 330, x0 = side > 0 ? W - 40 - pw : 40, y0 = 528;
  g.save(); g.fillStyle = 'rgba(14,8,22,0.88)'; g.fillRect(x0, y0, pw, 26); g.strokeStyle = HV; g.lineWidth = 1.4; g.strokeRect(x0, y0, pw, 26);
  g.textBaseline = 'middle'; g.textAlign = 'left'; g.font = `900 12px ${FONT_UI}`;
  if (sealed) {
    const k = O.sealT / (O.sealMax || 1);
    g.fillStyle = 'rgba(185,150,255,0.25)'; g.fillRect(x0, y0, pw * k, 26);
    g.fillStyle = '#ffffff'; g.fillText(`封 SEALED: ${hlwSealName(O, O.sealK)}${O.sealK2 ? ' · ' + hlwSealName(O, O.sealK2) : ''}`, x0 + 8, y0 + 13.5);
    g.textAlign = 'right'; g.fillStyle = HPALE; g.fillText(`${(O.sealT / 60).toFixed(1)}s`, x0 + pw - 8, y0 + 13.5);
  } else {
    g.fillStyle = HPALE; g.fillText(`◎ OUTLET MARKED  ·  ${(O.hlwMarkT / 60).toFixed(1)}s`, x0 + 8, y0 + 13.5);
  }
  g.textBaseline = 'alphabetic'; g.restore();
};
HOLLOW.howTo = {
  title: 'THE HOLLOW',
  draw(g) {
    xpHowTo(g, 'THE HOLLOW — THE PSYCHIC SEALER', HV, [
      ['FRAGMENTS', 'Burst +8, Detection +6, Seal +22, Fragment hits +6, interrupting a special +10, dodging with Step +8. Fades when idle.'],
      ['OVERLOAD', 'At 100, or ↓↓SP2 with 40+: 4–7 s — stronger Burst, double Seal, two Fragments, Step shockwave, +8%. Then 3 s exhausted.'],
      ['SP1', 'Psychic Burst — short force wave (~210 px): moderate damage, pushback, interrupts. His reliable tool.'],
      ['↓→ SP1', 'Outlet Detection — a thin psychic line (~400 px). On hit the foe is MARKED for 5 s (outline + lines on them).'],
      ['↓← SP1', 'Psychic Step — vanish and reappear ~190 px ahead (stops before the foe) or back (hold ←). Short invuln, 100 f cd.'],
      ['SP2', 'Outlet Seal — the seal forms where they stand (20 f warning). On hit: their LAST USED special is locked 2.5 s (marked: 3.5 s).'],
      ['↓→ SP2', 'Fragment Manifestation — a faceless shadow rises behind him and lunges: 2 hits, launches. He is open while it acts.'],
      ['↓↓ SP2', 'Psychic Overload — needs 40 Fragments. Duration grows with what he had stored.'],
    ], 'He never speaks. Mark them, watch which ability they lean on, then seal exactly that one — the sealed slot is shown on their side of the HUD and above their head. Ultimate (SP1+SP2): THE LAST REMNANT.');
  },
};

CHARS.push(HOLLOW);
finalizeMoves(HOLLOW);
