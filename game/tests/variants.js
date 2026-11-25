// node variants.js [ids] [out.png] [pixel]  -> every colour variant of each fighter (rows) side by side
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  const ids = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2].split(',') : null, out = process.argv[3] || 'out_variants.png';
  const url = await page.evaluate(([ids, px]) => {
    Settings.pixel = !!px;
    const list = ids ? ids.map(id => CHARS.find(c => c.id === id)) : CHARS, cw = 170, rh = 250;
    const c = mkCanvas(VAR_N * cw + 120, list.length * rh, g => {
      g.fillStyle = '#2a2838'; g.fillRect(0, 0, g.canvas.width, g.canvas.height);
      list.forEach((ch, r) => {
        g.fillStyle = '#fff'; g.font = '16px sans-serif'; g.fillText(ch.id, 8, r * rh + 30);
        for (let v = 0; v < VAR_N; v++) {
          const x = 120 + v * cw + cw / 2, y = r * rh + 225;
          withRecolor(varFn(ch, v), () => drawFigure(g, ch, buildPose(ch, 'stance'), x, y, 1, { T: 0, scale: 0.95 }));
          g.fillStyle = '#fff'; g.font = '12px sans-serif'; g.fillText(varName(ch, v), x - 70, y + 18);
        }
      });
    });
    return c.toDataURL();
  }, [ids, process.argv[4]]);
  require('fs').writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log('errors', errors); await browser.close();
})();
