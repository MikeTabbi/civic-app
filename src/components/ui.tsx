import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type SwitchProps,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_SHORT_NAME } from '@/lib/brand';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, space } from '@/theme/tokens';
import { PressableScale } from './PressableScale';

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
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[{ paddingTop: space.md, flexGrow: 1 }, inner]}>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
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
  display: { fontFamily: fonts.display, fontSize: 36, lineHeight: 38, letterSpacing: -1.26 },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, letterSpacing: -0.98 },
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

/** A label pill. Pass `onPress` to make it a filter toggle. */
export function Chip({ label, active = false, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const { t } = useTheme();
  const text = (
    <T variant="eyebrow" style={{ color: active ? t.bg : t.muted }}>
      {label}
    </T>
  );
  const base: ViewStyle = { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 12, backgroundColor: active ? t.text : t.sub };
  if (!onPress) return <View style={[base, { paddingVertical: 6 }]}>{text}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [base, { minHeight: 36, justifyContent: 'center', opacity: pressed ? 0.85 : 1 }]}
    >
      {text}
    </Pressable>
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
  disabled = false,
  loading = false,
  accessibilityLabel,
}: {
  label: string;
  onPress?: () => void;
  kind?: 'primary' | 'dark' | 'quiet';
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
}) {
  const { t } = useTheme();
  const bg = kind === 'primary' ? t.primary.bg : kind === 'dark' ? t.text : t.sub;
  const fg = kind === 'primary' ? t.primary.fg : kind === 'dark' ? t.bg : t.text;
  const off = disabled || loading;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: off, busy: loading }}
      disabled={off}
      onPress={onPress}
      style={[
        {
          minHeight: 52,
          borderRadius: radius.md,
          backgroundColor: bg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space.sm,
          paddingHorizontal: space.lg,
          opacity: off ? 0.45 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 15, color: fg }}>{label}</Text>
    </PressableScale>
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

/** Initials for an avatar: first and last name, skipping nicknames, suffixes and middle initials. */
export function initialsOf(name: string) {
  const parts = name
    .replace(/"[^"]*"/g, '')
    .replace(/,/g, ' ')
    .split(/\s+/)
    .filter((p) => p && !/^(jr|sr|ii|iii|iv|ph\.?d)\.?$/i.test(p) && !/^[A-Z]\.?$/.test(p));
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function Avatar({ size = 44, ring, label, initials }: { size?: number; ring?: string; label?: string; initials?: string }) {
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
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {initials ? (
        <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: Math.round(size * 0.34), color: t.text }}>{initials}</Text>
      ) : null}
    </View>
  );
}

/** Every fact in the app carries its source. */
export function SourceTag({ source, color }: { source: string; color?: string }) {
  return (
    <T variant="caption" tone="faint" style={color ? { color } : undefined}>
      Source: {source}
    </T>
  );
}

/* ---------- Forms ---------- */

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  hint,
  ...rest
}: Omit<TextInputProps, 'style'> & { label: string; error?: string | null; hint?: string }) {
  const { t } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <T variant="label">{label}</T>
      <TextInput
        {...rest}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.faint}
        style={{
          minHeight: 52,
          borderRadius: radius.md,
          borderWidth: error ? 2 : 1,
          borderColor: error ? t.accent : t.line,
          backgroundColor: t.surface,
          color: t.text,
          paddingHorizontal: 16,
          fontFamily: fonts.bodyMedium,
          fontSize: 16,
        }}
      />
      {error ? (
        <T variant="caption" tone="accent">{error}</T>
      ) : hint ? (
        <T variant="caption" tone="faint">{hint}</T>
      ) : null}
    </View>
  );
}

export function StepHeader({ step, total = 3, onBack }: { step: number; total?: number; onBack?: () => void }) {
  const { t } = useTheme();
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
        {onBack ? <IconButton icon="chevron-back" label="Back" onPress={onBack} /> : <T variant="heading">{APP_SHORT_NAME}</T>}
        <T variant="caption" tone="faint">Step {step} of {total}</T>
      </View>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < step ? t.accent : t.empty }} />
        ))}
      </View>
    </View>
  );
}

export function ToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  const { t } = useTheme();
  // react-native-web colors the "on" thumb with activeThumbColor (default teal) and ignores thumbColor there.
  const webColors = Platform.OS === 'web' ? ({ activeThumbColor: t.text, activeTrackColor: t.accent } as Partial<SwitchProps>) : null;
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={title}
      onPress={() => onValueChange(!value)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}
    >
      <View style={{ flex: 1 }}>
        <T variant="label">{title}</T>
        {subtitle ? <T variant="caption" tone="faint">{subtitle}</T> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: t.empty, true: t.accent }}
        thumbColor={t.text}
        ios_backgroundColor={t.empty}
        {...webColors}
      />
    </Pressable>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'good'; children: ReactNode }) {
  const { t } = useTheme();
  const icon: IconName = tone === 'good' ? 'checkmark-circle' : tone === 'warn' ? 'alert-circle' : 'information-circle';
  const color = tone === 'good' ? t.done : tone === 'warn' ? t.accentText : t.faint;
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 12, borderRadius: radius.md, backgroundColor: tone === 'warn' ? t.accentTint : t.sub }}>
      <Ionicons name={icon} size={18} color={color} style={{ marginTop: 1 }} />
      <View style={{ flex: 1, gap: 4 }}>{children}</View>
    </View>
  );
}

export function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8}>
      <T variant="label" tone="accent" style={{ textDecorationLine: 'underline' }}>{label}</T>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  fill: { flex: 1 },
});
