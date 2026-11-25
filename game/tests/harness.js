// Shared headless harness for Soul Breakers
const { chromium } = require('playwright');
const path = require('path');
const DIST = process.env.SB_DIST || path.resolve(__dirname, '../dist/index.html');
async function open(opts = {}) {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.stack || e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => { window.__raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; localStorage.clear(); });
  await page.goto('file://' + DIST);
  await page.waitForTimeout(300);
  await page.evaluate(MOB => {
    Settings.voice = false; Settings.muted = true; Settings.mobile = MOB;
    window.T = {
      idx: id => CHARS.findIndex(c => c.id === id),
      start(p1, p2, mode = 'training', stage = 0) { go(new Battle({ mode, stage, p1: T.idx(p1), p2: T.idx(p2) })); if (mode === 'versus') { BT.phase = 'fight'; BT.pf = 0; BT.p1.setState('idle'); BT.p2.setState('idle'); } },
      held: new Set(),
      frame(press = []) {
        const b1 = Settings.binds[1];
        Keys.down = new Set([...T.held].map(a => b1[a] || a)); for (const a of press) { Keys.pressed.add(b1[a] || a); Keys.down.add(b1[a] || a); }
        scene.update(); Keys.pressed.clear();
      },
      run(n, press = []) { for (let i = 0; i < n; i++) T.frame(i === 0 ? press : []); },
      draw() { ctx.setTransform(VIEW_K, 0, 0, VIEW_K, 0, 0); ctx.imageSmoothingEnabled = !Settings.pixel; ctx.save(); scene.draw(ctx); ctx.restore(); },
    };
  }, !!process.env.SB_MOBILE);
  return { browser, page, errors };
}
module.exports = { open };
