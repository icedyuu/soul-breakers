// Two-browser ONLINE test: local PeerJS signaling server + static server, two Chromium pages
// (host + guest) connect via room code, pick fighters, and play full matches with CPU bots
// driving each side's LOCAL input over the lockstep netcode. Checks: connection, start,
// identical state hashes on both sides every frame, no errors, results + rematch, disconnect.
// Usage: node netplay.js [matches=2]    env: SB_PEER_MODULE=path/to/node_modules/peer, SB_DIST
// The guest page renders only every 3rd frame (other draw timing must not desync).
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = process.env.SB_DIST || path.resolve(__dirname, '../dist/index.html');
const PEER_MOD = process.env.SB_PEER_MODULE || path.resolve(__dirname, '../../../deps/node_modules/peer');
const MATCHES = +(process.argv[2] || 2);
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const { PeerServer } = require(PEER_MOD);
  const ps = PeerServer({ port: 9123, host: '127.0.0.1', path: '/' });
  const srv = http.createServer((q, r) => { const f = q.url.split('?')[0]; if (f === '/' || f === '/index.html') { r.setHeader('content-type', 'text/html'); r.end(fs.readFileSync(DIST)); } else { r.statusCode = 404; r.end(); } }).listen(9124);
  await sleep(500);
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const url = 'http://127.0.0.1:9124/?peerhost=127.0.0.1&peerport=9123';
  const errs = [];
  const mk = async name => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ': ' + (e.stack || e)));
    p.on('console', m => { if (m.type() === 'error') errs.push(name + ' console: ' + m.text()); });
    await p.addInitScript(() => { localStorage.clear(); });
    await p.goto(url); await p.waitForTimeout(400);
    await p.evaluate(() => {
      Settings.voice = false; Settings.muted = true; Settings.mobile = false;
      window.HLOG = [];
      // CPU bot drives the LOCAL fighter through the normal sample() path
      NetBattle.prototype.sample = function () {
        if (!this.bot) { const fake = Object.create(this); fake.inputs = [{}, {}]; this.bot = new CpuBot(fake, 2, this.lp); }
        this.bot.tick(); const v = this.bot.v;
        const r = netEncode(v.l, v.r, v.u, v.d, a => !!v.btn.held[a], a => v.btn.press.has(a));
        v.btn.press.clear(); return r;
      };
      const st = NetBattle.prototype.netStep;
      NetBattle.prototype.netStep = function () { const f = this.simF; st.call(this); if (this.stateHash) { HLOG.push([Net.match, f, this.stateHash()]); } };
    });
    return p;
  };
  const A = await mk('host'), Bp = await mk('guest');
  // guest draws only every 3rd frame
  await Bp.evaluate(() => { const d = NetBattle.prototype.draw; let n = 0; NetBattle.prototype.draw = function (g) { if (++n % 3 === 0) d.call(this, g); }; });
  // SB_DESYNC=1: corrupt the guest's state once to exercise the soft resync
  if (process.env.SB_DESYNC) await Bp.evaluate(() => { const st = NetBattle.prototype.netStep; NetBattle.prototype.netStep = function () { if (this.simF === 700 && Net.match === 1) { this.p1.x += 60; this.p2.hp -= 50; } st.call(this); }; });
  if (process.env.SB_STAGE) await A.evaluate(st => { const o = netStartMatch; window.netStartMatch = (cfg, m) => { if (cfg.stage !== st) { cfg.stage = st; } o(cfg, m); }; }, +process.env.SB_STAGE);
  // the host plays a local CPU match first so its global state differs from the guest's
  await A.evaluate(() => { const b = new Battle({ mode: 'versus', p1: 3, p2: 7, stage: 1, cpu: { level: 1 } }); for (let i = 0; i < 900; i++) b.update(); go(new TitleScene()); });

  await A.evaluate(() => { go(new NetLobbyScene()); Net.host(); scene.mode = 'hosting'; });
  let code = null;
  for (let i = 0; i < 50 && !code; i++) { await sleep(200); code = await A.evaluate(() => Net.status === 'waiting' ? Net.code : null); }
  if (!code) throw new Error('host never got a room code: ' + await A.evaluate(() => Net.status + ' ' + Net.err));
  console.log('room code', code);
  // join through the on-screen keypad (keyboard digits)
  await Bp.evaluate(() => { go(new NetLobbyScene()); scene.mode = 'join'; });
  for (const d of code) { await Bp.keyboard.press('Digit' + d); await sleep(60); }
  for (let i = 0; i < 50; i++) { await sleep(200); if (await A.evaluate(() => scene instanceof NetSelectScene) && await Bp.evaluate(() => scene instanceof NetSelectScene)) break; }
  if (!await Bp.evaluate(() => scene instanceof NetSelectScene)) throw new Error('not in select: ' + await Bp.evaluate(() => Net.status + ' ' + Net.err + ' ' + scene.constructor.name));
  console.log('connected, rtt', await A.evaluate(() => Math.round(Net.rtt)));
  // pick fighters: host clicks a card, guest uses keyboard
  const ids = await A.evaluate(() => CHARS.map(c => c.id));
  // colour variants: host picks NUE colour 3 (LV 7 unlocked), guest cycles once with SP2 (T)
  await A.evaluate(() => { Mastery.rec('nue').xp = 2000; }); await Bp.evaluate(() => { for (const c of CHARS) Mastery.rec(c.id).xp = 300; });
  await A.evaluate(i => { scene.move(0, i); scene.syncVs(); scene.vs[0] = 3; }, Math.max(0, ids.indexOf('nue')));
  await sleep(300); await A.evaluate(() => scene.confirm(0));
  await Bp.keyboard.press('KeyD'); await sleep(100); await Bp.keyboard.press('KeyD'); await sleep(100); await Bp.keyboard.press('KeyT'); await sleep(300);
  const seenV = await Bp.evaluate(() => scene.vs.slice());
  await Bp.keyboard.press('KeyF');
  const results = [];
  for (let m = 1; m <= MATCHES; m++) {
    for (let i = 0; i < 100; i++) { await sleep(200); if (await A.evaluate(() => scene instanceof NetBattle) && await Bp.evaluate(() => scene instanceof NetBattle)) break; }
    if (!await Bp.evaluate(() => scene instanceof NetBattle)) throw new Error('match did not start: ' + await A.evaluate(() => scene.constructor.name) + ' / ' + await Bp.evaluate(() => scene.constructor.name));
    const info = await A.evaluate(() => ({ p1: CHARS[scene.cfg.p1].id, p2: CHARS[scene.cfg.p2].id, stage: scene.cfg.stage, delay: scene.delay }));
    console.log(`match ${m}:`, JSON.stringify(info));
    const vA = await A.evaluate(() => [scene.p1.variant, scene.p2.variant]), vB = await Bp.evaluate(() => [scene.p1.variant, scene.p2.variant]);
    console.log('variants host', JSON.stringify(vA), 'guest', JSON.stringify(vB), 'guest select saw', JSON.stringify(seenV));
    if (JSON.stringify(vA) !== JSON.stringify(vB) || vA[0] !== 3 || vA[1] !== 1 || seenV[1] !== 3) throw new Error('colour variants not synced');
    const t0 = Date.now();
    for (;;) {
      await sleep(1000);
      const a = await A.evaluate(() => scene.constructor.name), b = await Bp.evaluate(() => scene.constructor.name);
      if (a === 'NetResultsScene' && b === 'NetResultsScene') break;
      if (Date.now() - t0 > 240000) throw new Error('match timeout ' + a + ' ' + b);
      if (errs.length) break;
    }
    const rA = await A.evaluate(() => ({ won: scene.won, wins: scene.bt.wins, desync: Net.desyncs })), rB = await Bp.evaluate(() => ({ won: scene.won, wins: scene.bt.wins, desync: Net.desyncs }));
    // compare per-frame hashes
    const hA = await A.evaluate(m => HLOG.filter(x => x[0] === m), m), hB = await Bp.evaluate(m => HLOG.filter(x => x[0] === m), m);
    const mapB = new Map(hB.map(x => [x[1], x[2]])); let diff = -1, cmp = 0;
    let lastDiff = -1;
    for (const [, f, h] of hA) if (mapB.has(f)) { cmp++; if (mapB.get(f) !== h) { if (diff < 0) diff = f; lastDiff = f; } }
    if (process.env.SB_DESYNC && m === 1) { console.log(`  desync test: frames ${diff}..${lastDiff} differed, then back in sync`); if (lastDiff > 0 && lastDiff < 1000 && rA.desync > 0) diff = -1; }
    console.log(`  host won=${rA.won} wins=${rA.wins} · guest won=${rB.won} wins=${rB.wins} · frames compared ${cmp} · first diff ${diff} · resyncs ${rA.desync}/${rB.desync} · ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    results.push({ ok: diff < 0 && rA.won !== rB.won && cmp > 600 && String(rA.wins) === String(rB.wins) });
    if (m < MATCHES) { await A.evaluate(() => { scene.t = 99; Mouse.x = scene.menu.rect(0).x + 10; Mouse.y = scene.menu.rect(0).y + 10; Mouse.clicked = true; }); await Bp.keyboard.press('Enter'); }
  }
  // disconnect: guest closes its page → host should land in the lobby with a message
  await Bp.close();
  let lostMsg = null;
  for (let i = 0; i < 60 && !lostMsg; i++) { await sleep(250); lostMsg = await A.evaluate(() => scene instanceof NetLobbyScene ? scene.error : null); }
  console.log('host after guest left:', lostMsg);
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 10).join('\n') : 'no errors');
  const pass = results.every(r => r.ok) && lostMsg && !errs.length;
  console.log(pass ? 'NETPLAY PASS' : 'NETPLAY FAIL');
  await browser.close(); srv.close(); try { ps.close?.(); } catch (e) { }
  process.exit(pass ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
