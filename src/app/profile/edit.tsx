import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AccentHeading } from '@/components/AccentHeading';
import { SchoolPicker } from '@/components/SchoolPicker';
import { Button, Card, IconButton, Notice, Row, Screen, T, TextField, ToggleRow } from '@/components/ui';
import { useAuth } from '@/state/AuthProvider';
import { HANDLE_RE, schoolChoiceOf, schoolFromChoice, useProfile, type SchoolChoice } from '@/state/ProfileProvider';

const close = () => (router.canGoBack() ? router.back() : router.replace('/me'));

/**
 * Edit the public profile: name, handle, school, public or not.
 * Signed in, it saves to Supabase first, so a taken handle is caught before
 * anything changes on the phone (same message as onboarding).
 */
export default function EditProfile() {
  const { profile, update, syncProfile } = useProfile();
  const signedIn = !!useAuth().user;
  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle);
  const [school, setSchool] = useState<SchoolChoice>(schoolChoiceOf(profile.school));
  const [isPublic, setIsPublic] = useState(profile.isPublic);
  const [showErrors, setShowErrors] = useState(false);
  const [handleTaken, setHandleTaken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const cleanHandle = handle.trim().toLowerCase().replace(/^@/, '');
  const errors = {
    name: name.trim().length < 2 ? 'Add your first name.' : null,
    handle: !HANDLE_RE.test(cleanHandle) ? '3–24 characters: letters, numbers or _' : null,
  };
  const valid = !errors.name && !errors.handle;

  const save = async () => {
    setShowErrors(true);
    setServerError(null);
    if (!valid) return;
    const fields = { name: name.trim(), handle: cleanHandle, school: schoolFromChoice(school), isPublic };
    if (signedIn) {
      setBusy(true);
      const res = await syncProfile(fields);
      setBusy(false);
      if (!res.ok && res.reason === 'handle_taken') return setHandleTaken(true);
      if (!res.ok && res.reason !== 'signed_out') {
        return setServerError('We couldn’t save your profile. Check your connection and try again.');
      }
    }
    update({ ...fields, schoolEmail: fields.school ? profile.schoolEmail : null });
    close();
  };

  return (
    <Screen style={{ gap: 16 }}>
      <Row style={{ minHeight: 44 }}>
        <IconButton icon="close" label="Close" onPress={close} />
      </Row>
      <AccentHeading accent="profile">Edit profile</AccentHeading>
      <T tone="muted">Your name, handle and school are your public profile. Your email, address and voting plan are never part of it.</T>

      <TextField label="First name" value={name} onChangeText={setName} placeholder="Jordan" autoComplete="given-name" error={showErrors ? errors.name : null} />
      <TextField
        label="Handle"
        value={handle}
        onChangeText={(v) => {
          setHandle(v);
          setHandleTaken(false);
        }}
        placeholder="jordan_votes"
        autoCapitalize="none"
        autoCorrect={false}
        error={handleTaken ? 'That handle is taken. Try another one.' : showErrors ? errors.handle : null}
        hint={cleanHandle ? `@${cleanHandle}` : 'This is how friends find you'}
      />

      <T variant="label">School</T>
      <SchoolPicker value={school} onChange={setSchool} />

      <Card>
        <ToggleRow
          title="Public profile"
          subtitle="On: people signed in to the app can see your name and school. Off: squads and leaderboards show only your handle."
          value={isPublic}
          onValueChange={setIsPublic}
        />
      </Card>

      {!signedIn ? (
        <Notice>
          <T variant="caption" tone="muted">You're not signed in, so this saves on this phone only.</T>
        </Notice>
      ) : null}
      {serverError ? <Notice tone="warn"><T variant="caption">{serverError}</T></Notice> : null}

      <View style={{ flex: 1, minHeight: 8 }} />
      <Button label="Save" onPress={save} loading={busy} />
    </Screen>
  );
}
