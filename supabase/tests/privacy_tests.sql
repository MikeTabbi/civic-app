-- Privacy tests. Paste into the Supabase SQL editor and run:
--   pbcopy < supabase/tests/privacy_tests.sql
-- Everything runs inside one DO block. Test users and rows are created, checked
-- as those users (role authenticated + JWT claims, the same path the app uses),
-- then deleted. Any failure raises "FAIL ..." and rolls the whole block back.
-- On success the last query lists each test as PASS. No table is created: the
-- results are passed out through a session setting, so nothing is left behind.
--
-- Users: o = owner of two squads, m = member, x = outsider, s1..s3 = fillers.
-- Squad big has 5 members (o, m, s1, s2, s3). Squad small has 4 (o, m, s1, s2).

-- Earlier versions used a temp table; clear it if this session still has one.
drop table if exists pg_temp.privacy_results;

do $$
declare
  o  uuid := 'a0000000-0000-4000-8000-000000000001';
  m  uuid := 'a0000000-0000-4000-8000-000000000002';
  x  uuid := 'a0000000-0000-4000-8000-000000000003';
  s1 uuid := 'a0000000-0000-4000-8000-000000000004';
  s2 uuid := 'a0000000-0000-4000-8000-000000000005';
  s3 uuid := 'a0000000-0000-4000-8000-000000000006';
  big   uuid := 'b0000000-0000-4000-8000-000000000001';
  small uuid := 'b0000000-0000-4000-8000-000000000002';
  n int;
  results text[] := '{}';
begin
  -- ---------- Setup (as postgres, bypassing RLS) ----------
  insert into auth.users (id, email, aud, role)
  select u, 'privacy-test-' || right(u::text, 2) || '@example.test', 'authenticated', 'authenticated'
  from unnest(array[o, m, x, s1, s2, s3]) u;

  insert into public.profiles (id, handle, display_name, school, is_public) values
    (o,  'ptest_owner',    'Owner',    'Delaware State University', true),
    (m,  'ptest_member',   'Member',   'Delaware State University', false),
    (x,  'ptest_outsider', 'Outsider', 'Delaware State University', true),
    (s1, 'ptest_s1', null, 'Delaware State University', true),
    (s2, 'ptest_s2', null, 'Delaware State University', true),
    (s3, 'ptest_s3', null, 'Delaware State University', true);

  insert into public.squads (id, name, school, created_by) values
    (big,   'ptest big squad',   'Delaware State University', o),
    (small, 'ptest small squad', 'Delaware State University', o);
  insert into public.squad_members (squad_id, user_id, role) values
    (big, o, 'owner'), (big, m, 'member'), (big, s1, 'member'), (big, s2, 'member'), (big, s3, 'member'),
    (small, o, 'owner'), (small, m, 'member'), (small, s1, 'member'), (small, s2, 'member');

  -- m has a full private plan and shares has_plan.
  insert into public.voting_plans (user_id, registered, polling_place, method, has_plan, share_with_squad)
  values (m, true, '123 Secret St', 'early', true, true);

  -- o opted in; m has a longer streak but did NOT opt in.
  insert into public.public_streaks (user_id, current, best, last_day, opted_in) values
    (o, 3, 3, public.de_today(), true),
    (m, 9, 9, public.de_today(), false);

  -- ---------- 1. A non-member can't read a squad ----------
  perform set_config('request.jwt.claims', json_build_object('sub', x, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', x::text, true);
  execute 'set local role authenticated';

  select count(*) into n from public.squads where id in (big, small);
  if n <> 0 then raise exception 'FAIL 1: non-member read % squad rows', n; end if;
  select count(*) into n from public.squad_members where squad_id in (big, small);
  if n <> 0 then raise exception 'FAIL 1: non-member read % member rows', n; end if;
  select count(*) into n from public.squad_roster(big);
  if n <> 0 then raise exception 'FAIL 1: non-member read the roster'; end if;
  select count(*) into n from public.squad_plan_progress(big) where members > 0;
  if n <> 0 then raise exception 'FAIL 1: non-member read plan progress'; end if;
  select count(*) into n from public.streak_board('squad', big);
  if n <> 0 then raise exception 'FAIL 1: non-member read the squad streak board'; end if;
  results := array_append(results, 'PASS 1: non-member cannot read a squad, its members, roster, progress or board');

  -- ---------- 2. A member can't read another member's voting_plans row ----------
  perform set_config('request.jwt.claims', json_build_object('sub', o, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', o::text, true);

  select count(*) into n from public.voting_plans where user_id = m;
  if n <> 0 then raise exception 'FAIL 2: squadmate read another member''s voting_plans row'; end if;
  -- Control: the squad count still sees m's shared yes/no.
  select with_plan into n from public.squad_plan_progress(big);
  if n <> 1 then raise exception 'FAIL 2 (control): expected 1 with a plan, got %', n; end if;
  results := array_append(results, 'PASS 2: squadmate cannot read another member''s plan; squad sees only the count');

  -- ---------- 3. A non-opted-in streak never appears ----------
  select count(*) into n from (
    select handle from public.streak_board('delaware')
    union all select handle from public.streak_board('school')
    union all select handle from public.streak_board('squad', big)
  ) b where b.handle = 'ptest_member';
  if n <> 0 then raise exception 'FAIL 3: non-opted-in streak appeared % times', n; end if;
  select count(*) into n from public.public_streaks where user_id = m;
  if n <> 0 then raise exception 'FAIL 3: read another person''s public_streaks row directly'; end if;
  -- Control: the opted-in owner does appear.
  select count(*) into n from public.streak_board('delaware') where handle = 'ptest_owner';
  if n <> 1 then raise exception 'FAIL 3 (control): opted-in streak missing'; end if;
  results := array_append(results, 'PASS 3: non-opted-in streak never appears in any scope');

  -- ---------- 4. A squad under 5 members never appears on the Squads board ----------
  select count(*) into n from (
    select squad_id from public.squad_board('delaware') union all select squad_id from public.squad_board('school')
  ) b where b.squad_id = small;
  if n <> 0 then raise exception 'FAIL 4: 4-member squad appeared on the board'; end if;
  -- Control: the 5-member squad does appear.
  select count(*) into n from public.squad_board('delaware') where squad_id = big;
  if n <> 1 then raise exception 'FAIL 4 (control): 5-member squad missing'; end if;
  results := array_append(results, 'PASS 4: squads under 5 members never appear on the Squads board');

  -- ---------- 5. Nudges and plan details stay private ----------
  perform public.nudge_squad(big);
  select count(*) into n from public.squad_nudges;
  if n <> 0 then raise exception 'FAIL 5: sender can see who was nudged'; end if;
  results := array_append(results, 'PASS 5: nudge sender cannot see who was nudged');

  -- ---------- Cleanup ----------
  execute 'reset role';
  delete from public.squads where id in (big, small);
  delete from auth.users where id in (o, m, x, s1, s2, s3);

  perform set_config('privacy_tests.results', array_to_string(results, E'\n'), false);
end;
$$;

select r.n, r.test
from unnest(string_to_array(current_setting('privacy_tests.results'), E'\n')) with ordinality as r(test, n)
order by r.n;
