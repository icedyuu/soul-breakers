-- =====================================================================================
--  SOUL BREAKERS · RANKED SEASONS (add-on; run AFTER supabase_setup.sql)
--  Supabase → SQL Editor → paste everything → Run. Running it again is safe.
--
--  · Tiers come from the rating: BRONZE < 1050 ≤ SILVER < 1125 ≤ GOLD < 1200 ≤ PLATINUM
--    < 1300 ≤ DIAMOND < 1400 ≤ MASTER.
--  · A season lasts one calendar month (always at least ~2 weeks; season 1 ends 1 Jan).
--    No cron needed: the first call after the end closes the season ("lazy" rollover).
--  · Season end: every player with 3+ season matches gets a badge for the HIGHEST tier
--    reached that season (place 1 also gets CHAMPION). Ratings move halfway back to 1000.
--  · Admin: sb_admin_season_end(token) ends the current season right now.
-- =====================================================================================

alter table sb_users add column if not exists sw     int   not null default 0;     -- season wins
alter table sb_users add column if not exists sl     int   not null default 0;     -- season losses
alter table sb_users add column if not exists peak   int   not null default 1000;  -- highest rating this season
alter table sb_users add column if not exists badges jsonb not null default '[]'::jsonb;  -- [{s, t, p}]

create table if not exists sb_seasons (id int primary key, starts timestamptz not null, ends timestamptz not null,
                                       closed boolean not null default false);
create table if not exists sb_season_results (season int not null, uid bigint not null references sb_users(id) on delete cascade,
                                              rating int not null, peak int not null, tier text not null, wins int not null,
                                              losses int not null, place int not null, primary key (season, uid));
alter table sb_seasons        enable row level security;
alter table sb_season_results enable row level security;
revoke all on sb_seasons, sb_season_results from anon, authenticated;

create or replace function sb_tier(r int) returns text
language sql immutable as $$
  select case when r >= 1400 then 'master' when r >= 1300 then 'diamond' when r >= 1200 then 'platinum'
              when r >= 1125 then 'gold' when r >= 1050 then 'silver' else 'bronze' end;
$$;

-- season end = first day of the month after (now + 14 days), 00:00 UTC
create or replace function sb_season_next_end(t timestamptz) returns timestamptz
language sql immutable as $$
  select (date_trunc('month', (t at time zone 'utc') + interval '14 days') + interval '1 month') at time zone 'utc';
$$;

-- ranked results update the season stats (sb_report adds a win / loss and changes the rating)
create or replace function sb_season_stats() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.wins > old.wins then new.sw := new.sw + (new.wins - old.wins); new.peak := greatest(new.peak, new.rating); end if;
  if new.losses > old.losses then new.sl := new.sl + (new.losses - old.losses); end if;
  return new;
end $$;
drop trigger if exists sb_users_season on sb_users;
create trigger sb_users_season before update of wins, losses on sb_users for each row execute function sb_season_stats();

-- close a finished season (and open the next one); safe to call any time
create or replace function sb_season_tick() returns sb_seasons
language plpgsql security definer set search_path = public as $$
declare s sb_seasons;
begin
  select * into s from sb_seasons where not closed order by id desc limit 1;
  if s.id is not null and s.ends > now() then return s; end if;
  perform pg_advisory_xact_lock(hashtext('sb_season_tick'));
  select * into s from sb_seasons where not closed order by id desc limit 1;
  if s.id is null then
    insert into sb_seasons (id, starts, ends) values (coalesce((select max(id) from sb_seasons), 0) + 1, now(), sb_season_next_end(now()))
      on conflict do nothing;
    select * into s from sb_seasons where not closed order by id desc limit 1; return s;
  end if;
  if s.ends > now() then return s; end if;
  insert into sb_season_results (season, uid, rating, peak, tier, wins, losses, place)
    select s.id, id, rating, greatest(peak, rating), sb_tier(greatest(peak, rating)), sw, sl, rank() over (order by rating desc, sw desc)
    from sb_users where not banned and sw + sl >= 3
    on conflict do nothing;
  update sb_users u set badges = u.badges || jsonb_build_array(jsonb_build_object('s', s.id, 't', r.tier, 'p', r.place))
    from sb_season_results r where r.season = s.id and r.uid = u.id and not u.badges @> jsonb_build_array(jsonb_build_object('s', s.id));
  update sb_users set rating = 1000 + (rating - 1000) / 2, peak = 1000 + (rating - 1000) / 2, sw = 0, sl = 0
    where rating <> 1000 or sw <> 0 or sl <> 0 or peak <> 1000;
  update sb_seasons set closed = true where id = s.id;
  insert into sb_seasons (id, starts, ends) values (s.id + 1, now(), sb_season_next_end(now()));
  select * into s from sb_seasons where id = s.id + 1; return s;
end $$;

-- a match that is rated after the end date belongs to the new season
create or replace function sb_season_match() returns trigger
language plpgsql security definer set search_path = public as $$
begin perform sb_season_tick(); return new; end $$;
drop trigger if exists sb_matches_season on sb_matches;
create trigger sb_matches_season before insert on sb_matches for each row execute function sb_season_match();

create or replace function sb_season_info(s sb_seasons) returns json
language sql stable as $$
  select json_build_object('id', s.id, 'starts', s.starts, 'ends', s.ends, 'left', greatest(0, extract(epoch from s.ends - now()))::bigint);
$$;

-- rankings of the current season (players with at least one season match)
create or replace function sb_season_top(p_limit int default 100) returns json
language plpgsql security definer set search_path = public as $$
declare s sb_seasons := sb_season_tick();
begin
  return json_build_object('season', sb_season_info(s), 'rows', (
    select coalesce(json_agg(x order by x.rating desc, x.sw desc, x.name), '[]'::json) from (
      select name, rating, sb_tier(rating) as tier, sw, sl, wins, losses, main, badges from sb_users
      where not banned and sw + sl > 0
      order by rating desc, sw desc, name limit least(greatest(coalesce(p_limit, 100), 1), 100)) x));
end $$;

-- my season: tier, season W/L, place, badges (+ the season info)
create or replace function sb_season_me(p_token text) returns json
language plpgsql security definer set search_path = public as $$
declare s sb_seasons := sb_season_tick(); u bigint := sb_uid(p_token); me sb_users;
begin
  select * into me from sb_users where id = u;
  return json_build_object('season', sb_season_info(s), 'rating', me.rating, 'tier', sb_tier(me.rating), 'peak', me.peak,
    'sw', me.sw, 'sl', me.sl, 'badges', me.badges,
    'place', case when me.sw + me.sl = 0 then null else
      1 + (select count(*) from sb_users o where not o.banned and o.sw + o.sl > 0 and o.rating > me.rating)::int end);
end $$;

create or replace function sb_admin_season_end(p_token text) returns json
language plpgsql security definer set search_path = public as $$
declare u bigint := sb_uid(p_token); s sb_seasons;
begin
  if not sb_is_admin(u) then raise exception 'NOT_ADMIN'; end if;
  perform sb_season_tick();
  update sb_seasons set ends = now() where not closed;
  s := sb_season_tick();
  return json_build_object('season', s.id);
end $$;

revoke execute on function sb_tier(int), sb_season_next_end(timestamptz), sb_season_stats(), sb_season_tick(), sb_season_match(),
  sb_season_info(sb_seasons), sb_season_top(int), sb_season_me(text), sb_admin_season_end(text)
  from public, anon, authenticated;
grant execute on function sb_season_top(int), sb_season_me(text), sb_admin_season_end(text) to anon, authenticated;

select sb_season_tick();   -- opens season 1
