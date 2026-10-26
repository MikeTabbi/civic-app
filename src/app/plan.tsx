import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Linking, Platform, Pressable, View } from 'react-native';

import { Button, Card, IconButton, Notice, Row, Screen, SourceTag, T, TextField, TextLink, ToggleRow } from '@/components/ui';
import { generalElection2026 as E, IVOTE_URL, VOTING_LOCATIONS_URL, parseLocalDate } from '@/data/delaware';
import { syncReminders } from '@/lib/reminders';
import { formatDay, formatTime, methodLabel, planDays, planTimes, planWhenValid } from '@/lib/votingPlan';
import { useBallot, type VotingMethod, type VotingPlan } from '@/state/BallotProvider';
import { useProfile } from '@/state/ProfileProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

const METHODS: { id: VotingMethod; sub: string }[] = [
  { id: 'early', sub: `${formatDay(E.earlyVotingStart)} to ${formatDay(E.earlyVotingEnd)} at any early voting site in your county.` },
  { id: 'in_person', sub: `${formatDay(E.date)}, 7 a.m. to 8 p.m., at your assigned polling place.` },
  { id: 'mail', sub: `Apply by ${formatDay(E.absenteeApplicationDue)}. Your ballot must arrive by 8 p.m. ${formatDay(E.date)}.` },
];

const PLACE_LABEL: Record<VotingMethod, string> = {
  early: 'Early voting site',
  in_person: 'Polling place',
  mail: 'Where you will mail or drop off your ballot',
};

/** Voting plan: registered, how, where, when. Private to this device. */
export default function Plan() {
  const { t } = useTheme();
  const { plan, updatePlan } = useBallot();
  const { profile } = useProfile();
  const remindersOn = Platform.OS !== 'web' && profile.notificationsAllowed && Object.values(profile.reminders).some(Boolean);
  const earlyOver = new Date() > new Date(parseLocalDate(E.earlyVotingEnd).getTime() + 86_400_000);
  const methods = METHODS.filter((m) => !(m.id === 'early' && earlyOver));

  const change = (patch: Partial<VotingPlan>) => {
    const next = { ...plan, ...patch };
    updatePlan(patch);
    const timing = 'method' in patch || 'day' in patch || 'time' in patch;
    if (timing && remindersOn) syncReminders(profile.reminders, next).catch(() => 0);
  };

  const pickMethod = (method: VotingMethod) => {
    const next = { ...plan, method };
    change(planWhenValid(next) ? { method } : { method, day: null, time: null });
  };

  const days = plan.method ? planDays(plan.method) : [];
  const times = plan.method && plan.day ? planTimes(plan.method, plan.day) : [];

  return (
    <Screen style={{ gap: 16 }}>
      <Row style={{ minHeight: 44 }}>
        <IconButton icon="chevron-back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </Row>
      <T variant="title">Your voting plan</T>
      <T tone="muted">Private. Your plan is saved on this phone and never shown on your profile or to your squad.</T>

      <Step n={1} title="Are you registered?" done={plan.registered}>
        <T variant="caption" tone="muted">
          Check your voter record on iVote. Delaware's registration deadline for this election was {formatDay(E.registrationDeadline)}.
        </T>
        <TextLink label="Check my registration on iVote" onPress={() => Linking.openURL(IVOTE_URL)} />
        <ToggleRow title="Yes, I'm registered" value={plan.registered} onValueChange={(v) => change({ registered: v })} />
        <SourceTag source="Delaware Department of Elections" />
      </Step>

      <Step n={2} title="How I'm voting" done={!!plan.method}>
        {methods.map((m) => (
          <Option key={m.id} title={methodLabel[m.id]} sub={m.sub} on={plan.method === m.id} onPress={() => pickMethod(m.id)} />
        ))}
        {plan.method === 'mail' ? (
          <Notice tone="warn">
            <T variant="caption" tone="muted">
              Haven't applied yet? Request an absentee ballot on iVote by {formatDay(E.absenteeApplicationDue)}. Postmarks don't count, so mail it early.
            </T>
            <TextLink label="Apply on iVote" onPress={() => Linking.openURL(IVOTE_URL)} />
          </Notice>
        ) : null}
        <SourceTag source="Delaware Department of Elections, WHYY voter guide" />
      </Step>

      <Step n={3} title="Where" done={plan.place.trim().length > 0}>
        <TextLink label="Find official voting locations" onPress={() => Linking.openURL(VOTING_LOCATIONS_URL)} />
        <TextField
          label={plan.method ? PLACE_LABEL[plan.method] : 'Place'}
          value={plan.place}
          onChangeText={(place) => change({ place })}
          placeholder="Type the place name or address"
          hint="Only you can see this."
          autoCorrect={false}
        />
      </Step>

      <Step n={4} title="When" done={!!plan.day && !!plan.time}>
        {!plan.method ? (
          <T variant="caption" tone="muted">Pick how you're voting first.</T>
        ) : days.length === 0 ? (
          <T variant="caption" tone="muted">There are no days left for {methodLabel[plan.method].toLowerCase()}. Pick another way to vote.</T>
        ) : (
          <>
            <T variant="label">Day</T>
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              {days.map((d) => (
                <Pill key={d} label={formatDay(d)} on={plan.day === d} onPress={() => change({ day: d, time: plan.time && planTimes(plan.method!, d).includes(plan.time) ? plan.time : null })} />
              ))}
            </Row>
            {plan.day ? (
              <>
                <T variant="label" style={{ marginTop: 4 }}>Time</T>
                <Row gap={8} style={{ flexWrap: 'wrap' }}>
                  {times.map((tm) => (
                    <Pill key={tm} label={formatTime(tm)} on={plan.time === tm} onPress={() => change({ time: tm })} />
                  ))}
                </Row>
              </>
            ) : null}
            {plan.method === 'early' ? (
              <T variant="caption" tone="faint">
                Early voting runs 7 a.m. to 7 p.m. until {formatDay(E.earlyVotingLateOpenFrom)}, then 11 a.m. to 7 p.m. Closed {E.earlyVotingClosed.map(formatDay).join(', ')}.
              </T>
            ) : null}
            <SourceTag source="Delaware Department of Elections, WHYY voter guide" />
          </>
        )}
        {remindersOn && plan.day && plan.time ? (
          <Row gap={6}>
            <Ionicons name="notifications-outline" size={14} color={t.faint} />
            <T variant="caption" tone="faint">We'll remind you an hour before.</T>
          </Row>
        ) : null}
      </Step>

      <Button label="Done" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
    </Screen>
  );
}

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: ReactNode }) {
  const { t } = useTheme();
  return (
    <Card>
      <Row gap={10}>
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: done ? t.done : t.sub,
          }}
        >
          {done ? <Ionicons name="checkmark" size={16} color={t.onDone} /> : <T variant="caption" tone="muted">{n}</T>}
        </View>
        <T variant="heading">{title}</T>
      </Row>
      {children}
    </Card>
  );
}

function Option({ title, sub, on, onPress }: { title: string; sub: string; on: boolean; onPress: () => void }) {
  const { t } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={`${title}. ${sub}`}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: radius.md,
        borderWidth: on ? 2 : 1,
        borderColor: on ? t.accent : t.line,
        backgroundColor: on ? t.accentTint : t.surface,
      }}
    >
      <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={on ? t.accentText : t.faint} />
      <View style={{ flex: 1 }}>
        <T variant="label">{title}</T>
        <T variant="caption" tone="faint">{sub}</T>
      </View>
    </Pressable>
  );
}

function Pill({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const { t } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={{
        minHeight: 40,
        paddingHorizontal: 14,
        borderRadius: radius.pill,
        justifyContent: 'center',
        backgroundColor: on ? t.accent : t.sub,
      }}
    >
      <T variant="caption" style={{ color: on ? t.onAccent : t.text }}>{label}</T>
    </Pressable>
  );
}
