// ============================ TOKINE — THE NIGHTMARE CLOCK ============================
// Technical / time manipulation / clone pressure. An original design: an elegant, playful gothic girl in a black and
// crimson dress with a tiny clock top hat, heterochromatic eyes (crimson + gold ring) and two antique flintlock pistols.
// Systems: TIME (special/clone/gun hits, interrupts, rewinds) spent on clones and stronger hours → TIME SOVEREIGNTY
//          (auto at 100) · temporal CLONES as real hit entities (lifetime, cap 4, can be hit and shattered) ·
//          slow / very short time-stop statuses · positional rewind · Ult ENDLESS NIGHTMARE (giant clock, clone army).
const TK = '#d01a34', TK2 = '#6a0a18', TKG = '#ffcf5a', TKD = '#0e060a', TKP = '#ffd8de';
const TOK_SOV = 420, TOK_CLONES = 4;

// ---------------------------------- art ----------------------------------
function tokGoldEye(g, x, y, w, h, t, glow) {   // the gold eye with a thin ring around the pupil
  g.save();
  g.fillStyle = '#fffdf4'; g.beginPath(); g.ellipse(x, y, w, h, 0, 0, TAU); g.fill();
  const gr = g.createLinearGradient(0, y - h, 0, y + h); gr.addColorStop(0, '#6a4a08'); gr.addColorStop(0.45, TKG); gr.addColorStop(1, '#fff4c8');
  if (glow && FX.hq) { g.shadowColor = TKG; g.shadowBlur = 10; }
  g.fillStyle = gr; g.beginPath(); g.ellipse(x + w * 0.06, y + h * 0.06, w * 0.86, h * 0.9, 0, 0, TAU); g.fill(); g.shadowBlur = 0;
  g.strokeStyle = '#3a2004'; g.lineWidth = Math.max(0.8, w * 0.12); g.beginPath(); g.ellipse(x + w * 0.08, y + h * 0.05, w * 0.56, h * 0.6, 0, 0, TAU); g.stroke();
  g.fillStyle = '#1a0c02'; g.beginPath(); g.ellipse(x + w * 0.1, y + h * 0.04, w * 0.2, h * 0.26, 0, 0, TAU); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x - w * 0.32, y - h * 0.38, w * 0.3, h * 0.2, -0.3, 0, TAU); g.fill();
  g.strokeStyle = OUTLINE; g.lineCap = 'round'; g.lineWidth = Math.max(1.6, h * 0.24);
  g.beginPath(); g.moveTo(x - w * 1.15, y - h * 0.62); g.quadraticCurveTo(x, y - h * 1.32, x + w * 1.08, y - h * 0.72); g.stroke();
  g.restore();
}
function tokFace(g, r, c, o) {
  const e = c.ex || o.expr || 'normal', ex = 0.5 * r, ey = 0.26 * r, fx = 0.94 * r;
  if (e === 'hurt' || e === 'ko') { chibiFace(g, r, c, { ...o, expr: e }); return; }
  g.save(); g.lineCap = 'round';
  g.fillStyle = 'rgba(255,110,150,0.26)'; g.beginPath(); g.ellipse(0.34 * r, 0.56 * r, 0.14 * r, 0.06 * r, 0, 0, TAU); g.fill();
  if (e === 'closed') {
    g.strokeStyle = OUTLINE; g.lineWidth = 0.07 * r; g.beginPath(); g.moveTo(ex - 0.2 * r, ey + 0.04 * r); g.quadraticCurveTo(ex, ey + 0.14 * r, ex + 0.22 * r, ey + 0.02 * r); g.stroke();
  } else {
    chibiEye(g, ex, ey, 0.23 * r, 0.36 * r, c, { glow: o.glow || c.sov }, false);   // near eye: crimson
    tokGoldEye(g, fx, ey - 0.01 * r, 0.08 * r, 0.3 * r, o.T || 0, o.glow || c.sov); // far eye: gold
    if (e === 'smile') { g.fillStyle = c.skin; g.beginPath(); g.ellipse(ex, ey + 0.36 * r, 0.3 * r, 0.16 * r, 0, Math.PI, TAU); g.fill(); }   // smiling eyes
    g.strokeStyle = c.brow; g.lineWidth = 0.04 * r; g.beginPath(); g.moveTo(ex - 0.2 * r, ey - 0.48 * r); g.quadraticCurveTo(ex, ey - 0.56 * r, ex + 0.22 * r, ey - 0.5 * r); g.stroke();
  }
  const mx = 0.72 * r, my = 0.72 * r; g.strokeStyle = OUTLINE; g.lineWidth = 0.045 * r;
  if (e === 'shout') { g.fillStyle = '#5a1020'; g.beginPath(); g.ellipse(mx, my, 0.07 * r, 0.08 * r, 0, 0, TAU); g.fill(); g.stroke(); }
  else if (e === 'grin' || e === 'smile') { g.beginPath(); g.moveTo(mx - 0.1 * r, my - 0.03 * r); g.quadraticCurveTo(mx, my + 0.08 * r, mx + 0.1 * r, my - 0.04 * r); g.stroke(); g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(mx + 0.03 * r, my); g.lineTo(mx + 0.05 * r, my + 0.05 * r); g.lineTo(mx + 0.07 * r, my - 0.01 * r); g.fill(); }   // a playful smile with one tiny fang
  else { g.beginPath(); g.moveTo(mx - 0.05 * r, my); g.quadraticCurveTo(mx + 0.01 * r, my + 0.04 * r, mx + 0.06 * r, my - 0.02 * r); g.stroke(); }
  g.restore();
}
function tokGun(g, P, ang, big, c, R) {   // antique flintlock: dark barrel with gold bands, crimson-wood grip, hammer
  g.save(); g.translate(P[0], P[1]); g.rotate(ang);
  const L = big ? 44 : 26, w = big ? 4.2 : 3.2;
  poly(g, [[-4, -w], [L, -w * 0.8], [L, w * 0.8], [-4, w]], R.mono || '#2a2228', R, 1.8);
  poly(g, [[-2, -w], [-14, w + 9], [-7, w + 12], [4, w]], R.mono || c.gunWood, R, 1.8);
  if (!R.mono) {
    g.fillStyle = TKG; for (const t of big ? [0.25, 0.6, 0.95] : [0.5, 0.95]) g.fillRect(L * t - 1.5, -w * 0.9, 3, w * 1.8);
    g.fillStyle = '#5a4a40'; g.fillRect(-3, -w - 4, 4, 4);   // hammer
    g.strokeStyle = TKG; g.lineWidth = 1; g.beginPath(); g.arc(1, w + 3, 3.4, 0, Math.PI); g.stroke();   // trigger guard
  }
  g.restore();
}
function tokHat(g, r, c, R, o) {   // a tiny tilted top hat with a crimson band and a little clock face
  g.save(); g.translate(0.2 * r, -1.02 * r); g.rotate(0.22);
  poly(g, [[-0.62 * r, 0.06 * r], [0.62 * r, 0.06 * r], [0.64 * r, 0.16 * r], [-0.64 * r, 0.16 * r]], R.mono || c.hat, R, 2);
  poly(g, [[-0.36 * r, 0.08 * r], [-0.32 * r, -0.56 * r], [0.32 * r, -0.56 * r], [0.36 * r, 0.08 * r]], R.mono || c.hat, R, 2);
  if (!R.mono) {
    g.fillStyle = c.ribbon; g.fillRect(-0.35 * r, -0.12 * r, 0.7 * r, 0.14 * r);
    g.fillStyle = '#f6eedc'; g.strokeStyle = TKG; g.lineWidth = 1.2; g.beginPath(); g.arc(0.06 * r, -0.32 * r, 0.13 * r, 0, TAU); g.fill(); g.stroke();
    const t = (o.T || 0) * 0.02; g.strokeStyle = '#2a1018'; g.lineWidth = 1; g.beginPath(); g.moveTo(0.06 * r, -0.32 * r); g.lineTo(0.06 * r + Math.sin(t) * 0.09 * r, -0.32 * r - Math.cos(t) * 0.09 * r); g.moveTo(0.06 * r, -0.32 * r); g.lineTo(0.06 * r + 0.06 * r, -0.32 * r); g.stroke();
    // ribbon bow at the side
    g.fillStyle = c.ribbon; g.strokeStyle = OUTLINE; g.lineWidth = 1;
    g.beginPath(); g.moveTo(-0.34 * r, -0.05 * r); g.lineTo(-0.6 * r, -0.24 * r); g.lineTo(-0.58 * r, 0.08 * r); g.closePath(); g.fill(); g.stroke();
  }
  g.restore();
}
const TOKINE = {
  id: 'tokine', name: 'TOKINE', jp: 'トキネ', title: 'The Nightmare Clock', titleJp: '刻の悪夢',
  style: 'TIME / CLONES', desc: 'An elegant girl who treats the fight like a game only she understands. She hastens and slows time, rewinds her own steps and fills the stage with copies of herself.',
  stats: { power: 3, speed: 3, range: 4, defense: 2 },
  scale: 1.0, health: 990, walk: 4.0, backWalk: 3.8, jumpV: -17, jumpX: 4.5, dashV: 11.5, backdashV: 10.5, backdashInv: 10, juggleMax: 6,
  voicePitch: 1.25, voiceRate: 0.9,
  colors: {
    skin: '#fbe8e2', hair: '#1a0f16', hair2: '#2c1622', top: '#16101a', leg: '#fbe8e2', boot: '#140c12', foot: '#140c12', uarm: '#16101a', farm: '#16101a', hand: '#fbe8e2', cuff: '#f4eee8', belt: TK,
    eye: '#d8203a', eye2: '#2a0008', accent: TK, brow: '#1a0f16', warm: '#1a1018', sole: '#2a0a12', pad: TK, collar: '#f4eee8',
    hat: '#120a10', ribbon: TK, skirt: '#16101a', skirt2: TK, lace: '#f4eee8', gunWood: '#5a1a22', sov: false, ex: null,
  },
  afterColors: [TK, '#ffcf5a', '#2a0812'],
  stance: { t: -0.04, hd: 0.06, fa1: 0.55, fa2: 1.45, ba1: -0.25, ba2: 0.35, fl1: 0.16, fl2: 0.04, bl1: -0.06, bl2: -0.1 },
  poses: {
    adjust: { t: -0.06, hd: 0.2, fa1: 0.9, fa2: 2.4, ba1: 0.6, ba2: 1.6 },
    glance: { t: -0.1, hd: -0.32, fa1: 0.55, fa2: 1.45, ba1: -0.25, ba2: 0.35 },
    aim: { t: 0.02, hd: 0.02, fa1: 1.55, fa2: 1.58, ba1: -0.3, ba2: 0.3, fl1: 0.32, fl2: 0.06, bl1: -0.24, bl2: -0.1 },
    aim2: { t: 0.04, hd: 0.0, fa1: 1.5, fa2: 1.56, ba1: 1.4, ba2: 1.52, fl1: 0.34, fl2: 0.06, bl1: -0.26, bl2: -0.1 },
    aim_up: { t: -0.12, hd: -0.2, fa1: 2.5, fa2: 2.7, ba1: -0.3, ba2: 0.3, fl1: 0.2, fl2: 0.04, bl1: -0.2, bl2: -0.06 },
    aim_self: { t: -0.05, hd: 0.15, fa1: 2.2, fa2: 3.9, ba1: -0.4, ba2: 0.2 },
    glide: { t: 0.34, hd: -0.1, fa1: -0.3, fa2: 0.2, ba1: -0.8, ba2: -0.5, fl1: 0.5, fl2: 0.2, bl1: -0.5, bl2: -0.6 },
    summon: { t: -0.18, hd: -0.18, fa1: 2.7, fa2: 2.95, ba1: -1.4, ba2: -1.0, fl1: 0.2, fl2: 0.05, bl1: -0.2, bl2: -0.06 },
    kick: { t: -0.3, hd: 0.15, fa1: 0.9, fa2: 1.5, ba1: -0.6, ba2: 0.2, fl1: 1.62, fl2: 1.62, bl1: -0.1, bl2: -0.05 },
    rewind: { t: -0.2, hd: 0.25, fa1: 2.0, fa2: 3.3, ba1: -1.2, ba2: -0.6 },
    curtsy: { t: 0.24, hd: 0.3, fa1: -0.4, fa2: 0.3, ba1: -0.5, ba2: 0.2, fl1: -0.2, fl2: 0.2, bl1: 0.2, bl2: -0.6 },
    whip_w: { t: -0.16, fa1: 2.2, fa2: 3.2, ba1: -0.3, ba2: 0.3 },
    whip: { t: 0.34, hd: 0.05, fa1: 1.3, fa2: 0.8, ba1: -0.4, ba2: 0.3, fl1: 0.5, fl2: 0.15, bl1: -0.4, bl2: -0.2 },
    victory: { t: -0.06, hd: 0.25, fa1: 2.2, fa2: 3.9, ba1: 0.9, ba2: 1.9, fl1: 0.1, fl2: 0.04, bl1: -0.08, bl2: -0.1 },
    defeat: { t: 0.42, hd: 0.15, fa1: 0.6, fa2: 0.9, ba1: 0.3, ba2: 0.1, fl1: 1.35, fl2: 0.0, bl1: 0.25, bl2: -1.45 },
    intro: { t: 0.24, hd: 0.3, fa1: -0.4, fa2: 0.3, ba1: -0.5, ba2: 0.2, fl1: -0.2, fl2: 0.2, bl1: 0.2, bl2: -0.6 },
  },
  intro: 'Shall we play a little game? Don\'t worry — I already know how it ends.',
  wins: ['Ufufu… your time was simply too short.', 'Thank you for the lovely dance. I\'ll keep this moment.', 'Tick, tock. The game is over.'],
  ropes: [
    { id: 'hairL', at: (sk, r) => headPt(sk, -r * 0.9, r * 0.35), n: 7, seg: 11, w0: 16, w1: 7, color: 'hair', grav: 0.5, wind: 0.4 },
    { id: 'hairS', at: (sk, r) => headPt(sk, -r * 0.35, r * 0.7), n: 5, seg: 10, w0: 9, w1: 4, color: 'hair2', grav: 0.55, wind: 0.35 },
  ],
  hairBack(g, r, c, R, o) {
    const sw = Math.sin((o && o.T || 0) * 0.05) * 0.04;
    polyR(g, r, [[0.7, -0.84], [0.06, -1.2], [-0.72, -1.08], [-1.22, -0.5], [-1.3, 0.5], [-1.24 + sw, 1.6], [-0.9 + sw, 2.1], [-0.6, 1.4], [-0.4, 0.8], [-0.2, 0.5]], c.hair, R);
  },
  hairFront(g, r, c, R, o) {
    skullHair(g, r, c, R);
    polyR(g, r, [[-0.36, -0.98], [0.32, -1.06], [0.98, -0.74], [1.14, -0.16], [0.98, -0.06], [0.86, -0.24], [0.72, -0.08], [0.6, -0.26], [0.42, -0.06], [0.28, -0.3], [0.1, -0.44]], c.hair, R);   // soft straight fringe
    polyR(g, r, [[-0.16, -0.36], [0.12, -0.2], [0.16, 0.7], [0.08, 1.3], [-0.12, 1.4], [-0.18, 0.7], [-0.32, 0.0]], c.hair, R);   // long side lock
    if (!R.mono) shine(g, r, [[-0.12, -0.86], [0.46, -0.88]], R);
    if (c.alt) { polyR(g, r, [[0.5, -0.9], [0.98, -0.72], [1.16, -0.2], [1.14, 0.42], [1.0, 0.56], [0.86, 0.2], [0.7, -0.3]], c.hair, R); return; }   // LV 10 look: no hat, the fringe hides the gold eye
    tokHat(g, r, c, R, o);
  },
  neckWear(g, sk, p, c, R) {   // white frilled collar with a crimson ribbon and a small gold clasp
    const n = sk.neck;
    if (c.alt) {   // LV 10 look: black sailor collar with a white stripe and a red ribbon
      poly(g, [[n[0] - 17, n[1] + 13], [n[0] - 12, n[1] - 5], [n[0] + 10, n[1] - 8], [n[0] + 14, n[1] + 10], [n[0] + 2, n[1] + 4]], c.collar, R, 3);
      if (R.mono) return;
      g.strokeStyle = '#e8e8f0'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(n[0] - 15, n[1] + 10); g.lineTo(n[0] - 11, n[1] - 3); g.stroke();
      g.fillStyle = c.ribbon; g.strokeStyle = OUTLINE; g.lineWidth = 1;
      g.beginPath(); g.moveTo(n[0] + 3, n[1] + 6); g.lineTo(n[0] - 6, n[1] + 2); g.lineTo(n[0] - 5, n[1] + 11); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(n[0] + 3, n[1] + 6); g.lineTo(n[0] + 11, n[1] + 2); g.lineTo(n[0] + 10, n[1] + 11); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(n[0] + 2, n[1] + 7); g.lineTo(n[0] - 1, n[1] + 18); g.lineTo(n[0] + 7, n[1] + 19); g.lineTo(n[0] + 5, n[1] + 7); g.closePath(); g.fill(); g.stroke();
      return;
    }
    for (let i = -2; i <= 2; i++) poly(g, [[n[0] + i * 5 - 4, n[1] + 4], [n[0] + i * 5, n[1] - 5], [n[0] + i * 5 + 4, n[1] + 4], [n[0] + i * 5, n[1] + 8]], c.lace, R, 1.6);
    if (R.mono) return;
    g.fillStyle = c.ribbon; g.strokeStyle = OUTLINE; g.lineWidth = 1;
    g.beginPath(); g.moveTo(n[0] + 2, n[1] + 6); g.lineTo(n[0] - 6, n[1] + 1); g.lineTo(n[0] - 5, n[1] + 11); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(n[0] + 2, n[1] + 6); g.lineTo(n[0] + 10, n[1] + 1); g.lineTo(n[0] + 9, n[1] + 11); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = TKG; g.beginPath(); g.arc(n[0] + 2, n[1] + 6, 2.2, 0, TAU); g.fill();
  },
  torsoDetail(g, L, bw, c) {   // black bodice with crimson cross-lacing and a gold chain
    if (c.alt) { g.fillStyle = '#4a4a58'; for (const y of [0.7, 0.45, 0.2]) { g.beginPath(); g.arc(6 * bw, -L * y, 1.4, 0, TAU); g.fill(); } return; }
    g.fillStyle = c.ribbon; g.fillRect(-2 * bw, -L + 6, 6 * bw, L - 8);
    g.strokeStyle = c.lace; g.lineWidth = 1;
    for (let i = 0; i < 4; i++) { const y = -L + 10 + i * (L - 14) / 4; g.beginPath(); g.moveTo(-2 * bw, y); g.lineTo(4 * bw, y + 5); g.moveTo(4 * bw, y); g.lineTo(-2 * bw, y + 5); g.stroke(); }
    g.strokeStyle = TKG; g.lineWidth = 1; g.beginPath(); g.moveTo(-10 * bw, -L * 0.62); g.quadraticCurveTo(-4 * bw, -L * 0.4, 2 * bw, -L * 0.5); g.stroke();
  },
  torsoOver(g, L, bw, c, R) { if (!R.mono && !c.alt) { g.fillStyle = c.ribbon; g.fillRect(-13 * bw, -6, 26 * bw, 4); } },
  drawSkirt(g, sk, p, c, R, o) {   // layered gothic skirt: crimson underlayer, black overskirt, white lace hem, slight asymmetry
    if (c.alt) { plaidSkirt(g, sk, c, R, o); return; }
    const T = (o && o.T) || 0, fl = Math.sin(T * 0.08) * 2.5, h = sk.hip;
    const lay = (w, d, col, off) => poly(g, [[h[0] - 15, h[1] - 9], [h[0] - w + fl, h[1] + d + off], [h[0] - w * 0.4 + fl, h[1] + d + 6 + off], [h[0] + w * 0.3 + fl, h[1] + d + 3 + off], [h[0] + w + fl * 0.6, h[1] + d - 4 + off], [h[0] + 15, h[1] - 9]], R.mono || col, R, 2.6);
    lay(34, 30, c.skirt2, 0);
    lay(30, 22, c.skirt, 0);
    if (R.mono) return;
    g.strokeStyle = c.lace; g.lineWidth = 2.4; g.setLineDash([3, 2]);
    g.beginPath(); g.moveTo(h[0] - 30 + fl, h[1] + 22); g.lineTo(h[0] - 12 + fl, h[1] + 28); g.lineTo(h[0] + 9 + fl, h[1] + 25); g.lineTo(h[0] + 30 + fl * 0.6, h[1] + 18); g.stroke(); g.setLineDash([]);
    g.strokeStyle = 'rgba(208,26,52,0.5)'; g.lineWidth = 1.2; for (const x of [-12, 2, 16]) { g.beginPath(); g.moveTo(h[0] + x * 0.5, h[1] - 6); g.lineTo(h[0] + x + fl, h[1] + 22); g.stroke(); }
  },
  weaponBack(g, sk, p, c, R) { const a = Math.atan2(sk.bh[1] - sk.be[1], sk.bh[0] - sk.be[0]); tokGun(g, sk.bh, a, false, c, R); },
  weaponFront(g, sk, p, c, R) { const a = Math.atan2(sk.fh[1] - sk.fe[1], sk.fh[0] - sk.fe[0]); tokGun(g, sk.fh, a, true, c, R); },
};
makeChibi(TOKINE, { build: { arm: 0.95, leg: 0.96, torso: 0.98 }, colors: {} });
TOKINE.faceFn = tokFace;
// LV 10 colour (AFTER SCHOOL): her school-uniform look — black sailor uniform, red ribbon, no hat, one eye hidden
const TOK_ALT = { ...TOKINE.colors, alt: true, top: '#1c1c26', uarm: '#1c1c26', farm: '#1c1c26', collar: '#1c1c26', ribbon: '#c8102e', hair2: '#1a0f16', warm: '#16121a', plaid: '#1c1c26', plaid2: '#262636', plaidLine: '#c8102e', belt: '#101018' };
TOKINE.varColors = vi => vi === 4 ? TOK_ALT : null;

// ---------------------------------- time ----------------------------------
const TOK_PAL = {};
TOKINE.palette = F => {
  const sov = F.sovT > 0, ex = F.tokEx || null, alt = F.variant === 4, key = (alt ? 'a' : '') + (sov ? 's' : '') + (ex || '');
  return TOK_PAL[key] || (TOK_PAL[key] = { ...(alt ? TOK_ALT : TOKINE.colors), sov, ex, accent: sov ? '#ff2a48' : TK });
};
const TOK_CLONE_PAL = { ...TOKINE.colors, top: '#2a1420', skirt: '#2a1420', hat: '#2a1420', hair: '#2a1622', lace: '#f0d6dc' };
const tokCost = (F, n) => F.sovT > 0 ? Math.ceil(n / 2) : n;
function tokGain(F, n, label) {
  if (F.ko || n <= 0) return;
  if (F.sovT > 0) n *= 0.5;
  F.time = clamp((F.time || 0) + n, 0, 100); F.timeT = F.T;
  if (label) FX.wtext(F.x, F.y - 238 * F.s, label, { size: 18, color: TKP, stroke: TK2, life: 28 });
}
function tokSpend(F, n) { F.time = Math.max(0, (F.time || 0) - tokCost(F, n)); }
function tokSovereignty(F) {
  F.sovT = TOK_SOV; F.time = 100;
  FX.ring(F.x, F.y - 110, TK, 20, 340, 26, 6); FX.ring(F.x, F.y - 110, TKG, 10, 180, 20, 3); FX.flashScreen('#2a0610', 14, 0.5);
  FX.wtext(F.x, F.y - 262, 'TIME SOVEREIGNTY', { size: 36, color: '#ffffff', stroke: TK2, life: 70 });
  FX.wtext(F.x, F.y - 224, '— 時の支配 —', { size: 22, font: FX_JP(), color: TKG, stroke: TKD, life: 70 });
  Sound.play('bell'); Sound.play('gear');
}
// --- clones: real hit entities (each attack is spawned through BT.spawn, so block / dodge / invuln / clash all apply) ---
// c = { x, y (feet), face, t, at (attack frame), kind 'shot'|'kick'|'aim', dmg, life, done, a, pose, gone }
function tokClone(F, o) {
  F.clones = F.clones || [];
  while (F.clones.filter(c => !c.gone).length >= TOK_CLONES) { const old = F.clones.find(c => !c.gone); old.gone = 1; old.t = Math.max(old.t, old.life - 8); }   // cap: the oldest fades early
  const sov = F.sovT > 0;
  const c = Object.assign({ x: F.x, y: GROUND, face: F.facing, t: 0, at: 18, kind: 'shot', dmg: 30, life: 0, done: false, pose: 'stance', gone: 0 }, o);
  c.life = c.life || c.at + (sov ? 30 : 22);
  c.x = clamp(c.x, 50, STAGE_W - 50);
  F.clones.push(c);
  for (let i = 0; i < 10; i++) FX.p({ type: 'spark', x: c.x + rand(-24, 24), y: c.y - rand(20, 190), vx: rand(-1, 1), vy: rand(-1, 1), life: 16, size: 2, color: i % 2 ? TK : TKG });
  FX.ring(c.x, c.y - 100, TK, 50, 6, 10, 2);
  Sound.play('tock');
  return c;
}
function tokCloneAttack(F, c) {
  const O = F.opp, sov = F.sovT > 0; c.done = true;
  const fire = (vx, vy) => BT.spawn({ owner: F, kind: 'tokBullet', x: c.x + c.face * 46, y: c.y - 128, vx, vy, w: 34, h: 28, life: 34, hits: 1, clash: 1, str: 1, dmg: c.dmg, hs: 20, bs: 10, kb: 4, color: TK, srcKey: c.src || 'counter', projOnHit: 1, clone: 1,
    onHit(A) { tokGain(A, 3); } });
  if (c.kind === 'kick') {
    c.pose = 'kick';
    BT.spawn({ owner: F, kind: 'tokSlash', x: c.x + c.face * 62, y: c.y - 110, vx: c.face * 0.001, w: 116, h: 120, life: 5, hits: 1, clash: 0, dmg: c.dmg, hs: 24, bs: 12, kb: 5, str: 2, color: TK, srcKey: c.src || 'counter', projOnHit: 1, clone: 1,
      onHit(A) { tokGain(A, 3); } });
    Sound.play('whoosh');
  } else {
    c.pose = c.y < GROUND - 20 ? 'aim' : 'aim2';
    let vx = c.face * 16, vy = 0;
    if (c.kind === 'aim' && O) { const ch = O.chestW(), dx = ch[0] - (c.x + c.face * 46), dy = ch[1] - (c.y - 128), d = Math.hypot(dx, dy) || 1; vx = dx / d * 16; vy = dy / d * 16; }
    fire(vx, vy); Sound.play('gunshot');
    FX.ring(c.x + c.face * 50, c.y - 128, TKG, 4, 30, 6, 2);
  }
  if (sov && c.kind !== 'kick') c.life += 4;
}
function tokClonesTick(F) {
  const O = F.opp; if (!F.clones || !F.clones.length) return;
  for (const c of F.clones) {
    c.t++;
    if (!c.done && !c.gone && c.t >= c.at) tokCloneAttack(F, c);
    // the opponent can strike a clone before it acts: it shatters
    if (!c.done && !c.gone && O) {
      const r = { x: c.x - 24, y: c.y - 170, w: 48, h: 170 };
      const hitByMelee = O.state === 'attack' && O.hitActive && overlap(O.hitbox(), r);
      const hitByProj = BT.projs.some(p => p.owner === O && p.active() && overlap(p.rect(), r));
      if (hitByMelee || hitByProj) { c.gone = 1; c.done = true; c.t = c.life - 10; for (let i = 0; i < 14; i++) FX.p({ type: 'shard', x: c.x + rand(-20, 20), y: c.y - rand(20, 170), vx: rand(-4, 4), vy: rand(-5, 1), life: 26, size: rand(2, 5), color: i % 2 ? TK : '#ffffff' }); Sound.play('gear'); FX.wtext(c.x, c.y - 200, 'SHATTERED', { size: 16, color: '#ffffff', stroke: TK2, life: 24 }); }
    }
    if (c.t === c.life - 6) for (let i = 0; i < 8; i++) FX.p({ type: 'spark', x: c.x + rand(-20, 20), y: c.y - rand(20, 180), vx: rand(-0.6, 0.6), vy: -rand(0.5, 1.6), life: 20, size: 2, color: TK });
  }
  F.clones = F.clones.filter(c => c.t < c.life);
}
TOKINE.initFighter = F => {
  F.time = 0; F.timeT = -999; F.sovT = 0; F.hasteT = 0; F.clones = []; F.rew = null; F.tokEx = null; F.clockT = 0; F.intT = -99; F.cloneRopes = {};
};
TOKINE.walkMul = F => F.hasteT > 0 ? (F.sovT > 0 ? 1.4 : 1.3) : 1;
TOKINE.onDealDamage = (A, D) => {
  if (A.ko || A.state === 'cine') return;
  if (A.hasteT > 0 && A.state === 'attack' && !A.hasteHit) { A.hasteHit = true; tokGain(A, 3); }
  if (D.state === 'attack' && D.move && (D.move.special || D.move.ult) && !D.move.counter && A.T - A.intT > 30) { A.intT = A.T; tokGain(A, 8, 'INTERRUPTED'); }
};
TOKINE.idlePose = F => { const k = F.T % 560; return k > 380 && k < 440 ? 'adjust' : k > 180 && k < 230 ? 'glance' : null; };
TOKINE.tick = F => {
  const O = F.opp; if (!O) return;
  const live = BT && BT.phase === 'fight' && !F.ko;
  if (F.state !== 'cine') F.tokEx = F.state === 'victory' ? 'smile' : F.state === 'attack' && (F.moveKey === 'sp2' || F.moveKey === 'sp2f') ? 'grin' : null;
  if (!live) { if (F.clones.length && (F.ko || (BT && BT.phase !== 'fight'))) F.clones = []; F.rew = null; }
  if (F.clockT > 0) F.clockT--;
  if (F.sovT > 0) {
    F.sovT--;
    if (F.T % 5 === 0) FX.p({ type: 'spark', x: F.x + rand(-34, 34), y: F.y - rand(20, 200), vx: rand(-0.4, 0.4), vy: -rand(0.3, 1), life: 26, size: rand(1.5, 3), color: F.T % 2 ? TK : TKG });
    if (F.sovT === 0) { F.time = 20; FX.wtext(F.x, F.y - 230, 'TIME RESUMES', { size: 20, color: TKP, stroke: TK2, life: 40 }); Sound.play('tock'); }
  } else if (live) {
    if (F.T - F.timeT > 360 && F.time > 0) F.time = Math.max(0, F.time - 0.04);
    if (F.time >= 100) tokSovereignty(F);
    if (F.time >= 50 && F.T % 12 === 0) FX.p({ type: 'spark', x: F.x + rand(-30, 30), y: F.y - rand(30, 180), vx: 0, vy: -0.6, life: 20, size: 1.6, color: TK });   // red temporal particles as Time builds
  }
  // First Hour: hastened attacks (never skips hit frames)
  if (F.hasteT > 0) { F.hasteT--; xpHaste(F, F.sovT > 0 ? 0.4 : 0.33); if (F.state === 'walk' || F.state === 'dash') F.afterimage = Math.max(F.afterimage, 2); if (F.state !== 'attack') F.hasteHit = false; }
  // Second Hour on the opponent: slower walk (engine slowT) + slower recovery
  if (O.tokSlowT > 0) { O.tokSlowT--; if (O.state === 'attack' && O.move && O.mf > O.move.st + O.move.act + 1 && O.T % 3 === 0) O.mf--; }
  // Seventh Hour: a very short time stop on the opponent
  if (O.tokStopCD > 0) O.tokStopCD--;
  if (O.tokStopT > 0) {
    O.tokStopT--;
    if (O.state === 'hit' || O.state === 'wall') { O.x = O.tokSX; O.y = O.tokSY; O.vx = 0; O.vy = 0; O.hitstun = Math.max(O.hitstun, 2); if (O.wallT) O.wallT = Math.max(O.wallT, 2); }
    else O.tokStopT = 0;
    if (O.tokStopT === 0) { FX.ring(O.x, O.y - 110, TKG, 60, 140, 12, 3); Sound.play('tock'); }
  }
  // clones
  if (live) tokClonesTick(F);
  // Fourth Hour: return to the recorded position
  if (F.rew) {
    const r = F.rew; r.t--;
    if (r.t <= 0) {
      F.rew = null;
      const free = F.state === 'attack' ? !F.move.ult : ['idle', 'walk', 'crouch', 'block', 'dash', 'backdash', 'jump', 'land'].includes(F.state);
      if (free && live) {
        const near = (O.state === 'attack' && O.hitActive && Math.abs(O.x - F.x) < 190) || BT.projs.some(p => p.owner === O && p.active() && Math.abs(p.x - F.x) < 150);
        F.rewFx = { x: F.x, y: F.y, t: 18 };
        F.x = clamp(r.x, 60, STAGE_W - 60); F.y = GROUND; F.vy = 0; F.onGround = true; F.invuln = Math.max(F.invuln, 10); F.afterimage = 10;
        if (F.state === 'jump' || F.state === 'backdash' || F.state === 'block' || F.state === 'dash') F.toIdle();
        if (F.state === 'attack' && !F.onGround) F.toIdle();
        Sound.play('rewind'); FX.ring(F.x, F.y - 100, TK, 80, 10, 12, 3);
        if (near) tokGain(F, 6, 'REWOUND');
      } else { FX.wtext(r.x, GROUND - 120, 'BROKEN', { size: 16, color: '#aaa', stroke: TKD, life: 24 }); }
    }
  }
};
const TOK_POSE = {};
const tokPose = k => TOK_POSE[k] || (TOK_POSE[k] = buildPose(TOKINE, k));
function tokDrawClone(g, F, x, y, face, pose, a, T, defined) {   // the same model, a touch darker, with a red temporal shimmer
  if (!(a > 0.01)) return;
  const p = tokPose(pose || 'stance');
  g.save(); g.globalAlpha = a * (defined ? 0.95 : 0.82);
  drawFigure(g, TOKINE, p, x + (T % 9 === 0 ? 2 : 0), y, face, { pal: TOK_CLONE_PAL, T, expr: 'grin' });
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * (0.18 + 0.1 * Math.sin(T * 0.6)); drawFigure(g, TOKINE, p, x + Math.sin(T * 0.9) * 3, y, face, { mono: TK, scale: 1.02 });
  g.restore();
}
TOKINE.drawBehind = (g, F) => {
  const T = F.T;
  // the clock that rises behind her (Seventh Hour, Sovereignty)
  const ck = F.clockT > 0 ? Math.min(1, F.clockT / 10) : 0, sv = F.sovT > 0 ? 0.45 : 0, k = Math.max(ck, sv);
  if (k > 0.01) { g.save(); g.globalAlpha = k * 0.8; tokDial(g, F.x - F.facing * 20, F.y - 150, 60 + 30 * ck, T, { spin: F.clockT > 12 ? 0 : 1, glow: 1, n: 12 }); g.restore(); }
  // Fourth Hour marker: a small clock at the recorded position
  if (F.rew) { const r = F.rew; g.save(); g.globalAlpha = 0.55 + 0.25 * Math.sin(T * 0.3); tokDial(g, r.x, GROUND - 40, 22, T, { spin: -3, n: 12 }); g.globalAlpha = 0.25; drawFigure(g, F.ch, tokPose('stance'), r.x, GROUND, F.facing, { mono: TK }); g.restore(); }
  if (F.rewFx) { const s = F.rewFx; s.t--; g.save(); g.globalAlpha = s.t / 18 * 0.5; drawFigure(g, F.ch, F.pose, s.x, s.y, F.facing, { mono: TK }); g.restore(); if (s.t <= 0) F.rewFx = null; }
  // clones
  for (const c of F.clones || []) {
    const a = c.gone ? Math.max(0, (c.life - c.t) / 10) : Math.min(1, c.t / 6) * Math.min(1, (c.life - c.t) / 8);
    tokDrawClone(g, F, c.x, c.y, c.face, c.t < 4 ? 'summon' : c.pose, a, T + c.at, F.sovT > 0);
    if (c.t < 8) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - c.t / 8; g.strokeStyle = TK; g.lineWidth = 2; g.beginPath(); g.ellipse(c.x, c.y - 100, 30 + c.t * 4, 100, 0, 0, TAU); g.stroke(); g.restore(); }
  }
  // victory: one or two clones appear behind her for a moment; defeat: one flickers into view and is gone
  if (F.state === 'victory' && F.sf > 40 && F.sf < 170) { const a = Math.min(1, (F.sf - 40) / 20) * Math.min(1, (170 - F.sf) / 20) * 0.7; tokDrawClone(g, F, F.x - F.facing * 70, F.y, F.facing, 'curtsy', a, T, false); tokDrawClone(g, F, F.x + F.facing * 60, F.y, -F.facing, 'adjust', a * 0.8, T + 3, false); }
  if (F.state === 'intro' && F.sf < 90) tokDrawClone(g, F, F.x - F.facing * 70, F.y, F.facing, 'curtsy', Math.sin(Math.min(1, F.sf / 90) * Math.PI) * 0.7, T, false);
  if ((F.state === 'defeat' || (F.ko && F.state === 'knockdown')) && F.sf > 30 && F.sf < 80) tokDrawClone(g, F, F.x - F.facing * 60, F.y, F.facing, 'glance', Math.sin((F.sf - 30) / 50 * Math.PI) * 0.6, T, false);
};
TOKINE.drawExtra = (g, F) => {
  const O = F.opp, T = F.T;
  if (O && O.tokStopT > 0 && !O.hidden) {   // time-stopped: greyed out, ring of clock ticks
    g.save(); g.globalAlpha = 0.45; drawFigure(g, O.ch, O.pose, O.x, O.y, O.facing, { mono: '#c8c4cc' }); g.globalAlpha = 0.9;
    tokDial(g, O.x, O.y - 110 * O.s, 70, 0, { spin: 0, n: 12, ring: 1 }); g.restore();
  }
  if (O && O.tokSlowT > 0 && !O.hidden && T % 4 < 2) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.25; drawFigure(g, O.ch, O.pose, O.x - O.vx * 4, O.y, O.facing, { mono: TK }); g.restore(); }
  if ((F.sovT > 0 || (F.time || 0) >= 50) && !F.hidden && FX.hq) {   // the eyes glow; small clock symbols orbit her
    const n = F.sovT > 0 ? 3 : 1;
    g.save(); g.globalAlpha = F.sovT > 0 ? 0.8 : 0.35;
    for (let i = 0; i < n; i++) { const a = T * 0.03 + i * TAU / n; tokDial(g, F.x + Math.cos(a) * 52, F.y - 110 + Math.sin(a) * 70, 8, T, { spin: 2, n: 4 }); }
    g.restore();
  }
};
function tokDial(g, x, y, R, T, o = {}) {   // clock face: numeral ticks, hands; o.spin speed, o.glow, o.ring (stopped ring only)
  g.save(); g.translate(x, y); g.lineCap = 'round';
  if (!o.ring) { g.fillStyle = 'rgba(20,6,10,0.75)'; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill(); }
  g.strokeStyle = o.glow ? TK : TKG; g.lineWidth = Math.max(1.2, R * 0.06); g.beginPath(); g.arc(0, 0, R, 0, TAU); g.stroke();
  g.strokeStyle = TKG; g.lineWidth = Math.max(1, R * 0.035); g.beginPath(); g.arc(0, 0, R * 0.86, 0, TAU); g.stroke();
  const n = o.n || 12;
  for (let i = 0; i < n; i++) { const a = i / n * TAU; g.strokeStyle = o.glow && i % 3 === 0 ? '#ff4a5a' : TKG; g.lineWidth = Math.max(1, R * (i % 3 === 0 ? 0.07 : 0.04)); g.beginPath(); g.moveTo(Math.sin(a) * R * 0.7, -Math.cos(a) * R * 0.7); g.lineTo(Math.sin(a) * R * 0.82, -Math.cos(a) * R * 0.82); g.stroke(); }
  if (!o.ring) {
    const s = o.spin ?? 1, h1 = T * 0.01 * s, h2 = T * 0.06 * s;
    g.strokeStyle = '#f4e6d0'; g.lineWidth = Math.max(1.2, R * 0.07); g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(h1) * R * 0.45, -Math.cos(h1) * R * 0.45); g.stroke();
    g.strokeStyle = TK; g.lineWidth = Math.max(1, R * 0.045); g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(-h2) * R * 0.66, -Math.cos(-h2) * R * 0.66); g.stroke();
  }
  g.restore();
}
TOKINE.introFx = F => { FX.wtext(F.x, F.y - 250, 'tick… tock…', { size: 22, color: TKP, stroke: TK2, life: 60, vy: -0.3 }); Sound.play('bell'); };

// ---------------------------------- projectiles ----------------------------------
EXTRA_PROJ.tokBullet = {   // a red temporal bullet with a distorted trail (shared by Tokine and her clones)
  update(p) { if (p.t % 2 === 0) FX.p({ type: 'spark', x: p.x - p.vx, y: p.y - p.vy, vx: -p.vx * 0.05, vy: 0, life: 10, size: 1.8, color: p.slow ? '#ff8aa0' : TK }); },
  draw(g, p) {
    const a = Math.atan2(p.vy, p.vx); g.save(); g.translate(p.x, p.y); g.rotate(a); g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.5; g.fillStyle = p.stop ? TKG : TK; g.beginPath(); g.ellipse(-20, 0, 26, 5 + Math.sin(p.t * 0.9) * 2, 0, 0, TAU); g.fill();
    g.globalAlpha = 1; g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(0, 0, 7, 4, 0, 0, TAU); g.fill(); g.fillStyle = p.stop ? TKG : '#ff4a5e'; g.beginPath(); g.ellipse(-3, 0, 9, 5, 0, 0, TAU); g.globalAlpha = 0.6; g.fill();
    if (p.stop || p.slow) { g.globalAlpha = 0.6; g.strokeStyle = p.stop ? TKG : TK; g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, p.stop ? 16 : 12, p.t * 0.3, p.t * 0.3 + 4.5); g.stroke(); }
    g.restore();
  },
};
EXTRA_PROJ.tokSlash = { update() {}, draw(g, p) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, p.life / 4) * 0.7; g.strokeStyle = TK; g.lineWidth = 4; const d = Math.sign(p.vx) || 1; g.beginPath(); g.arc(p.x - d * 30, p.y, 60, d > 0 ? -1 : Math.PI - 1 + 2, d > 0 ? 1 : Math.PI + 1); g.stroke(); g.restore(); } };
EXTRA_PROJ.tokMuzzle = { update() {}, draw(g, p) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = p.life / 8; tokDial(g, p.x, p.y, 26 + (8 - p.life) * 4, p.t, { spin: 6, n: 12, glow: 1 }); g.restore(); } };

// ---------------------------------- moves ----------------------------------
const tokMuzzle = (F, big) => { const h = F.handW('f'); FX.ring(h[0] + F.facing * 20, h[1], TKG, 4, big ? 50 : 30, 6, 3); FX.p({ type: 'smoke', x: h[0] + F.facing * 24, y: h[1], vx: F.facing * 1.5, vy: -0.4, life: 18, size: 8, grow: 0.3, color: 'rgba(200,190,190,0.5)', add: false }); };
TOKINE.moves = Object.assign(baseNormals({ dmg: 0.95, spd: 0, rng: 1.02 }), {
  sp1: {
    name: 'FIRST HOUR: HASTE', jp: '一の刻・加速', desc: 'She raises the pistol, a red clock flashes behind her and she shoots into her own shadow — time speeds up for her for 2.5 s: faster walk, attacks recover faster, and a short burst forward with afterimages. No invulnerability. +3 Time when a hastened attack lands.', special: 1, lvl: 4,
    poses: ['aim_self', 'glide'], st: 10, act: 1, rec: 16, cd: 150, sfx: 'tock',
    poseFn(F, f) { return f <= 10 ? 'aim_self' : f <= 22 ? 'glide' : 'stance'; },
    spawn: { f: 10, fn(F) {
      BT.spawn({ owner: F, kind: 'tokMuzzle', x: F.x - F.facing * 10, y: F.y - 140, vx: F.facing * 0.001, w: 1, h: 1, life: 8, harmless: true, clash: 0 });
      F.hasteT = F.sovT > 0 ? 210 : 150; F.hasteHit = false; Sound.play('gunshot'); Sound.play('rewind'); tokMuzzle(F, false);
    } },
    tick(F, f) { if (f > 10 && f <= 20) { F.vx = F.facing * 11; F.ctrlVel = true; F.afterimage = Math.max(F.afterimage, 4); } },
  },
  sp1f: {
    name: 'SECOND HOUR: SLOW', jp: '二の刻・遅延', desc: 'A calm, aimed shot: a red bullet with a warped trail (~540 px). On hit the opponent is wrapped in a clock: 1.5 s slower walking and slower recovery. Interrupts startups. +6 Time on hit. Sovereignty: lasts longer.', special: 1, lvl: 4,
    poses: ['aim', 'aim'], st: 13, act: 1, rec: 18, cd: 80, sfx: 'tock',
    spawn: { f: 13, fn(F) {
      const sov = F.sovT > 0;
      BT.spawn({ owner: F, kind: 'tokBullet', x: F.x + F.facing * 62, y: F.y - 128, vx: F.facing * 15, w: 40, h: 30, life: 36, hits: 1, clash: 1, str: 1, slow: 1,
        dmg: 48, hs: 20, bs: 10, kb: 4, color: TK, srcKey: 'sp1f', projOnHit: 1,
        onHit(A, D) { D.slowT = Math.max(D.slowT, sov ? 130 : 90); D.tokSlowT = sov ? 130 : 90; tokGain(A, 6); FX.ring(D.x, D.y - 110, TK, 10, 80, 12, 3); Sound.play('tick'); } });
      Sound.play('gunshot'); tokMuzzle(F, false);
    } },
  },
  counter: {
    name: 'TEMPORAL CLONE', jp: '時の分身', desc: 'Costs 15 Time (8 in Sovereignty). A distortion opens beside her and a clone steps out while she glides away (hold → to glide forward instead). After a short delay the clone shoots — or kicks, if the opponent is close. Blockable; the clone shatters if hit first. Sovereignty: a second clone attacks from behind them.', special: 1, lvl: 4,
    poses: ['summon', 'glide'], st: 8, act: 1, rec: 14, cd: 70, sfx: 'tock',
    req: F => (F.time || 0) >= tokCost(F, 15),
    onStart(F) { tokSpend(F, 15); },
    poseFn(F, f) { return f <= 8 ? 'summon' : 'glide'; },
    spawn: { f: 8, fn(F) {
      const O = F.opp, close = Math.abs(O.x - F.x) < 170;
      tokClone(F, { x: F.x + F.facing * 30, face: F.facing, at: close ? 10 : 16, kind: close ? 'kick' : 'shot', dmg: close ? 36 : 32, src: 'counter' });
      if (F.sovT > 0) tokClone(F, { x: O.x + F.facing * 80, face: -F.facing, at: 30, kind: 'kick', dmg: 30, src: 'counter' });
      F.cloneFwd = F.input.fwd > 0;
    } },
    tick(F, f) { if (f > 8 && f <= 18) { F.vx = F.facing * (F.cloneFwd ? 8 : -8); F.ctrlVel = true; F.afterimage = Math.max(F.afterimage, 3); } },
  },
  sp2: {
    name: 'SEVENTH HOUR: STOP', jp: '七の刻・停止', desc: 'Costs 30 Time (15 in Sovereignty). A large clock rises behind her and stops — a readable 22 f startup — then a glowing bullet (~500 px). On hit the opponent freezes in time for ~0.6 s: a combo opportunity. Can\'t re-freeze the same opponent for 4 s.', special: 1, lvl: 4,
    poses: ['aim_up', 'aim'], st: 22, act: 1, rec: 24, cd: 420, sfx: 'bell',
    req: F => (F.time || 0) >= tokCost(F, 30),
    onStart(F) { tokSpend(F, 30); F.clockT = 40; },
    tick(F, f) { if (f === 14) Sound.play('tock'); },
    spawn: { f: 22, fn(F) {
      BT.spawn({ owner: F, kind: 'tokBullet', x: F.x + F.facing * 62, y: F.y - 128, vx: F.facing * 13, w: 46, h: 36, life: 38, hits: 1, clash: 1, str: 2, stop: 1,
        dmg: 78, hs: 26, bs: 12, kb: 3, color: TKG, srcKey: 'sp2', projOnHit: 1,
        onHit(A, D) {
          tokGain(A, 8);
          if (!(D.tokStopCD > 0)) { D.tokStopT = 38; D.tokStopCD = 240; D.tokSX = D.x; D.tokSY = D.y; FX.wtext(D.x, D.y - 250, 'TIME STOP', { size: 30, color: '#ffffff', stroke: TK2, life: 40 }); FX.flashScreen('#f0e8e8', 4, 0.25); Sound.play('bell'); }
        } });
      Sound.play('gunshot'); tokMuzzle(F, true); FX.shakeIt(3);
    } },
  },
  sp2f: {
    name: 'EIGHTH HOUR: ECHOES', jp: '八の刻・残響', desc: 'Costs 40 Time (20 in Sovereignty). She raises the pistol and clones step out of distortions around the opponent — in front, high above, and behind them — then fire and strike in a fixed, readable order (each can be blocked; a clone hit first shatters). Sovereignty: a fourth clone joins.', special: 1, lvl: 4,
    poses: ['summon', 'aim_up'], st: 14, act: 1, rec: 30, cd: 480, sfx: 'gear',
    req: F => (F.time || 0) >= tokCost(F, 40),
    onStart(F) { tokSpend(F, 40); },
    spawn: { f: 14, fn(F) {
      const O = F.opp, d = F.facing, sov = F.sovT > 0;
      tokClone(F, { x: O.x - d * 150, face: d, at: 6, kind: 'shot', dmg: 28, src: 'sp2f' });
      tokClone(F, { x: O.x - d * 90, y: GROUND - 190, face: d, at: 17, kind: 'aim', dmg: 28, src: 'sp2f' });
      tokClone(F, { x: O.x + d * 70, face: -d, at: 28, kind: 'kick', dmg: 38, src: 'sp2f' });
      if (sov) tokClone(F, { x: O.x + d * 140, y: GROUND - 150, face: -d, at: 38, kind: 'aim', dmg: 30, src: 'sp2f' });
    } },
  },
  sp2d: {
    name: 'FOURTH HOUR: REWIND', jp: '四の刻・回帰', desc: 'Costs 20 Time (10 in Sovereignty). A small clock marks where she stands. ~1.3 s later time distorts and she returns there (if she is free or guarding — not while being hit), leaving a red afterimage. Escapes pressure or baits; slipping a live attack with it gives +6 Time. Health, the opponent and cooldowns are not touched.', special: 1, lvl: 4,
    poses: ['rewind', 'rewind'], st: 6, act: 1, rec: 8, cd: 360, sfx: 'tock',
    req: F => !F.rew && (F.time || 0) >= tokCost(F, 20),
    onStart(F) { tokSpend(F, 20); F.rew = { x: F.x, t: 80 }; },
  },
  ult: {
    name: 'ENDLESS NIGHTMARE', jp: '無限の悪夢', desc: 'Ultimate. She raises her pistol for a point-blank shot. If it connects, a gigantic clock opens the nightmare: the opponent hangs in a dimension of broken time while an army of her clones fires in sequence; then everything stops, she steps in front of them and fires the final shot.', ult: 1, lvl: 6, cost: 100,
    poses: ['aim_up', 'aim'], st: 14, act: 6, rec: 36, dmg: 20, hs: 40, bs: 20, kb: 1, hb: { x: 0, y: -200, w: 200, h: 200 }, invuln: [0, 16], str: 3, sfx: 'bell',
    tick(F, f) { if (f === 14) { Sound.play('gunshot'); tokMuzzle(F, true); } },
    onHit(F, D) { BT.startCine(F, D, CINE.tokine, { zoom: 1.3 }); return true; },
  },
});
(() => {
  const M = TOKINE.moves;
  Object.assign(M.L, { name: 'Pistol Tap', poses: ['whip_w', 'whip'] });
  Object.assign(M.M, { name: 'Lace Kick', poses: ['kick_w', 'kick'] });
  Object.assign(M.H, { name: 'POINT BLANK', poses: ['aim', 'aim2'], sfx: 'gunshot', onHit(A, D) { tokGain(A, 2); Sound.play('gunshot'); const h = A.handW('f'); FX.ring(h[0] + A.facing * 20, h[1], TKG, 4, 40, 6, 3); } });
  Object.assign(M.cH, { name: 'Ankle Shot' });
  Object.assign(M.LH, { name: 'Rising Waltz' });
  Object.assign(M.FF, { name: 'Afterimage Step' });
  Object.assign(M.jH, { name: 'Falling Shot' });
})();
// CPU hints
TOKINE.dmgBonus = () => 1.1;
TOKINE.moves.sp1.__ai = { reach: 40, kind: 'buff', anti: false, st: 10, low: false, over: false };
TOKINE.moves.counter.__ai = { reach: 380, kind: 'proj', anti: false, st: 26, low: false, over: false };
TOKINE.moves.sp2d.__ai = { reach: 40, kind: 'virtual', anti: false, st: 6, low: false, over: false };
TOKINE.combos = [
  { name: 'Second Hour', notation: 'M → H (Point Blank) → ↓→SP1 (Slow)', seq: ['M', 'H', 'sp1f'] },
  { name: 'Delayed Echo', notation: 'M → H → ↓←SP1 (Temporal Clone) — the clone\'s attack must hit', seq: ['M', 'H', 'counter'], time: 60 },
  { name: 'Seventh Hour', notation: 'M → H → SP2 (Stop)', seq: ['M', 'H', 'sp2'], time: 60 },
  { name: 'Eighth Hour', notation: 'M → H → ↓→SP2 (Echoes)', seq: ['M', 'H', 'sp2f'], time: 60 },
  { name: 'Endless Nightmare', notation: 'M → H → SP1+SP2 (Ultimate)', seq: ['M', 'H', 'ult'], meter: 1 },
];
TOKINE.applyTrial = (A, tr) => { if (!tr) return; if (tr.meter) A.meter = 100; if (tr.time) { A.time = tr.time; A.timeT = A.T + 99999; } };

// ---------------------------------- cinematic: ENDLESS NIGHTMARE ----------------------------------
CINE.tokine = function (A, D, f, c) {
  const dir = A.facing;
  if (f === 1) {
    A.x = clamp(A.x, 280, STAGE_W - 280); D.x = clamp(A.x + dir * 230, 120, STAGE_W - 120); D.y = GROUND; D.forcePose = 'hit'; A.forcePose = 'stance'; A.tokEx = null;
    c.ax0 = A.x; c.zoom = 1.3; c.camX = (A.x + D.x) / 2; c.camY = GROUND - 150; c.bg = TOKINE.cineBg; c.fg = TOKINE.cineFg;
    c.ck = 0; c.dim = 0; c.spin = 1; c.hand = 0; c.hand2 = 0; c.stop = 0; c.white = 0; c.red = 0; c.quiet = 0; c.bullet = -1; c.shards = null;
    c.cl = []; c.motes = []; for (let i = 0; i < 50; i++) c.motes.push([Math.random() * W, Math.random() * H, Math.random() * 0.8 + 0.2]);
    FX.darkTarget = 0.5; Sound.play('bell');
    A.clones = [];
  }
  c.hand += 0.02 * c.spin; c.hand2 -= 0.05 * c.spin;
  // --- 1: THE CLOCK AWAKENS — she slowly raises the pistol; the giant clock materialises; its numerals light up ---
  if (f <= 56) { const k = easeOut(f / 56); c.zoom = lerp(1.3, 1.7, k); c.camX = lerp((A.x + D.x) / 2, A.x - dir * 20, k); c.camY = lerp(GROUND - 150, A.y - 180, k); }
  if (f === 8) A.forcePose = 'aim_up';
  if (f >= 10 && f <= 54) c.ck = (f - 10) / 44;
  if (f % 6 === 0 && f < 70) Sound.play('tock');
  if (f === 48) { A.tokEx = 'grin'; }
  // --- 2: THE NIGHTMARE DIMENSION — the world breaks into clock patterns; the opponent hangs; clones appear one by one ---
  if (f >= 56 && f <= 100) c.dim = (f - 56) / 44;
  if (f >= 60 && f < 120) { const k = easeInOut((f - 60) / 60); c.zoom = lerp(1.7, 0.95, k); c.camX = lerp(A.x - dir * 20, D.x - dir * 40, k); c.camY = lerp(A.y - 180, GROUND - 210, k); }
  if (f >= 70 && f <= 96) { const k = easeOut((f - 70) / 26); D.forcePose = 'airhit'; D.y = GROUND - 130 * k; }
  if (f > 96 && f < 250) D.y = GROUND - 130 + Math.sin(f * 0.06) * 4;
  const spots = [[-1, 0, 'aim2'], [1, 0, 'aim2'], [-0.6, -230, 'aim'], [0.6, -230, 'aim'], [-1.6, -110, 'aim'], [1.6, -110, 'aim'], [0, -300, 'aim']];
  for (let i = 0; i < spots.length; i++) if (f === 84 + i * 7) {
    const [sx, sy, pose] = spots[i], x = D.x + sx * 190, y = GROUND + sy;
    c.cl.push({ x, y, face: x < D.x ? 1 : -1, pose: 'summon', a: 0, t: 0 });
    Sound.play('tock'); FX.ring(x, y - 100, TK, 60, 8, 10, 2);
  }
  for (const k of c.cl) { k.t++; k.a = Math.min(1, k.t / 8) * (k.fade ?? 1); if (k.t === 8) k.pose = 'aim'; }
  // --- 3: THE COORDINATED ATTACK — left, right, from above, from behind… each one on its beat ---
  if (f >= 136 && f < 214 && (f - 136) % 6 === 0) {
    const i = ((f - 136) / 6) | 0, k = c.cl[i % c.cl.length]; if (k) {
      if (i === 7 || i === 10) { k.x = D.x + (k.x < D.x ? 1 : -1) * 170; k.face = -k.face; FX.ring(k.x, k.y - 100, TK, 50, 6, 8, 2); }   // some vanish and reappear on the other side
      k.pose = k.y < GROUND - 20 ? 'aim' : 'aim2'; k.fire = 6;
      const ch = D.chestW(); c.tr = { x0: k.x + k.face * 46, y0: k.y - 128, x1: ch[0], y1: ch[1], t: 5 };
      BT.scriptHit(A, D, 8, { str: 1, sfx: 'gunshot' }); D.flash = 3; FX.shakeIt(2);
      c.camX = lerp(c.camX, k.x, 0.25); c.camY = lerp(c.camY, k.y - 140, 0.2);
    }
  }
  if (c.tr) { c.tr.t--; if (c.tr.t <= 0) c.tr = null; }
  if (f >= 120 && f < 214) { c.zoom = lerp(c.zoom, 1.0, 0.04); c.camX = lerp(c.camX, D.x, 0.03); c.camY = lerp(c.camY, GROUND - 200, 0.03); }
  // --- 4: TIME COLLAPSE — all stop; the clock spins wildly; clones dissolve into her; she appears right in front of them ---
  if (f === 214) { Sound.play('gear'); c.spin = 1; }
  if (f >= 214 && f <= 244) c.spin = lerp(1, 14, (f - 214) / 30);
  for (let i = 0; i < c.cl.length; i++) if (f === 218 + i * 4) { const k = c.cl[i]; k.fade = 0; for (let j = 0; j < 10; j++) FX.p({ type: 'spark', x: k.x + rand(-20, 20), y: k.y - rand(20, 180), vx: (A.x - k.x) / 18, vy: (A.y - 120 - k.y) / 18, life: 18, size: 2.4, color: j % 2 ? TK : TKG }); }
  if (f === 246) { A.x = clamp(D.x - dir * 110, 60, STAGE_W - 60); A.forcePose = 'aim'; A.afterimage = 10; c.cl = []; Sound.play('rewind'); }
  if (f >= 246 && f < 300) { c.zoom = lerp(c.zoom, 1.85, 0.08); c.camX = lerp(c.camX, (A.x + D.x) / 2, 0.1); c.camY = lerp(c.camY, GROUND - 160, 0.1); }
  if (f >= 240) c.quiet = Math.min(1, (f - 240) / 12);
  if (f === 256) { c.spin = 0; c.stop = 1; Sound.play('tock'); }
  // --- 5: THE FINAL SHOT — a single bullet crawls toward them in slow motion; the dimension collapses on impact ---
  if (f === 262) { c.bullet = 0; Sound.play('gunshot'); tokMuzzle(A, true); }
  if (c.bullet >= 0 && c.bullet < 1) c.bullet = Math.min(1, c.bullet + 1 / 22);
  if (f === 285) {
    c.bullet = -1; BT.scriptHit(A, D, 130, { str: 4 }); FX.impactFrame(6); FX.shakeIt(30); Sound.play('explosion'); Sound.play('bell'); FX.flashScreen('#ffffff', 18, 0.9);
    c.red = 1; c.shards = []; for (let i = 0; i < 40; i++) { const a = rand(0, TAU), v = rand(4, 18); c.shards.push([W / 2, H / 2 - 40, Math.cos(a) * v, Math.sin(a) * v, rand(6, 22), rand(0, TAU)]); }
    const ch = D.chestW(); FX.ring(ch[0], ch[1], TK, 10, 520, 26, 10); FX.ring(ch[0], ch[1], TKG, 10, 300, 20, 5);
    FX.wtext(D.x, D.y - 270, '無限の悪夢', { size: 60, font: FX_JP(), color: '#ffffff', stroke: TK2, life: 64, vy: -0.3 });
  }
  if (f === 288) { BT.release(D, dir * 9, -9); A.x = c.ax0; A.forcePose = 'stance'; c.quiet = 0; }   // under the flash she is back where she stood
  if (f > 285) { c.red = Math.max(0, c.red - 0.04); c.dim = Math.max(0, c.dim - 0.035); c.ck = Math.max(0, c.ck - 0.04); }
  // --- 6: AFTERMATH — the battlefield returns; she looks at her pistol, then at her little clock, and smiles ---
  if (f >= 290 && f < 340) { c.zoom = lerp(c.zoom, 1.5, 0.06); c.camX = lerp(c.camX, A.x, 0.08); c.camY = lerp(c.camY, GROUND - 150, 0.08); }
  if (f === 300) A.forcePose = 'adjust';
  if (f === 318) { A.forcePose = 'glance'; Sound.play('tock'); }
  if (f === 330) { A.forcePose = 'curtsy'; A.tokEx = 'smile'; }
  if (f >= 344) { c.zoom = lerp(c.zoom, 1.0, 0.2); FX.darkTarget = 0; A.tokEx = null; tokGain(A, 10); return true; }
};
TOKINE.cineBg = (g, c) => {   // screen space: the nightmare dimension and the giant clock behind her
  const k = c.dim || 0, cam = BT && BT.cam;
  if (k > 0.01) {
    g.save(); g.globalAlpha = k;
    const gr = g.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.75); gr.addColorStop(0, '#3a0812'); gr.addColorStop(0.5, '#1a0408'); gr.addColorStop(1, '#050103');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // fragmented floor of clock rings and broken perspective
    g.strokeStyle = 'rgba(208,26,52,0.35)'; g.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) { g.beginPath(); g.ellipse(W / 2, H * 0.86, 120 + i * 110 + (c.f * 2) % 110, 28 + i * 22, 0, 0, TAU); g.stroke(); }
    g.strokeStyle = 'rgba(255,207,90,0.15)';
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU + c.f * 0.003; g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * 80, H * 0.86 + Math.sin(a) * 20); g.lineTo(W / 2 + Math.cos(a) * 1400, H * 0.86 + Math.sin(a) * 300); g.stroke(); }
    for (const m of c.motes) { g.fillStyle = 'rgba(255,60,80,0.6)'; g.fillRect(m[0], (m[1] - c.f * m[2] + H * 9) % H, 2, 2); }
    // small floating clocks at odd angles
    for (let i = 0; i < 6; i++) { g.save(); g.globalAlpha = k * 0.5; tokDial(g, (i * 233 + 90) % W, 90 + (i * 97) % 300, 26 + (i % 3) * 10, c.f * (i % 2 ? 1 : -1), { spin: c.spin * (i % 2 ? 1 : -2), n: 12, glow: 1 }); g.restore(); }
    g.restore();
  }
  // the giant clock
  if (c.ck > 0.01 && cam) {
    const [cx, cy] = cam.toScreen(c.ax0 - (c.A ? c.A.facing : 1) * 30, GROUND - 260), R = 300 * cam.z * (0.6 + 0.4 * easeOut(c.ck));
    g.save(); g.globalAlpha = Math.min(1, c.ck); g.translate(cx, cy);
    g.fillStyle = 'rgba(16,4,8,0.85)'; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill();
    g.strokeStyle = TKG; g.lineWidth = R * 0.03; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.stroke();
    g.strokeStyle = TK; g.lineWidth = R * 0.012; g.beginPath(); g.arc(0, 0, R * 0.92, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, R * 0.62, 0, TAU); g.stroke();
    const NUM = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    g.font = `900 ${Math.round(R * 0.12)}px ${FONT_T}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU, lit = c.ck * 12 > i;
      g.fillStyle = lit ? '#ff3a50' : '#4a1a22'; if (lit && FX.hq) { g.shadowColor = TK; g.shadowBlur = 14; }
      g.fillText(NUM[i], Math.sin(a) * R * 0.78, -Math.cos(a) * R * 0.78); g.shadowBlur = 0;
      g.strokeStyle = TKG; g.lineWidth = R * 0.01; g.beginPath(); g.moveTo(Math.sin(a) * R * 0.88, -Math.cos(a) * R * 0.88); g.lineTo(Math.sin(a) * R * 0.95, -Math.cos(a) * R * 0.95); g.stroke();
    }
    // gears inside
    g.strokeStyle = 'rgba(255,207,90,0.25)'; g.lineWidth = R * 0.01;
    for (const [gx, gy, gr2, sp] of [[-0.25, 0.2, 0.16, 1], [0.22, 0.25, 0.12, -1.4], [0.05, -0.28, 0.1, 2]]) { g.save(); g.translate(gx * R, gy * R); g.rotate(c.f * 0.02 * sp * c.spin); g.beginPath(); for (let j = 0; j < 12; j++) { const a = j / 12 * TAU; g.lineTo(Math.cos(a) * R * gr2 * (j % 2 ? 1 : 1.18), Math.sin(a) * R * gr2 * (j % 2 ? 1 : 1.18)); } g.closePath(); g.stroke(); g.restore(); }
    // the hands move in different directions (and stop)
    g.lineCap = 'round';
    g.strokeStyle = '#f4e6d0'; g.lineWidth = R * 0.035; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(c.hand) * R * 0.5, -Math.cos(c.hand) * R * 0.5); g.stroke();
    g.strokeStyle = TK; g.lineWidth = R * 0.022; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(c.hand2) * R * 0.78, -Math.cos(c.hand2) * R * 0.78); g.stroke();
    g.fillStyle = TKG; g.beginPath(); g.arc(0, 0, R * 0.05, 0, TAU); g.fill();
    g.restore();
  }
};
TOKINE.cineFg = (g, c) => {   // the clone army (world positions) + slow bullet + tracers + shattering clock + red/black flash
  const cam = BT && BT.cam; if (!cam) return;
  if (c.cl && c.cl.length) {
    g.save(); g.translate(W / 2, H / 2); g.scale(cam.z, cam.z); g.translate(-cam.x, -cam.y);
    for (const k of c.cl) { if (k.fire > 0) k.fire--; tokDrawClone(g, c.A, k.x, k.y, k.face, k.pose, k.a, c.f + k.x, true); if (k.fire > 3) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = TKG; g.beginPath(); g.arc(k.x + k.face * 50, k.y - 128, 10, 0, TAU); g.fill(); g.restore(); } }
    if (c.tr) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = '#ff4a5e'; g.lineWidth = 3; g.globalAlpha = c.tr.t / 5; g.beginPath(); g.moveTo(c.tr.x0, c.tr.y0); g.lineTo(c.tr.x1, c.tr.y1); g.stroke(); g.restore(); }
    g.restore();
  }
  if (c.bullet >= 0 && c.A && c.D) {
    const h = c.A.handW('f'), ch = c.D.chestW(), x = lerp(h[0] + c.A.facing * 30, ch[0], c.bullet), y = lerp(h[1], ch[1], c.bullet);
    const [sx, sy] = cam.toScreen(x, y);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) { g.globalAlpha = 0.25 - i * 0.03; g.strokeStyle = TK; g.lineWidth = 2; g.beginPath(); g.arc(sx, sy, 18 + i * 10 + Math.sin(c.f * 0.3 + i) * 3, 0, TAU); g.stroke(); }
    g.globalAlpha = 1; g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(sx, sy, 10 * cam.z, 6 * cam.z, 0, 0, TAU); g.fill(); g.fillStyle = TK; g.globalAlpha = 0.7; g.beginPath(); g.ellipse(sx - c.A.facing * 10, sy, 16 * cam.z, 7 * cam.z, 0, 0, TAU); g.fill();
    g.restore();
  }
  const q = c.quiet || 0;
  if (q > 0.01) { g.save(); const gr = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.75); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${0.7 * q})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); }
  if (c.shards) {   // the clock shatters into glowing red fragments
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const s of c.shards) { s[0] += s[2]; s[1] += s[3]; s[3] += 0.15; s[5] += 0.1; g.save(); g.translate(s[0], s[1]); g.rotate(s[5]); g.globalAlpha = Math.max(0, c.red); g.fillStyle = Math.round(s[4]) % 2 ? TK : TKG; g.beginPath(); g.moveTo(-s[4], 0); g.lineTo(0, -s[4] * 0.4); g.lineTo(s[4] * 0.7, s[4] * 0.3); g.closePath(); g.fill(); g.restore(); }
    g.restore();
  }
  if (c.red > 0) { g.save(); g.globalAlpha = c.red * 0.5; g.fillStyle = (c.f % 4 < 2) ? '#5a0010' : '#000000'; g.fillRect(0, 0, W, H); g.restore(); }
};

// ---------------------------------- HUD + how-to ----------------------------------
TOKINE.drawHand = (g, F, side, t) => {
  const sov = F.sovT > 0, nC = (F.clones || []).filter(c => !c.gone && !c.done).length;
  xpPanel(g, F, side, t, {
    col: sov ? '#ff3a52' : TK, col2: TKG, icon: '', flash: sov,
    title: sov ? 'TIME SOVEREIGNTY' : 'TIME',
    sub: sov ? '時の支配 · HALF COSTS · EXTRA CLONES' : '刻 · clone 15 · stop 30 · echo 40 · rewind 20',
    k: sov ? F.sovT / TOK_SOV : (F.time || 0) / 100, label: sov ? `${(F.sovT / 60).toFixed(1)}s` : `${Math.floor(F.time || 0)}`, marks: [0.15, 0.2, 0.3, 0.4],
    pips: [nC, TOK_CLONES, 'CLONES'],
    badges: [['sp1', 'S1|HASTE'], ['sp1f', '↓→S1|SLOW'], ['counter', '↓←S1|CLONE'], ['sp2', 'S2|STOP'], ['sp2f', '↓→S2|ECHOES'], ['sp2d', '↓↓S2|REWIND']],
  });
  // the clock-face meter: 12 numerals light up as Time fills
  const pw = 330, x0 = side > 0 ? 40 : W - 40 - pw, ix = side > 0 ? x0 + 33 : x0 + pw - 33, iy = 560 + 32, lit = sov ? 12 : Math.floor((F.time || 0) / 100 * 12);
  g.save(); g.translate(ix, iy); g.lineCap = 'round';
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.strokeStyle = i < lit ? (sov ? '#ffffff' : TKG) : 'rgba(255,255,255,0.18)'; g.lineWidth = i % 3 === 0 ? 3 : 2; g.beginPath(); g.moveTo(Math.sin(a) * 13, -Math.cos(a) * 13); g.lineTo(Math.sin(a) * 19, -Math.cos(a) * 19); g.stroke(); }
  const h = (F.time || 0) / 100 * TAU; g.strokeStyle = '#ffffff'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(h) * 11, -Math.cos(h) * 11); g.stroke();
  g.strokeStyle = TK; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(t * 0.1) * 15, -Math.cos(t * 0.1) * 15); g.stroke();
  g.restore();
};
TOKINE.howTo = {
  title: 'TOKINE',
  draw(g) {
    xpHowTo(g, 'TOKINE — THE NIGHTMARE CLOCK', TK, [
      ['TIME', 'Bet +6, Stop +8, clone hits +3, Point Blank +2, hastened hit +3, interrupts +8, a rewind that slips an attack +6. At 100 → TIME SOVEREIGNTY (7 s).'],
      ['SOVEREIGNTY', 'Half Time costs, longer clones, Temporal Clone also attacks from behind, Echoes gets a 4th clone, longer slow/haste. Then Time = 20.'],
      ['SP1', 'First Hour: Haste — 2.5 s faster walk and recovery, burst forward. No invulnerability.'],
      ['↓→ SP1', 'Second Hour: Slow — red bullet (~540 px): short slow on walk and recovery.'],
      ['↓← SP1', 'Temporal Clone (15 Time) — a clone stays and attacks after a delay while she glides away (hold → forward). Clones can be shattered.'],
      ['SP2', 'Seventh Hour: Stop (30 Time) — readable 22 f startup, bullet; very short time stop on hit (not again for 4 s).'],
      ['↓→ SP2', 'Eighth Hour: Echoes (40 Time) — clones in front, above and behind fire and strike in a fixed order. Max 4 clones at once.'],
      ['↓↓ SP2', 'Fourth Hour: Rewind (20 Time) — marks her spot; ~1.3 s later she returns there (not while being hit).'],
    ], 'Spend Time now for pressure, or save it for Stop, Echoes and Sovereignty. Clone → Bet → Stop is her bread and butter. Ultimate (SP1+SP2): ENDLESS NIGHTMARE.');
  },
};

CHARS.push(TOKINE);
finalizeMoves(TOKINE);
