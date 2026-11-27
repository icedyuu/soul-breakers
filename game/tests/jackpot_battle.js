// node jackpot_battle.js [out_dir] : Jackpot battle screenshots (specials, HUD, both ultimate endings, select screen)
const { open } = require('./harness');
const fs = require('fs');
(async () => {
  const out = process.argv[2] || '../../shots_jackpot'; fs.mkdirSync(out, { recursive: true });
  const { browser, page, errors } = await open();
  const snap = async (name, fn) => { const d = await page.evaluate(fn); fs.writeFileSync(`${out}/${name}.png`, Buffer.from(d.split(',')[1], 'base64')); };
  const start = (a, b, dist = 300) => `go(new Battle({ mode: 'versus', stage: 0, p1: T.idx('${a}'), p2: T.idx('${b}') })); BT.phase = 'fight'; BT.p1.setState('idle'); BT.p2.setState('idle'); BT.timer = 1e9; BT.p2.x = BT.p1.x + ${dist}; T.run(2);`;
  const mv = (k, n, force, pre = '') => new Function(start('jackpot', 'kuchi') + pre + (force ? `BT.p1.jpForce = '${force}';` : '') + `BT.p1.startMove('${k}'); T.run(${n}); T.draw(); return canvas.toDataURL();`);
  await snap('dice', mv('sp1', 20, 'jackpot', 'BT.p1.luck = 64; BT.p1.hot = 2;'));
  await snap('flush', mv('sp1f', 26, 'good'));
  await snap('flush_royal', mv('sp1f', 44, 'jackpot'));
  await snap('don_coin', mv('counter', 18, null, 'BT.p1.luck = 100;'));
  await snap('don_jack', mv('counter', 50, 'jackpot'));
  await snap('roulette_aim', mv('sp2', 28, 'normal'));
  await snap('roulette_bang', mv('sp2', 40, 'normal'));
  await snap('roulette_exec', mv('sp2', 62, 'jackpot'));
  await snap('house_spin', mv('sp2f', 40, 'normal'));
  await snap('house_jack', mv('sp2f', 70, 'jackpot'));
  await snap('allin_high', mv('sp2d', 16, null, 'BT.p2.x = BT.p1.x + 130; BT.p1.luck = 80;'));
  for (const [nm, f, L] of [['ult_coin', 24, 20], ['ult_table', 120, 20], ['ult_wheel', 270, 20], ['ult_land', 336, 20], ['ult_boom', 364, 20], ['ult_end', 400, 20], ['ult_max_coin', 50, 100], ['ult_max_wheel', 330, 100], ['ult_max_land', 380, 100], ['ult_max_boom', 416, 100], ['ult_max_end', 480, 100]])
    await snap(nm, new Function(start('jackpot', 'kazuma', 110) + `BT.p1.meter = 100; BT.p1.luck = ${L}; BT.p1.startMove('ult'); for (let i = 0; i < 400 && !BT.cine; i++) T.frame(); for (let i = 0; i < 900 && BT.cine && BT.cine.f < ${f}; i++) T.frame(); T.draw(); return canvas.toDataURL();`));
  await snap('allin_max', new Function(start('jackpot', 'kazuma', 110) + `BT.p1.luck = 100; BT.p1.startMove('sp2d'); for (let i = 0; i < 100 && !BT.cine; i++) T.frame(); T.run(80); T.draw(); return canvas.toDataURL();`));
  await snap('select', () => { go(new CharSelectScene('versus')); scene.cur = [T.idx('jackpot'), T.idx('cardmaster')]; for (let i = 0; i < 30; i++) scene.update(); T.draw(); return canvas.toDataURL(); });
  console.log(errors.length ? errors.slice(0, 6).join('\n') : 'no errors');
  await browser.close();
})();
