// ============================ BORGAR — THE RUNE BERSERKER ============================
// Heavy / grappler / tank. A short, enormously broad dwarf with a rune-forged hammer, built on the chibi kit.
// Systems: RUNE FURY (fills when he takes damage and lands heavy blows) → RUNE BERSERKER mode ·
//          STONE SKIN (damage reduction + armor on heavy moves) · command grab, shockwave, launcher, armored overhead.
const BORGAR_BERSERK_T = 480, BORGAR_SKIN_T = 300;

// ---------------------------------- art ----------------------------------
function borgarRunePal(base, k, berserk) {   // palette variants: rune glow intensity 0..1
  const p = { ...base, runeK: k };
  if (berserk) Object.assign(p, { accent: '#ffcf3a', eye: '#ffd84a', rune: '#ffe27a', skin: '#efa982', uarm: '#efa982', farm: '#efa982' });
  return p;
}
function borgarFace(g, r, c, o) {
  const e = o.expr || 'normal';
  if (e === 'hurt' || e === 'ko' || e === 'closed') { chibiFace(g, r, c, o); return; }
  const ex = 0.5 * r, ey = 0.22 * r, fx = 0.94 * r;
  g.save(); g.lineCap = 'round';
  g.fillStyle = 'rgba(255,110,90,0.3)'; g.beginPath(); g.ellipse(0.3 * r, 0.5 * r, 0.16 * r, 0.07 * r, 0, 0, TAU); g.fill();
  // smaller, fierce eyes under heavy brows
  chibiEye(g, fx, ey, 0.06 * r, 0.22 * r, c, o, true);
  chibiEye(g, ex, ey + 0.02 * r, 0.19 * r, 0.27 * r, c, o, false);
  g.fillStyle = c.skin; g.beginPath(); g.moveTo(ex - 0.32 * r, ey - 0.5 * r); g.lineTo(fx + 0.16 * r, ey - 0.5 * r); g.lineTo(fx + 0.12 * r, ey - 0.16 * r); g.lineTo(ex - 0.3 * r, ey - 0.2 * r); g.closePath(); g.fill();
  g.strokeStyle = OUTLINE; g.lineWidth = 0.06 * r; g.beginPath(); g.moveTo(ex - 0.26 * r, ey - 0.2 * r); g.lineTo(ex + 0.22 * r, ey - 0.14 * r); g.stroke();
  // bushy brows (angled down toward the nose)
  const k = e === 'shout' ? 0.08 : 0;
  g.fillStyle = c.hair; g.strokeStyle = OUTLINE; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(ex - 0.34 * r, ey - (0.46 + k) * r); g.lineTo(ex + 0.3 * r, ey - (0.24 - k) * r); g.lineTo(ex + 0.26 * r, ey - (0.08 - k) * r); g.lineTo(ex - 0.36 * r, ey - (0.28 + k) * r); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(0.86 * r, ey - 0.26 * r); g.lineTo(1.02 * r, ey - 0.36 * r); g.lineTo(1.02 * r, ey - 0.2 * r); g.closePath(); g.fill(); g.stroke();
  // big round nose
  g.fillStyle = '#e09a78'; g.beginPath(); g.arc(0.88 * r, 0.42 * r, 0.15 * r, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.arc(0.84 * r, 0.37 * r, 0.05 * r, 0, TAU); g.fill();
  g.restore();
}
function borgarBeard(g, r, c, R, o) {
  const e = o.expr || 'normal', T = o.T || 0, sway = Math.sin(T * 0.08) * 0.04;
  polyR(g, r, [[-0.46, 0.05], [0.1, 0.5], [0.52, 0.58], [1.04, 0.4], [1.2, 0.82], [1.12, 1.35], [0.88, 1.78 + sway], [0.7, 2.38 + sway], [0.46, 1.9], [0.12, 1.62], [-0.3, 1.1]], c.hair, R);
  if (R.mono) return;
  g.strokeStyle = 'rgba(60,20,8,0.45)'; g.lineWidth = 0.05 * r; g.lineCap = 'round';
  for (const x of [0.05, 0.35, 0.65, 0.92]) { g.beginPath(); g.moveTo(x * r, 0.72 * r); g.quadraticCurveTo((x - 0.04) * r, 1.1 * r, (x * 0.6 + 0.24) * r, 1.45 * r); g.stroke(); }
  // braided tip with two bronze rings
  for (const [y, w] of [[1.84, 0.18], [2.1, 0.13]]) { g.fillStyle = c.bronze; g.strokeStyle = OUTLINE; g.lineWidth = 1.3; g.beginPath(); g.ellipse((0.6 + (y - 1.66) * 0.1) * r, (y + sway) * r, w * r, 0.07 * r, -0.15, 0, TAU); g.fill(); g.stroke(); }
  // moustache
  polyR(g, r, [[0.5, 0.5], [0.78, 0.44], [1.06, 0.5], [1.16, 0.66], [0.96, 0.6], [0.78, 0.66], [0.58, 0.72], [0.4, 0.66]], c.hair2, R);
  if (e === 'shout' || e === 'grin') {   // roaring mouth inside the beard
    g.fillStyle = '#3a0c08'; g.strokeStyle = OUTLINE; g.lineWidth = 1.4; g.beginPath(); g.ellipse(0.8 * r, 0.82 * r, 0.16 * r, e === 'shout' ? 0.14 * r : 0.07 * r, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#ffffff'; g.fillRect(0.68 * r, 0.71 * r, 0.24 * r, 0.04 * r);
  }
}
function borgarHelm(g, r, c, R, o) {
  // curved horns (the silhouette "ears", like the chibi cat beanie)
  polyR(g, r, [[-0.62, -0.82], [-1.12, -1.18], [-1.22, -1.78], [-0.98, -1.4], [-0.74, -1.22], [-0.4, -1.0]], c.horn, R);
  polyR(g, r, [[0.32, -0.98], [0.52, -1.5], [0.98, -1.88], [0.84, -1.48], [0.74, -1.18], [0.66, -0.9]], c.horn, R);
  if (!R.mono) { g.strokeStyle = 'rgba(120,90,50,0.6)'; g.lineWidth = 0.05 * r; for (const [x, y] of [[-0.92, -1.25], [-1.05, -1.48], [0.72, -1.3], [0.82, -1.55]]) { g.beginPath(); g.moveTo((x - 0.1) * r, y * r); g.lineTo((x + 0.1) * r, (y + 0.06) * r); g.stroke(); } }
  // steel dome
  polyR(g, r, [[-1.12, -0.14], [-1.1, -0.6], [-0.82, -1.0], [-0.3, -1.2], [0.28, -1.18], [0.78, -0.96], [1.06, -0.58], [1.12, -0.24]], c.steel, R);
  if (R.mono) { polyR(g, r, [[-1.16, -0.36], [1.15, -0.46], [1.16, -0.12], [-1.15, 0.0]], c.bronze, R); return; }
  g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.ellipse(-0.22 * r, -0.9 * r, 0.42 * r, 0.12 * r, -0.15, 0, TAU); g.fill();
  g.fillStyle = c.steel2; g.beginPath(); g.moveTo(-0.1 * r, -1.18 * r); g.lineTo(0.1 * r, -1.18 * r); g.lineTo(0.16 * r, -0.4 * r); g.lineTo(-0.06 * r, -0.4 * r); g.closePath(); g.fill();
  // bronze brow band with rivets and a rune plate
  polyR(g, r, [[-1.16, -0.36], [1.15, -0.46], [1.16, -0.12], [-1.15, 0.0]], c.bronze, R);
  g.fillStyle = '#6a4a1e'; for (let i = -4; i <= 4; i++) { g.beginPath(); g.arc(i * 0.24 * r, (-0.24 - i * 0.012) * r, 0.04 * r, 0, TAU); g.fill(); }
  g.save(); g.translate(0.62 * r, -0.62 * r); circ(g, 0, 0, 0.17 * r, c.steel2, R);
  runeGlyph(g, 0, 0, 0.12 * r, c, 0.5 + 0.5 * c.runeK, 2); g.restore();
}
function borgarEarGuard(g, r, c, R, T) {   // bronze ear guard with a glowing rune ring (where the chibi kit puts headphones)
  polyR(g, r, [[-1.14, -0.3], [-0.6, -0.6], [0.0, -0.5], [0.05, -0.1], [-0.2, 0.3], [-0.6, 0.62], [-1.05, 0.6], [-1.18, 0.15]], c.hair, R);
  ell(g, -0.42 * r, 0.18 * r, 0.27 * r, 0.32 * r, c.bronze, R);
  ell(g, -0.4 * r, 0.18 * r, 0.15 * r, 0.19 * r, c.steel2, R);
  if (R.mono) return;
  runeGlyph(g, -0.4 * r, 0.18 * r, 0.1 * r, c, 0.4 + 0.6 * c.runeK, 1.6);
}
// a tiny angular rune; intensity k drives glow
function runeGlyph(g, x, y, s, c, k, lw = 1.6, kind = 0) {
  g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = c.rune; g.lineWidth = lw; g.lineCap = 'round'; g.globalAlpha = clamp(k, 0, 1);
  if (FX.hq && k > 0.5) { g.shadowColor = c.rune; g.shadowBlur = 6 + 8 * k; }
  g.beginPath();
  switch (kind % 4) {
    case 0: g.moveTo(x, y - s); g.lineTo(x, y + s); g.moveTo(x, y - s * 0.4); g.lineTo(x + s * 0.6, y - s); g.moveTo(x, y); g.lineTo(x + s * 0.6, y - s * 0.4); break;   // ᚠ
    case 1: g.moveTo(x - s * 0.5, y + s); g.lineTo(x, y - s); g.lineTo(x + s * 0.5, y + s); g.moveTo(x - s * 0.25, y + s * 0.2); g.lineTo(x + s * 0.25, y + s * 0.2); break;   // ᚨ-ish
    case 2: g.moveTo(x - s * 0.6, y - s); g.lineTo(x + s * 0.6, y + s); g.moveTo(x + s * 0.6, y - s); g.lineTo(x - s * 0.6, y + s); break;   // ᚷ
    default: g.moveTo(x - s * 0.5, y - s); g.lineTo(x - s * 0.5, y + s); g.moveTo(x - s * 0.5, y - s * 0.2); g.lineTo(x + s * 0.5, y + s * 0.4); g.lineTo(x + s * 0.5, y + s); break;
  }
  g.stroke(); g.restore();
}
function runeLine(g, A, Bp, c, k, n = 3, w = 2) {   // a row of runes tattooed along a limb segment
  for (let i = 0; i < n; i++) { const t = (i + 0.7) / (n + 0.4), P = lerpP(A, Bp, t); runeGlyph(g, P[0], P[1], 3.6, c, k, w, i + Math.round(A[0])); }
}
function borgarHammer(g, sk, p, c, R) {
  const [hx, hy] = sk.fh, a = p.fa2, dx = Math.sin(a), dy = Math.cos(a), ang = Math.atan2(dy, dx);
  g.save(); g.translate(hx, hy); g.rotate(ang);
  // haft: leather-wrapped, bronze pommel
  if (!R.mono) { g.fillStyle = OUTLINE; g.fillRect(-18, -5, 64, 10); }
  g.fillStyle = R.mono || c.haft; g.fillRect(-16, -3, 60, 6);
  if (!R.mono) { g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1.2; for (let x = -12; x < 14; x += 5) { g.beginPath(); g.moveTo(x, -3); g.lineTo(x + 3, 3); g.stroke(); } }
  circ(g, -18, 0, 5, c.bronze, R);
  // head: a massive steel block with bronze bands
  const X0 = 36, X1 = 64, Y = 25;
  poly(g, [[X0, -Y], [X1, -Y + 3], [X1, Y - 3], [X0, Y]], c.steel, R, 4.2);
  if (!R.mono) {
    g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(X0 + 3, -Y + 3, X1 - X0 - 6, 6);
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(X0 + 3, Y - 9, X1 - X0 - 6, 6);
    g.fillStyle = c.bronze; g.fillRect(X0, -Y + 1, 5, 2 * Y - 2); g.fillRect(X1 - 5, -Y + 2, 5, 2 * Y - 4);
    g.strokeStyle = OUTLINE; g.lineWidth = 1.5; g.strokeRect(X0, -Y + 1, 5, 2 * Y - 2); g.strokeRect(X1 - 5, -Y + 2, 5, 2 * Y - 4);
    g.fillStyle = c.steel2; g.beginPath(); g.arc((X0 + X1) / 2, 0, 8.5, 0, TAU); g.fill();
    runeGlyph(g, (X0 + X1) / 2, 0, 6, c, 0.45 + 0.55 * c.runeK, 2.2, 0);
    runeGlyph(g, (X0 + X1) / 2, -15, 4, c, 0.3 + 0.7 * c.runeK, 1.6, 2); runeGlyph(g, (X0 + X1) / 2, 15, 4, c, 0.3 + 0.7 * c.runeK, 1.6, 1);
  }
  g.restore();
}
function borgarKilt(g, sk, c, R, o) {   // layered leather straps with bronze studs + a chainmail fringe
  const fl = Math.sin((o.T || 0) * 0.12) * 1.5;
  const hb = [sk.hip[0] - 21, sk.hip[1] - 8], hf = [sk.hip[0] + 20, sk.hip[1] - 8];
  const kb = [lerp(sk.hip[0], sk.bk[0], 0.7) - 18 + fl, lerp(sk.hip[1], sk.bk[1], 0.7) + 6], kf = [lerp(sk.hip[0], sk.fk[0], 0.7) + 17, lerp(sk.hip[1], sk.fk[1], 0.7) + 5];
  poly(g, [hb, [kb[0] - 2, kb[1] + 4], [kf[0] + 2, kf[1] + 4], hf], c.mail, R);
  if (!R.mono) { g.save(); g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 1; for (let i = 0; i < 6; i++) { const P = lerpP([kb[0] - 2, kb[1] + 1], [kf[0] + 2, kf[1] + 1], i / 5); g.beginPath(); g.arc(P[0], P[1], 2.2, 0, TAU); g.stroke(); } g.restore(); }
  for (let i = 0; i < 4; i++) {
    const t0 = i / 4, t1 = (i + 1) / 4, a = lerpP(hb, hf, t0 + 0.02), b = lerpP(hb, hf, t1 - 0.02), a2 = lerpP(kb, kf, t0 + 0.03), b2 = lerpP(kb, kf, t1 - 0.03);
    poly(g, [a, [a2[0], a2[1] - 3], [b2[0], b2[1] - 3], b], i % 2 ? c.leather2 : c.leather, R, 3);
    if (!R.mono) { const m = lerpP(lerpP(a, b, 0.5), lerpP(a2, b2, 0.5), 0.72); g.fillStyle = c.bronze; g.beginPath(); g.arc(m[0], m[1] - 2, 2, 0, TAU); g.fill(); }
  }
  // belt with a huge bronze rune buckle
  poly(g, [[hb[0] - 1, hb[1] - 5], [hf[0] + 1, hf[1] - 6], [hf[0] + 1, hf[1] + 3], [hb[0] - 1, hb[1] + 4]], c.belt, R, 3);
  const bc = lerpP(hb, hf, 0.62); circ(g, bc[0], bc[1] - 1, 8.5, c.bronze, R);
  if (!R.mono) { circ(g, bc[0], bc[1] - 1, 5, c.steel2, R); runeGlyph(g, bc[0], bc[1] - 1, 3.6, c, 0.5 + 0.5 * c.runeK, 1.6, 3); }
}

// ---------------------------------- character ----------------------------------
const BORGAR = {
  id: 'borgar', name: 'BORGAR', jp: 'ボルガル', title: 'The Rune Berserker', titleJp: '刻印の狂戦士',
  style: 'GRAPPLER / TANK', desc: 'A rune-tattooed dwarf with a mountain of a hammer. Slow, armored and brutal up close: command grab, shockwaves and a fury that grows with every blow he takes.',
  stats: { power: 5, speed: 1, range: 2, defense: 5 },
  scale: 1.0, health: 1200, walk: 3.25, backWalk: 2.6, jumpV: -15.2, jumpX: 3.7, dashV: 9.2, backdashV: 7, juggleMax: 5, wide: 1.18,
  hurt: { w: 62, h: 156, ch: 112, air: 130, airTop: 150 },
  voicePitch: 0.35, voiceRate: 0.85,
  colors: {
    skin: '#e8b08a', hair: '#a24a20', hair2: '#7e3414', top: '#3a2a22', leg: '#4a3426', boot: '#5e6674', foot: '#5e6674', uarm: '#e8b08a', farm: '#e8b08a', hand: '#3a2a20', cuff: '#b8823a', belt: '#22160f',
    eye: '#ffb02a', eye2: '#4a1e00', accent: '#ffa21a', brow: '#7a3418', warm: '#8a6a48', sole: '#2a2a30', pad: '#c08a3c', collar: '#3a2a22',
    steel: '#6a7484', steel2: '#3e4450', bronze: '#c08a3c', horn: '#e8dcc0', haft: '#5a3a22', leather: '#5a3a24', leather2: '#46301e', mail: '#5a5f6a', fur: '#7a5a3a', rune: '#ffb02a',
    runeK: 0.2, male: true,
  },
  afterColors: ['#ffb02a', '#c06a10', '#ffe27a'],
  stance: { t: 0.08, hd: -0.05, fa1: 0.75, fa2: 2.35, ba1: 0.25, ba2: 1.35, fl1: 0.5, fl2: 0.12, bl1: -0.45, bl2: -0.12 },
  poses: {
    victory: { t: -0.12, hd: -0.35, fa1: 2.95, fa2: 3.12, ba1: -0.6, ba2: 0.4, fl1: 0.5, fl2: 0.1, bl1: -0.5, bl2: -0.1 },
    intro: { t: 0.05, hd: -0.1, fa1: 1.6, fa2: 2.9, ba1: 0.6, ba2: 1.7, fl1: 0.5, fl2: 0.1, bl1: -0.5, bl2: -0.1 },
    hamW: { t: -0.28, hd: -0.15, fa1: 2.75, fa2: 3.55, ba1: 2.5, ba2: 3.2, fl1: 0.45, fl2: 0.1, bl1: -0.5, bl2: -0.15 },
    hamS: { t: 0.7, hd: 0.25, fa1: 1.15, fa2: 0.5, ba1: 1.05, ba2: 0.55, fl1: 1.0, fl2: 0.1, bl1: -0.75, bl2: -0.5 },
    swingW: { t: -0.22, hd: 0.05, fa1: -0.9, fa2: -1.7, ba1: -0.6, ba2: 0.4, fl1: 0.45, fl2: 0.15, bl1: -0.5, bl2: -0.2 },
    swing: { t: 0.42, hd: 0.1, fa1: 1.45, fa2: 1.62, ba1: -0.8, ba2: -0.2, fl1: 0.8, fl2: 0.25, bl1: -0.7, bl2: -0.45 },
    upW: { base: 'crouch', t: 0.35, fa1: -0.3, fa2: -0.4, ba1: 0.2, ba2: 1.2 },
    upS: { t: -0.15, hd: -0.4, fa1: 2.7, fa2: 3.05, ba1: 0.3, ba2: 1.1, fl1: 0.3, fl2: 0.05, bl1: -0.35, bl2: -0.55 },
    ram: { t: 0.8, hd: 0.15, fa1: 1.0, fa2: 2.5, ba1: 0.5, ba2: 1.2, fl1: 1.0, fl2: 0.4, bl1: -0.9, bl2: -0.8 },
    flex: { t: -0.08, hd: -0.3, fa1: 1.75, fa2: 3.05, ba1: 1.45, ba2: 2.95, fl1: 0.55, fl2: 0.12, bl1: -0.55, bl2: -0.12 },
    roar: { t: -0.32, hd: -0.55, fa1: 2.3, fa2: 2.7, ba1: 2.1, ba2: 2.6, fl1: 0.6, fl2: 0.15, bl1: -0.6, bl2: -0.15 },
    jhamW: { base: 'jump', t: -0.3, fa1: 2.8, fa2: 3.5, ba1: 2.6, ba2: 3.1 },
    jhamS: { base: 'jump', t: 0.6, fa1: 1.2, fa2: 0.6, ba1: 1.0, ba2: 0.6 },
  },
  intro: 'Stone remembers. And so do I.',
  wins: ['Ha! The mountain does not move for anyone.', 'Your bones will make a fine rune.', 'Come back when you weigh more than my hammer.'],
  ropes: [
    { id: 'braid', at: (sk, r) => headPt(sk, -r * 0.95, r * 0.35), n: 5, seg: 8, w0: 8, w1: 5, color: 'hair', grav: 0.7, wind: 0.25 },
  ],
  hairBack(g, r, c, R) { polyR(g, r, [[-0.4, -0.6], [-1.18, -0.3], [-1.36, 0.5], [-1.2, 1.0], [-0.8, 0.9], [-0.5, 0.5]], c.hair, R); },
  hairFront(g, r, c, R, o) {
    borgarBeard(g, r, c, R, o);
    borgarEarGuard(g, r, c, R, o.T);
    borgarHelm(g, r, c, R, o);
  },
  neckWear(g, sk, p, c, R) {   // fur mantle around the shoulders
    const n = sk.neck;
    poly(g, [[n[0] - 22, n[1] + 14], [n[0] - 20, n[1] - 4], [n[0] - 4, n[1] - 10], [n[0] + 14, n[1] - 6], [n[0] + 20, n[1] + 8], [n[0] + 6, n[1] + 4], [n[0] - 8, n[1] + 6]], c.fur, R, 3);
    if (!R.mono) { g.strokeStyle = 'rgba(40,20,8,0.4)'; g.lineWidth = 1.2; for (let i = -18; i < 18; i += 6) { g.beginPath(); g.moveTo(n[0] + i, n[1] - 3); g.lineTo(n[0] + i + 2, n[1] + 6); g.stroke(); } }
  },
  torsoDetail(g, L, bw, c, R) {
    // open jerkin: tattooed chest in a V, steel belly plate
    g.fillStyle = c.skin; g.beginPath(); g.moveTo(-4 * bw, -L - 6); g.lineTo(14 * bw, -L - 4); g.lineTo(6 * bw, -L * 0.42); g.closePath(); g.fill();
    runeGlyph(g, 5 * bw, -L * 0.82, 4.5, c, 0.35 + 0.65 * c.runeK, 1.8, 1); runeGlyph(g, 8 * bw, -L * 0.62, 3.4, c, 0.3 + 0.7 * c.runeK, 1.5, 3);
    g.fillStyle = c.steel; g.beginPath(); g.moveTo(-12 * bw, -L * 0.38); g.lineTo(13 * bw, -L * 0.42); g.lineTo(11 * bw, -2); g.lineTo(-10 * bw, -2); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(-9 * bw, -L * 0.36, 20 * bw, 3);
    g.fillStyle = c.bronze; for (const x of [-8, 0, 8]) { g.beginPath(); g.arc(x * bw, -L * 0.2, 1.8, 0, TAU); g.fill(); }
  },
  drawSkirt(g, sk, p, c, R, o) { borgarKilt(g, sk, c, R, o); },
  shoulderOver(g, sk, p, c, R, o) {
    // rune tattoos along the bare front arm and a bronze arm ring (no pauldron: the beard stays visible)
    if (R.mono) return;
    runeLine(g, sk.sF, sk.fe, c, 0.3 + 0.7 * c.runeK, 2, 1.8); runeLine(g, sk.fe, lerpP(sk.fe, sk.fh, 0.5), c, 0.3 + 0.7 * c.runeK, 1, 1.8);
    const P = lerpP(sk.sF, sk.fe, 0.2), a = Math.atan2(sk.fe[1] - sk.sF[1], sk.fe[0] - sk.sF[0]);
    g.save(); g.translate(...P); g.rotate(a); g.fillStyle = c.bronze; g.strokeStyle = OUTLINE; g.lineWidth = 1.6; g.fillRect(-3, -12, 6, 24); g.strokeRect(-3, -12, 6, 24); g.restore();
  },
  weaponBack(g, sk, p, c, R) {
    // round shield slung on his back
    const P = [sk.neck[0] - 16, sk.neck[1] + 22];
    circ(g, P[0], P[1], 21, c.leather, R);
    if (!R.mono) { circ(g, P[0], P[1], 15, c.leather2, R); circ(g, P[0], P[1], 6, c.bronze, R); g.strokeStyle = c.bronze; g.lineWidth = 2.4; g.beginPath(); g.arc(P[0], P[1], 19, 0, TAU); g.stroke(); }
  },
  weaponFront(g, sk, p, c, R) { borgarHammer(g, sk, p, c, R); },
};
makeChibi(BORGAR, { build: { arm: 1.6, leg: 1.45, torso: 1.75 }, colors: {} });
BORGAR.dims = { thigh: 24, shin: 22, torso: 44, neck: 2, headR: 27, uarm: 26, farm: 24, footLift: 10 };
BORGAR.faceFn = borgarFace;
BORGAR.portraitScale = 0.66;

// ---------------------------------- rune systems ----------------------------------
const BORGAR_PALS = [];
for (let i = 0; i <= 4; i++) BORGAR_PALS.push(borgarRunePal(BORGAR.colors, 0.2 + i * 0.2, false));
const BORGAR_PAL_B = borgarRunePal(BORGAR.colors, 1, true);
BORGAR.palette = F => {
  if (F.berserkT > 0 || F.ultRunes) return BORGAR_PAL_B;
  const k = F.skinT > 0 ? 0.85 : 0.1 + 0.6 * (F.fury || 0) / 100;
  return BORGAR_PALS[clamp(Math.round(k * 4), 0, 4)];
};
function borgarFury(F, n) { if (F.ko || F.berserkT > 0) return; F.fury = Math.min(100, (F.fury || 0) + n); }
function borgarBerserk(F, dur) {
  F.berserkT = dur; F.berserkMax = dur; F.fury = 0;
  FX.ring(F.x, F.y - 90, '#ffcf3a', 20, 260, 22, 10); FX.ring(F.x, GROUND, '#ffb02a', 10, 220, 18, 8, 0.25); FX.flashScreen('#ffb02a', 10, 0.4); FX.shakeIt(10);
  FX.wtext(F.x, F.y - 240 * F.s, 'RUNE BERSERKER!', { size: 40, color: '#ffffff', stroke: '#b35a00', life: 60 });
  for (let i = 0; i < 24; i++) FX.p({ type: 'ember', x: F.x + rand(-40, 40), y: F.y - rand(20, 160), vx: rand(-3, 3), vy: -rand(2, 6), life: 40, size: rand(2, 4), color: pick(['#ffb02a', '#ffe27a', '#ff7a1a']) });
  FX.rocks(F.x, GROUND, 10, '#5a4a40'); Sound.play('roar'); Sound.play('rune'); Sound.play('impactBig');
}
BORGAR.initFighter = F => { F.fury = 0; F.berserkT = 0; F.berserkMax = BORGAR_BERSERK_T; F.skinT = 0; F.lastHp = F.hp; F.ultRunes = false; };
BORGAR.dmgBonus = F => F.berserkT > 0 ? (F.state === 'attack' && F.move && (F.move.lvl >= 3 || F.move.special) ? 1.2 : 1.08) : 1;
BORGAR.walkMul = F => F.berserkT > 0 ? 1.12 : 1;
BORGAR.defMul = D => D.skinT > 0 ? 0.7 : 1;
// Stone Skin / Berserker: heavy normals (and Berserker specials) gain one hit of armor
BORGAR.armorBuff = (F, m) => (F.skinT > 0 && m.lvl >= 3 && !m.grab) || (F.berserkT > 0 && m.lvl >= 3 && !m.special);
BORGAR.armorHits = (F, m) => BORGAR.armorBuff(F, m) ? 1 : 0;
BORGAR.onDealDamage = (A, D, dmg) => {
  if (A.ko) return;
  const m = A.move, heavy = A.state === 'cine' || (m && (m.lvl >= 3 || m.special || m.ult));
  borgarFury(A, A.state === 'cine' ? 2 : heavy ? 9 : 3);
};
BORGAR.tick = F => {
  const live = BT && BT.phase === 'fight' && !F.ko;
  if (F.hp < F.lastHp) borgarFury(F, (F.lastHp - F.hp) * 0.13);
  F.lastHp = F.hp;
  if (F.skinT > 0) {
    F.skinT--;
    if (F.T % 5 === 0) FX.p({ type: 'shard', x: F.x + rand(-30, 30), y: F.y - rand(20, 150), vx: rand(-0.5, 0.5), vy: -rand(0.5, 1.5), life: 22, size: rand(2, 3.5), color: pick(['#8a8478', '#a89c86']), add: false, vr: 0.1 });
    if (F.skinT === 0) FX.wtext(F.x, F.y - 210, 'STONE SKIN FADES', { size: 16, color: '#c8b89a', life: 30 });
  }
  if (F.berserkT > 0) {
    F.berserkT--; F.fury = 100 * F.berserkT / F.berserkMax;
    if (F.T % 3 === 0) FX.p({ type: 'ember', x: F.x + rand(-40, 40), y: F.y - rand(10, 160) * F.s, vx: rand(-0.4, 0.4), vy: -rand(0.8, 2.4), life: 26, size: rand(1.8, 3.4), color: pick(['#ffb02a', '#ffe27a', '#ff7a1a']) });
    if (F.state === 'attack' || F.state === 'dash') F.afterimage = Math.max(F.afterimage, 2);
  } else if (live && F.fury >= 100 && F.state !== 'cine') borgarBerserk(F, BORGAR_BERSERK_T);
};
BORGAR.drawExtra = (g, F) => {
  if (F.ko) return;
  // rune circle under his feet while empowered
  const on = F.berserkT > 0 || F.skinT > 0 || F.ultRunes;
  if (on && FX.hq) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35 + 0.15 * Math.sin(F.T * 0.2);
    g.strokeStyle = F.berserkT > 0 || F.ultRunes ? '#ffcf3a' : '#c8b89a'; g.lineWidth = 2;
    g.beginPath(); g.ellipse(F.x, GROUND + 2, 70, 13, 0, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(F.x, GROUND + 2, 56, 10, 0, 0, TAU); g.stroke();
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + F.T * 0.02; runeGlyph(g, F.x + Math.cos(a) * 63, GROUND + 2 + Math.sin(a) * 11.5, 3, { rune: '#ffcf3a' }, 0.9, 1.4, i); }
    g.restore();
  }
  const c = BT && BT.cine;
  if (c && c.A === F && c.cracks) {   // ground cracks during the ultimate
    g.save(); g.lineCap = 'round';
    for (const cr of c.cracks) {
      const k = Math.min(1, cr.t / 8);
      g.strokeStyle = '#1a1008'; g.lineWidth = cr.w + 2; g.beginPath(); cr.pts.forEach((p, i) => { if (i / cr.pts.length > k) return; i ? g.lineTo(...p) : g.moveTo(...p); }); g.stroke();
      g.globalCompositeOperation = 'lighter'; g.strokeStyle = '#ffb02a'; g.lineWidth = cr.w * 0.5; g.stroke(); g.globalCompositeOperation = 'source-over';
    }
    g.restore();
  }
};
BORGAR.introFx = F => {
  FX.shakeIt(12); FX.rocks(F.x + F.facing * 60, GROUND, 14); FX.dust(F.x + F.facing * 60, GROUND, 12);
  FX.ring(F.x, GROUND, '#ffb02a', 10, 180, 18, 6, 0.25); Sound.play('slam'); Sound.play('rune');
  for (let i = 0; i < 20; i++) FX.p({ type: 'ember', x: F.x + rand(-40, 40), y: F.y - rand(20, 160), vx: rand(-1, 1), vy: -rand(1, 3), life: 40, size: rand(2, 3.5), color: '#ffb02a' });
};

// ---------------------------------- projectiles ----------------------------------
EXTRA_PROJ.runeQuake = {
  rect: p => ({ x: p.x - p.w / 2, y: GROUND - p.h, w: p.w, h: p.h }),
  update(p) {
    if (p.t % 2 === 0) { FX.rocks(p.x, GROUND, 1, '#5a4a40'); FX.p({ type: 'ember', x: p.x + rand(-20, 20), y: GROUND - rand(0, 20), vx: rand(-1, 1), vy: -rand(1, 4), life: 18, size: 2.5, color: '#ffb02a' }); }
    if (p.t % 4 === 0) FX.dust(p.x, GROUND, 2);
  },
  draw(g, p) {
    const fade = Math.min(1, p.life / 8), dir = Math.sign(p.vx) || 1; g.globalAlpha = fade;
    for (let i = 0; i < 5; i++) {
      const x = p.x - dir * (i * 15 - 18), hh = (p.h - 8) * (1 - i * 0.16) * (0.8 + 0.2 * Math.sin(p.t * 0.7 + i));
      poly(g, [[x - 10, GROUND], [x - 2 + dir * 3, GROUND - hh], [x + 9, GROUND]], i % 2 ? '#5a4a40' : '#6e5c4e', { ol: 2 });
    }
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = '#ffb02a'; g.lineWidth = 3; g.beginPath(); g.moveTo(p.x + dir * 20, GROUND - 2); g.lineTo(p.x - dir * 90, GROUND - 2); g.stroke();
    const gr = g.createRadialGradient(p.x, GROUND, 0, p.x, GROUND, 50); gr.addColorStop(0, 'rgba(255,190,60,0.6)'); gr.addColorStop(1, 'rgba(255,120,0,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(p.x, GROUND, 50, 18, 0, 0, TAU); g.fill();
  },
};

// ---------------------------------- moves ----------------------------------
const borgarSlamFx = (x, big) => {
  FX.shakeIt(big ? 16 : 10); FX.rocks(x, GROUND, big ? 16 : 9); FX.dust(x, GROUND, big ? 14 : 8);
  FX.ring(x, GROUND, '#ffb02a', 10, big ? 230 : 140, 18, big ? 8 : 5, 0.25); Sound.play('slam');
};
BORGAR.moves = Object.assign(baseNormals({ dmg: 1.12, spd: 2, rng: 1.05 }), {
  sp1: {
    name: 'RUNE RAM', jp: '刻印突撃', desc: 'Command grab. Charges forward, seizes the opponent, lifts them overhead and slams them into the earth. Unblockable, long cooldown.', special: 1, lvl: 4,
    poses: ['ram', 'grab'], st: 11, act: 10, rec: 28, dmg: 1, type: 'unblock', grab: 1, hb: { x: 0, y: -170, w: 78, h: 165 }, cd: 150, str: 3, sfx: 'grab',
    tick(F, f) { if (f >= 4 && f <= 19) { F.vx = F.facing * 10; F.ctrlVel = true; F.afterimage = Math.max(F.afterimage, 3); if (f % 3 === 0) FX.dust(F.x - F.facing * 20, GROUND, 2); } },
    onHit(F, D) { BT.startCine(F, D, CINE.borgarRam, { zoom: 1.25 }); return true; },
  },
  sp1f: {
    name: 'EARTHQUAKE HAMMER', jp: '地震槌', desc: 'Slow but massive: slams the hammer down and sends a rune shockwave along the ground. Knocks down. Jump it or block low.', special: 1, lvl: 4,
    poses: ['hamW', 'hamS'], st: 19, act: 4, rec: 26, cd: 80, str: 3, sfx: 'rune',   // the hit comes from the shockwave (starts right at the hammer head)
    spawn: { f: 19, fn(F) {
      const bz = F.berserkT > 0;
      borgarSlamFx(F.x + F.facing * 80, bz);
      BT.spawn({ owner: F, kind: 'runeQuake', x: F.x + F.facing * 105, y: GROUND - 30, vx: F.facing * 10, w: 80, h: bz ? 70 : 52, life: bz ? 46 : 36, dmg: bz ? 64 : 52, hs: 30, bs: 14, kb: 4, kd: 1, type: 'low', str: 3, clash: 0, color: '#ffb02a', srcKey: 'sp1f' });
    } },
  },
  counter: {
    name: 'RUNE UPPERCUT', jp: '刻印昇撃', desc: 'A rising hammer blow that launches high. Jump-cancel on hit (hold ↑) to chase into an air combo. Brief upper-body invulnerability.', special: 1, lvl: 4,
    poses: ['upW', 'upS'], st: 10, act: 5, rec: 26, dmg: 92, hs: 30, bs: 15, kb: 1.5, launch: -15.5, kd: 1, hb: { x: 5, y: -215, w: 96, h: 205 }, invuln: [3, 11], jc: 1, cd: 60, str: 3, shake: 8,
    sfx: 'rune', sw: { cx: 30, cy: -150, r: 96, a0: 1.3, a1: -1.6, color: '#ffb02a' },
    tick(F, f) { if (f <= 9) { F.vx = F.facing * 7; F.ctrlVel = true; } },   // steps in, so it links after heavy blows
  },
  sp2: {
    name: 'STONE SKIN', jp: '石肌', desc: 'His runes harden his body for 5 s: takes 30% less damage and heavy attacks (H, specials) absorb one hit. Long cooldown.', special: 1, lvl: 4,
    poses: ['flex', 'flex'], st: 8, act: 1, rec: 18, cd: 840, sfx: 'rune',
    onStart(F) {
      F.skinT = BORGAR_SKIN_T; F.flash = 6;
      FX.ring(F.x, F.y - 90, '#c8b89a', 14, 170, 18, 6); FX.ring(F.x, F.y - 90, '#ffb02a', 10, 120, 16, 4); Sound.play('armor');
      FX.wtext(F.x, F.y - 235 * F.s, 'STONE SKIN', { size: 30, color: '#ffffff', stroke: '#6a5a40', life: 45 });
      for (let i = 0; i < 16; i++) FX.p({ type: 'shard', x: F.x + rand(-40, 40), y: F.y - rand(10, 160), vx: rand(-3, 3), vy: -rand(1, 4), life: 30, size: rand(3, 5), color: '#a89c86', add: false, vr: 0.2 });
    },
  },
  sp2f: {
    name: 'MOUNTAIN BREAKER', jp: '山砕き', desc: 'Raises the hammer high and brings it down like a landslide. Huge overhead impact zone, armored startup, wall splat — but a long recovery if it misses.', special: 1, lvl: 4,
    poses: ['hamW', 'hamS'], st: 26, act: 5, rec: 38, dmg: 160, hs: 34, bs: 20, kb: 14, kd: 1, ws: 1, type: 'overhead', hb: { x: 10, y: -235, w: 160, h: 235 },
    armor: [6, 26], armorHits: 1, cd: 140, str: 4, shake: 14, impact: 2, sfx: 'charge',
    tick(F, f) { if (f < 26 && f % 3 === 0) { const h = F.handW('f'); FX.p({ type: 'ember', x: h[0] + rand(-14, 14), y: h[1] - rand(10, 40), vx: rand(-1, 1), vy: -rand(1, 3), life: 20, size: 3, color: '#ffb02a' }); } if (f === 27) borgarSlamFx(F.x + F.facing * 95, true); },
  },
  sp2d: {
    name: "BERSERKER'S WRATH", jp: '狂戦士の怒り', desc: 'Needs 40+ RUNE FURY. Spends it all to enter RUNE BERSERKER mode at once (longer the more Fury he had). Invulnerable roar.', special: 1, lvl: 4,
    poses: ['roar', 'roar'], st: 6, act: 1, rec: 16, cd: 60, invuln: [0, 14], req: F => (F.fury || 0) >= 40 && !(F.berserkT > 0), sfx: 'roar',
    onStart(F) { borgarBerserk(F, Math.round(180 + (F.fury || 0) * 3)); },
  },
  ult: {
    name: 'WRATH OF THE MOUNTAIN', jp: '山の怒り', desc: 'Ultimate. A lunging hammer strike; on hit every rune on his body ignites, the earth splits open and a golden eruption swallows the opponent.', ult: 1, lvl: 6, cost: 100,
    poses: ['swingW', 'swing'], st: 7, act: 14, rec: 30, dmg: 40, hs: 40, bs: 20, kb: 6, hb: { x: 0, y: -200, w: 120, h: 195 }, invuln: [0, 22], str: 3,
    tick(F, f) { if (f > 7 && f <= 20) { F.vx = F.facing * 12; F.ctrlVel = true; F.afterimage = 6; FX.dust(F.x - F.facing * 20, GROUND, 1); } },
    onHit(F, D) { BT.startCine(F, D, CINE.borgar, { zoom: 1.2 }); return true; },
  },
});
(() => {
  const M = BORGAR.moves;
  Object.assign(M.L, { name: 'Gauntlet Jab' });
  Object.assign(M.M, { name: 'Iron Boot' });
  Object.assign(M.H, { name: 'HAMMER SWING', poses: ['swingW', 'swing'], st: 16, dmg: 120, kb: 7.5, ws: 1, hb: { x: 18, y: -175, w: 118, h: 100 }, str: 4, shake: 8, sw: { cx: 0, cy: -120, r: 104, a0: -2.4, a1: 0.5, color: '#ffb02a' } });
  Object.assign(M.cH, { name: 'Haft Sweep', poses: ['sweep_w', { base: 'sweep', fa1: 0.9, fa2: 1.4 }], hb: { x: 10, y: -42, w: 118, h: 36 } });
  Object.assign(M.LH, { name: 'Rising Hammer', poses: ['upW', 'upS'], sw: { cx: 30, cy: -150, r: 90, a0: 1.3, a1: -1.6, color: '#ffb02a' } });
  Object.assign(M.FF, { name: 'Shoulder Charge', poses: ['ram', 'ram'], armor: [1, 14], armorHits: 1, vx: 8.5 });
  Object.assign(M.jH, { name: 'Hammer Drop', poses: ['jhamW', 'jhamS'], hb: { x: 5, y: -125, w: 104, h: 110 }, sw: { cx: 10, cy: -130, r: 90, a0: -1.8, a1: 0.8, color: '#ffb02a' } });
})();
BORGAR.extraList = [];
BORGAR.combos = [
  { name: 'Stonebreaker', notation: 'L → M → H → ↓→SP1 (Earthquake Hammer)', seq: ['L', 'M', 'H', 'sp1f'] },
  { name: 'Rune Launch', notation: 'M → ↓←SP1 (Rune Uppercut) → hold ↑ → air M → air H', seq: ['M', 'counter', 'jM', 'jH'] },
  { name: 'Landslide', notation: 'M → H → ↓→SP2 (Mountain Breaker)', seq: ['M', 'H', 'sp2f'] },
  { name: 'Berserker Rush', notation: '↓↓SP2 (Berserker’s Wrath) → L → H → ↓←SP1 (Rune Uppercut)', seq: ['L', 'H', 'counter'], pre: ['sp2d'], fury: 60 },
  { name: 'Wrath of the Mountain', notation: 'H → SP1+SP2 (Ultimate)', seq: ['H', 'ult'], meter: 1 },
];
BORGAR.applyTrial = (A, tr) => { if (!tr) return; if (tr.meter) A.meter = 100; if (tr.fury) A.fury = tr.fury; };

// ---------------------------------- cinematics ----------------------------------
CINE.borgarRam = function (A, D, f) {
  const dir = A.facing;
  if (f === 1) { A.forcePose = 'grab'; D.x = A.x + dir * 60; D.y = GROUND; D.forcePose = 'hit'; Sound.play('grab'); FX.darkTarget = 0.3; }
  if (f >= 6 && f <= 24) { const t = (f - 6) / 18; A.forcePose = 'lift'; D.x = A.x + dir * lerp(60, 10, t); D.y = GROUND - lerp(0, 175, easeOut(t)); D.forcePose = 'airhit'; if (f % 4 === 0) runeBurst(A, 3); }
  if (f === 32) {
    A.forcePose = 'slam'; D.x = A.x + dir * 82; D.y = GROUND; D.forcePose = 'down';
    BT.scriptHit(A, D, 135, { str: 4, sfx: 'slam' }); borgarSlamFx(D.x, true); FX.flashScreen('#ffb02a', 6, 0.3); borgarFury(A, 12);
    FX.wtext(D.x, GROUND - 230, '刻印突撃!', { size: 50, font: FX_JP(), color: '#fff', stroke: '#b35a00', life: 40, vy: -0.4 });
  }
  if (f === 46) { BT.release(D, dir * 3, -6); FX.darkTarget = 0; return true; }
};
function runeBurst(F, n) { for (let i = 0; i < n; i++) FX.p({ type: 'ember', x: F.x + rand(-30, 30), y: F.y - rand(30, 150), vx: rand(-1.5, 1.5), vy: -rand(1, 3.5), life: 30, size: rand(2, 4), color: pick(['#ffb02a', '#ffe27a']) }); }
CINE.borgar = function (A, D, f, c) {
  const dir = A.facing, gold = '#ffcf3a';
  if (f === 1) {
    D.x = clamp(A.x + dir * 96, 90, STAGE_W - 90); D.y = GROUND; D.forcePose = 'hit'; A.forcePose = 'flex'; A.ultRunes = true; c.cracks = [];
    FX.darkTarget = 0.82; Sound.play('rune'); Sound.play('charge'); c.zoom = 1.3;
    FX.wtext(A.x, GROUND - 300, '— 全ての刻印よ、目覚めよ —', { size: 30, font: FX_JP(), color: '#ffe2a8', stroke: '#3a1800', life: 70 });
  }
  if (f <= 26) { runeBurst(A, 2); if (f % 8 === 1) FX.ring(A.x, A.y - 90, gold, 10, 150, 16, 4); }
  if (f === 16) A.forcePose = 'upW';
  if (f === 24) { A.forcePose = 'upS'; BT.scriptHit(A, D, 40, { str: 3, sfx: 'hit' }); Sound.play('rune'); }
  if (f > 24 && f <= 44) { const t = (f - 24) / 20; D.y = GROUND - 230 * easeOut(t); D.x += dir * 0.6; D.forcePose = 'airhit'; }
  if (f === 40) { A.forcePose = 'hamW'; Sound.play('charge'); }
  if (f > 40 && f <= 62) { const t = (f - 40) / 22; A.y = GROUND - Math.sin(t * Math.PI * 0.5) * 210; A.x = lerp(A.x, D.x - dir * 70, 0.12); A.afterimage = 4; runeBurst(A, 2); c.camY = GROUND - 220; }
  if (f === 64) {   // hammer drives the opponent back into the earth
    A.forcePose = 'hamS'; BT.scriptHit(A, D, 60, { str: 4, sfx: 'slam' }); D.forcePose = 'down';
    FX.flashScreen('#ffffff', 5, 0.4); FX.speedlines(14, W / 2, H / 2, gold, 50);
  }
  if (f > 64 && f <= 72) { const t = (f - 64) / 8; D.y = lerp(GROUND - 230, GROUND, t); A.y = lerp(GROUND - 210, GROUND, t); c.camY = lerp(GROUND - 220, GROUND - 150, t); }
  if (f === 72) {
    A.y = GROUND; D.y = GROUND; borgarSlamFx(D.x, true); FX.impactFrame(3); FX.shakeIt(22);
    for (let i = 0; i < 9; i++) {   // the ground splits open
      const pts = [], a = (i / 8 - 0.5) * 2.6; let x = D.x, y = GROUND + 4;
      for (let j = 0; j < 7; j++) { pts.push([x, y]); x += Math.sin(a) * rand(18, 32) * (i % 2 ? 1 : 1.4) + rand(-6, 6); y += Math.cos(a) * rand(-2, 6) + 2; }
      c.cracks.push({ pts, w: rand(3, 6), t: 0 });
    }
  }
  if (c.cracks) for (const cr of c.cracks) cr.t++;
  if (f >= 78 && f <= 96 && f % 6 === 0) {   // rune pulses rip through the cracks
    BT.scriptHit(A, D, 22, { str: 3, sfx: 'slam' }); FX.ring(D.x, GROUND, gold, 10, 120 + (f - 78) * 6, 14, 6, 0.25); FX.shakeIt(10); FX.rocks(D.x + rand(-60, 60), GROUND, 6);
    for (let i = 0; i < 10; i++) FX.p({ type: 'ember', x: D.x + rand(-140, 140), y: GROUND - rand(0, 20), vx: rand(-1, 1), vy: -rand(3, 8), life: 30, size: rand(2.5, 4.5), color: pick(['#ffb02a', '#ffe27a']) });
    D.forcePose = f % 12 ? 'down' : 'hit';
  }
  if (f === 100) { A.forcePose = 'roar'; Sound.play('roar'); FX.dust(A.x, GROUND, 10); }
  if (f === 112) {
    A.forcePose = 'hamS';
    BT.scriptHit(A, D, 105, { str: 4 });
    FX.impactFrame(5); FX.shakeIt(28); Sound.play('explosion'); Sound.play('rune'); FX.flashScreen(gold, 16, 0.75);
    for (let i = 0; i < 70; i++) FX.flame(D.x + rand(-70, 70), GROUND - rand(0, 320), gold, 1, 14, 7);
    for (let i = 0; i < 40; i++) FX.p({ type: 'ember', x: D.x + rand(-40, 40), y: GROUND - rand(0, 80), vx: rand(-10, 10), vy: -rand(6, 16), grav: 0.25, life: 60, size: rand(2.5, 5), color: pick(['#ffe27a', '#ffb02a', '#ffffff']) });
    FX.rocks(D.x, GROUND, 26); FX.dust(D.x, GROUND, 24, 'rgba(200,170,120,0.6)');
    FX.ring(D.x, D.y - 100, gold, 20, 340, 24, 12); FX.ring(D.x, GROUND, '#ffffff', 10, 280, 18, 6, 0.25);
    FX.wtext(D.x, GROUND - 290, '山の怒り!!', { size: 88, font: FX_JP(), color: '#fff', stroke: '#c06a00', life: 60, vy: -0.3 });
    A.ultRunes = false; c.cracks = null; borgarFury(A, 20);
    BT.release(D, dir * 6, -17); FX.darkTarget = 0; return true;
  }
};

// ---------------------------------- HUD + how-to ----------------------------------
BORGAR.drawHand = (g, F, side, t) => {
  const bz = F.berserkT > 0;
  xpPanel(g, F, side, t, {
    col: bz ? '#ffcf3a' : '#ff9a1a', col2: '#fff2b0', icon: '刻', flash: bz,
    title: bz ? 'RUNE BERSERKER' : F.skinT > 0 ? 'RUNE FURY · STONE SKIN' : 'RUNE FURY',
    sub: bz ? '狂戦士 · HEAVY DMG+20% · ARMORED H' : F.skinT > 0 ? `石肌 · DMG −30% · ${(F.skinT / 60).toFixed(1)}s` : '怒り · fills when hit & on heavy blows',
    k: (F.fury || 0) / 100, label: bz ? `${(F.berserkT / 60).toFixed(1)}s` : `${Math.floor(F.fury || 0)}%`, marks: [0.4],
    badges: [['sp1', 'S1|RAM'], ['sp1f', '↓→S1|QUAKE'], ['counter', '↓←S1|UPPER'], ['sp2', 'S2|SKIN'], ['sp2f', '↓→S2|BREAKER'], ['sp2d', '↓↓S2|WRATH']],
  });
};
BORGAR.howTo = {
  title: 'RUNE BERSERKER',
  draw(g) {
    xpHowTo(g, 'BORGAR — THE RUNE BERSERKER', '#ffb02a', [
      ['RUNE FURY', 'Fills when he TAKES damage and when he lands heavy hits (H, specials). Full = RUNE BERSERKER for 8 s.'],
      ['BERSERKER', '+20% damage on heavy attacks and specials, +8% on the rest, faster walk, H and Dash Attack gain armor.'],
      ['SP1', 'Rune Ram — charging command grab (unblockable, cannot grab airborne or stunned foes). Long cooldown.'],
      ['↓→ SP1', 'Earthquake Hammer — slow slam + ground shockwave that knocks down. It hits low: jump over it.'],
      ['↓← SP1', 'Rune Uppercut — launcher with upper-body invulnerability. Hold ↑ on hit to chase into an air combo.'],
      ['SP2', 'Stone Skin — 5 s: −30% damage taken, heavy attacks absorb one hit. Very long cooldown.'],
      ['↓→ SP2', 'Mountain Breaker — huge armored overhead with wall splat. Long recovery if blocked or whiffed.'],
      ['↓↓ SP2', 'Berserker’s Wrath — needs 40+ Fury: spend it all to go Berserker right now.'],
    ], 'Heavy and slow, but nothing hits harder. Walk forward behind Stone Skin, punish whiffs with Hammer Swing → Earthquake Hammer, and threaten Rune Ram up close. Getting hit is part of the plan: it fills Rune Fury. Ultimate (SP1+SP2): WRATH OF THE MOUNTAIN.');
  },
};

CHARS.push(BORGAR);
finalizeMoves(BORGAR);
