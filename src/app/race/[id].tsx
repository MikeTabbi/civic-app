import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, View } from 'react-native';

import { AccentHeading } from '@/components/AccentHeading';
import { PressableScale } from '@/components/PressableScale';
import { Avatar, Button, IconButton, Notice, Row, Screen, SourceTag, T, TextLink, initialsOf } from '@/components/ui';
import { getRace, levelLabel, sortedCandidates, type RaceLevel } from '@/data/ballot2026';
import { light } from '@/lib/haptics';
import { useBallot } from '@/state/BallotProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

const AUTO_EXPLORE_MS = 10_000;

const civicLevel = (level: RaceLevel) => (level === 'county' ? 'local' : level);
const lastWord = (value: string) => value.trim().split(/\s+/).at(-1)?.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '') || value;

export default function RaceDetail() {
  const { t } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const race = getRace(String(id));
  const { explored, setExplored } = useBallot();
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const isExplored = race ? !!explored[race.id] : false;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        <Row style={{ minHeight: 44 }}><IconButton icon="chevron-back" label="Back" onPress={back} /></Row>
        <AccentHeading accent="found">Race not found</AccentHeading>
        <T tone="muted">This race isn't on the 2026 General Election ballot.</T>
      </Screen>
    );
  }

  const palette = t.level[civicLevel(race.level)];
  const toggle = () => {
    if (timer.current) clearTimeout(timer.current);
    if (!isExplored) void light();
    setExplored(race.id, !isExplored);
  };

  return (
    <Screen padded={false} style={{ gap: 0 }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24, gap: 14, borderBottomLeftRadius: radius.xxl, borderBottomRightRadius: radius.xxl, backgroundColor: palette.tint }}>
        <Row style={{ justifyContent: 'space-between', minHeight: 44 }}>
          <IconButton icon="chevron-back" label="Back" onPress={back} style={{ backgroundColor: t.surface }} />
          <T variant="eyebrow" style={{ color: palette.ink }}>{race.level === 'county' ? 'Local' : levelLabel[race.level]}</T>
        </Row>
        <AccentHeading accent={lastWord(race.office)}>{race.office}</AccentHeading>
        <T tone="muted">{race.about}</T>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 32, gap: 14 }}>
        <T variant="heading">{race.unopposed ? 'On the ballot' : `${race.candidates.length} candidates`}</T>
        {race.unopposed ? (
          <Notice><T variant="caption" tone="muted">Only one candidate is running for this office, so the race is unopposed. You can still vote in it or leave it blank.</T></Notice>
        ) : null}

        {sortedCandidates(race).map((candidate) => (
          <View key={candidate.name} style={{ padding: 16, gap: 12, borderRadius: radius.lg, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line }}>
            <Row gap={12} style={{ alignItems: 'center' }}>
              <Avatar size={48} initials={initialsOf(candidate.name)} label={`${candidate.name} initials`} />
              <View style={{ flex: 1, gap: 2 }}>
                <T variant="heading">{candidate.name}</T>
                <T variant="label" tone="muted">{candidate.party}{candidate.incumbent ? ' · Incumbent' : ''}</T>
              </View>
            </Row>
            {candidate.website ? <TextLink label="Campaign website" onPress={() => Linking.openURL(candidate.website!)} /> : null}
          </View>
        ))}
        <T variant="caption" tone="faint">Listed alphabetically by last name.</T>

        <PressableScale
          accessibilityRole="button"
          accessibilityState={{ expanded: sourcesOpen }}
          accessibilityLabel={`Sources, 2. ${sourcesOpen ? 'Collapse' : 'Expand'}`}
          onPress={() => setSourcesOpen((value) => !value)}
          style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderBottomWidth: 1, borderColor: t.line }}
        >
          <T variant="label">Sources (2)</T>
          <Ionicons name={sourcesOpen ? 'chevron-up' : 'chevron-down'} size={18} color={t.faint} />
        </PressableScale>
        {sourcesOpen ? (
          <View style={{ gap: 10 }}>
            <SourceTag source={race.aboutSource} />
            <TextLink label="About this office" onPress={() => Linking.openURL(race.aboutSourceUrl)} />
            <SourceTag source={race.source} />
            <TextLink label="Official candidate list" onPress={() => Linking.openURL(race.sourceUrl)} />
          </View>
        ) : null}

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
      </View>
    </Screen>
  );
}
