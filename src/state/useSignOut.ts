import { useCallback } from 'react';

import { signOut } from '@/lib/auth';
import { deleteMyAccount } from '@/lib/cloud';
import { confirm } from '@/lib/confirm';
import { clearReminders } from '@/lib/reminders';
import { useBallot } from '@/state/BallotProvider';
import { useDrops } from '@/state/DropProvider';
import { useFollows } from '@/state/FollowProvider';
import { useProfile } from '@/state/ProfileProvider';
import { useStreak } from '@/state/StreakProvider';

/**
 * Wipes everything this device holds for the person: profile and address,
 * voting plan, streak, saved Drops and questions, follows and scheduled reminders.
 * The next person on the phone starts clean.
 * Squad data is never stored on the device; SquadProvider drops it when the user goes away.
 */
function useClearDevice() {
  const profile = useProfile();
  const ballot = useBallot();
  const streak = useStreak();
  const drops = useDrops();
  const follows = useFollows();

  return useCallback(async () => {
    await clearReminders().catch(() => {});
    ballot.reset();
    streak.reset();
    drops.reset();
    follows.reset();
    profile.reset();
  }, [profile, ballot, streak, drops, follows]);
}

/** Signs out after asking, then wipes the device. Resolves true if they signed out. */
export function useSignOut() {
  const clearDevice = useClearDevice();

  return useCallback(async () => {
    const ok = await confirm('Sign out?', 'This will remove your plan and progress from this phone.', 'Sign out', true);
    if (!ok) return false;
    await signOut();
    await clearDevice();
    return true;
  }, [clearDevice]);
}

/**
 * Deletes the account after asking twice, then wipes the device like sign-out.
 * Resolves 'cancelled', 'deleted', or an error message to show.
 */
export function useDeleteAccount() {
  const clearDevice = useClearDevice();

  return useCallback(async (onConfirmed?: () => void): Promise<'cancelled' | 'deleted' | { error: string }> => {
    const first = await confirm(
      'Delete your account?',
      'This deletes your profile, follows, streak and squad memberships from our servers, and everything on this phone.',
      'Continue',
      true,
    );
    if (!first) return 'cancelled';
    const second = await confirm('Are you sure?', 'This can’t be undone. Squads you own pass to the next member.', 'Delete account', true);
    if (!second) return 'cancelled';
    onConfirmed?.();
    const res = await deleteMyAccount();
    if (!res.ok) return { error: 'We couldn’t delete your account. Check your connection and try again.' };
    // The server already removed the user; this just drops the local session.
    await signOut('local').catch(() => {});
    await clearDevice();
    return 'deleted';
  }, [clearDevice]);
}
