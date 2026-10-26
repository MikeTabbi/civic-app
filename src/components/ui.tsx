import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, space } from '@/theme/tokens';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/* ---------- Layout ---------- */

export function Screen({
  children,
  scroll = true,
  padded = true,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTheme();
  const inner = [padded && { paddingHorizontal: space.xl }, { gap: 14, paddingBottom: 32 }, style];
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      {scroll ? (
        <ScrollView contentContainerStyle={[{ paddingTop: space.md }, inner]}>{children}</ScrollView>
      ) : (
        <View style={[{ flex: 1, paddingTop: space.md }, inner]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Row({ children, gap = space.sm, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

/* ---------- Type ---------- */

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'eyebrow';

const variantStyle: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.display, fontSize: 36, lineHeight: 38, letterSpacing: -1 },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, letterSpacing: -0.6 },
  heading: { fontFamily: fonts.display, fontSize: 18, lineHeight: 22 },
  body: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 21 },
  label: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 18 },
  caption: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 16 },
  eyebrow: { fontFamily: fonts.bodyHeavy, fontSize: 11, lineHeight: 14, letterSpacing: 0.9, textTransform: 'uppercase' },
};

export function T({
  variant = 'body',
  tone = 'text',
  style,
  ...rest
}: TextProps & { variant?: Variant; tone?: 'text' | 'muted' | 'faint' | 'accent' | 'onAccent' }) {
  const { t } = useTheme();
  const color = { text: t.text, muted: t.muted, faint: t.faint, accent: t.accentText, onAccent: t.onAccent }[tone];
  return <Text {...rest} style={[variantStyle[variant], { color }, style]} />;
}

/* ---------- Surfaces ---------- */

export function Card({
  children,
  tone = 'surface',
  style,
}: {
  children: ReactNode;
  tone?: 'surface' | 'sub' | 'tint';
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTheme();
  const bg = tone === 'surface' ? t.surface : tone === 'sub' ? t.sub : t.accentTint;
  const border = tone === 'tint' ? t.accent : t.line;
  return (
    <View style={[{ backgroundColor: bg, borderColor: border, borderWidth: 1, borderRadius: radius.lg, padding: space.lg, gap: space.sm }, style]}>
      {children}
    </View>
  );
}

export function Chip({ label, active = false }: { label: string; active?: boolean }) {
  const { t } = useTheme();
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderRadius: radius.pill,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: active ? t.text : t.sub,
      }}
    >
      <T variant="eyebrow" style={{ color: active ? t.bg : t.muted }}>
        {label}
      </T>
    </View>
  );
}

export function Segmented<V extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: V; label: string }[];
  value: V;
  onChange: (v: V) => void;
}) {
  const { t } = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: t.sub, borderRadius: radius.pill, padding: 4 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              minHeight: 40,
              borderRadius: radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? t.surface : 'transparent',
            }}
          >
            <T variant="label" tone={on ? 'text' : 'faint'}>
              {o.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- Actions ---------- */

export function Button({
  label,
  onPress,
  kind = 'primary',
  icon,
  style,
}: {
  label: string;
  onPress?: () => void;
  kind?: 'primary' | 'dark' | 'quiet';
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTheme();
  const bg = kind === 'primary' ? t.accent : kind === 'dark' ? t.text : t.sub;
  const fg = kind === 'primary' ? t.onAccent : kind === 'dark' ? t.bg : t.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 52,
          borderRadius: radius.md,
          backgroundColor: bg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space.sm,
          paddingHorizontal: space.lg,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 15, color: fg }}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  style,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={[{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.sub, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Ionicons name={icon} size={20} color={t.text} />
    </Pressable>
  );
}

/* ---------- Data bits ---------- */

export function ProgressBar({ value, color, track }: { value: number; color?: string; track?: string }) {
  const { t } = useTheme();
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: track ?? t.empty, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: 8, borderRadius: 4, backgroundColor: color ?? t.accent }} />
    </View>
  );
}

export function Avatar({ size = 44, ring, label }: { size?: number; ring?: string; label?: string }) {
  const { t } = useTheme();
  return (
    <View
      accessibilityLabel={label}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: t.avatar,
        borderWidth: ring ? 3 : 0,
        borderColor: ring,
      }}
    />
  );
}

/** Every fact in the app carries its source. */
export function SourceTag({ source }: { source: string }) {
  return (
    <T variant="caption" tone="faint">
      Source: {source}
    </T>
  );
}

export const styles = StyleSheet.create({
  fill: { flex: 1 },
});
