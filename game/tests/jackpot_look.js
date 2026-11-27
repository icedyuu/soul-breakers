// node jackpot_look.js [out_dir] : Jackpot lineup, expressions + props, pose sheet (props cycling), 6 skins
const { open } = require('./harness');
const fs = require('fs');
(async () => {
  const id = 'jackpot', out = process.argv[2] || '../../shots_' + id;
  fs.mkdirSync(out, { recursive: true });
  const { browser, page, errors } = await open();
  const shots = await page.evaluate(id => {
    const ch = CHARS.find(c => c.id === id), R = {};
    const others = ['kazuma', 'aimi', 'tokine', 'hollow'].map(k => CHARS.find(c => c.id === k));
    R.lineup = mkCanvas(1200, 460, g => {
      g.fillStyle = '#2a2838'; g.fillRect(0, 0, 1200, 460);
      [...others.slice(0, 2), ch, ...others.slice(2)].forEach((c, i) => { const x = 120 + i * 240; drawFigure(g, c, buildPose(c, 'stance'), x, 420, 1, { T: 20, scale: 1.25, expr: 'normal' }); g.fillStyle = '#fff'; g.font = '14px sans-serif'; g.fillText(c.name, x - 40, 448); });
    }).toDataURL();
    const ex = ['smug', 'grin', 'shock', 'cold', 'hurt', 'ko'];
    R.faces = mkCanvas(ex.length * 170, 230, g => {
      g.fillStyle = '#2a2838'; g.fillRect(0, 0, ex.length * 170, 230);
      ex.forEach((e, i) => { const x = 85 + i * 170; g.save(); g.beginPath(); g.rect(i * 170, 0, 170, 230); g.clip();
        const pal = { ...ch.colors, ex: e === 'smug' || e === 'hurt' || e === 'ko' ? null : e };
        const sk = skeleton(buildPose(ch, 'stance'), ch.dims), s = 2.6 * ch.scale;
        drawFigure(g, ch, buildPose(ch, 'stance'), x - 10 - sk.head[0] * s, 120 - sk.head[1] * s, 1, { T: 0, scale: 2.6, pal, expr: e === 'hurt' || e === 'ko' ? e : 'normal' }); g.restore(); g.fillStyle = '#fff'; g.font = '14px sans-serif'; g.fillText(e, x - 30, 222); });
    }).toDataURL();
    const ps = Object.keys(ch.poses).concat(['walk', 'jump', 'hit', 'down', 'crouch', 'block']);
    const cols = 8, rows = Math.ceil(ps.length / cols);
    R.poses = mkCanvas(cols * 200, rows * 290, g => {
      g.fillStyle = '#2a2838'; g.fillRect(0, 0, cols * 200, rows * 290);
      ps.forEach((p, i) => { const x = 100 + (i % cols) * 200, y = 260 + Math.floor(i / cols) * 290; drawFigure(g, ch, buildPose(ch, p), x, y, 1, { T: i * 7, scale: 1.0, pal: { ...ch.colors, prop: ['chip', 'card', 'fan', 'dice', 'coin', 'gun', 'stack'][i % 7] } }); g.fillStyle = '#fff'; g.font = '13px sans-serif'; g.fillText(p, x - 40, y + 20); });
    }).toDataURL();
    R.variants = mkCanvas(6 * 200, 320, g => {
      g.fillStyle = '#2a2838'; g.fillRect(0, 0, 1200, 320);
      for (let v = 0; v < 6; v++) { const x = 100 + v * 200; g.save(); const fn = varFn(ch, v); const vp = v ? varPal(ch, v, (ch.varColors && ch.varColors(v)) || ch.colors) : ch.colors;
        if (typeof withRecolor === 'function' && fn) withRecolor(fn, () => drawFigure(g, ch, buildPose(ch, 'stance'), x, 290, 1, { T: 10, pal: vp }), v === 5 ? ch.id : null); else drawFigure(g, ch, buildPose(ch, 'stance'), x, 290, 1, { T: 10, pal: vp });
        g.restore(); g.fillStyle = '#fff'; g.font = '12px sans-serif'; g.fillText(varName(ch, v), x - 50, 312); }
    }).toDataURL();
    return R;
  }, id);
  for (const k in shots) fs.writeFileSync(`${out}/${k}.png`, Buffer.from(shots[k].split(',')[1], 'base64'));
  console.log(errors.length ? errors.join('\n') : 'no errors');
  await browser.close();
})();
