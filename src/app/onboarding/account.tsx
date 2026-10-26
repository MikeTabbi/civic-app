import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Notice, Screen, StepHeader, T, TextField, TextLink } from '@/components/ui';
import { accountsEnabled, sendEmailCode, verifyEmailCode } from '@/lib/auth';
import { EMAIL_RE, HANDLE_RE, isEduEmail, useProfile } from '@/state/ProfileProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

const SCHOOLS = ['Delaware State University', 'Other school', 'Not in school'] as const;

/** Step 1 of 3: who you are. */
export default function Account() {
  const { t } = useTheme();
  const { profile, update } = useProfile();
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

  const cleanHandle = handle.trim().toLowerCase().replace(/^@/, '');
  const errors = {
    name: name.trim().length < 2 ? 'Add your first name.' : null,
    handle: !HANDLE_RE.test(cleanHandle) ? '3–24 characters: letters, numbers or _' : null,
    email: !EMAIL_RE.test(email.trim()) ? 'Enter a valid email.' : null,
    schoolEmail:
      school !== 'Not in school' && schoolEmail.trim() && !isEduEmail(schoolEmail) ? 'School emails end in .edu' : null,
  };
  const valid = !Object.values(errors).some(Boolean);

  const save = () =>
    update({
      name: name.trim(),
      handle: cleanHandle,
      email: email.trim().toLowerCase(),
      school: school === 'Not in school' ? null : school === 'Other school' ? 'Other' : school,
      schoolEmail: school !== 'Not in school' && schoolEmail.trim() ? schoolEmail.trim().toLowerCase() : null,
      schoolVerified: false,
      createdAt: profile.createdAt || new Date().toISOString(),
    });

  const onContinue = async () => {
    setShowErrors(true);
    if (!valid) return;
    save();
    if (!accountsEnabled) return router.push('/onboarding/location');
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
    router.push('/onboarding/location');
  };

  if (stage === 'code') {
    return (
      <Screen style={{ gap: 18 }}>
        <StepHeader step={1} onBack={() => setStage('form')} />
        <T variant="title" style={{ marginTop: 12 }}>Check your email</T>
        <T tone="muted">We sent a 6-digit code to {email.trim()}.</T>
        <TextField
          label="Code"
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          placeholder="123456"
          error={serverError}
        />
        <TextLink label="Send a new code" onPress={onContinue} />
        <View style={{ flex: 1 }} />
        <Button label="Verify" onPress={onVerify} loading={busy} disabled={code.length !== 6} />
      </Screen>
    );
  }

  return (
    <Screen style={{ gap: 16 }}>
      <StepHeader step={1} onBack={() => router.back()} />
      <T variant="title" style={{ marginTop: 8 }}>Make your profile</T>
      <T tone="muted">Your name and handle are public. Your email stays private.</T>

      <TextField label="First name" value={name} onChangeText={setName} placeholder="Jordan" autoComplete="given-name" error={showErrors ? errors.name : null} />
      <TextField
        label="Handle"
        value={handle}
        onChangeText={setHandle}
        placeholder="jordan_votes"
        autoCapitalize="none"
        autoCorrect={false}
        error={showErrors ? errors.handle : null}
        hint={cleanHandle ? `@${cleanHandle}` : 'This is how friends find you'}
      />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
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
