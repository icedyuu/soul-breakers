// node specials.js id [shots]  : every special at 2 ranges vs standing / guarding dummy, plus ult cine screenshots
const { open } = require('./harness');
const fs = require('fs');
(async () => {
  const id = process.argv[2], shots = process.argv.includes('shots');
  const { browser, page, errors } = await open();
  const res = await page.evaluate(id => {
    const out = [];
    const keys = ['sp1', 'sp1f', 'counter', 'sp2', 'sp2f', 'sp2d', 'ult', 'H', 'FF', 'LH'];
    for (const k of keys.filter(k => CHARS.find(c => c.id === id).moves[k])) for (const dist of [100, 260]) for (const guard of [0, 2]) {
      T.start(id, 'kazuma', 'versus'); const A = BT.p1, D = BT.p2; BT.timer = 1e9; A.meter = 100; if (A.ch.applyTrial) A.ch.applyTrial(A, { meter: 1, fury: 100, heat: 100, authority: 100 });
      D.x = A.x + dist; T.run(3);
      const hp0 = D.hp; let cine = false, hit = false, blk = false, maxF = 0;
      A.startMove(k);
      for (let i = 0; i < 360; i++) { D.autoBlock = !!guard; T.frame(); if (BT.cine) cine = true; if (D.state === 'hit' || D.state === 'grabbed') hit = true; if (D.state === 'block') blk = true; if (A.state === 'attack' && A.moveKey === k) maxF = A.mf; if (i > 30 && A.actionable() && !BT.cine && D.actionable()) break; }
      out.push(`${k.padEnd(7)} d${dist} ${guard ? 'GUARD' : 'stand'}: ${hit ? 'HIT' : blk ? 'BLOCK' : 'whiff'}${cine ? '+CINE' : ''} dmg ${Math.round(hp0 - D.hp)} frames ${maxF} Astate ${A.state}`);
    }
    return out.join('\n');
  }, id);
  console.log(res);
  if (shots) {
    await page.evaluate(id => { T.start(id, 'kazuma'); const A = BT.p1; A.meter = 100; BT.p2.x = A.x + 100; T.run(3); A.startMove('ult'); }, id);
    for (const f of [30, 70, 110, 150, 190]) {
      await page.evaluate(n => { T.run(n); T.draw(); }, f === 30 ? 30 : 40);
      fs.writeFileSync(`out_${id}_ult_${f}.png`, Buffer.from((await page.evaluate(() => canvas.toDataURL())).split(',')[1], 'base64'));
    }
  }
  console.log('errors', errors.slice(0, 5));
  await browser.close();
})();
