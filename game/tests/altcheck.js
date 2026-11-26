const { open } = require('./harness');
(async () => { const { browser, page, errors } = await open(); const fs = require('fs'); const O = process.argv[2];
  const snap = async (n, fn) => { let u; try { u = await page.evaluate(fn); } catch (e) { console.log(n, String(e).slice(0, 300)); return; } fs.writeFileSync(`${O}/${n}.png`, Buffer.from(u.split(',')[1], 'base64')); };
  await page.evaluate(() => Mastery.unlockAll());
  await snap('sel4', () => { Mastery.setPick('kanae', 4); Mastery.setPick('tokine', 4); go(new CharSelectScene('versus')); const s = scene; s.cur = [T.idx('kanae'), T.idx('tokine')]; for (let i = 0; i < 20; i++) scene.update(); T.draw(); return canvas.toDataURL(); });
  await snap('bat4', () => { go(new Battle({ mode: 'versus', stage: 2, p1: T.idx('kanae'), p2: T.idx('tokine'), v1: 4, v2: 4 })); BT.phase = 'fight'; BT.p1.setState('idle'); BT.p2.setState('idle'); BT.p1.x = 520; BT.p2.x = 800; T.run(10); T.draw(); return canvas.toDataURL(); });
  await snap('vs4', () => { go(new VSScene({ mode: 'versus', stage: 2, p1: T.idx('kanae'), p2: T.idx('tokine'), v1: 4, v2: 4 })); for (let i = 0; i < 60; i++) scene.update(); T.draw(); return canvas.toDataURL(); });
  console.log(errors); await browser.close(); })();
