import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AccentHeading } from '@/components/AccentHeading';
import { FollowButton } from '@/components/FollowButton';
import { LevelGroup, type CivicLevel } from '@/components/LevelGroup';
import { PressableScale } from '@/components/PressableScale';
import { Avatar, Button, Card, Notice, Row, Screen, SourceTag, T, initialsOf } from '@/components/ui';
import { officialsForDistricts, onBallot, type Official, type OfficialLevel } from '@/data/officials';
import { useFollows } from '@/state/FollowProvider';
import { useProfile } from '@/state/ProfileProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

type Filter = 'all' | CivicLevel;
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'federal', label: 'Federal' },
  { value: 'state', label: 'State' },
  { value: 'local', label: 'Local' },
];
const levelKey = (level: OfficialLevel): CivicLevel => (level === 'county' || level === 'city' ? 'local' : level);

export default function PowerMap() {
  const { t } = useTheme();
  const { profile } = useProfile();
  const { following } = useFollows();
  const [filter, setFilter] = useState<Filter>('all');
  const [followingOnly, setFollowingOnly] = useState(false);
  const map = officialsForDistricts(profile.districts);
  const outOfState = !!profile.districts && profile.districts.state !== 'DE';
  const followCount = map.officials.filter((official) => following[official.id]).length;
  const shown = map.officials.filter((official) => (filter === 'all' || levelKey(official.level) === filter) && (!followingOnly || following[official.id]));
  const openAddress = () => router.push({ pathname: '/address', params: { mode: 'edit' } });

  return (
    <Screen>
      <View style={{ gap: 3 }}>
        <T variant="eyebrow" tone="accent">Power map</T>
        <AccentHeading accent="decides">Who decides</AccentHeading>
        <T tone="muted">Who decides what, from your dorm outward</T>
      </View>

      <Row gap={8} style={{ flexWrap: 'wrap' }}>
        {FILTERS.map((item) => (
          <FilterChip key={item.value} label={item.label} value={item.value} selected={filter === item.value} onPress={() => setFilter(item.value)} />
        ))}
      </Row>
      <PressableScale
        accessibilityRole="button"
        accessibilityState={{ selected: followingOnly }}
        onPress={() => setFollowingOnly((value) => !value)}
        style={{ alignSelf: 'flex-start', minHeight: 44, borderRadius: radius.pill, justifyContent: 'center', paddingHorizontal: 14, backgroundColor: followingOnly ? t.primary.bg : t.sub }}
      >
        <T variant="label" style={{ color: followingOnly ? t.primary.fg : t.muted }}>Following · {followCount}</T>
      </PressableScale>

      {!map.known ? (
        <Card tone="tint">
          <T variant="heading">{outOfState ? 'Your address is outside Delaware' : 'Add your address to see all your officials'}</T>
          <T tone="muted">
            {outOfState
              ? "We only have Delaware's officials so far, so you're seeing Delaware's federal and statewide officials."
              : "You're seeing federal and statewide officials. Your address adds your state senator, state rep, county and city officials. It stays private."}
          </T>
          <Button label={outOfState ? 'Change address' : 'Add address'} icon="location" onPress={openAddress} />
        </Card>
      ) : null}

      <T variant="heading">{shown.length} {shown.length === 1 ? 'official' : 'officials'}</T>
      {followingOnly && !shown.length ? (
        <Notice>
          <T variant="caption" tone="muted">
            {followCount ? "You don't follow anyone at this level yet." : "You're not following anyone yet. Tap Follow on an official to keep up with them."}
          </T>
        </Notice>
      ) : null}

      {(['federal', 'state', 'local'] as CivicLevel[]).filter((level) => filter === 'all' || filter === level).map((level) => {
        const people = shown.filter((official) => levelKey(official.level) === level);
        const notes: string[] = [];
        if (!followingOnly && level === 'local' && map.countyDistrictUnknown) {
          const body = profile.districts?.county === 'Kent' ? 'Levy Court' : 'County Council';
          notes.push(`We don't know your ${body} district yet, so every district seat in your county is listed.`);
        }
        if (!followingOnly && level === 'local' && map.known && (map.cityMissing || !profile.districts?.place)) {
          notes.push(profile.districts?.place ? "We don't have your city's officials yet." : 'Your address is outside a city or town, so you have no city officials.');
        }
        if (!people.length && !notes.length) return null;
        const sources = [...new Set(people.map((official) => official.source))];
        return (
          <View key={level} style={{ gap: 8 }}>
            {people.length ? (
              <LevelGroup level={level} count={people.length}>
                {people.map((official) => <OfficialRow key={official.id} official={official} ballot={onBallot(official, map.ballotRaceIds)} />)}
              </LevelGroup>
            ) : null}
            {notes.map((note) => <Notice key={note}><T variant="caption" tone="muted">{note}</T></Notice>)}
            {sources.length ? <SourceTag source={sources.join(', ')} /> : null}
          </View>
        );
      })}
    </Screen>
  );
}

function FilterChip({ label, value, selected, onPress }: { label: string; value: Filter; selected: boolean; onPress: () => void }) {
  const { t } = useTheme();
  const palette = value === 'all' ? null : t.level[value];
  const backgroundColor = selected && value === 'all' ? t.primary.bg : palette?.tint ?? t.sub;
  const color = selected && value === 'all' ? t.primary.fg : palette?.ink ?? t.muted;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} officials filter`}
      onPress={onPress}
      style={{ minHeight: 44, justifyContent: 'center', borderRadius: radius.pill, paddingHorizontal: 16, backgroundColor, borderWidth: selected ? 2 : 0, borderColor: color }}
    >
      <T variant="label" style={{ color }}>{label}</T>
    </PressableScale>
  );
}

function OfficialRow({ official, ballot }: { official: Official; ballot: boolean }) {
  const { t } = useTheme();
  return (
    <Row gap={8} style={{ minHeight: 68, paddingVertical: 9 }}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${official.name}, ${official.office}${ballot ? ', on your 2026 ballot' : ''}. Open details.`}
        onPress={() => router.push({ pathname: '/official/[id]', params: { id: official.id } })}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}
      >
        <Avatar ring={ballot ? t.lime : undefined} initials={initialsOf(official.name)} />
        <View style={{ flex: 1 }}>
          <T variant="label">{official.name}</T>
          <T variant="caption" tone="faint">{official.office}</T>
          {official.title ? <T variant="caption" tone="faint">{official.title}</T> : null}
        </View>
      </PressableScale>
      <FollowButton id={official.id} name={official.name} style={{ minHeight: 44, paddingHorizontal: 12 }} />
    </Row>
  );
}
