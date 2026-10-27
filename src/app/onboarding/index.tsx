import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { AccentHeading } from '@/components/AccentHeading';
import { Button, Screen, T } from '@/components/ui';
import { APP_NAME } from '@/lib/brand';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

const POINTS = [
  { icon: 'checkbox' as const, text: 'Your real ballot, race by race' },
  { icon: 'map' as const, text: 'Who represents you, from city hall to Congress' },
  { icon: 'flame' as const, text: 'A 60-second Drop on what changed today' },
  { icon: 'people' as const, text: 'Squads to get your floor to the polls' },
];

/** Welcome screen. */
export default function Welcome() {
  const { t } = useTheme();
  return (
    <Screen scroll={false} style={{ gap: 20 }}>
      <T variant="heading">{APP_NAME}</T>
      <View style={{ marginTop: 32, gap: 12 }}>
        <AccentHeading accent="live" style={{ fontSize: 44, lineHeight: 46 }}>Politics, where you live.</AccentHeading>
        <T tone="muted" style={{ fontSize: 16, lineHeight: 23 }}>
          Nonpartisan. Every fact has a source. Your address and voting plans stay private.
        </T>
      </View>
      <View style={{ gap: 10, marginTop: 8 }}>
        {POINTS.map((p) => (
          <View key={p.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: t.accentTint, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={p.icon} size={18} color={t.accentText} />
            </View>
            <T variant="label" style={{ flex: 1 }}>{p.text}</T>
          </View>
        ))}
      </View>
      <View style={{ flex: 1 }} />
      <Button label="Get started" onPress={() => router.push('/onboarding/account')} />
      <T variant="caption" tone="faint" style={{ textAlign: 'center' }}>Takes about a minute. Starting in Delaware.</T>
    </Screen>
  );
}
