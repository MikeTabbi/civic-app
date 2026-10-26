import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Officials the person follows, saved on the device.
 * When Supabase is connected this mirrors `follows` (owner-only under RLS).
 */

type Ctx = {
  ready: boolean;
  /** Official id -> when it was followed (ISO). */
  following: Record<string, string>;
  isFollowing: (officialId: string) => boolean;
  toggleFollow: (officialId: string) => void;
};

const KEY = 'follows.v1';
const FollowContext = createContext<Ctx | null>(null);

export function FollowProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [following, setFollowing] = useState<Record<string, string>>({});

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setFollowing(JSON.parse(raw) as Record<string, string>);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const toggleFollow = useCallback((officialId: string) => {
    setFollowing((prev) => {
      const next = { ...prev };
      if (next[officialId]) delete next[officialId];
      else next[officialId] = new Date().toISOString();
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const isFollowing = useCallback((officialId: string) => !!following[officialId], [following]);

  const value = useMemo(() => ({ ready, following, isFollowing, toggleFollow }), [ready, following, isFollowing, toggleFollow]);
  return <FollowContext.Provider value={value}>{children}</FollowContext.Provider>;
}

export function useFollows() {
  const ctx = useContext(FollowContext);
  if (!ctx) throw new Error('useFollows must be used inside <FollowProvider>');
  return ctx;
}
