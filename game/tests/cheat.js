// node cheat.js -> hidden cheat: hover TOGGLE FULLSCREEN in SETTINGS + type "cheat" unlocks everything; without hover nothing happens
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  const r = await page.evaluate(() => {
    go(new SettingsScene()); T.frame();
    const type = () => { for (const k of ['KeyC', 'KeyH', 'KeyE', 'KeyA', 'KeyT']) { Keys.pressed.add(k); scene.update(); Keys.pressed.clear(); } };
    Mouse.x = 5; Mouse.y = 5; type(); const before = Mastery.level('kazuma');
    const s0 = JSON.stringify(Settings);
    const i = scene.items.findIndex(it => it.id === 'fullscreen'), rc = scene.menu.rect(i); Mouse.x = rc.x + rc.w / 2; Mouse.y = rc.y + rc.h / 2; Mouse.moved = true; T.frame();
    type(); for (let k = 0; k < 10; k++) T.frame();
    return { before, after: CHARS.map(c => Mastery.level(c.id)), all: CHARS.every(c => Mastery.unlocked(c.id, VAR_N - 1)), settingsSame: s0 === JSON.stringify(Settings), scene: scene.constructor.name, t: scene.cheatT };
  });
  await page.evaluate(() => T.draw()); await page.screenshot({ path: require('path').resolve(__dirname, '../shots_mastery/cheat.png') });
  const ok = r.before === 1 && r.all && r.after.every(l => l === 10) && r.settingsSame && r.scene === 'SettingsScene' && r.t > 0;
  console.log(ok ? 'CHEAT OK' : 'CHEAT FAIL', JSON.stringify(r), '\nerrors', errors);
  await browser.close();
})();
