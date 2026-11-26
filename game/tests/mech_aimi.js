// node mech_aimi.js : Aimi — Obsession gain sources, Unstable Love length/effects/calm, Pursuit range + hits, No Escape
// warning + hits, Rain count, skins are visual only, MIDNIGHT DRESS arcade unlock + cloud merge, ult cleanup
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  const res = await page.evaluate(() => {
    const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
    const fresh = (o = 'kazuma', dist = 200, v1 = 0) => { go(new Battle({ mode: 'versus', stage: 0, p1: T.idx('aimi'), p2: T.idx(o), v1 })); BT.phase = 'fight'; BT.p1.setState('idle'); BT.p2.setState('idle'); BT.timer = 1e9; const A = BT.p1, D = BT.p2; D.x = A.x + dist; T.run(3); return [A, D]; };
    const play = (A, k, n = 90) => { A.startMove(k); for (let i = 0; i < n; i++) T.frame(); };
    // gains
    let [A, D] = fresh(); play(A, 'sp1f'); ok(A.obs >= 5, `Deadly Accuracy hit gives Obsession (${A.obs})`);
    [A, D] = fresh('kazuma', 90); play(A, 'L', 30); ok(A.obs >= 2 && A.obs < 5, `light hit +2 (${A.obs})`);
    [A, D] = fresh('kazuma', 260); A.startMove('sp1f'); T.run(18); D.startMove('H'); T.run(40); ok(A.obs >= 13, `interrupt bonus (${A.obs})`);
    [A, D] = fresh('kazuma', 230); A.runT = A.T; play(A, 'sp1f', 40); ok(A.obs >= 11, `catching a retreating foe (${A.obs})`);
    // Unstable Love
    [A, D] = fresh(); A.obs = 100; T.run(2);
    ok(A.ulT > 0 && A.ulT <= 330, `Unstable Love starts at 100 (${A.ulT})`);
    const w0 = A.ch.walkMul(A); ok(w0 > 1 && A.dmgMult > 1.1, `faster walk ${w0}, dmg ${A.dmgMult.toFixed(3)}`);
    T.run(340); ok(A.ulT === 0 && A.obs === 0 && A.calmT > 0, `ends after ~5.5 s, calm ${A.calmT}`);
    play(A, 'sp1f', 40); ok(A.obs === 0, 'no gain while calm');
    // Rain: 5 rounds, 7 in UL
    const count = ul => { [A, D] = fresh('kazuma', 400); if (ul) { A.obs = 100; T.run(2); } let n = 0; const sp = BT.spawn.bind(BT); BT.spawn = o => { if (o.kind === 'aimiBullet') n++; return sp(o); }; play(A, 'sp2f', 120); BT.spawn = sp; return n; };
    const c0 = count(0), c1 = count(1); ok(c0 === 5 && c1 === 7, `Rain of Bullets fires 5 / 7 rounds (${c0}, ${c1})`);
    // Pursuit: max 460 px, 4 hits normally
    [A, D] = fresh('kazuma', 900); const x0 = A.x; A.startMove('sp2'); T.run(14); ok(Math.abs(A.x - x0) <= 461, `Pursuit range limited (${Math.round(A.x - x0)} px)`); T.run(80); ok(D.hp === D.maxHp, 'Pursuit whiffs from far away');
    [A, D] = fresh('kazuma', 300); let hits = 0, last = D.hp; A.startMove('sp2'); for (let i = 0; i < 80; i++) { T.frame(); if (D.hp < last) { hits++; last = D.hp; } } ok(hits === 4, `Pursuit 4 hits (${hits})`);
    [A, D] = fresh('kazuma', 300); A.obs = 100; T.run(2); hits = 0; last = D.hp; A.startMove('sp2'); for (let i = 0; i < 80; i++) { T.frame(); if (D.hp < last) { hits++; last = D.hp; } } ok(hits === 5, `Pursuit 5 hits in Unstable Love (${hits})`);
    ok(!A.hidden, 'no hidden leak after Pursuit');
    // No Escape: warning, then damage only if they stay
    [A, D] = fresh('kazuma', 300); A.startMove('sp2d'); T.run(20); const z = BT.projs.find(p => p.kind === 'aimiZone'); ok(z && z.delay > 0 && !z.active(), 'No Escape shows a warning first');
    T.run(60); ok(D.hp < D.maxHp, 'standing inside gets hit');
    [A, D] = fresh('kazuma', 300); A.startMove('sp2d'); T.run(22); D.x += 260; T.run(60); ok(D.hp === D.maxHp, 'stepping out avoids it');
    // skins: same frame data / hp / damage
    const dmgOf = v => { [A, D] = fresh('kazuma', 200, v); play(A, 'sp1f', 40); return [D.maxHp - D.hp, A.maxHp]; };
    const d0 = dmgOf(0), d3 = dmgOf(3), d4 = dmgOf(4); ok(d0[0] === d3[0] && d0[0] === d4[0] && d0[1] === d4[1], `skins don't change stats (${d0} ${d3} ${d4})`);
    // special unlock: MIDNIGHT DRESS after an Arcade clear with her
    localStorage.clear(); Mastery.d = null;
    ok(!Mastery.unlocked('aimi', 3) && !Mastery.unlocked('aimi', 4), 'dress + cloak locked at start');
    const fake = clear => ({ mode: 'versus', practice: false, cfg: { cpu: { arcade: true, level: 1 }, arcade: { i: clear ? 6 : 2, order: [0, 1, 2, 3, 4, 5, 6] } }, wins: [2, 0], p1: { ch: CHARS[T.idx('aimi')] }, p2: { ch: CHARS[0] } });
    let r = Mastery.award(fake(false)); ok(!Mastery.unlocked('aimi', 3), 'arcade win without clear: still locked');
    r = Mastery.award(fake(true)); ok(Mastery.unlocked('aimi', 3) && r.unlocks.includes(3), 'arcade clear unlocks MIDNIGHT DRESS (+ toast)');
    ok(!Mastery.unlocked('aimi', 4), 'LAST HORIZON still needs LV 10');
    const ex = Mastery.export(); localStorage.clear(); Mastery.d = null; ok(!Mastery.unlocked('aimi', 3), 'fresh profile locked');
    Mastery.import(ex); ok(Mastery.unlocked('aimi', 3), 'import (cloud merge) keeps the unlock');
    Mastery.import({ v: 1, chars: {}, unl: {} }); ok(Mastery.unlocked('aimi', 3), 'an older save never removes it');
    localStorage.clear(); Mastery.d = null; Mastery.unlockAll(); ok(Mastery.unlocked('aimi', 3) && Mastery.unlocked('aimi', 4), 'hidden cheat opens all skins');
    ok(Mastery.export().unl === undefined || !Mastery.export().unl['aimi:3'], 'cheat does not write the real unlock');
    // ult cleanup
    [A, D] = fresh('tokine', 110); A.meter = 100; A.startMove('ult'); let n = 0; while (!BT.cine && n++ < 160) T.frame(); ok(!!BT.cine, 'ult connects');
    const df = D.facing; n = 0; while (BT.cine && n++ < 420) T.frame(); T.run(80);
    ok(!BT.cine && !A.hidden && !A.forcePose && !D.forcePose && D.facing === df && D.y === GROUND && BT.cam && FX.darkTarget === 0, `ult cleans up (A ${A.state}, D ${D.state})`);
    return out.join('\n');
  });
  console.log(res); console.log('errors', errors.slice(0, 5));
  const fails = (res.match(/FAIL/g) || []).length; console.log('fails', fails);
  await browser.close();
})();
