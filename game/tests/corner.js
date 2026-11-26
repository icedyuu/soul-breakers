// Corner escape: node corner.js — every fighter, cornered at the left wall with each opponent pressing, holds up-forward and must land on the far side.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  const r = await page.evaluate(() => {
    const out = [];
    for (const A of CHARS) for (const B of CHARS) {
      // A cornered at left wall, B pressing; A jumps forward (up+right)
      T.start(A.id, B.id, 'training', 0);
      const a = BT.p1, b = BT.p2; BT.cpu = null;
      for (let i=0;i<5;i++) T.frame();
      a.x = 50; b.x = 50 + 60; a.facing = 1; b.facing = -1;
      BT.pushApart && BT.pushApart();
      T.held = new Set(['up','right']); let maxH = 0, land=null;
      for (let f=0; f<90; f++) { T.frame(); maxH = Math.max(maxH, GROUND - a.y); if (f>5 && a.onGround && land===null) { land = f; break; } }
      T.held = new Set();
      out.push({ A: A.id, B: B.id, crossed: a.x > b.x, ax: a.x|0, bx: b.x|0, maxH: maxH|0, land });
    }
    return out;
  });
  const per = {};
  for (const o of r) { per[o.A] = per[o.A] || { ok: 0, n: 0, h: o.maxH, t: o.land }; per[o.A].n++; if (o.crossed) per[o.A].ok++; }
  for (const [k, v] of Object.entries(per)) console.log((v.ok === v.n ? 'ok  ' : 'FAIL') + ' ' + k + ' ' + v.ok + '/' + v.n + ' height ' + v.h + ' airtime ' + v.t);
  const bad = Object.values(per).filter(v => v.ok < v.n).length; console.log(bad ? 'CORNER FAIL ' + bad : 'CORNER PASS');
  console.log('errors', errors.length, errors.slice(0,3));
  await browser.close();
})();
