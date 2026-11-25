// ===================== CHIBI REDESIGNS (KAZUMA · YORU · GORO · TETSUMICHI · FROG TRINITY) =====================
// Visual only: hitboxes, frame data, moves, combos and trials are untouched (hurtboxes don't depend on dims).
// Each fighter keeps its silhouette, palette and weapon, rebuilt on the chibi kit from 04_zz_chibi.js.

// small shared helpers
function chibiBrowsAngry(g, r, c, k = 1) {   // thick angled brows for the hot-blooded fighters
  if (!c.thickBrow) return;
  g.save(); g.strokeStyle = c.brow || OUTLINE; g.lineCap = 'round'; g.lineWidth = 0.1 * r * k;
  g.beginPath(); g.moveTo(0.3 * r, -0.3 * r); g.lineTo(0.74 * r, -0.16 * r); g.moveTo(0.86 * r, -0.2 * r); g.lineTo(1.0 * r, -0.26 * r); g.stroke(); g.restore();
}
function chibiFaceBold(g, r, c, o) {   // chibi face + bold brows (used by Kazuma and Goro)
  chibiFace(g, r, c, o);
  const e = o.expr || 'normal';
  if (e !== 'hurt' && e !== 'ko' && e !== 'closed') chibiBrowsAngry(g, r, c);
  if (c.fang && e !== 'hurt' && e !== 'ko') {   // tiny oni fangs
    g.save(); g.fillStyle = '#ffffff'; g.strokeStyle = OUTLINE; g.lineWidth = 0.03 * r;
    for (const x of [0.62, 0.8]) { g.beginPath(); g.moveTo((x - 0.05) * r, 0.7 * r); g.lineTo(x * r, 0.84 * r); g.lineTo((x + 0.05) * r, 0.7 * r); g.closePath(); g.fill(); g.stroke(); }
    g.restore();
  }
}
function chibiShorts(g, sk, c, R, col, len = 0.42, flare = 4) {   // wide chibi trouser tops, keeps the legs readable
  const hb = [sk.hip[0] - 14, sk.hip[1] - 6], hf = [sk.hip[0] + 13, sk.hip[1] - 6];
  const kb = [lerp(sk.hip[0], sk.bk[0], len) - flare - 6, lerp(sk.hip[1], sk.bk[1], len) + 4], kf = [lerp(sk.hip[0], sk.fk[0], len) + flare + 6, lerp(sk.hip[1], sk.fk[1], len) + 4];
  poly(g, [hb, kb, [lerp(kb[0], kf[0], 0.5), Math.min(kb[1], kf[1]) - 3], kf, hf], col, R);
}

// ===================================== KAZUMA =====================================
makeChibi(KAZUMA, {
  build: { arm: 1.14, leg: 1.02, torso: 1.1 },
  colors: { skin: '#f6cfac', hair: '#ea3430', top: '#f4efe4', leg: '#2b2a38', boot: '#f4efe4', foot: '#f4efe4', uarm: '#f6cfac', farm: '#f6cfac', hand: '#c4282c', cuff: '#c4302c', belt: '#151318',
    eye: '#ffb21f', eye2: '#6a2208', accent: '#ff5a1f', band: '#d22a2e', brow: '#8a1416', thickBrow: true, warm: '#e8dfcf', sole: '#d22a2e', pad: '#ff8a2a', collar: '#f4efe4', male: true },
});
Object.assign(KAZUMA, {
  faceFn: chibiFaceBold,
  ropes: [
    { id: 'band1', at: (sk, r) => headPt(sk, -r * 0.98, -r * 0.5), n: 6, seg: 7, w0: 4.4, w1: 3, color: 'band', grav: 0.2, wind: 0.75, fork: true },
    { id: 'band2', at: (sk, r) => headPt(sk, -r * 0.98, -r * 0.38), n: 5, seg: 7, w0: 3.8, w1: 2.6, color: 'band', grav: 0.28, wind: 0.6, fork: true },
  ],
  hairBack(g, r, c, R, o) {   // big spiky flame hair, rounder and softer than the old one
    const T = o.T || 0, sw = i => Math.sin(T * 0.12 + i) * 0.05 * r;
    polyR(g, r, [[0.8, -0.7], [1.18, -1.32], [0.5, -1.02], [0.3, -1.66], [-0.16, -1.08], [-0.76, -1.56], [-0.72, -0.78], [-1.62, -0.92], [-1.08, -0.22], [-1.66, 0.3], [-1.02, 0.4], [-1.32, 0.98], [-0.5, 0.7]], c.hair, R, sw);
    if (!R.mono) { g.fillStyle = 'rgba(120,10,10,0.25)'; g.beginPath(); g.moveTo(-0.9 * r, -0.2 * r); g.lineTo(-1.4 * r, 0.3 * r); g.lineTo(-0.7 * r, 0.5 * r); g.closePath(); g.fill(); }
  },
  hairFront(g, r, c, R) {
    polyR(g, r, [[-0.3, -0.95], [0.4, -1.06], [1.06, -0.68], [1.26, -0.12], [0.96, -0.3], [1.0, 0.1], [0.72, -0.2], [0.62, 0.08], [0.42, -0.34], [0.1, -0.52]], c.hair, R);
    skullHair(g, r, c, R);
    polyR(g, r, [[-0.1, -0.4], [0.06, 0.3], [-0.04, 0.78], [-0.24, 0.5], [-0.3, 0.86], [-0.44, 0.4], [-0.5, -0.1]], c.hair, R);   // spiky sideburn over the ear
    shine(g, r, [[-0.2, -0.9], [0.4, -0.92]], R);
    if (R.mono) return;
    // the red headband with its metal plate
    g.strokeStyle = OUTLINE; g.lineWidth = 0.3 * r; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-1.0 * r, -0.46 * r); g.quadraticCurveTo(0, -0.86 * r, 1.02 * r, -0.56 * r); g.stroke();
    g.strokeStyle = c.band; g.lineWidth = 0.2 * r; g.stroke();
    circ(g, -1.0 * r, -0.44 * r, 0.14 * r, c.band, R);
    g.save(); g.translate(0.42 * r, -0.74 * r); g.rotate(0.1); g.fillStyle = '#cfd6e0'; g.strokeStyle = OUTLINE; g.lineWidth = 1.2;
    g.beginPath(); g.rect(-0.2 * r, -0.08 * r, 0.4 * r, 0.16 * r); g.fill(); g.stroke();
    g.fillStyle = c.accent; g.beginPath(); g.moveTo(0, -0.06 * r); g.quadraticCurveTo(0.07 * r, 0.0, 0, 0.06 * r); g.quadraticCurveTo(-0.07 * r, 0.0, 0, -0.06 * r); g.fill(); g.restore();
  },
  neckWear(g, sk, p, c, R) { if (R.mono) return; const n = sk.neck; g.strokeStyle = '#c9bfae'; g.lineWidth = 3; g.beginPath(); g.moveTo(n[0] - 8, n[1] + 4); g.lineTo(n[0] + 4, n[1] + 26); g.moveTo(n[0] + 11, n[1] + 3); g.lineTo(n[0] + 4, n[1] + 26); g.stroke(); },
  torsoDetail(g, L, bw, c) {   // open gi with a flame emblem on the back panel
    g.fillStyle = c.skin; g.beginPath(); g.moveTo(1 * bw, -L - 6); g.lineTo(15 * bw, -L - 3); g.lineTo(14 * bw, -L * 0.36); g.lineTo(6 * bw, -L * 0.45); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(150,80,50,0.45)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(9 * bw, -L * 0.78); g.quadraticCurveTo(12 * bw, -L * 0.66, 10 * bw, -L * 0.56); g.stroke();
    g.strokeStyle = '#c9bfae'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(1 * bw, -L - 5); g.lineTo(6 * bw, -L * 0.45); g.stroke();
    g.fillStyle = 'rgba(0,0,0,0.07)'; g.fillRect(-14 * bw, -L * 0.4, 13 * bw, L * 0.4);
    g.fillStyle = c.accent; g.beginPath(); g.moveTo(-7 * bw, -L * 0.52); g.quadraticCurveTo(-2 * bw, -L * 0.66, -5 * bw, -L * 0.82); g.quadraticCurveTo(-11 * bw, -L * 0.7, -7 * bw, -L * 0.52); g.fill();
  },
  torsoOver(g, L, bw, c, R) {   // black belt with knot and tails
    if (!R.mono) { g.fillStyle = c.belt; g.fillRect(-13 * bw, -6, 27 * bw, 6); }
    poly(g, [[-10 * bw, -4], [-19 * bw, 12], [-13 * bw, 14], [-6 * bw, 0]], c.belt, R, 3);
    poly(g, [[-8 * bw, -4], [-11 * bw, 15], [-5 * bw, 16], [-4 * bw, 0]], c.belt, R, 3);
  },
  drawSkirt(g, sk, p, c, R) { chibiShorts(g, sk, c, R, c.leg, 0.45, 3); },
});

// ===================================== YORU =====================================
makeChibi(YORU, {
  build: { arm: 0.96, leg: 0.98, torso: 0.98 },
  colors: { skin: '#fbe2d4', hair: '#4a3488', top: '#232438', leg: '#232438', boot: '#2c2d40', foot: '#2c2d40', uarm: '#232438', farm: '#232438', hand: '#2c2d40', cuff: '#9aa0bc', belt: '#c9305a',
    eye: '#c45cff', eye2: '#2a0a4a', accent: '#b45cff', brow: '#3b2b70', scarf: '#d2335f', mask: '#17182a', warm: '#2c2d40', sole: '#c9305a', pad: '#b45cff', collar: '#17182a',
    plaid: '#2c2d44', plaid2: '#3a2f60', plaidLine: '#b45cff' },
});
Object.assign(YORU, {
  ropes: [
    { id: 'tail', at: (sk, r) => headPt(sk, -r * 0.9, -r * 0.7), n: 8, seg: 9, w0: 10, w1: 3, color: 'hair', grav: 0.4, wind: 0.5 },
    { id: 'scarf1', at: sk => [sk.neck[0] - 6, sk.neck[1] + 4], n: 9, seg: 9, w0: 7, w1: 5, color: 'scarf', grav: 0.12, wind: 0.95, fork: true },
    { id: 'scarf2', at: sk => [sk.neck[0] - 7, sk.neck[1] + 7], n: 7, seg: 9, w0: 6, w1: 4, color: 'scarf', grav: 0.2, wind: 0.75, fork: true },
  ],
  hairBack(g, r, c, R) { polyR(g, r, [[0.8, -0.74], [0.2, -1.2], [-0.6, -1.08], [-1.14, -0.5], [-1.2, 0.4], [-0.9, 0.78], [-0.5, 0.5], [-0.3, 0.1]], c.hair, R); },
  hairFront(g, r, c, R) {
    // ninja mask over the lower face (below the big eyes)
    if (!R.mono) {
      poly(g, [[-0.4 * r, 0.5 * r], [0.2 * r, 0.6 * r], [1.04 * r, 0.52 * r], [0.98 * r, 0.7 * r], [0.6 * r, 0.92 * r], [0.1 * r, 0.98 * r], [-0.5 * r, 0.6 * r]], c.mask, R);
      g.strokeStyle = 'rgba(180,92,255,0.55)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0.1 * r, 0.7 * r); g.lineTo(0.9 * r, 0.64 * r); g.stroke();
    }
    // long fringe with one lock falling over the face
    skullHair(g, r, c, R);
    polyR(g, r, [[-0.36, -0.96], [0.36, -1.04], [1.02, -0.66], [1.14, -0.04], [0.98, -0.24], [0.94, 0.16], [0.74, -0.22], [0.5, 0.06], [0.36, -0.38], [0.06, -0.52]], c.hair, R);
    polyR(g, r, [[-0.12, -0.3], [0.02, 0.45], [-0.1, 1.05], [-0.3, 1.3], [-0.42, 0.8], [-0.48, 0.2]], c.hair, R);
    shine(g, r, [[-0.2, -0.9], [0.4, -0.9]], R);
    if (R.mono) return;
    // hitai-ate (forehead plate) worn like the chibi headband
    g.strokeStyle = OUTLINE; g.lineWidth = 0.26 * r; g.lineCap = 'round'; g.beginPath(); g.moveTo(-1.0 * r, -0.42 * r); g.quadraticCurveTo(0, -0.84 * r, 1.0 * r, -0.54 * r); g.stroke();
    g.strokeStyle = '#2c2d40'; g.lineWidth = 0.16 * r; g.stroke();
    g.save(); g.translate(0.5 * r, -0.72 * r); g.rotate(0.12); g.fillStyle = '#9aa0bc'; g.strokeStyle = OUTLINE; g.lineWidth = 1.2;
    g.beginPath(); g.rect(-0.2 * r, -0.09 * r, 0.4 * r, 0.18 * r); g.fill(); g.stroke();
    g.strokeStyle = '#4a3488'; g.lineWidth = 1.3; g.beginPath(); g.arc(0, 0, 0.05 * r, 0, TAU); g.moveTo(-0.1 * r, 0); g.lineTo(0.1 * r, 0); g.stroke(); g.restore();
    // lily hair pin (her "Shadow Lily" title)
    g.save(); g.translate(-0.62 * r, -0.86 * r); g.fillStyle = '#f2ecff'; g.strokeStyle = OUTLINE; g.lineWidth = 1;
    for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + (i - 1) * 0.8; g.beginPath(); g.ellipse(Math.cos(a) * 0.1 * r, Math.sin(a) * 0.1 * r, 0.12 * r, 0.05 * r, a, 0, TAU); g.fill(); g.stroke(); }
    g.fillStyle = c.accent; g.beginPath(); g.arc(0, 0, 0.04 * r, 0, TAU); g.fill(); g.restore();
  },
  neckWear(g, sk, p, c, R) { highCollar(g, sk, c, R); limb(g, [sk.neck[0] - 6, sk.neck[1] + 5], [sk.neck[0] + 7, sk.neck[1] + 3], 8.5, 8, c.scarf, R); },
  torsoDetail(g, L, bw, c) {
    g.fillStyle = '#34364c'; g.beginPath(); g.moveTo(-6 * bw, -L * 0.92); g.lineTo(12 * bw, -L * 0.94); g.lineTo(13 * bw, -L * 0.5); g.lineTo(-4 * bw, -L * 0.46); g.closePath(); g.fill();
    g.strokeStyle = c.belt; g.lineWidth = 3; g.beginPath(); g.moveTo(-12 * bw, -L * 0.9); g.lineTo(12 * bw, -L * 0.15); g.stroke();
    g.fillStyle = '#9aa0bc'; for (const t of [0.35, 0.6]) { g.beginPath(); g.arc(lerp(-12, 12, t) * bw, lerp(-L * 0.9, -L * 0.15, t), 1.8, 0, TAU); g.fill(); }
  },
  torsoOver(g, L, bw, c, R) { if (R.mono) return; g.fillStyle = c.belt; g.fillRect(-13 * bw, -6, 26 * bw, 6); },
  drawSkirt(g, sk, p, c, R, o) { plaidSkirt(g, sk, c, R, o); },   // short dark pleated kunoichi skirt
});

// ===================================== GORO =====================================
makeChibi(GORO, {
  build: { arm: 1.55, leg: 1.4, torso: 1.62 },
  colors: { skin: '#c98e68', hair: '#1b1412', top: '#c98e68', leg: '#2e2522', boot: '#2a1e1c', foot: '#2a1e1c', uarm: '#c98e68', farm: '#c98e68', hand: '#2a2020', cuff: '#5a2224',
    eye: '#ff4a2a', eye2: '#5a0808', accent: '#ff3b1f', brow: '#1b1412', thickBrow: true, fang: true, horn: '#f1e8d2', armor: '#6a2628', gold: '#d9a441', rope: '#ece3cc',
    warm: '#ece3cc', sole: '#5a2224', pad: '#d9a441', collar: '#6a2628', male: true },
});
Object.assign(GORO, {
  faceFn: chibiFaceBold, portraitScale: 0.62,
  ropes: [{ id: 'mane', at: (sk, r) => headPt(sk, -r * 1.0, -r * 0.1), n: 5, seg: 9, w0: 14, w1: 5, color: 'hair', grav: 0.3, wind: 0.5 }],
  hairBack(g, r, c, R, o) {   // wild oni mane
    const T = o.T || 0, pts = [];
    for (let i = 0; i <= 14; i++) { const a = -2.4 + i * (3.3 / 14), rr = i % 2 ? 1.0 : 1.42 + Math.sin(T * 0.1 + i) * 0.06; pts.push([Math.cos(a - Math.PI / 2) * rr * 1.04 - 0.16, Math.sin(a - Math.PI / 2) * rr]); }
    pts.push([-0.3, 0.6]);
    polyR(g, r, pts, c.hair, R);
    polyR(g, r, [[-0.2, -0.86], [0.06, -0.92], [0.2, -1.46], [0.04, -1.7], [-0.04, -1.3]], c.horn, R);
  },
  hairFront(g, r, c, R) {
    polyR(g, r, [[0.26, -0.82], [0.6, -0.88], [0.92, -1.42], [0.82, -1.82], [0.56, -1.36]], c.horn, R);   // big front horn
    if (!R.mono) { g.strokeStyle = 'rgba(120,90,50,0.5)'; g.lineWidth = 1.2; for (const t of [0.35, 0.6]) { g.beginPath(); g.moveTo(lerp(0.3, 0.84, t) * r, lerp(-0.86, -1.5, t) * r); g.lineTo(lerp(0.62, 0.9, t) * r, lerp(-0.9, -1.48, t) * r); g.stroke(); } }
    skullHair(g, r, c, R);
    polyR(g, r, [[-0.1, -0.5], [0.08, 0.26], [-0.06, 0.7], [-0.26, 0.42], [-0.36, 0.8], [-0.5, 0.3], [-0.56, -0.2]], c.hair, R);   // shaggy sideburn
    polyR(g, r, [[-0.3, -0.98], [0.3, -1.04], [1.0, -0.66], [1.1, -0.3], [0.88, -0.44], [0.8, -0.24], [0.62, -0.42], [0.44, -0.3], [0.3, -0.5], [0.02, -0.58]], c.hair, R);
    if (R.mono) return;
    g.strokeStyle = '#c0182a'; g.lineWidth = 0.07 * r; g.beginPath(); g.moveTo(0.16 * r, 0.6 * r); g.lineTo(0.36 * r, 0.66 * r); g.moveTo(0.14 * r, 0.7 * r); g.lineTo(0.32 * r, 0.76 * r); g.stroke();   // war paint
  },
  neckWear(g, sk, p, c, R) {   // prayer-bead necklace
    if (R.mono) return; const n = sk.neck;
    for (let i = 0; i < 7; i++) { const t = i / 6, x = n[0] - 12 + t * 26, y = n[1] + 6 + Math.sin(t * Math.PI) * 9; circ(g, x, y, 3.2, i === 3 ? c.gold : '#3a2a24', R); }
  },
  torsoDetail: GORO.torsoDetail, torsoOver: GORO.torsoOver,
  drawSkirt(g, sk, p, c, R) { chibiShorts(g, sk, c, R, c.leg, 0.5, 6); },
  // the cleaver is drawn behind the big chibi head while it rests over the shoulder, in front otherwise
  weaponBack(g, sk, p, c, R) { if (goroAxeBehind(p)) goroCleaver(g, sk, p, c, R); },
  weaponFront(g, sk, p, c, R) { if (!goroAxeBehind(p)) goroCleaver(g, sk, p, c, R); },
  shoulderOver(g, sk, p, c, R) {
    const [x, y] = sk.sF;
    g.save(); g.translate(x, y); g.rotate(p.fa1 * 0.35 - 0.2);
    for (let i = 2; i >= 0; i--) poly(g, [[-15, -11 + i * 8], [17, -13 + i * 8], [19, -3 + i * 8], [-17, 0 + i * 8]], i ? '#4a1b1d' : c.armor, R, 4);
    if (!R.mono) { g.fillStyle = c.gold; g.beginPath(); g.arc(0, -7, 2.8, 0, TAU); g.fill(); }
    g.restore();
  },
});
function goroAxeBehind(p) { return Math.sin(p.wa) < -0.25 && Math.cos(p.wa) < 0.2; }
function goroCleaver(g, sk, p, c, R) {   // same cleaver as before, a little shorter to fit the chibi proportions
  const [hx, hy] = sk.fh, a = p.wa, dx = Math.sin(a), dy = Math.cos(a), nx = -Math.cos(a), ny = Math.sin(a), k = 0.88;
  const E = [hx + dx * 84, hy + dy * 84];
  limb(g, [hx - dx * 14, hy - dy * 14], E, 3.8, 3.4, '#3a2616', R);
  if (!R.mono) { g.strokeStyle = c.rope; g.lineWidth = 2; for (let u = 8; u < 30; u += 6) { g.beginPath(); g.moveTo(hx + dx * u + nx * 4, hy + dy * u + ny * 4); g.lineTo(hx + dx * (u + 3) - nx * 4, hy + dy * (u + 3) - ny * 4); g.stroke(); } }
  const P = (u, v) => [E[0] + (dx * u + nx * v) * k, E[1] + (dy * u + ny * v) * k];
  poly(g, [P(6, -4), P(9, 25), P(-5, 41), P(-28, 43), P(-38, 28), P(-33, -4)], c.axe || '#8f99a6', R);
  if (!R.mono) {
    g.strokeStyle = '#eef4fb'; g.lineWidth = 3; g.beginPath(); const a1 = P(9, 25), a2 = P(-5, 41), a3 = P(-28, 43); g.moveTo(a1[0], a1[1]); g.lineTo(a2[0], a2[1]); g.lineTo(a3[0], a3[1]); g.stroke();
    g.fillStyle = c.accent; const m = P(-14, 16); g.beginPath(); g.arc(m[0], m[1], 4, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(40,20,20,0.45)'; g.lineWidth = 1.5; g.beginPath(); g.arc(m[0], m[1], 7, 0, TAU); g.stroke();
    poly(g, [P(4, -4), P(22, -2), P(4, 4)], '#8f99a6', R, 3);
  }
}
GORO.rageColors = { ...GORO.colors, skin: '#cc4a3c', top: '#cc4a3c', uarm: '#cc4a3c', farm: '#cc4a3c', accent: '#ff1a1a', eye: '#ffdd33', eye2: '#a01010' };

// ===================================== TETSUMICHI =====================================
makeChibi(CONDUCTOR, {
  build: { arm: 0.98, leg: 1.0, torso: 1.04 },
  colors: { skin: '#f8dcc8', hair: '#17171f', top: '#f6f4f0', leg: '#1b1b24', boot: '#121218', foot: '#121218', uarm: '#f6f4f0', farm: '#f6f4f0', hand: '#ffffff', cuff: '#c8102e', belt: '#1b1b24',
    eye: '#e0203a', eye2: '#4a0610', accent: '#ff2a3a', red: '#c8102e', gold: '#e8b84a', brow: '#17171f', warm: '#f6f4f0', sole: '#c8102e', pad: '#e8b84a', collar: '#f6f4f0', male: true },
});
Object.assign(CONDUCTOR, {
  hairBack(g, r, c, R) { polyR(g, r, [[0.4, -0.8], [-0.4, -1.04], [-1.1, -0.5], [-1.18, 0.3], [-0.86, 0.72], [-0.5, 0.5], [-0.3, 0.0]], c.hair, R); },
  hairFront(g, r, c, R) {
    polyR(g, r, [[0.1, -0.5], [0.4, 0.2], [0.62, -0.1], [0.82, 0.08], [0.98, -0.36]], c.hair, R);   // neat bangs under the cap
    polyR(g, r, [[-0.12, -0.3], [0.0, 0.4], [-0.14, 0.82], [-0.34, 0.5], [-0.42, 0.0]], c.hair, R);
    // conductor's cap: round crown, red band, gold badge and a glossy visor
    polyR(g, r, [[-1.12, -0.44], [-1.16, -1.06], [-0.7, -1.48], [0.2, -1.6], [0.9, -1.36], [1.14, -0.86], [1.06, -0.5]], '#f7f7f7', R);
    polyR(g, r, [[-1.12, -0.48], [1.08, -0.6], [1.06, -0.32], [-1.08, -0.22]], c.red, R);
    polyR(g, r, [[0.6, -0.48], [1.46, -0.36], [1.42, -0.2], [0.6, -0.28]], '#111116', R);
    if (R.mono) return;
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(-0.2 * r, -1.28 * r, 0.42 * r, 0.12 * r, -0.1, 0, TAU); g.fill();
    circ(g, 0.5 * r, -1.02 * r, 0.19 * r, c.gold, R);
    g.fillStyle = c.red; g.beginPath(); g.arc(0.5 * r, -1.02 * r, 0.08 * r, 0, TAU); g.fill();
    g.strokeStyle = c.gold; g.lineWidth = 2; g.beginPath(); g.moveTo(0.28 * r, -1.02 * r); g.lineTo(0.04 * r, -1.08 * r); g.moveTo(0.72 * r, -1.02 * r); g.lineTo(0.96 * r, -1.08 * r); g.stroke();
    // monocle over the near eye, with its gold chain
    g.strokeStyle = c.gold; g.lineWidth = 2.2; g.beginPath(); g.arc(0.5 * r, 0.25 * r, 0.36 * r, 0, TAU); g.stroke();
    g.lineWidth = 1.2; g.beginPath(); g.moveTo(0.22 * r, 0.48 * r); g.quadraticCurveTo(0.0, 0.95 * r, -0.3 * r, 0.5 * r); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 1.5; g.beginPath(); g.arc(0.5 * r, 0.25 * r, 0.27 * r, -2.4, -1.6); g.stroke();
  },
  neckWear(g, sk, p, c, R) {
    highCollar(g, sk, c, R);
    if (R.mono) return; const n = sk.neck;
    g.fillStyle = c.red; g.strokeStyle = OUTLINE; g.lineWidth = 1.1;   // red bow tie
    g.beginPath(); g.moveTo(n[0] + 4, n[1] + 6); g.lineTo(n[0] - 3, n[1] + 2); g.lineTo(n[0] - 3, n[1] + 10); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(n[0] + 4, n[1] + 6); g.lineTo(n[0] + 11, n[1] + 2); g.lineTo(n[0] + 11, n[1] + 10); g.closePath(); g.fill(); g.stroke();
    circ(g, n[0] + 4, n[1] + 6, 2.2, c.gold, R);
  },
  drawSkirt(g, sk, p, c, R) {   // short coat skirt over the trousers (the tails are the ropes)
    const hb = [sk.hip[0] - 15, sk.hip[1] - 8], hf = [sk.hip[0] + 13, sk.hip[1] - 8];
    const kb = [lerp(sk.hip[0], sk.bk[0], 0.35) - 15, lerp(sk.hip[1], sk.bk[1], 0.35) + 5], kf = [lerp(sk.hip[0], sk.fk[0], 0.25) + 10, lerp(sk.hip[1], sk.fk[1], 0.25) + 1];
    poly(g, [hb, kb, kf, hf], c.top, R);
    if (!R.mono) { g.strokeStyle = c.red; g.lineWidth = 2.5; g.beginPath(); g.moveTo(...kb); g.lineTo(...kf); g.stroke(); g.fillStyle = c.belt; g.fillRect(hb[0], hb[1] - 1, hf[0] - hb[0], 4); g.fillStyle = c.gold; g.fillRect(sk.hip[0] + 2, hb[1] - 1, 5, 4); }
  },
});
CONDUCTOR.ropes = [
  { id: 'tail1', at: sk => [sk.hip[0] - 10, sk.hip[1] - 5], n: 4, seg: 9, w0: 9, w1: 7, color: 'top', grav: 0.55, wind: 0.4 },
  { id: 'tail2', at: sk => [sk.hip[0] - 5, sk.hip[1] - 3], n: 3, seg: 9, w0: 7, w1: 6, color: 'top', grav: 0.6, wind: 0.3 },
];

// ===================================== FROG TRINITY =====================================
// Drawn by drawFrogTrinity (no skeleton). Chibi pass: glossy anime eyes, blush, rounder heads.
FROGS.chibi = true;
