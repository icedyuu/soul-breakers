// ============================ JACKPOT — THE GAMBLER ============================
// Technical / trickster / high-risk high-reward. An arrogant supernatural casino antagonist in a dark suit, fedora and
// black gloves with gold suit marks. Fights with cards, dice, chips, a coin and a revolver.
// System: LUCK 0–100 (JP_CFG below — every number for balancing lives there).
//   · built by landing attacks (normals, specials, long combos); decays slowly when he stops landing hits
//   · every GAMBLING ability rolls BAD / NORMAL / GOOD / JACKPOT; LUCK lowers the bad odds and raises the jackpot odds
//   · hidden PITY: every bad roll quietly improves the next ones (reset by a jackpot)
//   · HOT STREAK (0–3 pips): lucky rolls (dice 6, Double or Nothing WIN, a Royal Flush) raise the next jackpot odds
//   · at 100 LUCK the next gambling ability is a guaranteed JACKPOT (it spends the LUCK); ALL IN spends LUCK for damage
// Determinism: every roll uses Math.random() inside the simulation, which online play and replays swap for the seeded
// NetRng (09b_net.js / 09i_replay.js), so lockstep and replays stay in sync. Draw code never rolls.
const JP = '#ffcf3a', JP2 = '#c8102e', JPD = '#160a0e', JPW = '#fff4d0', JPG = '#1d7a48';
const JP_CFG = {
  max: 100, start: 20,                              // LUCK cap / LUCK at round start
  gain: { lvl: [0, 2, 3, 4], special: 5, proj: 3, ult: 0, combo: 1, comboFrom: 3 },   // per hit; +combo from the Nth hit of a combo
  decayAfter: 480, decay: 0.03,                      // frames without a gain before LUCK drains, drain per frame
  odds: {                                             // generic modifiers (per LUCK point / pity step / HOT pip)
    luckBad: 0.0026, luckGood: 0.0015, luckJack: 0.0012,
    pityBad: 0.07, pityJack: 0.03, pityMax: 4, hotJack: 0.05, hotMax: 3, minBad: 0.04, maxJack: 0.45,
  },
  ab: {                                               // base odds per gambling ability at 0 LUCK (normal = the rest)
    dice:     { bad: 0.33, good: 0.30, jack: 0.03 },  // 1–2 / 3–4 / 5–6 / golden 6
    flush:    { bad: 0.32, good: 0.16, jack: 0.03 },  // 1 face card / 2 face cards / ROYAL FLUSH / golden Royal Flush
    don:      { bad: 0.45, good: 0.00, jack: 0.05 },  // LOSE / WIN / – / ALL ACES
    roulette: { bad: 0.34, good: 0.20, jack: 0.04 },  // *click* / BANG / BANG+ / EXECUTION
    house:    { bad: 0.30, good: 0.22, jack: 0.04 },  // cold BLACK / RED or BLACK / GREEN / golden JACKPOT
  },
  cost: { roulette: 15, house: 10 },                  // LUCK spent when the ability is used (after its roll)
  dice: {   // per face: damage and hit properties (J = jackpot golden six)
    1: { dmg: 24, hs: 12, kb: 2 }, 2: { dmg: 30, hs: 13, kb: 2.5 }, 3: { dmg: 48, hs: 19, kb: 3.5 }, 4: { dmg: 54, hs: 21, kb: 4 },
    5: { dmg: 70, hs: 22, kb: 10 }, 6: { dmg: 88, hs: 26, kb: 6, kd: 1 }, J: { dmg: 118, hs: 30, kb: 7, launch: -10 },
  },
  card: { num: 12, face: 18, ace: 22, ten: 16, gold: 1.4, royal: 55, royalJ: 80 },
  don: { win: [360, 1.15, 0.12], jack: [420, 1.30, 0.25], lose: [240, 0.85, 0], loseDef: 1.15 },   // [frames, dmg mult, haste]
  roulette: { dmg: 100, good: 115, exec: 55 },
  house: { red: 85, black: 16, cold: 13, green: 112, jack: 150, r: 150, rJ: 220 },
  allIn: { mid: 30, high: 70 },                       // LUCK thresholds: < mid = small bet, < high = medium, < max = high, max = JACKPOT
};

// ---------------------------------- props (shared by hands, projectiles, HUD and cinematics) ----------------------------------
const JP_SUITS = ['♠', '♥', '♦', '♣'];
function jpChip(g, x, y, r, sq, col, R) {   // a poker chip; sq = vertical squash (spin)
  g.save(); g.translate(x, y); g.scale(1, Math.max(0.12, sq));
  g.fillStyle = R && R.mono || col || JP2; g.strokeStyle = OUTLINE; g.lineWidth = 1.6 / Math.max(0.3, sq);
  g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); if (!(R && R.mono)) g.stroke();
  if (!(R && R.mono)) {
    g.fillStyle = '#f4f0ea'; for (let i = 0; i < 6; i++) { const a = i * TAU / 6; g.beginPath(); g.arc(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78, r * 0.16, 0, TAU); g.fill(); }
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, r * 0.52, 0, TAU); g.stroke();
    g.fillStyle = JP; g.beginPath(); g.arc(0, 0, r * 0.22, 0, TAU); g.fill();
  }
  g.restore();
}
function jpCoin(g, x, y, r, spin, R, glow) {   // spin: 0..TAU → width
  const w = Math.max(0.1, Math.abs(Math.cos(spin)));
  g.save(); g.translate(x, y);
  if (glow && FX.hq) { g.shadowColor = JP; g.shadowBlur = 12; }
  g.fillStyle = R && R.mono || JP; g.strokeStyle = '#7a5410'; g.lineWidth = 1.4;
  g.beginPath(); g.ellipse(0, 0, r * w, r, 0, 0, TAU); g.fill(); g.shadowBlur = 0; if (!(R && R.mono)) g.stroke();
  if (!(R && R.mono) && w > 0.35) { g.fillStyle = '#fff2b0'; g.beginPath(); g.ellipse(-r * 0.25 * w, -r * 0.3, r * 0.3 * w, r * 0.18, -0.4, 0, TAU); g.fill(); g.strokeStyle = '#b07c14'; g.beginPath(); g.ellipse(0, 0, r * 0.62 * w, r * 0.62, 0, 0, TAU); g.stroke(); }
  g.restore();
}
const JP_PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
function jpDie(g, x, y, s, face, rot, gold, R) {   // a glowing supernatural die (front face + a hint of two sides)
  g.save(); g.translate(x, y); g.rotate(rot || 0);
  const m = R && R.mono, h = s / 2;
  if (!m && FX.hq) { g.shadowColor = gold ? JP : '#ff4060'; g.shadowBlur = 14; }
  g.fillStyle = m || (gold ? '#ffd858' : '#fbf6ee'); g.strokeStyle = OUTLINE; g.lineWidth = 2;
  g.beginPath(); g.moveTo(-h + 4, -h); g.lineTo(h - 4, -h); g.quadraticCurveTo(h, -h, h, -h + 4); g.lineTo(h, h - 4); g.quadraticCurveTo(h, h, h - 4, h); g.lineTo(-h + 4, h); g.quadraticCurveTo(-h, h, -h, h - 4); g.lineTo(-h, -h + 4); g.quadraticCurveTo(-h, -h, -h + 4, -h); g.closePath();
  g.fill(); g.shadowBlur = 0; if (m) { g.restore(); return; } g.stroke();
  g.fillStyle = gold ? 'rgba(160,100,0,0.35)' : 'rgba(120,20,40,0.18)'; g.fillRect(h * 0.35, -h + 2, h * 0.62, s - 4);
  const pc = gold ? JP2 : (face === 1 ? JP2 : '#1a0a10'), pr = s * 0.09;
  for (const [px, py] of JP_PIPS[face] || JP_PIPS[1]) { g.fillStyle = pc; g.beginPath(); g.arc(px * s * 0.26, py * s * 0.26, face === 1 ? pr * 1.5 : pr, 0, TAU); g.fill(); }
  if (FX.hq) { g.globalCompositeOperation = 'lighter'; g.fillStyle = gold ? 'rgba(255,220,90,0.35)' : 'rgba(255,60,90,0.22)'; for (const [px, py] of JP_PIPS[face] || JP_PIPS[1]) { g.beginPath(); g.arc(px * s * 0.26, py * s * 0.26, pr * 1.9, 0, TAU); g.fill(); } }
  g.restore();
}
function jpCard(g, x, y, w, h, rank, suit, gold, rot, R) {   // a playing card (rank '' = back)
  g.save(); g.translate(x, y); g.rotate(rot || 0);
  const m = R && R.mono;
  if (!m && gold && FX.hq) { g.shadowColor = JP; g.shadowBlur = 10; }
  g.fillStyle = m || (gold ? '#ffe590' : '#fbf8f2'); g.strokeStyle = gold ? '#8a6010' : OUTLINE; g.lineWidth = 1.4;
  g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.fill(); g.shadowBlur = 0;
  if (m) { g.restore(); return; }
  g.stroke();
  if (!rank) { g.fillStyle = JP2; g.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4); g.strokeStyle = JP; g.lineWidth = 1; g.strokeRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8); g.restore(); return; }
  const red = suit === 1 || suit === 2, col = gold ? '#7a1010' : red ? '#d0102a' : '#16101a';
  g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `900 ${Math.round(h * 0.3)}px ${FONT_UI}`; g.fillText(rank, -w * 0.22, -h * 0.28);
  g.font = `900 ${Math.round(h * 0.42)}px ${FONT_UI}`; g.fillText(JP_SUITS[suit] || '♠', w * 0.06, h * 0.12);
  if ('JQKA'.includes(rank) && rank.length === 1) { g.strokeStyle = gold ? '#b07c14' : JP; g.lineWidth = 1; g.strokeRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6); }
  g.textBaseline = 'alphabetic';
  g.restore();
}
function jpGun(g, P, ang, c, R, gold) {   // a long-barrel supernatural revolver
  g.save(); g.translate(P[0], P[1]); g.rotate(ang);
  const m = R.mono, metal = m || (gold ? '#e8b830' : c.gun || '#2c2a34'), trim = m || (gold ? '#fff2b0' : c.gun2 || JP);
  poly(g, [[-4, -3], [40, -3.5], [40, 2.5], [-2, 3]], metal, R, 1.6);             // barrel
  poly(g, [[-6, -6], [10, -6], [12, 5], [-6, 6]], metal, R, 1.6);                  // frame
  if (!m) { g.fillStyle = trim; g.beginPath(); g.ellipse(4, 0, 6, 5.5, 0, 0, TAU); g.fill(); g.strokeStyle = OUTLINE; g.lineWidth = 1; g.stroke(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6; g.fillStyle = '#1a1418'; g.beginPath(); g.arc(4 + Math.cos(a) * 3, Math.sin(a) * 3, 1, 0, TAU); g.fill(); } }
  poly(g, [[-6, 2], [-2, 4], [-12, 16], [-18, 14]], m || '#5a1018', R, 1.6);        // grip
  if (!m) { g.strokeStyle = trim; g.lineWidth = 1.2; g.beginPath(); g.moveTo(6, -3.4); g.lineTo(38, -3.4); g.stroke(); g.beginPath(); g.arc(-3, 6, 4, 0.3, 2.4); g.strokeStyle = OUTLINE; g.stroke(); }
  g.restore();
}
function jpStack(g, x, y, n, R) { for (let i = 0; i < n; i++) jpChip(g, x, y - i * 3.2, 7, 0.38, i % 2 ? '#16141a' : JP2, R); }

// ---------------------------------- face + art ----------------------------------
// c.ex: null (smug, half-lidded) · 'grin' (big winning grin) · 'shock' (bad luck) · 'cold' (focused, aiming)
function jpFace(g, r, c, o) {
  let e = c.ex || null; const oe = o.expr;
  if (oe === 'hurt' || oe === 'ko') { chibiFace(g, r, c, o); return; }
  if (oe === 'grin' && !e) e = 'grin';
  const ex = 0.5 * r, ey = 0.25 * r, fx = 0.94 * r;
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  if (e === 'grin') {   // eyes closed in a smug happy arc
    g.strokeStyle = OUTLINE; g.lineWidth = 0.08 * r; g.beginPath();
    g.moveTo(ex - 0.2 * r, ey + 0.06 * r); g.quadraticCurveTo(ex, ey - 0.16 * r, ex + 0.2 * r, ey + 0.06 * r);
    g.moveTo(fx - 0.07 * r, ey + 0.05 * r); g.quadraticCurveTo(fx, ey - 0.1 * r, fx + 0.07 * r, ey + 0.05 * r); g.stroke();
  } else {
    const oo = { ...o, glow: o.glow };
    chibiEye(g, fx, ey - 0.01 * r, 0.075 * r, 0.3 * r, c, oo, true);
    chibiEye(g, ex, ey, 0.23 * r, e === 'shock' ? 0.4 * r : 0.36 * r, c, oo, false);
    if (e !== 'shock') {   // heavy, confident upper lids (lower for 'cold')
      const k = e === 'cold' ? 0.62 : 0.42;
      g.fillStyle = c.skin; g.beginPath(); g.ellipse(ex, ey - 0.36 * r * (1.25 - k), 0.32 * r, 0.36 * r * k, 0, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(fx, ey - 0.3 * r * (1.25 - k), 0.12 * r, 0.3 * r * k, 0, 0, TAU); g.fill();
      g.strokeStyle = OUTLINE; g.lineWidth = 0.07 * r; g.beginPath(); g.moveTo(ex - 0.26 * r, ey - 0.36 * r * (1.25 - k) + 0.36 * r * k * 0.8); g.quadraticCurveTo(ex, ey - 0.36 * r * (1.25 - k) + 0.36 * r * k * 1.1, ex + 0.25 * r, ey - 0.36 * r * (1.25 - k) + 0.36 * r * k * 0.7); g.stroke();
    } else { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(ex + 0.02 * r, ey, 0.06 * r, 0, TAU); g.fill(); }
  }
  // brows: one cocked up (smug), both up (shock), flat & low (cold)
  g.strokeStyle = c.brow || OUTLINE; g.lineWidth = 0.055 * r; g.beginPath();
  if (e === 'shock') { g.moveTo(ex - 0.22 * r, ey - 0.62 * r); g.quadraticCurveTo(ex, ey - 0.76 * r, ex + 0.22 * r, ey - 0.64 * r); }
  else if (e === 'cold') { g.moveTo(ex - 0.22 * r, ey - 0.5 * r); g.lineTo(ex + 0.24 * r, ey - 0.42 * r); }
  else { g.moveTo(ex - 0.22 * r, ey - 0.5 * r); g.quadraticCurveTo(ex - 0.02 * r, ey - 0.7 * r, ex + 0.24 * r, ey - 0.6 * r); }
  g.stroke();
  // mouth
  const mx = 0.72 * r, my = 0.72 * r; g.strokeStyle = OUTLINE; g.lineWidth = 0.05 * r;
  if (e === 'grin') {
    g.fillStyle = '#4a1020'; g.beginPath(); g.moveTo(mx - 0.16 * r, my - 0.06 * r); g.quadraticCurveTo(mx, my + 0.16 * r, mx + 0.16 * r, my - 0.1 * r); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(mx - 0.14 * r, my - 0.05 * r); g.lineTo(mx + 0.14 * r, my - 0.09 * r); g.lineTo(mx + 0.1 * r, my - 0.03 * r); g.lineTo(mx - 0.1 * r, my); g.closePath(); g.fill();
  } else if (e === 'shock') { g.fillStyle = '#4a1020'; g.beginPath(); g.ellipse(mx, my + 0.02 * r, 0.06 * r, 0.08 * r, 0, 0, TAU); g.fill(); g.stroke(); }
  else { g.beginPath(); g.moveTo(mx - 0.1 * r, my + 0.02 * r); g.quadraticCurveTo(mx + 0.02 * r, my + 0.06 * r, mx + 0.13 * r, my - 0.06 * r); g.stroke(); }   // the smirk
  g.restore();
}
const JACKPOT = {
  id: 'jackpot', name: 'JACKPOT', jp: 'ジャックポット', title: 'The Gambler', titleJp: '賭博師',
  style: 'TECHNICAL / TRICKSTER', desc: 'An arrogant, charismatic supernatural gambler who treats every fight like a casino game. He builds LUCK with every hit and bets it on dice, cards, a coin, a revolver and a roulette wheel. He doesn\'t trust luck. He manipulates the odds.',
  stats: { power: 4, speed: 3, range: 3, defense: 2 },
  scale: 1.0, health: 960, walk: 4.3, backWalk: 3.8, jumpV: -17, jumpX: 4.8, dashV: 13.5, backdashV: 10.5, backdashInv: 9, juggleMax: 6,
  voicePitch: 0.82, voiceRate: 0.95,
  colors: {
    skin: '#f6e2d4', hair: '#30101a', hair2: '#401822', streak: JP, top: '#2e2c3a', uarm: '#2e2c3a', farm: '#2e2c3a', cuff: '#f4f0ea', hand: '#16121a',
    leg: '#24222e', boot: '#0e0c10', foot: '#0e0c10', warm: '#24222e', sole: JP2, pad: JP,
    eye: '#ffb020', eye2: '#5a2000', brow: '#30101a', accent: JP, collar: '#f4f0ea', male: 1,
    vest: '#7a0c1c', vest2: '#4a0610', shirt: '#f4f0ea', tie: JP2, lining: JP2, hat: '#17151b', hat2: JP2, lapel: '#16141a', gun: '#2c2a34', gun2: JP,
    ex: null, prop: null,
  },
  afterColors: [JP, JP2, '#ffffff'],
  hurt: { w: 50, h: 170 },
  stance: { t: 0.02, hd: 0.12, fa1: 0.35, fa2: 2.25, ba1: -0.12, ba2: 0.55, fl1: 0.3, fl2: 0.06, bl1: -0.24, bl2: -0.1 },
  poses: {
    flick_w: { t: -0.04, hd: 0.06, fa1: 0.1, fa2: 2.9, ba1: 0.1, ba2: 0.5 },
    flick: { t: 0.22, hd: 0.12, fa1: 1.62, fa2: 1.7, ba1: -0.35, ba2: 0.1, fl1: 0.5, bl1: -0.4 },
    toss_w: { t: -0.12, hd: 0.0, fa1: -0.75, fa2: -0.45, ba1: 0.5, ba2: 1.1, fl1: 0.32, bl1: -0.42 },
    toss: { t: 0.24, hd: 0.16, fa1: 1.95, fa2: 2.0, ba1: -0.4, ba2: 0.2, fl1: 0.58, bl1: -0.46 },
    fan_w: { t: -0.06, hd: 0.08, fa1: 0.9, fa2: 2.7, ba1: 0.75, ba2: 2.5 },
    fan: { t: 0.32, hd: 0.14, fa1: 1.45, fa2: 1.5, ba1: -0.55, ba2: -0.2, fl1: 0.62, bl1: -0.46 },
    coin_flip: { t: -0.02, hd: 0.02, fa1: 0.95, fa2: 2.95, ba1: -0.15, ba2: 0.55 },
    coin_look: { t: -0.1, hd: -0.42, fa1: 0.85, fa2: 2.4, ba1: -0.15, ba2: 0.55 },
    coin_catch: { t: 0.06, hd: 0.36, fa1: 0.75, fa2: 2.0, ba1: -0.15, ba2: 0.55 },
    slump: { t: 0.42, hd: 0.5, fa1: 0.1, fa2: 0.2, ba1: -0.05, ba2: 0.1, fl1: 0.45, fl2: 0.1, bl1: -0.2, bl2: -0.1 },
    aim_w: { t: 0.0, hd: 0.1, fa1: 0.6, fa2: 2.9, ba1: 0.2, ba2: 0.8 },
    aim: { t: 0.08, hd: 0.08, fa1: 1.57, fa2: 1.58, ba1: 0.25, ba2: 0.9, fl1: 0.42, bl1: -0.36 },
    recoil: { t: -0.12, hd: -0.06, fa1: 2.05, fa2: 2.3, ba1: 0.2, ba2: 0.8, fl1: 0.36, bl1: -0.4 },
    click: { t: 0.0, hd: 0.3, fa1: 1.2, fa2: 1.6, ba1: 0.3, ba2: 1.2 },
    twirl: { t: 0.0, hd: -0.1, fa1: 2.8, fa2: 3.05, ba1: -0.2, ba2: 0.5 },
    snap_w: { t: -0.04, hd: 0.0, fa1: 0.5, fa2: 2.8, ba1: -0.1, ba2: 0.5 },
    snap: { t: 0.06, hd: 0.14, fa1: 1.25, fa2: 2.75, ba1: -0.15, ba2: 0.55 },
    allin_w: { t: -0.2, hd: -0.1, fa1: 2.5, fa2: 2.9, ba1: 2.3, ba2: 2.8 },
    allin: { t: 0.42, hd: 0.1, fa1: 1.52, fa2: 1.56, ba1: 1.32, ba2: 1.42, fl1: 0.72, bl1: -0.52 },
    rush: { t: 0.55, hd: -0.2, fa1: -0.5, fa2: -0.3, ba1: -0.8, ba2: -0.5, fl1: 0.95, fl2: 0.2, bl1: -0.7, bl2: -0.9, hipH: 74 },
    gloves: { t: 0.02, hd: 0.38, fa1: 0.7, fa2: 2.15, ba1: 0.95, ba2: 2.05 },
    tip_hat: { t: 0.0, hd: 0.22, fa1: 1.05, fa2: 3.05, ba1: -0.12, ba2: 0.55 },
    sit: { ground: 0, hipH: 58, t: -0.06, hd: 0.08, fl1: 1.45, fl2: 0.05, bl1: 1.38, bl2: 0.0, fa1: 1.25, fa2: 1.75, ba1: 1.0, ba2: 1.6 },
    celebrate: { t: -0.04, hd: -0.18, fa1: 2.4, fa2: 2.85, ba1: 2.1, ba2: 2.55, fl1: 0.2, bl1: -0.2 },
    defeat: { base: 'kneel', hd: 0.55, fa1: 0.95, fa2: 1.9, ba1: 0.1, ba2: 0.2 },
    intro: { t: 0.0, hd: 0.2, fa1: 1.05, fa2: 3.05, ba1: -0.12, ba2: 0.55, fl1: 0.18, fl2: 0.04, bl1: -0.1, bl2: -0.18 },
    victory: { t: -0.04, hd: -0.16, fa1: 0.95, fa2: 2.95, ba1: -0.15, ba2: 0.55, fl1: 0.16, fl2: 0.04, bl1: -0.08, bl2: -0.2 },
    dive: { base: 'jump', t: 0.5, hd: 0.3, fa1: 2.3, fa2: 2.1 },
  },
  intro: 'Place your bets. The house is open.',
  wins: ['Never bet against the house. I AM the house.', 'Lady Luck? She works for me.', 'Thanks for the chips. Come back when you can afford to lose.'],
  ropes: [
    { id: 'tie', at: sk => [sk.neck[0] + 4, sk.neck[1] + 6], n: 4, seg: 7, w0: 6, w1: 4, color: 'tie', grav: 0.4, wind: 0.6 },
  ],
  hairBack(g, r, c, R) {   // slicked-back hair with a short tail at the nape
    polyR(g, r, [[0.4, -0.94], [-0.3, -1.12], [-0.98, -0.82], [-1.24, -0.2], [-1.18, 0.42], [-1.36, 0.62], [-0.94, 0.66], [-0.52, 0.3]], c.hair, R);
  },
  hairFront(g, r, c, R) {
    skullHair(g, r, c, R);
    polyR(g, r, [[-0.6, -0.92], [0.12, -1.06], [0.82, -0.86], [1.1, -0.5], [0.92, -0.42], [0.6, -0.62], [0.2, -0.66], [-0.3, -0.62]], c.hair, R);
    polyR(g, r, [[0.66, -0.7], [0.9, -0.44], [0.96, 0.02], [0.84, 0.16], [0.8, -0.24], [0.64, -0.46]], c.streak, R);   // the golden lock
    // fedora: brim, crown, red band with a tucked ace of spades
    if (c.cos === 'jackpot') return;   // the HIGH ROLLER arcade skin wears a top hat instead (09cz_arcade.js)
    g.save(); g.translate(0.04 * r, -0.66 * r); g.rotate(-0.1);
    g.beginPath(); g.ellipse(0.05 * r, 0, 1.42 * r, 0.24 * r, 0, 0, TAU); if (!R.mono) { g.strokeStyle = OUTLINE; g.lineWidth = R.ol * 2; g.stroke(); } g.fillStyle = R.mono || c.hat; g.fill();
    g.restore();
    polyR(g, r, [[-0.9, -0.78], [-0.86, -1.32], [-0.5, -1.62], [-0.08, -1.48], [0.3, -1.64], [0.78, -1.36], [0.88, -0.86]], c.hat, R);
    if (R.mono) return;
    g.fillStyle = c.hat2; g.beginPath(); g.moveTo(-0.9 * r, -0.98 * r); g.quadraticCurveTo(0, -0.9 * r, 0.9 * r, -1.0 * r); g.lineTo(0.88 * r, -0.82 * r); g.quadraticCurveTo(0, -0.72 * r, -0.9 * r, -0.8 * r); g.closePath(); g.fill();
    jpCard(g, -0.66 * r, -1.08 * r, 0.32 * r, 0.44 * r, 'A', 0, false, -0.35, R);
    g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 0.06 * r; g.beginPath(); g.moveTo(-0.5 * r, -1.46 * r); g.quadraticCurveTo(-0.1 * r, -1.36 * r, 0.3 * r, -1.5 * r); g.stroke();
  },
  neckWear(g, sk, p, c, R) {   // white shirt collar points + tie knot
    const n = sk.neck;
    poly(g, [[n[0] - 9, n[1] + 4], [n[0] - 6, n[1] - 6], [n[0] + 2, n[1] + 2], [n[0] - 2, n[1] + 9]], R.mono || c.collar, R, 2);
    poly(g, [[n[0] + 11, n[1] + 4], [n[0] + 8, n[1] - 6], [n[0] + 1, n[1] + 2], [n[0] + 5, n[1] + 9]], R.mono || c.collar, R, 2);
    poly(g, [[n[0] - 1, n[1] + 1], [n[0] + 5, n[1] + 1], [n[0] + 4, n[1] + 7], [n[0], n[1] + 7]], R.mono || c.tie, R, 1.6);
  },
  torsoDetail(g, L, bw, c) {   // open jacket: waistcoat + white shirt + red tie in the opening, gold-edged lapels, buttons, a watch chain
    g.fillStyle = c.vest; g.beginPath(); g.moveTo(-1 * bw, -L * 0.9); g.lineTo(14 * bw, -L * 0.86); g.lineTo(12 * bw, -L * 0.02); g.lineTo(-3 * bw, 0); g.closePath(); g.fill();
    g.fillStyle = c.shirt; g.beginPath(); g.moveTo(-1 * bw, -L * 1.0); g.lineTo(14 * bw, -L * 0.96); g.lineTo(7 * bw, -L * 0.36); g.closePath(); g.fill();
    g.fillStyle = c.tie; g.beginPath(); g.moveTo(5 * bw, -L * 0.94); g.lineTo(9 * bw, -L * 0.94); g.lineTo(9.6 * bw, -L * 0.4); g.lineTo(7 * bw, -L * 0.3); g.lineTo(4.6 * bw, -L * 0.4); g.closePath(); g.fill();
    g.fillStyle = c.lapel; g.beginPath(); g.moveTo(-3 * bw, -L * 1.0); g.lineTo(3 * bw, -L * 0.42); g.lineTo(-1 * bw, -L * 0.16); g.lineTo(-7 * bw, -L * 0.9); g.closePath(); g.fill();
    g.strokeStyle = JP; g.lineWidth = 1.1; g.beginPath(); g.moveTo(-3 * bw, -L * 1.0); g.lineTo(3 * bw, -L * 0.42); g.lineTo(-1 * bw, -L * 0.16); g.stroke();
    g.fillStyle = c.lapel; g.beginPath(); g.moveTo(15 * bw, -L * 0.94); g.lineTo(11 * bw, -L * 0.42); g.lineTo(13 * bw, -L * 0.16); g.lineTo(17 * bw, -L * 0.8); g.closePath(); g.fill();
    g.strokeStyle = JP; g.beginPath(); g.moveTo(15 * bw, -L * 0.94); g.lineTo(11 * bw, -L * 0.42); g.lineTo(13 * bw, -L * 0.16); g.stroke();
    g.fillStyle = JP; for (const y of [0.3, 0.19, 0.08]) { g.beginPath(); g.arc(7 * bw, -L * y, 1.5, 0, TAU); g.fill(); }
    g.strokeStyle = JP; g.lineWidth = 1.2; g.beginPath(); g.moveTo(7 * bw, -L * 0.19); g.quadraticCurveTo(2 * bw, -L * 0.08, 11 * bw, -L * 0.06); g.stroke();
    g.fillStyle = c.lining; g.beginPath(); g.moveTo(-10 * bw, -L * 0.7); g.lineTo(-5 * bw, -L * 0.72); g.lineTo(-7 * bw, -L * 0.6); g.closePath(); g.fill();   // pocket square
  },
  drawSkirt(g, sk, p, c, R, o) {   // short jacket tails with red lining
    const T = (o && o.T) || 0, h = sk.hip, ky = Math.max(sk.fk[1], sk.bk[1]), sw = Math.sin(T * 0.09) * 2, lean = clamp(p.t || 0, -0.5, 0.8), back = -lean * 14;
    const len = Math.max(16, (ky - h[1]) * 0.62);
    poly(g, [[h[0] - 13, h[1] - 8], [h[0] - 24 + sw + back, h[1] + len], [h[0] - 4 + back * 0.5, h[1] + len + 3], [h[0] + 2, h[1] + 2]], R.mono || c.lining, R, 2);
    poly(g, [[h[0] - 15, h[1] - 9], [h[0] - 28 + sw + back, h[1] + len - 3], [h[0] - 10 + sw * 0.6 + back * 0.6, h[1] + len + 1], [h[0] - 2, h[1] + 4], [h[0] + 6, h[1] + len * 0.6], [h[0] + 15 + sw * 0.4, h[1] + len - 4], [h[0] + 14, h[1] - 9]], R.mono || c.top, R, 2.2);
  },
  shoulderOver(g, sk, p, c, R) {   // the black gloves' gold diamond mark
    if (R.mono) return;
    const h = sk.fh; g.fillStyle = JP; g.strokeStyle = OUTLINE; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(h[0], h[1] - 3.6); g.lineTo(h[0] + 2.6, h[1]); g.lineTo(h[0], h[1] + 3.6); g.lineTo(h[0] - 2.6, h[1]); g.closePath(); g.fill(); g.stroke();
  },
  weaponFront(g, sk, p, c, R, o) {
    const pr = c.prop; if (!pr) return;
    const h = sk.fh, T = (o && o.T) || 0, a = Math.atan2(sk.fh[1] - sk.fe[1], sk.fh[0] - sk.fe[0]);
    if (pr === 'chip') { const k = (T % 70) / 70, up = k < 0.5 ? Math.sin(k * 2 * Math.PI) * 16 : 0; jpChip(g, h[0] + 2, h[1] - 9 - up, 6.5, up > 0 ? Math.cos(T * 0.6) : 0.4, JP2, R); }
    else if (pr === 'card') jpCard(g, h[0] + Math.cos(a) * 10, h[1] + Math.sin(a) * 10, 13, 18, 'A', 0, false, a + 0.3, R);
    else if (pr === 'fan') { for (let i = 0; i < 5; i++) jpCard(g, h[0] + 4, h[1] - 8, 13, 18, ['10', 'J', 'Q', 'K', 'A'][i], 1, c.gold, -0.7 + i * 0.32, R); }
    else if (pr === 'dice') jpDie(g, h[0] + 3, h[1] - 6, 14, 6, T * 0.05, c.gold, R);
    else if (pr === 'coin') jpCoin(g, h[0] + 2, h[1] - 9, 6, T * 0.1, R, true);
    else if (pr === 'gun') jpGun(g, [h[0], h[1]], a, c, R, c.gold);
    else if (pr === 'stack') jpStack(g, h[0] + 2, h[1] - 6, 4, R);
  },
};
makeChibi(JACKPOT, { build: { arm: 1.0, leg: 1.0, torso: 1.04 }, colors: {} });
JACKPOT.faceFn = jpFace;
JACKPOT.colors.belt = null;

// ---------------------------------- LUCK ----------------------------------
const JP_PAL = {};
JACKPOT.palette = F => {
  const key = (F.jpProp || '') + '|' + (F.jpEx || '') + (F.donT > 0 && F.donK === 'jack' ? 'g' : '');
  return JP_PAL[key] || (JP_PAL[key] = { ...JACKPOT.colors, prop: F.jpProp || null, ex: F.jpEx || null, gold: key.endsWith('g') });
};
const jpMax = F => (F.luck || 0) >= JP_CFG.max;
function jpGain(F, n, label) {
  if (!F || F.ko || n <= 0 || F.ch.id !== 'jackpot') return;
  const was = F.luck;
  F.luck = clamp((F.luck || 0) + n, 0, JP_CFG.max); F.luckT = F.T;
  if (label) FX.wtext(F.x, F.y - 236 * F.s, label, { size: 18, color: JP, stroke: JPD, life: 28 });
  if (was < JP_CFG.max && F.luck >= JP_CFG.max) jpMaxFx(F);
}
function jpMaxFx(F) {
  FX.ring(F.x, F.y - 110, JP, 20, 260, 24, 6); FX.ring(F.x, F.y - 110, '#ffffff', 10, 140, 16, 3);
  FX.wtext(F.x, F.y - 262, 'MAX LUCK', { size: 34, color: '#ffffff', stroke: '#a06a00', life: 60 });
  FX.wtext(F.x, F.y - 226, 'NEXT BET: JACKPOT', { size: 18, color: JP, stroke: JPD, life: 60 });
  Sound.play('jackpot', 0.5);
}
function jpOdds(F, key) {
  const O = JP_CFG.odds, A = JP_CFG.ab[key] || JP_CFG.ab.dice, L = F.luck || 0, P = Math.min(F.pity || 0, O.pityMax), Hh = Math.min(F.hot || 0, O.hotMax);
  if (L >= JP_CFG.max) return { bad: 0, good: 0, jack: 1 };
  const jack = clamp(A.jack + L * O.luckJack + P * O.pityJack + Hh * O.hotJack, 0, O.maxJack);
  const bad = clamp(A.bad - L * O.luckBad - P * O.pityBad, O.minBad, 1 - jack);
  const good = A.good ? clamp(A.good + L * O.luckGood, 0, 1 - jack - bad) : 0;
  return { bad, good, jack };
}
// one gamble: returns 'bad' | 'normal' | 'good' | 'jackpot'. Max LUCK = guaranteed jackpot (spends it).
function jpGamble(F, key) {
  const o = jpOdds(F, key), forced = F.jpForce; F.jpForce = null;   // jpForce: tests only
  let t;
  if (jpMax(F)) { t = 'jackpot'; F.luck = 0; F.jpStats.maxJ++; }
  else { const r = Math.random(); t = r < o.jack ? 'jackpot' : r < o.jack + o.bad ? 'bad' : r < o.jack + o.bad + o.good ? 'good' : 'normal'; }
  if (forced) t = forced;
  F.jpStats.g++;
  if (t === 'jackpot') { F.pity = 0; F.hot = 0; F.jpStats.j++; jpJackpotFx(F); }
  else if (t === 'bad') { F.pity = Math.min(JP_CFG.odds.pityMax, (F.pity || 0) + 1); F.jpStats.b++; }
  const cost = JP_CFG.cost[key] || 0; if (cost && t !== 'jackpot') F.luck = Math.max(0, F.luck - cost);
  F.lastBet = { key, t, T: F.T };
  return t;
}
function jpHot(F, n = 1) { const was = F.hot || 0; F.hot = Math.min(JP_CFG.odds.hotMax, was + n); if (F.hot > was) FX.wtext(F.x, F.y - 214 * F.s, 'HOT STREAK', { size: 16, color: '#ff9a3a', stroke: JPD, life: 30 }); }
function jpJackpotFx(F) {
  FX.flashScreen('#ffe08a', 10, 0.55); FX.ring(F.x, F.y - 110, JP, 20, 300, 26, 7); FX.ring(F.x, F.y - 110, '#ffffff', 10, 170, 18, 3);
  for (let i = 0; i < 24; i++) FX.p({ type: 'shard', x: F.x + rand(-20, 20), y: F.y - rand(120, 200), vx: rand(-6, 6), vy: -rand(3, 9), grav: 0.35, drag: 0.98, life: rand(30, 50), size: rand(4, 7), color: i % 3 ? JP : '#fff2b0', rot: rand(0, TAU), vr: rand(-0.3, 0.3) });
  FX.wtext(F.x, F.y - 270, 'JACKPOT!!', { size: 46, color: '#fff2b0', stroke: '#a01020', life: 70 });
  FX.wtext(F.x, F.y - 230, '— 大当たり —', { size: 22, font: FX_JP(), color: JP, stroke: JPD, life: 70 });
  Sound.play('jackpot'); F.jpEx = 'grin'; F.jpExT = 50;
}
function jpSay(F, text, tier) {   // a result label above him, coloured by luck tier
  const col = tier === 'bad' ? '#9ab0d0' : tier === 'good' ? JP : tier === 'jackpot' ? '#fff2b0' : '#ffffff', st = tier === 'bad' ? '#14182a' : JPD;
  FX.wtext(F.x, F.y - 244 * F.s, text, { size: tier === 'normal' ? 22 : 26, color: col, stroke: st, life: 44 });
  if (tier === 'bad') { Sound.play('badLuck'); F.jpEx = 'shock'; F.jpExT = 40; for (let i = 0; i < 6; i++) FX.p({ type: 'smoke', x: F.x + rand(-20, 20), y: F.y - rand(180, 220), vx: rand(-0.5, 0.5), vy: -0.5, life: 26, size: rand(5, 8), grow: 0.2, color: 'rgba(90,100,130,0.45)', add: false }); }
  else if (tier === 'good') { Sound.play('chips'); F.jpEx = 'grin'; F.jpExT = 30; }
}
JACKPOT.initFighter = F => {
  F.luck = JP_CFG.start; F.luckT = -999; F.pity = 0; F.hot = 0; F.donT = 0; F.donK = null; F.jpProp = 'chip'; F.jpEx = null; F.jpExT = 0;
  F.jpStats = { g: 0, j: 0, b: 0, maxJ: 0 }; F.lastBet = null; F.rfId = 0; F.rfHits = 0; F.rfRoyal = 0; F.rfQ = null; F.ultMax = false; F.jpWinMax = false; F.allInL = 0; F.jpCine = null;
};
JACKPOT.dmgBonus = F => F.donT > 0 ? JP_CFG.don[F.donK][1] : 1;
JACKPOT.defMul = D => D.donT > 0 && D.donK === 'lose' ? JP_CFG.don.loseDef : 1;
JACKPOT.walkMul = F => F.donT > 0 && F.donK === 'jack' ? 1.1 : 1;
JACKPOT.onDealDamage = (A, D) => {
  if (A.ko || A.state === 'cine') return;
  const G = JP_CFG.gain, m = A.state === 'attack' ? A.move : null;
  let n = m && A.hitActive ? (m.ult ? G.ult : m.special || m.followup || (m.lvl || 1) >= 4 ? G.special : G.lvl[Math.min(3, m.lvl || 1)]) : G.proj;
  if (D.comboHits >= G.comboFrom) n += G.combo;
  jpGain(A, n);
};
JACKPOT.idlePose = F => { const k = F.T % 600; return k > 380 && k < 430 ? 'tip_hat' : null; };
JACKPOT.statePose = F => {
  if (F.state === 'defeat') return F.sf < 40 ? ['coin_flip', 0.16] : ['defeat', 0.08];
  if (F.state === 'victory' && !F.cos) return F.jpWinMax ? [F.sf < 40 ? 'snap' : F.sf < 100 ? 'celebrate' : 'tip_hat', 0.1] : [F.sf < 40 ? 'coin_flip' : F.sf < 70 ? 'coin_look' : F.sf < 120 ? 'coin_catch' : 'tip_hat', 0.12];
  return null;
};
const JP_PROP = { L: 'card', jL: 'card', cL: 'card', sp1: 'dice', sp1f: 'fan', counter: 'coin', donLose: 'coin', sp2: 'gun', rrClick: 'gun', rrExec: 'gun', sp2d: 'stack', allInLow: 'stack', allInMid: 'stack', allInHigh: 'stack', allInMax: 'stack' };
JACKPOT.tick = F => {
  const O = F.opp; if (!O) return;
  const live = BT && BT.phase === 'fight' && !F.ko;
  // what is in his hand + his expression (draw-only, derived from sim state)
  if (F.state !== 'cine') {
    const s = F.state, k = F.moveKey, f = F.mf;
    let pr = null;
    if (s === 'attack') { pr = JP_PROP[k] || null; if (k === 'sp1' && f > 12) pr = null; if (k === 'sp1f' && f > 22) pr = null; if (k === 'counter' && f > 4 && f < 28) pr = null; }
    else if (s === 'idle' || s === 'walk' || s === 'crouch' || s === 'intro') pr = 'chip';
    else if (s === 'victory' || s === 'defeat') pr = F.jpWinMax ? 'stack' : 'coin';
    F.jpProp = pr;
    if (F.jpExT > 0) F.jpExT--;
    else F.jpEx = s === 'attack' && (k === 'sp2' || k === 'rrExec') ? 'cold' : s === 'defeat' ? 'shock' : null;
  }
  // Double or Nothing buff / debuff
  if (F.donT > 0) {
    F.donT--;
    const hs = JP_CFG.don[F.donK][2]; if (hs > 0) xpHaste(F, hs);
    if (F.T % (F.donK === 'jack' ? 3 : 6) === 0 && !F.hidden) FX.p({ type: F.donK === 'lose' ? 'smoke' : 'spark', x: F.x + rand(-28, 28), y: F.y - rand(20, 190), vx: rand(-0.3, 0.3), vy: -rand(0.4, 1.2), life: 22, size: F.donK === 'lose' ? rand(4, 7) : rand(1.5, 3), grow: F.donK === 'lose' ? 0.15 : 0, add: F.donK !== 'lose', color: F.donK === 'lose' ? 'rgba(80,90,120,0.4)' : F.donK === 'jack' ? JP : '#ff9a3a' });
    if (F.donT === 0) { FX.wtext(F.x, F.y - 230, F.donK === 'lose' ? 'back in the game' : 'cashed out', { size: 18, color: '#d8d0c0', stroke: JPD, life: 34 }); F.donK = null; }
  }
  if (live) {
    if (F.T - F.luckT > JP_CFG.decayAfter && F.luck > 0 && F.luck < JP_CFG.max) F.luck = Math.max(0, F.luck - JP_CFG.decay);
    if (jpMax(F) && F.T % 4 === 0) FX.p({ type: 'spark', x: F.x + rand(-34, 34), y: F.y - rand(20, 200), vx: 0, vy: -rand(0.5, 1.5), life: 26, size: rand(1.5, 3.2), color: F.T % 8 ? JP : '#ffffff' });
  }
};
JACKPOT.drawBehind = (g, F) => {
  if (!FX.hq || F.hidden) return;
  const k = (F.luck || 0) / JP_CFG.max, jack = F.donT > 0 && F.donK === 'jack';
  if (k < 0.7 && !jack) return;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = (jack ? 0.3 : 0.12 + (k >= 1 ? 0.14 : 0)) + 0.06 * Math.sin(F.T * 0.25);
  drawFigure(g, F.ch, F.pose, F.x, F.y, F.facing, { mono: jack || k >= 1 ? JP : '#ff9a3a', scale: 1.06 }); g.restore();
};
JACKPOT.drawExtra = (g, F) => {
  const O = F.opp;
  // RUSSIAN ROULETTE warning: red laser + reticle on the target while he aims (chest high — crouch under it!)
  if (O && F.state === 'attack' && F.moveKey === 'sp2' && F.mf <= 36) {
    const h = F.handW('f'), y = F.y - 142 * F.s, k = F.mf / 36, tx = O.x, blink = (F.mf >> 2) % 2;
    g.save(); g.globalCompositeOperation = 'lighter';
    g.strokeStyle = `rgba(255,40,60,${0.25 + 0.5 * k})`; g.lineWidth = 1.5 + k * 2; g.beginPath(); g.moveTo(h[0], h[1]); g.lineTo(tx, y); g.stroke();
    const r = lerp(46, 18, k); g.strokeStyle = blink ? '#ffffff' : '#ff2a40'; g.lineWidth = 2.5;
    g.beginPath(); g.arc(tx, y, r, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(tx - r - 8, y); g.lineTo(tx - r + 6, y); g.moveTo(tx + r - 6, y); g.lineTo(tx + r + 8, y); g.moveTo(tx, y - r - 8); g.lineTo(tx, y - r + 6); g.moveTo(tx, y + r - 6); g.lineTo(tx, y + r + 8); g.stroke();
    g.restore();
  }
  // orbiting gold chips at max LUCK
  if (jpMax(F) && !F.hidden && F.state !== 'cine') {
    for (let i = 0; i < 3; i++) { const a = F.T * 0.06 + i * TAU / 3, x = F.x + Math.cos(a) * 46, y = F.y - 110 + Math.sin(a) * 16; if (Math.sin(a) < 0 || !FX.hq) jpChip(g, x, y, 6, Math.abs(Math.cos(a * 2)) * 0.8 + 0.2, JP, null); }
  }
};
JACKPOT.introFx = F => { FX.wtext(F.x, F.y - 250, 'place your bets', { size: 20, color: JP, stroke: JPD, life: 60, vy: -0.3 }); Sound.play('chips'); };

// ---------------------------------- projectiles ----------------------------------
function jpHandPt(F) { const h = F.handW('f'); return [h[0] + F.facing * 10, h[1] - 4]; }
EXTRA_PROJ.jpDice = {   // LOADED DICE: the face is rolled when thrown (hidden while it tumbles), revealed on contact
  update(p) {
    if (p.y > GROUND - 22 && p.vy > 0) { p.y = GROUND - 22; p.vy = -Math.abs(p.vy) * 0.5; p.vx *= 0.8; }
    if (p.t % 3 === 0) FX.p({ type: 'spark', x: p.x - p.vx, y: p.y + rand(-6, 6), vx: -p.vx * 0.1, vy: rand(-0.5, 0.5), life: 14, size: 2.2, color: p.gold ? JP : p.t % 2 ? '#ff3a5a' : JP });
    const O = p.owner.opp; if (O && !p.shown && Math.abs(O.x - p.x) < 52 && Math.abs((O.y - 90) - p.y) < 110) jpDiceShow(p);
  },
  draw(g, p) {
    const face = p.shown ? p.face : 1 + ((p.t >> 2) % 6);
    if (FX.hq) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35; g.fillStyle = p.gold ? JP : '#ff2a4a'; g.beginPath(); g.ellipse(p.x - p.vx * 1.5, p.y, 30, 14, 0, 0, TAU); g.fill(); g.restore(); }
    jpDie(g, p.x, p.y, p.gold ? 40 : 34, face, p.shown ? 0 : p.t * 0.35 * Math.sign(p.vx || 1), p.gold, null);
  },
};
function jpDiceShow(p) {
  if (p.shown) return; p.shown = true;
  const F = p.owner, big = p.face >= 5 || p.gold;
  BT.spawn({ owner: F, kind: 'jpFaceShow', x: p.x, y: p.y - 56, vx: 0, w: 1, h: 1, life: 34, harmless: true, clash: 0, face: p.face, gold: p.gold });
  Sound.play('dice'); if (big) FX.ring(p.x, p.y, p.gold ? JP : '#ff4060', 10, p.gold ? 160 : 100, 16, 5);
}
EXTRA_PROJ.jpFaceShow = { update(p) { p.y -= 0.6; }, draw(g, p) {
  const k = p.life / p.max, s = (p.gold ? 54 : 44) * (1 + (1 - k) * 0.15);
  g.save(); g.globalAlpha = Math.min(1, k * 2); jpDie(g, p.x, p.y, s, p.face, 0, p.gold, null); g.restore();
} };
function jpThrowDice(F) {
  const t = jpGamble(F, 'dice'), r = Math.random();
  const face = t === 'jackpot' ? 6 : t === 'bad' ? (r < 0.5 ? 1 : 2) : t === 'normal' ? (r < 0.5 ? 3 : 4) : (r < 0.45 ? 6 : 5);
  const gold = t === 'jackpot', S = JP_CFG.dice[gold ? 'J' : face], h = jpHandPt(F);
  BT.spawn({ owner: F, kind: 'jpDice', x: h[0], y: F.y - 128 * F.s, vx: F.facing * 11, vy: -2.4, grav: 0.12, w: 46, h: 46, life: 70, hits: 1,
    dmg: S.dmg, hs: S.hs, kb: S.kb, kd: S.kd || 0, launch: S.launch || 0, str: gold ? 4 : face >= 5 ? 3 : 2, color: gold ? JP : '#ff3a5a', clash: 1,
    face, gold, tier: t, projOnHit: 1, onHit(A, D) { jpDiceHit(this, A, D); } });
  Sound.play('cardFlick');
}
function jpDiceHit(p, A, D) {
  jpDiceShow(p);
  const lab = p.gold ? 'GOLDEN SIX!' : p.face === 6 ? 'CRITICAL 6!' : p.face === 5 ? 'FIVE!' : p.face >= 3 ? `${p.face}` : `${p.face}… snake eyes`;
  jpSay(A, lab, p.tier);
  if (p.face === 6 || p.gold) { jpHot(A); FX.wtext(D.x, D.y - 210 * D.s, 'CRITICAL', { size: 30, color: '#ffffff', stroke: JP2, life: 34 }); FX.shakeIt(p.gold ? 14 : 8); }
  if (p.gold) { FX.impactFrame(2); Sound.play('impactBig'); for (let i = 0; i < 16; i++) FX.p({ type: 'shard', x: D.x, y: D.y - 110, vx: rand(-7, 7), vy: rand(-8, 2), grav: 0.3, life: 36, size: 5, color: JP, rot: rand(0, TAU), vr: 0.3 }); }
}
// ROYAL FLUSH cards
EXTRA_PROJ.jpCard = {
  update(p) {
    p.vy += (p.ty - p.y) * 0.012; p.vy *= 0.95;
    if (p.t % 2 === 0) FX.p({ type: 'spark', x: p.x - p.vx * 0.8, y: p.y, vx: -p.vx * 0.05, vy: 0, life: 12, size: p.gold ? 2.6 : 1.8, color: p.gold ? JP : p.face ? '#ffd860' : '#ffffff' });
  },
  draw(g, p) {
    if (FX.hq) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = p.gold ? JP : '#ffd860'; g.globalAlpha = 0.5; g.lineWidth = 3; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 3, p.y - p.vy * 3); g.stroke(); g.restore(); }
    jpCard(g, p.x, p.y, p.gold ? 22 : 18, p.gold ? 30 : 25, p.rank, p.suit, p.gold, p.t * 0.5 * Math.sign(p.vx || 1), null);
  },
};
EXTRA_PROJ.jpRoyal = {   // the Royal Flush finisher: a giant card slams down on them
  rect(p) { return { x: p.x - p.w / 2, y: GROUND - 230, w: p.w, h: 230 }; },
  delay(p) { p.y = lerp(GROUND - 420, GROUND - 300, 1 - p.delay / p.delay0); },
  update(p) { p.y = Math.min(GROUND - 110, p.y + 40); if (p.t === p.delay0 + 1) { FX.shakeIt(10); Sound.play('slam'); FX.ring(p.x, GROUND - 6, JP, 10, 160, 18, 5, 0.3); } },
  draw(g, p) {
    const s = p.gold ? 1.25 : 1;
    if (FX.hq) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.4; g.fillStyle = JP; g.beginPath(); g.ellipse(p.x, GROUND - 4, 90 * s, 14, 0, 0, TAU); g.fill(); g.restore(); }
    jpCard(g, p.x, p.y, 92 * s, 128 * s, 'A', 0, true, 0.06, null);
    g.save(); g.font = `italic 900 ${Math.round(20 * s)}px ${FONT_T}`; g.textAlign = 'center'; strokeText(g, 'ROYAL FLUSH', p.x, p.y - 74 * s, '#fff2b0', JP2, 4); g.restore();
  },
};
function jpDeal(F) {
  const t = jpGamble(F, 'flush'), O = F.opp, royal = t === 'good' || t === 'jackpot', gold = t === 'jackpot';
  const R = () => Math.random(), num = () => String(2 + Math.floor(R() * 8)), suit = Math.floor(R() * 4);
  let ranks;
  if (royal) ranks = gold ? ['10', 'J', 'Q', 'K', 'A', 'A', 'A'] : ['10', 'J', 'Q', 'K', 'A'];
  else { const faces = t === 'bad' ? 1 : 2; ranks = [num(), num(), num(), num(), num()]; for (let i = 0; i < faces; i++) ranks[Math.floor(R() * 5)] = 'JQK'[Math.floor(R() * 3)]; }
  F.rfId++; F.rfHits = 0; F.rfRoyal = royal ? (gold ? 2 : 1) : 0; F.rfTier = t;
  F.rfQ = ranks.map((rank, i) => ({ rank, i, n: ranks.length, suit: royal ? suit : Math.floor(R() * 4), gold }));
  F.rfTy = O.y - 118 * O.s;
  jpSay(F, royal ? (gold ? 'GOLDEN ROYAL FLUSH!' : 'ROYAL FLUSH!') : t === 'bad' ? 'a bad hand…' : 'two pair', t);
  if (royal) jpHot(F);
  jpCardOut(F, F.rfQ.shift());
}
function jpCardOut(F, c) {
  if (!c) return;
  const C = JP_CFG.card, h = jpHandPt(F), face = 'JQKA'.includes(c.rank), ace = c.rank === 'A';
  let dmg = ace ? C.ace : c.rank === '10' && F.rfRoyal ? C.ten : face ? C.face : C.num; if (c.gold) dmg *= C.gold;
  const last = c.i === c.n - 1;
  BT.spawn({ owner: F, kind: 'jpCard', x: h[0], y: h[1], vx: F.facing * 13, vy: lerp(-2.2, 2.2, c.n > 1 ? c.i / (c.n - 1) : 0.5), ty: F.rfTy, w: 34, h: 30, life: 56, hits: 1,
    dmg, hs: last ? 18 : 14, kb: last ? 4 : 1.2, str: face ? 2 : 1, clash: 1, color: c.gold ? JP : '#ffffff', rank: c.rank, suit: c.suit, gold: c.gold, face, rfId: F.rfId,
    projOnHit: 1, onHit(A) { jpCardHit(this, A); } });
  Sound.play('cardFlick');
}
function jpCardHit(p, A) {
  if (p.rfId !== A.rfId) return;
  A.rfHits++;
  if (A.rfRoyal && A.rfHits === 3) {
    const D = A.opp, gold = A.rfRoyal === 2, C = JP_CFG.card;
    BT.spawn({ owner: A, kind: 'jpRoyal', x: clamp(D.x, 60, STAGE_W - 60), y: GROUND - 420, vx: 0, w: gold ? 150 : 120, h: 230, delay: 10, delay0: 10, life: 10, hits: 1, persist: true,
      dmg: gold ? C.royalJ : C.royal, hs: 30, kb: 2, launch: gold ? -13 : -11, str: 4, clash: 0, color: JP, gold, srcKey: 'sp1f' });
  }
}
// DOUBLE OR NOTHING coin
EXTRA_PROJ.jpCoinFlip = { update(p) { const F = p.owner; p.x = jpHandPt(F)[0]; }, draw(g, p) { jpCoin(g, p.x, p.y, 9, p.t * 0.7, null, true); if (FX.hq && p.t % 3 === 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = '#fff2b0'; g.globalAlpha = 0.6; g.beginPath(); g.arc(p.x, p.y, 3, 0, TAU); g.fill(); g.restore(); } } };
function jpDoN(F) {
  const t = jpGamble(F, 'don');
  if (t === 'bad') {
    F.donT = JP_CFG.don.lose[0]; F.donK = 'lose'; jpSay(F, 'TAILS… NOTHING', 'bad');
    FX.wtext(F.x, F.y - 214, 'DMG DOWN · VULNERABLE', { size: 15, color: '#9ab0d0', stroke: '#14182a', life: 50 });
    F.startMove('donLose', true);
  } else if (t === 'jackpot') {
    F.donT = JP_CFG.don.jack[0]; F.donK = 'jack';
    FX.wtext(F.x, F.y - 300, 'ALL ACES', { size: 26, color: '#ffffff', stroke: '#a06a00', life: 60 });
  } else {
    F.donT = JP_CFG.don.win[0]; F.donK = 'win'; jpHot(F); jpSay(F, 'HEADS — DOUBLE!', 'good');
    FX.ring(F.x, F.y - 110, '#ff9a3a', 16, 180, 18, 5);
  }
}
// RUSSIAN ROULETTE bullet
EXTRA_PROJ.jpBullet = {
  update(p) { if (p.t % 1 === 0) FX.p({ type: 'spark', x: p.x - p.vx * 0.5, y: p.y + rand(-2, 2), vx: -p.vx * 0.04, vy: 0, life: 10, size: p.gold ? 3 : 2, color: p.gold ? JP : '#ffb060' }); },
  draw(g, p) {
    g.save(); g.globalCompositeOperation = 'lighter'; const d = Math.sign(p.vx) || 1;
    g.strokeStyle = p.gold ? JP : '#ffcf8a'; g.lineWidth = p.gold ? 8 : 5; g.globalAlpha = 0.5; g.beginPath(); g.moveTo(p.x - d * 90, p.y); g.lineTo(p.x, p.y); g.stroke();
    g.globalAlpha = 1; g.strokeStyle = '#ffffff'; g.lineWidth = p.gold ? 3.5 : 2.5; g.beginPath(); g.moveTo(p.x - d * 40, p.y); g.lineTo(p.x + d * 6, p.y); g.stroke();
    g.fillStyle = p.gold ? JP : '#ffe8c0'; g.beginPath(); g.ellipse(p.x, p.y, 9, 4, 0, 0, TAU); g.fill(); g.restore();
  },
};
function jpFire(F, gold, dmg, extra = {}) {
  const h = F.handW('f'), x = h[0] + F.facing * 46;
  BT.spawn({ owner: F, kind: 'jpBullet', x, y: F.y - 142 * F.s, vx: F.facing * 34, w: 70, h: 14, life: 34, hits: 1, dmg, hs: 28, kb: 9, kd: 1, type: 'unblock', str: gold ? 4 : 3, clash: 0, color: JP, gold, ...extra });
  FX.ring(x, F.y - 142 * F.s, gold ? JP : '#ffcf8a', 6, 60, 10, 4); FX.flashScreen(gold ? '#ffe08a' : '#ffffff', 4, 0.3); FX.shakeIt(6);
  for (let i = 0; i < 6; i++) FX.p({ type: 'smoke', x, y: F.y - 142 * F.s, vx: F.facing * rand(0.5, 2.5), vy: -rand(0.2, 1), life: 22, size: rand(5, 9), grow: 0.3, color: 'rgba(200,190,180,0.4)', add: false });
  Sound.play('gunshot'); F.vx = -F.facing * 3;
}
// HOUSE ALWAYS WINS roulette wheel
const JP_WHEEL = { red: ['RED', '#d0102a'], black: ['BLACK', '#1a1418'], cold: ['BLACK', '#1a1418'], green: ['GREEN', '#1d9a50'], jack: ['JACKPOT', JP] };
EXTRA_PROJ.jpWheel = {
  rect(p) { return { x: p.x - p.zw / 2, y: GROUND - 210, w: p.zw, h: 210 }; },
  delay(p) {
    const k = 1 - p.delay / p.delay0, every = Math.max(2, Math.round(2 + k * k * 9));
    if (p.t % every === 0) Sound.play('rTick');
    p.spin += 0.45 * (1 - k * 0.85);
  },
  update(p) {
    if (!p.fired) {
      p.fired = true; const [n, col] = JP_WHEEL[p.res];
      FX.wtext(p.x, GROUND - 250, p.res === 'jack' ? 'JACKPOT!!' : n + (p.res === 'cold' ? '… (cold)' : '!'), { size: p.res === 'jack' ? 44 : 32, color: p.res === 'black' || p.res === 'cold' ? '#ffffff' : col, stroke: p.res === 'jack' ? JP2 : OUTLINE, life: 46 });
      if (p.res === 'red' || p.res === 'jack') { FX.shakeIt(p.res === 'jack' ? 22 : 14); Sound.play('explosion'); for (let i = 0; i < 30; i++) FX.flame(p.x + rand(-p.zw / 2, p.zw / 2), GROUND - rand(0, 160), p.res === 'jack' ? JP : '#ff3a3a', 1, 10, 5); FX.ring(p.x, GROUND - 20, p.res === 'jack' ? JP : '#ff3a3a', 20, p.zw * 0.7, 22, 8, 0.3); }
      else if (p.res === 'green') { FX.shakeIt(14); Sound.play('impactBig'); FX.ring(p.x, GROUND - 100, '#3aff8a', 10, 140, 16, 7); }
      else Sound.play('chips');
      if (p.res === 'jack') { FX.flashScreen('#ffe08a', 10, 0.5); Sound.play('jackpot'); }
    }
    if ((p.res === 'black' || p.res === 'cold') && p.t % 5 === 0) for (let i = 0; i < 3; i++) FX.p({ type: 'slash', x: p.x + rand(-p.zw / 3, p.zw / 3), y: GROUND - rand(40, 170), vx: 0, vy: 0, life: 8, size: 60, rot: rand(0, TAU), color: '#c0a0ff' });
  },
  draw(g, p) {
    const r = p.r, spin = p.spin || 0, stop = p.delay <= 0, k = p.delay0 ? 1 - Math.max(0, p.delay) / p.delay0 : 1;
    g.save(); g.translate(p.x, GROUND - 2); g.scale(1, 0.28);
    // warning glow + rim
    g.globalAlpha = stop ? Math.min(1, p.life / 8) : Math.min(1, p.t / 8);
    if (FX.hq) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = stop ? (JP_WHEEL[p.res][1] === '#1a1418' ? '#8060ff' : JP_WHEEL[p.res][1]) : '#ff2a40'; g.globalAlpha *= 0.18 + 0.12 * Math.sin(p.t * 0.5); g.beginPath(); g.arc(0, 0, r * 1.1, 0, TAU); g.fill(); g.restore(); }
    g.fillStyle = '#3a2410'; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.strokeStyle = JP; g.lineWidth = 6; g.stroke();
    const N = 18; for (let i = 0; i < N; i++) {
      const a0 = spin + i * TAU / N, a1 = a0 + TAU / N, col = i === 0 ? '#1d9a50' : i % 2 ? '#c8102e' : '#16141a';
      g.fillStyle = col; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r * 0.92, a0, a1); g.closePath(); g.fill();
    }
    g.fillStyle = '#5a3a14'; g.beginPath(); g.arc(0, 0, r * 0.42, 0, TAU); g.fill(); g.strokeStyle = JP; g.lineWidth = 4; g.stroke();
    g.fillStyle = JP; g.beginPath(); g.arc(0, 0, r * 0.12, 0, TAU); g.fill();
    // the ball
    const ba = -spin * 1.7 + p.t * 0.02, br = r * lerp(0.98, 0.7, stop ? 1 : k);
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(Math.cos(ba) * br, Math.sin(ba) * br, 9, 0, TAU); g.fill();
    g.restore();
    if (!stop) {   // the zone edge pulses so they know where to get out
      g.save(); g.strokeStyle = '#ff2a40'; g.globalAlpha = 0.5 + 0.4 * Math.sin(p.t * 0.6); g.lineWidth = 2; g.setLineDash([10, 8]);
      g.beginPath(); g.moveTo(p.x - p.zw / 2, GROUND); g.lineTo(p.x - p.zw / 2, GROUND - 190); g.moveTo(p.x + p.zw / 2, GROUND); g.lineTo(p.x + p.zw / 2, GROUND - 190); g.stroke(); g.restore();
    } else if (p.res === 'green' || p.res === 'jack') {   // the concentrated strike: a pillar of light
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, p.life / 6) * 0.7; const gr = g.createLinearGradient(0, GROUND - 400, 0, GROUND); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, p.res === 'jack' ? JP : '#3aff8a');
      g.fillStyle = gr; g.fillRect(p.x - p.zw * 0.35, GROUND - 400, p.zw * 0.7, 400); g.restore();
    }
  },
};
function jpWheel(F, O) {
  const t = jpGamble(F, 'house'), H = JP_CFG.house;
  const res = t === 'jackpot' ? 'jack' : t === 'bad' ? 'cold' : t === 'good' ? 'green' : (Math.random() < 0.5 ? 'red' : 'black');
  const x = clamp(O.x, 120, STAGE_W - 120), r = res === 'jack' ? H.rJ : H.r;
  const S = { red: { dmg: H.red, hits: 1, life: 10, launch: -11, hs: 30, str: 3, zw: r * 2 }, black: { dmg: H.black, hits: 5, interval: 5, life: 28, hs: 14, kb: 1, str: 2, zw: r * 2 },
    cold: { dmg: H.cold, hits: 3, interval: 6, life: 22, hs: 12, kb: 1, str: 1, zw: r * 2 }, green: { dmg: H.green, hits: 1, life: 10, kd: 1, hs: 30, kb: 5, str: 4, zw: 120 },
    jack: { dmg: H.jack, hits: 1, life: 12, launch: -13, hs: 34, str: 4, zw: r * 2 } }[res];
  BT.spawn({ owner: F, kind: 'jpWheel', x, y: GROUND - 100, vx: 0, w: 1, h: 1, delay: 50, delay0: 50, persist: true, clash: 0, r, res, tier: t, spin: 0, color: JP, ...S });
  if (t !== 'jackpot') jpSay(F, t === 'bad' ? 'cold table…' : 'no more bets', t === 'bad' ? 'bad' : 'normal');
}
// ALL IN chips
function jpChipBurst(F, n, col) { const h = jpHandPt(F); for (let i = 0; i < n; i++) FX.p({ type: 'shard', x: h[0], y: h[1], vx: F.facing * rand(4, 12), vy: rand(-5, 2), grav: 0.25, drag: 0.98, life: rand(20, 34), size: rand(4, 6), color: i % 3 === 0 ? JP : i % 3 === 1 ? JP2 : '#f4f0ea', rot: rand(0, TAU), vr: rand(-0.4, 0.4) }); }

// ---------------------------------- moves ----------------------------------
JACKPOT.moves = Object.assign(baseNormals({ dmg: 0.97, spd: 0, rng: 1.0 }), {
  sp1: {
    name: 'LOADED DICE', jp: 'イカサマ賽', desc: 'Throws a glowing supernatural die. It rolls on impact: 1–2 weak, 3–4 normal + stagger, 5 big knockback, 6 CRITICAL (knockdown, +1 HOT). LUCK makes high rolls likelier; JACKPOT = guaranteed golden 6 that launches.', special: 1, lvl: 4, gamble: 'dice',
    poses: ['toss_w', 'toss'], st: 12, act: 2, rec: 18, cd: 75, sfx: 'dice',
    poseFn(F, f) { return f <= 11 ? 'toss_w' : f <= 28 ? 'toss' : 'stance'; },
    spawn: { f: 12, fn(F) { jpThrowDice(F); } },
  },
  sp1f: {
    name: 'ROYAL FLUSH', jp: 'ロイヤルフラッシュ', desc: 'Throws five playing cards in a converging fan. Face cards hit harder. A ROYAL FLUSH (good luck) brings a giant golden card down on them after 3 card hits (launches — combo!). JACKPOT: seven golden cards and a bigger finisher.', special: 1, lvl: 4, gamble: 'flush',
    poses: ['fan_w', 'fan'], st: 14, act: 10, rec: 18, cd: 120, sfx: 'cardFlick',
    poseFn(F, f) { return f <= 13 ? 'fan_w' : f <= 32 ? 'fan' : 'stance'; },
    onStart(F) { F.rfQ = null; },
    spawn: { f: 14, fn(F) { jpDeal(F); } },
    tick(F, f) { if (f > 14 && F.rfQ && F.rfQ.length && f % 2 === 0) jpCardOut(F, F.rfQ.shift()); },
  },
  counter: {
    name: 'DOUBLE OR NOTHING', jp: '倍か無か', desc: 'Flips a coin (slow, he is open while it is in the air). WIN: +15% damage and faster attacks for 6 s (+1 HOT). LOSE: −15% damage, he takes +15% damage for 4 s and slumps for a moment. JACKPOT (ALL ACES): +30% damage, much faster, golden aura for 7 s. Build LUCK before you bet!', special: 1, lvl: 4, gamble: 'don',
    poses: ['coin_flip', 'coin_catch'], st: 30, act: 1, rec: 14, cd: 480, sfx: 'coin',
    poseFn(F, f) { return f <= 5 ? 'coin_flip' : f <= 26 ? 'coin_look' : 'coin_catch'; },
    tick(F, f) {
      if (f === 4) { const h = jpHandPt(F); BT.spawn({ owner: F, kind: 'jpCoinFlip', x: h[0], y: h[1] - 6, vx: 0, vy: -7.8, grav: 0.6, w: 1, h: 1, life: 26, harmless: true, clash: 0 }); Sound.play('coin'); }
      if (f === 30) jpDoN(F);
    },
  },
  donLose: {
    name: 'NOTHING', jp: '無', desc: 'Lost the coin flip: a short slump.', lvl: 4,
    poses: ['slump', 'slump'], st: 1, act: 0, rec: 32, dmg: 0,
  },
  sp2: {
    name: 'RUSSIAN ROULETTE', jp: 'ロシアンルーレット', desc: 'Draws a revolver and aims (36 f, clearly marked with a red laser + reticle — hit him to stop it). Then pulls the trigger: BANG = an UNBLOCKABLE chest-high shot (crouch under it or jump). *click* = empty chamber, he is wide open. JACKPOT: three golden shots (EXECUTION). Costs 15 LUCK.', special: 1, lvl: 4, gamble: 'roulette',
    poses: ['aim_w', 'aim'], st: 36, act: 1, rec: 16, cd: 300, sfx: 'cock',
    poseFn(F, f) { return f <= 10 ? 'aim_w' : f <= 36 ? 'aim' : f <= 46 ? 'recoil' : 'stance'; },
    tick(F, f) {
      if (f === 10 || f === 18 || f === 26 || f === 32) Sound.play('rTick');
      if (f === 12) FX.wtext(F.opp.x, F.opp.y - 250 * F.opp.s, '!', { size: 40, color: '#ff2a40', stroke: '#ffffff', life: 24 });
      if (f === 36) {
        const t = jpGamble(F, 'roulette');
        if (t === 'bad') { jpSay(F, '*click*', 'bad'); Sound.play('click'); F.startMove('rrClick', true); }
        else if (t === 'jackpot') F.startMove('rrExec', true);
        else { jpFire(F, false, t === 'good' ? JP_CFG.roulette.good : JP_CFG.roulette.dmg); jpSay(F, 'BANG!', t); }
      }
    },
  },
  rrClick: {
    name: 'EMPTY CHAMBER', jp: '空砲', desc: 'Russian Roulette failed: *click*. Long recovery.', lvl: 4,
    poses: ['click', 'click'], st: 1, act: 0, rec: 46, dmg: 0,
    poseFn(F, f) { return f <= 14 ? 'aim' : 'click'; },
  },
  rrExec: {
    name: 'EXECUTION', jp: '処刑', desc: 'Russian Roulette JACKPOT: a twirl, then three golden shots. The last one wall-splats.', special: 1, lvl: 5,
    poses: ['twirl', 'aim'], st: 6, act: 30, rec: 20, invuln: [0, 10], dmg: 0,
    poseFn(F, f) { return f <= 6 ? 'twirl' : (f === 9 || f === 17 || f === 25 || f === 26 || f === 10 || f === 18) ? 'recoil' : f <= 36 ? 'aim' : 'stance'; },
    tick(F, f) {
      const E = JP_CFG.roulette.exec;
      if (f === 8 || f === 16) jpFire(F, true, E, { kd: 0, hs: 30, kb: 2 });
      if (f === 24) { jpFire(F, true, E, { kb: 12, ws: 1, launch: -7 }); FX.wtext(F.x, F.y - 260, 'EXECUTION', { size: 36, color: '#fff2b0', stroke: JP2, life: 50 }); }
    },
  },
  sp2f: {
    name: 'HOUSE ALWAYS WINS', jp: '胴元の勝ち', desc: 'Snaps his fingers: a roulette wheel spins under them (~0.8 s, the zone is marked — get out!). Then the ball stops: RED explosion (launches), BLACK five rapid hits, GREEN one concentrated strike (narrow, knockdown). Bad luck = a cold, weak BLACK. JACKPOT: a huge golden explosion. Costs 10 LUCK.', special: 1, lvl: 4, gamble: 'house',
    poses: ['snap_w', 'snap'], st: 16, act: 1, rec: 20, cd: 360, sfx: 'slot',
    poseFn(F, f) { return f <= 12 ? 'snap_w' : f <= 32 ? 'snap' : 'stance'; },
    spawn: { f: 16, fn(F, O) { Sound.play('snap'); jpWheel(F, O); } },
  },
  sp2d: {
    name: 'ALL IN', jp: 'オールイン', desc: 'Bets ALL his LUCK on one attack. Under 30: a quick chip toss. 30–69: a four-hit chip barrage. 70–99: a rush and a casino explosion (launches). 100: guaranteed JACKPOT — a cinematic finisher. The LUCK is gone either way, hit or miss.', special: 1, lvl: 4,
    poses: ['allin_w', 'allin_w'], st: 2, act: 1, rec: 1, cd: 240, sfx: 'chips',
    tick(F, f) {
      if (f !== 1) return;
      const L = F.luck || 0, A = JP_CFG.allIn; F.allInL = L; F.luck = 0;
      const key = L >= JP_CFG.max ? 'allInMax' : L >= A.high ? 'allInHigh' : L >= A.mid ? 'allInMid' : 'allInLow';
      if (key === 'allInMax') { F.jpStats.maxJ++; F.jpStats.j++; jpJackpotFx(F); }
      else FX.wtext(F.x, F.y - 250, `ALL IN · ${Math.floor(L)}`, { size: 24, color: JP, stroke: JPD, life: 40 });
      F.startMove(key, true);
    },
  },
  allInLow: {
    name: 'ALL IN — SMALL BET', jp: '小賭け', desc: 'All In with little LUCK: a quick chip toss.', special: 1, lvl: 4.5,
    poses: ['allin_w', 'allin'], st: 7, act: 3, rec: 16, dmg: 42, hs: 18, kb: 4, hb: { x: 10, y: -160, w: 96, h: 70 }, str: 2, sfx: 'chips',
    tick(F, f) { if (f === 7) jpChipBurst(F, 8); },
  },
  allInMid: {
    name: 'ALL IN — CHIP BARRAGE', jp: 'チップ乱射', desc: 'All In with 30–69 LUCK: four chip volleys.', special: 1, lvl: 4.5,
    poses: ['allin_w', 'allin'], st: 9, act: 18, rec: 18, dmg: 24, hits: 4, interval: 5, hs: 14, bs: 10, kb: 1, hb: { x: 0, y: -175, w: 150, h: 110 }, str: 2, sfx: 'chips',
    final: { dmg: 30, kb: 7, hs: 22 },
    poseFn(F, f) { return f <= 8 ? 'allin_w' : f <= 30 ? ((f >> 2) % 2 ? 'allin' : 'flick') : 'stance'; },
    tick(F, f) { if (f > 9 && f <= 27 && f % 5 === 0) { jpChipBurst(F, 5); Sound.play('chips'); } },
  },
  allInHigh: {
    name: 'ALL IN — HIGH ROLLER', jp: '大勝負', desc: 'All In with 70–99 LUCK: a rush into a casino explosion that launches.', special: 1, lvl: 4.5,
    poses: ['rush', 'allin'], st: 12, act: 10, rec: 26, dmg: 60, hits: 2, interval: 6, hs: 24, kb: 2, hb: { x: 0, y: -200, w: 170, h: 200 }, str: 3, sfx: 'chips',
    final: { dmg: 92, launch: -12, kb: 5, hs: 32, str: 4 },
    poseFn(F, f) { return f <= 12 ? 'rush' : f <= 34 ? 'allin' : 'stance'; },
    tick(F, f) {
      if (f <= 11) { F.vx = F.facing * 9; F.ctrlVel = true; F.afterimage = Math.max(F.afterimage, 3); }
      if (f === 13) { const x = F.x + F.facing * 80; FX.ring(x, F.y - 100, JP, 20, 200, 20, 7); FX.shakeIt(12); Sound.play('explosion'); for (let i = 0; i < 26; i++) FX.flame(x + rand(-60, 60), F.y - rand(20, 200), i % 2 ? JP : JP2, 1, 10, 4); jpChipBurst(F, 14); }
    },
  },
  allInMax: {
    name: 'ALL IN — JACKPOT', jp: '全賭け大当たり', desc: 'All In at 100 LUCK: guaranteed JACKPOT. If it connects: a slot machine rolls 7-7-7 and the whole bank explodes on them.', special: 1, lvl: 5,
    poses: ['rush', 'allin'], st: 10, act: 6, rec: 30, dmg: 1, hs: 30, hb: { x: 0, y: -195, w: 130, h: 195 }, invuln: [0, 10], str: 3, sfx: 'jackpot',
    poseFn(F, f) { return f <= 10 ? 'rush' : 'allin'; },
    tick(F, f) { if (f <= 9) { F.vx = F.facing * 10; F.ctrlVel = true; F.afterimage = Math.max(F.afterimage, 5); } },
    onHit(F, D) { BT.startCine(F, D, CINE.jpAllIn, { zoom: 1.45 }); return true; },
  },
  ult: {
    name: 'THE FINAL BET', jp: '最後の賭け', desc: 'Ultimate. A coin flip, then the world becomes his casino: cards, dice, slot machines and a giant roulette wheel — the ball lands on JACKPOT. At 100 LUCK the bet goes MAX: a different, bigger ending (spends the LUCK).', ult: 1, lvl: 6, cost: 100,
    poses: ['coin_flip', 'snap'], st: 10, act: 6, rec: 34, dmg: 20, hs: 40, bs: 20, kb: 1, hb: { x: 0, y: -200, w: 130, h: 200 }, invuln: [0, 15], str: 3, sfx: 'coin',
    tick(F, f) { if (f <= 8) { F.vx = F.facing * 5; F.ctrlVel = true; } },
    onHit(F, D) {
      F.ultMax = jpMax(F); if (F.ultMax) { F.luck = 0; F.jpStats.maxJ++; F.jpStats.j++; }
      BT.startCine(F, D, CINE.jackpot, { zoom: 1.4 }); return true;
    },
  },
});
(() => {
  const M = JACKPOT.moves;
  Object.assign(M.L, { name: 'Card Flick', poses: ['flick_w', 'flick'], sw: { cx: 0, cy: -150, r: 70, a0: -0.6, a1: 0.2, color: JP } });
  Object.assign(M.M, { name: 'Polished Shoe' });
  Object.assign(M.H, { name: 'High Roller', poses: ['flick_w', 'flick'], hb: { x: 15, y: -182, w: 94, h: 60 } });
  Object.assign(M.cL, { name: 'Low Ante' });
  Object.assign(M.cM, { name: 'Under the Table' });
  Object.assign(M.cH, { name: 'Sweep the Table' });
  Object.assign(M.jH, { name: 'Falling Ace', poses: ['dive', 'flick'] });
  Object.assign(M.LH, { name: 'Raise', poses: ['flick_w', 'tip_hat'] });
  Object.assign(M.FF, { name: 'Cash Out', poses: ['rush', 'flick'] });
})();
// CPU hints
JACKPOT.moves.sp1.__ai = { reach: 640, kind: 'proj', anti: false, st: 12, low: false, over: false };
JACKPOT.moves.sp1f.__ai = { reach: 560, kind: 'proj', anti: false, st: 14, low: false, over: false };
JACKPOT.moves.counter.__ai = { reach: 300, kind: 'buff', anti: false, st: 30, low: false, over: false };
JACKPOT.moves.sp2.__ai = { reach: 700, kind: 'proj', anti: false, st: 36, low: false, over: false };
JACKPOT.moves.sp2f.__ai = { reach: 760, kind: 'proj', anti: false, st: 66, low: false, over: false };
JACKPOT.moves.sp2d.__ai = { reach: 180, kind: 'melee', anti: false, st: 12, low: false, over: false };
JACKPOT.moves.counter.cpuOk = F => F.luck >= 45 && F.donT <= 0;   // the bot only bets with decent LUCK
JACKPOT.moves.sp2d.cpuOk = F => F.luck >= JP_CFG.allIn.mid;
JACKPOT.combos = [
  { name: 'Loaded Dice', notation: 'L → M → SP1 (Loaded Dice)', seq: ['L', 'M', 'sp1'] },
  { name: 'Deal Me In', notation: 'M → H (High Roller) → ↓→SP1 (Royal Flush)', seq: ['M', 'H', 'sp1f'] },
  { name: 'Cash Out', notation: 'L → M → →→H (Cash Out)', seq: ['L', 'M', 'FF'] },
  { name: 'The Final Bet', notation: 'L → M → SP1+SP2 (Ultimate)', seq: ['L', 'M', 'ult'], meter: 1 },
];
JACKPOT.applyTrial = (A, tr) => { if (!tr) return; if (tr.meter) A.meter = 100; if (tr.luck) A.luck = tr.luck; };

// ---------------------------------- HUD + how-to ----------------------------------
function jpBand(F) { const L = F.luck || 0; return L >= JP_CFG.max ? ['JACKPOT READY', JP] : L >= 70 ? ['HOT', '#ff9a3a'] : L >= 35 ? ['WARM', '#f0d070'] : ['COLD', '#8aa8d8']; }
JACKPOT.drawHand = (g, F, side, t) => {
  const max = jpMax(F), [band, col] = jpBand(F), o = jpOdds(F, 'dice'), d = F.donT > 0;
  const buff = d ? (F.donK === 'lose' ? ` · NOTHING ${(F.donT / 60).toFixed(1)}s` : F.donK === 'jack' ? ` · ALL ACES ${(F.donT / 60).toFixed(1)}s` : ` · DOUBLE ${(F.donT / 60).toFixed(1)}s`) : '';
  xpPanel(g, F, side, t, {
    col: max ? JP : col, col2: '#ffffff', icon: '', flash: max,
    title: `LUCK · ${band}${buff}`,
    sub: max ? '運 · NEXT GAMBLE IS A GUARANTEED JACKPOT' : `運 · JACKPOT ${Math.round(o.jack * 100)}% · BAD ${Math.round(o.bad * 100)}%`,
    k: (F.luck || 0) / JP_CFG.max, label: `${Math.floor(F.luck || 0)}%`, marks: [JP_CFG.allIn.mid / 100, JP_CFG.allIn.high / 100], pips: [F.hot || 0, JP_CFG.odds.hotMax, 'HOT'],
    badges: [['sp1', 'S1|DICE'], ['sp1f', '↓→S1|FLUSH'], ['counter', '↓←S1|DOUBLE?'], ['sp2', 'S2|ROULETTE'], ['sp2f', '↓→S2|HOUSE'], ['sp2d', '↓↓S2|ALL IN']],
  });
  const pw = 330, x0 = side > 0 ? 40 : W - 40 - pw, ix = side > 0 ? x0 + 33 : x0 + pw - 33, iy = 560 + 32;
  jpDie(g, ix, iy, 22, max ? 6 : 1 + Math.min(5, Math.floor((F.luck || 0) / 20)), Math.sin(t * 0.05) * 0.15, max, null);
  if (max) {   // golden shimmer sweeping across the full bar
    const tx = side > 0 ? x0 + 68 : x0 + 10, bx = tx, by = 560 + 41, bw = 160, sx = bx + ((t * 4) % (bw + 40)) - 20;
    g.save(); g.beginPath(); g.rect(bx, by, bw, 13); g.clip(); g.globalCompositeOperation = 'lighter'; const gr = g.createLinearGradient(sx - 20, 0, sx + 20, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(sx - 20, by, 40, 13); g.restore();
  }
};
JACKPOT.howTo = {
  title: 'JACKPOT',
  draw(g) {
    xpHowTo(g, 'JACKPOT — THE GAMBLER', JP, [
      ['LUCK', 'Builds with every hit (normals +2–4, specials +5, +1 more from the 3rd hit of a combo). Drains slowly if he stops landing hits. Higher LUCK = fewer bad rolls, more jackpots.'],
      ['JACKPOT', 'Every gamble rolls BAD / NORMAL / GOOD / JACKPOT. At 100 LUCK the next gamble is a guaranteed JACKPOT (spends the LUCK). Bad rolls secretly improve your next odds. HOT pips: +jackpot odds.'],
      ['SP1', 'Loaded Dice — die projectile, 1–6 decides damage; 6 = critical knockdown.'],
      ['↓→ SP1', 'Royal Flush — five cards; a Royal Flush drops a giant card after 3 hits (launch).'],
      ['↓← SP1', 'Double or Nothing — coin flip buff: WIN faster + stronger, LOSE weaker + vulnerable.'],
      ['SP2', 'Russian Roulette — slow aim, then an unblockable shot (crouch!) or *click*. −15 LUCK.'],
      ['↓→ SP2', 'House Always Wins — roulette trap under them: RED / BLACK / GREEN. −10 LUCK.'],
      ['↓↓ SP2', 'All In — spends ALL LUCK: the more you bet, the bigger the attack. 100 = cinematic.'],
    ], 'Land hits, build LUCK, then cash it in: a guaranteed jackpot or an All In. Ultimate (SP1+SP2): THE FINAL BET — with 100 LUCK it goes MAX.');
  },
};

CHARS.push(JACKPOT);
finalizeMoves(JACKPOT);
