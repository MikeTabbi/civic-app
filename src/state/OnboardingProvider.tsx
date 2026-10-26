import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Local-only onboarding state for the prototype.
 * When Supabase auth is wired up, this moves to the user's profile row.
 */
export type VotingLocation = 'campus' | 'home';

type OnboardingState = {
  ready: boolean;
  onboarded: boolean;
  votingLocation: VotingLocation | null;
  complete: (location: VotingLocation) => void;
  reset: () => void;
};

const KEY = 'onboarding.v1';
const Ctx = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [votingLocation, setVotingLocation] = useState<VotingLocation | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as { location?: VotingLocation };
        if (saved.location) {
          setVotingLocation(saved.location);
          setOnboarded(true);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<OnboardingState>(
    () => ({
      ready,
      onboarded,
      votingLocation,
      complete: (location) => {
        setVotingLocation(location);
        setOnboarded(true);
        AsyncStorage.setItem(KEY, JSON.stringify({ location })).catch(() => {});
      },
      reset: () => {
        setVotingLocation(null);
        setOnboarded(false);
        AsyncStorage.removeItem(KEY).catch(() => {});
      },
    }),
    [ready, onboarded, votingLocation],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>');
  return ctx;
}
