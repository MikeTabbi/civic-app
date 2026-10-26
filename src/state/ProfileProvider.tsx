import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { Districts } from '@/lib/geocode';

/**
 * The signed-in person's profile and setup choices, saved on the device.
 * When Supabase is connected, `profile` is mirrored to the `profiles` table
 * (public parts) and `addresses` / `user_districts` (private parts).
 */

export type VotingLocation = 'campus' | 'home';

export type ReminderPrefs = {
  earlyVoting: boolean;
  dayBefore: boolean;
  electionDay: boolean;
  absenteeDeadline: boolean;
};

export type Profile = {
  name: string;
  handle: string;
  email: string;
  school: string | null; // e.g. 'Delaware State University'
  schoolEmail: string | null;
  schoolVerified: boolean;
  isPublic: boolean;
  votingLocation: VotingLocation | null;
  /** PRIVATE. Never shown on the profile or shared with squads. */
  address: string | null;
  districts: Districts | null;
  reminders: ReminderPrefs;
  notificationsAllowed: boolean;
  onboarded: boolean;
  createdAt: string;
};

export const emptyProfile: Profile = {
  name: '',
  handle: '',
  email: '',
  school: null,
  schoolEmail: null,
  schoolVerified: false,
  isPublic: true,
  votingLocation: null,
  address: null,
  districts: null,
  reminders: { earlyVoting: true, dayBefore: true, electionDay: true, absenteeDeadline: false },
  notificationsAllowed: false,
  onboarded: false,
  createdAt: '',
};

type Ctx = {
  ready: boolean;
  profile: Profile;
  update: (patch: Partial<Profile>) => void;
  reset: () => void;
};

const KEY = 'profile.v1';
const ProfileContext = createContext<Ctx | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile>(emptyProfile);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setProfile({ ...emptyProfile, ...(JSON.parse(raw) as Partial<Profile>) });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const update = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setProfile(emptyProfile);
    AsyncStorage.removeItem(KEY).catch(() => {});
  }, []);

  const value = useMemo(() => ({ ready, profile, update, reset }), [ready, profile, update, reset]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside <ProfileProvider>');
  return ctx;
}

export const HANDLE_RE = /^[a-z0-9_]{3,24}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEduEmail = (e: string) => /\.edu$/i.test(e.trim());
