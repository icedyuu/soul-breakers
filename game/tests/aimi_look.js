// node aimi_look.js [out_dir] : Aimi skins, expressions and pose sheet previews
const { open } = require('./harness');
const fs = require('fs');
(async () => {
  const out = process.argv[2] || '../../shots_aimi';
  const { browser, page, errors } = await open();
  const shots = await page.evaluate(() => {
    const ch = CHARS.find(c => c.id === 'aimi'), R = {};
    const pals = [ch.colors, ch.varColors(3), ch.varColors(4)];
    R.skins = mkCanvas(900, 420, g => {
      g.fillStyle = '#2a2838'; g.fillRect(0, 0, 900, 420);
      pals.forEach((pal, i) => { const x = 150 + i * 300; drawFigure(g, ch, buildPose(ch, 'stance'), x, 380, 1, { T: 20, scale: 1.7, pal }); g.fillStyle = '#fff'; g.font = '16px sans-serif'; g.fillText(['SCHOOL (default)', 'MIDNIGHT DRESS (Arcade)', 'LAST HORIZON (LV10)'][i], x - 90, 410); });
    }).toDataURL();
    const ex = ['normal', 'smile', 'calm', 'stare', 'grin', 'crazy', 'smirk', 'angry', 'hurt'];
    R.faces = mkCanvas(ex.length * 150, 200, g => {
      g.fillStyle = '#2a2838'; g.fillRect(0, 0, ex.length * 150, 200);
      ex.forEach((e, i) => { const x = 75 + i * 150; g.save(); g.beginPath(); g.rect(i * 150, 0, 150, 200); g.clip(); drawFigure(g, ch, buildPose(ch, 'stance'), x - 10, 520, 1, { T: 0, scale: 2.6, pal: { ...ch.colors, ex: e === 'hurt' ? null : e }, expr: e === 'hurt' ? 'hurt' : 'normal' }); g.restore(); g.fillStyle = '#fff'; g.font = '14px sans-serif'; g.fillText(e, x - 30, 192); });
    }).toDataURL();
    const ps = ['stance', 'walk', 'jump', 'hit', 'victory', 'claim', 'hairfix', 'stare', 'draw', 'aim', 'aim2', 'aim_low', 'recoil', 'crouch_run', 'knee', 'heel', 'spin', 'reach', 'defeat', 'defeat2', 'intro', 'wave', 'aim_up', 'peek'];
    R.poses = mkCanvas(8 * 200, 3 * 250, g => {
      g.fillStyle = '#2a2838'; g.fillRect(0, 0, 1600, 750);
      ps.forEach((p, i) => { const x = 100 + (i % 8) * 200, y = 220 + Math.floor(i / 8) * 250; drawFigure(g, ch, buildPose(ch, p), x, y, 1, { T: i * 7, scale: 1.0, pal: pals[i % 3] }); g.fillStyle = '#fff'; g.font = '13px sans-serif'; g.fillText(p, x - 40, y + 20); });
    }).toDataURL();
    return R;
  });
  for (const k in shots) fs.writeFileSync(`${out}/${k}.png`, Buffer.from(shots[k].split(',')[1], 'base64'));
  console.log(errors.length ? errors.join('\n') : 'no errors');
  await browser.close();
})();
