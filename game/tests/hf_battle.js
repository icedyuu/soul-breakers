// node hf_battle.js [out_dir] : HAUNTED FOUR in battle — rolled form HUD + intro, specials, ult frames (cine frame numbers)
const { open } = require('./harness');
const fs = require('fs');
(async () => {
  const out = process.argv[2] || '/tmp/claude-0/sb/out';
  const { browser, page, errors } = await open();
  const snap = async name => { await page.evaluate(() => T.draw()); fs.writeFileSync(`${out}/${name}.png`, Buffer.from((await page.evaluate(() => canvas.toDataURL())).split(',')[1], 'base64')); };
  const setup = (f1, f2, dist = 190) => page.evaluate(([f1, f2, dist]) => { HF_FORCE = [f1, f2]; go(new Battle({ mode: 'versus', stage: 3, p1: T.idx('haunted'), p2: T.idx(f2 ? 'haunted' : 'kazuma') })); HF_FORCE = null; BT.phase = 'fight'; BT.p1.setState('idle'); BT.p2.setState('idle'); BT.timer = 1e9; BT.p2.x = BT.p1.x + dist; T.run(2); }, [f1, f2, dist]);
  // intro card of a rolled form
  await page.evaluate(() => { HF_FORCE = ['fox', 'chicken']; go(new Battle({ mode: 'versus', stage: 0, p1: T.idx('haunted'), p2: T.idx('haunted') })); HF_FORCE = null; T.run(40); });
  await snap('hf_intro');
  for (const [f1, f2, k, n, name] of [['bear', 'rabbit', 'sp1f', 22, 'hf_b_lullaby'], ['chicken', 'fox', 'sp2f', 80, 'hf_c_guard'], ['chicken', 'bear', 'sp2d', 34, 'hf_c_party'], ['fox', 'chicken', 'sp2d', 12, 'hf_f_scare'], ['rabbit', 'bear', 'sp2d', 50, 'hf_r_crush'], ['bear', 'fox', 'sp2f', 30, 'hf_b_show']]) {
    await setup(f1, f2, k === 'sp2f' && f1 === 'chicken' ? 420 : 160);
    await page.evaluate(([k, n]) => { BT.p1.startMove(k); T.run(n); }, [k, n]);
    await snap(name);
  }
  // ult: count cine frames
  await setup('rabbit', null, 120);
  await page.evaluate(() => { BT.p1.meter = 100; BT.p1.startMove('ult'); for (let i = 0; i < 200 && !BT.cine; i++) T.frame(); });
  let at = 0;
  for (const f of [8, 40, 100, 140, 180, 200, 228, 250, 288, 312, 340, 365]) {
    await page.evaluate(f => { for (let i = 0; i < 600 && BT.cine && BT.cine.f < f; i++) T.frame(); }, f);
    await snap('hf_ult_' + f);
  }
  console.log('errors', errors.slice(0, 5)); await browser.close();
})();
