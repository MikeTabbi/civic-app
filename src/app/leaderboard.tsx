import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Avatar, IconButton, Row, Screen, Segmented, T } from '@/components/ui';
import { leaderboard } from '@/data/mock';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

type Board = 'streaks' | 'squads';
type Scope = 'floor' | 'dsu' | 'delaware';

/** Streak / squad leaderboard. Only Drop streaks are ranked; voter status is never shown. */
export default function Leaderboard() {
  const { t } = useTheme();
  const [board, setBoard] = useState<Board>('streaks');
  const [scope, setScope] = useState<Scope>('dsu');

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconButton icon="chevron-back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/squad'))} />
        <T variant="heading">Streak leaders</T>
        <View style={{ width: 44 }} />
      </Row>

      <Segmented<Board> value={board} onChange={setBoard} options={[{ value: 'streaks', label: 'Streaks' }, { value: 'squads', label: 'Squads' }]} />
      <Segmented<Scope>
        value={scope}
        onChange={setScope}
        options={[
          { value: 'floor', label: 'My floor' },
          { value: 'dsu', label: 'DSU' },
          { value: 'delaware', label: 'Delaware' },
        ]}
      />

      <Row gap={10} style={{ alignItems: 'flex-end', justifyContent: 'center', marginTop: 8 }}>
        {leaderboard.podium.map((p) => {
          const first = p.rank === 1;
          return (
            <View key={p.rank} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <Avatar size={first ? 76 : 58} ring={first ? t.accent : t.line} />
              <T variant="label">{p.name}</T>
              <Row gap={3}>
                <Ionicons name="flame" size={12} color={t.accentText} />
                <T variant="caption" tone="faint">{p.days}</T>
              </Row>
              <View
                style={{
                  alignSelf: 'stretch',
                  height: first ? 104 : p.rank === 2 ? 74 : 58,
                  borderTopLeftRadius: radius.sm,
                  borderTopRightRadius: radius.sm,
                  backgroundColor: first ? t.accent : t.sub,
                  alignItems: 'center',
                  paddingTop: 8,
                }}
              >
                <T variant="title" style={{ color: first ? t.onAccent : t.text }}>{p.rank}</T>
              </View>
            </View>
          );
        })}
      </Row>

      <View style={{ gap: 8 }}>
        {leaderboard.rows.map((r) => (
          <Row key={r.rank} gap={12} style={{ padding: 12, borderRadius: radius.md, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line }}>
            <T variant="label" tone="faint" style={{ width: 22 }}>{r.rank}</T>
            <Avatar size={34} />
            <T variant="label" style={{ flex: 1 }}>{r.name}</T>
            <T variant="label">{r.days}</T>
          </Row>
        ))}
        <Row gap={12} style={{ padding: 12, borderRadius: radius.md, backgroundColor: t.accentTint, borderWidth: 1, borderColor: t.accent }}>
          <T variant="label" style={{ width: 22 }}>{leaderboard.you.rank}</T>
          <Avatar size={34} ring={t.accent} />
          <View style={{ flex: 1 }}>
            <T variant="label">You</T>
            <T variant="caption" tone="faint">{leaderboard.you.gap}</T>
          </View>
          <T variant="label">{leaderboard.you.days}</T>
        </Row>
      </View>

      <Row gap={6} style={{ alignItems: 'flex-start' }}>
        <Ionicons name="lock-closed" size={12} color={t.faint} style={{ marginTop: 2 }} />
        <T variant="caption" tone="faint" style={{ flex: 1 }}>
          Streaks count Daily Drops read. Voter status and Matchup picks are never shown here.
        </T>
      </Row>
    </Screen>
  );
}
