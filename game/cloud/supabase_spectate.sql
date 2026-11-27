-- =====================================================================
--  SOUL BREAKERS · WATCH FRIENDS' ONLINE FIGHTS (add-on)
--  Needs supabase_setup.sql + supabase_friends.sql first (already done).
--  Paste this whole file into Supabase → SQL Editor → New query → RUN.
--  Running it again is safe.
--
--  · While a player is in an online room (and allows spectators), the game
--    stores the 6-digit room code here.
--  · Only mutual friends who are online and in a fight get the code back,
--    so they can press WATCH. The match data itself goes peer-to-peer.
-- =====================================================================

alter table sb_users add column if not exists room    text;
alter table sb_users add column if not exists room_at timestamptz;

-- set ('123456') or clear ('') my current online room
create or replace function sb_set_room(p_token text, p_room text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare u bigint := sb_uid(p_token);
begin
  if coalesce(p_room, '') = '' then update sb_users set room = null, room_at = null where id = u; return json_build_object('ok', true); end if;
  if p_room !~ '^[0-9]{6}$' then raise exception 'BAD_ROOM'; end if;
  update sb_users set room = p_room, room_at = now() where id = u;
  return json_build_object('ok', true);
end $$;

-- rooms of my friends who are in an online fight right now
create or replace function sb_friend_rooms(p_token text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare u bigint := sb_uid(p_token);
begin
  return (select coalesce(json_agg(json_build_object('name', x.name, 'room', x.room)), '[]')
          from sb_friends a join sb_friends b on b.uid = a.fid and b.fid = a.uid join sb_users x on x.id = a.fid
          where a.uid = u and not x.banned and x.room is not null and x.status = 'match'
            and x.online_at > now() - interval '50 seconds' and x.room_at > now() - interval '3 hours');
end $$;

grant execute on function sb_set_room(text, text), sb_friend_rooms(text) to anon, authenticated;
