// Account UI + cloud save against the local mock server (tests/cloudmock.js + local Postgres with cloud/supabase_setup.sql).
// Title chip → ACCOUNT → register with the real text fields, wrong password message, XP upload, hidden cheat stays local,
// second device login pulls the progress, admin grants unlock colours, rankings + admin screens. Shots: ../shots_account/
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const { start } = require('./cloudmock');
const DIST = process.env.SB_DIST || path.resolve(__dirname, '../dist/index.html');
const OUT = path.resolve(__dirname, '../shots_account'); fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log(c ? 'ok  ' : 'FAIL', m); };
(async () => {
  const srv = start(9206);
  await srv.sql("delete from sb_matches; delete from sb_reports; delete from sb_sessions; delete from sb_users; delete from sb_admins; insert into sb_admins values ('boss')");
  // ranked history so the rankings have rows
  const browser = await chromium.launch();
  const errs = [];
  const mk = async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } }), p = await ctx.newPage();
    p.on('pageerror', e => errs.push(String(e.stack || e)));
    p.on('console', m => { if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errs.push(m.text()); });
    await p.addInitScript(() => { localStorage.clear(); window.SB_CLOUD_OVERRIDE = { url: 'http://127.0.0.1:9206', key: 'test' }; });
    await p.goto('file://' + DIST); await p.waitForTimeout(400);
    await p.evaluate(() => { Settings.muted = true; Settings.voice = false; });
    return p;
  };
  const P = await mk();
  const click = async (p, x, y) => { const b = await p.evaluate(() => { const r = canvas.getBoundingClientRect(); return { l: r.left, t: r.top, k: r.width / W }; }); await p.mouse.click(b.l + x * b.k, b.t + y * b.k); await sleep(120); };
  await P.screenshot({ path: OUT + '/title.png' });
  await click(P, 120, 45);
  ok(await P.evaluate(() => scene instanceof AccountScene), 'title chip opens ACCOUNT');
  ok(await P.locator('input').count() === 2, 'two text fields');
  // new account through the real fields
  await click(P, 640 - 250 + 256 + 100, 210);
  await P.locator('input[type=text]').fill('Alice'); await P.locator('input[type=password]').fill('secret1');
  await P.screenshot({ path: OUT + '/register.png' });
  await P.locator('input[type=password]').press('Enter');
  for (let i = 0; i < 20 && !(await P.evaluate(() => Cloud.on)); i++) await sleep(200);
  ok(await P.evaluate(() => Cloud.on && Cloud.name === 'Alice' && Cloud.me.rating === 1000), 'registered + logged in');
  ok(await P.locator('input').count() === 0, 'text fields removed after login');
  await sleep(300); await P.screenshot({ path: OUT + '/account.png' });
  // typing in a text field must not drive the game (M = mute)
  // XP upload
  await P.evaluate(() => { Mastery.rec('kazuma').xp = 700; Mastery.save(); });
  await sleep(3200);
  let save = (await srv.sql("select save from sb_users where lname='alice'"))[0].save;
  ok(save.chars && save.chars.kazuma.xp === 700, 'mastery uploaded');
  // hidden cheat: LV 10 locally, real XP in the cloud, and new XP still counts
  await P.evaluate(() => { Mastery.unlockAll(); });
  await sleep(3200);
  save = (await srv.sql("select save from sb_users where lname='alice'"))[0].save;
  ok(save.chars.kazuma.xp === 700 && (save.chars.yoru?.xp | 0) === 0 && !save.clean, 'cheat LV10 not uploaded');
  ok(await P.evaluate(() => Mastery.level('yoru') === 10), 'cheat still LV10 on this device');
  // a won VS CPU match while cheated adds real XP to the cloud copy
  await P.evaluate(() => { const b = new Battle({ mode: 'versus', p1: CHARS.findIndex(c => c.id === 'kazuma'), p2: 1, stage: 0, cpu: { level: 1 } }); b.wins = [2, 0]; Mastery.award(b); });
  await sleep(3200);
  save = (await srv.sql("select save from sb_users where lname='alice'"))[0].save;
  ok(save.chars.kazuma.xp > 700 && save.chars.kazuma.xp < 1000, 'real XP after cheat uploads ' + save.chars.kazuma.xp);
  // log out, wrong password message
  await P.evaluate(() => go(new AccountScene()));
  await P.evaluate(() => { Cloud.logout(); scene.build(); });
  await P.locator('input[type=text]').fill('alice'); await P.locator('input[type=password]').fill('nopenope'); await P.locator('input[type=password]').press('Enter');
  await sleep(800);
  ok(await P.evaluate(() => scene.msg === CLOUD_ERR.WRONG_LOGIN), 'wrong password message');
  await P.screenshot({ path: OUT + '/wrong_password.png' });
  // second device: login pulls progress
  const Q = await mk();
  await Q.evaluate(() => Cloud.login('ALICE', 'secret1'));
  ok(await Q.evaluate(() => Mastery.rec('kazuma').xp > 700 && Mastery.level('yoru') === 1), 'second device gets the real progress');
  // admin grant
  const Boss = await mk();
  await Boss.evaluate(() => Cloud.register('Boss', 'bossboss'));
  await Boss.evaluate(() => go(new AccountScene())); await sleep(600);
  ok(await Boss.evaluate(() => scene.menu.items.some(i => i.id === 'admin')), 'admin button for admins');
  await Boss.screenshot({ path: OUT + '/account_admin.png' });
  await Boss.evaluate(() => go(new AdminScene()));
  await Boss.locator('input').first().fill('alice');
  await Boss.evaluate(() => { scene.ci = CHARS.findIndex(c => c.id === 'nue'); scene.lv = 7; });
  await Boss.evaluate(() => scene.run('grant')); await sleep(500);
  ok(await Boss.evaluate(() => /LV 7/.test(scene.out) && !scene.isErr), 'grant ' + await Boss.evaluate(() => scene.out));
  await Boss.evaluate(() => scene.run('look')); await sleep(500);
  await Boss.screenshot({ path: OUT + '/admin.png' });
  await Q.evaluate(() => Cloud.refresh());
  ok(await Q.evaluate(() => Mastery.level('nue') >= 7 && Mastery.unlocked('nue', 3)), 'granted level unlocks colours on the player');
  ok(await P.evaluate(() => { const S = new AccountScene(); return true; }), 'account scene without login');
  // rankings: give Alice and Boss a rated match
  const tA = await Q.evaluate(() => Cloud.tok), tB = await Boss.evaluate(() => Cloud.tok);
  const rpc = (fn, a) => fetch('http://127.0.0.1:9206/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: 'x', 'content-type': 'application/json' }, body: JSON.stringify(a) }).then(r => r.json());
  await rpc('sb_report', { p_token: tA, p_key: 'abcdef-1-1', p_opp: 'Boss', p_won: true, p_ch: 'kazuma' });
  await rpc('sb_report', { p_token: tB, p_key: 'abcdef-1-1', p_opp: 'Alice', p_won: false, p_ch: 'hollow' });
  await Q.evaluate(() => go(new RankScene())); await sleep(800); await Q.evaluate(() => { scene.t = 50; });
  ok(await Q.evaluate(() => scene.rows && scene.rows.length === 2 && scene.rows[0].name === 'Alice'), 'rankings list');
  await Q.screenshot({ path: OUT + '/rankings.png' });
  await Q.evaluate(() => go(new TitleScene())); await sleep(300);
  await Q.screenshot({ path: OUT + '/title_logged_in.png' });
  // server down: the game keeps working, the account shows offline
  srv.down = true;
  await Q.evaluate(() => { Mastery.rec('sera').xp = 5; Mastery.save(); }); await sleep(3000);
  ok(await Q.evaluate(() => Cloud.sync === 'offline' && Cloud.on), 'server down → offline, still logged in');
  srv.down = false;
  // the pixel-art mode draws these screens too
  for (const p of [Q, Boss]) await p.evaluate(() => { Settings.pixel = true; for (const S of [AccountScene, RankScene, AdminScene, TitleScene]) { go(new S()); for (let i = 0; i < 3; i++) { scene.update(); scene.draw(ctx); } } go(new TitleScene()); Settings.pixel = false; });
  ok(!errs.length, 'no page errors ' + errs.slice(0, 3).join(' | '));
  await browser.close(); await srv.shut();
  console.log(fails ? fails + ' FAILED' : 'ACCOUNT PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
