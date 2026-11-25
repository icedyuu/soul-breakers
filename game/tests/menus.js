// menu flow test: title → 1P VS CPU → arcade/single, random button, results; screenshots to ../shots_cpu/
const { open } = require('./harness');
const fs = require('fs'); const out = require('path').resolve(__dirname, '../shots_cpu'); fs.mkdirSync(out, { recursive: true });
(async () => {
  const { browser, page, errors } = await open();
  const shot = async n => { await page.evaluate(() => T.draw()); await page.screenshot({ path: `${out}/${n}.png` }); };
  const key = (k, n = 1) => page.evaluate(([k, n]) => { for (let i = 0; i < n; i++) { Keys.pressed.add(k); scene.update(); Keys.pressed.clear(); scene.update(); } }, [k, n]);
  const run = n => page.evaluate(n => { for (let i = 0; i < n; i++) { Keys.down = new Set(); scene.update(); Keys.pressed.clear(); } }, n);
  const name = () => page.evaluate(() => scene.constructor.name);
  await page.evaluate(() => go(new TitleScene())); await run(5); await shot('title');
  await key('Enter'); console.log('after title', await name()); await key('ArrowRight', 2); await shot('cpusetup');
  console.log('level', await page.evaluate(() => Settings.cpuLevel));
  await key('ArrowDown'); await key('Enter'); console.log('single →', await name());
  await key('KeyV'); await run(5); await shot('select_random_p1');
  await key('KeyV'); await run(60); console.log('after random cpu pick →', await name());
  await key('Enter'); console.log('stage →', await name()); await run(200); console.log('→', await name());
  await run(400); await shot('battle_cpu');
  // versus select random for both
  await page.evaluate(() => go(new CharSelectScene('versus'))); await key('KeyV'); await key('KeyJ'); await run(5); await shot('select_random_vs'); await run(60); console.log('vs random →', await name());
  // arcade
  await page.evaluate(() => go(new CpuSetupScene())); await key('ArrowDown', 2); await key('Enter'); await key('Enter'); await run(60);
  const a = await page.evaluate(() => ({ s: scene.constructor.name, arc: scene.cfg && scene.cfg.arcade }));
  console.log('arcade →', a.s, JSON.stringify(a.arc));
  // force a P1 win to see results/next fight
  await run(200); await page.evaluate(() => { const bt = BT; bt.wins = [1, 0]; for (let i = 0; i < 900 && scene === bt; i++) { if (bt.phase === 'fight') bt.p2.hp = 0; Keys.down = new Set(); scene.update(); } });
  await run(40); console.log('after win →', await name()); await shot('results_arcade');
  await key('Enter'); await run(5); const n2 = await page.evaluate(() => ({ s: scene.constructor.name, i: scene.cfg && scene.cfg.arcade && scene.cfg.arcade.i }));
  console.log('next →', JSON.stringify(n2));
  console.log('errors', errors.slice(0, 5)); await browser.close();
})();
