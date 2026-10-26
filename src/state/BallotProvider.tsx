import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { upsertPlanStatus } from '@/lib/cloud';
import { hasCompletePlan } from '@/lib/votingPlan';
import { useAuth } from '@/state/AuthProvider';

/**
 * Ballot progress and the voting plan, saved on the device.
 * The plan itself never leaves the phone. When signed in, only a yes/no
 * "has a plan" and the share flag go to `voting_plans` (owner-only under RLS),
 * and squads see a count of members who share and have a plan.
 */

/** Same values as `voting_plans.method`. */
export type VotingMethod = 'early' | 'in_person' | 'mail';

/** PRIVATE. Never shown on the profile. Squads only see "has a plan" if shareWithSquad is on. */
export type VotingPlan = {
  registered: boolean;
  method: VotingMethod | null;
  place: string;
  day: string | null; // 'YYYY-MM-DD'
  time: string | null; // 'HH:MM', 24-hour
  /** Share a yes/no "has a plan" with my squads. Off by default. */
  shareWithSquad: boolean;
};

export const emptyPlan: VotingPlan = { registered: false, method: null, place: '', day: null, time: null, shareWithSquad: false };

type Saved = { explored: Record<string, string>; plan: VotingPlan };

type Ctx = {
  ready: boolean;
  /** Race id -> when it was explored (ISO). */
  explored: Record<string, string>;
  setExplored: (raceId: string, on: boolean) => void;
  plan: VotingPlan;
  updatePlan: (patch: Partial<VotingPlan>) => void;
  /** Clears explored races and the plan from this device (sign-out). */
  reset: () => void;
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

  const reset = useCallback(() => {
    setState({ explored: {}, plan: emptyPlan });
    AsyncStorage.removeItem(KEY).catch(() => {});
  }, []);

  const userId = useAuth().user?.id ?? null;
  const hasPlan = hasCompletePlan(state.plan);
  const share = state.plan.shareWithSquad;
  useEffect(() => {
    if (!ready || !userId) return;
    upsertPlanStatus(hasPlan, share).catch(() => {});
  }, [ready, userId, hasPlan, share]);

  const value = useMemo(
    () => ({ ready, explored: state.explored, setExplored, plan: state.plan, updatePlan, reset }),
    [ready, state, setExplored, updatePlan, reset],
  );
  return <BallotContext.Provider value={value}>{children}</BallotContext.Provider>;
}

export function useBallot() {
  const ctx = useContext(BallotContext);
  if (!ctx) throw new Error('useBallot must be used inside <BallotProvider>');
  return ctx;
}
