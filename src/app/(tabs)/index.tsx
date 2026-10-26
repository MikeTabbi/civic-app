import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Card, ProgressBar, Row, Screen, SourceTag, T } from '@/components/ui';
import { election, races, votingPlan } from '@/data/mock';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

function daysUntil(iso: string) {
  const ms = new Date(iso + 'T00:00:00').getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/** Ballot tab: countdown, progress through races, voting plan, race list. */
export default function Ballot() {
  const { t } = useTheme();
  const explored = races.filter((r) => r.explored).length;
  const days = daysUntil(election.date);

  return (
    <Screen>
      <T variant="eyebrow" tone="accent">{election.label}</T>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <T variant="title">Your ballot</T>
        <View style={{ alignItems: 'flex-end' }}>
          <T variant="display" style={{ fontSize: 40, lineHeight: 42 }}>{days}</T>
          <T variant="caption" tone="faint">days</T>
        </View>
      </Row>

      <Card tone="sub">
        <T variant="label">
          {explored} of {races.length} <T variant="label" tone="muted">races explored. Finish your ballot before Election Day.</T>
        </T>
        <ProgressBar value={explored / races.length} color={t.done} />
      </Card>

      <Card>
        <T variant="heading">Voting plan</T>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {votingPlan.map((step) => (
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
      </Card>

      <View style={{ gap: 8 }}>
        {races.map((r) => (
          <Pressable
            key={r.id}
            accessibilityRole="button"
            accessibilityLabel={`${r.name}, ${r.level}, ${r.explored ? 'explored' : 'not explored yet'}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: radius.md,
              backgroundColor: r.explored ? t.surface : t.sub,
              borderWidth: 1,
              borderColor: t.line,
            }}
          >
            <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: r.explored ? t.done : t.empty }} />
            <View style={{ flex: 1 }}>
              <T variant="label">{r.name}</T>
              <T variant="caption" tone="faint">{r.level} · {r.candidates}</T>
            </View>
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: r.explored ? t.done : 'transparent',
                borderWidth: r.explored ? 0 : 2,
                borderColor: t.emptyBorder,
              }}
            >
              {r.explored ? <Ionicons name="checkmark" size={16} color={t.onDone} /> : null}
            </View>
          </Pressable>
        ))}
      </View>
      <SourceTag source={election.source} />
    </Screen>
  );
}
