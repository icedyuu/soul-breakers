// node horror_battle.js [out_dir] : battle + select previews for Hachishakusama and Kuchisake-onna
const { open } = require('./harness');
const fs = require('fs');
(async () => {
  const out = process.argv[2] || '../../shots_horror';
  const { browser, page, errors } = await open();
  const snap = async (name, fn) => { const u = await page.evaluate(fn); fs.writeFileSync(`${out}/${name}.png`, Buffer.from(u.split(',')[1], 'base64')); };
  const start = (a, b) => `go(new Battle({ mode: 'versus', stage: 2, p1: T.idx('${a}'), p2: T.idx('${b}') })); BT.phase = 'fight'; BT.p1.setState('idle'); BT.p2.setState('idle'); BT.timer = 99 * 60; BT.p1.x = 520; BT.p2.x = 900; T.run(20);`;
  await snap('battle_hachi_shadow', new Function(start('hachi', 'kuchi') + "BT.p1.startMove('sp2f'); T.run(40); T.draw(); return canvas.toDataURL();"));
  await snap('battle_hachi_reach', new Function(start('hachi', 'kazuma') + "BT.p1.startMove('sp1f'); T.run(24); T.draw(); return canvas.toDataURL();"));
  await snap('battle_kuchi_decoys', new Function(start('kuchi', 'hachi') + "BT.p1.x = 700; BT.p1.startMove('sp2d'); T.run(16); T.draw(); return canvas.toDataURL();"));
  await snap('battle_kuchi_mask', new Function(start('kuchi', 'aimi') + "BT.p1.x = 700; BT.p1.startMove('sp2'); T.run(34); T.draw(); return canvas.toDataURL();"));
  await snap('select', () => { go(new CharSelectScene('versus')); scene.cur = [T.idx('hachi'), T.idx('kuchi')]; for (let i = 0; i < 30; i++) scene.update(); T.draw(); return canvas.toDataURL(); });
  console.log(errors.length ? errors.slice(0, 5).join('\n') : 'no errors');
  await browser.close();
})();
