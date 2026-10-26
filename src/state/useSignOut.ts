import { useCallback } from 'react';

import { signOut } from '@/lib/auth';
import { confirm } from '@/lib/confirm';
import { clearReminders } from '@/lib/reminders';
import { useBallot } from '@/state/BallotProvider';
import { useDrops } from '@/state/DropProvider';
import { useFollows } from '@/state/FollowProvider';
import { useProfile } from '@/state/ProfileProvider';
import { useStreak } from '@/state/StreakProvider';

/**
 * Signs out after asking, then wipes everything this device holds for the
 * person: profile and address, voting plan, streak, saved Drops and questions,
 * follows and scheduled reminders. The next person on the phone starts clean.
 * Squad data is never stored on the device; SquadProvider drops it when the user goes away.
 * Resolves true if they signed out.
 */
export function useSignOut() {
  const profile = useProfile();
  const ballot = useBallot();
  const streak = useStreak();
  const drops = useDrops();
  const follows = useFollows();

  return useCallback(async () => {
    const ok = await confirm('Sign out?', 'This will remove your plan and progress from this phone.', 'Sign out', true);
    if (!ok) return false;
    await signOut();
    await clearReminders().catch(() => {});
    ballot.reset();
    streak.reset();
    drops.reset();
    follows.reset();
    profile.reset();
    return true;
  }, [profile, ballot, streak, drops, follows]);
}
