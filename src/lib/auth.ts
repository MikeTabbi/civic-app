import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { isSupabaseConfigured, supabase } from './supabase';

/**
 * Sign-in options, all through Supabase Auth:
 *   - Apple and Google: OAuth in a secure in-app browser (works in Expo Go).
 *   - Email: a 6-digit code.
 * Only active once Supabase keys are set in .env. Setup steps: docs/auth-setup.md.
 */

WebBrowser.maybeCompleteAuthSession();

export const accountsEnabled = isSupabaseConfigured;
export type OAuthProvider = 'apple' | 'google';

export type SignedInUser = { id: string; email: string | null; name: string | null };

export function toUser(u: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null | undefined): SignedInUser | null {
  if (!u) return null;
  const m = u.user_metadata ?? {};
  const full = (m.full_name ?? m.name ?? m.given_name ?? null) as string | null;
  return { id: u.id, email: u.email ?? null, name: full ? full.split(' ')[0] : null };
}

/** Where the provider sends people back: exp://… in Expo Go, civicapp://auth/callback in builds. */
export const authRedirectUrl = () => Linking.createURL('auth/callback');

export async function signInWithProvider(
  provider: OAuthProvider,
): Promise<{ ok: true; user: SignedInUser } | { ok: false; cancelled?: boolean; message: string }> {
  if (!supabase) return { ok: false, message: 'Accounts are not connected yet.' };
  const redirectTo = authRedirectUrl();

  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
    return error ? { ok: false, message: error.message } : { ok: false, cancelled: true, message: 'Redirecting…' };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
  if (error || !data?.url) return { ok: false, message: error?.message ?? 'Could not start sign-in.' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return { ok: false, cancelled: true, message: 'Sign-in cancelled.' };

  const { queryParams } = Linking.parse(result.url);
  const code = typeof queryParams?.code === 'string' ? queryParams.code : null;
  const errDesc = typeof queryParams?.error_description === 'string' ? queryParams.error_description : null;
  if (!code) return { ok: false, message: errDesc ?? 'Sign-in did not finish.' };

  const exchanged = await supabase.auth.exchangeCodeForSession(code);
  if (exchanged.error) return { ok: false, message: exchanged.error.message };
  const user = toUser(exchanged.data.user);
  return user ? { ok: true, user } : { ok: false, message: 'Sign-in did not return a user.' };
}

export async function currentUser(): Promise<SignedInUser | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return toUser(data.session?.user);
}

export async function sendEmailCode(email: string) {
  if (!supabase) return { ok: true as const, local: true };
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  return error ? { ok: false as const, message: error.message } : { ok: true as const, local: false };
}

export async function verifyEmailCode(email: string, token: string) {
  if (!supabase) return { ok: true as const };
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  return error ? { ok: false as const, message: error.message } : { ok: true as const };
}

/** 'local' only clears this device's session, for when the server side is already gone (deleted account). */
export async function signOut(scope: 'global' | 'local' = 'global') {
  if (supabase) await supabase.auth.signOut({ scope });
}
