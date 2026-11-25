// node mech_hollow.js : The Hollow's mechanics — Seal locks the last used special (and only that), mark range/duration,
// Overload (manual + auto), exhaustion, Step evade gain, interrupt gain, ult cleanup, vs several fighters.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  const out = await page.evaluate(() => {
    const r = [], ok = (n, c, x = '') => r.push((c ? 'ok   ' : 'FAIL ') + n + (x ? '  ' + x : ''));
    const fresh = (o = 'kazuma', dist = 200) => { T.start('hollow', o, 'versus'); BT.timer = 1e9; const A = BT.p1, D = BT.p2; D.x = A.x + dist; T.run(3); return [A, D]; };
    const settle = (A, D, n = 200) => { for (let i = 0; i < n; i++) { T.frame(); if (i > 20 && A.actionable() && D.actionable() && !BT.cine) break; } };
    for (const o of ['kazuma', 'honored', 'cardmaster', 'nue', 'buzzu', 'lunaria']) {
      let [A, D] = fresh(o, 220);
      D.startMove('sp1'); settle(D, A);
      const last = D.lastSpK; D.x = A.x + 220; T.run(2);
      A.startMove('sp2'); settle(A, D);
      ok(`${o}: seal locks last special (${last})`, D.sealT > 0 && D.sealK === last && !D.canUse(last, false, 0), `sealT ${D.sealT}`);
      const other = SEAL_SLOTS.find(k => k !== last && D.ch.moves[k] && !D.ch.moves[k].req && !D.ch.moves[k].virtual && !D.ch.moves[k].air);
      if (other) ok(`${o}: other special still usable (${other})`, D.canUse(other, false, 0) || D.cd[other] > 0);
      T.run(260); ok(`${o}: seal expires`, D.sealT === 0 && !D.sealK);
    }
    // mark → longer seal, consumed
    let [A, D] = fresh('kazuma', 260); A.startMove('sp1f'); settle(A, D);
    ok('detection marks', D.hlwMarkT > 0 && D.hlwMarkBy === A, `markT ${D.hlwMarkT}`);
    D.x = A.x + 380; T.run(2); A.cd.sp2 = 0; A.startMove('sp2'); settle(A, D);
    ok('marked: seal reaches 380 px, longer, mark consumed', D.sealT > 150 && D.hlwMarkT === 0, `sealT ${D.sealT}`);
    // manual overload
    [A, D] = fresh('kazuma', 300); A.frag = 30; ok('overload needs 40', !A.canUse('sp2d', false, 0));
    A.frag = 60; A.startMove('sp2d'); settle(A, D); ok('manual overload', A.ovT > 0 && A.ovMax >= 240 && A.ovMax <= 420, `ov ${A.ovT}/${A.ovMax}`);
    D.lastSpK = 'sp1'; D.lastSpK2 = 'sp2'; D.x = A.x + 200; A.startMove('sp2'); settle(A, D);
    ok('overload seal locks two', D.sealK && D.sealK2 && D.sealK !== D.sealK2, `${D.sealK}/${D.sealK2}`);
    A.ovT = 1; T.run(2); ok('exhaustion after overload', A.exhT > 0 && A.frag === 0);
    const f0 = A.frag; A.ch.onDealDamage(A, D, 10); ok('no gain while exhausted', A.frag === f0);
    // auto overload at 100
    [A, D] = fresh('kazuma', 300); A.frag = 99; A.fragT = A.T; A.ch.onDealDamage(A, D, 10); T.run(2); ok('auto overload at 100', A.ovT > 0);
    // interrupt
    [A, D] = fresh('kazuma', 150); D.startMove('sp1'); A.startMove('sp1'); const g0 = A.frag; settle(A, D);
    ok('burst gains fragments', A.frag > g0, `frag ${A.frag.toFixed(1)}`);
    // step evade
    [A, D] = fresh('kazuma', 150); D.startMove('H'); T.run(Math.max(1, D.move.st - 4)); A.startMove('counter'); const e0 = A.frag; settle(A, D);
    ok('step dodge gains', A.frag > e0 || A.evaded, `frag ${A.frag}`);
    // ult vs several, cleanup
    for (const o of ['kazuma', 'goro', 'frogs', 'cardmaster', 'reika', 'honored']) {
      [A, D] = fresh(o, 140); A.meter = 100; A.startMove('ult'); let cine = false, maxF = 0;
      for (let i = 0; i < 520; i++) { T.frame(); if (BT.cine) { cine = true; maxF = Math.max(maxF, BT.cine.f); } if (i > 40 && !BT.cine && A.actionable() && D.actionable()) break; }
      ok(`ult vs ${o}`, cine && !BT.cine && D.forcePose == null && A.forcePose == null && !A.hidden && D.hp < D.maxHp - 200 && isFinite(D.x) && D.y <= GROUND, `cineF ${maxF} dmg ${Math.round(D.maxHp - D.hp)}`);
    }
    return r.join('\n');
  });
  console.log(out); console.log('errors', errors.slice(0, 5));
  await browser.close();
})();
