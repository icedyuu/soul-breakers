// node shots3.js : previews for Yamika & Lunaria (select, battle with field/zone/HUD, how-to pages)
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  const shot = async (name, fn, arg) => { await page.evaluate(fn, arg); await page.evaluate(() => T.draw()); await page.screenshot({ path: 'shot3_' + name + '.png' }); };
  await shot('select', () => { go(new CharSelectScene('versus')); scene.cur = [CHARS.findIndex(c => c.id === 'yamika'), CHARS.findIndex(c => c.id === 'lunaria')]; for (let i = 0; i < 40; i++) scene.update(); });
  await shot('battle', () => {
    T.start('yamika', 'lunaria', 'versus', 1); BT.timer = 99 * 60; const A = BT.p1, D = BT.p2; A.x = 820; D.x = 1180; T.run(3);
    A.startMove('sp2d'); T.run(40); D.startMove('sp2f'); T.run(30); A.startMove('sp2'); T.run(20); D.startMove('sp1'); T.run(12); A.startMove('sp1'); T.run(16);
  });
  await shot('battle2', () => {
    T.start('lunaria', 'yamika', 'versus', 2); BT.timer = 99 * 60; const A = BT.p1, D = BT.p2; A.x = 900; D.x = 1180; T.run(3);
    A.eclT = 300; A.startMove('counter'); T.run(30); D.startMove('sp1f'); T.run(14); A.startMove('sp2'); T.run(10);
  });
  for (const [i, id] of [['yamika', 'yamika'], ['lunaria', 'lunaria']]) await shot('howto_' + id, id => { go(new HowToScene()); scene.page = scene.pages.length - (id === 'yamika' ? 2 : 1); for (let i = 0; i < 10; i++) scene.update(); }, id);
  console.log('errors', errors); await browser.close();
})();
