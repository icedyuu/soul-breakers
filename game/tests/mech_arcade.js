// node mech_arcade.js -> arcade skins (slot 5) for every fighter: unlock on clear, cloud merge, admin grant, Aimi migration,
// battle drawing (incl. silhouettes / pixel mode / ults), select + collection + VS + results screens, online clamp
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  const shot = async n => { const d = await page.evaluate(() => { T.draw(); return canvas.toDataURL(); }); require('fs').writeFileSync(`../shots_arcade_${n}.png`, Buffer.from(d.split(',')[1], 'base64')); };
  const r = await page.evaluate(() => {
    const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
    ok(VAR_N === 6 && CHARS.every(c => varSpecial(c.id, 5) === 'arcade'), 'every fighter has an arcade skin in slot 5');
    ok(CHARS.every(c => c.id === 'aimi' || (varDef(c, 5).cos === c.id && ARC[c.id])), 'every fighter (but Aimi) has a costume');
    ok(new Set(CHARS.map(c => varName(c, 5))).size === CHARS.length, 'all names distinct');
    // unlock by clearing arcade (Mastery.award with a fake last arcade fight)
    const fake = (id, clear) => ({ cfg: { cpu: { arcade: true, level: 1 }, arcade: { i: clear ? 6 : 2, order: [0, 1, 2, 3, 4, 5, 6] } }, mode: 'versus', p1: { ch: CHARS.find(c => c.id === id) }, p2: {}, wins: [2, 0] });
    let all = true, toast = true;
    for (const c of CHARS) { if (Mastery.unlocked(c.id, 5)) all = false; Mastery.award(fake(c.id, false)); if (Mastery.unlocked(c.id, 5)) all = false; const a = Mastery.award(fake(c.id, true)); if (!Mastery.unlocked(c.id, 5)) all = false; if (!a.unlocks.includes(5)) toast = false; }
    ok(all, 'locked at start, not by a normal arcade win, unlocked by the clear'); ok(toast, 'unlock toast for each');
    // cloud merge + migration of Aimi's old slot
    localStorage.clear(); Mastery.d = null;
    Mastery.import({ v: 1, chars: {}, unl: { 'aimi:3': 1, 'hollow:5': 1 }, pick: { aimi: 3 } });
    ok(Mastery.unlocked('aimi', 5) && !Mastery.unlocked('aimi', 3) && Mastery.pick('aimi') === 5 && Mastery.unlocked('hollow', 5), 'import: old Aimi dress → slot 5, pick follows');
    localStorage.setItem(Mastery.KEY, JSON.stringify({ v: 1, profile: 'x', upd: 0, chars: {}, pick: { aimi: 3 }, unl: { 'aimi:3': 1 } })); Mastery.d = null;
    ok(Mastery.unlocked('aimi', 5) && Mastery.pick('aimi') === 5, 'local save migration');
    // admin grants
    localStorage.clear(); Mastery.d = null;
    Cloud.applyGrants({ arc_hollow: 1 }); ok(Mastery.unlocked('hollow', 5) && !Mastery.unlocked('kazuma', 5), 'admin grant for one fighter');
    Cloud.applyGrants({ arc_all: 1 }); ok(CHARS.every(c => Mastery.unlocked(c.id, 5)), 'admin grant for all');
    // the mirror rule never hands out the arcade skin
    ok(cfgVariants({ p1: 0, p2: 0, v1: 5, v2: 5 })[1] === 0 && cfgVariants({ p1: 0, p2: 0, v1: 4, v2: 4 })[1] === 0, 'mirror rule');
    return out;
  });
  console.log(r.join('\n'));
  // every fighter in battle wearing it (vs the next fighter, also wearing it), random inputs, vector + pixel, drawn each frame
  const b = await page.evaluate(() => {
    const bad = []; const n = CHARS.length;
    for (let i = 0; i < n; i++) {
      for (const px of [false, true]) {
        Settings.pixel = px;
        go(new Battle({ mode: 'versus', p1: i, p2: (i + 1) % n, stage: i % STAGES.length, v1: 5, v2: 5 })); BT.phase = 'fight';
        const acts = ['light', 'medium', 'heavy', 'sp1', 'sp2', 'jump', 'left', 'right', 'down'];
        try { for (let f = 0; f < 240; f++) { T.frame(f % 7 ? [] : [acts[(f * 7 + i) % acts.length]]); if (f % 3 === 0) T.draw(); } BT.p1.meter = 100; T.frame(['sp1', 'sp2']); for (let f = 0; f < 200; f++) { T.frame(); if (f % 4 === 0) T.draw(); } }
        catch (e) { bad.push(CHARS[i].id + ': ' + e.message); }
        if (BT.p1.variant !== 5 || !BT.p1.colors.cos && CHARS[i].id !== 'aimi') bad.push(CHARS[i].id + ' palette has no costume');
        if (RC.fn || RC.cos) bad.push('recolour state leaked');
      }
    }
    Settings.pixel = false;
    return bad;
  });
  console.log(b.length ? 'FAIL battles: ' + b.join(' | ') : 'ok   every fighter fights + ults in its arcade skin (vector + pixel)');
  await page.evaluate(() => { go(new Battle({ mode: 'versus', p1: T.idx('hollow'), p2: T.idx('saint'), stage: 1, v1: 5, v2: 5 })); for (let i = 0; i < 260; i++) T.frame(); });
  await shot('battle');
  await page.evaluate(() => { Mastery.unlockAll(); Mastery.setPick('hollow', 5); go(new CharSelectScene('versus')); scene.cur = [T.idx('hollow'), T.idx('kazuma')]; for (let i = 0; i < 30; i++) T.frame(); });
  await shot('select');
  await page.evaluate(() => { go(new VSScene({ mode: 'versus', p1: T.idx('hollow'), p2: T.idx('lunaria'), stage: 0, v1: 5, v2: 5 })); for (let i = 0; i < 60; i++) T.frame(); });
  await shot('vs');
  await page.evaluate(() => { go(new CollectionScene(T.idx('hollow'))); for (let i = 0; i < 4; i++) { scene.row = 4; } for (let i = 0; i < 80; i++) T.frame(); });
  await shot('collection');
  const cl = await page.evaluate(() => { scene.row = 4; scene.change(1); scene.change(-1); return scene.vs; });
  console.log(cl === 5 ? 'ok   collection SKIN row cycles' : 'FAIL collection ' + cl);
  console.log('errors', errors);
  await browser.close();
})();
