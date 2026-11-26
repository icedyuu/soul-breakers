-- =====================================================================
--  SOUL BREAKERS · accounts, cloud save, online rankings, admin unlocks
--  Paste this whole file into Supabase → SQL Editor → New query → RUN.
--  Running it again is safe (it only adds what is missing / updates functions).
--
--  Design: the game talks to the database ONLY through the functions below
--  (PostgREST /rpc). All tables have row level security on and no policies,
--  so the public key cannot read or write them directly. Passwords are
--  bcrypt hashes (pgcrypto). Login gives a random session token.
--  Ranked results count only when BOTH players report the same match with
--  opposite results (a single client cannot forge a win).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

create table if not exists sb_users (
  id        bigint generated always as identity primary key,
  name      text not null,
  lname     text not null unique,
  pw        text not null,
  created   timestamptz not null default now(),
  seen      timestamptz not null default now(),
  rating    int  not null default 1000,
  wins      int  not null default 0,
  losses    int  not null default 0,
  main      text,
  save      jsonb not null default '{}'::jsonb,
  grants    jsonb not null default '{}'::jsonb,
  banned    boolean not null default false,
  fails     int not null default 0,
  fail_at   timestamptz,
  reg_ip    text
);
create table if not exists sb_admins   (lname text primary key);
create table if not exists sb_sessions (token text primary key, uid bigint not null references sb_users(id) on delete cascade,
                                        created timestamptz not null default now(), used timestamptz not null default now());
create table if not exists sb_reports  (mkey text not null, uid bigint not null references sb_users(id) on delete cascade,
                                        opp bigint not null references sb_users(id) on delete cascade, won boolean not null,
                                        ch text, at timestamptz not null default now(), primary key (mkey, uid));
create table if not exists sb_matches  (mkey text primary key, winner bigint not null, loser bigint not null,
                                        wch text, lch text, delta int not null, at timestamptz not null default now());
create index if not exists sb_users_rating on sb_users (rating desc);
create index if not exists sb_matches_pair on sb_matches (winner, loser, at);
create index if not exists sb_sessions_uid on sb_sessions (uid);

alter table sb_users    enable row level security;
alter table sb_admins   enable row level security;
alter table sb_sessions enable row level security;
alter table sb_reports  enable row level security;
alter table sb_matches  enable row level security;
revoke all on sb_users, sb_admins, sb_sessions, sb_reports, sb_matches from anon, authenticated;

-- ---------- helpers (not callable from the game) ----------
create or replace function sb_uid(p_token text) returns bigint
language plpgsql security definer set search_path = public, extensions as $$
declare u bigint;
begin
  update sb_sessions set used = now()
   where token = p_token and used > now() - interval '120 days'
  returning uid into u;
  if u is null then raise exception 'SESSION_EXPIRED'; end if;
  if (select banned from sb_users where id = u) then raise exception 'BANNED'; end if;
  update sb_users set seen = now() where id = u and seen < now() - interval '5 minutes';
  return u;
end $$;

create or replace function sb_client_ip() returns text
language plpgsql stable as $$
begin
  return split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1);
exception when others then return '';
end $$;

create or replace function sb_new_session(u bigint) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare t text := encode(gen_random_bytes(24), 'hex');
begin
  insert into sb_sessions (token, uid) values (t, u);
  delete from sb_sessions where uid = u and token not in (select token from sb_sessions where uid = u order by used desc limit 10);
  return t;
end $$;

create or replace function sb_is_admin(u bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from sb_admins a join sb_users s on s.lname = a.lname where s.id = u);
$$;

create or replace function sb_rank(u bigint) returns int
language sql stable security definer set search_path = public as $$
  select case when s.wins + s.losses = 0 then null else
    1 + (select count(*) from sb_users o where not o.banned and o.wins + o.losses > 0 and o.rating > s.rating)::int end
  from sb_users s where s.id = u;
$$;

create or replace function sb_profile(u bigint) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('name', name, 'rating', rating, 'wins', wins, 'losses', losses, 'main', main,
                           'rank', sb_rank(id), 'save', save, 'grants', grants, 'admin', sb_is_admin(id))
  from sb_users where id = u;
$$;

-- ---------- account ----------
create or replace function sb_register(p_name text, p_pw text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare u bigint; ip text := sb_client_ip();
begin
  p_name := btrim(coalesce(p_name, ''));
  if p_name !~ '^[A-Za-z0-9_]{3,16}$' then raise exception 'BAD_NAME'; end if;
  if length(coalesce(p_pw, '')) < 6 or length(p_pw) > 64 then raise exception 'BAD_PASSWORD'; end if;
  if ip <> '' and (select count(*) from sb_users where reg_ip = ip and created > now() - interval '1 hour') >= 5 then
    raise exception 'TOO_MANY';
  end if;
  if exists (select 1 from sb_users where lname = lower(p_name)) then raise exception 'NAME_TAKEN'; end if;
  insert into sb_users (name, lname, pw, reg_ip) values (p_name, lower(p_name), crypt(p_pw, gen_salt('bf', 8)), ip)
  returning id into u;
  return json_build_object('token', sb_new_session(u), 'me', sb_profile(u));
exception when unique_violation then raise exception 'NAME_TAKEN';
end $$;

create or replace function sb_login(p_name text, p_pw text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare r sb_users;
begin
  select * into r from sb_users where lname = lower(btrim(coalesce(p_name, '')));
  -- failures are returned (not raised) so the failed-attempt counter is committed
  if r.id is null then return json_build_object('error', 'WRONG_LOGIN'); end if;
  if r.fails >= 5 and r.fail_at > now() - interval '5 minutes' then return json_build_object('error', 'LOCKED'); end if;
  if r.pw <> crypt(coalesce(p_pw, ''), r.pw) then
    update sb_users set fails = case when fail_at < now() - interval '5 minutes' then 1 else fails + 1 end, fail_at = now() where id = r.id;
    return json_build_object('error', 'WRONG_LOGIN');
  end if;
  if r.banned then raise exception 'BANNED'; end if;
  update sb_users set fails = 0, seen = now() where id = r.id;
  return json_build_object('token', sb_new_session(r.id), 'me', sb_profile(r.id));
end $$;

create or replace function sb_logout(p_token text) returns void
language sql security definer set search_path = public as $$
  delete from sb_sessions where token = p_token;
$$;

create or replace function sb_me(p_token text) returns json
language plpgsql security definer set search_path = public, extensions as $$
begin return sb_profile(sb_uid(p_token)); end $$;

-- the mastery profile (cosmetic progress only; rankings never read it). Saves from several devices are
-- merged per fighter (the higher XP wins), so an older device can never wipe newer progress.
create or replace function sb_merge_save(a jsonb, b jsonb) returns jsonb
language sql immutable as $$
  select b || jsonb_build_object('chars', coalesce((
    select jsonb_object_agg(k, case when coalesce((a -> 'chars' -> k ->> 'xp')::numeric, 0) > coalesce((b -> 'chars' -> k ->> 'xp')::numeric, 0)
                                    then a -> 'chars' -> k else b -> 'chars' -> k end)
    from (select jsonb_object_keys(coalesce(a -> 'chars', '{}'::jsonb)) k union select jsonb_object_keys(coalesce(b -> 'chars', '{}'::jsonb))) ks
  ), '{}'::jsonb));
$$;

create or replace function sb_save(p_token text, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare u bigint := sb_uid(p_token); r jsonb;
begin
  if jsonb_typeof(p_data) <> 'object' or jsonb_typeof(coalesce(p_data -> 'chars', '{}'::jsonb)) <> 'object' or length(p_data::text) > 40000 then
    raise exception 'BAD_SAVE';
  end if;
  begin
    update sb_users set save = sb_merge_save(case when jsonb_typeof(save -> 'chars') = 'object' then save else '{}'::jsonb end, p_data)
     where id = u returning save into r;
  exception when invalid_text_representation or data_exception then raise exception 'BAD_SAVE';
  end;
  return r;
end $$;

-- ---------- ranked online ----------
-- Both players call this after an online match. p_key is the same on both devices (room + seed + match no).
-- The match is rated when the second, matching report arrives. Elo, K = 32.
-- A pair of accounts can rate at most 5 matches against each other per 24 h (stops win trading).
create or replace function sb_report(p_token text, p_key text, p_opp text, p_won boolean, p_ch text default null) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare
  u bigint := sb_uid(p_token); o bigint; other sb_reports; m sb_matches;
  w bigint; l bigint; rw int; rl int; d int; wch text; lch text;
begin
  if p_key is null or length(p_key) < 6 or length(p_key) > 64 then raise exception 'BAD_MATCH'; end if;
  if p_ch is not null and p_ch !~ '^[a-z0-9_]{1,20}$' then p_ch := null; end if;
  select id into o from sb_users where lname = lower(btrim(coalesce(p_opp, '')));
  if o is null or o = u then return json_build_object('status', 'unranked'); end if;
  perform pg_advisory_xact_lock(hashtext('sb_report:' || p_key));   -- both players often report at the same moment
  select * into m from sb_matches where mkey = p_key;
  if m.mkey is not null then
    return json_build_object('status', 'rated', 'delta', case when m.winner = u then m.delta else -m.delta end,
                             'rating', (select rating from sb_users where id = u));
  end if;
  insert into sb_reports (mkey, uid, opp, won, ch) values (p_key, u, o, p_won, p_ch) on conflict do nothing;
  select won, opp, ch into p_won, o, p_ch from sb_reports where mkey = p_key and uid = u;   -- a repeated report can't change the first one
  select * into other from sb_reports where mkey = p_key and uid = o;
  if other.mkey is null then return json_build_object('status', 'pending'); end if;
  if other.opp <> u or other.won = p_won then return json_build_object('status', 'mismatch'); end if;
  if p_won then w := u; l := o; wch := p_ch; lch := other.ch; else w := o; l := u; wch := other.ch; lch := p_ch; end if;
  if (select count(*) from sb_matches where ((winner = w and loser = l) or (winner = l and loser = w)) and at > now() - interval '24 hours') >= 5 then
    return json_build_object('status', 'limit');
  end if;
  select rating into rw from sb_users where id = w for update;
  select rating into rl from sb_users where id = l for update;
  d := greatest(1, round(32 * (1 - 1 / (1 + power(10, (rl - rw) / 400.0)))))::int;
  insert into sb_matches (mkey, winner, loser, wch, lch, delta) values (p_key, w, l, wch, lch, d) on conflict do nothing;
  if not found then return sb_report(p_token, p_key, p_opp, p_won, p_ch); end if;
  update sb_users set rating = rating + d, wins = wins + 1, main = coalesce(wch, main) where id = w;
  update sb_users set rating = greatest(0, rating - d), losses = losses + 1, main = coalesce(lch, main) where id = l;
  return json_build_object('status', 'rated', 'delta', case when w = u then d else -d end, 'rating', (select rating from sb_users where id = u));
end $$;

-- result of a match this player reported earlier (the first reporter asks again until the rival's report is in)
create or replace function sb_result(p_token text, p_key text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare u bigint := sb_uid(p_token); m sb_matches; r sb_reports; other sb_reports;
begin
  select * into m from sb_matches where mkey = p_key;
  if m.mkey is not null and u in (m.winner, m.loser) then
    return json_build_object('status', 'rated', 'delta', case when m.winner = u then m.delta else -m.delta end,
                             'rating', (select rating from sb_users where id = u));
  end if;
  select * into r from sb_reports where mkey = p_key and uid = u;
  if r.mkey is null then return json_build_object('status', 'unknown'); end if;
  select * into other from sb_reports where mkey = p_key and uid = r.opp;
  if other.mkey is null then return json_build_object('status', 'pending'); end if;
  if other.opp <> u or other.won = r.won then return json_build_object('status', 'mismatch'); end if;
  return json_build_object('status', 'limit');
end $$;

create or replace function sb_top(p_limit int default 50) returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(x order by x.rating desc, x.wins desc, x.name), '[]'::json) from (
    select name, rating, wins, losses, main from sb_users
    where not banned and wins + losses > 0
    order by rating desc, wins desc, name limit least(greatest(coalesce(p_limit, 50), 1), 100)) x;
$$;

-- ---------- admin (accounts listed in sb_admins) ----------
-- p_ch = fighter id or '*' for every fighter; p_lv = mastery level 1-10 (0 removes the grant)
create or replace function sb_admin_grant(p_token text, p_user text, p_ch text, p_lv int) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare u bigint := sb_uid(p_token); t sb_users;
begin
  if not sb_is_admin(u) then raise exception 'NOT_ADMIN'; end if;
  select * into t from sb_users where lname = lower(btrim(coalesce(p_user, '')));
  if t.id is null then raise exception 'NO_USER'; end if;
  if p_ch is null or p_ch !~ '^([a-z0-9_]{1,20}|\*)$' or p_lv is null or p_lv < 0 or p_lv > 10 then raise exception 'BAD_GRANT'; end if;
  update sb_users set grants = case when p_lv = 0 then grants - p_ch else grants || jsonb_build_object(p_ch, p_lv) end
   where id = t.id returning grants into t.grants;
  return json_build_object('name', t.name, 'grants', t.grants);
end $$;

create or replace function sb_admin_ban(p_token text, p_user text, p_ban boolean) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare u bigint := sb_uid(p_token); t sb_users;
begin
  if not sb_is_admin(u) then raise exception 'NOT_ADMIN'; end if;
  select * into t from sb_users where lname = lower(btrim(coalesce(p_user, '')));
  if t.id is null then raise exception 'NO_USER'; end if;
  if t.id = u then raise exception 'BAD_GRANT'; end if;
  update sb_users set banned = coalesce(p_ban, false) where id = t.id;
  if p_ban then delete from sb_sessions where uid = t.id; end if;
  return json_build_object('name', t.name, 'banned', coalesce(p_ban, false));
end $$;

create or replace function sb_admin_user(p_token text, p_user text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare u bigint := sb_uid(p_token); t sb_users;
begin
  if not sb_is_admin(u) then raise exception 'NOT_ADMIN'; end if;
  select * into t from sb_users where lname = lower(btrim(coalesce(p_user, '')));
  if t.id is null then raise exception 'NO_USER'; end if;
  return json_build_object('name', t.name, 'rating', t.rating, 'wins', t.wins, 'losses', t.losses,
                           'grants', t.grants, 'banned', t.banned, 'created', t.created, 'seen', t.seen);
end $$;

-- new password for a player who forgot theirs (6-64 characters); logs them out everywhere
create or replace function sb_admin_setpw(p_token text, p_user text, p_pw text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare u bigint := sb_uid(p_token); t sb_users;
begin
  if not sb_is_admin(u) then raise exception 'NOT_ADMIN'; end if;
  select * into t from sb_users where lname = lower(btrim(coalesce(p_user, '')));
  if t.id is null then raise exception 'NO_USER'; end if;
  if length(coalesce(p_pw, '')) < 6 or length(p_pw) > 64 then raise exception 'BAD_PASSWORD'; end if;
  update sb_users set pw = crypt(p_pw, gen_salt('bf', 8)), fails = 0 where id = t.id;
  delete from sb_sessions where uid = t.id and t.id <> u;
  return json_build_object('name', t.name);
end $$;

-- ---------- who may call what ----------
revoke execute on function sb_uid(text), sb_client_ip(), sb_new_session(bigint), sb_is_admin(bigint), sb_rank(bigint),
  sb_profile(bigint), sb_register(text, text), sb_login(text, text), sb_logout(text), sb_me(text), sb_save(text, jsonb),
  sb_report(text, text, text, boolean, text), sb_result(text, text), sb_top(int), sb_admin_grant(text, text, text, int),
  sb_admin_ban(text, text, boolean), sb_admin_user(text, text) from public, anon, authenticated;
grant execute on function sb_register(text, text), sb_login(text, text), sb_logout(text), sb_me(text),
  sb_save(text, jsonb), sb_report(text, text, text, boolean, text), sb_result(text, text), sb_top(int),
  sb_admin_grant(text, text, text, int), sb_admin_ban(text, text, boolean), sb_admin_user(text, text), sb_admin_setpw(text, text, text)
  to anon, authenticated;

-- ---------- YOUR ADMIN ACCOUNT ----------
-- Put the username you will register in the game between the quotes (any upper/lower case).
insert into sb_admins (lname) values (lower('Beni')) on conflict do nothing;

notify pgrst, 'reload schema';
