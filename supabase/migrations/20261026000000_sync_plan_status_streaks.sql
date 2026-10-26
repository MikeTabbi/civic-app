-- Step 1 of the Squad build: what the app syncs.
--   * voting_plans gets a has_plan yes/no. The app writes only has_plan and
--     share_with_squad; address, method, place and time stay on the phone.
--   * squad_plan_progress counts members who share AND have a plan.
--   * public_streaks holds Drop streaks. Owner-only; leaderboards read it
--     through a function (step 3) that drops anyone not opted in.

alter table public.voting_plans
  add column if not exists has_plan boolean not null default false;

-- Same signature as before, so this replaces it in place.
create or replace function public.squad_plan_progress(sid uuid)
returns table (members int, with_plan int)
language sql security definer stable set search_path = public as $$
  select
    count(*)::int,
    count(*) filter (where vp.share_with_squad and vp.has_plan)::int
  from public.squad_members sm
  left join public.voting_plans vp on vp.user_id = sm.user_id
  where sm.squad_id = sid and public.is_squad_member(sid);
$$;

create table public.public_streaks (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  current    int not null default 0 check (current >= 0),
  best       int not null default 0 check (best >= current),
  last_day   date,                              -- last day a Drop was finished; a stale streak counts as 0
  opted_in   boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.public_streaks enable row level security;

create policy "own streak" on public.public_streaks for all using (user_id = auth.uid()) with check (user_id = auth.uid());
