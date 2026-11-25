// ============================ BUZZU — THE CHAINSAW BEAST ============================
// Rushdown / aggressive / transformation. A tiny, adorable orange devil-dog with a chainsaw growing out of
// its forehead and a pull-cord tail. Cute when idle, terrifying when it revs. Built on the chibi kit.
// Systems: ENGINE HEAT (hits heat the engine → faster & stronger, 100 = OVERHEAT) · ENGINE OVERDRIVE (speed buff) ·
//          FULL DEVIL MODE (spends heat: extra blades, stronger, new L/M/H) · Blood Consumption (limited heal).
const BUZZU_OVERHEAT_T = 300, BUZZU_OD_T = 300;

// ---------------------------------- art ----------------------------------
function buzzuPal(base, heat, devil) {
  const p = { ...base, heatK: heat, devil: !!devil };
  if (devil) Object.assign(p, { skin: '#e2501a', top: '#e2501a', leg: '#e2501a', uarm: '#e2501a', farm: '#e2501a', belly: '#ff8a4a', accent: '#ff2a1a', eye2: '#ff2a1a' });
  else if (heat > 0.7) Object.assign(p, { skin: '#ff6a18', top: '#ff6a18', leg: '#ff6a18', uarm: '#ff6a18', farm: '#ff6a18', accent: '#ff5a1a' });
  return p;
}
function buzzuFace(g, r, c, o) {
  const e = o.expr || 'normal', T = o.T || 0, mean = e === 'shout' || c.devil;
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  g.fillStyle = c.skin; g.beginPath(); g.ellipse(-0.14 * r, 0.14 * r, 0.24 * r, 0.32 * r, 0.2, 0, TAU); g.fill();   // no human ear
  // muzzle patch + blush
  g.fillStyle = c.belly; g.beginPath(); g.ellipse(0.66 * r, 0.6 * r, 0.42 * r, 0.3 * r, -0.1, 0, TAU); g.fill();
  if (!mean) { g.fillStyle = 'rgba(255,90,120,0.35)'; g.beginPath(); g.ellipse(0.3 * r, 0.52 * r, 0.14 * r, 0.06 * r, 0, 0, TAU); g.fill(); }
  const ex = 0.5 * r, ey = 0.12 * r, fx = 0.95 * r;
  if (e === 'hurt' || e === 'ko') {
    g.strokeStyle = OUTLINE; g.lineWidth = 0.08 * r; g.beginPath();
    if (e === 'hurt') { g.moveTo(ex - 0.16 * r, ey - 0.14 * r); g.lineTo(ex + 0.1 * r, ey); g.lineTo(ex - 0.16 * r, ey + 0.14 * r); g.moveTo(fx + 0.05 * r, ey - 0.12 * r); g.lineTo(fx - 0.04 * r, ey); g.lineTo(fx + 0.05 * r, ey + 0.12 * r); }
    else for (const [x, s] of [[ex, 0.14], [fx, 0.07]]) { g.moveTo(x - s * r, ey - 0.12 * r); g.lineTo(x + s * r, ey + 0.12 * r); g.moveTo(x + s * r, ey - 0.12 * r); g.lineTo(x - s * r, ey + 0.12 * r); }
    g.stroke();
  } else if (e === 'closed' || e === 'grin') {
    g.strokeStyle = OUTLINE; g.lineWidth = 0.08 * r; g.beginPath(); g.moveTo(ex - 0.17 * r, ey + 0.04 * r); g.quadraticCurveTo(ex, ey - 0.14 * r, ex + 0.17 * r, ey + 0.04 * r); g.moveTo(fx - 0.06 * r, ey + 0.04 * r); g.quadraticCurveTo(fx, ey - 0.08 * r, fx + 0.06 * r, ey + 0.04 * r); g.stroke();
  } else if (mean) {   // narrowed, glowing eyes
    for (const [x, w, h] of [[ex, 0.2, 0.13], [fx, 0.07, 0.11]]) {
      g.fillStyle = '#140808'; g.beginPath(); g.moveTo(x - w * r, ey - h * r); g.lineTo(x + w * r, ey - h * 0.2 * r); g.lineTo(x + w * 0.8 * r, ey + h * r); g.lineTo(x - w * 0.9 * r, ey + h * 0.6 * r); g.closePath(); g.fill();
      g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = c.devil || o.glow ? '#ff3a1a' : '#ffd24a'; if (FX.hq) { g.shadowColor = g.fillStyle; g.shadowBlur = 8; }
      g.beginPath(); g.arc(x + w * 0.2 * r, ey + h * 0.15 * r, Math.max(1.4, w * 0.35 * r), 0, TAU); g.fill(); g.restore();
    }
  } else {   // huge glossy puppy eyes
    for (const [x, w, h] of [[ex, 0.25, 0.31], [fx, 0.08, 0.25]]) {
      g.fillStyle = '#16101a'; g.beginPath(); g.ellipse(x, ey, w * r, h * r, 0, 0, TAU); g.fill();
      g.fillStyle = c.eye; g.beginPath(); g.ellipse(x + w * 0.1 * r, ey + h * 0.35 * r, w * 0.6 * r, h * 0.4 * r, 0, 0, TAU); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x - w * 0.3 * r, ey - h * 0.4 * r, w * 0.38 * r, h * 0.26 * r, -0.3, 0, TAU); g.fill();
      g.beginPath(); g.arc(x + w * 0.38 * r, ey + h * 0.38 * r, w * 0.17 * r, 0, TAU); g.fill();
    }
  }
  // mouth with little metal teeth
  const mx = 0.74 * r, my = 0.62 * r;
  g.strokeStyle = OUTLINE; g.lineWidth = 0.045 * r;
  if (mean || e === 'hurt' || e === 'ko') {
    const open = e === 'shout' ? 0.2 : 0.13;
    g.fillStyle = '#3a0a0a'; g.beginPath(); g.moveTo(mx - 0.26 * r, my - 0.06 * r); g.quadraticCurveTo(mx, my - 0.1 * r, mx + 0.26 * r, my - 0.08 * r); g.quadraticCurveTo(mx + 0.1 * r, my + open * r * 1.4, mx - 0.26 * r, my - 0.06 * r); g.fill(); g.stroke();
    g.fillStyle = '#e8ecf2'; g.strokeStyle = '#555c68'; g.lineWidth = 0.6;
    for (let i = 0; i < 6; i++) { const x = mx - 0.22 * r + i * 0.085 * r; g.beginPath(); g.moveTo(x, my - 0.075 * r); g.lineTo(x + 0.04 * r, my + 0.03 * r); g.lineTo(x + 0.08 * r, my - 0.08 * r); g.closePath(); g.fill(); g.stroke(); }
  } else {
    g.beginPath(); g.moveTo(mx - 0.13 * r, my - 0.02 * r); g.quadraticCurveTo(mx - 0.06 * r, my + 0.08 * r, mx, my); g.quadraticCurveTo(mx + 0.06 * r, my + 0.08 * r, mx + 0.13 * r, my - 0.02 * r); g.stroke();
    g.fillStyle = '#e8ecf2'; g.strokeStyle = OUTLINE; g.lineWidth = 0.8;
    for (const x of [mx - 0.07 * r, mx + 0.04 * r]) { g.beginPath(); g.moveTo(x, my + 0.02 * r); g.lineTo(x + 0.02 * r, my + 0.07 * r); g.lineTo(x + 0.04 * r, my + 0.02 * r); g.closePath(); g.fill(); g.stroke(); }
  }
  g.restore();
}
// the chainsaw on its forehead: engine housing + guide bar + moving chain
function buzzuSaw(g, r, c, R, o) {
  const T = o.T || 0, rev = o.expr === 'shout' || c.devil || c.heatK > 0.7, len = (c.devil ? 2.05 : 1.75) * r, w = 0.21 * r;
  g.save(); g.translate(0.26 * r, -0.86 * r); g.rotate(0.5);
  // guide bar
  const bar = () => { g.beginPath(); g.moveTo(-w, 0); g.lineTo(-w, -len + w); g.arc(0, -len + w, w, Math.PI, 0); g.lineTo(w, 0); g.closePath(); };
  bar(); if (!R.mono) { g.strokeStyle = OUTLINE; g.lineWidth = 7; g.stroke(); } g.fillStyle = R.mono || c.chain; g.fill();
  if (!R.mono) {
    g.save(); bar(); g.clip();
    g.fillStyle = c.bar; g.fillRect(-w * 0.62, -len + w * 0.5, w * 1.24, len - w * 0.5);
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(-w * 0.5, -len + w * 1.2, w * 0.3, len - w * 2);
    g.restore();
    // chain teeth running around the bar
    const step = 0.24 * r, off = ((T * (rev ? 3.2 : 0.4)) % step + step) % step;
    g.fillStyle = '#d8dde6'; g.strokeStyle = OUTLINE; g.lineWidth = 0.9;
    for (let y = -off; y > -len + w; y -= step) for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(s * w, y); g.lineTo(s * (w + 0.11 * r), y - 0.05 * r * -s - 0.05 * r); g.lineTo(s * w, y - 0.12 * r); g.closePath(); g.fill(); g.stroke();
    }
    g.fillStyle = '#5a606c'; g.beginPath(); g.arc(0, -len + w, w * 0.45, 0, TAU); g.fill();
    if (rev && FX.hq) { g.globalCompositeOperation = 'lighter'; g.strokeStyle = c.accent; g.globalAlpha = 0.35 + 0.25 * Math.sin(T * 1.3); g.lineWidth = 3; bar(); g.stroke(); }
  }
  g.restore();
  // engine housing on the forehead
  polyR(g, r, [[-0.2, -0.72], [-0.14, -1.06], [0.5, -1.14], [0.62, -0.84], [0.38, -0.66]], c.engine, R);
  if (!R.mono) { g.fillStyle = '#2a2a32'; for (let i = 0; i < 3; i++) g.fillRect((-0.04 + i * 0.16) * r, -1.0 * r, 0.08 * r, 0.22 * r); circ(g, 0.48 * r, -0.86 * r, 0.06 * r, '#c8ccd4', R); }
}
function buzzuPaw(g, K, F, c, R, back, b) {   // stubby leg ending in a round chibi paw with pads
  tube(g, [K, lerpP(K, F, 0.5), F], 8.5, 10, c.leg, R);
  const x = F[0], y = F[1];
  ell(g, x + 6, y + 3, 15, 9, c.paw, R);
  if (!R.mono) {
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(x + 2, y - 2, 7, 3, -0.2, 0, TAU); g.fill();
    for (const [px, pr] of [[x + 15, 3.2], [x + 9, 2.8]]) xpPad(g, px, y + 7, pr, c.pad);
    g.strokeStyle = 'rgba(60,20,0,0.5)'; g.lineWidth = 1.2; for (const dx of [12, 16]) { g.beginPath(); g.moveTo(x + dx, y - 3); g.lineTo(x + dx + 1, y + 3); g.stroke(); }
  }
  if (back && !R.mono) { g.fillStyle = 'rgba(10,0,26,0.28)'; g.beginPath(); g.ellipse(x + 6, y + 3, 15, 9, 0, 0, TAU); g.fill(); }
}
function buzzuArmBlade(g, E, Hd, c, R, T, scale = 1) {   // Full Devil Mode: chainsaws burst from the wrists
  const a = Math.atan2(Hd[1] - E[1], Hd[0] - E[0]);
  g.save(); g.translate(...Hd); g.rotate(a);
  const L = 34 * scale, w = 5;
  poly(g, [[0, -w], [L, -w], [L + w, 0], [L, w], [0, w]], c.chain, R, 4);
  if (!R.mono) {
    g.fillStyle = c.bar; g.fillRect(2, -w * 0.5, L - 3, w);
    g.fillStyle = '#d8dde6'; const off = (T * 3) % 7;
    for (let x = off; x < L; x += 7) { g.beginPath(); g.moveTo(x, -w); g.lineTo(x + 3, -w - 4); g.lineTo(x + 5, -w); g.fill(); g.beginPath(); g.moveTo(x, w); g.lineTo(x + 3, w + 4); g.lineTo(x + 5, w); g.fill(); }
  }
  g.restore();
}

// ---------------------------------- character ----------------------------------
const BUZZU = {
  id: 'buzzu', name: 'BUZZU', jp: 'ブッズ', title: 'The Chainsaw Beast', titleJp: '鋸の魔獣',
  style: 'RUSHDOWN / DEVIL', desc: 'A tiny devil-dog with a chainsaw for a forehead. Fast multi-hit combos, an engine that runs hotter with every hit and a Full Devil Mode. Fragile when it stops.',
  stats: { power: 3, speed: 5, range: 1, defense: 1 },
  scale: 0.95, health: 870, walk: 5.3, backWalk: 4.4, jumpV: -17, jumpX: 5.4, dashV: 15, backdashV: 9.5, juggleMax: 8, defMul: 1.05,
  hurt: { w: 54, h: 132, ch: 98, air: 116, airTop: 136 },
  voicePitch: 1.6, voiceRate: 1.25,
  colors: {
    skin: '#ff7a1e', hair: '#ff7a1e', top: '#ff7a1e', leg: '#ff7a1e', boot: '#ff9a4a', foot: '#ff9a4a', uarm: '#ff7a1e', farm: '#ff7a1e', hand: '#ff9a4a',
    eye: '#5a3a2a', eye2: '#ffd24a', accent: '#ffb02a', brow: '#a04010', belly: '#ffb27a', paw: '#ff9a4a', pad: '#5a2a14', engine: '#5a606c', bar: '#b8bec8', chain: '#3a3c46',
    warm: '#ff7a1e', sole: '#5a2a14', collar: '#3a3c46', heatK: 0, devil: false,
  },
  afterColors: ['#ff7a1e', '#ffb02a', '#ff2a1a'],
  stance: { t: 0.12, hd: -0.05, fa1: 0.35, fa2: 1.05, ba1: 0.2, ba2: 0.9, fl1: 0.4, fl2: 0.1, bl1: -0.35, bl2: -0.1 },
  poses: {
    victory: { t: -0.1, hd: -0.45, fa1: 2.7, fa2: 3.0, ba1: 2.5, ba2: 2.9, fl1: 0.3, fl2: 0.1, bl1: -0.3, bl2: -0.1 },
    intro: { t: 0.05, hd: -0.2, fa1: 1.4, fa2: 2.6, ba1: 1.2, ba2: 2.4, fl1: 0.35, fl2: 0.1, bl1: -0.35, bl2: -0.1 },
    sawDash: { t: 0.85, hd: 0.8, fa1: -0.6, fa2: -0.3, ba1: -0.9, ba2: -0.6, fl1: 1.1, fl2: 0.3, bl1: -0.9, bl2: -0.8 },
    sawW: { t: -0.25, hd: -0.45, fa1: 1.2, fa2: 2.2, ba1: 0.9, ba2: 2.0, fl1: 0.5, fl2: 0.1, bl1: -0.5, bl2: -0.2 },
    sawS: { t: 0.6, hd: 0.95, fa1: 0.4, fa2: 0.6, ba1: 0.2, ba2: 0.4, fl1: 0.9, fl2: 0.25, bl1: -0.7, bl2: -0.5 },
    fz1: { t: 0.45, hd: 0.5, fa1: 1.4, fa2: 1.6, ba1: -0.6, ba2: 0.2, fl1: 0.7, fl2: 0.2, bl1: -0.6, bl2: -0.4 },
    fz2: { t: 0.7, hd: 1.25, fa1: -0.4, fa2: 0.2, ba1: 1.4, ba2: 1.6, fl1: 0.8, fl2: 0.25, bl1: -0.7, bl2: -0.45 },
    leap: { ground: 0, hipH: 84, t: 0.9, hd: 0.7, fa1: 1.3, fa2: 1.6, ba1: 1.0, ba2: 1.4, fl1: 1.6, fl2: 0.1, bl1: 1.3, bl2: -0.3 },
    pull: { t: -0.15, hd: -0.35, fa1: -1.4, fa2: -1.0, ba1: -1.6, ba2: -1.2, fl1: 0.5, fl2: 0.1, bl1: -0.5, bl2: -0.1 },
    bite_w: { t: -0.3, hd: -0.55, fa1: 1.6, fa2: 2.4, ba1: 1.4, ba2: 2.2, fl1: 0.45, fl2: 0.1, bl1: -0.45, bl2: -0.15 },
    bite: { t: 0.85, hd: 0.7, fa1: 1.5, fa2: 1.4, ba1: 1.3, ba2: 1.2, fl1: 0.95, fl2: 0.3, bl1: -0.8, bl2: -0.6 },
    roar2: { t: -0.35, hd: -0.6, fa1: 2.4, fa2: 2.9, ba1: 2.2, ba2: 2.8, fl1: 0.55, fl2: 0.12, bl1: -0.55, bl2: -0.12 },
    swipe_w: { t: -0.1, fa1: 2.4, fa2: 3.0, ba1: 0.4, ba2: 1.2 },
    swipe: { t: 0.5, hd: 0.3, fa1: 1.2, fa2: 0.7, ba1: -0.5, ba2: 0.2, fl1: 0.7, fl2: 0.2, bl1: -0.6, bl2: -0.4 },
  },
  intro: 'Vrrrrm… vrrRRRRMM!',
  wins: ['Woof! Vrrrm!', '(wags its pull-cord happily)', 'Arf! …Is there any more?'],
  ropes: [],
  hairBack() {},
  hairFront(g, r, c, R, o) { buzzuSaw(g, r, c, R, o); },
  neckWear(g, sk, p, c, R) { if (R.mono) return; const n = sk.neck; g.fillStyle = c.chain; g.strokeStyle = OUTLINE; g.lineWidth = 1.5; g.beginPath(); g.ellipse(n[0], n[1] + 4, 12, 4, 0.1, 0, TAU); g.fill(); g.stroke(); circ(g, n[0] + 9, n[1] + 9, 4, '#ffd24a', R); },
  torsoDetail(g, L, bw, c) {
    g.fillStyle = c.belly; g.beginPath(); g.ellipse(4 * bw, -L * 0.42, 9 * bw, L * 0.42, 0.1, 0, TAU); g.fill();
    // engine vents on the side glow with heat
    const k = c.heatK || 0; g.fillStyle = k > 0.05 ? `rgba(255,${Math.round(200 - 140 * k)},40,${0.35 + 0.6 * k})` : 'rgba(80,30,10,0.4)';
    for (let i = 0; i < 3; i++) g.fillRect(-11 * bw, -L * (0.75 - i * 0.18), 7 * bw, 2.4);
  },
  torsoOver() {},
  weaponBack(g, sk, p, c, R, o) {
    const T = o.T || 0, wag = Math.sin(T * (c.heatK > 0.4 ? 0.5 : 0.18)) * 0.25, h = [sk.hip[0] - 12, sk.hip[1] - 4];
    // stubby tail ending in the starter cord with a T-handle
    const t1 = addP(h, polar(-1.9 + wag, 12)), t2 = addP(t1, polar(-2.2 + wag * 1.4, 16));
    tube(g, [h, t1], 7, 5.5, c.skin, R);
    if (!R.mono) { g.strokeStyle = OUTLINE; g.lineWidth = 3.6; g.beginPath(); g.moveTo(...t1); g.quadraticCurveTo(t1[0] - 6, t1[1] - 12, t2[0], t2[1]); g.stroke(); g.strokeStyle = '#e8e2d6'; g.lineWidth = 1.6; g.stroke(); }
    g.save(); g.translate(...t2); g.rotate(-2.2 + wag * 1.4); poly(g, [[-2, -9], [4, -9], [4, 9], [-2, 9]], '#2a2a32', R, 3); g.restore();
    if (c.devil) buzzuArmBlade(g, sk.be, sk.bh, c, R, T, 0.85);
  },
  weaponFront(g, sk, p, c, R, o) { if (c.devil) buzzuArmBlade(g, sk.fe, sk.fh, c, R, o.T || 0, 1); },
};
makeChibi(BUZZU, { build: { arm: 1.3, leg: 1.4, torso: 1.45 }, colors: {} });
BUZZU.dims = { thigh: 17, shin: 15, torso: 27, neck: 2, headR: 31, uarm: 15, farm: 13, footLift: 8 };
BUZZU.faceFn = buzzuFace; BUZZU.drawBoot = buzzuPaw; BUZZU.portraitScale = 0.62;

// ---------------------------------- engine systems ----------------------------------
const BUZZU_PALS = [0, 0.35, 0.7, 1].map(k => buzzuPal(BUZZU.colors, k, false)), BUZZU_PAL_D = buzzuPal(BUZZU.colors, 1, true);
BUZZU.palette = F => F.devilT > 0 ? BUZZU_PAL_D : BUZZU_PALS[F.overT > 0 ? 3 : clamp(Math.floor((F.heat || 0) / 34), 0, 2)];
const buzzuTier = F => F.overT > 0 ? 3 : (F.heat || 0) >= 75 ? 2 : (F.heat || 0) >= 40 ? 1 : 0;
function buzzuHeat(F, n) { if (F.ko || F.overT > 0 || F.devilT > 0) return; F.heat = Math.min(100, (F.heat || 0) + n); F.heatT = F.T; }
function buzzuOverheat(F) {
  F.overT = BUZZU_OVERHEAT_T; F.heat = 100;
  FX.ring(F.x, F.y - 80, '#ffb02a', 14, 200, 18, 8); FX.flashScreen('#ff7a1a', 8, 0.35); FX.shakeIt(7);
  FX.wtext(F.x, F.y - 200, 'OVERHEAT!', { size: 38, color: '#ffffff', stroke: '#c03a00', life: 50 });
  for (let i = 0; i < 20; i++) FX.p({ type: 'spark', x: F.x + rand(-20, 20), y: F.y - rand(60, 140), vx: rand(-7, 7), vy: -rand(2, 8), life: 20, size: 2.5, color: pick(['#ffd24a', '#ff7a1a']) });
  Sound.play('rev'); Sound.play('fire');
}
BUZZU.initFighter = F => { F.heat = 0; F.heatT = -999; F.overT = 0; F.odT = 0; F.devilT = 0; F.devilMax = 1; F.healDone = false; };
BUZZU.dmgBonus = F => F.devilT > 0 ? 1.15 : F.overT > 0 ? 1.1 : buzzuTier(F) === 2 ? 1.05 : 1;
BUZZU.walkMul = F => (F.odT > 0 ? 1.25 : 1) * (F.devilT > 0 ? 1.1 : 1);
BUZZU.onDealDamage = (A, D) => { if (!A.ko) buzzuHeat(A, A.state === 'cine' ? 1 : 6); };
BUZZU.tick = F => {
  const live = BT && BT.phase === 'fight' && !F.ko;
  // blocked hits still warm the engine a little
  const O = F.opp; if (O && O.state === 'block' && O.sf === 0 && F.state === 'attack') buzzuHeat(F, 2);
  if (F.state !== 'attack' && F.pose.rot > Math.PI) F.pose.rot -= TAU;   // unwind after the Demonic Leap spin
  const haste = (F.odT > 0 ? 0.34 : 0) + [0, 0.15, 0.25, 0.34][buzzuTier(F)] + (F.devilT > 0 ? 0.2 : 0);
  xpHaste(F, Math.min(0.5, haste));
  if (F.odT > 0) {
    F.odT--;
    if (F.T % 3 === 0) FX.p({ type: 'smoke', x: F.x - F.facing * 18, y: F.y - rand(60, 100) * F.s, vx: -F.facing * rand(0.5, 2), vy: -rand(0.5, 1.5), life: 26, size: rand(6, 10), grow: 0.3, color: 'rgba(90,90,100,0.5)', add: false });
    if (F.state === 'walk' || F.state === 'dash') F.afterimage = Math.max(F.afterimage, 2);
  }
  if (F.devilT > 0) {
    F.devilT--; F.heat = 100 * F.devilT / F.devilMax;
    if (F.T % 2 === 0) FX.p({ type: 'ember', x: F.x + rand(-30, 30), y: F.y - rand(10, 130) * F.s, vx: rand(-0.5, 0.5), vy: -rand(1, 2.5), life: 22, size: rand(1.8, 3.2), color: pick(['#ff2a1a', '#ff7a1a', '#ffd24a']) });
    if (F.devilT === 0) { F.heat = 20; FX.wtext(F.x, F.y - 190, 'DEVIL MODE ENDS', { size: 16, color: '#ffb08a', life: 30 }); }
  } else if (F.overT > 0) {
    F.overT--; F.heat = 100 * F.overT / BUZZU_OVERHEAT_T;
    if (F.T % 3 === 0) FX.p({ type: 'spark', x: F.x + rand(-14, 14), y: F.y - rand(90, 130) * F.s, vx: rand(-3, 3), vy: -rand(1, 4), life: 12, size: 2, color: pick(['#ffd24a', '#ff7a1a']) });
    if (F.overT === 0) F.heat = 25;
  } else if (live) {
    if (F.T - F.heatT > 100 && F.heat > 0 && F.state !== 'cine') F.heat = Math.max(0, F.heat - 0.2);
    if (F.heat >= 100) buzzuOverheat(F);
  }
  if (F.state === 'attack' && F.move && F.move.saw && F.T % 2 === 0) {   // sparks fly from the saw while it bites
    const h = toWorld(F.x, F.y, F.facing, F.s, F.pose, F.sk, F.sk.head[0], F.sk.head[1]);
    FX.p({ type: 'spark', x: h[0] + F.facing * rand(10, 40), y: h[1] - rand(10, 40), vx: F.facing * rand(1, 5), vy: -rand(1, 4), life: 10, size: 2, color: pick(['#ffd24a', '#ffffff', '#ff9a2a']) });
  }
};
BUZZU.drawExtra = (g, F) => {
  if (F.ko || !FX.hq) return;
  if (F.devilT > 0 || F.overT > 0) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.16 + 0.08 * Math.sin(F.T * 0.4);
    const col = F.devilT > 0 ? '#ff2a1a' : '#ff9a2a', y = F.y - 70 * F.s, gr = g.createRadialGradient(F.x, y, 6, F.x, y, 95);
    gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(F.x, y, 95, 0, TAU); g.fill(); g.restore();
  }
};
BUZZU.introFx = F => {
  Sound.play('rev');
  for (let i = 0; i < 16; i++) FX.p({ type: 'smoke', x: F.x - F.facing * 20, y: F.y - rand(40, 100), vx: rand(-2, 2), vy: -rand(0.5, 2), life: 34, size: rand(8, 14), grow: 0.3, color: 'rgba(90,90,100,0.5)', add: false });
  for (let i = 0; i < 18; i++) FX.p({ type: 'spark', x: F.x + F.facing * 20, y: F.y - rand(100, 150), vx: rand(-6, 6), vy: -rand(2, 7), life: 16, size: 2.4, color: pick(['#ffd24a', '#ffffff']) });
};
// Full Devil Mode swaps the plain L / M / H for saw versions
BUZZU.tryCustom = (F, inp, air, minLvl) => {
  if (!(F.devilT > 0) || air || inp.d || inp.p('sp1') || inp.p('sp2') || (inp.p('light') && inp.p('heavy'))) return false;
  if (inp.p('heavy') && inp.motion('ff', 20)) return false;
  for (const [b, k] of [['heavy', 'dH'], ['medium', 'dM'], ['light', 'dL']]) {
    if (!inp.p(b)) continue;
    if (!F.canUse(k, false, minLvl)) return false;
    F.goPressF = inp.pressF[b] ?? -99; inp.use(b); F.startMove(k); return true;
  }
  return false;
};

// ---------------------------------- moves ----------------------------------
const sawSfx = F => { if (F.T % 6 === 0) Sound.play('saw', 1.2); };
BUZZU.moves = Object.assign(baseNormals({ dmg: 0.86, spd: -2, rng: 0.92 }), {
  sp1: {
    name: 'CHAINSAW DASH', jp: '鋸突進', desc: 'Charges forward head-first, the forehead saw grinding through the opponent for 4 hits. Cancels into its other specials — the combo starter.', special: 1, lvl: 3.9, saw: 1,
    poses: ['sawDash', 'sawDash'], st: 8, act: 14, rec: 16, dmg: 15, hits: 4, interval: 4, hs: 18, bs: 9, kb: 1.2, hb: { x: 10, y: -125, w: 84, h: 78 }, cd: 36, str: 2, sfx: 'saw',
    final: { hs: 24, kb: 3 },
    tick(F, f) { if (f >= 3 && f <= 18) { F.vx = F.facing * 10.5; F.ctrlVel = true; F.afterimage = Math.max(F.afterimage, 3); } sawSfx(F); },
  },
  sp1f: {
    name: 'SAW FRENZY', jp: '鋸乱舞', desc: 'A blur of chainsaw slashes (7 hits) ending in a knockback strike that can wall splat.', special: 1, lvl: 4, saw: 1,
    st: 7, act: 26, rec: 18, dmg: 12, hits: 7, interval: 3, hs: 16, bs: 8, kb: 1, hb: { x: 5, y: -140, w: 98, h: 100 }, cd: 70, str: 2, sfx: 'saw',
    final: { dmg: 44, kb: 11, kd: 1, hs: 30, str: 3, ws: 1, shake: 7 },
    poseRate: 0.7, poseFn: (F, f) => f <= 7 ? 'sawW' : f > 33 ? 'stance' : f > 28 ? 'sawS' : (f >> 1) % 2 ? 'fz1' : 'fz2',
    tick(F, f) { if (f > 7 && f < 30) { F.vx = F.facing * 1.6; F.ctrlVel = true; if (f % 4 === 0) FX.swoosh(F, { cx: 20, cy: -90, r: 60, a0: f % 8 ? -1.6 : 0.8, a1: f % 8 ? 0.6 : -1.4, color: '#ffb02a', life: 6 }); } sawSfx(F); },
  },
  counter: {
    name: 'DEMONIC LEAP', jp: '魔獣跳び', desc: 'Leaps at the opponent and spins down saw-first (overhead, 2 hits). Usable in the air to extend combos.', special: 1, lvl: 4, air: 'both', saw: 1,
    st: 11, act: 30, rec: 4, landRec: 10, dmg: 34, hits: 2, interval: 8, hs: 24, bs: 12, kb: 3, type: 'overhead', hb: { x: -10, y: -140, w: 96, h: 120 }, cd: 55, str: 3, sfx: 'saw',
    poseRate: 1, poseFn: (F, f) => f <= 5 ? 'crouch' : { base: 'leap', rot: f > 8 ? ((f - 8) * 0.55) % TAU : 0 },
    tick(F, f, O) {
      if (f === 5) { const d = clamp(Math.abs(O.x - F.x) - 40, 30, 300); F.vy = F.onGround ? -12.5 : -7; F.vx = F.facing * d / 26; F.onGround = false; F.y = Math.min(F.y, GROUND - 1); F.afterimage = 10; Sound.play('jump'); }
      if (f > 5) F.ctrlVel = true;
      sawSfx(F);
    },
    onLand(F) { F.pose.rot = 0; FX.dust(F.x, GROUND, 6); },
  },
  sp2: {
    name: 'ENGINE OVERDRIVE', jp: '暴走機関', desc: 'Yanks its own pull-cord: for 5 s it moves 25% faster and every attack recovers faster. +20 ENGINE HEAT.', special: 1, lvl: 4,
    poses: ['pull', 'roar2'], st: 10, act: 1, rec: 12, cd: 600, sfx: 'rev',
    onStart(F) {
      F.odT = BUZZU_OD_T; buzzuHeat(F, 20); F.heatT = F.T;
      FX.wtext(F.x, F.y - 200, 'OVERDRIVE!', { size: 30, color: '#ffffff', stroke: '#c05a00', life: 45 });
      for (let i = 0; i < 14; i++) FX.p({ type: 'smoke', x: F.x - F.facing * 20, y: F.y - rand(50, 110), vx: -F.facing * rand(1, 3), vy: -rand(0.5, 2), life: 30, size: rand(8, 13), grow: 0.3, color: 'rgba(80,80,90,0.55)', add: false });
      FX.ring(F.x, F.y - 70, '#ffb02a', 10, 120, 14, 5);
    },
  },
  sp2f: {
    name: 'BLOOD CONSUMPTION', jp: '血喰らい', desc: 'Chomps down and grinds (3 hits). If the last hit lands it heals 6% of its health (8% in Devil Mode). Long cooldown.', special: 1, lvl: 4, saw: 1,
    poses: ['bite_w', 'bite'], st: 8, act: 12, rec: 22, dmg: 20, hits: 3, interval: 5, hs: 20, bs: 10, kb: 1, hb: { x: 5, y: -135, w: 66, h: 86 }, cd: 360, str: 2, sfx: 'saw',
    final: { dmg: 38, kb: 6, hs: 28, str: 3 },
    tick(F, f) { if (f <= 10) { F.vx = F.facing * 4; F.ctrlVel = true; } sawSfx(F); },
    onHit(A, D) {
      for (let i = 0; i < 6; i++) FX.p({ type: 'blood', x: D.x + rand(-10, 10), y: D.y - rand(80, 130) * D.s, vx: rand(-3, 3), vy: -rand(2, 5), grav: 0.45, life: 40, size: rand(2, 3.5), color: pick(['#b3122e', '#e0203e']), add: false });
      if (A.hitCount >= 3 && !A.healDone) { A.healDone = true; xpHeal(A, A.maxHp * (A.devilT > 0 ? 0.08 : 0.06)); Sound.play('drain'); }
    },
    onStart(F) { F.healDone = false; },
  },
  sp2d: {
    name: 'FULL DEVIL MODE', jp: '真・魔獣化', desc: 'Needs 50+ ENGINE HEAT and spends all of it: transforms for up to 8 s — blades burst from its arms, +15% damage, new L / M / H.', special: 1, lvl: 4,
    poses: ['roar2', 'roar2'], st: 10, act: 1, rec: 14, cd: 90, invuln: [0, 20], req: F => (F.heat || 0) >= 50 && !(F.devilT > 0), sfx: 'rev',
    onStart(F) {
      F.devilMax = F.devilT = Math.round(clamp(200 + F.heat * 2.8, 300, 480)); F.overT = 0; F.heat = 100;
      FX.ring(F.x, F.y - 70, '#ff2a1a', 20, 240, 22, 10); FX.ring(F.x, GROUND, '#ffb02a', 10, 200, 18, 6, 0.25); FX.flashScreen('#ff2a1a', 12, 0.45); FX.shakeIt(10);
      FX.wtext(F.x, F.y - 220, 'FULL DEVIL MODE!', { size: 40, color: '#ffffff', stroke: '#a00000', life: 60 });
      for (let i = 0; i < 30; i++) FX.p({ type: 'spark', x: F.x + rand(-30, 30), y: F.y - rand(40, 130), vx: rand(-9, 9), vy: -rand(2, 9), life: 22, size: 2.6, color: pick(['#ffd24a', '#ff2a1a', '#ffffff']) });
      Sound.play('roar'); Sound.play('impactBig');
    },
  },
  ult: {
    name: 'CHAINSAW RAMPAGE', jp: '鋸狂乱', desc: 'Ultimate. The engine screams past its limit: a dash that turns into a storm of chainsaw strikes from every direction, finished by one enormous saw blow.', ult: 1, lvl: 6, cost: 100, saw: 1,
    poses: ['sawDash', 'sawDash'], st: 6, act: 16, rec: 26, dmg: 30, hs: 40, bs: 20, kb: 4, hb: { x: 0, y: -150, w: 100, h: 140 }, invuln: [0, 22], str: 3,
    tick(F, f) { if (f > 5 && f <= 22) { F.vx = F.facing * 14; F.ctrlVel = true; F.afterimage = 6; } sawSfx(F); },
    onHit(F, D) { BT.startCine(F, D, CINE.buzzu, { zoom: 1.25 }); return true; },
  },
  // Full Devil Mode normals
  dL: { name: 'Devil Claw', lvl: 1, poses: ['swipe_w', 'swipe'], st: 4, act: 4, rec: 8, dmg: 22, hits: 2, interval: 2, hs: 15, bs: 10, kb: 2, hb: { x: 8, y: -125, w: 84, h: 60 }, str: 1, saw: 1, sw: { cx: 10, cy: -90, r: 64, a0: -1.4, a1: 0.5, color: '#ff2a1a' } },
  dM: { name: 'Devil Saw Kick', lvl: 2, poses: ['kick_w', 'kick'], st: 6, act: 6, rec: 12, dmg: 26, hits: 2, interval: 3, hs: 18, bs: 12, kb: 3, hb: { x: 12, y: -100, w: 100, h: 50 }, str: 2, saw: 1 },
  dH: { name: 'DEVIL SAW REND', lvl: 3, poses: ['sawW', 'sawS'], st: 9, act: 9, rec: 18, dmg: 34, hits: 3, interval: 3, hs: 22, bs: 14, kb: 4, hb: { x: 10, y: -150, w: 120, h: 110 }, str: 3, saw: 1, shake: 6, final: { kb: 7, ws: 1 }, sw: { cx: 10, cy: -100, r: 96, a0: -2.2, a1: 0.7, color: '#ff2a1a' } },
});
(() => {
  const M = BUZZU.moves;
  Object.assign(M.L, { name: 'Paw Swipe', poses: ['swipe_w', 'swipe'], hb: { x: 8, y: -122, w: 64, h: 44 } });
  Object.assign(M.M, { name: 'Pup Kick', kb: 2.5, hb: { x: 10, y: -95, w: 76, h: 42 } });
  Object.assign(M.H, { name: 'SAW HEADBUTT', poses: ['sawW', 'sawS'], dmg: 44, hits: 2, interval: 5, act: 9, kb: 7, hb: { x: 10, y: -150, w: 92, h: 100 }, saw: 1, sw: { cx: 10, cy: -100, r: 90, a0: -2.0, a1: 0.6, color: '#ffb02a' },
    tick(F, f) { if (f <= 10) { F.vx = F.facing * 5; F.ctrlVel = true; } } });
  Object.assign(M.cL, { name: 'Low Nip' });
  Object.assign(M.cH, { name: 'Tail Sweep' });
  Object.assign(M.LH, { name: 'Saw Uppercut', poses: ['sawW', { base: 'sawS', t: -0.1, hd: -0.2 }], hb: { x: 0, y: -200, w: 80, h: 170 }, saw: 1 });
  Object.assign(M.FF, { name: 'Buzz Tackle', poses: ['sawDash', 'sawDash'], hb: { x: 10, y: -135, w: 82, h: 70 }, saw: 1 });
  Object.assign(M.jH, { name: 'Air Saw Drop', poses: ['jheavy_w', { base: 'jump', t: 0.7, hd: 0.9 }], saw: 1 });
  M.jM.ajc = 1;
})();
BUZZU.extraList = [['dL', 'Devil Claw', 'Devil Mode: L'], ['dM', 'Devil Saw Kick', 'Devil Mode: M'], ['dH', 'Devil Saw Rend', 'Devil Mode: H']];
BUZZU.combos = [
  { name: 'Revving Up', notation: 'L → M → H → SP1 (Chainsaw Dash) → ↓→SP1 (Saw Frenzy)', seq: ['L', 'M', 'H', 'sp1', 'sp1f'] },
  { name: 'Pounce', notation: 'M → SP1 (Chainsaw Dash) → ↓←SP1 (Demonic Leap)', seq: ['M', 'sp1', 'counter'] },
  { name: 'Snack Time', notation: 'L → M → ↓→SP2 (Blood Consumption)', seq: ['L', 'M', 'sp2f'] },
  { name: 'Full Devil', notation: '↓↓SP2 (Full Devil Mode) → L → M → H (devil versions) → SP1 (Chainsaw Dash) → ↓→SP1 (Saw Frenzy)', seq: ['dL', 'dM', 'dH', 'sp1', 'sp1f'], pre: ['sp2d'], heat: 100 },
  { name: 'Chainsaw Rampage', notation: 'H → SP1 (Chainsaw Dash) → SP1+SP2 (Ultimate)', seq: ['H', 'sp1', 'ult'], meter: 1 },
];
BUZZU.applyTrial = (A, tr) => { if (!tr) return; if (tr.meter) A.meter = 100; if (tr.heat) { A.heat = tr.heat; A.heatT = A.T + 9999; } };
BUZZU.trialInput = { dL: io => io.fr(['light']), dM: io => io.fr(['medium']), dH: io => io.fr(['heavy']) };

// ---------------------------------- cinematic ----------------------------------
CINE.buzzu = function (A, D, f, c) {
  const dir = A.facing, acc = '#ffb02a';
  if (f === 1) {
    D.x = clamp(A.x + dir * 90, 90, STAGE_W - 90); D.y = GROUND; D.forcePose = 'hit'; A.forcePose = 'roar2';
    FX.darkTarget = 0.85; FX.flashScreen('#ff7a1a', 10, 0.5); Sound.play('rev'); Sound.play('charge'); c.zoom = 1.3;
    FX.wtext(A.x, GROUND - 230, 'VRRRRRMMMM!!', { size: 40, color: '#ffffff', stroke: '#c03a00', life: 50 });
  }
  if (f < 24 && f % 2 === 0) FX.p({ type: 'smoke', x: A.x - dir * 20, y: A.y - rand(50, 110), vx: -dir * rand(1, 4), vy: -rand(0.5, 2), life: 26, size: rand(8, 14), grow: 0.4, color: 'rgba(70,70,80,0.6)', add: false });
  if (f >= 24 && f <= 84) {   // a storm of strikes from every angle
    if (f % 6 === 0) {
      const a = rand(0, TAU), rr = rand(60, 110); A.x = D.x + Math.cos(a) * rr; A.y = Math.min(GROUND, D.y - 60 + Math.sin(a) * rr * 0.7); A.facing = D.x > A.x ? 1 : -1;
      A.forcePose = pick(['sawS', 'fz1', 'fz2', 'bite', 'sawDash']); A.afterimage = 8;
      BT.scriptHit(A, D, 14, { str: 2, sfx: 'slash' }); D.forcePose = (f / 6) % 2 ? 'hit' : 'hit2'; Sound.play('saw', 1.3);
      const ch = D.chestW(); FX.p({ type: 'slash', x: ch[0], y: ch[1], rot: rand(0, Math.PI), size: 130, life: 10, color: acc, add: true });
      for (let i = 0; i < 8; i++) FX.p({ type: 'spark', x: ch[0], y: ch[1], vx: rand(-9, 9), vy: rand(-9, 4), life: 14, size: 2.4, color: pick(['#ffd24a', '#ffffff', '#ff7a1a']) });
      for (let i = 0; i < 3; i++) FX.p({ type: 'blood', x: ch[0], y: ch[1], vx: rand(-4, 4), vy: -rand(1, 5), grav: 0.45, life: 34, size: rand(2, 3.4), color: '#c0182e', add: false });
    }
    if (f % 6 === 3) FX.speedlines(4, W / 2, H / 2, '#ffd9a0', 30);
  }
  if (f === 90) { A.y = GROUND; A.x = clamp(D.x - dir * 120, 60, STAGE_W - 60); A.facing = D.x > A.x ? 1 : -1; A.forcePose = 'sawW'; A.afterimage = 10; A.devilFlash = true; Sound.play('rev'); FX.ring(A.x, A.y - 120, '#ff2a1a', 10, 140, 16, 6); }
  if (f > 90 && f < 108 && f % 2 === 0) { const h = toWorld(A.x, A.y, A.facing, A.s, A.pose, A.sk, A.sk.head[0], A.sk.head[1] - 60); FX.p({ type: 'spark', x: h[0], y: h[1], vx: rand(-5, 5), vy: -rand(2, 6), life: 14, size: 2.6, color: pick(['#ffd24a', '#ffffff']) }); }
  if (f === 108) {
    A.forcePose = 'sawS'; A.x = clamp(D.x - dir * 50, 60, STAGE_W - 60);
    BT.scriptHit(A, D, 120, { str: 4 });
    FX.impactFrame(4); FX.shakeIt(24); Sound.play('explosion'); Sound.play('saw', 0.7); FX.flashScreen('#ffffff', 12, 0.7);
    FX.p({ type: 'slash', x: D.x, y: D.y - 100, rot: -1.25, size: 620, life: 18, color: '#ff7a1a', add: true });
    FX.p({ type: 'slash', x: D.x, y: D.y - 100, rot: -1.1, size: 420, life: 14, color: '#ffffff', add: true });
    for (let i = 0; i < 50; i++) FX.p({ type: 'spark', x: D.x, y: D.y - 100, vx: rand(-14, 14), vy: rand(-14, 6), life: 24, size: 3, color: pick(['#ffd24a', '#ffffff', '#ff7a1a']) });
    for (let i = 0; i < 26; i++) FX.p({ type: 'blood', x: D.x, y: D.y - 100, vx: rand(-8, 8), vy: -rand(2, 10), grav: 0.5, life: 50, size: rand(2.4, 4.4), color: pick(['#b3122e', '#e0203e']), add: false });
    FX.ring(D.x, D.y - 100, acc, 20, 320, 22, 10); FX.ring(D.x, D.y - 100, '#ffffff', 10, 200, 16, 5);
    FX.wtext(D.x, GROUND - 270, '鋸狂乱!!', { size: 86, font: FX_JP(), color: '#fff', stroke: '#d03a00', life: 60, vy: -0.3 });
    buzzuHeat(A, 30); BT.release(D, dir * 8, -15); FX.darkTarget = 0; return true;
  }
};

// ---------------------------------- HUD + how-to ----------------------------------
BUZZU.drawHand = (g, F, side, t) => {
  const dv = F.devilT > 0, ov = F.overT > 0, tier = buzzuTier(F);
  xpPanel(g, F, side, t, {
    col: dv ? '#ff2a1a' : ov ? '#ffb02a' : ['#ff9a4a', '#ff8a2a', '#ff6a1a'][tier], col2: '#fff0c0', icon: '鋸', flash: dv || ov,
    title: dv ? 'FULL DEVIL MODE' : ov ? 'OVERHEAT' : ['ENGINE HEAT', 'ENGINE HEAT · HOT', 'ENGINE HEAT · BLAZING'][tier],
    sub: dv ? '魔獣化 · DMG+15% · ARM BLADES · NEW L/M/H' : ov ? '過熱 · DMG+10% · FASTER ATTACKS' : F.odT > 0 ? `暴走 · OVERDRIVE ${(F.odT / 60).toFixed(1)}s · SPEED+` : '機関 · hits heat the engine',
    k: (F.heat || 0) / 100, label: dv ? `${(F.devilT / 60).toFixed(1)}s` : ov ? `${(F.overT / 60).toFixed(1)}s` : `${Math.floor(F.heat || 0)}°`, marks: [0.4, 0.5, 0.75],
    badges: [['sp1', 'S1|DASH'], ['sp1f', '↓→S1|FRENZY'], ['counter', '↓←S1|LEAP'], ['sp2', 'S2|OVERDRV'], ['sp2f', '↓→S2|BITE'], ['sp2d', '↓↓S2|DEVIL']],
  });
};
BUZZU.howTo = {
  title: 'CHAINSAW BEAST',
  draw(g) {
    xpHowTo(g, 'BUZZU — THE CHAINSAW BEAST', '#ff8a2a', [
      ['ENGINE HEAT', 'Every hit heats the engine (+6, +2 on block). 40° HOT and 75° BLAZING make attacks recover faster (and +5% dmg).'],
      ['OVERHEAT', 'At 100° the engine overheats for 5 s: +10% damage, fastest attacks. Heat cools off if it stops attacking.'],
      ['SP1', 'Chainsaw Dash — 4-hit head-first charge. Cancels into its other specials: the combo starter.'],
      ['↓→ SP1', 'Saw Frenzy — 7 fast saw hits + a knockback finisher (wall splat).'],
      ['↓← SP1', 'Demonic Leap — jumps in and spins down saw-first (overhead). Also works in the air.'],
      ['SP2', 'Engine Overdrive — 5 s: +25% speed and faster recovery, +20 heat.'],
      ['↓→ SP2', 'Blood Consumption — 3-hit bite; the last hit heals 6% HP. 6 s cooldown.'],
      ['↓↓ SP2', 'Full Devil Mode — needs 50+ heat: arm blades, +15% damage, new 2–3 hit L / M / H for up to 8 s.'],
    ], 'Tiny, fast and fragile (870 HP, takes 5% extra damage). Stay in the opponent’s face: Chainsaw Dash → Saw Frenzy, mix in Demonic Leap overheads and keep the engine hot. Low HP? Blood Consumption buys a little back. Ultimate (SP1+SP2): CHAINSAW RAMPAGE.');
  },
};

CHARS.push(BUZZU);
finalizeMoves(BUZZU);
