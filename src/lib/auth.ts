import { isSupabaseConfigured, supabase } from './supabase';

/**
 * Email sign-in with a 6-digit code (Supabase OTP).
 * Only active when Supabase keys are set in .env; otherwise the app keeps the
 * profile on the device and these return { ok: true, local: true }.
 *
 * Supabase setup: Authentication > Email > enable "Email OTP", and edit the
 * "Magic Link" email template to include {{ .Token }} so users get a code.
 */

export const accountsEnabled = isSupabaseConfigured;

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

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
}
