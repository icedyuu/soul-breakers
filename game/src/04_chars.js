// ============================ CHARACTERS ==============================
// Hitboxes: {x: forward offset of near edge, y: top (negative = up from feet), w, h} at scale 1.
let BT = null; // current battle (set by Battle)

function baseNormals(k = {}) {
  const d = k.dmg || 1, sp = k.spd || 0, rg = k.rng || 1;
  return {
    L: { name: 'Light', lvl: 1, poses: ['jab_w', 'jab'], st: 5 + sp, act: 3, rec: 8 + sp, dmg: 34 * d, hs: 16, bs: 11, kb: 2.5, hb: { x: 10, y: -168, w: 64 * rg, h: 32 }, str: 1 },
    M: { name: 'Medium', lvl: 2, poses: ['kick_w', 'kick'], st: 8 + sp, act: 4, rec: 13 + sp, dmg: 58 * d, hs: 19, bs: 13, kb: 3.5, hb: { x: 15, y: -128, w: 78 * rg, h: 36 }, str: 2, sw: { cx: 0, cy: -95, r: 80, a0: -0.9, a1: 0.25 } },
    H: { name: 'Heavy', lvl: 3, poses: ['hook_w', 'hook'], st: 13 + sp, act: 4, rec: 20 + sp, dmg: 98 * d, hs: 23, bs: 16, kb: 9, hb: { x: 15, y: -178, w: 88 * rg, h: 50 }, str: 3, shake: 6, sw: { cx: -10, cy: -140, r: 82, a0: -1.4, a1: 0.4 } },
    cL: { name: 'Crouch Light', lvl: 1, crouch: 1, poses: ['crouch', 'cjab'], st: 5 + sp, act: 3, rec: 8 + sp, dmg: 30 * d, hs: 15, bs: 10, kb: 2.5, hb: { x: 10, y: -112, w: 60 * rg, h: 30 }, str: 1 },
    cM: { name: 'Crouch Medium', lvl: 2, crouch: 1, type: 'low', poses: ['ckick_w', 'ckick'], st: 7 + sp, act: 4, rec: 13 + sp, dmg: 48 * d, hs: 18, bs: 12, kb: 3, hb: { x: 15, y: -44, w: 82 * rg, h: 36 }, str: 2 },
    cH: { name: 'Sweep', lvl: 3, crouch: 1, type: 'low', kd: 1, poses: ['sweep_w', 'sweep'], st: 11 + sp, act: 5, rec: 24 + sp, dmg: 80 * d, hs: 30, bs: 15, kb: 6, hb: { x: 10, y: -40, w: 102 * rg, h: 34 }, str: 3, sw: { cx: 0, cy: -45, r: 72, a0: Math.PI * 0.85, a1: 0.25 } },
    jL: { name: 'Air Light', lvl: 1, air: 1, type: 'overhead', poses: ['jump', 'jpunch'], st: 4, act: 7, rec: 6, dmg: 32 * d, hs: 16, bs: 10, kb: 3, hb: { x: 10, y: -135, w: 60 * rg, h: 45 }, str: 1 },
    jM: { name: 'Air Medium', lvl: 2, air: 1, type: 'overhead', poses: ['jump', 'jkick'], st: 6, act: 7, rec: 8, dmg: 52 * d, hs: 18, bs: 12, kb: 4, hb: { x: 8, y: -80, w: 76 * rg, h: 50 }, str: 2 },
    jH: { name: 'Air Heavy', lvl: 3, air: 1, type: 'overhead', poses: ['jheavy_w', 'jheavy'], st: 9, act: 5, rec: 10, dmg: 80 * d, hs: 22, bs: 15, kb: 6, hb: { x: 5, y: -115, w: 82 * rg, h: 75 }, str: 3, spike: 1, sw: { cx: 0, cy: -150, r: 72, a0: -1.8, a1: 0.8 } },
    LH: { name: 'Launcher', lvl: 3, poses: ['upper_w', 'upper'], st: 9 + sp, act: 4, rec: 22 + sp, dmg: 62 * d, hs: 30, bs: 14, kb: 2, launch: -15, hb: { x: 5, y: -215, w: 72, h: 125 }, str: 2, jc: 1, sw: { cx: 20, cy: -160, r: 76, a0: 1.2, a1: -1.6 } },
    FF: { name: 'Dash Attack', lvl: 3, poses: ['lunge_w', 'lunge'], st: 10 + sp, act: 6, rec: 18 + sp, dmg: 84 * d, hs: 26, bs: 14, kb: 12, kd: 1, hb: { x: 10, y: -165, w: 82, h: 65 }, str: 3, vx: 10, shake: 5 },
  };
}

// ---------- cinematic ultimate / grab scripts: (attacker, defender, frame, cine) → true when done ----------
const CINE = {
  kazuma(A, D, f, c) {
    const dir = A.facing, acc = A.ch.colors.accent;
    if (f === 1) { D.x = A.x + dir * 78; D.y = GROUND; FX.darkTarget = 0.6; Sound.play('charge'); c.zoom = 1.4; }
    if (f <= 64) {
      A.forcePose = (f >> 2) % 2 ? 'jab' : 'jab2';
      D.forcePose = (f >> 2) % 2 ? 'hit' : 'hit2';
      A.x += dir * 0.25; D.x += dir * 0.25; A.afterimage = 4;
      const h = A.handW(f % 8 < 4 ? 'f' : 'b'); FX.flame(h[0], h[1], acc, 2, 8, 1.2);
      if (f % 5 === 0) { BT.scriptHit(A, D, 15, { str: 1 }); FX.speedlines(6, W / 2, H / 2, '#ffb070', 30); }
    }
    if (f === 68) A.forcePose = 'upper_w';
    if (f === 80) {
      A.forcePose = 'upper';
      BT.scriptHit(A, D, 130, { str: 4 });
      FX.impactFrame(4); FX.shakeIt(24); Sound.play('explosion'); FX.flashScreen('#ffb347', 14, 0.7);
      for (let i = 0; i < 60; i++) FX.flame(D.x + rand(-40, 40), GROUND - rand(0, 260), acc, 1, 10, 6);
      FX.wtext(D.x, GROUND - 260, '紅蓮!!', { size: 90, font: FX_JP(), color: '#fff', stroke: acc, life: 60, vy: -0.3 });
      BT.release(D, dir * 5, -19); FX.darkTarget = 0; return true;
    }
  },
  yoru(A, D, f, c) {
    const dir = A.facing, acc = A.ch.colors.accent;
    if (f === 1) { D.y = GROUND; FX.darkTarget = 0.75; Sound.play('charge'); c.zoom = 1.3; A.hidden = true; c.ox = A.x; }
    if (f < 100 && f % 2 === 0) FX.p({ type: 'petal', x: D.x + rand(-300, 300), y: GROUND - rand(150, 420), vx: rand(-2, 2), vy: rand(0.5, 2), life: 70, size: rand(4, 7), color: pick(['#ffb7d5', '#ff8fc0', '#ffd6e8']), rot: rand(0, 6), vr: 0.1, add: false });
    D.forcePose = (f >> 3) % 2 ? 'hit' : 'hit2';
    if (f <= 72 && f % 8 === 0) {
      FX.p({ type: 'slash', x: D.x, y: D.y - 100 * D.s, rot: rand(0, Math.PI), size: 170, life: 12, color: acc, add: true });
      BT.scriptHit(A, D, 22, { str: 2, sfx: 'slash' });
      A.hidden = false; A.x = clamp(D.x + rand(-150, 150), 50, STAGE_W - 50); A.y = GROUND - rand(0, 140); A.forcePose = pick(['throw', 'lunge', 'flip', 'cast']);
      A.facing = D.x > A.x ? 1 : -1; A.afterimage = 8;
    } else if (f <= 72 && f % 8 === 3) A.hidden = true;
    if (f === 78) { A.hidden = false; A.y = GROUND; A.x = clamp(D.x + dir * 120, 50, STAGE_W - 50); A.facing = -dir; A.forcePose = 'crouch'; Sound.play('teleport'); }
    if (f === 104) {
      FX.p({ type: 'slash', x: D.x, y: D.y - 100 * D.s, rot: -0.5, size: 700, life: 18, color: acc, add: true });
      BT.scriptHit(A, D, 120, { str: 4, sfx: 'slash' });
      FX.impactFrame(4); FX.shakeIt(20); Sound.play('impactBig'); FX.flashScreen('#ffd6f0', 12, 0.7);
      for (let i = 0; i < 70; i++) FX.p({ type: 'petal', x: D.x, y: D.y - 100, vx: rand(-9, 9), vy: rand(-9, 4), life: 70, size: rand(4, 8), color: pick(['#ffb7d5', '#ff8fc0', '#fff']), rot: rand(0, 6), vr: 0.2, add: false, drag: 0.95 });
      FX.wtext(D.x, GROUND - 260, '千桜!!', { size: 90, font: FX_JP(), color: '#fff', stroke: acc, life: 60, vy: -0.3 });
      BT.release(D, A.facing * -6, -16); FX.darkTarget = 0; return true;
    }
  },
  goroGrab(A, D, f) {
    const dir = A.facing;
    if (f === 1) { A.forcePose = 'grab'; Sound.play('grab'); }
    if (f >= 4 && f <= 22) { const t = (f - 4) / 18; A.forcePose = 'lift'; D.x = A.x + dir * lerp(70, 12, t); D.y = GROUND - lerp(0, 190, t); D.forcePose = 'airhit'; }
    if (f === 30) {
      A.forcePose = 'slam'; D.x = A.x + dir * 80; D.y = GROUND; D.forcePose = 'down';
      BT.scriptHit(A, D, 150, { str: 4, sfx: 'slam' }); FX.shakeIt(16); FX.rocks(D.x, GROUND, 14); FX.dust(D.x, GROUND, 14); FX.ring(D.x, GROUND, A.ch.colors.accent, 10, 160, 18, 6, 0.25);
    }
    if (f === 44) { BT.release(D, dir * 4, -6); return true; }
  },
  goroUlt(A, D, f, c) {
    const dir = A.facing, acc = A.ch.colors.accent;
    if (f === 1) { FX.darkTarget = 0.65; c.zoom = 1.3; Sound.play('grab'); }
    const lift = (f0, f1) => { const t = clamp((f - f0) / (f1 - f0), 0, 1); A.forcePose = 'lift'; D.x = A.x + dir * lerp(70, 12, t); D.y = GROUND - lerp(0, 190, t); D.forcePose = 'airhit'; };
    const slam = () => { A.forcePose = 'slam'; D.x = A.x + dir * 80; D.y = GROUND; D.forcePose = 'down'; BT.scriptHit(A, D, 95, { str: 4, sfx: 'slam' }); FX.shakeIt(16); FX.rocks(D.x, GROUND, 16); FX.dust(D.x, GROUND, 14); FX.ring(D.x, GROUND, acc, 10, 200, 18, 6, 0.25); };
    if (f >= 2 && f <= 20) lift(2, 20);
    if (f === 28) slam();
    if (f >= 38 && f <= 54) lift(38, 54);
    if (f === 62) slam();
    if (f >= 72 && f < 96) { const t = (f - 72) / 24; A.forcePose = 'slam_w'; A.y = GROUND - Math.sin(t * Math.PI) * 170; A.afterimage = 4; if (f === 72) Sound.play('charge'); }
    if (f === 96) {
      A.y = GROUND; A.forcePose = 'axe';
      BT.scriptHit(A, D, 150, { str: 4 });
      FX.impactFrame(5); FX.shakeIt(26); Sound.play('explosion'); FX.flashScreen('#ff3b1f', 14, 0.6);
      for (let i = 0; i < 70; i++) FX.flame(D.x + rand(-50, 50), GROUND - rand(0, 300), acc, 1, 12, 7);
      FX.rocks(D.x, GROUND, 24);
      FX.wtext(D.x, GROUND - 280, '鬼神!!', { size: 96, font: FX_JP(), color: '#fff', stroke: acc, life: 60, vy: -0.3 });
      BT.release(D, dir * 7, -16); FX.darkTarget = 0; return true;
    }
  },
};
function FX_JP() { return FONT_JP; }

// ---------- shared drawing helpers for hair ----------
function shine(g, r, pts, R) { if (R.mono) return; g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 0.09 * r; g.lineCap = 'round'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x * r, y * r) : g.moveTo(x * r, y * r)); g.stroke(); }

// ============================== KAZUMA ================================
const KAZUMA = {
  id: 'kazuma', name: 'KAZUMA', jp: 'カズマ', title: 'The Crimson Fist', titleJp: '紅蓮の拳',
  style: 'BRAWLER', desc: 'A wandering street fighter whose fists burn with spirit fire. Balanced, hard-hitting, and relentless up close.',
  stats: { power: 4, speed: 3, range: 2, defense: 3 },
  scale: 1.0, health: 1000, walk: 4.4, backWalk: 3.6, jumpV: -17.5, jumpX: 4.6, dashV: 11,
  dims: { ...DIMS }, build: { arm: 1.12, leg: 1.0, torso: 1.08 },
  colors: { skin: '#f3c49c', hair: '#e5302e', top: '#efe9dc', leg: '#2b2a38', boot: '#d8cec0', foot: '#d8cec0', uarm: '#f3c49c', farm: '#f3c49c', hand: '#b8262a', cuff: '#c4302c', belt: '#151318', eye: '#f5b020', accent: '#ff5a1f', band: '#c8282c', brow: '#7a1416' },
  stance: { t: 0.14, hd: -0.05 },
  poses: {
    victory: { t: -0.05, hd: -0.3, fa1: 2.95, fa2: 3.12, ba1: 0.6, ba2: -0.6, fl1: 0.25, fl2: 0.1, bl1: -0.25, bl2: -0.1 },
    intro: { t: 0.12, hd: 0.08, fa1: 1.0, fa2: 1.9, ba1: 1.15, ba2: 1.75 },
  },
  intro: 'My fists burn for a worthy rival!',
  wins: ['Train harder. Then come burn with me again.', 'That fire in you? Not hot enough yet.', 'A good fight! My knuckles are still smoking.'],
  ropes: [
    { id: 'band1', at: (sk, r) => headPt(sk, -r * 0.95, -r * 0.42), n: 6, seg: 7, w0: 3.4, w1: 2.4, color: 'band', grav: 0.2, wind: 0.75, fork: true },
    { id: 'band2', at: (sk, r) => headPt(sk, -r * 0.95, -r * 0.32), n: 5, seg: 7, w0: 3, w1: 2.2, color: 'band', grav: 0.28, wind: 0.6, fork: true },
  ],
  hairBack(g, r, c, R, o) {
    const T = o.T || 0, sw = i => Math.sin(T * 0.12 + i) * 0.07 * r;
    polyR(g, r, [[0.72, -0.72], [1.2, -1.5], [0.38, -1.0], [0.18, -2.1], [-0.3, -1.0], [-1.0, -1.9], [-0.75, -0.55], [-2.05, -0.95], [-0.95, -0.05], [-1.95, 0.48], [-0.9, 0.42], [-1.35, 1.15], [-0.45, 0.75]], c.hair, R, sw);
    shine(g, r, [[-0.2, -1.2], [-0.6, -0.6]], R);
  },
  hairFront(g, r, c, R) {
    polyR(g, r, [[0.55, -0.98], [1.3, -0.45], [0.86, -0.38], [1.18, 0.12], [0.72, -0.1], [0.8, 0.38], [0.42, -0.28], [0.05, -0.95]], c.hair, R);
    if (R.mono) return;
    g.strokeStyle = OUTLINE; g.lineWidth = 0.34 * r; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-0.98 * r, -0.4 * r); g.quadraticCurveTo(0, -0.72 * r, 0.96 * r, -0.5 * r); g.stroke();
    g.strokeStyle = c.band; g.lineWidth = 0.22 * r; g.stroke();
    circ(g, -0.98 * r, -0.38 * r, 0.16 * r, c.band, R);
  },
  torsoDetail(g, L, bw, c) {
    g.fillStyle = c.skin; g.beginPath(); g.moveTo(0, -L - 8); g.lineTo(18 * bw, -L - 4); g.lineTo(18 * bw, -L * 0.3); g.lineTo(5 * bw, -L * 0.42); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(120,60,40,0.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(10 * bw, -L * 0.8); g.quadraticCurveTo(13 * bw, -L * 0.65, 11 * bw, -L * 0.55); g.stroke();
    g.strokeStyle = '#b9ae9e'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -L - 6); g.lineTo(5 * bw, -L * 0.42); g.stroke();
  },
  torsoOver(g, L, bw, c, R) {
    poly(g, [[-12 * bw, -5], [-22 * bw, 14], [-16 * bw, 16], [-8 * bw, 1]], c.belt, R, 3);
  },
  moves: Object.assign(baseNormals({ dmg: 1.05 }), {
    sp1: {
      name: 'BLAZING KNUCKLE', jp: '烈火拳', desc: 'Flaming dash punch. Knockdown.', special: 1, lvl: 4, poses: ['lunge_w', 'lunge'], st: 12, act: 8, rec: 20, dmg: 105, hs: 24, bs: 16, kb: 13, kd: 1,
      hb: { x: 10, y: -172, w: 82, h: 52 }, str: 3, shake: 8, cd: 45, sfx: 'fire',
      tick(F, f) { if (f > 8 && f <= 20) { F.vx = F.facing * 12.5; F.ctrlVel = true; } if (f > 8 && f < 22) { const h = F.handW('f'); FX.flame(h[0], h[1], F.ch.colors.accent, 2, 6, 1); F.afterimage = Math.max(F.afterimage, 4); } },
    },
    sp1f: {
      name: 'BURST SHOT', jp: '爆炎弾', desc: 'Fireball projectile.', special: 1, lvl: 4, poses: ['cast_w', 'cast'], st: 13, act: 1, rec: 24, cd: 70, sfx: 'fire',
      spawn: { f: 13, fn(F) { BT.spawn({ owner: F, kind: 'fireball', x: F.x + F.facing * 65, y: F.y - 128, vx: F.facing * 9.5, w: 62, h: 52, dmg: 78, hs: 20, bs: 14, kb: 8, life: 150, color: F.ch.colors.accent, str: 2 }); } },
    },
    counter: {
      name: 'IRON WALL', jp: '鉄壁', desc: 'Counter stance. Catches any attack and retaliates with a launching uppercut.', special: 1, lvl: 4, counter: 1, poses: ['counter', 'counter'], st: 2, act: 24, rec: 16, cd: 100,
      onCounter(F) { F.startMove('counterHit', true); },
    },
    counterHit: { name: 'IRON WALL • RETALIATE', jp: '鉄壁返し', lvl: 5, poses: ['upper_w', 'upper'], st: 3, act: 6, rec: 24, dmg: 115, hs: 32, kb: 3, launch: -14, kd: 1, hb: { x: -10, y: -205, w: 115, h: 140 }, invuln: [0, 14], str: 3, shake: 10, hitstop: 12, sw: { cx: 20, cy: -160, r: 80, a0: 1.2, a1: -1.6 } },
    sp2: {
      name: 'RISING FLAME', jp: '昇炎拳', desc: 'Invincible rising uppercut. Anti-air.', special: 1, lvl: 4, poses: ['upper_w', 'upper'], st: 4, act: 16, rec: 20, dmg: 52, hits: 2, interval: 8, hs: 30, bs: 12, kb: 2, launch: -14, kd: 1,
      hb: { x: 0, y: -215, w: 74, h: 155 }, invuln: [0, 9], cd: 55, landRec: 12, str: 3, sfx: 'fire',
      tick(F, f) { if (f === 4) { F.vy = -15.5; F.vx = F.facing * 3; F.onGround = false; FX.ring(F.x, GROUND, F.ch.colors.accent, 10, 80, 12, 5, 0.3); } if (f >= 4 && f < 24) { const h = F.handW('f'); FX.flame(h[0], h[1], F.ch.colors.accent, 3, 8, 1.5); } },
    },
    sp2d: {
      name: 'EARTH BREAKER', jp: '大地砕き', desc: 'Ground punch shockwave on both sides. Hits low.', special: 1, lvl: 4, poses: ['slam_w', 'slam'], st: 18, act: 1, rec: 26, cd: 120,
      tick(F, f) { if (f === 2) { F.vy = -7; F.onGround = false; } },
      spawn: { f: 18, fn(F) {
        for (const dir of [-1, 1]) BT.spawn({ owner: F, kind: 'quakeShort', x: F.x + dir * 40, y: GROUND - 25, vx: dir * 11, w: 80, h: 50, dmg: 95, hs: 30, bs: 16, kb: 6, kd: 1, launch: -8, type: 'low', life: 14, clash: 0, str: 3, color: F.ch.colors.accent });
        FX.shakeIt(12); FX.rocks(F.x, GROUND, 16); FX.dust(F.x, GROUND, 14); FX.ring(F.x, GROUND, F.ch.colors.accent, 10, 200, 20, 8, 0.25); Sound.play('slam');
      } },
    },
    ult: {
      name: 'HUNDRED INFERNO FISTS', jp: '百烈・紅蓮拳', desc: 'Ultimate. Dashing barrage finished with a volcanic uppercut.', ult: 1, lvl: 6, cost: 100, poses: ['lunge_w', 'lunge'], st: 6, act: 18, rec: 28, dmg: 40, hs: 40, bs: 20, kb: 6,
      hb: { x: 0, y: -185, w: 95, h: 175 }, invuln: [0, 26], str: 3,
      tick(F, f) { if (f > 6 && f <= 24) { F.vx = F.facing * 15; F.ctrlVel = true; F.afterimage = 6; FX.flame(F.x, F.y - 100, F.ch.colors.accent, 2, 30, 2); } },
      onHit(F, D) { BT.startCine(F, D, CINE.kazuma); return true; },
    },
  }),
};

// =============================== YORU =================================
const YORU = {
  id: 'yoru', name: 'YORU', jp: 'ヨル', title: 'The Shadow Lily', titleJp: '影百合',
  style: 'NINJA', desc: 'Last heir of a hidden clan. Lightning fast with a double jump, teleports and a storm of blades.',
  stats: { power: 2, speed: 5, range: 3, defense: 2 },
  scale: 0.96, health: 900, walk: 5.4, backWalk: 4.4, jumpV: -18, jumpX: 5.2, dashV: 14, doubleJump: true,
  dims: { ...DIMS, headR: 16.5 }, build: { arm: 0.86, leg: 0.9, torso: 0.86 },
  colors: { skin: '#f6d8c8', hair: '#3b2b70', top: '#1d1e2e', leg: '#1d1e2e', boot: '#2c2d40', foot: '#2c2d40', uarm: '#1d1e2e', farm: '#1d1e2e', hand: '#2c2d40', cuff: '#8b90a8', belt: '#b42a52', eye: '#c04cff', accent: '#b45cff', scarf: '#c9305a', mask: '#16171f', noMouth: true },
  stance: { t: 0.3, hd: -0.15, fa1: 0.95, fa2: 1.85, ba1: -0.35, ba2: 0.4, fl1: 0.6, fl2: 0.15, bl1: -0.55, bl2: -0.3 },
  poses: {
    victory: { t: 0.0, hd: -0.12, fa1: 0.45, fa2: 1.9, ba1: 0.35, ba2: 1.95, fl1: 0.15, fl2: 0.05, bl1: -0.15, bl2: -0.05 },
    intro: { base: 'crouch', t: 0.5, fa1: 1.4, fa2: 2.0 },
    ykick_w: { t: -0.1, fl1: 1.2, fl2: 0.3, bl1: -0.1 },
    ykick: { t: -0.55, hd: 0.3, fa1: 0.2, fa2: 1.8, ba1: -0.6, ba2: 0.4, fl1: 2.15, fl2: 2.2, bl1: -0.05, bl2: 0.0 },
    slash: { t: 0.35, fa1: 1.8, fa2: 1.2, ba1: -0.5, ba2: 0.3, fl1: 0.6, fl2: 0.2, bl1: -0.55, bl2: -0.35 },
  },
  intro: 'You never saw me coming.',
  wins: ['Too slow. Even your shadow gave up.', 'The moon saw everything. You saw nothing.', 'My blade only needed one breath.'],
  ropes: [
    { id: 'tail', at: (sk, r) => headPt(sk, -r * 0.85, -r * 0.8), n: 7, seg: 7, w0: 5.5, w1: 1.5, color: 'hair', grav: 0.35, wind: 0.5 },
    { id: 'scarf1', at: sk => [sk.neck[0] - 5, sk.neck[1] + 3], n: 9, seg: 9, w0: 5.5, w1: 4, color: 'scarf', grav: 0.12, wind: 0.95, fork: true },
    { id: 'scarf2', at: sk => [sk.neck[0] - 6, sk.neck[1] + 6], n: 7, seg: 9, w0: 4.5, w1: 3, color: 'scarf', grav: 0.2, wind: 0.75, fork: true },
  ],
  hairBack(g, r, c, R) { polyR(g, r, [[0.86, -0.66], [0.3, -1.18], [-0.5, -1.12], [-1.08, -0.5], [-1.12, 0.28], [-0.7, 0.62], [-0.3, 0.2], [0.4, -0.5]], c.hair, R); },
  hairFront(g, r, c, R) {
    if (!R.mono) {
      poly(g, [[0.15 * r, 0.25 * r], [1.06 * r, 0.12 * r], [0.98 * r, 0.56 * r], [0.74 * r, 0.94 * r], [0.25 * r, 1.02 * r], [-0.45 * r, 0.55 * r]], c.mask, R);
      g.strokeStyle = 'rgba(180,92,255,0.6)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0.2 * r, 0.45 * r); g.lineTo(0.95 * r, 0.32 * r); g.stroke();
    }
    polyR(g, r, [[0.75, -0.88], [1.0, -0.2], [1.14, 0.55], [0.82, 0.05], [0.8, 0.45], [0.55, -0.1], [0.2, -0.88], [-0.4, -1.0]], c.hair, R);
    shine(g, r, [[0.0, -0.95], [0.45, -0.75]], R);
    if (!R.mono) { g.strokeStyle = OUTLINE; g.lineWidth = 0.28 * r; g.beginPath(); g.moveTo(-0.95 * r, -0.35 * r); g.quadraticCurveTo(0, -0.62 * r, 0.9 * r, -0.42 * r); g.stroke(); g.strokeStyle = '#2c2d40'; g.lineWidth = 0.18 * r; g.stroke(); circ(g, 0.62 * r, -0.52 * r, 0.12 * r, '#8b90a8', R); }
  },
  neckWear(g, sk, p, c, R) { limb(g, [sk.neck[0] - 4, sk.neck[1] + 4], [sk.neck[0] + 5, sk.neck[1] + 2], 7.5, 7, c.scarf, R); },
  torsoDetail(g, L, bw, c) {
    g.fillStyle = '#34364c'; g.beginPath(); g.moveTo(-6 * bw, -L * 0.92); g.lineTo(12 * bw, -L * 0.94); g.lineTo(14 * bw, -L * 0.52); g.lineTo(-4 * bw, -L * 0.48); g.closePath(); g.fill();
    g.strokeStyle = c.belt; g.lineWidth = 3; g.beginPath(); g.moveTo(-12 * bw, -L * 0.9); g.lineTo(12 * bw, -L * 0.15); g.stroke();
  },
  weaponFront(g, sk, p, c, R) {
    const a = p.fa2 + Math.PI * 0.86, [hx, hy] = sk.fh, dx = Math.sin(a), dy = Math.cos(a), L = 24;
    poly(g, [[hx - dy * 3.2, hy + dx * 3.2], [hx + dx * L, hy + dy * L], [hx + dy * 3.2, hy - dx * 3.2]], '#d5dae8', R, 3);
  },
  moves: Object.assign(baseNormals({ dmg: 0.86, spd: -1, rng: 1.05 }), {
    sp1: {
      name: 'KUNAI', jp: '苦無', desc: 'Fast throwing knife. Works in the air (thrown downward).', special: 1, lvl: 4, air: 'both', poses: ['jab_w', 'throw'], st: 8, act: 1, rec: 14, cd: 32, sfx: 'kunai',
      spawn: { f: 8, fn(F) { const air = !F.onGround; BT.spawn({ owner: F, kind: 'kunai', x: F.x + F.facing * 40, y: F.y - (air ? 95 : 135), vx: F.facing * (air ? 12 : 16), vy: air ? 8 : 0, w: 36, h: 18, dmg: 42, hs: 16, bs: 10, kb: 4, life: 90, str: 1, color: F.ch.colors.accent }); } },
    },
    sp1f: {
      name: 'SHURIKEN STORM', jp: '手裏剣嵐', desc: 'Three spinning stars in a spread.', special: 1, lvl: 4, poses: ['cast_w', 'throw'], st: 12, act: 1, rec: 20, cd: 80, sfx: 'kunai',
      spawn: { f: 12, fn(F) { [-0.2, 0, 0.2].forEach(a => BT.spawn({ owner: F, kind: 'shuriken', x: F.x + F.facing * 45, y: F.y - 130, vx: F.facing * 11 * Math.cos(a), vy: 11 * Math.sin(a), w: 32, h: 32, dmg: 30, hs: 14, bs: 9, kb: 4, life: 100, str: 1, color: '#d9c2ff' })); } },
    },
    counter: {
      name: 'UTSUSEMI', jp: '空蝉の術', desc: 'Counter. Swaps with a log, reappears behind the attacker and strikes.', special: 1, lvl: 4, counter: 1, poses: ['counter', 'counter'], st: 2, act: 20, rec: 18, cd: 100,
      onCounter(F, A) {
        FX.dust(F.x, F.y - 80, 16, 'rgba(225,225,235,0.7)');
        BT.spawn({ owner: F, kind: 'log', x: F.x, y: F.y - 70, vx: -F.facing * 1, vy: -4, harmless: true, life: 45, w: 1, h: 1 });
        F.x = clamp(A.x - A.facing * 75, 60, STAGE_W - 60); F.facing = A.x > F.x ? 1 : -1;
        F.afterimage = 10; Sound.play('teleport'); F.startMove('utsuSlash', true);
      },
    },
    utsuSlash: { name: 'SHADOW CUT', jp: '影斬り', lvl: 5, poses: ['cast_w', 'slash'], st: 4, act: 4, rec: 18, dmg: 85, hs: 28, kb: 8, kd: 1, hb: { x: -5, y: -175, w: 90, h: 130 }, invuln: [0, 10], str: 3, sfx: 'slash', sw: { cx: 0, cy: -120, r: 85, a0: -1.6, a1: 0.9 } },
    sp2: {
      name: 'SHADOW STEP', jp: '影走り', desc: 'Vanish and reappear behind the opponent with a slash.', special: 1, lvl: 4, poses: ['crouch', 'slash'], st: 14, act: 4, rec: 16, dmg: 70, hs: 22, bs: 14, kb: 8,
      hb: { x: -5, y: -175, w: 90, h: 130 }, cd: 80, str: 2, sfx: 'slash', invuln: [3, 13], sw: { cx: 0, cy: -120, r: 85, a0: -1.6, a1: 0.9 },
      tick(F, f, O) {
        if (f === 3) { F.hidden = true; FX.dust(F.x, F.y - 80, 14, 'rgba(120,80,170,0.6)'); FX.burst(F.x, F.y - 90, F.ch.colors.accent, 14, 6); Sound.play('teleport'); }
        if (f === 12) { const side = O.x > F.x ? 1 : -1; F.x = clamp(O.x + side * 80, 50, STAGE_W - 50); F.facing = O.x > F.x ? 1 : -1; F.hidden = false; FX.dust(F.x, F.y - 80, 10, 'rgba(120,80,170,0.6)'); F.afterimage = 10; }
      },
    },
    sp2d: {
      name: 'FALLING MOON', jp: '落月', desc: 'Leap and dive kick. Overhead. Usable in the air.', special: 1, lvl: 4, air: 'both', poses: ['flip', 'jkick'], st: 16, act: 20, rec: 8, dmg: 88, hs: 26, bs: 14, kb: 7, kd: 1, type: 'overhead',
      hb: { x: 0, y: -75, w: 74, h: 75 }, cd: 90, str: 3, landRec: 10,
      tick(F, f) { if (f === 1) { if (F.onGround) { F.vy = -14; F.onGround = false; } else F.vy = -6; F.vx = F.facing * 2; } if (f === 16) { F.vy = 14; F.vx = F.facing * 9; F.afterimage = 14; Sound.play('whoosh', 1.4); } },
    },
    ult: {
      name: 'THOUSAND PETAL DANCE', jp: '千桜乱舞', desc: 'Ultimate. Vanishing slash storm under falling blossoms.', ult: 1, lvl: 6, cost: 100, poses: ['dash', 'slash'], st: 6, act: 16, rec: 26, dmg: 40, hs: 40, bs: 20, kb: 6,
      hb: { x: -10, y: -185, w: 100, h: 175 }, invuln: [0, 24], str: 3,
      tick(F, f) { if (f > 6 && f <= 22) { F.vx = F.facing * 17; F.ctrlVel = true; F.afterimage = 6; } },
      onHit(F, D) { BT.startCine(F, D, CINE.yoru); return true; },
    },
  }),
};
YORU.moves.H = { ...YORU.moves.H, poses: ['ykick_w', 'ykick'], hb: { x: 10, y: -205, w: 92, h: 60 }, sw: { cx: 0, cy: -130, r: 92, a0: 0.4, a1: -1.6 } };
YORU.moves.M = { ...YORU.moves.M, poses: ['jab_w', 'slash'], hb: { x: 10, y: -160, w: 82, h: 50 }, sw: { cx: 0, cy: -120, r: 78, a0: -1.4, a1: 0.7 } };

// =============================== SERA =================================
const SERA = {
  id: 'sera', name: 'SERA', jp: 'セラ', title: 'The Storm Sage', titleJp: '嵐の賢者',
  style: 'ELEMENTALIST', desc: 'A prodigy who bound fire and lightning to her staff. Controls space with zones, pillars and beams.',
  stats: { power: 3, speed: 2, range: 5, defense: 2 },
  scale: 1.0, health: 950, walk: 4.0, backWalk: 3.6, jumpV: -17, jumpX: 4.2, dashV: 10,
  dims: { ...DIMS, headR: 16.5 }, build: { arm: 0.82, leg: 0.86, torso: 0.86 },
  colors: { skin: '#fbe4d8', hair: '#e6f4ff', top: '#1d3f80', leg: '#162c58', boot: '#2a2240', foot: '#2a2240', uarm: '#1d3f80', farm: '#1d3f80', hand: '#fbe4d8', cuff: '#e9c46a', belt: '#e9c46a', eye: '#3fd0ff', accent: '#3fd8ff', gold: '#ffd46b', robe: '#1d3f80' },
  stance: { t: 0.02, hd: -0.05, fa1: 0.75, fa2: 1.95, ba1: 0.35, ba2: 1.3, fl1: 0.25, fl2: 0.1, bl1: -0.22, bl2: -0.1, sa: 3.0 },
  poses: {
    victory: { t: -0.1, hd: -0.35, fa1: 0.6, fa2: 1.8, ba1: 2.85, ba2: 3.05, sa: 3.1 },
    intro: { t: -0.1, hd: -0.35, fa1: 0.6, fa2: 1.8, ba1: 2.85, ba2: 3.05, sa: 3.1 },
    raise: { t: -0.12, hd: -0.35, fa1: 2.4, fa2: 2.9, ba1: 2.85, ba2: 3.05, sa: 3.1 },
    poke_w: { t: -0.1, ba1: -0.2, ba2: 1.2, sa: 1.75, fa1: 0.5, fa2: 2.2 },
    poke: { t: 0.3, ba1: 1.3, ba2: 1.55, sa: 1.62, fa1: 0.3, fa2: 1.4, fl1: 0.6, bl1: -0.5 },
    swing_w: { t: -0.25, ba1: 2.6, ba2: 3.0, sa: 3.9, fa1: 0.8, fa2: 2.3 },
    swing: { t: 0.45, ba1: 1.4, ba2: 1.3, sa: 1.15, fa1: -0.2, fa2: 0.6, fl1: 0.65, bl1: -0.55 },
    lowpoke: { base: 'crouch', ba1: 1.1, ba2: 1.4, sa: 1.75, t: 0.3 },
    cast: { t: 0.22, fa1: 1.52, fa2: 1.57, ba1: 0.9, ba2: 1.4, sa: 2.4, fl1: 0.6, fl2: 0.2, bl1: -0.5, bl2: -0.3 },
  },
  intro: 'The storm answers only to me.',
  wins: ['Lightning never strikes twice. It never needed to.', 'You were caught in my storm from the start.', 'Study the elements. Then try again.'],
  ropes: [
    { id: 'lock1', at: (sk, r) => headPt(sk, -r * 0.95, -r * 0.15), n: 8, seg: 9, w0: 8, w1: 2, color: 'hair', grav: 0.4, wind: 0.45 },
    { id: 'lock2', at: (sk, r) => headPt(sk, -r * 0.7, r * 0.45), n: 7, seg: 8, w0: 5, w1: 1.5, color: 'hair', grav: 0.4, wind: 0.4 },
  ],
  hairBack(g, r, c, R) {
    polyR(g, r, [[0.86, -0.7], [0.2, -1.22], [-0.72, -1.06], [-1.28, -0.3], [-1.35, 0.8], [-1.15, 1.75], [-0.5, 1.35], [-0.3, 0.6]], c.hair, R);
    if (!R.mono) { g.fillStyle = 'rgba(90,140,200,0.35)'; g.beginPath(); g.moveTo(-1.2 * r, 0); g.lineTo(-1.15 * r, 1.6 * r); g.lineTo(-0.6 * r, 1.3 * r); g.closePath(); g.fill(); }
  },
  hairFront(g, r, c, R, o) {
    polyR(g, r, [[0.82, -0.88], [1.16, -0.12], [0.94, -0.28], [1.05, 0.5], [0.76, 0.05], [0.4, -0.32], [0.0, -0.98], [-0.5, -0.98]], c.hair, R);
    polyR(g, r, [[0.22, -0.5], [0.45, 0.6], [0.32, 1.45], [0.12, 0.7], [-0.05, 0.0]], c.hair, R);
    shine(g, r, [[-0.3, -0.95], [0.4, -0.88]], R);
    if (R.mono) return;
    g.strokeStyle = c.gold; g.lineWidth = 0.1 * r; g.beginPath(); g.moveTo(-0.9 * r, -0.55 * r); g.quadraticCurveTo(0, -0.95 * r, 0.82 * r, -0.62 * r); g.stroke();
    g.save(); g.shadowColor = c.accent; g.shadowBlur = 10; circ(g, 0.62 * r, -0.72 * r, 0.13 * r, c.accent, R); g.restore();
  },
  torsoDetail(g, L, bw, c) {
    g.strokeStyle = c.gold; g.lineWidth = 3; g.beginPath(); g.moveTo(9 * bw, -L - 2); g.lineTo(8 * bw, 4); g.stroke();
    g.fillStyle = '#0f2147'; g.beginPath(); g.moveTo(-10 * bw, -L * 0.95); g.lineTo(4 * bw, -L - 10); g.lineTo(10 * bw, -L * 0.98); g.lineTo(-4 * bw, -L * 0.8); g.closePath(); g.fill();
    g.strokeStyle = c.gold; g.lineWidth = 1.5; g.stroke();
  },
  weaponBack(g, sk, p, c, R, o) {
    const [hx, hy] = sk.bh, dx = Math.sin(p.sa), dy = Math.cos(p.sa);
    const top = [hx + dx * 84, hy + dy * 84], bot = [hx - dx * 42, hy - dy * 42];
    limb(g, bot, top, 2.8, 2.8, '#4a3426', R);
    if (R.mono) { circ(g, top[0], top[1], 8, null, R); return; }
    const nx = -dy, ny = dx;
    g.strokeStyle = c.gold; g.lineWidth = 3; g.beginPath(); g.arc(top[0] - dx * 4, top[1] - dy * 4, 12, Math.atan2(ny, nx) - 1.1, Math.atan2(ny, nx) + 1.1 + Math.PI, false); g.stroke();
    g.save(); g.shadowColor = c.accent; g.shadowBlur = 18 + Math.sin((o.T || 0) * 0.2) * 6;
    circ(g, top[0] + dx * 3, top[1] + dy * 3, 7.5, '#bff6ff', R); g.restore();
  },
  drawSkirt(g, sk, p, c, R, o) {
    const T = o.T || 0, fl = Math.sin(T * 0.15) * 3;
    const hb = [sk.hip[0] - 15, sk.hip[1] - 4], hf = [sk.hip[0] + 13, sk.hip[1] - 4];
    const kb = [sk.bk[0] - 12 + fl, sk.bk[1] + 18], kf = [sk.fk[0] + 10, sk.fk[1] + 16];
    const mid = [(kb[0] + kf[0]) / 2, Math.max(kb[1], kf[1]) + 8 - fl];
    poly(g, [hb, kb, mid, kf, hf], c.robe, R);
    if (!R.mono) { g.strokeStyle = c.gold; g.lineWidth = 2.5; g.beginPath(); g.moveTo(kb[0], kb[1]); g.lineTo(mid[0], mid[1]); g.lineTo(kf[0], kf[1]); g.stroke(); g.fillStyle = SHADE; g.beginPath(); g.moveTo(hb[0], hb[1]); g.lineTo(kb[0], kb[1]); g.lineTo(mid[0] - 6, mid[1]); g.lineTo(sk.hip[0] - 3, sk.hip[1]); g.fill(); }
  },
  moves: Object.assign(baseNormals({ dmg: 0.92, rng: 1.15 }), {
    sp1: {
      name: 'FLAME ORB', jp: '焔玉', desc: 'Slow, large fireball that hits twice.', special: 1, lvl: 4, poses: ['cast_w', 'cast'], st: 16, act: 1, rec: 22, cd: 70, sfx: 'fire',
      spawn: { f: 16, fn(F) { BT.spawn({ owner: F, kind: 'orb', x: F.x + F.facing * 75, y: F.y - 120, vx: F.facing * 5.5, w: 80, h: 80, dmg: 45, hits: 2, interval: 10, hs: 20, bs: 14, kb: 6, life: 220, str: 3, color: '#ff7a2a' }); } },
    },
    sp1f: {
      name: 'THUNDER SPEAR', jp: '雷槍', desc: 'Calls lightning down on the opponent’s position after a short delay. Launches.', special: 1, lvl: 4, poses: ['raise', 'raise'], st: 12, act: 1, rec: 24, cd: 120,
      spawn: { f: 12, fn(F, O) { const tx = clamp(O.x, F.x - 650, F.x + 650); BT.spawn({ owner: F, kind: 'pillar', x: tx, y: GROUND - 210, w: 92, h: 420, delay: 28, life: 18, dmg: 92, hs: 30, bs: 16, kb: 3, launch: -13, kd: 1, color: '#5fe0ff', str: 3, clash: 0 }); Sound.play('energy'); } },
    },
    counter: {
      name: 'MIRROR WARD', jp: '鏡結界', desc: 'Barrier. Reflects projectiles; answers melee with a lightning burst.', special: 1, lvl: 4, counter: 1, poses: ['counter', 'cast'], st: 2, act: 26, rec: 16, cd: 100,
      onCounter(F, A, proj) {
        if (proj) {
          proj.owner = F; proj.vx = -proj.vx * 1.3; proj.vy = -proj.vy; proj.color = '#7ff6ff'; proj.hitT = 0; proj.life = Math.max(proj.life, 80);
          FX.ring(F.x + F.facing * 40, F.y - 110, '#7ff6ff', 20, 120, 16, 5); Sound.play('counter'); F.mf = F.move.st + F.move.act;
        } else F.startMove('wardBurst', true);
      },
    },
    wardBurst: { name: 'DISCHARGE', jp: '放電', lvl: 5, poses: ['cast_w', 'cast'], st: 3, act: 5, rec: 20, dmg: 80, hs: 28, kb: 14, kd: 1, hb: { x: -30, y: -195, w: 155, h: 195 }, invuln: [0, 10], str: 3, sfx: 'thunder',
      tick(F, f) { if (f === 3) for (let i = 0; i < 6; i++) { const a = rand(0, TAU); FX.p({ type: 'bolt', x: F.x, y: F.y - 100, x2: F.x + Math.cos(a) * 140, y2: F.y - 100 + Math.sin(a) * 120, size: 3, life: 10, color: F.ch.colors.accent }); } } },
    sp2: {
      name: 'FLAME RING', jp: '炎輪', desc: 'Ring of fire around her. Pushes enemies away.', special: 1, lvl: 4, poses: ['raise', 'cast'], st: 10, act: 16, rec: 18, dmg: 48, hits: 2, interval: 9, hs: 20, bs: 14, kb: 10,
      hb: { x: -175, y: -175, w: 350, h: 175 }, cd: 110, str: 2, sfx: 'fire', ring: 1,
      tick(F, f) {
        if (f === 10) FX.ring(F.x, F.y - 80, '#ff8a2a', 20, 185, 22, 10, 0.55);
        if (f >= 10 && f < 26) for (let i = 0; i < 6; i++) { const a = rand(0, TAU), rr = 40 + (f - 10) * 6.5; FX.flame(F.x + Math.cos(a) * rr, F.y - 80 + Math.sin(a) * rr * 0.55, '#ff7a1a', 1, 3, 1.5); }
      },
    },
    sp2d: {
      name: 'STORM CALL', jp: '嵐召喚', desc: 'Three lightning pillars march forward.', special: 1, lvl: 4, poses: ['raise', 'raise'], st: 14, act: 1, rec: 26, cd: 150,
      spawn: { f: 14, fn(F) { [150, 290, 430].forEach((d, i) => BT.spawn({ owner: F, kind: 'pillar', x: clamp(F.x + F.facing * d, 30, STAGE_W - 30), y: GROUND - 210, w: 84, h: 420, delay: 10 + i * 12, life: 14, dmg: 58, hs: 26, bs: 12, kb: 4, launch: -9, kd: 1, color: '#9ae9ff', str: 2, clash: 0 })); Sound.play('energy'); } },
    },
    ult: {
      name: 'CELESTIAL JUDGEMENT', jp: '天裁・雷皇砲', desc: 'Ultimate. A full-screen beam of lightning.', ult: 1, lvl: 6, cost: 100, poses: ['raise', 'cast'], st: 20, act: 1, rec: 60, invuln: [0, 34],
      tick(F, f) { if (f < 20) { const t = F.staffTop(); FX.burst(t[0], t[1], F.ch.colors.accent, 2, 3); } },
      spawn: { f: 20, fn(F) { BT.spawn({ owner: F, kind: 'beam', follow: 1, x: F.x, y: F.y - 118, w: 1500, h: 110, life: 72, hits: 10, interval: 6, dmg: 26, hs: 22, bs: 10, kb: 1.5, str: 2, clash: 0, color: F.ch.colors.accent, final: { dmg: 80, launch: -13, kd: 1, str: 4, shake: 18, impact: 4 } }); Sound.play('thunder'); Sound.play('explosion'); FX.shakeIt(10); } },
    },
  }),
};
SERA.moves.M = { ...SERA.moves.M, poses: ['poke_w', 'poke'], hb: { x: 20, y: -140, w: 115, h: 32 }, sw: null };
SERA.moves.H = { ...SERA.moves.H, poses: ['swing_w', 'swing'], hb: { x: 15, y: -195, w: 115, h: 120 }, sw: { cx: -10, cy: -130, r: 110, a0: -1.8, a1: 0.6, color: '#7fe9ff' } };
SERA.moves.cM = { ...SERA.moves.cM, poses: ['crouch', 'lowpoke'], hb: { x: 20, y: -45, w: 110, h: 36 } };

// =============================== GORO =================================
const GORO = {
  id: 'goro', name: 'GORO', jp: 'ゴロウ', title: 'The Iron Oni', titleJp: '鉄の鬼',
  style: 'BERSERKER', desc: 'A demon-blooded giant with a war-cleaver. Slow, armored attacks, crushing grabs, and a rage transformation.',
  stats: { power: 5, speed: 1, range: 4, defense: 5 },
  scale: 1.17, health: 1150, walk: 3.1, backWalk: 2.7, jumpV: -15.5, jumpX: 3.8, dashV: 8.5, wide: 1.2,
  dims: { ...DIMS }, build: { arm: 1.35, leg: 1.25, torso: 1.35 },
  colors: { skin: '#c58a64', hair: '#17110f', top: '#c58a64', leg: '#2b2320', boot: '#1a1414', foot: '#1a1414', uarm: '#c58a64', farm: '#c58a64', hand: '#2a2020', cuff: '#5a2224', eye: '#ff4a2a', accent: '#ff3b1f', horn: '#efe6cf', armor: '#5a2224', gold: '#d9a441', rope: '#e8dfc8' },
  rageColors: null,
  stance: { t: 0.22, hd: 0.1, fa1: 0.12, fa2: 2.25, ba1: 0.45, ba2: 1.25, fl1: 0.5, fl2: 0.15, bl1: -0.45, bl2: -0.2, wa: 4.0 },
  poses: {
    victory: { t: -0.15, hd: -0.4, fa1: 3.0, fa2: 3.1, wa: 3.2, ba1: 2.4, ba2: 2.9, fl1: 0.5, bl1: -0.5 },
    intro: { base: 'slam', wa: 1.3 },
    axe_w: { t: -0.2, hd: 0, fa1: 2.6, fa2: 3.0, wa: 4.3, ba1: 2.4, ba2: 2.9 },
    axe: { t: 0.6, hd: 0.2, fa1: 1.45, fa2: 1.3, wa: 1.75, ba1: 1.2, ba2: 1.3, fl1: 0.7, fl2: 0.2, bl1: -0.6, bl2: -0.4 },
    jaxe: { base: 'jump', t: 0.5, fa1: 1.3, fa2: 1.0, wa: 1.2 },
    slam: { t: 1.05, hd: -0.6, fa1: 0.9, fa2: 0.6, wa: 1.3, ba1: 0.5, ba2: 0.25, fl1: 1.25, fl2: -0.05, bl1: 0.35, bl2: -1.25 },
    lift: { t: -0.15, hd: -0.3, fa1: 2.8, fa2: 2.9, wa: 4.5, ba1: 2.7, ba2: 2.85, fl1: 0.45, fl2: 0.2, bl1: -0.45, bl2: -0.25 },
  },
  intro: 'I will break you... and the earth beneath you!',
  wins: ['RAAAAGH! Is that all the fight you had?!', 'Mountains crumble. So did you.', 'Bring an army next time.'],
  ropes: [{ id: 'mane', at: (sk, r) => headPt(sk, -r * 1.0, -r * 0.1), n: 5, seg: 9, w0: 11, w1: 4, color: 'hair', grav: 0.3, wind: 0.5 }],
  hairBack(g, r, c, R, o) {
    const T = o.T || 0, pts = [];
    for (let i = 0; i <= 14; i++) {
      const a = -2.4 + i * (3.3 / 14), rr = i % 2 ? 0.95 : 1.75 + Math.sin(T * 0.1 + i) * 0.08;
      pts.push([Math.cos(a - Math.PI / 2) * rr * 1.05 - 0.2, Math.sin(a - Math.PI / 2) * rr]);
    }
    pts.push([-0.3, 0.5]);
    polyR(g, r, pts.map(([x, y]) => [x, y]), c.hair, R);
    polyR(g, r, [[-0.15, -0.85], [0.1, -0.9], [0.35, -1.7], [0.15, -2.05], [0.05, -1.5]], c.horn, R);
  },
  hairFront(g, r, c, R) {
    polyR(g, r, [[0.28, -0.78], [0.62, -0.85], [1.0, -1.6], [0.88, -2.2], [0.6, -1.5]], c.horn, R);
    polyR(g, r, [[-0.4, 0.55], [0.78, 0.78], [0.62, 1.3], [0.42, 1.0], [0.25, 1.45], [0.05, 1.05], [-0.2, 1.35], [-0.32, 0.9]], c.hair, R);
    polyR(g, r, [[0.1, -0.95], [0.95, -0.55], [0.6, -0.5], [0.75, -0.2], [0.35, -0.45], [-0.2, -0.9]], c.hair, R);
    if (R.mono) return;
    g.strokeStyle = '#c0182a'; g.lineWidth = 0.08 * r; g.beginPath(); g.moveTo(0.38 * r, 0.32 * r); g.lineTo(0.62 * r, 0.42 * r); g.moveTo(0.36 * r, 0.42 * r); g.lineTo(0.58 * r, 0.52 * r); g.stroke();
  },
  torsoDetail(g, L, bw, c) {
    g.fillStyle = c.armor; g.beginPath(); g.moveTo(-16 * bw, -L * 0.62); g.lineTo(16 * bw, -L * 0.68); g.lineTo(16 * bw, 6); g.lineTo(-16 * bw, 6); g.closePath(); g.fill();
    g.strokeStyle = c.gold; g.lineWidth = 2;
    for (let i = 0; i < 3; i++) { const y = -L * 0.5 + i * L * 0.18; g.beginPath(); g.moveTo(-16 * bw, y); g.lineTo(16 * bw, y - 3); g.stroke(); }
    g.strokeStyle = '#2a1414'; g.lineWidth = 5; g.beginPath(); g.moveTo(-14 * bw, -L * 0.95); g.lineTo(14 * bw, -L * 0.3); g.stroke();
    g.strokeStyle = 'rgba(80,30,20,0.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(8 * bw, -L * 0.9); g.quadraticCurveTo(14 * bw, -L * 0.8, 10 * bw, -L * 0.7); g.stroke();
  },
  torsoOver(g, L, bw, c, R) {
    limb(g, [-15 * bw, -2], [15 * bw, -4], 5.5, 5.5, c.rope, R);
    if (!R.mono) {
      g.strokeStyle = 'rgba(120,100,80,0.6)'; g.lineWidth = 1.5;
      for (let i = -12; i < 14; i += 5) { g.beginPath(); g.moveTo(i * bw, -7); g.lineTo(i * bw + 4, 2); g.stroke(); }
      for (const x of [-6, 8]) poly(g, [[x * bw, 2], [x * bw + 5, 8], [x * bw, 12], [x * bw + 5, 18], [x * bw + 1, 19], [x * bw - 3, 13], [x * bw + 1, 9], [x * bw - 3, 4]], '#ffffff', R, 2);
    }
  },
  shoulderOver(g, sk, p, c, R) {
    const [x, y] = sk.sF;
    g.save(); g.translate(x, y); g.rotate(p.fa1 * 0.35 - 0.2);
    for (let i = 2; i >= 0; i--) poly(g, [[-16, -10 + i * 9], [18, -12 + i * 9], [20, -1 + i * 9], [-18, 2 + i * 9]], i ? '#4a1b1d' : c.armor, R, 4);
    if (!R.mono) { g.fillStyle = c.gold; g.beginPath(); g.arc(0, -6, 2.5, 0, TAU); g.fill(); }
    g.restore();
  },
  weaponFront(g, sk, p, c, R) {
    const [hx, hy] = sk.fh, a = p.wa, dx = Math.sin(a), dy = Math.cos(a), nx = -Math.cos(a), ny = Math.sin(a);
    const E = [hx + dx * 98, hy + dy * 98];
    limb(g, [hx - dx * 16, hy - dy * 16], E, 3.6, 3.2, '#3a2616', R);
    const P = (u, v) => [E[0] + dx * u + nx * v, E[1] + dy * u + ny * v];
    poly(g, [P(6, -4), P(9, 25), P(-5, 41), P(-28, 43), P(-38, 28), P(-33, -4)], c.axe || '#8f99a6', R);
    if (!R.mono) {
      g.strokeStyle = '#eef4fb'; g.lineWidth = 3; g.beginPath(); const a1 = P(9, 25), a2 = P(-5, 41), a3 = P(-28, 43); g.moveTo(a1[0], a1[1]); g.lineTo(a2[0], a2[1]); g.lineTo(a3[0], a3[1]); g.stroke();
      g.fillStyle = c.accent; const m = P(-14, 16); g.beginPath(); g.arc(m[0], m[1], 4, 0, TAU); g.fill();
      poly(g, [P(4, -4), P(22, -2), P(4, 4)], '#8f99a6', R, 3);
    }
  },
  moves: Object.assign(baseNormals({ dmg: 1.32, spd: 2, rng: 1.12 }), {
    sp1: {
      name: 'ONI CHARGE', jp: '鬼突進', desc: 'Armored shoulder charge (absorbs 2 hits).', special: 1, lvl: 4, poses: ['crouch', 'lunge'], st: 10, act: 18, rec: 22, dmg: 105, hs: 26, bs: 16, kb: 15, kd: 1,
      hb: { x: 0, y: -185, w: 82, h: 155 }, armor: [1, 28], armorHits: 2, cd: 80, str: 3, shake: 9,
      tick(F, f) { if (f > 10 && f <= 28) { F.vx = F.facing * 9.5; F.ctrlVel = true; F.afterimage = 4; if (f % 3 === 0) FX.dust(F.x - F.facing * 30, GROUND, 2); } },
    },
    sp1f: {
      name: 'ONI CRUSHER', jp: '鬼砕き', desc: 'Command grab. Unblockable, beats blocking. Short range.', special: 1, lvl: 4, poses: ['grab', 'grab'], st: 6, act: 4, rec: 30, dmg: 1, type: 'unblock', grab: 1,
      hb: { x: 10, y: -175, w: 72, h: 155 }, cd: 70, str: 3,
      onHit(F, D) { BT.startCine(F, D, CINE.goroGrab, { zoom: 1.15 }); return true; },
    },
    counter: {
      name: 'UNBREAKABLE', jp: '不動', desc: 'Absorbs an attack at half damage, then smashes back.', special: 1, lvl: 4, counter: 1, absorb: 1, poses: ['block', 'block'], st: 2, act: 30, rec: 12, cd: 100,
      onCounter(F) { F.startMove('fudoSmash', true); },
    },
    fudoSmash: { name: 'IMMOVABLE SMASH', jp: '不動砕', lvl: 5, poses: ['axe_w', 'axe'], st: 6, act: 5, rec: 22, dmg: 125, hs: 30, kb: 14, kd: 1, hb: { x: 10, y: -195, w: 130, h: 155 }, invuln: [0, 11], str: 4, shake: 14, sw: { cx: 0, cy: -150, r: 115, a0: -2.0, a1: 0.6 } },
    sp2: {
      name: 'SKYBREAKER', jp: '天割り', desc: 'Armored overhead cleaver. Must be blocked standing.', special: 1, lvl: 4, poses: ['axe_w', 'axe'], st: 22, act: 5, rec: 24, dmg: 145, hs: 30, bs: 20, kb: 10, kd: 1, type: 'overhead',
      armor: [4, 22], armorHits: 1, hb: { x: 20, y: -205, w: 125, h: 205 }, cd: 80, str: 4, shake: 14, sw: { cx: 0, cy: -150, r: 120, a0: -2.1, a1: 0.8 },
      tick(F, f) { if (f === 24) { const x = F.x + F.facing * 120 * F.s; FX.rocks(x, GROUND, 10); FX.dust(x, GROUND, 10); Sound.play('slam'); } },
    },
    sp2d: {
      name: 'QUAKE', jp: '震撃', desc: 'Stomp sends a fissure along the ground. Hits low.', special: 1, lvl: 4, poses: ['slam_w', 'slam'], st: 20, act: 1, rec: 24, cd: 140,
      tick(F, f) { if (f === 2) { F.vy = -6; F.onGround = false; } },
      spawn: { f: 20, fn(F) { BT.spawn({ owner: F, kind: 'quake', x: F.x + F.facing * 60, y: GROUND - 30, vx: F.facing * 8, w: 70, h: 60, dmg: 85, hs: 30, bs: 14, kb: 6, kd: 1, launch: -9, type: 'low', life: 110, str: 3, clash: 0, color: F.ch.colors.accent }); FX.shakeIt(10); Sound.play('slam'); } },
    },
    ult: {
      name: 'DEMON AWAKENING', jp: '鬼神覚醒', desc: 'Ultimate. Armored lunging grab with a brutal finisher. Triggers RAGE (+25% damage, armored heavies) either way.', ult: 1, lvl: 6, cost: 100, poses: ['grab', 'grab'], st: 8, act: 14, rec: 30,
      dmg: 1, type: 'unblock', grab: 1, hb: { x: 0, y: -185, w: 112, h: 175 }, armor: [0, 22], armorHits: 9, str: 3,
      onStart(F) { F.rage = 600; FX.flashScreen('#ff2020', 12, 0.4); },
      tick(F, f) { if (f > 8 && f <= 22) { F.vx = F.facing * 11; F.ctrlVel = true; F.afterimage = 5; } },
      onHit(F, D) { BT.startCine(F, D, CINE.goroUlt); return true; },
    },
  }),
};
GORO.rageColors = { ...GORO.colors, skin: '#c4473a', top: '#c4473a', uarm: '#c4473a', farm: '#c4473a', accent: '#ff1a1a', eye: '#ffdd33' };
GORO.moves.H = { ...GORO.moves.H, name: 'Cleaver', poses: ['axe_w', 'axe'], st: 17, act: 5, rec: 22, dmg: 132, hb: { x: 20, y: -195, w: 120, h: 150 }, armor: [4, 17], armorHits: 1, str: 4, shake: 10, sw: { cx: 0, cy: -150, r: 118, a0: -2.0, a1: 0.7 } };
GORO.moves.jH = { ...GORO.moves.jH, poses: ['jheavy_w', 'jaxe'], hb: { x: 5, y: -130, w: 100, h: 110 } };

const CHARS = [KAZUMA, YORU, SERA, GORO];

const MOVELIST = [
  ['L', 'Light Attack', 'L'], ['M', 'Medium Attack', 'M'], ['H', 'Heavy Attack', 'H'],
  ['cL', 'Crouch Light', '↓ + L'], ['cM', 'Crouch Medium (low)', '↓ + M'], ['cH', 'Sweep (low, knockdown)', '↓ + H'],
  ['jL', 'Air Light (overhead)', 'air: L'], ['jM', 'Air Medium (overhead)', 'air: M'], ['jH', 'Air Heavy (overhead)', 'air: H'],
  ['LH', 'Launcher (jump-cancel on hit)', 'L + H'], ['FF', 'Dash Attack', '→ → + H'],
  ['sp1', null, 'SP1'], ['sp1f', null, '↓ → + SP1'], ['counter', null, '↓ ← + SP1'],
  ['sp2', null, 'SP2'], ['sp2d', null, '↓ ↓ + SP2'], ['ult', null, 'SP1 + SP2  (full gauge)'],
];
