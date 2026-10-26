// End-to-end check of the Squad backend with real signed-in accounts.
// Creates 5 throwaway users (e2e-*@example.test), signs each in with the
// publishable key exactly like the app, runs every squad and leaderboard flow,
// then deletes the users and their squads.
//
//   node --env-file=.env --env-file=.secrets/service.env scripts/dev/squad-e2e.mjs
//
// Uses the service role key (git-ignored) only to create, sign in and delete the test users.

import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY (.env) or SUPABASE_SERVICE_ROLE_KEY (.secrets/service.env).');
  process.exit(1);
}

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, serviceKey, opts);
const run = Math.random().toString(36).slice(2, 7);
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

let failures = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `  (${detail})` : ''}`);
};

async function signedIn(name) {
  const email = `e2e-${name}-${run}@example.test`;
  const created = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (created.error) throw new Error(`createUser ${name}: ${created.error.message}`);
  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (link.error) throw new Error(`generateLink ${name}: ${link.error.message}`);
  const client = createClient(url, anonKey, opts);
  const v = await client.auth.verifyOtp({ email, token: link.data.properties.email_otp, type: 'email' });
  if (v.error) throw new Error(`verifyOtp ${name}: ${v.error.message}`);
  return { name, id: created.data.user.id, db: client, handle: `e2e_${name}_${run}` };
}

const rpc = async (u, fn, args) => {
  const { data, error } = await u.db.rpc(fn, args);
  return { data, error: error?.message ?? null };
};

const users = [];
try {
  for (const n of ['a', 'b', 'c', 'd', 'e']) users.push(await signedIn(n));
  const [A, B, C, D, E] = users;

  // ---------- Step 1: sync ----------
  for (const u of users) {
    const { error } = await u.db.from('profiles').upsert({
      id: u.id, handle: u.handle, display_name: `Test ${u.name.toUpperCase()}`, school: 'Delaware State University', is_public: u !== B,
    });
    if (error) throw new Error(`profile ${u.name}: ${error.message}`);
  }
  const dupe = await B.db.from('profiles').upsert({ id: B.id, handle: A.handle, display_name: null, school: null, is_public: false });
  check(dupe.error?.code === '23505' && /handle/.test(dupe.error.message), 'Taken handle is rejected with a handle unique error', dupe.error?.message);

  // ---------- Step 2: squads ----------
  const created = await rpc(A, 'create_squad', { p_name: `e2e squad ${run}`, p_goal: 'Everyone has a plan', p_goal_ends: '2026-11-03' });
  check(!created.error && created.data, 'Create a squad', created.error);
  const S = created.data;
  let mine = (await rpc(A, 'my_squads')).data ?? [];
  const code = mine[0]?.invite_code ?? '';
  check(mine.length === 1 && mine[0].role === 'owner' && /^[A-Z2-9]{10}$/.test(code), 'Owner sees squad with a 10-character code', JSON.stringify(mine));

  const peek = await B.db.from('squads').select('id').eq('id', S);
  check((peek.data ?? []).length === 0, 'Non-member cannot read the squad');
  const peekRoster = await rpc(B, 'squad_roster', { sid: S });
  check((peekRoster.data ?? []).length === 0, 'Non-member cannot read the roster');

  const wrong = await rpc(B, 'join_squad', { p_code: 'WRONGCODE1' });
  check(wrong.data === null && !wrong.error, 'Wrong code returns null', wrong.error);
  const joined = await rpc(B, 'join_squad', { p_code: `${code.slice(0, 5).toLowerCase()}-${code.slice(5)}` });
  check(joined.data === S, 'Join by code (lowercase, with dash)', joined.error);

  const roster = (await rpc(A, 'squad_roster', { sid: S })).data ?? [];
  const bRow = roster.find((r) => r.user_id === B.id);
  check(roster.length === 2 && bRow?.handle === B.handle && bRow?.display_name === null && bRow?.school === null,
    'Roster shows a private member by handle only', JSON.stringify(bRow));

  const progress = async () => (await rpc(A, 'my_squads')).data?.find((s) => s.id === S);
  await B.db.from('voting_plans').upsert({ user_id: B.id, has_plan: true, share_with_squad: true });
  let p = await progress();
  check(p?.with_plan === 1 && p?.members === 2, 'Sharing on: count is 1 of 2', JSON.stringify(p));
  await B.db.from('voting_plans').upsert({ user_id: B.id, has_plan: false, share_with_squad: false });
  p = await progress();
  check(p?.with_plan === 0, 'Sharing off: count drops to 0', JSON.stringify(p));
  const peekPlan = await A.db.from('voting_plans').select('*').eq('user_id', B.id);
  check((peekPlan.data ?? []).length === 0, "Member cannot read another member's voting_plans row");

  const n1 = await rpc(A, 'nudge_squad', { sid: S });
  check(n1.data === 1, 'Nudge reaches the 1 member without a plan', n1.error ?? n1.data);
  const n2 = await rpc(A, 'nudge_squad', { sid: S });
  check(n2.error === 'already_nudged', 'Second nudge the same day is refused', n2.error);
  const bNudge = (await rpc(B, 'my_nudge')).data ?? [];
  check(bNudge[0]?.squad_name === `e2e squad ${run}`, 'Nudged member sees the nudge', JSON.stringify(bNudge));
  const aSees = await A.db.from('squad_nudges').select('*');
  check((aSees.data ?? []).length === 0, 'Sender cannot see who was nudged');
  check((await progress())?.nudged_today === true, 'Squad shows "Nudged today" for the sender');

  const upd = await rpc(B, 'update_squad', { sid: S, p_name: 'hijack', p_goal: null, p_goal_ends: null });
  check(upd.error === 'not_owner', 'Member cannot rename the squad', upd.error);
  const ren = await rpc(A, 'update_squad', { sid: S, p_name: `e2e renamed ${run}`, p_goal: 'All of us vote', p_goal_ends: '2026-11-01' });
  check(!ren.error && (await progress())?.goal === 'All of us vote', 'Owner renames and changes the goal', ren.error);

  const reset = await rpc(A, 'reset_invite_code', { sid: S });
  check(reset.data && reset.data !== code, 'Owner resets the code', reset.error);
  const oldCode = await rpc(C, 'join_squad', { p_code: code });
  check(oldCode.data === null, 'Old code stops working');
  const newCode = await rpc(C, 'join_squad', { p_code: reset.data });
  check(newCode.data === S, 'New code works', newCode.error);

  const rmByMember = await rpc(B, 'remove_member', { sid: S, p_user: C.id });
  check(rmByMember.error === 'not_owner', 'Member cannot remove someone', rmByMember.error);
  await rpc(A, 'remove_member', { sid: S, p_user: C.id });
  check(((await rpc(C, 'my_squads')).data ?? []).length === 0, 'Owner removes a member');
  await rpc(B, 'leave_squad', { sid: S });
  check(((await rpc(B, 'my_squads')).data ?? []).length === 0, 'Member leaves');

  await rpc(B, 'join_squad', { p_code: reset.data });
  await rpc(A, 'leave_squad', { sid: S });
  const bAfter = (await rpc(B, 'my_squads')).data ?? [];
  check(bAfter[0]?.role === 'owner', 'Owner leaving hands the squad to the longest member', JSON.stringify(bAfter));

  // 3-squad limit (D makes 3, the 4th is refused)
  const dSquads = [];
  for (let i = 1; i <= 3; i++) dSquads.push((await rpc(D, 'create_squad', { p_name: `e2e d${i} ${run}` })).data);
  const fourth = await rpc(D, 'create_squad', { p_name: `e2e d4 ${run}` });
  check(fourth.error === 'squad_limit', 'A 4th squad is refused', fourth.error);

  // ---------- Step 3: leaderboards ----------
  const dCode = (await rpc(D, 'my_squads')).data.find((s) => s.id === dSquads[0]).invite_code;
  for (const u of [A, B, C]) await rpc(u, 'join_squad', { p_code: dCode });
  let board = (await rpc(A, 'squad_board', { p_scope: 'delaware' })).data ?? [];
  check(!board.some((r) => r.squad_id === dSquads[0]), 'Squad with 4 members is not on the Squads board');
  await rpc(E, 'join_squad', { p_code: dCode });
  await B.db.from('voting_plans').upsert({ user_id: B.id, has_plan: true, share_with_squad: true });
  board = (await rpc(A, 'squad_board', { p_scope: 'delaware' })).data ?? [];
  const row = board.find((r) => r.squad_id === dSquads[0]);
  check(row?.members === 5 && row?.pct === 20, 'Squad with 5 members appears at 20%', JSON.stringify(row));
  const school = (await rpc(A, 'squad_board', { p_scope: 'school' })).data ?? [];
  check(school.some((r) => r.squad_id === dSquads[0]), 'Squads board, My school scope');

  await A.db.from('public_streaks').upsert({ user_id: A.id, current: 4, best: 4, last_day: today, opted_in: true });
  await B.db.from('public_streaks').upsert({ user_id: B.id, current: 7, best: 7, last_day: today, opted_in: false });
  await C.db.from('public_streaks').upsert({ user_id: C.id, current: 9, best: 9, last_day: '2026-01-01', opted_in: true });
  for (const [scope, sid] of [['delaware', null], ['school', null], ['squad', dSquads[0]]]) {
    const rows = (await rpc(D, 'streak_board', { p_scope: scope, p_squad: sid })).data ?? [];
    check(rows.some((r) => r.handle === A.handle) && !rows.some((r) => r.handle === B.handle),
      `Streaks, ${scope}: opted-in shown, not-opted-in hidden`, JSON.stringify(rows.filter((r) => r.handle.startsWith('e2e'))));
    check(!rows.some((r) => r.handle === C.handle), `Streaks, ${scope}: a lapsed streak counts as 0 and drops off`);
  }
  const meRow = ((await rpc(A, 'streak_board', { p_scope: 'delaware' })).data ?? []).find((r) => r.is_me);
  check(meRow?.handle === A.handle && meRow.current === 4, 'Streaks: my own row comes back as "You"', JSON.stringify(meRow));
  const notIn = await rpc(B, 'streak_board', { p_scope: 'delaware' });
  check(!(notIn.data ?? []).some((r) => r.is_me), 'Streaks: no "You" row when not opted in (prompt shows instead)');
  const outsider = await rpc(D, 'streak_board', { p_scope: 'squad', p_squad: S });
  check((outsider.data ?? []).length === 0, 'Streaks: squad scope is empty for a squad I am not in');

  // Wrong-code limit: 10 wrong tries, the 11th is refused.
  for (let i = 0; i < 10; i++) await rpc(E, 'join_squad', { p_code: `NOPE${i}XXXXX` });
  const eleventh = await rpc(E, 'join_squad', { p_code: dCode });
  check(eleventh.error === 'too_many_tries', '11th try within an hour is refused, even with a good code', eleventh.error);
} catch (e) {
  failures++;
  console.log(`FAIL  ${e.message}`);
} finally {
  const { error } = await admin.from('squads').delete().like('name', `e2e % ${run}`);
  if (error) console.log(`Cleanup squads: ${error.message}`);
  for (const u of users) await admin.auth.admin.deleteUser(u.id);
  console.log(`\nCleaned up ${users.length} test users. ${failures ? `${failures} FAILED` : 'All passed.'}`);
  process.exit(failures ? 1 : 0);
}
