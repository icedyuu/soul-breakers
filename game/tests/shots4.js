// node shots4.js : previews for Kuon, The Honored One (select, battle/HUD, Infinity, Hollow Purple, how-to, domain ult)
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  const shot = async (name, fn, arg) => { await page.evaluate(fn, arg); await page.evaluate(() => T.draw()); await page.screenshot({ path: 'shot4_' + name + '.png' }); };
  await shot('select', () => { go(new CharSelectScene('versus')); scene.cur = [CHARS.findIndex(c => c.id === 'honored'), CHARS.findIndex(c => c.id === 'lunaria')]; for (let i = 0; i < 40; i++) scene.update(); });
  await shot('blue', () => {
    T.start('honored', 'buzzu', 'versus', 0); BT.timer = 99 * 60; const A = BT.p1, D = BT.p2; A.x = 760; D.x = 1100; T.run(3); A.lim = 62; A.limT = 1e9;
    A.startMove('sp2'); T.run(30);
  });
  await shot('infinity', () => {
    T.start('honored', 'lunaria', 'versus', 1); BT.timer = 99 * 60; const A = BT.p1, D = BT.p2; A.x = 760; D.x = 1150; T.run(3);
    D.startMove('sp1'); T.run(6); A.startMove('counter'); T.run(24);
  });
  await shot('purple', () => {
    T.start('honored', 'goro', 'versus', 2); BT.timer = 99 * 60; const A = BT.p1, D = BT.p2; A.x = 620; D.x = 1150; T.run(3); A.lim = 100; T.run(30);
    A.startMove('sp2d'); T.run(46);
  });
  await shot('howto', () => { go(new HowToScene()); scene.page = scene.pages.length - 1; for (let i = 0; i < 10; i++) scene.update(); });
  // domain ult at chosen cinematic frames
  await page.evaluate(() => { T.start('honored', 'reika', 'versus', 0); BT.timer = 1e9; const A = BT.p1; A.meter = 100; BT.p2.x = A.x + 140; T.run(3); A.startMove('ult'); for (let i = 0; i < 300 && !BT.cine; i++) T.frame(); });
  for (const f of [24, 56, 70, 96, 160, 196, 230, 252]) {
    await page.evaluate(f => { for (let i = 0; i < 400 && BT.cine && BT.cine.f < f; i++) T.frame(); T.draw(); }, f);
    await page.screenshot({ path: 'shot4_ult_' + f + '.png' });
  }
  console.log('errors', errors); await browser.close();
})();
