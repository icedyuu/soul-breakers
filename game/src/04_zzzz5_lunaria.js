// ============================ LUNARIA — THE MOON SOVEREIGN ============================
// Dark mage / zoner / control. A calm, imperious queen of the night in midnight armour with a star-flecked mane,
// silver crescent crown and a cape full of night sky. Original humanoid design on the chibi kit.
// Systems: LUNAR POWER (lunar hits, shadow hits, controlling space) → ECLIPSE FORM · CELESTIAL DOMINION buff ·
//          Lunar Chains bind · Nightfall zone · Eclipse Spear.
const LUN_ECL_T = 420, LUN_DOM_T = 300;
const LC = '#7ff0ff', LC2 = '#3aa8e8', LSIL = '#dfe8ff', LNAVY = '#0c1030', LVIO = '#5a2aa0';

// ---------------------------------- art ----------------------------------
function lunPal(base, lv, dom) {
  const p = { ...base, lunLv: lv, dom: !!dom, ecl: lv >= 2 };
  if (lv >= 2) Object.assign(p, { hair: '#121638', hair2: '#232a62', armor: '#0a0a16', top: '#0e0e1c', uarm: '#0e0e1c', eye: '#c8fbff', accent: '#9ffcff', cape: '#05050e' });
  if (dom) Object.assign(p, { eye: '#d8ffff', accent: '#bffcff' });
  return p;
}
function lunStar(g, x, y, s) { g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 0.28, y - s * 0.28); g.lineTo(x + s, y); g.lineTo(x + s * 0.28, y + s * 0.28); g.lineTo(x, y + s); g.lineTo(x - s * 0.28, y + s * 0.28); g.lineTo(x - s, y); g.lineTo(x - s * 0.28, y - s * 0.28); g.closePath(); g.fill(); }
function lunCrescent(g, x, y, R, rot, th = 0.42) {   // filled crescent path
  g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.arc(0, 0, R, -Math.PI / 2, Math.PI / 2); g.arc(-R * th, 0, R * Math.hypot(1, th) * 0.92, Math.PI / 2 - 0.36, -Math.PI / 2 + 0.36, true); g.closePath(); g.restore();
}
function lunFace(g, r, c, o) {
  const e = o.expr || 'normal';
  if (e === 'hurt' || e === 'ko') { chibiFace(g, r, c, o); return; }
  const ex = 0.5 * r, ey = 0.25 * r, fx = 0.94 * r;
  g.save(); g.lineCap = 'round';
  g.fillStyle = 'rgba(120,140,255,0.16)'; g.beginPath(); g.ellipse(0.34 * r, 0.58 * r, 0.13 * r, 0.05 * r, 0, 0, TAU); g.fill();
  // dark violet eyeshadow
  g.fillStyle = 'rgba(80,40,150,0.35)'; g.beginPath(); g.ellipse(ex, ey - 0.3 * r, 0.3 * r, 0.14 * r, 0, 0, TAU); g.fill();
  if (e === 'closed') { g.strokeStyle = OUTLINE; g.lineWidth = 0.07 * r; g.beginPath(); g.moveTo(ex - 0.2 * r, ey + 0.04 * r); g.quadraticCurveTo(ex, ey + 0.12 * r, ex + 0.2 * r, ey + 0.02 * r); g.stroke(); }
  else {
    for (const [x, w, h, far] of [[fx, 0.075, 0.3, true], [ex, 0.23, 0.36, false]]) {
      chibiEye(g, x, ey - (far ? 0.01 * r : 0), w * r, h * r, c, { glow: o.glow || c.ecl || c.dom }, far);
      // slit pupil + royal half-lowered lid
      g.fillStyle = '#04101e'; g.beginPath(); g.ellipse(x + w * r * 0.1, ey, w * r * 0.16, h * r * 0.5, 0, 0, TAU); g.fill();
      g.fillStyle = c.skin; g.beginPath(); g.moveTo(x - w * r * 1.35, ey - h * r * 1.3); g.lineTo(x + w * r * 1.35, ey - h * r * 1.3); g.lineTo(x + w * r * 1.25, ey - h * r * 0.5); g.quadraticCurveTo(x, ey - h * r * 0.66, x - w * r * 1.25, ey - h * r * 0.52); g.closePath(); g.fill();
      g.strokeStyle = OUTLINE; g.lineWidth = Math.max(1.6, h * r * 0.22); g.beginPath(); g.moveTo(x - w * r * 1.2, ey - h * r * 0.52); g.quadraticCurveTo(x, ey - h * r * 0.68, x + w * r * 1.15, ey - h * r * 0.46); g.stroke();
      if (!far) { g.lineWidth = Math.max(1.1, h * r * 0.13); g.beginPath(); g.moveTo(x - w * r * 1.05, ey - h * r * 0.55); g.lineTo(x - w * r * 1.7, ey - h * r * 0.85); g.stroke(); }
    }
    if (c.ecl || c.dom) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5 + 0.2 * Math.sin((o.T || 0) * 0.2); const gr = g.createRadialGradient(ex, ey, 0, ex, ey, 0.5 * r); gr.addColorStop(0, 'rgba(160,250,255,0.8)'); gr.addColorStop(1, 'rgba(60,160,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(ex, ey, 0.5 * r, 0, TAU); g.fill(); g.restore(); }
  }
  g.strokeStyle = c.brow; g.lineWidth = 0.045 * r; g.beginPath(); g.moveTo(ex - 0.24 * r, ey - 0.5 * r); g.quadraticCurveTo(ex, ey - 0.6 * r, ex + 0.26 * r, ey - 0.54 * r); g.stroke();
  const mx = 0.72 * r, my = 0.72 * r; g.strokeStyle = OUTLINE; g.lineWidth = 0.04 * r; g.beginPath();
  if (e === 'grin' || e === 'shout') { g.moveTo(mx - 0.08 * r, my - 0.01 * r); g.quadraticCurveTo(mx, my + 0.05 * r, mx + 0.08 * r, my - 0.03 * r); }   // a cold smile — she never shouts
  else { g.moveTo(mx - 0.05 * r, my + 0.01 * r); g.lineTo(mx + 0.06 * r, my); }
  g.stroke();
  g.fillStyle = '#4a2a7a'; g.beginPath(); g.ellipse(mx + 0.01 * r, my + 0.012 * r, 0.05 * r, 0.014 * r, 0, 0, TAU); g.fill();   // dark lip
  g.restore();
}
function lunCape(g, sk, c, R, o) {   // long flowing cape; its inner side is the night sky
  const T = o.T || 0, dom = c.dom ? 2.2 : 1, sw = Math.sin(T * 0.05) * 5 * dom, sw2 = Math.sin(T * 0.05 + 1.3) * 7 * dom, n = sk.neck, h = sk.hip;
  const top = [n[0] - 2, n[1] + 2], sh = [n[0] - 22, n[1] + 8], gnd = Math.max(sk.bf[1], sk.ff[1]) - 4;
  const hemB = [h[0] - 52 + sw2, gnd - 4], hemM = [h[0] - 30 + sw, gnd + 6], hemF = [h[0] - 6 + sw * 0.5, gnd - 10];
  poly(g, [top, sh, [h[0] - 40 + sw2 * 0.6, h[1]], hemB, [h[0] - 40 + sw * 0.8, gnd - 12], hemM, [h[0] - 18 + sw * 0.6, gnd - 2], hemF, [h[0] + 2, h[1] + 4], [n[0] + 10, n[1] + 6]], R.mono || c.cape, R, 3);
  if (R.mono) return;
  g.save(); g.beginPath(); g.moveTo(...sh); g.lineTo(h[0] - 40 + sw2 * 0.6, h[1]); g.lineTo(...hemB); g.lineTo(...hemM); g.lineTo(h[0] - 14, h[1] + 4); g.closePath(); g.clip();
  const gr = g.createLinearGradient(0, n[1], 0, gnd); gr.addColorStop(0, '#141a4a'); gr.addColorStop(1, '#2a1a5a'); g.fillStyle = gr; g.fillRect(h[0] - 80, n[1], 110, gnd - n[1] + 10);
  g.fillStyle = '#dff6ff'; for (let i = 0; i < 9; i++) { const x = h[0] - 60 + ((i * 23) % 50) + sw * 0.5, y = n[1] + 14 + ((i * 37) % (gnd - n[1] - 10)), tw = 0.6 + 0.4 * Math.sin(T * 0.08 + i * 1.7); g.globalAlpha = tw; lunStar(g, x, y, 1.6 + (i % 3)); }
  g.restore();
  g.strokeStyle = c.silver; g.lineWidth = 1.6; g.beginPath(); g.moveTo(...hemB); g.lineTo(h[0] - 40 + sw * 0.8, gnd - 12); g.lineTo(...hemM); g.lineTo(h[0] - 18 + sw * 0.6, gnd - 2); g.lineTo(...hemF); g.stroke();
}
function lunWings(g, sk, c, R, o) {   // small dark feathered wings with icy tips (kit wings, recoloured)
  featherWings(g, sk, c, R, o, 0.85);
}
function lunHalo(g, sk, c, R, o) {   // Eclipse Form: a dark crescent symbol behind her head
  if (R.mono || !c.ecl) return;
  const [hx, hy] = sk.head, T = o.T || 0;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5 + 0.15 * Math.sin(T * 0.1);
  g.fillStyle = 'rgba(120,230,255,0.25)'; g.beginPath(); g.arc(hx - 8, hy - 4, 46, 0, TAU); g.fill(); g.restore();
  g.save(); g.fillStyle = '#06061a'; g.strokeStyle = LC; g.lineWidth = 2.4; lunCrescent(g, hx - 8, hy - 4, 42, -0.5, 0.5); g.fill(); g.stroke(); g.restore();
}
function lunHandGlow(g, sk, p, c, R) {
  if (!(p.pw > 0.3) || R.mono) return;
  const [hx, hy] = sk.fh, k = p.pw, t = BT ? BT.pf : 0;
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(hx, hy, 0, hx, hy, 16 * k); gr.addColorStop(0, 'rgba(230,255,255,0.9)'); gr.addColorStop(0.5, 'rgba(110,230,255,0.5)'); gr.addColorStop(1, 'rgba(60,120,255,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(hx, hy, 16 * k, 0, TAU); g.fill();
  g.fillStyle = '#ffffff'; lunStar(g, hx + Math.sin(t * 0.2) * 6, hy - 10, 2.5 * k);
  g.restore();
}

// ---------------------------------- character ----------------------------------
const LUNARIA = {
  id: 'lunaria', name: 'LUNARIA', jp: 'ルナリア', title: 'The Moon Sovereign', titleJp: '月の女王',
  style: 'DARK MAGE / ZONER', desc: 'Ruler of the night. Crescents, moon-chains, an Eclipse Spear and Nightfall control mid range, but she hates being rushed down.',
  stats: { power: 4, speed: 2, range: 5, defense: 3 },
  scale: 1.0, health: 950, walk: 3.6, backWalk: 3.7, jumpV: -16.5, jumpX: 4.2, dashV: 10.5, backdashV: 11, backdashInv: 12, juggleMax: 6,
  voicePitch: 0.78, voiceRate: 0.8,
  colors: {
    skin: '#f1e6f0', hair: '#1c2452', hair2: '#33407e', top: '#161a3a', leg: '#151832', boot: '#10122a', foot: '#10122a', uarm: '#161a3a', farm: '#232a52', hand: '#1a1a2e', cuff: '#cfd8f0', belt: '#cfd8f0',
    eye: LC, eye2: '#0a2a5a', accent: LC, brow: '#2a3060', warm: '#1e2244', sole: '#3a2a7a', pad: LC2, collar: '#cfd8f0',
    armor: '#1a1f44', silver: '#cfd8f0', cape: '#0a0c22', gown: '#1a1438', gown2: '#2a1f5a', wing: '#1c2052', wingAlt: '#262c66', wing2: '#12153a', wingTip: LC2,
    lunLv: 0, dom: false, ecl: false,
  },
  afterColors: [LC2, '#2a1f5a', '#0c1030'],
  stance: { t: -0.08, hd: -0.04, fa1: 0.4, fa2: 0.75, ba1: -0.25, ba2: -0.1, fl1: 0.12, fl2: 0.03, bl1: -0.12, bl2: -0.04, pw: 0 },
  poses: {
    skyglance: { t: -0.12, hd: -0.38, fa1: 0.4, fa2: 0.75, ba1: -0.25, ba2: -0.1 },
    cast_w: { t: -0.1, hd: -0.05, fa1: 1.1, fa2: 2.2, ba1: -0.3, ba2: -0.1, pw: 1 },
    cast: { t: 0.04, hd: 0.02, fa1: 1.5, fa2: 1.55, ba1: -0.3, ba2: -0.1, fl1: 0.22, fl2: 0.05, bl1: -0.18, bl2: -0.05, pw: 1 },
    raise: { t: -0.14, hd: -0.3, fa1: 2.85, fa2: 3.0, ba1: -0.3, ba2: -0.1, fl1: 0.12, fl2: 0.03, bl1: -0.12, bl2: -0.04, pw: 1 },
    spear_w: { t: -0.16, hd: -0.15, fa1: 2.6, fa2: 2.2, ba1: 0.5, ba2: 1.2, fl1: 0.1, fl2: 0.02, bl1: -0.3, bl2: -0.1, pw: 1 },
    spear: { t: 0.14, hd: 0.06, fa1: 1.55, fa2: 1.4, ba1: -0.6, ba2: -0.4, fl1: 0.4, fl2: 0.1, bl1: -0.35, bl2: -0.15, pw: 1 },
    chain_w: { t: -0.04, fa1: 0.6, fa2: 0.4, ba1: -0.3, ba2: -0.1, pw: 1 },
    chain: { t: 0.02, hd: 0.08, fa1: 1.2, fa2: 2.6, ba1: -0.3, ba2: -0.1, pw: 1 },
    veil: { t: 0.1, hd: 0.1, fa1: 0.9, fa2: 2.7, ba1: -0.6, ba2: -0.4, pw: 0 },
    dominion: { t: -0.2, hd: -0.4, fa1: 2.4, fa2: 2.6, ba1: -1.9, ba2: -2.2, fl1: 0.1, fl2: 0.02, bl1: -0.1, bl2: -0.02, pw: 1 },
    victory: { t: -0.14, hd: 0.3, fa1: 0.35, fa2: 1.9, ba1: -0.3, ba2: -0.15, fl1: 0.1, fl2: 0.02, bl1: -0.06, bl2: -0.02 },
    defeat: { t: 0.32, hd: -0.05, fa1: 0.2, fa2: 0.2, ba1: 0.3, ba2: 0.1, fl1: 1.35, fl2: 0.0, bl1: 0.25, bl2: -1.45 },
    intro: { t: -0.12, hd: -0.3, fa1: 2.85, fa2: 3.0, ba1: -0.3, ba2: -0.1, pw: 1 },
  },
  intro: 'Kneel before the night. It has always been mine.',
  wins: ['The night is eternal. You were merely a passing day.', 'Bow. The moon is watching.', 'Such light… so easily extinguished.'],
  ropes: [
    { id: 'mane', at: (sk, r) => headPt(sk, -r * 1.2, r * 1.3), n: 8, seg: 10, w0: 13, w1: 4, color: 'hair', grav: 0.5, wind: 0.6 },
  ],
  hairBack(g, r, c, R, o) {
    const T = (o && o.T) || 0, w = Math.sin(T * 0.05) * 0.08;
    polyR(g, r, [[0.62, -0.92], [0.0, -1.24], [-0.8, -1.08], [-1.24, -0.5], [-1.34, 0.4], [-1.46 + w, 1.3], [-1.6 + w, 2.3], [-1.36 + w, 2.9], [-1.14, 2.4], [-0.92 + w, 3.1], [-0.7, 2.3], [-0.46 + w, 2.7], [-0.36, 1.7], [-0.12, 1.0], [0.1, 0.5]], c.hair, R);
    if (R.mono) return;
    g.strokeStyle = c.hair2; g.lineWidth = 0.08 * r; g.lineCap = 'round';
    for (const x of [-1.2, -0.92, -0.62]) { g.beginPath(); g.moveTo(x * r, 0.1 * r); g.quadraticCurveTo((x - 0.16 + w) * r, 1.3 * r, (x + 0.02 + w) * r, 2.4 * r); g.stroke(); }
    // star highlights in the mane
    g.fillStyle = '#e8fbff'; for (let i = 0; i < 6; i++) { const x = [-1.2, -0.9, -0.6, -1.3, -0.8, -1.05][i], y = [0.4, 1.1, 1.8, 1.6, 2.5, 2.2][i], tw = 0.5 + 0.5 * Math.sin(T * 0.09 + i * 2.1); g.globalAlpha = 0.4 + 0.6 * tw; lunStar(g, (x + w) * r, y * r, (0.06 + 0.05 * tw) * r); }
    g.globalAlpha = 1;
  },
  hairFront(g, r, c, R, o) {
    polyR(g, r, [[-0.3, -0.98], [-0.86, -0.72], [-1.08, -0.2], [-1.08, 0.5], [-0.86, 0.86], [-0.5, 0.66], [-0.36, 0.1], [-0.2, -0.4]], c.hair, R);
    // long side lock
    polyR(g, r, [[-0.1, -0.3], [0.06, 0.5], [0.0, 1.5], [-0.2, 2.2], [-0.36, 1.4], [-0.5, 0.3]], c.hair, R);
    // swept, parted fringe
    polyR(g, r, [[-0.36, -0.96], [0.3, -1.04], [0.96, -0.76], [1.16, -0.2], [1.06, 0.1], [0.92, -0.16], [0.78, 0.02], [0.62, -0.3], [0.36, -0.2], [0.2, -0.56]], c.hair, R);
    if (R.mono) return;
    g.strokeStyle = c.hair2; g.lineWidth = 0.05 * r; g.beginPath(); g.moveTo(0.4 * r, -0.95 * r); g.quadraticCurveTo(0.6 * r, -0.5 * r, 0.9 * r, -0.2 * r); g.stroke();
    shine(g, r, [[-0.2, -0.86], [0.42, -0.88]], R);
    // silver crown: a band, a crescent and a slender horn-like spire
    g.save(); g.lineJoin = 'round';
    g.fillStyle = '#0a0c22'; g.strokeStyle = OUTLINE; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(-0.7 * r, -0.86 * r); g.quadraticCurveTo(0.1 * r, -1.22 * r, 0.82 * r, -0.86 * r); g.lineTo(0.76 * r, -0.72 * r); g.quadraticCurveTo(0.1 * r, -1.06 * r, -0.66 * r, -0.72 * r); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = c.silver; g.lineWidth = 0.05 * r; g.beginPath(); g.moveTo(-0.66 * r, -0.8 * r); g.quadraticCurveTo(0.1 * r, -1.16 * r, 0.8 * r, -0.8 * r); g.stroke();
    g.fillStyle = c.silver; g.strokeStyle = OUTLINE; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(0.3 * r, -1.08 * r); g.quadraticCurveTo(0.42 * r, -1.6 * r, 0.62 * r, -1.98 * r); g.quadraticCurveTo(0.5 * r, -1.55 * r, 0.5 * r, -1.06 * r); g.closePath(); g.fill(); g.stroke();   // the spire
    g.beginPath(); g.moveTo(-0.3 * r, -1.0 * r); g.lineTo(-0.38 * r, -1.36 * r); g.lineTo(-0.16 * r, -1.08 * r); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#e6eeff'; lunCrescent(g, 0.1 * r, -1.22 * r, 0.17 * r, -0.4, 0.55); g.fill(); g.stroke();
    if (FX.hq) { g.shadowColor = LC; g.shadowBlur = 8; } g.fillStyle = c.ecl ? '#d8ffff' : LC; g.beginPath(); g.arc(0.1 * r, -1.03 * r, 0.06 * r, 0, TAU); g.fill();
    g.restore();
  },
  neckWear(g, sk, p, c, R) {
    const n = sk.neck;   // silver gorget with a moonstone
    poly(g, [[n[0] - 14, n[1] + 10], [n[0] - 11, n[1] - 6], [n[0] + 9, n[1] - 9], [n[0] + 13, n[1] + 7], [n[0] + 2, n[1] + 12]], c.silver, R, 3);
    if (R.mono) return;
    g.fillStyle = '#0a0c22'; g.beginPath(); g.moveTo(n[0] - 9, n[1] + 4); g.lineTo(n[0] + 9, n[1] + 2); g.lineTo(n[0] + 2, n[1] + 10); g.closePath(); g.fill();
    g.save(); if (FX.hq) { g.shadowColor = LC; g.shadowBlur = 8; } g.fillStyle = c.ecl ? '#d8ffff' : LC; g.beginPath(); g.arc(n[0] + 2, n[1] + 5, 2.4, 0, TAU); g.fill(); g.restore();
  },
  torsoDetail(g, L, bw, c) {   // breastplate with silver trim and a crescent emblem
    g.fillStyle = c.armor; g.beginPath(); g.moveTo(-13 * bw, -L + 4); g.lineTo(13 * bw, -L + 2); g.lineTo(11 * bw, -L * 0.35); g.lineTo(0, -L * 0.22); g.lineTo(-11 * bw, -L * 0.35); g.closePath(); g.fill();
    g.strokeStyle = c.silver; g.lineWidth = 1.6; g.stroke();
    g.fillStyle = c.silver; lunCrescent(g, 3 * bw, -L * 0.62, 5, -0.4, 0.55); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(-10 * bw, -L + 6, 6 * bw, L * 0.3);
  },
  torsoOver(g, L, bw, c, R) { if (R.mono) return; g.fillStyle = c.silver; g.fillRect(-13 * bw, -5, 26 * bw, 4); g.fillStyle = LC; g.fillRect(-2, -5, 4, 4); },
  drawSkirt(g, sk, p, c, R, o) {   // layered gown skirt, dark violet with a silver hem and star dust
    const T = o.T || 0, fl = Math.sin(T * 0.06) * 3;
    const hb = [sk.hip[0] - 16, sk.hip[1] - 7], hf = [sk.hip[0] + 15, sk.hip[1] - 7];
    const kb = [lerp(sk.hip[0], sk.bk[0], 0.85) - 18 + fl, lerp(sk.hip[1], sk.bk[1], 0.85) + 10], kf = [lerp(sk.hip[0], sk.fk[0], 0.85) + 16, lerp(sk.hip[1], sk.fk[1], 0.85) + 8];
    const hem = [(kb[0] + kf[0]) / 2, Math.max(kb[1], kf[1]) + 6 - fl];
    poly(g, [hb, kb, hem, kf, hf], R.mono || c.gown, R, 3);
    if (R.mono) return;
    g.fillStyle = c.gown2; g.beginPath(); g.moveTo(hf[0] - 4, hf[1]); g.lineTo(kf[0], kf[1]); g.lineTo(lerp(hem[0], kf[0], 0.4), hem[1] - 2); g.closePath(); g.fill();
    g.strokeStyle = c.silver; g.lineWidth = 1.6; g.beginPath(); g.moveTo(...kb); g.lineTo(...hem); g.lineTo(...kf); g.stroke();
    g.fillStyle = 'rgba(220,240,255,0.7)'; for (let i = 0; i < 4; i++) { const k = (i + 0.5) / 4, P = lerpP(lerpP(hb, hf, k), lerpP(kb, kf, k), 0.6); lunStar(g, P[0], P[1], 1.5); }
    g.strokeStyle = c.silver; g.lineWidth = 3; g.beginPath(); g.moveTo(...hb); g.lineTo(...hf); g.stroke();
  },
  shoulderOver(g, sk, p, c, R) {   // pauldron on the front shoulder
    const [x, y] = sk.sF; ell(g, x + 1, y + 2, 10, 7, R.mono || c.armor, R);
    if (!R.mono) { g.strokeStyle = c.silver; g.lineWidth = 1.6; g.beginPath(); g.ellipse(x + 1, y + 2, 10, 7, 0, Math.PI, TAU); g.stroke(); }
  },
  weaponBack(g, sk, p, c, R, o) { lunHalo(g, sk, c, R, o); lunCape(g, sk, c, R, o); lunWings(g, sk, c, R, o); },
  weaponFront(g, sk, p, c, R) { lunHandGlow(g, sk, p, c, R); },
};
makeChibi(LUNARIA, { build: { arm: 0.98, leg: 1.03, torso: 1.04 }, colors: {} });
LUNARIA.faceFn = lunFace;
LUNARIA.drawBoot = (g, K, F, c, R, back, b) => {   // the kit's platform boots, plus a silver greave
  chunkyBoot(g, K, F, c, R, back, b);
  if (R.mono) return; const M = lerpP(K, F, 0.45); g.strokeStyle = c.silver; g.lineWidth = 2; g.beginPath(); g.moveTo(M[0] - 7, M[1]); g.lineTo(M[0] + 8, M[1] - 2); g.stroke();
  g.fillStyle = c.silver; g.beginPath(); g.moveTo(K[0] + 4, K[1] - 4); g.lineTo(K[0] + 13, K[1] + 4); g.lineTo(K[0] + 3, K[1] + 7); g.closePath(); g.fill();
};

// ---------------------------------- lunar power ----------------------------------
const LUN_PALS = [0, 1].map(k => lunPal(LUNARIA.colors, k, false)), LUN_PAL_E = lunPal(LUNARIA.colors, 2, false), LUN_PAL_D = [0, 1].map(k => lunPal(LUNARIA.colors, k, true)), LUN_PAL_ED = lunPal(LUNARIA.colors, 2, true);
const lunLvl = F => F.eclT > 0 ? 2 : (F.lun || 0) >= 50 ? 1 : 0;
LUNARIA.palette = F => { const lv = lunLvl(F), d = F.domT > 0; return lv >= 2 ? (d ? LUN_PAL_ED : LUN_PAL_E) : d ? LUN_PAL_D[lv] : LUN_PALS[lv]; };
function lunGain(F, n) {
  if (F.ko || F.eclT > 0) return;
  if (n > 0 && F.domT > 0) n *= 2;
  F.lun = clamp((F.lun || 0) + n, 0, 100); if (n > 0) F.lunT = F.T;
}
const lunInNight = (F, D) => { const p = F.nightP; return !!(p && !p.dead && p.delay <= 0 && Math.abs(D.x - p.x) < p.w / 2); };
function lunHitGain(A, D, n) { lunGain(A, n + (lunInNight(A, D) ? 4 : 0)); }   // controlling space pays: +4 when the foe is inside her Nightfall
function lunEclipse(F) {
  F.eclT = LUN_ECL_T; F.lun = 100;
  FX.ring(F.x, F.y - 110, LC, 20, 320, 26, 6); FX.ring(F.x, F.y - 110, LSIL, 10, 150, 18, 3); FX.flashScreen('#061030', 16, 0.55);
  FX.wtext(F.x, F.y - 255, 'ECLIPSE FORM', { size: 38, color: '#ffffff', stroke: '#0a2a6a', life: 64 });
  FX.wtext(F.x, F.y - 215, '— 蝕の姿 —', { size: 22, font: FX_JP(), color: '#cff8ff', stroke: LNAVY, life: 64 });
  Sound.play('chime'); Sound.play('charge');
}
LUNARIA.initFighter = F => { F.lun = 0; F.lunT = -999; F.eclT = 0; F.domT = 0; F.nightP = null; F.moonT = 0; };
LUNARIA.onDealDamage = (A) => { if (!A.ko && A.state !== 'cine') lunGain(A, 2); };
LUNARIA.idlePose = F => { const k = F.T % 480; return k > 380 && k < 440 ? 'skyglance' : null; };
LUNARIA.tick = F => {
  const O = F.opp; if (!O) return;
  const live = BT && BT.phase === 'fight' && !F.ko;
  if (F.moonT > 0) F.moonT--;
  if (F.hidden && F.state !== 'cine' && !(F.state === 'attack' && F.moveKey === 'sp1f')) F.hidden = false;
  if (F.domT > 0) {
    F.domT--;
    if (F.T % 5 === 0) FX.p({ type: 'spark', x: F.x + rand(-40, 40), y: F.y - rand(20, 190), vx: 0, vy: -rand(0.2, 0.8), life: 30, size: rand(1.5, 2.5), color: pick([LC, LSIL]) });
  }
  if (F.eclT > 0) {
    F.eclT--; F.lun = 100 * F.eclT / LUN_ECL_T;
    for (const k of ['sp1', 'sp1f', 'counter']) if (F.cd[k] > 0 && F.T % 4 === 0) F.cd[k]--;   // SP1 cooldowns ×0.75
    if (F.T % 4 === 0) FX.p({ type: 'ember', x: F.x + rand(-36, 36), y: F.y - rand(10, 180), vx: 0, vy: -rand(0.4, 1.2), life: 30, size: rand(1.5, 3), color: pick([LC, LVIO, '#1a1a40']), add: F.T % 8 === 0 });
  } else if (live) {
    if (F.T - F.lunT > 240 && F.lun > 0 && F.state !== 'cine') F.lun = Math.max(0, F.lun - 0.1);
    if (F.lun >= 100) lunEclipse(F);
  }
  // idle: drifting moon-dust; walking: a soft shadow trails her
  if (F.state === 'idle' && F.T % 30 === 0) FX.p({ type: 'spark', x: F.x + rand(-40, 40), y: F.y - rand(60, 200), vx: 0, vy: -0.3, life: 40, size: 1.8, color: LSIL });
  if (F.state === 'walk' && F.T % 5 === 0) FX.p({ type: 'smoke', x: F.x - F.vx * 3, y: F.y - rand(4, 30), vx: -F.vx * 0.2, vy: 0, life: 18, size: rand(8, 13), grow: 0.4, color: 'rgba(20,20,60,0.35)', add: false });
  // Lunar Chains hold the victim in place
  if (O.chainT > 0) { O.chainT--; if (O.state !== 'hit' || (BT && BT.cine)) O.chainT = 0; else { O.vx = O.chainPull ? F.facing * -1.2 : 0; if (O.y < GROUND) O.vy = Math.max(O.vy, 1); } }
  if (F.nightP && F.nightP.dead) F.nightP = null;
};
LUNARIA.drawExtra = (g, F) => {
  const O = F.opp, T = F.T;
  if (O && O.chainT > 0 && !O.hidden) lunChains(g, O.x, GROUND, O.y - 100 * O.s, T, 1);
  // a crescent moon behind her when she wins, and the moon lingering after Eternal Night
  const moonA = F.state === 'victory' ? Math.min(1, (F.sf || 60) / 40) : F.moonT > 0 ? Math.min(1, F.moonT / 60) : 0;
  if (moonA > 0) {
    g.save(); g.globalAlpha = moonA * 0.8; g.globalCompositeOperation = 'lighter';
    const x = F.x - F.facing * 30, y = F.y - 270, gr = g.createRadialGradient(x, y, 10, x, y, 110); gr.addColorStop(0, 'rgba(200,240,255,0.5)'); gr.addColorStop(1, 'rgba(60,120,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, 110, 0, TAU); g.fill();
    g.fillStyle = '#e8f6ff'; lunCrescent(g, x, y, 54, -0.5 * F.facing, 0.5); g.fill(); g.restore();
  }
  if (F.state === 'attack' && F.moveKey === 'ult' && F.mf > F.move.st && F.mf <= F.move.st + F.move.act + 4) {   // the ult's shadow tide
    const k = (F.mf - F.move.st) / F.move.act, x0 = F.x + F.facing * 20, x1 = F.x + F.facing * (40 + 400 * Math.min(1, k));
    g.save(); g.fillStyle = 'rgba(8,6,30,0.75)'; g.beginPath(); g.moveTo(x0, GROUND); for (let i = 0; i <= 12; i++) { const x = lerp(x0, x1, i / 12); g.lineTo(x, GROUND - 30 - Math.abs(Math.sin(i * 1.3 + T * 0.4)) * 50 * (1 - i / 14)); } g.lineTo(x1, GROUND); g.closePath(); g.fill(); g.restore();
  }
};
LUNARIA.introFx = F => {
  FX.ring(F.x, F.y - 110, LC, 10, 240, 30, 3); FX.darkTarget = 0; F.moonT = 120;
  for (let i = 0; i < 18; i++) FX.p({ type: 'spark', x: F.x + rand(-70, 70), y: F.y - rand(20, 220), vx: 0, vy: -rand(0.2, 0.8), life: 60, size: rand(1.5, 2.5), color: pick([LC, LSIL]) });
  Sound.play('chime');
};

// ---------------------------------- effects / projectiles ----------------------------------
function lunChains(g, x, gy, ty, t, a) {   // chains of moonlight and darkness rising from the ground and wrapping the victim
  g.save(); g.globalAlpha = a; g.lineCap = 'round';
  for (const [ox, sw] of [[-46, 1], [46, -1], [-20, -1], [24, 1]]) {
    const x0 = x + ox, cx = x + ox * 0.3, links = 9;
    for (let i = 0; i < links; i++) {
      const k = i / (links - 1), px = lerp(x0, cx + Math.sin(k * Math.PI + t * 0.1) * 10 * sw, k), py = lerp(gy, ty + 30 * sw, k), ang = Math.atan2(ty - gy, cx - x0) + (i % 2 ? Math.PI / 2 : 0);
      g.save(); g.translate(px, py); g.rotate(ang); g.strokeStyle = '#0c1440'; g.lineWidth = 5; g.beginPath(); g.ellipse(0, 0, 7, 3.6, 0, 0, TAU); g.stroke();
      g.strokeStyle = i % 2 ? LC : LSIL; g.lineWidth = 2; g.stroke(); g.restore();
    }
  }
  g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(127,240,255,0.5)'; g.lineWidth = 3; g.beginPath(); g.ellipse(x, ty + 10, 42, 12, 0, 0, TAU); g.stroke();
  g.restore();
}
function lunRune(g, x, y, R, rot, a, col = LC) {   // a lunar sigil: rings, crescents, ticks
  g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = 2;
  g.beginPath(); g.arc(0, 0, R, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, R * 0.72, 0, TAU); g.stroke();
  for (let i = 0; i < 4; i++) { g.save(); g.rotate(i * Math.PI / 2); g.fillStyle = col; lunCrescent(g, R * 0.86, 0, R * 0.12, 0, 0.5); g.fill(); g.restore(); }
  for (let i = 0; i < 24; i++) { const b = i * TAU / 24; g.beginPath(); g.moveTo(Math.cos(b) * R * 0.72, Math.sin(b) * R * 0.72); g.lineTo(Math.cos(b) * R * (i % 3 ? 0.66 : 0.58), Math.sin(b) * R * (i % 3 ? 0.66 : 0.58)); g.stroke(); }
  g.fillStyle = col; lunCrescent(g, 0, 0, R * 0.42, 0.6, 0.45); g.fill();
  g.restore();
}
EXTRA_PROJ.crescent = {
  update(p) {
    if (p.boomer && p.t === 26) { p.vx = -p.vx; p.hits = Math.max(p.hits, 1); p.hitT = 0; }
    if (p.boomer && p.t > 30 && Math.abs(p.x - p.owner.x) < 30) p.dead = true;
    if (p.t % 2 === 0) FX.p({ type: 'spark', x: p.x - p.vx, y: p.y + rand(-14, 14), vx: -p.vx * 0.05, vy: rand(-0.3, 0.3), life: 20, size: rand(1.5, 2.8), color: pick([LC, LSIL, '#ffffff']) });
  },
  draw(g, p) {
    const d = Math.sign(p.vx) || 1, s = p.sz || 1; g.translate(p.x, p.y); g.scale(d, 1);
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35; g.fillStyle = LC2; g.beginPath(); g.ellipse(-6, 0, 30 * s, 40 * s, 0, 0, TAU); g.fill();
    g.globalAlpha = 1; const gr = g.createLinearGradient(-20 * s, 0, 24 * s, 0); gr.addColorStop(0, 'rgba(60,140,255,0.2)'); gr.addColorStop(0.6, LC); gr.addColorStop(1, '#ffffff');
    g.fillStyle = gr; lunCrescent(g, 0, 0, 34 * s, 0, 0.55); g.fill();
    g.globalAlpha = 0.6; g.strokeStyle = '#ffffff'; g.lineWidth = 1.5; lunCrescent(g, 0, 0, 34 * s, 0, 0.55); g.stroke();
  },
};
EXTRA_PROJ.veilShade = {   // the shadow left behind by Shadow Veil, which bursts
  rect: p => ({ x: p.x - p.w / 2, y: GROUND - p.h, w: p.w, h: p.h }),
  update(p) { if (!p.boom) { p.boom = 1; Sound.play('hiss'); FX.ring(p.x, GROUND - 90, LVIO, 10, 100, 12, 5); for (let i = 0; i < 12; i++) FX.p({ type: 'smoke', x: p.x + rand(-24, 24), y: GROUND - rand(20, 160), vx: rand(-2, 2), vy: -rand(0.5, 2), life: 22, size: rand(10, 16), grow: 0.6, color: 'rgba(16,14,50,0.6)', add: false }); } },
  draw(g, p) {
    if (p.delay > 0) {   // her lingering silhouette
      const F = p.owner, a = 0.25 + 0.3 * (p.delay / p.delay0);
      g.save(); g.globalAlpha = a; drawFigure(g, F.ch, p.pose || F.pose, p.x, GROUND, p.face || F.facing, { mono: '#10143a' }); g.restore();
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.4; g.strokeStyle = LC; g.lineWidth = 2; g.beginPath(); g.ellipse(p.x, GROUND, 40, 8, 0, 0, TAU); g.stroke();
      return;
    }
    g.globalAlpha = Math.min(1, p.life / 6); g.fillStyle = '#0a0a26';
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.3; g.beginPath(); g.moveTo(p.x - 8 + i * 2, GROUND); g.lineTo(p.x + Math.cos(a) * 110 * (p.big || 1), GROUND + Math.sin(a) * 140 * (p.big || 1)); g.lineTo(p.x + 8 + i * 2, GROUND); g.closePath(); g.fill(); }
    g.strokeStyle = LC; g.lineWidth = 1.2; g.stroke();
  },
};
EXTRA_PROJ.moonChains = {
  rect: p => ({ x: p.x - p.w / 2, y: GROUND - p.h, w: p.w, h: p.h }),
  delay(p) { if (p.t % 3 === 0) FX.p({ type: 'spark', x: p.x + rand(-40, 40), y: GROUND - rand(0, 8), vx: 0, vy: -rand(1, 3), life: 14, size: 2, color: LC }); },
  update(p) { if (!p.fired) { p.fired = 1; Sound.play('grab'); Sound.play('chime'); } },
  draw(g, p) {
    const k = p.delay > 0 ? 1 - p.delay / p.delay0 : 1;
    g.save(); g.translate(p.x, GROUND - 2); g.scale(1, 0.25); g.globalCompositeOperation = 'lighter'; lunRune(g, 0, 0, p.w * 0.6 * (0.5 + 0.5 * k), p.t * 0.05, p.delay > 0 ? 0.5 + 0.4 * Math.sin(p.t * 0.9) : 0.7); g.restore();
    if (p.delay <= 0) lunChains(g, p.x, GROUND, GROUND - 110, p.t, Math.min(1, p.life / 5));
  },
};
EXTRA_PROJ.eclipseSpear = {
  update(p) {
    if (p.t % 1 === 0) FX.p({ type: 'spark', x: p.x - p.vx * 2, y: p.y + rand(-8, 8), vx: -p.vx * 0.1, vy: rand(-0.5, 0.5), life: 16, size: rand(1.5, 3), color: pick([LC, LSIL, LVIO]) });
    if (p.t % 3 === 0) FX.p({ type: 'smoke', x: p.x - p.vx * 3, y: p.y, vx: 0, vy: 0, life: 14, size: 10, grow: 0.3, color: 'rgba(10,8,40,0.5)', add: false });
  },
  draw(g, p) { g.translate(p.x, p.y); g.scale(Math.sign(p.vx) || 1, 1); lunSpearShape(g, 1, p.t); },
};
function lunSpearShape(g, s, t) {   // dark core wrapped in blue-silver light
  g.save(); g.scale(s, s);
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; g.fillStyle = LC2; g.beginPath(); g.ellipse(-10, 0, 80, 18 + Math.sin(t * 0.6) * 3, 0, 0, TAU); g.fill();
  g.globalAlpha = 0.9; const gr = g.createLinearGradient(-90, 0, 60, 0); gr.addColorStop(0, 'rgba(120,220,255,0)'); gr.addColorStop(0.6, LC); gr.addColorStop(1, '#ffffff');
  g.fillStyle = gr; g.beginPath(); g.moveTo(-92, -7); g.lineTo(30, -10); g.lineTo(66, 0); g.lineTo(30, 10); g.lineTo(-92, 7); g.closePath(); g.fill();
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.fillStyle = '#05051a'; g.beginPath(); g.moveTo(-80, -3); g.lineTo(28, -5); g.lineTo(52, 0); g.lineTo(28, 5); g.lineTo(-80, 3); g.closePath(); g.fill();
  g.strokeStyle = LSIL; g.lineWidth = 1.5; g.beginPath(); g.moveTo(22, -14); g.quadraticCurveTo(36, 0, 22, 14); g.stroke();
  g.restore();
}
EXTRA_PROJ.nightfall = {
  rect: p => ({ x: p.x - p.w / 2, y: GROUND - p.h, w: p.w, h: p.h }),
  delay(p) { if (p.t % 2 === 0) FX.p({ type: 'spark', x: p.x + rand(-p.w / 2, p.w / 2), y: GROUND - rand(0, 160), vx: 0, vy: rand(0.5, 1.5), life: 20, size: 1.8, color: LSIL }); },
  update(p) {
    if (!p.fired) { p.fired = 1; Sound.play('hiss'); FX.ring(p.x, GROUND - 4, LC, 20, p.w * 0.6, 14, 4, 0.25); }
    if (p.t % 6 === 0) FX.p({ type: 'spark', x: p.x + rand(-p.w / 2, p.w / 2), y: GROUND - rand(20, 200), vx: 0, vy: -rand(0.2, 0.6), life: 30, size: rand(1.4, 2.4), color: pick([LC, LSIL, '#ffffff']) });
    if (p.hitT === p.interval) { Sound.play('spike'); }
    if (p.hitT === 0 && p.t > 10) { p.hs = 14; }   // after the first eruption, the periodic strikes are lighter
  },
  draw(g, p) {
    const arm = p.delay > 0, k = arm ? 1 - p.delay / p.delay0 : 1, fade = Math.min(1, p.life / 20), t = p.t, w = p.w;
    // darkened ground + dusk column
    const gr = g.createLinearGradient(0, GROUND - 260, 0, GROUND); gr.addColorStop(0, 'rgba(4,6,24,0)'); gr.addColorStop(1, `rgba(4,6,24,${0.55 * k * fade})`);
    g.fillStyle = gr; g.fillRect(p.x - w / 2, GROUND - 260, w, 260);
    g.fillStyle = `rgba(4,4,20,${0.6 * k * fade})`; g.beginPath(); g.ellipse(p.x, GROUND + 2, w * 0.56, 14, 0, 0, TAU); g.fill();
    g.save(); g.translate(p.x, GROUND - 2); g.scale(1, 0.22); g.globalCompositeOperation = 'lighter'; lunRune(g, 0, 0, w * 0.5 * (0.4 + 0.6 * k), t * 0.02, (arm ? 0.4 + 0.3 * Math.sin(t * 0.8) : 0.55) * fade); g.restore();
    if (arm) return;
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { const x = p.x + (i - 1) * w * 0.3, y = GROUND - 170 - (i % 2) * 30; g.globalAlpha = 0.35 * fade; g.fillStyle = LC; lunCrescent(g, x, y + Math.sin(t * 0.05 + i) * 6, 10, 0.4, 0.5); g.fill(); }
    // shadows moving along the ground
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 0.5 * fade; g.fillStyle = '#05051a';
    for (let i = 0; i < 4; i++) { const x = p.x - w / 2 + ((t * 2.2 + i * w / 4) % w); g.beginPath(); g.ellipse(x, GROUND - 4, 22, 5, 0, 0, TAU); g.fill(); }
    // the strike: shadow spikes when it hits
    if (p.hitT > p.interval - 8 && p.lastX != null) {
      const a = (p.hitT - (p.interval - 8)) / 8; g.globalAlpha = a * fade; g.fillStyle = '#080826'; g.strokeStyle = LC; g.lineWidth = 1.5;
      for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(p.lastX + i * 14 - 7, GROUND); g.lineTo(p.lastX + i * 16, GROUND - 120 + Math.abs(i) * 26); g.lineTo(p.lastX + i * 14 + 7, GROUND); g.closePath(); g.fill(); g.stroke(); }
    }
  },
};

// ---------------------------------- moves ----------------------------------
const lunTarget = (F, O, max) => { const d = O.x - F.x; return Math.abs(d) <= max ? O.x : F.x + F.facing * max; };
LUNARIA.moves = Object.assign(baseNormals({ dmg: 0.9, spd: 1, rng: 1.12 }), {
  sp1: {
    name: 'CRESCENT MOON', jp: '三日月', desc: 'A graceful flick releases a crescent of moonlight that leaves a trail of stars. Eclipse Form: twin crescents (high and low). Celestial Dominion: the crescent returns to her and can hit twice.', special: 1, lvl: 4,
    poses: ['cast_w', 'cast'], st: 12, act: 1, rec: 19, cd: 42, sfx: 'chime',
    spawn: { f: 12, fn(F) {
      const lv = lunLvl(F), dom = F.domT > 0;
      const mk = (dy, sz, dmg) => BT.spawn({ owner: F, kind: 'crescent', x: F.x + F.facing * 55, y: F.y - 115 + dy, vx: F.facing * 10.5, w: 46 * sz, h: 64 * sz, life: dom ? 60 : 46, hits: dom ? 2 : 1, interval: 12, persist: dom ? 1 : 0, boomer: dom, sz, dmg, hs: 18, bs: 12, kb: 5, str: 2, color: LC, srcKey: 'sp1', projOnHit: 1,
        onHit(A, D) { FX.ring(D.x, D.y - 100, LC, 10, 80, 12, 4); FX.burst(D.x, D.y - 100, LSIL, 10, 6); lunHitGain(A, D, 6); } });
      if (lv >= 2) { mk(-34, 0.85, 34); mk(46, 0.85, 34); } else mk(0, lv ? 1.12 : 1, 48);
    } },
  },
  sp1f: {
    name: 'SHADOW VEIL', jp: '影の帳', desc: 'She dissolves into dark smoke and reappears ~230 px back (invulnerable). The shadow she leaves behind bursts a moment later — whoever chased her into it gets hit. Bigger burst in Eclipse Form.', special: 1, lvl: 4,
    poses: ['veil', 'veil'], st: 14, act: 1, rec: 12, cd: 75, invuln: [1, 16], pass: 16, sfx: 'teleport',
    tick(F, f) {
      F.vx = 0;
      if (f === 3) {
        F.veilX = F.x; F.hidden = true; Sound.play('hiss');
        for (let i = 0; i < 14; i++) FX.p({ type: 'smoke', x: F.x + rand(-24, 24), y: F.y - rand(10, 170), vx: rand(-1.5, 1.5), vy: -rand(0.3, 1.2), life: 26, size: rand(12, 20), grow: 0.6, color: pick(['rgba(16,18,60,0.6)', 'rgba(60,40,140,0.45)']), add: false });
        const big = lunLvl(F) >= 2;
        BT.spawn({ owner: F, kind: 'veilShade', x: F.x, y: GROUND - 80, vx: 0.001, w: big ? 150 : 110, h: 150, delay: 20, delay0: 20, life: 10, big: big ? 1.3 : 1, pose: { ...F.pose }, face: F.facing, dmg: big ? 42 : 34, hs: 22, bs: 10, kb: 6, launch: big ? -9 : 0, str: 2, clash: 0, color: LVIO, srcKey: 'sp1f', projOnHit: 1,
          onHit(A, D) { lunHitGain(A, D, 6); } });
      }
      if (f === 12) {
        F.x = clamp(F.x - F.facing * 230, 60, STAGE_W - 60); F.hidden = false;
        FX.ring(F.x, F.y - 100, LC, 10, 100, 14, 3); for (let i = 0; i < 8; i++) FX.p({ type: 'spark', x: F.x + rand(-30, 30), y: F.y - rand(20, 180), vx: 0, vy: -rand(0.5, 1.5), life: 24, size: 2, color: LSIL });
      }
    },
  },
  counter: {
    name: 'LUNAR CHAINS', jp: '月光の鎖', desc: 'Raises a hand: moon-runes glow under the opponent (up to ~380 px), then chains of moonlight burst out and bind them (~0.7 s) — also interrupts attacks. Eclipse: longer bind that drags them closer. Dominion: wider, and slows them afterwards.', special: 1, lvl: 4,
    poses: ['chain_w', 'chain'], st: 12, act: 1, rec: 22, cd: 150, sfx: 'chime',
    spawn: { f: 12, fn(F, O) {
      const lv = lunLvl(F), dom = F.domT > 0, x = lunTarget(F, O, dom ? 460 : 380);
      BT.spawn({ owner: F, kind: 'moonChains', x, y: GROUND - 80, vx: F.facing * 0.001, w: dom ? 120 : 92, h: 170, delay: 14, delay0: 14, life: 8, dmg: 44, hs: 44 + (lv >= 2 ? 12 : 0), bs: 12, kb: 0, str: 2, clash: 0, color: LC, srcKey: 'counter', projOnHit: 1,
        onHit(A, D) { D.chainT = 40 + (lv >= 2 ? 12 : 0); D.chainPull = lv >= 2; D.vx = 0; if (dom) D.slowT = Math.max(D.slowT || 0, 120); lunHitGain(A, D, 10); FX.wtext(D.x, D.y - 235, 'BOUND.', { size: 26, color: '#ffffff', stroke: '#0a2a6a', life: 36 }); } });
    } },
  },
  sp2: {
    name: 'ECLIPSE SPEAR', jp: '蝕の槍', desc: 'A massive spear of condensed lunar energy forms above her hand, then flies across the screen. Long startup, huge damage, wall-splat. Eclipse Form: it launches the victim for a follow-up.', special: 1, lvl: 4,
    poses: ['spear_w', 'spear'], st: 24, act: 1, rec: 20, cd: 220, sfx: 'energy',
    tick(F, f) { if (f < 24 && f % 3 === 0) { const hx = F.x - F.facing * 6, hy = F.y - 230; FX.p({ type: 'spark', x: hx + rand(-60, 60), y: hy + rand(-30, 30), vx: (hx - (hx + rand(-60, 60))) * 0.05, vy: 0, life: 12, size: 2, color: pick([LC, LSIL]) }); } },
    spawn: { f: 24, fn(F) {
      const lv = lunLvl(F);
      BT.spawn({ owner: F, kind: 'eclipseSpear', x: F.x + F.facing * 40, y: F.y - 150, vx: F.facing * 15, w: 120, h: 30, life: 56, dmg: 108, hs: 26, bs: 18, kb: 10, launch: lv >= 2 ? -12 : 0, ws: 1, str: 3, shake: 8, color: LC, srcKey: 'sp2', projOnHit: 1,
        onHit(A, D) { FX.ring(D.x, D.y - 110, '#ffffff', 10, 150, 14, 7); FX.ring(D.x, D.y - 110, LC, 20, 220, 18, 5); FX.burst(D.x, D.y - 110, LSIL, 22, 11); Sound.play('impactBig'); lunHitGain(A, D, 8); } });
      FX.ring(F.x + F.facing * 40, F.y - 150, LC, 10, 70, 10, 4);
    } },
  },
  sp2f: {
    name: 'NIGHTFALL', jp: '夜の帳', desc: 'Calls the night down around the opponent (~450 px): after a visible dusk ring forms, a 4 s zone of darkness erupts. Shadows strike anyone inside every ~0.7 s, and standing still there doubles the damage. Walk, dash or jump out.', special: 1, lvl: 4,
    poses: ['raise', 'raise'], st: 14, act: 1, rec: 18, cd: 330, sfx: 'hiss',
    spawn: { f: 14, fn(F, O) {
      const lv = lunLvl(F), x = lunTarget(F, O, 450), w = lv >= 2 ? 300 : 230;
      if (F.nightP && !F.nightP.dead) F.nightP.dead = true;
      F.nightP = BT.spawn({ owner: F, kind: 'nightfall', x, y: GROUND - 80, vx: 0.001, w, h: 200, delay: 20, delay0: 20, life: 240, hits: 8, interval: 42, persist: 1, dmg: 24, hs: 24, bs: 8, kb: 1, str: 1, clash: 0, color: LC, srcKey: 'sp2f', projOnHit: 1,
        onHit(A, D) {
          const still = D.nfX != null && Math.abs(D.x - D.nfX) < 18; D.nfX = D.x; this.lastX = D.x;
          if (still) { BT.applyDamage(A, D, 12 * A.dmgMult); FX.wtext(D.x, D.y - 225, 'NOWHERE TO HIDE', { size: 18, color: '#cff8ff', stroke: LNAVY, life: 30 }); }
          lunGain(A, 5);
        } });
      FX.darkTarget = 0;
    } },
  },
  sp2d: {
    name: 'CELESTIAL DOMINION', jp: '天空支配', desc: 'Channels the night sky for 5 s: brighter eyes, a lunar aura and a living cape. Crescent Moon returns to her (2 hits), Lunar Chains reach farther, grow wider and slow the victim, and Lunar Power fills twice as fast. No raw damage boost.', special: 1, lvl: 4,
    poses: ['dominion', 'dominion'], st: 16, act: 1, rec: 14, cd: 600, invuln: [0, 10], sfx: 'chime',
    onStart(F) {
      F.domT = LUN_DOM_T; FX.ring(F.x, F.y - 110, LC, 20, 260, 22, 5); FX.ring(F.x, F.y - 110, LSIL, 10, 140, 16, 3); FX.flashScreen('#06102a', 10, 0.4);
      FX.wtext(F.x, F.y - 250, 'CELESTIAL DOMINION', { size: 28, color: '#ffffff', stroke: '#0a2a6a', life: 50 }); lunGain(F, 6);
    },
  },
  ult: {
    name: 'ETERNAL NIGHT', jp: '永遠の夜', desc: 'Ultimate. A tide of shadow crosses mid range; on hit the sky turns to night, a gigantic moon rises behind her and is swallowed by an eclipse — and a colossal crescent of dark moonlight falls on the opponent.', ult: 1, lvl: 6, cost: 100,
    poses: ['raise', 'cast'], st: 14, act: 12, rec: 30, dmg: 20, hs: 40, bs: 20, kb: 2, hb: { x: 20, y: -190, w: 400, h: 190 }, invuln: [0, 16], str: 3,
    onHit(F, D) { BT.startCine(F, D, CINE.lunaria, { zoom: 1.15 }); return true; },
  },
});
(() => {
  const M = LUNARIA.moves;
  Object.assign(M.L, { name: 'Royal Backhand' });
  Object.assign(M.M, { name: 'Sovereign Kick' });
  Object.assign(M.H, { name: 'MOONLIGHT PALM', poses: ['cast_w', 'cast'], hb: { x: 18, y: -178, w: 104, h: 56 }, onHit(A, D) { FX.ring(D.x, D.y - 110, LC, 10, 70, 10, 3); } });
  Object.assign(M.cH, { name: 'Shadow Sweep' });
  Object.assign(M.LH, { name: 'Rising Moon', poses: ['cast_w', 'raise'] });
  Object.assign(M.FF, { name: 'Gliding Night' });
  Object.assign(M.jH, { name: 'Falling Star', poses: ['jheavy_w', { base: 'jump', fa1: 1.3, fa2: 0.9, pw: 1 }] });
})();
LUNARIA.combos = [
  { name: 'Crescent Court', notation: 'M → H (Moonlight Palm) → SP1 (Crescent Moon)', seq: ['M', 'H', 'sp1'] },
  { name: 'Bound by Moonlight', notation: '↓←SP1 (Lunar Chains) → H → SP1 (Crescent Moon)', seq: ['counter', 'H', 'sp1'] },
  { name: 'Eclipse Lance', notation: '↓←SP1 (Lunar Chains) → SP2 (Eclipse Spear) while they are bound', seq: ['counter', 'sp2'] },
  { name: 'Nightfall Waltz', notation: '↓→SP2 (Nightfall on top of them) → M → H', seq: ['sp2f', 'M', 'H'] },
  { name: 'Eternal Night', notation: 'M → H → SP1+SP2 (Ultimate)', seq: ['M', 'H', 'ult'], meter: 1 },
];
LUNARIA.applyTrial = (A, tr) => { if (!tr) return; if (tr.meter) A.meter = 100; if (tr.authority) { A.lun = tr.authority; A.lunT = A.T + 9999; } };

// ---------------------------------- cinematic ----------------------------------
CINE.lunaria = function (A, D, f, c) {
  const dir = A.facing;
  if (f === 1) {
    D.x = clamp(D.x, 160, STAGE_W - 160); D.y = GROUND; D.forcePose = 'hit'; A.forcePose = 'stance'; c.zoom = 1.15; c.camX = (A.x + D.x) / 2; c.camY = GROUND - 150;
    FX.darkTarget = 0.5; Sound.play('heart'); c.bg = LUNARIA.cineBg; c.fg = LUNARIA.cineFg; c.bgA = 0; c.dir = dir; c.moon = 0; c.ecl = 0; c.runes = 0; c.tide = 0; c.cres = 0; c.cy = 0; c.after = 0;
    c.mx = A.x - dir * 70; c.stars = []; for (let i = 0; i < 90; i++) c.stars.push([Math.random() * W, Math.random() * H * 0.8, Math.random() * 1.8 + 0.4, Math.random() * TAU]);
  }
  if (f === 10) { A.forcePose = 'skyglance'; }   // she slowly raises her head
  if (f === 24) { A.forcePose = 'raise'; Sound.play('chime'); }
  if (f > 18) c.bgA = Math.min(1, (f - 18) / 30);
  if (f >= 30 && f < 70) { c.camY = lerp(GROUND - 150, GROUND - 330, easeOut((f - 30) / 40)); c.zoom = lerp(1.15, 0.9, (f - 30) / 40); }   // the camera looks up to the sky
  if (f >= 34) c.moon = Math.min(1, (f - 34) / 34);
  if (f === 40) Sound.play('gong');
  if (f >= 76) c.ecl = Math.min(1, (f - 76) / 44);   // the eclipse swallows the moon
  if (f === 100) Sound.play('heart');
  if (f === 120) { Sound.play('impactBig'); FX.flashScreen('#9feaff', 8, 0.35); FX.shakeIt(8); FX.wtext(A.x, A.y - 300, '— 永遠の夜 —', { size: 40, font: FX_JP(), color: '#dff8ff', stroke: LNAVY, life: 70 }); }
  if (f >= 104) c.tide = Math.min(1, (f - 104) / 40);
  if (f >= 108 && f <= 150) {   // celestial energy wraps the opponent
    D.forcePose = 'airhit'; D.y = GROUND - 50 * Math.min(1, (f - 108) / 16) + Math.sin(f * 0.3) * 4;
    if (f % 7 === 3) { const ch = D.chestW(); BT.scriptHit(A, D, 14, { str: 2, sfx: 'spike' }); FX.ring(ch[0], ch[1], LC, 80, 10, 10, 3); FX.shakeIt(4); }
    if (f % 2 === 0) { const a = f * 0.4, ch = D.chestW(); FX.p({ type: 'spark', x: ch[0] + Math.cos(a) * 60, y: ch[1] + Math.sin(a) * 30, vx: -Math.sin(a) * 2, vy: Math.cos(a), life: 18, size: 2.4, color: pick([LC, LSIL, LVIO]) }); }
  }
  if (f >= 124) c.runes = Math.min(1, (f - 124) / 20);
  if (f >= 140 && f < 166) { const k = easeOut((f - 140) / 26); c.camY = lerp(GROUND - 330, GROUND - 260, k); c.camX = lerp((A.x + D.x) / 2, D.x - dir * 60, k); c.zoom = lerp(0.9, 0.85, k); }
  if (f >= 142) c.cres = Math.min(1, (f - 142) / 24);   // a gigantic crescent forms above the opponent
  if (f === 146) { Sound.play('charge'); }
  if (f >= 168 && f <= 180) c.cy = lunEaseIn((f - 168) / 12);   // …and falls
  if (f === 180) {
    D.y = GROUND; D.forcePose = 'down'; A.forcePose = 'cast';
    BT.scriptHit(A, D, 150, { str: 4 });
    FX.impactFrame(6); FX.shakeIt(32); Sound.play('explosion'); Sound.play('impactBig'); Sound.play('gong'); FX.flashScreen('#e6f6ff', 22, 0.9);
    FX.ring(D.x, GROUND - 40, LC, 20, 460, 28, 10, 0.35); FX.ring(D.x, GROUND - 40, '#ffffff', 10, 300, 20, 6, 0.35); FX.ring(D.x, GROUND, LVIO, 20, 380, 24, 6, 0.2); FX.dust(D.x, GROUND, 22, 'rgba(160,200,255,0.5)'); FX.rocks(D.x, GROUND, 20, '#2a2a44');
    for (let i = 0; i < 60; i++) FX.p({ type: i % 3 ? 'spark' : 'ember', x: D.x + rand(-40, 40), y: GROUND - rand(10, 120), vx: rand(-12, 12), vy: -rand(2, 12), grav: 0.25, life: 60, size: rand(2, 4.5), color: pick([LC, LSIL, LVIO, '#ffffff']) });
    FX.wtext(D.x, GROUND - 280, '永遠の夜', { size: 90, font: FX_JP(), color: '#fff', stroke: '#0a2a6a', life: 70, vy: -0.3 });
    c.after = 1;
  }
  if (f > 180) { c.after = Math.max(0, 1 - (f - 180) / 30); c.cres = 0; }
  if (f >= 196) { c.bgA = Math.max(0, 1 - (f - 196) / 26); c.runes = c.bgA; c.tide = c.bgA; c.camY = lerp(c.camY, GROUND - 150, 0.15); }   // the battlefield returns to normal
  if (f === 200) { A.forcePose = 'victory'; A.moonT = 150; }
  if (f === 226) { lunGain(A, 20); BT.release(D, dir * 3, -6); FX.darkTarget = 0; return true; }
};
const lunEaseIn = t => clamp(t, 0, 1) ** 2;
LUNARIA.cineBg = (g, c) => {   // night sky, the gigantic moon, the eclipse, celestial symbols (screen space)
  const a = c.bgA || 0; if (a <= 0.01 || !BT) return;
  g.save(); g.globalAlpha = a;
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#02030c'); sky.addColorStop(0.6, '#070b26'); sky.addColorStop(1, '#141a44'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.fillStyle = '#e8f4ff'; for (const [x, y, s, ph] of c.stars) { g.globalAlpha = a * (0.4 + 0.6 * Math.abs(Math.sin(c.f * 0.05 + ph))); g.fillRect(x, y, s, s); }
  g.globalAlpha = a;
  // the moon (anchored in the world above her, so the camera tilt reveals it)
  if (c.moon > 0) {
    const [sx, sy0] = BT.cam.toScreen(c.mx, GROUND - 560), z = BT.cam.z, R = 210 * z * (0.85 + 0.15 * easeOut(c.moon)), sy = sy0 + (1 - easeOut(c.moon)) * 160 * z;
    const e = easeOut(c.ecl || 0);
    // halo, dimming as the eclipse closes, then a corona
    g.save(); g.globalCompositeOperation = 'lighter';
    const halo = g.createRadialGradient(sx, sy, R * 0.9, sx, sy, R * 2.4); halo.addColorStop(0, `rgba(180,230,255,${0.45 * c.moon * (1 - e * 0.6)})`); halo.addColorStop(1, 'rgba(40,80,200,0)'); g.fillStyle = halo; g.beginPath(); g.arc(sx, sy, R * 2.4, 0, TAU); g.fill();
    g.restore();
    g.save(); g.globalAlpha = a * c.moon;
    const mg = g.createRadialGradient(sx - R * 0.3, sy - R * 0.3, R * 0.1, sx, sy, R); mg.addColorStop(0, '#ffffff'); mg.addColorStop(0.6, '#dbe8f6'); mg.addColorStop(1, '#9fb4d0');
    g.fillStyle = mg; g.beginPath(); g.arc(sx, sy, R, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.arc(sx, sy, R, 0, TAU); g.clip();
    g.fillStyle = 'rgba(110,130,170,0.35)'; for (const [cx, cy, cr] of [[-0.3, -0.2, 0.22], [0.25, 0.1, 0.3], [-0.1, 0.42, 0.16], [0.42, -0.4, 0.12], [-0.5, 0.25, 0.1], [0.05, -0.55, 0.09], [0.55, 0.45, 0.14]]) { g.beginPath(); g.arc(sx + cx * R, sy + cy * R, cr * R, 0, TAU); g.fill(); }
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; for (const [cx, cy, cr] of [[-0.3, -0.2, 0.22], [0.25, 0.1, 0.3]]) { g.beginPath(); g.arc(sx + cx * R - 2, sy + cy * R - 2, cr * R, Math.PI, Math.PI * 1.6); g.stroke(); }
    // the eclipse: a dark disc sliding across
    if (e > 0) { const ox = lerp(-2.1, 0.04, e) * R * c.dir; g.fillStyle = '#03040e'; g.beginPath(); g.arc(sx + ox, sy - (1 - e) * R * 0.3, R * 1.02, 0, TAU); g.fill(); }
    g.restore(); g.restore();
    if (e > 0.85) {   // corona and diamond ring
      const k = (e - 0.85) / 0.15; g.save(); g.globalCompositeOperation = 'lighter';
      const co = g.createRadialGradient(sx, sy, R * 0.98, sx, sy, R * 1.6); co.addColorStop(0, `rgba(200,250,255,${0.9 * k})`); co.addColorStop(0.3, `rgba(110,220,255,${0.4 * k})`); co.addColorStop(1, 'rgba(60,40,200,0)');
      g.fillStyle = co; g.beginPath(); g.arc(sx, sy, R * 1.6, 0, TAU); g.fill();
      g.strokeStyle = `rgba(190,170,255,${0.35 * k})`; g.lineWidth = 3; for (let i = 0; i < 18; i++) { const an = i * TAU / 18 + c.f * 0.004, l = R * (1.25 + 0.35 * Math.sin(i * 2.3 + c.f * 0.05)); g.beginPath(); g.moveTo(sx + Math.cos(an) * R, sy + Math.sin(an) * R); g.lineTo(sx + Math.cos(an) * l, sy + Math.sin(an) * l); g.stroke(); }
      g.restore();
      g.fillStyle = '#03040e'; g.beginPath(); g.arc(sx, sy, R * 0.99, 0, TAU); g.fill();   // the black disc stays black
      g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,255,255,${k})`; g.beginPath(); g.arc(sx + Math.cos(-2.3) * R, sy + Math.sin(-2.3) * R, 10 * k + 4, 0, TAU); g.fill(); g.restore();
    }
  }
  // enormous lunar symbols across the sky
  if (c.runes > 0) { g.save(); g.globalCompositeOperation = 'lighter'; const k = easeOut(c.runes); for (let i = 0; i < 5; i++) { const x = W * (0.1 + i * 0.2), y = H * (0.16 + (i % 2) * 0.1); lunRune(g, x, y, (60 + (i % 3) * 18) * k, c.f * 0.01 * (i % 2 ? 1 : -1), 0.45 * k * a, i % 2 ? LC : '#b8a0ff'); } g.restore(); }
  g.restore();
};
LUNARIA.cineFg = (g, c) => {   // world-space shadow tide + the descending crescent; screen-space moonlight/darkness after impact
  const A = c.A, D = c.D, f = c.f;
  g.save(); BT.cam.apply(g);
  if (c.tide > 0) {   // massive shadows spreading over the ground
    const k = easeOut(c.tide), x0 = A.x, x1 = lerp(A.x, D.x + c.dir * 220, k);
    g.fillStyle = `rgba(4,4,18,${0.7 * c.tide})`; g.beginPath(); g.moveTo(x0, GROUND + 6);
    for (let i = 0; i <= 24; i++) { const x = lerp(x0, x1, i / 24); g.lineTo(x, GROUND - 10 - Math.abs(Math.sin(i * 0.9 + f * 0.15)) * 46 * (0.4 + 0.6 * Math.sin(i / 24 * Math.PI))); }
    g.lineTo(x1, GROUND + 6); g.closePath(); g.fill();
    g.strokeStyle = `rgba(127,240,255,${0.35 * c.tide})`; g.lineWidth = 2; g.stroke();
  }
  if (c.cres > 0) {
    const k = easeOut(c.cres), y = lerp(GROUND - 520, GROUND - 90, c.cy || 0), R = 170 * k, x = D.x;
    g.save(); g.globalCompositeOperation = 'lighter'; const gl = g.createRadialGradient(x, y, R * 0.3, x, y, R * 1.6); gl.addColorStop(0, `rgba(120,230,255,${0.4 * k})`); gl.addColorStop(1, 'rgba(60,60,220,0)'); g.fillStyle = gl; g.beginPath(); g.arc(x, y, R * 1.6, 0, TAU); g.fill(); g.restore();
    g.fillStyle = '#05051a'; lunCrescent(g, x, y, R, Math.PI / 2, 0.5); g.fill();   // dark core, horns pointing down
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = LC; g.lineWidth = 6; lunCrescent(g, x, y, R, Math.PI / 2, 0.5); g.stroke(); g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.stroke(); g.restore();
    if (c.cy > 0) { g.globalAlpha = 0.4; g.fillStyle = LC; for (let i = 0; i < 6; i++) g.fillRect(x - R + i * R * 0.4, y - R - 200 * c.cy, 3, 200 * c.cy); g.globalAlpha = 1; }
  }
  g.restore();
  if (c.after > 0) {   // the screen briefly fills with moonlight… then darkness
    const k = c.after; g.save();
    g.fillStyle = k > 0.6 ? `rgba(220,245,255,${(k - 0.6) * 2})` : `rgba(4,6,24,${k * 1.2})`; g.fillRect(0, 0, W, H); g.restore();
  }
};

// ---------------------------------- HUD + how-to ----------------------------------
LUNARIA.drawHand = (g, F, side, t) => {
  const lv = lunLvl(F), ecl = F.eclT > 0, dom = F.domT > 0;
  xpPanel(g, F, side, t, {
    col: ecl ? '#9ffcff' : lv ? LC : '#6a9ad8', col2: '#ffffff', icon: '月', flash: ecl,
    title: ecl ? 'ECLIPSE FORM' : lv ? 'LUNAR POWER · WAXING' : 'LUNAR POWER',
    sub: ecl ? '蝕の姿 · TWIN CRESCENTS · LONG CHAINS · LAUNCHING SPEAR' : dom ? `天空支配 · DOMINION ${(F.domT / 60).toFixed(1)}s · ×2 GAIN` : '月光力 · lunar & shadow hits and controlling space',
    k: (F.lun || 0) / 100, label: ecl ? `${(F.eclT / 60).toFixed(1)}s` : `${Math.floor(F.lun || 0)}%`, marks: [0.5],
    badges: [['sp1', 'S1|CRESCENT'], ['sp1f', '↓→S1|VEIL'], ['counter', '↓←S1|CHAINS'], ['sp2', 'S2|SPEAR'], ['sp2f', '↓→S2|NIGHTFALL'], ['sp2d', '↓↓S2|DOMINION']],
  });
};
LUNARIA.howTo = {
  title: 'MOON SOVEREIGN',
  draw(g) {
    xpHowTo(g, 'LUNARIA — THE MOON SOVEREIGN', '#7ff0ff', [
      ['LUNAR POWER', 'Fills with lunar hits (+6), chains (+10), spear (+8), Nightfall strikes (+5); +4 more when the foe is inside your Nightfall.'],
      ['ECLIPSE FORM', 'Full gauge = 7 s: crescent halo, twin crescents, longer chains that drag, launching spear, bigger Nightfall, faster SP1 cooldowns.'],
      ['SP1', 'Crescent Moon — mid-range crescent of moonlight with a star trail.'],
      ['↓→ SP1', 'Shadow Veil — vanish and reappear ~230 px back; the shadow left behind bursts on whoever chased you.'],
      ['↓← SP1', 'Lunar Chains — runes glow under the foe, then chains bind them (~0.7 s). Interrupts attacks.'],
      ['SP2', 'Eclipse Spear — slow to form, crosses the screen, huge damage and wall-splat.'],
      ['↓→ SP2', 'Nightfall — 4 s zone of darkness on them: periodic shadow strikes, double damage if they stand still.'],
      ['↓↓ SP2', 'Celestial Dominion — 5 s: returning crescents, wider chains that slow, Lunar Power ×2.'],
    ], 'Rule mid range: Crescent and Moonlight Palm (H) keep them out, Nightfall and Chains punish anyone who stands still or walks in predictably, the Spear ends it. Up close she is slow — Shadow Veil away. Ultimate (SP1+SP2): ETERNAL NIGHT.');
  },
};

CHARS.push(LUNARIA);
finalizeMoves(LUNARIA);
