// node mech_new.js : checks Yamika's / Lunaria's mechanics (follow-up, field, awakening, eclipse, dominion, nightfall)
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  const r = await page.evaluate(() => {
    const out = [];
    const st = (a, b = 'kazuma') => { T.start(a, b, 'versus'); BT.timer = 1e9; return [BT.p1, BT.p2]; };
    // Phantom Return: step back, then SP1 → behind the opponent
    let [A, D] = st('yamika'); D.x = A.x + 200; T.run(3); const side0 = Math.sign(D.x - A.x);
    A.startMove('counter'); T.run(5); T.frame(['sp1']); T.run(30);
    out.push(`stepIn: crossed=${Math.sign(D.x - A.x) !== side0} hidden=${A.hidden} perf=${A.performed.has('stepIn')}`);
    // plain Shadow Step goes back
    [A, D] = st('yamika'); D.x = A.x + 200; T.run(3); let x0 = A.x; A.startMove('counter'); T.run(40); out.push(`step back dx=${Math.round(A.x - x0)} hidden=${A.hidden}`);
    // Reality Distortion: field exists, enemy projectile slowed, seal arms instantly
    [A, D] = st('yamika', 'sera'); D.x = A.x + 420; T.run(3); A.startMove('sp2d'); T.run(40);
    out.push(`field=${!!A.fieldP && !A.fieldP.dead} inField=${yamInField(A)}`);
    const p = BT.spawn({ owner: D, kind: 'fireball', x: A.x + 200, y: GROUND - 100, vx: -10, w: 40, h: 40, life: 60, dmg: 10, color: '#f80' }); T.frame(); out.push(`enemy proj vx after field: ${p.vx.toFixed(1)}`);
    p.dead = true; A.startMove('sp1f'); T.run(16); const seal = BT.projs.find(q => q.kind === 'mysticSeal'); out.push(`seal delay in field: ${seal && seal.delay}`);
    // Awakening
    [A, D] = st('yamika'); A.chu = 99.5; A.chuT = A.T; yamChu(A, 5); T.run(2); out.push(`awakened=${A.wakeT > 0} pal=${A.colors.chuLv}`);
    // Lunaria: eclipse, dominion boomerang, nightfall still-bonus
    [A, D] = st('lunaria'); A.lun = 99; lunGain(A, 5); T.run(2); out.push(`eclipse=${A.eclT > 0} ecl=${A.colors.ecl}`);
    [A, D] = st('lunaria'); D.x = A.x + 300; T.run(3); A.startMove('sp2d'); T.run(40); out.push(`dominion=${A.domT}`);
    D.x = A.x + 2000; A.startMove('sp1'); T.run(14); const cr = BT.projs.find(q => q.kind === 'crescent'); T.run(30); out.push(`boomerang returning vx=${cr && cr.vx * A.facing < 0}`);
    [A, D] = st('lunaria'); D.x = A.x + 300; T.run(3); const hp0 = D.hp; A.startMove('sp2f'); T.run(230); out.push(`nightfall dmg on idle dummy=${Math.round(hp0 - D.hp)}`);
    // forcePose / hidden leaks after everything
    out.push(`leaks: A.hidden=${A.hidden} D.force=${D.forcePose}`);
    return out.join('\n');
  });
  console.log(r); console.log('errors', errors.slice(0, 5)); await browser.close();
})();
