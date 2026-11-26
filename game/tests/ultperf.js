// node ultperf.js [id ...] : times update+draw of every ult cinematic frame; reports slowest frames, FX counts, leaks
const { open } = require('./harness');
(async () => {
  const ids = process.argv.slice(2).filter(a => !a.startsWith('-'));
  const { browser, page, errors } = await open();
  const VAR = +((process.argv.find(a => a.startsWith('-v=')) || '-v=0').slice(3));
  const all = ids.length ? ids : await page.evaluate(() => CHARS.map(c => c.id));
  for (const id of all) for (const side of (process.argv.includes('-p1') ? [1] : [1, 2])) for (const px of (process.argv.includes('-px') ? [true] : process.argv.includes('-vec') ? [false] : [true, false])) {
    const r = await page.evaluate(([id, side, px, process_v]) => {
      Settings.pixel = px; const opp = id === 'kazuma' ? 'borgar' : 'kazuma';
      side === 1 ? T.start(id, opp, 'versus', 2) : T.start(opp, id, 'versus', 2);
      BT.timer = 1e9; const VV = +(process_v || 0); BT.p1.variant = BT.p2.variant = VV; const A = side === 1 ? BT.p1 : BT.p2, D = A.opp || (side === 1 ? BT.p2 : BT.p1); A.meter = 100;
      D.x = A.x + A.facing * 120; T.run(3); A.startMove('ult');
      for (let i = 0; i < 200 && !BT.cine; i++) { T.frame(); T.draw(); }
      if (!BT.cine) return { id, side, px, nocine: 1 };
      const times = []; let maxP = 0, maxAll = 0, n = 0;
      const cnt = () => { let s = 0; for (const k in FX) if (Array.isArray(FX[k])) s += FX[k].length; return s; };
      while (BT.cine && n < 2000) { const t0 = performance.now(); scene.update(); T.draw(); ctx.getImageData(0, 0, 1, 1); times.push(performance.now() - t0); maxAll = Math.max(maxAll, cnt()); n++; }
      for (let i = 0; i < 120; i++) { scene.update(); T.draw(); }
      times.sort((a, b) => b - a);
      return { id, side, px, v: process_v, K: VIEW_K, n, avg: +(times.reduce((a, b) => a + b, 0) / times.length).toFixed(2), p99: +times[Math.floor(times.length * 0.01)].toFixed(1), max: +times[0].toFixed(1), fx: maxAll, fxAfter: cnt() };
    }, [id, side, px, VAR]);
    console.log(JSON.stringify(r));
  }
  console.log('errors', errors.slice(0, 5)); await browser.close();
})();
