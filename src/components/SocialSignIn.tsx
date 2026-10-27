import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { accountsEnabled, signInWithProvider, type OAuthProvider, type SignedInUser } from '@/lib/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';
import { Notice, T } from './ui';

/**
 * "Continue with Apple" / "Continue with Google".
 * Hidden in release builds until Supabase is connected, so nobody sees a dead
 * button. In development it stays visible and explains what's missing.
 */
export function SocialSignIn({ onSignedIn }: { onSignedIn: (user: SignedInUser) => void }) {
  const { t } = useTheme();
  const [busy, setBusy] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!accountsEnabled && !__DEV__) return null;

  const go = async (provider: OAuthProvider) => {
    setError(null);
    if (!accountsEnabled) {
      setError('dev');
      return;
    }
    setBusy(provider);
    const res = await signInWithProvider(provider);
    setBusy(null);
    if (res.ok) onSignedIn(res.user);
    else if (!res.cancelled) setError(res.message);
  };

  const buttons: { id: OAuthProvider; label: string; icon: 'logo-apple' | 'logo-google'; bg: string; fg: string; border: string }[] = [
    { id: 'apple', label: 'Continue with Apple', icon: 'logo-apple', bg: t.text, fg: t.bg, border: 'transparent' },
    { id: 'google', label: 'Continue with Google', icon: 'logo-google', bg: t.surface, fg: t.text, border: t.line },
  ];

  return (
    <View style={{ gap: 10 }}>
      {buttons.map((b) => (
        <Pressable
          key={b.id}
          accessibilityRole="button"
          accessibilityLabel={b.label}
          disabled={!!busy}
          onPress={() => go(b.id)}
          style={({ pressed }) => ({
            minHeight: 52,
            borderRadius: radius.md,
            backgroundColor: b.bg,
            borderWidth: 1,
            borderColor: b.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          {busy === b.id ? <ActivityIndicator color={b.fg} /> : <Ionicons name={b.icon} size={20} color={b.fg} />}
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 15, color: b.fg }}>{b.label}</Text>
        </Pressable>
      ))}

      {error === 'dev' ? (
        <Notice tone="warn">
          <T variant="label">Developer note: accounts aren't connected yet.</T>
          <T variant="caption" tone="muted">
            Add your Supabase URL and anon key to .env and turn on the Apple and Google providers. Steps are in docs/auth-setup.md. Use email below for now.
          </T>
        </Notice>
      ) : error ? (
        <Notice tone="warn">
          <T variant="caption">{error}</T>
        </Notice>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: t.line }} />
        <T variant="caption" tone="faint">or use email</T>
        <View style={{ flex: 1, height: 1, backgroundColor: t.line }} />
      </View>
    </View>
  );
}
