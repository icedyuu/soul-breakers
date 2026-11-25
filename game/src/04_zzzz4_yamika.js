// ============================ YAMIKA — THE WICKED EYE ============================
// Trickster / magic caster / technical. A tiny self-proclaimed dark sorceress in a navy school uniform, half-cape and
// eyepatch who is completely convinced her powers are real (and somehow they are). Original design on the chibi kit.
// Systems: CHUUNI ENERGY (magic hits, traps, ability chains) → WICKED AWAKENING · REALITY DISTORTION field that
//          changes how her spells behave · Mystic Seal traps · summoned shadow beast · Tyrant's Grasp bind.
const YAM_WAKE_T = 420, YAM_FIELD_T = 420;
const YV = '#b04cff', YV2 = '#6a1fd0', YDARK = '#1a0830', YGOLD = '#ffcf4a';

// ---------------------------------- art ----------------------------------
function yamPal(base, lv, unseal) {
  const p = { ...base, chuLv: lv, unseal: !!unseal };
  if (lv >= 2) Object.assign(p, { eye: '#d08cff', accent: '#d870ff', pad: '#d870ff' });
  return p;
}
function yamPatch(g, r, c, o) {   // eyepatch over the far eye + strap across the head
  const px = 0.95 * r, py = 0.22 * r;
  g.save(); g.lineCap = 'round';
  g.strokeStyle = '#0c0a14'; g.lineWidth = 0.075 * r;
  g.beginPath(); g.moveTo(px - 0.06 * r, py - 0.24 * r); g.quadraticCurveTo(0.3 * r, -0.62 * r, -0.62 * r, -0.72 * r); g.stroke();
  g.fillStyle = '#0c0a14'; g.strokeStyle = OUTLINE; g.lineWidth = 0.04 * r;
  g.beginPath(); g.ellipse(px, py, 0.19 * r, 0.27 * r, -0.12, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.ellipse(px - 0.06 * r, py - 0.12 * r, 0.06 * r, 0.04 * r, -0.4, 0, TAU); g.fill();
  // the "seal" — a tiny violet pentagram she drew on it herself
  g.strokeStyle = c.chuLv >= 2 ? '#e8a8ff' : YV; g.lineWidth = 0.025 * r; if (c.chuLv >= 2 && FX.hq) { g.shadowColor = YV; g.shadowBlur = 6; }
  g.beginPath(); for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * TAU * 2 / 5; const x = px + Math.cos(a) * 0.1 * r, y = py + Math.sin(a) * 0.13 * r; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  g.restore();
}
function yamWickedEye(g, x, y, w, h, t) {   // the revealed eye: gold iris, violet fire
  g.save();
  if (FX.hq) { g.shadowColor = '#c040ff'; g.shadowBlur = 14; }
  g.fillStyle = '#fff6ff'; g.beginPath(); g.ellipse(x, y, w, h, 0, 0, TAU); g.fill();
  const gr = g.createRadialGradient(x, y, 0, x, y, h); gr.addColorStop(0, '#fffbe0'); gr.addColorStop(0.35, YGOLD); gr.addColorStop(0.8, '#c06a10'); gr.addColorStop(1, '#5a1a80');
  g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, w * 0.9, h * 0.92, 0, 0, TAU); g.fill(); g.shadowBlur = 0;
  g.fillStyle = '#2a0a40'; g.beginPath(); g.ellipse(x, y, w * 0.22, h * 0.62, 0, 0, TAU); g.fill();   // slit pupil
  g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x - w * 0.3, y - h * 0.36, w * 0.28, h * 0.2, -0.3, 0, TAU); g.fill();
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.55 + 0.25 * Math.sin(t * 0.4);
  const fl = g.createRadialGradient(x, y, 0, x, y, h * 2.2); fl.addColorStop(0, 'rgba(255,200,255,0.9)'); fl.addColorStop(0.4, 'rgba(176,76,255,0.5)'); fl.addColorStop(1, 'rgba(120,20,220,0)');
  g.fillStyle = fl; g.beginPath(); g.arc(x, y, h * 2.2, 0, TAU); g.fill();
  g.restore();
}
function yamFace(g, r, c, o) {
  chibiFace(g, r, c, o);
  const e = o.expr || 'normal', fx = 0.94 * r, ey = 0.25 * r;
  if (c.unseal) { if (e !== 'ko') yamWickedEye(g, fx - (o.cut ? 0.06 * r : 0), ey - 0.01 * r, (o.cut ? 0.15 : 0.085) * r, 0.3 * r, o.T || 0); }
  else yamPatch(g, r, c, o);
  if (c.chuLv >= 2 && e !== 'hurt' && e !== 'ko' && e !== 'closed' && !R0(o)) {   // awakened: her visible eye glows
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.45 + 0.2 * Math.sin((o.T || 0) * 0.25);
    const gr = g.createRadialGradient(0.5 * r, ey, 0, 0.5 * r, ey, 0.55 * r); gr.addColorStop(0, 'rgba(220,140,255,0.8)'); gr.addColorStop(1, 'rgba(140,40,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0.5 * r, ey, 0.55 * r, 0, TAU); g.fill(); g.restore();
  }
}
const R0 = o => !!o.mono;
function yamCape(g, sk, c, R, o) {   // short tattered half-cape with violet lining and a stiff high collar
  const T = o.T || 0, sw = Math.sin(T * 0.09) * 3 + (o.capeKick || 0), n = sk.neck, h = sk.hip;
  const col1 = [n[0] - 14, n[1] - 16], col2 = [n[0] - 2, n[1] - 18];
  poly(g, [[n[0] - 6, n[1] + 2], col1, [n[0] - 20, n[1] - 4], [n[0] - 18, n[1] + 8]], R.mono || c.capeIn, R, 2);
  const hem = [[h[0] - 34 + sw, h[1] - 2], [h[0] - 26 + sw * 0.8, h[1] - 12], [h[0] - 20 + sw * 0.6, h[1] + 2], [h[0] - 10 + sw * 0.4, h[1] - 10], [h[0] - 4 + sw * 0.3, h[1] + 4], [h[0] + 4, h[1] - 8]];
  poly(g, [[n[0] + 8, n[1] + 2], [n[0] - 4, n[1] - 4], [n[0] - 22, n[1] + 6], ...hem], R.mono || c.cape, R, 3);
  if (R.mono) return;
  g.fillStyle = c.capeIn; g.beginPath(); g.moveTo(n[0] - 4, n[1] + 2); g.lineTo(h[0] - 4 + sw * 0.3, h[1] + 2); g.lineTo(h[0] + 4, h[1] - 8); g.lineTo(n[0] + 6, n[1] + 4); g.closePath(); g.fill();
  poly(g, [[n[0] - 4, n[1] - 2], col2, [n[0] + 4, n[1] - 4]], c.capeIn, R, 1.5);
  // a crooked hand-painted sigil on the back
  g.strokeStyle = 'rgba(190,120,255,0.5)'; g.lineWidth = 1.3; const sx = h[0] - 18 + sw * 0.5, sy = (n[1] + h[1]) / 2 + 4;
  g.beginPath(); g.arc(sx, sy, 6, 0, TAU); g.moveTo(sx - 6, sy); g.lineTo(sx + 6, sy); g.moveTo(sx, sy - 6); g.lineTo(sx, sy + 6); g.stroke();
}
function yamHand(g, sk, p, c, R) {   // violet flame in the casting hand
  if (!(p.pw > 0.3) || R.mono) return;
  const [hx, hy] = sk.fh, t = BT ? BT.pf : 0, k = p.pw;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) { g.globalAlpha = 0.5 * k; g.fillStyle = ['#5a1aa0', YV, '#f0c8ff'][i]; g.beginPath(); g.ellipse(hx, hy - 6 - i * 2, (10 - i * 3) * k, (14 - i * 3) * k + Math.sin(t * 0.5 + i) * 2, 0, 0, TAU); g.fill(); }
  g.restore();
}

// ---------------------------------- character ----------------------------------
const YAMIKA = {
  id: 'yamika', name: 'YAMIKA', jp: 'ヤミカ', title: 'The Wicked Eye', titleJp: '邪眼の魔導士',
  style: 'TRICKSTER / CASTER', desc: 'Swears her eyepatch seals a forbidden eye. Dark flames, trap seals, a shadow beast and grasping hands: chaotic, tricky, deadly.',
  stats: { power: 3, speed: 4, range: 4, defense: 2 },
  scale: 1.0, health: 940, walk: 4.3, backWalk: 4.0, jumpV: -17.5, jumpX: 4.8, dashV: 12, backdashV: 11, backdashInv: 10, juggleMax: 6,
  voicePitch: 1.35, voiceRate: 1.08,
  colors: {
    skin: '#fbe6dc', hair: '#2a3066', hair2: '#1a1d44', top: '#262a4e', leg: '#fbe6dc', boot: '#1a1626', foot: '#1a1626', uarm: '#262a4e', farm: '#262a4e', hand: '#fbe6dc', cuff: '#f2eefa', belt: '#141222',
    eye: '#a070ff', eye2: '#2a1050', accent: YV, brow: '#1a1d44', warm: '#1a1626', sole: '#4a1a8a', pad: YV, collar: '#141222',
    plaid: '#1c1c30', plaid2: '#2c2a4a', plaidLine: '#8a4ce0', cape: '#141222', capeIn: '#4a1f8a', ribbon: '#8a2ad0', chuLv: 0, unseal: false,
  },
  afterColors: [YV, '#4a1f8a', '#1a0830'],
  stance: { t: -0.02, hd: 0.04, fa1: 0.75, fa2: 2.05, ba1: -0.35, ba2: 0.2, fl1: 0.22, fl2: 0.05, bl1: -0.2, bl2: -0.08, pw: 0 },
  poses: {
    eyecover: { t: -0.1, hd: -0.12, fa1: 2.1, fa2: 3.75, ba1: -0.75, ba2: -0.45, fl1: 0.3, fl2: 0.05, bl1: -0.3, bl2: -0.1, pw: 0 },
    peek: { t: 0.06, hd: 0.22, fa1: 0.9, fa2: 2.5, ba1: -0.2, ba2: 0.5 },
    cast_w: { t: -0.15, hd: -0.18, fa1: 2.75, fa2: 3.0, ba1: -0.6, ba2: -0.3, fl1: 0.3, fl2: 0.05, bl1: -0.25, bl2: -0.1, pw: 1 },
    cast: { t: 0.16, hd: 0.08, fa1: 1.6, fa2: 1.62, ba1: -0.9, ba2: -0.6, fl1: 0.55, fl2: 0.15, bl1: -0.45, bl2: -0.2, pw: 1 },
    sigil_w: { t: -0.05, hd: 0.0, fa1: 2.3, fa2: 2.9, ba1: -0.3, ba2: 0.4, pw: 1 },
    sigil: { t: 0.08, hd: 0.06, fa1: 1.25, fa2: 0.9, ba1: 0.9, ba2: 2.2, fl1: 0.35, fl2: 0.1, bl1: -0.3, bl2: -0.1, pw: 1 },
    point: { t: 0.05, hd: 0.0, fa1: 1.6, fa2: 1.75, ba1: -0.4, ba2: 0.9, fl1: 0.3, fl2: 0.08, bl1: -0.25, bl2: -0.1, pw: 0 },
    vanish: { t: 0.3, hd: 0.3, fa1: 0.3, fa2: 0.6, ba1: -0.5, ba2: -0.2, fl1: 1.0, fl2: -0.2, bl1: 0.2, bl2: -1.0 },
    summon: { t: -0.2, hd: -0.25, fa1: 2.85, fa2: 3.05, ba1: 2.6, ba2: 2.95, fl1: 0.35, fl2: 0.05, bl1: -0.35, bl2: -0.1, pw: 1 },
    grasp_w: { t: -0.08, hd: -0.05, fa1: 2.2, fa2: 2.6, ba1: 0.2, ba2: 0.8, pw: 0 },
    grasp: { t: 0.2, hd: 0.15, fa1: 1.15, fa2: 0.7, ba1: -0.5, ba2: -0.2, fl1: 0.55, fl2: 0.18, bl1: -0.45, bl2: -0.2, pw: 1 },
    ritual: { t: -0.16, hd: -0.3, fa1: 2.4, fa2: 2.2, ba1: -2.2, ba2: -2.5, fl1: 0.15, fl2: 0.02, bl1: -0.15, bl2: -0.02, pw: 1 },
    victory: { t: -0.12, hd: -0.12, fa1: 2.1, fa2: 3.75, ba1: -1.25, ba2: -0.95, fl1: 0.45, fl2: 0.08, bl1: -0.1, bl2: -0.35, pw: 0 },
    defeat: { t: 0.45, hd: 0.2, fa1: 2.4, fa2: 3.6, ba1: 0.4, ba2: 0.2, fl1: 1.35, fl2: 0.0, bl1: 0.25, bl2: -1.45 },
    intro: { t: -0.1, hd: -0.12, fa1: 2.1, fa2: 3.75, ba1: -0.75, ba2: -0.45, fl1: 0.3, fl2: 0.05, bl1: -0.3, bl2: -0.1, pw: 0 },
  },
  intro: 'The seal on my right eye trembles… you have awakened something terrible!',
  wins: ['Evil has been vanquished. The world is safe… for now.', 'Behold! The power of the Wicked Eye!', 'Hmph. You never stood a chance against the Dark Flame Master.'],
  ropes: [
    { id: 'tailB', at: (sk, r) => headPt(sk, -r * 1.0, r * 0.05), n: 5, seg: 7, w0: 7, w1: 3, color: 'hair', grav: 0.5, wind: 0.5 },
  ],
  hairBack(g, r, c, R) {
    polyR(g, r, [[0.7, -0.84], [0.1, -1.18], [-0.66, -1.06], [-1.18, -0.5], [-1.22, 0.3], [-1.06, 0.82], [-0.66, 0.78], [-0.36, 0.56]], c.hair, R);
  },
  hairFront(g, r, c, R, o) {
    const sw = Math.sin((o.T || 0) * 0.12) * 0.04;
    polyR(g, r, [[-0.3, -0.98], [-0.86, -0.72], [-1.08, -0.2], [-1.06, 0.48], [-0.84, 0.8], [-0.5, 0.66], [-0.36, 0.1], [-0.2, -0.4]], c.hair, R);
    // chin-length side lock
    polyR(g, r, [[-0.1, -0.3], [0.06, 0.5], [0.02, 1.02], [-0.16, 1.12], [-0.34, 0.78], [-0.46, 0.2]], c.hair, R);
    // the near-side little ponytail, tied with a black ribbon
    polyR(g, r, [[-0.42, -0.22], [-0.26, -0.1], [-0.42 - sw * r / r, 0.6], [-0.62 + sw, 1.05], [-0.7 + sw, 0.62], [-0.6, -0.02]], c.hair2, R);
    // straight blunt bangs with a few spikes
    polyR(g, r, [[-0.36, -0.96], [0.3, -1.04], [0.96, -0.76], [1.14, -0.24], [1.08, -0.1], [0.96, -0.24], [0.86, -0.06], [0.72, -0.22], [0.56, -0.04], [0.42, -0.24], [0.26, -0.1], [0.12, -0.48]], c.hair, R);
    if (R.mono) return;
    shine(g, r, [[-0.2, -0.86], [0.44, -0.88]], R);
    g.fillStyle = '#0c0a14'; g.strokeStyle = OUTLINE; g.lineWidth = 1;   // ribbon
    g.beginPath(); g.moveTo(-0.5 * r, -0.12 * r); g.lineTo(-0.78 * r, -0.3 * r); g.lineTo(-0.74 * r, 0.02 * r); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-0.46 * r, -0.08 * r); g.lineTo(-0.24 * r, -0.3 * r); g.lineTo(-0.2 * r, 0.0); g.closePath(); g.fill(); g.stroke();
    // silver cross hair-pin
    g.strokeStyle = '#d8d8f0'; g.lineWidth = 0.06 * r; g.beginPath(); g.moveTo(0.2 * r, -0.86 * r); g.lineTo(0.2 * r, -0.6 * r); g.moveTo(0.11 * r, -0.78 * r); g.lineTo(0.29 * r, -0.78 * r); g.stroke();
  },
  neckWear(g, sk, p, c, R) {
    const n = sk.neck;   // black sailor collar with violet piping + violet ribbon + cross choker
    poly(g, [[n[0] - 17, n[1] + 13], [n[0] - 12, n[1] - 5], [n[0] + 10, n[1] - 8], [n[0] + 14, n[1] + 10], [n[0] + 2, n[1] + 4]], c.collar, R, 3);
    if (R.mono) return;
    g.strokeStyle = c.plaidLine; g.lineWidth = 1.4; g.beginPath(); g.moveTo(n[0] - 15, n[1] + 10); g.lineTo(n[0] - 11, n[1] - 3); g.stroke();
    g.fillStyle = c.ribbon; g.strokeStyle = OUTLINE; g.lineWidth = 1;
    g.beginPath(); g.moveTo(n[0] + 3, n[1] + 6); g.lineTo(n[0] - 6, n[1] + 2); g.lineTo(n[0] - 5, n[1] + 11); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(n[0] + 3, n[1] + 6); g.lineTo(n[0] + 11, n[1] + 2); g.lineTo(n[0] + 10, n[1] + 11); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(n[0] + 2, n[1] + 7); g.lineTo(n[0] - 1, n[1] + 18); g.lineTo(n[0] + 4, n[1] + 16); g.lineTo(n[0] + 7, n[1] + 19); g.lineTo(n[0] + 5, n[1] + 7); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#0c0a14'; g.fillRect(n[0] - 6, n[1] - 6, 14, 3);
    g.strokeStyle = '#d8d8f0'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(n[0] + 2, n[1] - 3); g.lineTo(n[0] + 2, n[1] + 3); g.moveTo(n[0] - 0.5, n[1] - 0.5); g.lineTo(n[0] + 4.5, n[1] - 0.5); g.stroke();
  },
  torsoDetail(g, L, bw, c) {
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(-14 * bw, -L * 0.42, 28 * bw, L * 0.42);
    g.strokeStyle = 'rgba(160,110,255,0.35)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(8 * bw, -L + 4); g.lineTo(6 * bw, 0); g.stroke();
    g.fillStyle = '#b8b0d8'; for (let i = 0; i < 2; i++) { g.beginPath(); g.arc(10 * bw, -L * (0.42 - i * 0.18), 1.4, 0, TAU); g.fill(); }
  },
  torsoOver(g, L, bw, c, R) {   // belt with a dangling chain
    if (R.mono) return; g.fillStyle = c.belt; g.fillRect(-13 * bw, -5, 26 * bw, 5);
    g.strokeStyle = '#a8a8c8'; g.lineWidth = 1.2; g.beginPath(); for (let i = 0; i < 4; i++) { g.moveTo(-6 * bw + i * 5, -1 + Math.abs(i - 1.5) * 1.5); g.arc(-6 * bw + i * 5, 1 + Math.abs(i - 1.5) * 1.5, 2, -Math.PI / 2, Math.PI * 1.5); } g.stroke();
  },
  drawSkirt(g, sk, p, c, R, o) { plaidSkirt(g, sk, c, R, o); },
  weaponBack(g, sk, p, c, R, o) { yamCape(g, sk, c, R, o); },
  weaponFront(g, sk, p, c, R) { yamHand(g, sk, p, c, R); },
};
makeChibi(YAMIKA, { build: { arm: 0.98, leg: 0.97, torso: 1.0 }, colors: {} });
YAMIKA.faceFn = yamFace;

// ---------------------------------- chuuni energy ----------------------------------
const YAM_PALS = [0, 1].map(k => yamPal(YAMIKA.colors, k, false)), YAM_PAL_W = yamPal(YAMIKA.colors, 2, false), YAM_PAL_U = yamPal(YAMIKA.colors, 2, true);
YAMIKA.palette = F => F.unsealT > 0 ? YAM_PAL_U : F.wakeT > 0 ? YAM_PAL_W : YAM_PALS[(F.chu || 0) >= 50 ? 1 : 0];
const yamLvl = F => F.wakeT > 0 ? 2 : (F.chu || 0) >= 50 ? 1 : 0;
const yamInField = F => { const p = F.fieldP; return !!(p && !p.dead && Math.abs(F.x - p.x) < p.r); };
function yamChu(F, n) {
  if (F.ko || F.wakeT > 0) return;
  if (n > 0 && yamInField(F)) n *= 1.5;   // her delusion is strongest inside her own distorted reality
  F.chu = clamp((F.chu || 0) + n, 0, 100); if (n > 0) F.chuT = F.T;
}
function yamMagic(A, D, key, n = 6) {   // a spell connected: energy, plus a bonus for chaining *different* spells
  let bonus = 0;
  if (A.lastMagic && A.lastMagic !== key && A.T - A.lastMagicT < 150) { bonus = 6; FX.wtext(A.x, A.y - 250, 'CHAIN CAST!', { size: 18, color: '#f0c8ff', stroke: YDARK, life: 30 }); }
  A.lastMagic = key; A.lastMagicT = A.T; yamChu(A, n + bonus);
}
function yamAwaken(F) {
  F.wakeT = YAM_WAKE_T; F.chu = 100;
  FX.ring(F.x, F.y - 110, YV, 20, 320, 26, 6); FX.ring(F.x, F.y - 110, YGOLD, 10, 150, 18, 3); FX.flashScreen('#3a0a60', 14, 0.5);
  FX.wtext(F.x, F.y - 255, 'WICKED AWAKENING', { size: 36, color: '#ffffff', stroke: '#5a10a0', life: 64 });
  FX.wtext(F.x, F.y - 215, '— 邪眼覚醒 —', { size: 22, font: FX_JP(), color: '#f0c8ff', stroke: YDARK, life: 64 });
  Sound.play('energy'); Sound.play('charge');
}
YAMIKA.initFighter = F => { F.chu = 0; F.chuT = -999; F.wakeT = 0; F.unsealT = 0; F.fieldP = null; F.lastMagic = null; F.lastMagicT = -999; F.seals = []; };
YAMIKA.onDealDamage = (A) => { if (!A.ko && A.state !== 'cine') yamChu(A, 2); };
YAMIKA.idlePose = F => { const k = F.T % 420; return k > 330 && k < 372 ? 'eyecover' : k > 160 && k < 196 ? 'peek' : null; };
YAMIKA.tick = F => {
  const O = F.opp; if (!O) return;
  const live = BT && BT.phase === 'fight' && !F.ko;
  if (F.unsealT > 0 && F.state !== 'cine') F.unsealT--;
  if (F.hidden && F.state !== 'cine' && !(F.state === 'attack' && (F.moveKey === 'counter' || F.moveKey === 'stepIn'))) F.hidden = false;
  if (F.wakeT > 0) {
    F.wakeT--; F.chu = 100 * F.wakeT / YAM_WAKE_T;
    if (F.T % 3 === 0 && !F.hidden) FX.p({ type: 'ember', x: F.x + rand(-34, 34), y: F.y - rand(10, 170), vx: rand(-0.3, 0.3), vy: -rand(0.6, 1.6), life: 26, size: rand(1.5, 3), color: pick([YV, '#e8a8ff', YV2]) });
    if (F.state === 'attack' && F.move && F.move.special) F.afterimage = Math.max(F.afterimage, 2);   // even more dramatic
  } else if (live) {
    if (F.T - F.chuT > 240 && F.chu > 0 && F.state !== 'cine') F.chu = Math.max(0, F.chu - 0.1);
    if (F.chu >= 100) yamAwaken(F);
  }
  // theatrical movement: little sparkles when she walks
  if (F.state === 'walk' && F.T % 14 === 0) FX.p({ type: 'spark', x: F.x - F.facing * 16, y: F.y - rand(20, 60), vx: 0, vy: -0.6, life: 18, size: 2, color: '#d8b0ff' });
  // Tyrant's Grasp keeps the victim pinned while the hands hold on
  if (O.graspT > 0) { O.graspT--; if (O.state !== 'hit' || (BT && BT.cine)) O.graspT = 0; else { O.vx = 0; if (O.y < GROUND) O.vy = Math.max(O.vy, 1); } }
  // Reality Distortion: enemy projectiles entering the field slow down
  const fp = F.fieldP;
  if (fp && !fp.dead && BT) for (const p of BT.projs) if (p.owner === O && !p.yamSlow && Math.abs(p.x - fp.x) < fp.r) { p.yamSlow = 1; p.vx *= 0.55; p.life = Math.round(p.life * 1.4); }
  if (fp && fp.dead) F.fieldP = null;
};
YAMIKA.drawExtra = (g, F) => {
  const O = F.opp;
  if (O && O.graspT > 0 && !O.hidden) yamHands(g, O.x, GROUND, 1, F.T, 0.9);
  if (F.state === 'attack' && F.moveKey === 'ult' && F.mf > F.move.st && F.mf <= F.move.st + F.move.act + 4) {   // the ult's opening wave of darkness
    const k = (F.mf - F.move.st) / F.move.act, x = F.x + F.facing * (40 + 320 * Math.min(1, k));
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.6; g.fillStyle = YV; g.beginPath(); g.ellipse(x, F.y - 100, 36, 100, 0, 0, TAU); g.fill(); g.restore();
  }
};
YAMIKA.introFx = F => {
  FX.ring(F.x, F.y - 110, YV, 10, 240, 28, 3); FX.darkTarget = 0;
  for (let i = 0; i < 18; i++) FX.p({ type: 'ember', x: F.x + rand(-60, 60), y: F.y - rand(20, 200), vx: 0, vy: -rand(0.3, 1.2), life: 50, size: rand(1.5, 2.8), color: pick([YV, '#e8a8ff']) });
  Sound.play('energy');
};

// ---------------------------------- effects / projectiles ----------------------------------
function yamSigil(g, x, y, R, rot, col, a, flat = 0.32) {   // a "forbidden seal": circle, pentagram, runes
  g.save(); g.translate(x, y); g.scale(1, flat); g.rotate(rot); g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = 2.4 / Math.max(flat, 0.5);
  g.beginPath(); g.arc(0, 0, R, 0, TAU); g.stroke(); g.lineWidth = 1.4 / Math.max(flat, 0.5); g.beginPath(); g.arc(0, 0, R * 0.8, 0, TAU); g.stroke();
  g.beginPath(); for (let i = 0; i <= 5; i++) { const b = -Math.PI / 2 + i * TAU * 2 / 5; i ? g.lineTo(Math.cos(b) * R * 0.8, Math.sin(b) * R * 0.8) : g.moveTo(Math.cos(b) * R * 0.8, Math.sin(b) * R * 0.8); } g.stroke();
  for (let i = 0; i < 10; i++) { const b = i * TAU / 10; g.beginPath(); g.moveTo(Math.cos(b) * R * 0.84, Math.sin(b) * R * 0.84); g.lineTo(Math.cos(b + 0.12) * R * 0.95, Math.sin(b + 0.12) * R * 0.95); g.stroke(); }
  g.restore();
}
function yamHands(g, x, gy, s, t, a) {   // dark hands reaching out of the ground
  g.save(); g.globalAlpha = a;
  for (const [ox, ang, L] of [[-40, -0.35, 110], [-16, -0.12, 135], [12, 0.15, 125], [38, 0.38, 100]]) {
    const bx = x + ox * s, wob = Math.sin(t * 0.3 + ox) * 0.06, dx = Math.sin(ang + wob), dy = -Math.cos(ang + wob), L2 = L * s;
    const tx = bx + dx * L2, ty = gy + dy * L2;
    g.fillStyle = '#12061e'; g.strokeStyle = YV; g.lineWidth = 2;
    g.beginPath(); g.moveTo(bx - 9 * s, gy); g.quadraticCurveTo(bx + dx * L2 * 0.5 - 8 * s, gy + dy * L2 * 0.5, tx - 6 * s, ty); g.lineTo(tx + 6 * s, ty); g.quadraticCurveTo(bx + dx * L2 * 0.5 + 8 * s, gy + dy * L2 * 0.5, bx + 9 * s, gy); g.closePath(); g.fill(); g.stroke();
    for (let f = -2; f <= 2; f++) {   // clawed fingers curling inward
      const fa = ang + wob + f * 0.28 - Math.sign(ox) * 0.35, fx = tx + Math.sin(fa) * 20 * s, fy = ty - Math.cos(fa) * 20 * s;
      g.lineWidth = 4.5 * s; g.strokeStyle = '#12061e'; g.beginPath(); g.moveTo(tx + f * 3 * s, ty); g.quadraticCurveTo(fx, fy, fx - Math.sign(ox || 1) * 6 * s, fy + 6 * s); g.stroke();
      g.lineWidth = 1.2; g.strokeStyle = YV; g.stroke();
    }
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = '#d870ff'; g.beginPath(); g.arc(tx, ty + 8 * s, 2.5 * s, 0, TAU); g.fill(); g.restore();
  }
  g.restore();
}
function yamBeast(g, x, y, s, t, dir, a, bite) {   // the summoned shadow beast: round, horned, all teeth and one huge eye
  g.save(); g.translate(x, y); g.scale(dir * s, s); g.globalAlpha = a;
  // wispy tail / smoke base
  g.fillStyle = '#10051c'; g.beginPath(); g.moveTo(-50, 30); for (let i = 0; i <= 8; i++) { const xx = -50 + i * 12.5; g.lineTo(xx, 40 + Math.sin(t * 0.4 + i) * 8 + (i % 2) * 8); } g.lineTo(50, 30); g.closePath(); g.fill();
  // body
  const bob = Math.sin(t * 0.25) * 3;
  g.fillStyle = '#16082a'; g.strokeStyle = '#7a2ad8'; g.lineWidth = 3;
  g.beginPath(); g.ellipse(0, bob, 52, 46, 0, 0, TAU); g.fill(); g.stroke();
  // horns
  for (const sx of [-1, 1]) { g.fillStyle = '#2a1040'; g.beginPath(); g.moveTo(sx * 18 + 4, -36 + bob); g.quadraticCurveTo(sx * 46, -70 + bob, sx * 30 + 10, -86 + bob); g.quadraticCurveTo(sx * 30, -60 + bob, sx * 6 + 6, -40 + bob); g.closePath(); g.fill(); g.stroke(); }
  // little stubby arms with claws
  g.fillStyle = '#16082a'; g.beginPath(); g.ellipse(40, 18 + bob, 16, 10, 0.5 + (bite ? -0.8 : 0), 0, TAU); g.fill(); g.stroke();
  g.strokeStyle = '#e8d8ff'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(52, 14 + i * 5 + bob - (bite ? 10 : 0)); g.lineTo(60, 10 + i * 6 + bob - (bite ? 14 : 0)); g.stroke(); }
  // huge eye
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(200,80,255,0.35)'; g.beginPath(); g.arc(14, -12 + bob, 26, 0, TAU); g.fill(); g.restore();
  g.fillStyle = '#ffe24a'; g.beginPath(); g.ellipse(14, -12 + bob, 17, 14, 0, 0, TAU); g.fill(); g.strokeStyle = OUTLINE; g.lineWidth = 2; g.stroke();
  g.fillStyle = '#1a0410'; g.beginPath(); g.ellipse(18, -12 + bob, 4, 11, 0, 0, TAU); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(9, -17 + bob, 3, 0, TAU); g.fill();
  // grinning maw
  const open = bite ? 16 : 6;
  g.fillStyle = '#3a0626'; g.beginPath(); g.moveTo(-26, 14 + bob); g.quadraticCurveTo(6, 22 + open + bob, 38, 10 + bob); g.quadraticCurveTo(6, 16 + bob, -26, 14 + bob); g.fill();
  g.fillStyle = '#f4eeff'; for (let i = 0; i < 7; i++) { const xx = -20 + i * 8.5, yy = 14 + bob + Math.sin(i / 6 * Math.PI) * 4; g.beginPath(); g.moveTo(xx - 3.5, yy); g.lineTo(xx, yy + 7); g.lineTo(xx + 3.5, yy); g.closePath(); g.fill(); }
  g.restore();
}
function yamDemon(g, x, y, s, t, dir, a, v = 0) {   // ult demons: winged, horned silhouettes with burning eyes
  g.save(); g.translate(x, y); g.scale(dir * s, s); g.globalAlpha = a;
  const fl = Math.sin(t * 0.45 + v) * 0.35;
  g.fillStyle = '#0a0412'; g.strokeStyle = ['#b04cff', '#ff3a6a', '#6a8aff', '#ffcf4a'][v % 4]; g.lineWidth = 2.5;
  for (const sx of [-1, 1]) {   // bat wings
    g.beginPath(); g.moveTo(0, -10); g.lineTo(sx * -70, -60 - fl * 40); g.lineTo(sx * -58, -20); g.lineTo(sx * -80, -8 - fl * 20); g.lineTo(sx * -50, 8); g.lineTo(sx * -64, 28); g.lineTo(0, 12); g.closePath(); g.fill(); g.stroke();
  }
  g.beginPath(); g.ellipse(0, 0, 26, 34, 0, 0, TAU); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(-10, -28); g.quadraticCurveTo(-30, -52, -22, -66); g.quadraticCurveTo(-16, -46, -2, -32); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(10, -28); g.quadraticCurveTo(30, -52, 22, -66); g.quadraticCurveTo(16, -46, 2, -32); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(14, 18); g.lineTo(44, 34); g.lineTo(38, 24); g.lineTo(50, 22); g.lineTo(18, 8); g.closePath(); g.fill(); g.stroke();   // claw
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = g.strokeStyle; g.shadowColor = g.strokeStyle; g.shadowBlur = FX.hq ? 10 : 0;
  g.beginPath(); g.moveTo(2, -10); g.lineTo(16, -14); g.lineTo(13, -6); g.closePath(); g.fill(); g.beginPath(); g.moveTo(-6, -10); g.lineTo(-16, -13); g.lineTo(-12, -6); g.closePath(); g.fill();
  g.restore();
  g.fillStyle = '#f0e8ff'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-8 + i * 6, 6); g.lineTo(-5 + i * 6, 13); g.lineTo(-2 + i * 6, 6); g.closePath(); g.fill(); }
  g.restore();
}
function yamPortal(g, x, y, R, a, t) {
  g.save(); g.globalAlpha = a; g.translate(x, y);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, R); gr.addColorStop(0, '#000000'); gr.addColorStop(0.7, '#1a0430'); gr.addColorStop(1, 'rgba(120,30,220,0)');
  g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, R * 0.62, R, 0, 0, TAU); g.fill();
  g.globalCompositeOperation = 'lighter'; g.strokeStyle = YV; g.lineWidth = 3;
  for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(0, 0, R * (0.62 - i * 0.08), R * (1 - i * 0.12), Math.sin(t * 0.05 + i) * 0.1, t * 0.08 + i, t * 0.08 + i + 4.6); g.stroke(); }
  g.restore();
}
EXTRA_PROJ.darkFlame = {
  update(p) {
    if (p.home && p.t > 6) { const D = p.owner.opp; p.vy = clamp((D.y - 100 * D.s - p.y) * 0.08, -4, 4); }
    if (p.t % 2 === 0) FX.p({ type: 'ember', x: p.x - p.vx, y: p.y + rand(-8, 8), vx: -p.vx * 0.15, vy: -rand(0.5, 1.5), life: 18, size: rand(2, 4) * p.sz, color: pick([YV, '#5a1aa0', '#e8a8ff']) });
  },
  draw(g, p) {
    const s = p.sz, T = p.t; g.globalCompositeOperation = 'lighter'; g.translate(p.x, p.y); g.scale(Math.sign(p.vx) || 1, 1);
    for (let i = 4; i >= 0; i--) { g.fillStyle = ['#1a0430', '#5a1aa0', YV, '#e8a8ff', '#ffffff'][4 - i]; g.globalAlpha = i === 4 ? 0.9 : 0.8; g.beginPath(); g.ellipse(-i * 5 * s, 0, (14 + i * 6 + Math.sin(T * 0.7 + i) * 3) * s, (11 + i * 4) * s, 0, 0, TAU); g.fill(); }
    g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(10,0,20,0.7)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-8 * s, (-14 + i * 9) * s); g.quadraticCurveTo((-38 - (T * 3 + i * 7) % 16) * s, (-22 + i * 12) * s, (-60 - (T * 5 + i * 11) % 20) * s, (-8 + i * 5) * s); g.lineTo(-8 * s, (-10 + i * 9) * s); g.fill(); }
  },
};
EXTRA_PROJ.mysticSeal = {
  rect: p => ({ x: p.x - p.w / 2, y: GROUND - p.h, w: p.w, h: p.h }),
  delay(p) { if (p.t % 3 === 0) FX.p({ type: 'spark', x: p.x + rand(-p.w / 2, p.w / 2), y: GROUND - rand(0, 20), vx: 0, vy: -rand(0.5, 2), life: 14, size: 2, color: '#d8b0ff' }); },
  update(p) { if (!p.armed) { p.armed = 1; Sound.play('chime'); FX.ring(p.x, GROUND - 60, YV, 10, p.w * 0.7, 12, 3); } if (p.t % 10 === 0) FX.p({ type: 'ember', x: p.x + rand(-20, 20), y: GROUND - rand(30, 100), vx: 0, vy: -0.6, life: 20, size: 2, color: YV }); },
  draw(g, p) {
    const arm = p.delay > 0, k = arm ? 1 - p.delay / p.delay0 : 1, a = arm ? 0.35 + 0.25 * Math.sin(p.t * 0.9) : 0.75 + 0.25 * Math.sin(p.t * 0.2), fade = Math.min(1, p.life / 20);
    g.globalCompositeOperation = 'lighter';
    yamSigil(g, p.x, GROUND - 4, p.w * 0.62 * (0.4 + 0.6 * k), p.t * 0.03, arm ? '#8a5cd0' : YV, a * fade, 0.28);
    if (!arm) yamSigil(g, p.x, GROUND - 78, p.w * 0.42, -p.t * 0.05, '#e8a8ff', 0.55 * fade, 1);   // the upright seal hanging in the air
  },
};
EXTRA_PROJ.shadeBeast = {
  rect: p => ({ x: p.x - p.w / 2, y: GROUND - p.h, w: p.w, h: p.h }),
  delay(p) { if (p.t % 2 === 0) FX.p({ type: 'smoke', x: p.x + rand(-40, 40), y: GROUND - rand(0, 10), vx: 0, vy: -rand(0.5, 1.5), life: 20, size: rand(10, 16), grow: 0.5, color: 'rgba(30,8,50,0.5)', add: false }); },
  update(p) {
    const D = p.owner.opp; p.vx = clamp((D.x - p.x) * 0.1, -p.spd, p.spd);
    if (!p.roared) { p.roared = 1; Sound.play('roar'); FX.ring(p.x, GROUND, YV, 10, 120, 14, 4, 0.25); }
    if (p.life <= 2) { for (let i = 0; i < 12; i++) FX.p({ type: 'smoke', x: p.x + rand(-30, 30), y: GROUND - rand(20, 90), vx: rand(-1, 1), vy: -rand(0.5, 2), life: 22, size: rand(10, 18), grow: 0.6, color: 'rgba(40,10,70,0.5)', add: false }); }
  },
  draw(g, p) {
    const rise = p.delay > 0 ? 1 - p.delay / p.delay0 : 1, a = Math.min(1, p.life / 8), s = p.sz;
    g.save(); g.beginPath(); g.rect(p.x - 200, GROUND - 400, 400, 400); g.clip();
    yamBeast(g, p.x, GROUND - 52 * s + (1 - rise) * 110 * s, 0.95 * s, p.t, p.owner.opp.x > p.x ? 1 : -1, a, p.hitT > 6);
    g.restore();
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5 * a; g.fillStyle = YV; g.beginPath(); g.ellipse(p.x, GROUND, 60 * s, 9, 0, 0, TAU); g.fill();
  },
};
EXTRA_PROJ.grasp = {
  rect: p => ({ x: p.x - p.w / 2, y: GROUND - p.h, w: p.w, h: p.h }),
  delay(p) { if (p.t % 3 === 0) FX.p({ type: 'smoke', x: p.x + rand(-p.w / 2, p.w / 2), y: GROUND - 4, vx: 0, vy: -rand(0.5, 1.5), life: 16, size: rand(6, 10), grow: 0.3, color: 'rgba(60,10,100,0.5)', add: false }); },
  update(p) { if (!p.fired) { p.fired = 1; Sound.play('grab'); FX.dust(p.x, GROUND, 8, 'rgba(90,40,140,0.5)'); } },
  draw(g, p) {
    const k = p.delay > 0 ? 1 - p.delay / p.delay0 : 1;
    g.globalCompositeOperation = 'lighter'; yamSigil(g, p.x, GROUND - 2, p.w * 0.55, -p.t * 0.06, YV, p.delay > 0 ? 0.4 + 0.4 * Math.sin(p.t * 0.8) : 0.6, 0.25);
    g.globalCompositeOperation = 'source-over';
    if (p.delay > 0) { if (k > 0.5) yamHands(g, p.x, GROUND, p.w / 120, p.t, (k - 0.5) * 0.8); }   // fingertips poking out: a clear warning
    else yamHands(g, p.x, GROUND, p.w / 120, p.t, Math.min(1, p.life / 5));
  },
};
EXTRA_PROJ.shadeBurst = {
  rect: p => ({ x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h }),
  update(p) { if (!p.boom) { p.boom = 1; if (p.quiet) return; Sound.play('explosion'); FX.ring(p.x, p.y, YV, 10, 90, 12, 5); FX.burst(p.x, p.y, YV, 16, 7); } },
  draw(g, p) {
    if (p.quiet) return;
    if (p.delay > 0) { g.globalAlpha = 0.5; g.fillStyle = '#1a0830'; g.beginPath(); g.ellipse(p.x, p.y, 26, 60, 0, 0, TAU); g.fill(); return; }
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, p.life / 6); const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, 70); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, YV); gr.addColorStop(1, 'rgba(90,20,160,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, 70, 0, TAU); g.fill();
  },
};
EXTRA_PROJ.distort = {   // Reality Distortion field (harmless; it only changes how her magic behaves)
  update(p) {
    if (p.t % 5 === 0) FX.p({ type: 'spark', x: p.x + rand(-p.r, p.r), y: GROUND - rand(0, 240), vx: 0, vy: -rand(0.3, 1), life: 30, size: rand(1.5, 2.5), color: pick([YV, '#e8a8ff', YGOLD]) });
    if (p.life === 1) FX.ring(p.x, GROUND - 100, YV, p.r, 20, 16, 3);
  },
  draw(g, p) {
    const k = Math.min(1, p.t / 14, p.life / 20), t = p.t, r = p.r;
    g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(p.x, GROUND - 90, 20, p.x, GROUND - 90, r * 1.1); gr.addColorStop(0, 'rgba(120,40,220,0.05)'); gr.addColorStop(0.85, 'rgba(150,60,255,0.16)'); gr.addColorStop(1, 'rgba(150,60,255,0)');
    g.globalAlpha = k; g.fillStyle = gr; g.beginPath(); g.ellipse(p.x, GROUND - 90, r * 1.1, 210, 0, 0, TAU); g.fill();
    // warped space: wobbling bands
    g.strokeStyle = 'rgba(200,140,255,0.22)'; g.lineWidth = 2;
    for (let i = 0; i < 4; i++) { const yy = GROUND - 40 - i * 55; g.beginPath(); for (let x = -r; x <= r; x += 16) { const y = yy + Math.sin(x * 0.03 + t * 0.12 + i) * 8; x === -r ? g.moveTo(p.x + x, y) : g.lineTo(p.x + x, y); } g.stroke(); }
    yamSigil(g, p.x, GROUND - 2, r * 0.95, t * 0.01, YV, 0.45 * k, 0.16);
    // floating seals
    for (let i = 0; i < 4; i++) { const a = t * 0.02 + i * TAU / 4, x = p.x + Math.cos(a) * r * 0.8, y = GROUND - 150 + Math.sin(a * 1.3) * 40; yamSigil(g, x, y, 14, -t * 0.05, '#e8a8ff', 0.5 * k, 1); }
    // mysterious eyes opening in the dark
    for (let i = 0; i < 5; i++) {
      const ph = (t * 0.6 + i * 37) % 160; if (ph > 60) continue; const o = Math.sin(ph / 60 * Math.PI), x = p.x + (i - 2) * r * 0.42, y = GROUND - 200 - (i % 2) * 40;
      g.globalAlpha = 0.6 * k * o; g.fillStyle = i % 2 ? YGOLD : '#ff5adf';
      for (const dx of [-7, 7]) { g.beginPath(); g.ellipse(x + dx, y, 4, 3 * o + 0.5, 0, 0, TAU); g.fill(); }
    }
    // tiny supernatural critters drifting at the edges
    g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 3; i++) { const x = p.x + Math.sin(t * 0.015 + i * 2) * r * 0.9, y = GROUND - 40 - ((t * 0.7 + i * 60) % 180); g.globalAlpha = 0.5 * k; yamBeast(g, x, y, 0.16, t + i * 9, i % 2 ? 1 : -1, 1, false); }
  },
};

// ---------------------------------- moves ----------------------------------
const yamTarget = (F, O, max) => { const d = O.x - F.x; return Math.abs(d) <= max ? O.x : F.x + F.facing * max; };
const yamClampX = x => clamp(x, 60, STAGE_W - 60);
function yamPuff(x, y, n = 14) { for (let i = 0; i < n; i++) FX.p({ type: 'smoke', x: x + rand(-26, 26), y: y - rand(10, 150), vx: rand(-1.5, 1.5), vy: -rand(0.3, 1.5), life: 26, size: rand(12, 20), grow: 0.7, color: pick(['rgba(70,20,120,0.55)', 'rgba(30,10,50,0.6)']), add: false }); }
function yamPop(F) {
  yamPuff(F.x, F.y, 10); FX.ring(F.x, F.y - 90, YV, 10, 110, 12, 5); FX.burst(F.x, F.y - 90, '#e8a8ff', 14, 8); Sound.play('explosion');
}
YAMIKA.moves = Object.assign(baseNormals({ dmg: 0.96, spd: 0, rng: 1 }), {
  sp1: {
    name: 'FORBIDDEN DARK FLAME', jp: '禁忌の黒炎', desc: '"Burn, flame of the abyss!" A violet-black fireball with a clear straight path and a small explosion. In Reality Distortion it homes in on the foe\'s height; Awakened she throws two.', special: 1, lvl: 4,
    poses: ['cast_w', 'cast'], st: 13, act: 1, rec: 17, cd: 42, sfx: 'fire',
    spawn: { f: 14, fn(F) {
      const lv = yamLvl(F), home = yamInField(F);
      const mk = (dy, sz, dmg, vx) => BT.spawn({ owner: F, kind: 'darkFlame', x: F.x + F.facing * 55, y: F.y - 112 + dy, vx: F.facing * vx, w: 42 * sz, h: 36 * sz, life: 52, dmg, hs: 18, bs: 12, kb: 5, str: 2, color: YV, sz, home, srcKey: 'sp1', projOnHit: 1,
        onHit(A, D) { FX.ring(D.x, D.y - 100, YV, 10, 90, 12, 5); FX.burst(D.x, D.y - 100, '#e8a8ff', 14, 7); Sound.play('explosion'); yamMagic(A, D, 'sp1'); } });
      mk(0, lv ? 1.2 : 1, 50, 9.5);
      if (lv >= 2) F.flame2 = F.T + 9;
    } },
    tick(F) { if (F.flame2 && F.T === F.flame2) { F.flame2 = 0; BT.spawn({ owner: F, kind: 'darkFlame', x: F.x + F.facing * 55, y: F.y - 70, vx: F.facing * 11, w: 34, h: 30, life: 46, dmg: 26, hs: 14, bs: 9, kb: 4, str: 1, color: YV, sz: 0.8, home: yamInField(F), srcKey: 'sp1' }); } },
  },
  sp1f: {
    name: 'MYSTIC SEAL', jp: '封魔の刻印', desc: 'Draws a "forbidden" seal in front of her. After a short, visible arming delay it waits up to 5 s; anyone who steps in sets off an explosion that pops them up. Jump over it or block. Arms instantly in Reality Distortion / Awakening (and two can exist there).', special: 1, lvl: 4,
    poses: ['sigil_w', 'sigil'], st: 12, act: 1, rec: 16, cd: 140, sfx: 'chime',
    spawn: { f: 12, fn(F) {
      const lv = yamLvl(F), fast = lv >= 2 || yamInField(F);
      F.seals = (F.seals || []).filter(p => !p.dead && p.life > 0);
      while (F.seals.length >= (fast ? 2 : 1)) F.seals.shift().dead = true;
      const p = BT.spawn({ owner: F, kind: 'mysticSeal', x: yamClampX(F.x + F.facing * 120), y: GROUND - 70, vx: F.facing * 0.001, w: lv >= 2 ? 120 : 92, h: 140, delay: fast ? 4 : 22, delay0: fast ? 4 : 22, life: 300, dmg: lv >= 2 ? 68 : 62, hs: 30, bs: 14, kb: 3, launch: -10, str: 2, clash: 0, color: YV, srcKey: 'sp1f', projOnHit: 1,
        onHit(A, D) {
          FX.ring(D.x, GROUND - 70, '#ffffff', 10, 140, 14, 6); FX.ring(D.x, GROUND - 70, YV, 20, 180, 18, 6, 0.4); FX.burst(D.x, GROUND - 80, '#e8a8ff', 22, 10); FX.shakeIt(8); Sound.play('explosion');
          FX.wtext(D.x, D.y - 240, 'SEALED!', { size: 26, color: '#ffffff', stroke: '#5a10a0', life: 36 }); yamMagic(A, D, 'sp1f', 12);
        } });
      F.seals.push(p);
    } },
  },
  counter: {
    name: 'SHADOW STEP', jp: '影渡り', desc: 'Points dramatically and vanishes in violet smoke, reappearing ~230 px back with a little explosion (escape). Press SP1 during the smoke for Phantom Return: reappear right behind the opponent instead. Range ×1.5 in Reality Distortion.', special: 1, lvl: 4,
    poses: ['point', 'vanish'], st: 3, act: 1, rec: 26, cd: 66, invuln: [1, 16], pass: 16, sfx: 'teleport',
    tick(F, f) {
      F.vx = 0;
      if (f === 4) { yamPuff(F.x, F.y); F.hidden = true; FX.wtext(F.x, F.y - 200, 'Fufu…', { size: 18, color: '#e8d8ff', stroke: YDARK, life: 24 }); }
      if (f === 13) {
        F.x = yamClampX(F.x - F.facing * (yamInField(F) ? 340 : 230)); F.hidden = false; yamPop(F); if (yamLvl(F) >= 2) yamDecoy(F);
        BT.spawn({ owner: F, kind: 'shadeBurst', x: F.x, y: F.y - 90, vx: 0.001, w: 130, h: 170, life: 6, dmg: 28, hs: 18, bs: 10, kb: 4, str: 1, clash: 0, color: YV, srcKey: 'counter', quiet: 1 });   // the little arrival explosion
      }
    },
  },
  stepIn: {
    name: 'PHANTOM RETURN', jp: '幻影帰還', desc: 'From Shadow Step: reappear just behind the opponent with an explosion (cross-up).', special: 1, lvl: 4.5,
    poses: ['vanish', 'cast'], st: 9, act: 3, rec: 16, dmg: 34, hs: 22, bs: 12, kb: 5, str: 2, hb: { x: -60, y: -170, w: 140, h: 170 }, invuln: [0, 9], pass: 10, sfx: 'teleport',
    onStart(F) { F.hidden = true; F.vx = 0; },
    tick(F, f, O) {
      F.vx = 0;
      if (f === 7) { const side = O.x > STAGE_W - 140 ? -1 : O.x < 140 ? 1 : Math.sign(O.x - F.x) || 1; F.x = yamClampX(O.x + side * 75); F.facing = O.x > F.x ? 1 : -1; F.hidden = false; yamPop(F); }
    },
  },
  sp2: {
    name: 'DARKNESS SUMMONING', jp: '闇の召喚', desc: 'Arms up — a shadow beast rises from the ground in front of her and chases the opponent, biting twice (the second bite launches). She recovers quickly, so it covers her while she repositions. 3 bites when Awakened or in Reality Distortion.', special: 1, lvl: 4,
    poses: ['summon', 'summon'], st: 16, act: 1, rec: 14, cd: 280, sfx: 'energy',
    spawn: { f: 16, fn(F) {
      const lv = yamLvl(F), n = lv >= 2 || yamInField(F) ? 3 : 2;
      BT.spawn({ owner: F, kind: 'shadeBeast', x: yamClampX(F.x + F.facing * 90), y: GROUND - 60, vx: 0, w: 84, h: 120, delay: 18, delay0: 18, life: 64, hits: n, interval: 16, persist: 0, spd: 6.5, sz: lv >= 2 ? 1.15 : 1,
        dmg: 38, hs: 20, bs: 12, kb: 1, str: 3, clash: 0, color: YV, srcKey: 'sp2', projOnHit: 1,
        final: { dmg: 46, launch: -11, kb: 5, hs: 26 },
        onHit(A, D) { Sound.play('slash'); FX.burst(D.x, D.y - 90, '#e8a8ff', 10, 6); yamMagic(A, D, 'sp2', 5); } });
      FX.wtext(F.x, F.y - 240, 'COME FORTH!', { size: 24, color: '#ffffff', stroke: '#5a10a0', life: 34 });
    } },
  },
  sp2f: {
    name: "TYRANT'S GRASP", jp: '暴君の掌握', desc: '"You are already in my grasp!" Dark hands burst from the ground where the opponent stands (up to ~420 px) after a visible warning (sigil + fingertips). On hit they hold the victim in place ~0.7 s for a follow-up. Block, walk out or jump.', special: 1, lvl: 4,
    poses: ['grasp_w', 'grasp'], st: 14, act: 1, rec: 20, cd: 240, sfx: 'grab',
    spawn: { f: 14, fn(F, O) {
      const lv = yamLvl(F), x = yamTarget(F, O, 420), big = lv >= 2 || yamInField(F);
      BT.spawn({ owner: F, kind: 'grasp', x, y: GROUND - 75, vx: F.facing * 0.001, w: big ? 160 : 120, h: 150, delay: 22, delay0: 22, life: 16, dmg: 66, hs: 42, bs: 14, kb: 0, str: 2, clash: 0, color: YV, srcKey: 'sp2f', projOnHit: 1,
        onHit(A, D) { D.graspT = 40; D.vx = 0; FX.wtext(D.x, D.y - 235, 'CAPTURED!', { size: 26, color: '#ffffff', stroke: '#5a10a0', life: 36 }); yamMagic(A, D, 'sp2f', 8); } });
    } },
  },
  sp2d: {
    name: 'REALITY DISTORTION', jp: '妄想領域', desc: 'An elaborate ritual (vulnerable): for 7 s the area around her warps into her imagination. While she stands inside: Dark Flame homes, Mystic Seal arms instantly (2 at once), Shadow Step goes farther, the beast bites 3×, the hands grow, enemy projectiles slow down and Chuuni Energy fills 1.5× faster.', special: 1, lvl: 4,
    poses: ['ritual', 'ritual'], st: 20, act: 1, rec: 18, cd: 600, sfx: 'charge',
    spawn: { f: 20, fn(F) {
      if (F.fieldP && !F.fieldP.dead) F.fieldP.dead = true;
      F.fieldP = BT.spawn({ owner: F, kind: 'distort', x: F.x, y: GROUND - 100, vx: 0, w: 1, h: 1, life: YAM_FIELD_T, harmless: true, persist: 1, clash: 0, r: yamLvl(F) >= 2 ? 330 : 260, srcKey: 'sp2d' });
      FX.flashScreen('#2a0848', 12, 0.45); FX.ring(F.x, GROUND - 100, YV, 20, 300, 24, 5, 0.5); FX.shakeIt(6); yamChu(F, 10);
      FX.wtext(F.x, F.y - 250, 'REALITY… DISTORTED!', { size: 28, color: '#ffffff', stroke: '#5a10a0', life: 50 });
    } },
  },
  ult: {
    name: 'THE UNSEALED WICKED EYE', jp: '邪眼解放', desc: 'Ultimate. A wave of darkness crosses mid range; on hit everything stops — she tears off the eyepatch, the hidden eye blazes, portals open and demons tear into the opponent before a colossal demon delivers the final blow.', ult: 1, lvl: 6, cost: 100,
    poses: ['eyecover', 'cast'], st: 12, act: 10, rec: 32, dmg: 20, hs: 40, bs: 20, kb: 2, hb: { x: 20, y: -200, w: 340, h: 200 }, invuln: [0, 14], str: 3,
    onHit(F, D) { BT.startCine(F, D, CINE.yamika, { zoom: 1.2 }); return true; },
  },
});
YAMIKA.moves.counter.__ai = { reach: 120, kind: 'buff', anti: false, st: 3, low: false, over: false };
YAMIKA.moves.sp2d.__ai = { reach: 200, kind: 'buff', anti: false, st: 20, low: false, over: false };
function yamDecoy(F) {   // Awakened Shadow Step: the smoke she leaves behind explodes
  BT.spawn({ owner: F, kind: 'shadeBurst', x: F.x + F.facing * 230, y: F.y - 90, vx: 0.001, w: 110, h: 150, delay: 10, life: 10, dmg: 34, hs: 20, bs: 10, kb: 5, str: 2, clash: 0, color: YV, srcKey: 'counter', projOnHit: 1, onHit(A, D) { yamMagic(A, D, 'decoy', 4); } });
}
(() => {
  const M = YAMIKA.moves;
  Object.assign(M.L, { name: 'Dramatic Slap' });
  Object.assign(M.M, { name: 'Twirl Kick' });
  Object.assign(M.H, { name: 'DARK PALM', poses: ['cast_w', { base: 'cast', pw: 1 }], hb: { x: 15, y: -178, w: 96, h: 56 }, onHit(A, D) { FX.burst(D.x, D.y - 110, YV, 8, 5); } });
  Object.assign(M.cH, { name: 'Clumsy Sweep' });
  Object.assign(M.LH, { name: 'Ascension Gesture', poses: ['grasp_w', 'summon'] });
  Object.assign(M.FF, { name: 'Overdramatic Dash' });
  Object.assign(M.jH, { name: 'Falling Judgement', poses: ['jheavy_w', { base: 'jump', fa1: 1.3, fa2: 1.1, pw: 1 }] });
  addFollowup(YAMIKA, 'counter', { btn: 'sp1', move: 'stepIn', any: true, cond: F => F.mf >= 4 && F.mf <= 12 });
})();
YAMIKA.extraList = [['stepIn', 'Shadow Step → Phantom Return', '↓←SP1 → SP1']];
YAMIKA.combos = [
  { name: 'Forbidden Combo', notation: 'M → H (Dark Palm) → SP1 (Forbidden Dark Flame)', seq: ['M', 'H', 'sp1'] },
  { name: "It's a Trap!", notation: '↓→SP1 (Mystic Seal, on top of them) → SP1 (Dark Flame) while they fly', seq: ['sp1f', 'sp1'] },
  { name: 'Captured!', notation: "↓→SP2 (Tyrant's Grasp) → H → SP1 (Dark Flame)", seq: ['sp2f', 'H', 'sp1'] },
  { name: 'Come Forth, Darkness', notation: 'SP2 (Darkness Summoning, close) → L → M → the beast launches them', seq: ['sp2', 'L', 'M'] },
  { name: 'The Unsealed Wicked Eye', notation: 'M → H → SP1+SP2 (Ultimate)', seq: ['M', 'H', 'ult'], meter: 1 },
];
YAMIKA.applyTrial = (A, tr) => { if (!tr) return; if (tr.meter) A.meter = 100; if (tr.authority || tr.chu) { A.chu = tr.chu || tr.authority; A.chuT = A.T + 9999; } };

// ---------------------------------- cinematic ----------------------------------
CINE.yamika = function (A, D, f, c) {
  const dir = A.facing;
  if (f === 1) {
    D.x = clamp(D.x, 160, STAGE_W - 160); D.y = GROUND; D.forcePose = 'hit'; A.forcePose = 'eyecover'; c.zoom = 1.2; c.camX = (A.x + D.x) / 2;
    FX.darkTarget = 0.92; Sound.play('heart'); c.fg = YAMIKA.cineFg; c.dir = dir; c.patch = 0; c.surge = 0; c.demons = []; c.big = 0;
  }
  if (f === 18) Sound.play('heart');
  if (f === 44) {   // the seal is broken
    A.unsealT = 9999; Sound.play('impactBig'); Sound.play('energy'); FX.flashScreen('#e0a0ff', 10, 0.8); FX.shakeIt(10);
    FX.ring(A.x, A.y - 150, YV, 10, 260, 20, 6); FX.ring(A.x, A.y - 150, YGOLD, 10, 140, 16, 3);
  }
  if (f === 70) { A.forcePose = 'summon'; Sound.play('charge'); }
  if (f >= 70 && f < 96) { c.surge = (f - 70) / 26; if (f % 4 === 0) FX.ring(A.x, A.y - 120, pick([YV, '#e8a8ff']), 30, 900, 20, 4, 0.5); FX.shakeIt(4); }
  if (f === 82) {   // portals open behind her and the demons emerge
    c.zoom = 1.0; c.camX = clamp((A.x + D.x) / 2 - dir * 40, 520, STAGE_W - 520);
    for (let i = 0; i < 4; i++) c.demons.push({ v: i, px: A.x - dir * (120 + (i % 2) * 80), py: GROUND - 200 - i * 40, x: 0, y: 0, a: 0 });
    Sound.play('roar');
  }
  if (f >= 88 && f <= 112 && D.forcePose) { D.y = GROUND - 40 * Math.min(1, (f - 88) / 20); D.forcePose = 'airhit'; }
  for (const d of c.demons) {   // emerge → surround → strike in turn
    const t0 = 88 + d.v * 4, slot = [[-1, -150], [1, -170], [-1, -40], [1, -60]][d.v], tx = D.x + slot[0] * 110, ty = GROUND + slot[1];
    if (f < t0) { d.x = d.px; d.y = d.py; d.a = Math.min(1, (f - 82) / 6); }
    else if (f < 112) { const k = easeOut((f - t0) / (112 - t0)); d.x = lerp(d.px, tx, k); d.y = lerp(d.py, ty, k); d.a = 1; }
    const hitF = 116 + d.v * 9;
    if (f >= hitF - 4 && f <= hitF) { const k = (f - hitF + 4) / 4; d.x = lerp(tx, D.x - slot[0] * 10, k); d.y = lerp(ty, GROUND - 100, k); }
    if (f === hitF) { BT.scriptHit(A, D, 18, { str: 3, sfx: 'slash' }); D.forcePose = d.v % 2 ? 'airhit' : 'hit2'; D.x += slot[0] * -6; FX.ring(D.x, GROUND - 100, YV, 10, 110, 12, 5); FX.shakeIt(9); }
    if (f > hitF && f <= hitF + 6) { const k = (f - hitF) / 6; d.x = lerp(D.x, tx, k); d.y = lerp(GROUND - 100, ty, k); }
  }
  if (f === 150) { BT.scriptHit(A, D, 24, { str: 3, sfx: 'slash' }); FX.ring(D.x, GROUND - 100, YV, 10, 160, 14, 6); }   // all four at once
  if (f === 152) { c.big = 0.001; Sound.play('roar'); Sound.play('charge'); c.zoom = 0.92; FX.shakeIt(6); }
  if (c.big > 0 && f < 184) c.big = Math.min(1, (f - 151) / 22);
  if (f === 184) {   // the final strike
    c.strike = 1; A.forcePose = 'cast'; D.y = GROUND; D.forcePose = 'down';
    BT.scriptHit(A, D, 142, { str: 4 });
    FX.impactFrame(5); FX.shakeIt(30); Sound.play('explosion'); Sound.play('impactBig'); FX.flashScreen('#c060ff', 16, 0.75);
    FX.ring(D.x, GROUND - 60, YV, 20, 420, 26, 10, 0.4); FX.ring(D.x, GROUND - 60, '#ffffff', 10, 260, 18, 6, 0.4); FX.ring(D.x, GROUND, YGOLD, 10, 330, 22, 4, 0.2);
    for (let i = 0; i < 50; i++) FX.p({ type: 'ember', x: D.x + rand(-40, 40), y: GROUND - rand(10, 160), vx: rand(-10, 10), vy: -rand(2, 11), grav: 0.25, life: 60, size: rand(2, 5), color: pick([YV, '#e8a8ff', '#5a1aa0', YGOLD]) });
    yamPuff(D.x, GROUND, 18);
    FX.wtext(D.x, GROUND - 270, '邪眼解放!!', { size: 84, font: FX_JP(), color: '#fff', stroke: '#5a10a0', life: 60, vy: -0.3 });
    c.demons = [];
  }
  if (f > 184) c.big = Math.max(0, c.big - 0.06);
  if (f === 205) { A.forcePose = 'victory'; FX.wtext(A.x, A.y - 215, 'Evil… has been sealed.', { size: 24, color: '#f0e0ff', stroke: YDARK, life: 50 }); }
  if (f === 222) { yamChu(A, 20); BT.release(D, dir * 3, -6); FX.darkTarget = 0; A.unsealT = 80; return true; }
};
// screen-space overlay: the eyepatch cut-in, the energy surge, the demons and the colossal demon
YAMIKA.cineFg = (g, c) => {
  const f = c.f, A = c.A, D = c.D, dir = c.dir;
  // --- world-space layer (demons, portals, colossal demon) ---
  if (c.demons.length || c.big > 0) {
    g.save(); BT.cam.apply(g);
    if (c.demons.length && f < 150) for (let i = 0; i < 4; i++) yamPortal(g, A.x - dir * (120 + (i % 2) * 80), GROUND - 200 - i * 40, 46, Math.min(1, (f - 82) / 8) * (f < 112 ? 1 : Math.max(0, 1 - (f - 112) / 30)), f + i * 20);
    for (const d of c.demons) yamDemon(g, d.x, d.y, 0.95, f, d.x < D.x ? 1 : -1, d.a, d.v);
    if (c.big > 0) {
      const k = easeOut(c.big), bx = A.x - dir * 60, by = GROUND - 230 - 180 * k, lunge = f > 176 ? Math.min(1, (f - 176) / 8) : 0;
      yamPortal(g, bx, GROUND - 200, 230 * k, 0.9 * k, f);
      yamDemon(g, lerp(bx, D.x - dir * 40, lunge), lerp(by, GROUND - 130, lunge), 3.6 * k, f, dir, Math.min(1, k * 1.4), 0);
    }
    g.restore();
  }
  // --- energy surge: screen distortion bands + vignette ---
  if (c.surge > 0 && f < 130) {
    const k = f < 96 ? c.surge : Math.max(0, 1 - (f - 96) / 34);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) { const y = ((f * 9 + i * 97) % H), off = Math.sin(f * 0.6 + i) * 30 * k; g.fillStyle = `rgba(176,76,255,${0.08 * k})`; g.fillRect(off, y, W, 8 + (i % 3) * 6); }
    g.globalCompositeOperation = 'source-over'; const vg = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(30,0,50,${0.6 * k})`);
    g.fillStyle = vg; g.fillRect(0, 0, W, H); g.restore();
  }
  // --- the eyepatch cut-in (the centrepiece) ---
  if (f < 82) {
    const slide = easeOut(Math.min(1, f / 10)), out = f > 72 ? (f - 72) / 10 : 0, y0 = H * 0.22, h = 250 * (1 - out);
    if (h <= 2) return;
    const x0 = (1 - slide) * -W;
    g.save(); g.translate(x0, 0);
    g.beginPath(); g.moveTo(0, y0 + 20); g.lineTo(W, y0); g.lineTo(W, y0 + h); g.lineTo(0, y0 + h + 20); g.closePath(); g.save(); g.clip();
    const bg = g.createLinearGradient(0, y0, 0, y0 + h); bg.addColorStop(0, '#12041e'); bg.addColorStop(0.5, f >= 44 ? '#3a0a60' : '#1e0834'); bg.addColorStop(1, '#0a0212'); g.fillStyle = bg; g.fillRect(0, y0 - 20, W, h + 60);
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(176,76,255,0.25)'; g.lineWidth = 3;
    for (let i = 0; i < 26; i++) { const yy = y0 + ((i * 37 + f * 23) % (h + 40)) - 20; g.beginPath(); g.moveTo(0, yy); g.lineTo(W, yy + 10); g.stroke(); }
    if (f >= 44) {   // god rays from the eye
      const ex = W * 0.58, ey = y0 + h * 0.52, k = Math.min(1, (f - 44) / 10);
      for (let i = 0; i < 16; i++) { const a = i * TAU / 16 + f * 0.02; g.fillStyle = `rgba(220,150,255,${0.12 * k})`; g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex + Math.cos(a) * 900, ey + Math.sin(a) * 900); g.lineTo(ex + Math.cos(a + 0.08) * 900, ey + Math.sin(a + 0.08) * 900); g.closePath(); g.fill(); }
    }
    g.globalCompositeOperation = 'source-over';
    // her face, huge: drawn with the real head renderer so it is the same character
    const sc = 7.2, r = YAMIKA.dims.headR, hx = W * 0.58 - 0.5 * r * sc, hy = y0 + h * 0.52 - 0.25 * r * sc + (f < 44 ? Math.sin(f * 1.7) * (f > 34 ? 2 : 0) : 0);
    const pal = { ...YAMIKA.colors, chuLv: f >= 44 ? 2 : 0, unseal: f >= 44 };
    g.save(); g.translate(hx, hy); g.scale(sc, sc); drawHead(g, YAMIKA, pal, { mono: null, ol: 0.5 }, { expr: f >= 44 ? 'shout' : 'normal', glow: false, T: f, cut: 1 }); g.restore();
    // the hand rising to the eyepatch, gripping, tearing it away
    const px = hx + 0.95 * r * sc, py = hy + 0.22 * r * sc;
    if (f >= 12 && f < 44) {
      const k = easeOut(Math.min(1, (f - 12) / 18)), hxp = px + 40, hyp = lerp(y0 + h + 120, py + 30, k) + (f > 32 ? rand(-2, 2) : 0);
      yamCutHand(g, hxp, hyp, sc * 0.9);
    }
    if (f >= 44) {   // the patch flies away
      const t = f - 44, fx2 = px + 60 + t * 26, fy2 = py - t * 9 + t * t * 0.6;
      g.save(); g.translate(fx2, fy2); g.rotate(t * 0.4); g.fillStyle = '#0c0a14'; g.strokeStyle = '#000'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, 0.19 * r * sc, 0.27 * r * sc, 0, 0, TAU); g.fill(); g.stroke();
      g.strokeStyle = '#0c0a14'; g.lineWidth = 8; g.beginPath(); g.moveTo(-10, -0.27 * r * sc); g.quadraticCurveTo(-60, -90, -140, -60 + Math.sin(t) * 20); g.stroke(); g.restore();
      yamCutHand(g, px + 70 + t * 18, py + 20 - t * 4, sc * 0.9);
    }
    g.restore();
    g.strokeStyle = f >= 44 ? YGOLD : YV; g.lineWidth = 4; g.beginPath(); g.moveTo(0, y0 + 20); g.lineTo(W, y0); g.moveTo(0, y0 + h + 20); g.lineTo(W, y0 + h); g.stroke();
    // lines
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (f >= 14 && f < 44) { g.font = `italic 900 30px ${FONT_T}`; strokeText(g, 'O seal upon my eye…', W * 0.24, y0 + 60, '#e8d8ff', '#1a0830', 6); }
    if (f >= 28 && f < 44) { g.font = `italic 900 30px ${FONT_T}`; strokeText(g, '…I command you to BREAK!', W * 0.26, y0 + h - 50, '#ffffff', '#1a0830', 6); }
    if (f >= 44) { g.font = `900 64px ${FX_JP()}`; strokeText(g, '封印、解除——!!', W * 0.24, y0 + h * 0.4, '#fff', '#5a10a0', 8); g.font = `italic 900 26px ${FONT_T}`; strokeText(g, 'THE SEAL IS BROKEN!', W * 0.24, y0 + h * 0.4 + 58, YGOLD, '#1a0830', 6); }
    g.textBaseline = 'alphabetic';
    g.restore();
  }
};
function yamCutHand(g, x, y, s) {   // a big chibi hand for the cut-in (fingers curled to grip)
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = YAMIKA.colors.top; g.strokeStyle = OUTLINE; g.lineWidth = 1.2; g.beginPath(); g.rect(-9, 10, 18, 40); g.fill(); g.stroke();
  g.fillStyle = YAMIKA.colors.cuff; g.beginPath(); g.rect(-10, 8, 20, 6); g.fill(); g.stroke();
  g.fillStyle = YAMIKA.colors.skin; g.beginPath(); g.ellipse(0, 0, 10, 11, 0, 0, TAU); g.fill(); g.stroke();
  for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(-6 + i * 4, -10, 2.4, 4.5, 0.1, 0, TAU); g.fill(); g.stroke(); }
  g.restore();
}

// ---------------------------------- HUD + how-to ----------------------------------
YAMIKA.drawHand = (g, F, side, t) => {
  const lv = yamLvl(F), wake = F.wakeT > 0, field = yamInField(F);
  xpPanel(g, F, side, t, {
    col: wake ? '#d870ff' : lv ? YV : '#8a6ad0', col2: YGOLD, icon: '邪', flash: wake,
    title: wake ? 'WICKED AWAKENING' : lv ? 'CHUUNI ENERGY · RISING' : 'CHUUNI ENERGY',
    sub: wake ? '邪眼覚醒 · 2 FLAMES · INSTANT SEALS · 3 BITES · DECOY STEP' : field ? '妄想領域 · INSIDE REALITY DISTORTION · ENERGY ×1.5' : '中二力 · spells, traps & spell chains fill it',
    k: (F.chu || 0) / 100, label: wake ? `${(F.wakeT / 60).toFixed(1)}s` : `${Math.floor(F.chu || 0)}%`, marks: [0.5],
    badges: [['sp1', 'S1|FLAME'], ['sp1f', '↓→S1|SEAL'], ['counter', '↓←S1|STEP'], ['sp2', 'S2|SUMMON'], ['sp2f', '↓→S2|GRASP'], ['sp2d', '↓↓S2|DISTORT']],
  });
};
YAMIKA.howTo = {
  title: 'WICKED EYE',
  draw(g) {
    xpHowTo(g, 'YAMIKA — THE WICKED EYE', '#c080ff', [
      ['CHUUNI ENERGY', 'Fills when spells hit (+6), traps trigger (+12) and when you chain DIFFERENT spells (+6). 50%+ = bigger flames.'],
      ['AWAKENING', 'Full gauge = 7 s: glowing eye, two Dark Flames, instant seals (2 at once), 3-bite beast, Shadow Step leaves an exploding decoy.'],
      ['SP1', 'Forbidden Dark Flame — mid-range fireball, small explosion.'],
      ['↓→ SP1', 'Mystic Seal — trap in front of her, arms after a short delay, explodes and pops them up. Jump it or block.'],
      ['↓← SP1', 'Shadow Step — vanish and reappear ~230 px back. SP1 during the smoke = Phantom Return behind the foe.'],
      ['SP2', 'Darkness Summoning — a shadow beast chases and bites twice (2nd launches) while you reposition.'],
      ['↓→ SP2', "Tyrant's Grasp — hands burst up where they stand after a warning; holds them ~0.7 s for a follow-up."],
      ['↓↓ SP2', 'Reality Distortion — 7 s field: homing flames, instant seals, longer steps, slowed enemy projectiles, energy ×1.5.'],
    ], 'Set a seal, summon the beast, grab them while they deal with it — then chain different spells for Chuuni Energy. With everything on cooldown she is fragile: Shadow Step out. Ultimate (SP1+SP2): THE UNSEALED WICKED EYE.');
  },
};

CHARS.push(YAMIKA);
finalizeMoves(YAMIKA);
