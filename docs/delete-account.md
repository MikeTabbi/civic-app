# Deploying the delete-account Edge Function

Settings > Delete account calls `supabase/functions/delete-account`. It checks the caller's token, leaves their squads (so ownership passes to the next member), then deletes the auth user with the service key. Every table holding their rows cascades from `auth.users`. No new migration is needed.

The service key is provided to the function by Supabase automatically. It never goes in the app or in `.env`.

## Steps (from `civic-app/`)

1. Log in to the Supabase CLI (opens a browser once):
   ```
   supabase login
   ```
2. Find your project ref. It's the subdomain in `EXPO_PUBLIC_SUPABASE_URL` (`https://<ref>.supabase.co`), also shown in Dashboard > Project Settings > General.
3. Deploy:
   ```
   supabase functions deploy delete-account --project-ref <ref>
   ```
   If the CLI asks for a `supabase/config.toml`, run `supabase init` once (say no to the VS Code and Deno settings prompts), then deploy again.
4. Check it's there: Dashboard > Edge Functions should list `delete-account`.
5. Test it with throwaway accounts (never your real one):
   ```
   node --env-file=.env --env-file=.secrets/service.env scripts/dev/delete-account-e2e.mjs
   ```
   Every line should say PASS.

JWT verification stays on (the default), and the function also checks the token itself with `auth.getUser`. If your project uses the newer asymmetric JWT signing keys and the gateway rejects valid calls with 401, redeploy with `--no-verify-jwt`. The in-function check still blocks anyone who isn't signed in.
