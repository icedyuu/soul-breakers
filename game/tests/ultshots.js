// node ultshots.js id f1,f2,... [vector]  : screenshots of the ult cinematic at given cine frames (pixel mode unless 'vector')
const { open } = require('./harness');
const fs = require('fs');
(async () => {
  const id = process.argv[2], frames = (process.argv[3] || '20,45,60,100,130,160,185,200').split(',').map(Number), vec = process.argv.includes('vector');
  const { browser, page, errors } = await open();
  await page.evaluate(([id, vec]) => { if (vec) Settings.pixel = false; T.start(id, 'kazuma', 'versus', 2); BT.timer = 1e9; const A = BT.p1; A.meter = 100; BT.p2.x = A.x + 120; T.run(3); A.startMove('ult'); for (let i = 0; i < 200 && !BT.cine; i++) T.frame(); }, [id, vec]);
  let at = 0;
  for (const f of frames) {
    await page.evaluate(n => { T.run(n); T.draw(); }, f - at); at = f;
    fs.writeFileSync(`out_${id}_cine_${f}.png`, Buffer.from((await page.evaluate(() => canvas.toDataURL())).split(',')[1], 'base64'));
  }
  const ok = await page.evaluate(() => ({ cine: !!BT.cine, hp: Math.round(BT.p2.hp), max: BT.p2.maxHp }));
  console.log(ok, 'errors', errors.slice(0, 5));
  await browser.close();
})();
