import * as Linking from 'expo-linking';

import { supabase } from './supabase';

/**
 * Squad calls. Every write is a database function (see the squads migration),
 * so invite codes, the 3-squad limit and owner rules are enforced server side.
 */

export const MAX_SQUADS = 3;

export type Squad = {
  id: string;
  name: string;
  goal: string | null;
  goalEnds: string | null; // 'YYYY-MM-DD'
  inviteCode: string;
  role: 'owner' | 'member';
  members: number;
  withPlan: number;
  nudgedToday: boolean;
};

/** Handle always. Name and school only when that person's profile is public. */
export type Member = { userId: string; handle: string | null; name: string | null; role: 'owner' | 'member'; isMe: boolean };

export type Nudge = { squadName: string; day: string };

type Res<T> = { ok: true; data: T } | { ok: false; message: string };

const MESSAGES: Record<string, string> = {
  not_signed_in: 'Sign in first.',
  no_profile: 'Finish your profile first.',
  squad_limit: `You can be in up to ${MAX_SQUADS} squads. Leave one to join another.`,
  bad_code: "That code didn't match a squad. Check it and try again.",
  bad_name: 'Squad names are 1 to 40 characters.',
  bad_goal: 'Keep the goal under 120 characters.',
  not_owner: 'Only the squad owner can do that.',
  not_member: "You're not in that squad anymore.",
  already_nudged: 'You already nudged this squad today. Try again tomorrow.',
  use_leave: 'To remove yourself, leave the squad.',
  too_many_tries: 'Too many tries. Try again later.',
};

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<Res<T>> {
  if (!supabase) return { ok: false, message: 'Accounts are not connected yet.' };
  const { data, error } = await supabase.rpc(fn, args);
  if (error) return { ok: false, message: MESSAGES[error.message] ?? 'Something went wrong. Check your connection and try again.' };
  return { ok: true, data: data as T };
}

type SquadRow = {
  id: string; name: string; goal: string | null; goal_ends: string | null; invite_code: string;
  role: 'owner' | 'member'; members: number; with_plan: number; nudged_today: boolean;
};

export async function mySquads(): Promise<Res<Squad[]>> {
  const res = await call<SquadRow[]>('my_squads');
  if (!res.ok) return res;
  return {
    ok: true,
    data: res.data.map((r) => ({
      id: r.id, name: r.name, goal: r.goal, goalEnds: r.goal_ends, inviteCode: r.invite_code, role: r.role,
      members: r.members, withPlan: r.with_plan, nudgedToday: r.nudged_today,
    })),
  };
}

export async function squadRoster(squadId: string): Promise<Res<Member[]>> {
  const res = await call<{ user_id: string; handle: string | null; display_name: string | null; role: 'owner' | 'member'; is_me: boolean }[]>(
    'squad_roster',
    { sid: squadId },
  );
  if (!res.ok) return res;
  return { ok: true, data: res.data.map((r) => ({ userId: r.user_id, handle: r.handle, name: r.display_name, role: r.role, isMe: r.is_me })) };
}

export const createSquad = (name: string, goal: string | null, goalEnds: string | null) =>
  call<string>('create_squad', { p_name: name, p_goal: goal, p_goal_ends: goalEnds });

/** A wrong code comes back as null (the server counts it toward 10 per hour). */
export async function joinSquad(code: string): Promise<Res<string>> {
  const res = await call<string | null>('join_squad', { p_code: code });
  if (!res.ok) return res;
  return res.data ? { ok: true, data: res.data } : { ok: false, message: MESSAGES.bad_code };
}

export const updateSquad = (squadId: string, name: string, goal: string | null, goalEnds: string | null) =>
  call<null>('update_squad', { sid: squadId, p_name: name, p_goal: goal, p_goal_ends: goalEnds });

export const resetInviteCode = (squadId: string) => call<string>('reset_invite_code', { sid: squadId });

export const removeMember = (squadId: string, userId: string) => call<null>('remove_member', { sid: squadId, p_user: userId });

export const leaveSquad = (squadId: string) => call<null>('leave_squad', { sid: squadId });

export const nudgeSquad = (squadId: string) => call<number>('nudge_squad', { sid: squadId });

export async function myNudge(): Promise<Res<Nudge | null>> {
  const res = await call<{ squad_name: string; day: string }[]>('my_nudge');
  if (!res.ok) return res;
  const row = res.data[0];
  return { ok: true, data: row ? { squadName: row.squad_name, day: row.day } : null };
}

/** civicapp://join/CODE in builds (exp://…/--/join/CODE in Expo Go). Opens src/app/join/[code].tsx. */
export const joinLink = (code: string) => Linking.createURL(`join/${code}`);

/** Invite codes are shown in two halves for reading aloud: ABCDE-FGHJK. */
export const formatCode = (code: string) => (code.length === 10 ? `${code.slice(0, 5)}-${code.slice(5)}` : code);

// ---------- Leaderboards ----------

export type StreakScope = 'squad' | 'school' | 'delaware';
export type SquadScope = 'school' | 'delaware';

/** Opted-in people only. Name is null unless their profile is public. */
export type StreakEntry = { rank: number; handle: string; name: string | null; current: number; best: number; isMe: boolean };
export type SquadEntry = { rank: number; squadId: string; name: string; members: number; pct: number; isMine: boolean };

export async function streakBoard(scope: StreakScope, squadId: string | null): Promise<Res<StreakEntry[]>> {
  const res = await call<{ rank: number; handle: string; display_name: string | null; current: number; best: number; is_me: boolean }[]>(
    'streak_board',
    { p_scope: scope, p_squad: squadId },
  );
  if (!res.ok) return res;
  return {
    ok: true,
    data: res.data.map((r) => ({ rank: r.rank, handle: r.handle, name: r.display_name, current: r.current, best: r.best, isMe: r.is_me })),
  };
}

/** Only squads with 5 or more members. */
export async function squadBoard(scope: SquadScope): Promise<Res<SquadEntry[]>> {
  const res = await call<{ rank: number; squad_id: string; name: string; members: number; pct: number; is_mine: boolean }[]>('squad_board', {
    p_scope: scope,
  });
  if (!res.ok) return res;
  return {
    ok: true,
    data: res.data.map((r) => ({ rank: r.rank, squadId: r.squad_id, name: r.name, members: r.members, pct: r.pct, isMine: r.is_mine })),
  };
}
