// SURVIVAL + BOSS RUSH: menu flow, HP carry + heal, CPU ramp, bosses (buffs, order, boss stage),
// game over / clear, local best, mastery XP, give up from pause, real bot-vs-bot fights, leaderboard screen.
// Shots → ../shots_surv/
const { open } = require('./harness');
const path = require('path'), fs = require('fs');
const OUT = path.resolve(__dirname, '../shots_surv'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { browser, page, errors } = await open();
  const fail = []; const ok = (c, m) => { if (!c) fail.push(m); console.log((c ? 'ok   ' : 'FAIL ') + m); };
  const shot = async n => { await page.evaluate(() => T.draw()); await page.screenshot({ path: path.join(OUT, n + '.png') }); };
  // menu: 1P VS CPU → SURVIVAL · BOSS RUSH
  let r = await page.evaluate(() => { go(new CpuSetupScene()); scene.update(); const ids = scene.menu.items.map(i => i.id); scene.menu.sel = ids.indexOf('surv'); Keys.pressed.add('Enter'); scene.update(); Keys.pressed.clear(); return { ids, menu: scene instanceof SurvivalMenuScene }; });
  ok(r.ids.includes('surv') && r.menu, 'CPU setup has SURVIVAL · BOSS RUSH → menu: ' + r.ids.join(','));
  await page.evaluate(() => { go(new CpuSetupScene()); scene.update(); }); await shot('00_cpu_setup');
  await page.evaluate(() => { go(new SurvivalMenuScene()); scene.update(); }); await shot('01_menu');
  r = await page.evaluate(() => { Keys.pressed.add('Enter'); scene.update(); Keys.pressed.clear(); return { sel: scene instanceof CharSelectScene, surv: scene.cpu && scene.cpu.surv }; });
  ok(r.sel && r.surv === 'survival', 'SURVIVAL opens character select');
  await page.evaluate(() => T.run(5)); await shot('02_select');
  // confirm Kazuma → run starts (VS interstitial)
  r = await page.evaluate(() => { scene.cur[0] = T.idx('kazuma'); Keys.pressed.add('Enter'); scene.update(); Keys.pressed.clear(); for (let i = 0; i < 60 && !(scene instanceof SurvivalVSScene); i++) T.frame(); return { vs: scene instanceof SurvivalVSScene, p2: scene.cfg && CHARS[scene.cfg.p2].id, lv: scene.cfg && scene.cfg.cpu.level }; });
  ok(r.vs && r.p2 !== 'kazuma' && r.lv === 0, `run starts: first opponent ${r.p2}, CPU level ${r.lv}`);
  await page.evaluate(() => T.run(60)); await shot('03_vs');
  // helper: finish the current fight by KO
  const fight = (win, hp) => page.evaluate(([win, hp]) => {
    for (let i = 0; i < 400 && !(scene instanceof SurvivalBattle); i++) T.frame(['light']);
    const bt = scene; if (!(bt instanceof SurvivalBattle)) return { err: 'no battle ' + scene.constructor.name };
    const info = { startHp: bt.p1.hp / bt.p1.maxHp, p2max: bt.p2.maxHp, p2base: bt.p2.ch.health, dm: bt.p2.dmgMult / (bt.p2.ch.dmgBonus ? bt.p2.ch.dmgBonus(bt.p2) : 1), lv: bt.cfg.cpu.level, boss: bt.cfg.boss, stage: bt.cfg.stage, phase0: bt.phase, rec: !!bt.rec };
    for (let i = 0; i < 400 && bt.phase !== 'fight'; i++) T.frame();
    if (hp != null) bt.p1.hp = bt.p1.maxHp * hp;
    T.run(30);
    if (win) bt.p2.hp = 0; else bt.p1.hp = 0;
    for (let i = 0; i < 700 && scene === bt; i++) T.frame();
    info.next = scene.constructor.name; info.run = { wins: bt.run.wins, hp: bt.run.hp, prev: bt.run.prevHp, healed: bt.run.healed, frames: bt.run.frames };
    return info;
  }, [win, hp]);
  r = await fight(true, 0.5);
  ok(!r.err && r.phase0 === 'intro' && !r.rec, 'fight 1 starts with intro, no replay recording ' + (r.err || ''));
  ok(r.next === 'SurvivalVSScene' && r.run.wins === 1, 'win → next fight');
  ok(r.run.prev <= 0.5 + 1e-6 && Math.abs(r.run.hp - Math.min(1, r.run.prev + r.run.healed)) < 1e-6 && r.run.healed >= 0.15, `HP carries + heal: ${r.run.prev.toFixed(3)} + ${r.run.healed} → ${r.run.hp.toFixed(3)}`); const carried = r.run.hp;
  ok(r.run.frames > 0, 'time counted: ' + r.run.frames);
  await page.evaluate(() => T.run(80)); await shot('04_heal');
  r = await fight(true);
  ok(Math.abs(r.startHp - carried) < 0.01, 'fight 2 starts with carried HP ' + r.startHp.toFixed(3));
  ok(r.phase0 === 'roundCall', 'later fights skip the intro');
  // jump ahead: 8 wins → HARD, then the 10th fight is a boss
  r = await page.evaluate(() => { const run = scene.run; run.wins = 8; go(new SurvivalVSScene(run, survNextCfg(run))); return scene.cfg.cpu.level; });
  ok(r === 2, 'CPU HARD after 8 wins');
  r = await fight(true);
  r = await fight(true);
  ok(r.boss && r.p2max === Math.round(r.p2base * 1.5) && Math.abs(r.dm - 1.2) < 0.01, `10th fight is a BOSS (hp ${r.p2max}/${r.p2base}, dmg x${r.dm.toFixed(2)}), stage ${r.stage}`);
  await page.evaluate(() => { for (let i = 0; i < 300 && !(scene instanceof SurvivalBattle); i++) T.frame(['light']); for (let i = 0; i < 300 && BT.phase !== 'fight'; i++) T.frame(); T.run(40); }); await shot('05_boss_fight');
  // lose → game over, best saved, XP
  const xp0 = await page.evaluate(() => Mastery.rec('kazuma').xp);
  r = await page.evaluate(() => { const bt = BT; bt.p1.hp = 0; for (let i = 0; i < 700 && scene === bt; i++) T.frame(); return { over: scene instanceof SurvivalOverScene, score: scene.run && scene.run.score, rec: scene.run && scene.run.record, best: SurvBest.get('survival'), xp: Mastery.rec('kazuma').xp }; });
  ok(r.over && r.score === 10 && r.rec && r.best && r.best.score === 10, 'KO → GAME OVER, score 10, local best saved');
  ok(r.xp > xp0, `mastery XP granted (+${r.xp - xp0})`);
  await page.evaluate(() => T.run(40)); await shot('06_game_over');
  // TRY AGAIN restarts
  r = await page.evaluate(() => { Keys.pressed.add('Enter'); scene.update(); Keys.pressed.clear(); return scene instanceof SurvivalVSScene && scene.run.wins === 0; });
  ok(r, 'TRY AGAIN starts a new run');
  // give up from the pause menu
  r = await page.evaluate(() => {
    for (let i = 0; i < 400 && !(scene instanceof SurvivalBattle); i++) T.frame(['light']);
    const bt = scene; Keys.pressed.add('Escape'); bt.update(); Keys.pressed.clear(); bt.update();
    const ids = bt.pauseMenu.items.map(i => i.id); bt.pauseMenu.sel = ids.indexOf('giveup'); Keys.pressed.add('Enter'); bt.update(); Keys.pressed.clear();
    return { ids, over: scene instanceof SurvivalOverScene, why: scene.run && scene.run.why };
  });
  ok(!r.ids.includes('restart') && r.ids.includes('giveup') && r.over && r.why === 'giveup', 'pause: no RESTART, GIVE UP ends the run: ' + r.ids.join(','));
  // BOSS RUSH: order, last two fixed, clear
  r = await page.evaluate(() => { const run = survNewRun('boss', T.idx('hollow')); return run.order.map(i => CHARS[i].id); });
  ok(r.length === 7 && !r.includes('hollow') && r[6] === 'honored' && new Set(r).size === 7, 'boss order for Hollow player: ' + r.join(','));
  r = await page.evaluate(() => { const run = survNewRun('boss', T.idx('kazuma')); go(survStart('boss', T.idx('kazuma'))); return scene.run.order.map(i => CHARS[i].id); });
  ok(r[5] === 'honored' && r[6] === 'hollow', 'boss rush ends with Kuon + Hollow: ' + r.join(','));
  await page.evaluate(() => T.run(60)); await shot('07_boss_vs');
  let last; const BS = await page.evaluate(() => BOSS_STAGE);
  for (let i = 0; i < 7; i++) { last = await fight(true); if (last.err || !last.boss) break; }
  ok(last && last.next === 'SurvivalOverScene' && last.stage === BS, 'all 7 bosses → CLEAR (final on boss stage) ' + JSON.stringify(last && { next: last.next, stage: last.stage }));
  r = await page.evaluate(() => ({ why: scene.run.why, score: scene.run.score, best: SurvBest.get('boss') }));
  ok(r.why === 'clear' && r.score === 7 && r.best.score === 7, 'BOSS RUSH CLEAR saved');
  await page.evaluate(() => T.run(40)); await shot('08_clear');
  // leaderboard screen (no SQL in this env → message, no crash), tabs
  await page.evaluate(() => { go(new SurvivalBoardScene('survival')); });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { scene.rows.survival = [{ name: 'Beni', score: 14, frames: 22000, ch: 'hollow' }, { name: 'Niixilis', score: 9, frames: 15000, ch: 'kazuma' }]; scene.update(); });
  await shot('09_board');
  r = await page.evaluate(() => { Keys.pressed.add('ArrowRight'); scene.update(); Keys.pressed.clear(); T.draw(); return scene.mode; });
  ok(r === 'boss', 'leaderboard tab switch');
  await page.waitForTimeout(500); await shot('10_board_boss');
  // real bot-vs-bot survival fights (P1 also a bot) for a few fighters
  for (const id of ['kazuma', 'hollow', 'jackpot', 'haze']) {
    r = await page.evaluate(id => {
      go(survStart('survival', T.idx(id))); let f = 0, fights = 0;
      while (f < 60000 && !(scene instanceof SurvivalOverScene) && fights < 3) {
        if (scene instanceof SurvivalVSScene) { T.frame(['light']); f++; continue; }
        const bt = scene; if (!(bt instanceof SurvivalBattle)) return { err: scene.constructor.name };
        const b1 = new CpuBot(bt, 1, 0), orig = bt.cpu.tick.bind(bt.cpu); bt.cpu.tick = () => { b1.tick(); orig(); };
        while (scene === bt && f < 60000) { Keys.down = new Set(); scene.update(); Keys.pressed.clear(); f++; if (f % 1000 === 0) T.draw(); for (const F of [bt.p1, bt.p2]) if (![F.x, F.y, F.hp].every(Number.isFinite)) return { err: 'NaN' }; }
        fights++;
      }
      return { f, fights, wins: scene.run ? scene.run.wins : -1, sc: scene.constructor.name };
    }, id);
    ok(!r.err && r.fights >= 1, `bot run ${id}: ${JSON.stringify(r)}`);
  }
  const errs = errors.filter(e => !/Failed to load resource/.test(e)); ok(!errs.length, 'no page errors ' + errs.slice(0, 3).join(' | '));
  console.log(fail.length ? `\n${fail.length} FAILED` : '\nALL OK');
  await browser.close(); process.exit(fail.length ? 1 : 0);
})();
