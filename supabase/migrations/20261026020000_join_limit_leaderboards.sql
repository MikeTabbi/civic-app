-- Step 3 of the Squad build: a limit on wrong invite codes, and the two leaderboards.
--   * join_squad allows 10 wrong codes per person per hour.
--   * streak_board only ever returns opted-in people, and never voter status or quiz answers.
--   * squad_board only ranks squads with 5+ members, so no one's plan status can be worked out.

-- ---------- Wrong-code limit ----------

-- Written only by join_squad (security definer). RLS on with no policies: nobody reads it from the app.
create table public.join_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  at      timestamptz not null default now()
);
create index join_attempts_user_at on public.join_attempts (user_id, at);
alter table public.join_attempts enable row level security;

-- Same signature as before. A wrong code now returns null instead of raising,
-- so the failed attempt is saved (raising would roll it back). The app reads null as "no such code".
create or replace function public.join_squad(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  sid uuid;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  if not exists (select 1 from public.profiles where id = uid) then raise exception 'no_profile'; end if;

  delete from public.join_attempts where user_id = uid and at < now() - interval '1 hour';
  if (select count(*) from public.join_attempts where user_id = uid) >= 10 then
    raise exception 'too_many_tries';
  end if;

  select id into sid from public.squads
  where invite_code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if sid is null then
    insert into public.join_attempts (user_id) values (uid);
    return null;
  end if;
  if public.is_squad_member(sid) then return sid; end if;
  insert into public.squad_members (squad_id, user_id, role) values (sid, uid, 'member');
  return sid;
end;
$$;

-- ---------- Leaderboards ----------

-- A school scope needs a real school, not 'Other' (which lumps every other school together).
create or replace function public.my_school()
returns text language sql security definer stable set search_path = public as $$
  select nullif(school, 'Other') from public.profiles where id = auth.uid();
$$;

-- Drop streaks of opted-in people in a scope: 'squad' (p_squad, which I must be in), 'school' or 'delaware'.
-- A streak not extended today or yesterday counts as 0. Top 50, plus my own row if I'm opted in.
-- Handle always; name only for public profiles.
create or replace function public.streak_board(p_scope text, p_squad uuid default null)
returns table (rank int, handle text, display_name text, current int, best int, is_me boolean)
language sql security definer stable set search_path = public as $$
  with pool as (
    select ps.user_id, p.handle,
           case when p.is_public then p.display_name end as display_name,
           case when ps.last_day >= public.de_today() - 1 then ps.current else 0 end as cur,
           ps.best
    from public.public_streaks ps
    join public.profiles p on p.id = ps.user_id
    where ps.opted_in
      and auth.uid() is not null
      and case p_scope
            when 'squad' then p_squad is not null and public.is_squad_member(p_squad)
                              and exists (select 1 from public.squad_members sm where sm.squad_id = p_squad and sm.user_id = ps.user_id)
            when 'school' then public.my_school() is not null and p.school = public.my_school()
            when 'delaware' then true
            else false
          end
  ),
  ranked as (
    select pool.*, (rank() over (order by cur desc, best desc))::int as rk
    from pool
    where cur > 0 or user_id = auth.uid()
  )
  select rk, handle, display_name, cur, best, user_id = auth.uid()
  from ranked
  where rk <= 50 or user_id = auth.uid()
  order by rk, handle;
$$;

-- Squads with 5+ members, ranked by percent of members who share and have a plan.
-- Scope 'school' (the squad's school matches mine) or 'delaware'. Top 50, plus my own squads.
create or replace function public.squad_board(p_scope text)
returns table (rank int, squad_id uuid, name text, members int, pct int, is_mine boolean)
language sql security definer stable set search_path = public as $$
  with sizes as (
    select sq.id, sq.name, sq.school,
           count(*)::int as members,
           (count(*) filter (where vp.share_with_squad and vp.has_plan))::int as with_plan
    from public.squads sq
    join public.squad_members sm on sm.squad_id = sq.id
    left join public.voting_plans vp on vp.user_id = sm.user_id
    group by sq.id
    having count(*) >= 5
  ),
  ranked as (
    select s.*, (rank() over (order by s.with_plan::numeric / s.members desc, s.members desc))::int as rk
    from sizes s
    where auth.uid() is not null
      and case p_scope
            when 'school' then public.my_school() is not null and s.school = public.my_school()
            when 'delaware' then true
            else false
          end
  )
  select rk, id, name, members, round(100.0 * with_plan / members)::int, public.is_squad_member(id)
  from ranked
  where rk <= 50 or public.is_squad_member(id)
  order by rk, name;
$$;

revoke execute on function public.streak_board(text, uuid), public.squad_board(text), public.my_school() from public, anon;
grant execute on function public.streak_board(text, uuid), public.squad_board(text), public.my_school() to authenticated;
