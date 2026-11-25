// node lineup.js id1,id2,... [out.png] [pose]  -> stance lineup (vector + pixel-processed)
const { open } = require('./harness');
(async () => {
  const ids = process.argv[2].split(','), out = process.argv[3] || 'out_lineup.png', pose = process.argv[4] || 'stance';
  const { browser, page, errors } = await open();
  const url = await page.evaluate(([ids, pose]) => {
    const cw = 230, c = mkCanvas(ids.length * cw, 330, g => {
      g.fillStyle = '#2a2838'; g.fillRect(0, 0, ids.length * cw, 330);
      ids.forEach((id, i) => { const ch = CHARS.find(c => c.id === id); const x = i * cw + cw / 2;
        g.fillStyle = '#555'; g.fillRect(x - 100, 300, 200, 2);
        drawFigure(g, ch, buildPose(ch, pose), x, 300, 1, { T: 0, scale: 1.25 });
        g.fillStyle = '#fff'; g.font = '14px sans-serif'; g.fillText(id, x - 100, 322); });
    });
    return c.toDataURL();
  }, [ids, pose]);
  require('fs').writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log('errors', errors); await browser.close();
})();
