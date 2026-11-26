// screenshots of the five throw templates mid-animation + touch GRAB button: node throwshots.js
const { open } = require('./harness');
const path = require('path');
(async () => {
  const { browser, page, errors } = await open();
  const ids = [['kazuma', 20], ['goro', 27], ['reika', 14], ['sera', 22], ['yoru', 22]];
  for (const [id, f] of ids) {
    await page.evaluate(([id, f]) => {
      T.start(id, 'kanae', 'versus', 0); BT.cpu = null; for (let i = 0; i < 4; i++) T.frame();
      BT.p1.x = 600; BT.p2.x = 670; T.frame(['medium', 'heavy']);
      for (let i = 0; i < 300 && !(BT.cine && BT.cine.f >= f); i++) T.frame();
      T.draw();
    }, [id, f]);
    await page.screenshot({ path: path.resolve(__dirname, `../shots_throw_${id}.png`) });
  }
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})();
