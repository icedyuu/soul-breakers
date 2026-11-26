// node arcade_look.js [out.png] [pose]  -> every fighter: ORIGINAL vs ARCADE skin (slot 5), + portraits
const { open } = require('./harness');
(async () => {
  const out = process.argv[2] || 'out_arcade.png', pose = process.argv[3] || 'stance';
  const { browser, page, errors } = await open();
  const url = await page.evaluate(pose => {
    const ids = CHARS.map(c => c.id), cols = 10, cw = 250, chh = 380, rows = Math.ceil(ids.length / cols);
    const c = mkCanvas(cols * cw, rows * chh, g => {
      g.fillStyle = '#24222f'; g.fillRect(0, 0, cols * cw, rows * chh);
      ids.forEach((id, i) => {
        const ch = CHARS.find(c => c.id === id), x = (i % cols) * cw + cw / 2, y = Math.floor(i / cols) * chh + 320;
        const fn = varFn(ch, 5);
        g.fillStyle = '#444'; g.fillRect(x - 110, y, 220, 2);
        withVarPal([[ch, 5]], () => withRecolor(fn, () => drawFigure(g, ch, buildPose(ch, pose), x + 10, y, 1, { T: 40, scale: 1.45, ropes: {} })));
        g.fillStyle = '#fff'; g.font = 'bold 15px sans-serif'; g.textAlign = 'center'; g.fillText(varName(ch, 5), x, y + 26);
        g.fillStyle = '#aaa'; g.font = '12px sans-serif'; g.fillText(ch.name, x, y + 44);
      });
    });
    return c.toDataURL();
  }, pose);
  require('fs').writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log('errors', errors); await browser.close();
})();
