// ===================== ARCADE SKINS: one costume per fighter, unlocked by clearing Arcade with them =====================
// Slot 5 of every fighter's VARIANTS list (Mastery.unlocked → data.unl['id:5'], the same system as Aimi's MIDNIGHT DRESS).
// A costume = extra colours (pal, merged into the fighter's palette by varPal / varColors) + parts drawn by drawFigure
// at fixed layers: back (behind everything), skirt (over the hips/torso), neck, headBack / head (head space), front (over
// the front arm), plus optional cloth ropes. Purely visual: the sim never reads it, so online lockstep stays deterministic.
const ARC_VI = 5;

// ---------------- part helpers (body space: +x = forward, y up = negative; head space: r = head radius) ----------------
function cosFloor(sk) { return Math.max(sk.ff[1], sk.bf[1]) + 8; }
function cosSway(o, k = 1, sp = 0.07) { return Math.sin((o.T || 0) * sp) * 3 * k; }
// a cape / mantle hanging from the shoulders behind the body. len 0..1 = neck .. floor
function cosCape(g, sk, c, R, o, { len = 0.8, flare = 10, col, lin, trim, tatter = 0, fur = null, w = 1 }) {
  const n = sk.neck, h = sk.hip, fy = cosFloor(sk), hy = lerp(n[1], fy, len), sw = cosSway(o), sw2 = cosSway(o, 1.4, 0.05);
  const A = [n[0] - 9 * w, n[1] - 7], B = [n[0] + 8 * w, n[1] - 5], S = [sk.sB[0] - 19 * w, sk.sB[1] + 8];
  const Kb = [h[0] - 40 * w - flare * 1.3 + sw2, hy], Kf = [h[0] + 10 * w + sw * 0.4, hy - 3], Ff = [sk.sF[0] + 13 * w, sk.sF[1] + 8];
  const hem = []; const N = tatter ? 7 : 3;
  for (let i = 1; i < N; i++) { const t = i / N, P = lerpP(Kb, Kf, t); hem.push([P[0], P[1] + (tatter ? (i % 2 ? tatter : -tatter * 0.4) : Math.sin(t * Math.PI) * 4)]); }
  const pts = [A, S, [h[0] - 30 * w - flare + sw2 * 0.6, lerp(n[1], hy, 0.55)], Kb, ...hem, Kf, [h[0] + 16 * w, lerp(n[1], hy, 0.55)], Ff, B];
  if (lin && !R.mono) poly(g, pts.map(([x, y], i) => [x + (i > 2 && i < pts.length - 2 ? 5 : 0), y + 2]), lin, R);   // lining peeking out at the hem
  poly(g, pts, col, R);
  if (R.mono) return;
  g.save(); g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.clip();
  g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 2;
  for (const d of [-14, -26, -36]) { g.beginPath(); g.moveTo(n[0] + d * 0.3, n[1] + 8); g.quadraticCurveTo(h[0] + d, h[1], h[0] + d * 1.1 + sw2 * 0.5, hy); g.stroke(); }
  g.restore();
  if (trim) { g.strokeStyle = trim; g.lineWidth = 3; g.beginPath(); g.moveTo(...Kb); hem.forEach(p => g.lineTo(...p)); g.lineTo(...Kf); g.stroke(); }
  if (fur) cosFur(g, [S, A, B, Ff], fur, R, 6);
}
// fluffy fur trim along a polyline
function cosFur(g, pts, col, R, rad = 6) {
  for (let i = 0; i < pts.length - 1; i++) for (let t = 0; t < 1; t += 0.34) { const P = lerpP(pts[i], pts[i + 1], t); circ(g, P[0], P[1], rad * (0.85 + 0.3 * ((i * 3 + t * 9) % 2 > 1 ? 1 : 0)), col, R); }
}
// mantle front edge over the near shoulder (+ clasp)
function cosDrape(g, sk, c, R, col, trim, clasp) {
  const n = sk.neck, s = sk.sF;
  poly(g, [[n[0] - 6, n[1] - 5], [s[0] + 12, s[1] - 5], [s[0] + 15, s[1] + 16], [s[0] + 3, s[1] + 23], [n[0] - 2, n[1] + 16]], col, R, 2.4);
  if (R.mono) return;
  if (trim) { g.strokeStyle = trim; g.lineWidth = 2; g.beginPath(); g.moveTo(s[0] + 14, s[1] + 14); g.lineTo(s[0] + 3, s[1] + 21); g.stroke(); }
  if (clasp) { g.fillStyle = clasp; g.strokeStyle = OUTLINE; g.lineWidth = 1.2; g.beginPath(); g.arc(n[0] + 3, n[1] + 7, 3.4, 0, TAU); g.fill(); g.stroke(); }
}
function cosEpaulette(g, P, col, R, fringe) {
  ell(g, P[0] + 1, P[1] - 2, 11, 5, col, R, -0.1);
  if (R.mono || !fringe) return;
  g.strokeStyle = fringe; g.lineWidth = 1.6; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(P[0] + i * 3, P[1] + 2); g.lineTo(P[0] + i * 3.2, P[1] + 8); g.stroke(); }
}
// crown in head space (base y, height, spikes, colours)
function cosCrown(g, r, R, { y = -1.0, h = 0.5, n = 5, col, dark, gem, tilt = -0.06, x0 = -0.72, x1 = 0.8 }) {
  const pts = [[x0 * r, (y + 0.16) * r], [x1 * r, (y + 0.16 + tilt) * r]];
  for (let i = n * 2; i >= 0; i--) { const t = i / (n * 2), x = lerp(x1, x0, 1 - t) * r, base = (y + tilt * t) * r; pts.push([x, base - (i % 2 ? 0.32 * h : h) * r]); }
  poly(g, pts, col, R, 2.2);
  if (R.mono) return;
  g.fillStyle = dark || 'rgba(0,0,0,0.25)'; g.fillRect(x0 * r, (y + 0.02) * r, (x1 - x0) * r, 0.1 * r);
  for (let i = 0; i <= n * 2; i += 2) { const t = i / (n * 2), x = lerp(x0, x1, t) * r, yy = (y + tilt * t - h) * r; g.fillStyle = gem; g.beginPath(); g.arc(x, yy, 0.07 * r, 0, TAU); g.fill(); }
  g.save(); g.shadowColor = gem; g.shadowBlur = FX.hq ? 8 : 0; g.fillStyle = gem; g.strokeStyle = OUTLINE; g.lineWidth = 1;
  const cx = lerp(x0, x1, 0.5) * r, cy = (y + tilt * 0.5 - 0.02) * r; g.beginPath(); g.moveTo(cx, cy - 0.13 * r); g.lineTo(cx + 0.09 * r, cy); g.lineTo(cx, cy + 0.11 * r); g.lineTo(cx - 0.09 * r, cy); g.closePath(); g.fill(); g.stroke(); g.restore();
}
function cosRose(g, x, y, s, col, R) {
  if (R.mono) return;
  g.fillStyle = col; g.strokeStyle = OUTLINE; g.lineWidth = 1;
  g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(x - s * 0.1, y, s * 0.55, 0.5, 5.2); g.stroke(); g.beginPath(); g.arc(x + s * 0.1, y - s * 0.1, s * 0.25, 2, 7); g.stroke();
}
function cosHorn(g, r, base, pts, col, R, w = 0.16) { tube(g, [base, ...pts].map(([x, y]) => [x * r, y * r]), w * r, 0.03 * r, col, R); }

// ---------------- the twenty designs (Aimi's MIDNIGHT DRESS is in 04_zzzz9b_aimi.js) ----------------
const ARC = {
  kazuma: { n: 'CHAMPION\'S ROBE', jp: '覇者', pal: { kc: '#b8141e', kl: '#ffd25a', kt: '#ffd25a', kb: '#e6b23a', kg: '#ff3a4a' },
    back(g, sk, p, c, R, o) {   // a boxing champion's satin robe worn as a cape, hood folded behind the neck
      cosCape(g, sk, c, R, o, { len: 0.72, flare: 8, col: c.kc, lin: c.kl, trim: c.kt });
      const n = sk.neck; poly(g, [[n[0] - 20, n[1] - 2], [n[0] - 6, n[1] - 12], [n[0] + 4, n[1] + 2], [n[0] - 10, n[1] + 12], [n[0] - 24, n[1] + 8]], c.kc, R, 2);
      if (!R.mono) { g.strokeStyle = c.kt; g.lineWidth = 2; g.beginPath(); g.moveTo(n[0] - 20, n[1] - 1); g.lineTo(n[0] - 6, n[1] - 11); g.stroke(); }
    },
    skirt(g, sk, p, c, R) {   // golden championship belt
      const h = sk.hip;
      poly(g, [[h[0] - 15, h[1] - 10], [h[0] + 14, h[1] - 11], [h[0] + 14, h[1] + 1], [h[0] - 15, h[1] + 2]], c.kb, R, 2.4);
      poly(g, [[h[0] - 4, h[1] - 15], [h[0] + 11, h[1] - 15], [h[0] + 13, h[1] + 5], [h[0] - 6, h[1] + 5]], c.kb, R, 2.4);
      if (R.mono) return;
      g.fillStyle = c.kg; g.beginPath(); g.arc(h[0] + 3.5, h[1] - 5, 4, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(h[0] + 1.5, h[1] - 7.5, 2, 2);
    },
    front(g, sk, p, c, R) { cosDrape(g, sk, c, R, c.kc, c.kt, null); },
  },
  yoru: { n: 'FOX SHRINE', jp: '狐社', pal: { kc: '#f6f1e8', kl: '#c8102e', kt: '#c8102e', km: '#ffffff', kr: '#d8203a' },
    ropes: [{ id: 'cyr1', at: (sk, r) => headPt(sk, -r * 0.85, -r * 0.35), n: 6, seg: 10, w0: 4, w1: 3, color: 'kr', grav: 0.45, wind: 0.6 },
      { id: 'cyr2', at: (sk, r) => headPt(sk, -r * 0.9, -r * 0.2), n: 5, seg: 10, w0: 4, w1: 3, color: 'kr', grav: 0.5, wind: 0.5 }],
    back(g, sk, p, c, R, o) { cosCape(g, sk, c, R, o, { len: 0.5, flare: 4, col: c.kc, lin: c.kl, trim: c.kt, w: 0.9 }); },
    head(g, r, c, R) {   // white fox mask pushed to the side of the head
      g.save(); g.translate(-0.42 * r, -0.62 * r); g.rotate(-0.55);
      poly(g, [[-0.42 * r, -0.28 * r], [-0.36 * r, -0.78 * r], [-0.12 * r, -0.36 * r], [0.12 * r, -0.36 * r], [0.36 * r, -0.78 * r], [0.42 * r, -0.28 * r], [0.34 * r, 0.22 * r], [0, 0.52 * r], [-0.34 * r, 0.22 * r]], c.km, R, 2);
      if (!R.mono) {
        g.strokeStyle = c.kr; g.lineWidth = 0.06 * r; g.lineCap = 'round';
        g.beginPath(); g.moveTo(-0.26 * r, -0.06 * r); g.lineTo(-0.08 * r, 0.02 * r); g.moveTo(0.26 * r, -0.06 * r); g.lineTo(0.08 * r, 0.02 * r); g.stroke();
        g.fillStyle = c.kr; g.beginPath(); g.moveTo(-0.3 * r, -0.62 * r); g.lineTo(-0.22 * r, -0.36 * r); g.lineTo(-0.36 * r, -0.36 * r); g.fill(); g.beginPath(); g.moveTo(0.3 * r, -0.62 * r); g.lineTo(0.22 * r, -0.36 * r); g.lineTo(0.36 * r, -0.36 * r); g.fill();
        g.beginPath(); g.arc(0, -0.2 * r, 0.06 * r, 0, TAU); g.fill(); g.fillStyle = OUTLINE; g.beginPath(); g.arc(0, 0.42 * r, 0.05 * r, 0, TAU); g.fill();
      }
      g.restore();
    },
    front(g, sk, p, c, R) { cosDrape(g, sk, c, R, c.kc, c.kt, c.kr); },
  },
  sera: { n: 'STARFALL WITCH', jp: '星降る魔女', pal: { kc: '#1e2458', kl: '#ffd46b', kt: '#ffd46b', kh: '#232a66', kh2: '#161b44', ks: '#fff3a8' },
    back(g, sk, p, c, R, o) {
      cosCape(g, sk, c, R, o, { len: 0.86, flare: 14, col: c.kc, lin: c.kl, trim: c.kt });
      if (R.mono) return; const n = sk.neck, h = sk.hip, T = o.T || 0;
      for (let i = 0; i < 7; i++) { const x = h[0] - 34 + (i * 13) % 34, y = n[1] + 22 + (i * 29) % 70; g.globalAlpha = 0.6 + 0.4 * Math.sin(T * 0.1 + i); g.fillStyle = c.ks; g.fillRect(x - 1.5, y - 1.5, 3, 3); }
      g.globalAlpha = 1;
    },
    head(g, r, c, R, o) {   // a tall pointed witch hat with a gold band and a star
      const T = o.T || 0, bend = Math.sin(T * 0.05) * 0.08;
      ell(g, 0.05 * r, -0.98 * r, 1.6 * r, 0.3 * r, c.kh2, R, -0.08);
      poly(g, [[-0.82 * r, -1.02 * r], [-0.5 * r, -1.85 * r], [(-1.15 + bend) * r, -2.75 * r], [-0.05 * r, -1.95 * r], [0.88 * r, -1.1 * r]], c.kh, R);
      if (R.mono) return;
      g.strokeStyle = c.kt; g.lineWidth = 0.14 * r; g.beginPath(); g.moveTo(-0.78 * r, -1.14 * r); g.quadraticCurveTo(0.05 * r, -1.32 * r, 0.84 * r, -1.2 * r); g.stroke();
      g.save(); g.translate(0.2 * r, -1.24 * r); g.shadowColor = c.ks; g.shadowBlur = FX.hq ? 10 : 0; g.fillStyle = c.ks; g.strokeStyle = OUTLINE; g.lineWidth = 1.1;
      g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = (i % 2 ? 0.08 : 0.19) * r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.stroke(); g.restore();
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.moveTo(-0.5 * r, -1.2 * r); g.lineTo(-0.4 * r, -1.8 * r); g.lineTo(-0.2 * r, -1.25 * r); g.fill();
    },
    front(g, sk, p, c, R) { cosDrape(g, sk, c, R, c.kc, c.kt, c.ks); },
  },
  goro: { n: 'RED SHOGUN', jp: '赤備え', pal: { kc: '#b0161c', kd: '#6a0a10', kt: '#e8b440', kf: '#f2e6c8', kp: '#3a2a1a' },
    back(g, sk, p, c, R, o) {   // a sashimono war banner strapped to his back
      const n = sk.neck, sw = cosSway(o, 1.2, 0.09), base = [n[0] - 14, n[1] + 30], top = [n[0] - 22, n[1] - 92];
      tube(g, [base, top], 2.6, 2.2, c.kp, R);
      const fl = [[top[0] - 1, top[1] + 4], [top[0] - 40 + sw, top[1] + 2 + sw * 0.3], [top[0] - 38 + sw * 1.4, top[1] + 64], [top[0] + 1, top[1] + 62]];
      poly(g, fl, c.kf, R);
      if (R.mono) return;
      g.fillStyle = c.kc; g.fillRect(top[0] - 36 + sw * 1.2, top[1] + 8, 6, 52);
      g.save(); g.translate(top[0] - 18 + sw * 0.8, top[1] + 33); g.font = `900 22px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = OUTLINE; g.fillText('鬼', 0, 0); g.restore();
      circ(g, top[0], top[1], 3.5, c.kt, R);
    },
    front(g, sk, p, c, R) {   // red-lacquered shoulder guards with gold lacing
      const s = sk.sF;
      for (let i = 0; i < 3; i++) poly(g, [[s[0] - 12, s[1] - 6 + i * 7], [s[0] + 13, s[1] - 8 + i * 7], [s[0] + 15, s[1] - 1 + i * 7], [s[0] - 11, s[1] + 1 + i * 7]], i % 2 ? c.kd : c.kc, R, 2);
      if (R.mono) return; g.strokeStyle = c.kt; g.lineWidth = 1.5; for (const dx of [-5, 6]) { g.beginPath(); g.moveTo(s[0] + dx, s[1] - 7); g.lineTo(s[0] + dx + 1, s[1] + 15); g.stroke(); }
    },
  },
  frogs: { n: 'FROG ROYALS', jp: '蛙の王族', pal: { kc: '#a0142a', kl: '#ffd25a', kt: '#f4f0f8', kg: '#ffd25a', kj: '#3ad0ff' } },   // drawn by the frog hook below
  conductor: { n: 'ROYAL EXPRESS', jp: '御召列車', pal: { kc: '#8e1024', kl: '#2a1a4a', kt: '#ffd25a', kf: '#f8f4ec', ke: '#ffd25a' },
    back(g, sk, p, c, R, o) { cosCape(g, sk, c, R, o, { len: 0.58, flare: 10, col: c.kc, lin: c.kl, trim: c.kt, fur: c.kf }); },
    skirt(g, sk, p, c, R) {   // gold sash across the chest
      const n = sk.neck, h = sk.hip;
      poly(g, [[n[0] - 9, n[1] + 4], [n[0] - 2, n[1] + 1], [h[0] + 14, h[1] - 6], [h[0] + 8, h[1] + 1]], c.kt, R, 2);
      if (!R.mono) { g.fillStyle = '#c8102e'; g.beginPath(); g.arc(h[0] + 10, h[1] - 4, 3, 0, TAU); g.fill(); }
    },
    front(g, sk, p, c, R) { cosEpaulette(g, sk.sF, c.ke, R, c.kt); },
  },
  cardmaster: { n: 'PHANTOM MAGICIAN', jp: '幻影奇術師', pal: { kc: '#121018', kl: '#c8102e', kt: '#f2c14e', km: '#f2c14e', kr: '#e0103a' },
    back(g, sk, p, c, R, o) {   // magician's cape with a tall pointed collar
      cosCape(g, sk, c, R, o, { len: 0.82, flare: 16, col: c.kc, lin: c.kl, trim: c.kt });
      const n = sk.neck;
      poly(g, [[n[0] - 12, n[1] + 4], [n[0] - 26, n[1] - 34], [n[0] - 12, n[1] - 22], [n[0] - 4, n[1] - 40], [n[0] + 4, n[1] - 14], [n[0] + 8, n[1] + 2]], c.kc, R);
      if (!R.mono) poly(g, [[n[0] - 9, n[1]], [n[0] - 20, n[1] - 28], [n[0] - 10, n[1] - 18], [n[0] - 4, n[1] - 32], [n[0] + 2, n[1] - 10]], c.kl, R, 1);
    },
    head(g, r, c, R) {   // a gold monocle over the near eye
      if (R.mono) return;
      g.strokeStyle = c.km; g.lineWidth = 0.07 * r; g.beginPath(); g.arc(0.5 * r, 0.25 * r, 0.33 * r, 0, TAU); g.stroke();
      g.fillStyle = 'rgba(200,230,255,0.18)'; g.fill();
      g.lineWidth = 0.035 * r; g.beginPath(); g.moveTo(0.5 * r, 0.58 * r); g.quadraticCurveTo(0.2 * r, 1.0 * r, -0.1 * r, 0.9 * r); g.stroke();
    },
    front(g, sk, p, c, R) { cosDrape(g, sk, c, R, c.kc, c.kt, null); cosRose(g, sk.neck[0] + 4, sk.neck[1] + 9, 3.6, c.kr, R); },
  },
  nue: { n: 'WILD MONARCH', jp: '獣王', pal: { kc: '#8a7a68', kl: '#3a2c22', kt: '#c8b89a', kf: '#f4eee2', ka: '#efe6d2' },
    back(g, sk, p, c, R, o) { cosCape(g, sk, c, R, o, { len: 0.66, flare: 12, col: c.kc, lin: c.kl, tatter: 6 }); },
    headBack(g, r, c, R) {   // bone antlers rising behind the beanie
      for (const [sx, k] of [[-0.55, 0.85], [0.2, 1]]) {
        cosHorn(g, r, [sx, -0.8], [[sx - 0.2 * k, -1.5 * k], [sx - 0.55 * k, -2.1 * k], [sx - 0.95 * k, -2.35 * k]], c.ka, R, 0.11);
        cosHorn(g, r, [sx - 0.2 * k, -1.55 * k], [[sx + 0.2 * k, -2.0 * k], [sx + 0.18 * k, -2.35 * k]], c.ka, R, 0.08);
        cosHorn(g, r, [sx - 0.5 * k, -2.05 * k], [[sx - 0.45 * k, -2.5 * k]], c.ka, R, 0.07);
      }
    },
    neck(g, sk, p, c, R) { const n = sk.neck; cosFur(g, [[n[0] - 16, n[1] + 6], [n[0] - 6, n[1] - 4], [n[0] + 10, n[1] - 2], [n[0] + 14, n[1] + 8]], c.kf, R, 7); },
  },
  saint: { n: 'MIDNIGHT COUNTESS', jp: '真夜中の伯爵', pal: { kc: '#120a10', kl: '#a00c24', kt: '#c8a04a', kr: '#d0102e' },
    back(g, sk, p, c, R, o) {   // floor-length cape with a towering collar
      cosCape(g, sk, c, R, o, { len: 0.97, flare: 20, col: c.kc, lin: c.kl, trim: c.kt });
      const n = sk.neck, H = sk.head;
      poly(g, [[n[0] - 14, n[1] + 6], [H[0] - 58, H[1] - 30], [H[0] - 40, H[1] - 22], [H[0] - 38, H[1] - 58], [H[0] - 20, H[1] - 34], [H[0] - 6, H[1] - 56], [n[0] + 6, n[1] - 4], [n[0] + 10, n[1] + 4]], c.kc, R);
      if (!R.mono) poly(g, [[n[0] - 10, n[1] + 2], [H[0] - 50, H[1] - 26], [H[0] - 36, H[1] - 18], [H[0] - 34, H[1] - 48], [H[0] - 20, H[1] - 28], [H[0] - 9, H[1] - 46], [n[0] + 3, n[1] - 4]], c.kl, R, 1);
    },
    front(g, sk, p, c, R) { cosDrape(g, sk, c, R, c.kc, c.kt, null); cosRose(g, sk.neck[0] + 4, sk.neck[1] + 9, 4.2, c.kr, R); },
  },
  borgar: { n: 'WOLF JARL', jp: '狼の首長', pal: { kc: '#6e6a70', kl: '#3a2a20', kf: '#a8a4ac', kt: '#e8b440', kd: '#4a464e' },
    back(g, sk, p, c, R, o) { cosCape(g, sk, c, R, o, { len: 0.74, flare: 12, col: c.kc, lin: c.kl, tatter: 5, fur: c.kf, w: 1.1 }); },
    neck(g, sk, p, c, R) {   // a twisted gold torc
      const n = sk.neck; if (R.mono) return;
      g.strokeStyle = OUTLINE; g.lineWidth = 6; g.beginPath(); g.ellipse(n[0] + 1, n[1] + 4, 12, 5, -0.1, 0.2, Math.PI - 0.2); g.stroke();
      g.strokeStyle = c.kt; g.lineWidth = 3.6; g.stroke(); circ(g, n[0] + 12, n[1] + 4, 3, c.kt, R);
    },
    front(g, sk, p, c, R) {   // a wolf-pelt shoulder with ears
      const s = sk.sF;
      poly(g, [[s[0] - 8, s[1] - 12], [s[0] - 2, s[1] - 22], [s[0] + 3, s[1] - 12], [s[0] + 9, s[1] - 20], [s[0] + 12, s[1] - 8]], c.kd, R, 2);
      ell(g, s[0] + 2, s[1] - 3, 15, 10, c.kf, R, -0.15);
      if (!R.mono) { g.fillStyle = OUTLINE; g.beginPath(); g.arc(s[0] + 10, s[1] - 6, 1.6, 0, TAU); g.fill(); }
    },
  },
  buzzu: { n: 'DEVIL PRINCE', jp: '魔界の王子', pal: { kc: '#2a0e18', kl: '#c8102e', kw: '#2a0e18', kw2: '#5a1426', kt: '#ffd25a', kg: '#ff3050', kx: '#c8c8d0' },
    back(g, sk, p, c, R, o) {   // little bat wings + a short cape
      const T = o.T || 0, flap = Math.sin(T * 0.14) * 0.18, root = [sk.neck[0] - 8, sk.neck[1] + 14];
      for (const [far, k] of [[1, 0.8], [0, 1]]) {
        const b = addP(root, far ? [6, -4] : [0, 0]), a0 = Math.PI + 0.5 + flap - far * 0.2;
        const t1 = addP(b, polar(a0 - 0.5, 34 * k)), t2 = addP(b, polar(a0, 42 * k)), t3 = addP(b, polar(a0 + 0.55, 30 * k));
        poly(g, [b, t1, addP(b, polar(a0 - 0.25, 22 * k)), t2, addP(b, polar(a0 + 0.28, 20 * k)), t3], far ? c.kw2 : c.kw, R, 2);
      }
      cosCape(g, sk, c, R, o, { len: 0.42, flare: 4, col: c.kc, lin: c.kl, w: 0.85 });
    },
    neck(g, sk, p, c, R) {   // spiked collar
      const n = sk.neck; poly(g, [[n[0] - 12, n[1] + 6], [n[0] - 10, n[1] - 2], [n[0] + 11, n[1] - 4], [n[0] + 13, n[1] + 4]], c.kc, R, 2);
      for (const dx of [-7, 0, 7]) poly(g, [[n[0] + dx - 2.5, n[1] + 4], [n[0] + dx, n[1] + 10], [n[0] + dx + 2.5, n[1] + 4]], c.kx, R, 1.2);
    },
    head(g, r, c, R) { g.save(); g.translate(0.15 * r, -0.12 * r); g.rotate(0.22); cosCrown(g, r, R, { y: -1.0, h: 0.42, n: 3, col: c.kt, gem: c.kg, x0: -0.42, x1: 0.48 }); g.restore(); },
  },
  reika: { n: 'SUPREME COMMANDER', jp: '最高司令官', pal: { kc: '#16141c', kl: '#a00c24', kt: '#d8b040', kh: '#1a1820', kb: '#a00c24', ke: '#d8b040' },
    ropes: [{ id: 'crs', at: sk => [sk.sB[0] - 8, sk.sB[1] + 4], n: 4, seg: 10, w0: 7, w1: 8, color: 'kc', grav: 0.6, wind: 0.3 }],
    back(g, sk, p, c, R, o) { cosCape(g, sk, c, R, o, { len: 0.9, flare: 14, col: c.kc, lin: c.kl, trim: c.kt }); },
    head(g, r, c, R) {   // peaked officer cap
      poly(g, [[-1.0 * r, -0.66 * r], [-1.08 * r, -1.18 * r], [0.15 * r, -1.55 * r], [1.08 * r, -1.2 * r], [1.02 * r, -0.72 * r]], c.kh, R);
      poly(g, [[-1.02 * r, -0.84 * r], [1.04 * r, -0.86 * r], [1.03 * r, -0.66 * r], [-1.0 * r, -0.62 * r]], c.kb, R, 2);
      poly(g, [[0.55 * r, -0.72 * r], [1.5 * r, -0.58 * r], [1.42 * r, -0.44 * r], [0.5 * r, -0.56 * r]], OUTLINE, R, 1.5);
      if (R.mono) return;
      g.fillStyle = c.kt; g.beginPath(); g.moveTo(0.45 * r, -1.22 * r); g.lineTo(0.58 * r, -0.98 * r); g.lineTo(0.45 * r, -0.82 * r); g.lineTo(0.32 * r, -0.98 * r); g.closePath(); g.fill();
      g.strokeStyle = c.kt; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0.6 * r, -0.7 * r); g.lineTo(1.4 * r, -0.6 * r); g.stroke();
    },
    front(g, sk, p, c, R) { cosDrape(g, sk, c, R, c.kc, c.kt, c.kt); cosEpaulette(g, sk.sF, c.ke, R, c.kt); },
  },
  yamika: { n: 'ABYSS QUEEN', jp: '深淵の女王', pal: { kc: '#140e22', kl: '#6a1aa8', kt: '#b070ff', kh: '#2a2236', kh2: '#c8a0ff' },
    back(g, sk, p, c, R, o) { cosCape(g, sk, c, R, o, { len: 0.84, flare: 18, col: c.kc, lin: c.kl, tatter: 8 }); },
    headBack(g, r, c, R) {   // curled demon horns
      cosHorn(g, r, [-0.65, -0.72], [[-0.95, -1.25], [-1.45, -1.4], [-1.65, -1.05], [-1.45, -0.85]], c.kh, R, 0.17);
      cosHorn(g, r, [0.25, -0.92], [[0.15, -1.5], [-0.25, -1.82], [-0.6, -1.7], [-0.55, -1.45]], c.kh, R, 0.17);
      if (!R.mono) { g.strokeStyle = c.kh2; g.lineWidth = 0.04 * r; g.beginPath(); g.moveTo(0.18 * r, -1.2 * r); g.lineTo(0.08 * r, -1.55 * r); g.stroke(); }
    },
    front(g, sk, p, c, R) { cosDrape(g, sk, c, R, c.kc, c.kt, c.kt); },
  },
  lunaria: { n: 'SILVER ARCHON', jp: '銀の大天使', pal: { kc: '#eef0fa', kl: '#5a6ad8', kt: '#b8c4e8', km: '#fff6c8', kr: '#d8e0ff' },
    back(g, sk, p, c, R, o) {
      // halo of seven moons behind the head
      const H = sk.head, T = o.T || 0, cx = H[0] - 6, cy = H[1] - 6;
      if (!R.mono) {
        g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = c.kr; g.lineWidth = 2; g.globalAlpha = 0.7; g.shadowColor = c.kr; g.shadowBlur = FX.hq ? 10 : 0;
        g.beginPath(); g.arc(cx, cy, 46, 0, TAU); g.stroke(); g.restore();
        for (let i = 0; i < 7; i++) { const a = T * 0.01 + i * TAU / 7, x = cx + Math.cos(a) * 46, y = cy + Math.sin(a) * 46; g.fillStyle = c.km; g.beginPath(); g.arc(x, y, 4.5, 0, TAU); g.fill(); g.fillStyle = 'rgba(20,20,60,0.85)'; g.beginPath(); g.arc(x + 2, y - 1, 3.6, 0, TAU); g.fill(); }
      }
      cosCape(g, sk, c, R, o, { len: 0.97, flare: 18, col: c.kc, lin: c.kl, trim: c.kt });
    },
    front(g, sk, p, c, R) { cosDrape(g, sk, c, R, c.kc, c.kt, c.km); },
  },
  honored: { n: 'HEAVEN\'S HAORI', jp: '天の羽織', pal: { kc: '#f6f8fc', kl: '#4aa8ff', kt: '#7ac8ff', kb: '#3a2a22', kb2: '#e8c070' },
    back(g, sk, p, c, R, o) {
      cosCape(g, sk, c, R, o, { len: 0.72, flare: 12, col: c.kc, lin: c.kl, trim: c.kt });
      if (R.mono) return; const h = sk.hip, fy = lerp(sk.neck[1], cosFloor(sk), 0.72);
      g.strokeStyle = c.kt; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 6; i++) { const x = h[0] - 30 + i * 7, y = fy - 9 + (i % 2 ? -3 : 3); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();   // cloud-wave hem pattern
    },
    neck(g, sk, p, c, R) {   // prayer-bead necklace
      const n = sk.neck;
      for (let i = 0; i <= 8; i++) { const a = 0.25 + i * (Math.PI - 0.5) / 8; circ(g, n[0] + 1 + Math.cos(a) * 13, n[1] + 3 + Math.sin(a) * 12, i === 4 ? 3.4 : 2.4, i === 4 ? c.kb2 : c.kb, R); }
    },
    front(g, sk, p, c, R) { cosDrape(g, sk, c, R, c.kc, c.kt, null); },
  },
  hollow: { n: 'THE VEILED KING', jp: '帳の王', glow: null, pal: { kc: '#1e1828', kl: '#4c2470', kt: '#c4c0d4', kv: 'rgba(16,10,26,0.62)', kv2: 'rgba(16,10,26,0.42)', kk: '#d6d2e4', kd: '#6a6680', kg: '#a36bff' },
    ropes: [{ id: 'chm1', at: sk => [sk.hip[0] - 24, sk.hip[1] + 20], n: 4, seg: 10, w0: 9, w1: 6, color: 'kc', grav: 0.55, wind: 0.5 }],
    back(g, sk, p, c, R, o) { cosCape(g, sk, c, R, o, { len: 1.0, flare: 22, col: c.kc, lin: c.kl, trim: c.kt, tatter: 5, w: 1.1 }); },
    headBack(g, r, c, R, o) {   // the veil falling down his back
      const sw = cosSway(o, 0.25, 0.05) * r / 26 * 3;
      const pts = [[-0.55 * r, -1.0 * r], [0.35 * r, -1.08 * r], [0.2 * r, -0.2 * r], [-0.3 * r, 1.3 * r], [(-0.8 + sw * 0.01) * r, 3.4 * r], [(-1.6 + sw * 0.02) * r, 3.2 * r], [-1.55 * r, 1.0 * r], [-1.25 * r, -0.35 * r]];
      if (R.mono) { poly(g, pts, R.mono, R); return; }
      g.save(); g.fillStyle = c.kv; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(200,190,230,0.35)'; g.lineWidth = 1.4; g.stroke(); g.restore();
    },
    head(g, r, c, R, o) {
      // sheer veil over the featureless face, lace hem at the chin
      if (!R.mono) {
        g.save(); g.fillStyle = c.kv2; g.beginPath(); g.moveTo(-0.8 * r, -0.85 * r); g.quadraticCurveTo(0.2 * r, -1.25 * r, 1.08 * r, -0.7 * r);
        g.quadraticCurveTo(1.22 * r, 0.3 * r, 1.02 * r, 0.95 * r);
        for (let i = 0; i <= 6; i++) { const x = lerp(1.02, -0.7, i / 6) * r, y = (0.95 + (i % 2 ? 0.1 : 0) + i * 0.04) * r; g.lineTo(x, y); }
        g.closePath(); g.fill(); g.strokeStyle = 'rgba(210,200,240,0.4)'; g.lineWidth = 1.2; g.stroke();
        g.strokeStyle = 'rgba(210,200,240,0.25)'; g.lineWidth = 0.8; for (const x of [-0.2, 0.3, 0.75]) { g.beginPath(); g.moveTo(x * r, -0.9 * r); g.lineTo((x + 0.08) * r, 0.95 * r); g.stroke(); }
        g.restore();
      }
      // a pale iron crown with violet gems
      cosCrown(g, r, R, { y: -0.86, h: 0.58, n: 5, col: c.kk, dark: c.kd, gem: c.kg, x0: -0.82, x1: 0.86, tilt: -0.08 });
    },
    front(g, sk, p, c, R) {
      cosDrape(g, sk, c, R, c.kc, c.kt, null);
      if (R.mono) return; const n = sk.neck;   // silver chain clasp
      g.strokeStyle = c.kt; g.lineWidth = 1.5; g.beginPath(); g.moveTo(n[0] - 4, n[1] + 6); g.quadraticCurveTo(n[0] + 4, n[1] + 14, n[0] + 12, n[1] + 8); g.stroke();
      g.fillStyle = c.kg; g.beginPath(); g.arc(n[0] + 4, n[1] + 11, 2.4, 0, TAU); g.fill();
    },
  },
  kanae: { n: 'THORN QUEEN', jp: '茨の女王', pal: { kc: '#16301e', kl: '#6a0c1e', kt: '#3e6a2a', kv: '#2e5a24', kr: '#d0103a', kr2: '#ff5a7a' },
    back(g, sk, p, c, R, o) { cosCape(g, sk, c, R, o, { len: 0.62, flare: 12, col: c.kc, lin: c.kl, trim: c.kt, tatter: 4 }); },
    head(g, r, c, R) {   // a crown of thorny vines with three roses
      if (!R.mono) {
        g.strokeStyle = OUTLINE; g.lineWidth = 0.14 * r; g.beginPath(); g.moveTo(-0.95 * r, -0.62 * r); g.quadraticCurveTo(0, -1.38 * r, 1.0 * r, -0.86 * r); g.stroke();
        g.strokeStyle = c.kv; g.lineWidth = 0.08 * r; g.stroke();
        g.fillStyle = c.kv; for (let i = 0; i < 7; i++) { const t = i / 6, x = lerp(-0.9, 0.95, t) * r, y = (-0.66 - Math.sin(t * Math.PI) * 0.5 - t * 0.2) * r; g.beginPath(); g.moveTo(x - 2, y); g.lineTo(x + 1, y - 0.2 * r); g.lineTo(x + 2.5, y); g.fill(); }
      } else poly(g, [[-0.95 * r, -0.62 * r], [0, -1.2 * r], [1.0 * r, -0.86 * r], [0, -1.0 * r]], R.mono, R);
      cosRose(g, -0.55 * r, -1.0 * r, 0.17 * r, c.kr, R); cosRose(g, 0.1 * r, -1.18 * r, 0.21 * r, c.kr2, R); cosRose(g, 0.7 * r, -1.0 * r, 0.16 * r, c.kr, R);
    },
    front(g, sk, p, c, R) { cosDrape(g, sk, c, R, c.kc, c.kt, null); cosRose(g, sk.neck[0] + 4, sk.neck[1] + 9, 4, c.kr, R); },
  },
  tokine: { n: 'MIDNIGHT ORACLE', jp: '真夜中の神託', pal: { kc: '#1a0e14', kl: '#ffcf5a', kt: '#ffcf5a', kf: 'rgba(255,214,120,0.16)', kr: '#ffcf5a', kh: '#c8102e' },
    ropes: [{ id: 'ctr1', at: (sk, r) => headPt(sk, -r * 0.6, -r * 0.9), n: 7, seg: 10, w0: 3.5, w1: 3, color: 'kr', grav: 0.45, wind: 0.6 },
      { id: 'ctr2', at: (sk, r) => headPt(sk, -r * 0.95, -r * 0.5), n: 6, seg: 10, w0: 3.5, w1: 3, color: 'kh', grav: 0.5, wind: 0.5 }],
    back(g, sk, p, c, R, o) {   // a great clock face turning behind her
      const H = sk.head, T = o.T || 0, cx = H[0] - 14, cy = H[1] + 10, rr = 54;
      if (R.mono) { g.globalAlpha *= 0.4; g.fillStyle = R.mono; g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.fill(); g.globalAlpha /= 0.4; return; }
      g.save(); g.fillStyle = c.kf; g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.fill();
      g.strokeStyle = OUTLINE; g.lineWidth = 5; g.stroke(); g.strokeStyle = c.kr; g.lineWidth = 3; g.stroke();
      g.beginPath(); g.arc(cx, cy, rr - 8, 0, TAU); g.lineWidth = 1; g.stroke();
      for (let i = 0; i < 12; i++) { const a = i * TAU / 12, L = i % 3 ? 4 : 8; g.lineWidth = i % 3 ? 1.5 : 3; g.beginPath(); g.moveTo(cx + Math.cos(a) * (rr - 8), cy + Math.sin(a) * (rr - 8)); g.lineTo(cx + Math.cos(a) * (rr - 8 - L), cy + Math.sin(a) * (rr - 8 - L)); g.stroke(); }
      const ah = T * 0.004 - 1.2, am = T * 0.05;
      g.strokeStyle = c.kh; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ah) * 24, cy + Math.sin(ah) * 24); g.stroke();
      g.strokeStyle = c.kr; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(am) * 38, cy + Math.sin(am) * 38); g.stroke();
      g.restore();
      cosCape(g, sk, c, R, o, { len: 0.44, flare: 6, col: c.kc, lin: c.kl, trim: c.kt, w: 0.9 });
    },
    front(g, sk, p, c, R) { cosDrape(g, sk, c, R, c.kc, c.kt, c.kr); },
  },
  hachi: { n: 'WHITE SHRINE', jp: '白い社', pal: { kc: '#f2efe8', kl: '#b01428', kt: '#d8b45a', ks: '#ffffff', kr: '#c8102e' },
    back(g, sk, p, c, R, o) { cosCape(g, sk, c, R, o, { len: 0.96, flare: 12, col: c.kc, lin: c.kl, trim: c.kt, tatter: 5 }); },
    head(g, r, c, R, o) {   // a red cord around the crown and paper shide streamers hanging from the brim
      if (R.mono) return;
      g.strokeStyle = c.kr; g.lineWidth = 0.09 * r; g.beginPath(); g.moveTo(-0.78 * r, -1.0 * r); g.quadraticCurveTo(0.05 * r, -0.9 * r, 0.88 * r, -1.03 * r); g.stroke();
      const T = (o && o.T) || 0;
      for (const [bx, k] of [[1.62, 0], [1.2, 1], [-1.3, 2], [-0.9, 3]]) {
        const x = bx * r, y = -0.7 * r + (bx > 0 ? -0.08 * r : 0.06 * r), sw = Math.sin(T * 0.07 + k) * 0.05 * r, w = 0.16 * r;
        g.fillStyle = c.ks; g.strokeStyle = OUTLINE; g.lineWidth = 1.2; g.beginPath();
        g.moveTo(x - w * 0.5, y); g.lineTo(x + w * 0.5, y); g.lineTo(x + w * 0.5 + sw, y + 0.3 * r); g.lineTo(x - w * 0.2 + sw, y + 0.3 * r); g.lineTo(x - w * 0.2 + sw * 1.4, y + 0.62 * r); g.lineTo(x - w * 0.9 + sw * 1.4, y + 0.62 * r); g.lineTo(x - w * 0.9 + sw * 1.6, y + 0.9 * r); g.lineTo(x - w * 1.5 + sw * 1.6, y + 0.9 * r);
        g.lineTo(x - w * 1.5 + sw * 1.2, y + 0.56 * r); g.lineTo(x - w * 0.9 + sw, y + 0.56 * r); g.lineTo(x - w * 0.9 + sw * 0.6, y + 0.26 * r); g.lineTo(x - w * 0.5, y + 0.26 * r); g.closePath(); g.fill(); g.stroke();
      }
    },
    front(g, sk, p, c, R) { cosDrape(g, sk, c, R, c.kc, c.kt, c.kr); },
  },
  kuchi: { n: 'SCARLET NIGHT', jp: '緋色の夜', pal: { top: '#7a0c18', uarm: '#7a0c18', farm: '#7a0c18', cuff: '#4a0610', coat: '#7a0c18', coat2: '#5a0812', collar: '#1a1014', lining: '#120a0c', belt: '#1a1014', scarf: '#141016', maskC: '#1c181e',
    kc: '#5a0812', kl: '#120a0c', kt: '#d8b45a', kh: '#141016', kr: '#e0203a' },
    back(g, sk, p, c, R, o) { cosCape(g, sk, c, R, o, { len: 0.82, flare: 10, col: c.kc, lin: c.kl, trim: c.kt }); },
    head(g, r, c, R) {   // a small black cloche hat with a red band and a rose
      g.save(); g.translate(0.06 * r, -0.74 * r); g.rotate(-0.08);
      g.beginPath(); g.ellipse(0, 0, 1.2 * r, 0.22 * r, 0, 0, TAU); if (!R.mono) { g.strokeStyle = OUTLINE; g.lineWidth = R.ol * 2; g.stroke(); } g.fillStyle = R.mono || c.kh; g.fill(); g.restore();
      polyR(g, r, [[-0.86, -0.72], [-0.8, -1.22], [-0.34, -1.48], [0.4, -1.44], [0.88, -1.06], [0.96, -0.74]], c.kh, R);
      if (R.mono) return;
      g.fillStyle = c.kr; g.beginPath(); g.moveTo(-0.84 * r, -0.9 * r); g.quadraticCurveTo(0.05 * r, -0.82 * r, 0.94 * r, -0.92 * r); g.lineTo(0.95 * r, -0.76 * r); g.quadraticCurveTo(0.05 * r, -0.68 * r, -0.85 * r, -0.76 * r); g.closePath(); g.fill();
      cosRose(g, -0.62 * r, -0.86 * r, 0.16 * r, c.kr, R);
    },
    front(g, sk, p, c, R) { cosDrape(g, sk, c, R, c.kc, c.kt, c.kr); },
  },
};

// ---------------- registration: slot 5 for every fighter ----------------
function cosPal(ch) { const A = ARC[ch.id]; return A ? (ch._cosPal || (ch._cosPal = { ...ch.colors, ...A.pal, cos: ch.id })) : null; }
function cosOf(ch, c) {
  const id = (c && c.cos) || (RC.cos === ch.id ? ch.id : null);
  return id === ch.id ? ARC[id] || null : null;
}
for (const ch of CHARS) {
  const L = VARIANTS[ch.id] || (VARIANTS[ch.id] = VAR_FALLBACK.map(v => ({ ...v })));
  const A = ARC[ch.id];
  if (A && !L[ARC_VI - 1]) L[ARC_VI - 1] = { n: A.n, rules: A.rules || [], special: 'arcade', cos: ch.id, pal: A.pal };
  if (!L[ARC_VI - 1]) L[ARC_VI - 1] = { n: 'ARCADE', rules: [{ dh: 60 }], special: 'arcade' };   // fighters added later without a costume
  if (A) { const ov = ch.varColors; ch.varColors = vi => vi === ARC_VI ? cosPal(ch) : ov ? ov(vi) : null; }
}

// ---------------- the Frog Trinity: tiny crowns for all three, a royal cape on the big one ----------------
{
  const fd = FROGS.drawCustom;
  FROGS.drawCustom = function (g, ch, p, x, y, facing, o) {
    const c = o.pal || (RC.pal && RC.pal[ch.id]) || null, on = (c && c.cos === 'frogs') || RC.cos === 'frogs';
    if (!on) return fd.call(this, g, ch, p, x, y, facing, o);
    const P = c && c.cos ? c : cosPal(ch), s = ch.scale * (o.scale || 1), T = o.T || 0, R = { mono: o.mono || null, ol: 2.2 }, L = frogLayout(p, T);
    const at = (f, body) => { g.save(); g.translate(x, y); g.scale(facing * s, s); if (p.rot) { g.translate(0, -50); g.rotate(p.rot); g.translate(0, 50); } g.translate(f.x, f.y); g.rotate(f.rot || 0); body(); g.restore(); };
    const B = FROG.big, sw = cosSway(o, 1, 0.06);
    at(L.big, () => {   // cape behind the big frog
      poly(g, [[-0.2 * B.w, -0.95 * B.h], [0.2 * B.w, -0.9 * B.h], [-0.25 * B.w, -0.1 * B.h], [-0.72 * B.w + sw, 0.02 * B.h], [-0.6 * B.w, -0.7 * B.h]], P.kc, R);
      if (!R.mono) { g.strokeStyle = P.kl; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-0.25 * B.w, -0.1 * B.h); g.lineTo(-0.72 * B.w + sw, 0.02 * B.h); g.stroke(); cosFur(g, [[-0.6 * B.w, -0.72 * B.h], [-0.2 * B.w, -0.96 * B.h], [0.2 * B.w, -0.92 * B.h]], P.kt, R, 5); }
    });
    fd.call(this, g, ch, p, x, y, facing, o);
    for (const [k, sp] of [['mid', FROG.mid], ['big', FROG.big], ['small', FROG.small]]) {
      if (k === 'small' && (p.ph || 0) >= 0.5) continue;
      const er = (sp.eye === 'sparkle' ? 0.25 : 0.19) * sp.w, sz = sp.w / 26 * (k === 'big' ? 0.36 : 0.42);
      at(L[k], () => { g.translate(0.1 * sp.w, -1.0 * sp.h - er * 0.7); g.rotate(-0.08); cosCrown(g, 26 * sz, R, { y: 0, h: 0.6, n: k === 'big' ? 3 : 2, col: P.kg, gem: k === 'small' ? P.kc : P.kj, x0: -0.6, x1: 0.6, tilt: 0 }); });
    }
  };
}
