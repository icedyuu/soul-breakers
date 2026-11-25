// ============================ THE BLOOD SAINT — VESPERA ============================
// Vampire / lifesteal / aggressive close-range fighter, built on the shared chibi kit (04_zz_chibi.js).
// Systems: LIFESTEAL on every hit · BLOOD gauge (fills on hits, drains when passive) → BLOOD FRENZY ·
//          BLEED stacks on the opponent (damage over time) cashed in by HEMORRHAGE.
const SAINT_FRENZY_T = 420, SAINT_BLEED_T = 300, SAINT_BLEED_MAX = 5;

// ---------------------------------- art ----------------------------------
function saintEye(g, x, y, w, h, c, o, far) {
  const glow = o.glow, iris = glow ? '#ff5a70' : c.eye;
  // crimson eyeshadow
  g.fillStyle = 'rgba(170,10,40,0.16)'; g.beginPath(); g.ellipse(x, y - h * 0.78, w * 1.2, h * 0.3, 0, 0, TAU); g.fill();
  g.fillStyle = '#fdf7f8'; g.beginPath(); g.ellipse(x, y, w, h, 0, 0, TAU); g.fill();
  const gr = g.createLinearGradient(0, y - h, 0, y + h); gr.addColorStop(0, c.eye2); gr.addColorStop(0.5, iris); gr.addColorStop(1, '#ffd0d8');
  if (glow) { g.shadowColor = '#ff1f3d'; g.shadowBlur = 10; }
  g.fillStyle = gr; g.beginPath(); g.ellipse(x + w * 0.06, y + h * 0.06, w * 0.86, h * 0.9, 0, 0, TAU); g.fill(); g.shadowBlur = 0;
  // vertical slit pupil
  g.fillStyle = 'rgba(20,0,6,0.92)'; g.beginPath(); g.ellipse(x + w * 0.1, y + h * 0.04, w * 0.16, h * 0.5, 0, 0, TAU); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x - w * 0.34, y - h * 0.12, w * 0.3, h * 0.2, -0.3, 0, TAU); g.fill();
  g.beginPath(); g.arc(x + w * 0.42, y + h * 0.5, w * 0.15, 0, TAU); g.fill();
  // heavy, half-lowered lid: the smug, slightly sadistic look
  // slightly lowered, slanted lid (lower toward the inner corner): confident, a little cruel
  g.fillStyle = c.skin; g.beginPath(); g.moveTo(x - w * 1.3, y - h * 1.2); g.lineTo(x + w * 1.3, y - h * 1.2); g.lineTo(x + w * 1.2, y - h * 0.6); g.quadraticCurveTo(x, y - h * 0.78, x - w * 1.2, y - h * 0.86); g.closePath(); g.fill();
  g.strokeStyle = OUTLINE; g.lineCap = 'round'; g.lineWidth = Math.max(1.7, h * 0.24);
  g.beginPath(); g.moveTo(x - w * 1.15, y - h * 0.84); g.quadraticCurveTo(x, y - h * 0.8, x + w * 1.1, y - h * 0.58); g.stroke();
  if (!far) { g.lineWidth = Math.max(1.2, h * 0.14); g.beginPath(); g.moveTo(x - w * 1.0, y - h * 0.84); g.lineTo(x - w * 1.6, y - h * 1.1); g.moveTo(x - w * 0.5, y - h * 0.84); g.lineTo(x - w * 0.85, y - h * 1.12); g.stroke(); }
}
function saintFace(g, r, c, o) {
  const e = o.expr || 'normal';
  if (e === 'hurt' || e === 'ko' || e === 'closed') { chibiFace(g, r, c, o); return; }
  const ex = 0.5 * r, ey = 0.25 * r, fx = 0.94 * r;
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  g.fillStyle = 'rgba(255,90,130,0.2)'; g.beginPath(); g.ellipse(0.34 * r, 0.58 * r, 0.14 * r, 0.055 * r, 0, 0, TAU); g.fill();
  saintEye(g, fx, ey - 0.01 * r, 0.075 * r, 0.3 * r, c, o, true);
  saintEye(g, ex, ey, 0.23 * r, 0.36 * r, c, o, false);
  // beauty mark
  g.fillStyle = OUTLINE; g.beginPath(); g.arc(0.66 * r, 0.6 * r, 0.025 * r, 0, TAU); g.fill();
  const mx = 0.72 * r, my = 0.74 * r; g.strokeStyle = OUTLINE; g.lineWidth = 0.045 * r;
  const fang = (x, y, s = 1) => { g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(x - 0.03 * r * s, y); g.lineTo(x, y + 0.09 * r * s); g.lineTo(x + 0.03 * r * s, y); g.closePath(); g.fill(); g.lineWidth = 0.02 * r; g.stroke(); };
  if (e === 'shout' || e === 'grin') {   // open laughing mouth with fangs
    g.fillStyle = '#4a0614'; g.beginPath(); g.moveTo(mx - 0.13 * r, my - 0.04 * r); g.quadraticCurveTo(mx, my - 0.02 * r, mx + 0.12 * r, my - 0.08 * r); g.quadraticCurveTo(mx + 0.06 * r, my + (e === 'shout' ? 0.2 : 0.12) * r, mx - 0.13 * r, my - 0.04 * r); g.fill(); g.lineWidth = 0.035 * r; g.stroke();
    g.fillStyle = '#ff6a80'; g.beginPath(); g.ellipse(mx - 0.01 * r, my + 0.05 * r, 0.05 * r, 0.025 * r, 0, 0, TAU); g.fill();
    fang(mx - 0.08 * r, my - 0.035 * r); fang(mx + 0.07 * r, my - 0.06 * r, 0.8);
  } else {   // lopsided smirk with a single fang peeking out
    g.beginPath(); g.moveTo(mx - 0.12 * r, my + 0.01 * r); g.quadraticCurveTo(mx - 0.01 * r, my + 0.05 * r, mx + 0.1 * r, my - 0.07 * r); g.stroke();
    fang(mx - 0.05 * r, my + 0.025 * r, 0.85);
  }
  g.restore();
}
// brows are drawn over the blunt fringe (anime style)
function saintBrows(g, r, c, o) {
  const e = o.expr || 'normal'; if (e === 'hurt' || e === 'ko') return;
  const ex = 0.5 * r, ey = 0.25 * r, k = e === 'shout' ? 0.07 : 0;
  g.strokeStyle = c.brow; g.lineWidth = 0.055 * r; g.lineCap = 'round';
  g.beginPath(); g.moveTo(ex - 0.24 * r, ey - (0.6 - k) * r); g.quadraticCurveTo(ex, ey - 0.62 * r, ex + 0.24 * r, ey - (0.47 + k) * r); g.stroke();
  g.lineWidth = 0.04 * r; g.beginPath(); g.moveTo(0.88 * r, ey - 0.5 * r); g.lineTo(1.0 * r, ey - 0.58 * r); g.stroke();
}
function saintHeaddress(g, r, c, R) {
  // bat-wing ribbon: two pointed black wings with crimson lining — the silhouette "ears"
  const wingsPts = [
    [[-0.3, -1.0], [-0.98, -1.62], [-0.86, -1.32], [-1.16, -1.32], [-0.94, -1.08], [-1.08, -0.94], [-0.52, -0.9]],
    [[-0.12, -1.06], [0.18, -1.86], [0.32, -1.52], [0.64, -1.66], [0.54, -1.3], [0.78, -1.24], [0.2, -1.0]],
  ];
  wingsPts.forEach((pts, i) => {
    polyR(g, r, pts, i ? c.wing : c.wing2, R);
    if (!R.mono) { const cx = pts[0][0], cy = pts[0][1]; polyR(g, r, pts.map(([x, y]) => [cx + (x - cx) * 0.62, cy + (y - cy) * 0.62]), c.crimson, R); }
  });
  if (R.mono) { polyR(g, r, [[-1.12, -0.3], [-0.8, -0.95], [0.1, -1.18], [0.86, -0.86], [1.08, -0.5], [0.9, -0.42], [0.1, -0.84], [-0.7, -0.62], [-0.98, -0.18]], c.wing, R); return; }
  // lace band across the crown
  g.strokeStyle = OUTLINE; g.lineWidth = 0.3 * r; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-1.0 * r, -0.3 * r); g.quadraticCurveTo(-0.3 * r, -1.16 * r, 0.94 * r, -0.66 * r); g.stroke();
  g.strokeStyle = c.wing; g.lineWidth = 0.2 * r; g.stroke();
  g.fillStyle = c.wing; g.strokeStyle = OUTLINE; g.lineWidth = 1;
  for (let i = 0; i <= 8; i++) { const t = i / 8, x = lerp(lerp(-1.0, -0.3, t), lerp(-0.3, 0.94, t), t) * r, y = lerp(lerp(-0.3, -1.16, t), lerp(-1.16, -0.66, t), t) * r + 0.12 * r; g.beginPath(); g.arc(x, y, 0.07 * r, 0, Math.PI); g.fill(); g.stroke(); }
  g.fillStyle = c.gold; for (let i = 1; i < 8; i += 2) { const t = i / 8, x = lerp(lerp(-1.0, -0.3, t), lerp(-0.3, 0.94, t), t) * r, y = lerp(lerp(-0.3, -1.16, t), lerp(-1.16, -0.66, t), t) * r; g.beginPath(); g.arc(x, y, 0.035 * r, 0, TAU); g.fill(); }
  // ribbon knot with a crimson gem
  circ(g, -0.24 * r, -1.02 * r, 0.15 * r, c.crimson2, R);
  g.fillStyle = '#ff3550'; g.shadowColor = '#ff1f3d'; g.shadowBlur = FX.hq ? 8 : 0; g.beginPath(); g.arc(-0.24 * r, -1.02 * r, 0.08 * r, 0, TAU); g.fill(); g.shadowBlur = 0;
  g.fillStyle = '#ffd0d8'; g.beginPath(); g.arc(-0.27 * r, -1.05 * r, 0.03 * r, 0, TAU); g.fill();
}
function saintRose(g, r, c, R) {
  // crimson rose worn over the ear (where the other chibi fighters wear headphones)
  skullHair(g, r, c, R);
  const x = -0.42 * r, y = 0.2 * r;
  polyR(g, r, [[-0.72, 0.34], [-0.98, 0.56], [-0.6, 0.5]], c.leaf, R); polyR(g, r, [[-0.2, 0.44], [-0.02, 0.7], [-0.36, 0.56]], c.leaf, R);
  circ(g, x, y, 0.22 * r, c.crimson, R);
  if (R.mono) return;
  g.strokeStyle = c.crimson2; g.lineWidth = 0.05 * r; g.lineCap = 'round';
  g.beginPath(); for (let i = 0; i < 22; i++) { const a = i * 0.55, rr = 0.03 * r + i * 0.0078 * r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.stroke();
  g.fillStyle = 'rgba(255,180,190,0.45)'; g.beginPath(); g.ellipse(x - 0.08 * r, y - 0.12 * r, 0.1 * r, 0.05 * r, -0.4, 0, TAU); g.fill();
}
function batWings(g, sk, c, R, o, scale = 1) {
  const T = o.T || 0, flap = Math.sin(T * 0.08) * 0.16, root = [sk.neck[0] - 10, sk.neck[1] + 15];
  for (const [far, k] of [[1, 0.8], [0, 1]]) {
    const base = addP(root, far ? [7, -6] : [0, 0]), f = flap * (far ? 0.8 : 1) - far * 0.1, L = 46 * k * scale;
    const wrist = addP(base, polar(Math.PI + 0.75 + f, L * 0.42));
    const tips = [0.3, 0.72, 1.15, 1.6].map((a, i) => addP(base, polar(Math.PI + a + f * (1 + i * 0.3), L * [0.8, 1.0, 0.9, 0.7][i])));
    const path = (sc) => {
      const P = pt => [base[0] + (pt[0] - base[0]) * sc, base[1] + (pt[1] - base[1]) * sc];
      g.beginPath(); g.moveTo(...base); g.lineTo(...P(tips[3]));
      for (let i = 3; i > 0; i--) { const a = P(tips[i]), b = P(tips[i - 1]), m = lerpP(lerpP(a, b, 0.5), P(wrist), 0.35); g.quadraticCurveTo(m[0], m[1], b[0], b[1]); }
      g.closePath();
    };
    path(1);
    if (!R.mono) { g.strokeStyle = OUTLINE; g.lineWidth = 4; g.lineJoin = 'round'; g.stroke(); }
    g.fillStyle = R.mono || (far ? c.wing2 : c.wing); g.fill();
    if (R.mono) continue;
    path(0.78); g.fillStyle = far ? c.crimson2 : c.membrane; g.fill();
    g.strokeStyle = far ? '#2a1a2a' : '#3a2a3e'; g.lineWidth = 2.2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(...base); g.lineTo(...wrist); tips.forEach(t => { g.moveTo(...wrist); g.lineTo(...t); }); g.stroke();
    g.fillStyle = c.wing; g.beginPath(); g.arc(wrist[0], wrist[1], 2.4, 0, TAU); g.fill();
  }
}
function gothicSkirt(g, sk, c, R, o) {
  const fl = Math.sin((o.T || 0) * 0.13) * 2.2;
  const hb = [sk.hip[0] - 15, sk.hip[1] - 8], hf = [sk.hip[0] + 14, sk.hip[1] - 8];
  const kb = [lerp(sk.hip[0], sk.bk[0], 0.75) - 17 + fl, lerp(sk.hip[1], sk.bk[1], 0.75) + 9], kf = [lerp(sk.hip[0], sk.fk[0], 0.75) + 15, lerp(sk.hip[1], sk.fk[1], 0.75) + 8];
  const hem = [(kb[0] + kf[0]) / 2, Math.max(kb[1], kf[1]) + 5 - fl];
  // crimson petticoat ruffle peeking under the hem
  const rk = 1.12, ru = [hb, [kb[0] - 4, kb[1] + 6], [hem[0], hem[1] + 7], [kf[0] + 4, kf[1] + 6], hf];
  poly(g, ru, c.crimson, R);
  if (!R.mono) {   // scalloped ruffle edge
    g.fillStyle = c.crimson; g.strokeStyle = OUTLINE; g.lineWidth = 1.4;
    for (let i = 0; i <= 6; i++) { const t = i / 6, a = t < 0.5 ? lerpP(ru[1], ru[2], t * 2) : lerpP(ru[2], ru[3], t * 2 - 1); g.beginPath(); g.arc(a[0], a[1], 4.2, 0, Math.PI); g.fill(); g.stroke(); }
  }
  const pts = [hb, kb, hem, kf, hf];
  poly(g, pts, c.dress, R);
  if (R.mono) return;
  g.save(); g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.clip();
  g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1.4;
  for (let i = 1; i < 6; i++) { const t = i / 6, top = lerpP(hb, hf, t), bot = t < 0.5 ? lerpP(kb, hem, t * 2) : lerpP(hem, kf, t * 2 - 1); g.beginPath(); g.moveTo(...top); g.lineTo(...bot); g.stroke(); }
  // crimson front panel with gold lacing
  const ft = lerpP(hb, hf, 0.72), fb = lerpP(hem, kf, 0.45);
  g.fillStyle = c.crimson2; g.beginPath(); g.moveTo(ft[0] - 3, ft[1]); g.lineTo(fb[0] - 6, fb[1] + 2); g.lineTo(fb[0] + 6, fb[1] + 2); g.lineTo(ft[0] + 3, ft[1]); g.closePath(); g.fill();
  g.restore();
  g.strokeStyle = c.gold; g.lineWidth = 2; g.beginPath(); g.moveTo(...kb); g.lineTo(...hem); g.lineTo(...kf); g.stroke();
  g.lineWidth = 1.2; for (let i = 1; i < 5; i++) { const a = lerpP(lerpP(hb, hf, 0.72), lerpP(hem, kf, 0.45), i / 5); g.beginPath(); g.moveTo(a[0] - 3, a[1] - 2); g.lineTo(a[0] + 3, a[1] + 2); g.moveTo(a[0] + 3, a[1] - 2); g.lineTo(a[0] - 3, a[1] + 2); g.stroke(); }
}

// ---------------------------------- character ----------------------------------
const SAINT = {
  id: 'saint', name: 'VESPERA', jp: 'ヴェスペラ', title: 'The Blood Saint', titleJp: '血の聖女',
  style: 'VAMPIRE', desc: 'An ancient vampire aristocrat in a saint’s guise. Fast claws, blood whips and lifesteal: every hit heals her, and the longer she stays on the attack, the deadlier she gets.',
  stats: { power: 4, speed: 4, range: 2, defense: 2 },
  scale: 1.0, health: 940, walk: 4.7, backWalk: 3.8, jumpV: -17.5, jumpX: 4.8, dashV: 13.5, juggleMax: 7,
  voicePitch: 0.95, voiceRate: 0.92,
  colors: {
    skin: '#f8ecef', hair: '#eef0f8', top: '#2a1e30', leg: '#2a2030', boot: '#1d1520', foot: '#1d1520', uarm: '#2a1e30', farm: '#140e16', hand: '#140e16', cuff: '#d8b24e', belt: '#8a0f24',
    eye: '#ff2440', eye2: '#3a0008', eyeGlow: true, accent: '#ff1f3d', brow: '#aeb2c6', gold: '#d8b24e', crimson: '#b3122e', crimson2: '#6a0a1c', dress: '#2a1e30', leaf: '#2c3a30',
    warm: '#241a28', sole: '#a3122a', pad: '#d8b24e', collar: '#140e16', wing: '#2a1e30', wing2: '#150f18', membrane: '#7a0e22', cape: '#18111c', capeIn: '#8a0f24',
  },
  afterColors: ['#ff1f3d', '#8a0f24', '#ff5a70'],
  stance: { t: -0.02, hd: -0.12, fa1: 0.95, fa2: 2.55, ba1: -0.45, ba2: 0.75, fl1: 0.28, fl2: 0.06, bl1: -0.22, bl2: -0.06 },
  poses: {
    victory: { t: -0.1, hd: -0.28, fa1: 1.95, fa2: 2.95, ba1: -0.5, ba2: 0.75, fl1: -0.1, fl2: -0.02, bl1: 0.14, bl2: 0.04 },
    intro: { t: -0.05, hd: -0.2, fa1: 1.4, fa2: 2.2, ba1: -0.5, ba2: 0.7, fl1: 0.1, fl2: 0.02, bl1: -0.1, bl2: -0.02 },
    claw_w: { t: -0.12, hd: -0.05, fa1: 2.5, fa2: 3.0, ba1: -0.6, ba2: 0.4, fl1: 0.35, fl2: 0.1, bl1: -0.35, bl2: -0.15 },
    claw: { t: 0.42, hd: 0.1, fa1: 1.25, fa2: 0.75, ba1: -0.9, ba2: -0.4, fl1: 0.85, fl2: 0.25, bl1: -0.7, bl2: -0.45 },
    rake_w: { t: -0.22, hd: -0.1, fa1: -0.6, fa2: 0.3, ba1: 2.6, ba2: 3.05, fl1: 0.3, fl2: 0.1, bl1: -0.35, bl2: -0.15 },
    rake: { t: 0.5, hd: 0.1, fa1: 0.2, fa2: 0.6, ba1: 1.45, ba2: 1.0, fl1: 0.95, fl2: 0.3, bl1: -0.75, bl2: -0.5 },
    whip_w: { t: -0.18, hd: -0.1, fa1: -1.0, fa2: -0.2, ba1: 0.6, ba2: 1.8, fl1: 0.3, fl2: 0.1, bl1: -0.4, bl2: -0.15 },
    whip: { t: 0.3, hd: 0.0, fa1: 1.62, fa2: 1.6, ba1: -0.7, ba2: 0.1, fl1: 0.7, fl2: 0.2, bl1: -0.55, bl2: -0.3 },
    mist: { ground: 0, hipH: 92, t: 0.8, hd: -0.25, fa1: -0.95, fa2: -0.6, ba1: -1.25, ba2: -0.95, fl1: 0.5, fl2: 0.1, bl1: -1.05, bl2: -1.4 },
    cross: { t: -0.1, hd: 0.2, fa1: 1.05, fa2: 2.95, ba1: 0.85, ba2: 3.05, fl1: 0.3, fl2: 0.1, bl1: -0.3, bl2: -0.1 },
    bloom: { t: -0.2, hd: -0.35, fa1: 2.3, fa2: 2.9, ba1: -2.2, ba2: -2.8, fl1: 0.35, fl2: 0.1, bl1: -0.35, bl2: -0.1 },
    conduct: { t: -0.1, hd: -0.25, fa1: 1.75, fa2: 2.95, ba1: 0.3, ba2: 1.6, fl1: 0.15, fl2: 0.04, bl1: -0.15, bl2: -0.04 },
    bite: { t: 0.75, hd: 0.45, fa1: 1.35, fa2: 2.35, ba1: 1.2, ba2: 2.2, fl1: 0.6, fl2: 0.2, bl1: -0.6, bl2: -0.4 },
    fang_w: { base: 'crouch', t: 0.3, fa1: 0.4, fa2: 1.2 },
    fang: { t: -0.1, hd: -0.35, fa1: 2.85, fa2: 3.1, ba1: -0.3, ba2: 0.4, fl1: 0.4, fl2: 0.1, bl1: -0.4, bl2: -0.7 },
    dive: { base: 'jump', t: 0.7, hd: 0.2, fa1: 1.0, fa2: 0.6, ba1: 0.7, ba2: 0.4, fl1: 0.5, fl2: 0.1, bl1: -0.6, bl2: -1.2 },
  },
  intro: 'Kneel. Your blood already belongs to me.',
  wins: ['How delicious. Do try to last a little longer next time.', 'Such a lovely shade of red… it suits you, down there.', 'A saint must feed. Thank you for your offering.'],
  ropes: [
    { id: 'lock', at: (sk, r) => headPt(sk, -r * 1.0, r * 1.4), n: 6, seg: 9, w0: 9, w1: 3, color: 'hair', grav: 0.7, wind: 0.35 },
  ],
  hairBack(g, r, c, R) {
    polyR(g, r, [[-1.22, 1.5], [-1.42, 2.45], [-1.18, 2.95], [-0.98, 2.45], [-0.82, 3.02], [-0.6, 2.35], [-0.42, 2.78], [-0.3, 1.9]], c.crimson, R);
    polyR(g, r, [[0.62, -0.9], [0.0, -1.22], [-0.78, -1.06], [-1.2, -0.5], [-1.28, 0.4], [-1.34, 1.3], [-1.36, 2.2], [-1.14, 2.7], [-0.98, 2.2], [-0.82, 2.78], [-0.64, 2.1], [-0.46, 2.55], [-0.36, 1.7], [-0.12, 1.0], [0.1, 0.5]], c.hair, R);
    if (!R.mono) { g.strokeStyle = 'rgba(150,155,190,0.45)'; g.lineWidth = 0.06 * r; g.lineCap = 'round'; for (const x of [-1.1, -0.82, -0.56]) { g.beginPath(); g.moveTo(x * r, 0.2 * r); g.quadraticCurveTo((x - 0.1) * r, 1.3 * r, (x + 0.02) * r, 2.25 * r); g.stroke(); } }
  },
  hairFront(g, r, c, R, o) {
    // long sidelock in front of the ear with a crimson tip
    polyR(g, r, [[-0.1, -0.3], [0.04, 0.5], [-0.04, 1.4], [-0.2, 2.05], [-0.34, 1.3], [-0.5, 0.3]], c.hair, R);
    polyR(g, r, [[-0.05, 1.45], [-0.2, 2.05], [-0.33, 1.4]], c.crimson, R);
    // blunt hime-cut fringe
    polyR(g, r, [[-0.36, -0.95], [0.3, -1.03], [0.96, -0.76], [1.14, -0.3], [1.13, -0.14], [0.99, -0.17], [0.93, -0.11], [0.74, -0.14], [0.6, -0.09], [0.4, -0.13], [0.22, -0.46], [0.0, -0.56]], c.hair, R);
    shine(g, r, [[-0.15, -0.86], [0.5, -0.86]], R);
    if (!R.mono) saintBrows(g, r, c, o);
    saintRose(g, r, c, R);
    saintHeaddress(g, r, c, R);
  },
  neckWear(g, sk, p, c, R) {
    highCollar(g, sk, c, R);
    if (R.mono) return;
    const n = sk.neck;
    g.fillStyle = c.crimson; g.strokeStyle = OUTLINE; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(n[0] + 4, n[1] + 6); g.lineTo(n[0] - 3, n[1] + 17); g.lineTo(n[0] + 4, n[1] + 14); g.lineTo(n[0] + 11, n[1] + 17); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = c.gold; g.beginPath(); g.arc(n[0] + 4, n[1] + 6, 3.6, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#ff3550'; g.beginPath(); g.arc(n[0] + 4, n[1] + 6, 1.9, 0, TAU); g.fill();
  },
  torsoDetail(g, L, bw, c) {
    // corset bodice: crimson lacing panel with gold cross-lacing, gold buttons
    g.fillStyle = c.crimson2; g.beginPath(); g.moveTo(2 * bw, -L * 0.86); g.lineTo(12 * bw, -L * 0.86); g.lineTo(10 * bw, 0); g.lineTo(4 * bw, 0); g.closePath(); g.fill();
    g.strokeStyle = c.gold; g.lineWidth = 1.3;
    for (let i = 0; i < 5; i++) { const y = -L * (0.78 - i * 0.16); g.beginPath(); g.moveTo(3.5 * bw, y); g.lineTo(10.5 * bw, y + L * 0.08); g.moveTo(10.5 * bw, y); g.lineTo(3.5 * bw, y + L * 0.08); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(-14 * bw, -L * 0.98, 28 * bw, 4);
  },
  torsoOver(g, L, bw, c, R) { if (R.mono) return; g.fillStyle = c.gold; g.fillRect(-12 * bw, -2, 24 * bw, 1.6); circ(g, 6 * bw, -2, 2.6, c.gold, R); },
  drawSkirt(g, sk, p, c, R, o) { gothicSkirt(g, sk, c, R, o); },
  shoulderOver(g, sk, p, c, R) {
    // puffed sleeve cap with crimson lining
    ell(g, sk.sF[0] + 1, sk.sF[1] + 3, 9.5, 8.5, c.top, R);
    if (!R.mono) { g.strokeStyle = c.crimson; g.lineWidth = 2; g.beginPath(); g.ellipse(sk.sF[0] + 1, sk.sF[1] + 8, 7, 2.6, 0, 0, Math.PI); g.stroke(); g.fillStyle = c.gold; g.beginPath(); g.arc(sk.sF[0] + 1, sk.sF[1] + 2, 1.6, 0, TAU); g.fill(); }
  },
  weaponBack(g, sk, p, c, R, o) { batWings(g, sk, c, R, o, 1.3); },
  weaponFront(g, sk, p, c, R) {
    // elegant crimson-lacquered claws on the glove
    if (R.mono) return;
    const [hx, hy] = sk.fh, a = p.fa2, dx = Math.sin(a), dy = Math.cos(a);
    g.strokeStyle = c.crimson; g.lineWidth = 2; g.lineCap = 'round';
    for (const s of [-1, 0, 1]) { const ox = -dy * s * 3, oy = dx * s * 3; g.beginPath(); g.moveTo(hx + dx * 5 + ox, hy + dy * 5 + oy); g.lineTo(hx + dx * 11 + ox * 1.3, hy + dy * 11 + oy * 1.3); g.stroke(); }
  },
};
makeChibi(SAINT, { build: { arm: 1.0, leg: 1.04, torso: 1.02 }, colors: {} });
SAINT.faceFn = saintFace;

// ---------------------------------- blood systems ----------------------------------
function saintHeal(F, amt) { if (F.ko || amt <= 0) return; const h = Math.min(F.maxHp - F.hp, amt); if (h <= 0) return; F.hp += h; F.healAcc = (F.healAcc || 0) + h; }
function saintGain(F, n) { if (F.frenzyT > 0 || F.ko) return; F.blood = Math.min(100, (F.blood || 0) + n); }
function saintBleed(A, D, n) {
  if (!D || D.ko) return;
  D.bleedN = Math.min(SAINT_BLEED_MAX, (D.bleedBy === A ? D.bleedN || 0 : 0) + n); D.bleedBy = A; D.bleedT = SAINT_BLEED_T;
  for (let i = 0; i < 6 + n * 3; i++) FX.p({ type: 'blood', x: D.x + rand(-12, 12), y: D.y - rand(80, 140) * D.s, vx: rand(-4, 4), vy: -rand(2, 7), grav: 0.45, drag: 0.98, life: 50, size: rand(2.5, 4.5), color: pick(['#b3122e', '#8a0f24', '#e0203e']), add: false });
}
function saintStream(A, D, n = 4) {   // stolen blood flows from the victim into the Saint
  const s = D.chestW(), t = A.chestW();
  for (let i = 0; i < n; i++) {
    const sx = s[0] + rand(-14, 14), sy = s[1] + rand(-20, 20), life = 16 + rand(0, 8);
    FX.p({ type: 'ember', x: sx, y: sy, vx: (t[0] - sx) / life, vy: (t[1] - sy) / life - 1.5, grav: 3 / life, drag: 1, life, size: rand(2.5, 4), color: pick(['#ff1f3d', '#ff5a70', '#b3122e']) });
  }
}
function saintFrenzy(F) {
  F.frenzyT = SAINT_FRENZY_T; F.blood = 100;
  FX.ring(F.x, F.y - 100, '#ff1f3d', 20, 260, 22, 10); FX.ring(F.x, F.y - 100, '#ffffff', 10, 160, 16, 5); FX.flashScreen('#ff0030', 10, 0.4); FX.shakeIt(8);
  FX.wtext(F.x, F.y - 250 * F.s, 'BLOOD FRENZY!', { size: 40, color: '#ffffff', stroke: '#b3001b', life: 60 });
  for (let i = 0; i < 18; i++) FX.p({ type: 'bat', x: F.x + rand(-20, 20), y: F.y - rand(60, 150), vx: rand(-6, 6), vy: -rand(1, 5), drag: 0.97, life: 50, size: rand(5, 8), rot: rand(0, 6), color: '#16101a', add: false });
  Sound.play('heart'); Sound.play('bats'); Sound.play('impactBig');
}
SAINT.initFighter = F => { F.blood = 0; F.frenzyT = 0; F.bloodHitT = -999; F.healAcc = 0; F.healTxtT = 0; };
SAINT.dmgBonus = F => F.frenzyT > 0 ? 1.12 : 1;
SAINT.walkMul = F => F.frenzyT > 0 ? 1.15 : 1;
SAINT.onDealDamage = (A, D, dmg, B) => {
  if (A.ko) return;
  const rate = A.frenzyT > 0 ? 0.24 : 0.12;
  saintHeal(A, dmg * rate);
  saintGain(A, A.state === 'cine' ? 3 : 7); A.bloodHitT = A.T;
  if (A.frenzyT > 0 && A.state !== 'cine') saintBleed(A, D, 1);
  saintStream(A, D, A.frenzyT > 0 ? 6 : 3);
};
SAINT.tick = F => {
  const O = F.opp; if (!O) return;
  const live = BT && BT.phase === 'fight' && !F.ko;
  if (F.state === 'attack' && F.prevKey === 'sp2' && F.moveKey !== 'sp2' && F.move && !F.move.special) F.performed.add('mistCancel');
  F.prevKey = F.state === 'attack' ? F.moveKey : null;
  if (F.hidden && F.state !== 'cine' && !(F.state === 'attack' && F.moveKey === 'sp2')) F.hidden = false;   // a Mist Step cancelled mid-dash re-materialises
  if (F.frenzyT > 0) {
    F.frenzyT--; F.blood = 100 * F.frenzyT / SAINT_FRENZY_T;
    if (F.T % 3 === 0) FX.p({ type: 'ember', x: F.x + rand(-34, 34), y: F.y - rand(10, 170) * F.s, vx: rand(-0.4, 0.4), vy: -rand(0.8, 2.2), life: 26, size: rand(1.8, 3.4), color: pick(['#ff1f3d', '#b3122e', '#ff5a70']) });
    if (F.T % 50 === 0) Sound.play('heart');
    if (F.state === 'attack' || F.state === 'dash') F.afterimage = Math.max(F.afterimage, 3);
  } else if (live) {
    if (F.T - F.bloodHitT > 150 && F.blood > 0 && F.state !== 'cine') F.blood = Math.max(0, F.blood - 0.12);
    if (F.blood >= 100) saintFrenzy(F);
  }
  // bleeding opponent: damage over time (never lethal), feeds the blood gauge
  if (O.bleedN > 0 && O.bleedBy === F) {
    if (--O.bleedT <= 0 || O.ko || !live) O.bleedN = 0;
    else {
      const d = 0.045 * O.bleedN; if (O.hp > 1) { O.hp = Math.max(1, O.hp - d); F.stats.dmg += d; }
      saintGain(F, d * 0.3);
      if (F.T % Math.max(4, 14 - O.bleedN * 2) === 0) FX.p({ type: 'blood', x: O.x + rand(-16, 16) * O.s, y: O.y - rand(70, 150) * O.s, vx: rand(-0.6, 0.6), vy: rand(0, 1), grav: 0.35, drag: 0.99, life: 60, size: rand(2, 3.6), color: pick(['#b3122e', '#8a0f24']), add: false });
    }
  }
  if (F.healAcc >= 6 && F.T - F.healTxtT > 16) { FX.wtext(F.x + rand(-20, 20), F.y - 215 * F.s, '+' + Math.round(F.healAcc), { size: 18, color: '#ff8aa0', stroke: '#3a0010', life: 30, vy: -0.8 }); F.healAcc = 0; F.healTxtT = F.T; }
};
SAINT.drawExtra = (g, F) => {
  // blood whip tendril
  if (F.state === 'attack' && F.moveKey === 'sp1f') {
    const m = F.move, f = F.mf, a0 = m.st - 3, a1 = m.st + m.act + 7;
    if (f >= a0 && f <= a1) {
      const k = f <= m.st + 2 ? (f - a0) / 5 : 1 - (f - m.st - 2) / (a1 - m.st - 2), reach = 215 * clamp(k, 0, 1), h = F.handW('f'), dir = F.facing;
      const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push([h[0] + dir * reach * t, h[1] + Math.sin(t * 7 - F.T * 0.9) * 9 * t * (1 - t) * 2]); }
      g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
      for (const [col, w] of [[OUTLINE, 11], ['#6a0a1c', 8], ['#d0183a', 5], ['#ff8aa0', 1.6]]) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke(); }
      const tip = pts[pts.length - 1]; g.fillStyle = '#d0183a'; g.strokeStyle = OUTLINE; g.lineWidth = 2; g.beginPath(); g.moveTo(tip[0] + dir * 14, tip[1]); g.lineTo(tip[0] - dir * 3, tip[1] - 7); g.lineTo(tip[0] - dir * 3, tip[1] + 7); g.closePath(); g.stroke(); g.fill();
      g.restore();
    }
  }
  // frenzy: crimson glow around the eyes / body
  if (F.frenzyT > 0 && FX.hq && !F.ko) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.18 + 0.08 * Math.sin(F.T * 0.25);
    const gr = g.createRadialGradient(F.x, F.y - 90, 10, F.x, F.y - 90, 120); gr.addColorStop(0, '#ff1f3d'); gr.addColorStop(1, 'rgba(255,31,61,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(F.x, F.y - 90, 120, 0, TAU); g.fill(); g.restore();
  }
};
SAINT.introFx = F => {
  for (let i = 0; i < 24; i++) FX.p({ type: 'bat', x: F.x + rand(-30, 30), y: F.y - rand(40, 170), vx: rand(-7, 7), vy: -rand(1, 6), drag: 0.97, life: 60, size: rand(5, 9), rot: rand(0, 6), color: '#16101a', add: false });
  for (let i = 0; i < 30; i++) FX.p({ type: 'petal', x: F.x + rand(-140, 140), y: F.y - rand(120, 320), vx: rand(-1.5, 1.5), vy: rand(0.6, 2), life: 80, size: rand(4, 7), color: pick(['#b3122e', '#8a0f24', '#ff1f3d']), rot: rand(0, 6), vr: 0.1, add: false });
  Sound.play('bats');
};

// ---------------------------------- projectiles ----------------------------------
EXTRA_PROJ.bloodSpike = {
  rect: p => ({ x: p.x - p.w / 2, y: GROUND - p.h, w: p.w, h: p.h }),
  delay(p) { if (p.t % 2 === 0) FX.p({ type: 'blood', x: p.x + rand(-30, 30), y: GROUND - 4, vx: rand(-1, 1), vy: -rand(1, 3), grav: 0.3, life: 20, size: 2.5, color: '#8a0f24', add: false }); },
  update(p) {
    if (!p.burst) {
      p.burst = true; Sound.play('spike'); FX.shakeIt(7 + p.stacks * 2);
      for (let i = 0; i < 18 + p.stacks * 8; i++) FX.p({ type: 'blood', x: p.x + rand(-30, 30), y: GROUND - rand(10, 120), vx: rand(-6, 6), vy: -rand(4, 12), grav: 0.5, drag: 0.98, life: 60, size: rand(2.5, 5), color: pick(['#b3122e', '#e0203e', '#6a0a1c']), add: false });
      FX.ring(p.x, GROUND, '#ff1f3d', 10, 110 + p.stacks * 20, 16, 6, 0.25);
    }
  },
  draw(g, p) {
    if (p.delay > 0) {
      const k = 1 - p.delay / p.delay0; g.fillStyle = 'rgba(106,10,28,0.85)'; g.beginPath(); g.ellipse(p.x, GROUND, 18 + 46 * k, 5 + 6 * k, 0, 0, TAU); g.fill();
      g.strokeStyle = '#ff1f3d'; g.globalAlpha = 0.5 + 0.5 * Math.sin(p.t * 0.9); g.lineWidth = 2; g.stroke(); return;
    }
    const grow = Math.min(1, p.t2 = (p.t2 || 0) + 0.25), fade = Math.min(1, p.life / 8), n = 5 + p.stacks;
    g.globalAlpha = fade;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1), x = p.x + (t - 0.5) * (p.w + 10), hgt = (60 + (1 - Math.abs(t - 0.5) * 2) * (p.h - 50)) * grow, lean = (t - 0.5) * 0.5, w2 = 9 + (1 - Math.abs(t - 0.5) * 2) * 6;
      const tip = [x + lean * hgt * 0.4, GROUND - hgt];
      poly(g, [[x - w2, GROUND], tip, [x + w2, GROUND]], '#8a0f24', { ol: 2.2 });
      g.fillStyle = '#e0203e'; g.beginPath(); g.moveTo(x - w2 * 0.35, GROUND); g.lineTo(tip[0], tip[1] + 6); g.lineTo(x + w2 * 0.15, GROUND); g.closePath(); g.fill();
    }
    g.fillStyle = '#6a0a1c'; g.beginPath(); g.ellipse(p.x, GROUND, p.w * 0.7, 7, 0, 0, TAU); g.fill();
  },
};

// ---------------------------------- moves ----------------------------------
const bloodTick = (F, from, to) => (f) => { if (f >= from && f <= to && F.T % 2 === 0) { const h = F.handW('f'); FX.p({ type: 'blood', x: h[0], y: h[1], vx: -F.facing * rand(0, 2), vy: -rand(0, 2), grav: 0.4, life: 30, size: rand(2, 3.5), color: '#b3122e', add: false }); } };
SAINT.moves = Object.assign(baseNormals({ dmg: 0.95, spd: -1 }), {
  sp1: {
    name: 'CRIMSON CLAW', jp: '紅爪', desc: 'Lunging claw rake. Inflicts BLEED. Press SP1 again on hit for SECOND FANG.', special: 1, lvl: 4, poses: ['claw_w', 'claw'], st: 9, act: 6, rec: 18, dmg: 72, hs: 26, bs: 15, kb: 6,
    hb: { x: 5, y: -168, w: 88, h: 72 }, str: 3, cd: 40, sfx: 'slash', sw: { cx: 10, cy: -130, r: 82, a0: -1.9, a1: 0.5, color: '#ff1f3d' },
    tick(F, f) { if (f >= 5 && f <= 15) { F.vx = F.facing * 13; F.ctrlVel = true; F.afterimage = Math.max(F.afterimage, 4); } bloodTick(F, 8, 16)(f); },
    onHit(A, D) { saintBleed(A, D, 1); },
  },
  sp1f: {
    name: 'BLOOD WHIP', jp: '血鞭', desc: 'A whip of her own blood lashes out and drags the victim in. Inflicts BLEED. Cancel into Hemorrhage.', special: 1, lvl: 4, poses: ['whip_w', 'whip'], st: 11, act: 5, rec: 20, dmg: 58, hs: 30, bs: 14, kb: 2,
    hb: { x: 20, y: -158, w: 205, h: 56 }, str: 2, cd: 70, sfx: 'slash',
    onHit(A, D) { saintBleed(A, D, 1); D.vx = -A.facing * 7; Sound.play('drain'); },
  },
  counter: {
    name: 'CRIMSON VEIL', jp: '紅の帳', desc: 'Counter stance. Catches any attack (or projectile) and answers with a bloom of blood spikes around her.', special: 1, lvl: 4, counter: 1, poses: ['cross', 'cross'], st: 2, act: 22, rec: 18, cd: 100, sfx: 'counter',
    onCounter(F) { F.startMove('thornBloom', true); },
  },
  thornBloom: {
    name: 'THORN BLOOM', jp: '血棘華', lvl: 5, poses: ['cross', 'bloom'], st: 4, act: 6, rec: 22, dmg: 88, hs: 32, kb: 3, launch: -15, kd: 1, hb: { x: -100, y: -215, w: 240, h: 215 }, invuln: [0, 14], str: 3, shake: 8, hitstop: 12,
    onStart(F) {
      Sound.play('spike'); FX.ring(F.x, GROUND, '#ff1f3d', 10, 180, 18, 8, 0.25);
      for (let i = -5; i <= 5; i++) FX.p({ type: 'bblade', x: F.x + i * 22, y: GROUND + 6, vx: 0, vy: -9 + Math.abs(i) * 0.6, drag: 0.8, rot: -Math.PI / 2 + i * 0.13, size: 34 + (5 - Math.abs(i)) * 6, life: 26, color: '#e0203e', add: false });
    },
    onHit(A, D) { saintBleed(A, D, 2); },
  },
  sp2: {
    name: 'MIST STEP', jp: '霧歩', desc: 'Dissolve into crimson mist and dash through the opponent (invulnerable). Cancel into any normal attack. Works in the air.', special: 1, lvl: 4, air: 'both', poses: ['mist', 'mist'],
    st: 2, act: 12, rec: 8, cd: 40, sfx: 'bats', invuln: [1, 12], pass: 15,
    tick(F, f) {
      if (f >= 2 && f <= 13) { F.vx = F.facing * 17; F.ctrlVel = true; if (!F.onGround) F.vy = Math.min(F.vy, 0) * 0.5; F.afterimage = 4; }
      F.hidden = f >= 4 && f <= 11;
      if (f >= 2 && f <= 13) {
        FX.p({ type: 'smoke', x: F.x + rand(-20, 20), y: F.y - rand(30, 150), vx: -F.facing * rand(0.5, 2), vy: -rand(0, 0.6), life: 26, size: rand(10, 18), grow: 0.4, color: pick(['rgba(160,10,40,0.55)', 'rgba(60,4,20,0.55)']), add: false });
        if (f % 3 === 0) FX.p({ type: 'bat', x: F.x, y: F.y - rand(60, 150), vx: F.facing * rand(2, 6), vy: -rand(1, 3), drag: 0.96, life: 30, size: rand(4, 6), rot: rand(0, 6), color: '#16101a', add: false });
      }
      if (f === 14) F.hidden = false;
    },
  },
  sp2f: {
    name: 'THIRST', jp: '渇き', desc: 'Command grab. Bites the neck and drinks deeply: big lifesteal, fills the BLOOD gauge, inflicts 2 BLEED. Unblockable.', special: 1, lvl: 4, poses: ['grab', 'bite'], st: 6, act: 4, rec: 30,
    dmg: 1, type: 'unblock', grab: 1, hb: { x: 0, y: -175, w: 82, h: 170 }, cd: 110, str: 3, sfx: 'grab',
    onHit(F, D) { BT.startCine(F, D, CINE.saintBite, { zoom: 1.25 }); return true; },
  },
  sp2d: {
    name: 'HEMORRHAGE', jp: '血華', desc: 'Finisher. Ruptures the victim’s wounds: blood spikes erupt under them. +damage per BLEED stack (consumed); 2+ stacks launch. Heals her.', special: 1, lvl: 4.6, poses: ['conduct', 'raise'], st: 10, act: 1, rec: 22, cd: 90, sfx: 'energy',
    spawn: { f: 10, fn(F, O) {
      const near = Math.abs(O.x - F.x) < 430, x = near ? O.x : F.x + F.facing * 240, stacks = near && O.bleedBy === F ? O.bleedN || 0 : 0;
      BT.spawn({ owner: F, kind: 'bloodSpike', x, y: GROUND - 70, vx: F.facing * 0.001, w: 96, h: 150 + stacks * 14, delay: 8, delay0: 8, life: 18, dmg: 34 + 24 * stacks, hs: 30, bs: 16, kb: 3, kd: 1, launch: stacks >= 2 ? -12 - stacks : 0,
        clash: 0, str: 3, stacks, color: '#ff1f3d', srcKey: 'sp2d', projOnHit: 1,
        onHit(A, D) {
          if (stacks) { D.bleedN = 0; saintHeal(A, (34 + 24 * stacks) * 0.3); FX.wtext(D.x, D.y - 240 * D.s, `HEMORRHAGE ×${stacks}`, { size: 30, color: '#ffffff', stroke: '#b3001b', life: 40 }); }
          saintStream(A, D, 6 + stacks * 2);
        } });
      Sound.play('drain');
    } },
  },
  ult: {
    name: 'CRIMSON NOCTURNE', jp: '紅月夜想曲', desc: 'Ultimate. A lunging claw; on hit the night stops, a hundred blood blades hang in the air — and fall. Ends with a deep bite. Massive lifesteal.', ult: 1, lvl: 6, cost: 100,
    poses: ['claw_w', 'claw'], st: 6, act: 16, rec: 28, dmg: 40, hs: 40, bs: 20, kb: 6, hb: { x: 0, y: -190, w: 104, h: 180 }, invuln: [0, 26], str: 3,
    tick(F, f) { if (f > 6 && f <= 22) { F.vx = F.facing * 16; F.ctrlVel = true; F.afterimage = 6; FX.p({ type: 'smoke', x: F.x, y: F.y - rand(40, 140), vx: -F.facing * 2, life: 20, size: 14, grow: 0.4, color: 'rgba(160,10,40,0.5)', add: false }); } },
    onHit(F, D) { BT.startCine(F, D, CINE.saint, { zoom: 1.2 }); return true; },
  },
  secondFang: {
    name: 'SECOND FANG', jp: '二の牙', followup: 1, lvl: 4.5, poses: ['fang_w', 'fang'], st: 4, act: 7, rec: 22, dmg: 62, hs: 32, bs: 14, kb: 2, launch: -14, kd: 1, landRec: 10,
    hb: { x: 0, y: -232, w: 100, h: 196 }, str: 3, shake: 6, sfx: 'slash', sw: { cx: 20, cy: -160, r: 84, a0: 1.2, a1: -1.6, color: '#ff1f3d' },
    tick(F, f) { if (f === 4) { F.vy = -10; F.onGround = false; F.vx = F.facing * 4; } bloodTick(F, 4, 12)(f); },
    onHit(A, D) { saintBleed(A, D, 1); },
  },
});
(() => {
  const M = SAINT.moves;
  Object.assign(M.L, { name: 'Lady’s Slap', poses: ['claw_w', { base: 'jab', fa2: 1.3 }], sw: { cx: 0, cy: -150, r: 62, a0: -1.2, a1: 0.4, color: '#ff5a70' } });
  Object.assign(M.M, { name: 'Heel Strike' });
  Object.assign(M.H, { name: 'CRIMSON RAKE', poses: ['rake_w', 'rake'], dmg: 96, hb: { x: 12, y: -195, w: 98, h: 120 }, sw: { cx: -6, cy: -140, r: 96, a0: -2.0, a1: 0.6, color: '#ff1f3d' } });
  Object.assign(M.cH, { name: 'Thorn Sweep' });
  Object.assign(M.LH, { name: 'Rising Talon', poses: ['fang_w', 'fang'], sw: { cx: 20, cy: -160, r: 80, a0: 1.2, a1: -1.6, color: '#ff1f3d' } });
  Object.assign(M.FF, { name: 'Night Lunge', poses: ['claw_w', 'claw'], sw: { cx: 10, cy: -130, r: 82, a0: -1.9, a1: 0.5, color: '#ff1f3d' } });
  Object.assign(M.jH, { name: 'Raven Dive', poses: ['jheavy_w', 'dive'] });
  // MIST STEP cancels straight into any normal (ground or air) — the core of her rush-down
  for (const [btn, gk, ak] of [['light', 'L', 'jL'], ['medium', 'M', 'jM'], ['heavy', 'H', 'jH']]) {
    addFollowup(SAINT, 'sp2', { btn, move: gk, any: true, cond: F => F.onGround && F.mf >= 11 });
    addFollowup(SAINT, 'sp2', { btn, move: ak, any: true, cond: F => !F.onGround && F.mf >= 9 });
  }
  addFollowup(SAINT, 'sp1', { btn: 'sp1', move: 'secondFang', cond: F => !F.input.p('sp2') });   // SP1+SP2 still cancels into the ultimate
})();
SAINT.extraList = [
  ['secondFang', 'Second Fang (launch)', 'Crimson Claw → SP1'], ['thornBloom', 'Thorn Bloom (launch)', 'Crimson Veil counters'],
  ['mistCancel', 'Mist Step → any normal', 'SP2 → L / M / H'],
];
SAINT.moves.mistCancel = { name: 'MIST CANCEL', jp: '霧断ち', virtual: 1, lvl: 0, st: 0, act: 0, rec: 0, desc: 'Press any attack during Mist Step to strike out of the mist.' };
SAINT.combos = [
  { name: 'First Blood', notation: 'L → M → H → SP1 (Crimson Claw) → SP1 (Second Fang)', seq: ['L', 'M', 'H', 'sp1', 'secondFang'] },
  { name: 'Leash & Harvest', notation: 'M → ↓→SP1 (Blood Whip) → ↓↓SP2 (Hemorrhage)', seq: ['M', 'sp1f', 'sp2d'] },
  { name: 'Mist Waltz', notation: 'SP2 (Mist Step) → M → H → SP1 (Crimson Claw)', seq: ['M', 'H', 'sp1'], pre: ['sp2'] },
  { name: 'Moonlit Ascent', notation: 'L+H (Rising Talon) → hold ↑ → air M → air H', seq: ['LH', 'jM', 'jH'] },
  { name: 'Crimson Nocturne', notation: 'H → SP1 (Crimson Claw) → SP1+SP2 (Ultimate)', seq: ['H', 'sp1', 'ult'], meter: 1 },
];
SAINT.applyTrial = (A, tr) => { if (tr && tr.meter) A.meter = 100; };

// ---------------------------------- cinematics ----------------------------------
CINE.saintBite = function (A, D, f, c) {
  const dir = A.facing;
  if (f === 1) { A.forcePose = 'bite'; D.x = A.x + dir * 46; D.y = GROUND; D.forcePose = 'hit'; FX.darkTarget = 0.45; Sound.play('grab'); }
  if ([10, 22, 34].includes(f)) {
    BT.scriptHit(A, D, 26, { str: 2, sfx: 'drain' }); D.forcePose = f === 22 ? 'hit2' : 'hit'; saintHeal(A, 14); saintStream(A, D, 8);
    const n = D.chestW(); for (let i = 0; i < 8; i++) FX.p({ type: 'blood', x: n[0], y: n[1] - 30, vx: rand(-3, 3), vy: -rand(2, 6), grav: 0.45, life: 40, size: rand(2.5, 4), color: '#b3122e', add: false });
  }
  if (f === 48) {
    A.forcePose = 'claw'; BT.scriptHit(A, D, 50, { str: 3, sfx: 'slash' }); saintHeal(A, 20); saintBleed(A, D, 2); saintGain(A, 25);
    FX.wtext(D.x, D.y - 250, '渇き', { size: 54, font: FX_JP(), color: '#fff', stroke: '#b3001b', life: 40, vy: -0.3 });
    BT.release(D, dir * 7, -8); FX.darkTarget = 0; return true;
  }
};
CINE.saint = function (A, D, f, c) {
  const dir = A.facing, acc = A.ch.colors.accent;
  if (f === 1) {
    D.x = clamp(A.x + dir * 100, 90, STAGE_W - 90); D.y = GROUND; D.forcePose = 'hit'; A.forcePose = 'claw'; c.blades = [];
    FX.darkTarget = 0.88; FX.flashScreen('#ff0030', 12, 0.55); Sound.play('heart'); Sound.play('charge'); c.zoom = 1.25;
    FX.wtext(D.x, GROUND - 300, '— 夜よ、止まれ —', { size: 34, font: FX_JP(), color: '#ffd0d8', stroke: '#3a0010', life: 70 });
  }
  if (f === 10) { A.hidden = true; Sound.play('bats'); for (let i = 0; i < 20; i++) FX.p({ type: 'bat', x: A.x, y: A.y - rand(40, 150), vx: rand(-6, 6), vy: -rand(1, 5), drag: 0.97, life: 50, size: rand(5, 8), rot: rand(0, 6), color: '#16101a', add: false }); }
  if (f >= 6 && f <= 44 && f % 2 === 0) {   // the night stops: blood blades appear and hang in the air around the victim
    const ch = D.chestW(), a = (f - 6) * 0.43 + rand(-0.1, 0.1), rr = rand(150, 240), x = ch[0] + Math.cos(a) * rr, y = Math.min(GROUND - 10, ch[1] + Math.sin(a) * rr * 0.8);
    const q = { type: 'bblade', x, y, vx: 0, vy: 0, drag: 1, grav: 0, rot: Math.atan2(ch[1] - y, ch[0] - x), size: rand(28, 40), life: 400, color: pick(['#e0203e', '#ff1f3d', '#b3122e']), add: false };
    FX.p(q); c.blades.push(FX.parts[FX.parts.length - 1]);
    if (f % 6 === 0) Sound.play('kunai');
  }
  if (f === 46) { A.hidden = false; A.x = clamp(D.x - dir * 170, 60, STAGE_W - 60); A.y = GROUND - 70; A.facing = D.x > A.x ? 1 : -1; A.forcePose = 'conduct'; Sound.play('perfect'); FX.ring(A.x, A.y - 100, acc, 10, 90, 14, 4); }
  if (f === 54) {   // snap: every blade falls on the victim at once
    const ch = D.chestW(); Sound.play('slash'); FX.flashScreen('#ffffff', 4, 0.3);
    for (const q of c.blades) { const d = Math.hypot(ch[0] - q.x, ch[1] - q.y) || 1, sp = rand(18, 26); q.vx = (ch[0] - q.x) / d * sp; q.vy = (ch[1] - q.y) / d * sp; q.life = q.max = Math.ceil(d / sp) + 2; }
  }
  if (f >= 58 && f <= 82 && f % 4 === 2) {
    BT.scriptHit(A, D, 13, { str: 2, sfx: 'slash' }); D.forcePose = (f >> 2) % 2 ? 'hit' : 'hit2';
    const ch = D.chestW(); for (let i = 0; i < 6; i++) FX.p({ type: 'blood', x: ch[0] + rand(-20, 20), y: ch[1] + rand(-30, 30), vx: rand(-5, 5), vy: -rand(2, 7), grav: 0.45, life: 50, size: rand(2.5, 4.5), color: pick(['#b3122e', '#e0203e']), add: false });
  }
  if (f === 88) { A.y = GROUND; A.x = clamp(D.x - dir * 44, 60, STAGE_W - 60); A.facing = D.x > A.x ? 1 : -1; A.forcePose = 'bite'; A.afterimage = 10; Sound.play('grab'); }
  if (f === 96) { BT.scriptHit(A, D, 40, { str: 3, sfx: 'drain' }); saintStream(A, D, 14); saintHeal(A, 40); }
  if (f === 112) A.forcePose = 'rake_w';
  if (f === 120) {
    A.forcePose = 'rake'; BT.scriptHit(A, D, 140, { str: 4 });
    FX.impactFrame(4); FX.shakeIt(24); Sound.play('explosion'); Sound.play('spike'); FX.flashScreen('#ff1f3d', 14, 0.65);
    for (let i = 0; i < 80; i++) FX.p({ type: 'blood', x: D.x + rand(-30, 30), y: D.y - rand(40, 160), vx: rand(-11, 11), vy: -rand(3, 14), grav: 0.5, drag: 0.98, life: 70, size: rand(2.5, 6), color: pick(['#b3122e', '#e0203e', '#6a0a1c', '#ff5a70']), add: false });
    for (let i = 0; i < 24; i++) FX.p({ type: 'petal', x: D.x, y: D.y - 100, vx: rand(-9, 9), vy: rand(-9, 3), life: 70, size: rand(4, 8), color: pick(['#b3122e', '#ff1f3d', '#1d1622']), rot: rand(0, 6), vr: 0.2, add: false, drag: 0.95 });
    FX.ring(D.x, D.y - 100, acc, 20, 320, 22, 10); FX.ring(D.x, D.y - 100, '#ffffff', 10, 200, 16, 5);
    FX.wtext(D.x, GROUND - 280, '紅月夜想曲!!', { size: 82, font: FX_JP(), color: '#fff', stroke: acc, life: 60, vy: -0.3 });
    saintHeal(A, 60); saintBleed(A, D, 3); saintGain(A, 30);
    for (const q of c.blades) q.life = Math.min(q.life, 2);
    BT.release(D, dir * 7, -16); FX.darkTarget = 0; return true;
  }
};

// ---------------------------------- HUD: blood gauge + bleed ----------------------------------
SAINT.drawHand = (g, F, side, t) => {
  const pw = 330, ph = 68, x0 = side > 0 ? 40 : W - 40 - pw, y0 = 562, fr = F.frenzyT > 0, col = fr ? '#ff4a62' : '#ff1f3d';
  g.save();
  g.fillStyle = 'rgba(14,4,10,0.86)'; g.fillRect(x0, y0, pw, ph); g.strokeStyle = col; g.lineWidth = 1.5; g.strokeRect(x0, y0, pw, ph);
  // blood vial icon
  const ix = side > 0 ? x0 + 8 : x0 + pw - 62, iy = y0 + 8, k = clamp((F.blood || 0) / 100, 0, 1);
  g.save(); g.beginPath(); g.arc(ix + 26, iy + 26, 25, 0, TAU); g.clip(); g.fillStyle = '#12060c'; g.fillRect(ix, iy, 52, 52);
  g.fillStyle = col; g.fillRect(ix, iy + 52 * (1 - k), 52, 52 * k);
  g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(ix + 8, iy + 52 * (1 - k), 36, 2);
  g.restore();
  g.strokeStyle = fr && (t >> 3) % 2 ? '#ffffff' : col; g.lineWidth = 2.5; g.beginPath(); g.arc(ix + 26, iy + 26, 25, 0, TAU); g.stroke();
  g.font = `italic 900 18px ${FONT_T}`; g.textAlign = 'center'; g.textBaseline = 'middle'; strokeText(g, '血', ix + 26, iy + 27, '#ffffff', OUTLINE, 3); g.textBaseline = 'alphabetic';
  const tx = side > 0 ? x0 + 72 : x0 + 10;
  g.textAlign = 'left'; g.font = `italic 900 16px ${FONT_T}`; strokeText(g, fr ? 'BLOOD FRENZY' : 'BLOOD', tx, y0 + 21, fr ? '#ffd0d8' : '#ffffff', OUTLINE, 3);
  g.font = `700 11px ${FONT_JP}`; g.fillStyle = col; g.fillText(fr ? '狂血 · DMG+ · SPEED+ · DRAIN×2' : '吸血 · LIFESTEAL 12%', tx, y0 + 36);
  const bw = 150, bx = tx, by = y0 + 44, bh = 14;
  g.fillStyle = '#0a0306'; g.fillRect(bx, by, bw, bh); g.fillStyle = fr && (t >> 2) % 2 ? '#ff8aa0' : col; g.fillRect(bx, by, bw * k, bh);
  g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 1; g.strokeRect(bx, by, bw, bh);
  g.font = `900 10px ${FONT_UI}`; g.textAlign = 'center'; g.fillStyle = k > 0.55 ? '#14040a' : '#ffffff';
  g.fillText(fr ? `${(F.frenzyT / 60).toFixed(1)}s` : `${Math.floor(k * 100)}%`, bx + bw / 2, by + 11);
  // bleed stacks on the opponent
  const O = F.opp, n = O && O.bleedBy === F ? O.bleedN || 0 : 0;
  g.font = `800 9px ${FONT_UI}`; g.fillStyle = '#d99aa8'; g.textAlign = 'left'; g.fillText('BLEED', bx + bw + 10, by + 3);
  for (let i = 0; i < SAINT_BLEED_MAX; i++) {
    const px = bx + bw + 12 + i * 15, py = by + 6, on = i < n;
    g.fillStyle = on ? '#e0203e' : 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(px + 5, py - 4); g.quadraticCurveTo(px + 11, py + 5, px + 5, py + 9); g.quadraticCurveTo(px - 1, py + 5, px + 5, py - 4); g.fill();
    if (on) { g.strokeStyle = '#ffd0d8'; g.lineWidth = 0.8; g.stroke(); }
  }
  g.restore();
  const badges = [['sp1f', '↓→S1 WHIP'], ['counter', '↓←S1 VEIL'], ['sp2f', '↓→S2 THIRST'], ['sp2d', '↓↓S2 HEMORR.']];
  badges.forEach(([k2, lab], i) => {
    const ready = !(F.cd[k2] > 0), bw2 = 78, bx2 = side > 0 ? 40 + i * (bw2 + 6) : W - 40 - bw2 - i * (bw2 + 6), by2 = 638;
    g.fillStyle = ready ? 'rgba(40,8,18,0.9)' : 'rgba(10,4,8,0.9)'; g.fillRect(bx2, by2, bw2, 18);
    g.strokeStyle = ready ? col : 'rgba(255,255,255,0.15)'; g.lineWidth = 1.2; g.strokeRect(bx2, by2, bw2, 18);
    g.font = `800 9px ${FONT_UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = ready ? '#ffffff' : '#666'; g.fillText(lab, bx2 + bw2 / 2, by2 + 9.5);
  });
  g.textBaseline = 'alphabetic';
};

// ---------------------------------- how-to page ----------------------------------
function drawSaintHowTo(g) {
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.font = `italic 900 20px ${FONT_T}`; strokeText(g, 'VESPERA — THE BLOOD SAINT', 100, 156, '#ff4a62', OUTLINE, 4);
  const rows = [
    ['LIFESTEAL', 'Every hit she lands heals her for 12% of the damage (24% in Frenzy).'],
    ['BLOOD', 'Fills when she hits (+7) and while the opponent bleeds. Drains if she stops attacking for 2.5 s.'],
    ['FRENZY', 'Full BLOOD = 7 s of BLOOD FRENZY: +12% damage, +15% walk speed, double lifesteal, every hit inflicts BLEED.'],
    ['BLEED', 'Claw, Whip, Fang, Thorn Bloom and Thirst add stacks (max 5): damage over time that never KOs and feeds BLOOD.'],
    ['HEMORRHAGE', '↓↓ SP2 cashes in every stack: +24 damage per stack, heals her, 2+ stacks launch. Cancel into it from Blood Whip.'],
    ['MIST STEP', 'SP2: invulnerable dash straight through the opponent (also in the air) — press L / M / H to strike out of the mist.'],
    ['THIRST', '↓→ SP2: unblockable bite. The best way to heal and fill BLOOD against a turtling opponent.'],
  ];
  rows.forEach(([a, b], i) => { const y = 196 + i * 40; g.fillStyle = i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(255,40,70,0.08)'; g.fillRect(96, y - 22, 1088, 34); g.font = `900 16px ${FONT_UI}`; g.fillStyle = '#ffd84a'; g.fillText(a, 110, y); g.font = `600 14px ${FONT_UI}`; g.fillStyle = '#ffffff'; g.fillText(b, 260, y); });
  g.font = `500 14px ${FONT_UI}`; g.fillStyle = '#ffc4d0';
  wrapText(g, 'She rewards aggression: stay on top of the opponent to keep BLOOD high, stack BLEED with Claw → Second Fang or Blood Whip, then finish with Hemorrhage or the CRIMSON NOCTURNE ultimate (SP1+SP2) for a huge heal. Back off and her BLOOD dries up.', 110, 492, 1060, 20);
}

CHARS.push(SAINT);
finalizeMoves(SAINT);
