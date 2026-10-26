import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Saved Drops, quick-check answers and questions asked, saved on the device.
 * Streak credit lives in StreakProvider. When Supabase is connected, saves and
 * answers mirror owner-only tables, and questions go to a `drop_questions` inbox.
 */

export type DropQuestion = { id: string; dropId: string; text: string; createdAt: string };

type Saved = {
  /** Drop id -> when it was saved (ISO). */
  saved: Record<string, string>;
  /** Drop id -> index of the choice picked in the quick check. */
  answers: Record<string, number>;
  questions: DropQuestion[];
};

type Ctx = Saved & {
  ready: boolean;
  isSaved: (dropId: string) => boolean;
  toggleSaved: (dropId: string) => void;
  answer: (dropId: string, choice: number) => void;
  ask: (dropId: string, text: string) => void;
  /** Clears saves, answers and questions from this device (sign-out). */
  reset: () => void;
};

const KEY = 'drops.v1';
const empty: Saved = { saved: {}, answers: {}, questions: [] };
const DropContext = createContext<Ctx | null>(null);

export function DropProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<Saved>(empty);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setState({ ...empty, ...(JSON.parse(raw) as Partial<Saved>) });
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

  const toggleSaved = useCallback(
    (dropId: string) =>
      save((prev) => {
        const saved = { ...prev.saved };
        if (saved[dropId]) delete saved[dropId];
        else saved[dropId] = new Date().toISOString();
        return { ...prev, saved };
      }),
    [save],
  );

  const answer = useCallback(
    (dropId: string, choice: number) =>
      save((prev) => (dropId in prev.answers ? prev : { ...prev, answers: { ...prev.answers, [dropId]: choice } })),
    [save],
  );

  const ask = useCallback(
    (dropId: string, text: string) =>
      save((prev) => {
        const createdAt = new Date().toISOString();
        return { ...prev, questions: [...prev.questions, { id: `${dropId}-${Date.now()}`, dropId, text, createdAt }] };
      }),
    [save],
  );

  const isSaved = useCallback((dropId: string) => !!state.saved[dropId], [state]);

  const reset = useCallback(() => {
    setState(empty);
    AsyncStorage.removeItem(KEY).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ ready, ...state, isSaved, toggleSaved, answer, ask, reset }),
    [ready, state, isSaved, toggleSaved, answer, ask, reset],
  );
  return <DropContext.Provider value={value}>{children}</DropContext.Provider>;
}

export function useDrops() {
  const ctx = useContext(DropContext);
  if (!ctx) throw new Error('useDrops must be used inside <DropProvider>');
  return ctx;
}
