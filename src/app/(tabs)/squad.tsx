import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Avatar, Button, Card, ProgressBar, Row, Screen, T } from '@/components/ui';
import { squad } from '@/data/mock';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

/** Squad tab: shared goal, campus board, chat preview. */
export default function Squad() {
  const { t } = useTheme();
  const remaining = squad.members - squad.withPlan;

  return (
    <Screen>
      <T variant="eyebrow" tone="accent">Your squad</T>
      <T variant="title">{squad.name}</T>
      <Row gap={0}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={{ marginLeft: i ? -10 : 0 }}>
            <Avatar size={34} ring={t.bg} />
          </View>
        ))}
        <T variant="caption" tone="faint" style={{ marginLeft: 16 }}>{squad.members} members</T>
      </Row>

      <Card tone="tint">
        <T variant="eyebrow" tone="accent">Squad goal · ends {squad.goalEnds}</T>
        <T variant="heading">{squad.goal}</T>
        <Row style={{ alignItems: 'baseline' }} gap={2}>
          <T variant="display">{squad.withPlan}</T>
          <T variant="heading" tone="faint">/{squad.members}</T>
        </Row>
        <ProgressBar value={squad.withPlan / squad.members} />
        <Button label={`Nudge the other ${remaining}`} kind="dark" icon="notifications-outline" />
        <Row gap={6}>
          <Ionicons name="lock-closed" size={12} color={t.faint} />
          <T variant="caption" tone="faint" style={{ flex: 1 }}>
            Members chose to share plan status with this squad only.
          </T>
        </Row>
      </Card>

      <Row style={{ justifyContent: 'space-between' }}>
        <T variant="heading">DSU squads</T>
        {/* TODO: link "Full board" to /leaderboard once it reads real ranks (wired up with the Squad page). */}
      </Row>
      <View style={{ gap: 8 }}>
        {squad.board.map((b) => (
          <Row
            key={b.rank}
            gap={12}
            style={{
              padding: 14,
              borderRadius: radius.md,
              backgroundColor: b.you ? t.accentTint : t.surface,
              borderWidth: 1,
              borderColor: b.you ? t.accent : t.line,
            }}
          >
            <T variant="heading" style={{ width: 22 }}>{b.rank}</T>
            <T variant="label" style={{ flex: 1 }}>{b.name}</T>
            <T variant="label">{b.pct}</T>
          </Row>
        ))}
      </View>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="heading">Squad chat</T>
          <View style={{ minWidth: 24, height: 24, borderRadius: 12, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
            <T variant="caption" tone="onAccent">{squad.unread}</T>
          </View>
        </Row>
        <T tone="muted" numberOfLines={1}>{squad.chatPreview}</T>
      </Card>
    </Screen>
  );
}
