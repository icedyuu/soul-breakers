// ====================== CHARACTER-SPECIFIC COMBO ROUTES ======================
// followups: {btn, dir?('f'|'b'|'d'), move, cond?(F), any?(also on whiff/block), window?}
// Move combo properties (filled by finalizeMoves): cat, jg (juggle cost), cw (cancel window after active)
function addFollowup(ch, fromKey, fu) { const m = ch.moves[fromKey]; (m.followups || (m.followups = [])).push(fu); }
function finalizeMoves(ch) {
  const CAT = { L: 'light', cL: 'light', M: 'medium', cM: 'low', H: 'heavy', cH: 'sweep', jL: 'air', jM: 'air', jH: 'air', LH: 'launcher', FF: 'heavy' };
  for (const [k, m] of Object.entries(ch.moves)) {
    if (!m.cat) m.cat = CAT[k] || (m.ult ? 'super' : m.grab ? 'command grab' : m.followup ? 'follow-up' : m.cardMove ? 'card' : 'special');
    if (m.type === 'overhead' && m.cat === 'special') m.cat = 'special (overhead)';
    if (m.jg === undefined) m.jg = m.ult ? 0 : (m.special || m.lvl >= 4) ? 2 : 1;
    if (m.cw === undefined) m.cw = m.lvl <= 1 ? 9 : m.lvl <= 2 ? 11 : m.lvl < 4 ? 13 : 30;
  }
  if (!ch.juggleMax) ch.juggleMax = 6;
}
function shuffleArr(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
MOVELIST.splice(MOVELIST.length - 1, 0, ['sp2f', null, '↓ → + SP2']);

// ---------------------------------- KAZUMA ----------------------------------
KAZUMA.juggleMax = 6;
Object.assign(KAZUMA.poses, {
  axeKick_w: { t: -0.3, hd: 0.1, fl1: 2.9, fl2: 3.0, bl1: -0.1, bl2: -0.05, fa1: 0.5, fa2: 2.2, ba1: -0.4, ba2: 0.6 },
  axeKick: { t: 0.25, hd: -0.1, fl1: 1.35, fl2: 1.15, bl1: -0.2, bl2: -0.1, fa1: 0.3, fa2: 1.9, ba1: -0.5, ba2: 0.3 },
});
KAZUMA.moves.tcHammer = {
  name: 'BURNING HAMMER', jp: '焔槌', followup: 1, lvl: 3.5, poses: ['axeKick_w', 'axeKick'], st: 10, act: 4, rec: 20, dmg: 88, hs: 26, bs: 16, kb: 12, kd: 1, ws: 1, type: 'overhead',
  hb: { x: 15, y: -200, w: 88, h: 200 }, str: 3, shake: 8, sw: { cx: 10, cy: -150, r: 90, a0: -1.8, a1: 0.6 },
  tick(F, f) { if (f <= 9) { F.vx = F.facing * 8; F.ctrlVel = true; } else F.ctrlVel = false; if (f >= 8 && f < 16) { const p = toWorld(F.x, F.y, F.facing, F.s, F.pose, F.sk, F.sk.ff[0], F.sk.ff[1]); FX.flame(p[0], p[1], F.colors.accent, 2, 6, 1); } },
};
addFollowup(KAZUMA, 'H', { btn: 'heavy', dir: 'f', move: 'tcHammer' });
KAZUMA.moves.secondBlaze = {
  name: 'SECOND BLAZE', jp: '二段烈火', followup: 1, lvl: 4.5, poses: ['upper_w', 'upper'], st: 6, act: 6, rec: 22, dmg: 68, hs: 32, bs: 14, kb: 3, launch: -14, kd: 1, landRec: 10,
  hb: { x: 0, y: -230, w: 112, h: 190 }, str: 3, shake: 7, sfx: 'fire',
  tick(F, f) { if (f <= 11) { F.vx = F.facing * 15; F.ctrlVel = true; } if (f === 6) { F.vy = -9; F.onGround = false; } if (f >= 5 && f < 14) { const h = F.handW('f'); FX.flame(h[0], h[1], F.colors.accent, 3, 8, 1.4); } },
};
addFollowup(KAZUMA, 'sp1', { btn: 'sp1', move: 'secondBlaze' });
KAZUMA.extraList = [['tcHammer', 'Burning Hammer (wall splat)', 'H → →+H'], ['secondBlaze', 'Second Blaze (launch)', 'Blazing Knuckle → SP1']];
KAZUMA.combos = [
  { name: 'Crimson Basics', notation: 'L → M → H → SP1 (Blazing Knuckle) → SP1 (Second Blaze)', seq: ['L', 'M', 'H', 'sp1', 'secondBlaze'] },
  { name: 'Burning Hammer', notation: 'L → H → →+H (Burning Hammer)', seq: ['L', 'H', 'tcHammer'] },
  { name: 'Air Inferno', notation: 'L+H → hold ↑ → air L → air M → air H', seq: ['LH', 'jL', 'jM', 'jH'] },
];

// ----------------------------------- YORU -----------------------------------
YORU.juggleMax = 8;
YORU.moves.needles = {
  name: 'THOUSAND NEEDLES', jp: '千本針', followup: 1, lvl: 2, st: 4, act: 12, rec: 10, dmg: 12, hits: 4, interval: 3, hs: 16, bs: 9, kb: 1.5,
  hb: { x: 10, y: -168, w: 82, h: 52 }, str: 1, poseRate: 0.7,
  poseFn: (F, f) => f <= 4 ? 'jab_w' : (f >> 1) % 2 ? 'jab' : 'slash',
  tick(F, f) { if (f > 4 && f < 16 && f % 3 === 0) Sound.play('kunai'); },
};
addFollowup(YORU, 'L', { btn: 'light', move: 'needles', cond: F => F.chainL >= 1 });
YORU.moves.shadowReturn = {
  name: 'SHADOW RETURN', jp: '影返し', followup: 1, lvl: 4.5, poses: ['crouch', 'upper'], st: 10, act: 5, rec: 20, dmg: 60, hs: 30, kb: 3, launch: -13, kd: 1,
  hb: { x: -5, y: -205, w: 98, h: 185 }, invuln: [1, 10], str: 3, sfx: 'slash', sw: { cx: 20, cy: -160, r: 80, a0: 1.2, a1: -1.6 },
  tick(F, f, O) {
    if (f === 2) { F.hidden = true; FX.dust(F.x, F.y - 80, 10, 'rgba(120,80,170,0.6)'); Sound.play('teleport'); }
    if (f === 9) { const side = O.x > F.x ? 1 : -1; F.x = clamp(O.x + side * 75, 50, STAGE_W - 50); F.facing = O.x > F.x ? 1 : -1; F.hidden = false; F.afterimage = 10; }
  },
};
addFollowup(YORU, 'sp2', { btn: 'sp2', move: 'shadowReturn' });
YORU.moves.jM.ajc = 1;
YORU.extraList = [['needles', 'Thousand Needles', 'L → L → L'], ['shadowReturn', 'Shadow Return (cross-up launch)', 'Shadow Step → SP2']];
YORU.combos = [
  { name: 'Needle Storm', notation: 'L → L → L (Thousand Needles) → H → SP2 (Shadow Step)', seq: ['L', 'L', 'needles', 'H', 'sp2'] },
  { name: 'Moon Drop', notation: 'L+H → hold ↑ → air M → ↑ (air jump cancel) → air M → air H', seq: ['LH', 'jM', 'jM', 'jH'] },
  { name: 'Shadow Return', notation: 'M → SP2 (Shadow Step) → SP2 (Shadow Return)', seq: ['M', 'sp2', 'shadowReturn'] },
];

// ----------------------------------- SERA -----------------------------------
SERA.juggleMax = 5;
SERA.moves.counter.reflect = 1;
SERA.moves.flurry = {
  name: 'STAFF FLURRY', jp: '杖舞', followup: 1, lvl: 2.5, st: 6, act: 12, rec: 14, dmg: 30, hits: 2, interval: 6, hs: 20, bs: 12, kb: 3,
  hb: { x: 10, y: -178, w: 118, h: 124 }, str: 2, sw: { cx: -10, cy: -130, r: 105, a0: -1.8, a1: 0.6, color: '#7fe9ff' },
  poseFn: (F, f) => f <= 6 ? 'swing_w' : f <= 12 ? 'swing' : f <= 18 ? { base: 'swing_w', t: 0.1 } : 'stance',
};
addFollowup(SERA, 'M', { btn: 'medium', move: 'flurry' });
SERA.moves.detonate = {
  name: 'DETONATE', jp: '爆砕', followup: 1, special: 1, lvl: 4, poses: ['cast', 'raise'], st: 4, act: 1, rec: 16, cd: 20, sfx: 'explosion',
  spawn: { f: 4, fn(F) {
    const o = BT.projs.find(p => p.owner === F && p.kind === 'orb' && !p.dead); if (!o) return;
    o.dead = true;
    BT.spawn({ owner: F, kind: 'blast', persist: 1, x: o.x, y: o.y, w: 230, h: 230, life: 14, dmg: 70, hs: 30, bs: 16, kb: 6, launch: -12, kd: 1, str: 3, clash: 0, color: '#ff7a2a', srcKey: 'detonate' });
    FX.shakeIt(12);
  } },
};
SERA.tryCustom = (F, inp, air, minLvl) => {
  if (inp.p('sp1') && !inp.p('sp2') && !inp.motion('qcf') && !inp.motion('qcb') && BT.projs.some(p => p.owner === F && p.kind === 'orb' && !p.dead) && F.canUse('detonate', air, Math.min(minLvl, 3))) {
    inp.use('sp1'); F.startMove('detonate'); return true;
  }
  return false;
};
EXTRA_PROJ.blast = {
  update(p) { if (p.t === 1) { for (let i = 0; i < 40; i++) FX.flame(p.x + rand(-90, 90), p.y + rand(-90, 90), '#ff7a1a', 1, 6, 2); FX.ring(p.x, p.y, '#ffd27a', 20, 170, 16, 8); FX.ring(p.x, p.y, '#7ff6ff', 10, 130, 14, 4); } },
  draw(g, p) {
    const k = 1 - p.life / p.max; g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, 140); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.4, 'rgba(255,170,60,0.7)'); gr.addColorStop(1, 'rgba(255,60,0,0)');
    g.globalAlpha = 1 - k; g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, 60 + 90 * easeOut(k), 0, TAU); g.fill();
  },
};
SERA.extraList = [['flurry', 'Staff Flurry', 'M → M'], ['detonate', 'Detonate (launch)', 'SP1 while Flame Orb is out']];
SERA.combos = [
  { name: 'Staff Weave', notation: 'M → M (Staff Flurry) → H → SP2 (Flame Ring)', seq: ['M', 'flurry', 'H', 'sp2'] },
  { name: 'Orb Detonation', notation: 'SP1 (Flame Orb) → when it hits: SP1 (Detonate)', seq: ['sp1', 'detonate'] },
  { name: 'Sky Staff', notation: 'L+H → hold ↑ → air L → air H', seq: ['LH', 'jL', 'jH'] },
];

// ----------------------------------- GORO -----------------------------------
GORO.juggleMax = 4;
GORO.moves.twinCleaver = {
  name: 'TWIN CLEAVER', jp: '双断', followup: 1, lvl: 3.5, poses: ['axe', { base: 'axe_w', t: 0.15, wa: 4.0 }], st: 12, act: 5, rec: 24, dmg: 105, hs: 28, bs: 18, kb: 15, kd: 1, ws: 1,
  hb: { x: 15, y: -218, w: 128, h: 212 }, str: 4, shake: 12, sw: { cx: 0, cy: -150, r: 118, a0: 0.7, a1: -2.0 },
};
addFollowup(GORO, 'H', { btn: 'heavy', move: 'twinCleaver' });
GORO.moves.oniToss = {
  name: 'ONI TOSS', jp: '鬼投げ', followup: 1, lvl: 4.5, poses: ['grab', 'grab'], st: 4, act: 8, rec: 26, dmg: 1, type: 'unblock', grab: 1, comboGrab: 1,
  hb: { x: -10, y: -230, w: 160, h: 230 }, str: 3,
  tick(F, f) { if (f <= 12) { F.vx = F.facing * 12; F.ctrlVel = true; } },
  onHit(F, D) { BT.startCine(F, D, CINE.goroToss, { zoom: 1.15 }); return true; },
};
addFollowup(GORO, 'sp1', { btn: 'sp2', move: 'oniToss' });
CINE.goroToss = function (A, D, f) {
  const dir = A.facing;
  if (f === 1) Sound.play('grab');
  if (f <= 14) { const t = f / 14; A.forcePose = 'lift'; D.x = A.x + dir * lerp(70, 10, t); D.y = GROUND - lerp(60, 185, t); D.forcePose = 'airhit'; }
  if (f === 22) {
    A.forcePose = { base: 'lunge', fa1: 1.7, fa2: 1.6, wa: 1.6 }; D.x = A.x + dir * 60; D.y = GROUND - 120;
    BT.scriptHit(A, D, 60, { str: 3 }); FX.speedlines(14, W / 2, H / 2, '#ffffff', 40); FX.wtext(D.x, D.y - 150, 'ONI TOSS!', { size: 36, color: '#fff', stroke: '#ff3b1f', life: 40 });
    BT.release(D, dir * 17, -7); D.canSplat = true; return true;
  }
};
GORO.extraList = [['twinCleaver', 'Twin Cleaver (wall splat)', 'H → H'], ['oniToss', 'Oni Toss (throws to the wall)', 'Oni Charge → SP2']];
GORO.combos = [
  { name: 'Twin Cleaver', notation: 'L → H → H (Twin Cleaver)', seq: ['L', 'H', 'twinCleaver'] },
  { name: 'Oni Toss', notation: 'SP1 (Oni Charge) → SP2 (Oni Toss)', seq: ['sp1', 'oniToss'] },
  { name: 'Avalanche', notation: 'L+H → hold ↑ → air H', seq: ['LH', 'jH'] },
];

// ---------------------------------- FROGS -----------------------------------
FROGS.juggleMax = 7;
FROGS.moves.frogRelay = {
  name: 'FROG RELAY', jp: '蛙リレー', followup: 1, lvl: 3.5, st: 6, act: 18, rec: 16, dmg: 30, hits: 2, interval: 9, hs: 22, bs: 12, kb: 3,
  hb: { x: 20, y: -150, w: 138, h: 132 }, str: 2, final: { dmg: 42, kd: 1, kb: 11, ws: 1, str: 3, shake: 7 },
  poseFn: (F, f) => f <= 6 ? { kx: 30, kp: 60, px: 40, py: 20 } : f <= 14 ? { kx: 40, kp: 90, px: 112, py: 40, pp: 1, pr: 1.0 } : f <= 26 ? { gp: 1.1, gr: 0.35, gx: 24, px: 60, py: -20 } : 'stance',
  tick(F, f) { if (f === 7) Sound.play('boing'); if (f === 15) Sound.play('croak'); },
};
addFollowup(FROGS, 'M', { btn: 'heavy', dir: 'f', move: 'frogRelay' });
FROGS.moves.tongueYank = {
  name: 'TONGUE YANK', jp: '舌落とし', followup: 1, lvl: 4.5, poses: ['snare_w', { kx: 30, kp: 210, kr: -0.95, ks: -0.2 }], st: 6, act: 7, rec: 12, dmg: 45, hs: 30, kb: 2, gb: 1, spike: 1,
  hb: { x: -10, y: -345, w: 195, h: 275 }, str: 3, shake: 8, sfx: 'slap',
  onHit(F, D) { D.vx = -F.facing * Math.min(6, Math.max(0, (Math.abs(D.x - F.x) - 70) / 14)); }, // yanks the victim back toward the frogs
};
addFollowup(FROGS, 'LH', { btn: 'sp1', move: 'tongueYank' });
FROGS.extraList = [['frogRelay', 'Frog Relay (wall splat)', 'M → →+H'], ['tongueYank', 'Tongue Yank (ground bounce)', 'Launcher → SP1']];
FROGS.combos = [
  { name: 'Trinity Chain', notation: 'L → M → →+H (Frog Relay) → SP2 (Triple Trouble)', seq: ['L', 'M', 'frogRelay', 'sp2'] },
  { name: 'Tongue Yank', notation: 'L+H → SP1 (Tongue Yank) → on bounce: H', seq: ['LH', 'tongueYank', 'H'] },
  { name: 'Low Cannon', notation: '↓L → ↓M → ↓→SP1 (Frog Cannon)', seq: ['cL', 'cM', 'sp1f'] },
];

// -------------------------------- CONDUCTOR ---------------------------------
CONDUCTOR.juggleMax = 6;
CONDUCTOR.moves.semaphore = {
  name: 'SEMAPHORE RUSH', jp: '信号連打', followup: 1, lvl: 3.5, st: 5, act: 18, rec: 18, dmg: 24, hits: 3, interval: 6, hs: 22, bs: 12, kb: 3,
  hb: { x: 10, y: -198, w: 142, h: 128 }, str: 2, final: { dmg: 45, kb: 13, ws: 1, kd: 1, str: 3, shake: 8 },
  poseFn: (F, f) => f <= 5 ? 'jab_w' : f <= 11 ? 'jabC' : f <= 17 ? 'thrust' : f <= 26 ? 'swingC' : 'stance',
  tick(F, f) { if (f === 6 || f === 12 || f === 18) Sound.play('clack'); },
};
addFollowup(CONDUCTOR, 'M', { btn: 'heavy', dir: 'f', move: 'semaphore' });
CONDUCTOR.moves.throughTrain = {
  name: 'THROUGH TRAIN', jp: '通過列車', followup: 1, special: 1, lvl: 4.5, poses: ['whistle', 'point'], st: 6, act: 1, rec: 22, sfx: 'whistle',
  spawn: { f: 6, fn(F) { BT.spawn({ owner: F, kind: 'train', persist: 1, crush: 1, x: F.x - F.facing * 220, y: GROUND - 78, vx: F.facing * 19, w: 250, h: 150, dmg: 58, hs: 30, bs: 16, kb: 20, launch: -6, kd: 1, ws: 1, life: 80, str: 3, clash: 0, color: '#ff2a3a' }); Sound.play('trainRumble'); Sound.play('horn'); } },
};
addFollowup(CONDUCTOR, 'sp2', { btn: 'sp1', move: 'throughTrain' });
Object.assign(CONDUCTOR.moves.LH, { name: 'Pantograph Upper', tick(F, f) { if (f > 9 && f < 14) { const h = F.handW('f'); FX.p({ type: 'bolt', x: h[0], y: h[1], x2: h[0] + rand(-30, 30), y2: h[1] - rand(40, 90), size: 2, life: 5, color: '#ffffff' }); } } });
CONDUCTOR.extraList = [['semaphore', 'Semaphore Rush (wall splat)', 'M → →+H'], ['throughTrain', 'Through Train (carries to wall)', 'Express Delivery → SP1']];
CONDUCTOR.combos = [
  { name: 'Timetable', notation: 'L → M → →+H (Semaphore Rush)', seq: ['L', 'M', 'semaphore'] },
  { name: 'Express Line', notation: 'SP2 (Express Delivery) → SP1 (Through Train)', seq: ['sp2', 'throughTrain'] },
  { name: 'Pantograph', notation: 'L+H (Pantograph Upper) → hold ↑ → air L → air H', seq: ['LH', 'jL', 'jH'] },
];
