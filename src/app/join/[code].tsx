import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { AccentHeading } from '@/components/AccentHeading';
import { Button, Card, IconButton, Notice, Row, Screen, T } from '@/components/ui';
import { formatCode, joinSquad } from '@/lib/squads';
import { useAuth } from '@/state/AuthProvider';
import { useProfile } from '@/state/ProfileProvider';
import { useSquads } from '@/state/SquadProvider';

/**
 * Opened by an invite link (civicapp://join/CODE). Never joins silently: the
 * person taps Join. If they can't join yet (not set up or signed out), the code
 * is saved and waits for them on the Squad tab.
 */
export default function JoinFromLink() {
  const { code: raw } = useLocalSearchParams<{ code: string }>();
  const code = String(raw ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { setPendingCode, setActive, refresh } = useSquads();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = profile.onboarded && !!user;

  useEffect(() => {
    if (code && !ready) setPendingCode(code);
  }, [code, ready, setPendingCode]);

  const close = () => router.replace(profile.onboarded ? '/squad' : '/onboarding');

  const join = async () => {
    setBusy(true);
    setError(null);
    const res = await joinSquad(code);
    setBusy(false);
    if (!res.ok) return setError(res.message);
    setPendingCode(null);
    setActive(res.data);
    await refresh();
    router.replace('/squad');
  };

  return (
    <Screen style={{ gap: 16 }}>
      <Row style={{ minHeight: 44 }}>
        <IconButton icon="close" label="Close" onPress={close} />
      </Row>
      <T variant="eyebrow" tone="accent">Squad invite</T>
      <AccentHeading accent="squad">Join a squad</AccentHeading>
      <Card>
        <T variant="caption" tone="faint">Invite code</T>
        <T variant="title" style={{ letterSpacing: 2 }}>{code.length >= 8 ? formatCode(code) : 'Not a valid code'}</T>
      </Card>
      {!profile.onboarded ? (
        <>
          <T tone="muted">Set up the app first. Your invite will be waiting on the Squad tab.</T>
          <Button label="Get started" onPress={() => router.replace('/onboarding')} />
        </>
      ) : !user ? (
        <>
          <T tone="muted">Sign in to join. Your invite will be waiting on the Squad tab.</T>
          <Button label="Sign in" onPress={() => router.replace('/sign-in')} />
        </>
      ) : (
        <>
          <T tone="muted">Your squad will see your handle and a yes or no for whether you have a voting plan, only if you choose to share it.</T>
          {error ? <Notice tone="warn"><T variant="caption">{error}</T></Notice> : null}
          <Button label="Join squad" onPress={join} loading={busy} disabled={code.length < 8} />
          <Button label="Not now" kind="quiet" onPress={close} />
        </>
      )}
    </Screen>
  );
}
