import { Stack } from 'expo-router';

import { useTheme } from '@/theme/ThemeProvider';

export default function OnboardingLayout() {
  const { t } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="account" />
      <Stack.Screen name="location" />
      <Stack.Screen name="quiz" options={{ presentation: 'modal' }} />
      <Stack.Screen name="reminders" />
    </Stack>
  );
}
