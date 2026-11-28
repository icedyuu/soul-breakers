// Haunted Four roll: node hf_roll.js — form is rolled per match & per player (~25 % each), kept for later rounds,
// reused on tag-in, rerolled on a fresh match, and the same under the same NetRng seed (online determinism).
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  const r = await page.evaluate(() => {
    const out = { cnt: {}, same: 0, n: 0, keep: true, tagKeep: true, det: true, hud: [] };
    for (let i = 0; i < 800; i++) {
      T.start('haunted', 'haunted', 'versus'); const a = BT.p1.ch.formId, b = BT.p2.ch.formId;
      out.cnt[a] = (out.cnt[a] || 0) + 1; out.cnt[b] = (out.cnt[b] || 0) + 1; out.n += 2; if (a === b) out.same++;
      if (i < 20) { BT.newRound(false); if (BT.p1.ch.formId !== a || BT.p2.ch.formId !== b) out.keep = false; }
    }
    // tag: haunted tags out and back in -> same form
    for (let i = 0; i < 20; i++) {
      go(new Battle({ mode: 'versus', stage: 0, p1: T.idx('haunted'), p2: T.idx('goro'), tag: { t: [[T.idx('haunted'), T.idx('kazuma')], [T.idx('goro'), T.idx('nue')]], v: [[0, 0], [0, 0]] } }));
      BT.phase = 'fight'; BT.pf = 0; BT.p1.setState('idle'); BT.p2.setState('idle'); BT.team[0].cd = 0;
      const f0 = BT.p1.ch.formId; T.run(3); T.frame(['tag']); T.run(400); BT.team[0].cd = 0; BT.p1.setState('idle'); T.frame(['tag']); T.run(60);
      if (BT.p1.ch.id === 'haunted' && BT.p1.ch.formId !== f0) out.tagKeep = false;
    }
    // determinism: the same seed gives the same forms
    const mr = Math.random, ro = Replay.on; Math.random = netRandom; Replay.on = false; const seen = new Set();   // (local replays reseed on their own)
    try { for (let s = 1; s < 40; s++) {
      NetRng.seed(s); T.start('haunted', 'haunted', 'versus'); const x = BT.p1.ch.formId + BT.p2.ch.formId; seen.add(x);
      NetRng.seed(s); T.start('haunted', 'haunted', 'versus'); if (x !== BT.p1.ch.formId + BT.p2.ch.formId) out.det = false;
    } } finally { Math.random = mr; Replay.on = ro; }
    out.seededCombos = seen.size;
    return out;
  });
  console.log(JSON.stringify(r));
  const pct = Object.values(r.cnt).map(c => c / r.n), ok = Object.keys(r.cnt).length === 4 && pct.every(p => p > 0.2 && p < 0.3) && r.same / 800 > 0.18 && r.same / 800 < 0.32 && r.keep && r.tagKeep && r.det === true && !errors.length;
  console.log(ok ? 'ROLL OK' : 'ROLL BAD', errors.slice(0, 3));
  await browser.close(); process.exit(ok ? 0 : 1);
})();
