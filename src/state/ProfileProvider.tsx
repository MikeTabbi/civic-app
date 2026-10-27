import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { upsertProfile } from '@/lib/cloud';
import type { Districts } from '@/lib/geocode';
import { useAuth } from '@/state/AuthProvider';

/**
 * The signed-in person's profile and setup choices, saved on the device.
 * When signed in, the public parts (handle, name, school, is_public) are kept
 * in sync with the `profiles` table. The address stays on the device.
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
  /** Upserts the public profile now. The account step uses it to catch a taken handle. */
  syncProfile: (p: Pick<Profile, 'handle' | 'name' | 'school' | 'isPublic'>) => ReturnType<typeof upsertProfile>;
};

const KEY = 'profile.v1';
const ProfileContext = createContext<Ctx | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const userId = useAuth().user?.id ?? null;

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

  const syncProfile = useCallback(
    (p: Pick<Profile, 'handle' | 'name' | 'school' | 'isPublic'>) =>
      upsertProfile({ handle: p.handle, name: p.name, school: p.school, isPublic: p.isPublic }),
    [],
  );

  // Background sync after sign-in and on later edits. Errors (like a taken handle) surface on the account step.
  const { handle, name, school, isPublic } = profile;
  useEffect(() => {
    if (!ready || !userId || !HANDLE_RE.test(handle)) return;
    syncProfile({ handle, name, school, isPublic }).catch(() => {});
  }, [ready, userId, handle, name, school, isPublic, syncProfile]);

  const value = useMemo(() => ({ ready, profile, update, reset, syncProfile }), [ready, profile, update, reset, syncProfile]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside <ProfileProvider>');
  return ctx;
}

export const SCHOOLS = ['Delaware State University', 'Other school', 'Not in school'] as const;
export type SchoolChoice = (typeof SCHOOLS)[number];

/** Which of the three choices a saved `school` value maps to. */
export const schoolChoiceOf = (school: string | null): SchoolChoice =>
  school === 'Delaware State University' ? SCHOOLS[0] : school ? SCHOOLS[1] : SCHOOLS[2];

/** The value saved for a choice. 'Other' lumps every other school together. */
export const schoolFromChoice = (c: SchoolChoice) => (c === 'Not in school' ? null : c === 'Other school' ? 'Other' : c);

/** The school as a line on the profile, or null when it isn't a named school. */
export const schoolLine = (school: string | null) => (school && school !== 'Other' ? school : null);

export const HANDLE_RE = /^[a-z0-9_]{3,24}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEduEmail = (e: string) => /\.edu$/i.test(e.trim());
