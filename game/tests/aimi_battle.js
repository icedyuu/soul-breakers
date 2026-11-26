// node aimi_battle.js [out_dir] : battle previews (rain of bullets, no escape, unstable love, select screen)
const { open } = require('./harness');
const fs = require('fs');
(async () => {
  const out = process.argv[2] || '../../shots_aimi';
  const { browser, page, errors } = await open();
  const snap = async (name, fn) => { const u = await page.evaluate(fn); fs.writeFileSync(`${out}/${name}.png`, Buffer.from(u.split(',')[1], 'base64')); };
  const start = (v) => `go(new Battle({ mode: 'versus', stage: 3, p1: T.idx('aimi'), p2: T.idx('tokine'), v1: ${v} })); BT.phase = 'fight'; BT.p1.setState('idle'); BT.p2.setState('idle'); BT.timer = 99 * 60; BT.p1.x = 560; BT.p2.x = 900; T.run(20);`;
  await snap('battle_rain', new Function(start(0) + "BT.p1.startMove('sp2f'); T.run(40); T.draw(); return canvas.toDataURL();"));
  await snap('battle_zone', new Function(start(3) + "BT.p1.startMove('sp2d'); T.run(48); T.draw(); return canvas.toDataURL();"));
  await snap('battle_unstable', new Function(start(4) + "BT.p1.obs = 100; T.run(30); BT.p1.startMove('sp1f'); T.run(16); T.draw(); return canvas.toDataURL();"));
  await snap('battle_pursuit', new Function(start(0) + "BT.p2.x = 1100; BT.p1.startMove('sp2'); T.run(24); T.draw(); return canvas.toDataURL();"));
  await snap('select', () => { Mastery.unlockAll(); Mastery.setPick('aimi', 3); go(new CharSelectScene('versus')); scene.cur = [T.idx('aimi'), T.idx('tokine')]; for (let i = 0; i < 30; i++) scene.update(); T.draw(); return canvas.toDataURL(); });
  console.log(errors.length ? errors.slice(0, 5).join('\n') : 'no errors');
  await browser.close();
})();
