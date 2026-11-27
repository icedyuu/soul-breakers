// Two-browser ONLINE test: local PeerJS signaling server + static server, two Chromium pages
// (host + guest) connect via room code, pick fighters, and play full matches with CPU bots
// driving each side's LOCAL input over the lockstep netcode. Checks: connection, start,
// identical state hashes on both sides every frame, no errors, results + rematch, disconnect.
// Usage: node netplay.js [matches=2]    env: SB_PEER_MODULE=path/to/node_modules/peer, SB_DIST
// SB_NET_TAG=1: the host switches the room to 2 VS 2 TAG, both pick two fighters, the bots press TAG now and then.
// SB_NET_RELAY=1: the guest has no WebRTC (like a school WiFi), so it must connect over the WebSocket relay (local mock).
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
  // SB_CLOUD=1: both players log in to a local mock of the account server (tests/cloudmock.js) and every match must be rated
  const RELAYS = require('./relaymock').start(9206), RELAY = process.env.SB_NET_RELAY ? RELAYS : null;   // the host always listens on the relay too
  const CLOUD = process.env.SB_CLOUD ? require('./cloudmock').start(9205) : null;
  if (CLOUD) await CLOUD.sql("delete from sb_matches; delete from sb_reports; delete from sb_sessions; delete from sb_users");
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const url = 'http://127.0.0.1:9124/?peerhost=127.0.0.1&peerport=9123';
  const errs = [];
  const mk = async name => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ': ' + (e.stack || e)));
    p.on('console', m => { if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errs.push(name + ' console: ' + m.text()); });
    await p.addInitScript(([c, r, nm]) => { localStorage.clear(); if (c) window.SB_CLOUD_OVERRIDE = { url: 'http://127.0.0.1:9205', key: 'test' }; window.SB_RELAY_URL = 'ws://127.0.0.1:9206/realtime/v1/websocket?vsn=1.0.0'; if (r && nm === 'guest') window.SB_NET_NOP2P = 1; }, [!!CLOUD, !!RELAY, name]);
    await p.goto(url); await p.waitForTimeout(400);
    await p.evaluate(() => {
      Settings.voice = false; Settings.muted = true; Settings.mobile = false;
      window.HLOG = [];
      // CPU bot drives the LOCAL fighter through the normal sample() path
      NetBattle.prototype.sample = function () {
        if (!this.bot) { const fake = Object.create(this); fake.inputs = [{}, {}]; this.bot = new CpuBot(fake, 2, this.lp); }
        this.bot.tick(); const v = this.bot.v;
        if (this.team && Math.random() < 0.012) v.btn.press.add('tag');
        const r = netEncode(v.l, v.r, v.u, v.d, a => !!v.btn.held[a], a => v.btn.press.has(a));
        v.btn.press.clear(); return r;
      };
      const st = NetBattle.prototype.netStep;
      window.TAGS = {}; NetBattle.prototype.netStep = function () { const f = this.simF, k = this.p1 && this.p1.ch.id + this.p2.ch.id; st.call(this); if (this.stateHash) { HLOG.push([Net.match, f, this.stateHash()]); } if (scene === this && k !== this.p1.ch.id + this.p2.ch.id) TAGS[Net.match] = (TAGS[Net.match] || 0) + 1; };
    });
    return p;
  };
  const A = await mk('host'), Bp = await mk('guest');
  if (CLOUD) { await A.evaluate(() => Cloud.register('NetHost', 'secret1')); await Bp.evaluate(() => Cloud.register('NetGuest', 'secret1')); }
  // guest draws only every 3rd frame
  await Bp.evaluate(() => { const d = NetBattle.prototype.draw; let n = 0; NetBattle.prototype.draw = function (g) { if (++n % 3 === 0) d.call(this, g); }; });
  // SB_DESYNC=1: corrupt the guest's state once to exercise the soft resync
  if (process.env.SB_DESYNC) await Bp.evaluate(() => { const st = NetBattle.prototype.netStep; NetBattle.prototype.netStep = function () { if (this.simF === 700 && Net.match === 1) { this.p1.x += 60; this.p2.hp -= 50; if (this.team && this.tryTag) { this.team[0].cd = 0; this.p1.setState('idle'); this.tryTag(0); } }   /* tag mode: the guest alone tags P1 out */ st.call(this); }; });
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
  console.log('connected, rtt', await A.evaluate(() => Math.round(Net.rtt)), 'relay host/guest', await A.evaluate(() => Net.viaRelay()), await Bp.evaluate(() => Net.viaRelay()));
  if (!!RELAY !== (await A.evaluate(() => Net.viaRelay()) && await Bp.evaluate(() => Net.viaRelay()))) throw new Error(RELAY ? 'relay mode expected' : 'direct link expected');
  // pick fighters: host clicks a card, guest uses keyboard
  const ids = await A.evaluate(() => CHARS.map(c => c.id));
  // colour variants: host picks NUE colour 3 (LV 7 unlocked), guest cycles once with SP2 (T)
  const HOST = process.env.SB_NET_P1 || 'nue';   // env SB_NET_P1=<id>: the host's fighter (colour 3)
  await A.evaluate(h => { Mastery.rec(h).xp = 2000; (Mastery.data.unl || (Mastery.data.unl = {}))[h + ':3'] = 1; }, HOST); await Bp.evaluate(() => { for (const c of CHARS) Mastery.rec(c.id).xp = 300; });
  const TAG = !!process.env.SB_NET_TAG;
  if (TAG) {   // host switches the room to 2 VS 2 TAG with its TAG key (E)
    await sleep(300); await A.keyboard.press('KeyE'); await sleep(600);
    const modes = [await A.evaluate(() => scene.tag), await Bp.evaluate(() => scene.tag)];
    console.log('tag mode host/guest', JSON.stringify(modes)); if (!modes[0] || !modes[1]) throw new Error('tag mode not synced');
  }
  await A.evaluate(i => { scene.move(0, i); scene.syncVs(); scene.vs[0] = 5; }, Math.max(0, ids.indexOf(HOST)));
  await sleep(300); await A.evaluate(() => scene.confirm(0));
  if (TAG) { await sleep(200); await A.evaluate(i => { scene.move(0, i); scene.confirm(0); }, ids.indexOf('hollow')); }
  await Bp.keyboard.press('KeyD'); await sleep(100); await Bp.keyboard.press('KeyD'); await sleep(100); await Bp.keyboard.press('KeyT'); await sleep(300);
  const seenV = await Bp.evaluate(() => scene.vs.slice());
  await Bp.keyboard.press('KeyF');
  if (TAG) { await sleep(200); await Bp.keyboard.press('KeyS'); await sleep(100); await Bp.keyboard.press('KeyF'); await sleep(400); console.log('teams host view', JSON.stringify(await A.evaluate(() => scene.teamSel)), 'guest view', JSON.stringify(await Bp.evaluate(() => scene.teamSel))); }
  const results = [];
  // a third page SPECTATES (joins with the room code mid-match 1) and plays the live stream
  const S = await mk('spec');
  await S.evaluate(() => { window.SLOG = {}; const st = ReplayBattle.prototype.step; ReplayBattle.prototype.step = function () { st.call(this); SLOG[this.R.m] = { bad: this.bad, k: this.k, wins: this.wins.join('-'), ended: this.ended, live: !!this.o.live }; }; });
  let specJoined = false, specShot = false; fs.mkdirSync(path.resolve(__dirname, '../shots_replay'), { recursive: true });
  for (let m = 1; m <= MATCHES; m++) {
    for (let i = 0; i < 100; i++) { await sleep(200); if (await A.evaluate(() => scene instanceof NetBattle) && await Bp.evaluate(() => scene instanceof NetBattle)) break; }
    if (!await Bp.evaluate(() => scene instanceof NetBattle)) throw new Error('match did not start: ' + await A.evaluate(() => scene.constructor.name) + ' / ' + await Bp.evaluate(() => scene.constructor.name));
    const info = await A.evaluate(() => ({ p1: CHARS[scene.cfg.p1].id, p2: CHARS[scene.cfg.p2].id, stage: scene.cfg.stage, delay: scene.delay }));
    console.log(`match ${m}:`, JSON.stringify(info));
    const vA = await A.evaluate(() => [scene.p1.variant, scene.p2.variant]), vB = await Bp.evaluate(() => [scene.p1.variant, scene.p2.variant]);
    console.log('variants host', JSON.stringify(vA), 'guest', JSON.stringify(vB), 'guest select saw', JSON.stringify(seenV));
    if (JSON.stringify(vA) !== JSON.stringify(vB) || (!TAG && (vA[0] !== 5 || vA[1] !== 1 || seenV[1] !== 5))) throw new Error('colour variants not synced');
    if (TAG) { const tA = await A.evaluate(() => JSON.stringify(scene.cfg.tag)), tB = await Bp.evaluate(() => JSON.stringify(scene.cfg.tag)); console.log('  tag cfg host', tA, 'guest', tB); if (tA !== tB || tA === undefined) throw new Error('tag cfg not synced'); }
    const t0 = Date.now();
    for (;;) {
      await sleep(1000);
      if (!specJoined && Date.now() - t0 > 6000) { specJoined = true; await S.evaluate(c => go(new SpectateScene({ code: c, name: 'Tester' })), code); }
      if (specJoined && !specShot && Date.now() - t0 > 16000 && await S.evaluate(() => scene instanceof ReplayBattle)) { specShot = true; await S.evaluate(() => { scene.uiT = 0; }); await S.screenshot({ path: path.resolve(__dirname, '../shots_replay/spectate_live.png') }); }
      const a = await A.evaluate(() => scene.constructor.name), b = await Bp.evaluate(() => scene.constructor.name);
      if (a === 'NetResultsScene' && b === 'NetResultsScene') break;
      if (Date.now() - t0 > (TAG ? 600000 : 240000)) throw new Error('match timeout ' + a + ' ' + b);
      if (errs.length) { console.log("ERRS", errs.slice(0, 3)); break; }
    }
    const rA = await A.evaluate(() => ({ won: scene.won, wins: scene.bt.wins, desync: Net.desyncs })), rB = await Bp.evaluate(() => ({ won: scene.won, wins: scene.bt.wins, desync: Net.desyncs }));
    // compare per-frame hashes
    const hA = await A.evaluate(m => HLOG.filter(x => x[0] === m), m), hB = await Bp.evaluate(m => HLOG.filter(x => x[0] === m), m);
    const mapB = new Map(hB.map(x => [x[1], x[2]])); let diff = -1, cmp = 0;
    let lastDiff = -1;
    for (const [, f, h] of hA) if (mapB.has(f)) { cmp++; if (mapB.get(f) !== h) { if (diff < 0) diff = f; lastDiff = f; } }
    if (process.env.SB_DESYNC && m === 1) { console.log(`  desync test: frames ${diff}..${lastDiff} differed, then back in sync`); if (lastDiff > 0 && lastDiff < 1000 && rA.desync > 0) diff = -1; }
    console.log(`  host won=${rA.won} wins=${rA.wins} · guest won=${rB.won} wins=${rB.wins} · frames compared ${cmp} · first diff ${diff} · resyncs ${rA.desync}/${rB.desync} · ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    let rated = true;
    if (CLOUD) {
      let ka, kb;
      for (let i = 0; i < 40; i++) { await sleep(250); ka = await A.evaluate(() => scene.rk); kb = await Bp.evaluate(() => scene.rk); if (ka && kb && ka.s === 'rated' && kb.s === 'rated') break; }
      rated = ka.s === 'rated' && kb.s === 'rated' && ka.delta === -kb.delta && (ka.delta > 0) === rA.won;
      console.log(`  ranked: host ${ka.s} ${ka.delta} → ${ka.rating} · guest ${kb.s} ${kb.delta} → ${kb.rating}`, rated ? 'OK' : 'FAIL');
      if (m === 1) await A.screenshot({ path: path.resolve(__dirname, '../shots_account/ranked_results.png') });
    }
    // spectator: same result, no hash mismatches (it may lag a bit behind: wait for it)
    let sp = null;
    for (let i = 0; i < 80; i++) { sp = await S.evaluate(m => SLOG[m] || null, m); if (sp && sp.ended) break; await sleep(500); }
    const specOk = !!sp && sp.ended && sp.bad === 0 && sp.wins === String(rA.wins).replace(',', '-');
    console.log(`  spectator: ${JSON.stringify(sp)} ${specOk ? 'OK' : 'FAIL'}`);
    // both players stored the match as a replay; it must play back without hash mismatches
    const rp = async P => P.evaluate(() => { const R = Replay.load()[0]; if (!R || R.kind !== 'net') return 'no replay'; const rb = new ReplayBattle(R); const sc = scene; let g = 0; while (!rb.ended && rb.k < rb.total && g < 40000) { rb.step(); g++; } scene = sc; BT = sc.bt || BT; return rb.bad + ' bad, ' + rb.wins.join('-'); });
    const rpA = await rp(A), rpB = await rp(Bp);
    const rpOk = rpA === '0 bad, ' + String(rA.wins).replace(',', '-') && rpB === rpA;
    console.log(`  stored replays: host ${rpA} · guest ${rpB} ${rpOk ? 'OK' : 'FAIL'}`);
    const tags = await A.evaluate(m => TAGS[m] || 0, m); if (TAG) console.log(`  tags in match ${m}: ${tags}`);
    results.push({ ok: (!TAG || tags > 0) && specOk && rpOk && rated && diff < 0 && rA.won !== rB.won && cmp > 600 && String(rA.wins) === String(rB.wins) });
    if (m < MATCHES) { await A.evaluate(() => { scene.t = 99; Mouse.x = scene.menu.rect(0).x + 10; Mouse.y = scene.menu.rect(0).y + 10; Mouse.clicked = true; }); await Bp.keyboard.press('Enter'); }
  }
  // host leaves → the spectator gets told
  // disconnect: guest closes its page → host should land in the lobby with a message
  await Bp.close();
  let lostMsg = null;
  for (let i = 0; i < 60 && !lostMsg; i++) { await sleep(250); lostMsg = await A.evaluate(() => scene instanceof NetLobbyScene ? scene.error : null); }
  console.log('host after guest left:', lostMsg);
  let specMsg = null;
  for (let i = 0; i < 60 && !specMsg; i++) { await sleep(250); specMsg = await S.evaluate(() => scene instanceof SpectateScene && (scene.state === 'done' || scene.state === 'error') ? scene.msg : null); }
  console.log('spectator after the room closed:', specMsg);
  if (!specMsg) results.push({ ok: false });
  if (RELAY) { console.log('relay msgs', RELAY.stats.msgs, 'max/s', RELAY.stats.maxPerSec); if (RELAY.stats.maxPerSec > 60) results.push({ ok: false }); }
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 10).join('\n') : 'no errors');
  const pass = results.every(r => r.ok) && lostMsg && !errs.length;
  console.log(pass ? 'NETPLAY PASS' : 'NETPLAY FAIL');
  await browser.close(); srv.close(); RELAYS.close(); if (CLOUD) await CLOUD.shut(); try { ps.close?.(); } catch (e) { }
  process.exit(pass ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
