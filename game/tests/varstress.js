// node varstress.js -> every fighter with every colour variant plays random inputs and is drawn (pixel mode); reports errors + draw cost
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  const r = await page.evaluate(() => {
    const out = {}; let tv = 0, t0 = 0, n = 0;
    const keys = ['light', 'medium', 'heavy', 'sp1', 'sp2', 'left', 'right', 'up', 'down'];
    for (let i = 0; i < CHARS.length; i++) for (let v = 0; v < VAR_N; v++) {
      go(new Battle({ mode: 'versus', p1: i, p2: (i + 5) % CHARS.length, stage: v % 3, v1: v, v2: (v + 2) % VAR_N })); BT.phase = 'fight'; BT.pf = 0;
      for (let f = 0; f < 240; f++) {
        const p = f % 7 === 0 ? [keys[(f * 13 + i) % keys.length]] : []; if (f % 40 === 0) { BT.p1.meter = 100; p.push('sp1', 'sp2'); }
        T.frame(p);
        if (f % 4 === 0) { const a = performance.now(); T.draw(); const d = performance.now() - a; if (v) tv += d; else t0 += d; n++; }
      }
    }
    return { msVariant: (tv / (n * 0.8)).toFixed(2), msDefault: (t0 / (n * 0.2)).toFixed(2) };
  });
  console.log(JSON.stringify(r), '\nerrors', errors.slice(0, 5));
  await browser.close();
})();
