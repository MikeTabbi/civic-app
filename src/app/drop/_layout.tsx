import { Stack } from 'expo-router';

import { useTheme } from '@/theme/ThemeProvider';

/**
 * The Drop is a full-screen modal with its own stack, so official and race pages
 * opened from it push inside the modal and always show on top (on iOS a screen
 * pushed onto the root stack can end up behind the modal).
 */
export const unstable_settings = { anchor: 'index' };

export default function DropLayout() {
  const { t } = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }} />;
}
