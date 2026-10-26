# Turning on accounts (email, Apple, Google)

Until these steps are done, the app keeps the profile on the phone only. In
development the Apple/Google buttons show a note; in release builds they're hidden.

## 1. Supabase project (free)

1. Create a project at https://supabase.com.
2. **Project Settings → API**: copy the Project URL and the `anon` public key into `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
3. **SQL editor**: run `supabase/migrations/20261025000000_phase1_init.sql`.
4. Restart Expo (`npx expo start -c`) so it picks up `.env`.

## 2. Redirect URLs

**Authentication → URL Configuration → Redirect URLs**, add:

- `civicapp://**` (installed builds; matches `scheme` in app.json)
- `exp://**` (Expo Go during development)
- `http://localhost:8081` (web dev)

## 3. Email codes

**Authentication → Providers → Email**: enabled.
**Authentication → Email Templates → Magic Link**: include `{{ .Token }}` so people get a 6-digit code instead of only a link.

## 4. Google

1. Google Cloud Console → APIs & Services → Credentials → **Create OAuth client ID** → type **Web application**.
2. Authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`.
3. Paste the Client ID and Client Secret into Supabase **Authentication → Providers → Google**.

## 5. Apple

Requires an Apple Developer account ($99/year).

1. Apple Developer → Identifiers → create an **App ID** (`com.miketabbi.civicapp`) with *Sign in with Apple* enabled.
2. Create a **Services ID** (used as the client ID), enable *Sign in with Apple*, and set:
   - Domain: `<your-project>.supabase.co`
   - Return URL: `https://<your-project>.supabase.co/auth/v1/callback`
3. Keys → create a key with *Sign in with Apple*; download the `.p8`.
4. In Supabase **Authentication → Providers → Apple**, enter the Services ID, Team ID, Key ID and the `.p8` contents.

> Apple's client secret made from the `.p8` expires every 6 months. Supabase's Apple provider page explains how to regenerate it.

## How it works in the app

`src/lib/auth.ts` opens the provider in a secure in-app browser
(`expo-web-browser`), Supabase sends the user back to the app's redirect URL
with a one-time code, and the app trades that code for a session (PKCE).
Name and email from Apple/Google prefill the profile; the user still picks a handle.

Later, for a smoother native sheet on iOS, swap Apple to `expo-apple-authentication`
+ `supabase.auth.signInWithIdToken` (needs a development build, not Expo Go).
