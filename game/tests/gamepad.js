// Controller support: fake navigator.getGamepads(), drive menus, select, battle, ULT, pause, remap, keypad.
const { open } = require('./harness');
const fs = require('fs'), path = require('path');
const OUT = path.resolve(__dirname, '../shots_gamepad'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { browser, page, errors } = await open();
  await page.evaluate(() => {
    const mk = (i, id) => ({ id, index: i, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) });
    window.__pads = [mk(0, 'Xbox Wireless Controller (STANDARD GAMEPAD)'), mk(1, 'DualSense Wireless Controller (Vendor: 054c)')];
    navigator.getGamepads = () => window.__pads;
    window.G = {
      tick(n = 1) { for (let i = 0; i < n; i++) { tick(); Keys.pressed.clear(); Mouse.clicked = false; Mouse.moved = false; } },
      btn(p, i, v) { const b = __pads[p].buttons[i]; b.pressed = v; b.value = v ? 1 : 0; },
      tap(p, i, hold = 2) { G.btn(p, i, true); G.tick(hold); G.btn(p, i, false); G.tick(2); },
      ax(p, x, y) { __pads[p].axes[0] = x; __pads[p].axes[1] = y; },
    };
  });
  const ok = [], bad = [];
  const check = (name, v) => (v ? ok : bad).push(name);
  const ev = (f, a) => page.evaluate(f, a);
  // title menu: d-pad down moves selection, A confirms
  const sel0 = await ev(() => { go(new TitleScene()); G.tick(5); return scene.menu ? scene.menu.sel : -1; });
  await ev(() => G.tap(0, 13));
  check('title d-pad down moves', await ev(s => scene.menu && scene.menu.sel !== s, sel0));
  await ev(() => { G.ax(0, 0, -1); G.tick(2); G.ax(0, 0, 0); G.tick(2); });
  check('title stick up moves back', await ev(s => scene.menu && scene.menu.sel === s, sel0));
  // settings → controller page via pad
  await ev(() => { go(new SettingsScene()); G.tick(2); });
  const padIdx = await ev(() => scene.items.findIndex(i => i.id === 'pad'));
  check('settings has CONTROLLER item', padIdx > 0);
  await ev(n => { scene.menu.sel = n; G.tap(0, 0); }, padIdx);
  check('A opens controller page', await ev(() => scene instanceof PadScene));
  await page.evaluate(() => T.draw()); await page.screenshot({ path: OUT + '/controller_page.png' });
  // remap Light to RB (5), then check swap and reset
  await ev(() => { scene.row = 0; G.tap(0, 0); G.tap(0, 5); });
  check('remap light → RB', await ev(() => Settings.padMap[5] === 'light' && Settings.padMap[2] === 'sp2'));
  await ev(() => { scene.row = PAD_ACTS.length; G.tap(0, 0); });
  check('reset defaults', await ev(() => Settings.padMap[2] === 'light' && Settings.padMap[5] === 'sp2'));
  await ev(() => G.tap(0, 1));
  check('B goes back', await ev(() => scene instanceof SettingsScene));
  // char select: two controllers move independent cursors and pick
  await ev(() => { go(new CharSelectScene('versus')); G.tick(3); });
  const c0 = await ev(() => JSON.stringify(scene.cur || scene.c || null));
  await ev(() => { G.tap(0, 15); G.tap(1, 15); G.tap(1, 15); });
  const c1 = await ev(() => JSON.stringify(scene.cur || scene.c || null));
  check('select cursors move (' + c0 + ' → ' + c1 + ')', c0 !== c1);
  await page.evaluate(() => T.draw()); await page.screenshot({ path: OUT + '/select.png' });
  // battle: training, X = light attack, ULT on RT with full meter, pause with Start
  await ev(() => { T.start('kazuma', 'goro', 'training'); G.tick(200); });
  const st = await ev(() => { G.btn(0, 2, true); G.tick(3); G.btn(0, 2, false); return BT.p1.state + ':' + (BT.p1.move && BT.p1.moveKey || BT.p1.mk || ''); });
  check('X = light attack (' + st + ')', /attack|move/i.test(st) || (await ev(() => !!BT.p1.move)));
  await ev(() => G.tick(60));
  const walk = await ev(() => { const x = BT.p1.x; G.ax(0, 1, 0); G.tick(20); G.ax(0, 0, 0); G.tick(2); return BT.p1.x - x; });
  check('stick walks (' + walk.toFixed(1) + ')', Math.abs(walk) > 20);
  const ult = await ev(() => { G.tick(30); BT.p1.meter = 100; G.btn(0, 7, true); G.tick(4); G.btn(0, 7, false); G.tick(2); return { cine: !!BT.cine, m: BT.p1.meter, mv: BT.p1.move && BT.p1.move.name }; });
  check('RT = ULT (' + JSON.stringify(ult) + ')', ult.cine || ult.m < 100);
  await ev(() => G.tick(400));
  await ev(() => G.tap(0, 9));
  check('Start pauses', await ev(() => BT.paused));
  await page.evaluate(() => T.draw()); await page.screenshot({ path: OUT + '/pause.png' });
  await ev(() => G.tap(0, 9));
  check('Start resumes', await ev(() => !BT.paused));
  // versus: controller 2 drives P2
  await ev(() => { T.start('kazuma', 'goro', 'versus'); G.tick(5); });
  const w2 = await ev(() => { const x = BT.p2.x; G.ax(1, -1, 0); G.tick(20); G.ax(1, 0, 0); G.tick(2); return BT.p2.x - x; });
  check('controller 2 moves P2 (' + w2.toFixed(1) + ')', Math.abs(w2) > 20);
  // keyboard + controller together: keyboard hold survives controller release
  const kb = await ev(() => { const c = Settings.binds[1].right; Pad.kb.add(c); Keys.down.add(c); G.ax(0, 1, 0); G.tick(2); G.ax(0, 0, 0); G.tick(2); const r = Keys.down.has(c); Pad.kb.delete(c); Keys.down.delete(c); return r; });
  check('keyboard hold kept', kb);
  // mobile pad hidden while controller is used
  check('touch pad hides when controller active', await ev(() => Pad.active()));
  // online keypad
  await ev(() => { go(new NetLobbyScene()); scene.mode = 'join'; scene.code = ''; G.tick(2); G.tap(0, 15); G.tap(0, 0); G.tap(0, 13); G.tap(0, 0); });
  check('keypad types digits (' + (await ev(() => scene.code)) + ')', await ev(() => scene.code === '25'));
  await page.evaluate(() => T.draw()); await page.screenshot({ path: OUT + '/keypad.png' });
  await ev(() => { G.tap(0, 1); G.tap(0, 1); G.tap(0, 1); });
  check('B deletes then leaves', await ev(() => scene.mode === 'menu'));
  await ev(() => { Net.close && Net.close(); go(new HowToScene()); G.tick(2); });
  await page.evaluate(() => T.draw()); await page.screenshot({ path: OUT + '/howto.png' });
  console.log('OK  ', ok.join('\n    '));
  if (bad.length) console.log('FAIL', bad.join('\n    '));
  if (errors.length) console.log('ERRORS', errors.slice(0, 5));
  await browser.close();
  process.exit(bad.length || errors.length ? 1 : 0);
})();
