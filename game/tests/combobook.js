// Combo list (pause → COMBO LIST), training options menu, dummy throw tech, Buzzu hurtbox. node tests/combobook.js [shots]
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  const shots = process.argv[2] === 'shots';
  const r = await page.evaluate(() => {
    const out = {}, esc = () => { Keys.pressed.add('Escape'); scene.update(); Keys.pressed.clear(); }, ok = () => { Keys.pressed.add('Enter'); scene.update(); Keys.pressed.clear(); };
    const pick = id => { BT.pauseMenu.sel = BT.pauseMenu.items.findIndex(i => i.id === id); ok(); };
    out.missing = CHARS.filter(c => !(COMBO_BOOK[c.id] && COMBO_BOOK[c.id].length)).map(c => c.id);
    T.start('nue', 'cardmaster', 'training'); T.run(5);
    esc(); T.draw(); out.items = BT.pauseMenu.items.map(i => i.id).join(',');
    pick('combos'); T.draw(); out.open = BT.showCombos; out.pages = BT._cbPages;
    Keys.pressed.add('ArrowRight'); scene.update(); Keys.pressed.clear(); out.page = BT.cbPage; ok(); out.closed = !BT.showCombos;
    pick('topts'); out.opts = BT.showOpts; BT.optsMenu.sel = 3; ok(); out.tech = BT.dm.tech; BT.optsMenu.sel = 5; ok(); out.boxes = BT.showBoxes; T.draw();
    esc(); out.optsClosed = !BT.showOpts; esc(); out.unpaused = !BT.paused;
    // every fighter's combo pages draw without throwing, both themes
    for (const c of CHARS) { T.start(c.id, 'kazuma', 'versus'); esc(); pick('combos'); for (let p = 0; p < 3; p++) { BT.cbPage = p; T.draw(); } }
    // dummy tech
    T.start('kazuma', 'goro', 'training'); BT.dm.tech = true; BT.p1.x = BT.p2.x - 70; T.run(30);
    const hp = BT.p2.hp; T.run(1, ['medium', 'heavy']); T.run(90); out.techHp = hp - BT.p2.hp; out.techs = BT.p2.stats.techs || 0;
    BT.dm.tech = false; BT.p1.x = BT.p2.x - 70; T.run(30); const hp2 = BT.p2.hp; T.run(1, ['medium', 'heavy']); T.run(90); out.noTechDmg = hp2 - BT.p2.hp;
    // Buzzu: standing L of Kazuma hits him
    T.start('kazuma', 'buzzu', 'training'); BT.p1.x = BT.p2.x - 80; T.run(20); T.run(1, ['light']); T.run(20); out.buzzuL = BT.p2.lastDmg > 0 || BT.p2.hp < BT.p2.maxHp;
    // last combo tracked
    T.start('kazuma', 'kazuma', 'training'); BT.p1.x = BT.p2.x - 80; T.run(20); T.run(1, ['light']); T.run(6, ['medium']); T.run(150); out.lastCombo = BT.lastCombo;
    return out;
  });
  console.log(JSON.stringify(r));
  if (shots) {
    await page.evaluate(() => { T.start('cardmaster', 'nue', 'training'); T.run(5); Keys.pressed.add('Escape'); scene.update(); Keys.pressed.clear(); T.draw(); });
    await page.screenshot({ path: '/tmp/claude-0/cb_pause.png' });
    await page.evaluate(() => { BT.showCombos = true; BT.cbPage = 0; T.draw(); }); await page.screenshot({ path: '/tmp/claude-0/cb_list.png' });
    await page.evaluate(() => { BT.cbPage = 1; T.draw(); }); await page.screenshot({ path: '/tmp/claude-0/cb_list2.png' });
    await page.evaluate(() => { BT.showCombos = false; BT.showOpts = true; BT.optsMenu = cbOptsMenu(BT); T.draw(); }); await page.screenshot({ path: '/tmp/claude-0/cb_opts.png' });
  }
  const bad = r.missing.length || !r.open || !r.closed || !r.opts || !r.tech || !r.boxes || !r.unpaused || r.techHp !== 0 || r.techs < 1 || r.noTechDmg <= 0 || !r.buzzuL || !r.lastCombo;
  console.log('errors', errors.slice(0, 3)); console.log(bad || errors.length ? 'FAIL' : 'PASS');
  await browser.close();
})();
