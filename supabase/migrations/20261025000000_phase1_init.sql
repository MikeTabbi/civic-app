-- Phase 1 schema for the civic app (matches the MVP spec data model).
-- Principles enforced here, not just in the UI:
--   * Addresses, voting plans and reminders are private to their owner.
--   * Public civic data (elections, races, officials) is readable by anyone
--     and only written by the service role (data import jobs).
--   * Squad members only see plan status for squads they belong to,
--     and only when the member opted in to share it.
--   * Every civic fact carries a source.

create extension if not exists "pgcrypto";

-- ---------- Public civic data ----------

create table public.districts (
  id          text primary key,              -- e.g. 'de-sldu-17' (OCD-style id)
  level       text not null check (level in ('federal','state','county','city','school')),
  name        text not null,
  state       text not null default 'DE',
  source      text not null,
  updated_at  timestamptz not null default now()
);

create table public.elections (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  election_date         date not null,
  registration_deadline date,
  early_voting_start    date,
  early_voting_end      date,
  state                 text not null default 'DE',
  source                text not null,
  source_url            text,
  updated_at            timestamptz not null default now()
);

create table public.races (
  id           uuid primary key default gen_random_uuid(),
  election_id  uuid not null references public.elections(id) on delete cascade,
  district_id  text references public.districts(id),
  office       text not null,
  level        text not null check (level in ('federal','state','county','city','school')),
  source       text not null,
  updated_at   timestamptz not null default now()
);

-- Candidates are stored without party colors; party is plain text only.
create table public.candidates (
  id          uuid primary key default gen_random_uuid(),
  race_id     uuid not null references public.races(id) on delete cascade,
  name        text not null,
  party_label text,
  website     text,
  source      text not null,
  updated_at  timestamptz not null default now()
);

create table public.officials (
  id           uuid primary key default gen_random_uuid(),
  district_id  text references public.districts(id),
  name         text not null,
  office       text not null,
  level        text not null check (level in ('federal','state','county','city','school')),
  covers       text,                          -- plain-language "what they decide"
  photo_url    text,
  source       text not null,
  updated_at   timestamptz not null default now()
);

-- ---------- People ----------

create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  handle         text unique not null check (handle ~ '^[a-z0-9_]{3,24}$'),
  display_name   text,
  school         text,                        -- set only after school email check
  school_verified_at timestamptz,
  class_year     int,
  is_public      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- PRIVATE: never joined into anything public.
create table public.addresses (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  voting_location text not null check (voting_location in ('campus','home')),
  line1          text,
  city           text,
  state          text,
  zip            text,
  updated_at     timestamptz not null default now()
);

-- Districts resolved from the private address (Census geocoder). Private.
create table public.user_districts (
  user_id     uuid not null references auth.users(id) on delete cascade,
  district_id text not null references public.districts(id),
  primary key (user_id, district_id)
);

-- PRIVATE voting plan.
create table public.voting_plans (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  registered      boolean not null default false,
  polling_place   text,
  planned_time    timestamptz,
  method          text check (method in ('in_person','early','mail')),
  share_with_squad boolean not null default false,
  updated_at      timestamptz not null default now()
);

create table public.reminders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  election_id uuid references public.elections(id) on delete cascade,
  kind        text not null check (kind in ('registration','early_voting','election_day','custom')),
  remind_at   timestamptz not null,
  sent_at     timestamptz
);

-- Which races a user has opened (drives "3 of 7 explored"). Private.
create table public.race_progress (
  user_id   uuid not null references auth.users(id) on delete cascade,
  race_id   uuid not null references public.races(id) on delete cascade,
  explored_at timestamptz not null default now(),
  primary key (user_id, race_id)
);

-- ---------- Squads ----------

create table public.squads (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  school     text,
  goal       text,
  goal_ends  date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.squad_members (
  squad_id  uuid not null references public.squads(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key (squad_id, user_id)
);

-- ---------- Row-level security ----------

alter table public.districts      enable row level security;
alter table public.elections      enable row level security;
alter table public.races          enable row level security;
alter table public.candidates     enable row level security;
alter table public.officials      enable row level security;
alter table public.profiles       enable row level security;
alter table public.addresses      enable row level security;
alter table public.user_districts enable row level security;
alter table public.voting_plans   enable row level security;
alter table public.reminders      enable row level security;
alter table public.race_progress  enable row level security;
alter table public.squads         enable row level security;
alter table public.squad_members  enable row level security;

-- Public civic data: read-only for everyone (writes via service role only).
create policy "civic read" on public.districts  for select using (true);
create policy "civic read" on public.elections  for select using (true);
create policy "civic read" on public.races      for select using (true);
create policy "civic read" on public.candidates for select using (true);
create policy "civic read" on public.officials  for select using (true);

-- Profiles: public ones are visible to signed-in users; you manage your own.
create policy "profiles read" on public.profiles for select
  using (is_public or id = auth.uid());
create policy "profiles insert own" on public.profiles for insert with check (id = auth.uid());
create policy "profiles update own" on public.profiles for update using (id = auth.uid());

-- Owner-only private tables.
create policy "own address"   on public.addresses      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own districts" on public.user_districts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own plan"      on public.voting_plans   for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own reminders" on public.reminders      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own progress"  on public.race_progress  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Squads: members can see their squads and fellow members.
create or replace function public.is_squad_member(sid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.squad_members where squad_id = sid and user_id = auth.uid());
$$;

create policy "squad read"   on public.squads for select using (public.is_squad_member(id));
create policy "squad create" on public.squads for insert with check (created_by = auth.uid());
create policy "members read" on public.squad_members for select using (public.is_squad_member(squad_id));
create policy "join self"    on public.squad_members for insert with check (user_id = auth.uid());
create policy "leave self"   on public.squad_members for delete using (user_id = auth.uid());

-- Squad progress: exposes ONLY a yes/no "has a plan" for members who opted in.
-- No addresses, times or methods ever leave voting_plans.
create or replace function public.squad_plan_progress(sid uuid)
returns table (members int, with_plan int)
language sql security definer stable set search_path = public as $$
  select
    count(*)::int,
    count(*) filter (where vp.share_with_squad and vp.registered and vp.polling_place is not null)::int
  from public.squad_members sm
  left join public.voting_plans vp on vp.user_id = sm.user_id
  where sm.squad_id = sid and public.is_squad_member(sid);
$$;
