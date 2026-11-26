// stage test: every stage in vector + pixel mode, a short CPU fight on each, the stage select; screenshots to ../shots_stages/
const { open } = require('./harness');
const fs = require('fs'); const out = require('path').resolve(__dirname, '../shots_stages'); fs.mkdirSync(out, { recursive: true });
(async () => {
  const { browser, page, errors } = await open();
  const shot = async n => { await page.evaluate(() => T.draw()); await page.screenshot({ path: `${out}/${n}.png` }); };
  const n = await page.evaluate(() => STAGES.length); console.log('stages', n, await page.evaluate(() => STAGES.map(s => s.id).join(',')));
  for (let i = 0; i < n; i++) for (const px of [true, false]) {
    const ms = await page.evaluate(([i, px]) => {
      Settings.pixel = px; go(new Battle({ mode: 'versus', stage: i, p1: i % CHARS.length, p2: (i + 7) % CHARS.length, cpu: { level: 1 } }));
      BT.phase = 'fight'; BT.pf = 0; T.run(240);
      const t0 = performance.now(); for (let k = 0; k < 60; k++) T.draw(); return ((performance.now() - t0) / 60).toFixed(2);
    }, [i, px]);
    const id = await page.evaluate(i => STAGES[i].id, i);
    console.log(id, px ? 'pixel' : 'vector', 'draw ms/frame', ms);
    await shot(`${id}_${px ? 'px' : 'vec'}`);
  }
  for (const px of [true, false]) { await page.evaluate(px => { Settings.pixel = px; go(new StageSelectScene({ mode: 'versus', p1: 0, p2: 1 })); scene.sel = 4; for (let i = 0; i < 5; i++) scene.update(); }, px); await shot(`select_${px ? 'px' : 'vec'}`); }
  // keyboard nav: down from 1 → 4, up again → 1, right wraps through all
  const nav = await page.evaluate(() => { const s = new StageSelectScene({ mode: 'versus', p1: 0, p2: 1 }); go(s); s.sel = 1; const k = c => { Keys.pressed.add(c); s.update(); Keys.pressed.clear(); }; const r = []; k('ArrowDown'); r.push(s.sel); k('ArrowDown'); r.push(s.sel); for (let i = 0; i < 6; i++) k('ArrowRight'); r.push(s.sel); return r; });
  console.log('nav', JSON.stringify(nav));
  console.log('errors', errors.slice(0, 5)); await browser.close();
})();
