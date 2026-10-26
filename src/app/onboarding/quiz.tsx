import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { Button, Card, IconButton, Notice, Row, Screen, T, TextLink } from '@/components/ui';
import { IVOTE_URL, REGISTRATION_FAQ_URL, VOTE_GOV_URL } from '@/data/delaware';
import { useProfile, type VotingLocation } from '@/state/ProfileProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

type Answer = 'school' | 'home' | 'none';

const QUESTIONS: { id: string; q: string; options: { label: string; value: Answer }[] }[] = [
  {
    id: 'registered',
    q: 'Where are you registered to vote right now?',
    options: [
      { label: 'At my school address', value: 'school' },
      { label: 'At my home address', value: 'home' },
      { label: "Not registered / not sure", value: 'none' },
    ],
  },
  {
    id: 'live',
    q: 'Where do you live most of the year?',
    options: [
      { label: 'At school', value: 'school' },
      { label: 'Back home', value: 'home' },
    ],
  },
  {
    id: 'electionDay',
    q: 'Where will you be on Election Day, Nov. 3?',
    options: [
      { label: 'On campus', value: 'school' },
      { label: 'At home', value: 'home' },
    ],
  },
];

function recommend(a: Answer[]): { pick: VotingLocation; why: string; note?: 'register' | 'absentee' } {
  const [registered, live, day] = a;
  if (registered === 'school') return { pick: 'campus', why: "You're already registered at school, so your ballot is the campus one." };
  if (registered === 'home') {
    return day === 'school'
      ? { pick: 'home', why: "You're registered back home. Since you'll be on campus Nov. 3, look into an absentee ballot from your home state.", note: 'absentee' }
      : { pick: 'home', why: "You're registered back home and will be there on Election Day." };
  }
  // Not registered or not sure: go with where they actually live and will be.
  const pick: VotingLocation = live === 'school' || day === 'school' ? 'campus' : 'home';
  return {
    pick,
    why: pick === 'campus' ? 'You spend most of your time at school, so your campus districts decide the most about your daily life.' : 'You spend most of your time at home, so your home districts fit best.',
    note: 'register',
  };
}

/** 30-second quiz: campus or home? */
export default function Quiz() {
  const { t } = useTheme();
  const { update } = useProfile();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const step = answers.length;
  const done = step >= QUESTIONS.length || (step === 1 && answers[0] === 'school');
  const result = done ? recommend(answers) : null;

  return (
    <Screen style={{ gap: 16 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <T variant="heading">Campus or home?</T>
        <IconButton icon="close" label="Close quiz" onPress={() => router.back()} />
      </Row>

      {!done ? (
        <>
          <T variant="caption" tone="faint">Question {step + 1} of {QUESTIONS.length}</T>
          <T variant="title">{QUESTIONS[step].q}</T>
          <View style={{ gap: 10 }}>
            {QUESTIONS[step].options.map((o) => (
              <Pressable
                key={o.label}
                accessibilityRole="button"
                onPress={() => setAnswers([...answers, o.value])}
                style={({ pressed }) => ({
                  minHeight: 56,
                  paddingHorizontal: 16,
                  justifyContent: 'center',
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: t.line,
                  backgroundColor: pressed ? t.accentTint : t.surface,
                })}
              >
                <T variant="label">{o.label}</T>
              </Pressable>
            ))}
          </View>
          {step > 0 ? <TextLink label="Back" onPress={() => setAnswers(answers.slice(0, -1))} /> : null}
        </>
      ) : result ? (
        <>
          <T variant="eyebrow" tone="accent">Our suggestion</T>
          <T variant="display">{result.pick === 'campus' ? 'Vote on campus' : 'Vote back home'}</T>
          <Card>
            <T tone="muted">{result.why}</T>
          </Card>
          {result.note === 'register' ? (
            <Notice tone="warn">
              <T variant="label">Check that you're registered.</T>
              <T variant="caption" tone="muted">
                Delaware's registration deadline is the 4th Saturday before an election. For Nov. 3, that was Oct. 10. You can look up your record on iVote.
              </T>
              <TextLink label="Check my registration on iVote" onPress={() => Linking.openURL(IVOTE_URL)} />
              <TextLink label="Delaware registration FAQ" onPress={() => Linking.openURL(REGISTRATION_FAQ_URL)} />
            </Notice>
          ) : null}
          {result.note === 'absentee' ? (
            <Notice>
              <T variant="caption" tone="muted">Absentee rules depend on your home state.</T>
              <TextLink label="Look up your state at vote.gov" onPress={() => Linking.openURL(VOTE_GOV_URL)} />
            </Notice>
          ) : null}
          <View style={{ flex: 1 }} />
          <Button
            label={`Use ${result.pick === 'campus' ? 'Campus' : 'Home'}`}
            onPress={() => {
              update({ votingLocation: result.pick });
              router.back();
            }}
          />
          <Button label="Start over" kind="quiet" onPress={() => setAnswers([])} />
        </>
      ) : null}
    </Screen>
  );
}
