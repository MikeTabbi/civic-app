import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BallotProvider, useBallot } from '@/state/BallotProvider';
import { DropProvider, useDrops } from '@/state/DropProvider';
import { FollowProvider, useFollows } from '@/state/FollowProvider';
import { ProfileProvider, useProfile } from '@/state/ProfileProvider';
import { StreakProvider, useStreak } from '@/state/StreakProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_800ExtraBold,
  });

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ProfileProvider>
          <BallotProvider>
            <FollowProvider>
              <StreakProvider>
                <DropProvider>
                  <RootStack fontsLoaded={fontsLoaded} />
                </DropProvider>
              </StreakProvider>
            </FollowProvider>
          </BallotProvider>
        </ProfileProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootStack({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { t } = useTheme();
  const { ready, profile } = useProfile();
  const ballot = useBallot();
  const follows = useFollows();
  const streak = useStreak();
  const drops = useDrops();
  const onboarded = profile.onboarded;
  const loaded = fontsLoaded && ready && ballot.ready && follows.ready && streak.ready && drops.ready;

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return null;

  return (
    <>
      <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }}>
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="drop" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="celebrate" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="leaderboard" />
          <Stack.Screen name="race/[id]" />
          <Stack.Screen name="official/[id]" />
          <Stack.Screen name="plan" />
          <Stack.Screen name="address" options={{ presentation: 'modal' }} />
        </Stack.Protected>
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
