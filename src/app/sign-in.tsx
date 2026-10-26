import { router } from 'expo-router';

import { AccountForm } from '@/components/AccountForm';

/** Sign-in for people already past onboarding (opened from the Squad tab). Same form as onboarding step 1. */
export default function SignIn() {
  return <AccountForm mode="signin" onDone={() => (router.canGoBack() ? router.back() : router.replace('/squad'))} />;
}
