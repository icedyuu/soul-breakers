// Universal THROW (2026-11-26): every fighter grabs with MEDIUM + HEAVY pressed together (touch: GRAB button,
// controller: LT by default). Standard fighting-game rules: very short range, beats blocking and counter stances,
// loses to attacks (it has startup) and to jumps (only grounded, actionable foes can be grabbed; not in hitstun,
// blockstun, wall splat or wake-up invulnerability). THROW TECH: the defender presses M + H within the first
// THROW_TECH frames of the grab (or both throw at once) → both are pushed apart, nobody takes damage.
// Hold ← while grabbing for a back throw. A whiffed throw has a long recovery (punishable).
// Animation: one of five templates per fighter (toss / slam / knee / blast / spin) + a fighter name, colour and
// the fighter's own heavy pose for the final blow. Deterministic (lockstep safe): no Math.random in the logic.
const THROW_TECH = 10, THROW_DMG = 100;
const THROW_STYLE = {
  kazuma: ['toss', 'SHOULDER TOSS'], yoru: ['spin', 'SHADOW WHEEL'], sera: ['blast', 'ARCANE PUSH'], goro: ['slam', 'ONI SLAM'],
  frogs: ['knee', 'FROG PILE'], conductor: ['spin', 'RAIL SWITCH'], cardmaster: ['blast', 'CARD BURST'], nue: ['slam', 'BEAST MAUL'],
  saint: ['spin', 'CRIMSON WALTZ'], borgar: ['slam', 'ANVIL DROP'], buzzu: ['knee', 'CHAIN RIP'], reika: ['knee', 'ICE KNEE'],
  yamika: ['blast', 'SEALED PALM'], lunaria: ['toss', 'MOON TOSS'], honored: ['blast', 'RED REPEL'], hollow: ['slam', 'HOLLOW CRUSH'],
  kanae: ['knee', 'UGLY KNEE'], tokine: ['spin', 'CLOCK HAND'], aimi: ['toss', 'LOVE TOSS'], hachi: ['slam', 'TALL SHADOW'],
  kuchi: ['knee', 'SNIP & KICK'], jackpot: ['spin', 'HOUSE SPIN'],
};
function throwMove() {
  return {
    name: 'Throw', cat: 'throw', lvl: 2, throw: 1, grab: 1, type: 'unblock', poses: ['lunge_w', 'grab'], st: 5, act: 3, rec: 24, dmg: 1,
    hb: { x: 0, y: -170, w: 62, h: 160 }, str: 2,
    onHit(A, D) {
      const clash = D.state === 'attack' && D.moveKey === 'THROW' && D.mf <= D.move.st + D.move.act;   // both threw: auto tech
      BT.startCine(A, D, CINE.throwT, { zoom: 1.25 }); BT.cine.thr = 1; BT.cine.clash = clash;
      return true;
    },
  };
}
for (const ch of [...CHARS, ...Object.values(typeof BEAST_FORMS !== 'undefined' ? BEAST_FORMS : {})]) {
  if (!ch.moves || ch.moves.THROW) continue;
  ch.moves.THROW = throwMove();
}
MOVELIST.splice(MOVELIST.findIndex(r => r[0] === 'LH') + 1, 0, ['THROW', 'Throw (beats block · tech: M + H)', 'M + H']);

function throwTech(A, D, c) {
  const dir = Math.sign(D.x - A.x) || A.facing;
  A.forcePose = null; D.forcePose = null; FX.darkTarget = 0;
  A.x = clamp(A.x - dir * 34, 50, STAGE_W - 50); D.x = clamp(D.x + dir * 34, 50, STAGE_W - 50);
  A.vx = -dir * 8; D.vx = dir * 8; D.y = GROUND; D.onGround = true; D.setState('land'); D.landT = 14; D.facing = -dir;
  c.landT = 14;
  FX.wtext((A.x + D.x) / 2, GROUND - 230, 'TECH!', { size: 34, color: '#ffffff', stroke: '#2a7cff', life: 36 });
  FX.blockSpark((A.x + D.x) / 2, GROUND - 120, true); Sound.play('perfect'); BT.hitstop = Math.max(BT.hitstop, 6);
  if (D.stats) D.stats.techs = (D.stats.techs || 0) + 1;
  return true;
}
CINE.throwT = function (A, D, f, c) {
  const [style, nm] = THROW_STYLE[A.ch.id] || (A.ch.baseCh && THROW_STYLE[A.ch.baseCh.id]) || ['toss', 'THROW'];
  const acc = A.colors.accent, hp = (A.ch.moves.H && A.ch.moves.H.poses && A.ch.moves.H.poses[1]) || 'hook';
  if (f === 1) {
    c.back = A.input.fwd < 0 || (A.input.pdir.heavy && A.input.pdir.heavy.fwd < 0);
    c.d0 = A.facing; c.dir = c.back ? -A.facing : A.facing;
    D.x = clamp(A.x + A.facing * 58 * A.s, 50, STAGE_W - 50); D.y = GROUND; D.forcePose = 'hit'; A.forcePose = 'grab';
    Sound.play('grab'); FX.burst(D.x, D.y - 120, acc, 6, 4);
    if (c.clash) return throwTech(A, D, c);
  }
  // --- tech window: nothing hurts yet ---
  if (f <= THROW_TECH && f > 1 && D.input.p('medium') && D.input.p('heavy')) { D.input.use('medium'); D.input.use('heavy'); return throwTech(A, D, c); }
  if (f === THROW_TECH + 1) FX.wtext(A.x, A.y - 236 * A.s, nm, { size: 20, color: '#ffffff', stroke: acc, life: 40 });
  // back throw: swing the opponent around to the other side during the first frames
  if (c.back && f <= 12) {
    const k = easeInOut(f / 12), ang = k * Math.PI;
    D.x = clamp(A.x + c.d0 * 58 * A.s * Math.cos(ang), 50, STAGE_W - 50); D.y = GROUND - Math.sin(ang) * 50;
    if (f === 12) { A.facing = c.dir; D.y = GROUND; }
  }
  const dir = c.dir, front = (o = 58) => clamp(A.x + dir * o * A.s, 50, STAGE_W - 50);
  const hit = (d, str = 2, sfx) => BT.scriptHit(A, D, d, { str, sfx });
  switch (style) {
    case 'toss':   // lift overhead and throw
      if (f === 13) { A.forcePose = 'lift'; Sound.play('whoosh', 0.8); }
      if (f >= 13 && f <= 24) { D.x = lerp(D.x, A.x + dir * 8, 0.3); D.y = lerp(D.y, A.y - 120 * A.s, 0.3); D.forcePose = 'airhit'; }
      if (f === 28) { A.forcePose = 'throw'; hit(THROW_DMG, 3); FX.shakeIt(6); BT.release(D, dir * 14, -9); return true; }
      break;
    case 'slam':   // lift and slam into the ground
      if (f === 13) { A.forcePose = 'slam_w'; Sound.play('whoosh', 0.7); }
      if (f >= 13 && f <= 22) { D.x = lerp(D.x, A.x + dir * 20, 0.3); D.y = lerp(D.y, A.y - 110 * A.s, 0.35); D.forcePose = 'airhit'; }
      if (f === 26) { A.forcePose = 'slam'; D.x = front(70); D.y = GROUND; hit(THROW_DMG, 4); FX.shakeIt(12); FX.dust(D.x, GROUND, 14); FX.ring(D.x, GROUND, acc, 10, 120, 14, 5); }
      if (f >= 36) { BT.release(D, dir * 6, -5); return true; }
      break;
    case 'knee':   // two knees, then their own heavy
      if (f === 13 || f === 21) { A.forcePose = 'kick'; hit(THROW_DMG * 0.3, 2); D.forcePose = f === 13 ? 'hit2' : 'hit'; }
      if (f === 17 || f === 25) A.forcePose = 'grab';
      if (f === 30) A.forcePose = 'hook_w';
      if (f === 35) { A.forcePose = hp; hit(THROW_DMG * 0.4, 3); FX.shakeIt(8); BT.release(D, dir * 13, -7); return true; }
      break;
    case 'blast':   // charge energy point blank, then blast them away
      if (f === 13) { A.forcePose = 'cast_w'; Sound.play('charge'); }
      if (f >= 13 && f < 26 && f % 2 === 0) FX.burst(D.x - dir * 10, D.y - 110, acc, 2, 3);
      if (f === 26) { A.forcePose = 'cast'; hit(THROW_DMG, 3); FX.ring(D.x, D.y - 110, acc, 10, 130, 14, 6); FX.flashScreen(acc, 4, 0.25); FX.shakeIt(8); BT.release(D, dir * 16, -8); return true; }
      break;
    case 'spin': {   // swing them around once, then let go
      if (f >= 13 && f <= 30) {
        const ang = (f - 13) / 17 * TAU;
        D.x = clamp(A.x + dir * 58 * A.s * Math.cos(ang), 50, STAGE_W - 50); D.y = GROUND - 30 - Math.abs(Math.sin(ang)) * 30; D.forcePose = 'airhit';
        A.facing = Math.cos(ang) >= 0 ? dir : -dir; A.forcePose = 'grab'; A.afterimage = 3;
        if (f % 6 === 0) Sound.play('whoosh', 1.1);
      }
      if (f === 31) { A.facing = dir; A.forcePose = 'throw'; D.x = front(60); hit(THROW_DMG, 3); FX.shakeIt(7); BT.release(D, dir * 15, -8); return true; }
      break;
    }
  }
  return false;
};
