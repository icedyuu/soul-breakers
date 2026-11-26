// mobile viewport + real multitouch (CDP) test of the touch pad: node mobile.js
const { chromium, devices } = require('playwright');
const path = require('path');
const DIST = process.env.SB_DIST || path.resolve(__dirname, '../dist/index.html');
const P1 = process.env.SB_P1 || 'kazuma';   // SB_P1=<fighter id> runs the touch checks with another fighter
const OUT = path.resolve(__dirname, '../shots_mobile' + (P1 === 'kazuma' ? '' : '_' + P1));
require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13 landscape'] });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(String(e.stack || e)));
  await page.addInitScript(() => localStorage.clear());
  await page.goto('file://' + DIST); await page.waitForTimeout(800);
  const cdp = await ctx.newCDPSession(page);
  const L = async (x, y) => page.evaluate(([x, y]) => { const r = canvas.getBoundingClientRect(); return [r.left + x * r.width / W, r.top + y * r.height / H]; }, [x, y]);
  const touch = async (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: await Promise.all(pts.map(async p => { const [x, y] = await L(p.x, p.y); return { x, y, id: p.id }; })) });
  const st = () => page.evaluate(() => ({ s: scene.constructor.name, x: BT && BT.p1 && Math.round(BT.p1.x), state: BT && BT.p1 && BT.p1.state, mk: BT && BT.p1 && BT.p1.moveKey, paused: BT && BT.paused, mobile: Settings.mobile }));
  const waitMove = async () => { for (let i = 0; i < 40; i++) { const s = await st(); if (s.mk) return s; await page.waitForTimeout(25); } return st(); };
  const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) errors.push(m); };
  console.log('default mobile (coarse pointer):', await page.evaluate(() => Settings.mobile));
  await page.evaluate(() => { Settings.mobile = false; });
  await page.screenshot({ path: OUT + '/title_off.png' });
  // tap MOBILE toggle on the title
  await page.tap('canvas', { position: { x: (await L(1022, 45))[0] - (await page.evaluate(() => canvas.getBoundingClientRect().left)), y: (await L(1022, 45))[1] - (await page.evaluate(() => canvas.getBoundingClientRect().top)) } });
  await page.waitForTimeout(200);
  ok((await st()).mobile === true, 'tap on MOBILE toggles it on');
  await page.screenshot({ path: OUT + '/title_on.png' });
  // start VS CPU battle (Kazuma vs Goro, Easy)
  await page.evaluate(id => { go(new Battle({ mode: 'versus', stage: 0, p1: Math.max(0, CHARS.findIndex(c => c.id === id)), p2: 3, cpu: { level: 0 } })); }, P1);
  await page.waitForTimeout(300);
  await touch('touchStart', [{ x: 640, y: 400, id: 9 }]); await touch('touchEnd', []);   // tap skips intro
  await page.waitForTimeout(200);
  await page.evaluate(() => { BT.phase = 'fight'; BT.pf = 0; BT.cpu = null; BT.inputs[1].virtual = { l: 0, r: 0, u: 0, d: 0 }; BT.p1.setState('idle'); BT.p2.x = BT.p1.x + 600; });
  await page.waitForTimeout(100);
  let x0 = (await st()).x;
  await touch('touchStart', [{ x: 175, y: 560, id: 1 }]); await touch('touchMove', [{ x: 265, y: 560, id: 1 }]);
  await page.waitForTimeout(500); let s = await st(); ok(s.x > x0 + 40, `stick right walks forward (${x0} → ${s.x})`);
  await page.screenshot({ path: OUT + '/battle_walk.png' });
  // stick held + tap L with a 2nd finger (multitouch) -> walking attack
  await touch('touchEnd', []); await page.waitForTimeout(200);
  await touch('touchStart', [{ x: 900, y: 612, id: 2 }]); await page.waitForTimeout(40); s = await st(); await touch('touchEnd', []);
  ok(s.state === 'attack' && s.mk === 'L', `L button → ${s.state}/${s.mk}`);
  await page.waitForTimeout(600);
  // SP1 + stick forward => ↓→SP1 (sp1f)
  await touch('touchStart', [{ x: 175, y: 560, id: 1 }]); await touch('touchMove', [{ x: 260, y: 560, id: 1 }]); await page.waitForTimeout(60);
  await touch('touchStart', [{ x: 260, y: 560, id: 1 }, { x: 950, y: 496, id: 3 }]); await page.waitForTimeout(150); s = await st();
  await touch('touchEnd', []);
  ok(s.mk === 'sp1f', `SP1 + forward → ${s.mk}`);
  await page.screenshot({ path: OUT + '/battle_sp1f.png' });
  await page.evaluate(() => { BT.p1.setState('idle'); BT.p1.cd = {}; BT.p1.moveKey = null; BT.p1.reb = 60; BT.p1.time = 60; }); await page.waitForTimeout(300);
  // SP1 + back => counter
  await touch('touchStart', [{ x: 175, y: 560, id: 1 }]); await touch('touchMove', [{ x: 90, y: 560, id: 1 }]); await page.waitForTimeout(60);
  await touch('touchStart', [{ x: 90, y: 560, id: 1 }, { x: 950, y: 496, id: 3 }]); s = await waitMove(); await touch('touchEnd', []);
  ok(s.mk === 'counter', `SP1 + back → ${s.mk}`);
  await page.evaluate(() => { BT.p1.setState('idle'); BT.p1.cd = {}; BT.p1.moveKey = null; BT.p1.lim = 100; BT.p1.limT = BT.p1.T + 9999; if (BT.p1.ch.id === 'hollow') BT.p1.ch.applyTrial(BT.p1, { authority: 60 }); BT.p1.reb = 60; BT.p1.time = 60; }); await page.waitForTimeout(300);
  // SP2 + down => sp2d
  await touch('touchStart', [{ x: 175, y: 560, id: 1 }]); await touch('touchMove', [{ x: 175, y: 650, id: 1 }]); await page.waitForTimeout(60);
  await touch('touchStart', [{ x: 175, y: 650, id: 1 }, { x: 1062, y: 470, id: 4 }]); s = await waitMove(); await touch('touchEnd', []);
  ok(s.mk === 'sp2d', `SP2 + down → ${s.mk}`);
  await page.evaluate(() => { BT.p1.setState('idle'); BT.p1.cd = {}; BT.p1.moveKey = null; }); await page.waitForTimeout(300);
  // plain SP1 (stick neutral)
  await touch('touchStart', [{ x: 950, y: 496, id: 3 }]); s = await waitMove(); await touch('touchEnd', []);
  ok(s.mk === 'sp1', `SP1 neutral → ${s.mk}`);
  await page.evaluate(() => { BT.p1.setState('idle'); BT.p1.cd = {}; BT.p1.moveKey = null; BT.p2.x = BT.p1.x + 160; BT.p1.meter = 100; }); await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + '/battle_ultready.png' });
  // ULT
  await touch('touchStart', [{ x: 1186, y: 350, id: 5 }]); s = await waitMove(); await page.waitForTimeout(100); await touch('touchEnd', []);
  const ult = await page.evaluate(() => !!(BT.freeze || BT.cine || (BT.p1.move && BT.p1.move.ult)));
  ok(ult, `ULT button → ult (${s.mk})`);
  await page.waitForTimeout(4000);
  await page.evaluate(() => { BT.cine = null; BT.freeze = null; BT.p1.setState('idle'); });
  // block (hold)
  await touch('touchStart', [{ x: 1214, y: 452, id: 6 }]); await page.waitForTimeout(100);
  ok(await page.evaluate(() => BT.inputs[0].held.block), 'BLOCK held');
  await touch('touchEnd', []);
  // jump: stick up
  await touch('touchStart', [{ x: 175, y: 560, id: 1 }]); await touch('touchMove', [{ x: 175, y: 460, id: 1 }]); await page.waitForTimeout(150);
  ok(await page.evaluate(() => !BT.p1.onGround), 'stick up jumps'); await touch('touchEnd', []);
  await page.waitForTimeout(800);
  // pause button, then RESUME via normal tap (mouse emulation)
  await touch('touchStart', [{ x: 640, y: 116, id: 7 }]); await touch('touchEnd', []); await page.waitForTimeout(100);
  ok((await st()).paused, 'pause button pauses'); await page.screenshot({ path: OUT + '/paused.png' });
  const rr = await page.evaluate(() => { const r = BT.pauseMenu.rect(0), b = canvas.getBoundingClientRect(); return { x: (r.x + r.w / 2) * b.width / W, y: (r.y + r.h / 2) * b.height / H }; });
  await page.tap('canvas', { position: rr }); await page.waitForTimeout(150);
  ok(!(await st()).paused, 'tap RESUME unpauses');
  // 2P versus: pad must not attach, keyboard still drives P1
  await page.evaluate(() => go(new Battle({ mode: 'versus', stage: 1, p1: 1, p2: 2 })));
  ok(await page.evaluate(() => !BT.touch && BT.inputs[0].virtual === null), '2P versus: no touch pad');
  // training: pad + reset button
  await page.evaluate(() => go(new Battle({ mode: 'training', stage: 2, p1: 11, p2: 0 }))); await page.waitForTimeout(300);
  ok(await page.evaluate(() => BT.touch), 'training: touch pad on');
  await page.screenshot({ path: OUT + '/training.png' });
  // portrait hint
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + '/portrait.png' });
  console.log('errors', errors);
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
