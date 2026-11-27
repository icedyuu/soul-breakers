// ===================== SIX SPECIALS FOR THE CLASSIC FIGHTERS =====================
// Every fighter now has the full six-slot layout: SP1, ↓→SP1, ↓←SP1, SP2, ↓→SP2, ↓↓SP2.
// The six classics (Kazuma, Yoru, Sera, Goro, Frog Trinity, Tetsumichi) get a ↓→SP2, Nue's human form gets a ↓↓SP2.
// Existing moves are untouched. Everything here is deterministic (rand() is only used for particles).

// ---------------------------------- projectiles ----------------------------------
EXTRA_PROJ.shadowbind = {   // Yoru: a creeping shadow along the floor
  update(p) { if (p.t % 2 === 0) FX.p({ type: 'smoke', x: p.x - Math.sign(p.vx) * 20, y: GROUND - rand(2, 14), vx: -p.vx * 0.15, vy: -0.4, life: 18, size: 9, color: 'rgba(60,30,110,0.45)', add: false, grow: 0.3 }); },
  draw(g, p) {
    const d = Math.sign(p.vx) || 1, k = Math.min(1, p.t / 6);
    g.translate(p.x, GROUND); g.scale(d, 1);
    g.fillStyle = 'rgba(20,8,40,0.85)'; g.beginPath(); g.ellipse(-20, -3, 62 * k, 9, 0, 0, TAU); g.fill();
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(180,92,255,0.8)'; g.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) { const ph = p.t * 0.5 + i * 1.7, x0 = -50 + i * 22; g.beginPath(); g.moveTo(x0, -2); g.quadraticCurveTo(x0 + 8 + Math.sin(ph) * 6, -22 - (i % 2) * 10, x0 + 16, -34 - Math.abs(Math.sin(ph)) * 10); g.stroke(); }
    g.fillStyle = 'rgba(210,150,255,0.9)'; g.beginPath(); g.arc(30, -6, 4, 0, TAU); g.fill();
  },
};
EXTRA_PROJ.gust = {         // Sera: wind blast left at her old spot
  update(p) { if (p.t % 2 === 0) for (let i = 0; i < 2; i++) FX.p({ type: 'spark', x: p.x + rand(-60, 60), y: p.y + rand(-70, 70), vx: p.dir * rand(6, 12), vy: rand(-1, 1), life: 10, size: 2.5, color: '#bff6ff' }); },
  draw(g, p) {
    const k = 1 - p.life / p.max; g.translate(p.x, p.y); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { g.strokeStyle = `rgba(190,245,255,${0.7 - i * 0.2 - k * 0.4})`; g.lineWidth = 6 - i * 1.5; g.beginPath(); g.ellipse(p.dir * i * 14, 0, 40 + k * 60 + i * 16, 70 + k * 30, 0, -1.2, 1.2 + i * 0.6); g.stroke(); }
    g.strokeStyle = 'rgba(95,224,255,0.7)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 30 + k * 50, 0, TAU); g.stroke();
  },
};

// ---------------------------------- KAZUMA: ↓→SP2 FLAME CYCLONE ----------------------------------
KAZUMA.moves.sp2f = {
  name: 'FLAME CYCLONE', jp: '旋炎脚', desc: 'Spinning fire kicks that travel forward. 4 hits, the last one knocks down.', special: 1, lvl: 4,
  st: 9, act: 24, rec: 20, dmg: 24, hits: 4, interval: 6, hs: 20, bs: 10, kb: 2.5, hb: { x: -40, y: -175, w: 150, h: 95 }, cd: 90, str: 2, sfx: 'whoosh',
  final: { dmg: 42, kb: 11, kd: 1, str: 3, shake: 8 },
  poseFn(F, f) { if (f <= 9) return 'kick_w'; if (f > 33) return 'stance'; return ((f - 9) >> 2) % 2 ? 'jkick' : 'kick'; },
  tick(F, f) {
    if (f > 9 && f <= 33) {
      F.vx = F.facing * 6.5; F.ctrlVel = true; F.afterimage = Math.max(F.afterimage, 3);
      const a = (f - 9) * 0.9; FX.flame(F.x + Math.cos(a) * 70, F.y - 125 + Math.sin(a) * 26, F.ch.colors.accent, 2, 6, 1.2);
      if ((f - 10) % 6 === 0) { Sound.play('whoosh', 1.2); FX.ring(F.x, F.y - 125, F.ch.colors.accent, 20, 95, 10, 4, 0.3); }
    }
  },
};

// ---------------------------------- YORU: ↓→SP2 SHADOW BIND ----------------------------------
YORU.moves.sp2f = {
  name: 'SHADOW BIND', jp: '影縛り', desc: 'Throws a kunai into the floor; her shadow creeps forward and binds the foe in place. Hits low.', special: 1, lvl: 4,
  poses: ['crouch', 'throw'], st: 11, act: 1, rec: 20, cd: 110, sfx: 'kunai', crouch: 1,
  spawn: { f: 11, fn(F) {
    BT.spawn({ owner: F, kind: 'shadowbind', x: F.x + F.facing * 50, y: GROUND - 22, vx: F.facing * 9, w: 80, h: 44, dmg: 40, hs: 50, bs: 14, kb: 0.5, type: 'low', life: 64, str: 2, clash: 0, color: F.ch.colors.accent, projOnHit: 1,
      onHit(A, D) { FX.wtext(D.x, D.y - 230 * D.s, 'BOUND!', { size: 26, color: '#ffffff', stroke: '#6a2ab0', life: 34 }); for (let i = 0; i < 8; i++) FX.p({ type: 'shard', x: D.x + rand(-30, 30), y: GROUND - rand(0, 90), vx: 0, vy: -rand(1, 3), life: 24, size: 4, color: '#2a1050', add: false }); return false; } });
    FX.burst(F.x + F.facing * 50, GROUND - 10, F.ch.colors.accent, 8, 4);
  } },
};

// ---------------------------------- SERA: ↓→SP2 GALE STEP ----------------------------------
SERA.moves.sp2f = {
  name: 'GALE STEP', jp: '疾風歩', desc: 'Leaves a wind blast that blows the foe away and rides the gust backwards. Invulnerable while she escapes.', special: 1, lvl: 4,
  poses: ['cast_w', 'cast'], st: 5, act: 1, rec: 18, cd: 120, invuln: [3, 16], sfx: 'storm',
  spawn: { f: 5, fn(F) { BT.spawn({ owner: F, kind: 'gust', x: F.x + F.facing * 55, y: F.y - 95, dir: F.facing, w: 170, h: 190, dmg: 38, hs: 22, bs: 14, kb: 17, kd: 1, life: 12, str: 2, clash: 0, color: '#bff6ff' }); FX.ring(F.x, F.y - 95, '#bff6ff', 20, 160, 16, 6); } },
  tick(F, f) { if (f >= 5 && f <= 20) { F.vx = -F.facing * (f < 14 ? 15 : 8); F.ctrlVel = true; F.afterimage = Math.max(F.afterimage, 6); if (f % 2) FX.p({ type: 'smoke', x: F.x, y: GROUND - rand(5, 40), vx: F.facing * 3, vy: -0.5, life: 16, size: 10, color: 'rgba(200,245,255,0.4)', add: false, grow: 0.5 }); } },
};
SERA.moves.sp2f.__ai = { reach: 170, kind: 'melee', anti: false, st: 5, low: false, over: false };

// ---------------------------------- GORO: ↓→SP2 ONI ROAR ----------------------------------
GORO.moves.sp2f = {
  name: 'ONI ROAR', jp: '鬼哮', desc: 'A demonic roar: armored startup, erases projectiles in front and dizzies a close foe. Heavy blockstun.', special: 1, lvl: 4,
  poses: ['raise', 'raise'], st: 16, act: 8, rec: 24, dmg: 70, hs: 40, bs: 22, kb: 3, hb: { x: 0, y: -230, w: 190, h: 230 }, armor: [1, 16], armorHits: 1, cd: 120, str: 3, shake: 10, sfx: 'roar',
  tick(F, f) {
    if (f === 16) { FX.ring(F.x + F.facing * 60, F.y - 150, F.ch.colors.accent, 20, 260, 20, 10); FX.ring(F.x + F.facing * 60, F.y - 150, '#ffffff', 10, 180, 16, 5); FX.shakeIt(12); FX.wtext(F.x, F.y - 260 * F.s, '鬼!!', { size: 64, font: FONT_JP, color: '#fff', stroke: F.ch.colors.accent, life: 40 }); }
    if (f >= 16 && f < 24) {
      for (const p of BT.projs) if (p.owner !== F && p.active() && (p.x - F.x) * F.facing > -40 && Math.abs(p.x - F.x) < 340 && p.y > F.y - 320) { p.dead = true; FX.burst(p.x, p.y, F.ch.colors.accent, 10, 6); }
      if (f % 2 === 0) FX.p({ type: 'shard', x: F.x + F.facing * rand(40, 220), y: F.y - rand(40, 220), vx: F.facing * rand(4, 9), vy: rand(-2, 2), life: 18, size: 4, color: '#ff6a4a' });
    }
  },
  onHit(F, D) { FX.wtext(D.x, D.y - 230 * D.s, 'DIZZY!', { size: 24, color: '#ffffff', stroke: '#c4473a', life: 40 }); return false; },
};

// ---------------------------------- FROG TRINITY: ↓→SP2 LEAPFROG ----------------------------------
FROGS.moves.sp2f = {
  name: 'LEAPFROG', jp: '蛙跳び', desc: 'Pipi springboards off Gamaoh’s belly straight up. Invulnerable start, anti-air launcher.', special: 1, lvl: 4,
  st: 5, act: 10, rec: 22, dmg: 82, hs: 30, bs: 12, kb: 2, launch: -14, kd: 1, hb: { x: 0, y: -300, w: 115, h: 240 }, invuln: [0, 8], cd: 60, str: 3, sfx: 'boing',
  poseFn(F, f) {
    if (f <= 5) return 'belly';
    if (f <= 15) return { gb: 1.4, gs: 0.15, kx: -16, px: 34, py: -150 - (f - 5) * 6, pr: 2.2 + f * 0.3 };
    if (f <= 26) return { gb: 0.6, kx: -10, px: 30, py: -120 + (f - 15) * 10, pr: 0.4 };
    return 'stance';
  },
  tick(F, f) { if (f === 5) { FX.ring(F.x + F.facing * 20, F.y - 70, '#7dff5a', 20, 90, 12, 5); FX.dust(F.x, GROUND, 6); Sound.play('croak'); FX.wtext(F.x, F.y - 250, 'BOING!', { size: 26, color: '#fff', stroke: '#2f8a2a', life: 28 }); } if (f > 5 && f < 15) F.afterimage = 4; },
};

// ---------------------------------- TETSUMICHI: ↓→SP2 PANTOGRAPH SPARK ----------------------------------
CONDUCTOR.moves.sp2f = {
  name: 'PANTOGRAPH SPARK', jp: '集電火花', desc: 'Raises the lance like a pantograph; an overhead line arcs with electricity. Invulnerable start, anti-air launcher.', special: 1, lvl: 4,
  poses: ['point', 'signal'], st: 6, act: 10, rec: 22, dmg: 86, hs: 30, bs: 14, kb: 2, launch: -13, kd: 1, hb: { x: -30, y: -340, w: 170, h: 210 }, invuln: [0, 9], cd: 90, str: 3, sfx: 'thunder',
  tick(F, f) {
    if (f >= 6 && f < 16) {
      const tx = F.x + F.facing * 18, ty = F.y - 300 * F.s;
      for (let i = 0; i < 2; i++) FX.p({ type: 'bolt', x: tx, y: ty, x2: tx + F.facing * rand(-60, 110), y2: ty - rand(10, 70), size: 2.5, life: 4, color: i ? '#ffffff' : '#ff3a4a', jag: 18 });
      if (f === 6) { FX.ring(tx, ty, '#ff3a4a', 10, 110, 12, 5); FX.wtext(F.x, F.y - 360 * F.s, 'POWER ON!', { size: 24, color: '#fff', stroke: '#c8102e', life: 30 }); Sound.play('clack'); }
    }
  },
};

// ---------------------------------- NUE (human form): ↓↓SP2 SEAL DROP ----------------------------------
NUE.moves.sp2d = {
  name: 'SEAL DROP', jp: '封落', desc: 'Leaps and slams a seal talisman down. Overhead. On hit the beast seal recharges 1.5 s faster.', special: 1, lvl: 4,
  poses: ['flip', 'slam'], st: 14, act: 20, rec: 8, dmg: 78, hs: 26, bs: 14, kb: 6, kd: 1, type: 'overhead', hb: { x: 0, y: -120, w: 95, h: 120 }, cd: 100, str: 3, landRec: 10, sfx: 'whoosh',
  req: F => !F.beast || !F.beast.form,
  tick(F, f, O) { if (f === 1) { F.vy = -12.5; F.onGround = false; F.vx = clamp((O.x - F.x) / 28, -6, 6); } if (f === 14) { F.vy = 13; F.vx = F.facing * 5; F.afterimage = 12; } },
  onHit(F, D) { const B = F.beast; if (B && !B.form && B.cd > 0) { B.cd = Math.max(0, B.cd - 90); FX.wtext(F.x, F.y - 240 * F.s, 'SEAL −1.5s', { size: 20, color: '#ffffff', stroke: '#36ffd0', life: 34 }); } return false; },
  onLand(F) { FX.ring(F.x + F.facing * 40, GROUND, '#36ffd0', 10, 150, 16, 6, 0.25); FX.dust(F.x, GROUND, 10); FX.shakeIt(6); Sound.play('slam'); },
};
NUE_BADGES.human.push(['sp2d', '↓↓S2 DROP']);

[KAZUMA, YORU, SERA, GORO, FROGS, CONDUCTOR, NUE].forEach(finalizeMoves);
