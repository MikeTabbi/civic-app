import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, Share, View } from 'react-native';

import { AccentHeading } from '@/components/AccentHeading';
import { PressableScale } from '@/components/PressableScale';
import { Skeleton } from '@/components/Skeleton';
import { ManageSquad } from '@/components/squad/ManageSquad';
import { CreateSquadCard, JoinSquadCard } from '@/components/squad/SquadForms';
import { Avatar, Button, Card, Notice, ProgressBar, Row, Screen, Segmented, T, TextLink } from '@/components/ui';
import { accountsEnabled } from '@/lib/auth';
import { APP_NAME } from '@/lib/brand';
import { confirm } from '@/lib/confirm';
import { formatCode, joinLink, MAX_SQUADS, nudgeSquad, removeMember, squadRoster, type Member, type Squad as SquadT } from '@/lib/squads';
import { formatDay } from '@/lib/votingPlan';
import { useAuth } from '@/state/AuthProvider';
import { useSquads } from '@/state/SquadProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

/** Squad tab: your squads, the shared goal with the real plan count, invites, nudges. */
export default function Squad() {
  const { user } = useAuth();
  return user ? <SignedInSquad /> : <SignInCard />;
}

function SignedInSquad() {
  const { t } = useTheme();
  const { loaded, squads, active, setActive, refresh, error, pendingCode, setPendingCode } = useSquads();
  const [adding, setAdding] = useState(false);
  const [entry, setEntry] = useState<'create' | 'join' | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const count = squads.length;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  if (!loaded) {
    return (
      <Screen style={{ gap: 18 }}>
        <Skeleton width="34%" height={12} />
        <Skeleton width="72%" height={38} radius={12} />
        <Skeleton height={190} radius={24} />
        <Skeleton height={110} radius={20} />
      </Screen>
    );
  }

  if (!active && !entry && !pendingCode) {
    return (
      <Screen style={{ justifyContent: 'center', gap: 18 }}>
        <AccentHeading accent="together">Vote together</AccentHeading>
        <SquadIllustration />
        <View style={{ alignItems: 'center', gap: 8 }}>
          <T variant="heading">No squad yet</T>
          <T tone="muted" style={{ textAlign: 'center' }}>
            Set a goal together and see how many of you have a voting plan. Squads only see a yes or no, and only from people who choose to share.
          </T>
        </View>
        {error ? <Notice tone="warn"><T variant="caption">{error}</T></Notice> : null}
        <Button label="Start a squad" icon="people" onPress={() => setEntry('create')} />
        <View style={{ alignItems: 'center' }}>
          <TextLink label="I have an invite code" onPress={() => setEntry('join')} />
        </View>
      </Screen>
    );
  }

  // An invite link opened earlier shows up here as a filled-in join form.
  if (!active || adding || pendingCode || entry) {
    const done = () => {
      setAdding(false);
      setEntry(null);
    };
    return (
      <Screen>
        <T variant="eyebrow" tone="accent">Squad</T>
        <AccentHeading accent={active ? 'squad' : 'friends'}>{active ? 'Add a squad' : 'Get your friends to the polls'}</AccentHeading>
        <T tone="muted">
          Set a goal together and see how many of you have a voting plan. Squads only see a yes or no, and only from people who choose to share.
        </T>
        {error ? <Notice tone="warn"><T variant="caption">{error}</T></Notice> : null}
        {count < MAX_SQUADS ? (
          <>
            {pendingCode || entry === 'join' || (active && adding && !entry) ? <JoinSquadCard key={pendingCode ?? 'join'} onDone={done} /> : null}
            {entry === 'create' || (active && adding && !entry) ? <CreateSquadCard onDone={done} /> : null}
          </>
        ) : (
          <Notice><T variant="caption">You're in {MAX_SQUADS} squads, the most allowed. Leave one to add another.</T></Notice>
        )}
        {active || entry ? (
          <Button
            label="Cancel"
            kind="quiet"
            onPress={() => {
              setPendingCode(null);
              done();
            }}
          />
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} colors={[t.accent]} />}>
      {count > 1 ? (
        <Segmented<string>
          value={active.id}
          onChange={setActive}
          options={squads.map((s) => ({ value: s.id, label: s.name.length > 14 ? `${s.name.slice(0, 13)}…` : s.name }))}
        />
      ) : null}
      <SquadDetail key={active.id} squad={active} />
      {count < MAX_SQUADS ? <TextLink label="Create or join another squad" onPress={() => setAdding(true)} /> : null}
    </Screen>
  );
}

function SquadIllustration() {
  const { t } = useTheme();
  return (
    <View accessible accessibilityLabel="Three connected civic circles" style={{ height: 116, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 82, height: 82, borderRadius: 41, backgroundColor: t.level.federal.tint, position: 'absolute', left: '22%' }} />
      <View style={{ width: 82, height: 82, borderRadius: 41, backgroundColor: t.level.state.tint, position: 'absolute' }} />
      <View style={{ width: 82, height: 82, borderRadius: 41, backgroundColor: t.level.local.tint, position: 'absolute', right: '22%' }} />
      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: t.forest, borderWidth: 4, borderColor: t.lime }} />
    </View>
  );
}

function SquadDetail({ squad }: { squad: SquadT }) {
  const { t } = useTheme();
  const { refresh } = useSquads();
  const [roster, setRoster] = useState<Member[]>([]);
  const [nudging, setNudging] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'good' | 'warn'; text: string } | null>(null);
  const owner = squad.role === 'owner';

  // Reload the member list when the squad or its size changes.
  useEffect(() => {
    let live = true;
    squadRoster(squad.id).then((r) => live && r.ok && setRoster(r.data));
    return () => {
      live = false;
    };
  }, [squad.id, squad.members]);

  const nudge = async () => {
    setNudging(true);
    const res = await nudgeSquad(squad.id);
    setNudging(false);
    if (!res.ok) return setNotice({ tone: 'warn', text: res.message });
    setNotice({
      tone: 'good',
      text: res.data === 0 ? 'Everyone else already has a plan.' : `Nudged ${res.data} ${res.data === 1 ? 'person' : 'people'}. They'll see it on their Ballot tab.`,
    });
    refresh();
  };

  const remove = async (m: Member) => {
    const who = m.handle ? `@${m.handle}` : 'this member';
    if (!(await confirm(`Remove ${who}?`, 'They can only come back with a new invite.', 'Remove', true))) return;
    const res = await removeMember(squad.id, m.userId);
    if (!res.ok) return setNotice({ tone: 'warn', text: res.message });
    setNotice({ tone: 'good', text: `Removed ${who}.` });
    refresh();
  };

  const link = joinLink(squad.inviteCode);
  const code = formatCode(squad.inviteCode);
  const copy = async () => {
    await Clipboard.setStringAsync(squad.inviteCode);
    setNotice({ tone: 'good', text: 'Code copied.' });
  };
  const share = () =>
    Share.share({ message: `Join my squad "${squad.name}" on ${APP_NAME} and let's all make a voting plan. ${link} (code ${code})` }).catch(() => {});

  const pct = squad.members ? squad.withPlan / squad.members : 0;
  const others = roster.filter((m) => !m.isMe).length;

  return (
    <>
      <T variant="eyebrow" tone="accent">Your squad</T>
      <AccentHeading accent={squad.name.trim().split(/\s+/).at(-1) ?? squad.name}>{squad.name}</AccentHeading>
      <Row gap={0}>
        {roster.slice(0, 6).map((m, i) => (
          <View key={m.userId} style={{ marginLeft: i ? -10 : 0 }}>
            <Avatar size={34} ring={t.bg} initials={(m.handle ?? '?').slice(0, 2).toUpperCase()} label={m.handle ? `@${m.handle}` : 'Member'} />
          </View>
        ))}
        <T variant="caption" tone="faint" style={{ marginLeft: 16 }}>
          {squad.members} {squad.members === 1 ? 'member' : 'members'}
        </T>
      </Row>

      <View style={{ gap: 12, padding: 20, borderRadius: radius.xl, backgroundColor: t.forest }}>
        <T variant="eyebrow" style={{ color: t.lime }}>Squad goal{squad.goalEnds ? ` · ends ${formatDay(squad.goalEnds)}` : ''}</T>
        <T variant="heading" style={{ color: t.lime }}>{squad.goal ?? 'Everyone has a voting plan'}</T>
        <Row style={{ alignItems: 'baseline' }} gap={2}>
          <T variant="display" style={{ color: t.lime }}>{squad.withPlan}</T>
          <T variant="heading" style={{ color: t.lime }}> of {squad.members}</T>
        </Row>
        <ProgressBar value={pct} color={t.lime} track={t.drop.track} />
        <T variant="caption" style={{ color: t.lime }}>
          {squad.withPlan} of {squad.members} {squad.members === 1 ? 'has' : 'have'} a plan
        </T>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={squad.nudgedToday ? 'Nudged today' : 'Nudge the others'}
          accessibilityState={{ disabled: squad.nudgedToday || squad.members < 2, busy: nudging }}
          onPress={nudge}
          disabled={squad.nudgedToday || squad.members < 2}
          style={{ minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.pill, paddingHorizontal: 16, backgroundColor: t.lime, opacity: squad.nudgedToday || squad.members < 2 ? 0.55 : 1 }}
        >
          {nudging ? <ActivityIndicator color={t.forest} /> : <Ionicons name="notifications-outline" size={17} color={t.forest} />}
          <T variant="label" style={{ color: t.forest }}>{squad.nudgedToday ? 'Nudged today' : 'Nudge the others'}</T>
        </PressableScale>
        {notice ? <Notice tone={notice.tone}><T variant="caption">{notice.text}</T></Notice> : null}
        <Row gap={6}>
          <Ionicons name="lock-closed" size={12} color={t.lime} />
          <T variant="caption" style={{ flex: 1, color: t.lime }}>
            Counts only members who chose to share. Squads see a yes or no, never how, where or when anyone votes.
          </T>
        </Row>
      </View>

      <Row style={{ justifyContent: 'space-between' }}>
        <T variant="heading">Leaderboards</T>
        <TextLink label="Full board" onPress={() => router.push('/leaderboard')} />
      </Row>

      <Card>
        <T variant="heading">Invite friends</T>
        <View style={{ padding: 14, borderRadius: radius.md, backgroundColor: t.sub, alignItems: 'center' }}>
          <T variant="title" accessibilityLabel={`Invite code ${squad.inviteCode.split('').join(' ')}`} style={{ letterSpacing: 2 }}>
            {code}
          </T>
        </View>
        <Row gap={8}>
          <Button label="Copy code" kind="quiet" icon="copy-outline" onPress={copy} style={{ flex: 1 }} />
          <Button label="Share" kind="dark" icon="share-outline" onPress={share} style={{ flex: 1 }} />
        </Row>
      </Card>

      <Card>
        <T variant="heading">Members</T>
        {roster.map((m) => (
          <Row key={m.userId} gap={12} style={{ minHeight: 44 }}>
            <Avatar size={34} initials={(m.handle ?? '?').slice(0, 2).toUpperCase()} />
            <View style={{ flex: 1 }}>
              <T variant="label">{m.handle ? `@${m.handle}` : 'Member'}{m.isMe ? ' (you)' : ''}</T>
              {m.name || m.role === 'owner' ? (
                <T variant="caption" tone="faint">{[m.name, m.role === 'owner' ? 'Owner' : null].filter(Boolean).join(' · ')}</T>
              ) : null}
            </View>
            {owner && !m.isMe ? <TextLink label="Remove" onPress={() => remove(m)} /> : null}
          </Row>
        ))}
        {others === 0 ? <T variant="caption" tone="faint">Just you so far. Share your code to invite people.</T> : null}
      </Card>

      <ManageSquad key={squad.id} squad={squad} />
    </>
  );
}

/** Signed out: squads need an account. Opens the same account form as onboarding. */
function SignInCard() {
  return (
    <Screen>
      <T variant="eyebrow" tone="accent">Squad</T>
      <AccentHeading accent="friends">Get your friends to the polls</AccentHeading>
      <Card tone="tint">
        <T variant="heading">Sign in to join a squad</T>
        <T tone="muted">
          Make a squad with friends, set a goal and see how many of you have a voting plan. Your plan details always stay on your phone.
        </T>
        {accountsEnabled ? (
          <Button label="Sign in" onPress={() => router.push('/sign-in')} />
        ) : (
          <T variant="caption" tone="faint">Accounts aren't connected in this build yet.</T>
        )}
      </Card>
    </Screen>
  );
}
