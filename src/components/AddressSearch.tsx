import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

import { searchAddresses, type AddressSuggestion } from '@/lib/addressSearch';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';
import { T } from './ui';

/**
 * Address field with a suggestion list that appears as you type, plus a
 * "Use my current location" row. Picking either one hands back coordinates,
 * which are matched to districts more reliably than typed text.
 */
export function AddressSearch({
  label,
  hint,
  value,
  onChangeText,
  onPick,
  onUseLocation,
  onSubmit,
  delawareOnly,
  locating = false,
}: {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (v: string) => void;
  onPick: (s: AddressSuggestion) => void;
  onUseLocation: () => void;
  onSubmit: () => void;
  delawareOnly: boolean;
  locating?: boolean;
}) {
  const { t } = useTheme();
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AddressSuggestion[]>([]);
  // Only text the person typed triggers a search (not a picked or located address).
  const [typed, setTyped] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  // Debounced search: wait 300 ms after typing stops.
  useEffect(() => {
    if (typed !== value || value.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = setTimeout(async () => {
      abort.current?.abort();
      abort.current = new AbortController();
      const list = await searchAddresses(value, { delawareOnly, signal: abort.current.signal });
      setResults(list);
      setLoading(false);
    }, 300);
    return () => clearTimeout(id);
  }, [value, delawareOnly, typed]);

  const open = focused && (typed === value || !value);

  const choose = (s: AddressSuggestion) => {
    setTyped(null);
    setResults([]);
    onChangeText(s.label);
    onPick(s);
  };

  return (
    <View style={{ gap: 6 }}>
      <T variant="label">{label}</T>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 52,
          borderRadius: radius.md,
          borderWidth: focused ? 2 : 1,
          borderColor: focused ? t.accent : t.line,
          backgroundColor: t.surface,
          paddingLeft: 14,
          paddingRight: 6,
          gap: 8,
        }}
      >
        <Ionicons name="search" size={18} color={t.faint} />
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={(v) => {
            setTyped(v);
            onChangeText(v);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onSubmitEditing={onSubmit}
          placeholder="Start typing your street address"
          placeholderTextColor={t.faint}
          autoComplete="street-address"
          autoCorrect={false}
          returnKeyType="search"
          style={{ flex: 1, minHeight: 48, color: t.text, fontFamily: fonts.bodyMedium, fontSize: 16 }}
        />
        {loading ? <ActivityIndicator color={t.faint} /> : null}
        {value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear address"
            hitSlop={8}
            onPress={() => {
              setTyped('');
              onChangeText('');
            }}
            style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="close-circle" size={20} color={t.faint} />
          </Pressable>
        ) : null}
      </View>

      {open ? (
        <View accessibilityRole="list" style={{ borderRadius: radius.md, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface, overflow: 'hidden' }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setTyped(null);
              setResults([]);
              onUseLocation();
            }}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: pressed ? t.sub : 'transparent' })}
          >
            {locating ? <ActivityIndicator color={t.accentText} /> : <Ionicons name="navigate" size={18} color={t.accentText} />}
            <T variant="label" tone="accent">Use my current location</T>
          </Pressable>
          {results.map((s) => (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              accessibilityLabel={s.label}
              onPress={() => choose(s)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                borderTopWidth: 1,
                borderTopColor: t.line,
                backgroundColor: pressed ? t.sub : 'transparent',
              })}
            >
              <Ionicons name="location-outline" size={18} color={t.faint} />
              <View style={{ flex: 1 }}>
                <T variant="label" numberOfLines={1}>{s.line1}</T>
                {s.line2 ? <T variant="caption" tone="faint" numberOfLines={1}>{s.line2}</T> : null}
              </View>
            </Pressable>
          ))}
          {!loading && value.trim().length >= 3 && results.length === 0 ? (
            <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: t.line }}>
              <T variant="caption" tone="faint">No matches yet. Keep typing, or add the city and ZIP.</T>
            </View>
          ) : null}
        </View>
      ) : hint ? (
        <T variant="caption" tone="faint">{hint}</T>
      ) : null}
    </View>
  );
}
