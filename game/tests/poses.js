// render a pose sheet for a character: node poses.js <id> [pose,...]
const { open } = require('./harness');
(async () => {
  const id = process.argv[2], extra = (process.argv[3] || '').split(',').filter(Boolean);
  const { browser, page, errors } = await open();
  const url = await page.evaluate(([id, extra]) => {
    const ch = CHARS.find(c => c.id === id);
    const poses = ['stance', 'walk', 'crouch', 'jump', 'block', 'hit', 'airhit', 'down', 'victory', ...Object.keys(ch.poses).filter(k => k !== 'victory' && k !== 'intro'), ...extra].slice(0, 32);
    const cols = 8, cw = 220, chh = 260, rows = Math.ceil(poses.length / cols);
    const c = mkCanvas(cols * cw, rows * chh + 300, g => {
      g.fillStyle = '#2a2838'; g.fillRect(0, 0, cols * cw, rows * chh + 300);
      poses.forEach((p, i) => {
        const x = (i % cols) * cw + cw / 2, y = Math.floor(i / cols) * chh + 230;
        g.fillStyle = '#444'; g.fillRect(x - 100, y, 200, 2);
        const spec = p === 'walk' ? { wk: 0.8, fl1: 0.5, bl1: -0.3 } : p;
        drawFigure(g, ch, buildPose(ch, spec), x, y, 1, { T: 0, expr: ['hit', 'airhit'].includes(p) ? 'hurt' : p === 'down' ? 'ko' : /S$|swing|ram|roar|up/.test(p) ? 'shout' : 'normal', glow: p === 'victory' });
        g.fillStyle = '#fff'; g.font = '14px sans-serif'; g.fillText(p, x - 95, y + 20);
      });
      // big close-up + portrait
      const y = rows * chh + 280;
      drawFigure(g, ch, buildPose(ch, 'stance'), 200, y, 1, { T: 0, scale: 1.5 });
      drawFigure(g, ch, buildPose(ch, 'stance'), 480, y, -1, { T: 0, scale: 1.5, expr: 'shout', glow: true });
      g.drawImage(ch.portrait, 700, y - 280); g.drawImage(ch.card, 1020, y - 280);
      drawFigure(g, ch, buildPose(ch, 'stance'), 1300, y, 1, { T: 0, scale: 1.5, pal: ch.palette ? ch.palette({ ...{ berserkT: 1, ultRunes: 1, heat: 100, overheatT: 1, devilT: 1, domT: 1, authority: 100 } }) : ch.colors });
      // reference chibis
      for (const [j, rid] of ['nue', 'saint', 'goro'].entries()) { const rc = CHARS.find(c => c.id === rid); drawFigure(g, rc, buildPose(rc, 'stance'), 1480 + j * 0, y, 1, { T: 0, scale: 1.0 }); }
    });
    return c.toDataURL();
  }, [id, extra]);
  require('fs').writeFileSync(`out_${id}_poses.png`, Buffer.from(url.split(',')[1], 'base64'));
  console.log('errors', errors);
  await browser.close();
})();
