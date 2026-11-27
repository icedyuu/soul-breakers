// node teke_look.js [out_dir] : Teke Teke lineup, faces, pose sheet, crawl cycle per momentum stage, 6 skins
const { open } = require('./harness');
const fs = require('fs');
(async () => {
  const id = 'teke', out = process.argv[2] || '../../shots_' + id;
  fs.mkdirSync(out, { recursive: true });
  const { browser, page, errors } = await open();
  const shots = await page.evaluate(id => {
    const ch = CHARS.find(c => c.id === id), R = {};
    const others = ['kazuma', 'kuchi', 'hachi', 'haze'].map(k => CHARS.find(c => c.id === k));
    R.lineup = mkCanvas(1200, 460, g => {
      g.fillStyle = '#2a2838'; g.fillRect(0, 0, 1200, 460);
      [...others.slice(0, 2), ch, ...others.slice(2)].forEach((c, i) => { const x = 120 + i * 240; drawFigure(g, c, buildPose(c, 'stance'), x, 420, 1, { T: 20, scale: 1.25, expr: 'normal' }); g.fillStyle = '#fff'; g.font = '14px sans-serif'; g.fillText(c.name, x - 40, 448); });
      g.strokeStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.moveTo(0, 420); g.lineTo(1200, 420); g.stroke();
    }).toDataURL();
    const ex = [null, 'grin', 'wide', 'shut', 'hurt', 'ko', 'glow'];
    R.faces = mkCanvas(ex.length * 170, 230, g => {
      g.fillStyle = '#2a2838'; g.fillRect(0, 0, ex.length * 170, 230);
      ex.forEach((e, i) => { const x = 85 + i * 170; g.save(); g.beginPath(); g.rect(i * 170, 0, 170, 230); g.clip();
        const pal = { ...ch.colors, ex: ['hurt', 'ko', 'glow'].includes(e) ? null : e };
        const p = buildPose(ch, 'look'), sk = skeleton(p, ch.dims), s = 2.6 * ch.scale;
        drawFigure(g, ch, p, x - 10 - sk.head[0] * s, 120 - sk.head[1] * s, 1, { T: 0, scale: 2.6, pal, glow: e === 'glow', expr: e === 'hurt' || e === 'ko' ? e : 'normal' }); g.restore(); g.fillStyle = '#fff'; g.font = '14px sans-serif'; g.fillText(String(e), x - 30, 222); });
    }).toDataURL();
    const ps = Object.keys(ch.poses).concat(['stance']);
    const cols = 9, rows = Math.ceil(ps.length / cols);
    R.poses = mkCanvas(cols * 180, rows * 230, g => {
      g.fillStyle = '#2a2838'; g.fillRect(0, 0, cols * 180, rows * 230);
      ps.forEach((p, i) => { const x = 90 + (i % cols) * 180, y = 200 + Math.floor(i / cols) * 230; g.strokeStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.moveTo(x - 80, y); g.lineTo(x + 80, y); g.stroke(); drawFigure(g, ch, buildPose(ch, p), x - 20, y, 1, { T: i * 7, scale: 1.0 }); g.fillStyle = '#fff'; g.font = '13px sans-serif'; g.fillText(p, x - 40, y + 20); });
    }).toDataURL();
    R.crawl = mkCanvas(8 * 170, 4 * 200, g => {
      g.fillStyle = '#2a2838'; g.fillRect(0, 0, 8 * 170, 800);
      for (let st = 0; st < 4; st++) for (let i = 0; i < 8; i++) { const x = 70 + i * 170, y = 180 + st * 200; g.strokeStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.moveTo(x - 60, y); g.lineTo(x + 100, y); g.stroke(); drawFigure(g, ch, buildPose(ch, tkCrawlPose(i * Math.PI / 4, st, false)), x, y, 1, { T: i * 5 }); if (!i) { g.fillStyle = '#fff'; g.fillText('stage ' + (st + 1), x - 60, y - 150); } }
    }).toDataURL();
    R.variants = mkCanvas(6 * 200, 280, g => {
      g.fillStyle = '#2a2838'; g.fillRect(0, 0, 1200, 280);
      for (let v = 0; v < 6; v++) { const x = 90 + v * 200; g.save(); const fn = varFn(ch, v); const vp = v ? varPal(ch, v, (ch.varColors && ch.varColors(v)) || ch.colors) : ch.colors;
        if (typeof withRecolor === 'function' && fn) withRecolor(fn, () => drawFigure(g, ch, buildPose(ch, 'stance'), x, 250, 1, { T: 10, pal: vp }), v === 5 ? ch.id : null); else drawFigure(g, ch, buildPose(ch, 'stance'), x, 250, 1, { T: 10, pal: vp });
        g.restore(); g.fillStyle = '#fff'; g.font = '12px sans-serif'; g.fillText(varName(ch, v), x - 50, 272); }
    }).toDataURL();
    return R;
  }, id);
  for (const k in shots) fs.writeFileSync(`${out}/${k}.png`, Buffer.from(shots[k].split(',')[1], 'base64'));
  console.log(errors.length ? errors.join('\n') : 'no errors');
  await browser.close();
})();
