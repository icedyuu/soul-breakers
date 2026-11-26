// Cosmetics: every fighter x every intro / victory pose, vector + pixel, errors / NaN / timing; screenshots of the new screens.
// node cosmetics.js [ids|all] [-shots]
const { open } = require('./harness');
const fs = require('fs'), path = require('path');
const OUT = path.resolve(__dirname, '../../shots_cosmetics'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { browser, page, errors } = await open();
  const ids = process.argv[2] && process.argv[2] !== 'all' && !process.argv[2].startsWith('-') ? process.argv[2].split(',') : await page.evaluate(() => CHARS.map(c => c.id));
  const shots = process.argv.includes('-shots');
  let fails = 0;
  for (const id of ids) {
    for (const px of [true, false]) {
      const r = await page.evaluate(([id, px]) => {
        Settings.pixel = px; const out = [];
        const i = T.idx(id), j = (i + 5) % CHARS.length;
        for (let k = 0; k < 3; k++) {
          const t0 = performance.now();
          go(new Battle({ mode: 'versus', stage: k % STAGES.length, p1: i, p2: j, cos: [{ lv: 10, i: [k], w: [k] }, { lv: 3, i: [(k + 1) % 3], w: [k] }] }));
          const F = BT.p1, okIntro = k === 0 ? !F.cos : F.cos && F.cos.def === cosList(F.ch, 'i')[k];
          let bad = null;
          for (let f = 0; f < 205 && BT.phase === 'intro'; f++) { T.frame(); if (f % 3 === 0) T.draw(); if (!bad) for (const G of [BT.p1, BT.p2]) for (const key of POSE_KEYS) if (!isFinite(G.pose[key])) bad = G.ch.id + ' ' + key; }
          const introDone = BT.phase === 'roundCall';
          // win the round twice in a row -> victory poses + results
          let vic = [];
          for (let r = 0; r < 2 && !(scene instanceof ResultsScene); r++) {
            let n = 0; while (BT.phase !== 'fight' && n++ < 400) T.frame();
            BT.p2.hp = 0; n = 0;
            while (!(scene instanceof ResultsScene) && BT.phase !== 'roundEnd' && n++ < 600) T.frame();
            const W = BT.winner; vic.push(W && W.pid === 1 && (k === 0 ? !W.cos : W.cos && W.cos.st === 'victory'));
            for (let f = 0; f < 240 && scene === BT && BT.phase === 'roundEnd'; f++) { T.frame(); if (f % 3 === 0) T.draw(); if (!bad) for (const key of POSE_KEYS) if (!isFinite(BT.p1.pose[key])) bad = 'win ' + key; }
            if (scene === BT && BT.phase === 'roundEnd') { Keys.pressed.add('Enter'); T.frame(); }
          }
          const res = scene instanceof ResultsScene;
          if (res) for (let f = 0; f < 120; f++) { T.frame(); if (f % 4 === 0) T.draw(); }
          out.push({ k, okIntro, introDone, vic: vic.join(','), res, bad, ms: Math.round(performance.now() - t0) });
        }
        return out;
      }, [id, px]);
      for (const x of r) {
        const ok = x.okIntro && x.introDone && x.res && !x.bad && !x.vic.includes('false');
        if (!ok) fails++;
        console.log(`${ok ? 'ok  ' : 'FAIL'} ${id.padEnd(11)} ${px ? 'px ' : 'vec'} #${x.k} intro=${x.okIntro}/${x.introDone} vic=${x.vic} results=${x.res}${x.bad ? ' NaN:' + x.bad : ''} ${x.ms}ms`);
      }
    }
  }
  // skip works + online-style determinism of the pick (seeded random)
  const misc = await page.evaluate(() => {
    const o = {};
    go(new Battle({ mode: 'versus', stage: 0, p1: 0, p2: 1, cos: [{ lv: 10, i: [1], w: [1] }, { lv: 10, i: [2], w: [2] }] }));
    for (let f = 0; f < 30; f++) T.frame(); Keys.pressed.add('Enter'); T.frame(); o.skip = BT.phase === 'roundCall' && BT.p1.state === 'idle' && BT.p2.state === 'idle';
    // cfg loadouts from the local profile (cosAuto) and CPU
    localStorage.clear(); Mastery.d = null;
    go(new Battle({ mode: 'versus', stage: 0, p1: 0, p2: 1, cpu: { level: 1 } })); o.auto = JSON.stringify(BT.cfg.cos);
    Mastery.unlockAll(); Cos.set('kazuma', 'i', 2); go(new Battle({ mode: 'versus', stage: 0, p1: 0, p2: 1 })); o.auto2 = JSON.stringify(BT.cfg.cos[0]); o.def = BT.p1.cos && BT.p1.cos.def.n;
    o.clean = JSON.stringify(Cos.clean({ lv: 99, i: [7, 1, 'x'], w: null }));
    o.export = !!Mastery.export().cos;
    return o;
  });
  console.log('misc', JSON.stringify(misc));
  if (!misc.skip || misc.def !== 'KNUCKLE WARM-UP' || misc.auto2 !== '{"lv":10,"i":[2],"w":[0,1,2]}') { fails++; console.log('FAIL misc'); }
  if (shots) {
    await page.evaluate(() => { localStorage.clear(); Mastery.d = null; Mastery.unlockAll(); Settings.pixel = true; });
    const shot = async (name) => { await page.evaluate(() => T.draw()); await page.screenshot({ path: path.join(OUT, name + '.png') }); };
    const sets = [['kazuma', 'goro', 1, 1, 30], ['yoru', 'sera', 1, 1, 22], ['honored', 'hollow', 2, 2, 50], ['kanae', 'tokine', 1, 1, 70], ['saint', 'borgar', 1, 2, 30], ['buzzu', 'frogs', 2, 2, 60]];
    for (const [a, b, ii, ww, fr] of sets) {
      await page.evaluate(([a, b, ii, ww, fr]) => { go(new Battle({ mode: 'versus', stage: T.idx(a) % STAGES.length, p1: T.idx(a), p2: T.idx(b), cos: [{ lv: 10, i: [ii], w: [ww] }, { lv: 6, i: [ii], w: [ww] }] })); for (let f = 0; f < 8 + fr; f++) T.frame(); }, [a, b, ii, ww, fr]);
      await shot(`intro_${a}_${ii}`);
      await page.evaluate(() => { for (let f = 0; f < 100; f++) T.frame(); });
      await shot(`intro_${b}`);
      await page.evaluate(() => { let n = 0; while (BT.phase !== 'fight' && n++ < 400) T.frame(); BT.p2.hp = 0; n = 0; while (BT.phase !== 'roundEnd' && n++ < 600) T.frame(); for (let f = 0; f < 75; f++) T.frame(); });
      await shot(`victory_${a}_${ww}`);
    }
    await page.evaluate(() => { go(new CollectionScene(T.idx('hollow'))); for (let f = 0; f < 50; f++) T.frame(); }); await shot('collection');
    await page.evaluate(() => { scene.row = 2; scene.change(1); for (let f = 0; f < 70; f++) T.frame(); }); await shot('collection_victory');
    await page.evaluate(() => { localStorage.clear(); Mastery.d = null; go(new CollectionScene(0)); scene.change(1); for (let f = 0; f < 40; f++) T.frame(); }); await shot('collection_locked');
    await page.evaluate(() => { go(new TitleScene()); for (let f = 0; f < 10; f++) T.frame(); }); await shot('title');
    await page.evaluate(() => { localStorage.clear(); Mastery.d = null; Mastery.unlockAll(); go(new CharSelectScene('versus', { level: 1 })); for (let f = 0; f < 30; f++) T.frame(); }); await shot('select');
    await page.evaluate(() => { go(new VSScene({ mode: 'versus', stage: 0, p1: 0, p2: 3 })); for (let f = 0; f < 60; f++) T.frame(); }); await shot('vs');
    await page.evaluate(() => {
      localStorage.clear(); Mastery.d = null; Mastery.rec('kazuma').xp = 1390;
      go(new Battle({ mode: 'versus', stage: 0, p1: 0, p2: 3, cpu: { level: 2 }, cos: [{ lv: 5, i: [0], w: [1] }, { lv: 0, i: [0], w: [0] }] }));
      for (let r = 0; r < 2; r++) { let n = 0; while (BT.phase !== 'fight' && n++ < 400) T.frame(); BT.p2.hp = 0; n = 0; while (scene === BT && BT.phase !== 'roundEnd' && n++ < 600) T.frame(); n = 0; while (scene === BT && n++ < 400) T.frame(); }
      BT.cpu = null; for (let f = 0; f < 200; f++) T.frame();
    }); await shot('results');
  }
  const errs = errors.filter(e => !/AudioContext|speech/i.test(e));
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 10).join('\n') : 'no page errors');
  console.log(fails ? `${fails} FAILED` : 'ALL OK');
  await browser.close(); process.exit(fails || errs.length ? 1 : 0);
})();
