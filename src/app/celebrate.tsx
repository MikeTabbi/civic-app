import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, ProgressBar, Row, Screen, T } from '@/components/ui';
import { streak } from '@/data/mock';
import { useTheme } from '@/theme/ThemeProvider';

/** Shown after finishing a Drop: streak ring, next milestone, badge and rank. */
export default function Celebrate() {
  const { t } = useTheme();

  return (
    <Screen scroll={false} style={{ alignItems: 'stretch', gap: 16 }}>
      <View style={{ alignItems: 'center', marginTop: 24, gap: 14 }}>
        <View
          accessibilityLabel={`${streak.days} day streak`}
          style={{ width: 168, height: 168, borderRadius: 84, borderWidth: 10, borderColor: t.accent, alignItems: 'center', justifyContent: 'center', backgroundColor: t.accentTint }}
        >
          <Ionicons name="flame" size={28} color={t.accentText} />
          <T variant="display" style={{ fontSize: 56, lineHeight: 58 }}>{streak.days}</T>
          <T variant="eyebrow" tone="faint">Days</T>
        </View>
        <T variant="title">{streak.days}-day streak!</T>
        <T tone="muted" style={{ textAlign: 'center' }}>
          You read a Drop every day this week. That's more than [X]% of DSU.
        </T>
      </View>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="label">Next milestone: {streak.nextMilestone} days</T>
          <T variant="label" tone="faint">{streak.days} / {streak.nextMilestone}</T>
        </Row>
        <ProgressBar value={streak.days / streak.nextMilestone} />
      </Card>

      <Row gap={10}>
        <Card style={{ flex: 1 }}>
          <T variant="eyebrow" tone="accent">Badge unlocked</T>
          <T variant="heading">{streak.badge}</T>
        </Card>
        <Card style={{ flex: 1 }}>
          <T variant="eyebrow" tone="faint">DSU rank</T>
          <Row gap={6}>
            <T variant="heading">#{streak.dsuRank}</T>
            <Ionicons name="arrow-up" size={14} color={t.done} />
            <T variant="caption" tone="faint">up {streak.rankChange}</T>
          </Row>
        </Card>
      </Row>

      <View style={{ flex: 1 }} />
      <Button label="Keep it going" onPress={() => router.dismissTo('/')} />
      <Button label="See the leaderboard" kind="quiet" onPress={() => router.replace('/leaderboard')} />
    </Screen>
  );
}
