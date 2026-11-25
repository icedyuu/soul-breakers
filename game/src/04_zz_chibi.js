// ===================== CHIBI STYLE KIT + REDESIGNS (NUE · SERA · FUDAGAMI) =====================
// Style reference: big-headed pastel chibi, huge glossy eyes, cat-ear beanie, headphones, small wings,
// plaid pleated skirt, fluffy leg warmers and oversized platform boots with round pads.
const CHIBI_DIMS = { thigh: 33, shin: 31, torso: 44, neck: 4, headR: 26, uarm: 25, farm: 23, footLift: 11 };

// ---------- face: big glossy anime eyes (near + far eye for a 3/4 look), blush, tiny mouth ----------
function chibiEye(g, x, y, w, h, c, o, far) {
  const glow = o.glow, iris = glow ? c.accent : c.eye;
  g.fillStyle = '#fdfdff'; g.beginPath(); g.ellipse(x, y, w, h, 0, 0, TAU); g.fill();
  const gr = g.createLinearGradient(0, y - h, 0, y + h); gr.addColorStop(0, c.eye2 || '#1a1030'); gr.addColorStop(0.45, iris); gr.addColorStop(1, '#ffffff');
  if (glow) { g.shadowColor = c.accent; g.shadowBlur = 10; }
  g.fillStyle = gr; g.beginPath(); g.ellipse(x + w * 0.06, y + h * 0.06, w * 0.86, h * 0.9, 0, 0, TAU); g.fill(); g.shadowBlur = 0;
  g.fillStyle = 'rgba(16,8,32,0.85)'; g.beginPath(); g.ellipse(x + w * 0.1, y + h * 0.02, w * 0.4, h * 0.44, 0, 0, TAU); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x - w * 0.32, y - h * 0.38, w * 0.34, h * 0.24, -0.3, 0, TAU); g.fill();
  g.beginPath(); g.arc(x + w * 0.42, y + h * 0.48, w * 0.17, 0, TAU); g.fill();
  // lash line with an outer wing
  g.strokeStyle = OUTLINE; g.lineCap = 'round'; g.lineWidth = Math.max(1.6, h * 0.24);
  g.beginPath(); g.moveTo(x - w * 1.15, y - h * 0.62); g.quadraticCurveTo(x, y - h * 1.32, x + w * 1.08, y - h * 0.72); g.stroke();
  if (!far && !c.male) { g.lineWidth = Math.max(1.2, h * 0.14); g.beginPath(); g.moveTo(x - w * 1.0, y - h * 0.7); g.lineTo(x - w * 1.55, y - h * 1.0); g.stroke(); }
}
function chibiFace(g, r, c, o) {
  const e = o.expr || 'normal', ex = 0.5 * r, ey = 0.25 * r, fx = 0.94 * r;
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  // blush
  g.fillStyle = 'rgba(255,110,150,0.32)'; g.beginPath(); g.ellipse(0.34 * r, 0.56 * r, 0.15 * r, 0.065 * r, 0, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(0.93 * r, 0.52 * r, 0.06 * r, 0.05 * r, 0, 0, TAU); g.fill();
  g.strokeStyle = OUTLINE;
  if (e === 'hurt' || e === 'ko') {
    g.lineWidth = 0.075 * r; g.beginPath();
    if (e === 'hurt') { g.moveTo(ex - 0.18 * r, ey - 0.16 * r); g.lineTo(ex + 0.12 * r, ey); g.lineTo(ex - 0.18 * r, ey + 0.16 * r); g.moveTo(fx + 0.06 * r, ey - 0.14 * r); g.lineTo(fx - 0.04 * r, ey); g.lineTo(fx + 0.06 * r, ey + 0.14 * r); }
    else { for (const [x, s] of [[ex, 0.16], [fx, 0.08]]) { g.moveTo(x - s * r, ey - 0.14 * r); g.lineTo(x + s * r, ey + 0.14 * r); g.moveTo(x + s * r, ey - 0.14 * r); g.lineTo(x - s * r, ey + 0.14 * r); } }
    g.stroke();
  } else if (e === 'closed' || e === 'grin') {
    g.lineWidth = 0.08 * r; g.beginPath(); g.moveTo(ex - 0.2 * r, ey + 0.06 * r); g.quadraticCurveTo(ex, ey - 0.16 * r, ex + 0.2 * r, ey + 0.06 * r);
    g.moveTo(fx - 0.07 * r, ey + 0.05 * r); g.quadraticCurveTo(fx, ey - 0.1 * r, fx + 0.07 * r, ey + 0.05 * r); g.stroke();
  } else {
    chibiEye(g, fx, ey - 0.01 * r, 0.075 * r, 0.3 * r, c, o, true);
    chibiEye(g, ex, ey, 0.23 * r, 0.36 * r, c, o, false);
    g.strokeStyle = c.brow || OUTLINE; g.lineWidth = 0.05 * r; const ang = e === 'shout' ? 0.08 : 0;
    g.beginPath(); g.moveTo(ex - 0.2 * r, ey - (0.5 - ang) * r); g.quadraticCurveTo(ex, ey - 0.58 * r, ex + 0.22 * r, ey - (0.5 + ang) * r); g.stroke();
  }
  // mouth
  const mx = 0.72 * r, my = 0.72 * r;
  g.strokeStyle = OUTLINE; g.lineWidth = 0.045 * r;
  if (e === 'shout' || e === 'hurt' || e === 'ko') { g.fillStyle = '#5a1020'; g.beginPath(); g.ellipse(mx, my, 0.085 * r, 0.11 * r, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#ff7a90'; g.beginPath(); g.ellipse(mx, my + 0.05 * r, 0.05 * r, 0.04 * r, 0, 0, TAU); g.fill(); }
  else if (e === 'grin') { g.beginPath(); g.moveTo(mx - 0.1 * r, my - 0.02 * r); g.quadraticCurveTo(mx - 0.05 * r, my + 0.07 * r, mx, my - 0.01 * r); g.quadraticCurveTo(mx + 0.05 * r, my + 0.07 * r, mx + 0.1 * r, my - 0.02 * r); g.stroke(); }
  else { g.beginPath(); g.moveTo(mx - 0.05 * r, my); g.quadraticCurveTo(mx, my + 0.03 * r, mx + 0.06 * r, my - 0.01 * r); g.stroke(); }
  g.restore();
}

// ---------- oversized platform boots with fluffy leg warmers ----------
function chunkyBoot(g, K, F, c, R, back, b) {
  const M = lerpP(K, F, 0.3);
  tube(g, [M, lerpP(M, F, 0.5), F], 9, 11.5, c.warm, R);
  if (!R.mono) {
    const ang = Math.atan2(F[1] - M[1], F[0] - M[0]) + Math.PI / 2;
    g.strokeStyle = 'rgba(40,30,70,0.16)'; g.lineWidth = 1.6;
    for (const t of [0.25, 0.5, 0.75]) { const P = lerpP(M, F, t), w = lerp(8, 10.5, t); g.beginPath(); g.moveTo(P[0] - Math.cos(ang) * w, P[1] - Math.sin(ang) * w); g.lineTo(P[0] + Math.cos(ang) * w, P[1] + Math.sin(ang) * w); g.stroke(); }
  }
  const x = F[0], y = F[1];
  ell(g, x + 7, y + 8, 19.5, 6.5, c.sole, R);
  ell(g, x + 6, y - 1, 18, 12, c.boot, R);
  if (!R.mono) {
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(x + 1, y - 6, 8, 3.5, -0.2, 0, TAU); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.ellipse(x + 8, y + 5, 15, 4, 0, 0, TAU); g.fill();
    g.strokeStyle = OUTLINE; g.lineWidth = 1.5;
    for (const [px, py, pr] of [[x + 16, y + 1, 4], [x + 6.5, y + 3.5, 3.4]]) { g.fillStyle = c.pad; g.beginPath(); g.arc(px, py, pr, 0, TAU); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.arc(px - pr * 0.3, py - pr * 0.3, pr * 0.35, 0, TAU); g.fill(); }
  }
  ell(g, x - 1, y - 10, 12, 5, c.warm, R);
  if (back && !R.mono) { g.fillStyle = 'rgba(10,0,26,0.28)'; g.beginPath(); g.ellipse(x + 6, y + 1, 19, 13, 0, 0, TAU); g.fill(); }
}

// ---------- head gear ----------
function catBeanie(g, r, c, R, emblem) {
  g.save(); g.translate(0, -0.1 * r);
  polyR(g, r, [[-0.86, -0.7], [-1.04, -1.74], [-0.36, -1.06]], c.hat2, R);
  polyR(g, r, [[0.06, -1.1], [0.42, -1.9], [0.8, -0.97]], c.hat, R);
  if (!R.mono) {
    g.fillStyle = c.earIn || '#ffb3c8';
    g.beginPath(); g.moveTo(0.18 * r, -1.12 * r); g.lineTo(0.42 * r, -1.66 * r); g.lineTo(0.66 * r, -1.02 * r); g.closePath(); g.fill();
    g.globalAlpha *= 0.6; g.beginPath(); g.moveTo(-0.8 * r, -0.86 * r); g.lineTo(-0.95 * r, -1.5 * r); g.lineTo(-0.48 * r, -1.08 * r); g.closePath(); g.fill(); g.globalAlpha /= 0.6;
  }
  polyR(g, r, [[-1.12, -0.12], [-1.14, -0.56], [-0.86, -1.0], [-0.34, -1.22], [0.26, -1.22], [0.76, -1.02], [1.06, -0.62], [1.13, -0.22]], c.hat, R);
  if (!R.mono) { g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(-0.2 * r, -0.92 * r, 0.42 * r, 0.12 * r, -0.15, 0, TAU); g.fill(); }
  polyR(g, r, [[-1.16, -0.34], [1.15, -0.46], [1.16, -0.14], [-1.15, 0.0]], c.hat2, R);
  if (!R.mono) {
    g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 1.4; for (let i = -5; i <= 5; i++) { g.beginPath(); g.moveTo(i * 0.21 * r, -0.4 * r - i * 0.012 * r); g.lineTo(i * 0.21 * r, -0.08 * r - i * 0.012 * r); g.stroke(); }
    if (emblem) emblem(g, r);
  }
  g.restore();
}
function skullHair(g, r, c, R) { polyR(g, r, [[-1.14, -0.45], [-0.6, -0.98], [0.05, -0.8], [0.1, -0.3], [-0.12, 0.25], [-0.5, 0.62], [-1.0, 0.66], [-1.16, 0.15]], c.hair, R); }
function headphones(g, r, c, R, T) {
  skullHair(g, r, c, R);
  ell(g, -0.42 * r, 0.18 * r, 0.26 * r, 0.33 * r, c.phones, R);
  ell(g, -0.38 * r, 0.18 * r, 0.14 * r, 0.2 * r, c.phones2 || '#5a5a6e', R);
  if (!R.mono) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = c.accent; g.lineWidth = 0.06 * r; g.shadowColor = c.accent; g.shadowBlur = FX.hq ? 8 : 0; g.globalAlpha = 0.6 + 0.3 * Math.sin((T || 0) * 0.1); g.beginPath(); g.ellipse(-0.42 * r, 0.18 * r, 0.2 * r, 0.27 * r, 0, 0, TAU); g.stroke(); g.restore(); }
}
// ---------- small feathered wings (behind the body) ----------
function featherWings(g, sk, c, R, o, scale = 1) {
  const T = o.T || 0, flap = Math.sin(T * 0.08) * 0.14, root = [sk.neck[0] - 10, sk.neck[1] + 15];
  for (const [far, k] of [[1, 0.8], [0, 1]]) {
    const base = addP(root, far ? [7, -5] : [0, 0]);
    for (let i = 4; i >= 0; i--) {
      const a = Math.PI + 0.12 + i * 0.27 + flap * (1 + i * 0.25) - far * 0.12, L = (27 + i * 7) * k * scale, tip = addP(base, polar(a, L));
      const col = far ? c.wing2 : i % 2 ? c.wing : c.wingAlt || c.wing;
      poly(g, [base, addP(base, polar(a + 0.22, L * 0.55)), tip, addP(base, polar(a - 0.16, L * 0.62))], R.mono || col, R, 2);
      if (!R.mono && c.wingTip) { g.fillStyle = c.wingTip; g.beginPath(); g.moveTo(...tip); g.lineTo(...addP(base, polar(a + 0.06, L * 0.78))); g.lineTo(...addP(base, polar(a - 0.07, L * 0.8))); g.closePath(); g.fill(); }
    }
  }
}
// ---------- pleated plaid skirt ----------
function plaidSkirt(g, sk, c, R, o) {
  const fl = Math.sin((o.T || 0) * 0.15) * 2;
  const hb = [sk.hip[0] - 14, sk.hip[1] - 7], hf = [sk.hip[0] + 13, sk.hip[1] - 7];
  const kb = [lerp(sk.hip[0], sk.bk[0], 0.6) - 13 + fl, lerp(sk.hip[1], sk.bk[1], 0.6) + 7], kf = [lerp(sk.hip[0], sk.fk[0], 0.6) + 13, lerp(sk.hip[1], sk.fk[1], 0.6) + 7];
  const hem = [(kb[0] + kf[0]) / 2, Math.max(kb[1], kf[1]) + 3 - fl], pts = [hb, kb, hem, kf, hf];
  poly(g, pts, c.plaid, R);
  if (R.mono) return;
  g.save(); g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.clip();
  const x0 = Math.min(hb[0], kb[0]) - 4, x1 = Math.max(hf[0], kf[0]) + 4, y0 = hb[1] - 4, y1 = hem[1] + 4;
  g.fillStyle = c.plaid2; for (let x = x0; x < x1; x += 9) g.fillRect(x, y0, 3.5, y1 - y0);
  g.globalAlpha = 0.6; for (let y = y0; y < y1; y += 9) g.fillRect(x0, y, x1 - x0, 3.5); g.globalAlpha = 1;
  g.fillStyle = c.plaidLine; for (let x = x0 + 5; x < x1; x += 18) g.fillRect(x, y0, 1, y1 - y0); for (let y = y0 + 6; y < y1; y += 18) g.fillRect(x0, y, x1 - x0, 1);
  g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1.2; for (let i = 1; i < 5; i++) { const t = i / 5, top = lerpP(hb, hf, t), bot = lerpP(kb, kf, t); g.beginPath(); g.moveTo(...top); g.lineTo(bot[0], bot[1] + 2); g.stroke(); }
  g.restore();
  g.strokeStyle = c.belt; g.lineWidth = 4; g.beginPath(); g.moveTo(...hb); g.lineTo(...hf); g.stroke();
}
function highCollar(g, sk, c, R) {
  const n = sk.neck;
  poly(g, [[n[0] - 11, n[1] + 9], [n[0] - 10, n[1] - 6], [n[0] + 9, n[1] - 9], [n[0] + 12, n[1] + 6]], c.collar, R, 3);
}
function makeChibi(ch, o) {
  Object.assign(ch, { chibi: true, dims: { ...CHIBI_DIMS }, build: o.build || { arm: 1.02, leg: 1.0, torso: 1.06 }, faceFn: chibiFace, drawBoot: chunkyBoot, portraitScale: 0.68 });
  Object.assign(ch.colors, o.colors);
}

// ===================================== NUE =====================================
makeChibi(NUE, {
  colors: { skin: '#fbe6da', hair: '#cdd1f6', top: '#eceef6', leg: '#fbe6da', boot: '#f6f7fc', foot: '#f6f7fc', uarm: '#eceef6', farm: '#eceef6', hand: '#fbe6da', cuff: '#26222e', belt: '#26222e',
    eye: '#2fd6c4', eye2: '#0e4a5a', accent: '#36ffd0', brow: '#9aa0c8', shirt: '#26222e', fur: '#ffffff', warm: '#ffffff', sole: '#4a4a5c', pad: '#3a3a4c', collar: '#26222e',
    plaid: '#9496aa', plaid2: '#6a6c82', plaidLine: '#36ffd0', hat: '#f8f9fd', hat2: '#d6d9e8', phones: '#3a3a4c', wing: '#eef0f8', wingAlt: '#d8dbea', wing2: '#c2c6da', wingTip: '#7fe9d8' },
});
Object.assign(NUE, {
  ropes: [
    { id: 'hair', at: (sk, r) => headPt(sk, -r * 0.95, r * 0.1), n: 8, seg: 10, w0: 15, w1: 5, color: 'hair', grav: 0.5, wind: 0.45 },
    { id: 'tail', at: sk => [sk.hip[0] - 13, sk.hip[1] - 2], n: 6, seg: 9, w0: 8, w1: 6, color: 'fur', grav: 0.3, wind: 0.7 },
  ],
  hairBack(g, r, c, R) { polyR(g, r, [[0.55, -0.85], [-0.3, -1.18], [-1.05, -0.85], [-1.28, 0.1], [-1.38, 1.2], [-1.05, 1.9], [-0.7, 1.35], [-0.5, 1.95], [-0.2, 1.1], [0.1, 0.6]], c.hair, R); },
  hairFront(g, r, c, R, o) {
    polyR(g, r, [[-0.1, -0.3], [0.02, 0.5], [-0.1, 1.4], [-0.3, 1.85], [-0.4, 1.1], [-0.5, 0.3]], c.hair, R);
    polyR(g, r, [[-0.3, -0.92], [0.3, -0.98], [1.07, -0.62], [1.13, -0.06], [0.97, -0.26], [0.87, 0.02], [0.72, -0.3], [0.55, -0.04], [0.4, -0.4], [0.12, -0.52]], c.hair, R);
    if (!R.mono) { g.strokeStyle = c.accent; g.lineWidth = 0.08 * r; g.beginPath(); g.moveTo(0.48 * r, -0.9 * r); g.quadraticCurveTo(0.86 * r, -0.55 * r, 0.9 * r, -0.12 * r); g.stroke(); }
    headphones(g, r, c, R, o.T);
    catBeanie(g, r, c, R, (g, r) => { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = c.accent; g.lineWidth = 0.05 * r; g.globalAlpha = 0.8; g.beginPath(); g.arc(0.62 * r, -0.62 * r, 0.12 * r, 0, TAU); g.stroke(); g.restore(); });
  },
  neckWear(g, sk, p, c, R) {
    highCollar(g, sk, c, R);
    if (!R.mono) { g.fillStyle = '#fffbea'; g.strokeStyle = OUTLINE; g.lineWidth = 1; g.beginPath(); g.moveTo(sk.neck[0] + 3, sk.neck[1] + 9); g.lineTo(sk.neck[0] + 6, sk.neck[1] + 17); g.lineTo(sk.neck[0] + 9, sk.neck[1] + 9); g.closePath(); g.fill(); g.stroke(); }
  },
  torsoDetail(g, L, bw, c, R, o) {
    g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(-14 * bw, -L * 0.4, 28 * bw, L * 0.4);
    g.strokeStyle = c.shirt; g.lineWidth = 2.5; g.beginPath(); g.moveTo(7 * bw, -L - 2); g.lineTo(6 * bw, 2); g.stroke();
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(-11 * bw, -L * 0.36, 10 * bw, 7);
    const T = (o && o.T) || 0, cx = 1 * bw, cy = -L * 0.66, pul = 0.6 + 0.4 * Math.sin(T * 0.08);
    g.save(); g.globalCompositeOperation = 'lighter'; g.shadowColor = c.accent; g.shadowBlur = FX.hq ? 10 : 0; g.globalAlpha = (o && o.glow) ? 1 : pul;
    g.strokeStyle = c.accent; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, 6.5, 0, TAU); g.stroke();
    BEAST_IDS.forEach((id, i) => { const a = -Math.PI / 2 + i * TAU / 5; g.fillStyle = BEAST_INFO[id].col; g.beginPath(); g.arc(cx + Math.cos(a) * 6.5, cy + Math.sin(a) * 6.5, 1.8, 0, TAU); g.fill(); });
    g.restore();
  },
  torsoOver(g, L, bw, c, R) { if (R.mono) return; g.fillStyle = c.shirt; g.fillRect(-13 * bw, -5, 26 * bw, 5); },
  drawSkirt(g, sk, p, c, R, o) { plaidSkirt(g, sk, c, R, o); },
  weaponBack(g, sk, p, c, R, o) {
    featherWings(g, sk, c, R, o, 1.2);
    if (R.mono) return; const E = sk.be, Hd = sk.bh; glowLine(g, [lerpP(E, Hd, 0.2), addP(lerpP(E, Hd, 0.45), [3, -3]), lerpP(E, Hd, 0.7)], `rgba(54,255,208,${o && o.glow ? 0.8 : 0.35})`, 1.4, R, 6);
  },
});

// ===================================== SERA =====================================
makeChibi(SERA, {
  colors: { skin: '#fde8dc', hair: '#a9dcff', top: '#f5f8ff', leg: '#fde8dc', boot: '#ffffff', foot: '#ffffff', uarm: '#f5f8ff', farm: '#f5f8ff', hand: '#fde8dc', cuff: '#1d3f80', belt: '#1d3f80',
    eye: '#3fb6ff', eye2: '#0e2a6a', accent: '#3fd8ff', gold: '#ffd46b', brow: '#6aa8d8', warm: '#ffffff', sole: '#1d3f80', pad: '#3fb6ff', collar: '#1d3f80',
    plaid: '#2a4f9a', plaid2: '#163068', plaidLine: '#ffd46b', phones: '#f2f6ff', phones2: '#c6d6f2', wing: '#ffffff', wingAlt: '#e6efff', wing2: '#cdddf6', wingTip: '#8fd6ff' },
});
(() => {
  const staff = SERA.weaponBack;
  Object.assign(SERA, {
    ropes: [
      { id: 'lock1', at: (sk, r) => headPt(sk, -r * 0.82, -r * 0.55), n: 9, seg: 10, w0: 13, w1: 4, color: 'hair', grav: 0.45, wind: 0.5 },
      { id: 'lock2', at: (sk, r) => headPt(sk, -r * 0.2, -r * 0.92), n: 9, seg: 10, w0: 11, w1: 3, color: 'hair', grav: 0.45, wind: 0.45 },
    ],
    hairBack(g, r, c, R) {
      polyR(g, r, [[0.8, -0.72], [0.2, -1.2], [-0.72, -1.05], [-1.22, -0.3], [-1.28, 0.75], [-1.0, 1.2], [-0.55, 0.9], [-0.25, 0.55]], c.hair, R);
      if (!R.mono) { g.fillStyle = 'rgba(70,130,210,0.3)'; g.beginPath(); g.moveTo(-1.15 * r, 0); g.lineTo(-1.0 * r, 1.1 * r); g.lineTo(-0.6 * r, 0.85 * r); g.closePath(); g.fill(); }
    },
    hairFront(g, r, c, R, o) {
      polyR(g, r, [[-0.1, -0.3], [0.0, 0.45], [-0.1, 1.2], [-0.28, 1.55], [-0.38, 1.0], [-0.48, 0.25]], c.hair, R);
      polyR(g, r, [[-0.4, -0.95], [0.3, -1.02], [0.95, -0.72], [1.15, -0.08], [0.98, -0.26], [0.98, 0.05], [0.76, -0.24], [0.58, 0.0], [0.4, -0.36], [0.1, -0.5]], c.hair, R);
      shine(g, r, [[-0.25, -0.88], [0.45, -0.85]], R);
      headphones(g, r, c, R, o.T);
      // headband with a star-shaped storm crystal
      if (R.mono) return;
      g.strokeStyle = c.gold; g.lineWidth = 0.09 * r; g.beginPath(); g.moveTo(-0.95 * r, -0.5 * r); g.quadraticCurveTo(0, -1.12 * r, 0.78 * r, -0.78 * r); g.stroke();
      g.save(); g.translate(0.58 * r, -0.92 * r); g.shadowColor = c.accent; g.shadowBlur = FX.hq ? 10 : 0; g.fillStyle = '#e6fbff'; g.strokeStyle = OUTLINE; g.lineWidth = 1.2;
      g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = (i % 2 ? 0.08 : 0.2) * r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.stroke(); g.restore();
    },
    neckWear(g, sk, p, c, R) {
      const n = sk.neck;
      poly(g, [[n[0] - 16, n[1] + 12], [n[0] - 12, n[1] - 5], [n[0] + 10, n[1] - 8], [n[0] + 14, n[1] + 10], [n[0] + 2, n[1] + 4]], c.collar, R, 3);
      if (!R.mono) { g.strokeStyle = c.gold; g.lineWidth = 1.5; g.beginPath(); g.moveTo(n[0] - 14, n[1] + 9); g.lineTo(n[0] - 10, n[1] - 3); g.stroke(); g.fillStyle = '#ff5a7a'; g.beginPath(); g.moveTo(n[0] + 2, n[1] + 5); g.lineTo(n[0] - 4, n[1] + 14); g.lineTo(n[0] + 8, n[1] + 14); g.closePath(); g.fill(); }
    },
    torsoDetail(g, L, bw, c) {
      g.fillStyle = 'rgba(0,0,0,0.07)'; g.fillRect(-14 * bw, -L * 0.42, 28 * bw, L * 0.42);
      g.strokeStyle = c.cuff; g.lineWidth = 2.5; g.beginPath(); g.moveTo(8 * bw, -L - 2); g.lineTo(7 * bw, 2); g.stroke();
      g.fillStyle = c.gold; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(3 * bw, -L * (0.75 - i * 0.22), 1.8, 0, TAU); g.fill(); }
    },
    torsoOver(g, L, bw, c, R) { if (R.mono) return; g.fillStyle = c.cuff; g.fillRect(-13 * bw, -5, 26 * bw, 5); },
    drawSkirt(g, sk, p, c, R, o) { plaidSkirt(g, sk, c, R, o); },
    weaponBack(g, sk, p, c, R, o) { featherWings(g, sk, c, R, o, 1.1); staff.call(SERA, g, sk, p, c, R, o); },
  });
})();

// ===================================== FUDAGAMI =====================================
makeChibi(CARDMASTER, {
  build: { arm: 1.0, leg: 1.05, torso: 1.08 },
  colors: { skin: '#f6dccb', hair: '#2a2f4a', top: '#4a3480', leg: '#2a2440', boot: '#2e2648', foot: '#2e2648', uarm: '#4a3480', farm: '#4a3480', hand: '#1c1828', cuff: '#f2c14e', belt: '#1c1828',
    eye: '#ff4fd8', eye2: '#4a0a3a', accent: '#ff4fd8', gold: '#f2c14e', shirt: '#f0eef8', brow: '#2a2f4a', warm: '#e8e4f4', sole: '#f2c14e', pad: '#ff4fd8', collar: '#1c1828',
    hat: '#2e2648', hat2: '#1c1828', earIn: '#ff4fd8', phones: '#f2c14e', phones2: '#8a6a20', male: true },
});
(() => {
  const cards = CARDMASTER.weaponBack;
  Object.assign(CARDMASTER, {
    hairBack(g, r, c, R) { polyR(g, r, [[0.6, -0.85], [0.0, -1.2], [-0.8, -1.0], [-1.3, -0.4], [-1.15, 0.2], [-1.3, 0.7], [-0.7, 0.55], [-0.4, 0.75]], c.hair, R); },
    hairFront(g, r, c, R, o) {
      polyR(g, r, [[-0.3, -0.95], [0.35, -1.0], [1.08, -0.62], [1.12, -0.02], [0.94, -0.22], [0.86, 0.06], [0.68, -0.26], [0.5, 0.0], [0.32, -0.36], [0.05, -0.5]], c.hair, R);
      if (!R.mono) { g.strokeStyle = '#ff4fd8'; g.lineWidth = 0.09 * r; g.beginPath(); g.moveTo(0.4 * r, -0.92 * r); g.quadraticCurveTo(0.8 * r, -0.55 * r, 0.86 * r, -0.04 * r); g.stroke(); }
      headphones(g, r, c, R, o.T);
      catBeanie(g, r, c, R, (g, r) => {   // a gold spade on the beanie
        g.save(); g.translate(0.55 * r, -0.66 * r); g.fillStyle = c.gold; g.strokeStyle = OUTLINE; g.lineWidth = 1;
        g.beginPath(); g.moveTo(0, -0.16 * r); g.bezierCurveTo(0.2 * r, -0.02 * r, 0.14 * r, 0.12 * r, 0, 0.04 * r); g.bezierCurveTo(-0.14 * r, 0.12 * r, -0.2 * r, -0.02 * r, 0, -0.16 * r); g.fill(); g.stroke();
        g.fillRect(-0.025 * r, 0.02 * r, 0.05 * r, 0.1 * r); g.restore();
      });
    },
    neckWear(g, sk, p, c, R) { highCollar(g, sk, c, R); if (!R.mono) { g.fillStyle = c.gold; g.fillRect(sk.neck[0] - 9, sk.neck[1] + 4, 20, 2); } },
    drawSkirt(g, sk, p, c, R, o) {   // short flared hoodie-coat hem with a gold trim
      const fl = Math.sin((o.T || 0) * 0.12) * 2;
      const hb = [sk.hip[0] - 15, sk.hip[1] - 8], hf = [sk.hip[0] + 13, sk.hip[1] - 8];
      const kb = [lerp(sk.hip[0], sk.bk[0], 0.45) - 17 + fl, lerp(sk.hip[1], sk.bk[1], 0.45) + 6], kf = [lerp(sk.hip[0], sk.fk[0], 0.35) + 12, lerp(sk.hip[1], sk.fk[1], 0.35) + 2];
      poly(g, [hb, kb, kf, hf], c.top, R);
      if (!R.mono) { g.strokeStyle = c.gold; g.lineWidth = 2.5; g.beginPath(); g.moveTo(...kb); g.lineTo(...kf); g.stroke(); g.fillStyle = c.belt; g.fillRect(hb[0], hb[1] - 1, hf[0] - hb[0], 4); }
    },
    weaponBack(g, sk, p, c, R, o) {
      // card "wings": two fans of cards floating behind his back
      const T = o.T || 0, root = [sk.neck[0] - 12, sk.neck[1] + 16];
      for (const [far, k] of [[1, 0.8], [0, 1]]) for (let i = 4; i >= 0; i--) {
        const a = Math.PI + 0.15 + i * 0.27 + Math.sin(T * 0.06 + i) * 0.04 - far * 0.12, L = (24 + i * 6) * k, P = addP(addP(root, far ? [6, -5] : [0, 0]), polar(a, L));
        if (R.mono) { g.save(); g.translate(...P); g.rotate(a + Math.PI / 2); g.fillStyle = R.mono; g.fillRect(-5 * k, -7 * k, 10 * k, 14 * k); g.restore(); }
        else { g.save(); g.globalAlpha *= far ? 0.75 : 1; drawCard(g, P[0], P[1], 11 * k, 16 * k, i === 2 && !far ? 'rare' : 'back', { rot: a + Math.PI / 2, glow: i === 2 && !far ? 8 : 0 }); g.restore(); }
      }
      cards.call(CARDMASTER, g, sk, p, c, R, o);
    },
  });
  CARDMASTER.ropes = [
    { id: 'coat1', at: sk => [sk.hip[0] - 10, sk.hip[1] - 4], n: 4, seg: 9, w0: 9, w1: 7, color: 'top', grav: 0.55, wind: 0.4 },
    { id: 'coat2', at: sk => [sk.hip[0] - 5, sk.hip[1] - 2], n: 3, seg: 9, w0: 7, w1: 6, color: 'top', grav: 0.6, wind: 0.3 },
  ];
})();
