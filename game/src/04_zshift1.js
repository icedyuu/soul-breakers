// ===================== THE BEAST SHIFTER — PART 1: BEAST ART =====================
// Five fully procedural creatures with their own silhouettes. They are posed with the beast pose keys
// bp (pitch) bh (head) bj (jaw) bf (fore limb) bb (hind limb) bw (wings / fins / antler glow)
// bt (tail) bq (crouch) bx (lunge) bv (lift), plus wk/wc (gait) and rot (whole-body spin).
const bRend = o => ({ mono: o.mono || null, ol: 2.4 });
function rotP(p, a, o = [0, 0]) { const c = Math.cos(a), s = Math.sin(a), x = p[0] - o[0], y = p[1] - o[1]; return [o[0] + x * c - y * s, o[1] + x * s + y * c]; }
function qpts(a, c, b, n) { const out = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); } return out; }
const lerpP = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const addP = (a, b) => [a[0] + b[0], a[1] + b[1]];
const polar = (a, L) => [Math.cos(a) * L, Math.sin(a) * L];
// a tapered tube through points: outlines first, then fills (no seams)
function tube(g, pts, r0, r1, col, R) {
  const n = pts.length - 1, rr = i => Math.max(0.5, lerp(r0, r1, i / n));
  if (!R.mono) { g.fillStyle = OUTLINE; for (let i = 0; i < n; i++) { capsule(g, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], rr(i) + R.ol, rr(i + 1) + R.ol); g.fill(); } }
  g.fillStyle = R.mono || col; for (let i = 0; i < n; i++) { capsule(g, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], rr(i), rr(i + 1)); g.fill(); }
}
function bstroke(g, pts, w, col, R, glow) {
  g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
  if (!R.mono) { g.strokeStyle = OUTLINE; g.lineWidth = w + R.ol * 2; g.stroke(); }
  g.strokeStyle = R.mono || col; g.lineWidth = w; g.stroke();
  if (glow && !R.mono) { g.save(); g.globalCompositeOperation = 'lighter'; g.shadowColor = glow; g.shadowBlur = 12; g.strokeStyle = glow; g.lineWidth = Math.max(1, w * 0.35); g.stroke(); g.restore(); }
}
function glowLine(g, pts, col, w, R, blur = 10) {
  if (R.mono) return;
  g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = col; g.lineWidth = w; g.shadowColor = col; g.shadowBlur = FX.hq ? blur : 0;
  g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); g.restore();
}
function glowEye(g, x, y, rx, ry, col, R, rot = 0) {
  if (R.mono) return;
  g.save(); g.shadowColor = col; g.shadowBlur = FX.hq ? 14 : 0; g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x + rx * 0.2, y, rx * 0.35, ry * 0.45, rot, 0, TAU); g.fill(); g.restore();
}
function claws(g, P, dir, n, len, col, R) {
  for (let i = 0; i < n; i++) {
    const a = dir + (i - (n - 1) / 2) * 0.32, b = addP(P, polar(a, len)), m = addP(P, polar(a - 0.25, len * 0.55));
    poly(g, [addP(P, polar(a + 1.3, 3)), m, b, addP(P, polar(a - 1.3, 3))], col, R, 2.5);
  }
}
function bodyFrame(g, x, y, facing, s, p, pivotY, ox = 0) {
  g.save(); g.translate(x, y); g.scale(facing * s, s); g.translate(ox, 0); g.lineJoin = 'round'; g.lineCap = 'round';
  if (p.rot) { g.translate(0, pivotY); g.rotate(p.rot); g.translate(0, -pivotY); }
}

// ------------------------------ shared parts (also used by the hybrid) ------------------------------
function drakeHead(g, R, c, jaw, T, fire) {
  // horns
  tube(g, qpts([-4, -14], [-34, -44], [-64, -40], 5), 7.5, 2, c.horn, R);
  tube(g, qpts([6, -16], [-14, -52], [-40, -60], 5), 6.5, 1.8, c.horn, R);
  g.save(); g.translate(-6, 8); g.rotate(jaw * 0.62); g.translate(6, -8);
  poly(g, [[-8, 6], [58, 6], [52, 18], [6, 22], [-8, 16]], c.body2, R);
  if (!R.mono) { g.fillStyle = '#fff6e0'; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(14 + i * 9, 6); g.lineTo(18 + i * 9, -1); g.lineTo(22 + i * 9, 6); g.fill(); } }
  g.restore();
  poly(g, [[-16, -14], [16, -18], [50, -10], [68, -2], [66, 7], [40, 8], [-10, 14], [-20, 2]], c.body, R);
  if (!R.mono) {
    g.fillStyle = '#fff6e0'; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(16 + i * 9, 7); g.lineTo(20 + i * 9, 14); g.lineTo(24 + i * 9, 7); g.fill(); }
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1.5; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(-4 + i * 12, -6, 6, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    g.fillStyle = c.accent; g.beginPath(); g.ellipse(63, -1, 3, 2, 0, 0, TAU); g.fill();
  }
  glowEye(g, 24, -7, 6.5, 3, c.eye, R, -0.15);
  if (fire && !R.mono && jaw > 0.25) {
    g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(62, 10, 2, 62, 10, 34); gr.addColorStop(0, 'rgba(255,240,180,0.9)'); gr.addColorStop(1, 'rgba(255,80,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(62, 10, 34, 0, TAU); g.fill(); g.restore();
  }
}
function stagAntlers(g, R, c, glow, T) {
  const L = 1 + glow * 0.25;
  const beam = (ox, tilt, k) => {
    const main = qpts([ox, -10], [ox - 18 * L, -60 * L], [ox - 52 * L + tilt, -104 * L], 6);
    const tines = [[2, -0.9, 30], [3, -1.6, 28], [4, -0.6, 24], [5, -1.9, 22]].map(([i, a, l]) => [main[i], addP(main[i], polar(a + tilt * 0.01, l * L * k))]);
    for (const [a, b] of tines) bstroke(g, [a, b], 4.2 * k, c.antler, R);
    bstroke(g, main, 6 * k, c.antler, R);
    if (!R.mono) { glowLine(g, main, c.mark, 2, R, 14 + glow * 10); for (const [a, b] of tines) glowLine(g, [a, b], c.mark, 1.5, R, 10 + glow * 8); }
  };
  beam(-6, 6, 0.85); beam(4, -4, 1);
  if (!R.mono && glow > 0.2) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = glow * (0.5 + 0.3 * Math.sin(T * 0.2)); const gr = g.createRadialGradient(-30, -80, 4, -30, -80, 90); gr.addColorStop(0, 'rgba(255,245,200,0.7)'); gr.addColorStop(1, 'rgba(255,220,120,0)'); g.fillStyle = gr; g.beginPath(); g.arc(-30, -80, 90, 0, TAU); g.fill(); g.restore(); }
}
// a feathered wing. root, spread 0..1, flap angle offset, length scale
function ravenWing(g, R, c, root, spread, flap, L0, col) {
  const th = lerp(2.55, 4.25, spread) + flap, Lw = L0 * (0.62 + 0.38 * spread);
  const WE = addP(root, polar(th - 0.38, Lw * 0.42)), WT = addP(root, polar(th, Lw));
  const pts = [root, WE, WT];
  const sp = 0.06 + 0.11 * spread;
  for (let i = 1; i <= 7; i++) {
    const a = th + 0.08 + i * sp, l = Lw * (1 - i * 0.07);
    pts.push(addP(root, polar(a, l))); pts.push(addP(root, polar(a + sp * 0.35, l * 0.82)));
  }
  pts.push(addP(root, polar(th + 8 * sp + 0.3, Lw * 0.3)));
  poly(g, pts, col || c.body, R);
  if (!R.mono) {
    g.strokeStyle = c.sheen; g.lineWidth = 1.6;
    for (let i = 1; i <= 7; i++) { const a = th + 0.08 + i * sp; g.beginPath(); g.moveTo(...addP(root, polar(a, Lw * 0.35))); g.lineTo(...addP(root, polar(a, Lw * (1 - i * 0.07) * 0.92))); g.stroke(); }
    g.strokeStyle = c.accent; g.globalAlpha *= 0.6; g.beginPath(); g.moveTo(...root); g.lineTo(...WE); g.lineTo(...WT); g.stroke(); g.globalAlpha /= 0.6;
  }
  return WT;
}
function drakeWing(g, R, c, root, spread, col) {
  const t1 = lerp(-2.55, -1.65, spread), L1 = 44 + 48 * spread, t2 = lerp(-3.2, -2.35, spread), L2 = 70 + 66 * spread;
  const WE = addP(root, polar(t1, L1)), WT = addP(WE, polar(t2, L2));
  const F1 = addP(WE, polar(t2 + 0.55 + 0.2 * spread, 56 + 62 * spread)), F2 = addP(WE, polar(t2 + 1.0 + 0.35 * spread, 44 + 46 * spread)), B0 = addP(root, [-54 - 40 * spread, 16]);
  const mem = [root, WE, WT, lerpP(WT, F1, 0.5), F1, lerpP(F1, F2, 0.5), F2, lerpP(F2, B0, 0.5), B0];
  poly(g, mem, col || c.wing, R);
  if (!R.mono) {
    g.save(); g.beginPath(); mem.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.clip();
    const gr = g.createLinearGradient(...WE, ...B0); gr.addColorStop(0, 'rgba(255,110,40,0.05)'); gr.addColorStop(1, 'rgba(255,110,40,0.45)'); g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1.5; for (const F of [F1, F2]) { g.beginPath(); g.moveTo(...lerpP(WE, F, 0.15)); g.quadraticCurveTo(...lerpP(lerpP(WE, F, 0.5), B0, 0.15), ...lerpP(F, B0, 0.2)); g.stroke(); }
    g.restore();
  }
  tube(g, [root, WE, WT], 4.5, 2, c.body, R); tube(g, [WE, F1], 2.6, 1.4, c.body, R); tube(g, [WE, F2], 2.6, 1.4, c.body, R);
  poly(g, [WE, addP(WE, [-4, -14]), addP(WE, [6, -6])], c.horn, R, 2);
}

// ------------------------------ 1. THE DRAKE ------------------------------
function drawDrake(g, ch, p, x, y, facing, o) {
  const s = ch.scale * (o.scale || 1), R = bRend(o), T = o.T || 0, c = o.pal || ch.colors, q = p.bq;
  bodyFrame(g, x, y, facing, s, p, -90, -52);
  const br = Math.sin(T * 0.05) * 2.5, C = [p.bx, -104 + p.bv + q * 28 + br * 0.4], a = p.bp;
  const Wd = v => addP(C, rotP(v, a));
  const S = Wd([46, -12]), Hp = Wd([-44, 2]), N = Wd([70, -28]), Tb = Wd([-80, 6]), Wr = Wd([2, -36]);
  const up = -Math.min(0, p.bv) * 0.9, lN = Math.max(0, p.wc) * 10 + up, lF = Math.max(0, -p.wc) * 10 + up;
  const hind = (foot, lift, col) => { const K = [Hp[0] + 22, lerp(Hp[1], 0, 0.42)], A = [foot - 12, -20 - lift]; tube(g, [Hp, K, A, [foot, -4 - lift]], 25, 10, col, R); ell(g, foot + 6, -5 - lift, 15, 7, col, R); claws(g, [foot + 16, -5 - lift], 0.15, 3, 12, c.claw, R); };
  const fore = (bf, foot, lift, col) => {
    const aa = 0.15 + bf * 1.05, E1 = addP(S, polar(Math.PI / 2 - aa, 46)), P1 = addP(E1, polar(Math.PI / 2 - aa - 0.45, 46));
    const E0 = [S[0] - 4, lerp(S[1], 0, 0.5)], P0 = [foot, -6 - lift], t = clamp(bf / 0.55, 0, 1);
    const E = lerpP(E0, E1, t), P = lerpP(P0, P1, t);
    tube(g, [S, E, P], 21, 10, col, R); ell(g, P[0] + 4, P[1], 12, 8, col, R);
    claws(g, addP(P, [8, 0]), Math.atan2(P[1] - E[1], P[0] - E[0]), 3, 18 + t * 6, c.claw, R);
  };
  // far side
  if (!R.mono) g.globalAlpha *= 0.999;
  drakeWing(g, R, c, addP(Wr, [-10, -6]), Math.min(1, p.bw * 1.1), R.mono || c.wing2);
  fore(p.bf * 0.35, S[0] + 22 - p.wk * 16, lF, R.mono || c.body2);
  hind(Hp[0] + 12 - p.wk * 16, lF, R.mono || c.body2);
  // tail
  const tw = Math.sin(T * 0.07) * 12;
  const tpts = qpts(Tb, [Tb[0] - 50, Tb[1] + 40], [Tb[0] - 122, Tb[1] + 10 - p.bt * 80 + tw], 7);
  tube(g, tpts, 25, 4, c.body, R);
  if (!R.mono) { const tp = tpts[7]; g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(tp[0], tp[1], 1, tp[0], tp[1], 22); gr.addColorStop(0, 'rgba(255,220,120,0.9)'); gr.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(tp[0], tp[1], 22, 0, TAU); g.fill(); g.restore(); }
  // body
  ell(g, C[0], C[1], 76, 42, c.body, R, a);
  if (!R.mono) {
    g.save(); g.beginPath(); g.ellipse(C[0], C[1], 76, 42, a, 0, TAU); g.clip();
    g.fillStyle = c.belly; g.beginPath(); g.ellipse(C[0] + 6, C[1] + 30, 64, 22, a, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2; for (let i = -4; i <= 4; i++) { const b = Wd([i * 14, 22]); g.beginPath(); g.moveTo(b[0], b[1] - 4); g.lineTo(b[0] - 3, b[1] + 22); g.stroke(); }
    const core = Wd([36, 8]); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(core[0], core[1], 2, core[0], core[1], 46);
    gr.addColorStop(0, `rgba(255,170,60,${0.45 + 0.15 * Math.sin(T * 0.15)})`); gr.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = gr; g.fillRect(C[0] - 90, C[1] - 60, 180, 120);
    g.restore();
  }
  for (let i = 0; i < 6; i++) { const b = Wd([-58 + i * 22, -38 + Math.abs(i - 2.5) * 2]), tip = Wd([-64 + i * 22, -62 + Math.abs(i - 2.5) * 3]); poly(g, [addP(b, [-8, 2]), tip, addP(b, [8, 2])], c.body2, R, 3); if (!R.mono) { g.fillStyle = c.accent; g.beginPath(); g.arc(tip[0], tip[1] + 4, 2.4, 0, TAU); g.fill(); } }
  drakeWing(g, R, c, Wr, p.bw, null);
  hind(Hp[0] - 6 + p.wk * 18, lN, c.body);
  // neck + head
  const ang = -0.78 + p.bh, H = addP(N, polar(ang, 60));
  tube(g, [N, addP(N, addP(polar(ang, 30), [4, -6])), H], 27, 17, c.body, R);
  g.save(); g.translate(...H); g.rotate(ang * 0.55 + 0.25 + p.bh * 0.25); drakeHead(g, R, c, p.bj, T, true); g.restore();
  fore(p.bf, S[0] + 6 + p.wk * 18, lN, c.body);
  g.restore();
}

// ------------------------------ 2. THE PHANTOM WOLF ------------------------------
function wolfBody(g, p, T, R, c) {
  const q = p.bq, br = Math.sin(T * 0.09) * 1.5, C = [p.bx, -66 + p.bv + q * 18 + br], a = p.bp;
  const Wd = v => addP(C, rotP(v, a));
  const S = Wd([40, -4]), Hp = Wd([-40, -2]), N = Wd([52, -14]);
  const run = Math.abs(p.wk) + Math.abs(p.wc) > 0.2;
  const legF = (ph, col, bf) => {
    const aa = 0.12 + bf * 1.1, sw = run ? Math.sin(ph) * 22 : 0, lift = run ? Math.max(0, Math.cos(ph)) * 12 : 0;
    const E0 = [S[0] + 4 + sw * 0.4, lerp(S[1], 0, 0.5)], P0 = [S[0] + 8 + sw, -3 - lift];
    const E1 = addP(S, polar(Math.PI / 2 - aa, 32)), P1 = addP(E1, polar(Math.PI / 2 - aa - 0.35, 34)), t = clamp(bf / 0.5, 0, 1);
    const E = lerpP(E0, E1, t), P = lerpP(P0, P1, t);
    tube(g, [S, E, P], 11, 5, col, R); claws(g, P, Math.atan2(P[1] - E[1], P[0] - E[0]), 3, 9 + t * 8, c.claw, R);
  };
  const legH = (ph, col, bb) => {
    const sw = run ? Math.sin(ph) * 24 : 0, lift = run ? Math.max(0, Math.cos(ph)) * 12 : 0, kick = bb * 30;
    const foot = [Hp[0] - 6 - sw - kick, -3 - lift - bb * 20], K = [Hp[0] + 10, Hp[1] + 20], A = [foot[0] - 10, -22 - lift - bb * 16];
    tube(g, [Hp, K, A, foot], 15, 5, col, R); claws(g, foot, 0.1, 3, 8, c.claw, R);
  };
  const ph = (p.wk || 0) * 2;
  legF(ph + 2.4, R.mono || c.body2, p.bf * 0.3); legH(ph + 1.1, R.mono || c.body2, p.bb * 0.5);
  // spectral tail
  const tw = Math.sin(T * 0.12) * 14;
  const tpts = qpts(Wd([-50, -8]), Wd([-84, -18 + tw * 0.3]), [Hp[0] - 104, Hp[1] - 26 + tw - p.bt * 40], 6);
  tube(g, tpts, 12, 2, c.body, R);
  glowLine(g, tpts, c.mark, 2, R);
  // body
  ell(g, Hp[0], Hp[1], 24, 21, c.body, R, a); ell(g, C[0], C[1], 54, 20, c.body, R, a); ell(g, S[0], S[1] + 2, 26, 24, c.body, R, a);
  for (let i = 0; i < 6; i++) { const b = Wd([30 - i * 13, -18 + i * 1.5]); poly(g, [addP(b, [8, 3]), addP(b, [-6 - i, -14 + i]), addP(b, [-8, 4])], c.body2, R, 2); }
  glowLine(g, [Wd([-32, -6]), Wd([-16, 6]), Wd([0, -8]), Wd([16, 6]), Wd([32, -6])], c.mark, 2.2, R);
  glowLine(g, [Wd([-28, 8]), Wd([-6, 14]), Wd([20, 10])], c.mark2, 1.5, R);
  legH(ph + 4.2, c.body, p.bb); legF(ph, c.body, p.bf);
  // neck + head
  const ang = -0.55 + p.bh, H = addP(N, polar(ang, 34));
  tube(g, [N, H], 17, 13, c.body, R);
  g.save(); g.translate(...H); g.rotate(ang * 0.45 + 0.2);
  poly(g, [[-10, -12], [-4, -40], [4, -14]], c.body2, R, 2.5); poly(g, [[2, -14], [12, -38], [16, -10]], c.body, R, 2.5);
  g.save(); g.translate(8, 6); g.rotate(p.bj * 0.75); poly(g, [[-2, 0], [36, 0], [32, 9], [-2, 10]], c.body2, R); if (!R.mono) { g.fillStyle = '#f4f2ff'; g.beginPath(); g.moveTo(28, 0); g.lineTo(31, -6); g.lineTo(33, 0); g.fill(); } g.restore();
  circ(g, 0, 0, 17, c.body, R); poly(g, [[6, -9], [44, -3], [48, 3], [44, 8], [6, 10]], c.body, R);
  if (!R.mono) { g.fillStyle = '#0a0814'; g.beginPath(); g.arc(46, 1, 3, 0, TAU); g.fill(); g.fillStyle = '#f4f2ff'; g.beginPath(); g.moveTo(30, 8); g.lineTo(33, 15); g.lineTo(36, 8); g.fill(); }
  glowEye(g, 14, -4, 5.5, 2.6, c.eye, R, -0.2);
  if (!R.mono) glowLine(g, [[10, -4], [-6, -6], [-24, -10 + Math.sin(T * 0.3) * 2]], c.eye, 2, R, 8);
  g.restore();
}
function drawWolf(g, ch, p, x, y, facing, o) {
  const s = ch.scale * (o.scale || 1), R = bRend(o), T = o.T || 0, c = o.pal || ch.colors;
  bodyFrame(g, x, y, facing, s, p, -60, -26);
  if (!R.mono && !o.noGhost) for (let k = 2; k >= 1; k--) { g.save(); g.globalAlpha *= 0.13 / k + 0.05; g.translate(-14 * k - Math.abs(p.wk) * 10 * k, Math.sin(T * 0.1 + k) * 3); wolfBody(g, p, T - k * 5, { mono: k === 1 ? c.mark : c.mark2, ol: 0 }, c); g.restore(); }
  wolfBody(g, p, T, R, c);
  g.restore();
}

// ------------------------------ 3. THE ABYSSAL SERPENT ------------------------------
function serpentTail(g, R, c, base, T, bt, len = 1) {
  const tw = Math.sin(T * 0.06) * 10;
  const pts = qpts(base, addP(base, [-56 * len, 10]), addP(base, [-98 * len, -12 - bt * 70 + tw]), 7);
  tube(g, pts, 15, 3, c.body, R);
  const tp = pts[7], tp2 = pts[6];
  poly(g, [tp2, addP(tp, [-16, -16]), addP(tp, [-8, 2]), addP(tp, [-18, 14])], c.fin, R, 2);
  return pts;
}
function drawSerpent(g, ch, p, x, y, facing, o) {
  const s = ch.scale * (o.scale || 1), R = bRend(o), T = o.T || 0, c = o.pal || ch.colors, q = p.bq;
  bodyFrame(g, x, y, facing, s, p, -100);
  const sway = Math.sin(T * 0.05) * 6;
  // tail + coils
  const tpts = serpentTail(g, R, c, [-48, -14], T, p.bt);
  ell(g, -6, -16, 70, 17, c.body2, R); ell(g, -12, -33, 56, 15, c.body, R); ell(g, -6, -48 + q * 4, 40, 13, c.body2, R);
  if (!R.mono) { g.strokeStyle = c.belly; g.globalAlpha *= 0.5; g.lineWidth = 3; g.beginPath(); g.ellipse(-6, -12, 62, 10, 0, 0.1, Math.PI - 0.1); g.stroke(); g.beginPath(); g.ellipse(-12, -29, 50, 9, 0, 0.1, Math.PI - 0.1); g.stroke(); g.globalAlpha /= 0.5;
    for (let i = 0; i < 9; i++) { g.fillStyle = c.mark; g.globalAlpha *= 0.8; g.beginPath(); g.arc(-60 + i * 14, -35 + Math.sin(i) * 3, 1.6, 0, TAU); g.fill(); g.globalAlpha /= 0.8; } }
  // neck
  const B = [4 + p.bx * 0.15, -52 + q * 6];
  const Hd = [44 + p.bx + p.bh * 66 + sway * 0.3, -206 + p.bv + q * 64 + p.bh * 78 + sway * 0.6];
  const Cc = [-36 + p.bp * 40 - p.bh * 26 + sway, -122 + q * 34];
  const pts = qpts(B, Cc, Hd, 12);
  // dorsal frill
  for (let i = 2; i < 11; i++) {
    const a = pts[i], b = pts[i + 1], tg = Math.atan2(b[1] - a[1], b[0] - a[0]), nrm = tg - Math.PI / 2 - 0.5, sz = (12 + p.bw * 14) * (1 - i / 16);
    poly(g, [a, addP(a, polar(nrm, sz)), addP(b, polar(nrm + 0.3, sz * 0.4))], c.fin, R, 2);
  }
  tube(g, pts, 23, 12, c.body, R);
  if (!R.mono) {
    tube(g, pts.map(([px, py]) => [px + 6, py + 2]), 11, 5, c.belly, { mono: c.belly, ol: 0 });
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1.2; for (let i = 1; i < 12; i++) { const [px, py] = pts[i]; g.beginPath(); g.moveTo(px + 1, py - 4); g.lineTo(px + 12, py + 2); g.stroke(); }
    for (let i = 1; i < 12; i += 2) { const [px, py] = pts[i]; g.save(); g.globalCompositeOperation = 'lighter'; g.shadowColor = c.mark; g.shadowBlur = FX.hq ? 10 : 0; g.fillStyle = c.mark; g.beginPath(); g.arc(px - 8, py - 3, 2.3, 0, TAU); g.fill(); g.restore(); }
    g.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) { const [px, py] = pts[(i * 5 + Math.floor(T / 20)) % 12]; g.globalAlpha *= 0.7; g.fillRect(px - 4 + (i % 3) * 3, py - 6 + (i % 2) * 5, 1.5, 1.5); g.globalAlpha /= 0.7; }
  }
  // head
  g.save(); g.translate(...Hd); g.rotate(0.12 + p.bh * 0.55 + p.bp * 0.2);
  const ff = 1 + p.bw * 0.5;
  poly(g, [[-10, -6], [-40 * ff, -26 * ff], [-26, -2], [-44 * ff, 8 * ff], [-12, 8]], c.fin, R, 2);
  tube(g, qpts([-4, -12], [-28, -36], [-58, -34], 4), 5.5, 1.5, c.horn, R);
  tube(g, qpts([4, -14], [-14, -44], [-40, -52], 4), 4.5, 1.3, c.horn, R);
  g.save(); g.translate(-8, 6); g.rotate(p.bj * 0.75); poly(g, [[0, -2], [52, 2], [46, 12], [2, 12]], c.body2, R);
  if (!R.mono) { g.fillStyle = '#eaffff'; g.beginPath(); g.moveTo(40, 2); g.lineTo(43, -8); g.lineTo(46, 2); g.fill(); } g.restore();
  poly(g, [[-16, -12], [12, -16], [48, -8], [58, 0], [48, 7], [-14, 10]], c.body, R);
  if (!R.mono) { g.fillStyle = '#eaffff'; g.beginPath(); g.moveTo(40, 6); g.lineTo(43, 18); g.lineTo(47, 6); g.fill(); }
  glowEye(g, 20, -5, 7, 3.2, c.eye, R, -0.1);
  if (!R.mono) glowLine(g, [[-10, -2], [6, -10], [30, -10]], c.mark, 1.6, R);
  g.restore();
  g.restore();
}

// ------------------------------ 4. THE CELESTIAL STAG ------------------------------
function drawStag(g, ch, p, x, y, facing, o) {
  const s = ch.scale * (o.scale || 1), R = bRend(o), T = o.T || 0, c = o.pal || ch.colors, q = p.bq;
  bodyFrame(g, x, y, facing, s, p, -100, -30);
  const br = Math.sin(T * 0.05) * 1.5, C = [p.bx, -118 + p.bv + q * 30 + br], a = p.bp;
  const Wd = v => addP(C, rotP(v, a));
  const S = Wd([42, -4]), Hp = Wd([-42, -2]), N = Wd([50, -18]);
  const run = Math.abs(p.wk) + Math.abs(p.wc) > 0.2, ph = (p.wk || 0) * 2, up = -Math.min(0, p.bv) * 0.5;
  const legF = (phs, col, bf) => {
    const sw = run ? Math.sin(phs) * 20 : 0, lift = (run ? Math.max(0, Math.cos(phs)) * 16 : 0) + up, t = clamp(bf / 0.5, 0, 1), aa = 0.2 + bf * 0.9;
    const E0 = [S[0] + 4 + sw * 0.3, lerp(S[1], 0, 0.48)], P0 = [S[0] + 6 + sw, -2 - lift];
    const E1 = addP(S, polar(Math.PI / 2 - aa, 46)), P1 = addP(E1, polar(Math.PI / 2 - aa + 0.9, 44));
    const E = lerpP(E0, E1, t), P = lerpP(P0, P1, t);
    tube(g, [S, E, P], 10, 4.5, col, R); poly(g, [addP(P, [-5, -2]), addP(P, [6, -3]), addP(P, [7, 6]), addP(P, [-5, 5])], c.hoof, R, 2);
  };
  const legH = (phs, col, bb) => {
    const sw = run ? Math.sin(phs) * 22 : 0, lift = run ? Math.max(0, Math.cos(phs)) * 16 : 0;
    const K = [Hp[0] + 12, Hp[1] + 28], A = [Hp[0] - 12 - sw * 0.6 - bb * 40, -34 - lift - bb * 30], P = [Hp[0] - 4 - sw - bb * 62, -2 - lift - bb * 46];
    tube(g, [Hp, K, A, P], 14, 4.5, col, R); poly(g, [addP(P, [-5, -2]), addP(P, [6, -3]), addP(P, [7, 6]), addP(P, [-5, 5])], c.hoof, R, 2);
  };
  legF(ph + 2.6, R.mono || c.body2, p.bf * 0.3); legH(ph + 1.2, R.mono || c.body2, p.bb * 0.4);
  poly(g, [Wd([-54, -14]), Wd([-70, -34]), Wd([-58, -6])], c.belly, R, 2);
  ell(g, C[0], C[1], 60, 30, c.body, R, a); ell(g, S[0] - 2, S[1] + 2, 26, 26, c.body, R, a);
  if (!R.mono) {
    const sg = Wd([-12, -2]); g.save(); g.translate(...sg); g.rotate(T * 0.01); g.strokeStyle = c.gold; g.lineWidth = 1.8; g.beginPath(); g.arc(0, 0, 13, 0, TAU); g.stroke();
    g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 4 : 11, an = i * Math.PI / 5; g.lineTo(Math.cos(an) * r, Math.sin(an) * r); } g.closePath(); g.stroke(); g.restore();
    glowLine(g, [Wd([-50, 6]), Wd([-20, 16]), Wd([20, 16]), Wd([44, 4])], c.gold, 2, R, 8);
  }
  legH(ph + 4.3, c.body, p.bb); legF(ph, c.body, p.bf);
  // neck + head
  const ang = -1.08 + p.bh, H = addP(N, polar(ang, 46));
  tube(g, [N, addP(N, polar(ang, 24)), H], 19, 12, c.body, R);
  poly(g, [addP(N, [-6, 10]), addP(N, [14, 26]), addP(N, [2, 4])], c.belly, R, 2);
  g.save(); g.translate(...H); g.rotate(ang * 0.5 + 0.65 + p.bh * 0.15);
  stagAntlers(g, R, c, p.bw, T);
  poly(g, [[-8, -8], [-26, -20], [-12, -2]], c.body, R, 2);
  ell(g, 0, 0, 16, 13, c.body, R); poly(g, [[6, -9], [40, -2], [42, 7], [6, 12]], c.body, R);
  if (!R.mono) { g.fillStyle = '#2a2018'; g.beginPath(); g.arc(40, 2, 3.4, 0, TAU); g.fill(); }
  glowEye(g, 10, -3, 4.5, 3, c.eye, R);
  g.restore();
  if (!R.mono) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) { const an = T * 0.03 + i * 0.9, px = C[0] + Math.cos(an) * 96, py = C[1] - 30 + Math.sin(an * 1.3) * 52, r = 2 + (i % 3);
      g.fillStyle = c.mark; g.globalAlpha = 0.5 + 0.4 * Math.sin(T * 0.1 + i); g.beginPath(); g.moveTo(px, py - r * 2); g.lineTo(px + r * 0.5, py); g.lineTo(px, py + r * 2); g.lineTo(px - r * 0.5, py); g.fill(); g.beginPath(); g.moveTo(px - r * 2, py); g.lineTo(px, py + r * 0.5); g.lineTo(px + r * 2, py); g.lineTo(px, py - r * 0.5); g.fill(); }
    g.restore();
  }
  g.restore();
}

// ------------------------------ 5. THE NIGHTMARE RAVEN ------------------------------
function drawRaven(g, ch, p, x, y, facing, o) {
  const s = ch.scale * (o.scale || 1), R = bRend(o), T = o.T || 0, c = o.pal || ch.colors, q = p.bq;
  bodyFrame(g, x, y, facing, s, p, -100);
  const br = Math.sin(T * 0.06) * 2, C = [p.bx, -100 + p.bv + q * 26 + br], a = 0.3 + p.bp;
  const Wd = v => addP(C, rotP(v, a));
  const flap = p.bw > 0.55 ? Math.sin(T * 0.28) * 0.32 * (p.bw - 0.4) : 0;
  ravenWing(g, R, c, Wd([-4, -26]), p.bw, -flap * 0.8 + 0.1, 170, R.mono || c.body2);
  // legs + talons
  const leg = (dx, col, kick) => {
    const hip = Wd([dx, 28]), la = 0.15 + kick * 1.25, onG = kick < 0.3 && (p.bv > -10);
    const foot = onG ? [hip[0] + 6 + dx * 0.4 + p.wk * 14, -2 - Math.max(0, p.wc) * 8] : addP(hip, polar(Math.PI / 2 - la, 58));
    const knee = lerpP(hip, foot, 0.45); knee[0] -= 10;
    tube(g, [hip, knee, foot], 7, 4, col, R);
    const fd = onG ? 0 : Math.atan2(foot[1] - knee[1], foot[0] - knee[0]) - Math.PI / 2;
    claws(g, foot, fd + 0.05, 3, 14 + kick * 6, c.talon, R); claws(g, foot, fd + Math.PI - 0.3, 1, 9, c.talon, R);
  };
  leg(-14, R.mono || c.leg2, p.bb * 0.8);
  // tail feathers
  for (let i = 0; i < 5; i++) { const b = Wd([-44, 14]), an = Math.PI - 0.2 - a + (i - 2) * 0.16 - p.bt * 0.6 + Math.sin(T * 0.05 + i) * 0.03, L = 66 + (2 - Math.abs(i - 2)) * 12, tip = addP(b, polar(an, L));
    poly(g, [b, addP(b, polar(an - 0.12, L * 0.5)), tip, addP(b, polar(an + 0.12, L * 0.5))], i % 2 ? c.body : c.body2, R, 2); }
  // body
  ell(g, C[0] - 6, C[1] + 6, 48, 38, c.body, R, a); ell(g, ...Wd([26, -14]), 30, 34, c.body, R, a);
  if (!R.mono) { g.strokeStyle = c.sheen; g.lineWidth = 1.6; for (let i = 0; i < 5; i++) { const b = Wd([16 - i * 4, -24 + i * 10]); g.beginPath(); g.arc(b[0], b[1], 9, 0.2, 2.6); g.stroke(); } }
  leg(6, c.leg, p.bb);
  // head
  const N = Wd([30, -40]), ang = -1.05 + p.bh, H = addP(N, polar(ang, 26));
  tube(g, [N, H], 18, 15, c.body, R);
  g.save(); g.translate(...H); g.rotate(ang * 0.5 + 0.55);
  for (let i = 0; i < 4; i++) poly(g, [[-8, -10 + i * 6], [-34 - i * 4, -22 + i * 9], [-10, -4 + i * 6]], c.body2, R, 2);
  g.save(); g.translate(14, 6); g.rotate(p.bj * 0.6); poly(g, [[0, 0], [40, 2], [30, 10], [0, 8]], c.beak2, R); g.restore();
  circ(g, 0, 0, 20, c.body, R);
  poly(g, [[12, -10], [42, -6], [62, 6], [52, 6], [44, 4], [12, 6]], c.beak, R);
  glowEye(g, 9, -4, 5, 4, c.eye, R);
  if (!R.mono) glowLine(g, [[6, -4], [-10, -8], [-28, -14 + Math.sin(T * 0.25) * 3]], c.eye, 1.8, R, 8);
  g.restore();
  ravenWing(g, R, c, Wd([2, -22]), p.bw, flap, 190, null);
  g.restore();
}

// ------------------------------ THE PRIMAL HYBRID (ultimate) ------------------------------
// wolf's spectral body, the drake's horned head, stag antlers, raven wings and the serpent's tail
const HYBRID_PAL = { body: '#1c1430', body2: '#120c22', belly: '#7a3324', horn: '#f6ead0', claw: '#ffffff', accent: '#ff4a2a', eye: '#ffe14a', wing: '#2a1838', wing2: '#1a0f26', mark: '#fff2a8', mark2: '#7ff6ff', antler: '#ffe9a0', fin: '#b06bff', sheen: '#6a4aa0', gold: '#e8c35a', beak: '#2a2430', beak2: '#4a3a50', talon: '#cdbfa8', leg: '#3a3240', hoof: '#5a4a30' };
function drawHybrid(g, x, y, sc, dir, T, st = {}) {
  const R = { mono: st.mono || null, ol: 2.4 }, c = HYBRID_PAL;
  g.save(); g.translate(x, y); g.scale(dir * sc, sc); g.lineJoin = 'round'; g.lineCap = 'round';
  const flap = Math.sin(T * 0.22) * 0.3;
  ravenWing(g, R, { ...c, body: c.body2 }, [-6, -150], 1, -flap, 230, R.mono || c.body2);
  serpentTail(g, R, c, [-70, -90], T, 0.6 + Math.sin(T * 0.07) * 0.3, 1.5);
  const P = { bp: -0.15, bh: st.bite ? 0.4 : -0.1, bj: st.jaw ?? 0.3, bf: st.claw ?? 0.2, bb: 0, bw: 1, bt: 0, bq: 0, bx: 0, bv: -60, wk: 0, wc: 0, rot: 0 };
  g.save(); g.scale(1.25, 1.25); wolfBody(g, { ...P, bv: -48 }, T, R, { ...c, body: '#251a40', mark: '#ff6bf0', mark2: '#7ff6ff', eye: '#ffe14a' }); g.restore();
  const N = [64, -150], ang = -0.7 + (st.bite ? 0.5 : 0), H = addP(N, polar(ang, 70));
  tube(g, [N, H], 28, 20, c.body, R);
  g.save(); g.translate(...H); g.rotate(ang * 0.5 + 0.3); g.save(); g.translate(-10, -6); g.scale(1.2, 1.2); stagAntlers(g, R, c, 1, T); g.restore(); drakeHead(g, R, { ...c, body: '#2b1c26', body2: '#1a1118' }, st.jaw ?? 0.3, T, true); g.restore();
  ravenWing(g, R, c, [4, -146], 1, flap, 260, null);
  if (!R.mono) {
    g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(0, -110, 10, 0, -110, 240); gr.addColorStop(0, 'rgba(255,240,200,0.25)'); gr.addColorStop(1, 'rgba(255,80,200,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, -110, 240, 0, TAU); g.fill(); g.restore();
  }
  g.restore();
}
