// ======================= CHARACTER RENDERER ===========================
// Procedural skeletal characters: forward kinematics + cel-shaded
// capsule limbs, anime heads, dynamic hair/scarf ropes.
// Angle convention (local space, facing right): limb direction =
// (sin a, cos a) → 0 = down, PI/2 = forward, PI = up, -PI/2 = back.
const DIMS = { thigh: 44, shin: 44, torso: 58, neck: 7, headR: 17, uarm: 31, farm: 29 };
const POSE_KEYS = ['t', 'hd', 'hx', 'hy', 'hipH', 'fa1', 'fa2', 'ba1', 'ba2', 'fl1', 'fl2', 'bl1', 'bl2', 'wa', 'sa', 'rot',
  'gx', 'gy', 'gr', 'gs', 'gp', 'gg', 'gb', 'px', 'py', 'pr', 'pp', 'ph', 'kx', 'ky', 'kr', 'ks', 'kp', 'wk', 'wc', 'wl', 'pw', 'cf', 'cs',
  'bp', 'bh', 'bj', 'bf', 'bb', 'bw', 'bt', 'bq', 'bx', 'bv']; // b*: beast-form body keys (pitch, head, jaw, fore limb, hind limb, wings, tail, crouch, lunge, lift)
const POSE0 = { t: 0.12, hd: -0.05, hx: 0, hy: 0, hipH: 88, fa1: 0.55, fa2: 2.45, ba1: 0.25, ba2: 2.1, fl1: 0.4, fl2: 0.12, bl1: -0.32, bl2: -0.12, wa: 3.6, sa: 3.0, rot: 0, ground: 1,
  gx: 0, gy: 0, gr: 0, gs: 0, gp: 0, gg: 0, gb: 0, px: 0, py: 0, pr: 0, pp: 0, ph: 0, kx: 0, ky: 0, kr: 0, ks: 0, kp: 0, wk: 0, wc: 0, wl: 0, pw: 0, cf: 0, cs: 0, bp: 0, bh: 0, bj: 0, bf: 0, bb: 0, bw: 0, bt: 0, bq: 0, bx: 0, bv: 0 };

const POSES = {
  stance: {},
  crouch: { t: 0.42, hd: -0.3, fa1: 0.85, fa2: 2.55, ba1: 0.55, ba2: 2.25, fl1: 1.35, fl2: -0.12, bl1: 0.5, bl2: -1.3 },
  prejump: { base: 'crouch', t: 0.3 },
  jump: { ground: 0, hipH: 72, t: 0.05, hd: 0, fa1: 0.9, fa2: 2.4, ba1: -0.4, ba2: 0.7, fl1: 1.25, fl2: 0.05, bl1: 0.35, bl2: -0.9 },
  fall: { ground: 0, hipH: 82, t: 0.0, fa1: 0.6, fa2: 2.0, ba1: -0.8, ba2: 0.0, fl1: 0.6, fl2: 0.2, bl1: -0.1, bl2: -0.5 },
  flip: { ground: 0, hipH: 60, t: 0.6, hd: 0.4, fa1: 1.2, fa2: 0.6, ba1: 1.0, ba2: 0.5, fl1: 2.0, fl2: 0.6, bl1: 1.7, bl2: 0.4 },
  land: { base: 'crouch', t: 0.25 },
  dash: { t: 0.6, hd: -0.4, fa1: -0.7, fa2: -0.4, ba1: -1.0, ba2: -0.7, fl1: 1.1, fl2: 0.4, bl1: -0.75, bl2: -0.95 },
  backdash: { ground: 0, hipH: 96, t: -0.25, hd: 0.2, fa1: 0.9, fa2: 2.6, ba1: 0.4, ba2: 2.0, fl1: 0.6, fl2: 0.3, bl1: -0.1, bl2: 0.1 },
  block: { t: -0.08, hd: 0.2, fa1: 1.0, fa2: 3.0, ba1: 0.75, ba2: 2.8, fl1: 0.45, fl2: 0.2, bl1: -0.45, bl2: -0.25 },
  cblock: { base: 'crouch', t: 0.3, hd: 0.1, fa1: 1.15, fa2: 3.0, ba1: 0.9, ba2: 2.85 },
  hit: { t: -0.38, hd: -0.45, fa1: -0.5, fa2: 0.1, ba1: -0.8, ba2: -0.3, fl1: 0.5, fl2: 0.35, bl1: -0.3, bl2: -0.1 },
  hit2: { t: 0.5, hd: 0.45, fa1: 0.25, fa2: 0.15, ba1: 0.05, ba2: -0.1, fl1: 0.25, fl2: 0.05, bl1: -0.35, bl2: -0.25 },
  chit: { base: 'crouch', t: -0.1, hd: -0.4, fa1: -0.3, fa2: 0.2, ba1: -0.6, ba2: -0.2 },
  airhit: { ground: 0, hipH: 60, t: -0.55, hd: -0.6, fa1: -1.3, fa2: -0.9, ba1: -1.7, ba2: -1.3, fl1: 0.9, fl2: 0.5, bl1: 0.4, bl2: 0.1 },
  down: { ground: 0, hipH: 15, rot: -1.5, t: 0, hd: 0.25, fa1: -0.5, fa2: -0.2, ba1: 0.4, ba2: 0.6, fl1: 0.15, fl2: 0.05, bl1: -0.05, bl2: 0.0 },
  getup: { base: 'crouch' },
  kneel: { t: 0.55, hd: 0.55, fa1: 0.15, fa2: 0.05, ba1: 0.3, ba2: 0.1, fl1: 1.35, fl2: 0.0, bl1: 0.25, bl2: -1.45 },
  jab_w: { t: 0.15, fa1: 0.6, fa2: 2.5 },
  jab: { t: 0.3, hd: 0.05, fa1: 1.5, fa2: 1.57, ba1: 0.2, ba2: 2.3, fl1: 0.55, fl2: 0.15, bl1: -0.45, bl2: -0.2 },
  jab2: { t: 0.35, hd: 0.05, fa1: 0.3, fa2: 2.4, ba1: 1.5, ba2: 1.57, fl1: 0.55, fl2: 0.15, bl1: -0.45, bl2: -0.2 },
  kick_w: { t: -0.05, fl1: 1.4, fl2: 0.1, bl1: -0.15, bl2: -0.05 },
  kick: { t: -0.25, hd: 0.15, fa1: 0.7, fa2: 2.4, ba1: -0.4, ba2: 1.0, fl1: 1.6, fl2: 1.62, bl1: -0.12, bl2: -0.05 },
  hook_w: { t: -0.25, hd: 0.0, ba1: -1.1, ba2: -0.2, fa1: 0.8, fa2: 2.4, fl1: 0.4, bl1: -0.5 },
  hook: { t: 0.5, hd: 0.1, fa1: -0.35, fa2: 0.5, ba1: 1.55, ba2: 1.6, fl1: 0.65, fl2: 0.2, bl1: -0.65, bl2: -0.45 },
  cjab: { base: 'crouch', t: 0.38, fa1: 1.45, fa2: 1.55 },
  ckick_w: { base: 'crouch', fl1: 1.0, fl2: -0.3 },
  ckick: { base: 'crouch', t: 0.15, fl1: 1.5, fl2: 1.62, bl1: 0.6, bl2: -1.25 },
  sweep_w: { base: 'crouch', t: 0.6 },
  sweep: { t: 0.75, hd: -0.15, fa1: 0.25, fa2: 0.15, ba1: 0.7, ba2: 1.0, fl1: 1.62, fl2: 1.62, bl1: 0.95, bl2: -1.35 },
  jpunch: { base: 'jump', t: 0.3, fa1: 1.25, fa2: 1.65 },
  jkick: { base: 'jump', t: -0.15, fl1: 1.0, fl2: 1.3, bl1: 0.25, bl2: -0.9 },
  jheavy_w: { base: 'jump', t: -0.25, hd: 0.1, fa1: 2.9, fa2: 3.1, ba1: 2.7, ba2: 3.0 },
  jheavy: { base: 'jump', t: 0.55, hd: -0.1, fa1: 1.0, fa2: 0.75, ba1: 0.9, ba2: 0.7 },
  upper_w: { base: 'crouch', t: 0.25, fa1: 0.25, fa2: 0.9 },
  upper: { t: 0.0, hd: -0.35, fa1: 2.95, fa2: 3.08, ba1: 0.15, ba2: 1.0, fl1: 0.3, fl2: 0.1, bl1: -0.25, bl2: -0.5 },
  lunge_w: { t: 0.0, fa1: -0.5, fa2: 0.9, ba1: 0.9, ba2: 2.6, fl1: 0.6, fl2: 0.3, bl1: -0.3, bl2: -0.4 },
  lunge: { t: 0.6, hd: -0.25, fa1: 1.62, fa2: 1.6, ba1: -0.8, ba2: -0.4, fl1: 1.05, fl2: 0.35, bl1: -0.95, bl2: -0.75 },
  cast_w: { t: -0.1, fa1: -0.5, fa2: 1.0, ba1: -0.7, ba2: 0.8, fl1: 0.4, bl1: -0.4 },
  cast: { t: 0.22, hd: 0, fa1: 1.52, fa2: 1.57, ba1: 1.38, ba2: 1.5, fl1: 0.6, fl2: 0.2, bl1: -0.5, bl2: -0.3 },
  raise: { t: -0.12, hd: -0.35, fa1: 2.7, fa2: 3.0, ba1: 2.85, ba2: 3.05 },
  slam_w: { ground: 0, hipH: 110, t: -0.2, fa1: 2.9, fa2: 3.1, ba1: 2.8, ba2: 3.0, fl1: 0.9, fl2: 0.0, bl1: 0.1, bl2: -0.4 },
  slam: { t: 1.05, hd: -0.6, fa1: 0.7, fa2: 0.35, ba1: 0.5, ba2: 0.25, fl1: 1.25, fl2: -0.05, bl1: 0.35, bl2: -1.25 },
  counter: { t: -0.05, hd: 0.1, fa1: 1.25, fa2: 2.65, ba1: 0.95, ba2: 3.05, fl1: 0.55, fl2: 0.25, bl1: -0.5, bl2: -0.3 },
  throw: { t: 0.35, fa1: 1.7, fa2: 1.4, ba1: -0.6, ba2: 0.2, fl1: 0.6, fl2: 0.2, bl1: -0.5, bl2: -0.3 },
  lift: { t: -0.15, hd: -0.3, fa1: 2.8, fa2: 2.9, ba1: 2.7, ba2: 2.85, fl1: 0.45, fl2: 0.2, bl1: -0.45, bl2: -0.25 },
  grab: { t: 0.35, fa1: 1.45, fa2: 1.5, ba1: 1.3, ba2: 1.45 },
};

function buildPose(ch, spec) {
  const out = Object.assign({}, POSE0, ch.stance);
  const apply = sp => {
    if (!sp) return;
    if (typeof sp === 'string') {
      const def = (ch.poses && ch.poses[sp]) || POSES[sp];
      if (!def) return;
      if (def.base) apply(def.base);
      Object.assign(out, def);
    } else { if (sp.base) apply(sp.base); Object.assign(out, sp); }
  };
  apply(spec);
  if (out.ground) {
    const d = ch.dims;
    const df = Math.cos(out.fl1) * d.thigh + Math.cos(out.fl2) * d.shin;
    const db = Math.cos(out.bl1) * d.thigh + Math.cos(out.bl2) * d.shin;
    out.hipH = Math.max(df, db) - 1 + (d.footLift || 0);
  }
  return out;
}

function skeleton(p, d) {
  const S = Math.sin, C = Math.cos;
  const hip = [p.hx, -p.hipH + p.hy];
  const fk = [hip[0] + 3 + S(p.fl1) * d.thigh, hip[1] + C(p.fl1) * d.thigh];
  const ff = [fk[0] + S(p.fl2) * d.shin, fk[1] + C(p.fl2) * d.shin];
  const bk = [hip[0] - 3 + S(p.bl1) * d.thigh, hip[1] + C(p.bl1) * d.thigh];
  const bf = [bk[0] + S(p.bl2) * d.shin, bk[1] + C(p.bl2) * d.shin];
  const neck = [hip[0] + S(p.t) * d.torso, hip[1] - C(p.t) * d.torso];
  const sh = [lerp(hip[0], neck[0], 0.86), lerp(hip[1], neck[1], 0.86)];
  const sF = [sh[0] + 2, sh[1]], sB = [sh[0] - 5, sh[1] + 1];
  const ha = p.t + p.hd, hr = d.neck + d.headR * 0.85;
  const head = [neck[0] + S(ha) * hr, neck[1] - C(ha) * hr];
  const fe = [sF[0] + S(p.fa1) * d.uarm, sF[1] + C(p.fa1) * d.uarm];
  const fh = [fe[0] + S(p.fa2) * d.farm, fe[1] + C(p.fa2) * d.farm];
  const be = [sB[0] + S(p.ba1) * d.uarm, sB[1] + C(p.ba1) * d.uarm];
  const bh = [be[0] + S(p.ba2) * d.farm, be[1] + C(p.ba2) * d.farm];
  return { hip, fk, ff, bk, bf, neck, sF, sB, head, ha, fe, fh, be, bh };
}
// local skeleton point → world, given figure placement
function toWorld(x, y, facing, s, p, sk, lx, ly) {
  let X = lx, Y = ly;
  if (p.rot) { const c = Math.cos(p.rot), sn = Math.sin(p.rot), dx = X - sk.hip[0], dy = Y - sk.hip[1]; X = sk.hip[0] + dx * c - dy * sn; Y = sk.hip[1] + dx * sn + dy * c; }
  return [x + X * facing * s, y + Y * s];
}
function headPt(sk, dx, dy) { const c = Math.cos(sk.ha), s = Math.sin(sk.ha); return [sk.head[0] + dx * c - dy * s, sk.head[1] + dx * s + dy * c]; }

// ---------- primitives ----------
const SHADE = 'rgba(14,0,34,0.30)';
function capsule(g, x1, y1, x2, y2, r1, r2) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  g.beginPath(); g.arc(x1, y1, r1, a + Math.PI / 2, a - Math.PI / 2); g.arc(x2, y2, r2, a - Math.PI / 2, a + Math.PI / 2); g.closePath();
}
function limb(g, A, Bp, r1, r2, col, R, back) {
  if (!R.mono) { capsule(g, A[0], A[1], Bp[0], Bp[1], r1 + R.ol, r2 + R.ol); g.fillStyle = OUTLINE; g.fill(); }
  capsule(g, A[0], A[1], Bp[0], Bp[1], r1, r2); g.fillStyle = R.mono || col; g.fill();
  if (R.mono) return;
  g.save(); g.clip();
  if (back) { g.fillStyle = 'rgba(10,0,26,0.32)'; g.fill(); }
  const dx = Bp[0] - A[0], dy = Bp[1] - A[1], L = Math.hypot(dx, dy) || 1;
  let nx = -dy / L, ny = dx / L; if (-nx + ny < 0) { nx = -nx; ny = -ny; }
  const o = Math.max(r1, r2) * 0.95;
  capsule(g, A[0] + nx * o, A[1] + ny * o, Bp[0] + nx * o, Bp[1] + ny * o, r1, r2); g.fillStyle = SHADE; g.fill();
  g.restore();
}
function poly(g, pts, col, R, lw) {
  g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
  if (!R.mono) { g.strokeStyle = OUTLINE; g.lineWidth = lw || R.ol * 2; g.lineJoin = 'round'; g.stroke(); }
  g.fillStyle = R.mono || col; g.fill();
}
function polyR(g, r, pts, col, R, sway) { // points in head-radius units
  poly(g, pts.map(([x, y], i) => [x * r + (sway && i % 2 ? sway(i) : 0), y * r + (sway && i % 2 ? sway(i + 3) * 0.6 : 0)]), col, R);
}
function circ(g, x, y, r, col, R) {
  g.beginPath(); g.arc(x, y, r, 0, TAU);
  if (!R.mono) { g.strokeStyle = OUTLINE; g.lineWidth = R.ol * 2; g.stroke(); }
  g.fillStyle = R.mono || col; g.fill();
}

// ---------- dynamic ropes (scarves, hair, ribbons) ----------
class Rope {
  constructor(n, seg) { this.n = n; this.seg = seg; this.p = null; }
  update(ax, ay, wind, grav) {
    if (!this.p) { this.p = []; for (let i = 0; i < this.n; i++) this.p.push({ x: ax - wind * i * 4, y: ay + i * this.seg, px: ax - wind * i * 4, py: ay + i * this.seg }); }
    const p = this.p; p[0].x = p[0].px = ax; p[0].y = p[0].py = ay;
    for (let i = 1; i < p.length; i++) {
      const q = p[i]; const vx = (q.x - q.px) * 0.86, vy = (q.y - q.py) * 0.86;
      q.px = q.x; q.py = q.y; q.x += vx + wind; q.y += vy + grav;
    }
    for (let it = 0; it < 3; it++) for (let i = 1; i < p.length; i++) {
      const a = p[i - 1], q = p[i]; const dx = q.x - a.x, dy = q.y - a.y, d = Math.hypot(dx, dy) || 0.001;
      const k = (d - this.seg) / d; q.x -= dx * k; q.y -= dy * k;
    }
  }
  draw(g, w0, w1, col, fork) {
    const p = this.p; if (!p) return;
    const L = [], Rr = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
      let nx = -(b.y - a.y), ny = b.x - a.x; const d = Math.hypot(nx, ny) || 1; nx /= d; ny /= d;
      const w = lerp(w0, w1, i / (p.length - 1));
      L.push([p[i].x + nx * w, p[i].y + ny * w]); Rr.push([p[i].x - nx * w, p[i].y - ny * w]);
    }
    g.beginPath(); L.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]));
    if (fork) { const e = p[p.length - 1]; g.lineTo(e.x, e.y - 2); }
    for (let i = Rr.length - 1; i >= 0; i--) g.lineTo(Rr[i][0], Rr[i][1]);
    g.closePath();
    g.lineJoin = 'round'; g.strokeStyle = OUTLINE; g.lineWidth = 4; g.stroke(); g.fillStyle = col; g.fill();
    g.save(); g.clip(); g.strokeStyle = 'rgba(14,0,34,0.3)'; g.lineWidth = w0; g.beginPath(); Rr.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke(); g.restore();
  }
}

// ---------- body parts ----------
function drawArm(g, S, E, Hd, c, R, b, back, weapon) {
  limb(g, S, E, 7.6 * b, 6.3 * b, c.uarm, R, back);
  limb(g, E, Hd, 6.5 * b, 5.1 * b, c.farm, R, back);
  if (c.cuff) limb(g, [lerp(E[0], Hd[0], 0.5), lerp(E[1], Hd[1], 0.5)], Hd, 6.6 * b, 6.2 * b, c.cuff, R, back);
  if (weapon) weapon();
  circ(g, Hd[0], Hd[1], 6.8 * b, c.hand, R);
  if (back && !R.mono) { g.fillStyle = 'rgba(10,0,26,0.3)'; g.beginPath(); g.arc(Hd[0], Hd[1], 6.8 * b, 0, TAU); g.fill(); }
}
function drawLeg(g, Hp, K, F, c, R, b, back, ch) {
  limb(g, Hp, K, 10.2 * b, 8 * b, c.leg, R, back);
  if (ch && ch.drawBoot) { ch.drawBoot(g, K, F, c, R, back, b); return; }
  limb(g, K, F, 8 * b, 5.6 * b, c.leg, R, back);
  if (c.boot) limb(g, [lerp(K[0], F[0], 0.5), lerp(K[1], F[1], 0.5)], F, 7.2 * b, 6.4 * b, c.boot, R, back);
  const fp = [[-6, -5], [12, -4], [17, 3], [-6, 4]].map(([x, y]) => [F[0] + x * b, F[1] + y * b]);
  poly(g, fp, c.foot || c.boot || c.leg, R);
  if (back && !R.mono) { g.fillStyle = 'rgba(10,0,26,0.3)'; g.fill(); }
}
function drawTorso(g, sk, p, ch, c, R, o) {
  const L = ch.dims.torso, bw = ch.build.torso;
  g.save(); g.translate(sk.hip[0], sk.hip[1]); g.rotate(p.t);
  const path = () => {
    g.beginPath(); g.moveTo(-11 * bw, 4);
    g.quadraticCurveTo(-15 * bw, -L * 0.5, -13 * bw, -L * 0.88);
    g.quadraticCurveTo(-8 * bw, -L - 6, 2 * bw, -L - 4);
    g.quadraticCurveTo(13 * bw, -L - 1, 14 * bw, -L * 0.72);
    g.quadraticCurveTo(15 * bw, -L * 0.45, 10 * bw, -L * 0.2);
    g.lineTo(10 * bw, 4); g.closePath();
  };
  path();
  if (!R.mono) { g.strokeStyle = OUTLINE; g.lineWidth = R.ol * 2; g.lineJoin = 'round'; g.stroke(); }
  g.fillStyle = R.mono || c.top; g.fill();
  if (!R.mono) {
    g.save(); path(); g.clip();
    if (ch.torsoDetail) ch.torsoDetail(g, L, bw, c, R, o);
    g.fillStyle = SHADE; g.beginPath(); g.moveTo(-20 * bw, 10); g.lineTo(-20 * bw, -L - 10); g.quadraticCurveTo(-6 * bw, -L * 0.5, -3 * bw, 10); g.fill();
    g.restore();
    if (c.belt) { poly(g, [[-12 * bw, -7], [11 * bw, -8], [11 * bw, 2], [-12 * bw, 3]], c.belt, R, 3); }
    if (ch.torsoOver) ch.torsoOver(g, L, bw, c, R, o);
  }
  g.restore();
}
function drawFace(g, r, c, o) {
  const e = o.expr || 'normal';
  const ex = 0.5 * r, ey = 0.06 * r;
  g.lineCap = 'round'; g.lineJoin = 'round';
  if (e === 'hurt' || e === 'ko') {
    g.strokeStyle = OUTLINE; g.lineWidth = 0.12 * r; g.beginPath();
    if (e === 'hurt') { g.moveTo(ex - 0.18 * r, ey - 0.18 * r); g.lineTo(ex + 0.12 * r, ey); g.lineTo(ex - 0.18 * r, ey + 0.14 * r); }
    else { g.moveTo(ex - 0.16 * r, ey - 0.14 * r); g.lineTo(ex + 0.16 * r, ey + 0.14 * r); g.moveTo(ex + 0.16 * r, ey - 0.14 * r); g.lineTo(ex - 0.16 * r, ey + 0.14 * r); }
    g.stroke();
  } else if (e === 'closed') {
    g.strokeStyle = OUTLINE; g.lineWidth = 0.1 * r; g.beginPath(); g.moveTo(ex - 0.2 * r, ey); g.quadraticCurveTo(ex, ey + 0.1 * r, ex + 0.2 * r, ey - 0.02 * r); g.stroke();
  } else {
    g.fillStyle = '#fbf7ff'; g.beginPath(); g.ellipse(ex, ey, 0.18 * r, 0.25 * r, 0, 0, TAU); g.fill();
    const ic = o.glow ? c.accent : c.eye;
    if (o.glow) { g.shadowColor = c.accent; g.shadowBlur = 12; }
    g.fillStyle = ic; g.beginPath(); g.ellipse(ex + 0.05 * r, ey + 0.02 * r, 0.125 * r, 0.22 * r, 0, 0, TAU); g.fill();
    g.shadowBlur = 0;
    g.fillStyle = o.glow ? '#ffffff' : 'rgba(10,0,20,0.85)'; g.beginPath(); g.ellipse(ex + 0.07 * r, ey + 0.05 * r, 0.05 * r, 0.11 * r, 0, 0, TAU); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(ex + 0.01 * r, ey - 0.09 * r, 0.05 * r, 0, TAU); g.fill();
    g.strokeStyle = OUTLINE; g.lineWidth = 0.12 * r; g.beginPath(); g.moveTo(ex - 0.22 * r, ey - 0.16 * r); g.quadraticCurveTo(ex, ey - 0.33 * r, ex + 0.22 * r, ey - 0.2 * r); g.stroke();
    g.lineWidth = 0.07 * r; g.beginPath(); g.moveTo(ex - 0.2 * r, ey - 0.17 * r); g.lineTo(ex - 0.34 * r, ey - 0.06 * r); g.stroke();
  }
  const angry = e !== 'grin' && e !== 'closed';
  g.strokeStyle = c.brow || OUTLINE; g.lineWidth = 0.1 * r; g.beginPath();
  g.moveTo(ex - 0.24 * r, ey - (angry ? 0.5 : 0.44) * r); g.lineTo(ex + 0.28 * r, ey - (angry ? 0.3 : 0.42) * r); g.stroke();
  g.strokeStyle = OUTLINE; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(0.98 * r, 0.18 * r); g.lineTo(0.9 * r, 0.32 * r); g.stroke();
  if (c.noMouth) return;
  if (e === 'shout' || e === 'hurt') {
    g.fillStyle = '#4a0c14'; g.beginPath(); g.moveTo(0.52 * r, 0.54 * r); g.lineTo(0.88 * r, 0.47 * r); g.lineTo(0.78 * r, 0.8 * r); g.closePath(); g.fill(); g.stroke();
  } else if (e === 'grin') {
    g.lineWidth = 1.6; g.beginPath(); g.moveTo(0.5 * r, 0.56 * r); g.quadraticCurveTo(0.68 * r, 0.7 * r, 0.88 * r, 0.5 * r); g.stroke();
  } else { g.lineWidth = 1.5; g.beginPath(); g.moveTo(0.58 * r, 0.62 * r); g.lineTo(0.8 * r, 0.58 * r); g.stroke(); }
}
function drawHead(g, ch, c, R, o) {
  const r = ch.dims.headR;
  if (ch.hairBack) ch.hairBack(g, r, c, R, o);
  const skull = () => { g.beginPath(); g.arc(0, 0, r, 0, TAU); };
  const jaw = ch.chibi ? () => { g.beginPath(); g.moveTo(-0.55 * r, 0.5 * r); g.quadraticCurveTo(0.1 * r, 1.02 * r, 0.55 * r, 0.86 * r); g.quadraticCurveTo(0.98 * r, 0.6 * r, 0.99 * r, -0.1 * r); g.lineTo(0, -0.2 * r); g.closePath(); }
    : () => { g.beginPath(); g.moveTo(-0.5 * r, 0.45 * r); g.lineTo(0.3 * r, 1.0 * r); g.lineTo(0.74 * r, 0.8 * r); g.quadraticCurveTo(0.99 * r, 0.42 * r, 0.97 * r, -0.15 * r); g.lineTo(0, -0.2 * r); g.closePath(); };
  if (!R.mono) { g.lineWidth = R.ol * 2; g.strokeStyle = OUTLINE; g.lineJoin = 'round'; skull(); g.stroke(); jaw(); g.stroke(); }
  g.fillStyle = R.mono || c.skin; skull(); g.fill(); jaw(); g.fill();
  if (!R.mono) {
    g.save(); skull(); g.clip(); g.fillStyle = 'rgba(120,40,40,0.22)'; g.beginPath(); g.arc(-0.6 * r, 0.3 * r, r * 0.85, 0, TAU); g.fill(); g.restore();
    if (!ch.noEar) { g.fillStyle = c.skin; g.strokeStyle = OUTLINE; g.lineWidth = 1.5; g.beginPath(); g.ellipse(-0.14 * r, 0.14 * r, 0.17 * r, 0.25 * r, 0.2, 0, TAU); g.fill(); g.stroke(); }   // noEar: featureless heads (The Hollow)
    if (ch.faceFn) ch.faceFn(g, r, c, o); else drawFace(g, r, c, o);
  }
  if (ch.hairFront) ch.hairFront(g, r, c, R, o);
  if (o.glow && !R.mono && o.expr !== 'hurt' && o.expr !== 'ko') {
    g.save(); g.globalCompositeOperation = 'lighter';
    const ex = 0.55 * r, ey = 0.06 * r;
    const gr = g.createLinearGradient(ex, ey, ex - 3 * r, ey); gr.addColorStop(0, c.accent); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.strokeStyle = gr; g.lineWidth = 0.2 * r; g.lineCap = 'round';
    g.beginPath(); g.moveTo(ex, ey); g.quadraticCurveTo(ex - 1.4 * r, ey - 0.1 * r - Math.sin((o.T || 0) * 0.3) * 0.15 * r, ex - 3 * r, ey - 0.35 * r); g.stroke();
    g.restore();
  }
}

// ---------- full figure ----------
function drawFigure(g, ch, p, x, y, facing, o = {}) {
  if (ch.drawCustom) { ch.drawCustom(g, ch, p, x, y, facing, o); return skeleton(p, ch.dims); }
  const s = ch.scale * (o.scale || 1), sk = skeleton(p, ch.dims), c = o.pal || ch.colors;
  const R = { mono: o.mono || null, ol: 2.4 };
  if (o.ropes && !o.mono && ch.ropes) {
    for (const rs of ch.ropes) {
      let rope = o.ropes[rs.id]; if (!rope) rope = o.ropes[rs.id] = new Rope(rs.n, rs.seg * s);
      const a = rs.at(sk, ch.dims.headR), wp = toWorld(x, y, facing, s, p, sk, a[0], a[1]);
      const wind = -facing * (rs.wind || 0.55) + Math.sin((o.T || 0) * 0.06 + rs.n) * 0.25;
      rope.update(wp[0], wp[1], wind, (rs.grav ?? 0.3) * s);
      rope.draw(g, rs.w0 * s, rs.w1 * s, c[rs.color] || rs.color, rs.fork);
    }
  }
  g.save(); g.translate(x, y); g.scale(facing * s, s);
  if (p.rot) { g.translate(sk.hip[0], sk.hip[1]); g.rotate(p.rot); g.translate(-sk.hip[0], -sk.hip[1]); }
  g.lineJoin = 'round'; g.lineCap = 'round';
  const b = ch.build;
  if (ch.weaponBack) ch.weaponBack(g, sk, p, c, R, o);
  drawArm(g, sk.sB, sk.be, sk.bh, c, R, b.arm, true, null);
  drawLeg(g, sk.hip, sk.bk, sk.bf, c, R, b.leg, true, ch);
  g.beginPath(); g.ellipse(sk.hip[0], sk.hip[1] - 2, 13 * b.torso, 12, p.t, 0, TAU);
  if (!R.mono) { g.strokeStyle = OUTLINE; g.lineWidth = R.ol * 2; g.stroke(); }
  g.fillStyle = R.mono || c.leg; g.fill();
  drawTorso(g, sk, p, ch, c, R, o);
  drawLeg(g, sk.hip, sk.fk, sk.ff, c, R, b.leg, false, ch);
  if (ch.drawSkirt) ch.drawSkirt(g, sk, p, c, R, o);
  limb(g, sk.neck, [lerp(sk.neck[0], sk.head[0], 0.6), lerp(sk.neck[1], sk.head[1], 0.6)], 5.8 * b.torso, 5.2 * b.torso, c.skin, R);
  if (ch.neckWear) ch.neckWear(g, sk, p, c, R, o);
  g.save(); g.translate(sk.head[0], sk.head[1]); g.rotate(sk.ha); drawHead(g, ch, c, R, o); g.restore();
  drawArm(g, sk.sF, sk.fe, sk.fh, c, R, b.arm, false, ch.weaponFront ? () => ch.weaponFront(g, sk, p, c, R, o) : null);
  if (ch.shoulderOver) ch.shoulderOver(g, sk, p, c, R, o);
  g.restore();
  return sk;
}

// Portrait: bust shot of a character, rendered once into a canvas
function makePortrait(ch, w, h, opts = {}) {
  return mkCanvas(w, h, g => {
    const bg = g.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, opts.bg1 || '#12081f'); bg.addColorStop(1, opts.bg2 || ch.colors.accent);
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.globalAlpha = 0.25; g.strokeStyle = '#fff'; g.lineWidth = 2;
    for (let i = 0; i < 16; i++) { g.beginPath(); g.moveTo(rand(0, w), h); g.lineTo(rand(0, w) + w * 0.3, 0); g.stroke(); }
    g.globalAlpha = 1;
    const p = buildPose(ch, opts.pose || 'stance');
    const sc = (opts.scale || 3.1) * (ch.portraitScale || 1), s = ch.scale * sc, sk = skeleton(p, ch.dims);
    const anc = ch.portraitAnchor || sk.head;
    const x = w * (opts.hx || 0.42) - anc[0] * s, y = h * (opts.hy || 0.4) - anc[1] * s;
    const ropes = {};
    for (let i = 0; i < 40; i++) {  // settle ropes
      if (ch.ropes) for (const rs of ch.ropes) { let r = ropes[rs.id]; if (!r) r = ropes[rs.id] = new Rope(rs.n, rs.seg * s); const a = rs.at(sk, ch.dims.headR), wp = toWorld(x, y, 1, s, p, sk, a[0], a[1]); r.update(wp[0], wp[1], -(rs.wind || 0.55) * 2, (rs.grav ?? 0.3) * s); }
    }
    const fake = {}; if (ch.ropes) for (const rs of ch.ropes) fake[rs.id] = ropes[rs.id];
    drawFigure(g, ch, p, x, y, 1, { pal: opts.pal, scale: sc, expr: opts.expr || 'normal', glow: opts.glow, T: 0, ropes: fake });
    if (opts.vignette !== false) {
      const v = g.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.75);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.6)'); g.fillStyle = v; g.fillRect(0, 0, w, h);
    }
  });
}
