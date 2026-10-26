import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar, Button, Row, Screen, SourceTag, T } from '@/components/ui';
import { officialsByLevel } from '@/data/mock';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

const LEVELS = ['Federal', 'State', 'County', 'City'] as const;
type MapLevel = (typeof LEVELS)[number];

/** Power Map: concentric rings from "You" outward; pick a ring to see who holds power there. */
export default function PowerMap() {
  const { t } = useTheme();
  const [level, setLevel] = useState<MapLevel>('State');
  const people = officialsByLevel[level];

  return (
    <Screen>
      <T variant="title">Power Map</T>
      <T tone="muted">Who decides what, from your dorm outward</T>

      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        {LEVELS.map((l, i) => {
          const size = 280 - i * 62;
          const on = l === level;
          return (
            <Pressable
              key={l}
              accessibilityRole="button"
              accessibilityLabel={`${l} level`}
              accessibilityState={{ selected: on }}
              onPress={() => setLevel(l)}
              style={{
                position: i === 0 ? 'relative' : 'absolute',
                top: i === 0 ? 0 : 8 + (i * 62) / 2,
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: on ? 3 : 1.5,
                borderColor: on ? t.accent : t.line,
                backgroundColor: on ? t.accentTint : i % 2 ? t.sub : t.surface,
                alignItems: 'center',
              }}
            >
              <T variant="eyebrow" tone={on ? 'accent' : 'faint'} style={{ marginTop: 10 }}>{l}</T>
            </Pressable>
          );
        })}
        <View style={{ position: 'absolute', top: 8 + 140 - 12, alignItems: 'center' }}>
          <Avatar size={36} ring={t.text} label="You" />
          <T variant="caption">You</T>
        </View>
      </View>
      <Row gap={6}>
        <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: t.accent }} />
        <T variant="caption" tone="faint">Orange ring = news this week</T>
      </Row>

      <T variant="heading">{level} · {people.length} {people.length === 1 ? 'person' : 'people'}</T>
      <T variant="caption" tone="muted">{people[0]?.covers}</T>
      <View style={{ gap: 8 }}>
        {people.map((p, i) => (
          <Row
            key={p.name + i}
            gap={12}
            style={{ padding: 12, borderRadius: radius.md, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line }}
          >
            <Avatar ring={p.newsThisWeek ? t.accent : t.emptyBorder} />
            <View style={{ flex: 1 }}>
              <T variant="label">{p.name}</T>
              <T variant="caption" tone="faint">{p.role}</T>
            </View>
            <Button label="Follow" kind="quiet" style={{ minHeight: 40 }} />
          </Row>
        ))}
      </View>
      <SourceTag source="U.S. Census geocoder, OpenStates" />
    </Screen>
  );
}
