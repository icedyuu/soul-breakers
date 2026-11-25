// fuzz: node fuzz.js [frames]  — random inputs on both sides for each new fighter vs every roster fighter (both sides)
const { open } = require('./harness');
(async () => {
  const N = +process.argv[2] || 2400;
  const { browser, page, errors } = await open();
  const ids = await page.evaluate(() => CHARS.map(c => c.id));
  const NEW = (process.env.SB_FUZZ || 'borgar,buzzu,reika').split(',');
  let bad = 0;
  for (const a of NEW) for (const b of ids) for (const swap of [0, 1]) {
    if (swap && NEW.includes(b) && NEW.indexOf(b) < NEW.indexOf(a)) continue;
    const [p1, p2] = swap ? [b, a] : [a, b];
    const r = await page.evaluate(([p1, p2, N, seed]) => {
      let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
      Settings.pixel = seed % 3 === 0;
      T.start(p1, p2, 'versus'); const issues = []; let hitRun = [0, 0], cineRun = 0, maxCombo = 0, restarts = 0, ults = 0;
      const acts = ['light', 'medium', 'heavy', 'sp1', 'sp2', 'guard'];
      const dirs = [[], ['left'], ['right'], ['down'], ['up'], ['down', 'left'], ['down', 'right']];
      const hold = [new Set(), new Set()], b = [Settings.binds[1], Settings.binds[2]];
      for (let i = 0; i < N; i++) {
        if (!(scene instanceof Battle)) { T.start(p1, p2, 'versus'); restarts++; }
        const B = BT;
        for (let p = 0; p < 2; p++) if (rnd() < 0.18) hold[p] = new Set(dirs[Math.floor(rnd() * dirs.length)]);
        Keys.down = new Set(); for (let p = 0; p < 2; p++) for (const a of hold[p]) Keys.down.add(b[p][a]);
        for (let p = 0; p < 2; p++) { if (rnd() < 0.22) { const k = b[p][acts[Math.floor(rnd() * acts.length)]]; Keys.pressed.add(k); Keys.down.add(k); }
          if (rnd() < 0.01) { Keys.pressed.add(b[p].sp1); Keys.pressed.add(b[p].sp2); } }
        if (rnd() < 0.004) { B.p1.meter = 100; B.p2.meter = 100; }
        scene.update(); Keys.pressed.clear();
        if (i % 400 === 0) T.draw();
        if (!(scene instanceof Battle)) continue;
        if (B.cine) { cineRun++; if (cineRun === 1) ults++; } else cineRun = 0;
        if (cineRun > 700) { issues.push('cine stuck ' + B.p1.state + '/' + B.p2.state); break; }
        for (const [j, F] of [B.p1, B.p2].entries()) {
          if (![F.x, F.y, F.hp, F.vx, F.vy].every(Number.isFinite)) { issues.push(`NaN ${F.ch.id} x${F.x} y${F.y} hp${F.hp}`); i = N; break; }
          if (F.x < -50 || F.x > STAGE_W + 50 || F.y > GROUND + 5 || F.y < -1500) issues.push(`oob ${F.ch.id} ${F.x | 0},${F.y | 0} ${F.state}`);
          if (F.state === 'cine' && !B.cine) { hitRun[j] = (hitRun[j] || 0); issues.push(`cine-state w/o cine ${F.ch.id}`); }
          if (F.state === 'hit' || F.state === 'air') hitRun[j]++; else hitRun[j] = 0;
          if (hitRun[j] > 600) { issues.push(`stuck in ${F.state} ${F.ch.id} combo ${F.comboHits}`); hitRun[j] = 0; }
          if (F.forcePose && !B.cine && F.state === 'idle' && !(F.cmdT > 0)) { issues.push(`forcePose leak ${F.ch.id} ${F.forcePose}`); F.forcePose = null; }
          maxCombo = Math.max(maxCombo, F.comboHits || 0);
        }
        if (issues.length > 6) break;
      }
      return { issues: [...new Set(issues)].slice(0, 6), maxCombo, restarts, ults };
    }, [p1, p2, N, 1 + (p1 + p2).length * 7919 + swap]);
    const ok = !r.issues.length;
    if (!ok) bad++;
    console.log(`${ok ? 'ok ' : 'BAD'} ${p1} vs ${p2}  maxCombo ${r.maxCombo} ults ${r.ults} rounds/restarts ${r.restarts} ${r.issues.join(' ; ')}`);
    if (errors.length) { console.log('ERR', errors.slice(0, 3)); errors.length = 0; bad++; }
  }
  console.log('bad', bad); await browser.close();
})();
