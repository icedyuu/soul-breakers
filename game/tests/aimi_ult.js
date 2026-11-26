// node aimi_ult.js [out_dir] [px] [skin] : frames of THE SKY BREAKS
const { open } = require('./harness');
const fs = require('fs');
(async () => {
  const out = process.argv[2] || '../../shots_aimi', px = process.argv[3] === 'px', skin = +(process.argv[4] || 0);
  const { browser, page, errors } = await open();
  await page.evaluate(([px, skin]) => { Settings.pixel = px; go(new Battle({ mode: 'versus', stage: 2, p1: T.idx('aimi'), p2: T.idx('kazuma'), v1: skin })); BT.phase = 'fight'; BT.p1.setState('idle'); BT.p2.setState('idle'); BT.timer = 1e9; const A = BT.p1; A.meter = 100; BT.p2.x = A.x + 110; T.run(3); A.startMove('ult'); let n = 0; while (!BT.cine && n++ < 120) T.frame(); }, [px, skin]);
  let at = 0;
  for (const f of [20, 50, 95, 125, 160, 200, 235, 262, 290, 302, 330, 355]) {
    await page.evaluate(n => { T.run(n); T.draw(); }, f - at); at = f;
    fs.writeFileSync(`${out}/ult_${px ? 'px_' : ''}${String(f).padStart(3, '0')}.png`, Buffer.from((await page.evaluate(() => canvas.toDataURL())).split(',')[1], 'base64'));
  }
  console.log(await page.evaluate(() => `cine ${!!BT.cine} p2hp ${Math.round(BT.p2.hp)} p2 ${BT.p2.state} y ${Math.round(BT.p2.y)} A ${BT.p1.state} hidden ${BT.p1.hidden}`));
  await page.evaluate(() => T.run(40));
  console.log(await page.evaluate(() => `after: cine ${!!BT.cine} p2 ${BT.p2.state} facing ${BT.p2.facing} A ${BT.p1.state} x ${Math.round(BT.p1.x)}`));
  console.log(errors.length ? errors.slice(0, 5).join('\n') : 'no errors');
  await browser.close();
})();
