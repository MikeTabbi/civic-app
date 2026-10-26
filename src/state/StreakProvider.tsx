import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { localDateKey } from '@/data/drops';
import { upsertStreak } from '@/lib/cloud';
import { computeStreak, newBadge, type Milestone, type StreakStats } from '@/lib/streak';
import { useAuth } from '@/state/AuthProvider';

/**
 * Drop streaks, saved on the device.
 * A day counts when the person finishes a Drop (answers its quick check) for the
 * first time. Each Drop counts once. Current / best streak and badges are derived
 * from the completed local dates, never stored as counters.
 * When signed in, current / best / last day go to `public_streaks` after each
 * change (owner-only under RLS). Leaderboards only show it when `onLeaderboard` is on.
 * TODO: compute streaks on the server from Drop completions instead of trusting
 * the phone's numbers (fine for the pilot, but a client can fake them).
 */

type Saved = {
  /** Drop id -> local date it was finished ('YYYY-MM-DD'). */
  completed: Record<string, string>;
  /** "Show my streak on leaderboards". Off by default. */
  onLeaderboard: boolean;
};

type Ctx = StreakStats & {
  ready: boolean;
  isDone: (dropId: string) => boolean;
  /** Records the finish. Returns the badge this unlocked, if any. */
  completeDrop: (dropId: string, now?: Date) => Milestone | null;
  /** Stats as of a given day (for the dev date override). */
  statsOn: (now: Date) => StreakStats;
  onLeaderboard: boolean;
  /** Resolves once the server has the change (when signed in), so a board can reload right after. */
  setOnLeaderboard: (on: boolean) => Promise<void>;
  /** Clears streak progress from this device (sign-out). */
  reset: () => void;
};

const KEY = 'streak.v1';
const StreakContext = createContext<Ctx | null>(null);

export function StreakProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<Saved>({ completed: {}, onLeaderboard: false });

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setState({ completed: {}, onLeaderboard: false, ...(JSON.parse(raw) as Partial<Saved>) });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const statsOn = useCallback((now: Date) => computeStreak(Object.values(state.completed), localDateKey(now)), [state]);

  const completeDrop = useCallback(
    (dropId: string, now: Date = new Date()) => {
      if (state.completed[dropId]) return null;
      const today = localDateKey(now);
      const days = Object.values(state.completed);
      const before = computeStreak(days, today);
      const after = computeStreak([...days, today], today);
      const next = { ...state, completed: { ...state.completed, [dropId]: today } };
      setState(next);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return newBadge(before, after);
    },
    [state],
  );

  const isDone = useCallback((dropId: string) => !!state.completed[dropId], [state]);

  const setOnLeaderboard = useCallback(
    async (on: boolean) => {
      const next = { ...state, onLeaderboard: on };
      setState(next);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      const { current, best } = computeStreak(Object.values(next.completed), localDateKey(new Date()));
      const lastDay = Object.values(next.completed).sort().at(-1) ?? null;
      await upsertStreak({ current, best, lastDay, optedIn: on }).catch(() => {});
    },
    [state],
  );

  const reset = useCallback(() => {
    setState({ completed: {}, onLeaderboard: false });
    AsyncStorage.removeItem(KEY).catch(() => {});
  }, []);

  // Sync after each finished Drop, on opt-in changes, and on launch (so a lapsed streak resets).
  const userId = useAuth().user?.id ?? null;
  const { current, best } = statsOn(new Date());
  const lastDay = Object.values(state.completed).sort().at(-1) ?? null;
  const optedIn = state.onLeaderboard;
  useEffect(() => {
    if (!ready || !userId) return;
    upsertStreak({ current, best, lastDay, optedIn }).catch(() => {});
  }, [ready, userId, current, best, lastDay, optedIn]);

  const value = useMemo(
    () => ({ ready, ...statsOn(new Date()), isDone, completeDrop, statsOn, onLeaderboard: state.onLeaderboard, setOnLeaderboard, reset }),
    [ready, statsOn, isDone, completeDrop, state.onLeaderboard, setOnLeaderboard, reset],
  );
  return <StreakContext.Provider value={value}>{children}</StreakContext.Provider>;
}

export function useStreak() {
  const ctx = useContext(StreakContext);
  if (!ctx) throw new Error('useStreak must be used inside <StreakProvider>');
  return ctx;
}
