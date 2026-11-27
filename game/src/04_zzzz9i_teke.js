// ============================ TEKE TEKE — THE CRAWLING HORROR ============================
// Assassin / rushdown / technical, from the Japanese urban legend (public-domain folklore): the ghost of a schoolgirl
// whose lower body was lost in a railway accident. She has no legs and moves only with her (unnaturally long) arms,
// dragging herself across the ground at terrifying speed — "teke… teke… teke…" — with an oversized sickle.
// Stylized horror, no gore: her torso ends in a torn blouse hem and a band of dark-red ghost mist.
// RIG: the normal skeleton without legs. Her hands are planted on the ground by a small 2-bone IK (pose keys
//   tpf/tpb = plant weight, tfx/tbx = hand x relative to the hip, tfy/tby = lift) — crawling, idle, crouch and most
//   attacks keep one or both hands on the floor. tw = sickle angle (absolute, local space). Legs are never drawn.
// PASSIVE MOMENTUM (TK_CFG.mom): F.mom 0–100, four stages CRAWLING / ACCELERATING / HUNTING / UNSTOPPABLE.
//   Gains from continuous movement, chasing, landing hits and chaining movement abilities; decays when she stands still,
//   gets hit, blocks heavy attacks or whiffs high-commitment moves; a knockdown wipes most of it.
//   Bonuses: crawl speed, attack speed (xpHaste: startup of plain moves + recovery only), dash distance, range on sickle
//   moves (stage 3+), modest damage, stronger knockback on selected moves (stage 4), Rush follow-up NO ESCAPE (stage 4).
// Determinism: the simulation never uses rand() (only particles do).
const TT = '#ff2a3a', TT2 = '#ffb21a', TTD = '#0c0810', TTG = '#9a1428', TTW = '#e8eef2';
const TK_CFG = {
  mom: {
    at: [0, 25, 50, 80], names: ['CRAWLING', 'ACCELERATING', 'HUNTING', 'UNSTOPPABLE'], jp: ['這い', '加速', '狩り', '止まらない'],
    cols: ['#8a8aa0', '#ffb21a', '#ff6a2a', '#ff2a3a'],
    walk: [1, 1.12, 1.24, 1.34],      // crawl speed
    dash: [1, 1.1, 1.22, 1.32],       // dash distance
    haste: [0, 0.1, 0.16, 0.22],      // attack speed (xpHaste)
    dmg: [1, 1.02, 1.04, 1.07],       // all damage
    range: [1, 1, 1.15, 1.25],        // hitbox width of moves with tkRng
    kb: [1, 1, 1.1, 1.35],            // knockback of moves with tkKb
    gain: { fwd: 0.3, back: 0.1, dash: 0.75, chase: 0.18, hit: 3, spHit: 5, chain: 6, rush: 0.5 },
    loss: { grace: 24, idle: 0.55, hit: 10, hitEach: 2, block: 6, whiff: 14, kd: 0.15 },
    chainT: 110,                      // movement abilities within this many frames of each other count as a chain
  },
  rush: [16, 17.5, 19, 21],           // Teke Teke Rush travel speed per stage
  rail: { delay: [64, 60, 56, 50], half: 135, h: 230, dmg: 138, life: 16, reach: 680 },
  crawl: { hits: [4, 4, 5, 5], iv: [9, 9, 8, 7] },
  amb: 9,                             // Underground: Ambush within this many frames of resurfacing = PERFECT AMBUSH
};
// pose keys for the arm IK and the sickle (interpolated like every other pose key)
for (const k of ['tpf', 'tpb', 'tfx', 'tbx', 'tfy', 'tby', 'tw']) if (!POSE_KEYS.includes(k)) POSE_KEYS.push(k);
Object.assign(POSE0, { tpf: 0, tpb: 0, tfx: 40, tbx: 22, tfy: 0, tby: 0, tw: 1.5 });
const TK_DIMS = { ...CHIBI_DIMS, torso: 40, uarm: 34, farm: 33, neck: 4, headR: 26 };

function tkStage(F) { const m = F.mom || 0, A = TK_CFG.mom.at; return m >= A[3] ? 3 : m >= A[2] ? 2 : m >= A[1] ? 1 : 0; }
function tkWrap(a, ref) { while (a - ref > Math.PI) a -= TAU; while (a - ref < -Math.PI) a += TAU; return a; }
// 2-bone IK in the rig's angle convention (direction = (sin a, cos a)); bend +1 = elbow up/forward
function tkIK(S, T, L1, L2, bend) {
  let dx = T[0] - S[0], dy = T[1] - S[1], d = Math.hypot(dx, dy) || 0.001;
  const mx = (L1 + L2) * 0.995, mn = Math.abs(L1 - L2) + 2;
  if (d > mx) { dx *= mx / d; dy *= mx / d; d = mx; } else if (d < mn) { dx *= mn / d; dy *= mn / d; d = mn; }
  const a = Math.atan2(dx, dy), al = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const a1 = a + bend * al, ex = S[0] + Math.sin(a1) * L1, ey = S[1] + Math.cos(a1) * L1;
  return [a1, Math.atan2(S[0] + dx - ex, S[1] + dy - ey)];
}
// pose with the planted hands solved (returns the same object when nothing is planted)
function tkSolve(p, d) {
  if (p.tpf < 0.02 && p.tpb < 0.02) return p;
  const q = { ...p }, sk = skeleton(p, d);
  const hip = sk.hip;
  if (p.tpf >= 0.02) {
    const [a1, a2] = tkIK(sk.sF, [hip[0] + p.tfx, -p.tfy], d.uarm, d.farm, 1);
    q.fa1 = lerp(p.fa1, tkWrap(a1, p.fa1), p.tpf); q.fa2 = lerp(p.fa2, tkWrap(a2, p.fa2), p.tpf);
  }
  if (p.tpb >= 0.02) {
    const [a1, a2] = tkIK(sk.sB, [hip[0] + p.tbx, -p.tby], d.uarm, d.farm, 1);
    q.ba1 = lerp(p.ba1, tkWrap(a1, p.ba1), p.tpb); q.ba2 = lerp(p.ba2, tkWrap(a2, p.ba2), p.tpb);
  }
  return q;
}

// ---------------------------------- art ----------------------------------
// the oversized sickle: worn wooden handle wrapped in a torn cloth, dark curved blade with a cold edge
function tkSickle(g, H, ang, R, o = {}) {
  const dx = Math.sin(ang), dy = Math.cos(ang), px = -dy, py = dx, L = 50, m = R.mono;
  const a = [H[0] - dx * 10, H[1] - dy * 10], b = [H[0] + dx * L, H[1] + dy * L];
  g.save(); g.lineCap = 'round';
  if (!m) { g.strokeStyle = OUTLINE; g.lineWidth = 7.4; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); }
  g.strokeStyle = m || '#5a4636'; g.lineWidth = 4.6; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke();
  if (!m) {
    g.strokeStyle = '#3a2c24'; g.lineWidth = 1.2;
    for (const t of [0.2, 0.55, 0.8]) { const x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t); g.beginPath(); g.moveTo(x - px * 2.4, y - py * 2.4); g.lineTo(x + px * 2.4 + dx * 2, y + py * 2.4 + dy * 2); g.stroke(); }
    g.strokeStyle = '#c8c0b4'; g.lineWidth = 2.2; const w0 = 0.62, w1 = 0.74;   // torn cloth wrap with a loose strip
    g.beginPath(); g.moveTo(lerp(a[0], b[0], w0), lerp(a[1], b[1], w0)); g.lineTo(lerp(a[0], b[0], w1), lerp(a[1], b[1], w1)); g.stroke();
    g.lineWidth = 1.6; g.beginPath(); const c0 = [lerp(a[0], b[0], w1), lerp(a[1], b[1], w1)]; g.moveTo(...c0); g.quadraticCurveTo(c0[0] - px * 8 - dx * 4, c0[1] - py * 8 - dy * 4, c0[0] - px * 6 - dx * 12, c0[1] - py * 6 - dy * 12); g.stroke();
  }
  // blade: from the head of the handle, perpendicular, curving back toward the hand
  const B0 = [b[0] - dx * 2, b[1] - dy * 2], tip = [B0[0] + px * 46 - dx * 18, B0[1] + py * 46 - dy * 18];
  const outer = [B0[0] + px * 30 + dx * 16, B0[1] + py * 30 + dy * 16], inner = [B0[0] + px * 26 + dx * 2, B0[1] + py * 26 + dy * 2];
  g.beginPath(); g.moveTo(B0[0] + dx * 5, B0[1] + dy * 5); g.quadraticCurveTo(...outer, ...tip); g.quadraticCurveTo(...inner, B0[0] - dx * 4, B0[1] - dy * 4); g.closePath();
  if (!m) { g.strokeStyle = OUTLINE; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke(); }
  g.fillStyle = m || '#34363f'; g.fill();
  if (!m) {
    g.strokeStyle = o.hot ? '#ffd0d4' : '#b8bcc8'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(B0[0] + px * 6 + dx * 3, B0[1] + py * 6 + dy * 3); g.quadraticCurveTo(inner[0] + dx * 1, inner[1] + dy * 1, tip[0], tip[1]); g.stroke();
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(B0[0] + px * 12 + dx * 6, B0[1] + py * 12 + dy * 6, 1.6, 0, TAU); g.arc(B0[0] + px * 20 + dx * 8, B0[1] + py * 20 + dy * 8, 1.1, 0, TAU); g.fill();   // nicks in the blade
    if (o.glow) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,42,58,${0.35 * o.glow})`; g.lineWidth = 4; g.beginPath(); g.moveTo(B0[0] + px * 6, B0[1] + py * 6); g.quadraticCurveTo(...inner, ...tip); g.stroke(); g.restore(); }
  }
  g.restore();
}
// face: blank stare (null) · 'grin' (thin, too-wide smile) · 'wide' (eyes wide, pin-point pupils) · 'shut' (eyes closed) · hurt / ko
function tkFace(g, r, c, o) {
  let e = c.ex || null; const oe = o.expr;
  if (oe === 'hurt' || oe === 'ko') { chibiFace(g, r, { ...c, noMouth: 0 }, o); return; }
  if (oe === 'shout' && !e) e = 'grin';
  const ex = 0.5 * r, ey = 0.26 * r, fx = 0.94 * r;
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  // cold under-eye shadows
  g.fillStyle = 'rgba(70,50,110,0.28)'; g.beginPath(); g.ellipse(ex, ey + 0.36 * r, 0.26 * r, 0.1 * r, 0, 0, TAU); g.fill();
  if (e === 'shut') {
    g.strokeStyle = OUTLINE; g.lineWidth = 0.07 * r; g.beginPath(); g.moveTo(ex - 0.2 * r, ey + 0.02 * r); g.quadraticCurveTo(ex, ey + 0.1 * r, ex + 0.22 * r, ey); g.stroke();
  } else {
    const wide = e === 'wide', w = 0.24 * r, h = (wide ? 0.38 : 0.33) * r;
    g.fillStyle = '#fbfbff'; g.beginPath(); g.ellipse(ex, ey, w, h, 0, 0, TAU); g.fill();
    if (o.glow && FX.hq) { g.shadowColor = TT; g.shadowBlur = 10; }
    g.fillStyle = wide || o.glow ? TT : c.eye; g.beginPath(); g.ellipse(ex + w * 0.12, ey + h * 0.05, w * (wide ? 0.28 : 0.4), h * (wide ? 0.3 : 0.42), 0, 0, TAU); g.fill(); g.shadowBlur = 0;
    g.fillStyle = '#0a0206'; g.beginPath(); g.ellipse(ex + w * 0.14, ey + h * 0.05, w * (wide ? 0.1 : 0.16), h * (wide ? 0.1 : 0.17), 0, 0, TAU); g.fill();
    if (!wide) { g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(ex - w * 0.2, ey - h * 0.3, w * 0.16, 0, TAU); g.fill(); }
    // heavy, unblinking upper lid line (no lash wing: unsettling, not cute)
    g.strokeStyle = OUTLINE; g.lineWidth = 0.06 * r; g.beginPath(); g.moveTo(ex - w * 1.1, ey - h * 0.55); g.quadraticCurveTo(ex, ey - h * 1.18, ex + w * 1.05, ey - h * 0.62); g.stroke();
    g.lineWidth = 0.03 * r; g.beginPath(); g.moveTo(ex - w * 0.8, ey + h * 0.88); g.quadraticCurveTo(ex, ey + h * 1.08, ex + w * 0.8, ey + h * 0.86); g.stroke();
    // the far eye: a thin red glint behind the bangs
    g.fillStyle = wide ? TT : c.eye; g.beginPath(); g.ellipse(fx, ey, 0.05 * r, 0.16 * r, 0, 0, TAU); g.fill();
  }
  // brows: thin, slightly raised in the middle (a blank, sad look)
  g.strokeStyle = c.brow; g.lineWidth = 0.04 * r; g.beginPath(); g.moveTo(ex - 0.2 * r, ey - 0.48 * r); g.quadraticCurveTo(ex + 0.04 * r, ey - 0.62 * r, ex + 0.24 * r, ey - 0.52 * r); g.stroke();
  // mouth
  const mx = 0.7 * r, my = 0.74 * r; g.strokeStyle = OUTLINE; g.lineWidth = 0.045 * r;
  if (e === 'grin' || e === 'wide') {
    g.fillStyle = '#1a0408'; g.beginPath(); g.moveTo(mx - 0.26 * r, my - 0.06 * r); g.quadraticCurveTo(mx, my + (e === 'wide' ? 0.2 : 0.12) * r, mx + 0.28 * r, my - 0.1 * r); g.quadraticCurveTo(mx, my + 0.02 * r, mx - 0.26 * r, my - 0.06 * r); g.fill(); g.stroke();
    g.strokeStyle = '#efe8e0'; g.lineWidth = 0.025 * r; g.beginPath(); g.moveTo(mx - 0.18 * r, my - 0.02 * r); g.quadraticCurveTo(mx, my + 0.05 * r, mx + 0.2 * r, my - 0.05 * r); g.stroke();
  } else { g.beginPath(); g.moveTo(mx - 0.08 * r, my); g.lineTo(mx + 0.1 * r, my - 0.01 * r); g.stroke(); }
  g.restore();
}
// waist: the torn hem of her blouse and a band of dark ghost mist where the body ends (stylized, no injury detail)
function tkWaist(g, sk, p, c, R, o) {
  const bw = 1.06, T = (o && o.T) || 0;
  g.save(); g.translate(sk.hip[0], sk.hip[1]); g.rotate(p.t);
  if (!R.mono) {
    for (let i = 0; i < 3; i++) {   // the mist (behind the hem)
      const k = (T * 0.04 + i * 0.33) % 1, a = 0.45 * (1 - k);
      const gr = g.createRadialGradient(0, 8 + k * 12, 2, 0, 8 + k * 12, 18 + k * 12);
      gr.addColorStop(0, `rgba(120,10,30,${a})`); gr.addColorStop(0.6, `rgba(40,6,24,${a * 0.7})`); gr.addColorStop(1, 'rgba(10,0,10,0)');
      g.fillStyle = gr; g.beginPath(); g.ellipse(Math.sin(T * 0.05 + i) * 3, 8 + k * 12, 18 + k * 10, 10 + k * 8, 0, 0, TAU); g.fill();
    }
  }
  const pts = [[-13 * bw, -6], [12 * bw, -7], [12.5 * bw, 3], [8, 9], [5, 4], [1, 11], [-3, 5], [-7, 10], [-10, 4], [-13.5 * bw, 7]];
  poly(g, pts, R.mono || c.top, R, 2.4);
  if (!R.mono) {
    g.fillStyle = 'rgba(14,0,34,0.3)'; g.beginPath(); g.moveTo(-13 * bw, -1); g.lineTo(12 * bw, -2); g.lineTo(12.5 * bw, 3); g.lineTo(8, 9); g.lineTo(5, 4); g.lineTo(1, 11); g.lineTo(-3, 5); g.lineTo(-7, 10); g.lineTo(-10, 4); g.lineTo(-13.5 * bw, 7); g.closePath(); g.fill();
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,42,58,${0.3 + 0.15 * Math.sin(T * 0.12)})`; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(12.5 * bw, 3); g.lineTo(8, 9); g.lineTo(5, 4); g.lineTo(1, 11); g.lineTo(-3, 5); g.lineTo(-7, 10); g.lineTo(-10, 4); g.lineTo(-13.5 * bw, 7); g.stroke(); g.restore();
  }
  g.restore();
}
// full figure without legs (same layer order as drawFigure)
function tkDraw(g, ch, p0, x, y, facing, o) {
  const p = tkSolve(p0, ch.dims), s = ch.scale * (o.scale || 1), sk = skeleton(p, ch.dims), c = o.pal || (typeof RC !== 'undefined' && RC.pal && RC.pal[ch.id]) || ch.colors;
  const R = { mono: o.mono || null, ol: 2.4 };
  const cz = typeof cosOf === 'function' ? cosOf(ch, c) : null;
  const ropeList = cz && cz.ropes ? (ch.ropes || []).concat(cz.ropes) : ch.ropes;
  if (o.ropes && !o.mono && ropeList) {
    for (const rs of ropeList) {
      let rope = o.ropes[rs.id]; if (!rope) rope = o.ropes[rs.id] = new Rope(rs.n, rs.seg * s);
      const a = rs.at(sk, ch.dims.headR), wp = toWorld(x, y, facing, s, p, sk, a[0], a[1]);
      const wind = -facing * (rs.wind || 0.55) + Math.sin((o.T || 0) * 0.06 + rs.n) * 0.25;
      rope.update(wp[0], Math.min(wp[1], y + 2), wind, (rs.grav ?? 0.3) * s);
      for (const q of rope.p) if (q.y > y - 3) q.y = y - 3;   // long hair drags along the floor
      rope.draw(g, rs.w0 * s, rs.w1 * s, c[rs.color] || rs.color, rs.fork);
    }
  }
  g.save(); g.translate(x, y); g.scale(facing * s, s);
  if (p.rot) { g.translate(sk.hip[0], sk.hip[1]); g.rotate(p.rot); g.translate(-sk.hip[0], -sk.hip[1]); }
  g.lineJoin = 'round'; g.lineCap = 'round';
  const b = ch.build;
  if (cz && cz.back) cz.back(g, sk, p, c, R, o);
  if (ch.weaponBack) ch.weaponBack(g, sk, p, c, R, o);
  drawArm(g, sk.sB, sk.be, sk.bh, c, R, b.arm, true, null);
  tkWaist(g, sk, p, c, R, o);
  drawTorso(g, sk, p, ch, c, R, o);
  if (cz && cz.skirt) cz.skirt(g, sk, p, c, R, o);
  limb(g, sk.neck, [lerp(sk.neck[0], sk.head[0], 0.6), lerp(sk.neck[1], sk.head[1], 0.6)], 5.8 * b.torso, 5.2 * b.torso, c.skin, R);
  if (ch.neckWear) ch.neckWear(g, sk, p, c, R, o);
  if (cz && cz.neck) cz.neck(g, sk, p, c, R, o);
  g.save(); g.translate(sk.head[0], sk.head[1]); g.rotate(sk.ha); drawHead(g, ch, c, R, o, cz); g.restore();
  drawArm(g, sk.sF, sk.fe, sk.fh, c, R, b.arm, false, () => tkSickle(g, sk.fh, p.tw, R, { hot: c.hot, glow: c.sglow || 0 }));
  if (cz && cz.front) cz.front(g, sk, p, c, R, o);
  g.restore();
  return sk;
}

const TEKE = {
  id: 'teke', name: 'TEKE TEKE', jp: 'テケテケ', title: 'The Crawling Horror', titleJp: '這い寄る恐怖',
  style: 'ASSASSIN / RUSHDOWN', desc: 'The ghost of a schoolgirl lost on the railway. No legs, long unnatural arms and an oversized sickle. The longer she keeps moving, the deadlier she gets. Once she starts crawling, she never stops.',
  stats: { power: 4, speed: 5, range: 2, defense: 2 },
  scale: 1.16, health: 930, walk: 5.0, backWalk: 3.9, jumpV: -15.5, jumpX: 5.6, dashV: 16.5, backdashV: 10, backdashInv: 9, juggleMax: 6,
  voicePitch: 0.4, voiceRate: 0.7,
  colors: {
    skin: '#e9eef3', hair: '#121018', hair2: '#24202e', top: '#e4e2ea', uarm: '#e4e2ea', farm: '#e9eef3', cuff: '#1f2648', hand: '#e9eef3',
    leg: '#1f2648', boot: '#1f2648', foot: '#1f2648', warm: '#1f2648', sole: '#1f2648', pad: '#1f2648',
    eye: '#7a1020', eye2: '#2a0008', brow: '#121018', accent: TT, collar: '#1f2648', stripe: '#e4e2ea', ribbon: '#b0182c',
    tear: '#8a8a98', ex: null, hot: 0, sglow: 0,
  },
  afterColors: [TT, '#2a0a18', '#5a1a2a'],
  hurt: { w: 66, h: 150, ch: 116, air: 120, airTop: 150 },
  lowPush: 0.8,   // she crawls flat: jumpers clear her more easily (07_battle pushApart)
  stance: { ground: 0, hipH: 34, t: 0.86, hd: -0.72, fa1: 0.6, fa2: 0.3, ba1: 0.5, ba2: 0.2, tpf: 1, tpb: 1, tfx: 66, tbx: 42, tfy: 0, tby: 0, tw: 2.55, rot: 0 },
  poses: {
    // movement + states (legless versions of the shared poses)
    crouch: { hipH: 18, t: 1.2, hd: -1.05, tpf: 1, tpb: 1, tfx: 74, tbx: 48, tw: 2.4 },
    prejump: { hipH: 20, t: 1.1, hd: -0.9, tpf: 1, tpb: 1, tfx: 46, tbx: 26 },
    land: { hipH: 24, t: 1.0, hd: -0.85, tpf: 1, tpb: 1, tfx: 56, tbx: 34 },
    getup: { hipH: 24, t: 0.9, hd: -0.75, tpf: 1, tpb: 1, tfx: 50, tbx: 30 },
    jump: { hipH: 64, t: 0.55, hd: -0.35, tpf: 0, tpb: 0, fa1: -0.4, fa2: -0.25, ba1: -0.7, ba2: -0.5, tw: -0.6 },
    fall: { hipH: 70, t: 0.35, hd: -0.25, tpf: 0, tpb: 0, fa1: 0.75, fa2: 0.35, ba1: 0.55, ba2: 0.2, tw: 1.2 },
    flip: { hipH: 60, t: 1.6, hd: 0.2, tpf: 0, tpb: 0, fa1: 2.2, fa2: 1.4, ba1: 2.0, ba2: 1.2, tw: 3.2 },
    dash: { hipH: 16, t: 1.38, hd: -1.15, tpf: 0, tpb: 0.4, tbx: -8, fa1: 1.9, fa2: 1.7, ba1: -0.4, ba2: -0.2, tw: 2.0 },
    backdash: { hipH: 56, t: 0.1, hd: -0.05, tpf: 0, tpb: 0, fa1: 1.2, fa2: 0.6, ba1: 0.9, ba2: 0.4, tw: 1.2 },
    block: { hipH: 34, t: 0.18, hd: -0.05, tpf: 0, tpb: 1, tbx: 34, fa1: 1.35, fa2: 2.85, tw: 0.15 },
    cblock: { hipH: 20, t: 0.8, hd: -0.65, tpf: 0, tpb: 1, tbx: 44, fa1: 1.6, fa2: 2.9, tw: 0.4 },
    hit: { hipH: 34, t: -0.38, hd: -0.35, tpf: 0, tpb: 0.6, tbx: 10, fa1: -0.6, fa2: 0.1, ba1: -0.8, ba2: -0.3, tw: -0.5 },
    hit2: { hipH: 30, t: 0.95, hd: 0.45, tpf: 0, tpb: 0, fa1: 0.3, fa2: 0.15, ba1: 0.05, ba2: -0.1, tw: 0.5 },
    chit: { hipH: 18, t: 0.3, hd: -0.4, tpf: 0, tpb: 1, tbx: 20, fa1: -0.3, fa2: 0.2, tw: -0.3 },
    airhit: { hipH: 60, t: -0.55, hd: -0.6, tpf: 0, tpb: 0, fa1: -1.3, fa2: -0.9, ba1: -1.7, ba2: -1.3, tw: -1.0 },
    down: { hipH: 14, rot: -1.5, t: 0, hd: 0.25, tpf: 0, tpb: 0, fa1: -0.5, fa2: -0.2, ba1: 0.4, ba2: 0.6, tw: 0.4 },
    raise: { hipH: 40, t: 0.1, hd: -0.3, tpf: 0, tpb: 0, fa1: 2.7, fa2: 3.0, ba1: 2.85, ba2: 3.05, tw: 3.1 },
    grab: { hipH: 30, t: 0.8, hd: -0.6, tpf: 0, tpb: 1, tbx: 20, fa1: 1.45, fa2: 1.5, tw: 2.6 },
    throw: { hipH: 30, t: 0.9, hd: -0.6, tpf: 0, tpb: 1, tbx: 20, fa1: 1.7, fa2: 1.4, tw: 2.2 },
    lift: { hipH: 44, t: -0.1, hd: -0.3, tpf: 0, tpb: 1, tbx: 24, fa1: 2.8, fa2: 2.9, tw: 3.0 },
    counter: { hipH: 30, t: 0.4, hd: -0.3, tpf: 0, tpb: 1, tbx: 30, fa1: 1.25, fa2: 2.65, tw: 0.3 },
    // attacks: L/cL/jL = bare-handed claws (back arm), the rest = sickle (front arm)
    claw_w: { hipH: 38, t: 0.5, hd: -0.45, tpf: 1, tpb: 0, tfx: 44, ba1: 0.5, ba2: 2.6 },
    claw: { hipH: 30, t: 0.95, hd: -0.8, tpf: 1, tpb: 0, tfx: 40, ba1: 1.65, ba2: 1.6 },
    hook_w: { hipH: 40, t: 0.3, hd: -0.3, tpf: 0, tpb: 1, tbx: 24, fa1: 2.5, fa2: 2.9, tw: 2.4 },
    hook: { hipH: 30, t: 1.0, hd: -0.8, tpf: 0, tpb: 1, tbx: 26, fa1: 1.55, fa2: 1.25, tw: 0.75 },
    reap_w: { hipH: 46, t: -0.05, hd: -0.15, tpf: 0, tpb: 1, tbx: 22, fa1: 2.95, fa2: -2.9, tw: -2.4 },
    reap: { hipH: 26, t: 1.15, hd: -0.95, tpf: 0, tpb: 1, tbx: 28, fa1: 1.25, fa2: 0.9, tw: 0.9 },
    lowclaw: { hipH: 18, t: 1.2, hd: -1.05, tpf: 1, tpb: 0, tfx: 56, ba1: 1.55, ba2: 1.6 },
    drag_w: { hipH: 20, t: 1.05, hd: -0.9, tpf: 0, tpb: 1, tbx: 40, fa1: 0.4, fa2: -0.2, tw: 0.2 },
    drag: { hipH: 16, t: 1.25, hd: -1.05, tpf: 0, tpb: 1, tbx: 44, fa1: 1.6, fa2: 1.6, tw: 1.6 },
    spin_w: { hipH: 18, t: 1.1, hd: -0.9, tpf: 0, tpb: 1, tbx: 36, fa1: -0.5, fa2: -0.4, tw: -0.4 },
    spin: { hipH: 16, t: 1.2, hd: -0.95, tpf: 0, tpb: 1, tbx: 40, fa1: 1.62, fa2: 1.62, tw: 1.62, rot: 0.1 },
    jclaw: { hipH: 64, t: 0.9, hd: -0.6, tpf: 0, tpb: 0, fa1: -0.3, fa2: -0.2, ba1: 1.5, ba2: 1.55, tw: -0.4 },
    jspin: { hipH: 60, t: 1.4, hd: -0.7, tpf: 0, tpb: 0, fa1: 1.2, fa2: 0.6, ba1: -0.6, ba2: -0.3, tw: 0.4, rot: 0.4 },
    dive_w: { hipH: 64, t: 0.0, hd: -0.2, tpf: 0, tpb: 0, fa1: 2.9, fa2: 3.1, ba1: 2.6, ba2: 2.9, tw: -2.6 },
    dive: { hipH: 56, t: 1.3, hd: -0.9, tpf: 0, tpb: 0, fa1: 0.8, fa2: 0.4, ba1: 0.5, ba2: 0.3, tw: 0.4 },
    rise_w: { hipH: 18, t: 1.15, hd: -0.95, tpf: 0, tpb: 1, tbx: 36, fa1: 0.5, fa2: 0.1, tw: 0.6 },
    rise: { hipH: 52, t: 0.05, hd: -0.35, tpf: 0, tpb: 1, tbx: 16, fa1: 2.95, fa2: 3.05, tw: 3.05 },
    pounce_w: { hipH: 18, t: 1.2, hd: -1.0, tpf: 1, tpb: 1, tfx: 30, tbx: 12 },
    pounce: { hipH: 30, t: 1.45, hd: -1.1, tpf: 0, tpb: 0, fa1: 1.7, fa2: 1.55, ba1: 1.5, ba2: 1.6, tw: 1.0 },
    // specials
    rush: { hipH: 12, t: 1.42, hd: -1.2, tpf: 0, tpb: 0, fa1: 1.95, fa2: 1.75, ba1: -0.5, ba2: -0.3, tw: 2.3 },
    rushPull: { hipH: 14, t: 1.35, hd: -1.15, tpf: 1, tpb: 0, tfx: 70, ba1: -0.6, ba2: -0.4 },
    arc_w: { hipH: 30, t: -0.2, hd: -0.1, tpf: 0, tpb: 1, tbx: 22, fa1: -0.9, fa2: -1.4, tw: -1.0 },
    arc: { hipH: 30, t: 1.0, hd: -0.75, tpf: 0, tpb: 1, tbx: 30, fa1: 1.6, fa2: 1.7, tw: 2.7 },
    under: { hipH: 6, t: 1.5, hd: -1.3, tpf: 0.5, tpb: 0.5, tfx: 66, tbx: 30, fa1: 1.9, fa2: 1.7, ba1: 1.6, ba2: 1.5, tw: 1.7 },
    half_w: { hipH: 54, t: -0.2, hd: -0.2, tpf: 0, tpb: 0, fa1: 2.85, fa2: 3.1, ba1: 2.7, ba2: 3.05, tw: -2.7 },
    half: { hipH: 22, t: 1.25, hd: -0.95, tpf: 0, tpb: 0, fa1: 1.1, fa2: 0.6, ba1: 1.0, ba2: 0.55, tw: 0.6 },
    rail_w: { hipH: 30, t: 0.7, hd: -0.5, tpf: 0, tpb: 1, tbx: 30, fa1: 2.3, fa2: 2.6, tw: 3.0 },
    rail: { hipH: 14, t: 1.3, hd: -1.0, tpf: 1, tpb: 1, tfx: 66, tbx: 40, tw: 1.6 },
    crawlA: { hipH: 20, t: 1.25, hd: -1.0, tpf: 0, tpb: 1, tbx: 30, fa1: 1.7, fa2: 1.9, tw: 2.6 },
    crawlB: { hipH: 24, t: 0.9, hd: -0.7, tpf: 0, tpb: 1, tbx: 30, fa1: -0.4, fa2: 0.6, tw: 0.2 },
    // story / cosmetics / cinematic
    still: { hipH: 34, t: 0.8, hd: -0.66, tpf: 1, tpb: 1, tfx: 62, tbx: 40, tw: 2.5 },
    turn: { hipH: 34, t: 0.8, hd: 0.5, tpf: 1, tpb: 1, tfx: 62, tbx: 40, tw: 2.5 },
    look: { hipH: 38, t: 0.6, hd: -1.35, tpf: 1, tpb: 1, tfx: 58, tbx: 36, tw: 2.5 },
    tilt: { hipH: 36, t: 0.6, hd: 1.15, tpf: 1, tpb: 1, tfx: 58, tbx: 36, tw: 2.5 },
    hold: { hipH: 36, t: 0.4, hd: -0.35, tpf: 0, tpb: 0, fa1: 2.9, fa2: 3.05, ba1: 1.5, ba2: 1.55, tw: -2.9 },
    victory: { hipH: 36, t: 0.6, hd: 1.15, tpf: 1, tpb: 1, tfx: 58, tbx: 36, tw: 2.5 },
    defeat: { hipH: 8, t: 1.5, hd: -0.25, tpf: 0, tpb: 0, fa1: 1.55, fa2: 1.6, ba1: 1.4, ba2: 1.5, tw: 1.6 },
    intro: { hipH: 34, t: 0.8, hd: -0.66, tpf: 1, tpb: 1, tfx: 62, tbx: 40, tw: 2.5 },
    kneel: { hipH: 8, t: 1.5, hd: -0.25, tpf: 0, tpb: 0, fa1: 1.55, fa2: 1.6, ba1: 1.4, ba2: 1.5, tw: 1.6 },
  },
  intro: 'Teke... teke... teke...',
  wins: ['Teke... teke...', 'You stopped moving.', 'Have you seen... my legs?'],
  ropes: [
    { id: 'h1', at: (sk, r) => headPt(sk, -r * 0.9, -r * 0.3), n: 10, seg: 10, w0: 15, w1: 4, color: 'hair', grav: 0.5, wind: 0.5 },
    { id: 'h2', at: (sk, r) => headPt(sk, -r * 0.6, r * 0.3), n: 9, seg: 10, w0: 13, w1: 4, color: 'hair', grav: 0.55, wind: 0.42 },
    { id: 'h3', at: (sk, r) => headPt(sk, r * 0.25, r * 0.7), n: 6, seg: 9, w0: 8, w1: 3, color: 'hair2', grav: 0.6, wind: 0.3 },
  ],
  hairBack(g, r, c, R) {   // long messy back hair
    polyR(g, r, [[0.5, -0.92], [-0.2, -1.16], [-0.92, -0.94], [-1.32, -0.4], [-1.42, 0.3], [-1.3, 0.9], [-1.5, 1.4], [-1.0, 1.1], [-0.8, 1.6], [-0.5, 0.9], [-0.2, 1.2], [0.0, 0.5]], c.hair, R);
  },
  hairFront(g, r, c, R) {
    skullHair(g, r, c, R);
    // heavy, uneven bangs falling over the far eye; thin strands across the face
    polyR(g, r, [[-0.7, -0.84], [-0.3, -1.12], [0.3, -1.08], [0.82, -0.82], [1.12, -0.36], [1.1, 0.36], [0.98, 0.2], [0.9, 0.6], [0.8, 0.06], [0.72, -0.2], [0.56, -0.02], [0.48, -0.36], [0.3, -0.2], [0.24, -0.5], [-0.1, -0.56], [-0.4, -0.6]], c.hair, R);
    polyR(g, r, [[-0.1, -0.3], [0.04, 0.5], [-0.06, 1.4], [-0.26, 1.9], [-0.38, 1.1], [-0.5, 0.3]], c.hair, R);
    if (R.mono) return;
    g.strokeStyle = c.hair; g.lineWidth = 0.04 * r; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0.3 * r, -0.3 * r); g.quadraticCurveTo(0.2 * r, 0.2 * r, 0.12 * r, 0.62 * r); g.stroke();   // one loose strand at the temple
    g.fillStyle = c.hair2; g.beginPath(); g.moveTo(0.1 * r, -1.0 * r); g.lineTo(0.56 * r, -0.66 * r); g.lineTo(0.3 * r, -0.64 * r); g.closePath(); g.fill();
  },
  neckWear(g, sk, p, c, R) {   // navy sailor collar with white stripes and a red scarf, one corner torn
    const n = sk.neck;
    poly(g, [[n[0] - 14, n[1] + 14], [n[0] - 13, n[1] - 3], [n[0] + 4, n[1] - 5], [n[0] + 12, n[1] + 4], [n[0] + 4, n[1] + 9], [n[0] - 4, n[1] + 10], [n[0] - 8, n[1] + 16]], R.mono || c.collar, R, 2);
    if (R.mono) return;
    g.strokeStyle = c.stripe; g.lineWidth = 1.2; g.beginPath(); g.moveTo(n[0] - 11, n[1] + 11); g.lineTo(n[0] - 10, n[1] - 1); g.lineTo(n[0] + 3, n[1] - 2); g.stroke();
    poly(g, [[n[0] + 3, n[1] + 6], [n[0] + 10, n[1] + 4], [n[0] + 9, n[1] + 10], [n[0] + 12, n[1] + 20], [n[0] + 7, n[1] + 14], [n[0] + 4, n[1] + 19], [n[0] + 5, n[1] + 10]], c.ribbon, R, 1.4);
  },
  torsoDetail(g, L, bw, c, R, o) {   // school blouse: placket, a few tears and dirt, faint red stain-like glow seams (not wounds)
    g.strokeStyle = 'rgba(30,38,72,0.5)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(5 * bw, -L - 2); g.lineTo(4 * bw, 0); g.stroke();
    g.fillStyle = c.tear;
    for (const [x, y, w, h] of [[-9, -0.42, 5, 7], [7, -0.25, 4, 6], [-3, -0.7, 3, 4]]) { g.beginPath(); g.moveTo(x * bw, y * L); g.lineTo((x + w) * bw, y * L + 2); g.lineTo((x + w * 0.4) * bw, y * L + h); g.closePath(); g.fill(); }
    g.fillStyle = 'rgba(90,70,60,0.18)'; g.beginPath(); g.ellipse(-4 * bw, -L * 0.2, 9, 5, 0.3, 0, TAU); g.fill();
    g.strokeStyle = c.collar; g.lineWidth = 2.6; g.beginPath(); g.moveTo(-12 * bw, -L * 0.08); g.lineTo(11 * bw, -L * 0.1); g.stroke();
  },
  weaponBack(g, sk, p, c, R, o) {},
};
makeChibi(TEKE, { build: { arm: 0.98, leg: 1.0, torso: 1.06 }, colors: {} });
Object.assign(TEKE, { dims: { ...TK_DIMS }, faceFn: tkFace, drawCustom: tkDraw, drawBoot: null, portraitScale: 0.74 });
TEKE.colors.belt = null;
TEKE.wide = 1.15;

// ---------------------------------- look by state (draw-only, derived from sim state) ----------------------------------
const TK_PAL = {};
TEKE.palette = F => {
  const st = tkStage(F), ex = F.tkEx || null, hot = st >= 3 ? 1 : 0, gl = F.state === 'attack' && F.move && (F.move.special || F.move.ult) ? 1 : st >= 2 ? 0.5 : 0;
  const key = (ex || '') + '|' + hot + '|' + gl;
  return TK_PAL[key] || (TK_PAL[key] = { ...TEKE.colors, ex, hot, sglow: gl });
};
// procedural crawl: alternating hand plants driven by the walk phase; leans further and gets more frantic with momentum
function tkCrawlPose(ph, st, back) {
  const lean = [0.98, 1.1, 1.22, 1.34][st], lift = [12, 16, 20, 25][st], reach = [80, 88, 96, 104][st], tail = [24, 20, 16, 12][st];
  const k1 = (Math.sin(ph) + 1) / 2, k2 = (Math.sin(ph + Math.PI) + 1) / 2;   // 1 = hand forward
  const sw1 = Math.max(0, Math.cos(ph)), sw2 = Math.max(0, -Math.cos(ph));    // lift while swinging forward
  const heave = Math.abs(Math.sin(ph)) * (5 + st * 2);
  return {
    hipH: [28, 25, 22, 19][st] - heave * 0.35, t: lean + Math.sin(ph * 2) * 0.05 * (1 + st * 0.4) + (back ? -0.12 : 0), hd: -lean * 0.9 - 0.02 + Math.sin(ph * 2 + 0.6) * 0.06 * (1 + st),
    tpf: 1, tpb: 1, tfx: lerp(tail, reach, k1), tbx: lerp(tail - 6, reach - 14, k2), tfy: sw1 * lift, tby: sw2 * lift * 0.9,
    tw: 2.5 + sw1 * 0.45, hx: Math.sin(ph * 2) * 1.5,
  };
}
TEKE.statePose = F => {
  if (F.forcePose) return null;
  const st = tkStage(F), s = F.state;
  if (s === 'walk') return [tkCrawlPose(F.walkPhase, st, F.vx * F.facing < 0), 0.42 + st * 0.06];
  if (s === 'idle' && !F.guard) {
    const sw = Math.sin(F.T * 0.06), k = F.T % 360;
    if (k > 250 && k < 300) return ['look', 0.08];   // a slow, unnatural head roll
    return [{ base: 'stance', t: 0.86 + sw * 0.05, hd: -0.72 - sw * 0.06, hipH: 34 + sw * 2.5, hx: sw * 2, tfx: 66 + Math.sin(F.T * 0.03) * 2 }, 0.2];
  }
  if (s === 'dash') return [{ base: 'dash', t: 1.38 + Math.sin(F.sf * 1.3) * 0.06, fa1: 1.9 + Math.sin(F.sf * 1.6) * 0.3, ba1: -0.4 - Math.sin(F.sf * 1.6) * 0.3 }, 0.5];
  if (s === 'defeat') return F.sf < 24 ? ['hit', 0.25] : ['defeat', 0.08];
  if (s === 'victory' && !F.cos) return [F.sf < 40 ? 'still' : F.sf < 90 ? 'tilt' : { base: 'tilt', hd: 1.25 + Math.sin(F.sf * 0.05) * 0.15 }, 0.08];
  if (s === 'intro' && !F.cos) return [F.sf < 70 ? tkCrawlPose(F.sf * 0.33, 1, false) : 'look', 0.3];
  return null;
};
TEKE.idlePose = null;

// ---------------------------------- MOMENTUM ----------------------------------
function tkMomAdd(F, v, why) {
  if (!BT || BT.phase !== 'fight' || F.ko) return;
  const before = tkStage(F);
  F.mom = clamp((F.mom || 0) + v, 0, 100);
  if (v > 0) F.tkGainT = 0;
  const after = tkStage(F);
  if (after > before) tkStageUp(F, after);
  if (after < before && after <= 1 && before >= 2) FX.wtext(F.x, F.y - 190 * F.s, 'momentum lost', { size: 14, color: '#9a9ab0', stroke: TTD, life: 26 });
  if (why && v <= -6) FX.wtext(F.x, F.y - 205 * F.s, why, { size: 15, color: '#b8b0c8', stroke: TTD, life: 26 });
}
function tkStageUp(F, st) {
  const M = TK_CFG.mom;
  FX.wtext(F.x, F.y - 215 * F.s, M.names[st] + '!', { size: 16 + st * 4, color: M.cols[st], stroke: TTD, life: 34 });
  if (st === 3) {
    Sound.play('tekeMax'); FX.ring(F.x, F.y - 70, TT, 10, 150, 20, 5, 0.6); FX.ring(F.x, F.y - 70, '#ffffff', 6, 100, 14, 3, 0.4); F.tkMaxFx = 30;
  } else Sound.play('teke', 0.5 + st * 0.15, 1 + st * 0.08);
}
TEKE.initFighter = F => {
  F.mom = 0; F.tkEx = null; F.tkExT = 0; F.tkStill = 0; F.tkGainT = 0; F.tkPrevSt = 'idle'; F.tkPrevBS = 0; F.tkLastMv = -999; F.tkLow = false; F.tkVeil = 0;
  F.tkPlant = 0; F.tkSurf = -99; F.tkMaxFx = 0; F.tkStats = { maxSt: 0, rushes: 0, trains: 0, ambush: 0, chains: 0 };
  // UNDERGROUND lowers her hurtbox (highs and mid-height projectiles pass over her; lows still hit)
  F.hurtbox = function () { const r = Fighter.prototype.hurtbox.call(this); if (r && this.tkLow && this.onGround) { const h = 60 * this.s; r.y = this.y - h; r.h = h; } return r; };
  // RANGE: sickle moves with tkRng reach further at HUNTING / UNSTOPPABLE
  F.hitbox = function () { const r = Fighter.prototype.hitbox.call(this), m = this.move; if (m && m.tkRng) { const k = TK_CFG.mom.range[tkStage(this)]; if (k > 1) { const ex = r.w * (k - 1); r.w += ex; if (this.facing < 0) r.x -= ex; } } return r; };
  // momentum versions of moves (stronger knockback / extra hits / follow-up damage) are swapped in at the start
  F.startMove = function (k, forced) { Fighter.prototype.startMove.call(this, k, forced); tkBoost(this, k); };
};
function tkBoost(F, k) {
  const m = F.move; if (!m || F.moveKey !== k) return;
  const st = tkStage(F), M = TK_CFG.mom, o = {};
  if (m.tkKb && M.kb[st] > 1) o.kb = (m.kb || 4) * M.kb[st];
  if (k === 'sp2d') { o.hits = TK_CFG.crawl.hits[st]; o.interval = TK_CFG.crawl.iv[st]; }
  if (k === 'sp2' && st >= 3) { o.dmg = m.dmg * 1.12; o.tkMax = 1; }
  if (Object.keys(o).length) F.move = Object.assign(Object.create(m), o);
  if (m.tkMove) {   // movement abilities chained together build extra momentum
    if (F.T - F.tkLastMv < TK_CFG.mom.chainT) { tkMomAdd(F, M.gain.chain); F.tkStats.chains++; FX.wtext(F.x, F.y - 200 * F.s, 'CHAIN', { size: 14, color: M.cols[Math.max(1, st)], stroke: TTD, life: 22 }); }
    F.tkLastMv = F.T;
  }
}
TEKE.walkMul = F => TK_CFG.mom.walk[tkStage(F)];
TEKE.dmgBonus = F => TK_CFG.mom.dmg[tkStage(F)] * (F.state === 'attack' && F.moveKey === 'ambush' && F.tkAmbP ? 1.3 : 1);
TEKE.onDealDamage = (A, D, dmg) => {
  const m = A.state === 'attack' ? A.move : null;
  tkMomAdd(A, m && !m.special && !m.ult ? TK_CFG.mom.gain.hit : TK_CFG.mom.gain.spHit);
};
TEKE.tick = F => {
  const O = F.opp, M = TK_CFG.mom, live = BT && BT.phase === 'fight' && !F.ko;
  const st = tkStage(F), s = F.state;
  // ---- momentum bookkeeping ----
  if (live && O) {
    const fwd = F.vx * F.facing, moving = Math.abs(F.vx) > 1.2 && F.onGround;
    if (s === 'walk' && fwd > 0) {
      tkMomAdd(F, M.gain.fwd);
      const away = O.vx * Math.sign(O.x - F.x);   // chasing an opponent who backs off
      if (away > 0.8 && Math.abs(O.x - F.x) < 520) tkMomAdd(F, M.gain.chase);
    } else if (s === 'walk') tkMomAdd(F, M.gain.back);
    else if (s === 'dash') tkMomAdd(F, M.gain.dash);
    else if (s === 'attack' && F.move && F.move.tkMove && moving) tkMomAdd(F, M.gain.rush);
    const still = (s === 'idle' || s === 'crouch' || (s === 'block')) && !moving;
    F.tkStill = still ? F.tkStill + 1 : 0;
    if (F.tkStill > M.loss.grace) tkMomAdd(F, -M.loss.idle);
    // getting hit / knocked down / blocking heavy attacks
    if (s === 'hit' && F.tkPrevSt !== 'hit' && F.tkPrevSt !== 'wall') tkMomAdd(F, -M.loss.hit, '−MOMENTUM');
    else if (s === 'hit' && F.comboHits > (F.tkPrevCH || 0) && F.comboHits > 1) tkMomAdd(F, -M.loss.hitEach);
    if (s === 'knockdown' && F.tkPrevSt !== 'knockdown') { const was = F.mom; F.mom *= M.loss.kd; if (was >= M.at[1]) FX.wtext(F.x, F.y - 120, 'MOMENTUM RESET', { size: 16, color: '#b8b0c8', stroke: TTD, life: 34 }); }
    if (s === 'block' && F.blockstun > F.tkPrevBS && F.blockstun >= 14) tkMomAdd(F, -M.loss.block);
    F.tkStats.maxSt = Math.max(F.tkStats.maxSt, tkStage(F));
  }
  F.tkPrevSt = s; F.tkPrevBS = s === 'block' ? F.blockstun : 0; F.tkPrevCH = F.comboHits;
  if (F.state !== 'attack' || !F.move || !F.move.tkLow) F.tkLow = false;
  // ---- haste + longer dash + faster crawl cadence ----
  if (st > 0) xpHaste(F, M.haste[st]);
  if (s === 'dash' && F.sf < 10 && M.dash[st] > 1) F.x = clamp(F.x + F.facing * F.ch.dashV * (M.dash[st] - 1), 50, STAGE_W - 50);
  if (s === 'walk') F.walkPhase += 0.2 * Math.sign(F.vx * F.facing || 1) * (F.ch.walk / 4.4) * (M.walk[st] - 1);
  // ---- look ----
  if (F.tkExT > 0) F.tkExT--;
  else F.tkEx = s === 'attack' && F.move && (F.move.special || F.move.ult) ? 'wide' : st >= 3 && (s === 'walk' || s === 'dash') ? 'grin' : s === 'victory' && F.sf > 40 ? 'grin' : null;
  if (F.tkMaxFx > 0) F.tkMaxFx--;
  if (F.hidden || s === 'cine') return;
  // ---- feedback: hand plants (dust + the teke sound, faster and denser with momentum), trails, aura ----
  if (s === 'walk' || s === 'intro') {
    const ph = s === 'walk' ? F.walkPhase : F.sf * 0.33, q = Math.floor(ph / Math.PI);
    if (q !== F.tkPlant) {
      F.tkPlant = q;
      const hx = F.x + F.facing * (40 + st * 6) * F.s;
      FX.dust(hx, GROUND, 1 + st); if (st >= 2) FX.dust(hx - F.facing * 20, GROUND, st - 1);
      const every = [4, 2, 1, 1][st];
      if (q % every === 0) Sound.play(st >= 3 ? 'tekeFast' : 'teke', 0.35 + st * 0.12, 1 + st * 0.07);
    }
    if (st >= 2 && F.T % (st >= 3 ? 2 : 4) === 0) F.afterimage = Math.max(F.afterimage, st >= 3 ? 4 : 2);
  }
  if (s === 'dash' && F.T % 2 === 0) FX.dust(F.x - F.facing * 30, GROUND, 1 + st);
  if (st >= 3 && F.T % 3 === 0) FX.p({ type: 'ember', x: F.x + rand(-40, 40) * F.s, y: F.y - rand(10, 110) * F.s, vx: -F.facing * rand(0.5, 2), vy: -rand(0.4, 1.4), life: 22, size: rand(1.5, 3), color: F.T % 2 ? TT : '#ff8a90' });
  if (F.T % 9 === 0) FX.p({ type: 'smoke', x: F.x - F.facing * 6 + rand(-6, 6), y: F.y - 30 * F.s, vx: -F.facing * 0.4, vy: -0.25, life: 30, size: rand(4, 7), grow: 0.2, drag: 0.98, color: 'rgba(90,10,30,0.3)', add: false });   // ghost mist off the waist
};
TEKE.drawBehind = (g, F) => {   // UNSTOPPABLE aura: a dark red flicker hugging the ground behind her
  const st = tkStage(F); if (st < 3 || F.state === 'cine') return;
  const k = 0.5 + 0.5 * Math.sin(F.T * 0.4);
  g.save(); g.globalCompositeOperation = 'lighter';
  if (FX.hq) { const gr = g.createRadialGradient(F.x, F.y - 50 * F.s, 6, F.x, F.y - 50 * F.s, 120 * F.s); gr.addColorStop(0, `rgba(255,30,50,${0.22 + 0.1 * k})`); gr.addColorStop(1, 'rgba(255,0,30,0)'); g.fillStyle = gr; g.fillRect(F.x - 130 * F.s, F.y - 170 * F.s, 260 * F.s, 180 * F.s); }
  g.globalAlpha = 0.35 + 0.25 * k; drawFigure(g, F.ch, F.pose, F.x - F.facing * (6 + 4 * k), F.y, F.facing, { mono: TT, scale: 1.04 });
  g.restore(); g.globalAlpha = 1;
};
TEKE.drawExtra = (g, F) => {
  // UNDERGROUND: she vanishes into a low cloud of dust
  if (F.tkVeil > 0.02) {
    for (let i = 0; i < 6; i++) { const ph = i * 1.7 + F.T * 0.2; g.globalAlpha = 0.55 * F.tkVeil; g.fillStyle = i % 2 ? '#3a3036' : '#5a4a48'; g.beginPath(); g.ellipse(F.x + Math.sin(ph) * 36 - F.facing * 10, F.y - 18 - (i % 3) * 14, 40 + (i % 3) * 8, 22, 0, 0, TAU); g.fill(); }
    g.globalAlpha = 1;
  }
  if (F.tkMaxFx > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,42,58,${F.tkMaxFx / 30})`; g.lineWidth = 3; g.beginPath(); g.ellipse(F.x, F.y - 6, 100 * (1.4 - F.tkMaxFx / 30), 14, 0, 0, TAU); g.stroke(); g.restore(); }
  // the eye trail at high momentum
  if (tkStage(F) >= 2 && (F.state === 'walk' || F.state === 'dash' || (F.state === 'attack' && F.move && F.move.tkMove)) && !F.hidden) {
    const sk = F.sk, r = F.ch.dims.headR, e = toWorld(F.x, F.y, F.facing, F.s, F.pose, sk, ...headPt(sk, 0.52 * r, 0.3 * r));
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,42,58,0.7)'; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(e[0], e[1]); g.lineTo(e[0] - F.facing * (30 + tkStage(F) * 14), e[1] - 4); g.stroke(); g.restore();
  }
};
TEKE.introFx = F => { FX.wtext(F.x, F.y - 200, 'teke… teke…', { size: 18, color: '#d8c8cc', stroke: TTD, life: 70, vy: -0.25 }); Sound.play('ghostBreath'); };
TEKE.cpuBlind = (F, O) => (F.tkVeil > 0.3 ? 6 : 0);

// ---------------------------------- projectiles / effects ----------------------------------
// RAILWAY NIGHTMARE: tracks fade in under a section of the arena, crossing lights flicker, headlights grow in the dark,
// then a ghost train rushes through the marked area. The hit is a delayed projectile with a fixed rect.
EXTRA_PROJ.tkRail = {
  rect(p) { return { x: p.x - p.half, y: GROUND - p.zh, w: p.half * 2, h: p.zh }; },
  delay(p) {
    const k = 1 - p.delay / p.delay0; p.k = k;
    if (p.delay % 20 === 0) Sound.play('crossing', 0.55 + k * 0.4);
    if (p.delay === Math.floor(p.delay0 * 0.45)) Sound.play('trainHorn', 0.8);
    if (p.delay === 8) Sound.play('trainPass');
    if (p.delay % 6 === 0) FX.p({ type: 'smoke', x: p.x + rand(-p.half, p.half), y: GROUND - 4, vx: 0, vy: -0.3, life: 26, size: rand(6, 10), grow: 0.25, color: 'rgba(120,20,40,0.25)', add: false });
  },
  update(p) {
    if (!p.fired) { p.fired = true; p.tx = 0; FX.shakeIt(16); FX.flashScreen('#fff0d8', 6, 0.35); FX.impactFrame(1); Sound.play('impactBig'); }
    p.tx = (p.tx || 0) + 1;
    if (p.tx % 2 === 0) for (let i = 0; i < 3; i++) FX.p({ type: 'spark', x: p.x + rand(-p.half, p.half), y: GROUND - 6, vx: p.dir * rand(4, 10), vy: -rand(1, 4), life: 14, size: 2, color: '#ffd8a0' });
    if (p.life <= 1 && !p.hitAny && !p.penal) { p.penal = true; tkMomAdd(p.owner, -TK_CFG.mom.loss.whiff * 0.7, 'missed'); }
  },
  draw(g, p) {
    const k = p.delay > 0 ? p.k || 0 : 1, T = p.t, x0 = p.x - p.half, x1 = p.x + p.half, fired = p.delay <= 0;
    const a = Math.min(1, k * 2.5) * (fired ? Math.min(1, p.life / 6) : 1);
    // rails + sleepers (ghostly, fading at the edges of the zone)
    g.save();
    for (let x = x0 + 8; x < x1; x += 22) { g.globalAlpha = a * 0.9 * (1 - Math.abs(x - p.x) / p.half * 0.4); g.fillStyle = '#5a3a30'; g.fillRect(x, GROUND - 4, 13, 9); }
    g.globalAlpha = a; g.strokeStyle = '#b8bccb'; g.lineWidth = 3;
    for (const dy of [-1, 4]) { g.beginPath(); g.moveTo(x0, GROUND + dy); g.lineTo(x1, GROUND + dy); g.stroke(); }
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,42,58,${0.35 * a})`; g.lineWidth = 1.4; g.setLineDash([10, 8]); g.lineDashOffset = -T * 2;
    g.beginPath(); g.moveTo(x0, GROUND - p.zh); g.lineTo(x0, GROUND); g.moveTo(x1, GROUND - p.zh); g.lineTo(x1, GROUND); g.stroke(); g.setLineDash([]);
    // the danger zone: a red wash that pulses faster as the train comes
    const pul = 0.5 + 0.5 * Math.sin(T * (0.2 + k * 0.6));
    const gr = g.createLinearGradient(0, GROUND - p.zh, 0, GROUND); gr.addColorStop(0, 'rgba(255,30,50,0)'); gr.addColorStop(1, `rgba(255,30,50,${(0.08 + 0.16 * k * pul) * a})`);
    g.fillStyle = gr; g.fillRect(x0, GROUND - p.zh, p.half * 2, p.zh);
    g.globalCompositeOperation = 'source-over';
    // crossing signals at both ends: two alternating red lamps on a black-and-yellow post
    for (const sx of [x0 - 6, x1 + 6]) {
      g.globalAlpha = a; g.fillStyle = '#1a1418'; g.fillRect(sx - 2.5, GROUND - 120, 5, 120);
      for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#1a1418' : '#e8c020'; g.fillRect(sx - 2.5, GROUND - 40 + i * 9, 5, 9); }
      g.fillStyle = '#121014'; g.fillRect(sx - 15, GROUND - 126, 30, 12);
      g.strokeStyle = '#e8e8f0'; g.lineWidth = 2; g.beginPath(); g.moveTo(sx - 14, GROUND - 106); g.lineTo(sx + 14, GROUND - 94); g.moveTo(sx + 14, GROUND - 106); g.lineTo(sx - 14, GROUND - 94); g.stroke();
      const on = (T >> 3) % 2;
      for (const [lx, l] of [[-9, on], [9, 1 - on]]) {
        g.fillStyle = l ? '#ff3a3a' : '#3a0a0a'; g.beginPath(); g.arc(sx + lx, GROUND - 120, 5, 0, TAU); g.fill();
        if (l && FX.hq) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * 0.5; g.fillStyle = '#ff2a2a'; g.beginPath(); g.arc(sx + lx, GROUND - 120, 14, 0, TAU); g.fill(); g.restore(); }
      }
    }
    // distant headlights growing in the dark (from the side the train comes from)
    if (!fired) {
      const hx = p.x - p.dir * (p.half + 260 * (1 - k)), hy = GROUND - 70, r = 4 + k * k * 30;
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, k * 1.6);
      const hg = g.createRadialGradient(hx, hy, 0, hx, hy, r * 4); hg.addColorStop(0, 'rgba(255,250,220,0.9)'); hg.addColorStop(1, 'rgba(255,220,160,0)');
      g.fillStyle = hg; g.fillRect(hx - r * 4, hy - r * 4, r * 8, r * 8);
      g.fillStyle = '#fffbe8'; for (const dy of [-r * 0.2, r * 0.9]) { g.beginPath(); g.arc(hx, hy + dy, r * 0.32, 0, TAU); g.fill(); }
      const bm = g.createLinearGradient(hx, 0, p.x + p.dir * p.half, 0); bm.addColorStop(0, `rgba(255,240,200,${0.3 * k})`); bm.addColorStop(1, 'rgba(255,240,200,0)');
      g.fillStyle = bm; g.beginPath(); g.moveTo(hx, hy - r * 0.4); g.lineTo(x1 + p.dir * 40, GROUND - p.zh); g.lineTo(x1 + p.dir * 40, GROUND); g.closePath(); g.fill();
    } else {
      // the ghost train: a long dark silhouette with lit windows, rushing through the zone
      const t = 1 - p.life / p.max, L = 900, front = p.x - p.dir * (p.half + 140) + p.dir * (L + p.half * 2 + 280) * t;
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = Math.min(1, p.life / 5);
      g.save(); g.beginPath(); g.rect(x0 - 220, GROUND - p.zh - 40, p.half * 2 + 440, p.zh + 46); g.clip();
      tkGhostTrain(g, front, GROUND, p.dir, L, T);
      g.restore();
    }
    g.restore(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  },
};
function tkGhostTrain(g, front, y, dir, L, T, sc = 1) {   // dark ghost train, nose at `front`, running in direction dir
  g.save(); g.translate(front, y); g.scale(dir * sc, sc);
  const body = g.createLinearGradient(0, -176, 0, -10); body.addColorStop(0, '#5a6078'); body.addColorStop(0.35, '#2e3244'); body.addColorStop(1, '#14141e');
  g.fillStyle = body; g.beginPath(); g.moveTo(0, -36); g.quadraticCurveTo(8, -150, -70, -176); g.lineTo(-L, -176); g.lineTo(-L, -10); g.lineTo(0, -10); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(200,210,240,0.8)'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#b0182c'; g.fillRect(-L, -64, L - 6, 9);
  g.fillStyle = '#0a0a10'; for (let x = -40; x > -L; x -= 230) { g.beginPath(); g.arc(x, -8, 15, 0, TAU); g.arc(x - 60, -8, 15, 0, TAU); g.fill(); }
  for (let x = -110; x > -L + 30; x -= 70) {   // lit windows, some flickering
    const fl = (Math.floor(x * 7 + T * 0.4) % 5) ? 1 : 0.4;
    g.fillStyle = `rgba(255,226,170,${0.9 * fl})`; g.fillRect(x, -146, 44, 42);
    g.fillStyle = 'rgba(20,10,20,0.6)'; g.fillRect(x + 20, -146, 3, 42);
  }
  g.fillStyle = 'rgba(255,230,180,0.6)'; g.beginPath(); g.moveTo(-14, -140); g.quadraticCurveTo(-6, -110, -10, -96); g.lineTo(-56, -96); g.lineTo(-56, -150); g.closePath(); g.fill();
  g.globalCompositeOperation = 'lighter';
  g.fillStyle = '#fffbe8'; g.beginPath(); g.arc(-6, -46, 7, 0, TAU); g.fill();
  const bm = g.createLinearGradient(0, 0, 360, 0); bm.addColorStop(0, 'rgba(255,240,200,0.65)'); bm.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = bm; g.beginPath(); g.moveTo(-4, -50); g.lineTo(360, -110); g.lineTo(360, 10); g.closePath(); g.fill();
  const tr = g.createLinearGradient(-L - 220, 0, -L, 0); tr.addColorStop(0, 'rgba(255,40,60,0)'); tr.addColorStop(1, 'rgba(255,40,60,0.35)');
  g.fillStyle = tr; g.fillRect(-L - 220, -170, 220, 160);
  g.restore();
}
// HALF AND HALF: a diagonal cut line across the target, two offset glints (stylized "split" effect, no gore)
EXTRA_PROJ.tkCut = {
  update(p) {},
  draw(g, p) {
    const k = 1 - p.life / p.max, a = Math.min(1, p.life / 8), d = p.dir, L = 260 * (0.4 + k);
    g.save(); g.globalCompositeOperation = 'lighter'; g.translate(p.x, p.y); g.rotate(d > 0 ? -0.62 : 0.62);
    g.globalAlpha = a; g.fillStyle = p.max ? (p.big ? '#ff2a3a' : '#ff6a7a') : '#fff';
    g.beginPath(); g.moveTo(-L, 0); g.lineTo(0, -5 * (1 - k) - 2); g.lineTo(L, 0); g.lineTo(0, 5 * (1 - k) + 2); g.closePath(); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(-L * 0.8, 0); g.lineTo(0, -1.6); g.lineTo(L * 0.8, 0); g.lineTo(0, 1.6); g.closePath(); g.fill();
    g.globalAlpha = a * 0.5; g.fillStyle = 'rgba(255,42,58,0.6)'; g.fillRect(-L, -18 - k * 14, L * 2, 6); g.fillRect(-L, 12 + k * 14, L * 2, 6);
    g.restore();
  },
};
function tkCutFx(F, O, big) {
  BT.spawn({ owner: F, kind: 'tkCut', x: O.x, y: O.y - 100 * O.s, dir: F.facing, vx: 0, w: 1, h: 1, life: big ? 30 : 20, harmless: true, clash: 0, big: big ? 1 : 0 });
  FX.wtext(O.x, O.y - 250 * O.s, big ? '半々 !!' : '半々', { size: big ? 54 : 40, font: FX_JP(), color: '#ffffff', stroke: TTG, life: 44, vy: -0.3 });
}
// big sickle crescent (Severing Arc, Endless Crawl): drawn in world space for a few frames
EXTRA_PROJ.tkArc = {
  update(p) { const F = p.owner; p.x = F.x; p.y = F.y; },
  draw(g, p) {
    const k = 1 - p.life / p.max, a = Math.min(1, p.life / 6), d = p.dir, r = p.r * (0.85 + 0.2 * k);
    g.save(); g.translate(p.x + d * p.ox, p.y - p.oy); g.scale(d, 1); g.globalCompositeOperation = 'lighter';
    const a0 = p.a0, a1 = lerp(p.a0, p.a1, Math.min(1, k * 2.2));
    for (let i = 0; i < 3; i++) { g.globalAlpha = a * (0.6 - i * 0.18); g.strokeStyle = i ? TT : '#ffffff'; g.lineWidth = (14 - i * 4) * (1 - k * 0.5); g.beginPath(); g.arc(0, 0, r - i * 8, a0, a1, p.ccw); g.stroke(); }
    g.globalAlpha = a * 0.35; g.strokeStyle = '#5a0a2a'; g.lineWidth = 26; g.beginPath(); g.arc(0, 0, r + 10, a0, a1, p.ccw); g.stroke();
    g.restore();
  },
};
function tkArcFx(F, o) { BT.spawn({ owner: F, kind: 'tkArc', x: F.x, y: F.y, dir: F.facing, vx: 0, w: 1, h: 1, life: o.life || 14, harmless: true, clash: 0, r: o.r || 120, ox: o.ox || 20, oy: o.oy || 70, a0: o.a0 ?? -2.4, a1: o.a1 ?? 0.7, ccw: !!o.ccw }); }
function tkDustBurst(F, n = 14, big) {
  for (let i = 0; i < n; i++) FX.p({ type: 'smoke', x: F.x + rand(-40, 40), y: GROUND - rand(0, 20), vx: rand(-3, 3), vy: -rand(0.4, 2), life: rand(24, 40), size: rand(12, 20) * (big ? 1.3 : 1), grow: 0.35, drag: 0.92, color: i % 3 ? 'rgba(80,66,64,0.55)' : 'rgba(110,30,40,0.45)', add: false });
  FX.dust(F.x, GROUND, 8);
}

// ---------------------------------- moves ----------------------------------
const tkWhiff = (F, f, m) => { if (f === m.st + m.act + m.rec - 1 && !F.connected) tkMomAdd(F, -TK_CFG.mom.loss.whiff, 'missed'); };
TEKE.moves = Object.assign(baseNormals({ dmg: 0.96, spd: -1, rng: 1.0 }), {
  sp1: {
    name: 'TEKE TEKE RUSH', jp: 'テケテケ・ラッシュ', desc: 'She pulls herself at the foe with her arms at terrifying speed (contact damage, hold ← to cut it short). On hit press L / M / H for RUSH SLASH. Faster and longer with momentum; at UNSTOPPABLE, Rush Slash → SP1 = NO ESCAPE. Wide open if it misses.', special: 1, lvl: 4,
    poses: ['rushPull', 'rush'], st: 8, act: 20, rec: 18, cd: 66, sfx: 'tekeFast', tkMove: 1,
    dmg: 46, hs: 24, bs: 12, kb: 3, hb: { x: -4, y: -120, w: 92, h: 108 }, str: 2,
    poseFn(F, f) { return f <= 8 ? 'rushPull' : f <= 28 ? ((f >> 2) % 2 ? 'rush' : 'rushPull') : 'crouch'; },
    followups: [{ btn: 'light', move: 'rushSlash' }, { btn: 'medium', move: 'rushSlash' }, { btn: 'heavy', move: 'rushSlash' }],
    tick(F, f, O) {
      const m = F.move, st = tkStage(F);
      if (f <= m.st) { F.vx = 0; F.ctrlVel = true; if (f === 3) FX.dust(F.x, GROUND, 4); }
      if (f > m.st && f <= m.st + m.act) {
        if (F.connected) { F.vx = F.facing * 2; F.ctrlVel = true; return; }
        const brake = F.input.fwd < 0 ? 0.6 : 1, tail = f > m.st + m.act - 4 ? 0.45 : 1;
        F.vx = F.facing * TK_CFG.rush[st] * brake * tail; F.ctrlVel = true; F.afterimage = Math.max(F.afterimage, 4);
        if (f % 2 === 0) FX.dust(F.x - F.facing * 20, GROUND, 1 + st);
        if (f % 6 === 0) Sound.play('teke', 0.6, 1.15 + st * 0.06);
        if (f === m.st + 1) F.tkStats.rushes++;
      }
      tkWhiff(F, f, m);
    },
  },
  rushSlash: {
    name: 'RUSH SLASH', jp: '追い斬り', desc: 'Follow-up of Teke Teke Rush: she springs up out of the rush with a rising sickle cut that launches.', special: 1, lvl: 4.5, followup: 1,
    poses: ['rise_w', 'rise'], st: 5, act: 5, rec: 20, dmg: 58, hs: 28, bs: 12, kb: 3, launch: -12, hb: { x: -6, y: -190, w: 104, h: 180 }, str: 3, sfx: 'sickle', tkRng: 1,
    sw: { cx: 10, cy: -110, r: 90, a0: 1.3, a1: -1.6, color: TT },
    followups: [{ btn: 'sp1', move: 'noEscape', cond: F => tkStage(F) >= 3 && !F.input.p('sp2') }],   // SP1+SP2 stays the ultimate
    tick(F, f) { if (f <= 5) { F.vx = F.facing * 4; F.ctrlVel = true; } },
  },
  noEscape: {
    name: 'NO ESCAPE', jp: '逃がさない', desc: 'UNSTOPPABLE only — Rush Slash → SP1: she launches after the foe through the air and cuts again, slamming them down.', special: 1, lvl: 5, followup: 1, air: 'both',
    poses: ['dive_w', 'dive'], st: 6, act: 6, rec: 18, dmg: 66, hs: 30, bs: 12, kb: 9, kd: 1, hb: { x: -10, y: -200, w: 130, h: 150 }, str: 3, sfx: 'tekeMax', spike: 1, landRec: 10,
    sw: { cx: 0, cy: -150, r: 96, a0: -1.8, a1: 0.9, color: '#ffffff' },
    tick(F, f, O) {
      if (f === 1) { F.vy = -9; F.onGround = false; F.afterimage = 12; Sound.play('teke', 0.9, 1.3); }
      if (f <= 10) { F.vx = F.facing * 11; F.ctrlVel = true; }
    },
  },
  sp1f: {
    name: 'SEVERING ARC', jp: '断ち切りの弧', desc: 'A wide horizontal swing of the oversized sickle in a dark crescent: hits in front and above, pushes the foe back, brief impact freeze. Reaches further at high momentum.', special: 1, lvl: 4,
    poses: ['arc_w', 'arc'], st: 11, act: 6, rec: 20, cd: 80, sfx: 'sickle', tkRng: 1, tkKb: 1,
    dmg: 84, hs: 24, bs: 16, kb: 11, hb: { x: -24, y: -168, w: 178, h: 160 }, str: 3, hitstop: 15, shake: 6,
    tick(F, f, O) {
      if (f === 6) Sound.play('ghostBreath');
      if (f === 11) { const st = tkStage(F); tkArcFx(F, { r: 118 * TK_CFG.mom.range[st], ox: 26, oy: 74, a0: -2.5, a1: 0.9, life: 16 }); Sound.play('sickle', 1.2); FX.shakeIt(3); }
    },
  },
  counter: {
    name: 'UNDERGROUND', jp: '地這い', desc: 'She drops flat to the floor (low profile: highs and mid-height projectiles pass over her; lows still hit), vanishes in dust, crawls right past the foe and resurfaces behind them. L / M / H = AMBUSH — pressed right as she resurfaces it is a PERFECT AMBUSH (+30%). Faster, plus a short invincible start, at high momentum.', special: 1, lvl: 4,
    poses: ['under', 'under'], st: 4, act: 22, rec: 14, cd: 110, sfx: 'ghostBreath', tkMove: 1, tkLow: 1, pass: 30, dmg: 0,
    poseFn(F, f) { return f <= 26 ? 'under' : f <= 32 ? 'getup' : 'stance'; },
    followups: ['light', 'medium', 'heavy'].map(btn => ({ btn, move: 'ambush', any: 1, cond: F => F.tkSurfaced })),
    onStart(F, O) { F.tkDir = Math.sign(O.x - F.x) || F.facing; F.tkPassed = false; F.tkSurfaced = false; },
    tick(F, f, O) {
      const st = tkStage(F);
      if (f === 2) { tkDustBurst(F, 12); Sound.play('poof', 0.7); }
      if (f >= 3 && f <= 25) {
        F.tkLow = true; F.tkVeil = Math.min(1, F.tkVeil + 0.25);
        if (st >= 2 && f <= 9) F.invuln = Math.max(F.invuln, 2);
        const behind = (F.x - O.x) * F.tkDir > 70;
        if (behind) F.tkPassed = true;
        F.vx = F.tkPassed ? 0 : F.tkDir * (13 + st * 1.5); F.ctrlVel = true;
        if (f % 3 === 0) FX.dust(F.x, GROUND, 2);
        if (f % 7 === 0) Sound.play('teke', 0.4, 0.9);
      }
      if (f === 26 || (f > 10 && f < 26 && F.tkPassed && !F.tkSurfaced)) {
        if (!F.tkSurfaced) { F.tkSurfaced = true; F.tkSurf = F.T; F.facing = O.x > F.x ? 1 : -1; tkDustBurst(F, 10); FX.ring(F.x, F.y - 40, TT, 6, 70, 12, 3, 0.4); F.tkEx = 'wide'; F.tkExT = 24; Sound.play('teke', 0.9, 1.1); F.mf = Math.max(F.mf, 26); }
      }
      if (f >= 26) { F.tkVeil = Math.max(0, F.tkVeil - 0.2); F.tkLow = false; F.vx = 0; F.ctrlVel = true; }
    },
  },
  ambush: {
    name: 'AMBUSH', jp: '背後', desc: 'Follow-up of Underground: a sickle cut from behind. Right as she resurfaces = PERFECT AMBUSH (+30% damage).', special: 1, lvl: 4.5, followup: 1, sc: 1,
    poses: ['hook_w', 'reap'], st: 5, act: 5, rec: 18, dmg: 66, hs: 26, bs: 12, kb: 6, hb: { x: -10, y: -160, w: 120, h: 150 }, str: 3, sfx: 'sickle', tkRng: 1,
    sw: { cx: 0, cy: -110, r: 88, a0: -1.6, a1: 0.8, color: TT },
    onStart(F) {
      F.tkSurfaced = false; F.tkVeil = 0; F.tkLow = false;
      F.tkAmbP = F.T - F.tkSurf <= TK_CFG.amb;
      if (F.tkAmbP) { F.tkStats.ambush++; FX.wtext(F.x, F.y - 215 * F.s, 'PERFECT AMBUSH', { size: 20, color: '#ffffff', stroke: TT, life: 34 }); Sound.play('tekeMax'); }
    },
  },
  sp2: {
    name: 'HALF AND HALF', jp: '半々', desc: 'Both hands on the sickle, she rears up and brings it down in a huge diagonal cut — the screen splits along the blade. Long, visible startup; high damage, huge knockback, wall splat. A combo finisher. At UNSTOPPABLE the finishing cut hits 12% harder. Wide open if it misses.', special: 1, lvl: 4,
    poses: ['half_w', 'half'], st: 24, act: 5, rec: 30, cd: 150, sfx: 'ghostBreath', tkKb: 1, tkRng: 1,
    dmg: 126, hs: 30, bs: 18, kb: 15, kd: 1, ws: 1, str: 4, shake: 14, impact: 2, hb: { x: -6, y: -220, w: 150, h: 220 },
    poseFn(F, f) { return f <= 22 ? 'half_w' : f <= 40 ? 'half' : 'crouch'; },
    tick(F, f, O) {
      const m = F.move;
      if (f > 6 && f < 24 && f % 4 === 0) FX.p({ type: 'ember', x: F.handW('f')[0], y: F.handW('f')[1] - 30, vx: rand(-0.5, 0.5), vy: -rand(0.5, 1.5), life: 16, size: 2.5, color: TT });
      if (f === 25) { Sound.play('sickle', 1.4); tkArcFx(F, { r: 130, ox: 30, oy: 110, a0: -2.2, a1: 0.5, life: 14 }); }
      tkWhiff(F, f, m);
    },
    onHit(F, D) { tkCutFx(F, D, !!(F.move && F.move.tkMax)); return false; },
  },
  sp2f: {
    name: 'RAILWAY NIGHTMARE', jp: '線路の悪夢', desc: 'She slams her hands on the floor: ghostly railway tracks appear under a section of the arena (where the foe stands), crossing lights start ringing and headlights grow in the dark. After about one second a ghost train rushes through the marked area: heavy damage and knockback. Get out of the zone or block it. Momentum shortens the warning a little.', special: 1, lvl: 4,
    poses: ['rail_w', 'rail'], st: 16, act: 1, rec: 22, cd: 420, sfx: 'railClack',
    poseFn(F, f) { return f <= 14 ? 'rail_w' : f <= 34 ? 'rail' : 'stance'; },
    spawn: { f: 16, fn(F, O) {
      const C = TK_CFG.rail, st = tkStage(F), dx = clamp(O.x - F.x, -C.reach, C.reach), x = clamp(F.x + dx, C.half + 20, STAGE_W - C.half - 20), d = C.delay[st];
      BT.spawn({ owner: F, kind: 'tkRail', x, y: GROUND - C.h / 2, vx: 0, w: 1, h: 1, half: C.half, zh: C.h, dir: F.x < x ? 1 : -1, delay: d, delay0: d, life: C.life, hits: 1, persist: true, clash: 0,
        dmg: C.dmg, hs: 34, bs: 20, kb: 14, launch: -9, str: 4, color: TT, srcKey: 'sp2f', onHit: (A, D) => { const p = BT.projs.find(q => q.kind === 'tkRail' && q.owner === A && q.delay <= 0); if (p) p.hitAny = true; return false; }, projOnHit: 1 });
      FX.shakeIt(6); FX.dust(F.x + F.facing * 50, GROUND, 8); Sound.play('crossing', 0.6); F.tkStats.trains++;
    } },
  },
  sp2d: {
    name: 'ENDLESS CRAWL', jp: '果てしない這い', desc: 'She crawls around the foe at unnatural speed and cuts from both sides again and again (4 hits; 5 at HUNTING, faster at UNSTOPPABLE); the last cut launches them backward. Good on blocking foes; long recovery if blocked to the end.', special: 1, lvl: 4,
    poses: ['crawlA', 'crawlB'], st: 8, act: 40, rec: 22, cd: 180, sfx: 'tekeFast', tkMove: 1,
    dmg: 24, hits: 4, interval: 9, hs: 20, bs: 11, kb: 1.5, hb: { x: -70, y: -150, w: 190, h: 150 }, str: 2,
    final: { launch: -10, dmg: 48, hs: 30, kb: 9, kd: 1 },
    poseFn(F, f) { return f <= 8 ? 'rushPull' : f <= 48 ? ((f >> 2) % 2 ? 'crawlA' : 'crawlB') : 'crouch'; },
    tick(F, f, O) {
      const m = F.move;
      if (f <= m.st) { F.vx = 0; F.ctrlVel = true; }
      if (f > m.st && f <= m.st + m.act) {
        const dist = Math.abs(O.x - F.x), iv = m.interval || 9;
        if (F.hitCount >= (m.hits || 4)) { F.vx = 0; F.ctrlVel = true; if (F.mf < m.st + m.act) F.mf = m.st + m.act; return; }
        if (dist > 150) { F.vx = Math.sign(O.x - F.x) * 13; F.ctrlVel = true; }
        else if ((f - m.st) % iv === 1) {   // reposition: hop to the other side of the foe, sickle trail
          const side = ((f - m.st) / iv | 0) % 2 ? 1 : -1, x = clamp(O.x + side * Math.sign(O.x - F.x || 1) * 66, 55, STAGE_W - 55);
          F.x = x; F.facing = O.x > F.x ? 1 : -1; F.vx = 0; F.ctrlVel = true; F.afterimage = 8;
          tkArcFx(F, { r: 86, ox: 10, oy: 66, a0: side > 0 ? -2.6 : -1.2, a1: side > 0 ? 0.4 : 1.2, life: 10 });
          FX.dust(F.x, GROUND, 3); Sound.play('sickle', 0.8); if (F.hitCount % 2 === 0) Sound.play('teke', 0.5, 1.2 + F.hitCount * 0.06);
        } else { F.vx = 0; F.ctrlVel = true; }
      }
    },
  },
  ult: {
    name: 'THE LAST TRAIN', jp: '終電', desc: 'Ultimate. The arena goes dark and a railway crossing starts ringing. She stops. Turns her head. "Teke… teke…" — then the chase through an abandoned night station, the headlights, the grab, and one massive cut at the exact moment the last train passes. Does not need momentum.', ult: 1, lvl: 6, cost: 100,
    poses: ['rushPull', 'rush'], st: 10, act: 12, rec: 30, dmg: 20, hs: 40, bs: 20, kb: 1, hb: { x: -4, y: -170, w: 150, h: 170 }, invuln: [0, 16], str: 3, sfx: 'crossing',
    tick(F, f) { if (f > 10 && f <= 22) { F.vx = F.facing * 14; F.ctrlVel = true; F.afterimage = 6; } },
    onHit(F, D) { BT.startCine(F, D, CINE.teke, { zoom: 1.4 }); return true; },
  },
});
(() => {
  const M = TEKE.moves;
  Object.assign(M.L, { name: 'Grasping Claw', poses: ['claw_w', 'claw'], hb: { x: 8, y: -150, w: 70, h: 56 }, sw: { cx: 10, cy: -80, r: 62, a0: -1.0, a1: 0.5, color: '#e8e0ec' } });
  Object.assign(M.M, { name: 'Hook Pull', poses: ['hook_w', 'hook'], hb: { x: 10, y: -150, w: 96, h: 100 }, kb: 2.5, tkRng: 1, sw: { cx: 6, cy: -90, r: 80, a0: -1.6, a1: 0.6, color: TT } });
  Object.assign(M.H, { name: 'Reaping Drop', poses: ['reap_w', 'reap'], hb: { x: 6, y: -190, w: 112, h: 170 }, tkRng: 1, sw: { cx: 0, cy: -120, r: 96, a0: -2.2, a1: 0.7, color: TT } });
  Object.assign(M.cL, { name: 'Floor Scratch', poses: ['lowclaw', 'lowclaw'], hb: { x: 10, y: -60, w: 70, h: 52 } });
  Object.assign(M.cM, { name: 'Ankle Reaper', poses: ['drag_w', 'drag'], hb: { x: 15, y: -44, w: 104, h: 40 }, tkRng: 1 });
  Object.assign(M.cH, { name: 'Track Sweep', poses: ['spin_w', 'spin'], hb: { x: -10, y: -46, w: 128, h: 40 }, tkRng: 1, sw: { cx: 0, cy: -30, r: 88, a0: Math.PI * 0.9, a1: 0.2, color: TT } });
  Object.assign(M.jL, { name: 'Pounce Claw', poses: ['jump', 'jclaw'] });
  Object.assign(M.jM, { name: 'Sickle Spin', poses: ['jump', 'jspin'], hb: { x: -10, y: -110, w: 100, h: 70 } });
  Object.assign(M.jH, { name: 'Falling Reaper', poses: ['dive_w', 'dive'], hb: { x: 0, y: -130, w: 110, h: 100 }, sw: { cx: 0, cy: -110, r: 86, a0: -1.8, a1: 0.8, color: TT } });
  Object.assign(M.LH, { name: 'Rising Hook', poses: ['rise_w', 'rise'], hb: { x: 0, y: -215, w: 86, h: 200 } });
  Object.assign(M.FF, { name: 'Pounce', poses: ['pounce_w', 'pounce'], vx: 13, hb: { x: 8, y: -140, w: 100, h: 110 }, tkKb: 1 });
  for (const k of ['L', 'cL', 'jL']) M[k].sfx = null;
})();
// CPU hints
TEKE.moves.sp1.__ai = { reach: 380, kind: 'melee', anti: false, st: 8, low: false, over: false };
TEKE.moves.sp1f.__ai = { reach: 190, kind: 'melee', anti: true, st: 11, low: false, over: false };
TEKE.moves.counter.__ai = { reach: 300, kind: 'buff', anti: false, st: 4, low: false, over: false };
TEKE.moves.sp2.__ai = { reach: 160, kind: 'melee', anti: false, st: 24, low: false, over: false };
TEKE.moves.sp2f.__ai = { reach: 620, kind: 'proj', anti: false, st: 16, low: false, over: false };
TEKE.moves.sp2d.__ai = { reach: 200, kind: 'melee', anti: false, st: 8, low: false, over: false };
TEKE.moves.counter.cpuOk = F => F.opp && Math.abs(F.opp.x - F.x) < 300 && F.opp.onGround;
TEKE.moves.sp2f.cpuOk = F => !BT.projs.some(p => p.kind === 'tkRail' && p.owner === F);
TEKE.combos = [
  { name: 'Rush Slash', notation: 'SP1 (Teke Teke Rush) → L (Rush Slash)', seq: ['sp1', 'rushSlash'] },
  { name: 'Severing Arc', notation: 'L → M → ↓→SP1 (Severing Arc)', seq: ['L', 'M', 'sp1f'] },
  { name: 'Half and Half', notation: 'L → M → H → SP2 (Half and Half)', seq: ['L', 'M', 'H', 'sp2'] },
  { name: 'Endless Crawl', notation: 'L → M → ↓↓SP2 (Endless Crawl)', seq: ['L', 'M', 'sp2d'] },
  { name: 'The Last Train', notation: 'L → M → SP1+SP2 (Ultimate)', seq: ['L', 'M', 'ult'], meter: 1 },
];
TEKE.applyTrial = (A, tr) => { if (tr && tr.meter) A.meter = 100; };

// ---------------------------------- HUD + how-to ----------------------------------
TEKE.drawHand = (g, F, side, t) => {
  const M = TK_CFG.mom, st = tkStage(F), k = (F.mom || 0) / 100, max = st >= 3;
  xpPanel(g, F, side, t, {
    col: M.cols[st], col2: '#ffffff', icon: '', flash: max, marks: [0.25, 0.5, 0.8],
    title: 'MOMENTUM · ' + M.names[st], sub: '勢い · ' + (max ? 'MAX · Rush Slash → SP1 = NO ESCAPE' : st >= 2 ? 'faster · longer reach' : st ? 'faster crawl + attacks' : 'keep moving · chase · hit'),
    k, label: Math.round(F.mom || 0) + '%',
    badges: [['sp1', 'S1|RUSH'], ['sp1f', '↓→S1|ARC'], ['counter', '↓←S1|UNDER'], ['sp2', 'S2|HALF'], ['sp2f', '↓→S2|RAILWAY'], ['sp2d', '↓↓S2|CRAWL']],
  });
  // icon: a tiny sickle over four stage pips; the glow pulses at UNSTOPPABLE
  const pw = 330, x0 = side > 0 ? 40 : W - 40 - pw, ix = side > 0 ? x0 + 33 : x0 + pw - 33, iy = 560 + 32;
  g.save();
  if (max) { g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,42,58,${0.25 + 0.2 * Math.sin(t * 0.3)})`; g.beginPath(); g.arc(ix, iy - 1, 26, 0, TAU); g.fill(); g.globalCompositeOperation = 'source-over'; }
  g.save(); g.translate(ix, iy - 4); g.scale(0.42, 0.42); tkSickle(g, [-22, 30], 2.5, { mono: null }, { glow: max ? 1 : 0 }); g.restore();
  for (let i = 0; i < 4; i++) { g.fillStyle = i <= st && (F.mom || 0) > 0 ? M.cols[i] : 'rgba(255,255,255,0.18)'; g.fillRect(ix - 15 + i * 8, iy + 14, 6, 4); }
  g.restore();
};
TEKE.howTo = {
  title: 'TEKE TEKE',
  draw(g) {
    xpHowTo(g, 'TEKE TEKE — THE CRAWLING HORROR', TT, [
      ['MOMENTUM', 'Keep moving: crawling forward, chasing, dashing, hitting and chaining movement moves fill it. Standing still, getting hit, blocking heavy hits and whiffs drain it; a knockdown wipes it. 4 stages: CRAWLING → ACCELERATING → HUNTING → UNSTOPPABLE (faster crawl + attacks, longer dash, more reach, a bit more damage, stronger knockback).'],
      ['SP1', 'Teke Teke Rush — gap closer at terrifying speed. On hit L/M/H = Rush Slash (launch). UNSTOPPABLE: Rush Slash → SP1 = No Escape.'],
      ['↓→ SP1', 'Severing Arc — wide sickle crescent, pushes back, hits people walking in.'],
      ['↓← SP1', 'Underground — flat to the floor (highs pass over), crawl behind them. L/M/H = Ambush; right on resurfacing = PERFECT.'],
      ['SP2', 'Half and Half — slow, huge diagonal cut. Combo finisher. Punishable on whiff.'],
      ['↓→ SP2', 'Railway Nightmare — tracks under the foe, crossing lights, then a ghost train rushes through. Leave the zone or block.'],
      ['↓↓ SP2', 'Endless Crawl — she circles the foe with 4–5 cuts from both sides; the last one launches.'],
    ], 'No legs, no walking: she crawls. Ultimate (SP1+SP2): THE LAST TRAIN.');
  },
};

CHARS.push(TEKE);
finalizeMoves(TEKE);
