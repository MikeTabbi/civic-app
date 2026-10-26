import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { Button, Card, Notice, Row, Screen, SourceTag, StepHeader, T, TextField, TextLink } from '@/components/ui';
import { DSU_ADDRESS, VOTE_GOV_URL } from '@/data/delaware';
import { districtLines, lookupDistricts, type Districts } from '@/lib/geocode';
import { useProfile, type VotingLocation } from '@/state/ProfileProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

const CHOICES: { id: VotingLocation; title: string; sub: string; icon: 'school' | 'home' }[] = [
  { id: 'campus', title: 'Campus', sub: 'Dover, DE', icon: 'school' },
  { id: 'home', title: 'Home', sub: 'Any state', icon: 'home' },
];

type Status = 'idle' | 'loading' | 'found' | 'not_found' | 'network';

/** Step 2 of 3: where you vote. Address is private and only used to find districts. */
export default function Location() {
  const { t } = useTheme();
  const { profile, update } = useProfile();
  const [choice, setChoice] = useState<VotingLocation>(profile.votingLocation ?? 'campus');
  const [address, setAddress] = useState(profile.address ?? '');
  const [districts, setDistricts] = useState<Districts | null>(profile.districts);
  const [status, setStatus] = useState<Status>(profile.districts ? 'found' : 'idle');
  const abort = useRef<AbortController | null>(null);

  // The quiz writes its recommendation to the profile; reflect it here.
  useEffect(() => {
    if (profile.votingLocation) setChoice(profile.votingLocation);
  }, [profile.votingLocation]);

  const onAddressChange = (v: string) => {
    setAddress(v);
    if (status !== 'idle') {
      setStatus('idle');
      setDistricts(null);
    }
  };

  const find = async (value = address) => {
    if (value.trim().length < 6) return;
    abort.current?.abort();
    abort.current = new AbortController();
    setStatus('loading');
    const res = await lookupDistricts(value.trim(), abort.current.signal);
    if (res.ok) {
      setDistricts(res.districts);
      setStatus('found');
    } else {
      setDistricts(null);
      setStatus(res.reason);
    }
  };

  const useCampus = () => {
    setAddress(DSU_ADDRESS);
    find(DSU_ADDRESS);
  };

  const outOfState = status === 'found' && districts?.state !== 'DE';

  const next = (skip = false) => {
    update({
      votingLocation: choice,
      address: skip ? null : address.trim() || null,
      districts: skip ? null : districts,
    });
    router.push('/onboarding/reminders');
  };

  return (
    <Screen style={{ gap: 16 }}>
      <StepHeader step={2} onBack={() => router.back()} />
      <T variant="display" style={{ marginTop: 8 }}>
        Where do you <T variant="display" tone="accent">vote</T>?
      </T>
      <T tone="muted">Campus or back home. Your ballot, reps and deadlines follow this choice.</T>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        {CHOICES.map((c) => {
          const on = c.id === choice;
          return (
            <Pressable
              key={c.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${c.title}, ${c.sub}`}
              onPress={() => setChoice(c.id)}
              style={{
                flex: 1,
                minHeight: 112,
                borderRadius: radius.lg,
                padding: 16,
                justifyContent: 'space-between',
                backgroundColor: on ? t.accent : t.surface,
                borderWidth: 1,
                borderColor: on ? t.accent : t.line,
              }}
            >
              <Ionicons name={c.icon} size={24} color={on ? t.onAccent : t.text} />
              <View>
                <T variant="heading" style={{ color: on ? t.onAccent : t.text }}>{c.title}</T>
                <T variant="caption" style={{ color: on ? t.onAccent : t.faint }}>{c.sub}</T>
              </View>
            </Pressable>
          );
        })}
      </View>
      <TextLink label="Not sure? Take the 30-second quiz" onPress={() => router.push('/onboarding/quiz')} />

      <TextField
        label={choice === 'campus' ? 'Dorm or campus address' : 'Home address'}
        value={address}
        onChangeText={onAddressChange}
        placeholder="Street, city, state, ZIP"
        autoComplete="street-address"
        returnKeyType="search"
        onSubmitEditing={() => find()}
        hint="Private. Only used to find your districts, never shown on your profile."
      />
      {choice === 'campus' && profile.school === 'Delaware State University' && address !== DSU_ADDRESS ? (
        <Pressable
          accessibilityRole="button"
          onPress={useCampus}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 12, minHeight: 36, borderRadius: radius.pill, backgroundColor: t.sub }}
        >
          <Ionicons name="location" size={14} color={t.text} />
          <T variant="caption">Use DSU main campus</T>
        </Pressable>
      ) : null}

      {status !== 'found' ? (
        <Button label="Find my districts" kind="dark" icon="search" onPress={() => find()} loading={status === 'loading'} disabled={address.trim().length < 6} />
      ) : null}

      {status === 'not_found' ? (
        <Notice tone="warn">
          <T variant="label">We couldn't match that address.</T>
          <T variant="caption" tone="muted">Add the city, state and ZIP, like "1200 N DuPont Hwy, Dover, DE 19901".</T>
        </Notice>
      ) : null}
      {status === 'network' ? (
        <Notice tone="warn">
          <T variant="label">The address lookup didn't respond.</T>
          <T variant="caption" tone="muted">Check your connection and try again, or skip for now and add it later in Me.</T>
        </Notice>
      ) : null}

      {status === 'found' && districts ? (
        <Card tone={outOfState ? 'sub' : 'tint'}>
          <Row gap={8}>
            <Ionicons name={outOfState ? 'alert-circle' : 'checkmark-circle'} size={20} color={outOfState ? t.accentText : t.done} />
            <T variant="heading">{outOfState ? 'Outside Delaware' : 'Your districts'}</T>
          </Row>
          <T variant="caption" tone="faint">{districts.matchedAddress}</T>
          {outOfState ? (
            <>
              <T tone="muted">
                We're starting in Delaware, so your ballot for {districts.state ?? 'that state'} isn't in the app yet. You can still follow Delaware news and squads.
              </T>
              <TextLink label="Find your state's voting info at vote.gov" onPress={() => Linking.openURL(VOTE_GOV_URL)} />
            </>
          ) : (
            districtLines(districts).map((l) => (
              <Row key={l.label} style={{ justifyContent: 'space-between' }}>
                <T variant="label" tone="muted">{l.label}</T>
                <T variant="label">{l.value}</T>
              </Row>
            ))
          )}
          <SourceTag source="U.S. Census Geocoder" />
        </Card>
      ) : null}

      <View style={{ flex: 1, minHeight: 8 }} />
      <Button label={status === 'found' ? 'Show me my ballot' : 'Continue'} onPress={() => next()} disabled={status !== 'found'} />
      <Pressable accessibilityRole="button" onPress={() => next(true)} style={{ alignItems: 'center', minHeight: 44, justifyContent: 'center' }}>
        <T variant="label" tone="faint">Skip for now</T>
      </Pressable>
    </Screen>
  );
}
