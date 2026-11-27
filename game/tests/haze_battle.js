// node haze_battle.js [out_dir] : Haze in battle — every special, smoke zones, concealment, counter, ultimate frames
const { open } = require('./harness');
const fs = require('fs');
(async () => {
  const out = process.argv[2] || '../../shots_haze';
  fs.mkdirSync(out, { recursive: true });
  const { browser, page, errors } = await open();
  const shot = async name => { const d = await page.evaluate(() => { T.draw(); return canvas.toDataURL(); }); fs.writeFileSync(`${out}/${name}.png`, Buffer.from(d.split(',')[1], 'base64')); };
  const setup = (o = 'kazuma', dist = 220) => page.evaluate(([o, dist]) => { go(new Battle({ mode: 'versus', stage: 0, p1: T.idx('haze'), p2: T.idx(o) })); BT.phase = 'fight'; BT.p1.setState('idle'); BT.p2.setState('idle'); BT.timer = 1e9; BT.p2.x = BT.p1.x + dist; T.run(2); }, [o, dist]);
  const mv = (k, n) => page.evaluate(([k, n]) => { BT.p1.startMove(k); T.run(n); }, [k, n]);
  const run = n => page.evaluate(n => T.run(n), n);
  await setup(); await run(40); await shot('idle');
  await setup('kazuma', 380); await mv('sp1', 14); await shot('sp1_stream');
  await setup('kazuma', 200); await mv('sp1f', 30); await shot('cloud_start'); await run(90); await shot('cloud_full');
  await page.evaluate(() => { BT.p1.x = BT.p2.x - 60; }); await run(20); await shot('cloud_concealed');
  await setup('kazuma', 200); await mv('sp2f', 40); await shot('hotbox'); await page.evaluate(() => { BT.p2.x = BT.p1.x + 120; }); await run(60); await shot('hotbox_inside');
  await mv('sp2f', 16); await shot('hotbox_clear'); await run(10); await shot('hotbox_clear2');
  await setup('kazuma', 260); await mv('counter', 9); await shot('vapor_dash');
  await setup('kazuma', 200); await mv('sp1f', 90); await mv('counter', 13); await shot('smoke_step'); await page.evaluate(() => T.run(2, ['light'])); await run(5); await shot('vapor_kick');
  await setup('kazuma', 120); await mv('sp2', 20); await shot('bong_pull'); await run(10); await shot('bong_blast');
  await setup('kazuma', 120); await mv('sp2d', 12); await shot('secondhand_wait'); await page.evaluate(() => { BT.p2.startMove('M'); }); await run(14); await shot('secondhand_counter'); await run(8); await shot('secondhand_punish');
  await setup('kazuma', 100); await page.evaluate(() => { BT.p1.meter = 100; BT.p1.startMove('ult'); });
  for (const f of [70, 110, 150, 180, 230, 262, 290, 305, 330, 370]) { await page.evaluate(f => { while (!BT.cine || BT.cine.f < f) { T.frame(); if (BT.cine && BT.cine.f >= f) break; if (!BT.cine && BT.p1.state !== 'attack' && BT.p1.state !== 'cine') break; } }, f); await shot('ult_' + f); }
  await run(200); await setup('kazuma', 200); await page.evaluate(() => { BT.p1.hp = 0; BT.p1.setState('defeat'); }); await run(80); await shot('defeat');
  console.log(errors.length ? errors.join('\n') : 'no errors');
  await browser.close();
})();
