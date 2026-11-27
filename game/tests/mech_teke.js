// node mech_teke.js : Teke Teke — MOMENTUM (gain from crawling / chasing / dashing / hits / chains, idle decay, loss on hit,
// knockdown reset, heavy-block loss, whiff penalty, 4 stages + their bonuses), the six specials and their momentum
// interactions (Rush speed + Rush Slash + NO ESCAPE at max, Underground low profile + behind + Perfect Ambush, Severing Arc
// range, Half and Half max damage, Railway Nightmare warning/hit/escape, Endless Crawl hit count), legless rig, ult, determinism.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  const res = await page.evaluate(() => {
    const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
    const fresh = (o = 'kazuma', dist = 200) => { go(new Battle({ mode: 'versus', stage: 0, p1: T.idx('teke'), p2: T.idx(o) })); BT.phase = 'fight'; BT.p1.setState('idle'); BT.p2.setState('idle'); BT.timer = 1e9; const A = BT.p1, D = BT.p2; D.x = A.x + dist; T.run(2); return [A, D]; };
    const play = (A, k, n = 90) => { A.startMove(k); for (let i = 0; i < n; i++) T.frame(); };
    const hold = (F, dirs) => { F.input.virtual = { l: !!dirs.l, r: !!dirs.r, u: false, d: !!dirs.d, btn: { held: dirs.block ? { block: true } : {}, press: new Set() } }; };
    const free = F => { F.input.virtual = null; };
    // ---------- momentum ----------
    let [A, D] = fresh('kazuma', 900); A.x = 150; D.x = 1100;
    ok(A.mom === 0 && tkStage(A) === 0, 'starts at 0 / CRAWLING');
    hold(A, { r: true }); T.run(100); ok(tkStage(A) >= 1, `crawling forward builds momentum (${A.mom.toFixed(1)})`);
    const vx1 = Math.abs(A.vx); T.run(120); free(A);
    ok(tkStage(A) >= 2 && Math.abs(A.vx) > vx1 * 1.05, `stage ${tkStage(A) + 1}: faster crawl (${vx1.toFixed(2)} → ${Math.abs(A.vx).toFixed(2)})`);
    ok(A.state === 'walk' || A.state === 'idle', 'no conventional walk: state ' + A.state);
    T.run(2); let m0 = A.mom; T.run(18); ok(Math.abs(A.mom - m0) < 0.01, `short grace before decay (${m0.toFixed(2)} → ${A.mom.toFixed(2)})`); T.run(60); ok(A.mom < m0 - 15, `standing still decays (${m0.toFixed(0)} → ${A.mom.toFixed(0)})`);
    [A, D] = fresh('kazuma', 900); A.mom = 100; ok(tkStage(A) === 3, '100 = UNSTOPPABLE');
    ok(TEKE.walkMul(A) <= 1.4 && TEKE.walkMul(A) > 1.2, `speed bonus capped (${TEKE.walkMul(A)})`);
    ok(TEKE.dmgBonus(A) <= 1.1, `damage bonus modest (${TEKE.dmgBonus(A)})`);
    // getting hit / knockdown / blocking heavy
    [A, D] = fresh('kazuma', 90); A.mom = 70; D.startMove('L'); T.run(15); ok(A.mom < 70 - 8, `getting hit drains (${A.mom.toFixed(0)})`);
    [A, D] = fresh('kazuma', 90); A.mom = 90; D.startMove('cH'); T.run(60); ok(A.mom < 20, `knockdown wipes most of it (${A.mom.toFixed(1)})`);
    [A, D] = fresh('kazuma', 90); A.mom = 70; hold(A, { block: true }); T.run(2); D.startMove('H'); T.run(25); free(A); ok(A.mom < 70 - 5 && A.mom > 40, `blocking a heavy drains a little (${A.mom.toFixed(0)})`);
    // gains from hits + chains + dash
    [A, D] = fresh('kazuma', 90); A.mom = 0; play(A, 'L', 20); ok(A.mom >= 2.5, `landing a hit builds momentum (${A.mom.toFixed(1)})`);
    [A, D] = fresh('kazuma', 900); A.mom = 0; A.setState('dash'); T.run(16); ok(A.mom > 6, `dashing builds momentum (${A.mom.toFixed(1)})`);
    [A, D] = fresh('kazuma', 900); A.mom = 30; play(A, 'sp1', 50); A.cd = {}; const mc = A.mom; play(A, 'counter', 50); ok(A.tkStats.chains >= 1, `consecutive movement abilities chain (+${(A.mom - mc).toFixed(1)})`);
    // chase bonus
    [A, D] = fresh('kazuma', 300); A.mom = 0; hold(A, { r: true }); hold(D, { r: true }); T.run(60); const chase = A.mom; free(A); free(D);
    [A, D] = fresh('kazuma', 300); A.mom = 0; hold(A, { r: true }); T.run(60); const noChase = A.mom; free(A);
    ok(chase > noChase + 3, `chasing a retreating foe builds more (${chase.toFixed(1)} vs ${noChase.toFixed(1)})`);
    // whiff penalty
    [A, D] = fresh('kazuma', 700); A.mom = 60; play(A, 'sp2', 70); ok(A.mom < 50, `whiffed Half and Half costs momentum (${A.mom.toFixed(0)})`);
    let x0;
    // ---------- haste + dash ----------
    [A, D] = fresh('kazuma', 900); A.mom = 0; A.startMove('H'); let n0 = 0; while (A.state === 'attack' && n0 < 80) { T.frame(); n0++; }
    [A, D] = fresh('kazuma', 900); A.mom = 100; A.startMove('H'); let n3 = 0; while (A.state === 'attack' && n3 < 80) { T.frame(); n3++; }
    ok(n3 < n0, `attacks recover faster at UNSTOPPABLE (${n0} → ${n3} f)`);
    [A, D] = fresh('kazuma', 700); x0 = A.x; A.mom = 0; A.setState('dash'); T.run(16); const d0 = A.x - x0;
    [A, D] = fresh('kazuma', 700); x0 = A.x; A.mom = 100; A.setState('dash'); T.run(16); const d3 = A.x - x0;
    ok(d3 > d0 * 1.15, `longer dash with momentum (${d0.toFixed(0)} → ${d3.toFixed(0)})`);
    // ---------- specials ----------
    [A, D] = fresh('kazuma', 380); A.mom = 0; x0 = A.x; play(A, 'sp1', 12); const r0 = A.x - x0;
    [A, D] = fresh('kazuma', 380); A.mom = 100; x0 = A.x; play(A, 'sp1', 12); const r3 = A.x - x0; ok(r3 > r0 * 1.15, `Rush travels faster at max (${r0.toFixed(0)} → ${r3.toFixed(0)})`);
    [A, D] = fresh('kazuma', 300); A.mom = 0; A.startMove('sp1'); for (let i = 0; i < 40 && !A.connectedHit; i++) T.frame(); T.frame(['light']); T.run(20); ok(A.performed.has('rushSlash'), 'Rush → L = Rush Slash');
    T.frame(['sp1']); T.run(30); ok(!A.performed.has('noEscape'), 'No Escape locked below UNSTOPPABLE');
    [A, D] = fresh('kazuma', 300); A.mom = 100; A.startMove('sp1'); for (let i = 0; i < 40 && !A.connectedHit; i++) T.frame(); T.frame(['light']); for (let i = 0; i < 12; i++) T.frame(); T.frame(['sp1']); T.run(40);
    ok(A.performed.has('noEscape'), 'UNSTOPPABLE: Rush Slash → SP1 = No Escape');
    [A, D] = fresh('kazuma', 700); A.mom = 50; play(A, 'sp1', 70); ok(A.mom < 50, `whiffed Rush costs momentum (${A.mom.toFixed(0)})`);
    // Underground
    [A, D] = fresh('kazuma', 180); A.mom = 0; let side0 = Math.sign(D.x - A.x); A.startMove('counter'); T.run(8); const hb = A.hurtbox(); ok(hb && hb.h < 80, `low profile hurtbox (${hb && hb.h.toFixed(0)})`);
    T.run(30); ok(Math.sign(D.x - A.x) === -side0 && A.facing === Math.sign(D.x - A.x), 'resurfaces behind the foe, facing them');
    [A, D] = fresh('kazuma', 180); A.startMove('counter'); T.run(6); D.startMove('L'); T.run(14); ok(A.hp === A.maxHp, 'standing jab passes over her');
    [A, D] = fresh('kazuma', 180); A.startMove('counter'); for (let i = 0; i < 40 && !A.tkSurfaced; i++) T.frame(); const h1 = D.hp; T.frame(['heavy']); T.run(30); ok(A.performed.has('ambush') && A.tkStats.ambush === 1 && D.hp < h1, `Ambush right on resurfacing = PERFECT (${Math.round(h1 - D.hp)})`);
    [A, D] = fresh('kazuma', 180); A.startMove('counter'); for (let i = 0; i < 40 && !A.tkSurfaced; i++) T.frame(); T.run(12); const h2 = D.hp; T.frame(['heavy']); T.run(30); ok(A.performed.has('ambush') && A.tkStats.ambush === 0, `late Ambush = normal (${Math.round(h2 - D.hp)})`);
    // Severing Arc range
    [A, D] = fresh('kazuma', 215); A.mom = 0; play(A, 'sp1f', 40); const arcFar0 = D.hp < D.maxHp;
    [A, D] = fresh('kazuma', 215); A.mom = 100; play(A, 'sp1f', 40); const arcFar3 = D.hp < D.maxHp;
    ok(!arcFar0 && arcFar3, 'Severing Arc reaches further at max momentum');
    // Half and Half
    [A, D] = fresh('kazuma', 110); A.mom = 0; play(A, 'sp2', 60); const hh0 = D.maxHp - D.hp;
    [A, D] = fresh('kazuma', 110); A.mom = 100; play(A, 'sp2', 60); const hh3 = D.maxHp - D.hp;
    ok(hh3 > hh0 * 1.15 && hh3 < hh0 * 1.3, `Half and Half finisher stronger at max (${Math.round(hh0)} → ${Math.round(hh3)})`);
    // Railway Nightmare
    [A, D] = fresh('kazuma', 400); A.mom = 0; play(A, 'sp2f', 40); let rail = BT.projs.find(p => p.kind === 'tkRail'); ok(!!rail && Math.abs(rail.x - D.x) < 5, 'tracks appear under the foe');
    const dl0 = rail.delay0; ok(D.hp === D.maxHp, 'no damage during the warning'); T.run(60); ok(D.hp < D.maxHp - 80, `train hits a foe who stays (${Math.round(D.maxHp - D.hp)})`);
    [A, D] = fresh('kazuma', 400); play(A, 'sp2f', 20); hold(D, { r: true }); T.run(80); free(D); ok(D.hp === D.maxHp, 'leaving the zone escapes the train');
    [A, D] = fresh('kazuma', 400); play(A, 'sp2f', 20); hold(D, { block: true }); T.run(80); free(D); ok(D.hp > D.maxHp - 40 && D.hp < D.maxHp, 'blocking it takes only chip');
    [A, D] = fresh('kazuma', 400); A.mom = 100; play(A, 'sp2f', 20); rail = BT.projs.find(p => p.kind === 'tkRail'); ok(rail.delay0 < dl0 && rail.delay0 >= 45, `momentum shortens the warning a little (${dl0} → ${rail.delay0})`);
    // Endless Crawl
    const crawlHits = mom => { const [A, D] = fresh('kazuma', 120); A.mom = mom; A.startMove('sp2d'); let mx = 0; for (let i = 0; i < 90; i++) { T.frame(); mx = Math.max(mx, D.comboHits); } return mx; };
    const c0 = crawlHits(0), c2 = crawlHits(60); ok(c0 === 4 && c2 === 5, `Endless Crawl 4 hits, 5 at HUNTING (${c0}/${c2})`);
    [A, D] = fresh('kazuma', 120); A.startMove('sp2d'); T.run(90); ok(D.state === 'knockdown' || D.state === 'getup' || D.comboFlags.air || !D.onGround || D.x - A.x > 150, 'last cut launches backward');
    // ---------- rig ----------
    [A, D] = fresh('kazuma', 400); hold(A, { r: true }); T.run(30); free(A);
    const sk = skeleton(tkSolve(A.pose, A.ch.dims), A.ch.dims); ok(Math.abs(sk.fh[1]) < 30 && Math.abs(sk.bh[1]) < 30, `hands on the floor while crawling (${sk.fh[1].toFixed(0)}, ${sk.bh[1].toFixed(0)})`);
    ok(!('drawBoot' in TEKE) || !TEKE.drawBoot, 'no legs / boots drawn');
    // ---------- ultimate ----------
    [A, D] = fresh('kazuma', 120); A.meter = 100; A.startMove('ult'); let cineMax = 0, seenTrain = false; const hpU = D.hp;
    for (let i = 0; i < 520; i++) { T.frame(); if (BT.cine) { cineMax = BT.cine.f; if (BT.cine.train >= 0) seenTrain = true; } }
    ok(cineMax > 390 && seenTrain && !BT.cine, `THE LAST TRAIN plays to the end (${cineMax} f) and releases`);
    ok(hpU - D.hp > 180, `ult damage ${Math.round(hpU - D.hp)}`); ok(!A.hidden && !A.forcePose && !D.forcePose, 'no hidden / forcePose leak');
    [A, D] = fresh('kazuma', 120); A.meter = 100; A.mom = 0; ok(A.canUse('ult', false, 0), 'ult does not need momentum');
    // ---------- determinism ----------
    const runSeq = () => { const [A, D] = fresh('kazuma', 260); A.mom = 40; const seq = ['sp1', null, 'light', null, null, 'sp2d', null, 'sp1f', null, 'sp2f', null, 'counter', null, 'heavy']; for (let i = 0; i < 360; i++) { const k = seq[(i / 25 | 0) % seq.length]; T.frame(i % 25 === 0 && k ? [k] : []); } return [A.x, D.x, D.hp, A.mom].map(v => +v.toFixed(3)).join(','); };
    const s1 = runSeq(), s2 = runSeq(); ok(s1 === s2, 'deterministic: ' + s1);
    return out.join('\n');
  });
  console.log(res);
  console.log('errors', errors.slice(0, 5));
  await browser.close();
})();
