// ============================ KANAE — THE SPITEFUL BLOOM ============================
// Trickster / psychological pressure / counter, secondary rushdown. An original design: a sullen, provocative schoolgirl
// with messy short red bob, thin glasses and a slouch, who fights with rough kicks, shoves, feints and mocking looks.
// Systems: REBELLION (counters, dodges, interrupts, punishes, payoffs after a feint) → BREAK THE RULES (↓↓SP2, 25+) or
//          UNRESTRAINED (↓↓SP2 at 100) · THE PACT mark on the opponent · Ult THE SPITEFUL BLOOM (a giant watching
//          eye-flower that grows behind her — an original eye-flower design).
const KR = '#e0283c', KR2 = '#8a1424', KINK = '#140c10', KPALE = '#f4e8e4', KEYE = '#efe7de';
const KAN_BTR = 240, KAN_UNR = 360, KAN_SPENT = 150, KAN_PACT = 360;

// ---------------------------------- art ----------------------------------
function kanFace(g, r, c, o) {   // sharp, half-lidded eyes, angled brows and a lopsided, mocking mouth
  let e = c.ex || o.expr || 'normal'; if (c.alt && e === 'normal') e = 'calm';   // LV 10 look: a calm, flat face
  const ex = 0.5 * r, ey = 0.27 * r, fx = 0.94 * r;
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  g.fillStyle = 'rgba(255,110,140,0.18)'; g.beginPath(); g.ellipse(0.36 * r, 0.58 * r, 0.13 * r, 0.05 * r, 0, 0, TAU); g.fill();
  if (e === 'hurt' || e === 'ko') {
    chibiFace(g, r, c, { ...o, expr: e });
    g.strokeStyle = c.brow; g.lineWidth = 0.06 * r;   // even hurt she looks annoyed, not sad
    g.beginPath(); g.moveTo(ex - 0.22 * r, ey - 0.46 * r); g.lineTo(ex + 0.2 * r, ey - 0.3 * r); g.stroke();
    g.restore(); return;
  }
  const grin = e === 'grin' || e === 'mad', wide = e === 'mad', calm = e === 'calm';
  for (const [x, w, h, far] of [[fx, 0.075, 0.28, true], [ex, 0.22, 0.32, false]]) {
    chibiEye(g, x, ey, w * r, h * r, c, { glow: o.glow || c.unr }, far);
    // heavy upper lid: bored and sharp
    const lid = calm ? 0.5 : wide ? 0.18 : 0.38;
    g.fillStyle = c.skin; g.beginPath(); g.ellipse(x, ey - h * r * (1 - lid), w * r * 1.4, h * r * 0.7, 0, Math.PI, TAU); g.fill();
    g.fillRect(x - w * r * 1.4, ey - h * r * (1.72 - lid), w * r * 2.8, h * r * 0.72);
    g.strokeStyle = OUTLINE; g.lineWidth = Math.max(1.5, h * r * 0.22);
    g.beginPath(); g.moveTo(x - w * r * 1.15, ey - h * r * (0.62 - lid)); g.quadraticCurveTo(x, ey - h * r * (0.9 - lid), x + w * r * 1.12, ey - h * r * (0.7 - lid)); g.stroke();
  }
  // brows: inner end pressed down (contempt); during the grin one brow is raised
  g.strokeStyle = c.brow; g.lineWidth = 0.055 * r;
  g.beginPath(); g.moveTo(ex - 0.24 * r, ey - (grin ? 0.62 : 0.5) * r); g.lineTo(ex + 0.22 * r, ey - 0.38 * r); g.stroke();
  g.beginPath(); g.moveTo(fx - 0.1 * r, ey - 0.36 * r); g.lineTo(fx + 0.06 * r, ey - 0.46 * r); g.stroke();
  // mouth
  const mx = 0.72 * r, my = 0.72 * r;
  g.strokeStyle = OUTLINE; g.lineWidth = 0.045 * r;
  if (grin) {   // a wide, unsettling smile
    g.fillStyle = '#3a0a14'; g.beginPath(); g.moveTo(mx - 0.16 * r, my - 0.06 * r); g.quadraticCurveTo(mx, my + (wide ? 0.2 : 0.12) * r, mx + 0.14 * r, my - 0.1 * r); g.quadraticCurveTo(mx, my - 0.02 * r, mx - 0.16 * r, my - 0.06 * r); g.fill(); g.stroke();
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(mx - 0.12 * r, my - 0.04 * r); g.quadraticCurveTo(mx, my + 0.01 * r, mx + 0.11 * r, my - 0.07 * r); g.lineTo(mx + 0.1 * r, my - 0.04 * r); g.quadraticCurveTo(mx, my + 0.04 * r, mx - 0.11 * r, my - 0.01 * r); g.fill();
  } else if (e === 'shout') {
    g.fillStyle = '#3a0a14'; g.beginPath(); g.ellipse(mx, my, 0.08 * r, 0.075 * r, -0.2, 0, TAU); g.fill(); g.stroke();
  } else if (calm) {
    g.beginPath(); g.moveTo(mx - 0.05 * r, my); g.lineTo(mx + 0.05 * r, my); g.stroke();
  } else {   // the smirk: one corner pulled up
    g.beginPath(); g.moveTo(mx - 0.07 * r, my + 0.01 * r); g.quadraticCurveTo(mx, my + 0.03 * r, mx + 0.08 * r, my - 0.05 * r); g.stroke();
  }
  if (!c.alt && e !== 'mad') {   // thin round glasses (standard look only)
    g.strokeStyle = c.glass || '#2a1a20'; g.lineWidth = Math.max(1, 0.035 * r); g.fillStyle = 'rgba(220,235,255,0.12)';
    g.beginPath(); g.ellipse(ex, ey, 0.25 * r, 0.22 * r, 0, 0, TAU); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(fx + 0.01 * r, ey, 0.07 * r, 0.2 * r, 0, 0, TAU); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(ex + 0.25 * r, ey - 0.03 * r); g.lineTo(fx - 0.06 * r, ey - 0.03 * r); g.stroke();
    g.beginPath(); g.moveTo(ex - 0.25 * r, ey - 0.02 * r); g.lineTo(ex - 0.5 * r, ey - 0.06 * r); g.stroke();
  }
  g.restore();
}
const KANAE = {
  id: 'kanae', name: 'KANAE', jp: 'カナエ', title: 'The Spiteful Bloom', titleJp: '棘の花',
  style: 'TRICKSTER / COUNTER', desc: 'Bored, rude and impossible to read. She provokes you, feints, punishes every habit and rebels against the rhythm of the fight. Push her and something watches back.',
  stats: { power: 3, speed: 4, range: 2, defense: 2 },
  scale: 1.0, health: 990, walk: 4.5, backWalk: 4.1, jumpV: -17, jumpX: 4.7, dashV: 12.5, backdashV: 11, backdashInv: 12, juggleMax: 6,
  voicePitch: 1.05, voiceRate: 0.92,
  colors: {
    skin: '#f7e2d6', hair: '#a8242e', hair2: '#6e1420', top: '#f0ece6', leg: '#f7e2d6', boot: '#2a2026', foot: '#2a2026', uarm: '#f0ece6', farm: '#f0ece6', hand: '#f7e2d6', cuff: '#e2dcd6', belt: '#1e1a2a',
    eye: '#a3283a', eye2: '#1a0608', accent: KR, brow: '#6e1420', glass: '#2a1a20', warm: '#22243a', sole: '#141018', pad: KR, collar: '#f0ece6',
    plaid: '#2a2c44', plaid2: '#1e2036', plaidLine: '#5a3a4a', ribbon: '#b81e34', unr: false, ex: null,
  },
  afterColors: [KR, '#3a0a14', KINK],
  stance: { t: 0.16, hd: 0.14, fa1: 0.1, fa2: 0.16, ba1: -0.08, ba2: 0.06, fl1: 0.16, fl2: 0.06, bl1: -0.14, bl2: -0.06 },
  poses: {
    bored: { t: 0.1, hd: -0.12, fa1: 2.55, fa2: 3.7, ba1: -0.08, ba2: 0.06, fl1: 0.1, fl2: 0.04, bl1: -0.2, bl2: -0.08 },
    shift: { t: 0.2, hd: 0.2, fa1: 0.2, fa2: 0.3, ba1: 0.1, ba2: 0.2, fl1: 0.28, fl2: 0.02, bl1: -0.04, bl2: -0.02 },
    taunt: { t: -0.12, hd: -0.16, fa1: 1.25, fa2: 2.5, ba1: -0.2, ba2: 0.25, fl1: 0.2, fl2: 0.06, bl1: -0.2, bl2: -0.06 },
    lean_w: { t: 0.62, hd: -0.25, fa1: -0.5, fa2: -0.2, ba1: -0.9, ba2: -0.5, fl1: 0.7, fl2: 0.3, bl1: -0.5, bl2: -0.7 },
    fkick: { t: -0.32, hd: 0.2, fa1: 0.7, fa2: 1.3, ba1: -0.95, ba2: -0.3, fl1: 1.72, fl2: 1.66, bl1: -0.1, bl2: -0.04 },
    stumble: { t: 0.38, hd: 0.25, fa1: 0.95, fa2: 1.4, ba1: -1.05, ba2: -0.6, fl1: 0.55, fl2: 0.2, bl1: -0.55, bl2: -0.3 },
    feint_w: { t: -0.26, hd: 0.0, fa1: 0.85, fa2: 2.4, ba1: -1.15, ba2: -0.25, fl1: 0.4, fl2: 0.1, bl1: -0.5, bl2: -0.2 },
    feint: { t: -0.1, hd: 0.42, fa1: 0.15, fa2: 0.25, ba1: -0.2, ba2: 0.1, fl1: 0.15, fl2: 0.04, bl1: -0.15, bl2: -0.04 },
    heel_w: { t: -0.38, hd: 0.1, fa1: 0.6, fa2: 1.4, ba1: -0.8, ba2: -0.4, fl1: 2.7, fl2: 2.75, bl1: -0.06, bl2: -0.02 },
    heel: { t: 0.38, hd: 0.0, fa1: 0.9, fa2: 1.5, ba1: -0.9, ba2: -0.5, fl1: 1.15, fl2: 0.55, bl1: -0.3, bl2: -0.2 },
    shin: { t: 0.22, hd: 0.05, fa1: 0.5, fa2: 0.9, ba1: -0.8, ba2: -0.4, fl1: 1.35, fl2: 1.5, bl1: 0.35, bl2: -0.9 },
    shove: { t: 0.42, hd: 0.0, fa1: 1.55, fa2: 1.55, ba1: 1.35, ba2: 1.45, fl1: 0.55, fl2: 0.15, bl1: -0.5, bl2: -0.3 },
    pact_w: { t: 0.24, hd: 0.2, fa1: 0.5, fa2: 1.2, ba1: -0.1, ba2: 0.2, fl1: 0.45, fl2: 0.1, bl1: -0.35, bl2: -0.15 },
    pact: { t: 0.18, hd: 0.3, fa1: 1.55, fa2: 1.75, ba1: -0.25, ba2: 0.2, fl1: 0.3, fl2: 0.08, bl1: -0.25, bl2: -0.1 },
    nmp_w: { t: -0.2, hd: -0.1, fa1: -0.6, fa2: 0.4, ba1: 0.6, ba2: 2.3 },
    nmp1: { t: 0.45, hd: 0.0, fa1: 1.58, fa2: 1.56, ba1: -0.6, ba2: 0.4, fl1: 0.6, fl2: 0.15, bl1: -0.5, bl2: -0.3 },
    nmp2: { t: 0.55, hd: 0.2, fa1: 2.9, fa2: 1.0, ba1: -0.9, ba2: -0.2, fl1: 0.7, fl2: 0.25, bl1: -0.55, bl2: -0.3 },
    nmp3: { t: -0.4, hd: 0.25, fa1: 0.9, fa2: 1.6, ba1: -1.2, ba2: -0.6, fl1: 1.8, fl2: 1.7, bl1: -0.12, bl2: -0.05 },
    stare: { t: 0.05, hd: 0.0, fa1: 0.05, fa2: 0.08, ba1: -0.05, ba2: 0.05, fl1: 0.1, fl2: 0.04, bl1: -0.1, bl2: -0.04 },
    grin: { t: -0.04, hd: 0.34, fa1: 0.04, fa2: 0.06, ba1: -0.04, ba2: 0.04, fl1: 0.12, fl2: 0.04, bl1: -0.12, bl2: -0.04 },
    gesture: { t: 0.32, hd: 0.36, fa1: 0.75, fa2: 0.55, ba1: -0.1, ba2: 0.1, fl1: 0.2, fl2: 0.06, bl1: -0.2, bl2: -0.06 },
    look_down: { t: 0.25, hd: 0.5, fa1: 0.06, fa2: 0.1, ba1: -0.06, ba2: 0.06 },
    victory: { t: 0.06, hd: -0.2, fa1: 2.5, fa2: 3.6, ba1: -0.06, ba2: 0.05, fl1: 0.12, fl2: 0.04, bl1: -0.18, bl2: -0.06 },
    defeat: { t: 0.5, hd: 0.25, fa1: 0.7, fa2: 0.5, ba1: 0.3, ba2: 0.1, fl1: 1.35, fl2: 0.0, bl1: 0.25, bl2: -1.45 },
    intro: { t: 0.1, hd: -0.12, fa1: 2.55, fa2: 3.7, ba1: -0.08, ba2: 0.06 },
  },
  intro: 'You look so bored. Let\'s ruin your day.',
  wins: ['Pathetic. Were you even trying?', 'Heh. That face you made — I\'ll remember it.', 'Boring. Go home.'],
  ropes: [   // the loose ribbon tie
    { id: 'tie', at: sk => [sk.neck[0] + 3, sk.neck[1] + 9], n: 3, seg: 7, w0: 4.5, w1: 3, color: 'ribbon', grav: 0.6, wind: 0.4 },
  ],
  hairBack(g, r, c, R) {   // short, messy bob — ragged ends at jaw height (LV 10 look: longer, to the shoulders)
    if (c.alt) { polyR(g, r, [[0.72, -0.84], [0.1, -1.2], [-0.62, -1.1], [-1.18, -0.6], [-1.28, 0.3], [-1.22, 1.2], [-1.0, 1.05], [-0.86, 1.4], [-0.6, 1.0], [-0.4, 1.2], [-0.24, 0.5]], c.hair, R); return; }
    polyR(g, r, [[0.72, -0.84], [0.1, -1.2], [-0.62, -1.1], [-1.16, -0.6], [-1.24, 0.1], [-1.14, 0.64], [-0.96, 0.5], [-0.86, 0.86], [-0.6, 0.62], [-0.42, 0.8], [-0.26, 0.4]], c.hair, R);
  },
  hairFront(g, r, c, R, o) {
    const sw = Math.sin((o.T || 0) * 0.1) * 0.03;
    polyR(g, r, [[-0.32, -0.98], [-0.9, -0.74], [-1.12, -0.24], [-1.1, 0.42], [-0.96, 0.78], [-0.78, 0.52], [-0.62, 0.84], [-0.48, 0.36], [-0.3, -0.2]], c.hair, R);
    polyR(g, r, [[-0.12, -0.3], [0.04, 0.4], [0.1 + sw, 0.88], [-0.06, 0.78], [-0.14, 0.98], [-0.3, 0.6], [-0.44, 0.1]], c.hair, R);   // side lock
    // uneven, messy fringe: some strands longer, one falling into her eyes
    polyR(g, r, [[-0.38, -0.98], [0.3, -1.06], [0.98, -0.78], [1.16, -0.28], [1.1, -0.06], [0.98, -0.3], [0.9, 0.1], [0.78, -0.22], [0.64, 0.0], [0.54, -0.34], [0.36, -0.06], [0.28, -0.4], [0.1, -0.22], [0.06, -0.52]], c.hair, R);
    polyR(g, r, [[0.42, -0.6], [0.58, -0.3], [0.66 + sw, 0.12], [0.56, 0.14], [0.46, -0.24]], c.hair2, R);
    if (R.mono) return;
    shine(g, r, [[-0.16, -0.86], [0.42, -0.9]], R);
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 0.035 * r; g.beginPath(); g.moveTo(-0.6 * r, -0.8 * r); g.lineTo(-0.9 * r, 0.3 * r); g.moveTo(-0.3 * r, -0.9 * r); g.lineTo(-0.5 * r, 0.4 * r); g.stroke();
  },
  neckWear(g, sk, p, c, R) {   // open, crooked shirt collar with a loosely knotted ribbon
    const n = sk.neck;
    if (c.alt) { if (!R.mono) { g.strokeStyle = '#1a1a20'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(n[0] - 9, n[1] + 4); g.quadraticCurveTo(n[0] + 1, n[1] + 9, n[0] + 10, n[1] + 2); g.stroke(); } return; }   // plain t-shirt neckline
    poly(g, [[n[0] - 13, n[1] + 9], [n[0] - 10, n[1] - 5], [n[0] - 1, n[1] + 3], [n[0] + 2, n[1] + 10]], c.collar, R, 2.4);
    poly(g, [[n[0] + 2, n[1] + 10], [n[0] + 4, n[1] + 2], [n[0] + 12, n[1] - 6], [n[0] + 14, n[1] + 7]], c.collar, R, 2.4);
    if (R.mono) return;
    g.fillStyle = c.ribbon; g.strokeStyle = OUTLINE; g.lineWidth = 1;
    g.beginPath(); g.moveTo(n[0] + 3, n[1] + 8); g.lineTo(n[0] - 4, n[1] + 4); g.lineTo(n[0] - 3, n[1] + 12); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(n[0] + 3, n[1] + 8); g.lineTo(n[0] + 9, n[1] + 5); g.lineTo(n[0] + 8, n[1] + 12); g.closePath(); g.fill(); g.stroke();
  },
  torsoDetail(g, L, bw, c) {   // untucked, wrinkled shirt with a pocket and one button missing
    if (c.alt) { g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1.2; g.beginPath(); g.arc(1 * bw, -L * 0.55, 5, 0, TAU); g.stroke(); g.fillStyle = 'rgba(224,40,60,0.6)'; g.beginPath(); g.arc(1 * bw, -L * 0.55, 2, 0, TAU); g.fill(); return; }   // faded print on the t-shirt
    g.strokeStyle = 'rgba(60,50,70,0.22)'; g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(3 * bw, -L + 8); g.lineTo(4 * bw, -2); g.moveTo(-8 * bw, -L * 0.6); g.quadraticCurveTo(-2 * bw, -L * 0.5, 2 * bw, -L * 0.62); g.moveTo(-10 * bw, -L * 0.28); g.lineTo(-3 * bw, -L * 0.22); g.stroke();
    g.fillStyle = '#c8c0c8'; for (const y of [0.62, 0.3]) { g.beginPath(); g.arc(4.5 * bw, -L * y, 1.3, 0, TAU); g.fill(); }
    g.strokeStyle = 'rgba(60,50,70,0.3)'; g.strokeRect(-9 * bw, -L * 0.78, 6 * bw, 6);
  },
  torsoOver(g, L, bw, c, R) {   // the shirt hangs out over the skirt
    if (R.mono) return;
    g.fillStyle = c.top; g.beginPath(); g.moveTo(-14 * bw, -4); g.lineTo(-15 * bw, 5); g.lineTo(-4 * bw, 3); g.lineTo(4 * bw, 7); g.lineTo(14 * bw, 4); g.lineTo(13 * bw, -4); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(60,50,70,0.3)'; g.lineWidth = 1; g.stroke();
  },
  drawSkirt(g, sk, p, c, R, o) { plaidSkirt(g, sk, c, R, o); },
};
makeChibi(KANAE, { build: { arm: 0.96, leg: 0.98, torso: 1.0 }, colors: {} });
KANAE.faceFn = kanFace;
// LV 10 colour (BLACK DAYS): her other look — longer black hair, a plain dark t-shirt, calm face (palette + c.alt shape changes)
const KAN_ALT = { ...KANAE.colors, alt: true, hair: '#0c0a0e', hair2: '#050406', brow: '#0c0a0e', top: '#2a2a32', uarm: '#2a2a32', farm: '#f7e2d6', cuff: '#f7e2d6', collar: '#2a2a32', ribbon: '#2a2a32', plaid: '#18181e', plaid2: '#101014', plaidLine: '#30303c', warm: '#141418' };
KANAE.varColors = vi => vi === 4 ? KAN_ALT : null;
KANAE.drawBoot = (g, K, F, c, R, back) => {   // knee socks and scuffed school loafers (chunky chibi proportions)
  const M = lerpP(K, F, 0.15);
  tube(g, [M, lerpP(M, F, 0.5), F], 9, 11, c.warm, R);
  const x = F[0], y = F[1];
  poly(g, [[x - 12, y - 7], [x + 14, y - 7], [x + 22, y + 1], [x + 21, y + 10], [x - 13, y + 10], [x - 15, y + 1]], R.mono || c.boot, R, 2.2);
  if (R.mono) return;
  g.fillStyle = c.sole; g.fillRect(x - 14, y + 8, 37, 6);
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x - 2, y - 6, 12, 3);   // loafer strap
  g.strokeStyle = 'rgba(255,255,255,0.2)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x + 10, y - 4); g.lineTo(x + 18, y + 1); g.stroke();
};

// ---------------------------------- the eye-flower (original design) ----------------------------------
// A pale, veined eyeball with a crimson iris sits where a flower's heart would be, ringed by long, ragged, ink-black
// petal fringes. Thin dark stem with two drooping leaves. s = scale (1 → head radius ~48 px), o.open 0..1 (lid),
// o.close 0..1 (fringes fold over the eye), o.look (-1..1), o.T
function kanFlower(g, x, y, s, o = {}) {
  const T = o.T || 0, op = o.open ?? 1, cl = o.close || 0, hr = 48 * s, sway = Math.sin(T * 0.03) * 6 * s, hx = x + sway + (o.lean || 0) * s, hy = y - (o.stem ?? 150) * s;
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  // stem + leaves
  g.strokeStyle = KINK; g.lineWidth = Math.max(1.5, 5 * s);
  g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x - 18 * s, y - 50 * s, hx + 16 * s, hy + 70 * s, hx, hy + hr * 0.5); g.stroke();
  g.fillStyle = '#1e1418';
  for (const [t, d] of [[0.3, -1], [0.55, 1]]) {
    const lx = lerp(x, hx, t) + Math.sin(t * 6) * 6 * s, ly = lerp(y, hy, t);
    g.beginPath(); g.moveTo(lx, ly); g.quadraticCurveTo(lx + d * 34 * s, ly - 18 * s, lx + d * 46 * s, ly + 12 * s); g.quadraticCurveTo(lx + d * 22 * s, ly + 2 * s, lx, ly); g.fill();
  }
  // back fringe: long ragged petals, slightly uneven
  const N = 26;
  for (let ring = 0; ring < 2; ring++) {
    g.fillStyle = ring ? '#241418' : KINK;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * TAU + ring * 0.12 + Math.sin(T * 0.05 + i) * 0.03, L = hr * (ring ? 1.55 : 1.95) * (0.82 + 0.18 * Math.sin(i * 2.7 + 1)) * (1 - cl * 0.25);
      const w = hr * 0.16, ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
      const bx = hx + ca * hr * 0.7, by = hy + sa * hr * 0.7;
      let tx = hx + ca * L, ty = hy + sa * L;
      if (cl > 0) { tx = lerp(tx, hx + ca * hr * 0.2, cl); ty = lerp(ty, hy + sa * hr * 0.2 - hr * 0.1, cl); }   // the fringe folds over the eye
      g.beginPath(); g.moveTo(bx + px * w, by + py * w); g.quadraticCurveTo((bx + tx) / 2 + px * w * 1.3, (by + ty) / 2 + py * w * 1.3, tx, ty); g.quadraticCurveTo((bx + tx) / 2 - px * w * 0.6, (by + ty) / 2 - py * w * 0.6, bx - px * w, by - py * w); g.fill();
    }
  }
  if (cl < 0.95) {
    // the eye
    const er = hr * 0.78;
    g.globalAlpha = 1 - cl;
    const gr = g.createRadialGradient(hx - er * 0.3, hy - er * 0.35, er * 0.1, hx, hy, er);
    gr.addColorStop(0, '#fffaf4'); gr.addColorStop(0.7, KEYE); gr.addColorStop(1, '#b8aca4');
    g.fillStyle = gr; g.beginPath(); g.arc(hx, hy, er, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(170,30,40,0.45)'; g.lineWidth = Math.max(0.8, 1.2 * s);   // veins
    for (let i = 0; i < 7; i++) { const a = i * 0.9 + 0.3; g.beginPath(); g.moveTo(hx + Math.cos(a) * er * 0.95, hy + Math.sin(a) * er * 0.95); g.quadraticCurveTo(hx + Math.cos(a + 0.2) * er * 0.7, hy + Math.sin(a + 0.2) * er * 0.7, hx + Math.cos(a - 0.1) * er * 0.55, hy + Math.sin(a - 0.1) * er * 0.55); g.stroke(); }
    const lk = clamp(o.look || 0, -1, 1), ix = hx + lk * er * 0.28, iy = hy + er * 0.05, ir = er * 0.46;
    const ig = g.createRadialGradient(ix, iy, ir * 0.2, ix, iy, ir); ig.addColorStop(0, '#ff5a6a'); ig.addColorStop(0.6, '#a8162a'); ig.addColorStop(1, '#3a0610');
    g.fillStyle = ig; g.beginPath(); g.arc(ix, iy, ir, 0, TAU); g.fill();
    g.fillStyle = '#080406'; g.beginPath(); g.arc(ix, iy, ir * 0.45, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.ellipse(ix - ir * 0.35, iy - ir * 0.4, ir * 0.22, ir * 0.15, -0.4, 0, TAU); g.fill();
    // eyelids (closed → open)
    if (op < 1) {
      const k = 1 - op;
      g.fillStyle = '#2a1a1e';
      g.beginPath(); g.arc(hx, hy, er + 1, Math.PI, TAU); g.lineTo(hx + er, hy - er + er * 2 * k * 0.5); g.quadraticCurveTo(hx, hy - er + er * 2.1 * k, hx - er, hy - er + er * 2 * k * 0.5); g.closePath(); g.fill();
      g.beginPath(); g.arc(hx, hy, er + 1, 0, Math.PI); g.lineTo(hx - er, hy + er - er * 2 * k * 0.5); g.quadraticCurveTo(hx, hy + er - er * 2.1 * k, hx + er, hy + er - er * 2 * k * 0.5); g.closePath(); g.fill();
    }
    g.globalAlpha = 1;
    g.strokeStyle = KINK; g.lineWidth = Math.max(1.2, 2.4 * s); g.beginPath(); g.arc(hx, hy, er, 0, TAU); g.stroke();
  }
  if (cl > 0) {   // closed bud
    g.globalAlpha = Math.min(1, cl * 1.2) * (o.budA ?? 0.92); g.fillStyle = '#1a0e12';
    g.beginPath(); g.ellipse(hx, hy - hr * 0.1, hr * (1.1 - 0.25 * cl), hr * (1.2 - 0.1 * cl), 0, 0, TAU); g.fill();
    g.globalAlpha *= 0.6; g.strokeStyle = '#3a1a22'; g.lineWidth = Math.max(1, 2 * s);
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(hx + i * hr * 0.3, hy + hr); g.quadraticCurveTo(hx + i * hr * 0.4, hy - hr * 0.2, hx + i * hr * 0.08, hy - hr * 1.2); g.stroke(); }
    g.globalAlpha = 1;
  }
  g.restore();
  return [hx, hy];
}

// ---------------------------------- rebellion ----------------------------------
const KAN_PAL = {};
KANAE.palette = F => {
  const unr = F.unrT > 0, ex = F.kanEx || null, alt = F.variant === 4, key = (alt ? 'a' : '') + (unr ? 'u' : '') + (ex || '');
  return KAN_PAL[key] || (KAN_PAL[key] = { ...(alt ? KAN_ALT : KANAE.colors), unr, ex, accent: unr ? '#ff3a52' : KR });
};
const kanMarked = (A, D) => D.kanPactT > 0 && D.kanPactBy === A;
function kanGain(F, n, label) {
  if (F.ko || F.spentT > 0 || F.unrT > 0 || n <= 0) return;
  F.reb = clamp((F.reb || 0) + n, 0, 100); F.rebT = F.T;
  if (label) FX.wtext(F.x, F.y - 238 * F.s, label, { size: 20, color: '#ffd8dc', stroke: KR2, life: 30 });
  if (F.reb >= 100 && !F.rebFull) { F.rebFull = true; FX.wtext(F.x, F.y - 262, 'REBELLION MAX — ↓↓SP2', { size: 20, color: '#ffffff', stroke: KR2, life: 50 }); Sound.play('rev'); }
}
function kanUnrestrained(F) {
  F.unrT = F.unrMax = KAN_UNR; F.btrT = 0; F.reb = 100; F.jitT = 20;
  FX.ring(F.x, F.y - 110, KR, 20, 320, 26, 6); FX.ring(F.x, F.y - 110, '#ffffff', 10, 160, 18, 3); FX.flashScreen('#3a0610', 14, 0.5); FX.shakeIt(10);
  FX.wtext(F.x, F.y - 262, 'UNRESTRAINED', { size: 40, color: '#ffffff', stroke: KR2, life: 70 });
  FX.wtext(F.x, F.y - 222, '— 解き放たれた —', { size: 22, font: FX_JP(), color: '#ffd0d6', stroke: KINK, life: 70 });
  for (let i = 0; i < 26; i++) FX.p({ type: 'petal', x: F.x + rand(-40, 40), y: F.y - rand(20, 200), vx: rand(-5, 5), vy: rand(-5, 1), life: 40, size: rand(3, 6), color: i % 3 ? KINK : KR });
  Sound.play('roar'); Sound.play('impactBig');
}
function kanBreakRules(F) {
  F.btrT = KAN_BTR; F.reb = Math.max(0, F.reb - 25); F.jitT = 14;
  FX.ring(F.x, F.y - 110, KR, 20, 200, 20, 4); FX.flashScreen('#2a0610', 8, 0.3);
  FX.wtext(F.x, F.y - 250, 'BREAK THE RULES', { size: 32, color: '#ffffff', stroke: KR2, life: 60 });
  FX.wtext(F.x, F.y - 216, 'heh… heheh…', { size: 18, color: '#ffd0d6', stroke: KINK, life: 60 });
  Sound.play('slap'); Sound.play('charge');
}
function kanPact(A, D) {
  D.kanPactT = A.unrT > 0 ? 480 : KAN_PACT; D.kanPactMax = D.kanPactT; D.kanPactBy = A; D.kanPactN = 0;
  FX.wtext(D.x, D.y - 248, 'THE PACT', { size: 28, color: '#ffffff', stroke: KR2, life: 46 });
  FX.wtext(D.x, D.y - 218, 'you belong to me now', { size: 16, color: '#ffd0d6', stroke: KINK, life: 46 });
  Sound.play('chime'); Sound.play('heart');
}
KANAE.initFighter = F => {
  F.reb = 0; F.rebT = -999; F.rebFull = false; F.btrT = 0; F.unrT = 0; F.unrMax = KAN_UNR; F.spentT = 0; F.feintT = 0; F.dodged = false; F.jitT = 0;
  F.provHit = false; F.kanEx = null; F.kanSeed = null; F.intT = -99; F.turned = false;
};
KANAE.walkMul = F => F.unrT > 0 ? 1.3 : F.btrT > 0 ? 1.18 : 1;
KANAE.dmgBonus = F => 1.08 * (F.unrT > 0 ? 1.08 : 1) * (F.moveKey === 'sp1' && F.opp && kanMarked(F, F.opp) ? 1.1 : 1);
KANAE.onDealDamage = (A, D) => {
  if (A.ko || A.state === 'cine') return;
  kanGain(A, kanMarked(A, D) ? 2 : 1);
  if (D.state === 'attack' && D.move && (D.move.special || D.move.ult) && !D.move.counter && A.T - A.intT > 30) {   // cut off their ability mid-use
    A.intT = A.T; kanGain(A, 10, 'INTERRUPT');
  } else if (D.state === 'attack' && D.move && D.mf > D.move.st + D.move.act && A.T - A.intT > 30) {   // hit during their recovery
    A.intT = A.T; kanGain(A, 5);
  }
  if (A.feintT > 0 && A.moveKey !== 'sp1f') { A.feintT = 0; kanGain(A, 6, 'FEINT PAYOFF'); }
};
KANAE.idlePose = F => { const k = F.T % 600; return k > 400 && k < 470 ? 'bored' : k > 220 && k < 250 ? 'shift' : k > 520 && k < 560 ? 'taunt' : null; };
KANAE.tick = F => {
  const O = F.opp; if (!O) return;
  const live = BT && BT.phase === 'fight' && !F.ko;
  if (F.state !== 'cine') F.kanEx = F.state === 'victory' ? (F.sf > 60 ? 'grin' : 'calm') : F.state === 'attack' && F.moveKey === 'sp2d' ? 'grin' : F.unrT > 0 && F.state === 'attack' ? 'mad' : null;
  if (F.jitT > 0) F.jitT--;
  if (F.feintT > 0) F.feintT--;
  if (F.unrT > 0) {
    F.unrT--; F.reb = 100 * F.unrT / F.unrMax;
    if (F.T % 3 === 0 && !F.hidden) FX.p({ type: F.T % 2 ? 'petal' : 'spark', x: F.x + rand(-30, 30), y: F.y - rand(20, 190), vx: rand(-0.6, 0.6), vy: -rand(0.4, 1.4), life: 26, size: rand(2, 4), color: F.T % 2 ? KINK : KR });
    if (F.state === 'walk' || F.state === 'dash') F.afterimage = Math.max(F.afterimage, 2);
    if (F.unrT === 0) { F.reb = 0; F.rebFull = false; F.spentT = KAN_SPENT; FX.wtext(F.x, F.y - 230, 'SPENT', { size: 22, color: '#c8a8ac', stroke: KINK, life: 40 }); }
  } else if (live) {
    if (F.spentT > 0) F.spentT--;
    if (F.T - F.rebT > 300 && F.reb > 0 && F.reb < 100 && F.state !== 'cine') F.reb = Math.max(0, F.reb - 0.05);   // a full gauge waits for her
  }
  if (F.btrT > 0) { F.btrT--; if (F.T % 6 === 0) FX.p({ type: 'spark', x: F.x + rand(-26, 26), y: F.y - rand(30, 180), vx: 0, vy: -0.8, life: 18, size: 2, color: KR }); }
  // The Pact: visible mark on the opponent; their aggressive actions feed her rebellion (limited per pact)
  if (O.kanPactT > 0 && O.kanPactBy === F) {
    O.kanPactT--;
    if (O.state === 'attack' && O.mf === 1 && O.move && (O.move.special || O.move.ult) && (O.kanPactN || 0) < 5) { O.kanPactN = (O.kanPactN || 0) + 1; kanGain(F, 4, 'THEIR MOVE'); }
    if (O.ko) O.kanPactT = 0;
  }
  // well-timed dodges: a backdash that slips a live attack
  if (F.state === 'backdash' && F.sf <= 12 && !F.dodged) {
    const near = (O.state === 'attack' && O.hitActive && Math.abs(O.x - F.x) < 170) || (BT && BT.projs.some(p => p.owner === O && p.active() && Math.abs(p.x - F.x) < 130));
    if (near) { F.dodged = true; kanGain(F, 6, 'DODGED'); }
  } else if (F.state !== 'backdash') F.dodged = false;
  // victory: a mocking look, then she turns her back
  if (F.state === 'victory' && F.sf === 70 && !F.turned) { F.turned = true; F.facing = -F.facing; }
  if (F.state !== 'victory') F.turned = false;
  // the small flower left after the ultimate (and her last glance at it)
  if (F.kanSeed) { F.kanSeed.t--; if (F.kanSeed.t <= 0) F.kanSeed = null; }
};
KANAE.drawBehind = (g, F) => {
  if (F.kanSeed) { const s = F.kanSeed, a = Math.min(1, s.t / 40); g.save(); g.globalAlpha = a; kanFlower(g, s.x, GROUND, 0.22, { T: F.T, look: s.look, stem: 120 }); g.restore(); }
};
KANAE.drawExtra = (g, F) => {
  const O = F.opp, T = F.T;
  // feint: her outline distorts for a moment
  if ((F.state === 'attack' && F.moveKey === 'sp1f' && F.mf >= 8 && F.mf <= 13) || F.jitT > 0) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35;
    drawFigure(g, F.ch, F.pose, F.x + rand(-5, 5), F.y, F.facing, { mono: KR }); g.globalAlpha = 0.2; drawFigure(g, F.ch, F.pose, F.x - rand(-5, 5), F.y + rand(-2, 2), F.facing, { mono: '#ffffff' }); g.restore();
  }
  if (F.unrT > 0 && !F.hidden && FX.hq) {   // unrestrained: a jittering crimson double
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.16 + 0.08 * Math.sin(T * 0.7);
    drawFigure(g, F.ch, F.pose, F.x + Math.sin(T * 1.7) * 4, F.y, F.facing, { mono: KR, scale: 1.03 }); g.restore();
  }
  // The Pact: thorny crimson outline + a small watching eye-flower above their head with a countdown ring
  if (O && kanMarked(F, O) && !O.hidden) {
    const k = O.kanPactT / (O.kanPactMax || KAN_PACT), a = Math.min(1, O.kanPactT / 20), hx = O.x, hy = O.y - 236 * O.s;
    g.save(); g.globalAlpha = a * (0.14 + 0.06 * Math.sin(T * 0.3)); g.globalCompositeOperation = 'lighter';
    drawFigure(g, O.ch, O.pose, O.x, O.y, O.facing, { mono: KR, scale: 1.04 }); g.restore();
    g.save(); g.globalAlpha = a; kanFlower(g, hx, hy + 22, 0.24, { T, look: Math.sign(F.x - O.x) * 0.7, stem: 70 });
    g.strokeStyle = KR; g.lineWidth = 2; g.beginPath(); g.arc(hx, hy + 5, 20, -Math.PI / 2, -Math.PI / 2 + TAU * k); g.stroke(); g.restore();
  }
};
KANAE.introFx = F => {
  FX.wtext(F.x, F.y - 250, 'tch.', { size: 24, color: '#ffd0d6', stroke: KINK, life: 50, vy: -0.3 });
  for (let i = 0; i < 10; i++) FX.p({ type: 'petal', x: F.x + rand(-50, 50), y: F.y - rand(40, 200), vx: rand(-1, 1), vy: rand(-1, 0.5), life: 50, size: rand(3, 5), color: i % 2 ? KINK : KR });
};

// ---------------------------------- projectiles / effects ----------------------------------
EXTRA_PROJ.kanStrike = {   // Disgust: the real strike from the unexpected angle (an invisible hit attached to her leg)
  update(p) { const F = p.owner; p.x = F.x + F.facing * 58; },
  draw(g, p) {
    const k = Math.min(1, p.life / 4), F = p.owner;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.7 * k; g.strokeStyle = p.type === 'low' ? '#ffb0b8' : KR; g.lineWidth = 4;
    g.beginPath(); if (p.type === 'low') g.ellipse(F.x + F.facing * 50, GROUND - 26, 56, 12, 0, 0, TAU); else g.arc(F.x + F.facing * 40, F.y - 140, 70, F.facing > 0 ? -1.9 : Math.PI + 1.9 - 1.6, F.facing > 0 ? -0.3 : Math.PI + 0.3 - 1.6 + 1.6); g.stroke(); g.restore();
  },
};

// ---------------------------------- moves ----------------------------------
KANAE.moves = Object.assign(baseNormals({ dmg: 0.98, spd: 0, rng: 1.0 }), {
  sp1: {
    name: 'IMPULSE', jp: '衝動', desc: 'A sudden lean, then she bursts forward and kicks. Fast, short-to-medium range, reliable combo starter. Unbalanced recovery: punishable on block or whiff. +6 Rebellion on hit. Break the Rules / Unrestrained: press SP1 again on hit for KNEE & STOMP.', special: 1, lvl: 4,
    poses: ['lean_w', 'fkick'], st: 10, act: 5, rec: 22, cd: 50, dmg: 62, hs: 22, bs: 12, kb: 7, hb: { x: 4, y: -150, w: 86, h: 72 }, str: 2, sfx: 'whoosh', keepVel: 1,
    sw: { cx: 10, cy: -100, r: 80, a0: 0.9, a1: -0.4 },
    tick(F, f, O) {
      const sp = F.unrT > 0 ? 1.15 : 1;
      if (f >= 4 && f <= 14) { F.vx = F.facing * 13.5 * sp; F.ctrlVel = true; F.afterimage = Math.max(F.afterimage, 3); if (f % 2 === 0) FX.dust(F.x - F.facing * 18, GROUND, 1); }
      if (f === 15) Sound.play('kick');
    },
    onHit(A, D) { kanGain(A, 6); FX.ring(D.x, D.y - 110, KR, 8, 70, 10, 3); FX.shakeIt(3); },
    poseFn(F, f) { const m = F.move; return f <= 5 ? 'lean_w' : f <= m.st + m.act + 2 ? 'fkick' : 'stumble'; },
  },
  impulse2: {
    name: 'KNEE & STOMP', jp: '膝と踏み', followup: 1, lvl: 4.5, poses: ['shove', 'heel'], st: 6, act: 4, rec: 22, dmg: 52, hs: 30, bs: 12, kb: 3, launch: -12, hb: { x: 0, y: -170, w: 80, h: 120 }, str: 3, sfx: 'kick',
    onHit(A, D) { kanGain(A, 4); FX.shakeIt(5); },
  },
  sp1f: {
    name: 'DISGUST', jp: '嫌悪', desc: 'Feint. She starts a big swing, stops dead and stares (her outline distorts) — hold BLOCK in that pause to cancel the feint — then strikes from another angle: an OVERHEAD heel drop, or hold ↓ at the stop for a LOW shin kick. 18 f startup: jab her during the pause. +8 Rebellion. Unrestrained: SP1 on hit for a second strike.', special: 1, lvl: 4,
    poses: ['feint_w', 'heel'], st: 18, act: 1, rec: 22, cd: 70, sfx: 'whoosh',
    poseFn(F, f) { return f <= 8 ? 'feint_w' : f <= 13 ? 'feint' : f <= 18 ? (F.disgLow ? 'crouch' : 'heel_w') : f <= 30 ? (F.disgLow ? 'shin' : 'heel') : 'stumble'; },
    tick(F, f) {
      if (f === 1) F.disgLow = false;
      if (f === 9) { FX.wtext(F.x + F.facing * 20, F.y - 220, 'tch', { size: 18, color: '#ffd0d6', stroke: KINK, life: 22 }); Sound.play('slap', 0.5); }
      if (f >= 9 && f <= 12 && F.input.held.block) { F.cd.sp1f = 35; F.feintT = 50; F.toIdle(); FX.wtext(F.x, F.y - 236, 'FEINT', { size: 20, color: '#ffffff', stroke: KR2, life: 24 }); return; }
      if (f === 13) F.disgLow = !!F.input.d;
    },
    spawn: { f: 18, fn(F) {
      const low = F.disgLow;
      BT.spawn({ owner: F, kind: 'kanStrike', x: F.x + F.facing * 58, y: low ? GROUND - 30 : F.y - 140, vx: F.facing * 0.001, w: 96, h: low ? 50 : 120, life: 4, hits: 1, clash: 0, type: low ? 'low' : 'overhead',
        dmg: 60, hs: 26, bs: 12, kb: 4, str: 2, kd: low ? 1 : 0, color: KR, srcKey: 'sp1f', projOnHit: 1,
        onHit(A, D) { kanGain(A, 8); A.feintT = 50; A.disgHit = A.T; FX.burst(D.x, D.y - 100, KR, 8, 6); } });
      Sound.play('kick'); FX.shakeIt(3);
    } },
  },
  disgust2: {
    name: 'SPITE', jp: '悪意', followup: 1, lvl: 4.5, poses: ['crouch', 'shin'], st: 5, act: 4, rec: 20, dmg: 46, type: 'low', kd: 1, hs: 30, bs: 12, kb: 5, hb: { x: 0, y: -50, w: 96, h: 44 }, crouch: 1, str: 2, sfx: 'kick',
    onHit(A) { kanGain(A, 4); },
  },
  counter: {
    name: 'PROVOCATION', jp: '挑発', desc: 'She steps in and gives an unimpressed "come on" — a short counter window (f7–20). Melee or projectiles in the window: she slips it and retaliates with a launching kick (+18 Rebellion). Grabs, unblockables and ultimates beat it. If nothing comes, she follows up with a quick shove.', special: 1, lvl: 4,
    counter: 1, counterNoGrab: 1, poses: ['taunt', 'taunt'], st: 6, act: 14, rec: 16, cd: 110, sfx: 'slap',
    tick(F, f) {
      if (f === 1) { F.provHit = false; FX.wtext(F.x + F.facing * 30, F.y - 226, pick(['come on.', 'try it.', 'boring.']), { size: 18, color: '#ffd0d6', stroke: KINK, life: 30 }); }
      if (f <= 6) { F.vx = F.facing * 3; F.ctrlVel = true; }
      if (f === 21 && !F.provHit) F.startMove('provSlap', true);
    },
    onCounter(F, A, proj) {
      F.provHit = true;
      const btr = F.btrT > 0 ? 1.5 : 1, mk = kanMarked(F, A) ? 6 : 0;
      kanGain(F, Math.round(18 * btr) + mk, 'READ YOU');
      F.afterimage = 10; Sound.play('whoosh');
      if (proj && Math.abs(A.x - F.x) > 220) { F.startMove('provSmirk', true); return; }   // a projectile from far away: she just leans out of it
      F.x = clamp(F.x - F.facing * 14, 60, STAGE_W - 60);
      F.startMove(F.unrT > 0 ? 'provKickU' : 'provKick', true);
    },
  },
  provKick: { name: 'PROVOCATION • KICK', jp: '挑発返し', lvl: 5, poses: ['lean_w', 'fkick'], st: 4, act: 5, rec: 20, dmg: 72, hs: 34, kb: 3, launch: -11, hb: { x: 0, y: -180, w: 96, h: 120 }, invuln: [0, 10], str: 3, shake: 6, sfx: 'kick', vx: 6, sw: { cx: 10, cy: -100, r: 80, a0: 0.9, a1: -0.4 } },
  provKickU: { name: 'PROVOCATION • KICK', jp: '挑発返し', lvl: 5, poses: ['lean_w', 'nmp3'], st: 3, act: 6, rec: 16, dmg: 92, hs: 38, kb: 3, launch: -13, hb: { x: 0, y: -185, w: 104, h: 130 }, invuln: [0, 12], str: 3, shake: 8, sfx: 'kick', vx: 7, impact: 2 },
  provSlap: { name: 'SHOVE', jp: '突き飛ばし', lvl: 4, poses: ['shove', 'shove'], st: 5, act: 3, rec: 16, dmg: 40, hs: 20, bs: 10, kb: 6, hb: { x: 8, y: -160, w: 80, h: 70 }, str: 2, vx: 5, sfx: 'slap' },
  provSmirk: { name: 'NOT EVEN CLOSE', jp: '余裕', lvl: 4, poses: ['taunt', 'bored'], st: 2, act: 1, rec: 12 },
  sp2: {
    name: 'THE PACT', jp: '契約', desc: 'She walks right up to them, taps their chest and steps back with a bored look. On hit: a crimson mark for 6 s, visible to both. Marked foes feed her Rebellion when they use specials (max 5×), Impulse +10%, Provocation +6, No More Pretending\'s last kick hits harder. Blockable, long recovery.', special: 1, lvl: 4,
    poses: ['pact_w', 'pact'], st: 12, act: 4, rec: 26, cd: 300, dmg: 24, hs: 30, bs: 10, kb: 1.5, hb: { x: 6, y: -175, w: 74, h: 90 }, str: 1, sfx: 'whoosh',
    tick(F, f, O) {
      if (f <= 10) { F.vx = F.facing * 6.5; F.ctrlVel = true; }
      if (f > 18 && f <= 26) { F.vx = -F.facing * 4; F.ctrlVel = true; }
    },
    onHit(A, D) { kanPact(A, D); kanGain(A, 6); },
  },
  sp2f: {
    name: 'NO MORE PRETENDING', jp: 'もう演じない', desc: 'A brutal, ugly three-hit sequence: a sudden punch, an elbow from above, and a heavy kick that sends them flying (wall splat). Strong punish. Against a Pact mark the last kick hits much harder; Unrestrained: it launches instead, for a follow-up. 26 f recovery.', special: 1, lvl: 4,
    poses: ['nmp_w', 'nmp1'], st: 9, act: 22, rec: 26, cd: 260, dmg: 36, hits: 3, interval: 9, hs: 24, bs: 12, kb: 2.5, hb: { x: 6, y: -175, w: 96, h: 90 }, str: 2, sfx: 'whoosh',
    final: { dmg: 66, kb: 13, kd: 1, ws: 1, hs: 32, str: 3, shake: 8 },
    poseFn(F, f) { return f <= 9 ? 'nmp_w' : f <= 18 ? 'nmp1' : f <= 26 ? 'nmp2' : f <= 36 ? 'nmp3' : 'stumble'; },
    tick(F, f) { if (f >= 3 && f <= 30) { F.vx = F.facing * (f <= 10 ? 7 : 3.5); F.ctrlVel = true; } if (f === 10 || f === 19) Sound.play('slap'); if (f === 28) Sound.play('kick'); },
    onHit(A, D) {
      kanGain(A, 3);
      if (A.hitCount === 3) {
        if (kanMarked(A, D)) { BT.applyDamage(A, D, 24); D.vx *= 1.35; D.kanPactT = 0; FX.wtext(D.x, D.y - 240, 'BROKEN PACT', { size: 24, color: '#ffffff', stroke: KR2, life: 36 }); FX.burst(D.x, D.y - 110, KR, 16, 9); }
        if (A.unrT > 0) { D.vy = -12; D.vx = A.facing * 3; D.onGround = false; D.kdOnLand = true; D.canSplat = false; }
        FX.shakeIt(8);
      }
    },
  },
  sp2d: {
    name: 'BREAK THE RULES', jp: '規則破り', desc: 'Needs 25 Rebellion. She stops, stares right at them and smiles — then everything gets faster and meaner for 4 s: +18% speed, Impulse follow-up, counters give +50% Rebellion. At 100 Rebellion it becomes UNRESTRAINED instead (6 s): +30% speed, +8% damage, follow-ups on Impulse, Disgust and No More Pretending, stronger counter. Can upgrade a running Break the Rules (replaces it). Readable 20 f startup.', special: 1, lvl: 4,
    poses: ['stare', 'grin'], st: 20, act: 1, rec: 10, cd: 480, sfx: 'heart',
    req: F => !(F.unrT > 0) && !(F.spentT > 0) && ((F.reb || 0) >= 100 || (!(F.btrT > 0) && (F.reb || 0) >= 25)),   // at 100 it may upgrade a running Break the Rules (replaces it, never stacks)
    poseFn(F, f) { return f <= 10 ? 'stare' : 'grin'; },
    onStart(F) { F.unrGo = (F.reb || 0) >= 100; },
    tick(F, f) {
      if (f === 10) Sound.play('heart');
      if (f === 20) { if (F.unrGo) kanUnrestrained(F); else kanBreakRules(F); }
    },
  },
  ult: {
    name: 'THE SPITEFUL BLOOM', jp: '棘の花', desc: 'Ultimate. She stops and smiles. If her grabbing shove connects, the world loses its colour and a watching eye-flower grows behind her until it fills the sky, pulls them into its fringe, closes, blooms — and she finishes it with one ugly kick.', ult: 1, lvl: 6, cost: 100,
    poses: ['taunt', 'shove'], st: 12, act: 6, rec: 34, dmg: 20, hs: 40, bs: 20, kb: 1, hb: { x: 0, y: -200, w: 150, h: 200 }, invuln: [0, 16], str: 3,
    onHit(F, D) { BT.startCine(F, D, CINE.kanae, { zoom: 1.4 }); return true; },
  },
});
addFollowup(KANAE, 'sp1', { btn: 'sp1', move: 'impulse2', cond: F => F.btrT > 0 || F.unrT > 0, noMotion: true });
addFollowup(KANAE, 'sp1f', { btn: 'sp1', move: 'disgust2', cond: F => F.unrT > 0 && F.T - (F.disgHit || -99) < 30, any: true, noMotion: true });
(() => {
  const M = KANAE.moves;
  Object.assign(M.L, { name: 'Shove', poses: ['jab_w', 'shove'] });
  Object.assign(M.M, { name: 'Shin Kick' });
  Object.assign(M.H, { name: 'BACKHAND', poses: ['hook_w', 'hook'], onHit(A, D) { kanGain(A, 1); } });
  Object.assign(M.cH, { name: 'Trip' });
  Object.assign(M.LH, { name: 'Chin Check' });
  Object.assign(M.FF, { name: 'Running Kick', poses: ['lean_w', 'fkick'] });
  Object.assign(M.jH, { name: 'Stomp' });
})();
// CPU hints
KANAE.moves.sp1.__ai = { reach: 210, kind: 'melee', anti: false, st: 10, low: false, over: false };
KANAE.moves.sp1f.__ai = { reach: 120, kind: 'melee', anti: false, st: 18, low: false, over: true };
KANAE.moves.sp2.__ai = { reach: 130, kind: 'melee', anti: false, st: 12, low: false, over: false };
KANAE.combos = [
  { name: 'Impulse', notation: 'M → H → SP1 (Impulse)', seq: ['M', 'H', 'sp1'] },
  { name: 'Kick Them While They\'re Down', notation: 'Break the Rules active: M → H → SP1 → SP1 (Knee & Stomp)', seq: ['M', 'H', 'sp1', 'impulse2'], btr: 1 },
  { name: 'Sign Here', notation: 'M → H → SP2 (The Pact)', seq: ['M', 'H', 'sp2'] },
  { name: 'No More Pretending', notation: 'M → H → ↓→SP2 (No More Pretending)', seq: ['M', 'H', 'sp2f'] },
  { name: 'The Spiteful Bloom', notation: 'M → H → SP1+SP2 (Ultimate)', seq: ['M', 'H', 'ult'], meter: 1 },
];
KANAE.applyTrial = (A, tr) => { if (!tr) return; if (tr.meter) A.meter = 100; if (tr.btr) { A.btrT = 1e6; } };

// ---------------------------------- cinematic: THE SPITEFUL BLOOM ----------------------------------
CINE.kanae = function (A, D, f, c) {
  const dir = A.facing;
  if (f === 1) {
    A.x = clamp(A.x, 300, STAGE_W - 300);
    D.x = clamp(A.x + dir * 200, 120, STAGE_W - 120); D.y = GROUND; D.forcePose = 'hit'; A.forcePose = 'stare'; A.kanEx = 'calm';
    c.zoom = 1.4; c.camX = (A.x + D.x) / 2; c.camY = GROUND - 150; c.bg = KANAE.cineBg; c.fg = KANAE.cineFg;
    c.desat = 0; c.fl = { x: A.x - dir * 50, s: 0, open: 0, close: 0, look: dir }; c.vine = 0; c.white = 0; c.quiet = 0; c.bud = 0.82; D.kanX0 = D.x;
    FX.darkTarget = 0.2; Sound.play('heart');
  }
  const L = c.fl;
  // --- 1: THE CHALLENGE — she stops, stares, smiles; colour drains away; a small gesture to the ground ---
  if (f <= 50) { const k = easeOut(f / 50); c.zoom = lerp(1.4, 2.1, k); c.camX = lerp((A.x + D.x) / 2, A.x, k); c.camY = lerp(GROUND - 150, A.y - 170, k); }
  if (f === 22) { A.forcePose = 'grin'; A.kanEx = 'grin'; }
  if (f >= 10 && f <= 70) c.desat = (f - 10) / 60;
  if (f >= 30) c.quiet = Math.min(1, (f - 30) / 30);
  if (f === 52) { A.forcePose = 'gesture'; A.kanEx = 'calm'; Sound.play('chime'); }
  // --- 2: THE FLOWER EMERGES — tiny at her feet, then unnaturally fast growth until it dominates the sky ---
  if (f >= 56 && f <= 64) L.s = 0.1 * (f - 56) / 8;
  if (f === 66) { Sound.play('bloom'); FX.shakeIt(3); }
  if (f > 64 && f <= 126) { const k = easeInOut((f - 64) / 62); L.s = lerp(0.1, 3.0, k); L.x = A.x - dir * lerp(50, 70, k); if (f % 6 === 0) FX.shakeIt(2 + k * 4); }
  if (f >= 60 && f < 130) { const k = easeInOut((f - 60) / 70); c.zoom = lerp(2.1, 0.82, k); c.camX = lerp(A.x, (A.x + D.x) / 2 - dir * 40, k); c.camY = lerp(A.y - 170, GROUND - 330, k); }
  if (f === 96) Sound.play('heart');
  if (f >= 108 && f <= 128) L.open = (f - 108) / 20;
  if (f === 128) { Sound.play('hiss'); A.forcePose = 'stare'; }
  // --- 3: THE CAPTURE — its stems run across the ground, the opponent is lifted and pulled into its fringe, it closes ---
  if (f >= 134 && f <= 152) c.vine = (f - 134) / 18;
  const head = [L.x, GROUND - 150 * L.s];
  if (f === 150) { Sound.play('grab'); FX.shakeIt(5); D.kanX0 = D.x; }
  if (f >= 150 && f <= 190) { const k = easeInOut((f - 150) / 40); D.forcePose = 'airhit'; D.x = lerp(D.kanX0, head[0], k); D.y = lerp(GROUND, head[1] + 105, k); }
  if (f >= 150 && f < 200) { c.camX = lerp(c.camX, head[0] + dir * 40, 0.05); c.camY = lerp(c.camY, head[1] + 10, 0.05); c.zoom = lerp(c.zoom, 1.05, 0.04); }
  if (f >= 186 && f <= 202) L.close = (f - 186) / 16;
  if (f === 202) { Sound.play('crush'); FX.shakeIt(6); }
  if (f >= 206 && f <= 226 && f % 7 === 3) { BT.scriptHit(A, D, 10, { str: 1, sfx: 'hit' }); FX.shakeIt(3); }
  // --- 4: THE BLOOM — it bursts open; she steps in front of it and kicks; the petals converge; it snaps shut ---
  if (f === 230) {
    L.close = 0; c.white = 0.6; Sound.play('bloom'); Sound.play('impactBig'); FX.shakeIt(14);
    for (let i = 0; i < 70; i++) { const a = rand(0, TAU), v = rand(4, 16); FX.p({ type: 'petal', x: head[0], y: head[1], vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 60, size: rand(4, 8), color: i % 4 ? KINK : KR }); }
    D.x = clamp(L.x + dir * 70, 80, STAGE_W - 80); D.y = GROUND - 70; A.x = clamp(L.x + dir * 160, 80, STAGE_W - 80); A.facing = -dir; A.forcePose = 'lean_w'; A.kanEx = 'mad'; A.afterimage = 10;
  }
  if (f > 230 && f < 260) { c.camX = lerp(c.camX, (A.x + D.x) / 2, 0.15); c.camY = lerp(c.camY, GROUND - 200, 0.12); c.zoom = lerp(c.zoom, 1.25, 0.1); D.forcePose = 'airhit'; }
  if (f === 240) { A.forcePose = 'nmp3'; BT.scriptHit(A, D, 45, { str: 3, sfx: 'kick' }); FX.shakeIt(10); FX.ring(D.x, D.y - 90, KR, 10, 120, 12, 5); }
  if (f >= 242 && f <= 254 && f % 2 === 0) { const ch = D.chestW(); for (let i = 0; i < 6; i++) { const a = rand(0, TAU), d = rand(160, 300); FX.p({ type: 'petal', x: ch[0] + Math.cos(a) * d, y: ch[1] + Math.sin(a) * d, vx: -Math.cos(a) * d / 12, vy: -Math.sin(a) * d / 12, life: 12, size: rand(4, 7), color: i % 3 ? KINK : KR }); } }
  if (f >= 248 && f <= 256) { L.close = (f - 248) / 8; c.bud = 0.55; }
  if (f === 256) {
    BT.scriptHit(A, D, 155, { str: 4 }); FX.impactFrame(5); FX.shakeIt(28); Sound.play('explosion'); FX.flashScreen('#ffffff', 16, 0.85); c.white = 0.8;
    const ch = D.chestW(); FX.ring(ch[0], ch[1], KR, 10, 420, 24, 9); FX.ring(ch[0], ch[1], '#ffffff', 10, 260, 18, 5);
    for (let i = 0; i < 40; i++) FX.p({ type: 'petal', x: ch[0], y: ch[1], vx: rand(-12, 12), vy: rand(-12, 6), life: 50, size: rand(4, 8), color: i % 3 ? KINK : KR });
    FX.wtext(D.x, D.y - 260, '棘の花', { size: 64, font: FX_JP(), color: '#ffffff', stroke: KR2, life: 64, vy: -0.3 });
  }
  if (f === 258) { BT.release(D, -dir * 7, -9); }
  if (c.white > 0) c.white = Math.max(0, c.white - 0.04);
  // --- 5: AFTERMATH — colour returns, the flower is gone; a small one stays on the ground; she glances, then turns her back ---
  if (f >= 262 && f <= 290) { L.s = lerp(3.0, 0, (f - 262) / 28); L.close = Math.max(0, L.close - 0.05); c.desat = Math.max(0, c.desat - 0.04); c.quiet = Math.max(0, c.quiet - 0.04); c.vine = Math.max(0, c.vine - 0.06); }
  if (f === 290) { A.kanSeed = { x: clamp(L.x, 60, STAGE_W - 60), t: 300, look: -dir }; A.forcePose = 'look_down'; A.kanEx = 'calm'; }
  if (f >= 262 && f < 330) { c.zoom = lerp(c.zoom, 1.5, 0.05); c.camX = lerp(c.camX, A.x - dir * 30, 0.06); c.camY = lerp(c.camY, GROUND - 140, 0.06); }
  if (f === 314) { A.facing = dir; A.forcePose = 'stance'; A.kanEx = null; FX.wtext(A.x, A.y - 230, 'whatever.', { size: 18, color: '#ffd0d6', stroke: KINK, life: 40 }); }
  if (f >= 316 && f < 334) A.x = clamp(A.x + dir * 1.2, 60, STAGE_W - 60);
  if (f >= 336) { c.zoom = lerp(c.zoom, 1.0, 0.2); FX.darkTarget = 0; A.kanEx = null; kanGain(A, 10); return true; }
};
function easeInOut(t) { t = clamp(t, 0, 1); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
KANAE.cineBg = (g, c) => {   // screen space: the world drains to grey, then the giant flower behind everything
  const k = c.desat || 0;
  if (k > 0.01) {
    g.save(); g.globalCompositeOperation = 'saturation'; g.globalAlpha = Math.min(1, k); g.fillStyle = '#808080'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 0.28 * k; g.fillStyle = '#d8d6d2'; g.fillRect(0, 0, W, H); g.restore();
  }
  const L = c.fl; if (!L || L.s <= 0.001 || !BT) return;
  const cam = BT.cam, [sx, sy] = cam.toScreen(L.x, GROUND), z = cam.z;
  g.save();
  if (c.vine > 0) {   // its stems run along the ground toward the opponent
    g.strokeStyle = KINK; g.lineCap = 'round';
    const [dx] = cam.toScreen(c.D.kanX0 ?? c.D.x, GROUND), e = lerp(sx, dx, c.vine);
    for (let i = 0; i < 3; i++) { g.lineWidth = (5 - i) * z; g.beginPath(); g.moveTo(sx, sy); g.bezierCurveTo(lerp(sx, e, 0.3), sy + (8 + i * 6) * z, lerp(sx, e, 0.7), sy - (10 + i * 12) * z, e, sy - (20 + i * 30) * z * c.vine); g.stroke(); }
  }
  const look = c.D ? Math.sign(c.D.x - L.x) * (L.close > 0 ? 0 : 0.6) : 0;
  kanFlower(g, sx, sy, L.s * z, { T: c.f, open: L.open, close: L.close > 0.5 ? 0.5 : L.close, look });
  g.restore();
};
KANAE.cineFg = (g, c) => {   // screen space over everything: the closed bud in front of the trapped opponent, silence vignette, white-out
  const L = c.fl;
  if (L && L.close > 0.5 && BT) {
    const cam = BT.cam, [sx, sy] = cam.toScreen(L.x, GROUND);
    g.save(); kanFlower(g, sx, sy, L.s * cam.z, { T: c.f, open: 1, close: L.close, budA: c.bud }); g.restore();
  }
  const q = Math.max(c.quiet || 0, c.desat || 0) * 0.8;
  if (q > 0.01) { g.save(); const gr = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.75); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(10,6,8,${0.65 * q})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); }
  if (c.white > 0) { g.save(); g.fillStyle = `rgba(250,246,244,${c.white})`; g.fillRect(0, 0, W, H); g.restore(); }
};

// ---------------------------------- HUD + how-to ----------------------------------
KANAE.drawHand = (g, F, side, t) => {
  const unr = F.unrT > 0, btr = F.btrT > 0, spent = F.spentT > 0;
  xpPanel(g, F, side, t, {
    col: unr ? '#ff4a60' : spent ? '#7a6066' : KR, col2: '#ffffff', icon: '反', flash: unr || (F.reb || 0) >= 100,
    title: unr ? 'UNRESTRAINED' : btr ? 'BREAK THE RULES' : spent ? 'SPENT' : 'REBELLION',
    sub: unr ? '解放 · +30% SPEED · +8% DMG · FOLLOW-UPS' : btr ? `規則破り · faster · counters +50%  ${(F.btrT / 60).toFixed(1)}s` : spent ? 'catching her breath… no gain' : (F.reb || 0) >= 100 ? 'MAX — ↓↓SP2 for UNRESTRAINED' : '反抗 · counter, dodge, punish, feint',
    k: (F.reb || 0) / 100, label: unr ? `${(F.unrT / 60).toFixed(1)}s` : `${Math.floor(F.reb || 0)}%`, marks: [0.25],
    badges: [['sp1', 'S1|IMPULSE'], ['sp1f', '↓→S1|DISGUST'], ['counter', '↓←S1|PROVOKE'], ['sp2', 'S2|PACT'], ['sp2f', '↓→S2|NO MORE'], ['sp2d', '↓↓S2|RULES']],
  });
  const O = F.opp; if (!O || !kanMarked(F, O)) return;
  const pw = 330, x0 = side > 0 ? W - 40 - pw : 40, y0 = 528, k = O.kanPactT / (O.kanPactMax || KAN_PACT);
  g.save(); g.fillStyle = 'rgba(22,8,12,0.88)'; g.fillRect(x0, y0, pw, 26); g.fillStyle = 'rgba(224,40,60,0.25)'; g.fillRect(x0, y0, pw * k, 26); g.strokeStyle = KR; g.lineWidth = 1.4; g.strokeRect(x0, y0, pw, 26);
  g.textBaseline = 'middle'; g.textAlign = 'left'; g.font = `900 12px ${FONT_UI}`; g.fillStyle = '#ffffff'; g.fillText('✿ THE PACT — KANAE IS WATCHING', x0 + 8, y0 + 13.5);
  g.textAlign = 'right'; g.fillStyle = '#ffd0d6'; g.fillText(`${(O.kanPactT / 60).toFixed(1)}s`, x0 + pw - 8, y0 + 13.5); g.textBaseline = 'alphabetic'; g.restore();
};
KANAE.howTo = {
  title: 'KANAE',
  draw(g) {
    xpHowTo(g, 'KANAE — THE SPITEFUL BLOOM', KR, [
      ['REBELLION', 'Provocation counter +18, interrupting a special +10, a feint payoff +6, backdash through an attack +6, hitting their recovery +5. Fades when idle.'],
      ['↓↓ SP2', 'Break the Rules (25 Rebellion): 4 s faster + Impulse follow-up. At 100: UNRESTRAINED 6 s (+30% speed, +8% dmg, follow-ups), then 2.5 s spent.'],
      ['SP1', 'Impulse — sudden rushing kick. Combo starter; punishable when blocked. SP1 again in Break the Rules / Unrestrained: Knee & Stomp.'],
      ['↓→ SP1', 'Disgust — a feint: big swing, dead stop, then an OVERHEAD heel drop (hold ↓ at the stop: LOW kick). Hold BLOCK in the pause to cancel.'],
      ['↓← SP1', 'Provocation — short counter window (f7–20). Retaliates with a launching kick. Grabs/unblockables/ults beat it. No attack → a shove.'],
      ['SP2', 'The Pact — taps their chest: crimson mark 6 s (visible to both). Their specials feed her Rebellion; some of her moves get stronger.'],
      ['↓→ SP2', 'No More Pretending — punch, elbow, heavy kick (wall splat). Pact: the last kick hits harder. Unrestrained: it launches.'],
    ], 'Don\'t fight fair: provoke, wait, punish the habit. Mix the overhead and low Disgust, cancel the feint when they flinch. Ultimate (SP1+SP2): THE SPITEFUL BLOOM.');
  },
};

CHARS.push(KANAE);
finalizeMoves(KANAE);
