// node mech_tokine.js : Tokine — costs, clone cap/lifetime/shatter/cleanup, Bet slow, Zayin stop length + re-freeze lock,
// Dalet return (valid, clamped, not while hit, no HP/opp change), Sovereignty, ult cleanup vs several fighters
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  const r = await page.evaluate(() => {
    const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
    const fresh = (o = 'kazuma', dist = 200) => { T.start('tokine', o, 'versus'); BT.timer = 1e9; const A = BT.p1, D = BT.p2; D.x = A.x + dist; T.run(3); return [A, D]; };
    let [A, D] = fresh();
    ok(!A.canUse('counter', false, 0) && !A.canUse('sp2', false, 0), 'clone / stop need Time');
    A.time = 50; A.timeT = 1e9; ok(A.canUse('counter', false, 0), 'clone usable at 50');
    A.startMove('counter'); ok(Math.round(A.time) === 35, 'clone costs 15 (' + A.time + ')'); T.run(10); ok(A.clones.length === 1, 'one clone spawned');
    let hp = D.hp; T.run(40); ok(D.hp < hp, 'clone attack hit (' + Math.round(hp - D.hp) + ')'); T.run(40); ok(A.clones.length === 0, 'clone gone after its action');
    // cap
    [A, D] = fresh('kazuma', 400); A.time = 100; A.sovT = 0; A.timeT = 1e9;
    for (let i = 0; i < 6; i++) { A.cd = {}; A.setState('idle'); A.time = 90; A.startMove(i % 2 ? 'sp2f' : 'counter'); T.run(17); }
    let mx = 0; for (let i = 0; i < 60; i++) { T.frame(); mx = Math.max(mx, A.clones.filter(c => !c.gone).length); }
    ok(mx <= 4, 'live clone cap 4 (max seen ' + mx + ')'); T.run(120); ok(A.clones.length === 0, 'all clones expire');
    // shatter
    [A, D] = fresh('kazuma', 300); const c = tokClone(A, { x: A.x + 150, face: 1, at: 40, kind: 'shot' }); D.x = c.x + 70; D.facing = -1; D.startMove('H');
    let shat = false; for (let i = 0; i < 20; i++) { T.frame(); if (c.gone && !c.fired) shat = true; } ok(c.gone, 'clone shattered by a hit before acting');
    // Bet slow
    [A, D] = fresh('kazuma', 300); A.startMove('sp1f'); for (let i = 0; i < 40 && !(D.tokSlowT > 0); i++) T.frame(); ok(D.tokSlowT > 60 && D.slowT > 60, 'Bet slows (' + D.tokSlowT + ')'); T.run(100); ok(!(D.tokSlowT > 0), 'slow ends');
    // Zayin
    [A, D] = fresh('kazuma', 300); A.time = 60; A.timeT = 1e9; A.startMove('sp2'); let stopF = 0, x0 = 0; for (let i = 0; i < 120; i++) { T.frame(); if (D.tokStopT > 0) { stopF++; if (stopF === 1) x0 = D.x; } }
    ok(stopF >= 30 && stopF <= 50 && A.time <= 38.5, 'Zayin stop ' + stopF + ' f, time ' + Math.round(A.time));
    A.cd = {}; A.time = 60; A.setState('idle'); D.setState('idle'); D.x = A.x + 300; A.startMove('sp2'); let s2 = 0; for (let i = 0; i < 60; i++) { T.frame(); if (D.tokStopT > 0) s2++; } ok(s2 === 0, 'no re-freeze within 4 s');
    // Dalet
    [A, D] = fresh('kazuma', 400); A.time = 40; A.timeT = 1e9; const hx = A.x, hp0 = A.hp, dx0 = D.x; A.startMove('sp2d'); T.run(10); A.x += 250; T.run(80);
    ok(Math.abs(A.x - hx) < 2 && A.hp === hp0 && Math.abs(D.x - dx0) < 5, 'Rewind returns to the mark (' + Math.round(A.x - hx) + ')');
    [A, D] = fresh('kazuma', 120); A.time = 40; A.timeT = 1e9; const hx2 = A.x; A.startMove('sp2d'); T.run(12); A.x += 150; D.x = A.x + 80; A.setState('hit'); A.hitstun = 200; T.run(80); ok(Math.abs(A.x - hx2) > 50 && !A.rew, 'Rewind broken while being hit');
    [A, D] = fresh(); A.x = 70; A.time = 40; A.timeT = 1e9; A.startMove('sp2d'); T.run(90); ok(A.x >= 60, 'Rewind clamped');
    // Sovereignty
    [A, D] = fresh(); A.time = 99; tokGain(A, 5); T.run(2); ok(A.sovT > 400, 'Sovereignty at 100'); A.time = 50; A.startMove('counter'); ok(Math.round(A.time) === 42, 'half cost (' + A.time + ')');
    T.run(470); ok(A.sovT === 0 && Math.round(A.time) <= 22, 'Sovereignty ends → Time 20 (' + A.sovT + ' / ' + A.time + ')');
    // KO cleanup
    [A, D] = fresh(); A.time = 60; A.timeT = 1e9; A.startMove('sp2f'); T.run(18); A.hp = 1; D.x = A.x + 80; D.startMove('H'); for (let i = 0; i < 40; i++) T.frame(); A.hp = 0; A.ko = true; T.run(90); ok(A.clones.length === 0, 'clones cleared on KO');
    // ult
    for (const o of ['kazuma', 'goro', 'frog', 'nue', 'hollow', 'kanae', 'tetsumichi']) {
      if (T.idx(o) < 0) continue;
      [A, D] = fresh(o, 120); A.meter = 100; A.startMove('ult'); let cine = false, n = 0;
      for (let i = 0; i < 700; i++) { T.frame(); if (BT.cine) cine = true; n++; if (cine && !BT.cine && A.actionable() && D.state !== 'grabbed') break; }
      ok(cine && !BT.cine && D.forcePose == null && A.forcePose == null && A.x > 40 && A.x < STAGE_W - 40 && D.x > 40 && D.x < STAGE_W - 40 && !A.clones.length, `ult vs ${o}: dmg ${Math.round(D.maxHp - D.hp)} frames ${n}`);
    }
    [A, D] = fresh(); A.x = 1900; D.x = 1990; A.facing = 1; T.run(2); A.meter = 100; A.startMove('ult'); for (let i = 0; i < 500; i++) T.frame(); ok(!BT.cine && A.x <= STAGE_W - 50 && D.x <= STAGE_W - 50, 'ult at wall ok');
    // Kanae vs Tokine sanity: Provocation counters a clone bullet? (projectile) + Pact on Tokine
    [A, D] = fresh('kanae', 260); D.reb = 0; A.time = 50; A.timeT = 1e9; A.startMove('sp1f'); T.run(12); D.startMove('counter'); let read = false; for (let i = 0; i < 50; i++) { T.frame(); if (D.moveKey === 'provKick' || D.moveKey === 'provSmirk') read = true; } ok(read, 'Kanae Provocation reads Tokine\'s bullet');
    return out.join('\n');
  });
  console.log(r); console.log('errors', errors.slice(0, 5));
  await browser.close();
})();
