import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AccentHeading } from '@/components/AccentHeading';
import { LevelGroup, type CivicLevel } from '@/components/LevelGroup';
import { PressableScale } from '@/components/PressableScale';
import { Sheet } from '@/components/Sheet';
import { Button, Notice, Row, Screen, SourceTag, T, TextLink } from '@/components/ui';
import { levelLabel, racesForDistricts, type Race, type RaceLevel } from '@/data/ballot2026';
import { generalElection2026 as E, IVOTE_URL, SAMPLE_BALLOT_URL, VOTING_LOCATIONS_URL, daysUntil, parseLocalDate } from '@/data/delaware';
import { useNow } from '@/lib/useNow';
import { formatDay, hasCompletePlan, planSteps } from '@/lib/votingPlan';
import { useBallot } from '@/state/BallotProvider';
import { useProfile } from '@/state/ProfileProvider';
import { useSquads } from '@/state/SquadProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

const LEVELS: RaceLevel[] = ['federal', 'state', 'county'];

function endOfDay(iso: string) {
  const d = parseLocalDate(iso);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Deadlines that haven't passed yet. */
function upcomingDeadlines(now = new Date()) {
  const earlyOpen = now >= parseLocalDate(E.earlyVotingStart);
  return [
    {
      id: 'early',
      title: 'Early voting',
      detail: `${earlyOpen ? 'Open now through' : `${formatDay(E.earlyVotingStart)} to`} ${formatDay(E.earlyVotingEnd)}. Closed ${E.earlyVotingClosed.map(formatDay).join(', ')}.`,
      ends: endOfDay(E.earlyVotingEnd),
    },
    {
      id: 'absentee-apply',
      title: 'Absentee application',
      detail: `Must be received by ${formatDay(E.absenteeApplicationDue)}.`,
      ends: endOfDay(E.absenteeApplicationDue),
    },
    {
      id: 'absentee-return',
      title: 'Absentee ballot',
      detail: `Must be received by 8 p.m. ${formatDay(E.date)}. Postmarks don't count.`,
      ends: new Date(E.absenteeReturnBy),
    },
  ].filter((d) => d.ends > now);
}

const levelKey = (level: RaceLevel): CivicLevel => (level === 'county' ? 'local' : level);

export default function Ballot() {
  const { t } = useTheme();
  const now = useNow();
  const { profile } = useProfile();
  const { explored } = useBallot();
  const [deadlinesOpen, setDeadlinesOpen] = useState(false);
  const ballot = racesForDistricts(profile.districts);
  const done = ballot.races.filter((r) => explored[r.id]).length;
  const days = daysUntil(E.date, now);
  const deadlines = upcomingDeadlines(now);
  const outOfState = !!profile.districts && profile.districts.state !== 'DE';
  const openAddress = () => router.push({ pathname: '/address', params: { mode: 'edit' } });

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
        <View style={{ flex: 1, gap: 3 }}>
          <T variant="eyebrow" tone="accent">General election · {formatDay(E.date)}</T>
          <AccentHeading accent="ballot">Your ballot</AccentHeading>
        </View>
        <Animated.View entering={FadeIn.duration(220)} style={{ alignItems: 'flex-end' }} accessible accessibilityLabel={days > 0 ? `${days} days until Election Day` : 'Election Day is today'}>
          <T variant="display" style={{ fontSize: 42, lineHeight: 42 }}>{days > 0 ? days : 'Today'}</T>
          {days > 0 ? <T variant="caption" tone="faint">days left</T> : null}
        </Animated.View>
      </Row>

      <PlanHero />

      {deadlines.length ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Next deadline: ${deadlines[0].title}. Open all deadlines.`}
          onPress={() => setDeadlinesOpen(true)}
          style={{ minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line }}
        >
          <Ionicons name="time-outline" size={20} color={t.accentText} />
          <View style={{ flex: 1 }}>
            <T variant="caption" tone="faint">Next deadline</T>
            <T variant="label" numberOfLines={2}>{deadlines[0].title} · {deadlines[0].detail}</T>
          </View>
          <Ionicons name="chevron-up" size={18} color={t.faint} />
        </PressableScale>
      ) : null}

      {!ballot.known ? (
        <View style={{ gap: 8, padding: 16, borderRadius: radius.lg, backgroundColor: t.accentTint }}>
          <T variant="heading">{outOfState ? 'Your address is outside Delaware' : 'Add your address to see your full ballot'}</T>
          <T tone="muted">
            {outOfState
              ? "We only have Delaware's ballot so far, so you're seeing Delaware's statewide races."
              : "You're seeing statewide races. Your address adds your State Senate, State House and county races. It stays private."}
          </T>
          <Button label={outOfState ? 'Change address' : 'Add address'} kind="quiet" icon="location" onPress={openAddress} />
        </View>
      ) : null}

      <SquadNudge />

      <Row style={{ justifyContent: 'space-between', marginTop: 8 }}>
        <T variant="heading">{ballot.races.length} races</T>
        <T variant="label" tone="muted">{done} explored</T>
      </Row>

      {LEVELS.map((level) => {
        const races = ballot.races.filter((race) => race.level === level);
        const notes: string[] = [];
        if (level === 'state' && ballot.noSenateRace) notes.push('No State Senate race in your district this year.');
        if (level === 'state' && ballot.noHouseRace) notes.push('No State House race in your district this year.');
        if (level === 'county' && ballot.countyDistrictsHidden) {
          const body = ballot.county === 'Kent' ? 'Levy Court' : 'County Council';
          notes.push(`${body} district races aren't shown because we don't know your ${body} district yet. Countywide races are below.`);
        }
        if (!races.length && !notes.length) return null;
        return (
          <View key={level} style={{ gap: 8 }}>
            {races.length ? (
              <LevelGroup level={levelKey(level)} label={level === 'county' ? 'Local' : levelLabel[level]} count={races.length}>
                {races.map((race) => <RaceRow key={race.id} race={race} explored={!!explored[race.id]} />)}
              </LevelGroup>
            ) : null}
            {notes.map((note) => (
              <Notice key={note}><T variant="caption" tone="muted">{note}</T></Notice>
            ))}
          </View>
        );
      })}
      <SourceTag source="Delaware Department of Elections candidate list" />

      <Sheet visible={deadlinesOpen} onClose={() => setDeadlinesOpen(false)} accessibilityLabel="Election deadlines">
        <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
          <AccentHeading accent="deadlines" style={{ fontSize: 30, lineHeight: 33 }}>Election deadlines</AccentHeading>
          {deadlines.map((deadline) => (
            <Row key={deadline.id} gap={14} style={{ alignItems: 'center' }}>
              <View style={{ width: 54, minHeight: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: t.sub }}>
                <T variant="eyebrow" tone="accent">{deadline.ends.toLocaleDateString('en-US', { weekday: 'short' })}</T>
                <T variant="title" style={{ fontSize: 24, lineHeight: 26 }}>{deadline.ends.getDate()}</T>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <T variant="label">{deadline.title}</T>
                <T variant="caption" tone="muted" numberOfLines={2}>{deadline.detail}</T>
              </View>
            </Row>
          ))}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <DeadlineLink label="Voting locations" onPress={() => Linking.openURL(VOTING_LOCATIONS_URL)} />
            <DeadlineLink label="Sample ballot" onPress={() => Linking.openURL(SAMPLE_BALLOT_URL)} />
            <DeadlineLink label="iVote" onPress={() => Linking.openURL(IVOTE_URL)} />
          </View>
          <SourceTag source="Delaware Department of Elections" />
        </ScrollView>
      </Sheet>
    </Screen>
  );
}

function PlanHero() {
  const { t } = useTheme();
  const { plan } = useBallot();
  const steps = planSteps(plan);
  const complete = hasCompletePlan(plan);
  const done = steps.filter((step) => step.done).length;
  const next = steps.find((step) => !step.done);
  const copyByStep = {
    registered: { title: "Check you're registered", accent: 'registered', button: 'Check registration' },
    method: { title: 'Choose how to vote', accent: 'vote', button: 'Choose how' },
    where: { title: 'Pick a place to vote', accent: 'place', button: 'Pick a place' },
    when: { title: 'Pick a time to vote', accent: 'vote', button: 'Pick a time' },
  } as const;
  const copy = copyByStep[next?.id as keyof typeof copyByStep] ?? copyByStep.registered;
  // Always a dark green card, so lime reads in both modes.
  const light = t.scheme === 'light';
  const cardBg = light ? t.primary.bg : t.forest;
  const onCard = light ? '#FAF9F5' : t.text;

  return (
    <View style={{ padding: 20, gap: 14, borderRadius: radius.xl, backgroundColor: cardBg }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <T variant="eyebrow" style={{ color: t.lime }}>Next up</T>
        <T variant="caption" style={{ color: t.lime }}>{done} of {steps.length} plan steps done</T>
      </Row>
      <AccentHeading accent={complete ? 'set' : copy.accent} color={onCard} accentColor={t.lime} style={{ fontSize: 30, lineHeight: 33 }}>
        {complete ? 'Your plan is set' : copy.title}
      </AccentHeading>
      <T style={{ color: onCard }} numberOfLines={2}>
        {plan.shareWithSquad ? 'Private. Your squad only sees that your plan is ready.' : 'Your voting plan stays private and only you can see it.'}
      </T>
      <Animated.View entering={FadeIn.duration(220)} style={{ flexDirection: 'row', gap: 6 }}>
        {steps.map((step) => (
          <View key={step.id} style={{ flex: 1, height: 7, borderRadius: 4, backgroundColor: step.done ? t.lime : t.drop.track }} />
        ))}
      </Animated.View>
      {complete ? (
        <PressableScale accessibilityRole="link" onPress={() => router.push('/plan')} style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' }}>
          <T variant="label" style={{ color: t.lime, textDecorationLine: 'underline' }}>View your plan</T>
        </PressableScale>
      ) : (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={copy.button}
          onPress={() => router.push('/plan')}
          style={{ alignSelf: 'flex-start', minHeight: 44, borderRadius: radius.pill, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: t.lime }}
        >
          <T variant="label" style={{ color: '#203E35' }}>{copy.button}</T>
        </PressableScale>
      )}
    </View>
  );
}

function DeadlineLink({ label, onPress }: { label: string; onPress: () => void }) {
  const { t } = useTheme();
  return (
    <PressableScale accessibilityRole="link" onPress={onPress} style={{ minHeight: 44, borderRadius: radius.pill, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: t.sub }}>
      <T variant="label">{label}</T>
    </PressableScale>
  );
}

function SquadNudge() {
  const { nudge, refresh } = useSquads();
  const { plan } = useBallot();
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  if (!nudge || hasCompletePlan(plan)) return null;
  return (
    <Notice tone="warn">
      <T variant="label">Your squad nudged you to make a plan</T>
      <T variant="caption" tone="muted">From {nudge.squadName}. It takes about a minute.</T>
      <TextLink label="Make my plan" onPress={() => router.push('/plan')} />
    </Notice>
  );
}

function RaceRow({ race, explored }: { race: Race; explored: boolean }) {
  const { t } = useTheme();
  const count = `${race.candidates.length} ${race.candidates.length === 1 ? 'candidate' : 'candidates'}`;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${race.office}, ${count}, ${explored ? 'explored' : 'not explored yet'}`}
      onPress={() => router.push({ pathname: '/race/[id]', params: { id: race.id } })}
      style={{ minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}
    >
      <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: explored ? t.done : 'transparent', borderWidth: explored ? 0 : 2, borderColor: t.emptyBorder }}>
        {explored ? <Ionicons name="checkmark" size={15} color={t.onDone} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <T variant="label">{race.office}</T>
        <T variant="caption" tone="faint">{count}</T>
      </View>
      <Ionicons name="chevron-forward" size={18} color={t.faint} />
    </PressableScale>
  );
}
