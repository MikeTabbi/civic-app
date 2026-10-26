import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, View } from 'react-native';

import { Button, Card, Notice, ProgressBar, Row, Screen, SourceTag, T, TextLink } from '@/components/ui';
import { levelLabel, racesForDistricts, type Race, type RaceLevel } from '@/data/ballot2026';
import { generalElection2026 as E, IVOTE_URL, SAMPLE_BALLOT_URL, VOTING_LOCATIONS_URL, daysUntil, parseLocalDate } from '@/data/delaware';
import { formatDay, formatTime, methodLabel, planSteps } from '@/lib/votingPlan';
import { useBallot } from '@/state/BallotProvider';
import { useProfile } from '@/state/ProfileProvider';
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

/** Ballot tab: countdown, progress through races, voting plan, deadlines, race list. */
export default function Ballot() {
  const { t } = useTheme();
  const { profile } = useProfile();
  const { explored } = useBallot();
  const ballot = racesForDistricts(profile.districts);
  const done = ballot.races.filter((r) => explored[r.id]).length;
  const days = daysUntil(E.date);
  const deadlines = upcomingDeadlines();
  const outOfState = !!profile.districts && profile.districts.state !== 'DE';
  const openAddress = () => router.push({ pathname: '/address', params: { mode: 'edit' } });

  return (
    <Screen>
      <T variant="eyebrow" tone="accent">General Election · {formatDay(E.date)}</T>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <T variant="title">Your ballot</T>
        <View style={{ alignItems: 'flex-end' }} accessible accessibilityLabel={days > 0 ? `${days} days until Election Day` : 'Election Day is today'}>
          <T variant="display" style={{ fontSize: 40, lineHeight: 42 }}>{days > 0 ? days : 'Today'}</T>
          {days > 0 ? <T variant="caption" tone="faint">{days === 1 ? 'day' : 'days'}</T> : null}
        </View>
      </Row>

      <Card tone="sub">
        <T variant="label">
          {done} of {ballot.races.length} <T variant="label" tone="muted">races explored. Finish your ballot before Election Day.</T>
        </T>
        <ProgressBar value={ballot.races.length ? done / ballot.races.length : 0} color={t.done} />
      </Card>

      {!ballot.known ? (
        <Card tone="tint">
          <T variant="heading">{outOfState ? 'Your address is outside Delaware' : 'Add your address to see your full ballot'}</T>
          <T tone="muted">
            {outOfState
              ? "We only have Delaware's ballot so far, so you're seeing Delaware's statewide races."
              : "You're seeing statewide races. Your address adds your State Senate, State House and county races. It stays private."}
          </T>
          <Button label={outOfState ? 'Change address' : 'Add address'} icon="location" onPress={openAddress} />
        </Card>
      ) : null}

      <PlanCard />

      {deadlines.length ? (
        <Card>
          <T variant="heading">Deadlines</T>
          {deadlines.map((d) => (
            <View key={d.id} style={{ gap: 2 }}>
              <T variant="label">{d.title}</T>
              <T variant="caption" tone="muted">{d.detail}</T>
            </View>
          ))}
          <Row gap={16} style={{ flexWrap: 'wrap', marginTop: 4 }}>
            <TextLink label="Voting locations" onPress={() => Linking.openURL(VOTING_LOCATIONS_URL)} />
            <TextLink label="Sample ballot" onPress={() => Linking.openURL(SAMPLE_BALLOT_URL)} />
            <TextLink label="iVote" onPress={() => Linking.openURL(IVOTE_URL)} />
          </Row>
          <SourceTag source="Delaware Department of Elections, WHYY voter guide" />
        </Card>
      ) : null}

      {LEVELS.map((level) => {
        const races = ballot.races.filter((r) => r.level === level);
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
            <T variant="eyebrow" tone="faint" style={{ marginTop: 6 }}>{levelLabel[level]}</T>
            {races.map((r) => (
              <RaceRow key={r.id} race={r} explored={!!explored[r.id]} />
            ))}
            {notes.map((n) => (
              <Notice key={n}>
                <T variant="caption" tone="muted">{n}</T>
              </Notice>
            ))}
          </View>
        );
      })}
      <SourceTag source="Delaware Department of Elections candidate list" />
    </Screen>
  );
}

function PlanCard() {
  const { t } = useTheme();
  const { plan } = useBallot();
  const steps = planSteps(plan);
  const summary = [
    plan.method ? methodLabel[plan.method] : null,
    plan.day ? `${formatDay(plan.day)}${plan.time ? ` at ${formatTime(plan.time)}` : ''}` : null,
    plan.place.trim() || null,
  ].filter(Boolean);

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Voting plan. Open to edit." onPress={() => router.push('/plan')}>
      {({ pressed }) => (
        <Card style={{ opacity: pressed ? 0.85 : 1 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <T variant="heading">Voting plan</T>
            <Ionicons name="chevron-forward" size={18} color={t.faint} />
          </Row>
          {summary.length ? <T variant="label">{summary.join(' · ')}</T> : <T tone="muted">Make a plan: how, where and when you'll vote.</T>}
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {steps.map((step) => (
              <View
                key={step.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  borderRadius: radius.pill,
                  paddingHorizontal: 12,
                  minHeight: 36,
                  backgroundColor: step.done ? t.done : t.accentTint,
                  borderWidth: step.done ? 0 : 1,
                  borderColor: t.accent,
                }}
              >
                <Ionicons name={step.done ? 'checkmark' : 'time-outline'} size={14} color={step.done ? t.onDone : t.accentText} />
                <T variant="caption" style={{ color: step.done ? t.onDone : t.accentText }}>{step.label}</T>
              </View>
            ))}
          </Row>
          <T variant="caption" tone="faint">Private. Only you can see your plan.</T>
        </Card>
      )}
    </Pressable>
  );
}

function RaceRow({ race, explored }: { race: Race; explored: boolean }) {
  const { t } = useTheme();
  const count = race.unopposed ? 'Unopposed' : `${race.candidates.length} candidates`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${race.office}, ${count}, ${explored ? 'explored' : 'not explored yet'}`}
      onPress={() => router.push({ pathname: '/race/[id]', params: { id: race.id } })}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: radius.md,
        backgroundColor: explored ? t.surface : t.sub,
        borderWidth: 1,
        borderColor: t.line,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: explored ? t.done : t.empty }} />
      <View style={{ flex: 1 }}>
        <T variant="label">{race.office}</T>
        <T variant="caption" tone="faint">{count}</T>
      </View>
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: explored ? t.done : 'transparent',
          borderWidth: explored ? 0 : 2,
          borderColor: t.emptyBorder,
        }}
      >
        {explored ? <Ionicons name="checkmark" size={16} color={t.onDone} /> : null}
      </View>
    </Pressable>
  );
}
