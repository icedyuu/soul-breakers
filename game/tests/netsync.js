// Determinism sweep for ONLINE play (no network): two separate pages run the same online
// match sim (NetBattle step path: seeded RNG, netEnter) with identical pseudo-random inputs.
// Page B renders every 2nd frame and page A played a local CPU match first, so per-device
// state differs. State hashes must match every frame, for every fighter pairing.
// Usage: node netsync.js [frames=1500] [pairs=all|ring]
const { chromium } = require('playwright');
const path = require('path');
const DIST = process.env.SB_DIST || path.resolve(__dirname, '../dist/index.html');
const FR = +(process.argv[2] || 1500), MODE = process.argv[3] || 'ring';
(async () => {
  const browser = await chromium.launch();
  const errs = [];
  const mk = async (warm, drawEvery) => {
    const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    p.on('pageerror', e => errs.push(String(e.stack || e)));
    await p.addInitScript(() => { window.requestAnimationFrame = () => 0; localStorage.clear(); });
    await p.goto('file://' + DIST); await p.waitForTimeout(300);
    await p.evaluate(([warm, de]) => {
      Settings.voice = false; Settings.muted = true; Settings.mobile = false; Net.role = 'host';
      if (warm) { const b = new Battle({ mode: 'versus', p1: 3, p2: 7, stage: 1, cpu: { level: 1 } }); for (let i = 0; i < 600; i++) { b.update(); if (i % 5 === 0) b.draw(ctx); } }
      window.runPair = (p1, p2, stage, frames, seed) => {
        const cfg = { mode: 'versus', p1, p2, stage, seed, delay: 3, roundTime: 99, online: true };
        const bt = new NetBattle(cfg); scene = bt;
        let s = seed * 7 + 1; const rnd = () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296;
        const hs = []; let hold = [0, 0];
        for (let f = 0; f < frames; f++) {
          for (let k = 0; k < 2; k++) { if (rnd() < 0.25) hold[k] = (rnd() * 1024) | 0; }
          const press = k => rnd() < 0.18 ? (1 << (10 + ((rnd() * 6) | 0))) : 0;
          const v = [hold[0] | press(0), hold[1] | press(1)];
          netDecode(v[0], bt.vin[0]); netDecode(v[1], bt.vin[1]);
          const r = netEnter(cfg); try { if (f % 97 === 0) Keys.pressed.add('Enter'); Battle.prototype.update.call(bt); } finally { r(); }
          if (scene !== bt) break;
          hs.push(bt.stateHash());
          if (de && f % de === 0) bt.draw(ctx);
        }
        return hs;
      };
    }, [warm, drawEvery]);
    return p;
  };
  const A = await mk(true, 0), B = await mk(false, 2);
  const n = await A.evaluate(() => CHARS.length), ids = await A.evaluate(() => CHARS.map(c => c.id));
  const pairs = [];
  if (MODE === 'all') { for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) pairs.push([i, j]); }
  else for (let i = 0; i < n; i++) { pairs.push([i, (i + 1) % n]); pairs.push([i, (i + 5) % n]); }
  let bad = 0;
  for (const [i, j] of pairs) {
    const st = (i + j) % 3, seed = 1000 + i * 31 + j;
    const [ha, hb] = await Promise.all([A.evaluate(a => runPair(...a), [i, j, st, FR, seed]), B.evaluate(a => runPair(...a), [i, j, st, FR, seed])]);
    let d = -1; for (let k = 0; k < Math.min(ha.length, hb.length); k++) if (ha[k] !== hb[k]) { d = k; break; }
    if (d < 0 && ha.length !== hb.length) d = Math.min(ha.length, hb.length);
    if (d >= 0) bad++;
    console.log(`${ids[i]} vs ${ids[j]} (stage ${st}): ${ha.length} frames ${d < 0 ? 'OK' : 'DESYNC at ' + d}`);
  }
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 8).join('\n') : 'no errors');
  console.log(bad || errs.length ? `NETSYNC FAIL (${bad} pairs)` : 'NETSYNC PASS');
  await browser.close(); process.exit(bad || errs.length ? 1 : 0);
})();
