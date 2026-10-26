import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Share, View } from 'react-native';

import { ManageSquad } from '@/components/squad/ManageSquad';
import { CreateSquadCard, JoinSquadCard } from '@/components/squad/SquadForms';
import { Avatar, Button, Card, Notice, ProgressBar, Row, Screen, Segmented, T, TextLink } from '@/components/ui';
import { accountsEnabled } from '@/lib/auth';
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

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const count = squads.length;

  if (!loaded) {
    return (
      <Screen>
        <ActivityIndicator color={t.accent} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  // An invite link opened earlier shows up here as a filled-in join form.
  if (!active || adding || pendingCode) {
    const done = () => setAdding(false);
    return (
      <Screen>
        <T variant="eyebrow" tone="accent">Squad</T>
        <T variant="title">{active ? 'Add a squad' : 'Get your friends to the polls'}</T>
        <T tone="muted">
          Set a goal together and see how many of you have a voting plan. Squads only see a yes or no, and only from people who choose to share.
        </T>
        {error ? <Notice tone="warn"><T variant="caption">{error}</T></Notice> : null}
        {count < MAX_SQUADS ? (
          <>
            <JoinSquadCard key={pendingCode ?? 'join'} onDone={done} />
            <CreateSquadCard onDone={done} />
          </>
        ) : (
          <Notice><T variant="caption">You're in {MAX_SQUADS} squads, the most allowed. Leave one to add another.</T></Notice>
        )}
        {active ? (
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
    <Screen>
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
    Share.share({ message: `Join my squad "${squad.name}" on Civic App and let's all make a voting plan. ${link} (code ${code})` }).catch(() => {});

  const pct = squad.members ? squad.withPlan / squad.members : 0;
  const others = roster.filter((m) => !m.isMe).length;

  return (
    <>
      <T variant="eyebrow" tone="accent">Your squad</T>
      <T variant="title">{squad.name}</T>
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

      <Card tone="tint">
        <T variant="eyebrow" tone="accent">Squad goal{squad.goalEnds ? ` · ends ${formatDay(squad.goalEnds)}` : ''}</T>
        <T variant="heading">{squad.goal ?? 'Everyone has a voting plan'}</T>
        <Row style={{ alignItems: 'baseline' }} gap={2}>
          <T variant="display">{squad.withPlan}</T>
          <T variant="heading" tone="faint">/{squad.members}</T>
        </Row>
        <ProgressBar value={pct} />
        <T variant="caption" tone="muted">
          {squad.withPlan} of {squad.members} {squad.members === 1 ? 'has' : 'have'} a plan
        </T>
        <Button
          label={squad.nudgedToday ? 'Nudged today' : 'Nudge the others'}
          kind="dark"
          icon="notifications-outline"
          onPress={nudge}
          loading={nudging}
          disabled={squad.nudgedToday || squad.members < 2}
        />
        {notice ? <Notice tone={notice.tone}><T variant="caption">{notice.text}</T></Notice> : null}
        <Row gap={6}>
          <Ionicons name="lock-closed" size={12} color={t.faint} />
          <T variant="caption" tone="faint" style={{ flex: 1 }}>
            Counts only members who chose to share. Squads see a yes or no, never how, where or when anyone votes.
          </T>
        </Row>
      </Card>

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
      <T variant="title">Get your friends to the polls</T>
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
