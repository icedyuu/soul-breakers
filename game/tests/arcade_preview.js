// node arcade_preview.js [out.png] -> poster of every arcade skin: ORIGINAL (small, left) and ARCADE skin (big) per fighter
const { open } = require('./harness');
(async () => {
  const out = process.argv[2] || '../preview_arcade_skins.png';
  const { browser, page, errors } = await open();
  const url = await page.evaluate(() => {
    const ids = CHARS.map(c => c.id), cols = 5, cw = 360, chh = 430, top = 120, rows = Math.ceil(ids.length / cols);
    return mkCanvas(cols * cw, top + rows * chh + 20, g => {
      const W2 = cols * cw, H2 = top + rows * chh + 20, bg = g.createLinearGradient(0, 0, 0, H2); bg.addColorStop(0, '#1a1030'); bg.addColorStop(1, '#0c0818');
      g.fillStyle = bg; g.fillRect(0, 0, W2, H2);
      g.textAlign = 'center'; g.font = `italic 900 54px ${FONT_T}`; strokeText(g, 'ARCADE SKINS', W2 / 2, 50, '#ffd84a', OUTLINE, 7);
      g.font = `700 20px ${FONT_UI}`; g.fillStyle = '#e8dcff'; g.fillText('clear Arcade with a fighter to unlock its skin  ·  small figure = original look', W2 / 2, 92);
      ids.forEach((id, i) => {
        const ch = CHARS.find(c => c.id === id), cx = (i % cols) * cw, cy = top + Math.floor(i / cols) * chh, fy = cy + 345;
        g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(cx + 8, cy + 4, cw - 16, chh - 12);
        const gr = g.createRadialGradient(cx + cw / 2 + 30, fy - 120, 10, cx + cw / 2 + 30, fy - 120, 200); gr.addColorStop(0, ch.colors.accent + '44'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(cx + 8, cy + 4, cw - 16, chh - 12);
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(cx + cw / 2 + 40, fy + 4, 80, 12, 0, 0, TAU); g.fill();
        g.globalAlpha = 0.75; drawFigure(g, ch, buildPose(ch, 'stance'), cx + 60, fy, 1, { T: 40, scale: 0.8 }); g.globalAlpha = 1;
        const ropes = {}, p = buildPose(ch, 'stance');
        withVarPal([[ch, 5]], () => withRecolor(varFn(ch, 5), () => { for (let k = 0; k < 50; k++) drawFigure(document.createElement('canvas').getContext('2d'), ch, p, cx + cw / 2 + 40, fy, 1, { T: k, scale: 1.5, ropes }); drawFigure(g, ch, p, cx + cw / 2 + 40, fy, 1, { T: 50, scale: 1.5, ropes }); }));
        g.font = `italic 900 24px ${FONT_T}`; strokeText(g, varName(ch, 5), cx + cw / 2, fy + 40, '#ffffff', OUTLINE, 5);
        g.font = `700 15px ${FONT_UI}`; g.fillStyle = ch.colors.accent; g.fillText(ch.name + '  ·  ' + (ARC[id] ? ARC[id].jp : '真夜中のドレス'), cx + cw / 2, fy + 66);
      });
    }).toDataURL();
  });
  require('fs').writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log('errors', errors); await browser.close();
})();
