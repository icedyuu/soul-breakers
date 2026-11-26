// node mech_kanae.js : Kanae — Provocation vs melee/projectile/grab, whiff shove, Pact mark + gain cap, Break the Rules / Unrestrained,
// Disgust overhead/low/feint-cancel, ult cleanup vs several fighters
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  const r = await page.evaluate(() => {
    const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
    const fresh = (o = 'kazuma', dist = 120) => { T.start('kanae', o, 'versus'); BT.timer = 1e9; const A = BT.p1, D = BT.p2; D.x = A.x + dist; T.run(3); return [A, D]; };
    // Provocation vs melee
    let [A, D] = fresh(); A.startMove('counter'); T.run(8); D.startMove('M'); let got = false; for (let i = 0; i < 40; i++) { T.frame(); if (A.moveKey === 'provKick') got = true; }
    ok(got && A.reb >= 18, 'Provocation counters a medium and kicks (reb ' + Math.round(A.reb) + ')');
    // vs grab (Goro / Borgar grabs?) -> find a grab move
    const grabber = CHARS.find(c => Object.values(c.moves).some(m => m.grab && !m.air));
    [A, D] = fresh(grabber.id, 90); const gk = Object.keys(D.ch.moves).find(k => D.ch.moves[k].grab && !D.ch.moves[k].air && !D.ch.moves[k].comboGrab && !D.ch.moves[k].followup);
    A.startMove('counter'); T.run(8); D.startMove(gk); got = false; for (let i = 0; i < 40; i++) { T.frame(); if (A.moveKey === 'provKick') got = true; }
    ok(!got, 'grab (' + grabber.id + ' ' + gk + ') beats Provocation');
    // no attack -> shove
    [A, D] = fresh(); A.startMove('counter'); got = false; for (let i = 0; i < 30; i++) { T.frame(); if (A.moveKey === 'provSlap') got = true; } ok(got, 'no attack → shove follow-up');
    // projectile
    [A, D] = fresh('kazuma', 400); D.startMove('sp1f'); T.run(22); A.startMove('counter'); got = false; for (let i = 0; i < 60; i++) { T.frame(); if (A.moveKey === 'provKick' || A.moveKey === 'provSmirk') got = A.moveKey; } ok(!!got && A.hp === A.maxHp, 'projectile read: ' + got);
    // Pact
    [A, D] = fresh(); A.startMove('sp2'); T.run(20); ok(D.kanPactT > 300, 'Pact marks (' + D.kanPactT + ')');
    const r0 = A.reb; for (let n = 0; n < 8; n++) { D.setState('idle'); D.cd = {}; D.startMove('sp1'); T.run(50); D.x = A.x + 300; }
    ok(D.kanPactN === 5, 'Pact gain capped at 5 (' + D.kanPactN + ', reb +' + Math.round(A.reb - r0) + ')');
    T.run(400); ok(!(D.kanPactT > 0), 'Pact expires');
    // Break the Rules / Unrestrained
    [A, D] = fresh('kazuma', 300); A.reb = 40; A.startMove('sp2d'); T.run(24); ok(A.btrT > 200 && Math.abs(A.reb - 15) < 2, 'Break the Rules (btr ' + A.btrT + ', reb ' + Math.round(A.reb) + ')');
    A.cd = {}; T.run(30); A.reb = 50; const c1 = A.canUse('sp2d', false, 0); A.reb = 100; const c2 = A.canUse('sp2d', false, 0); A.reb = 0; ok(!c1 && c2, 'during Break the Rules: no re-use at 50, upgrade allowed at 100');
    T.run(260); A.reb = 100; A.cd = {}; A.setState('idle'); A.startMove('sp2d'); T.run(24); ok(A.unrT > 300, 'Unrestrained at 100 (' + A.unrT + ')');
    T.run(380); ok(A.unrT === 0 && A.reb === 0 && A.spentT > 0, 'Unrestrained ends → spent'); A.reb = 0; T.run(50); ok(A.reb === 0, 'no gain while spent');
    // Disgust overhead vs crouch-block, low vs stand-block
    [A, D] = fresh(); D.autoBlock = false; let res = '';
    Object.defineProperty(D, 'crouching', { get: () => true, set() {} }); D.guard = true; D.setState('block'); D.blockstun = 999; A.startMove('sp1f'); for (let i = 0; i < 30; i++) { T.frame(); if (D.state === 'hit') res = 'hit'; }
    ok(res === 'hit', 'overhead Disgust beats a crouch-block');
    [A, D] = fresh(); Object.defineProperty(D, 'crouching', { get: () => false, set() {} }); D.guard = true; D.setState('block'); D.blockstun = 999; A.startMove('sp1f'); res = '';
    Object.defineProperty(A.input, 'd', { get: () => A.state === 'attack' && A.mf >= 11 && A.mf <= 14, set() {}, configurable: true });
    for (let i = 0; i < 30; i++) { T.frame(); if (D.state === 'hit') res = 'hit'; }
    ok(res === 'hit', 'low Disgust (↓ at the stop) beats a stand-block');
    [A, D] = fresh(); A.startMove('sp1f'); T.run(9); A.input.held.block = true; A.move.tick(A, 10, D); ok(A.state !== 'attack' && A.cd.sp1f === 35, 'feint cancel with block');
    // ult vs several, cleanup
    for (const o of ['kazuma', 'goro', 'frog', 'nue', 'hollow', 'honored', 'lunaria']) {
      if (T.idx(o) < 0) continue;
      [A, D] = fresh(o, 100); A.meter = 100; A.startMove('ult'); let cine = false, n = 0;
      for (let i = 0; i < 600; i++) { T.frame(); if (BT.cine) cine = true; n++; if (cine && !BT.cine && A.actionable() && D.state !== 'grabbed') break; }
      ok(cine && !BT.cine && D.forcePose == null && A.forcePose == null && A.x > 40 && A.x < STAGE_W - 40 && D.x > 40 && D.x < STAGE_W - 40 && !Number.isNaN(D.hp), `ult vs ${o}: dmg ${Math.round(D.maxHp - D.hp)} seed ${!!A.kanSeed} D ${D.state} frames ${n}`);
    }
    // ult near the left wall
    [A, D] = fresh(); A.x = 80; D.x = 180; T.run(2); A.meter = 100; A.startMove('ult'); for (let i = 0; i < 500; i++) T.frame(); ok(!BT.cine && A.x >= 50 && D.x >= 50, 'ult at wall ok');
    return out.join('\n');
  });
  console.log(r); console.log('errors', errors.slice(0, 5));
  await browser.close();
})();
