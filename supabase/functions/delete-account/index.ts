// Deletes the signed-in person's account. Called by the app's Settings > Delete account.
//
//   1. Checks the caller's token (only you can delete you).
//   2. Leaves each of their squads AS THEM, through leave_squad(), so an owned
//      squad passes to the next member and an empty one is deleted.
//   3. Deletes the auth user with the service key. Every table holding their rows
//      (profiles, addresses, user_districts, voting_plans, reminders, race_progress,
//      follows, public_streaks, squad_members, squad_nudges, join_attempts) has
//      `on delete cascade` from auth.users, so those rows go in the same step.
//
// The service key is injected by Supabase into this function's environment.
// It never ships in the app.
//
// Deploy: supabase functions deploy delete-account --project-ref <ref>

import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) return json(500, { error: 'not_configured' });

  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { error: 'not_signed_in' });

  const opts = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient(url, serviceKey, opts);

  // getUser checks the token with Supabase Auth, so a forged or expired token fails here.
  const { data: who, error: whoError } = await admin.auth.getUser(token);
  const user = who?.user;
  if (whoError || !user) return json(401, { error: 'not_signed_in' });

  // Squad hand-off runs as the person, since leave_squad() acts on auth.uid().
  const asUser = createClient(url, anonKey, { ...opts, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: squads, error: squadsError } = await asUser.rpc('my_squads');
  if (squadsError) return json(500, { error: 'squads', message: squadsError.message });
  for (const s of (squads ?? []) as { id: string }[]) {
    const { error } = await asUser.rpc('leave_squad', { sid: s.id });
    if (error) return json(500, { error: 'leave_squad', message: error.message });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return json(500, { error: 'delete_user', message: deleteError.message });

  return json(200, { ok: true });
});
