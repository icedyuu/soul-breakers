// ============================ REIKA — THE CONTROL DEVIL ============================
// Technical / zoning / control. An elegant, expressionless woman in a white shirt and black tie whose ringed golden
// eyes bend the battlefield to her will. Built on the chibi kit. Original design; supernatural "control" archetype.
// Systems: AUTHORITY (fills on hits & successful control, drains when she is hit) → DOMINANCE state ·
//          Command (bind/stun), Crushing Pressure (delayed crush), Bloodline Mark (vulnerability debuff).
const REIKA_DOM_T = 420, REIKA_MARK_T = 360;

// ---------------------------------- art ----------------------------------
function reikaPal(base, k, dom) {
  const p = { ...base, authK: k, dom: !!dom };
  if (dom) Object.assign(p, { eye: '#ffd84a', accent: '#ff1f3d', eyeRing: '#ff1f3d' });
  return p;
}
function reikaEye(g, x, y, w, h, c, o, far) {
  const glow = o.glow || c.dom;
  g.fillStyle = '#fdfbf6'; g.beginPath(); g.ellipse(x, y, w, h, 0, 0, TAU); g.fill();
  if (glow && FX.hq) { g.shadowColor = c.dom ? '#ff1f3d' : c.eye; g.shadowBlur = 10; }
  const gr = g.createRadialGradient(x + w * 0.06, y + h * 0.08, 0, x + w * 0.06, y + h * 0.08, w * 0.95);
  gr.addColorStop(0, '#fff2b0'); gr.addColorStop(0.5, c.eye); gr.addColorStop(1, c.eye2);
  g.fillStyle = gr; g.beginPath(); g.ellipse(x + w * 0.06, y + h * 0.08, w * 0.88, h * 0.86, 0, 0, TAU); g.fill(); g.shadowBlur = 0;
  // concentric rings — her signature stare
  g.strokeStyle = c.eyeRing; g.lineWidth = Math.max(0.8, w * 0.09);
  for (const k of [0.72, 0.48]) { g.beginPath(); g.ellipse(x + w * 0.06, y + h * 0.08, w * 0.88 * k, h * 0.86 * k, 0, 0, TAU); g.stroke(); }
  g.fillStyle = c.eyeRing; g.beginPath(); g.ellipse(x + w * 0.06, y + h * 0.08, w * 0.2, h * 0.2, 0, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.ellipse(x - w * 0.36, y - h * 0.28, w * 0.24, h * 0.14, -0.3, 0, TAU); g.fill();
  // calm, half-lowered lid
  g.fillStyle = c.skin; g.beginPath(); g.moveTo(x - w * 1.3, y - h * 1.25); g.lineTo(x + w * 1.3, y - h * 1.25); g.lineTo(x + w * 1.2, y - h * 0.52); g.quadraticCurveTo(x, y - h * 0.66, x - w * 1.2, y - h * 0.56); g.closePath(); g.fill();
  g.strokeStyle = OUTLINE; g.lineCap = 'round'; g.lineWidth = Math.max(1.6, h * 0.22);
  g.beginPath(); g.moveTo(x - w * 1.15, y - h * 0.56); g.quadraticCurveTo(x, y - h * 0.7, x + w * 1.1, y - h * 0.5); g.stroke();
  if (!far) { g.lineWidth = Math.max(1.1, h * 0.12); g.beginPath(); g.moveTo(x - w * 1.0, y - h * 0.58); g.lineTo(x - w * 1.55, y - h * 0.82); g.stroke(); }
}
function reikaFace(g, r, c, o) {
  const e = o.expr || 'normal';
  if (e === 'hurt' || e === 'ko') { chibiFace(g, r, c, o); return; }
  const ex = 0.5 * r, ey = 0.25 * r, fx = 0.94 * r;
  g.save(); g.lineCap = 'round';
  g.fillStyle = 'rgba(255,120,140,0.14)'; g.beginPath(); g.ellipse(0.34 * r, 0.58 * r, 0.13 * r, 0.05 * r, 0, 0, TAU); g.fill();
  if (e === 'closed') { g.strokeStyle = OUTLINE; g.lineWidth = 0.07 * r; g.beginPath(); g.moveTo(ex - 0.2 * r, ey + 0.04 * r); g.quadraticCurveTo(ex, ey + 0.12 * r, ex + 0.2 * r, ey + 0.02 * r); g.moveTo(fx - 0.06 * r, ey + 0.03 * r); g.quadraticCurveTo(fx, ey + 0.08 * r, fx + 0.06 * r, ey + 0.02 * r); g.stroke(); }
  else { reikaEye(g, fx, ey - 0.01 * r, 0.075 * r, 0.29 * r, c, o, true); reikaEye(g, ex, ey, 0.23 * r, 0.34 * r, c, o, false); }
  // thin, level brows — no emotion
  g.strokeStyle = c.brow; g.lineWidth = 0.045 * r; g.beginPath(); g.moveTo(ex - 0.22 * r, ey - 0.52 * r); g.lineTo(ex + 0.24 * r, ey - 0.5 * r); g.stroke();
  // mouth: a flat line; the faintest smile when she wins
  const mx = 0.72 * r, my = 0.72 * r; g.strokeStyle = OUTLINE; g.lineWidth = 0.04 * r; g.beginPath();
  if (e === 'grin') { g.moveTo(mx - 0.07 * r, my); g.quadraticCurveTo(mx, my + 0.04 * r, mx + 0.07 * r, my - 0.01 * r); }
  else { g.moveTo(mx - 0.06 * r, my + 0.01 * r); g.lineTo(mx + 0.06 * r, my); }
  g.stroke(); g.restore();
}
function reikaCoat(g, sk, c, R, o) {   // long dark coat worn over the shoulders like a cape
  const T = o.T || 0, sw = Math.sin(T * 0.06) * 3, n = sk.neck, h = sk.hip;
  const top = [n[0] - 4, n[1] + 4], sh = [n[0] - 20, n[1] + 10], hemB = [h[0] - 30 + sw, h[1] + 52], hemF = [h[0] + 2 + sw * 0.5, h[1] + 48];
  poly(g, [top, [n[0] + 10, n[1] + 6], [h[0] + 6, h[1] + 8], hemF, hemB, sh], c.coat, R, 4);
  if (R.mono) return;
  g.fillStyle = c.coatIn; g.beginPath(); g.moveTo(h[0] + 4, h[1] + 10); g.lineTo(hemF[0], hemF[1]); g.lineTo(hemF[0] - 9, hemF[1] + 1); g.lineTo(h[0] - 4, h[1] + 12); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1.4; for (const k of [0.35, 0.65]) { const a = lerpP(sh, top, k), b = lerpP(hemB, hemF, k); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); }
}
function reikaFingers(g, sk, p, c, R) {   // two extended fingers (the "bang" gesture), driven by pose key pw
  if (!(p.pw > 0.3)) return;
  const [hx, hy] = sk.fh, a = p.fa2, dx = Math.sin(a), dy = Math.cos(a), nx = -dy, ny = dx, L = 11 * p.pw;
  for (const s of [-1.6, 1.6]) limb(g, [hx + nx * s, hy + ny * s], [hx + dx * L + nx * s, hy + dy * L + ny * s], 2.3, 2, c.hand, R);
}

// ---------------------------------- character ----------------------------------
const REIKA = {
  id: 'reika', name: 'REIKA', jp: 'レイカ', title: 'The Control Devil', titleJp: '支配の悪魔',
  style: 'ZONER / CONTROL', desc: 'Calm, polite, utterly in command. Invisible force, binding Commands and delayed crushes punish every predictable move, but she struggles up close.',
  stats: { power: 3, speed: 2, range: 5, defense: 2 },
  scale: 1.0, health: 900, walk: 3.9, backWalk: 3.9, jumpV: -17, jumpX: 4.4, dashV: 11, backdashV: 10, backdashInv: 10, juggleMax: 6,
  voicePitch: 0.85, voiceRate: 0.82,
  colors: {
    skin: '#f8e8de', hair: '#c4492a', hair2: '#9a3418', top: '#f4f2ee', leg: '#24222c', boot: '#141016', foot: '#141016', uarm: '#f4f2ee', farm: '#f4f2ee', hand: '#f8e8de', cuff: '#f4f2ee', belt: '#141016',
    eye: '#e6c040', eye2: '#7a5a10', eyeRing: '#8a3010', accent: '#c41e36', brow: '#9a3418', warm: '#24222c', sole: '#5a0a16', pad: '#b89a4a', collar: '#f4f2ee',
    tie: '#121014', coat: '#1a161e', coatIn: '#5a0a16', gold: '#b89a4a', authK: 0, dom: false,
  },
  afterColors: ['#c41e36', '#6a0a1c', '#e6c040'],
  stance: { t: -0.04, hd: 0.06, fa1: 0.22, fa2: 0.45, ba1: -0.12, ba2: 0.25, fl1: 0.16, fl2: 0.04, bl1: -0.14, bl2: -0.05, pw: 0 },
  poses: {
    victory: { t: -0.05, hd: -0.08, fa1: 0.55, fa2: 2.95, ba1: 0.3, ba2: 1.6, fl1: 0.1, fl2: 0.02, bl1: -0.1, bl2: -0.02 },
    intro: { t: -0.04, hd: 0.05, fa1: 1.55, fa2: 1.57, ba1: -0.3, ba2: 0.6, fl1: 0.15, fl2: 0.04, bl1: -0.12, bl2: -0.04, pw: 1 },
    point_w: { t: -0.06, hd: 0.0, fa1: 0.9, fa2: 2.3, ba1: -0.3, ba2: 0.6, pw: 1 },
    point: { t: 0.02, hd: 0.06, fa1: 1.55, fa2: 1.57, ba1: -0.3, ba2: 0.6, fl1: 0.2, fl2: 0.05, bl1: -0.18, bl2: -0.05, pw: 1 },
    command: { t: 0.04, hd: 0.15, fa1: 1.45, fa2: 1.05, ba1: -0.3, ba2: 0.6, pw: 1 },
    raise1: { t: -0.08, hd: -0.12, fa1: 2.5, fa2: 2.95, ba1: -0.2, ba2: 0.4, fl1: 0.12, fl2: 0.03, bl1: -0.12, bl2: -0.03, pw: 0 },
    palm_w: { t: -0.1, fa1: 0.7, fa2: 2.6, ba1: -0.4, ba2: 0.4 },
    palm: { t: 0.18, hd: 0.05, fa1: 1.52, fa2: 1.55, ba1: -0.5, ba2: 0.2, fl1: 0.4, fl2: 0.12, bl1: -0.35, bl2: -0.15 },
    clench_w: { t: -0.05, fa1: 1.2, fa2: 2.6, ba1: -0.3, ba2: 0.5, pw: 0 },
    clench: { t: 0.08, hd: 0.08, fa1: 1.45, fa2: 2.2, ba1: -0.3, ba2: 0.5, pw: 0 },
    float: { ground: 0, hipH: 100, t: -0.06, hd: 0.06, fa1: 0.55, fa2: 0.6, ba1: -0.55, ba2: -0.5, fl1: 0.12, fl2: 0.02, bl1: -0.1, bl2: 0 },
    floatB: { ground: 0, hipH: 100, t: -0.25, hd: 0.1, fa1: 1.2, fa2: 1.4, ba1: -0.2, ba2: 0.2, fl1: 0.4, fl2: 0.1, bl1: 0.1, bl2: -0.1 },
    mark: { t: -0.04, hd: 0.0, fa1: 1.0, fa2: 2.85, ba1: -0.3, ba2: 0.6, pw: 1 },
    dominate: { t: -0.06, hd: -0.18, fa1: 0.95, fa2: 0.95, ba1: -0.95, ba2: -0.95, fl1: 0.2, fl2: 0.05, bl1: -0.2, bl2: -0.05 },
  },
  intro: 'Kneel. I will not ask twice.',
  wins: ['That was an order. You followed it well.', 'Good. Now stay down.', 'You were never in control. Not for a moment.'],
  ropes: [
    { id: 'braid', at: (sk, r) => headPt(sk, -r * 1.02, r * 0.3), n: 9, seg: 9, w0: 9, w1: 5, color: 'hair', grav: 0.6, wind: 0.3 },
  ],
  hairBack(g, r, c, R) {
    polyR(g, r, [[0.7, -0.82], [0.1, -1.2], [-0.7, -1.06], [-1.2, -0.5], [-1.3, 0.3], [-1.12, 0.9], [-0.7, 0.8], [-0.4, 0.6]], c.hair, R);
    if (!R.mono) { g.fillStyle = c.hair2; g.beginPath(); g.ellipse(-1.02 * r, 0.32 * r, 0.16 * r, 0.12 * r, 0, 0, TAU); g.fill(); }   // braid tie
  },
  hairFront(g, r, c, R, o) {
    // hair covering the back of the head down to the nape
    polyR(g, r, [[-0.3, -0.98], [-0.86, -0.72], [-1.06, -0.2], [-1.04, 0.42], [-0.84, 0.74], [-0.5, 0.62], [-0.36, 0.1], [-0.2, -0.4]], c.hair, R);
    // long side lock framing the face
    polyR(g, r, [[-0.1, -0.3], [0.04, 0.5], [0.0, 1.35], [-0.16, 1.75], [-0.3, 1.2], [-0.46, 0.3]], c.hair, R);
    // side-swept bangs, parted off-centre
    polyR(g, r, [[-0.34, -0.96], [0.32, -1.04], [0.98, -0.74], [1.16, -0.22], [1.04, 0.06], [0.94, -0.18], [0.82, 0.12], [0.7, -0.24], [0.5, -0.02], [0.4, -0.42], [0.12, -0.56]], c.hair, R);
    if (!R.mono) {
      g.strokeStyle = c.hair2; g.lineWidth = 0.05 * r; g.lineCap = 'round';
      for (const [x0, y0, x1, y1] of [[0.3, -0.96, 0.62, -0.2], [0.6, -0.86, 0.9, -0.24]]) { g.beginPath(); g.moveTo(x0 * r, y0 * r); g.quadraticCurveTo((x0 + 0.1) * r, (y0 + 0.4) * r, x1 * r, y1 * r); g.stroke(); }
      shine(g, r, [[-0.2, -0.86], [0.42, -0.88]], R);
      // a single small gold earring (minimalist)
      g.fillStyle = c.gold; g.beginPath(); g.arc(-0.12 * r, 0.42 * r, 0.05 * r, 0, TAU); g.fill();
    }
  },
  neckWear(g, sk, p, c, R) {
    highCollar(g, sk, c, R);
    if (R.mono) return;
    const n = sk.neck;   // black tie
    g.fillStyle = c.tie; g.strokeStyle = OUTLINE; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(n[0] + 1, n[1] + 4); g.lineTo(n[0] + 7, n[1] + 4); g.lineTo(n[0] + 6, n[1] + 8); g.lineTo(n[0] + 2, n[1] + 8); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(n[0] + 2, n[1] + 8); g.lineTo(n[0] + 6, n[1] + 8); g.lineTo(n[0] + 8, n[1] + 30); g.lineTo(n[0] + 4, n[1] + 35); g.lineTo(n[0] + 0.5, n[1] + 30); g.closePath(); g.fill(); g.stroke();
  },
  torsoDetail(g, L, bw, c) {
    g.fillStyle = 'rgba(0,0,0,0.06)'; g.fillRect(-14 * bw, -L * 0.45, 28 * bw, L * 0.45);
    g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1; g.beginPath(); g.moveTo(7 * bw, -L - 2); g.lineTo(7 * bw, 0); g.stroke();
    g.fillStyle = '#d8d4ce'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(8.5 * bw, -L * (0.3 - i * 0.1), 1.2, 0, TAU); g.fill(); }
  },
  torsoOver(g, L, bw, c, R) { if (R.mono) return; g.fillStyle = c.gold; g.fillRect(4 * bw, -6, 5, 6); },
  weaponBack(g, sk, p, c, R, o) { reikaCoat(g, sk, c, R, o); },
  weaponFront(g, sk, p, c, R) { reikaFingers(g, sk, p, c, R); },
};
makeChibi(REIKA, { build: { arm: 0.98, leg: 1.0, torso: 1.02 }, colors: {} });
REIKA.faceFn = reikaFace;

// ---------------------------------- authority systems ----------------------------------
const REIKA_PALS = [0, 0.5].map(k => reikaPal(REIKA.colors, k, false)), REIKA_PAL_D = reikaPal(REIKA.colors, 1, true);
REIKA.palette = F => F.domT > 0 ? REIKA_PAL_D : REIKA_PALS[(F.auth || 0) >= 50 ? 1 : 0];
const reikaLvl = F => F.domT > 0 ? 2 : (F.auth || 0) >= 50 ? 1 : 0;
function reikaAuth(F, n) { if (F.ko || F.domT > 0) return; F.auth = clamp((F.auth || 0) + n, 0, 100); if (n > 0) F.authT = F.T; }
function reikaDominance(F, dur) {
  F.domT = F.domMax = dur; F.auth = 100;
  FX.ring(F.x, F.y - 110, '#ff1f3d', 20, 320, 26, 6); FX.ring(F.x, F.y - 110, '#e6c040', 10, 160, 18, 3); FX.flashScreen('#3a0010', 14, 0.5);
  FX.wtext(F.x, F.y - 250, 'DOMINANCE', { size: 40, color: '#ffffff', stroke: '#8a0018', life: 60 });
  Sound.play('psi'); Sound.play('heart');
}
function reikaConsumeMark(A, D) {   // Bloodline Mark detonates on her next control/special hit
  if (!(D.markT > 0) || D.markBy !== A || D.ko) return;
  D.markT = 0; D.hp = Math.max(BT.practice ? 1 : 0, D.hp - 36 * A.dmgMult); A.stats.dmg += 36; D.hitstun += 12; reikaAuth(A, 8);
  FX.ring(D.x, D.y - 100, '#ff1f3d', 10, 150, 16, 6); FX.wtext(D.x, D.y - 240, 'MARK BURST', { size: 28, color: '#ffffff', stroke: '#a00018', life: 40 });
  for (let i = 0; i < 14; i++) FX.p({ type: 'blood', x: D.x + rand(-14, 14), y: D.y - rand(80, 140), vx: rand(-4, 4), vy: -rand(2, 6), grav: 0.45, life: 40, size: rand(2, 3.6), color: pick(['#b3122e', '#e0203e']), add: false });
  Sound.play('crush');
}
REIKA.initFighter = F => { F.auth = 0; F.authT = -999; F.domT = 0; F.domMax = 1; F.lastHp = F.hp; F.cmDir = 1; };
REIKA.dmgBonus = F => (F.domT > 0 ? 1.1 : 1) * (F.opp && F.opp.markT > 0 && F.opp.markBy === F ? 1.15 : 1);
REIKA.onDealDamage = (A, D) => { if (!A.ko) reikaAuth(A, A.state === 'cine' ? 1 : 7); };
REIKA.tick = F => {
  const O = F.opp; if (!O) return;
  const live = BT && BT.phase === 'fight' && !F.ko;
  if (F.hp < F.lastHp - 0.5 && F.state !== 'cine') reikaAuth(F, -6);   // pressure breaks her composure
  F.lastHp = F.hp;
  if (F.state === 'attack' && F.prevKey === 'sp2' && F.moveKey !== 'sp2' && F.move && !F.move.special) F.performed.add('glideCancel');
  F.prevKey = F.state === 'attack' ? F.moveKey : null;
  if (F.domT > 0) {
    F.domT--; F.auth = 100 * F.domT / F.domMax;
    for (const k of ['sp1', 'sp1f', 'counter']) if (F.cd[k] > 0 && F.T % 2 === 0) F.cd[k]--;   // control cooldowns ×0.67
    if (F.T % 4 === 0) FX.p({ type: 'ember', x: F.x + rand(-40, 40), y: F.y - rand(10, 170), vx: rand(-0.3, 0.3), vy: -rand(0.5, 1.5), life: 30, size: rand(1.5, 3), color: pick(['#ff1f3d', '#8a0018']) });
  } else if (live) {
    if (F.T - F.authT > 240 && F.auth > 0 && F.state !== 'cine') F.auth = Math.max(0, F.auth - 0.1);
    if (F.auth >= 100) reikaDominance(F, REIKA_DOM_T);
  }
  // Command keeps the victim kneeling while the bind lasts
  if (O.cmdT > 0) { O.cmdT--; if (O.state !== 'hit' || O.cmdT === 0) { if (O.forcePose === 'kneel' && !(BT && BT.cine)) O.forcePose = null; O.cmdT = 0; } }
  if (O.markT > 0 && O.markBy === F) {
    O.markT--;
    if (F.T % 6 === 0 && !O.hidden) FX.p({ type: 'ember', x: O.x + rand(-20, 20), y: O.y - rand(60, 150) * O.s, vx: 0, vy: -0.8, life: 18, size: 2, color: '#ff1f3d' });
  }
};
REIKA.drawExtra = (g, F) => {
  if (F.ko) return;
  const O = F.opp;
  if (O && O.markT > 0 && O.markBy === F && !O.hidden) {   // the mark: a red sigil hovering over the victim
    const x = O.x, y = O.y - 205 * O.s, a = F.T * 0.05;
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = '#ff1f3d'; g.lineWidth = 2; g.globalAlpha = 0.6 + 0.3 * Math.sin(F.T * 0.2);
    g.beginPath(); g.arc(x, y, 13, 0, TAU); g.stroke(); g.beginPath();
    for (let i = 0; i < 3; i++) { const b = a + i * TAU / 3; g.moveTo(x + Math.cos(b) * 13, y + Math.sin(b) * 13); g.lineTo(x + Math.cos(b + 2.4) * 13, y + Math.sin(b + 2.4) * 13); }
    g.stroke(); g.restore();
  }
  if (F.domT > 0 && FX.hq) {   // subtle red aura while dominant
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.14 + 0.06 * Math.sin(F.T * 0.12);
    const y = F.y - 95, gr = g.createRadialGradient(F.x, y, 20, F.x, y, 135); gr.addColorStop(0, 'rgba(255,31,61,0)'); gr.addColorStop(0.6, '#c41e36'); gr.addColorStop(1, 'rgba(196,30,54,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(F.x, y, 110, 135, 0, 0, TAU); g.fill(); g.restore();
  }
  if (F.state === 'attack' && F.moveKey === 'ult' && F.mf > F.move.st && F.mf <= F.move.st + F.move.act + 4) {   // the ult's seizing ripple
    const k = (F.mf - F.move.st) / F.move.act, x = F.x + F.facing * (40 + 360 * Math.min(1, k)), y = F.y - 100;
    psiRipple(g, x, y, 60, '#ff1f3d', 0.7, F.T);
  }
};
function psiRipple(g, x, y, r, col, a, t) {   // "invisible" force: refraction-like ripples
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const rr = r * (0.45 + 0.28 * i + 0.08 * Math.sin(t * 0.4 + i));
    g.globalAlpha = a * (0.55 - i * 0.14); g.strokeStyle = i === 1 ? col : '#ffffff'; g.lineWidth = 3 - i * 0.6;
    g.beginPath(); g.ellipse(x, y, rr * 0.55, rr, 0, 0, TAU); g.stroke();
  }
  g.globalAlpha = a * 0.12; g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x, y, r * 0.5, r * 0.9, 0, 0, TAU); g.fill();
  g.restore();
}
REIKA.introFx = F => {
  FX.ring(F.x, F.y - 110, '#c41e36', 10, 260, 30, 3); FX.ring(F.x, F.y - 110, '#e6c040', 10, 140, 24, 2); FX.darkTarget = 0;
  for (let i = 0; i < 16; i++) FX.p({ type: 'ember', x: F.x + rand(-60, 60), y: F.y - rand(20, 200), vx: 0, vy: -rand(0.3, 1), life: 50, size: rand(1.5, 2.5), color: '#ff1f3d' });
  Sound.play('psi');
};

// ---------------------------------- projectiles ----------------------------------
EXTRA_PROJ.psiWave = {
  update(p) { if (p.t % 3 === 0) FX.p({ type: 'smoke', x: p.x - p.vx * 2, y: p.y + rand(-30, 30), vx: 0, vy: 0, life: 14, size: rand(8, 14), grow: 0.6, color: 'rgba(255,255,255,0.08)', add: true }); },
  draw(g, p) { psiRipple(g, p.x, p.y, p.h * 0.62, p.color, Math.min(1, p.life / 6), p.t); },
};
EXTRA_PROJ.command = {
  rect: p => ({ x: p.x - p.w / 2, y: GROUND - p.h, w: p.w, h: p.h }),
  delay(p) { if (p.t % 4 === 0) FX.p({ type: 'ember', x: p.x + rand(-26, 26), y: GROUND - rand(0, 10), vx: 0, vy: -rand(1, 3), life: 16, size: 2, color: '#ff1f3d' }); },
  update(p) { if (!p.fired) { p.fired = true; Sound.play('psi'); FX.ring(p.x, GROUND - 90, '#ff1f3d', 10, 90, 12, 4); } },
  draw(g, p) {
    const k = p.delay > 0 ? 1 - p.delay / p.delay0 : 1, a = p.delay > 0 ? 0.5 + 0.5 * Math.sin(p.t * 0.9) : Math.min(1, p.life / 4);
    g.globalAlpha = a; g.strokeStyle = '#ff1f3d'; g.lineWidth = 2.5;
    g.beginPath(); g.ellipse(p.x, GROUND, 18 + 30 * k, 5 + 6 * k, 0, 0, TAU); g.stroke();
    g.beginPath(); g.ellipse(p.x, GROUND, 8 + 18 * k, 2 + 4 * k, 0, 0, TAU); g.stroke();
    if (p.delay <= 0) { g.globalCompositeOperation = 'lighter'; const gr = g.createLinearGradient(0, GROUND - p.h, 0, GROUND); gr.addColorStop(0, 'rgba(255,31,61,0)'); gr.addColorStop(1, 'rgba(255,31,61,0.45)'); g.fillStyle = gr; g.fillRect(p.x - p.w / 2, GROUND - p.h, p.w, p.h); }
  },
};
EXTRA_PROJ.crush = {
  rect: p => ({ x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h }),
  delay(p) {
    const D = p.owner.opp; if (D && p.track) { p.x = lerp(p.x, D.x, 0.25); p.y = lerp(p.y, D.y - 100 * D.s, 0.25); }
    if (p.t % 3 === 0) FX.p({ type: 'shard', x: p.x + rand(-70, 70), y: GROUND, vx: rand(-1, 1), vy: -rand(1, 4), life: 22, size: rand(2, 4), color: '#6a5a5a', add: false, grav: 0.3 });
  },
  update(p) {
    if (p.t % 5 === 1) { Sound.play('crush'); FX.shakeIt(5); FX.ring(p.x, p.y, '#ff1f3d', p.w * 0.9, 20, 10, 4); FX.ring(p.x, GROUND, '#8a0018', 20, 130, 14, 4, 0.25); }
  },
  draw(g, p) {
    const k = p.delay > 0 ? 1 - p.delay / p.delay0 : 1, r = lerp(150, 70, k) * (p.delay > 0 ? 1 : 0.85 + 0.15 * Math.sin(p.t * 1.6));
    g.globalAlpha = p.delay > 0 ? 0.4 + 0.4 * k : Math.min(1, p.life / 5);
    psiRipple(g, p.x, p.y, r, '#ff1f3d', 1, p.t);
    g.globalCompositeOperation = 'source-over'; g.strokeStyle = 'rgba(20,0,6,0.5)'; g.lineWidth = 2;
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + p.t * 0.05; g.beginPath(); g.moveTo(p.x + Math.cos(a) * r * 0.6, p.y + Math.sin(a) * r); g.lineTo(p.x + Math.cos(a) * r * 0.3, p.y + Math.sin(a) * r * 0.5); g.stroke(); }
  },
};
EXTRA_PROJ.markBolt = {
  update(p) { if (p.t % 2 === 0) FX.p({ type: 'ember', x: p.x, y: p.y + rand(-6, 6), vx: -p.vx * 0.1, vy: 0, life: 14, size: 2.2, color: '#ff1f3d' }); },
  draw(g, p) {
    g.globalCompositeOperation = 'lighter'; g.translate(p.x, p.y); g.rotate(p.t * 0.15);
    g.strokeStyle = '#ff1f3d'; g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, 14, 0, TAU); g.stroke();
    g.beginPath(); for (let i = 0; i < 3; i++) { const b = i * TAU / 3; g.moveTo(Math.cos(b) * 14, Math.sin(b) * 14); g.lineTo(Math.cos(b + 2.4) * 14, Math.sin(b + 2.4) * 14); } g.stroke();
    g.fillStyle = 'rgba(255,60,80,0.35)'; g.beginPath(); g.arc(0, 0, 9, 0, TAU); g.fill();
  },
};

// ---------------------------------- moves ----------------------------------
const reikaTarget = (F, O, max) => { const d = O.x - F.x; return Math.abs(d) <= max ? O.x : F.x + F.facing * max; };
REIKA.moves = Object.assign(baseNormals({ dmg: 0.9, spd: 1, rng: 1.05 }), {
  sp1: {
    name: 'INVISIBLE FORCE', jp: '不可視の力', desc: 'A flick of two fingers sends an unseen force across mid range. Strong knockback. Fires a second wave in Dominance.', special: 1, lvl: 4,
    poses: ['point_w', 'point'], st: 13, act: 1, rec: 22, cd: 45, sfx: 'psi',
    spawn: { f: 13, fn(F) {
      const lv = reikaLvl(F), mk = (dx, dmg) => BT.spawn({ owner: F, kind: 'psiWave', x: F.x + F.facing * dx, y: F.y - 110, vx: F.facing * 11, w: 60, h: 100, life: 30, dmg, hs: 22, bs: 13, kb: lv >= 1 ? 13 : 11, str: 2, color: '#ff1f3d', srcKey: 'sp1', projOnHit: 1,
        onHit(A, D) { FX.ring(D.x, D.y - 100, '#ffffff', 10, 110, 12, 4); FX.ring(D.x, D.y - 100, '#ff1f3d', 20, 70, 10, 3); reikaConsumeMark(A, D); } });
      mk(55, 58);
      if (lv >= 2) F.wave2 = F.T + 8;
    } },
    tick(F, f) { if (F.wave2 && F.T === F.wave2) { F.wave2 = 0; BT.spawn({ owner: F, kind: 'psiWave', x: F.x + F.facing * 55, y: F.y - 60, vx: F.facing * 12, w: 50, h: 80, life: 28, dmg: 28, hs: 18, bs: 10, kb: 8, str: 1, color: '#ff1f3d', srcKey: 'sp1' }); } },
  },
  sp1f: {
    name: 'COMMAND', jp: '命令', desc: '"Kneel." A binding order lands where the opponent stands after a short, visible delay: they drop to one knee (stun) and move at half speed for 1.5 s. Blockable, dodgeable, interrupts attacks.', special: 1, lvl: 4,
    poses: ['point_w', 'command'], st: 12, act: 1, rec: 24, cd: 160, sfx: 'psi',
    spawn: { f: 12, fn(F, O) {
      const lv = reikaLvl(F), x = reikaTarget(F, O, 470);
      BT.spawn({ owner: F, kind: 'command', x, y: GROUND - 80, vx: F.facing * 0.001, w: 56, h: 150, delay: 12, delay0: 12, life: 5, dmg: 18, hs: 34 + lv * 10, bs: 12, kb: 0, str: 2, clash: 0, color: '#ff1f3d', srcKey: 'sp1f', projOnHit: 1,
        onHit(A, D) {
          D.forcePose = 'kneel'; D.cmdT = 34 + lv * 10; D.slowT = 90 + lv * 30; D.vx = 0; reikaAuth(A, 6); reikaConsumeMark(A, D);
          FX.wtext(D.x, D.y - 230, lv >= 2 ? '— 跪け —' : 'KNEEL.', { size: 30, font: lv >= 2 ? FX_JP() : FONT_T, color: '#ffffff', stroke: '#8a0018', life: 40 });
        } });
    } },
  },
  counter: {
    name: 'CRUSHING PRESSURE', jp: '圧殺', desc: 'Wraps the opponent in a sphere of force that tightens, crushes them three times and slams them down (knockdown). Long cooldown — and it can be outrun during the build-up.', special: 1, lvl: 4,
    poses: ['clench_w', 'clench'], st: 12, act: 1, rec: 26, cd: 210, sfx: 'crush',
    spawn: { f: 12, fn(F, O) {
      const lv = reikaLvl(F), x = reikaTarget(F, O, 420);
      BT.spawn({ owner: F, kind: 'crush', x, y: (Math.abs(O.x - x) < 5 ? O.y - 100 * O.s : GROUND - 100), vx: F.facing * 0.001, w: 96, h: 150, delay: 10, delay0: 10, life: 22, hits: lv >= 1 ? 4 : 3, interval: 5, persist: 1, track: Math.abs(O.x - x) < 5,
        dmg: 22, hs: 20, bs: 10, kb: 0.5, str: 2, clash: 0, color: '#ff1f3d', srcKey: 'counter', projOnHit: 1,
        final: { dmg: 44, kd: 1, hs: 30, str: 3, spike: 1, kb: 2, shake: 9 },
        onHit(A, D) { D.vx *= 0.3; if (this.hits <= 1) { reikaAuth(A, 6); reikaConsumeMark(A, D); FX.dust(D.x, GROUND, 10); FX.rocks(D.x, GROUND, 6, '#5a4a4a'); } } });
    } },
  },
  sp2: {
    name: 'CONTROLLED MOVEMENT', jp: '支配移動', desc: 'Glides on her own force: toward the opponent (stops just short), or away when holding ←. Works in the air; cancel into L / M / H at the end.', special: 1, lvl: 4, air: 'both',
    poseFn: F => F.cmDir < 0 ? 'floatB' : 'float', st: 3, act: 14, rec: 8, cd: 50, sfx: 'psi',
    onStart(F) { F.cmDir = F.input.fwd < 0 ? -1 : 1; if (F.cmDir < 0) F.invuln = Math.max(F.invuln, 6); },
    tick(F, f, O) {
      if (f >= 2 && f <= 16) {
        const near = Math.abs(O.x - F.x) < 105 && F.cmDir > 0;
        F.vx = near ? 0 : F.facing * F.cmDir * 14; F.ctrlVel = true; if (!F.onGround) F.vy = Math.min(F.vy, 0) * 0.3;
        F.afterimage = Math.max(F.afterimage, 3);
        if (f % 3 === 0) psiTrail(F);
      }
    },
  },
  sp2f: {
    name: 'BLOODLINE MARK', jp: '血統の印', desc: 'Brands the opponent with a red sigil (slow projectile, long range). For 6 s her attacks deal +15% to them, and her next Force / Command / Crush detonates the mark for bonus damage and stun.', special: 1, lvl: 4,
    poses: ['mark', 'point'], st: 14, act: 1, rec: 20, cd: 300, sfx: 'psi',
    spawn: { f: 14, fn(F) {
      BT.spawn({ owner: F, kind: 'markBolt', x: F.x + F.facing * 50, y: F.y - 120, vx: F.facing * 8.5, w: 34, h: 34, life: 56, dmg: 16, hs: 16, bs: 10, kb: 2, str: 1, color: '#ff1f3d', srcKey: 'sp2f', projOnHit: 1,
        onHit(A, D) { D.markT = REIKA_MARK_T; D.markBy = A; reikaAuth(A, 5); FX.wtext(D.x, D.y - 230, 'MARKED', { size: 24, color: '#ffffff', stroke: '#a00018', life: 36 }); } });
    } },
  },
  sp2d: {
    name: 'ABSOLUTE AUTHORITY', jp: '絶対権威', desc: 'Needs 40+ AUTHORITY and spends it: enters DOMINANCE at once (longer the more she had). +10% damage, faster control cooldowns, stronger Force / Command / Crush.', special: 1, lvl: 4,
    poses: ['dominate', 'dominate'], st: 8, act: 1, rec: 16, cd: 60, invuln: [0, 14], req: F => (F.auth || 0) >= 40 && !(F.domT > 0), sfx: 'psi',
    onStart(F) { reikaDominance(F, Math.round(180 + (F.auth || 0) * 3)); },
  },
  ult: {
    name: 'ABSOLUTE CONTROL', jp: '絶対支配', desc: 'Ultimate. She raises one hand and a seizing ripple crosses mid range; on hit the world goes dark, the victim is lifted, struck again and again by nothing at all — then crushed into the floor.', ult: 1, lvl: 6, cost: 100,
    poses: ['raise1', 'point'], st: 12, act: 12, rec: 30, dmg: 20, hs: 40, bs: 20, kb: 2, hb: { x: 20, y: -200, w: 380, h: 200 }, invuln: [0, 14], str: 3,
    onHit(F, D) { BT.startCine(F, D, CINE.reika, { zoom: 1.2 }); return true; },
  },
});
function psiTrail(F) { FX.p({ type: 'smoke', x: F.x + rand(-14, 14), y: F.y - rand(40, 160), vx: -F.vx * 0.1, vy: 0, life: 18, size: rand(10, 16), grow: 0.5, color: 'rgba(196,30,54,0.25)', add: true }); }
(() => {
  const M = REIKA.moves;
  Object.assign(M.L, { name: 'Backhand', poses: ['palm_w', { base: 'palm', fa2: 1.3 }] });
  Object.assign(M.M, { name: 'Heel Kick' });
  Object.assign(M.H, { name: 'FORCE PALM', poses: ['palm_w', 'palm'], st: 16, dmg: 84, kb: 9, hb: { x: 20, y: -175, w: 140, h: 70 }, str: 3,
    onHit(A, D) { FX.ring(D.x, D.y - 110, '#ffffff', 10, 80, 10, 3); } });
  Object.assign(M.cH, { name: 'Low Sweep' });
  Object.assign(M.LH, { name: 'Lift', poses: ['palm_w', 'raise1'], hb: { x: 10, y: -215, w: 110, h: 130 } });
  Object.assign(M.FF, { name: 'Gliding Strike', poses: ['float', 'palm'] });
  Object.assign(M.jH, { name: 'Downward Force', poses: ['jheavy_w', { base: 'jump', fa1: 1.2, fa2: 0.6, pw: 1 }], hb: { x: 0, y: -100, w: 100, h: 110 } });
  // CONTROLLED MOVEMENT cancels into normals at the end of the glide
  for (const [btn, gk, ak] of [['light', 'L', 'jL'], ['medium', 'M', 'jM'], ['heavy', 'H', 'jH']]) {
    addFollowup(REIKA, 'sp2', { btn, move: gk, any: true, cond: F => F.onGround && F.mf >= 10 });
    addFollowup(REIKA, 'sp2', { btn, move: ak, any: true, cond: F => !F.onGround && F.mf >= 8 });
  }
})();
REIKA.extraList = [['glideCancel', 'Controlled Movement → any normal', 'SP2 → L / M / H']];
REIKA.moves.glideCancel = { name: 'GLIDE CANCEL', jp: '移動断ち', virtual: 1, lvl: 0, st: 0, act: 0, rec: 0 };
REIKA.combos = [
  { name: 'Order of Operations', notation: 'M → H (Force Palm) → SP1 (Invisible Force)', seq: ['M', 'H', 'sp1'] },
  { name: 'Kneel', notation: 'L → M → ↓→SP1 (Command) → H → ↓←SP1 (Crushing Pressure)', seq: ['L', 'M', 'sp1f', 'H', 'counter'] },
  { name: 'Branded', notation: '↓→SP2 (Bloodline Mark) → M → H → SP1 (Invisible Force: mark burst)', seq: ['M', 'H', 'sp1'], pre: ['sp2f'], range: 380 },
  { name: 'Approach Denied', notation: 'SP2 (Controlled Movement) → M → H → ↓←SP1 (Crushing Pressure)', seq: ['M', 'H', 'counter'], pre: ['sp2'], range: 300 },
  { name: 'Absolute Control', notation: 'M → H → SP1+SP2 (Ultimate)', seq: ['M', 'H', 'ult'], meter: 1 },
];
REIKA.applyTrial = (A, tr) => { if (!tr) return; if (tr.meter) A.meter = 100; if (tr.authority) { A.auth = tr.authority; A.authT = A.T + 9999; } };

// ---------------------------------- cinematic ----------------------------------
CINE.reika = function (A, D, f, c) {
  const dir = A.facing, red = '#ff1f3d';
  if (f === 1) {
    D.x = clamp(D.x, 90, STAGE_W - 90); D.y = GROUND; D.forcePose = 'hit'; A.forcePose = 'raise1'; c.zoom = 1.15; c.camX = (A.x + D.x) / 2;
    FX.darkTarget = 0.95; Sound.play('psi'); Sound.play('heart'); c.aura = 0; c.ax = A.x; c.dy = 0; c.fg = REIKA.cineFg;
    FX.wtext(A.x, GROUND - 270, '— 跪け —', { size: 34, font: FX_JP(), color: '#ffd0d8', stroke: '#3a0010', life: 70 });
  }
  c.aura = Math.min(1, f / 40);
  if (f === 20) Sound.play('heart');
  if (f >= 24 && f <= 52) { const t = (f - 24) / 28; D.y = GROUND - 160 * easeOut(t); D.forcePose = 'airhit'; D.x += Math.sin(f * 1.7) * 1.2; }
  if (f >= 58 && f <= 98 && f % 8 === 2) {   // struck by nothing at all
    const ch = D.chestW(), ox = rand(-40, 40), oy = rand(-50, 50);
    BT.scriptHit(A, D, 16, { str: 3, sfx: 'crush' }); D.forcePose = (f >> 3) % 2 ? 'airhit' : 'hit2'; D.x += rand(-6, 6);
    FX.ring(ch[0] + ox, ch[1] + oy, '#ffffff', 50, 6, 10, 4); FX.ring(ch[0] + ox, ch[1] + oy, red, 10, 90, 12, 3); FX.shakeIt(9);
    A.forcePose = (f >> 3) % 2 ? 'point' : 'raise1';
  }
  if (f === 104) { A.forcePose = 'clench_w'; Sound.play('charge'); c.squeeze = 0; }
  if (f > 104 && f < 122) { c.squeeze = (f - 104) / 18; if (f % 3 === 0) { const ch = D.chestW(); FX.ring(ch[0], ch[1], red, 150 * (1 - c.squeeze) + 30, 20, 6, 3); } }
  if (f === 112) BT.scriptHit(A, D, 26, { str: 3, sfx: 'crush' });
  if (f === 122) {   // crushed into the floor
    A.forcePose = 'clench'; D.y = GROUND; D.forcePose = 'down';
    BT.scriptHit(A, D, 125, { str: 4 });
    FX.impactFrame(5); FX.shakeIt(28); Sound.play('explosion'); Sound.play('crush'); FX.flashScreen(red, 14, 0.6);
    FX.ring(D.x, GROUND, red, 20, 360, 24, 10, 0.25); FX.ring(D.x, GROUND, '#ffffff', 10, 240, 18, 5, 0.25); FX.rocks(D.x, GROUND, 24, '#4a3a3a'); FX.dust(D.x, GROUND, 20);
    for (let i = 0; i < 40; i++) FX.p({ type: 'blood', x: D.x + rand(-30, 30), y: GROUND - rand(10, 60), vx: rand(-9, 9), vy: -rand(2, 10), grav: 0.5, life: 60, size: rand(2.2, 4.4), color: pick(['#b3122e', '#e0203e', '#6a0a1c']), add: false });
    FX.wtext(D.x, GROUND - 260, '絶対支配!!', { size: 86, font: FX_JP(), color: '#fff', stroke: '#a00018', life: 60, vy: -0.3 });
    reikaAuth(A, 20); c.aura = 0;
  }
  if (f === 140) { BT.release(D, dir * 3, -6); FX.darkTarget = 0; return true; }
};
// the red aura spreading across the battlefield (screen space, drawn over the darkened world)
REIKA.cineFg = (g, c) => {
  if (!c.aura) return;
  const [sx, sy] = BT.cam.toScreen(c.A.x, c.A.y - 110), k = c.aura, R = 80 + 1400 * easeOut(k);
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(sx, sy, R * 0.15, sx, sy, R); gr.addColorStop(0, 'rgba(255,31,61,0)'); gr.addColorStop(0.7, `rgba(196,20,50,${0.22 * k})`); gr.addColorStop(1, 'rgba(120,0,20,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = `rgba(255,40,70,${0.35 * k})`; g.lineWidth = 2;
  for (let i = 0; i < 3; i++) { const rr = ((BT.pf * 4 + i * 260) % 900) + 40; g.beginPath(); g.ellipse(sx, sy + 60, rr, rr * 0.28, 0, 0, TAU); g.stroke(); }
  g.restore();
};

// ---------------------------------- HUD + how-to ----------------------------------
REIKA.drawHand = (g, F, side, t) => {
  const dom = F.domT > 0, lv = reikaLvl(F), O = F.opp, marked = O && O.markT > 0 && O.markBy === F;
  xpPanel(g, F, side, t, {
    col: dom ? '#ff1f3d' : lv ? '#e0405a' : '#c8a040', col2: '#ffd84a', icon: '支', flash: dom,
    title: dom ? 'DOMINANCE' : lv ? 'AUTHORITY · COMMANDING' : 'AUTHORITY',
    sub: dom ? '支配 · DMG+10% · FAST CONTROL · STRONGER ORDERS' : marked ? `血統の印 · MARK ${(O.markT / 60).toFixed(1)}s · DMG+15%` : '権威 · hits & control fill it, getting hit drains it',
    k: (F.auth || 0) / 100, label: dom ? `${(F.domT / 60).toFixed(1)}s` : `${Math.floor(F.auth || 0)}%`, marks: [0.4, 0.5],
    badges: [['sp1', 'S1|FORCE'], ['sp1f', '↓→S1|COMMAND'], ['counter', '↓←S1|CRUSH'], ['sp2', 'S2|GLIDE'], ['sp2f', '↓→S2|MARK'], ['sp2d', '↓↓S2|AUTHORITY']],
  });
};
REIKA.howTo = {
  title: 'CONTROL DEVIL',
  draw(g) {
    xpHowTo(g, 'REIKA — THE CONTROL DEVIL', '#e0405a', [
      ['AUTHORITY', 'Fills with every hit (+7) and successful control (+6). Getting hit drains it (−6). 50%+ = stronger orders.'],
      ['DOMINANCE', 'Full Authority = 7 s: +10% damage, faster control cooldowns, double Invisible Force, longer Command, 4-hit Crush.'],
      ['SP1', 'Invisible Force — mid-range force wave with strong knockback.'],
      ['↓→ SP1', 'Command — delayed bind where the foe stands: kneel-stun + half speed. Block it, dash out or jump.'],
      ['↓← SP1', 'Crushing Pressure — a force sphere builds, crushes 3× and slams them down. Outrun it while it forms.'],
      ['SP2', 'Controlled Movement — glide toward them (hold ← to glide away). Cancel into L / M / H.'],
      ['↓→ SP2', 'Bloodline Mark — 6 s debuff: +15% damage taken; her next Force / Command / Crush bursts it.'],
      ['↓↓ SP2', 'Absolute Authority — needs 40+ Authority: spend it to enter Dominance immediately.'],
    ], 'Keep them at the end of your fingertips: Invisible Force and Force Palm (H) control mid range, Command punishes anyone who walks or attacks predictably, Crushing Pressure ends the combo. Up close she is fragile — glide away with SP2 ←. Ultimate (SP1+SP2): ABSOLUTE CONTROL.');
  },
};

CHARS.push(REIKA);
finalizeMoves(REIKA);
