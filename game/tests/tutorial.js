// Tutorial: plays all 10 lessons with keyboard inputs, checks title entry + first-launch offer,
// touch/controller prompts, skip, pause menu. Shots → ../shots_tut/
const { open } = require('./harness');
const path = require('path');
const OUT = path.resolve(__dirname, '../shots_tut');
(async () => {
  const { browser, page, errors } = await open();
  const fail = []; const ok = (c, m) => { if (!c) fail.push(m); console.log((c ? 'ok   ' : 'FAIL ') + m); };
  const shot = async n => { await page.evaluate(() => T.draw()); await page.screenshot({ path: path.join(OUT, n + '.png') }); };
  // title: menu item present, offer appears when allowed
  let r = await page.evaluate(() => { window.SB_TUT_OFFER = 1; TitleScene.prototype.tutAsked = false; go(new TitleScene()); scene.update(); return { offer: !!scene.tutOffer, items: scene.menu.items.map(i => i.id) }; });
  ok(r.offer, 'first-launch offer shown'); ok(r.items.includes('tutorial'), 'TUTORIAL in title menu: ' + r.items.join(','));
  await shot('01_offer');
  r = await page.evaluate(() => { Keys.pressed.add('Enter'); scene.update(); Keys.pressed.clear(); return { tut: scene instanceof TutorialBattle, seen: Settings.tutSeen }; });
  ok(r.tut && r.seen, 'START TUTORIAL opens tutorial');
  await page.evaluate(() => { go(new TitleScene()); scene.update(); });
  ok(await page.evaluate(() => !scene.tutOffer), 'offer only once');
  await shot('02_title');
  await page.evaluate(() => { go(new TutorialBattle()); T.held.clear(); });
  const les = () => page.evaluate(() => scene.done ? 99 : scene.les);
  // run frames with held actions until lesson changes
  async function until(target, script, max = 1500) {
    for (let k = 0; k < max; k += 1) {
      if ((await les()) >= target) return true;
      await script(k);
    }
    return (await les()) >= target;
  }
  const hold = (acts, n, press = []) => page.evaluate(([acts, n, press]) => { T.held = new Set(acts); for (let i = 0; i < n; i++) T.frame(i === 0 ? press : []); T.held.clear(); }, [acts, n, press]);
  // 1 MOVE
  await shot('03_lesson_move');
  ok(await until(1, async k => { await hold(['right'], 50); await hold(['left'], 50); await hold(['down'], 30); await hold([], 100); }, 3), 'lesson 1 move');
  // 2 JUMP
  ok(await until(2, async () => { await hold([], 5, ['up']); await hold([], 60); await hold(['up'], 3); await hold([], 50); await hold(['right', 'up'], 4); await hold([], 100); }, 4), 'lesson 2 jump');
  // 3 DASH
  await page.evaluate(() => T.run(5)); await shot('04_lesson_dash');
  ok(await until(3, async () => { for (const d of ['right', 'right', 'left']) { await hold([d], 2); await hold([], 2); await hold([d], 4); await hold([], 40); } await hold([], 90); }, 4), 'lesson 3 dash');
  // 4 ATTACKS
  ok(await until(4, async () => { for (const a of ['light', 'medium', 'heavy']) { await hold([], 1, [a]); await hold([], 40); } await hold(['down'], 1, ['heavy']); await hold(['down'], 40); await hold([], 90); }, 4), 'lesson 4 attacks');
  // 5 BLOCK
  await page.evaluate(() => T.run(10));
  ok(await until(5, async () => { await hold(['block'], 600); }, 1) || await until(5, async () => { await hold(['down', 'block'], 600); }, 2), 'lesson 5 block');
  // 6 THROW
  await page.evaluate(() => T.run(30)); await shot('05_lesson_throw');
  ok(await until(6, async () => { await page.evaluate(() => { BT.p1.x = BT.p2.x - 70; }); await hold([], 1, ['medium', 'heavy']); await hold([], 90); }, 6), 'lesson 6 throw');
  // 7 TECH
  ok(await until(7, async () => { const g = await page.evaluate(() => !!(BT.cine && BT.cine.thr && BT.cine.D === BT.p1 && BT.cine.f > 2)); if (g) await hold([], 1, ['medium', 'heavy']); else await hold([], 1); }, 3000), 'lesson 7 tech');
  // 8 SPECIALS
  await page.evaluate(() => T.run(10)); await shot('06_lesson_specials');
  const sp = async () => {
    await hold([], 1, ['sp1']); await hold([], 70);
    await hold(['down'], 3); await hold(['down', 'right'], 2); await hold(['right'], 1, ['sp1']); await hold([], 70);
    await hold(['down'], 3); await hold(['down', 'left'], 2); await hold(['left'], 1, ['sp1']); await hold([], 70);
    await hold([], 1, ['sp2']); await hold([], 70);
    await hold(['down'], 3); await hold([], 3); await hold(['down'], 1, ['sp2']); await hold([], 120);
  };
  ok(await until(8, sp, 4), 'lesson 8 specials');
  // 9 ULT
  ok(await until(9, async () => { await hold([], 60); await hold([], 1, ['sp1', 'sp2']); await hold([], 400); }, 3), 'lesson 9 ult');
  // 10 COMBO
  await page.evaluate(() => T.run(10)); await shot('07_lesson_combo');
  ok(await until(99, async () => {
    await page.evaluate(() => { BT.p1.x = BT.p2.x - 70; BT.p1.facing = 1; });
    for (const [a, w] of [['light', 10], ['medium', 12], ['heavy', 14], ['sp1', 60]]) { await hold([], 1, [a]); await hold([], w); }
    await hold([], 80);
  }, 15), 'lesson 10 combo + complete');
  await shot('08_complete');
  r = await page.evaluate(() => ({ done: Settings.tutDone, menu: scene.endMenu && scene.endMenu.items.map(i => i.id) }));
  ok(r.done, 'tutDone saved'); 
  // end menu → main menu
  ok(await page.evaluate(() => { scene.endMenu.sel = 3; Keys.pressed.add('Enter'); scene.update(); Keys.pressed.clear(); return scene instanceof TitleScene; }), 'end menu → title');
  // skip via pill + pause menu
  r = await page.evaluate(() => {
    go(new TutorialBattle()); Mouse.x = TUT_SKIP.x + 5; Mouse.y = TUT_SKIP.y + 5; Mouse.clicked = true; scene.update(); Mouse.clicked = false; Mouse.x = Mouse.y = -1;
    const a = scene.les; T.run(1, ['Escape']); T.run(1); const items = scene.pauseMenu.items.map(i => i.id);
    scene.pauseMenu.sel = items.indexOf('tskip'); Keys.pressed.add('Enter'); scene.update(); Keys.pressed.clear();
    return { a, b: scene.les, items, paused: scene.paused };
  });
  ok(r.a === 1 && r.b === 2 && !r.paused, 'skip pill + SKIP LESSON (' + r.items.join(',') + ')');
  await page.evaluate(() => { T.run(1, ['Escape']); T.run(1); T.draw(); }); await shot('09_pause');
  // controller prompts
  await page.evaluate(() => { T.run(1, ['Escape']); go(new TutorialBattle()); scene.startLesson(7); Pad.list = [{ id: 'Xbox' }]; Pad.lastUse = Pad.n; Pad.active = () => true; T.run(5); });
  await shot('10_pad_specials');
  ok(await page.evaluate(() => tutNames(BT).dev === 'pad' && tutNames(BT).S1 === 'A'), 'controller names');
  await page.evaluate(() => { Pad.active = () => false; Pad.list = []; });
  // touch prompts
  r = await page.evaluate(() => { Settings.mobile = true; go(new TutorialBattle()); scene.startLesson(2); T.run(5); return { touch: !!BT.touch, dev: tutNames(BT).dev }; });
  ok(r.touch && r.dev === 'touch', 'touch prompts');
  await shot('11_touch_dash');
  await page.evaluate(() => { scene.startLesson(7); T.run(5); }); await shot('12_touch_specials');
  // touch skip pill
  r = await page.evaluate(() => { const a = BT.les; TouchPad.down(99, { x: TUT_SKIP.x + 4, y: TUT_SKIP.y + 4 }); TouchPad.up(99); scene.update(); return [a, BT.les]; });
  ok(r[1] === r[0] + 1, 'touch skip pill');
  ok(!errors.length, 'no page errors ' + errors.slice(0, 3).join(' | '));
  await browser.close();
  console.log(fail.length ? `\n${fail.length} FAILED` : '\nALL OK'); process.exit(fail.length ? 1 : 0);
})();
