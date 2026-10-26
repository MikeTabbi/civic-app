import { router, useLocalSearchParams, useSegments } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { FollowButton } from '@/components/FollowButton';
import { Avatar, Button, Card, IconButton, Notice, Row, Screen, SourceTag, T, TextLink, initialsOf, type IconName } from '@/components/ui';
import { getRace } from '@/data/ballot2026';
import { generalElection2026 as E, parseLocalDate } from '@/data/delaware';
import { getOfficial, officialLevelLabel, officialsForDistricts, onBallot } from '@/data/officials';
import { useProfile } from '@/state/ProfileProvider';
import { useTheme } from '@/theme/ThemeProvider';

const electionDay = parseLocalDate(E.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/** Official detail: who they are, what they decide, how to reach them, and whether they're on the ballot. */
export default function OfficialDetail() {
  const { t } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useProfile();
  const inDrop = useSegments()[0] === 'drop';
  const official = getOfficial(String(id));
  const [openError, setOpenError] = useState<string | null>(null);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/map'));

  if (!official) {
    return (
      <Screen>
        <Row style={{ minHeight: 44 }}>
          <IconButton icon="chevron-back" label="Back" onPress={back} />
        </Row>
        <T variant="title">Official not found</T>
        <T tone="muted">We don't have this official in the app.</T>
      </Screen>
    );
  }

  const o = official;
  const race = o.raceId ? getRace(o.raceId) : null;
  const yours = onBallot(o, officialsForDistricts(profile.districts).ballotRaceIds);
  const party = o.party ?? (o.level === 'city' ? 'Non-partisan office' : null);

  const open = (url: string, what: string) => {
    setOpenError(null);
    Linking.openURL(url).catch(() => setOpenError(`Couldn't open ${what} on this device.`));
  };
  const contacts: { key: string; label: string; icon: IconName; url: string; what: string; detail: string }[] = [];
  if (o.contact.phone) contacts.push({ key: 'call', label: 'Call', icon: 'call', url: `tel:${o.contact.phone.replace(/[^\d+]/g, '')}`, what: 'your phone app', detail: o.contact.phone });
  if (o.contact.email) contacts.push({ key: 'email', label: 'Email', icon: 'mail', url: `mailto:${o.contact.email}`, what: 'your email app', detail: o.contact.email });
  if (o.contact.website) contacts.push({ key: 'web', label: 'Website', icon: 'globe-outline', url: o.contact.website, what: 'the website', detail: o.contact.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') });

  const facts = [
    { label: 'Office', value: o.office },
    o.title ? { label: 'Role', value: o.title } : null,
    o.district ? { label: 'District', value: o.district } : null,
    party ? { label: 'Party', value: party } : null,
    { label: 'Term ends', value: o.termEnds ?? 'Not listed by the official source' },
  ].filter((f): f is { label: string; value: string } => !!f);

  return (
    <Screen>
      <Row style={{ minHeight: 44 }}>
        <IconButton icon="chevron-back" label="Back" onPress={back} />
      </Row>

      <Row gap={14} style={{ alignItems: 'center' }}>
        <Avatar size={64} ring={yours ? t.accent : t.emptyBorder} initials={initialsOf(o.name)} />
        <View style={{ flex: 1, gap: 2 }}>
          <T variant="eyebrow" tone="accent">{officialLevelLabel[o.level]}</T>
          <T variant="title">{o.name}</T>
        </View>
      </Row>
      <FollowButton id={o.id} name={o.name} />

      <Card>
        {facts.map((f) => (
          <Row key={f.label} style={{ justifyContent: 'space-between', alignItems: 'flex-start' }} gap={12}>
            <T variant="label" tone="faint">{f.label}</T>
            <T variant="label" style={{ flex: 1, textAlign: 'right' }}>{f.value}</T>
          </Row>
        ))}
        <SourceTag source={o.source} />
      </Card>

      <Card tone="sub">
        <T variant="label">What they decide</T>
        <T tone="muted">{o.whatTheyDecide}</T>
      </Card>

      {race ? (
        <Card tone={yours ? 'tint' : 'sub'}>
          <T variant="heading">{yours ? `On your ballot ${electionDay}` : `Running ${electionDay}`}</T>
          <T tone="muted">
            {yours
              ? `${o.name} is a candidate for ${race.office}.`
              : `${o.name} is a candidate for ${race.office}. That race isn't on your ballot.`}
          </T>
          <Button
            label="See the race"
            kind={yours ? 'primary' : 'quiet'}
            icon="list"
            onPress={() =>
              // Opened from a Drop: stay inside the Drop's stack so the race shows on top of the modal.
              inDrop
                ? router.push({ pathname: '/drop/race/[id]', params: { id: race.id } })
                : router.push({ pathname: '/race/[id]', params: { id: race.id } })
            }
          />
          <SourceTag source={race.source} />
        </Card>
      ) : null}

      {contacts.length ? (
        <View style={{ gap: 8 }}>
          <T variant="heading" style={{ marginTop: 4 }}>Contact</T>
          {contacts.map((c) => (
            <View key={c.key} style={{ gap: 4 }}>
              <Button label={c.label} kind="quiet" icon={c.icon} accessibilityLabel={`${c.label} ${o.name}: ${c.detail}`} onPress={() => open(c.url, c.what)} />
              <T variant="caption" tone="faint" style={{ textAlign: 'center' }}>{c.detail}</T>
            </View>
          ))}
          {openError ? (
            <Notice tone="warn">
              <T variant="caption" tone="muted">{openError}</T>
            </Notice>
          ) : null}
          {o.contact.office ? <T variant="caption" tone="muted">Office: {o.contact.office}</T> : null}
          <SourceTag source={o.source} />
        </View>
      ) : null}

      <TextLink label="Official source page" onPress={() => open(o.sourceUrl, 'the source page')} />
    </Screen>
  );
}
