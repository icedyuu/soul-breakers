const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  const shot = async (name, fn, arg) => { await page.evaluate(fn, arg); await page.evaluate(() => T.draw()); await page.screenshot({ path: 'shot_' + name + '.png' }); };
  await shot('select', () => { go(new CharSelectScene('versus')); const s = scene; s.cur = [CHARS.findIndex(c => c.id === 'borgar'), CHARS.findIndex(c => c.id === 'reika')]; for (let i = 0; i < 40; i++) scene.update(); });
  await shot('select2', () => { scene.cur = [CHARS.findIndex(c => c.id === 'buzzu'), 0]; for (let i = 0; i < 40; i++) scene.update(); });
  for (const [a, b, px] of [['borgar', 'buzzu', 0], ['reika', 'borgar', 1], ['buzzu', 'reika', 0]]) {
    await shot(`battle_${a}_${b}`, ([a, b, px]) => { Settings.pixel = !!px; T.start(a, b, 'versus'); BT.p1.meter = 100; BT.p2.meter = 60; for (let i = 0; i < 90; i++) T.frame(i % 20 === 0 ? ['sp1'] : []); BT.p2.x = BT.p1.x + 200; for (let i = 0; i < 25; i++) T.frame(i===0?['heavy']:[]); }, [a, b, px]);
  }
  await page.evaluate(() => { Settings.pixel = false; });
  for (const id of ['borgar', 'buzzu', 'reika']) {
    await shot('list_' + id, id => { T.start(id, 'kazuma', 'versus'); T.frame(); BT.paused = true; BT.showList = true; BT.pauseMenu = { update() {}, draw() {} }; }, id);
  }
  const n = await page.evaluate(() => { go(new HowToScene()); return scene.pages.length; });
  for (let p = n - 3; p < n; p++) await shot('howto_' + p, p => { scene.page = p; scene.update(); }, p);
  console.log('errors', errors.slice(0, 4)); await browser.close();
})();
