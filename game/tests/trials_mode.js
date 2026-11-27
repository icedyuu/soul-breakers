// COMBO TRIALS mode: title TRAINING ◀ COMBO TRIALS ▶ → select → TrialBattle; the combo bot (runSeq from
// combofind.js) plays every trial of every fighter inside the real TrialBattle; each must clear, give XP
// once, be saved in data.ctr and survive an account-style import. Shots → ../shots_trials/
//   node trials_mode.js [ids]
const { open } = require('./harness');
const fs = require('fs'), path = require('path');
const OUT = path.resolve(__dirname, '../shots_trials'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { browser, page, errors } = await open();
  const fail = []; const ok = (c, m) => { if (!c) fail.push(m); console.log((c ? 'ok   ' : 'FAIL ') + m); };
  const shot = async n => { await page.evaluate(() => T.draw()); await page.screenshot({ path: path.join(OUT, n + '.png') }); };
  const src = fs.readFileSync(path.join(__dirname, 'combofind.js'), 'utf8');
  // same bot, but inside TrialBattle (no dummy reset, no guard change)
  let rs = src.slice(src.indexOf('window.runSeq'), src.indexOf('  });\n  await page.evaluate(a =>'));
  rs = rs.replace("T.start(id, oppId, 'training');", "go(new TrialBattle(T.idx(id), window.TRIAL_I)); BT.paused = false;").replace('BT.dm.guard = window.GUARD ?? 2;', 'BT.dm.guard = 0;');
  await page.evaluate(rs); await page.evaluate(() => window.APPROACH = 70);
  // title choice + select flow
  let r = await page.evaluate(() => {
    go(new TitleScene()); scene.update(); const m = scene.menu; m.sel = m.items.findIndex(i => i.id === 'training');
    const b = TRIAL_PICK; Keys.pressed.add('ArrowRight'); scene.update(); Keys.pressed.clear(); const a = TRIAL_PICK;
    T.draw(); return { b, a, val: m.items[m.sel].value };
  });
  ok(r.b === false && r.a === true && /COMBO TRIALS/.test(r.val), 'title TRAINING toggles to COMBO TRIALS');
  await shot('01_title');
  r = await page.evaluate(() => { Keys.pressed.add('Enter'); scene.update(); Keys.pressed.clear(); return scene instanceof CharSelectScene && scene.trials; });
  ok(r, 'opens character select in trial mode');
  await page.evaluate(() => { scene.cur[0] = T.idx('kazuma'); T.run(5); }); await shot('02_select');
  r = await page.evaluate(() => { Keys.pressed.add('Enter'); scene.update(); Keys.pressed.clear(); for (let i = 0; i < 60 && !(scene instanceof TrialBattle); i++) T.frame(); return scene instanceof TrialBattle && scene.ti === 0 && scene.list.length; });
  ok(r === 5, 'select → TrialBattle, starts at trial 1 of 5');
  await page.evaluate(() => T.run(30)); await shot('03_trial');
  // every fighter: COMBO_TRIALS present, every trial cleared by the bot
  const ids = process.argv[2] ? process.argv[2].split(',') : await page.evaluate(() => CHARS.map(c => c.id));
  for (const id of ids) {
    const n = await page.evaluate(id => (COMBO_TRIALS[id] || []).length, id);
    ok(n >= 5, `${id}: ${n} trials`);
    const xp0 = await page.evaluate(id => Mastery.rec(id).xp, id);
    const res = [];
    for (let i = 0; i < n; i++) {
      let x = null;
      for (let a = 0; a < 3 && !(x && x.clr); a++) {
        x = await page.evaluate(([id, i]) => { window.TRIAL_I = i; const seq = COMBO_TRIALS[id][i].seq; const rr = runSeq(id, 'kazuma', seq, 0); for (let k = 0; k < 10; k++) T.frame(); return { ...rr, clr: Trials.done(id, i), tier: COMBO_TRIALS[id][i].tier }; }, [id, i]);
      }
      res.push(x.clr ? x.tier : x.tier + '✗(' + x.moves + ')');
      if (!x.clr) fail.push(`${id} trial ${i + 1} ${x.tier} not cleared: ${x.moves} ${x.log}`);
    }
    const xp1 = await page.evaluate(id => Mastery.rec(id).xp, id);
    console.log(`${res.every(s => !s.includes('✗')) ? 'ok  ' : 'FAIL'} ${id}: ${res.join(' ')}  +${xp1 - xp0} XP`);
  }
  // XP only once, mask saved, import union, auto-advance, pause items
  r = await page.evaluate(() => {
    const ch = CHARS[T.idx('kazuma')], xp = Mastery.rec('kazuma').xp, again = Trials.clear(ch, 0);
    const m = Mastery.data.ctr.kazuma; Mastery.data.ctr.kazuma = 1;
    Mastery.import({ v: 1, chars: {}, ctr: { kazuma: 6 } }); const merged = Mastery.data.ctr.kazuma;
    Mastery.data.ctr.kazuma = m;
    go(new TrialBattle(T.idx('kazuma'))); const bt = scene; Keys.pressed.add('Escape'); bt.update(); Keys.pressed.clear(); bt.update();
    const ids = bt.pauseMenu.items.map(i => i.id); bt.pauseMenu.sel = ids.indexOf('trnext'); Keys.pressed.add('Enter'); bt.update(); Keys.pressed.clear();
    return { again, same: Mastery.rec('kazuma').xp === xp, mask: m, merged, ids, ti: bt.ti };
  });
  ok(r.again === null && r.same, 'XP only for the first clear');
  ok(r.mask === 31 && r.merged === 7, `cleared mask saved (${r.mask}) + import unions (${r.merged})`);
  ok(r.ids.includes('trnext') && r.ids.includes('trprev') && r.ids.includes('trsel') && !r.ids.includes('restart') && r.ti === 1, 'pause: NEXT/PREV TRIAL work: ' + r.ids.join(','));
  await page.evaluate(() => { go(new TrialBattle(T.idx('nue'), 2)); T.held = new Set(['right']); T.run(40); T.held.clear(); T.run(1, ['light']); T.run(8, ['medium']); T.run(3); }); await shot('04_progress');
  await page.evaluate(() => { scene.cur = undefined; go(new CharSelectScene('training')); scene.trials = true; scene.cur[0] = T.idx('kazuma'); T.run(3); }); await shot('05_select_done');
  // mobile: panel arrows by tap/click
  r = await page.evaluate(() => { go(new TrialBattle(T.idx('hollow'), 0)); const [d, rc] = scene.arrowRects()[1]; Mouse.x = rc.x + 5; Mouse.y = rc.y + 5; Mouse.clicked = true; scene.update(); Mouse.clicked = false; return scene.ti; });
  ok(r === 1, 'tap ▶ on the panel → next trial');
  const errs = errors.filter(e => !/Failed to load resource/.test(e)); ok(!errs.length, 'no page errors ' + errs.slice(0, 3).join(' | '));
  console.log(fail.length ? `\n${fail.length} FAILED\n` + fail.join('\n') : '\nALL OK');
  await browser.close(); process.exit(fail.length ? 1 : 0);
})();
