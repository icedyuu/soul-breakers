// node teke_battle.js [out_dir] : Teke Teke battle screenshots (crawl per momentum stage, specials, railway, ult frames)
const { open } = require('./harness');
const fs = require('fs');
(async () => {
  const out = process.argv[2] || '../../shots_teke';
  fs.mkdirSync(out, { recursive: true });
  const { browser, page, errors } = await open();
  const snap = async name => { await page.evaluate(() => T.draw()); fs.writeFileSync(`${out}/${name}.png`, Buffer.from((await page.evaluate(() => canvas.toDataURL())).split(',')[1], 'base64')); };
  const setup = (dist, mom, stage = 0) => page.evaluate(([dist, mom, stage]) => {
    go(new Battle({ mode: 'versus', stage, p1: T.idx('teke'), p2: T.idx('kazuma') })); BT.phase = 'fight'; BT.p1.setState('idle'); BT.p2.setState('idle'); BT.timer = 1e9;
    BT.p2.x = BT.p1.x + dist; BT.p1.mom = mom; T.run(2);
  }, [dist, mom, stage]);
  const act = (js, a) => page.evaluate(js, a);
  for (const [st, mom] of [[1, 0], [2, 30], [3, 60], [4, 95]]) {
    await setup(500, mom, st % 3); await act(() => { BT.p1.input.virtual = { l: false, r: true, u: false, d: false, btn: { held: {}, press: new Set() } }; BT.p1.mom = BT.p1.mom; T.run(18); BT.p1.input.virtual = null; });
    await act(m => { BT.p1.mom = m; }, mom); await snap('crawl_stage' + st);
  }
  for (const [k, n, mom] of [['sp1', 14, 0], ['sp1f', 13, 0], ['counter', 12, 0], ['sp2', 26, 100], ['sp2d', 22, 60], ['H', 14, 0], ['M', 10, 0], ['cH', 13, 0]]) {
    await setup(k === 'sp1' ? 300 : 120, mom); await act(([k, n]) => { BT.p1.startMove(k); T.run(n); }, [k, n]); await snap('move_' + k);
  }
  await setup(400, 0); await act(() => { BT.p1.startMove('sp2f'); T.run(50); }); await snap('rail_warn');
  await act(() => { T.run(34); }); await snap('rail_train');
  await setup(150, 0); await act(() => { BT.p1.meter = 100; BT.p1.startMove('ult'); let n = 0; while (!(BT.cine && BT.cine.f >= 1) && n++ < 300) T.run(1); });
  let f = 1;
  for (const t of [50, 75, 100, 140, 200, 230, 250, 262, 268, 276, 290, 320, 362, 388]) { await act(n => T.run(n), t - f); f = t; await snap('ult_' + t); }
  console.log(errors.length ? errors.join('\n') : 'no errors');
  await browser.close();
})();
