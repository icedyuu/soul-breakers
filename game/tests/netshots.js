// Screenshots of the ONLINE screens (title, lobby, host code, join keypad, select, battle with pad)
const { open } = require('./harness');
const path = require('path'), OUT = process.env.SB_SHOTS || path.resolve(__dirname, '../../shots_net');
require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const { browser, page, errors } = await open();
  const shot = async n => { await page.evaluate(() => T.draw()); await page.screenshot({ path: path.join(OUT, n + '.png') }); };
  await page.evaluate(() => { go(new TitleScene()); T.run(30); });
  await shot('1_title');
  await page.evaluate(() => { go(new NetLobbyScene()); T.run(20); }); await shot('2_lobby');
  await page.evaluate(() => { scene.mode = 'hosting'; Net.status = 'waiting'; Net.code = '482913'; T.run(20); }); await shot('3_host_code');
  await page.evaluate(() => { Net.status = 'idle'; scene.mode = 'join'; scene.code = '4829'; T.run(5); }); await shot('4_join_keypad');
  await page.evaluate(() => { Net.status = 'connected'; Net.role = 'guest'; Net.rtt = 48; Net.lastRx = 1e12; Net.code = '482913'; go(new NetSelectScene()); scene.cur[1] = 14; scene.ready[1] = true; scene.move(0, 7); T.run(30); }); await shot('5_select');
  await page.evaluate(() => { Settings.mobile = true; Net.rtt = 48; const b = new NetBattle({ mode: 'versus', p1: 14, p2: 7, stage: 0, seed: 9, delay: 3, roundTime: 99 }); go(b); for (let f = 0; f < 400; f++) Net.rin.set(f, 0); T.run(320); }); await shot('6_battle_mobile');
  console.log('errors', errors); await browser.close();
})();
