import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, Share, View } from 'react-native';

import { Avatar, Button, Card, Chip, initialsOf, Notice, Row, Screen, Segmented, T, ToggleRow, type IconName } from '@/components/ui';
import { racesForDistricts } from '@/data/ballot2026';
import { getDrop, localDateKey } from '@/data/drops';
import { getOfficial, sortOfficials, type Official } from '@/data/officials';
import type { Districts } from '@/lib/geocode';
import { reminderChoices } from '@/lib/reminders';
import { BADGE_NAMES } from '@/lib/streak';
import { formatDay, formatTime, hasCompletePlan, methodLabel, planSteps } from '@/lib/votingPlan';
import { useAuth } from '@/state/AuthProvider';
import { useBallot } from '@/state/BallotProvider';
import { useDrops } from '@/state/DropProvider';
import { useFollows } from '@/state/FollowProvider';
import { schoolLine, useProfile } from '@/state/ProfileProvider';
import { useStreak } from '@/state/StreakProvider';
import { useDeleteAccount, useSignOut } from '@/state/useSignOut';
import { useTheme, type AppearancePref } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

const APP_NAME = Constants.expoConfig?.name ?? 'Civic App';

/** Short district summary for the private card. Never the address itself. */
function districtSummary(d: Districts | null) {
  if (!d) return 'Not set. Add an address to see your ballot.';
  if (d.state !== 'DE') return `Outside Delaware${d.state ? ` (${d.state})` : ''}`;
  return [
    d.stateSenate ? `Senate ${d.stateSenate}` : null,
    d.stateHouse ? `House ${d.stateHouse}` : null,
    d.county ? `${d.county} County` : null,
    d.place,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Me tab: public profile on top, private stuff clearly marked, settings at the bottom. */
export default function Me() {
  const { t, appearance, setAppearance } = useTheme();
  const { profile, reset } = useProfile();
  const signedIn = !!useAuth().user;
  const streak = useStreak();
  const { explored, plan } = useBallot();
  const follows = useFollows();
  const drops = useDrops();
  const signOut = useSignOut();
  const deleteAccount = useDeleteAccount();
  const [tab, setTab] = useState<'saved' | 'following'>('saved');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const ballot = racesForDistricts(profile.districts);
  const racesDone = ballot.races.filter((r) => explored[r.id]).length;
  const followed = sortOfficials(Object.keys(follows.following).flatMap((id) => getOfficial(id) ?? []));
  const planReady = hasCompletePlan(plan);
  const school = schoolLine(profile.school);
  const handle = profile.handle ? `@${profile.handle}` : null;

  const stats = [
    { n: String(streak.current), label: 'Day streak' },
    { n: ballot.races.length ? `${racesDone} of ${ballot.races.length}` : '0', label: 'Races explored' },
    { n: String(followed.length), label: 'Officials followed' },
  ];

  const badges: { icon: IconName; label: string; on: boolean }[] = [
    { icon: 'flame', label: `${streak.current}-day streak`, on: streak.current > 0 },
    { icon: 'checkbox', label: `Ballot ${racesDone}/${ballot.races.length}`, on: ballot.races.length > 0 && racesDone === ballot.races.length },
    ...(planReady ? [{ icon: 'checkmark-circle' as const, label: 'Plan ready', on: true }] : []),
    ...streak.badges.map((m) => ({ icon: 'ribbon' as const, label: BADGE_NAMES[m], on: true })),
  ];

  const share = () => {
    if (!handle) return;
    // TODO: add a profile link once the website can show public profiles.
    Share.share({ message: `Find me on ${APP_NAME}: ${handle}` }).catch(() => {});
  };

  const steps = planSteps(plan);
  const planSummary =
    planReady && plan.method && plan.day && plan.time
      ? `${methodLabel[plan.method]}, ${formatDay(plan.day)} at ${formatTime(plan.time)}`
      : `${steps.filter((s) => s.done).length} of ${steps.length} steps done`;

  const reminderCount = reminderChoices().filter((o) => profile.reminders[o.key]).length;
  const remindersSummary =
    Platform.OS === 'web'
      ? 'Works in the phone app'
      : !profile.notificationsAllowed
        ? 'Notifications are off'
        : reminderCount
          ? `${reminderCount} on`
          : 'All off';

  // Only Drops that can open today (one saved under the dev ?date= override may be in the future).
  const today = localDateKey();
  const savedDrops = Object.entries(drops.saved)
    .sort(([, a], [, b]) => b.localeCompare(a))
    .flatMap(([id]) => getDrop(id) ?? [])
    .filter((d) => d.date <= today);
  const questions = [...drops.questions].reverse();

  const onDelete = async () => {
    setDeleteError(null);
    const res = await deleteAccount(() => setDeleting(true));
    setDeleting(false);
    if (typeof res === 'object') setDeleteError(res.error);
  };

  return (
    <Screen>
      {/* ---------- Public profile ---------- */}
      <Row gap={16}>
        <Avatar size={76} ring={t.accent} label="Your initials" initials={initialsOf(profile.name) || profile.handle.slice(0, 1).toUpperCase()} />
        <View style={{ flex: 1, gap: 2 }}>
          <T variant="heading">{profile.name || 'Your profile'}</T>
          {handle ? <T variant="label" tone="muted">{handle}</T> : null}
          {school ? <T variant="caption" tone="faint">{school}</T> : null}
        </View>
      </Row>
      <Chip label={profile.isPublic ? 'Public profile' : 'Private profile: handle only'} />
      <Row>
        <Button label="Edit profile" kind="quiet" style={{ flex: 1, minHeight: 44 }} onPress={() => router.push('/profile/edit')} />
        <Button label="Share profile" kind="quiet" style={{ flex: 1, minHeight: 44 }} onPress={share} disabled={!handle} />
      </Row>

      {/* ---------- Stats and badges (shown only to you) ---------- */}
      <Row gap={8} style={{ justifyContent: 'space-around', marginTop: 4 }}>
        {stats.map((s) => (
          <View key={s.label} style={{ flex: 1, alignItems: 'center' }}>
            <T variant="heading">{s.n}</T>
            <T variant="caption" tone="faint" style={{ textAlign: 'center' }}>{s.label}</T>
          </View>
        ))}
      </Row>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {badges.map((b) => (
          <View
            key={b.label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              minHeight: 34,
              borderRadius: radius.pill,
              backgroundColor: b.on ? t.accentTint : t.surface,
              borderWidth: 1,
              borderColor: b.on ? t.accent : t.line,
            }}
          >
            <Ionicons name={b.icon} size={14} color={b.on ? t.accentText : t.faint} />
            <T variant="caption" tone={b.on ? 'accent' : 'muted'}>{b.label}</T>
          </View>
        ))}
      </View>
      <T variant="caption" tone="faint">Your stats and badges are only shown to you. Your streak appears on leaderboards only if you turn that on.</T>

      {/* ---------- Private ---------- */}
      <Card tone="sub" style={{ marginTop: 4 }}>
        <Row gap={6}>
          <Ionicons name="lock-closed" size={14} color={t.text} />
          <T variant="label">Private to you</T>
        </Row>
        <T variant="caption" tone="faint">Only you can see this.</T>
        <PrivateRow
          icon="location"
          title="Address and districts"
          value={districtSummary(profile.districts)}
          action="Edit"
          onPress={() => router.push({ pathname: '/address', params: { mode: 'edit' } })}
        />
        <PrivateRow
          icon="calendar"
          title="Voting plan"
          value={planSummary}
          sub={plan.shareWithSquad ? 'Plan status (yes or no) shared with squads' : 'Not shared with squads'}
          action="Edit"
          onPress={() => router.push('/plan')}
        />
        <PrivateRow icon="notifications" title="Reminders" value={remindersSummary} onPress={() => router.push('/settings/reminders')} />
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
      </Card>

      {/* ---------- Saved and Following ---------- */}
      <Segmented<'saved' | 'following'>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'saved', label: 'Saved' },
          { value: 'following', label: 'Following' },
        ]}
      />
      {tab === 'saved' ? (
        savedDrops.length || questions.length ? (
          <View style={{ gap: 8 }}>
            {savedDrops.map((d) => (
              <ListRow key={d.id} eyebrow={d.tag} title={d.title} onPress={() => router.push({ pathname: '/drop', params: { id: d.id } })} />
            ))}
            {questions.length ? <T variant="label" style={{ marginTop: 8 }}>Your questions</T> : null}
            {questions.map((q) => {
              const d = getDrop(q.dropId);
              return (
                <ListRow
                  key={q.id}
                  eyebrow="Waiting for an answer"
                  title={q.text}
                  sub={d ? `Asked on: ${d.title}` : undefined}
                  onPress={d ? () => router.push({ pathname: '/drop', params: { id: d.id } }) : undefined}
                />
              );
            })}
          </View>
        ) : (
          <Empty icon="bookmark-outline" title="Nothing saved yet" body="Tap the bookmark on a Drop to keep it here. Questions you ask show up here too." />
        )
      ) : followed.length ? (
        <View style={{ gap: 8 }}>
          {followed.map((o) => (
            <OfficialRow key={o.id} official={o} onUnfollow={() => follows.toggleFollow(o.id)} />
          ))}
        </View>
      ) : (
        <Empty icon="people-outline" title="Not following anyone yet" body="Follow your officials from the Map tab to keep up with them here." />
      )}

      {/* ---------- Settings ---------- */}
      <T variant="heading" style={{ marginTop: 8 }}>Appearance</T>
      <Segmented<AppearancePref>
        value={appearance}
        onChange={setAppearance}
        options={[
          { value: 'system', label: 'System' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
      />

      <T variant="heading" style={{ marginTop: 8 }}>Settings</T>
      <Card style={{ gap: 0, paddingVertical: 4 }}>
        <SettingRow icon="information-circle-outline" label="About and sources" onPress={() => router.push('/settings/about')} />
        {signedIn ? (
          <>
            <SettingRow icon="log-out-outline" label="Sign out" onPress={() => signOut()} />
            <SettingRow icon="trash-outline" label={deleting ? 'Deleting account…' : 'Delete account'} danger onPress={deleting ? undefined : onDelete} />
          </>
        ) : (
          <SettingRow icon="log-in-outline" label="Sign in for squads" onPress={() => router.push('/sign-in')} />
        )}
      </Card>
      {deleteError ? <Notice tone="warn"><T variant="caption">{deleteError}</T></Notice> : null}

      {__DEV__ ? <Button label="Restart onboarding (dev)" kind="quiet" icon="refresh" onPress={reset} /> : null}
    </Screen>
  );
}

function PrivateRow({ icon, title, value, sub, action, onPress }: { icon: IconName; title: string; value: string; sub?: string; action?: string; onPress: () => void }) {
  const { t } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${value}${sub ? `. ${sub}` : ''}. ${action ?? 'Open'}`}
      onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, opacity: pressed ? 0.7 : 1 })}
    >
      <Ionicons name={icon} size={18} color={t.muted} />
      <View style={{ flex: 1 }}>
        <T variant="label">{title}</T>
        <T variant="caption" tone="muted">{value}</T>
        {sub ? <T variant="caption" tone="faint">{sub}</T> : null}
      </View>
      {action ? <T variant="label" tone="accent">{action}</T> : <Ionicons name="chevron-forward" size={18} color={t.faint} />}
    </Pressable>
  );
}

function ListRow({ eyebrow, title, sub, onPress }: { eyebrow: string; title: string; sub?: string; onPress?: () => void }) {
  const { t } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: radius.md,
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.line,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <T variant="eyebrow" tone="faint">{eyebrow}</T>
        <T variant="label">{title}</T>
        {sub ? <T variant="caption" tone="faint">{sub}</T> : null}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={t.faint} /> : null}
    </Pressable>
  );
}

function OfficialRow({ official: o, onUnfollow }: { official: Official; onUnfollow: () => void }) {
  const { t } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${o.name}, ${o.office}`}
        onPress={() => router.push({ pathname: '/official/[id]', params: { id: o.id } })}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}
      >
        <Avatar size={40} initials={initialsOf(o.name)} />
        <View style={{ flex: 1 }}>
          <T variant="label">{o.name}</T>
          <T variant="caption" tone="faint">{o.office}</T>
        </View>
      </Pressable>
      <Button label="Unfollow" kind="quiet" accessibilityLabel={`Unfollow ${o.name}`} onPress={onUnfollow} style={{ minHeight: 40, paddingHorizontal: 12 }} />
    </View>
  );
}

function Empty({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  const { t } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 6, paddingVertical: 24, paddingHorizontal: 16 }}>
      <Ionicons name={icon} size={28} color={t.faint} />
      <T variant="label">{title}</T>
      <T variant="caption" tone="faint" style={{ textAlign: 'center' }}>{body}</T>
    </View>
  );
}

function SettingRow({ icon, label, onPress, danger = false }: { icon: IconName; label: string; onPress?: () => void; danger?: boolean }) {
  const { t } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, opacity: pressed ? 0.7 : 1 })}
    >
      <Ionicons name={icon} size={18} color={danger ? t.accentText : t.muted} />
      <T variant="label" tone={danger ? 'accent' : 'text'} style={{ flex: 1 }}>{label}</T>
      <Ionicons name="chevron-forward" size={18} color={t.faint} />
    </Pressable>
  );
}
