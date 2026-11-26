// Universal throw (M+H): node throw.js — every fighter: throw idle / blocking foe, tech, whiff recovery, jump escape,
// back throw, lenient M→H press, throw clash, CPU throws + techs. Also renders every throw template without errors.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  const r = await page.evaluate(() => {
    const b2 = () => Settings.binds[2], out = [];
    const p2 = (press = [], hold = []) => { for (const a of hold) Keys.down.add(b2()[a]); for (const a of press) { Keys.pressed.add(b2()[a]); Keys.down.add(b2()[a]); } };
    // frame with P1 presses + P2 presses/holds
    const fr = (p1 = [], p2p = [], p2h = []) => { const b1 = Settings.binds[1]; Keys.down = new Set([...T.held].map(a => b1[a] || a)); for (const a of p1) { Keys.pressed.add(b1[a]); Keys.down.add(b1[a]); } p2(p2p, p2h); scene.update(); Keys.pressed.clear(); };
    const setup = (a, b, dist = 70) => { T.start(a, b, 'versus', 0); BT.cpu = null; for (let i = 0; i < 4; i++) fr(); BT.p1.x = 600; BT.p2.x = 600 + dist; BT.p1.facing = 1; BT.p2.facing = -1; fr(); };
    const runOut = (n, p2h = []) => { for (let i = 0; i < n; i++) { fr([], [], p2h); if (i % 7 === 0) T.draw(); } };
    for (const A of CHARS) {
      const B = CHARS[(CHARS.indexOf(A) + 5) % CHARS.length].id, res = { A: A.id };
      // 1 idle throw
      setup(A.id, B); let hp = BT.p2.hp; fr(['medium', 'heavy']); let sawCine = false; for (let i = 0; i < 80; i++) { fr(); if (BT.cine && BT.cine.thr) sawCine = true; if (i % 5 === 0) T.draw(); }
      res.idle = sawCine && BT.p2.hp < hp ? Math.round(hp - BT.p2.hp) : 0;
      // 2 blocking foe (holding block)
      setup(A.id, B); hp = BT.p2.hp; for (let i = 0; i < 6; i++) fr([], [], ['block', 'right']); fr(['medium', 'heavy'], [], ['block', 'right']); runOut(80, ['block', 'right']);
      res.block = BT.p2.hp < hp;
      // 3 tech
      setup(A.id, B); hp = BT.p2.hp; fr(['medium', 'heavy']); let teched = false;
      for (let i = 0; i < 80; i++) { const t = BT.cine && BT.cine.thr && BT.cine.f === 5; fr([], t ? ['medium', 'heavy'] : []); if (t) teched = true; }
      res.tech = teched && BT.p2.hp === hp && !BT.cine && ['idle', 'land', 'walk', 'crouch'].includes(BT.p2.state);
      // 4 whiff far → long recovery, no damage
      setup(A.id, B, 220); hp = BT.p2.hp; fr(['medium', 'heavy']); let atk = 0; for (let i = 0; i < 60; i++) { fr(); if (BT.p1.state === 'attack' && BT.p1.moveKey === 'THROW') atk++; }
      res.whiff = BT.p2.hp === hp && atk >= 30;
      // 5 jump escape
      setup(A.id, B); hp = BT.p2.hp; fr([], ['up'], ['up']); fr([], [], ['up']); fr([], [], ['up']); fr([], [], ['up']); fr(['medium', 'heavy']); runOut(70);
      res.jump = BT.p2.hp === hp;
      // 5b contact range: walk into each other until pushing, then throw
      setup(A.id, B, 200); for (let i = 0; i < 50; i++) { T.held = new Set(['right']); fr([], [], ['left']); } T.held = new Set(); res.cdist = Math.round(BT.p2.x - BT.p1.x); hp = BT.p2.hp; fr(['medium', 'heavy']); runOut(70);
      res.contact = BT.p2.hp < hp;
      // 6 back throw
      setup(A.id, B); T.held = new Set(['left']); fr(['medium', 'heavy']); T.held = new Set(); for (let i = 0; i < 40; i++) fr();
      res.back = BT.p2.x < BT.p1.x;
      T.held = new Set();
      // 7 lenient M then H two frames later
      setup(A.id, B); hp = BT.p2.hp; fr(['medium']); fr(); fr(['heavy']); sawCine = false; for (let i = 0; i < 80; i++) { fr(); if (BT.cine && BT.cine.thr) sawCine = true; }
      res.lenient = sawCine;
      // 8 clash: both throw same frame
      setup(A.id, B); hp = BT.p2.hp; const hp1 = BT.p1.hp; fr(['medium', 'heavy'], ['medium', 'heavy']); runOut(60);
      res.clash = BT.p2.hp === hp && BT.p1.hp === hp1;
      out.push(res);
    }
    // CPU: hard bot vs hard bot for a while → throws happen, techs happen, no stuck states
    let thr = 0, techs = 0;
    for (let k = 0; k < 6; k++) {
      T.start(CHARS[k * 3].id, CHARS[k * 3 + 1].id, 'versus', k % 6); BT.cpu = new CpuBot(BT, 2, 1); const c0 = new CpuBot(BT, 2, 0);
      for (let i = 0; i < 3600 && BT.phase !== 'matchEnd'; i++) { c0.tick(); scene.update(); if (BT.cine && BT.cine.thr && BT.cine.f === 1) thr++; }
      techs += (BT.p1.stats.techs || 0) + (BT.p2.stats.techs || 0);
    }
    return { out, thr, techs };
  });
  let bad = 0;
  for (const o of r.out) { const ok = o.idle > 0 && o.block && o.tech && o.whiff && o.jump && o.contact && o.back && o.lenient && o.clash; if (!ok) bad++; console.log((ok ? 'ok  ' : 'FAIL') + ' ' + JSON.stringify(o)); }
  console.log('cpu throws', r.thr, 'techs', r.techs);
  console.log(bad || !r.thr ? 'THROW FAIL ' + bad : 'THROW PASS');
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})();
