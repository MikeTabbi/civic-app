import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { toUser, type SignedInUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

/**
 * The Supabase session, if any. Other providers watch `user.id` to know when
 * to sync. Without Supabase keys this is always signed out.
 */

type Ctx = { ready: boolean; user: SignedInUser | null };

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!supabase);
  const [user, setUser] = useState<SignedInUser | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth
      .getSession()
      .then(({ data }) => setUser(toUser(data.session?.user)))
      .catch(() => {})
      .finally(() => setReady(true));
    // Only set state here: calling Supabase inside this callback can deadlock.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = toUser(session?.user);
      setUser((prev) => (prev?.id === next?.id && prev?.email === next?.email ? prev : next));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({ ready, user }), [ready, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
