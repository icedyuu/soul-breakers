// Kuon (The Honored One) mechanic checks: Infinity vs melee/projectile/grab/unblockable, Spatial Step, Blue pull,
// Limitless gain + Unveiled, Hollow Purple requirement, leaks.  node mech_honored.js
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  const r = await page.evaluate(() => {
    const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
    const setup = (opp, dist = 110) => { T.start('honored', opp, 'versus'); BT.timer = 1e9; const A = BT.p1, D = BT.p2; D.x = A.x + dist; T.run(3); return [A, D]; };
    // Infinity vs a melee heavy
    let [A, D] = setup('kazuma', 100);
    A.startMove('counter'); T.run(4); D.startMove('H'); let stopped = false, hp0 = A.hp;
    for (let i = 0; i < 40; i++) { T.frame(); if (D.infFreezeT > 0) stopped = true; }
    ok(stopped && A.hp === hp0 && A.lim > 0, `Infinity stops Kazuma's H (hp ${A.hp}/${hp0}, lim ${A.lim})`);
    // Infinity vs projectile (Lunaria's crescent) — it slows and stops
    [A, D] = setup('lunaria', 420);
    A.startMove('counter'); D.startMove('sp1'); let held = false; hp0 = A.hp;
    for (let i = 0; i < 40; i++) { T.frame(); if ((A.infHeld || []).length) held = true; }
    T.run(30);
    ok(held && A.hp === hp0, `Infinity holds a crescent in mid-air (held ${held}, hp ${A.hp}/${hp0}, projs ${BT.projs.length})`);
    // grab beats Infinity
    [A, D] = setup('borgar', 120);
    A.startMove('counter'); T.run(3); D.startMove('sp1'); let grabbed = false;
    for (let i = 0; i < 60; i++) { T.frame(); if (BT.cine && BT.cine.A === D) grabbed = true; }
    ok(grabbed, 'Borgar\'s Rune Ram (grab) goes through Infinity');
    for (let i = 0; i < 300 && BT.cine; i++) T.frame();
    // unblockable beats Infinity (Vespera's Thirst)
    [A, D] = setup('saint', 90);
    A.startMove('counter'); T.run(3); D.startMove('sp2f'); let bit = false; hp0 = A.hp;
    for (let i = 0; i < 60; i++) { T.frame(); if (BT.cine || A.hp < hp0) bit = true; }
    ok(bit, 'Vespera\'s unblockable Thirst goes through Infinity');
    for (let i = 0; i < 300 && BT.cine; i++) T.frame();
    // Spatial Step: appears behind a nearby opponent
    [A, D] = setup('kazuma', 250);
    const side0 = Math.sign(D.x - A.x); A.startMove('sp1f'); T.run(20);
    ok(Math.sign(D.x - A.x) === -side0 && !A.hidden, `Spatial Step crosses up (A ${Math.round(A.x)} D ${Math.round(D.x)})`);
    [A, D] = setup('kazuma', 600); const x0 = A.x; A.startMove('sp1f'); T.run(20);
    ok(Math.abs(A.x - x0 - 240) < 2, `Spatial Step far: +240 (${Math.round(A.x - x0)})`);
    // Blue pulls a walking-away opponent in
    [A, D] = setup('kazuma', 330); const d0 = D.x; A.startMove('sp1'); T.run(24);
    ok(D.x < d0 - 20, `Blue pulls (moved ${Math.round(d0 - D.x)} px)`);
    // Purple requirement + Limitless gain/Unveil
    [A, D] = setup('kazuma', 200);
    ok(!A.canUse('sp2d', false, 0), 'Hollow Purple locked below 30 Limitless');
    A.lim = 40; ok(A.canUse('sp2d', false, 0), 'Hollow Purple usable at 40');
    A.startMove('sp2d'); ok(A.lim === 10, 'Purple consumes 30 (' + A.lim + ')'); T.run(120);
    T.run(200); D.x = A.x + 200; D.y = GROUND; T.run(2); A.lim = 99; A.limT = A.T; A.cd.sp2f = 0; A.startMove('sp2f'); T.run(40);
    ok(A.unvT > 0 && A.colors.bare, `Unveiled at 100 (unvT ${A.unvT})`);
    A.cd.sp2d = 0; const st = A.mf; A.startMove('sp2d'); let spawnF = -1;
    for (let i = 0; i < 50; i++) { T.frame(); if (spawnF < 0 && BT.projs.some(p => p.kind === 'hollowPurple')) spawnF = i + 1; }
    ok(spawnF > 0 && spawnF <= 30, 'Unveiled Purple is faster (spawn f' + spawnF + ')');
    T.run(500); ok(A.unvT === 0 && !A.colors.bare, 'Unveiled ends, blindfold back on');
    // the ult cine releases correctly
    [A, D] = setup('lunaria', 150); A.meter = 100; A.startMove('ult'); let c = false;
    for (let i = 0; i < 500; i++) { T.frame(); if (BT.cine) c = true; if (c && !BT.cine) break; }
    ok(c && !BT.cine && !A.forcePose && !D.forcePose && !A.cineBare && !A.hidden, 'Domain Expansion completes cleanly');
    return out.join('\n');
  });
  console.log(r); console.log('errors', errors.slice(0, 5));
  await browser.close();
})();
