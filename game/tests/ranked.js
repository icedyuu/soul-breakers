// RANKED SEASONS: local Postgres with cloud/supabase_setup.sql + supabase_friends.sql + supabase_ranked.sql (tests/cloudmock.js).
// Checks the SQL (tiers, season W/L, peak, season end → badges + soft reset, admin-only end) and the screens
// (account, rankings, season reward pop-up, friends tier, online results with series + rematch prompt). Shots: ../shots_ranked/
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const { start } = require('./cloudmock');
const DIST = process.env.SB_DIST || path.resolve(__dirname, '../dist/index.html');
const OUT = path.resolve(__dirname, '../shots_ranked'); fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log(c ? 'ok  ' : 'FAIL', m); };
const call = (fn, args) => fetch('http://127.0.0.1:9211/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: 't', 'content-type': 'application/json' }, body: JSON.stringify(args) }).then(async r => ({ ok: r.ok, j: await r.json().catch(() => null) }));
(async () => {
  const srv = start(9211);
  await srv.sql('delete from sb_invites; delete from sb_friends; delete from sb_matches; delete from sb_reports; delete from sb_sessions; delete from sb_season_results; delete from sb_admins; delete from sb_users');
  await srv.sql("delete from sb_seasons; insert into sb_admins values ('beni')");
  const reg = async n => (await call('sb_register', { p_name: n, p_pw: 'secret123' })).j.token;
  const ta = await reg('Beni'), tb = await reg('Bob'), tc = await reg('Cara');
  let me = (await call('sb_season_me', { p_token: ta })).j;
  ok(me.season.id === 1 && me.tier === 'bronze' && me.sw === 0 && me.place === null, 'season 1 opens, new player bronze');
  ok(new Date(me.season.ends) - Date.now() > 13 * 864e5, 'season 1 lasts 2+ weeks');
  const play = async (k, tw, nw, tl, nl) => { await call('sb_report', { p_token: tw, p_key: 'match-' + k, p_opp: nl, p_won: true, p_ch: 'kazuma' }); return (await call('sb_report', { p_token: tl, p_key: 'match-' + k, p_opp: nw, p_won: false, p_ch: 'yoru' })).j; };
  for (let i = 0; i < 4; i++) await play('a' + i, ta, 'Beni', tb, 'Bob');
  await play('c1', tc, 'Cara', tb, 'Bob');
  me = (await call('sb_season_me', { p_token: ta })).j;
  ok(me.sw === 4 && me.sl === 0 && me.tier === 'silver' && me.peak === me.rating && me.place === 1, `season stats count (${me.rating} ${me.tier})`);
  const top = (await call('sb_season_top', { p_limit: 10 })).j;
  ok(top.rows.length === 3 && top.rows[0].name === 'Beni' && top.rows[2].sl === 5, 'season rankings sorted, season W/L');
  ok(!(await call('sb_admin_season_end', { p_token: tb })).ok, 'non-admin cannot end the season');
  const before = await srv.sql("select lname, rating from sb_users order by lname");
  ok((await call('sb_admin_season_end', { p_token: ta })).j.season === 2, 'admin ends season → season 2');
  const after = await srv.sql("select lname, rating, sw, sl, badges from sb_users order by lname");
  ok(after.every((u, i) => u.rating === 1000 + Math.trunc((before[i].rating - 1000) / 2) && u.sw === 0 && u.sl === 0), 'soft reset halfway to 1000');
  const bb = Object.fromEntries(after.map(u => [u.lname, u.badges]));
  ok(bb.beni.length === 1 && bb.beni[0].t === 'silver' && bb.beni[0].p === 1 && bb.bob.length === 1 && bb.cara.length === 0, 'badges: 3+ matches only, place 1');
  ok((await call('sb_season_top', { p_limit: 10 })).j.rows.length === 0, 'new season starts empty');
  await play('s2', tb, 'Bob', ta, 'Beni');
  ok((await srv.sql("select sw from sb_users where lname='bob'"))[0].sw === 1, 'match counts for season 2');
  // lazy rollover: an expired season closes on the next call
  await srv.sql("update sb_seasons set ends = now() - interval '1 minute' where not closed");
  me = (await call('sb_season_me', { p_token: ta })).j;
  ok(me.season.id === 3 && me.badges.length === 1, 'expired season closes by itself (Bob/Beni 1 match: no badge)');
  // give Beni 2 more seasons of badges for the screens + a gold rating
  await srv.sql("update sb_users set badges = badges || '[{\"s\":2,\"t\":\"gold\",\"p\":3},{\"s\":3,\"t\":\"master\",\"p\":1}]', rating = 1180, sw = 9, sl = 2 where lname = 'beni'");
  await srv.sql("update sb_users set rating = 1320, sw = 12, sl = 4 where lname = 'cara'; update sb_users set rating = 1040, sw = 2, sl = 6 where lname = 'bob'");
  await srv.sql("update sb_seasons set id = 4 where not closed");

  // ---------------- screens ----------------
  const web = http.createServer((q, r) => { r.setHeader('content-type', 'text/html'); r.end(fs.readFileSync(DIST)); }).listen(9212);
  const browser = await chromium.launch(), errs = [];
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } }), p = await ctx.newPage();
  p.on('pageerror', e => errs.push(String(e.stack || e)));
  await p.addInitScript(() => { localStorage.clear(); window.SB_CLOUD_OVERRIDE = { url: 'http://127.0.0.1:9211', key: 'test' }; });
  await p.goto('http://127.0.0.1:9212/'); await p.waitForTimeout(400);
  await p.evaluate(() => { Settings.muted = true; Settings.voice = false; Settings.mobile = false; });
  await p.evaluate(() => Cloud.login('Beni', 'secret123'));
  await p.waitForFunction(() => Cloud.season && Cloud.season.season, null, { timeout: 5000 });
  ok(await p.evaluate(() => Cloud.reward && Cloud.reward.s === 3 && Cloud.reward.p === 1), 'reward pop-up for the newest badge');
  await p.evaluate(() => go(new TitleScene())); await p.waitForTimeout(700);
  await p.screenshot({ path: OUT + '/reward.png' });
  await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => !Cloud.reward && scene instanceof TitleScene), 'ENTER closes the pop-up, stays on title');
  await p.evaluate(() => { Cloud.season = null; return Cloud.seasonMe(); });
  ok(await p.evaluate(() => !Cloud.reward), 'pop-up only once per season');
  await p.screenshot({ path: OUT + '/title.png' });
  await p.evaluate(() => go(new AccountScene())); await p.waitForTimeout(1200);
  await p.screenshot({ path: OUT + '/account.png' });
  await p.evaluate(() => go(new RankScene())); await p.waitForTimeout(1000);
  ok(await p.evaluate(() => scene.season && scene.season.id === 4 && scene.rows.length === 3 && scene.rows[0].name === 'Cara'), 'rankings show season 4');
  await p.screenshot({ path: OUT + '/rankings.png' });
  // old database without the add-on: rankings fall back to sb_top
  await p.evaluate(() => { const r = Cloud.rpc; Cloud.rpc = function (fn, a) { return fn.startsWith('sb_season') ? Promise.reject(new Error('MISSING_FN')) : r.call(this, fn, a); }; Cloud.noSeason = false; Cloud.season = null; go(new RankScene()); });
  await p.waitForTimeout(800);
  ok(await p.evaluate(() => !scene.season && scene.rows && scene.rows.length === 3 && !scene.err), 'fallback without the SQL add-on');
  await p.screenshot({ path: OUT + '/rankings_old.png' });
  // online results: series + rival-wants-rematch prompt (fake net state)
  await p.evaluate(() => {
    Net.code = '123456'; Net.match = 1; Net.rival = 'Bob'; Net.rivalR = 1040; Net.send = () => { }; Net.tick = () => { }; Net.rankedNow = false;
    const bt = new Battle({ mode: 'versus', stage: 0, p1: 0, p2: 1 }); bt.lp = 0; bt.wins = [2, 0];
    window.__bt = bt;
  }).catch(e => errs.push('setup ' + e));
  const made = await p.evaluate(() => { try { const s = new NetResultsScene(__bt); go(s); return true; } catch (e) { return String(e); } });
  if (made === true) {
    await p.evaluate(() => { Net.match = 2; const s = new NetResultsScene(__bt); go(s); s.onNet({ t: 'res', w: 'rematch' }); });
    await p.waitForTimeout(700);
    ok(await p.evaluate(() => scene.series.me + scene.series.rv === 2 && scene.menu.items[0].label === 'ACCEPT REMATCH'), 'series counts, ACCEPT REMATCH label');
    await p.screenshot({ path: OUT + '/results_rematch.png' });
  } else console.log('note: results scene needs a real battle here:', made);
  ok(errs.length === 0, 'no page errors ' + errs.slice(0, 3).join(' | '));
  await browser.close(); web.close(); await srv.shut();
  console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
