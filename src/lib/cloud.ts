import { supabase } from './supabase';

/**
 * Writes from the device to Supabase. Each one sends only the columns listed
 * here; RLS limits every row to its owner. No-ops when signed out.
 */

type Result = { ok: true } | { ok: false; reason: 'signed_out' | 'handle_taken' | 'error'; message: string };

async function myId() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

const signedOut: Result = { ok: false, reason: 'signed_out', message: 'Sign in first.' };

export type ProfileRow = { handle: string; name: string; school: string | null; isPublic: boolean };

/** Public profile fields. A taken handle comes back as reason 'handle_taken'. */
export async function upsertProfile(p: ProfileRow): Promise<Result> {
  const id = await myId();
  if (!supabase || !id) return signedOut;
  const { error } = await supabase
    .from('profiles')
    .upsert({ id, handle: p.handle, display_name: p.name || null, school: p.school, is_public: p.isPublic });
  if (!error) return { ok: true };
  if (error.code === '23505' && /handle/.test(error.message)) {
    return { ok: false, reason: 'handle_taken', message: 'That handle is taken. Try another one.' };
  }
  return { ok: false, reason: 'error', message: error.message };
}

/**
 * Plan status for squads: a yes/no and the share flag, nothing else.
 * has_plan is only sent as true while sharing is on, so it never sits on the server otherwise.
 */
export async function upsertPlanStatus(hasPlan: boolean, share: boolean): Promise<Result> {
  const id = await myId();
  if (!supabase || !id) return signedOut;
  const { error } = await supabase
    .from('voting_plans')
    .upsert({ user_id: id, has_plan: share && hasPlan, share_with_squad: share, updated_at: new Date().toISOString() });
  return error ? { ok: false, reason: 'error', message: error.message } : { ok: true };
}

export type StreakRow = { current: number; best: number; lastDay: string | null; optedIn: boolean };

export async function upsertStreak(s: StreakRow): Promise<Result> {
  const id = await myId();
  if (!supabase || !id) return signedOut;
  const { error } = await supabase.from('public_streaks').upsert({
    user_id: id,
    current: s.current,
    best: Math.max(s.best, s.current),
    last_day: s.lastDay,
    opted_in: s.optedIn,
    updated_at: new Date().toISOString(),
  });
  return error ? { ok: false, reason: 'error', message: error.message } : { ok: true };
}
