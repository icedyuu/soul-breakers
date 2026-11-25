const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  const shot = async (name, fn, arg) => { await page.evaluate(fn, arg); await page.evaluate(() => T.draw()); await page.screenshot({ path: 'shot_' + name + '.png' }); };
  await shot('select', () => { go(new CharSelectScene('versus')); scene.cur = [CHARS.findIndex(c => c.id === 'kazuma'), CHARS.findIndex(c => c.id === 'goro')]; for (let i = 0; i < 40; i++) scene.update(); });
  for (const [a, b, px] of [['kazuma', 'goro', 1], ['yoru', 'conductor', 1], ['frogs', 'kazuma', 1], ['goro', 'yoru', 0]]) {
    await shot(`battle_${a}_${b}`, ([a, b, px]) => { Settings.pixel = !!px; T.start(a, b, 'versus'); BT.p1.meter = 100; for (let i = 0; i < 60; i++) T.frame([]); BT.p2.x = BT.p1.x + 230; for (let i = 0; i < 14; i++) T.frame(i === 0 ? ['heavy'] : []); }, [a, b, px]);
  }
  console.log('errors', errors.slice(0, 4)); await browser.close();
})();
