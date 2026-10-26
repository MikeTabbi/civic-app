import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Button, Screen, T } from '@/components/ui';
import { useOnboarding, type VotingLocation } from '@/state/OnboardingProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';

const CHOICES: { id: VotingLocation; title: string; sub: string }[] = [
  { id: 'campus', title: 'Campus', sub: 'Dover, DE' },
  { id: 'home', title: 'Home', sub: 'Any state' },
];

/** Onboarding step 2 of 3 from the v8 design: "Where do you vote?" */
export default function Onboarding() {
  const { t } = useTheme();
  const { complete } = useOnboarding();
  const [choice, setChoice] = useState<VotingLocation>('campus');
  const [address, setAddress] = useState('');

  return (
    <Screen scroll={false} style={{ gap: 18 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <T variant="heading">[App name]</T>
        <T variant="caption" tone="faint">Step 2 of 3</T>
      </View>

      <T variant="display" style={{ marginTop: 24 }}>
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
              onPress={() => setChoice(c.id)}
              style={{
                flex: 1,
                minHeight: 120,
                borderRadius: radius.lg,
                padding: 16,
                justifyContent: 'space-between',
                backgroundColor: on ? t.accent : t.surface,
                borderWidth: 1,
                borderColor: on ? t.accent : t.line,
              }}
            >
              <Ionicons name={c.id === 'campus' ? 'school' : 'home'} size={24} color={on ? t.onAccent : t.text} />
              <View>
                <T variant="heading" style={{ color: on ? t.onAccent : t.text }}>{c.title}</T>
                <T variant="caption" style={{ color: on ? t.onAccent : t.faint }}>{c.sub}</T>
              </View>
            </Pressable>
          );
        })}
      </View>

      <T variant="label" tone="accent" style={{ textDecorationLine: 'underline' }}>
        Not sure? Take the 30-second quiz
      </T>

      <View style={{ gap: 6 }}>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="Dorm or street address"
          placeholderTextColor={t.faint}
          autoComplete="street-address"
          style={{
            minHeight: 52,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: t.line,
            backgroundColor: t.surface,
            color: t.text,
            paddingHorizontal: 16,
            fontFamily: fonts.bodyMedium,
            fontSize: 15,
          }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="lock-closed" size={12} color={t.faint} />
          <T variant="caption" tone="faint">Never shown on your profile</T>
        </View>
      </View>

      <View style={{ flex: 1 }} />
      <Button label="Show me my ballot" onPress={() => complete(choice)} />
    </Screen>
  );
}
