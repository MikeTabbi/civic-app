import { router } from 'expo-router';

import { AccountForm } from '@/components/AccountForm';

/** Step 1 of 3: who you are. */
export default function Account() {
  return <AccountForm onDone={() => router.push('/onboarding/location')} />;
}
