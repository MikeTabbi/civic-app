import { Children, type ReactNode } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

export type CivicLevel = 'federal' | 'state' | 'local';

export function LevelGroup({
  level,
  count,
  label = `${level[0].toUpperCase()}${level.slice(1)}`,
  children,
  style,
}: {
  level: CivicLevel;
  count: number;
  label?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTheme();
  const palette = t.level[level];
  const rows = Children.toArray(children);
  return (
    <View style={[{ borderRadius: 22, padding: 14, backgroundColor: palette.tint }, style]}>
      <View style={{ minHeight: 32, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Text style={{ color: palette.ink, fontFamily: fonts.bodyHeavy, fontSize: 11, lineHeight: 14, letterSpacing: 1.32, textTransform: 'uppercase' }}>
          {label}
        </Text>
        <Text style={{ color: palette.ink, fontFamily: fonts.bodyHeavy, fontSize: 11, lineHeight: 14 }}>{count}</Text>
      </View>
      {rows.map((row, index) => (
        <View key={index}>
          {index > 0 ? <View style={{ height: 1, backgroundColor: palette.ink, opacity: 0.16 }} /> : null}
          {row}
        </View>
      ))}
    </View>
  );
}
