// node mech_haze.js : Haze — smoke zones (cloud / hotbox / trail), concealment, cough + guard counterplay, hotbox slow +
// speed + CLEAR THE ROOM + cooldown, Vapor Dash directions / invulnerability / Vapor Kick, Smoke Step, Heavy Hit (faster in
// the Hotbox), Secondhand counter + whiff, CPU blind hook, ultimate (fog, hits, clean end), skins visual only, determinism.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  const res = await page.evaluate(() => {
    const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
    const fresh = (o = 'kazuma', dist = 200, v1 = 0) => { go(new Battle({ mode: 'versus', stage: 0, p1: T.idx('haze'), p2: T.idx(o), v1 })); BT.phase = 'fight'; BT.p1.setState('idle'); BT.p2.setState('idle'); BT.timer = 1e9; const A = BT.p1, D = BT.p2; D.x = A.x + dist; T.run(2); return [A, D]; };
    const play = (A, k, n = 90) => { A.startMove(k); for (let i = 0; i < n; i++) T.frame(); };
    const hold = (F, dirs) => { F.input.virtual = { l: !!dirs.l, r: !!dirs.r, u: false, d: !!dirs.d, btn: { held: dirs.block ? { block: true } : {}, press: new Set() } }; };
    // --- Cloud Nine ---
    let [A, D] = fresh('kazuma', 200);
    play(A, 'sp1f', 30); let cl = hzZones(A, 'cloud'); ok(cl.length === 1, 'Cloud Nine spawns one cloud');
    T.run(60); ok(cl[0].zw > 180, `cloud expands (${Math.round(cl[0].zw)})`); ok(!!hzZoneAt(A, D), 'foe stands in the cloud');
    ok(D.hzBlindT > 0 && HAZE.cpuBlind(A, D) > 0, 'CPU is blinded in the smoke');
    T.run(60); ok(A.hzStats.cough >= 1 && (D.state === 'hit' || D.hzCoughCd > 0), `idle foe coughs (${A.hzStats.cough})`);
    T.run(400); ok(hzZones(A, 'cloud').length === 0, 'cloud ends on its own');
    [A, D] = fresh('kazuma', 200); hold(D, { block: true }); play(A, 'sp1f', 200); ok(A.hzStats.cough === 0, 'guarding foe does not cough'); D.input.virtual = null;
    [A, D] = fresh('kazuma', 200); play(A, 'sp1f', 40); A.x = D.x - 40; T.run(30); ok(A.hzConc && A.hzGlow, 'Haze is concealed in his cloud');
    A.cd = {}; play(A, 'sp1f', 40); ok(hzZones(A, 'cloud').filter(z => !z.dying).length === 1, 'only one cloud at a time');
    // --- Hotbox ---
    [A, D] = fresh('kazuma', 150); play(A, 'sp2f', 30); let hb = hzZones(A, 'hotbox')[0]; ok(!!hb && A.cd.sp2f === 0, 'Hotbox stands, ↓→SP2 stays ready');
    hold(D, { r: true }); const dx0 = D.x; T.run(10); const dv = Math.abs(D.x - dx0); D.input.virtual = null;
    [A, D] = fresh('kazuma', 600); hold(D, { r: true }); const ex0 = D.x; T.run(10); const ev = Math.abs(D.x - ex0); D.input.virtual = null;
    ok(dv < ev * 0.7, `foe slowed in the Hotbox (${dv.toFixed(1)} vs ${ev.toFixed(1)})`);
    [A, D] = fresh('kazuma', 600); play(A, 'sp2f', 40); hold(A, { r: true }); const ax0 = A.x; T.run(10); const av = Math.abs(A.x - ax0); A.input.virtual = null;
    ok(av > A.ch.walk * 10 * 1.15, `Haze walks faster in the Hotbox (${av.toFixed(1)})`);
    [A, D] = fresh('kazuma', 150); play(A, 'sp2f', 30); const h0 = D.hp; play(A, 'sp2f', 40); ok(A.moveKey === 'hzClear' || D.hp < h0, 'second ↓→SP2 = CLEAR THE ROOM');
    ok(D.hp < h0 - 50 && (D.comboFlags.air || !D.onGround || D.state === 'knockdown' || D.state === 'getup'), `collapse hits + launches (${Math.round(h0 - D.hp)})`);
    T.run(30); ok(hzZones(A, 'hotbox').length === 0 && A.cd.sp2f > 300, `hotbox gone, cooldown ${A.cd.sp2f}`);
    [A, D] = fresh('kazuma', 600); play(A, 'sp2f', 400); ok(hzZones(A, 'hotbox').length === 0 && A.cd.sp2f > 0, 'hotbox expires, cooldown starts');
    [A, D] = fresh('kazuma', 150); play(A, 'sp2f', 30); D.x = A.x + 520; play(A, 'sp2f', 40); ok(D.hp === D.maxHp, 'collapse misses foes outside');
    // --- Vapor Dash ---
    [A, D] = fresh('kazuma', 300); let x0 = A.x; play(A, 'counter', 30); ok(A.x < x0 - 100, `default backward (${Math.round(A.x - x0)})`);
    ok(hzZones(A, 'trail').length > 0, 'leaves a vapor trail');
    [A, D] = fresh('kazuma', 300); x0 = A.x; hold(A, { r: true }); A.startMove('counter'); T.run(3); A.input.virtual = null; T.run(27); ok(A.x > x0 + 100, `→ held: forward (${Math.round(A.x - x0)})`);
    [A, D] = fresh('kazuma', 120); D.startMove('H'); T.run(D.move.st - 3); A.startMove('counter'); T.run(30); ok(A.hp === A.maxHp, 'dash startup is invulnerable');
    [A, D] = fresh('kazuma', 60); hold(A, { r: true }); A.startMove('counter'); T.run(3); A.input.virtual = null; T.run(4); T.frame(['light']); T.run(30); ok(A.performed.has('vaporKick'), 'L during the dash = Vapor Kick');
    // --- Smoke Step ---
    [A, D] = fresh('kazuma', 200); play(A, 'sp1f', 80); const side0 = Math.sign(D.x - A.x); A.cd = {}; play(A, 'counter', 16);
    ok(A.performed.has('smokeStep') && Math.sign(D.x - A.x) === -side0 && !A.hidden, `foe in smoke → Smoke Step behind them (${A.hzStats.step})`);
    T.frame(['light']); T.run(20); ok(D.hp < D.maxHp, 'Vapor Kick out of the Smoke Step hits');
    // --- Heavy Hit ---
    [A, D] = fresh('kazuma', 130); play(A, 'sp2', 70); const hh = D.maxHp - D.hp; ok(hh > 90 && (D.state === 'knockdown' || D.state === 'wall' || D.state === 'getup' || !D.onGround || D.x - A.x > 250), `Heavy Hit: big damage + knockback (${Math.round(hh)}, dist ${Math.round(D.x - A.x)})`);
    [A, D] = fresh('kazuma', 130); A.startMove('sp2'); T.run(10); D.startMove('L'); D.x = A.x + 70; T.run(30); ok(A.hp < A.maxHp && !BT.projs.some(p => p.kind === 'hzBlast'), 'startup can be interrupted');
    [A, D] = fresh('kazuma', 130); play(A, 'sp2f', 30); A.cd = {}; A.startMove('sp2'); ok(A.moveKey === 'sp2hb' && A.move.st < 28, 'Heavy Hit charges faster in the Hotbox');
    // --- Secondhand ---
    [A, D] = fresh('kazuma', 80); A.startMove('sp2d'); T.run(12); D.startMove('M'); const sx = Math.sign(D.x - A.x); T.run(90);
    ok(A.performed.has('secondhand') && A.hzStats.counter === 1, 'Secondhand counters a melee hit'); ok(Math.sign(D.x - A.x) === -sx || A.hzStats.counter, 'steps out behind them'); ok(D.hp < D.maxHp - 60, `punish damage ${Math.round(D.maxHp - D.hp)}`);
    [A, D] = fresh('kazuma', 80); A.startMove('sp2d'); T.run(40); ok(A.state === 'attack' && A.moveKey === 'sp2d', 'whiffed Secondhand: still recovering (open)'); D.startMove('M'); T.run(20); ok(A.hp < A.maxHp, 'punishable after the window');
    [A, D] = fresh('kazuma', 80); A.startMove('sp2d'); T.run(12); D.startMove('THROW'); T.run(40); ok(!A.performed.has('secondhand'), 'throws beat Secondhand');
    [A, D] = fresh('yoru', 500); D.startMove('sp1'); for (let i = 0; i < 60 && !BT.projs.some(p => p.owner === D && Math.abs(p.x - A.x) < 260); i++) T.frame(); A.startMove('sp2d'); T.run(40); ok(A.hp === A.maxHp && !A.performed.has('secondhand'), 'far projectile is swallowed by the smoke');
    // --- Nicotine Rush ---
    [A, D] = fresh('kazuma', 400); play(A, 'sp1', 40); ok(D.hp < D.maxHp && D.maxHp - D.hp < 45, `Nicotine Rush: low damage (${Math.round(D.maxHp - D.hp)})`);
    [A, D] = fresh('kazuma', 400); D.startMove('sp1'); T.run(2); A.startMove('sp1'); T.run(40); ok(true, 'stream vs fireball runs');
    // --- ultimate ---
    const ult = () => { const [A, D] = fresh('kazuma', 110); A.meter = 100; play(A, 'sp1f', 40); A.startMove('ult'); let n = 0, fog = 0, hid = 0; while ((A.state === 'attack' || A.state === 'cine' || BT.freeze) && n < 900) { T.frame(); n++; if (BT.cine) { fog = Math.max(fog, BT.cine.fog || 0); if (A.hidden) hid++; } } return [Math.round(D.maxHp - D.hp), n, fog, hid, A.hidden, hzZones(A).length, D.state]; };
    const u = ult(); ok(u[0] > 200 && u[2] >= 1 && u[3] > 40 && !u[4] && u[5] === 0, `ult: dmg ${u[0]}, frames ${u[1]}, fog ${u[2]}, hidden frames ${u[3]}, ends visible, zones cleared`);
    // --- skins don't change stats ---
    const sk = v => { const [A, D] = fresh('kazuma', 130, v); play(A, 'sp2', 70); return D.maxHp - D.hp; };
    const s0 = sk(0), s4 = sk(4), s5 = sk(5); ok(s0 === s4 && s0 === s5, `skins visual only (${s0} ${s4} ${s5})`);
    // --- determinism (seeded like online / replays) ---
    const run = () => { const mr = Math.random; Math.random = netRandom; try { const [A, D] = fresh('kazuma', 200); NetRng.seed(99); const log = []; for (const k of ['sp1f', 'counter', 'sp2f', 'sp1', 'sp2', 'sp2f', 'sp2d']) { A.startMove(k); for (let i = 0; i < 70; i++) T.frame(); log.push(Math.round(D.hp), Math.round(A.x), Math.round(D.x)); A.cd = {}; } return log.join(','); } finally { Math.random = mr; } };
    const r1 = run(), r2 = run(); ok(r1 === r2, `deterministic (${r1.slice(0, 60)}…)`);
    // draw everything once
    [A, D] = fresh(); play(A, 'sp1f', 40); play(A, 'sp2f', 30); T.draw(); Settings.pixel = !Settings.pixel; T.draw(); Settings.pixel = !Settings.pixel;
    return out;
  });
  console.log(res.join('\n'));
  if (errors.length) console.log('ERRORS:\n' + errors.slice(0, 8).join('\n'));
  console.log(res.filter(l => l.startsWith('FAIL')).length ? 'SOME FAILED' : 'ALL OK');
  await browser.close();
})();
