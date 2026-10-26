import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Linking, View } from 'react-native';

import { Button, Card, Chip, IconButton, Notice, Row, Screen, SourceTag, T, TextLink } from '@/components/ui';
import { getRace, levelLabel, sortedCandidates } from '@/data/ballot2026';
import { useBallot } from '@/state/BallotProvider';
import { useTheme } from '@/theme/ThemeProvider';

/** Opening a race for this long counts as exploring it. */
const AUTO_EXPLORE_MS = 10_000;

/** Race detail: what the office does, who's running, and a way to mark it explored. */
export default function RaceDetail() {
  const { t } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const race = getRace(String(id));
  const { explored, setExplored } = useBallot();
  const isExplored = race ? !!explored[race.id] : false;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start the timer once per visit. A manual toggle cancels it so it never overrides the person's choice.
  useEffect(() => {
    if (!race || explored[race.id]) return;
    timer.current = setTimeout(() => setExplored(race.id, true), AUTO_EXPLORE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [race?.id]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!race) {
    return (
      <Screen>
        <Row style={{ minHeight: 44 }}>
          <IconButton icon="chevron-back" label="Back" onPress={back} />
        </Row>
        <T variant="title">Race not found</T>
        <T tone="muted">This race isn't on the 2026 General Election ballot.</T>
      </Screen>
    );
  }

  const toggle = () => {
    if (timer.current) clearTimeout(timer.current);
    setExplored(race.id, !isExplored);
  };

  return (
    <Screen>
      <Row style={{ minHeight: 44 }}>
        <IconButton icon="chevron-back" label="Back" onPress={back} />
      </Row>
      <T variant="eyebrow" tone="accent">{levelLabel[race.level]}</T>
      <T variant="title">{race.office}</T>

      <Card tone="sub">
        <T variant="label">What this office does</T>
        <T tone="muted">{race.about}</T>
        <SourceTag source={race.aboutSource} />
      </Card>

      <T variant="heading" style={{ marginTop: 4 }}>
        {race.unopposed ? 'On the ballot' : `${race.candidates.length} candidates`}
      </T>
      {race.unopposed ? (
        <Notice>
          <T variant="caption" tone="muted">Only one candidate is running for this office, so the race is unopposed. You can still vote in it or leave it blank.</T>
        </Notice>
      ) : null}

      {sortedCandidates(race).map((cand) => (
        <Card key={cand.name}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, gap: 2 }}>
              <T variant="heading">{cand.name}</T>
              <T variant="label" tone="muted">{cand.party}</T>
            </View>
            {cand.incumbent ? <Chip label="Incumbent" /> : null}
          </Row>
          {cand.website ? <TextLink label="Campaign website" onPress={() => Linking.openURL(cand.website!)} /> : null}
        </Card>
      ))}
      <T variant="caption" tone="faint">Listed alphabetically by last name.</T>
      <SourceTag source={race.source} />
      <TextLink label="Official candidate list" onPress={() => Linking.openURL(race.sourceUrl)} />

      <Button
        label={isExplored ? 'Explored' : 'Mark as explored'}
        kind={isExplored ? 'quiet' : 'primary'}
        icon={isExplored ? 'checkmark-circle' : 'checkmark'}
        onPress={toggle}
        style={{ marginTop: 8 }}
      />
      {isExplored ? (
        <Row gap={6} style={{ justifyContent: 'center' }}>
          <Ionicons name="information-circle-outline" size={14} color={t.faint} />
          <T variant="caption" tone="faint">Tap again to mark it unexplored.</T>
        </Row>
      ) : null}
    </Screen>
  );
}
