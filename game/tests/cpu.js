// CPU bot test: node cpu.js [mode] — bot-vs-bot full matches through the normal versus flow.
//   mode 'all' (default): every fighter as P2 bot at each level vs a P1 bot (random fighter, same level); checks errors/NaN/hangs
//   mode 'rate': hard vs easy and normal vs easy win rates
const { open } = require('./harness');
(async () => {
  const mode = process.argv[2] || 'all';
  const { browser, page, errors } = await open();
  const ids = await page.evaluate(() => CHARS.map(c => c.id));
  const play = (p1, p2, l1, l2, seed) => page.evaluate(([p1, p2, l1, l2, seed]) => {
    Settings.roundTime = 60; Settings.pixel = seed % 2 === 0;
    go(new Battle({ mode: 'versus', stage: seed % 3, p1: T.idx(p1), p2: T.idx(p2), cpu: { level: l2 } }));
    const bt = BT, bot1 = new CpuBot(bt, l1, 0); const issues = []; let f = 0, cineRun = 0, specials = [0, 0], ults = 0;
    const orig = bt.cpu.tick.bind(bt.cpu); bt.cpu.tick = () => { bot1.tick(); orig(); };
    while (scene === bt && f < 30000) {
      Keys.down = new Set(); scene.update(); Keys.pressed.clear(); f++;
      if (f % 900 === 0) T.draw();
      if (bt.cine) { if (++cineRun === 1) ults++; } else cineRun = 0;
      if (cineRun > 700) { issues.push('cine stuck'); break; }
      for (const F of [bt.p1, bt.p2]) {
        if (![F.x, F.y, F.hp, F.vx, F.vy].every(Number.isFinite)) { issues.push('NaN ' + F.ch.id); f = 1e9; break; }
        if (F.x < -50 || F.x > STAGE_W + 50 || F.y > GROUND + 5) issues.push(`oob ${F.ch.id} ${F.x | 0},${F.y | 0} ${F.state} ${F.moveKey} cine:${!!bt.cine}`);
      }
    }
    const done = scene instanceof ResultsScene;
    if (!done) issues.push('no result after ' + f + ' frames, phase ' + bt.phase);
    const s1 = bt.mstats[0], s2 = bt.mstats[1];
    return { done, win: bt.wins[0] >= 2 ? 1 : bt.wins[1] >= 2 ? 2 : 0, f, issues: [...new Set(issues)].slice(0, 4), wins: bt.wins.join('-'), sp: [s1.specials, s2.specials], hits: [s1.hits, s2.hits], combo: [s1.maxCombo, s2.maxCombo], blocks: [s1.perfect, s2.perfect], ults };
  }, [p1, p2, l1, l2, seed]);
  let bad = 0;
  if (mode === 'all') {
    for (let lv = 0; lv < 3; lv++) for (let i = 0; i < ids.length; i++) {
      const p1 = ids[(i * 5 + lv * 3 + 1) % ids.length], p2 = ids[i];
      const r = await play(p1, p2, lv, lv, i * 3 + lv);
      const ok = !r.issues.length && !errors.length; if (!ok) bad++;
      console.log(`${ok ? 'ok ' : 'BAD'} L${lv} ${p1} vs CPU ${p2}  ${r.wins} in ${r.f}f  specials ${r.sp} hits ${r.hits} maxCombo ${r.combo} ults ${r.ults} ${r.issues.join(' ; ')}`);
      if (errors.length) { console.log('ERR', errors.slice(0, 3)); errors.length = 0; }
    }
  } else if (mode === 'roster') {   // node cpu.js roster id1,id2 : win rate of each fighter vs the whole roster (Normal bots, both sides)
    for (const id of (process.argv[3] || 'yamika,lunaria').split(',')) {
      let w = 0, n = 0; const per = [];
      for (let i = 0; i < ids.length; i++) {
        const o = ids[i]; if (o === id) continue; let ww = 0;
        for (const swap of [0, 1]) { const r = await play(swap ? o : id, swap ? id : o, 1, 1, i * 2 + swap); n++; const won = r.win === (swap ? 2 : 1); if (won) { w++; ww++; } if (r.issues.length || errors.length) { bad++; console.log('BAD', r.issues, errors.slice(0, 2)); errors.length = 0; } }
        per.push(`${o} ${ww}/2`);
      }
      console.log(`${id}: ${w}/${n} wins  (${per.join(', ')})`);
    }
  } else {
    for (const [hi, lo] of [[2, 0], [1, 0], [2, 1]]) {
      let w = 0, n = 0;
      for (let i = 0; i < ids.length; i++) {
        const a = ids[i], b = ids[(i + 4) % ids.length];
        for (const swap of [0, 1]) {   // strong bot on P2, weak on P1, same fighters both ways
          const r = await play(swap ? b : a, swap ? a : b, lo, hi, i * 2 + swap); n++; if (r.win === 2) w++;
          if (r.issues.length || errors.length) { bad++; console.log('BAD', r.issues, errors.slice(0, 2)); errors.length = 0; }
        }
      }
      console.log(`level ${hi} vs level ${lo}: ${w}/${n} wins`);
    }
  }
  console.log('bad', bad); await browser.close();
})();
