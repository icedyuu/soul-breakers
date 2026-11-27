// Replay test: node replay.js [matches] — bot-vs-bot matches (CPU, 1P vs 2P, mobile pad off), each is
// recorded, stored, then played back from storage; every 60-frame state hash must match, and the
// final result (wins, hp) must be identical. Also checks storage limits, favourites and the menu.
const { open } = require('./harness');
(async () => {
  const N = +(process.argv[2] || 21);
  const { browser, page, errors } = await open();
  const ids = await page.evaluate(() => CHARS.map(c => c.id));
  let bad = 0;
  const NT = +(process.env.SB_TAG ?? 4);   // + 2v2 TAG matches (P1 bot presses TAG now and then)
  for (let i = 0; i < N + NT; i++) {
    const p1 = ids[i % ids.length], p2 = ids[(i * 5 + 3) % ids.length], tag = i >= N ? [ids[(i * 3 + 7) % ids.length], ids[(i * 11 + 2) % ids.length]] : null;
    const r = await page.evaluate(([p1, p2, i, tag]) => {
      Settings.roundTime = i % 3 === 0 ? 30 : 60; Settings.pixel = i % 2 === 0; Settings.fx = i % 4 === 1 ? 'LOW' : 'HIGH';
      const cfg = { mode: 'versus', stage: i % STAGES.length, p1: T.idx(p1), p2: T.idx(p2) };
      if (i % 2 === 0) cfg.cpu = { level: i % 3, arcade: !tag && i % 4 === 2 };
      if (tag) cfg.tag = { t: [[cfg.p1, T.idx(tag[0])], [cfg.p2, T.idx(tag[1])]], v: [[0, 0], [0, 0]] };
      go(new Battle(cfg));
      const bt = BT, bot1 = new CpuBot(bt, 2, 0), bot2 = cfg.cpu ? null : new CpuBot(bt, 1, 1);
      // test bots only make inputs: keep them off the seeded sim RNG (like the real CpuBot / touch pad)
      const tagP = () => { if (tag && NetRng.orig() < 0.01) { bot1.v.btn.press.add('tag'); bot1.v.btn.held.tag = true; } else bot1.v.btn.held.tag = false; };
      if (bt.cpu) { const o = bt.cpu.tick.bind(bt.cpu); bt.cpu.tick = () => { bot1.tick(); tagP(); o(); }; }
      else bt.stepSim = function () { bot1.tick(); tagP(); bot2.tick(); return Battle.prototype.stepSim.call(this); };
      let f = 0;
      while (scene === bt && f < 30000) { Keys.down = new Set(); if (f % 97 === 5) Keys.pressed.add('Enter'); scene.update(); Keys.pressed.clear(); f++; if (f % 700 === 0) T.draw(); }
      const R = Replay.load()[0];
      if (!R || R !== bt.savedReplay) return { err: 'not stored' };
      const res = { wins: bt.wins.join('-'), hp: [bt.p1.hp, bt.p2.hp].map(Math.round).join('/'), n: R.n, size: JSON.stringify(R).length };
      // play it back from storage (fresh parse)
      Replay.list = null; const R2 = Replay.load()[0];
      Settings.fx = 'HIGH'; Settings.roundTime = 99;   // playback must not depend on current settings
      const rb = new ReplayBattle(R2); go(rb); rb.spd = 4;
      let g = 0; while (!rb.ended && rb.k < rb.total && g < 40000) { scene.update(); g++; if (g % 500 === 0) T.draw(); }
      res.bad = rb.bad; res.k = rb.k; res.ended = rb.ended; res.rwins = rb.wins.join('-'); res.rhp = [rb.p1.hp, rb.p2.hp].map(Math.round).join('/');
      res.tags = tag ? ' · P1 tag presses ' + R2.A.filter(v => v & (1 << 18)).length : '';
      return res;
    }, [p1, p2, i, tag]);
    const ok = !r.err && r.ended && r.bad === 0 && r.wins === r.rwins && r.hp === r.rhp && !errors.length;
    if (!ok) bad++;
    console.log(`${ok ? 'ok ' : 'BAD'} ${p1}${tag ? '+' + tag[0] : ''} vs ${p2}${tag ? '+' + tag[1] : ''}: ${r.err || `${r.wins} hp ${r.hp} | replay ${r.rwins} hp ${r.rhp} · ${r.n} frames · ${(r.size / 1024).toFixed(1)} KB · hash fails ${r.bad}${r.tags || ''}`}`);
    if (errors.length) { console.log('ERR', errors.slice(0, 3)); errors.length = 0; }
  }
  // storage: max RP_MAX non-favourites, favourites kept
  const st = await page.evaluate(() => {
    const l = Replay.load(); Replay.fav(l[0]); const favId = l[0].id;
    for (let i = 0; i < 15; i++) Replay.add({ ...l[1], id: 'x' + i, fav: false });
    Replay.list = null; const l2 = Replay.load();
    return { n: l2.length, nonfav: l2.filter(r => !r.fav).length, fav: l2.some(r => r.id === favId && r.fav) };
  });
  const sok = st.nonfav === 12 && st.fav; if (!sok) bad++;
  console.log(`${sok ? 'ok ' : 'BAD'} storage: ${st.n} stored, ${st.nonfav} recent, favourite kept: ${st.fav}`);
  await browser.close();
  console.log(bad ? `${bad} FAILED` : 'ALL OK');
  process.exit(bad ? 1 : 0);
})();
