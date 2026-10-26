import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, ProgressBar, Row, Screen, T, ToggleRow } from '@/components/ui';
import { drops } from '@/data/drops';
import { BADGE_NAMES, MILESTONES, type Milestone } from '@/lib/streak';
import { useNow } from '@/lib/useNow';
import { useAuth } from '@/state/AuthProvider';
import { useStreak } from '@/state/StreakProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

/** A streak this long needs more Drops than exist today, so it can't be earned yet. */
const needsMoreDrops = (m: Milestone) => m > drops.length;

/** Shown after finishing a Drop that unlocked a badge: streak ring, the badge, next milestone. */
export default function Celebrate() {
  const { t } = useTheme();
  const { badge: badgeParam } = useLocalSearchParams<{ badge?: string }>();
  const streak = useStreak();
  const stats = streak.statsOn(useNow());
  const signedIn = !!useAuth().user;
  const badge = MILESTONES.find((m) => String(m) === badgeParam) ?? stats.badges[stats.badges.length - 1] ?? null;
  const days = stats.current;
  const next = stats.next;

  return (
    <Screen style={{ alignItems: 'stretch', gap: 16 }}>
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
              {needsMoreDrops(next) ? `${BADGE_NAMES[next]}: more Drops coming` : `${next - days} more ${next - days === 1 ? 'day' : 'days'} for ${BADGE_NAMES[next]}`}
            </T>
          </>
        ) : (
          <T variant="label">You've reached every milestone.</T>
        )}
      </Card>

      <Row gap={8}>
        {MILESTONES.map((m) => {
          const earned = stats.badges.includes(m);
          const later = !earned && needsMoreDrops(m);
          return (
            <View
              key={m}
              accessibilityLabel={`${BADGE_NAMES[m]}, ${m} days: ${earned ? 'earned' : later ? 'locked, more Drops coming' : 'locked'}`}
              style={{
                flex: 1,
                alignItems: 'center',
                gap: 2,
                paddingVertical: 10,
                paddingHorizontal: 4,
                borderRadius: radius.md,
                backgroundColor: earned ? t.accentTint : t.surface,
                borderWidth: earned ? 2 : 1,
                borderColor: earned ? t.accent : t.line,
              }}
            >
              <Ionicons name={earned ? 'ribbon' : 'lock-closed'} size={18} color={earned ? t.accentText : t.faint} />
              <T variant="heading" tone={earned ? 'accent' : 'faint'}>{m}</T>
              <T variant="caption" tone="faint" style={{ textAlign: 'center' }}>
                {earned ? 'Earned' : later ? 'More Drops coming' : 'Locked'}
              </T>
            </View>
          );
        })}
      </Row>

      <ToggleRow
        title="Show my streak on leaderboards"
        subtitle={
          signedIn
            ? 'Only your handle and streak. Never your voter status or quiz answers.'
            : 'Sign in from the Squad tab to appear. Never your voter status or quiz answers.'
        }
        value={streak.onLeaderboard}
        onValueChange={streak.setOnLeaderboard}
      />

      <View style={{ flex: 1 }} />
      <Button label="Keep it going" onPress={() => router.dismissTo('/')} />
    </Screen>
  );
}
