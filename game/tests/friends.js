// FRIENDS: two browsers (Alice + Bob) on the local account mock (tests/cloudmock.js, local Postgres with
// cloud/supabase_setup.sql + cloud/supabase_friends.sql) and a local PeerJS server.
// Request → accept, online status, remove confirm, invite pop-up → JOIN connects both into the online select,
// decline shows on the inviter, guests/logged-out screens, keyboard navigation. Shots: ../shots_friends/
// env: SB_PEER_MODULE=path/to/node_modules/peer
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const { start } = require('./cloudmock');
const DIST = process.env.SB_DIST || path.resolve(__dirname, '../dist/index.html');
const PEER_MOD = process.env.SB_PEER_MODULE || '/tmp/claude-0/sbnode/node_modules/peer';
const OUT = path.resolve(__dirname, '../shots_friends'); fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log(c ? 'ok  ' : 'FAIL', m); };
(async () => {
  const { PeerServer } = require(PEER_MOD);
  const ps = PeerServer({ port: 9133, host: '127.0.0.1', path: '/' });
  const web = http.createServer((q, r) => { const f = q.url.split('?')[0]; if (f === '/' || f === '/index.html') { r.setHeader('content-type', 'text/html'); r.end(fs.readFileSync(DIST)); } else { r.statusCode = 404; r.end(); } }).listen(9134);
  const srv = start(9207);
  await srv.sql('delete from sb_invites; delete from sb_friends; delete from sb_matches; delete from sb_reports; delete from sb_sessions; delete from sb_users');
  const browser = await chromium.launch();
  const errs = [];
  const mk = async name => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } }), p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ': ' + (e.stack || e)));
    p.on('console', m => { if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errs.push(name + ' console: ' + m.text()); });
    await p.addInitScript(() => { localStorage.clear(); window.SB_CLOUD_OVERRIDE = { url: 'http://127.0.0.1:9207', key: 'test' }; });
    await p.goto('http://127.0.0.1:9134/?peerhost=127.0.0.1&peerport=9133'); await p.waitForTimeout(400);
    await p.evaluate(() => { Settings.muted = true; Settings.voice = false; Settings.mobile = false; });
    return p;
  };
  const click = async (p, x, y) => { const b = await p.evaluate(() => { const r = canvas.getBoundingClientRect(); return { l: r.left, t: r.top, k: r.width / W }; }); await p.mouse.click(b.l + x * b.k, b.t + y * b.k); await sleep(150); };
  const until = async (p, fn, ms = 8000, arg) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg)) return true; await sleep(150); } return false; };
  const A = await mk('A'), Bp = await mk('B');

  // logged out: FRIENDS screen asks to log in
  await A.evaluate(() => go(new FriendsScene()));
  await sleep(200); await A.screenshot({ path: OUT + '/loggedout.png' });
  ok(await A.evaluate(() => !Cloud.on && document.querySelectorAll('input').length === 0), 'logged out: no field, login prompt');
  await A.evaluate(() => go(new TitleScene()));

  await A.evaluate(() => Cloud.register('Alice', 'secret1')); await Bp.evaluate(() => Cloud.register('Bob_2', 'secret2'));
  await srv.sql("insert into sb_users (name, lname, pw) values ('Carl', 'carl', 'x')");
  // online lobby has FRIENDS; Alice opens it and adds Bob through the text field
  await A.evaluate(() => go(new NetLobbyScene())); await sleep(200);
  ok(await A.evaluate(() => scene.menu.items.some(i => i.id === 'friends')), 'ONLINE lobby has FRIENDS');
  await A.screenshot({ path: OUT + '/lobby.png' });
  await A.evaluate(() => { scene.menu.sel = scene.menu.items.findIndex(i => i.id === 'friends'); }); await A.keyboard.press('Enter'); await sleep(200);
  ok(await A.evaluate(() => scene instanceof FriendsScene), 'lobby → FRIENDS');
  await A.locator('input').fill('nobody'); await A.locator('input').press('Enter'); await sleep(500);
  ok(await A.evaluate(() => scene.isErr && /No player/.test(scene.msg)), 'unknown name → error');
  await A.locator('input').fill('alice'); await A.locator('input').press('Enter'); await sleep(500);
  ok(await A.evaluate(() => scene.isErr), 'adding yourself → error');
  await A.locator('input').fill('bob_2'); await A.locator('input').press('Enter');
  ok(await until(A, () => Friends.list && Friends.list.outgoing.includes('Bob_2')), 'request shows as sent');
  await A.locator('input').fill('Carl'); await A.locator('input').press('Enter'); await sleep(600);
  // Bob: account menu → FRIENDS, sees the request, accepts with keyboard
  await Bp.evaluate(() => go(new AccountScene())); await sleep(300);
  ok(await Bp.evaluate(() => scene.menu.items.some(i => i.id === 'friends')), 'ACCOUNT menu has FRIENDS');
  await Bp.evaluate(() => { const m = scene.menu; m.sel = m.items.findIndex(i => i.id === 'friends'); }); await Bp.keyboard.press('Enter'); await sleep(200);
  ok(await until(Bp, () => scene instanceof FriendsScene && Friends.list && Friends.list.incoming.includes('Alice')), 'Bob sees request');
  await Bp.screenshot({ path: OUT + '/request.png' });
  await Bp.keyboard.press('Enter');
  ok(await until(Bp, () => Friends.list && Friends.list.friends.some(f => f.name === 'Alice' && f.online)), 'accepted: Alice listed + online');
  ok(await until(A, () => Friends.list && Friends.list.friends.some(f => f.name === 'Bob_2' && f.online), 8000), 'Alice sees Bob online');
  await sleep(300); await A.screenshot({ path: OUT + '/list.png' });
  // offline status: an old ping counts as offline
  await srv.sql("update sb_users set online_at = now() - interval '2 minutes' where lname = 'carl'");
  await srv.sql("insert into sb_friends (uid, fid) select (select id from sb_users where lname='carl'), (select id from sb_users where lname='alice')");
  ok(await until(A, () => Friends.list.friends.some(f => f.name === 'Carl' && !f.online)), 'Carl (stale ping) is offline');
  ok(await A.evaluate(() => scene.rows().find(r => r.name === 'Carl').acts.length === 1), 'offline friend: no INVITE');
  // title chip line
  await Bp.evaluate(() => go(new TitleScene())); await sleep(300); await Bp.screenshot({ path: OUT + '/title.png' });

  // Alice invites Bob → pop-up on Bob's title → JOIN → both in the online select
  await A.evaluate(() => { const rs = scene.rows(), i = rs.findIndex(r => r.name === 'Bob_2'); scene.sel = i; scene.act = 0; }); await A.keyboard.press('Enter');
  ok(await until(A, () => scene instanceof FriendInviteScene && scene.inv === 'sent', 10000), 'invite: room opened + invite sent');
  await A.screenshot({ path: OUT + '/inviting.png' });
  ok(await until(Bp, () => Friends.toast && Friends.toast.from === 'Alice', 25000), 'Bob gets the invite pop-up');
  await sleep(400); await Bp.screenshot({ path: OUT + '/toast.png' });
  const bt = await Bp.evaluate(() => Friends.tBtn(1)); await click(Bp, bt.x + 20, bt.y + 20);
  ok(await Bp.evaluate(() => !Friends.toast && scene instanceof TitleScene), 'NO closes the pop-up');
  ok(await until(A, () => scene.inv === 'no', 10000), 'Alice sees "said no"');
  await A.screenshot({ path: OUT + '/declined.png' });
  await A.keyboard.press('Escape'); await sleep(300);
  ok(await A.evaluate(() => scene instanceof FriendsScene && Net.status === 'idle'), 'back from invite → FRIENDS, room closed');
  // second invite, accepted from Bob's FRIENDS list
  await A.evaluate(() => { const rs = scene.rows(); scene.sel = rs.findIndex(r => r.name === 'Bob_2'); scene.act = 0; }); await A.keyboard.press('Enter');
  ok(await until(A, () => scene.inv === 'sent', 10000), 'second invite sent');
  await Bp.evaluate(() => go(new FriendsScene()));
  ok(await until(Bp, () => scene.rows().some(r => r.k === 'inv'), 10000), 'invite listed on top of Bob\'s FRIENDS');
  await Bp.screenshot({ path: OUT + '/invite_row.png' });
  await Bp.evaluate(() => { scene.sel = 0; scene.act = 0; }); await Bp.keyboard.press('Enter');
  ok(await until(Bp, () => scene instanceof NetSelectScene, 15000) && await until(A, () => scene instanceof NetSelectScene, 15000), 'JOIN connects both into the online select');
  await sleep(300); await A.screenshot({ path: OUT + '/connected.png' });
  ok(await until(A, () => Friends.status() === 'match'), 'status in match');
  // SPECTATE: Cara (friend of Alice) sees WATCH on Alice's row and joins the room as a spectator
  const C = await mk('C');
  await C.evaluate(() => Cloud.register('Cara', 'secret1')); await C.evaluate(() => Friends.call('sb_friend_add', { p_name: 'Alice' }));
  await A.evaluate(() => Friends.call('sb_friend_add', { p_name: 'Cara' }));
  const code = await A.evaluate(() => Net.code);
  ok(await until(A, c => Friends.pubRoom === c, 8000, code), 'Alice publishes her room code');
  const dbRoom = await srv.sql("select room from sb_users where lname = 'alice'"); ok(dbRoom[0].room === code, 'room stored on the server');
  const strangers = await A.evaluate(t => Cloud.rpc('sb_friend_rooms', { p_token: t }), await A.evaluate(() => Cloud.tok));
  ok(Array.isArray(strangers) && !strangers.some(x => x.name === 'Cara'), 'rooms only of friends in a fight');
  await C.evaluate(() => go(new FriendsScene()));
  ok(await until(C, () => scene.rows().some(r => r.name === 'Alice' && r.acts[0][0] === 'watch'), 15000), 'Cara sees WATCH next to Alice');
  await sleep(300); await C.screenshot({ path: OUT + '/watch_row.png' });
  await C.evaluate(() => { const rs = scene.rows(); scene.sel = rs.findIndex(r => r.name === 'Alice'); scene.act = 0; }); await C.keyboard.press('Enter');
  ok(await until(C, () => scene instanceof SpectateScene && scene.state === 'waiting', 15000), 'WATCH connects Cara as a spectator');
  ok(await A.evaluate(() => SpecHost.conns.length === 1), 'host has one spectator');
  await sleep(300); await C.screenshot({ path: OUT + '/spectate_wait.png' });
  const left = await srv.sql('select count(*)::int n from sb_invites where ans is null'); ok(left[0].n === 0, 'no open invites left');
  await A.evaluate(() => { Net.close(); go(new TitleScene()); }); await Bp.evaluate(() => { Net.close(); go(new TitleScene()); });
  ok(await until(C, () => scene instanceof SpectateScene && scene.state === 'done', 10000), 'spectator told when the room closes');
  ok(await until(A, () => Friends.pubRoom === '', 8000), 'room code cleared after leaving');

  // remove needs two presses
  await A.evaluate(() => go(new FriendsScene())); await until(A, () => Friends.list);
  await A.evaluate(() => { const rs = scene.rows(), i = rs.findIndex(r => r.name === 'Carl'); scene.sel = i; scene.act = 0; });
  await A.keyboard.press('Enter'); await sleep(300);
  ok(await A.evaluate(() => scene.confirm === 'Carl' && Friends.list.friends.some(f => f.name === 'Carl')), 'REMOVE asks first');
  await A.keyboard.press('Enter');
  ok(await until(A, () => !Friends.list.friends.some(f => f.name === 'Carl')), 'second REMOVE removes');
  // can't invite a non-friend through the RPC
  const tok = await A.evaluate(() => Cloud.tok);
  const r = await A.evaluate(t => Cloud.rpc('sb_invite', { p_token: t, p_name: 'Carl', p_room: '123456' }).then(() => 'ok', e => e.message), tok);
  ok(r === 'NOT_FRIENDS', 'invite to non-friend rejected');
  const r2 = await A.evaluate(t => Cloud.rpc('sb_invite', { p_token: t, p_name: 'Bob_2', p_room: 'abc' }).then(() => 'ok', e => e.message), tok);
  ok(r2 === 'BAD_ROOM', 'bad room code rejected');
  // logout clears the list
  await A.evaluate(() => { Cloud.logout(); go(new TitleScene()); }); await sleep(1500);
  ok(await A.evaluate(() => Friends.list === null), 'logout clears friends');
  // phone layout screenshot
  await Bp.setViewportSize({ width: 844, height: 390 }); await Bp.evaluate(() => go(new FriendsScene())); await sleep(1500); await Bp.screenshot({ path: OUT + '/phone.png' });

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await browser.close(); await srv.shut(); web.close(); ps.close && ps.close();
  console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
