// Renders the PWA icons (icon-192/512, maskable, apple-touch) into ../web_icons/ from the game's own art.
const { open } = require('./harness');
const fs = require('fs'), path = require('path'), OUT = path.resolve(__dirname, '../web_icons');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { browser, page, errors } = await open();
  const imgs = await page.evaluate(() => {
    const mk = (S, pad) => {
      const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, S, S); gr.addColorStop(0, '#3a0010'); gr.addColorStop(0.55, '#14040a'); gr.addColorStop(1, '#001a3a'); g.fillStyle = gr; g.fillRect(0, 0, S, S);
      g.save(); g.globalAlpha = 0.3; g.fillStyle = '#ff1a3a'; g.font = `900 ${S * 0.9}px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('魂', S / 2, S * 0.5); g.restore();
      const k = 1 - pad * 2, p = KAZUMA.portrait; g.imageSmoothingEnabled = false;
      g.drawImage(p, S * pad, S * pad * 0.6, S * k, S * k);
      g.font = `italic 900 ${Math.round(S * 0.17 * k)}px ${FONT_T}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      strokeText(g, 'SOUL', S / 2, S * (1 - pad) - S * 0.2 * k, '#ffd84a', OUTLINE, S * 0.025);
      strokeText(g, 'BREAKERS', S / 2, S * (1 - pad) - S * 0.06 * k, '#ffd84a', OUTLINE, S * 0.025);
      return c.toDataURL('image/png');
    };
    return { 'icon-192.png': mk(192, 0.02), 'icon-512.png': mk(512, 0.02), 'icon-512-maskable.png': mk(512, 0.12), 'apple-touch-icon.png': mk(180, 0.02) };
  });
  for (const [n, d] of Object.entries(imgs)) fs.writeFileSync(path.join(OUT, n), Buffer.from(d.split(',')[1], 'base64'));
  console.log('icons', Object.keys(imgs), errors); await browser.close();
})();
