-- =====================================================================
--  SOUL BREAKERS · FRIENDS LIST + ONLINE STATUS + MATCH INVITES (add-on)
--  Needs supabase_setup.sql first (already done). Paste this whole file
--  into Supabase → SQL Editor → New query → RUN. Running it again is safe.
--
--  · A friendship = both players added each other (A adds B → request,
--    B accepts by adding A back).
--  · Online = the game pinged in the last 50 seconds (sb_friends is the ping).
--  · An invite carries the inviter's 6-digit online room code; it only works
--    between friends and expires after 90 seconds.
-- =====================================================================

alter table sb_users add column if not exists online_at timestamptz;
alter table sb_users add column if not exists status    text;

create table if not exists sb_friends (uid bigint not null references sb_users(id) on delete cascade,
                                       fid bigint not null references sb_users(id) on delete cascade,
                                       at  timestamptz not null default now(), primary key (uid, fid));
create index if not exists sb_friends_fid on sb_friends (fid);
create table if not exists sb_invites (src bigint not null references sb_users(id) on delete cascade,
                                       dst bigint not null references sb_users(id) on delete cascade,
                                       room text not null, ans text, at timestamptz not null default now(),
                                       primary key (src, dst));
create index if not exists sb_invites_dst on sb_invites (dst);
alter table sb_friends enable row level security;
alter table sb_invites enable row level security;
revoke all on sb_friends, sb_invites from anon, authenticated;

create or replace function sb_mutual(a bigint, b bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from sb_friends where uid = a and fid = b) and exists (select 1 from sb_friends where uid = b and fid = a);
$$;

-- the ping + everything the FRIENDS screen needs
create or replace function sb_friends(p_token text, p_status text default 'menu') returns json
language plpgsql security definer set search_path = public, extensions as $$
declare u bigint := sb_uid(p_token); live interval := interval '50 seconds';
begin
  update sb_users set online_at = now(), status = case when p_status in ('menu', 'match') then p_status else 'menu' end where id = u;
  delete from sb_invites where at < now() - interval '10 minutes';
  return json_build_object(
    'friends', (select coalesce(json_agg(json_build_object('name', x.name, 'online', coalesce(x.online_at > now() - live, false),
                  'status', x.status, 'rating', x.rating, 'main', x.main) order by coalesce(x.online_at > now() - live, false) desc, x.lname), '[]')
                from sb_friends a join sb_friends b on b.uid = a.fid and b.fid = a.uid join sb_users x on x.id = a.fid
                where a.uid = u and not x.banned),
    'incoming', (select coalesce(json_agg(x.name order by a.at desc), '[]') from sb_friends a join sb_users x on x.id = a.uid
                where a.fid = u and not x.banned and not exists (select 1 from sb_friends b where b.uid = u and b.fid = a.uid)),
    'outgoing', (select coalesce(json_agg(x.name order by a.at desc), '[]') from sb_friends a join sb_users x on x.id = a.fid
                where a.uid = u and not exists (select 1 from sb_friends b where b.uid = a.fid and b.fid = u)),
    'invites', (select coalesce(json_agg(json_build_object('from', x.name, 'room', i.room) order by i.at desc), '[]')
                from sb_invites i join sb_users x on x.id = i.src
                where i.dst = u and i.ans is null and i.at > now() - interval '90 seconds' and not x.banned and sb_mutual(u, i.src)),
    'sent', (select coalesce(json_agg(json_build_object('to', x.name, 'room', i.room, 'ans', i.ans)), '[]')
                from sb_invites i join sb_users x on x.id = i.dst where i.src = u and i.at > now() - interval '90 seconds'));
end $$;

-- add a friend (or accept their request)
create or replace function sb_friend_add(p_token text, p_name text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare u bigint := sb_uid(p_token); f bigint; fname text;
begin
  select id, name into f, fname from sb_users where lname = lower(trim(coalesce(p_name, ''))) and not banned;
  if f is null then raise exception 'NO_USER'; end if;
  if f = u then raise exception 'SELF'; end if;
  if not exists (select 1 from sb_friends where uid = u and fid = f) then
    if (select count(*) from sb_friends where uid = u) >= 100 then raise exception 'FRIEND_LIMIT'; end if;
    insert into sb_friends (uid, fid) values (u, f);
  end if;
  return json_build_object('name', fname, 'status', case when sb_mutual(u, f) then 'friends' else 'sent' end);
end $$;

-- remove a friend / decline or cancel a request
create or replace function sb_friend_remove(p_token text, p_name text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare u bigint := sb_uid(p_token); f bigint;
begin
  select id into f from sb_users where lname = lower(trim(coalesce(p_name, '')));
  if f is null then raise exception 'NO_USER'; end if;
  delete from sb_friends where (uid = u and fid = f) or (uid = f and fid = u);
  delete from sb_invites where (src = u and dst = f) or (src = f and dst = u);
  return json_build_object('ok', true);
end $$;

-- invite a friend into my room (p_room null or '' = take the invite back)
create or replace function sb_invite(p_token text, p_name text, p_room text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare u bigint := sb_uid(p_token); f bigint;
begin
  select id into f from sb_users where lname = lower(trim(coalesce(p_name, '')));
  if f is null then raise exception 'NO_USER'; end if;
  if coalesce(p_room, '') = '' then delete from sb_invites where src = u and dst = f; return json_build_object('ok', true); end if;
  if p_room !~ '^[0-9]{6}$' then raise exception 'BAD_ROOM'; end if;
  if not sb_mutual(u, f) then raise exception 'NOT_FRIENDS'; end if;
  insert into sb_invites (src, dst, room) values (u, f, p_room)
    on conflict (src, dst) do update set room = excluded.room, ans = null, at = now();
  return json_build_object('ok', true);
end $$;

-- answer an invite (accept = going to join the room)
create or replace function sb_invite_answer(p_token text, p_from text, p_accept boolean) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare u bigint := sb_uid(p_token);
begin
  update sb_invites set ans = case when p_accept then 'yes' else 'no' end
   where dst = u and src = (select id from sb_users where lname = lower(trim(coalesce(p_from, ''))));
  return json_build_object('ok', true);
end $$;

revoke execute on function sb_mutual(bigint, bigint) from public, anon, authenticated;
grant execute on function sb_friends(text, text), sb_friend_add(text, text), sb_friend_remove(text, text),
                          sb_invite(text, text, text), sb_invite_answer(text, text, boolean) to anon, authenticated;
