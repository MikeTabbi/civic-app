import {
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_600SemiBold,
  InterTight_700Bold,
  InterTight_800ExtraBold,
} from '@expo-google-fonts/inter-tight';
import { InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/state/AuthProvider';
import { BallotProvider, useBallot } from '@/state/BallotProvider';
import { DropProvider, useDrops } from '@/state/DropProvider';
import { FollowProvider, useFollows } from '@/state/FollowProvider';
import { ProfileProvider, useProfile } from '@/state/ProfileProvider';
import { SquadProvider } from '@/state/SquadProvider';
import { StreakProvider, useStreak } from '@/state/StreakProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    InterTight_400Regular,
    InterTight_500Medium,
    InterTight_600SemiBold,
    InterTight_700Bold,
    InterTight_800ExtraBold,
    InstrumentSerif_400Regular_Italic,
  });

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ProfileProvider>
            <BallotProvider>
              <FollowProvider>
                <StreakProvider>
                  <DropProvider>
                    <SquadProvider>
                      <RootStack fontsLoaded={fontsLoaded} />
                    </SquadProvider>
                  </DropProvider>
                </StreakProvider>
              </FollowProvider>
            </BallotProvider>
          </ProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootStack({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { t } = useTheme();
  const auth = useAuth();
  const { ready, profile } = useProfile();
  const ballot = useBallot();
  const follows = useFollows();
  const streak = useStreak();
  const drops = useDrops();
  const onboarded = profile.onboarded;
  const loaded = fontsLoaded && auth.ready && ready && ballot.ready && follows.ready && streak.ready && drops.ready;

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
          <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
          <Stack.Screen name="profile/edit" options={{ presentation: 'modal' }} />
          <Stack.Screen name="settings/reminders" />
          <Stack.Screen name="settings/about" />
        </Stack.Protected>
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        {/* Invite links work before setup too; the screen saves the code for later. */}
        <Stack.Screen name="join/[code]" />
      </Stack>
    </>
  );
}
