// Creates (or reuses) a test account and prints a sign-in code for it, so a
// second account can sign in without email delivery.
//
//   node --env-file=.env --env-file=.secrets/service.env scripts/dev/create-test-user.mjs test2@example.com
//
// Then in the app: enter that email, tap Continue, and type the printed code.
// Uses the service role key from .secrets/service.env (git-ignored). Never import this from the app.

import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];

if (!url || !serviceKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL (.env) or SUPABASE_SERVICE_ROLE_KEY (.secrets/service.env).');
  process.exit(1);
}
if (!email) {
  console.error('Usage: node --env-file=.env --env-file=.secrets/service.env scripts/dev/create-test-user.mjs <email>');
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const created = await admin.auth.admin.createUser({ email, email_confirm: true });
if (created.error && !/already/i.test(created.error.message)) {
  console.error('Could not create user:', created.error.message);
  process.exit(1);
}
console.log(created.error ? `Using existing account ${email}` : `Created ${email}`);

const link = await admin.auth.admin.generateLink({ type: 'magiclink', email });
if (link.error) {
  console.error('Could not make a sign-in code:', link.error.message);
  process.exit(1);
}
console.log(`Sign-in code: ${link.data.properties.email_otp}`);
console.log('It expires like a normal email code. Run this again for a fresh one.');
