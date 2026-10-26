import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Avatar, Button, Card, IconButton, Notice, Row, Screen, Segmented, T, ToggleRow } from '@/components/ui';
import { accountsEnabled } from '@/lib/auth';
import { squadBoard, streakBoard, type SquadEntry, type SquadScope, type StreakEntry, type StreakScope } from '@/lib/squads';
import { useAuth } from '@/state/AuthProvider';
import { useProfile } from '@/state/ProfileProvider';
import { useSquads } from '@/state/SquadProvider';
import { useStreak } from '@/state/StreakProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

type Board = 'streaks' | 'squads';

const initials = (handle: string) => handle.slice(0, 2).toUpperCase();

/**
 * Streak and squad leaderboards. Only opted-in people appear, only squads of
 * 5 or more are ranked, and voter status or quiz answers are never shown.
 */
export default function Leaderboard() {
  const { user } = useAuth();
  const [board, setBoard] = useState<Board>('streaks');

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconButton icon="chevron-back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/squad'))} />
        <T variant="heading">Leaderboards</T>
        <View style={{ width: 44 }} />
      </Row>

      {!user ? (
        <Card tone="tint">
          <T variant="heading">Sign in to see leaderboards</T>
          <T tone="muted">Boards show Drop streaks of people who chose to appear, and squads of 5 or more.</T>
          {accountsEnabled ? <Button label="Sign in" onPress={() => router.push('/sign-in')} /> : null}
        </Card>
      ) : (
        <>
          <Segmented<Board> value={board} onChange={setBoard} options={[{ value: 'streaks', label: 'Streaks' }, { value: 'squads', label: 'Squads' }]} />
          {board === 'streaks' ? <StreakBoard /> : <SquadBoard />}
        </>
      )}
    </Screen>
  );
}

function StreakBoard() {
  const { t } = useTheme();
  const { active } = useSquads();
  const { profile } = useProfile();
  const streak = useStreak();
  const [scope, setScope] = useState<StreakScope>(active ? 'squad' : 'delaware');
  const [rows, setRows] = useState<StreakEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const school = profile.school && profile.school !== 'Other' ? profile.school : null;
  const squadId = active?.id ?? null;
  const needsSquad = scope === 'squad' && !squadId;
  const needsSchool = scope === 'school' && !school;

  useEffect(() => {
    if (needsSquad || needsSchool) return;
    let live = true;
    streakBoard(scope, squadId).then((res) => {
      if (!live) return;
      setRows(res.ok ? res.data : []);
      setError(res.ok ? null : res.message);
    });
    return () => {
      live = false;
    };
  }, [scope, squadId, needsSquad, needsSchool, version]);

  const changeScope = (s: StreakScope) => {
    setRows(null);
    setScope(s);
  };

  const optIn = async () => {
    await streak.setOnLeaderboard(true);
    setRows(null);
    setVersion((v) => v + 1);
  };

  const me = rows?.find((r) => r.isMe) ?? null;
  const others = rows?.filter((r) => !r.isMe && r.current > 0) ?? [];
  const podium = others.length >= 3 && rows ? rows.filter((r) => r.rank <= 3).slice(0, 3) : [];
  const list = rows?.filter((r) => !podium.includes(r) && !r.isMe) ?? [];
  const ahead = me ? [...(rows ?? [])].reverse().find((r) => !r.isMe && r.current > me.current) : null;
  const scopeName = scope === 'squad' ? (active?.name ?? 'your squad') : scope === 'school' ? (school ?? 'your school') : 'Delaware';

  return (
    <>
      <Segmented<StreakScope>
        value={scope}
        onChange={changeScope}
        options={[
          { value: 'squad', label: 'My squad' },
          { value: 'school', label: 'My school' },
          { value: 'delaware', label: 'Delaware' },
        ]}
      />

      {needsSquad ? (
        <Empty text="Join or create a squad to see your squad's board." action={{ label: 'Go to Squad', onPress: () => router.replace('/squad') }} />
      ) : needsSchool ? (
        <Empty text="Your profile doesn't list a school, so there's no school board to show." />
      ) : !rows ? (
        <ActivityIndicator color={t.accent} style={{ marginTop: 24 }} />
      ) : (
        <>
          {error ? <Notice tone="warn"><T variant="caption">{error}</T></Notice> : null}
          {podium.length ? <Podium entries={podium} /> : null}
          {list.length ? (
            <View style={{ gap: 8 }}>
              {list.map((r) => (
                <Row key={r.handle} gap={12} style={{ padding: 12, borderRadius: radius.md, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line }}>
                  <T variant="label" tone="faint" style={{ width: 26 }}>{r.rank}</T>
                  <Avatar size={34} initials={initials(r.handle)} />
                  <View style={{ flex: 1 }}>
                    <T variant="label">@{r.handle}</T>
                    {r.name ? <T variant="caption" tone="faint">{r.name}</T> : null}
                  </View>
                  <Days n={r.current} />
                </Row>
              ))}
            </View>
          ) : null}
          {!podium.length && !list.length ? (
            <Empty text={`No one from ${scopeName} is on the board yet.${streak.onLeaderboard ? ' Keep your streak going to lead it.' : ''}`} />
          ) : null}

          {me ? (
            <Row gap={12} style={{ padding: 12, borderRadius: radius.md, backgroundColor: t.accentTint, borderWidth: 1, borderColor: t.accent }}>
              <T variant="label" style={{ width: 26 }}>{me.current > 0 ? me.rank : ''}</T>
              <Avatar size={34} ring={t.accent} initials={initials(me.handle)} />
              <View style={{ flex: 1 }}>
                <T variant="label">You</T>
                <T variant="caption" tone="faint">
                  {me.current === 0
                    ? 'Finish a Drop today to get on the board.'
                    : ahead
                      ? `${ahead.current - me.current + 1} more ${ahead.current - me.current + 1 === 1 ? 'day' : 'days'} to pass @${ahead.handle}`
                      : 'You lead this board.'}
                </T>
              </View>
              <Days n={me.current} />
            </Row>
          ) : (
            <Card tone="tint">
              <ToggleRow
                title="Show my streak on leaderboards"
                subtitle="Only your handle and streak. Never your voter status or quiz answers."
                value={streak.onLeaderboard}
                onValueChange={(v) => (v ? optIn() : streak.setOnLeaderboard(false))}
              />
            </Card>
          )}
        </>
      )}

      <Row gap={6} style={{ alignItems: 'flex-start' }}>
        <Ionicons name="lock-closed" size={12} color={t.faint} style={{ marginTop: 2 }} />
        <T variant="caption" tone="faint" style={{ flex: 1 }}>
          Only people who turned on "Show my streak" appear. Streaks count Daily Drops finished. Voter status and quiz answers are never shown.
        </T>
      </Row>
    </>
  );
}

function SquadBoard() {
  const { t } = useTheme();
  const { profile } = useProfile();
  const school = profile.school && profile.school !== 'Other' ? profile.school : null;
  const [scope, setScope] = useState<SquadScope>(school ? 'school' : 'delaware');
  const [rows, setRows] = useState<SquadEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const needsSchool = scope === 'school' && !school;

  useEffect(() => {
    if (needsSchool) return;
    let live = true;
    squadBoard(scope).then((res) => {
      if (!live) return;
      setRows(res.ok ? res.data : []);
      setError(res.ok ? null : res.message);
    });
    return () => {
      live = false;
    };
  }, [scope, needsSchool]);

  const changeScope = (s: SquadScope) => {
    setRows(null);
    setScope(s);
  };

  return (
    <>
      <Segmented<SquadScope>
        value={scope}
        onChange={changeScope}
        options={[
          { value: 'school', label: 'My school' },
          { value: 'delaware', label: 'Delaware' },
        ]}
      />

      {error ? <Notice tone="warn"><T variant="caption">{error}</T></Notice> : null}
      {needsSchool ? (
        <Empty text="Your profile doesn't list a school, so there's no school board to show." />
      ) : !rows ? (
        <ActivityIndicator color={t.accent} style={{ marginTop: 24 }} />
      ) : rows.length === 0 ? (
        <Empty text={`No squads ${scope === 'school' ? `at ${school}` : 'in Delaware'} have 5 or more members yet. Invite friends to get yours on the board.`} />
      ) : (
        <View style={{ gap: 8 }}>
          {rows.map((r) => (
            <Row
              key={r.squadId}
              gap={12}
              style={{
                padding: 14,
                borderRadius: radius.md,
                backgroundColor: r.isMine ? t.accentTint : t.surface,
                borderWidth: 1,
                borderColor: r.isMine ? t.accent : t.line,
              }}
            >
              <T variant="heading" style={{ width: 26 }}>{r.rank}</T>
              <View style={{ flex: 1 }}>
                <T variant="label">{r.name}{r.isMine ? ' (yours)' : ''}</T>
                <T variant="caption" tone="faint">{r.members} members</T>
              </View>
              <T variant="label">{r.pct}%</T>
            </Row>
          ))}
        </View>
      )}

      <Row gap={6} style={{ alignItems: 'flex-start' }}>
        <Ionicons name="lock-closed" size={12} color={t.faint} style={{ marginTop: 2 }} />
        <T variant="caption" tone="faint" style={{ flex: 1 }}>
          Percent of members who chose to share that they have a voting plan. Only squads of 5 or more are ranked, so no one's status can be worked out.
        </T>
      </Row>
    </>
  );
}

function Podium({ entries }: { entries: StreakEntry[] }) {
  const { t } = useTheme();
  // Second, first, third, left to right.
  const order = [entries[1], entries[0], entries[2]].filter(Boolean);
  return (
    <Row gap={10} style={{ alignItems: 'flex-end', justifyContent: 'center', marginTop: 8 }}>
      {order.map((p, i) => {
        const first = i === 1;
        return (
          <View key={p.handle} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <Avatar size={first ? 76 : 58} ring={first ? t.accent : t.line} initials={initials(p.handle)} label={`@${p.handle}`} />
            <T variant="label" numberOfLines={1}>@{p.handle}</T>
            <Days n={p.current} />
            <View
              style={{
                alignSelf: 'stretch',
                height: first ? 104 : i === 0 ? 74 : 58,
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
  );
}

function Days({ n }: { n: number }) {
  const { t } = useTheme();
  return (
    <Row gap={3} style={{ alignItems: 'center' }}>
      <Ionicons name="flame" size={12} color={t.accentText} />
      <T variant="label" accessibilityLabel={`${n} day streak`}>{n}</T>
    </Row>
  );
}

function Empty({ text, action }: { text: string; action?: { label: string; onPress: () => void } }) {
  return (
    <Card tone="sub">
      <T tone="muted">{text}</T>
      {action ? <Button label={action.label} kind="quiet" onPress={action.onPress} /> : null}
    </Card>
  );
}
