import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { localDateKey } from '@/data/drops';
import { computeStreak, newBadge, type Milestone, type StreakStats } from '@/lib/streak';

/**
 * Drop streaks, saved on the device.
 * A day counts when the person finishes a Drop (answers its quick check) for the
 * first time. Each Drop counts once. Current / best streak and badges are derived
 * from the completed local dates, never stored as counters.
 * When Supabase is connected this mirrors a `drop_completions` table (owner-only under RLS).
 */

type Saved = {
  /** Drop id -> local date it was finished ('YYYY-MM-DD'). */
  completed: Record<string, string>;
};

type Ctx = StreakStats & {
  ready: boolean;
  isDone: (dropId: string) => boolean;
  /** Records the finish. Returns the badge this unlocked, if any. */
  completeDrop: (dropId: string, now?: Date) => Milestone | null;
  /** Stats as of a given day (for the dev date override). */
  statsOn: (now: Date) => StreakStats;
};

const KEY = 'streak.v1';
const StreakContext = createContext<Ctx | null>(null);

export function StreakProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<Saved>({ completed: {} });

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setState({ completed: {}, ...(JSON.parse(raw) as Partial<Saved>) });
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
      const next = { completed: { ...state.completed, [dropId]: today } };
      setState(next);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return newBadge(before, after);
    },
    [state],
  );

  const isDone = useCallback((dropId: string) => !!state.completed[dropId], [state]);

  const value = useMemo(
    () => ({ ready, ...statsOn(new Date()), isDone, completeDrop, statsOn }),
    [ready, statsOn, isDone, completeDrop],
  );
  return <StreakContext.Provider value={value}>{children}</StreakContext.Provider>;
}

export function useStreak() {
  const ctx = useContext(StreakContext);
  if (!ctx) throw new Error('useStreak must be used inside <StreakProvider>');
  return ctx;
}
