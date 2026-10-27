// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Edge Functions run on Deno, not in the app.
    ignores: ['dist/*', 'supabase/functions/*'],
  },
  {
    // Apostrophes and quotes are fine in React Native <Text>; still catch stray > and } in JSX.
    rules: { 'react/no-unescaped-entities': ['error', { forbid: ['>', '}'] }] },
  },
]);
