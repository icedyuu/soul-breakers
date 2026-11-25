const { open } = require('./harness');
(async () => {
  const ids = process.argv[2].split(','), out = process.argv[3] || 'out_heads.png';
  const { browser, page, errors } = await open();
  const url = await page.evaluate((ids) => {
    const cw = 300, c = mkCanvas(ids.length * cw, 340, g => {
      g.fillStyle = '#3a3848'; g.fillRect(0, 0, ids.length * cw, 340);
      ids.forEach((id, i) => { const ch = CHARS.find(c => c.id === id); drawFigure(g, ch, buildPose(ch, 'stance'), i * cw + 150, 620, 1, { T: 0, scale: 3.2 / ch.scale }); });
    }); return c.toDataURL(); }, ids);
  require('fs').writeFileSync(out, Buffer.from(url.split(',')[1], 'base64')); console.log('errors', errors); await browser.close();
})();
