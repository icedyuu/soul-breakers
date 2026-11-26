// story mode (09h_story.js): rival is the last arcade opponent, prologue + rival scene, skip, ending after ARCADE CLEAR, draw for every fighter
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open(); let bad = 0;
  const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
  const shot = async n => { const d = await page.evaluate(() => { T.draw(); return canvas.toDataURL(); }); require('fs').writeFileSync(`/tmp/story_${n}.png`, Buffer.from(d.split(',')[1], 'base64')); };
  const r = await page.evaluate(() => {
    const o = { riv: [], drawErr: [] }, key = k => { Keys.pressed.add(k); scene.update(); Keys.pressed.clear(); };
    for (let p = 0; p < CHARS.length; p++) {
      const c = arcadeCfg(p, 1), st = STORY[CHARS[p].id], last = c.arcade.order[c.arcade.order.length - 1];
      if (!st || CHARS[last].id !== st.riv || c.arcade.order.length !== ARCADE_LEN || c.arcade.order.includes(p) || new Set(c.arcade.order).size !== ARCADE_LEN || c.p2 !== c.arcade.order[0]) o.riv.push(CHARS[p].id);
      for (const [L, end] of [[st.pre, 0], [st.vs, 0], [st.end, 1]]) {
        const cf = { ...c, p2: end ? c.p2 : last };
        try { const s = new StoryScene(cf, L, 'X', () => {}, !!end); for (let i = 0; i < L.length; i++) { s.i = i; s.c = 999; s.t = 50; s.draw(ctx); } } catch (e) { o.drawErr.push(CHARS[p].id + ': ' + e.message); }
      }
    }
    const cfg = arcadeCfg(T.idx('hollow'), 1);
    go(arcadeVS(cfg)); o.pro = scene instanceof StoryScene && scene.head === 'PROLOGUE';
    T.run(15); for (let i = 0; i < 20 && scene instanceof StoryScene; i++) { key('Enter'); key('Enter'); T.frame(); }
    o.toVS = scene instanceof VSScene;
    const c2 = { ...cfg, arcade: { ...cfg.arcade, i: 2 } }; o.mid = arcadeVS(c2) instanceof VSScene;
    const c3 = { ...cfg, p2: cfg.arcade.order[5], arcade: { ...cfg.arcade, i: 5 } }; go(arcadeVS(c3)); o.fin = scene instanceof StoryScene && scene.head === 'FINAL BATTLE';
    T.run(15); key('Escape'); o.skip = scene instanceof VSScene;
    go(arcadeVS({ mode: 'versus', p1: 0, p2: 1, stage: 0 })); o.noArc = scene instanceof VSScene;
    go(new Battle(c3)); const bt = BT; bt.wins = [1, 0]; for (let i = 0; i < 900 && scene === bt; i++) { if (bt.phase === 'fight') bt.p2.hp = 0; Keys.down = new Set(); scene.update(); }
    T.run(40); o.clear = scene instanceof ResultsScene && scene.arcClear && scene.menu.items[0].id === 'ending';
    key('Enter'); o.end = scene instanceof StoryScene && scene.ending;
    return o;
  });
  await shot('ending');
  await page.evaluate(() => { const c = arcadeCfg(T.idx('nue'), 1); c.p2 = c.arcade.order[5]; c.arcade.i = 5; go(arcadeVS(c)); T.run(80); }); await shot('rival');
  await page.evaluate(() => { scene.i = 1; scene.c = 0; T.run(60); }); await shot('rival2');
  ok(!r.riv.length, 'rival is the last of 6 opponents for all fighters ' + r.riv); ok(!r.drawErr.length, 'all scenes draw ' + r.drawErr.slice(0, 3));
  ok(r.pro && r.toVS, 'prologue before fight 1, then VS'); ok(r.mid, 'no scene in middle fights'); ok(r.fin && r.skip, 'rival scene before final, ESC skips');
  ok(r.noArc, 'no story outside arcade'); ok(r.clear, 'ARCADE CLEAR offers STORY ENDING'); ok(r.end, 'ending plays');
  console.log(bad ? `${bad} FAILED` : 'ALL OK', errors.slice(0, 5)); await browser.close();
})();
