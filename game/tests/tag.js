// 2v2 TAG mode: node tag.js [frames]  — mechanics checks + random-input tag fuzz over the whole roster
// (every fighter tags in and out on both sides; tag presses are frequent; meter is refilled so ults/cines happen)
const { open } = require('./harness');
(async () => {
  const N = +process.argv[2] || 2400;
  const { browser, page, errors } = await open();
  await page.evaluate(() => {
    T.tag = (a, b, c, d, extra = {}) => {
      go(new Battle({ mode: 'versus', stage: 0, p1: T.idx(a), p2: T.idx(c), tag: { t: [[T.idx(a), T.idx(b)], [T.idx(c), T.idx(d)]], v: [[0, 0], [0, 0]] }, ...extra }));
      BT.phase = 'fight'; BT.pf = 0; BT.p1.setState('idle'); BT.p2.setState('idle'); BT.team[0].cd = BT.team[1].cd = 0;
    };
  });
  let bad = 0;
  const check = (name, ok, info = '') => { console.log(`${ok ? 'ok ' : 'BAD'} ${name} ${info}`); if (!ok) bad++; };
  // ---- mechanics ----
  const m = await page.evaluate(() => {
    const r = {};
    T.tag('kazuma', 'hollow', 'goro', 'nue');
    T.run(5); BT.p1.hp = 500; BT.p1.meter = 60;
    T.frame(['tag']); r.swapped = BT.p1.ch.id; r.opp = BT.p2.opp === BT.p1 && BT.p1.opp === BT.p2; r.meter = BT.p1.meter;
    r.benchHp = BT.team[0].s[0].hp; r.rec = BT.team[0].s[0].rec;
    let atk = false; for (let i = 0; i < 30; i++) { T.frame(); if (BT.p1.state === 'attack' && BT.p1.moveKey === 'jH') atk = true; }
    r.tagAtk = atk;
    T.frame(['tag']); r.cdBlocks = BT.p1.ch.id;    // still on cooldown
    T.run(400); r.regen = BT.team[0].s[0].hp;
    T.frame(['tag']); r.back = BT.p1.ch.id; r.backHp = BT.p1.hp;
    // KO of the point fighter: partner tags in, round goes on
    T.run(200); BT.p2.hp = 0; T.run(5); r.pending = !!BT.team[1].pending; r.phase1 = BT.phase;
    T.run(200); r.koIn = BT.p2.ch.id; r.koDead = BT.team[1].s[0].dead; r.phase2 = BT.phase;
    T.frame(['tag']); r.noTagDead = BT.p1.ch.id;
    // whole team down -> round to P1
    T.run(200); BT.p2.hp = 0; T.run(10); r.phase3 = BT.phase; r.winner = BT.winner && BT.winner.pid;
    T.run(400); r.wins = BT.wins.slice(); r.newHp = BT.p2.hp === BT.p2.maxHp && BT.p2.ch.id === 'goro' && !BT.team[1].s[0].dead;
    // marks cleared: Hollow seal on the opponent goes away when Hollow leaves
    T.tag('hollow', 'kazuma', 'goro', 'nue'); T.run(3);
    BT.p2.sealT = 300; BT.p2.sealK = 'sp1'; BT.p2.slowT = 200;
    BT.p1.hp = 600; T.frame(['tag']); r.sealCleared = BT.p2.sealT === 0 && BT.p2.sealK === null && BT.p2.slowT === 0;
    // projectiles of the leaver vanish
    T.tag('sera', 'kazuma', 'goro', 'nue'); T.run(3); BT.spawn({ owner: BT.p1, x: BT.p1.x, y: GROUND - 100, vx: 3, kind: 'orb', life: 200, dmg: 10 });
    T.run(2); const n0 = BT.projs.filter(p => p.owner.ch.id === 'sera').length; T.frame(['tag']); r.proj = [n0, BT.projs.filter(p => p.owner.ch.id === 'sera').length];
    // time over: team totals decide
    T.tag('kazuma', 'yoru', 'goro', 'nue'); T.run(3); BT.p1.hp = 100; BT.team[0].s[1].hp = 100; BT.team[0].s[1].rec = 100; BT.timer = 2; T.run(5); r.timeWinner = BT.winner && BT.winner.pid;
    // 1v1 untouched
    T.start('kazuma', 'goro', 'versus'); T.run(3); T.frame(['tag']); r.v1 = BT.team === null && BT.p1.ch.id === 'kazuma';
    return r;
  });
  check('tag swaps fighter', m.swapped === 'hollow' && m.opp, JSON.stringify([m.swapped, m.opp]));
  check('meter carried', m.meter === 60, m.meter);
  check('bench hp + recoverable', m.benchHp >= 500 && m.benchHp < 502 && m.rec > 600, `${m.benchHp} → rec ${m.rec | 0}`);
  check('tag-in attack (air heavy)', m.tagAtk);
  check('cooldown blocks instant re-tag', m.cdBlocks === 'hollow');
  check('bench recovers', m.regen > 500 && m.regen <= m.rec + 0.01, `${m.regen | 0}`);
  check('tag back keeps recovered hp', m.back === 'kazuma' && Math.abs(m.backHp - m.regen) < 1, `${m.backHp | 0}`);
  check('point KO → partner tag-in, round continues', m.pending && m.phase1 === 'fight' && m.koIn === 'nue' && m.koDead && m.phase2 === 'fight', JSON.stringify([m.pending, m.phase1, m.koIn, m.koDead, m.phase2]));
  check('whole team down → round over', m.phase3 === 'ko' && m.winner === 1, JSON.stringify([m.phase3, m.winner]));
  check('next round: teams reset', m.wins[0] === 1 && m.newHp, JSON.stringify(m.wins));
  check('leaver marks cleared (seal, slow)', m.sealCleared);
  check('leaver projectiles cleared', m.proj[0] === 1 && m.proj[1] === 0, JSON.stringify(m.proj));
  check('time over uses team totals', m.timeWinner === 2, m.timeWinner);
  check('1v1 unchanged', m.v1);
  // ---- CPU tag match runs to the results screen ----
  const cpu = await page.evaluate(() => {
    T.tag('borgar', 'aimi', 'kuchi', 'hachi', { cpu: { level: 2 } }); BT.cpu = BT.cpu || new CpuBot(BT, 2);
    const bot = new CpuBot(BT, 2, 0); let tags = 0, last = BT.p2.ch.id;
    for (let i = 0; i < 60 * 60 * 6 && scene instanceof Battle; i++) { bot.bt = BT; bot.tick(); scene.update(); Keys.pressed.clear(); if (scene instanceof Battle && BT.p2.ch.id !== last) { tags++; last = BT.p2.ch.id; } }
    return { res: scene.constructor.name, tags };
  });
  check('CPU tag match finishes', cpu.res === 'ResultsScene' && cpu.tags > 0, JSON.stringify(cpu));
  // ---- fuzz: every fighter on both sides, frequent tags ----
  const ids = await page.evaluate(() => CHARS.map(c => c.id));
  const L = ids.length;
  for (let k = 0; k < L; k++) {
    const team = [ids[k], ids[(k + 5) % L], ids[(k + 11) % L], ids[(k + 16) % L]];
    const r = await page.evaluate(([tm, N, seed]) => {
      let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
      Settings.pixel = seed % 2 === 0;
      const start = () => T.tag(...tm);
      start(); const issues = []; let cineRun = 0, tags = 0, kos = 0, ults = 0, restarts = 0, hitRun = [0, 0];
      const acts = ['light', 'medium', 'heavy', 'sp1', 'sp2', 'block', 'tag', 'tag'];
      const dirs = [[], ['left'], ['right'], ['down'], ['up'], ['down', 'left'], ['down', 'right']];
      const hold = [new Set(), new Set()], b = [Settings.binds[1], Settings.binds[2]];
      let ids0 = [BT.p1.ch.id, BT.p2.ch.id];
      for (let i = 0; i < N; i++) {
        if (!(scene instanceof Battle)) { start(); restarts++; }
        const B = BT;
        for (let p = 0; p < 2; p++) if (rnd() < 0.18) hold[p] = new Set(dirs[Math.floor(rnd() * dirs.length)]);
        Keys.down = new Set(); for (let p = 0; p < 2; p++) for (const a of hold[p]) Keys.down.add(b[p][a]);
        for (let p = 0; p < 2; p++) { if (rnd() < 0.22) { const kk = b[p][acts[Math.floor(rnd() * acts.length)]]; Keys.pressed.add(kk); Keys.down.add(kk); }
          if (rnd() < 0.012) { Keys.pressed.add(b[p].sp1); Keys.pressed.add(b[p].sp2); } }
        if (rnd() < 0.006) { B.p1.meter = 100; B.p2.meter = 100; }
        if (rnd() < 0.0015) (rnd() < 0.5 ? B.p1 : B.p2).hp = 1;
        scene.update(); Keys.pressed.clear();
        if (i % 300 === 0) T.draw();
        if (!(scene instanceof Battle)) continue;
        if (B.p1.ch.id !== ids0[0] || B.p2.ch.id !== ids0[1]) { tags++; ids0 = [B.p1.ch.id, B.p2.ch.id]; }
        if (B.team.some(t => t.pending)) kos++;
        if (B.cine) { cineRun++; if (cineRun === 1) ults++; } else cineRun = 0;
        if (cineRun > 700) { issues.push('cine stuck'); break; }
        if (B.p1.opp !== B.p2 || B.p2.opp !== B.p1) issues.push('opp link broken');
        if (B.projs.some(p => p.owner !== B.p1 && p.owner !== B.p2)) issues.push('orphan projectile ' + B.projs.find(p => p.owner !== B.p1 && p.owner !== B.p2).kind);
        for (const [j, F] of [B.p1, B.p2].entries()) {
          if (![F.x, F.y, F.hp, F.vx, F.vy, F.meter].every(Number.isFinite)) { issues.push(`NaN ${F.ch.id}`); i = N; break; }
          if (F.x < -50 || F.x > STAGE_W + 50 || F.y > GROUND + 5 || F.y < -1500) issues.push(`oob ${F.ch.id} ${F.x | 0},${F.y | 0} ${F.state}`);
          if (F.state === 'cine' && !B.cine) issues.push(`cine-state w/o cine ${F.ch.id}`);
          if (F.state === 'hit') hitRun[j]++; else hitRun[j] = 0;
          if (hitRun[j] > 600 && !F.ko) { issues.push(`stuck in hit ${F.ch.id}`); hitRun[j] = 0; }
          if (F.hidden && !B.cine && F.state === 'idle' && F.sf > 300) issues.push(`hidden leak ${F.ch.id}`);
          if (F.forcePose && !B.cine && F.state === 'idle' && !(F.cmdT > 0)) { issues.push(`forcePose leak ${F.ch.id} ${F.forcePose}`); F.forcePose = null; }
        }
        for (const t of B.team) for (const sl of t.s) if (sl.hp != null && !Number.isFinite(sl.hp)) issues.push('bench NaN');
        if (issues.length > 6) break;
      }
      return { issues: [...new Set(issues)].slice(0, 6), tags, ults, restarts };
    }, [team, N, 7 + k * 104729]);
    const ok = !r.issues.length;
    if (!ok) bad++;
    console.log(`${ok ? 'ok ' : 'BAD'} ${team.join('+')}  tags ${r.tags} ults ${r.ults} restarts ${r.restarts} ${r.issues.join(' ; ')}`);
    if (errors.length) { console.log('ERR', errors.slice(0, 3)); errors.length = 0; bad++; }
  }
  if (errors.length) { console.log('ERR', errors.slice(0, 3)); bad++; }
  console.log('bad', bad); await browser.close();
})();
