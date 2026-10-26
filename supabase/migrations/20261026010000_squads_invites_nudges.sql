-- Step 2 of the Squad build: create, invite, join, nudge, manage.
-- All squad writes go through the security definer functions below, so the
-- rules live here and not in the app:
--   * The only way into a squad is a valid invite code (the open "join self"
--     policy is dropped).
--   * Up to 3 squads per person.
--   * Owner-only: rename, change goal, reset code, remove a member.
--   * Squads see a member's handle only. Name and school only if the profile is public.
--   * Nudges are readable only by the person nudged, so a sender can't tell
--     who lacks a plan.

-- ---------- Helpers ----------

-- "Today" for the pilot is Delaware's date.
create or replace function public.de_today()
returns date language sql stable as $$
  select (now() at time zone 'America/New_York')::date;
$$;

-- 10 characters from a 32-letter alphabet (no 0/O, 1/I) = 50 random bits.
-- 256 is a multiple of 32, so taking each byte mod 32 has no bias.
create or replace function public.new_invite_code()
returns text language plpgsql volatile set search_path = public, extensions as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea := gen_random_bytes(10);
  code text := '';
begin
  for i in 0..9 loop
    code := code || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return code;
end;
$$;

create or replace function public.is_squad_owner(sid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.squad_members where squad_id = sid and user_id = auth.uid() and role = 'owner');
$$;

-- ---------- Squads: invite code and limits ----------

alter table public.squads add column invite_code text;
update public.squads set invite_code = public.new_invite_code() where invite_code is null;
alter table public.squads
  alter column invite_code set default public.new_invite_code(),
  alter column invite_code set not null,
  add constraint squads_invite_code_key unique (invite_code),
  add constraint squads_invite_code_len check (char_length(invite_code) >= 8),
  add constraint squads_name_len check (char_length(btrim(name)) between 1 and 40) not valid,
  add constraint squads_goal_len check (goal is null or char_length(goal) <= 120) not valid;

-- Writes now go through the functions below.
drop policy "join self"    on public.squad_members;
drop policy "leave self"   on public.squad_members;
drop policy "squad create" on public.squads;

-- Up to 3 squads per person, checked under a per-user lock so two joins at once can't both pass.
create or replace function public.enforce_squad_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtext('squad_limit:' || new.user_id::text));
  if (select count(*) from public.squad_members where user_id = new.user_id) >= 3 then
    raise exception 'squad_limit';
  end if;
  return new;
end;
$$;

create trigger squad_limit before insert on public.squad_members
  for each row execute function public.enforce_squad_limit();

-- ---------- Nudges ----------

create table public.squad_nudges (
  squad_id   uuid not null references public.squads(id) on delete cascade,
  from_user  uuid not null references auth.users(id) on delete cascade,
  to_user    uuid not null references auth.users(id) on delete cascade,
  day        date not null default public.de_today(),
  created_at timestamptz not null default now(),
  primary key (squad_id, from_user, to_user, day)
);

alter table public.squad_nudges enable row level security;

-- Only the person nudged can see it. Inserts go through nudge_squad().
create policy "nudges to me" on public.squad_nudges for select using (to_user = auth.uid());

-- ---------- Functions the app calls ----------

-- My squads with the real count from squad_plan_progress. Ordered by when I joined.
create or replace function public.my_squads()
returns table (
  id uuid, name text, goal text, goal_ends date, invite_code text, role text,
  members int, with_plan int, nudged_today boolean
)
language sql security definer stable set search_path = public as $$
  select s.id, s.name, s.goal, s.goal_ends, s.invite_code, me.role, p.members, p.with_plan,
         exists (select 1 from public.squad_nudges n
                 where n.squad_id = s.id and n.from_user = auth.uid() and n.day = public.de_today())
  from public.squad_members me
  join public.squads s on s.id = me.squad_id
  cross join lateral public.squad_plan_progress(s.id) p
  where me.user_id = auth.uid()
  order by me.joined_at;
$$;

-- Members of a squad I'm in. Handle always; name and school only for public profiles.
-- Never any plan data.
create or replace function public.squad_roster(sid uuid)
returns table (user_id uuid, handle text, display_name text, school text, role text, is_me boolean)
language sql security definer stable set search_path = public as $$
  select sm.user_id, p.handle,
         case when p.is_public then p.display_name end,
         case when p.is_public then p.school end,
         sm.role, sm.user_id = auth.uid()
  from public.squad_members sm
  left join public.profiles p on p.id = sm.user_id
  where sm.squad_id = sid and public.is_squad_member(sid)
  order by sm.role = 'owner' desc, sm.joined_at;
$$;

create or replace function public.create_squad(p_name text, p_goal text default null, p_goal_ends date default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  sid uuid;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  if not exists (select 1 from public.profiles where id = uid) then raise exception 'no_profile'; end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 40 then raise exception 'bad_name'; end if;
  if char_length(btrim(coalesce(p_goal, ''))) > 120 then raise exception 'bad_goal'; end if;

  insert into public.squads (name, goal, goal_ends, school, created_by)
  values (btrim(p_name), nullif(btrim(p_goal), ''), p_goal_ends,
          (select nullif(school, 'Other') from public.profiles where id = uid), uid)
  returning id into sid;
  insert into public.squad_members (squad_id, user_id, role) values (sid, uid, 'owner');
  return sid;
end;
$$;

-- Joins by code. Spaces, dashes and case are ignored. Joining twice is a no-op.
create or replace function public.join_squad(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  sid uuid;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  if not exists (select 1 from public.profiles where id = uid) then raise exception 'no_profile'; end if;
  select id into sid from public.squads
  where invite_code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if sid is null then raise exception 'bad_code'; end if;
  if public.is_squad_member(sid) then return sid; end if;
  insert into public.squad_members (squad_id, user_id, role) values (sid, uid, 'member');
  return sid;
end;
$$;

create or replace function public.update_squad(sid uuid, p_name text, p_goal text, p_goal_ends date)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_squad_owner(sid) then raise exception 'not_owner'; end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 40 then raise exception 'bad_name'; end if;
  if char_length(btrim(coalesce(p_goal, ''))) > 120 then raise exception 'bad_goal'; end if;
  update public.squads
  set name = btrim(p_name), goal = nullif(btrim(p_goal), ''), goal_ends = p_goal_ends
  where id = sid;
end;
$$;

-- The old code stops working right away.
create or replace function public.reset_invite_code(sid uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  code text;
begin
  if not public.is_squad_owner(sid) then raise exception 'not_owner'; end if;
  update public.squads set invite_code = public.new_invite_code() where id = sid returning invite_code into code;
  return code;
end;
$$;

create or replace function public.remove_member(sid uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_squad_owner(sid) then raise exception 'not_owner'; end if;
  if p_user = auth.uid() then raise exception 'use_leave'; end if;
  delete from public.squad_members where squad_id = sid and user_id = p_user;
end;
$$;

-- An owner who leaves hands the squad to the longest-standing member.
-- The last one out deletes the squad (and its nudges, by cascade).
create or replace function public.leave_squad(sid uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  heir uuid;
begin
  if not public.is_squad_member(sid) then raise exception 'not_member'; end if;
  if public.is_squad_owner(sid) then
    select user_id into heir from public.squad_members
    where squad_id = sid and user_id <> uid
    order by joined_at limit 1;
    if heir is null then
      delete from public.squads where id = sid;
      return;
    end if;
    update public.squad_members set role = 'owner' where squad_id = sid and user_id = heir;
  end if;
  delete from public.squad_members where squad_id = sid and user_id = uid;
end;
$$;

-- One nudge per sender per squad per day, to members not counted as having a plan.
-- Returns how many were nudged (already knowable from the X of N count).
-- TODO: send an Expo push to each nudged member via an Edge Function.
create or replace function public.nudge_squad(sid uuid)
returns int language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  n int;
begin
  if not public.is_squad_member(sid) then raise exception 'not_member'; end if;
  if exists (select 1 from public.squad_nudges where squad_id = sid and from_user = uid and day = public.de_today()) then
    raise exception 'already_nudged';
  end if;
  insert into public.squad_nudges (squad_id, from_user, to_user)
  select sid, uid, sm.user_id
  from public.squad_members sm
  left join public.voting_plans vp on vp.user_id = sm.user_id
  where sm.squad_id = sid and sm.user_id <> uid
    and not coalesce(vp.share_with_squad and vp.has_plan, false);
  get diagnostics n = row_count;
  return n;
end;
$$;

-- The latest nudge sent to me today or yesterday, from a squad I'm still in. No sender.
create or replace function public.my_nudge()
returns table (squad_name text, day date)
language sql security definer stable set search_path = public as $$
  select s.name, n.day
  from public.squad_nudges n
  join public.squads s on s.id = n.squad_id
  where n.to_user = auth.uid() and n.day >= public.de_today() - 1 and public.is_squad_member(n.squad_id)
  order by n.created_at desc
  limit 1;
$$;

-- Only signed-in users may call these.
revoke execute on function
  public.my_squads(), public.squad_roster(uuid), public.create_squad(text, text, date),
  public.join_squad(text), public.update_squad(uuid, text, text, date), public.reset_invite_code(uuid),
  public.remove_member(uuid, uuid), public.leave_squad(uuid), public.nudge_squad(uuid), public.my_nudge()
from public, anon;
grant execute on function
  public.my_squads(), public.squad_roster(uuid), public.create_squad(text, text, date),
  public.join_squad(text), public.update_squad(uuid, text, text, date), public.reset_invite_code(uuid),
  public.remove_member(uuid, uuid), public.leave_squad(uuid), public.nudge_squad(uuid), public.my_nudge()
to authenticated;
