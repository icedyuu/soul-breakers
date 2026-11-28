// node hf_look.js [out_dir] : HAUNTED FOUR — the four forms (stance + poses, vector + pixel), the slot art, heads close-up, golden suit
const { open } = require('./harness');
const fs = require('fs');
(async () => {
  const out = process.argv[2] || '/tmp/claude-0/sb/out';
  const { browser, page, errors } = await open();
  const shot = async (name, fn, arg) => { const url = await page.evaluate(fn, arg); fs.writeFileSync(`${out}/${name}.png`, Buffer.from(url.split(',')[1], 'base64')); };
  await shot('hf_lineup', () => {
    const ids = ['bear', 'rabbit', 'chicken', 'fox'], poses = ['stance', 'H', 'sp1', 'sp2f', 'sp2d', 'victory'];
    const cw = 210, rh = 280;
    return mkCanvas(poses.length * cw, ids.length * rh + 40, g => {
      g.fillStyle = '#2a2838'; g.fillRect(0, 0, poses.length * cw, ids.length * rh + 40);
      ids.forEach((id, r) => poses.forEach((ps, i) => {
        const ch = HF_FORMS[id], m = ch.moves[ps], pn = m ? m.poses[1] : ps, x = i * cw + cw / 2, y = r * rh + 250;
        const pal = { ...ch.colors, cup: id === 'chicken' ? 1 : 0, prop: ps === 'sp2f' && id === 'rabbit' ? 'guitar' : ch.colors.prop, eyeGlow: ps === 'sp2d' ? 1 : 0, jaw: ps === 'sp2d' && id === 'fox' ? 1 : 0 };
        drawFigure(g, ch, buildPose(ch, pn), x, y, 1, { T: 0, scale: 1.2, pal });
        g.fillStyle = '#fff'; g.font = '13px sans-serif'; g.fillText(id + ' ' + ps + ' (' + pn + ')', x - 95, y + 22);
      }));
    }).toDataURL();
  });
  await shot('hf_heads', () => {
    const ids = ['bear', 'rabbit', 'chicken', 'fox'];
    return mkCanvas(1200, 380, g => { g.fillStyle = '#1a1626'; g.fillRect(0, 0, 1200, 380);
      ids.forEach((id, i) => { const ch = HF_FORMS[id]; drawFigure(g, ch, buildPose(ch, 'stance'), 150 + i * 300, 600, 1, { T: 0, scale: 2.6, pal: { ...ch.colors, cup: 1 } }); });
    }).toDataURL();
  });
  await shot('hf_slot', () => mkCanvas(900, 320, g => { g.fillStyle = '#1a1626'; g.fillRect(0, 0, 900, 320);
    g.drawImage(HAUNTED.portrait, 10, 10); g.drawImage(HAUNTED.card, 320, 10, 150, 279);
    for (const [i, id] of HF_IDS.entries()) g.drawImage(HF_FORMS[id].portrait, 490 + (i % 2) * 200, 10 + Math.floor(i / 2) * 150, 140, 140);
  }).toDataURL());
  await shot('hf_suit', () => mkCanvas(700, 330, g => { g.fillStyle = '#1a1626'; g.fillRect(0, 0, 700, 330);
    drawFigure(g, HF_SUIT, buildPose(HF_SUIT, 'open'), 150, 300, -1, { T: 0, scale: 1.3 });
    drawFigure(g, HF_SUIT, buildPose(HF_SUIT, 'kneel'), 370, 300, -1, { T: 0, scale: 1.3, pal: { ...HF_SUIT.colors, eyeGlow: 1, sclera: '#f2efe6' } });
    HF_GHOSTS.forEach((G, i) => hfGhost(g, 500 + i * 50, 300, 1, 1, G, 0));
  }).toDataURL());
  console.log('errors', errors); await browser.close();
})();
