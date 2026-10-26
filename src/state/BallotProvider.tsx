import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Ballot progress and the voting plan, saved on the device.
 * When Supabase is connected these mirror `race_progress` and `voting_plans`
 * (both owner-only under RLS).
 */

/** Same values as `voting_plans.method`. */
export type VotingMethod = 'early' | 'in_person' | 'mail';

/** PRIVATE. Never shown on the profile or to squads unless the person opts in later. */
export type VotingPlan = {
  registered: boolean;
  method: VotingMethod | null;
  place: string;
  day: string | null; // 'YYYY-MM-DD'
  time: string | null; // 'HH:MM', 24-hour
};

export const emptyPlan: VotingPlan = { registered: false, method: null, place: '', day: null, time: null };

type Saved = { explored: Record<string, string>; plan: VotingPlan };

type Ctx = {
  ready: boolean;
  /** Race id -> when it was explored (ISO). */
  explored: Record<string, string>;
  setExplored: (raceId: string, on: boolean) => void;
  plan: VotingPlan;
  updatePlan: (patch: Partial<VotingPlan>) => void;
};

const KEY = 'ballot.v1';
const BallotContext = createContext<Ctx | null>(null);

export function BallotProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<Saved>({ explored: {}, plan: emptyPlan });

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Partial<Saved>;
        setState({ explored: saved.explored ?? {}, plan: { ...emptyPlan, ...saved.plan } });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const save = useCallback((fn: (prev: Saved) => Saved) => {
    setState((prev) => {
      const next = fn(prev);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const setExplored = useCallback(
    (raceId: string, on: boolean) =>
      save((prev) => {
        if (on === !!prev.explored[raceId]) return prev;
        const explored = { ...prev.explored };
        if (on) explored[raceId] = new Date().toISOString();
        else delete explored[raceId];
        return { ...prev, explored };
      }),
    [save],
  );

  const updatePlan = useCallback((patch: Partial<VotingPlan>) => save((prev) => ({ ...prev, plan: { ...prev.plan, ...patch } })), [save]);

  const value = useMemo(
    () => ({ ready, explored: state.explored, setExplored, plan: state.plan, updatePlan }),
    [ready, state, setExplored, updatePlan],
  );
  return <BallotContext.Provider value={value}>{children}</BallotContext.Provider>;
}

export function useBallot() {
  const ctx = useContext(BallotContext);
  if (!ctx) throw new Error('useBallot must be used inside <BallotProvider>');
  return ctx;
}
