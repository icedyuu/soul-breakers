// node ultdraw.js [id ...] : plays every ultimate from many start timings (both modes, both sides) and draws every frame;
// env SB_V=<variant>: both fighters wear that colour slot (5 = arcade skin)
// any exception thrown while drawing (e.g. a negative arc/ellipse radius) is reported. A throw mid-draw used to freeze the game.
const { open } = require('./harness');
(async () => {
  const ids = process.argv.slice(2);
  let { browser, page, errors } = await open();
  const all = ids.length ? ids : await page.evaluate(() => CHARS.map(c => c.id));
  let bad = 0;
  for (const id of all) {
    await browser.close(); ({ browser, page, errors } = await open());   // fresh page per fighter
    const r = await page.evaluate(([id, V]) => {
      const fails = new Set(); let cines = 0;
      VIEW_K = 0.1; canvas.width = 128; canvas.height = 72;   // tiny canvas: the draw code runs fully, rasterising is nearly free
      for (const px of [true, false]) for (const side of [1, 2]) for (let off = 0; off < 6; off++) {
        Settings.pixel = px; const opp = id === 'kazuma' ? 'borgar' : 'kazuma';
        side === 1 ? T.start(id, opp, 'versus', off % 6) : T.start(opp, id, 'versus', off % 6);
        BT.timer = 1e9; const A = side === 1 ? BT.p1 : BT.p2, D = side === 1 ? BT.p2 : BT.p1; A.meter = 100; if (V) BT.p1.variant = BT.p2.variant = V;   // SB_V=5: arcade skins
        D.x = A.x + A.facing * (110 + off * 18); T.run(1 + off * 13); A.setState('idle'); A.startMove('ult');
        let seen = false;
        for (let i = 0; i < 700; i++) {
          T.frame(); if (BT.cine) seen = true;
          try { T.draw(); } catch (e) { fails.add(String(e.message).slice(0, 140)); ctx.reset(); }
          if (seen && !BT.cine && i > 60) break;
        }
        if (seen) cines++;
      }
      return { id, cines, fails: [...fails] };
    }, [id, +(process.env.SB_V || 0)]);
    if (r.fails.length) bad++;
    console.log(r.fails.length ? 'FAIL' : 'ok  ', r.id, 'cinematics', r.cines + '/24', r.fails.join(' | '));
  }
  console.log(bad ? bad + ' fighter(s) threw while drawing' : 'all ultimates draw cleanly', 'errors', errors.slice(0, 3));
  await browser.close(); process.exit(bad ? 1 : 0);
})();
