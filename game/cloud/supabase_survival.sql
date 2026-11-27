-- =====================================================================
--  SOUL BREAKERS · SURVIVAL + BOSS RUSH LEADERBOARD (add-on)
--  Needs supabase_setup.sql first (already done).
--  Paste this whole file into Supabase → SQL Editor → New query → RUN.
--  Running it again is safe.
--
--  · One best score per player and mode ('survival' = wins, 'boss' = bosses beaten).
--    Better = higher score, or the same score in less time (frames at 60 fps).
--  · sb_surv_submit(token, mode, score, frames, fighter) keeps the best and returns my rank.
--  · sb_surv_top(mode, limit) = public top list (banned players hidden).
-- =====================================================================

create table if not exists sb_survival (
  uid    bigint not null references sb_users(id) on delete cascade,
  mode   text   not null check (mode in ('survival', 'boss')),
  score  int    not null,
  frames int    not null,
  ch     text   not null,
  at     timestamptz not null default now(),
  primary key (uid, mode)
);
alter table sb_survival enable row level security;
create index if not exists sb_survival_rank on sb_survival (mode, score desc, frames asc);

create or replace function sb_surv_submit(p_token text, p_mode text, p_score int, p_frames int, p_ch text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare u bigint := sb_uid(p_token); b sb_survival; r int;
begin
  if p_mode not in ('survival', 'boss') then raise exception 'BAD_MODE'; end if;
  if coalesce(p_ch, '') !~ '^[a-z_]{1,20}$' then raise exception 'BAD_SCORE'; end if;
  -- sanity: a fight takes at least ~5 seconds of fighting; boss rush has 7 bosses
  if p_score is null or p_frames is null or p_score < 1 or p_score > (case when p_mode = 'boss' then 7 else 999 end)
     or p_frames < p_score * 300 or p_frames > 60 * 60 * 60 * 24 then raise exception 'BAD_SCORE'; end if;
  insert into sb_survival as s (uid, mode, score, frames, ch) values (u, p_mode, p_score, p_frames, p_ch)
  on conflict (uid, mode) do update set score = excluded.score, frames = excluded.frames, ch = excluded.ch, at = now()
    where excluded.score > s.score or (excluded.score = s.score and excluded.frames < s.frames);
  select * into b from sb_survival where uid = u and mode = p_mode;
  select count(*) + 1 into r from sb_survival s join sb_users x on x.id = s.uid
   where s.mode = p_mode and not x.banned and (s.score > b.score or (s.score = b.score and s.frames < b.frames));
  return json_build_object('rank', r, 'best', json_build_object('score', b.score, 'frames', b.frames, 'ch', b.ch));
end $$;

create or replace function sb_surv_top(p_mode text, p_limit int default 50) returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('name', y.name, 'score', y.score, 'frames', y.frames, 'ch', y.ch) order by y.score desc, y.frames asc, y.name), '[]'::json) from (
    select x.name, s.score, s.frames, s.ch from sb_survival s join sb_users x on x.id = s.uid
    where s.mode = p_mode and not x.banned
    order by s.score desc, s.frames asc, x.name limit least(greatest(coalesce(p_limit, 50), 1), 100)) y;
$$;

revoke execute on function sb_surv_submit(text, text, int, int, text), sb_surv_top(text, int) from public;
grant execute on function sb_surv_submit(text, text, int, int, text), sb_surv_top(text, int) to anon, authenticated;
