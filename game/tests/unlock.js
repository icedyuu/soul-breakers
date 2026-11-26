// fighter unlock system (09g_unlock.js): locks in VS CPU/Arcade only, free pick at mastery LV FREE_PICK_LV, arcade clear unlock, migration, versus/training open
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open(); let bad = 0;
  const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
  const r = await page.evaluate(() => {
    const o = {}, enter = () => { Keys.pressed.add('Enter'); scene.update(); Keys.pressed.clear(); T.frame(); T.frame(); T.frame(); };
    o.fresh = Roster.lockedIds().length;
    go(new CharSelectScene('versus', { level: 1 })); T.run(5); scene.cur = [T.idx('borgar'), 0]; T.frame();
    o.lockedShown = scene.locked(T.idx('borgar')) && !scene.locked(T.idx('kazuma'));
    enter(); o.refused = !scene.ready[0] && !scene.ask;
    for (let i = 0; i < 30; i++) { scene.randomPick(0); o.randOpen = (o.randOpen ?? true) && Roster.openIdx(scene.cur[0]); scene.ready = [false, false]; }
    Mastery.rec('sera').xp = 400; scene.cur = [T.idx('reika'), 0]; enter(); o.ask = !!scene.ask; enter(); o.unlocked = Roster.open('reika') && Mastery.data.fuFree === 1 && !Roster.freeReady();
    o.cpuAnyOpp = (() => { scene.cur = [0, 0]; enter(); return !scene.locked(T.idx('hachi')); })();
    for (const m of ['versus', 'training', 'practice']) { go(new CharSelectScene(m)); T.run(3); o['open_' + m] = !CHARS.some((_, i) => scene.locked(i)); }
    localStorage.setItem(Mastery.KEY, JSON.stringify({ v: 1, chars: { goro: { xp: 50, w: 1, l: 0 } }, pick: {} })); Mastery.d = null; o.migrated = Roster.lockedIds().length === 0;
    localStorage.clear(); Mastery.d = null; Mastery.import({ v: 1, chars: { goro: { xp: 10 } }, pick: {} }); o.importOld = Roster.lockedIds().length === 0;
    localStorage.clear(); Mastery.d = null; Mastery.import({ v: 1, fuV: 1, fu: { kuchi: 1 }, chars: { goro: { xp: 10 } }, pick: {} }); o.importNew = Roster.open('kuchi') && Roster.lockedIds().length === 11;
    localStorage.clear(); Mastery.d = null; Cloud.applyGrants({ f_buzzu: 1, lunaria: 3 }); o.grants = Roster.open('buzzu') && Roster.open('lunaria') && Roster.lockedIds().length === 10;
    localStorage.clear(); Mastery.d = null; Mastery.unlockAll(); o.cheat = Roster.lockedIds().length === 0 && !Cloud.exportSave().fuAll;
    localStorage.clear(); Mastery.d = null;
    const cfg = arcadeCfg(0, 1); cfg.arcade.i = cfg.arcade.order.length - 1; cfg.p2 = cfg.arcade.order[cfg.arcade.i];
    go(new Battle(cfg)); const bt = BT; bt.wins = [1, 0]; for (let i = 0; i < 900 && scene === bt; i++) { if (bt.phase === 'fight') bt.p2.hp = 0; Keys.down = new Set(); scene.update(); }
    T.run(10); o.arcade = !!(scene.mx && scene.mx.fighter) && Roster.lockedIds().length === 11;
    return o;
  });
  ok(r.fresh === 12, 'new player: 12 fighters locked'); ok(r.lockedShown, 'lock shown in VS CPU select'); ok(r.refused, 'locked fighter cannot be confirmed');
  ok(r.randOpen, 'RANDOM only picks open fighters'); ok(r.ask && r.unlocked, `free pick at LV ${3}: ask + unlock`); ok(r.cpuAnyOpp, 'CPU opponent can be any fighter');
  ok(r.open_versus && r.open_training && r.open_practice, 'versus / training / practice: all open');
  ok(r.migrated, 'old played profile keeps everyone'); ok(r.importOld, 'old account save keeps everyone'); ok(r.importNew, 'account sync merges unlocks');
  ok(r.grants, 'admin grants unlock'); ok(r.cheat, 'cheat opens all (local only)'); ok(r.arcade, 'arcade clear unlocks one fighter');
  console.log(bad ? `${bad} FAILED` : 'ALL OK', errors.slice(0, 5)); await browser.close();
})();
