import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { myNudge, mySquads, type Nudge, type Squad } from '@/lib/squads';
import { useAuth } from '@/state/AuthProvider';

/**
 * The signed-in person's squads, read from Supabase (nothing about other
 * members is kept on the device). Saved locally: which squad is showing, and
 * an invite code from a link opened before the person could join.
 */

type Saved = { activeId: string | null; pendingCode: string | null };

type Ctx = {
  /** First load done (or signed out). */
  loaded: boolean;
  squads: Squad[];
  active: Squad | null;
  setActive: (squadId: string) => void;
  /** Latest nudge to me, if any. */
  nudge: Nudge | null;
  error: string | null;
  refresh: () => Promise<void>;
  pendingCode: string | null;
  setPendingCode: (code: string | null) => void;
};

const KEY = 'squad.v1';
const SquadContext = createContext<Ctx | null>(null);

export function SquadProvider({ children }: { children: ReactNode }) {
  const userId = useAuth().user?.id ?? null;
  const [saved, setSaved] = useState<Saved>({ activeId: null, pendingCode: null });
  // Tagged with the user it was fetched for, so a sign-out or account switch never shows the last person's squads.
  const [data, setData] = useState<{ userId: string; squads: Squad[]; nudge: Nudge | null; error: string | null } | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setSaved((prev) => ({ ...prev, ...(JSON.parse(raw) as Partial<Saved>) }));
      })
      .catch(() => {});
  }, []);

  const save = useCallback((patch: Partial<Saved>) => {
    setSaved((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  // Screens call this on focus (Ballot for the nudge, Squad for everything), so there's no load-on-mount here.
  const refresh = useCallback(async () => {
    if (!userId) return;
    const [s, n] = await Promise.all([mySquads(), myNudge()]);
    setData((prev) => {
      const kept = prev?.userId === userId ? prev : null;
      return {
        userId,
        squads: s.ok ? s.data : (kept?.squads ?? []),
        nudge: n.ok ? n.data : (kept?.nudge ?? null),
        error: s.ok ? null : s.message,
      };
    });
  }, [userId]);

  const mine = data && data.userId === userId ? data : null;
  const loaded = !userId || !!mine;
  const squads = useMemo(() => mine?.squads ?? [], [mine]);
  const nudge = mine?.nudge ?? null;
  const error = mine?.error ?? null;

  const setActive = useCallback((squadId: string) => save({ activeId: squadId }), [save]);
  const setPendingCode = useCallback((code: string | null) => save({ pendingCode: code }), [save]);

  const active = squads.find((s) => s.id === saved.activeId) ?? squads[0] ?? null;

  const value = useMemo(
    () => ({ loaded, squads, active, setActive, nudge, error, refresh, pendingCode: saved.pendingCode, setPendingCode }),
    [loaded, squads, active, setActive, nudge, error, refresh, saved.pendingCode, setPendingCode],
  );
  return <SquadContext.Provider value={value}>{children}</SquadContext.Provider>;
}

export function useSquads() {
  const ctx = useContext(SquadContext);
  if (!ctx) throw new Error('useSquads must be used inside <SquadProvider>');
  return ctx;
}
