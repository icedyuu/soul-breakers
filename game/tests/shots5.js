// node shots5.js : previews for The Hollow (select, seal + HUD, mark, overload + fragment, how-to, The Last Remnant ult)
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  const shot = async (name, fn, arg) => { await page.evaluate(fn, arg); await page.evaluate(() => T.draw()); await page.screenshot({ path: 'shot5_' + name + '.png' }); };
  await shot('select', () => { go(new CharSelectScene('versus')); scene.cur = [CHARS.findIndex(c => c.id === 'hollow'), CHARS.findIndex(c => c.id === 'honored')]; for (let i = 0; i < 40; i++) scene.update(); });
  await shot('seal', () => {
    T.start('hollow', 'honored', 'versus', 0); BT.timer = 99 * 60; const A = BT.p1, D = BT.p2; A.x = 760; D.x = 980; T.run(3); A.frag = 38; A.fragT = 1e9;
    D.startMove('sp1'); T.run(50); D.x = 980; A.startMove('sp2'); T.run(34);
  });
  await shot('mark', () => {
    T.start('hollow', 'lunaria', 'versus', 1); BT.timer = 99 * 60; const A = BT.p1, D = BT.p2; A.x = 700; D.x = 1000; T.run(3); A.frag = 62; A.fragT = 1e9;
    A.startMove('sp1f'); T.run(40); A.startMove('sp1'); T.run(6);
  });
  await shot('overload', () => {
    T.start('hollow', 'goro', 'versus', 2); BT.timer = 99 * 60; const A = BT.p1, D = BT.p2; A.x = 640; D.x = 900; T.run(3); A.frag = 90; A.startMove('sp2d'); T.run(60);
    A.startMove('sp2f'); T.run(22);
  });
  await shot('victory', () => {
    T.start('hollow', 'reika', 'versus', 1); BT.timer = 99 * 60; const A = BT.p1, D = BT.p2; A.x = 640; D.x = 900; T.run(3);
    A.setState('victory'); for (let i = 0; i < 95; i++) { A.T++; A.sf++; A.update && 0; T.draw; } BT.phase = 'end';
  });
  await shot('defeat', () => {
    T.start('hollow', 'reika', 'versus', 0); BT.timer = 99 * 60; const A = BT.p1, D = BT.p2; A.x = 640; D.x = 900; T.run(3);
    A.hp = 1; D.startMove('H'); A.x = D.x - 100; for (let i = 0; i < 160; i++) { T.frame(); if (A.ko && A.sf > 70) break; }
  });
  await shot('howto', () => { go(new HowToScene()); scene.page = scene.pages.length - 1; for (let i = 0; i < 10; i++) scene.update(); });
  await page.evaluate(() => { T.start('hollow', 'kazuma', 'versus', 2); BT.timer = 1e9; const A = BT.p1; A.meter = 100; BT.p2.x = A.x + 150; T.run(3); A.startMove('ult'); for (let i = 0; i < 300 && !BT.cine; i++) T.frame(); });
  for (const f of [30, 64, 92, 112, 150, 190, 218, 234, 252, 284]) {
    await page.evaluate(f => { for (let i = 0; i < 400 && BT.cine && BT.cine.f < f; i++) T.frame(); T.draw(); }, f);
    await page.screenshot({ path: 'shot5_ult_' + f + '.png' });
  }
  console.log('errors', errors); await browser.close();
})();
