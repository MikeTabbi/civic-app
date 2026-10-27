import { Pressable, View } from 'react-native';

import { T } from '@/components/ui';
import { SCHOOLS, type SchoolChoice } from '@/state/ProfileProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

/** The three school choices as radio rows. Used by onboarding and Edit profile. */
export function SchoolPicker({ value, onChange }: { value: SchoolChoice; onChange: (c: SchoolChoice) => void }) {
  const { t } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      {SCHOOLS.map((s) => {
        const on = s === value;
        return (
          <Pressable
            key={s}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChange(s)}
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
  );
}
