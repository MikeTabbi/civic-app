// End-to-end check of the delete-account Edge Function with throwaway accounts.
// Creates two users (e2e-del-*@example.test), gives the first a profile, follow,
// streak, plan status and a squad the second has joined, deletes the first through
// the deployed function, then checks every row is gone and the squad passed on.
//
//   node --env-file=.env --env-file=.secrets/service.env scripts/dev/delete-account-e2e.mjs
//
// Deploy the function first (docs/delete-account.md). Uses the service key only to
// create, sign in, inspect and clean up the test users.

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

let failures = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `  (${detail})` : ''}`);
};

async function signedIn(name) {
  const email = `e2e-del-${name}-${run}@example.test`;
  const created = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (created.error) throw new Error(`createUser ${name}: ${created.error.message}`);
  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (link.error) throw new Error(`generateLink ${name}: ${link.error.message}`);
  const client = createClient(url, anonKey, opts);
  const v = await client.auth.verifyOtp({ email, token: link.data.properties.email_otp, type: 'email' });
  if (v.error) throw new Error(`verifyOtp ${name}: ${v.error.message}`);
  await client.from('profiles').upsert({ id: created.data.user.id, handle: `e2e_del_${name}_${run}` });
  return { id: created.data.user.id, db: client };
}

const rowsFor = async (id) => {
  const counts = {};
  for (const [table, col] of [
    ['profiles', 'id'], ['follows', 'user_id'], ['public_streaks', 'user_id'],
    ['voting_plans', 'user_id'], ['squad_members', 'user_id'],
  ]) {
    const { count } = await admin.from(table).select('*', { count: 'exact', head: true }).eq(col, id);
    counts[table] = count;
  }
  return counts;
};

let a, b, squadId;
try {
  a = await signedIn('a');
  b = await signedIn('b');
  await a.db.from('follows').insert({ user_id: a.id, official_id: 'us-senate-coons' });
  await a.db.from('public_streaks').upsert({ user_id: a.id, current: 1, best: 1, opted_in: true });
  await a.db.from('voting_plans').upsert({ user_id: a.id, has_plan: true, share_with_squad: true });
  const made = await a.db.rpc('create_squad', { p_name: `Delete test ${run}` });
  squadId = made.data;
  const { data: code } = await admin.from('squads').select('invite_code').eq('id', squadId).single();
  await b.db.rpc('join_squad', { p_code: code.invite_code });

  const before = await rowsFor(a.id);
  check(Object.values(before).every((n) => n > 0), 'test user has rows before', JSON.stringify(before));

  const anon = createClient(url, anonKey, opts);
  const forged = await anon.functions.invoke('delete-account', { method: 'POST' });
  check(!!forged.error, 'call without a signed-in user is refused');

  const res = await a.db.functions.invoke('delete-account', { method: 'POST' });
  check(!res.error, 'function returns ok', res.error?.message);

  const { data: gone } = await admin.auth.admin.getUserById(a.id);
  check(!gone?.user, 'auth user deleted');
  const after = await rowsFor(a.id);
  check(Object.values(after).every((n) => n === 0), 'all rows deleted', JSON.stringify(after));

  const { data: owner } = await admin.from('squad_members').select('user_id, role').eq('squad_id', squadId);
  check(owner?.length === 1 && owner[0].user_id === b.id && owner[0].role === 'owner', 'squad passed to the next member', JSON.stringify(owner));
} catch (e) {
  failures++;
  console.log('FAIL  crashed:', e.message);
} finally {
  if (squadId) await admin.from('squads').delete().eq('id', squadId);
  for (const u of [a, b]) if (u) await admin.auth.admin.deleteUser(u.id).catch(() => {});
  console.log(failures ? `${failures} failed` : 'all passed');
  process.exit(failures ? 1 : 0);
}
