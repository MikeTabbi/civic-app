import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, ProgressBar, Row, Screen, T } from '@/components/ui';
import { BADGE_NAMES, MILESTONES } from '@/lib/streak';
import { useNow } from '@/lib/useNow';
import { useStreak } from '@/state/StreakProvider';
import { useTheme } from '@/theme/ThemeProvider';

/** Shown after finishing a Drop that unlocked a badge: streak ring, the badge, next milestone. */
export default function Celebrate() {
  const { t } = useTheme();
  const { badge: badgeParam } = useLocalSearchParams<{ badge?: string }>();
  const stats = useStreak().statsOn(useNow());
  const badge = MILESTONES.find((m) => String(m) === badgeParam) ?? stats.badges[stats.badges.length - 1] ?? null;
  const days = stats.current;
  const next = stats.next;

  return (
    <Screen scroll={false} style={{ alignItems: 'stretch', gap: 16 }}>
      <View style={{ alignItems: 'center', marginTop: 24, gap: 14 }}>
        <View
          accessibilityLabel={`${days} day streak`}
          style={{ width: 168, height: 168, borderRadius: 84, borderWidth: 10, borderColor: t.accent, alignItems: 'center', justifyContent: 'center', backgroundColor: t.accentTint }}
        >
          <Ionicons name="flame" size={28} color={t.accentText} />
          <T variant="display" style={{ fontSize: 56, lineHeight: 58 }}>{days}</T>
          <T variant="eyebrow" tone="faint">{days === 1 ? 'Day' : 'Days'}</T>
        </View>
        <T variant="title">{days}-day streak!</T>
        <T tone="muted" style={{ textAlign: 'center' }}>
          You finished a Drop {days} {days === 1 ? 'day' : 'days'} in a row.
        </T>
      </View>

      {badge ? (
        <Card tone="tint">
          <T variant="eyebrow" tone="accent">Badge unlocked</T>
          <Row gap={8}>
            <Ionicons name="ribbon" size={22} color={t.accentText} />
            <T variant="heading">{BADGE_NAMES[badge]}</T>
          </Row>
          <T variant="caption" tone="faint">{badge} days in a row</T>
        </Card>
      ) : null}

      <Card>
        {next ? (
          <>
            <Row style={{ justifyContent: 'space-between' }}>
              <T variant="label">Next milestone: {next} days</T>
              <T variant="label" tone="faint">{days} / {next}</T>
            </Row>
            <ProgressBar value={days / next} />
            <T variant="caption" tone="faint">
              {next - days} more {next - days === 1 ? 'day' : 'days'} for {BADGE_NAMES[next]}
            </T>
          </>
        ) : (
          <T variant="label">You've reached every milestone.</T>
        )}
      </Card>

      {/* TODO(DSU rank): hidden until there's a backend. Needs a server-side streak table and a rank function. */}

      <View style={{ flex: 1 }} />
      <Button label="Keep it going" onPress={() => router.dismissTo('/')} />
    </Screen>
  );
}
