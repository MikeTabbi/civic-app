import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';


import { SocialSignIn } from '@/components/SocialSignIn';
import { Button, IconButton, Notice, Row, Screen, StepHeader, T, TextField, TextLink } from '@/components/ui';
import { accountsEnabled, currentUser, sendEmailCode, verifyEmailCode, type SignedInUser } from '@/lib/auth';
import { EMAIL_RE, HANDLE_RE, isEduEmail, useProfile } from '@/state/ProfileProvider';
import { useSignOut } from '@/state/useSignOut';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

const SCHOOLS = ['Delaware State University', 'Other school', 'Not in school'] as const;

/**
 * Who you are: name, handle, email sign-in, school.
 * Onboarding step 1, and the sign-in screen for people who skipped accounts.
 * After sign-in it saves the public profile, so a taken handle is caught here.
 */
export function AccountForm({ mode = 'onboarding', onDone }: { mode?: 'onboarding' | 'signin'; onDone: () => void }) {
  const { t } = useTheme();
  const { profile, update, syncProfile } = useProfile();
  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle);
  const [email, setEmail] = useState(profile.email);
  const [school, setSchool] = useState<(typeof SCHOOLS)[number]>(
    profile.school === 'Delaware State University' ? SCHOOLS[0] : profile.school ? SCHOOLS[1] : SCHOOLS[2],
  );
  const [schoolEmail, setSchoolEmail] = useState(profile.schoolEmail ?? '');
  const [showErrors, setShowErrors] = useState(false);
  const [stage, setStage] = useState<'form' | 'code'>('form');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState<SignedInUser | null>(null);
  const [handleTaken, setHandleTaken] = useState(false);
  const signOutAndClear = useSignOut();

  const onSignedIn = (u: SignedInUser) => {
    setSignedIn(u);
    if (u.email) setEmail(u.email);
    if (u.name) setName((n) => n || u.name!);
  };

  useEffect(() => {
    currentUser().then((u) => u && onSignedIn(u)).catch(() => {});
  }, []);

  const cleanHandle = handle.trim().toLowerCase().replace(/^@/, '');
  const errors = {
    name: name.trim().length < 2 ? 'Add your first name.' : null,
    handle: !HANDLE_RE.test(cleanHandle) ? '3–24 characters: letters, numbers or _' : null,
    email: !EMAIL_RE.test(email.trim()) ? 'Enter a valid email.' : null,
    schoolEmail:
      school !== 'Not in school' && schoolEmail.trim() && !isEduEmail(schoolEmail) ? 'School emails end in .edu' : null,
  };
  const valid = !Object.values(errors).some(Boolean);

  const fields = {
    name: name.trim(),
    handle: cleanHandle,
    email: email.trim().toLowerCase(),
    school: school === 'Not in school' ? null : school === 'Other school' ? 'Other' : school,
    schoolEmail: school !== 'Not in school' && schoolEmail.trim() ? schoolEmail.trim().toLowerCase() : null,
  };

  const save = () => update({ ...fields, schoolVerified: false, createdAt: profile.createdAt || new Date().toISOString() });

  /** Signed in: save the public profile, then move on. A taken handle sends them back to the form. */
  const finish = async () => {
    if (!accountsEnabled) return onDone();
    setBusy(true);
    const res = await syncProfile({ handle: fields.handle, name: fields.name, school: fields.school, isPublic: profile.isPublic });
    setBusy(false);
    if (res.ok) return onDone();
    setStage('form');
    if (res.reason === 'handle_taken') return setHandleTaken(true);
    setServerError('We couldn’t save your profile. Check your connection and try again.');
  };

  const onContinue = async () => {
    setShowErrors(true);
    if (!valid) return;
    save();
    if (!accountsEnabled) return onDone();
    if (signedIn) return finish();
    setBusy(true);
    setServerError(null);
    const res = await sendEmailCode(email.trim().toLowerCase());
    setBusy(false);
    if (!res.ok) return setServerError(res.message);
    setStage('code');
  };

  const onVerify = async () => {
    setBusy(true);
    setServerError(null);
    const res = await verifyEmailCode(email.trim().toLowerCase(), code.trim());
    setBusy(false);
    if (!res.ok) return setServerError('That code didn’t work. Check it and try again.');
    const u = await currentUser();
    if (u) setSignedIn(u);
    setCode('');
    await finish();
  };

  const header =
    mode === 'onboarding' ? (
      <StepHeader step={1} onBack={() => router.back()} />
    ) : (
      <Row style={{ minHeight: 44 }}>
        <IconButton icon="close" label="Close" onPress={() => router.back()} />
      </Row>
    );

  if (stage === 'code') {
    return (
      <Screen style={{ gap: 18 }}>
        {mode === 'onboarding' ? <StepHeader step={1} onBack={() => setStage('form')} /> : (
          <Row style={{ minHeight: 44 }}>
            <IconButton icon="chevron-back" label="Back" onPress={() => setStage('form')} />
          </Row>
        )}
        <T variant="title" style={{ marginTop: 12 }}>Check your email</T>
        <T tone="muted">We sent a code to {email.trim()}.</T>
        <TextField
          label="Code"
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 10))}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          placeholder="123456"
          error={serverError}
          hint="Enter the code from your email."
        />
        <TextLink label="Send a new code" onPress={onContinue} />
        <View style={{ flex: 1 }} />
        <Button label="Verify" onPress={onVerify} loading={busy} disabled={code.length < 6} />
      </Screen>
    );
  }

  return (
    <Screen style={{ gap: 16 }}>
      {header}
      <T variant="title" style={{ marginTop: 8 }}>{mode === 'onboarding' ? 'Make your profile' : 'Sign in for squads'}</T>
      <T tone="muted">
        {mode === 'onboarding'
          ? 'Your name and handle are public. Your email stays private.'
          : 'Squads and leaderboards need an account. Your name and handle are public. Your email stays private.'}
      </T>

      {signedIn ? (
        <Notice tone="good">
          <Row style={{ justifyContent: 'space-between' }}>
            <T variant="label" style={{ flex: 1 }}>Signed in as {signedIn.email ?? 'your account'}</T>
            <TextLink
              label="Switch"
              onPress={async () => {
                if (!(await signOutAndClear())) return;
                setSignedIn(null);
                setName('');
                setHandle('');
                setEmail('');
                setSchoolEmail('');
                setSchool(SCHOOLS[2]);
              }}
            />
          </Row>
          <T variant="caption" tone="muted">Pick a handle to finish your profile.</T>
        </Notice>
      ) : (
        <SocialSignIn onSignedIn={onSignedIn} />
      )}

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
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        editable={!signedIn}
        placeholder="you@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={showErrors ? errors.email : null}
        hint="Personal or school email both work"
      />

      <T variant="label">School</T>
      <View style={{ gap: 8 }}>
        {SCHOOLS.map((s) => {
          const on = s === school;
          return (
            <Pressable
              key={s}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => setSchool(s)}
              style={{
                minHeight: 48,
                paddingHorizontal: 16,
                borderRadius: radius.md,
                justifyContent: 'center',
                backgroundColor: on ? t.accentTint : t.surface,
                borderWidth: on ? 2 : 1,
                borderColor: on ? t.accent : t.line,
              }}
            >
              <T variant="label">{s}</T>
            </Pressable>
          );
        })}
      </View>
      {school !== 'Not in school' ? (
        <TextField
          label="School email (optional)"
          value={schoolEmail}
          onChangeText={setSchoolEmail}
          placeholder="you@school.edu"
          keyboardType="email-address"
          autoCapitalize="none"
          error={showErrors ? errors.schoolEmail : null}
          hint="Unlocks campus squads and leaderboards. Never shown publicly."
        />
      ) : null}

      {serverError ? <Notice tone="warn"><T variant="caption">{serverError}</T></Notice> : null}
      <Button label="Continue" onPress={onContinue} loading={busy} style={{ marginTop: 8 }} />
    </Screen>
  );
}
