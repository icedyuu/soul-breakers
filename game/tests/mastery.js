// node mastery.js  -> mastery + colour variants: select picker, XP award, unlocks, battle/VS/results rendering, mirror rule
const { open } = require('./harness');
const fs = require('fs'), path = require('path');
const OUT = path.resolve(__dirname, '../shots_mastery'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { browser, page, errors } = await open();
  const shot = async n => { await page.evaluate(() => T.draw()); await page.screenshot({ path: path.join(OUT, n + '.png') }); };
  const fail = []; const ok = (c, m) => { if (!c) fail.push(m); };
  // fresh profile
  let r = await page.evaluate(() => ({ lv: Mastery.level('kazuma'), un: Mastery.unlocked('kazuma', 1), info: Mastery.info(3960) }));
  ok(r.lv === 1 && !r.un && r.info.lv === 10, 'fresh profile ' + JSON.stringify(r));
  // select: VS CPU, give Kazuma LV 4 -> variants 1,2 open, 3 locked
  r = await page.evaluate(() => {
    Mastery.rec('kazuma').xp = 700; Mastery.save();
    go(new CharSelectScene('versus', { level: 1 })); T.frame(); const s = scene, out = [];
    T.frame(['sp2']); out.push(s.vs[0]); T.frame(['sp2']); out.push(s.vs[0]); T.frame(['sp2']); out.push(s.vs[0]); T.frame(['sp1']); out.push(s.vs[0]);
    return { lv: Mastery.level('kazuma'), seq: out, pick: Mastery.pick('kazuma') };
  });
  ok(r.lv === 4 && JSON.stringify(r.seq) === '[1,2,0,2]', 'cycle ' + JSON.stringify(r));
  await page.evaluate(() => { for (let i = 0; i < 40; i++) T.frame(); });
  await shot('select_cpu');
  // pick persists, confirm -> stage select carries v1
  r = await page.evaluate(() => { T.frame(['light']); for (let i = 0; i < 3; i++) T.frame(); T.frame(['light']); for (let i = 0; i < 60; i++) T.frame(); return { name: scene.constructor.name, cfg: scene.cfg }; });
  ok(r.name === 'StageSelectScene' && r.cfg.v1 === 2 && r.cfg.v2 === 0, 'cfg variants ' + JSON.stringify(r));
  // 2P versus select: both sides show pickers
  await page.evaluate(() => { Mastery.rec('sera').xp = 4000; go(new CharSelectScene('versus')); scene.cur = [2, 0]; for (let i = 0; i < 20; i++) T.frame(); T.frame(['sp2']); for (let i = 0; i < 20; i++) T.frame(); });
  await shot('select_2p');
  // battle with variants + mirror rule
  r = await page.evaluate(() => {
    go(new Battle({ mode: 'versus', p1: 0, p2: 0, stage: 1, v1: 4, v2: 4 })); const bt = scene;
    for (let i = 0; i < 260; i++) T.frame();
    return { v: [bt.p1.variant, bt.p2.variant], acc: [bt.p1.colors.accent, bt.p2.colors.accent, CHARS[0].colors.accent] };
  });
  ok(r.v[0] === 4 && r.v[1] === 0 && r.acc[0] !== r.acc[2], 'mirror ' + JSON.stringify(r));
  await shot('battle_mirror');
  await page.evaluate(() => { go(new Battle({ mode: 'versus', p1: T.idx('hollow'), p2: T.idx('reika'), stage: 2, v1: 4, v2: 3 })); for (let i = 0; i < 200; i++) T.frame(); });
  await shot('battle_hollow_reika');
  await page.evaluate(() => { Settings.pixel = false; T.draw(); }); await shot('battle_vector'); await page.evaluate(() => { Settings.pixel = true; });
  // VS screen
  await page.evaluate(() => { go(new VSScene({ mode: 'versus', p1: T.idx('lunaria'), p2: T.idx('yamika'), stage: 0, v1: 4, v2: 1 })); for (let i = 0; i < 60; i++) T.frame(); });
  await shot('vs');
  // arcade final win -> XP + clear bonus + unlock toasts
  r = await page.evaluate(() => {
    Mastery.rec('sera').xp = 0;
    const cfg = { mode: 'versus', p1: T.idx('sera'), p2: 0, stage: 0, cpu: { level: 2, arcade: true }, arcade: { order: [0, 1, 3, 4, 5, 6], i: 5 }, v1: 0 };
    go(new Battle(cfg)); const bt = scene; bt.wins = [2, 0];
    go(new ResultsScene(bt)); for (let i = 0; i < 170; i++) T.frame();
    return { mx: { gained: scene.mx.gained, b: scene.mx.before.lv, a: scene.mx.after.lv, un: scene.mx.unlocks }, saved: JSON.parse(localStorage.getItem('sb_profile_v1')).chars.sera };
  });
  ok(r.mx.gained > 400 && r.mx.un.length >= 1 && r.saved.xp === r.mx.gained && r.saved.w === 1, 'arcade award ' + JSON.stringify(r));
  await shot('results_arcade');
  // single CPU loss gives a little; local versus gives nothing; training nothing
  r = await page.evaluate(() => {
    const a = (cfg, w) => { go(new Battle(cfg)); const bt = scene; bt.wins = w; const rs = new ResultsScene(bt); rs.update(); return rs.mx ? rs.mx.gained : 0; };
    return [a({ mode: 'versus', p1: 1, p2: 2, stage: 0, cpu: { level: 1 } }, [1, 2]), a({ mode: 'versus', p1: 1, p2: 2, stage: 0 }, [2, 0])];
  });
  ok(r[0] > 0 && r[0] < 40 && r[1] === 0, 'cpu/versus award ' + JSON.stringify(r));
  // HUD portrait + cut-in use the variant art
  r = await page.evaluate(() => { const ch = CHARS[0]; return [chArt(ch, 0, 'portrait') === ch.portrait, chArt(ch, 2, 'portrait') !== ch.portrait, chArt(ch, 2, 'cutin').width > 0]; });
  ok(r.every(Boolean), 'art ' + JSON.stringify(r));
  // export / import merge keeps max progress
  r = await page.evaluate(() => { const e = Mastery.export(); e.chars.goro = { xp: 999, w: 3, l: 1 }; e.chars.sera.xp = 1; Mastery.import(e); return [Mastery.rec('goro').xp, Mastery.rec('sera').xp > 1]; });
  ok(r[0] === 999 && r[1], 'import ' + JSON.stringify(r));
  // canvas hook is off outside variant drawing
  r = await page.evaluate(() => { const g = mkCanvas(2, 2).getContext('2d'); g.fillStyle = '#123456'; return [RC.fn === null, g.fillStyle]; });
  ok(r[0] && r[1] === '#123456', 'hook off ' + JSON.stringify(r));
  console.log(fail.length ? 'FAIL\n' + fail.join('\n') : 'ALL OK', '\nerrors', errors);
  await browser.close();
})();
