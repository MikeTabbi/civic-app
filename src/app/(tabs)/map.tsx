import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AccentHeading } from '@/components/AccentHeading';
import { FollowButton } from '@/components/FollowButton';
import { LevelGroup, type CivicLevel } from '@/components/LevelGroup';
import { useReducedMotion } from '@/components/motion';
import { PressableScale } from '@/components/PressableScale';
import { Avatar, Button, Card, Notice, Row, Screen, SourceTag, T, initialsOf } from '@/components/ui';
import { officialLevelLabel, officialsForDistricts, onBallot, type Official, type OfficialLevel } from '@/data/officials';
import { useFollows } from '@/state/FollowProvider';
import { useProfile } from '@/state/ProfileProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

type LevelFilter = OfficialLevel | 'local' | null;
type ChipFilter = 'all' | CivicLevel;
const FILTERS: { value: ChipFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'federal', label: 'Federal' },
  { value: 'state', label: 'State' },
  { value: 'local', label: 'Local' },
];
const RING_LEVELS: OfficialLevel[] = ['federal', 'state', 'county', 'city'];
const RING_SIZE = 280;
const RING_STEP = 62;
const RING_TIMING = 160;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const levelKey = (level: OfficialLevel): CivicLevel => (level === 'county' || level === 'city' ? 'local' : level);
const isLocalLevel = (level: LevelFilter) => level === 'local' || level === 'county' || level === 'city';

function withAlpha(color: string, alpha: number) {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return color;
  const value = Number.parseInt(hex, 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

export default function PowerMap() {
  const { t } = useTheme();
  const { profile } = useProfile();
  const { following } = useFollows();
  const [level, setLevel] = useState<LevelFilter>(null);
  const [followingOnly, setFollowingOnly] = useState(false);
  const map = officialsForDistricts(profile.districts);
  const outOfState = !!profile.districts && profile.districts.state !== 'DE';
  const followCount = map.officials.filter((official) => following[official.id]).length;
  const shown = map.officials.filter((official) => {
    const matchesLevel = !level || (level === 'local' ? levelKey(official.level) === 'local' : official.level === level);
    return matchesLevel && (!followingOnly || following[official.id]);
  });
  const openAddress = () => router.push({ pathname: '/address', params: { mode: 'edit' } });

  return (
    <Screen>
      <View style={{ gap: 3 }}>
        <T variant="eyebrow" tone="accent">Power map</T>
        <AccentHeading accent="decides">Who decides</AccentHeading>
        <T tone="muted">Who decides what, from your dorm outward</T>
      </View>

      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        {RING_LEVELS.map((ringLevel, index) => {
          const size = RING_SIZE - index * RING_STEP;
          const selected = level === ringLevel || (level === 'local' && levelKey(ringLevel) === 'local');
          const palette = ringLevel === 'federal' ? t.level.federal : ringLevel === 'state' ? t.level.state : t.level.local;
          const fill = ringLevel === 'city' ? t.surface : palette.tint;
          const baseBorder = withAlpha(palette.ink, ringLevel === 'city' ? 0.4 : 0.2);
          return (
            <PowerRing
              key={ringLevel}
              level={ringLevel}
              selected={selected}
              dimmed={level !== null && !selected}
              size={size}
              top={index === 0 ? 0 : 8 + (index * RING_STEP) / 2}
              relative={index === 0}
              fill={fill}
              ink={palette.ink}
              baseBorder={baseBorder}
              selectedBorder={t.scheme === 'dark' ? t.lime : t.primary.bg}
              onPress={() => setLevel(selected ? null : ringLevel)}
            />
          );
        })}
        <View pointerEvents="none" style={{ position: 'absolute', top: 8 + RING_SIZE / 2 - 18, alignItems: 'center', gap: 3 }}>
          <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 3, borderColor: t.lime, backgroundColor: t.primary.bg, alignItems: 'center', justifyContent: 'center' }}>
            <T variant="label" style={{ color: t.primary.fg }}>Y</T>
          </View>
          <T variant="caption">You</T>
        </View>
      </View>

      <Row gap={6}>
        <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: t.lime, backgroundColor: t.surface }} />
        <T variant="caption" tone="faint">Green ring = on your 2026 ballot</T>
      </Row>

      <Row gap={8} style={{ flexWrap: 'wrap' }}>
        {FILTERS.map((item) => (
          <FilterChip
            key={item.value}
            label={item.label}
            value={item.value}
            selected={item.value === 'all' ? level === null : item.value === 'local' ? isLocalLevel(level) : level === item.value}
            onPress={() => setLevel(item.value === 'all' ? null : item.value)}
          />
        ))}
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Following officials filter. ${followingOnly ? 'Showing. Tap to show everyone.' : 'Tap to filter.'}`}
          accessibilityState={{ selected: followingOnly }}
          onPress={() => setFollowingOnly((value) => !value)}
          style={{ minHeight: 44, borderRadius: radius.pill, justifyContent: 'center', paddingHorizontal: 14, backgroundColor: followingOnly ? t.primary.bg : t.sub }}
        >
          <T variant="label" style={{ color: followingOnly ? t.primary.fg : t.muted }}>Following · {followCount}</T>
        </PressableScale>
      </Row>

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

      {(['federal', 'state', 'local'] as CivicLevel[]).filter((groupLevel) => !level || levelKey(level === 'local' ? 'city' : level) === groupLevel).map((groupLevel) => {
        const people = shown.filter((official) => levelKey(official.level) === groupLevel);
        const notes: string[] = [];
        if (!followingOnly && groupLevel === 'local' && level !== 'city' && map.countyDistrictUnknown) {
          const body = profile.districts?.county === 'Kent' ? 'Levy Court' : 'County Council';
          notes.push(`We don't know your ${body} district yet, so every district seat in your county is listed.`);
        }
        if (!followingOnly && groupLevel === 'local' && level !== 'county' && map.known && (map.cityMissing || !profile.districts?.place)) {
          notes.push(profile.districts?.place ? "We don't have your city's officials yet." : 'Your address is outside a city or town, so you have no city officials.');
        }
        if (!people.length && !notes.length) return null;
        const sources = [...new Set(people.map((official) => official.source))];
        return (
          <View key={groupLevel} style={{ gap: 8 }}>
            {people.length ? (
              <LevelGroup level={groupLevel} count={people.length}>
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

function PowerRing({ level, selected, dimmed, size, top, relative, fill, ink, baseBorder, selectedBorder, onPress }: {
  level: OfficialLevel;
  selected: boolean;
  dimmed: boolean;
  size: number;
  top: number;
  relative: boolean;
  fill: string;
  ink: string;
  baseBorder: string;
  selectedBorder: string;
  onPress: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const selection = useSharedValue(selected ? 1 : 0);
  const opacity = useSharedValue(dimmed ? 0.45 : 1);

  useEffect(() => {
    const nextSelection = selected ? 1 : 0;
    const nextOpacity = dimmed ? 0.45 : 1;
    selection.value = reduceMotion ? nextSelection : withTiming(nextSelection, { duration: RING_TIMING });
    opacity.value = withTiming(nextOpacity, { duration: RING_TIMING });
  }, [dimmed, opacity, reduceMotion, selected, selection]);

  const animatedStyle = useAnimatedStyle(() => ({
    borderWidth: 1.5 + selection.value * 1.5,
    borderColor: interpolateColor(selection.value, [0, 1], [baseBorder, selectedBorder]),
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${officialLevelLabel[level]} level. ${selected ? 'Showing. Tap to show all levels.' : 'Tap to filter.'}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        {
          position: relative ? 'relative' : 'absolute',
          top,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: fill,
          alignItems: 'center',
        },
        animatedStyle,
      ]}
    >
      <T style={{ marginTop: 10, color: ink, fontSize: 11, fontWeight: '700', letterSpacing: 1.32, textTransform: 'uppercase' }}>
        {officialLevelLabel[level]}
      </T>
    </AnimatedPressable>
  );
}

function FilterChip({ label, value, selected, onPress }: { label: string; value: ChipFilter; selected: boolean; onPress: () => void }) {
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
