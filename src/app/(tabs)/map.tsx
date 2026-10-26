import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { FollowButton } from '@/components/FollowButton';
import { Avatar, Button, Card, Chip, Notice, Row, Screen, SourceTag, T, initialsOf } from '@/components/ui';
import { officialLevelLabel, officialsForDistricts, onBallot, type Official, type OfficialLevel } from '@/data/officials';
import { useFollows } from '@/state/FollowProvider';
import { useProfile } from '@/state/ProfileProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

const LEVELS: OfficialLevel[] = ['federal', 'state', 'county', 'city'];

/** Power Map: concentric rings from "You" outward; tap a ring to see who holds power there. */
export default function PowerMap() {
  const { t } = useTheme();
  const { profile } = useProfile();
  const { following } = useFollows();
  const [level, setLevel] = useState<OfficialLevel | null>(null);
  const [followingOnly, setFollowingOnly] = useState(false);

  const map = officialsForDistricts(profile.districts);
  const outOfState = !!profile.districts && profile.districts.state !== 'DE';
  const followCount = map.officials.filter((o) => following[o.id]).length;
  const shown = map.officials.filter((o) => (!level || o.level === level) && (!followingOnly || following[o.id]));
  const openAddress = () => router.push({ pathname: '/address', params: { mode: 'edit' } });

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
              accessibilityLabel={`${officialLevelLabel[l]} level. ${on ? 'Showing. Tap to show all levels.' : 'Tap to filter.'}`}
              accessibilityState={{ selected: on }}
              onPress={() => setLevel(on ? null : l)}
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
              <T variant="eyebrow" tone={on ? 'accent' : 'faint'} style={{ marginTop: 10 }}>{officialLevelLabel[l]}</T>
            </Pressable>
          );
        })}
        <View pointerEvents="none" style={{ position: 'absolute', top: 8 + 140 - 12, alignItems: 'center' }}>
          <Avatar size={36} ring={t.text} label="You" />
          <T variant="caption">You</T>
        </View>
      </View>
      <Row gap={6}>
        <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: t.accent, backgroundColor: t.avatar }} />
        <T variant="caption" tone="faint">Orange ring = on your 2026 ballot</T>
      </Row>

      <Row gap={8} style={{ flexWrap: 'wrap' }}>
        <Chip
          label="All"
          active={!level && !followingOnly}
          onPress={() => {
            setLevel(null);
            setFollowingOnly(false);
          }}
        />
        <Chip label={`Following · ${followCount}`} active={followingOnly} onPress={() => setFollowingOnly((v) => !v)} />
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

      <T variant="heading">
        {level ? officialLevelLabel[level] : 'Everyone'} · {shown.length} {shown.length === 1 ? 'person' : 'people'}
      </T>

      {followingOnly && !shown.length ? (
        <Notice>
          <T variant="caption" tone="muted">
            {followCount ? "You don't follow anyone at this level yet." : "You're not following anyone yet. Tap Follow on an official to keep up with them."}
          </T>
        </Notice>
      ) : null}

      {LEVELS.filter((l) => !level || l === level).map((l) => {
        const people = shown.filter((o) => o.level === l);
        const notes: string[] = [];
        if (!followingOnly && l === 'county' && map.countyDistrictUnknown) {
          const body = profile.districts?.county === 'Kent' ? 'Levy Court' : 'County Council';
          notes.push(`We don't know your ${body} district yet, so every district seat in your county is listed.`);
        }
        if (!followingOnly && l === 'city' && map.known && (map.cityMissing || !profile.districts?.place)) {
          notes.push(profile.districts?.place ? "We don't have your city's officials yet." : 'Your address is outside a city or town, so you have no city officials.');
        }
        if (!people.length && !notes.length) return null;
        const sources = [...new Set(people.map((o) => o.source))];
        return (
          <View key={l} style={{ gap: 8 }}>
            {!level ? <T variant="eyebrow" tone="faint" style={{ marginTop: 6 }}>{officialLevelLabel[l]}</T> : null}
            {people.map((o) => (
              <OfficialRow key={o.id} official={o} ballot={onBallot(o, map.ballotRaceIds)} />
            ))}
            {notes.map((n) => (
              <Notice key={n}>
                <T variant="caption" tone="muted">{n}</T>
              </Notice>
            ))}
            {sources.length ? <SourceTag source={sources.join(', ')} /> : null}
          </View>
        );
      })}
    </Screen>
  );
}

function OfficialRow({ official: o, ballot }: { official: Official; ballot: boolean }) {
  const { t } = useTheme();
  // The row and Follow are siblings, not nested: a button inside a button is invalid on web.
  return (
    <Row gap={8} style={{ padding: 12, borderRadius: radius.md, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${o.name}, ${o.office}${ballot ? ', on your 2026 ballot' : ''}. Open details.`}
        onPress={() => router.push({ pathname: '/official/[id]', params: { id: o.id } })}
        style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, opacity: pressed ? 0.7 : 1 })}
      >
        <Avatar ring={ballot ? t.accent : t.emptyBorder} initials={initialsOf(o.name)} />
        <View style={{ flex: 1 }}>
          <T variant="label">{o.name}</T>
          <T variant="caption" tone="faint">{o.office}</T>
          {o.title ? <T variant="caption" tone="faint">{o.title}</T> : null}
        </View>
      </Pressable>
      <FollowButton id={o.id} name={o.name} style={{ minHeight: 40, paddingHorizontal: 12 }} />
    </Row>
  );
}
