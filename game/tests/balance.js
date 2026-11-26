// Balance sweep: node balance.js [level=1] [reps=1] [shard=0] [shards=1] > out.jsonl
// SB_ONLY=a,b limits to matches involving those fighters.
// Full round robin (every ordered pair, both sides) of bot vs bot at the same level; prints one JSON line per match.
const { open } = require('./harness');
(async () => {
  const lv = +(process.argv[2] ?? 1), reps = +(process.argv[3] ?? 1), shard = +(process.argv[4] ?? 0), shards = +(process.argv[5] ?? 1);
  const { browser, page, errors } = await open();
  const ids = await page.evaluate(() => CHARS.map(c => c.id));
  const ONLY = process.env.SB_ONLY ? process.env.SB_ONLY.split(',') : null; // only matches involving these fighters
  let k = 0;
  for (let rep = 0; rep < reps; rep++) for (let i = 0; i < ids.length; i++) for (let j = 0; j < ids.length; j++) {
    if (i === j) continue; if (ONLY && !ONLY.includes(ids[i]) && !ONLY.includes(ids[j])) continue; if (k++ % shards !== shard) continue;
    const seed = (i * 31 + j * 7 + rep * 13);
    const r = await page.evaluate(([p1, p2, lv, seed]) => {
      Settings.roundTime = 60; Settings.pixel = false;
      go(new Battle({ mode: 'versus', stage: seed % STAGES.length, p1: T.idx(p1), p2: T.idx(p2), cpu: { level: lv } }));
      const bt = BT, bot1 = new CpuBot(bt, lv, 0); let f = 0;
      const orig = bt.cpu.tick.bind(bt.cpu); bt.cpu.tick = () => { bot1.tick(); orig(); };
      while (scene === bt && f < 30000) { Keys.down = new Set(); scene.update(); Keys.pressed.clear(); f++; }
      return { win: bt.wins[0] >= 2 ? 1 : bt.wins[1] >= 2 ? 2 : 0, f, hp: [bt.p1.hp, bt.p2.hp], dmg: [bt.mstats[0].damage | 0, bt.mstats[1].damage | 0] };
    }, [ids[i], ids[j], lv, seed]);
    console.log(JSON.stringify({ p1: ids[i], p2: ids[j], ...r, err: errors.length }));
    errors.length = 0;
  }
  await browser.close();
})();
