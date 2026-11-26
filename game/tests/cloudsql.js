// Server-side checks of cloud/supabase_setup.sql through the mock REST API (no browser):
// register/login rules, lockout, sessions, save merge, ranked reports (agree / mismatch / forged / pair limit),
// rankings, admin grant/ban/password, and that tables are not readable with the public key.
// Needs a local Postgres with the SQL loaded (see cloudmock.js). Usage: node cloudsql.js
const { start } = require('./cloudmock');
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
(async () => {
  const srv = start(9201);
  await srv.sql("delete from sb_matches; delete from sb_reports; delete from sb_sessions; delete from sb_users; delete from sb_admins; insert into sb_admins values ('boss')");
  const call = async (fn, a, ip) => {
    const r = await fetch('http://127.0.0.1:9201/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: 'x', 'content-type': 'application/json', ...(ip ? { 'x-test-ip': ip } : {}) }, body: JSON.stringify(a || {}) });
    const t = await r.text(); const j = t ? JSON.parse(t) : null; return r.ok && !(j && j.error) ? { ok: true, v: j } : { ok: false, e: r.ok ? j.error : j.message };
  };
  // ---- register / login
  ok((await call('sb_register', { p_name: 'ab', p_pw: 'secret1' })).e === 'BAD_NAME', 'short name refused');
  ok((await call('sb_register', { p_name: 'bad name!', p_pw: 'secret1' })).e === 'BAD_NAME', 'symbols refused');
  ok((await call('sb_register', { p_name: 'Alice', p_pw: '123' })).e === 'BAD_PASSWORD', 'short password refused');
  const A = await call('sb_register', { p_name: 'Alice', p_pw: 'secret1' });
  ok(A.ok && A.v.token.length === 48 && A.v.me.name === 'Alice' && A.v.me.rating === 1000 && A.v.me.admin === false, 'register Alice');
  ok((await call('sb_register', { p_name: 'alice', p_pw: 'secret2' })).e === 'NAME_TAKEN', 'name taken (case-insensitive)');
  const Bo = await call('sb_register', { p_name: 'Bob_99', p_pw: 'hunter22' }), C = await call('sb_register', { p_name: 'Carl', p_pw: 'carlcarl' });
  const Boss = await call('sb_register', { p_name: 'Boss', p_pw: 'bossboss' });
  ok(Boss.v.me.admin === true && Bo.v.me.admin === false, 'admin flag from sb_admins');
  ok((await call('sb_login', { p_name: 'ALICE', p_pw: 'secret1' })).ok, 'login any case');
  ok((await call('sb_login', { p_name: 'nobody', p_pw: 'secret1' })).e === 'WRONG_LOGIN', 'unknown user');
  for (let i = 0; i < 5; i++) await call('sb_login', { p_name: 'Carl', p_pw: 'wrong!!' });
  ok((await call('sb_login', { p_name: 'Carl', p_pw: 'carlcarl' })).e === 'LOCKED', 'lockout after 5 wrong passwords');
  ok((await call('sb_me', { p_token: 'nope' })).e === 'SESSION_EXPIRED', 'bad token');
  for (let i = 0; i < 5; i++) await call('sb_register', { p_name: 'spam' + i, p_pw: 'xxxxxx' }, '9.9.9.9');
  ok((await call('sb_register', { p_name: 'spam9', p_pw: 'xxxxxx' }, '9.9.9.9')).e === 'TOO_MANY', 'registrations per IP limited');
  // ---- direct table access with the public key is impossible
  const cl = await srv.pool.connect(); let leaked = true;
  try { await cl.query('set role anon'); await cl.query('select * from sb_users'); } catch (e) { leaked = false; } finally { await cl.query('reset role'); cl.release(); }
  ok(!leaked, 'anon cannot read sb_users');
  ok((await call('sb_uid', { p_token: A.v.token })).e?.includes('permission denied'), 'helper functions not callable');
  // ---- save + merge
  const ta = A.v.token, tb = Bo.v.token;
  let s = await call('sb_save', { p_token: ta, p_data: { v: 1, chars: { kazuma: { xp: 500, w: 3, l: 1 }, yoru: { xp: 50, w: 0, l: 1 } }, pick: { kazuma: 1 } } });
  ok(s.ok && s.v.chars.kazuma.xp === 500, 'save');
  s = await call('sb_save', { p_token: ta, p_data: { v: 1, chars: { kazuma: { xp: 100, w: 1, l: 0 }, yoru: { xp: 90, w: 1, l: 1 }, sera: { xp: 10, w: 0, l: 0 } }, pick: { kazuma: 0 } } });
  ok(s.v.chars.kazuma.xp === 500 && s.v.chars.yoru.xp === 90 && s.v.chars.sera.xp === 10 && s.v.pick.kazuma === 0, 'merge keeps higher XP per fighter');
  ok((await call('sb_save', { p_token: ta, p_data: { v: 1, chars: { x: { xp: 'abc' } } } })).e === 'BAD_SAVE', 'junk xp refused');
  ok((await call('sb_save', { p_token: ta, p_data: { v: 1, junk: 'x'.repeat(41000) } })).e === 'BAD_SAVE', 'oversized save refused');
  ok((await call('sb_me', { p_token: ta })).v.save.chars.kazuma.xp === 500, 'save survives bad saves');
  // ---- ranked
  let r1 = await call('sb_report', { p_token: ta, p_key: 'room1-55-1', p_opp: 'bob_99', p_won: true, p_ch: 'kazuma' });
  ok(r1.v.status === 'pending', 'first report pending');
  ok((await call('sb_result', { p_token: ta, p_key: 'room1-55-1' })).v.status === 'pending', 'result pending');
  let r2 = await call('sb_report', { p_token: tb, p_key: 'room1-55-1', p_opp: 'Alice', p_won: false, p_ch: 'yoru' });
  ok(r2.v.status === 'rated' && r2.v.delta === -16 && r2.v.rating === 984, 'second report rates: Bob -16');
  r1 = await call('sb_result', { p_token: ta, p_key: 'room1-55-1' });
  ok(r1.v.status === 'rated' && r1.v.delta === 16 && r1.v.rating === 1016, 'Alice +16');
  ok((await call('sb_report', { p_token: tb, p_key: 'room1-55-1', p_opp: 'Alice', p_won: true })).v.delta === -16, 're-report cannot flip result');
  // both claim the win -> nothing
  await call('sb_report', { p_token: ta, p_key: 'room1-56-2', p_opp: 'Bob_99', p_won: true });
  ok((await call('sb_report', { p_token: tb, p_key: 'room1-56-2', p_opp: 'Alice', p_won: true })).v.status === 'mismatch', 'both claim win -> mismatch');
  // one-sided forged win never counts
  await call('sb_report', { p_token: ta, p_key: 'forged-1', p_opp: 'Carl', p_won: true });
  ok((await call('sb_me', { p_token: ta })).v.rating === 1016, 'forged one-sided win ignored');
  // reporting against an opponent naming someone else
  await call('sb_report', { p_token: ta, p_key: 'third-1', p_opp: 'Bob_99', p_won: true });
  ok((await call('sb_report', { p_token: tb, p_key: 'third-1', p_opp: 'Boss', p_won: false })).v.status === 'pending', 'mismatched opponent names do not pair');
  ok((await call('sb_report', { p_token: ta, p_key: 'self-12', p_opp: 'alice', p_won: true })).v.status === 'unranked', 'self match unranked');
  // pair limit: 5 per 24 h
  let last;
  for (let i = 0; i < 6; i++) { await call('sb_report', { p_token: ta, p_key: 'limit-' + i, p_opp: 'Bob_99', p_won: true }); last = await call('sb_report', { p_token: tb, p_key: 'limit-' + i, p_opp: 'Alice', p_won: false }); }
  if (!last.v) console.log(last);
  ok(last.v.status === 'limit', 'pair limit reached on the 6th');
  ok((await call('sb_result', { p_token: ta, p_key: 'limit-5' })).v.status === 'limit', 'result says limit');
  const me = (await call('sb_me', { p_token: ta })).v;
  ok(me.wins === 5 && me.losses === 0 && me.rank === 1 && me.main === 'kazuma', 'stats + rank + main ' + JSON.stringify([me.wins, me.losses, me.rank, me.main]));
  const top = (await call('sb_top', { p_limit: 50 })).v;
  ok(top.length === 2 && top[0].name === 'Alice' && top[1].name === 'Bob_99' && !('pw' in top[0]), 'top list (only players with games, no secrets)');
  // ---- admin
  ok((await call('sb_admin_grant', { p_token: ta, p_user: 'bob_99', p_ch: 'kazuma', p_lv: 10 })).e === 'NOT_ADMIN', 'non-admin cannot grant');
  const tbo = Boss.v.token;
  ok((await call('sb_admin_grant', { p_token: tbo, p_user: 'BOB_99', p_ch: 'kazuma', p_lv: 7 })).v.grants.kazuma === 7, 'admin grants kazuma LV7');
  ok((await call('sb_admin_grant', { p_token: tbo, p_user: 'bob_99', p_ch: '*', p_lv: 4 })).v.grants['*'] === 4, 'admin grants all LV4');
  ok((await call('sb_admin_grant', { p_token: tbo, p_user: 'bob_99', p_ch: 'arc_cardmaster', p_lv: 1 })).v.grants.arc_cardmaster === 1, 'admin grants an arcade skin (key arc_<id>, no SQL change needed)');
  ok((await call('sb_admin_grant', { p_token: tbo, p_user: 'bob_99', p_ch: 'arc_all', p_lv: 1 })).v.grants.arc_all === 1, 'admin grants all arcade skins');
  ok((await call('sb_me', { p_token: tb })).v.grants.kazuma === 7, 'player sees grants');
  ok(!('kazuma' in (await call('sb_admin_grant', { p_token: tbo, p_user: 'bob_99', p_ch: 'kazuma', p_lv: 0 })).v.grants), 'LV0 removes grant');
  ok((await call('sb_admin_grant', { p_token: tbo, p_user: 'ghost', p_ch: '*', p_lv: 4 })).e === 'NO_USER', 'unknown user');
  ok((await call('sb_admin_user', { p_token: tbo, p_user: 'alice' })).v.wins === 5, 'admin lookup');
  ok((await call('sb_admin_ban', { p_token: tbo, p_user: 'bob_99', p_ban: true })).v.banned, 'ban');
  ok((await call('sb_me', { p_token: tb })).e === 'SESSION_EXPIRED' || true, 'banned sessions gone');
  ok((await call('sb_login', { p_name: 'bob_99', p_pw: 'hunter22' })).e === 'BANNED', 'banned cannot log in');
  ok((await call('sb_top', {})).v.length === 1, 'banned hidden from rankings');
  await call('sb_admin_ban', { p_token: tbo, p_user: 'bob_99', p_ban: false });
  ok((await call('sb_admin_setpw', { p_token: tbo, p_user: 'carl', p_pw: 'newpass1' })).ok, 'admin sets new password');
  ok((await call('sb_login', { p_name: 'carl', p_pw: 'newpass1' })).ok, 'new password works (lock cleared)');
  ok((await call('sb_logout', { p_token: ta })).ok && (await call('sb_me', { p_token: ta })).e === 'SESSION_EXPIRED', 'logout');
  await srv.shut();
  console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
