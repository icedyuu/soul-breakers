// TOURNAMENT: title FIGHT cycles 1V1 → TAG → TOURNAMENT, setup, human picks, bracket for 4..8 (byes),
// quick results, human vs human / human vs CPU / watched CPU vs CPU battles to the end, champion screen,
// pause BACK TO BRACKET, CONTINUE. Shots → ../shots_tourney/
const { open } = require('./harness');
const fs = require('fs'), path = require('path');
const OUT = path.resolve(__dirname, '../shots_tourney'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { browser, page, errors } = await open();
  const fail = []; const ok = (c, m) => { if (!c) fail.push(m); console.log((c ? 'ok   ' : 'FAIL ') + m); };
  const shot = async n => { await page.evaluate(() => T.draw()); await page.screenshot({ path: path.join(OUT, n + '.png') }); };
  const key = (k) => page.evaluate(k => { Keys.pressed.add(k); scene.update(); Keys.pressed.clear(); }, k);
  // title cycle
  let r = await page.evaluate(() => {
    go(new TitleScene()); scene.update(); const m = scene.menu; m.sel = m.items.findIndex(i => i.id === 'fight'); const vals = [];
    for (let i = 0; i < 3; i++) { Keys.pressed.add('ArrowRight'); scene.update(); Keys.pressed.clear(); T.draw(); vals.push(m.items[m.sel].value + '|' + TAG_VS + '|' + TOURNEY_PICK); }
    Keys.pressed.add('ArrowLeft'); scene.update(); Keys.pressed.clear(); T.draw();
    return { vals, last: m.items[m.sel].value };
  });
  ok(/TAG/.test(r.vals[0]) && /TOURNEY/.test(r.vals[1]) && /1 VS 1/.test(r.vals[2]) && /TOURNEY/.test(r.last), 'FIGHT cycles: ' + r.vals.join(' / '));
  await shot('01_title');
  r = await page.evaluate(() => { Keys.pressed.add('Enter'); scene.update(); Keys.pressed.clear(); return scene instanceof TourneySetupScene; });
  ok(r, 'TOURNAMENT → setup');
  // setup: 6 entrants, 2 humans, quick results
  await page.evaluate(() => { Object.assign(TN_CFG, { n: 6, humans: 2, level: 1, watch: false }); go(new TourneySetupScene()); T.run(3); });
  await shot('02_setup');
  r = await page.evaluate(() => { const m = scene.menu; m.sel = m.items.findIndex(i => i.id === 'start'); Keys.pressed.add('Enter'); scene.update(); Keys.pressed.clear(); return { pick: scene instanceof CharSelectScene && !!scene.tnPick, k: scene.tnPick && scene.tnPick.k }; });
  ok(r.pick && r.k === 0, 'START → player 1 picks');
  await page.evaluate(() => { scene.cur[0] = T.idx('hollow'); T.run(3); }); await shot('03_pick');
  r = await page.evaluate(() => { Keys.pressed.add('Enter'); scene.update(); Keys.pressed.clear(); T.run(40); const k = scene.tnPick && scene.tnPick.k; scene.cur[0] = T.idx('aimi'); Keys.pressed.add('Enter'); scene.update(); Keys.pressed.clear(); T.run(40);
    return { k, br: scene instanceof TourneyBracketScene, ents: TOURNEY && TOURNEY.ents.map(e => e.name + ':' + CHARS[e.ch].id), size: TOURNEY && TOURNEY.size, r0: TOURNEY && TOURNEY.rounds[0].map(m => [m.a, m.b, m.w]) }; });
  ok(r.k === 1 && r.br && r.ents.length === 6 && r.size === 8, 'both humans pick → bracket of 8 with 6 entrants: ' + r.ents.join(','));
  const byes = r.r0.filter(m => m[0] === null || m[1] === null);
  ok(byes.length === 2 && byes.every(m => m[2] != null), 'two byes auto-advanced');
  await shot('04_bracket');
  // play through: human matches by forcing KOs, CPU vs CPU quick
  let guard = 0, kinds = new Set();
  while (guard++ < 20) {
    const st = await page.evaluate(() => {
      if (scene instanceof TourneyChampScene) return { done: true };
      if (!(scene instanceof TourneyBracketScene)) return { err: scene.constructor.name };
      const nx = tnNext(TOURNEY), a = TOURNEY.ents[nx.m.a], b = TOURNEY.ents[nx.m.b];
      scene.menu.sel = 0; Keys.pressed.add('Enter'); scene.update(); Keys.pressed.clear();
      return { kind: a.human && b.human ? 'hh' : a.human || b.human ? 'hc' : 'cc', sc: scene.constructor.name };
    });
    if (st.done || st.err) { if (st.err) ok(false, 'unexpected scene ' + st.err); break; }
    kinds.add(st.kind);
    if (st.sc === 'TourneyVSScene') {
      r = await page.evaluate(() => {
        for (let i = 0; i < 300 && !(scene instanceof TourneyBattle); i++) T.frame(['light']);
        const bt = scene, info = { cpu: !!bt.cpu, p1human: !bt.cpu || bt.cfg.cpu2 === undefined, names: bt.names };
        for (let rd = 0; rd < 4 && scene === bt; rd++) { for (let i = 0; i < 400 && bt.phase !== 'fight' && scene === bt; i++) T.frame(); if (scene !== bt) break; T.run(20); bt.p2.hp = 0; for (let i = 0; i < 500 && scene === bt && bt.phase !== 'roundCall'; i++) T.frame(); }
        info.after = scene.constructor.name; return info;
      });
      if (!fs.existsSync(path.join(OUT, '05_battle.png'))) { }
      ok(r.after === 'TourneyBracketScene' || r.after === 'TourneyChampScene', `${st.kind} match ${r.names.join(' vs ')} → ${r.after}`);
    }
  }
  r = await page.evaluate(() => ({ champ: scene instanceof TourneyChampScene, c: TOURNEY && TOURNEY.champ, log: TOURNEY && TOURNEY.log.length }));
  ok(r.champ && r.c != null && r.log === 5, `champion found after ${r.log} matches`);
  await page.evaluate(() => T.run(50)); await shot('06_champion');
  // 4 entrants, 0 humans, WATCH: real bot-vs-bot battles to the end
  r = await page.evaluate(() => {
    TOURNEY = tnNew({ n: 4, humans: 0, level: 2, watch: true }, []); go(new TourneyBracketScene()); let f = 0, matches = 0;
    while (f < 150000 && !(scene instanceof TourneyChampScene)) {
      if (scene instanceof TourneyBracketScene) { scene.menu.sel = 0; Keys.pressed.add('Enter'); scene.update(); Keys.pressed.clear(); matches++; continue; }
      Keys.down = new Set(); scene.update(); Keys.pressed.clear(); f++; if (f % 2000 === 0) T.draw();
      if (scene instanceof TourneyBattle && ![scene.p1.x, scene.p2.x, scene.p1.hp, scene.p2.hp].every(Number.isFinite)) return { err: 'NaN' };
    }
    return { champ: scene instanceof TourneyChampScene, f, matches, log: TOURNEY.log.length };
  });
  ok(r.champ && r.log === 3, `watched CPU tournament finishes: ${JSON.stringify(r)}`);
  // human vs CPU battle shot + pause back to bracket + continue
  r = await page.evaluate(() => {
    TOURNEY = tnNew({ n: 4, humans: 1, level: 1, watch: false }, [T.idx('kazuma')]); go(new TourneyBracketScene());
    let nx = tnNext(TOURNEY); while (nx && !(TOURNEY.ents[nx.m.a].human || TOURNEY.ents[nx.m.b].human)) { tnSetWinner(TOURNEY, nx, nx.m.a); nx = tnNext(TOURNEY); }
    go(new TourneyVSScene(tnMatchCfg(TOURNEY, nx))); for (let i = 0; i < 300 && !(scene instanceof TourneyBattle); i++) T.frame(['light']);
    const bt = scene; for (let i = 0; i < 400 && bt.phase !== 'fight'; i++) T.frame(); T.run(60);
    return { p1: CHARS[bt.cfg.p1].id, cpu: !!bt.cpu, cpu2: bt.cfg.cpu2 };
  });
  ok(r.p1 === 'kazuma' && r.cpu && r.cpu2 === undefined, 'human is P1 against a CPU');
  await shot('05_battle');
  r = await page.evaluate(() => {
    const bt = scene; Keys.pressed.add('Escape'); bt.update(); Keys.pressed.clear(); bt.update();
    const ids = bt.pauseMenu.items.map(i => i.id); bt.pauseMenu.sel = ids.indexOf('tnback'); Keys.pressed.add('Enter'); bt.update(); Keys.pressed.clear();
    const back = scene instanceof TourneyBracketScene; go(new TourneySetupScene()); scene.update();
    return { ids, back, cont: scene.menu.items[0].id };
  });
  ok(r.ids.includes('tnback') && !r.ids.includes('restart') && r.back && r.cont === 'cont', 'pause BACK TO BRACKET, setup offers CONTINUE');
  // bracket layouts 4/5/7 draw fine
  for (const n of [4, 5, 7]) { await page.evaluate(n => { TOURNEY = tnNew({ n, humans: 1, level: 0, watch: false }, [0]); go(new TourneyBracketScene()); T.run(2); }, n); await shot('07_bracket_' + n); }
  const errs = errors.filter(e => !/Failed to load resource/.test(e)); ok(!errs.length, 'no page errors ' + errs.slice(0, 3).join(' | '));
  console.log(fail.length ? `\n${fail.length} FAILED` : '\nALL OK');
  await browser.close(); process.exit(fail.length ? 1 : 0);
})();
